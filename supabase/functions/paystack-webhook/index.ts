
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifySignature(
  body: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );

  const hash = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body),
  );

  const expected = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (signature.length !== expected.length) return false;

  let difference = 0;

  for (let i = 0; i < expected.length; i++) {
    difference |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return difference === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Webhook environment variables are missing.");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const body = await req.text();

    if (!(await verifySignature(body, signature))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("Event ignored", { status: 200 });
    }

    const reference = event.data?.reference;

    if (
      typeof reference !== "string" ||
      !/^NOVA-[0-9a-f-]{36}$/i.test(reference)
    ) {
      return new Response("Invalid reference", { status: 400 });
    }

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select(
        "id, payment_status, paystack_reference, payment_amount_minor, payment_currency",
      )
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError);
      return new Response("Order lookup failed", { status: 500 });
    }

    if (!order) {
      console.error("No order found for reference:", reference);
      return new Response("Order not found", { status: 404 });
    }

    if (order.payment_status === "paid") {
      return new Response("Payment already processed", { status: 200 });
    }

    if (order.payment_status !== "pending") {
      return new Response("Order is not awaiting payment", { status: 200 });
    }

    const expectedAmount = Number(order.payment_amount_minor);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount < 1 ||
      order.payment_currency !== "GHS"
    ) {
      console.error("Invalid expected payment details:", reference);
      return new Response("Invalid order payment details", { status: 400 });
    }

    // Verify the transaction directly with Paystack.
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const verification = await paystackResponse.json();

    if (!paystackResponse.ok || !verification.status) {
      console.error("Paystack verification failed:", verification);
      return new Response("Unable to verify transaction", { status: 502 });
    }

    const transaction = verification.data;

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      transaction.currency !== order.payment_currency ||
      transaction.amount !== expectedAmount
    ) {
      console.error("Transaction details do not match order:", reference);
      return new Response("Payment verification failed", { status: 400 });
    }

    // Only update an order that is still pending.
    const { data: updatedOrder, error: updateError } = await adminClient
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
      })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Order update failed:", updateError);
      return new Response("Order update failed", { status: 500 });
    }

    if (!updatedOrder) {
      // Another request may have processed this payment already.
      const { data: latestOrder, error: latestError } = await adminClient
        .from("orders")
        .select("payment_status")
        .eq("id", order.id)
        .maybeSingle();

      if (latestError || latestOrder?.payment_status !== "paid") {
        return new Response("Unable to confirm payment update", {
          status: 500,
        });
      }
    }

    console.log("Payment successfully processed:", reference);

    return new Response("Payment processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});

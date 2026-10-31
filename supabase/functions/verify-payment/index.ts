
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecret) {
      return respond({ error: "Payment configuration is incomplete." }, 500);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return respond({ error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return respond({ error: "Invalid or expired session." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const reference = body?.reference;

    if (
      typeof reference !== "string" ||
      !/^NOVA-[0-9a-f-]{36}$/i.test(reference)
    ) {
      return respond({ error: "Invalid payment reference." }, 400);
    }

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select(
        "id, user_id, payment_status, paystack_reference, payment_amount_minor, payment_currency"
      )
      .eq("paystack_reference", reference)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return respond({ error: "Order not found." }, 404);
    }

    if (order.payment_status === "paid") {
      return respond({
        message: "Payment already verified.",
        paid: true,
        paymentStatus: "success",
        reference,
      });
    }

    if (order.payment_status !== "pending") {
      return respond({
        error: "Order is not awaiting payment.",
        paid: false,
        paymentStatus: order.payment_status,
      }, 409);
    }

    const expectedAmount = Number(order.payment_amount_minor);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount < 1 ||
      order.payment_currency !== "GHS"
    ) {
      return respond({
        error: "Payment details are missing. Please restart checkout.",
        paid: false,
        paymentStatus: "invalid",
      }, 400);
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verification = await paystackResponse.json();

    if (!paystackResponse.ok || !verification.status) {
      return respond({
        error: verification.message || "Unable to verify payment.",
        paid: false,
        paymentStatus: "verification_error",
      }, 502);
    }

    const transaction = verification.data;

    if (transaction.reference !== reference) {
      return respond({
        error: "Payment reference does not match.",
        paid: false,
        paymentStatus: "invalid",
      }, 400);
    }

    if (transaction.status !== "success") {
      return respond({
        message: "Payment has not been completed.",
        paid: false,
        paymentStatus: transaction.status || "pending",
        reference,
      });
    }

    if (
      transaction.currency !== "GHS" ||
      transaction.amount !== expectedAmount
    ) {
      return respond({
        error: "Payment amount or currency does not match.",
        paid: false,
        paymentStatus: "invalid",
      }, 400);
    }

    const { data: updatedOrder, error: updateError } = await adminClient
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
      })
      .eq("id", order.id)
      .eq("user_id", user.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Order payment update failed:", updateError);
      return respond({
        error:
          "Payment was received but the order update failed. Please contact support.",
        paid: false,
        paymentStatus: "update_error",
      }, 500);
    }

    if (!updatedOrder) {
      const { data: latestOrder } = await adminClient
        .from("orders")
        .select("payment_status")
        .eq("id", order.id)
        .maybeSingle();

      if (latestOrder?.payment_status !== "paid") {
        return respond({
          error: "Unable to confirm the order payment status.",
          paid: false,
          paymentStatus: "verification_error",
        }, 409);
      }
    }

    return respond({
      message: "Payment successfully verified.",
      paid: true,
      paymentStatus: "success",
      reference,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return respond({
      error: "An unexpected error occurred.",
      paid: false,
      paymentStatus: "verification_error",
    }, 500);
  }
});

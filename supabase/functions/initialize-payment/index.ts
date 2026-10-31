
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
    const exchangeRate = Number(Deno.env.get("USD_TO_GHS_RATE"));
    const siteUrl = Deno.env.get("SITE_URL");

    if (
      !paystackSecret ||
      !Number.isFinite(exchangeRate) ||
      exchangeRate <= 0 ||
      !siteUrl
    ) {
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
      return respond({ error: "Invalid order reference." }, 400);
    }

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select(
        "id, user_id, email, total, currency, payment_status, paystack_reference"
      )
      .eq("paystack_reference", reference)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return respond({ error: "Order not found." }, 404);
    }

    if (order.payment_status !== "pending") {
      return respond({ error: "This order is not awaiting payment." }, 409);
    }

    if (order.currency !== "USD") {
      return respond({ error: "Unexpected order currency." }, 400);
    }

    const usdTotal = Number(order.total);

    if (!Number.isFinite(usdTotal) || usdTotal <= 0) {
      return respond({ error: "Invalid order amount." }, 400);
    }

    const ghsAmount = Math.round(usdTotal * exchangeRate * 100);

    if (!Number.isSafeInteger(ghsAmount) || ghsAmount < 1) {
      return respond({ error: "Invalid payment amount." }, 400);
    }

    // Save the exact amount expected from Paystack before initialization.
    const { error: updateError } = await adminClient
      .from("orders")
      .update({
        payment_amount_minor: ghsAmount,
        payment_currency: "GHS",
        exchange_rate: exchangeRate,
      })
      .eq("id", order.id)
      .eq("payment_status", "pending");

    if (updateError) {
      console.error("Failed to save payment details:", updateError);
      return respond({ error: "Unable to prepare payment." }, 500);
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.email,
          amount: ghsAmount,
          currency: "GHS",
          reference: order.paystack_reference,
          callback_url: `${siteUrl}/payment/callback?reference=${encodeURIComponent(order.paystack_reference)}`,
          metadata: {
            order_id: order.id,
            user_id: user.id,
            original_usd_total: usdTotal,
            exchange_rate: exchangeRate,
          },
        }),
      }
    );

    const paymentData = await paystackResponse.json();

    if (!paystackResponse.ok || !paymentData.status) {
      console.error("Paystack initialization failed:", paymentData);
      return respond(
        { error: paymentData.message || "Unable to initialize payment." },
        502
      );
    }

    return respond({
      message: "Payment initialized.",
      authorization_url: paymentData.data.authorization_url,
      access_code: paymentData.data.access_code,
      reference: paymentData.data.reference,
      amount: ghsAmount / 100,
      currency: "GHS",
      exchange_rate: exchangeRate,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);
    return respond({ error: "An unexpected error occurred." }, 500);
  }
});

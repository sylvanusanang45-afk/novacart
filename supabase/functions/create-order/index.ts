
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(data: unknown, status = 200) {
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
    return response({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({ error: "Authentication required." }, 401);
    }

    // Verify the signed-in customer.
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return response({ error: "Invalid or expired session." }, 401);
    }

    // This client is used only inside the secure Edge Function.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      country,
      city,
      deliveryAddress,
      items,
    } = body;

    // Validate customer details.
    const customerFields = [
      fullName,
      email,
      phone,
      country,
      city,
      deliveryAddress,
    ];

    if (
      customerFields.some(
        (field) => typeof field !== "string" || !field.trim()
      )
    ) {
      return response({ error: "Complete all delivery details." }, 400);
    }

    if (
      fullName.length > 120 ||
      email.length > 254 ||
      phone.length > 40 ||
      country.length > 100 ||
      city.length > 100 ||
      deliveryAddress.length > 500
    ) {
      return response({ error: "One or more fields are too long." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return response({ error: "Enter a valid email address." }, 400);
    }

    // Validate cart items.
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return response({ error: "Your cart is empty or invalid." }, 400);
    }

    const seenIds = new Set<number>();

    for (const item of items) {
      const id = Number(item?.product_id);
      const quantity = Number(item?.quantity);

      if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99 ||
        seenIds.has(id)
      ) {
        return response({ error: "Invalid cart items." }, 400);
      }

      seenIds.add(id);
    }

    const productIds = [...seenIds];

    // Fetch trusted product details and prices from Supabase.
    const { data: products, error: productsError } = await adminClient
      .from("products")
      .select("id, name, image, price")
      .in("id", productIds);

    if (productsError) {
      console.error("Product lookup failed:", productsError);
      return response({ error: "Unable to verify your cart." }, 500);
    }

    if (!products || products.length !== productIds.length) {
      return response(
        { error: "One or more products are no longer available." },
        400
      );
    }

    const productMap = new Map(
      products.map((product) => [Number(product.id), product])
    );

    // Calculate totals in cents to avoid floating-point rounding errors.
    let subtotalCents = 0;

    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(Number(item.product_id));
      const quantity = Number(item.quantity);

      if (!product) {
        return response({ error: "A product could not be found." }, 400);
      }

      const unitPriceCents = Math.round(Number(product.price) * 100);

      if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
        return response({ error: "A product has an invalid price." }, 500);
      }

      const lineTotalCents = unitPriceCents * quantity;
      subtotalCents += lineTotalCents;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        unit_price: unitPriceCents / 100,
        quantity,
        line_total: lineTotalCents / 100,
      });
    }

    const shippingCents = 0;
    const totalCents = subtotalCents + shippingCents;
    const orderReference = `NOVA-${crypto.randomUUID()}`;

    // Create the order.
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim(),
        delivery_address: deliveryAddress.trim(),
        currency: "USD",
        subtotal: subtotalCents / 100,
        shipping: shippingCents / 100,
        total: totalCents / 100,
        status: "pending",
        payment_status: "pending",
        paystack_reference: orderReference,
      })
      .select("id, paystack_reference, total, currency")
      .single();

    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return response({ error: "Unable to create your order." }, 500);
    }

    // Save a snapshot of the products in the order.
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await adminClient
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);

      // Remove the incomplete order if its items could not be saved.
      await adminClient.from("orders").delete().eq("id", order.id);

      return response({ error: "Unable to save your order items." }, 500);
    }

    return response({
      message: "Order created successfully.",
      order: {
        id: order.id,
        reference: order.paystack_reference,
        total: order.total,
        currency: order.currency,
      },
    }, 201);
  } catch (error) {
    console.error("Create order error:", error);
    return response({ error: "An unexpected error occurred." }, 500);
  }
});

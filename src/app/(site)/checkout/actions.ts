"use server";

import { initializeTransaction, makeReference } from "@/lib/paystack/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Admin = ReturnType<typeof createAdminClient>;

type LineItem = {
  item_type: "variant" | "package" | "package_variety" | "extra_variety" | "treat";
  product_id?: string | null;
  variant_id?: string | null;
  treat_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
};

type Priced = {
  total: number;
  items: LineItem[];
  order_type: "juice" | "package";
  event_date: string | null;
  guests: number | null;
  package_id: string | null;
  is_late_order: boolean;
};

class UserError extends Error {
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

const SIZE_LABEL: Record<string, string> = {
  "250ml": "250ml",
  "350ml": "350ml",
  "500ml": "500ml",
  gallon: "Gallon",
  single: "Each",
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const todayIso = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (iso: string) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayIso()}T00:00:00Z`)) / 86400000);

async function loadSettings(admin: Admin) {
  const { data, error } = await admin.from("settings").select("key, value");
  if (error) throw error;
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    extraVarietyPrice: Number(s.extra_variety_price ?? 150),
    treatPricePerPerson: Number(s.treat_price_per_person ?? 15),
    treatPicks: Number(s.treat_picks ?? 3),
    minNoticeDays: Number(s.min_notice_days ?? 14),
  };
}

async function priceJuice(
  admin: Admin,
  data: Extract<CheckoutInput, { kind: "juice" }>
): Promise<Priced> {
  if (data.needed_date && data.needed_date < todayIso()) {
    throw new UserError("Please check the highlighted fields.", {
      needed_date: "Date cannot be in the past",
    });
  }

  // Merge duplicate lines
  const qtyById = new Map<string, number>();
  for (const line of data.items) {
    qtyById.set(line.variantId, (qtyById.get(line.variantId) ?? 0) + line.quantity);
  }

  const { data: variants, error } = await admin
    .from("product_variants")
    .select("id, size, price, is_active, products!inner(id, name, is_active, available_in_shop)")
    .in("id", [...qtyById.keys()]);
  if (error) throw error;

  const byId = new Map((variants ?? []).map((v) => [v.id, v]));
  const items: LineItem[] = [];
  let total = 0;

  for (const [variantId, quantity] of qtyById) {
    const v = byId.get(variantId);
    const p = v ? (Array.isArray(v.products) ? v.products[0] : v.products) : null;
    if (!v || !p || !v.is_active || !p.is_active || !p.available_in_shop) {
      throw new UserError(
        "An item in your cart is no longer available. Please remove it and try again."
      );
    }
    const price = Number(v.price);
    total += price * quantity;
    items.push({
      item_type: "variant",
      product_id: p.id,
      variant_id: v.id,
      description: `${p.name} (${SIZE_LABEL[v.size] ?? v.size})`,
      quantity,
      unit_price: price,
    });
  }

  return {
    total: round2(total),
    items,
    order_type: "juice",
    event_date: data.needed_date || null,
    guests: null,
    package_id: null,
    is_late_order: false,
  };
}

async function pricePackage(
  admin: Admin,
  data: Extract<CheckoutInput, { kind: "package" }>
): Promise<Priced> {
  if (data.eventDate < todayIso()) {
    throw new UserError(
      "Your event date is in the past. Please go back to the packages page and choose a new date."
    );
  }

  const settings = await loadSettings(admin);

  const { data: tier } = await admin
    .from("packages")
    .select("id, guests, varieties, price, is_active")
    .eq("id", data.packageId)
    .maybeSingle();
  if (!tier || !tier.is_active) {
    throw new UserError("That package is no longer available. Please rebuild your package.");
  }

  const varietyIds = [...new Set(data.varietyIds)];
  const { data: products } = await admin
    .from("products")
    .select("id, name, is_active, available_in_packages")
    .in("id", varietyIds);

  const productById = new Map(
    (products ?? []).filter((p) => p.is_active && p.available_in_packages).map((p) => [p.id, p])
  );
  if (productById.size !== varietyIds.length) {
    throw new UserError(
      "One of your varieties is no longer available. Please rebuild your package."
    );
  }
  if (varietyIds.length < tier.varieties) {
    throw new UserError(`Please choose at least ${tier.varieties} varieties.`);
  }

  const extra = varietyIds.length - tier.varieties;
  const items: LineItem[] = [
    {
      item_type: "package",
      description: `Juice package: ${tier.guests} guests, ${tier.varieties} varieties`,
      quantity: 1,
      unit_price: Number(tier.price),
    },
  ];

  for (const id of varietyIds) {
    const p = productById.get(id)!;
    items.push({
      item_type: "package_variety",
      product_id: p.id,
      description: p.name,
      quantity: 1,
      unit_price: 0,
    });
  }

  if (extra > 0) {
    items.push({
      item_type: "extra_variety",
      description: "Extra variety",
      quantity: extra,
      unit_price: settings.extraVarietyPrice,
    });
  }

  let treatsTotal = 0;
  if (data.withTreats) {
    const treatIds = [...new Set(data.treatIds)];
    if (treatIds.length !== settings.treatPicks) {
      throw new UserError(`Please pick exactly ${settings.treatPicks} treats.`);
    }
    const { data: treats } = await admin
      .from("treats")
      .select("id, name, is_active")
      .in("id", treatIds);
    const validTreats = (treats ?? []).filter((t) => t.is_active);
    if (validTreats.length !== treatIds.length) {
      throw new UserError("One of your treats is no longer available. Please rebuild your package.");
    }
    treatsTotal = tier.guests * settings.treatPricePerPerson;
    items.push({
      item_type: "treat",
      description: `Local treats (${validTreats.map((t) => t.name).join(", ")}) for ${tier.guests} guests`,
      quantity: tier.guests,
      unit_price: settings.treatPricePerPerson,
    });
  }

  const total = Number(tier.price) + extra * settings.extraVarietyPrice + treatsTotal;

  return {
    total: round2(total),
    items,
    order_type: "package",
    event_date: data.eventDate,
    guests: tier.guests,
    package_id: tier.id,
    is_late_order: daysFromToday(data.eventDate) < settings.minNoticeDays,
  };
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  if (data.website) return { ok: false, error: "Something went wrong. Please try again." };

  if (data.kind === "juice" && data.fulfilment === "delivery" && !data.delivery_address) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: { delivery_address: "Enter your delivery address" },
    };
  }
  if (data.kind === "package" && !data.delivery_address) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: { delivery_address: "Enter the event venue or address" },
    };
  }

  const admin = createAdminClient();

  let priced: Priced;
  let termsVersion: number;
  try {
    const { data: terms, error: termsError } = await admin
      .from("terms")
      .select("version")
      .eq("is_current", true)
      .single();
    if (termsError || !terms) throw termsError ?? new Error("No current terms");
    termsVersion = terms.version;

    priced = data.kind === "juice" ? await priceJuice(admin, data) : await pricePackage(admin, data);
  } catch (err) {
    if (err instanceof UserError) {
      return { ok: false, error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("createOrder: pricing failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reference = makeReference("ORD");
  const email = data.email.toLowerCase();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      order_type: priced.order_type,
      customer_name: data.customer_name,
      email,
      phone: data.phone,
      fulfilment: data.kind === "package" ? "delivery" : data.fulfilment,
      event_date: priced.event_date,
      delivery_address: data.delivery_address || null,
      guests: priced.guests,
      package_id: priced.package_id,
      notes: data.notes || null,
      total: priced.total,
      is_late_order: priced.is_late_order,
      paystack_reference: reference,
      terms_version: termsVersion,
    })
    .select("id, order_no")
    .single();

  if (orderError || !order) {
    console.error("createOrder: order insert failed", orderError);
    return { ok: false, error: "We could not create your order. Please try again." };
  }

  async function rollback() {
    await admin.from("payments").delete().eq("reference", reference);
    await admin.from("orders").delete().eq("id", order!.id);
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(priced.items.map((item) => ({ order_id: order.id, ...item })));
  if (itemsError) {
    console.error("createOrder: items insert failed", itemsError);
    await rollback();
    return { ok: false, error: "We could not create your order. Please try again." };
  }

  const { error: paymentError } = await admin.from("payments").insert({
    order_id: order.id,
    reference,
    amount: priced.total,
    status: "pending",
  });
  if (paymentError) {
    console.error("createOrder: payment insert failed", paymentError);
    await rollback();
    return { ok: false, error: "We could not create your order. Please try again." };
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const init = await initializeTransaction({
      email,
      amountGhs: priced.total,
      reference,
      callbackUrl: `${siteUrl}/checkout/success`,
      metadata: { order_id: order.id, order_no: Number(order.order_no), type: priced.order_type },
    });
    return { ok: true, url: init.authorization_url };
  } catch (err) {
    console.error("createOrder: paystack initialize failed", err);
    await rollback();
    return { ok: false, error: "We could not start the payment. Please try again." };
  }
}

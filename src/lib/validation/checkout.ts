import { z } from "zod";

const customer = {
  customer_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  fulfilment: z.enum(["pickup", "delivery"]),
  delivery_address: z.string().trim().max(300),
  needed_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Enter a valid date"),
  notes: z.string().trim().max(1000),
  accepted_terms: z.boolean().refine((v) => v === true, "You must accept the terms to continue"),
  website: z.string().max(200).optional(), // honeypot
};

export const juiceCheckoutSchema = z.object({
  kind: z.literal("juice"),
  ...customer,
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(200),
      })
    )
    .min(1)
    .max(60),
});

export const packageCheckoutSchema = z.object({
  kind: z.literal("package"),
  ...customer,
  packageId: z.string().uuid(),
  varietyIds: z.array(z.string().uuid()).min(1).max(40),
  withTreats: z.boolean(),
  treatIds: z.array(z.string().uuid()).max(20),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose your event date"),
});

export const checkoutSchema = z.discriminatedUnion("kind", [
  juiceCheckoutSchema,
  packageCheckoutSchema,
]);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

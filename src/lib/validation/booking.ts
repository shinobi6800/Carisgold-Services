import { z } from "zod";

export const SERVICE_TYPES = [
  { value: "event_management", label: "Event management", hint: "Full planning and coordination" },
  { value: "decor", label: "Decor and styling", hint: "Themed setup and branding" },
  { value: "event_management_and_decor", label: "Both", hint: "Planning, coordination and decor" },
] as const;

export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Corporate event",
  "Naming ceremony",
  "Funeral or memorial",
  "Graduation",
  "Baby shower",
  "Anniversary",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Under GHS 5,000",
  "GHS 5,000 to 10,000",
  "GHS 10,000 to 25,000",
  "GHS 25,000 to 50,000",
  "Above GHS 50,000",
  "Not sure yet",
] as const;

export const bookingSchema = z.object({
  service_type: z.enum(["event_management", "decor", "event_management_and_decor"]),
  event_type: z.enum(EVENT_TYPES),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose your event date"),
  guests: z.number().int().min(1, "Enter a valid number").max(100000).nullable(),
  venue: z.string().trim().max(200),
  budget_range: z.string().trim().max(60),
  message: z.string().trim().max(2000),
  customer_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  accepted_terms: z.boolean().refine((v) => v === true, "You must accept the terms to continue"),
  website: z.string().max(200).optional(), // honeypot: real people leave this empty
});

export type BookingInput = z.infer<typeof bookingSchema>;

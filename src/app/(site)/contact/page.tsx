import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with CarisGold Events for event planning, decor and Natures Burst juice orders.",
};

export default function ContactPage() {
  const details = [
    site.phone && {
      label: "Phone",
      value: site.phone,
      href: `tel:${site.phone.replace(/\s+/g, "")}`,
    },
    site.email && { label: "Email", value: site.email, href: `mailto:${site.email}` },
    site.address && { label: "Location", value: site.address, href: null },
    {
      label: "Instagram",
      value: `@${site.instagram}`,
      href: `https://instagram.com/${site.instagram}`,
    },
  ].filter(Boolean) as { label: string; value: string; href: string | null }[];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 md:pt-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-primary md:text-5xl">Contact</h1>
        <p className="mt-3 text-muted-foreground">
          Planning an event or placing a juice order? Reach out and we will get back to you.
        </p>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-12">
        <dl className="divide-y border-y md:col-span-7">
          {details.map((d) => (
            <div key={d.label} className="flex items-baseline justify-between gap-6 py-5">
              <dt className="text-sm uppercase tracking-wider text-muted-foreground">{d.label}</dt>
              <dd className="text-right font-display text-lg text-primary">
                {d.href ? (
                  <a
                    href={d.href}
                    target={d.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {d.value}
                  </a>
                ) : (
                  d.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-4 rounded-2xl bg-secondary p-8 md:col-span-5">
          <h2 className="font-display text-2xl font-semibold text-primary">Ready to book?</h2>
          <p className="text-sm text-muted-foreground">
            Send us the date, venue and guest count and we will prepare a quote.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/book" className={cn(buttonVariants())}>
              Request a quote
            </Link>
            <Link href="/shop" className={cn(buttonVariants({ variant: "outline" }))}>
              Order juice
            </Link>
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

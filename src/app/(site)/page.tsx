import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

// Photos: put files in /public and list them here.
const HERO_IMAGE = "/hero.jpeg" as string | null;
const ABOUT_IMAGE = null as string | null; // e.g. "/about.jpeg"
const GALLERY: string[] = []; // e.g. ["/gallery/1.jpg", "/gallery/2.jpg", "/gallery/3.jpg"]

const whatsappHref = site.whatsapp ? `https://wa.me/${site.whatsapp}` : null;

const stats = [
  { value: "3", label: "Services under one roof" },
  { value: "50 to 500", label: "Guests served with juice packages" },
  { value: "38", label: "Drinks on the menu" },
];

const services = [
  {
    no: "01",
    title: "Event management",
    text: "Weddings, birthdays, corporate and family events, planned and run from the first call to the last guest.",
    href: "/book",
    cta: "Request a quote",
  },
  {
    no: "02",
    title: "Decor and styling",
    text: "Themed setups and custom branding, designed around your venue and your guest list.",
    href: "/book",
    cta: "Book decor",
  },
  {
    no: "03",
    title: "Natures Burst juice",
    text: "Fresh fruit juices, smoothies and local drinks, by the bottle or gallon for your home or office.",
    href: "/shop",
    cta: "Shop juice",
  },
  {
    no: "04",
    title: "Event drink service",
    text: "A juice station for your guests with an attendant, cups, dispensers and setup included.",
    href: "/packages",
    cta: "Build a package",
  },
];

const packageNotes = [
  "Attendant, disposable cups, dispensers and setup included",
  `Extra variety is ${formatGHS(150)} each`,
  "Order at least two clear weeks before your event",
  "Transport and taxes are quoted separately",
];

async function PackagesTable() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("id, guests, varieties, price")
    .order("guests");

  if (!packages || packages.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-secondary text-primary">
            <th className="px-5 py-3.5 font-medium">Guests</th>
            <th className="px-5 py-3.5 font-medium">Varieties</th>
            <th className="px-5 py-3.5 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-5 py-3.5 font-medium">{p.guests} guests</td>
              <td className="px-5 py-3.5 text-muted-foreground">{p.varieties} varieties</td>
              <td className="px-5 py-3.5 text-right font-display text-lg text-primary">
                {formatGHS(Number(p.price))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PackagesSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl bg-card p-5">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        {HERO_IMAGE && (
          <Image
            src={HERO_IMAGE}
            alt="CarisGold Events"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
        )}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(90deg, color-mix(in oklab, #1c1215 92%, transparent) 0%, color-mix(in oklab, #1c1215 72%, transparent) 50%, color-mix(in oklab, #1c1215 35%, transparent) 100%)",
          }}
        />
        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-4 py-20 md:min-h-[680px] md:py-28">
          <p className="text-sm font-medium tracking-wide text-[var(--brand-orange)]">
            Event planning · Decor · Fresh juice
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Events worth remembering.{" "}
            <em className="font-medium text-[var(--brand-orange)]">Juice worth ordering.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
            CarisGold plans and styles your event, then serves it with Natures Burst fruit juice,
            local drinks and treats, anywhere in Ghana.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/book"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[var(--brand-orange)] text-[#2a1519] hover:bg-[var(--brand-orange)]/90"
              )}
            >
              Book an event
            </Link>
            <Link
              href="/packages"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              See juice packages
            </Link>
          </div>
        </div>
        <div className="bg-brand-gradient h-1 w-full" />
      </section>

      {/* Who we are */}
      <section className="mx-auto mt-20 grid max-w-6xl items-center gap-12 px-4 md:mt-28 md:grid-cols-2 md:gap-16">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-secondary md:max-w-none">
          {ABOUT_IMAGE ? (
            <Image
              src={ABOUT_IMAGE}
              alt="The CarisGold team at work"
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Image
                src="/logo.jpg"
                alt=""
                width={120}
                height={120}
                className="size-28 rounded-full opacity-60"
              />
            </div>
          )}
          <div className="bg-brand-gradient absolute inset-x-0 bottom-0 h-1.5" />
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-magenta)]">
            Who we are
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-primary md:text-4xl">
            One team for the planning, the decor and the drinks.
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            CarisGold Events plans, styles and serves occasions across Ghana. We take care of the
            organising and the decor, and Natures Burst, our fruit juice brand, keeps your guests
            refreshed with fresh juices, local drinks and treats.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Tell us your date, venue and guest count and we send you a clear quote. Pay online to
            confirm your date, and we handle the rest.
          </p>

          <dl className="mt-9 grid grid-cols-3 gap-4 border-t pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl text-primary md:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>

          <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "mt-9")}>
            Get in touch
          </Link>
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto mt-24 max-w-6xl px-4 md:mt-32">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-magenta)]">
            What we do
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            Everything your event needs, under one name.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <article
              key={s.no}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--brand-orange)] hover:shadow-lg"
            >
              <span className="font-display text-4xl text-[var(--brand-orange)]">{s.no}</span>
              <h3 className="mt-4 font-display text-xl font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              <Link
                href={s.href}
                className="mt-5 text-sm font-medium text-primary underline underline-offset-4 group-hover:text-[var(--brand-magenta)]"
              >
                {s.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="mt-24 bg-primary text-primary-foreground md:mt-32">
        <div className="bg-brand-gradient h-1 w-full" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-orange)]">
              Juice packages
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Simple packages, priced for every event size.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-primary-foreground/85">
              {packageNotes.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <span className="bg-brand-gradient mt-2 h-0.5 w-4 shrink-0 rounded-full" />
                  {note}
                </li>
              ))}
            </ul>
            <Link
              href="/packages"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 bg-[var(--brand-orange)] text-[#2a1519] hover:bg-[var(--brand-orange)]/90"
              )}
            >
              Build your package
            </Link>
          </div>

          <div className="md:col-span-7">
            <Suspense fallback={<PackagesSkeleton />}>
              <PackagesTable />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Gallery (shows once you add photos to GALLERY above) */}
      {GALLERY.length > 0 && (
        <section className="mx-auto mt-24 max-w-6xl px-4 md:mt-32">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-magenta)]">
              On the job
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary md:text-4xl">
              Real events, real moments.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {GALLERY.map((src, i) => (
              <div
                key={src}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary",
                  i === 0 && "col-span-2 md:col-span-2 md:row-span-2 md:aspect-auto"
                )}
              >
                <Image
                  src={src}
                  alt="CarisGold event"
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing call to action */}
      <section className="mt-24 bg-secondary md:mt-32">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-magenta)]">
            Let&rsquo;s talk
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary md:text-5xl">
            Ready to plan your event?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us your date, venue and guest count and we will send a tailored quote.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/book" className={cn(buttonVariants({ size: "lg" }))}>
              Request a quote
            </Link>
            <Link href="/shop" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Order juice
            </Link>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Message on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

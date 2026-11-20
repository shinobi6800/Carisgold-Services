import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

async function Year() {
  "use cache";
  return new Date().getFullYear();
}

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="bg-brand-gradient h-1 w-full" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Caris Gold logo"
              width={56}
              height={56}
              className="size-14 rounded-full"
            />
            <p className="font-display text-2xl font-semibold">CarisGold Events</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/70">{site.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-orange)]">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-primary-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/book" className="hover:text-primary-foreground">
                Book an Event
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-orange)]">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            {site.phone && <li>{site.phone}</li>}
            {site.email && <li>{site.email}</li>}
            {site.address && <li>{site.address}</li>}
            <li>
              <a
                href={`https://instagram.com/${site.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-foreground"
              >
                Instagram @{site.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © <Year /> {site.name}. Natures Burst Fruit Juice is a product of Caris Gold Services.
      </div>
    </footer>
  );
}

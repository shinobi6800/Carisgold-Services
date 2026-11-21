type NavItem = { href: string; label: string };

export const site: {
  name: string;
  tagline: string;
  description: string;
  instagram: string;
  phone: string;
  whatsapp: string; // digits only with country code, e.g. 233201234567
  email: string;
  address: string;
  nav: NavItem[];
} = {
  name: "CarisGold Events",
  tagline: "Event planning, decor and Natures Burst fruit juice",
  description:
    "Event management, decor and fresh fruit juice for weddings, birthdays, corporate events and more in Ghana.",
  instagram: "carisgoldevents",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  nav: [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/packages", label: "Event Packages" },
    { href: "/contact", label: "Contact" },
  ],
};

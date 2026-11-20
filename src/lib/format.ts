export function formatGHS(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(amount);
}

const TIME_ZONE = "Africa/Accra";

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Turns 0241234567 into https://wa.me/233241234567
export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `233${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

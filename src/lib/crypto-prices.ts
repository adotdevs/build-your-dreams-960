import type { CryptoPrice } from "@/hooks/useCryptoPrices";

export const getCryptoPriceUsd = (crypto?: CryptoPrice | null) => {
  if (!crypto) return 0;
  return crypto.current_price_usd ?? crypto.current_price ?? 0;
};

export const getCryptoPriceEur = (crypto?: CryptoPrice | null) => {
  if (!crypto) return 0;
  if (typeof crypto.current_price_eur === "number") return crypto.current_price_eur;
  const usd = getCryptoPriceUsd(crypto);
  return typeof crypto.usd_to_eur === "number" ? usd * crypto.usd_to_eur : usd;
};

export const formatFiat = (value: number, currency: "EUR" | "USD" = "EUR") => {
  return new Intl.NumberFormat(currency === "EUR" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
};
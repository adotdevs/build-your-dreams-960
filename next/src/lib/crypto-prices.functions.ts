export async function getCryptoPrices() {
  const response = await fetch("/api/crypto-prices");
  if (!response.ok) throw new Error("Unable to load crypto prices");
  return response.json();
}

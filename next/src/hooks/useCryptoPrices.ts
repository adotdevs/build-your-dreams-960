import { useState, useEffect } from "react";
import { getCryptoPrices } from "@/lib/crypto-prices.functions";


export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price_usd?: number;
  current_price_eur?: number;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  usd_to_eur?: number;
}

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await getCryptoPrices();

        
        if (Array.isArray(data)) {
          setPrices(data);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching crypto prices:", err);
        setError("Impossible de charger les prix. Veuillez réessayer.");
        // Keep existing prices if we have them (stale is better than nothing)
        if (prices.length === 0) {
          // Only use fallback if we have absolutely nothing
          setPrices([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return { prices, isLoading, error };
};

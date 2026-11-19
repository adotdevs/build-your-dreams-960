import { NextResponse } from "next/server";
import { getCryptoPrices } from "@/server/crypto-prices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCryptoPrices();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load prices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

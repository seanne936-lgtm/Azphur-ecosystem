import { NextResponse } from "next/server";

const FALLBACK_PHP_TO_EUR = 1 / 72.73;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=PHP&to=EUR",
      { cache: "no-store" },
    );

    const data = (await response.json()) as { rates?: { EUR?: number } };
    const rate = Number(data.rates?.EUR);

    if (!response.ok || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(
        "Exchange-rate provider returned an invalid PHP/EUR rate.",
      );
    }

    return NextResponse.json({
      rate,
      source: "live",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PHP/EUR exchange rate fetch failed:", error);

    return NextResponse.json({
      rate: FALLBACK_PHP_TO_EUR,
      source: "fallback",
      updated_at: null,
    });
  }
}

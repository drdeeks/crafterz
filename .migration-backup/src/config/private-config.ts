import "server-only";
import { z } from "zod";

const privateConfigSchema = z.object({
  neynarApiKey: z
    .string()
    .min(1, "NEYNAR_API_KEY environment variable is required"),
  coingeckoApiKey: z.string(),
});

export const privateConfig = privateConfigSchema.parse({
  neynarApiKey: process.env.NEYNAR_API_KEY || "",
  coingeckoApiKey:
    // demo coingecko key, not sensitive
    process.env.COINGECKO_API_KEY || "CG-UviYfmkExfr86X5JFTZfaVbb",
});

import type { AppSettings } from "@/config/types";

export type PublicConfig = AppSettings & {
  homeUrl: string;
  splashImageUrl: string;
  iconUrl: string;
};

export const publicConfig: PublicConfig = {
  name: "CrafterZ",
  shortName: "CrafterZ",
  subtitle: "Craft, discover MegaMinds, and mint on-chain.",
  tagline: "Alchemy meets Farcaster.",
  description:
    "Combine elemental ingredients to discover new items, earn points, and mint MegaMind NFTs on-chain.",
  shortDescription: "Farcaster alchemy game with on-chain rewards.",
  shareButtonTitle: "Play CrafterZ",
  primaryCategory: "games",
  tags: ["alchemy", "crafting", "farcaster", "web3", "nft"],
  splashBackgroundColor: "#09090b",
  requiredChains: ["eip155:8453", "eip155:1"],
  homeUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  splashImageUrl:
    "https://neynar-public.s3.us-east-1.amazonaws.com/templates/crafterz-splash.png",
  iconUrl:
    "https://neynar-public.s3.us-east-1.amazonaws.com/templates/crafterz-icon.png",
};

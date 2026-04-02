import type { TierLevel } from "@/lib/types";

export type TierCategory =
  | "faang"
  | "hft_quant"
  | "big_tech"
  | "top_ai"
  | "top_fintech"
  | "web3"
  | "strong_startups";

export const TIER_CATEGORY_LABELS: Record<TierCategory, string> = {
  faang: "FAANG",
  hft_quant: "HFT / Quant",
  big_tech: "Big Tech",
  top_ai: "Top AI",
  top_fintech: "Top Fintech",
  web3: "Web3 / Crypto",
  strong_startups: "Strong Startups",
};

// Default tier mapping — can be overridden by user settings
export const DEFAULT_TIER_MAP: Record<TierCategory, TierLevel> = {
  faang: 1,
  hft_quant: 1,
  top_ai: 1,
  big_tech: 2,
  top_fintech: 2,
  web3: 2,
  strong_startups: 2,
};

interface Company {
  name: string;
  aliases?: string[];
  category: TierCategory;
}

const COMPANIES: Company[] = [
  // ─── FAANG ───────────────────────────────────────────────────────────────
  { name: "meta", aliases: ["facebook"], category: "faang" },
  { name: "apple", category: "faang" },
  { name: "amazon", aliases: ["aws"], category: "faang" },
  { name: "netflix", category: "faang" },
  { name: "google", aliases: ["alphabet", "deepmind", "google deepmind", "waymo"], category: "faang" },

  // ─── HFT / QUANT ─────────────────────────────────────────────────────────
  { name: "jane street", category: "hft_quant" },
  { name: "citadel", aliases: ["citadel securities", "citadel llc"], category: "hft_quant" },
  { name: "two sigma", category: "hft_quant" },
  { name: "de shaw", aliases: ["d.e. shaw", "d. e. shaw"], category: "hft_quant" },
  { name: "jump trading", category: "hft_quant" },
  { name: "virtu", aliases: ["virtu financial"], category: "hft_quant" },
  { name: "hudson river trading", aliases: ["hrt"], category: "hft_quant" },
  { name: "optiver", category: "hft_quant" },
  { name: "imc trading", aliases: ["imc"], category: "hft_quant" },
  { name: "akuna capital", category: "hft_quant" },
  { name: "susquehanna", aliases: ["sig", "susquehanna international group"], category: "hft_quant" },
  { name: "tower research", aliases: ["tower research capital"], category: "hft_quant" },
  { name: "renaissance technologies", aliases: ["renaissance", "rentec"], category: "hft_quant" },
  { name: "point72", aliases: ["point 72"], category: "hft_quant" },
  { name: "millennium management", aliases: ["millennium"], category: "hft_quant" },
  { name: "man group", aliases: ["man ahl", "man numeric"], category: "hft_quant" },
  { name: "winton", aliases: ["winton group"], category: "hft_quant" },
  { name: "worldquant", category: "hft_quant" },
  { name: "drw", aliases: ["drw trading", "cumberland drw"], category: "hft_quant" },
  { name: "xtx markets", category: "hft_quant" },
  { name: "flow traders", category: "hft_quant" },
  { name: "five rings", aliases: ["five rings capital"], category: "hft_quant" },
  { name: "belvedere trading", category: "hft_quant" },
  { name: "tibra", category: "hft_quant" },
  { name: "squarepoint", aliases: ["squarepoint capital"], category: "hft_quant" },
  { name: "marshall wace", category: "hft_quant" },
  { name: "quantitative brokers", category: "hft_quant" },
  { name: "g-research", aliases: ["g research"], category: "hft_quant" },
  { name: "qrt", aliases: ["qube research", "qube research and technologies"], category: "hft_quant" },
  { name: "state street", category: "hft_quant" },
  { name: "blackrock", category: "hft_quant" },
  { name: "alyssa partners", category: "hft_quant" },
  { name: "cubist", aliases: ["cubist systematic strategies"], category: "hft_quant" },

  // ─── TOP AI ──────────────────────────────────────────────────────────────
  { name: "openai", category: "top_ai" },
  { name: "anthropic", category: "top_ai" },
  { name: "xai", aliases: ["x.ai"], category: "top_ai" },
  { name: "mistral", aliases: ["mistral ai"], category: "top_ai" },
  { name: "perplexity", aliases: ["perplexity ai"], category: "top_ai" },
  { name: "hugging face", aliases: ["huggingface"], category: "top_ai" },
  { name: "scale ai", aliases: ["scaleai"], category: "top_ai" },
  { name: "cohere", category: "top_ai" },
  { name: "inflection", aliases: ["inflection ai"], category: "top_ai" },
  { name: "groq", category: "top_ai" },
  { name: "glean", category: "top_ai" },
  { name: "anysphere", aliases: ["cursor"], category: "top_ai" },

  // ─── BIG TECH ─────────────────────────────────────────────────────────────
  { name: "microsoft", aliases: ["azure", "github"], category: "big_tech" },
  { name: "nvidia", category: "big_tech" },
  { name: "tesla", category: "big_tech" },
  { name: "salesforce", category: "big_tech" },
  { name: "oracle", category: "big_tech" },
  { name: "ibm", category: "big_tech" },
  { name: "intel", category: "big_tech" },
  { name: "adobe", category: "big_tech" },
  { name: "uber", category: "big_tech" },
  { name: "airbnb", category: "big_tech" },
  { name: "spotify", category: "big_tech" },
  { name: "twitter", aliases: ["x corp"], category: "big_tech" },
  { name: "snap", category: "big_tech" },
  { name: "shopify", category: "big_tech" },
  { name: "paypal", category: "big_tech" },
  { name: "block", aliases: ["square"], category: "big_tech" },
  { name: "intuit", category: "big_tech" },
  { name: "visa", category: "big_tech" },
  { name: "mastercard", category: "big_tech" },
  { name: "palantir", category: "big_tech" },

  // ─── TOP FINTECH ──────────────────────────────────────────────────────────
  { name: "stripe", category: "top_fintech" },
  { name: "revolut", category: "top_fintech" },
  { name: "monzo", category: "top_fintech" },
  { name: "wise", aliases: ["transferwise"], category: "top_fintech" },
  { name: "nubank", category: "top_fintech" },
  { name: "chime", category: "top_fintech" },
  { name: "n26", category: "top_fintech" },
  { name: "starling", aliases: ["starling bank"], category: "top_fintech" },
  { name: "klarna", category: "top_fintech" },
  { name: "affirm", category: "top_fintech" },
  { name: "adyen", category: "top_fintech" },
  { name: "plaid", category: "top_fintech" },
  { name: "brex", category: "top_fintech" },
  { name: "ramp", category: "top_fintech" },
  { name: "rippling", category: "top_fintech" },
  { name: "mercury", category: "top_fintech" },
  { name: "robinhood", category: "top_fintech" },
  { name: "checkout.com", aliases: ["checkout"], category: "top_fintech" },
  { name: "sumup", category: "top_fintech" },
  { name: "paysafe", category: "top_fintech" },
  { name: "navan", aliases: ["tripactions"], category: "top_fintech" },

  // ─── WEB3 / CRYPTO ────────────────────────────────────────────────────────
  { name: "coinbase", category: "web3" },
  { name: "binance", category: "web3" },
  { name: "kraken", category: "web3" },
  { name: "gemini", category: "web3" },
  { name: "okx", category: "web3" },
  { name: "bybit", category: "web3" },
  { name: "crypto.com", aliases: ["crypto com"], category: "web3" },
  { name: "uniswap", aliases: ["uniswap labs"], category: "web3" },
  { name: "aave", category: "web3" },
  { name: "chainlink", aliases: ["smartcontractkit"], category: "web3" },
  { name: "alchemy", aliases: ["alchemyplatform"], category: "web3" },
  { name: "consensys", aliases: ["infura", "metamask"], category: "web3" },
  { name: "fireblocks", category: "web3" },
  { name: "chainalysis", category: "web3" },
  { name: "polygon", aliases: ["polygon labs"], category: "web3" },
  { name: "solana labs", aliases: ["solana"], category: "web3" },
  { name: "paradigm", category: "web3" },
  { name: "dydx", category: "web3" },
  { name: "polymarket", category: "web3" },
  { name: "circle", aliases: ["circle internet"], category: "web3" },
  { name: "ripple", category: "web3" },
  { name: "ledger", aliases: ["ledgerhq"], category: "web3" },
  { name: "phantom", category: "web3" },
  { name: "starkware", category: "web3" },
  { name: "matter labs", aliases: ["zksync"], category: "web3" },
  { name: "arbitrum", aliases: ["offchain labs"], category: "web3" },
  { name: "optimism", aliases: ["op labs"], category: "web3" },
  { name: "monad", aliases: ["monad labs"], category: "web3" },
  { name: "eigenlayer", aliases: ["eigen labs"], category: "web3" },
  { name: "ethena", aliases: ["ethena labs"], category: "web3" },
  { name: "ondo", aliases: ["ondo finance"], category: "web3" },
  { name: "layerzero", category: "web3" },
  { name: "wormhole", category: "web3" },
  { name: "openzeppelin", category: "web3" },
  { name: "trail of bits", category: "web3" },
  { name: "immutable", category: "web3" },
  { name: "dapper labs", category: "web3" },
  { name: "worldcoin", aliases: ["world", "tools for humanity"], category: "web3" },
  { name: "farcaster", category: "web3" },
  { name: "bitgo", category: "web3" },
  { name: "anchorage", aliases: ["anchorage digital"], category: "web3" },

  // ─── STRONG STARTUPS ──────────────────────────────────────────────────────
  { name: "databricks", category: "strong_startups" },
  { name: "snowflake", category: "strong_startups" },
  { name: "figma", category: "strong_startups" },
  { name: "notion", category: "strong_startups" },
  { name: "vercel", category: "strong_startups" },
  { name: "linear", category: "strong_startups" },
  { name: "supabase", category: "strong_startups" },
  { name: "retool", category: "strong_startups" },
  { name: "hashicorp", category: "strong_startups" },
  { name: "datadog", category: "strong_startups" },
  { name: "confluent", category: "strong_startups" },
  { name: "cloudflare", category: "strong_startups" },
  { name: "airtable", category: "strong_startups" },
  { name: "canva", category: "strong_startups" },
  { name: "spacex", category: "strong_startups" },
  { name: "anduril", category: "strong_startups" },
  { name: "lyft", category: "strong_startups" },
  { name: "pinterest", category: "strong_startups" },
  { name: "dropbox", category: "strong_startups" },
  { name: "atlassian", category: "strong_startups" },
  { name: "twilio", category: "strong_startups" },
  { name: "okta", category: "strong_startups" },
  { name: "elastic", category: "strong_startups" },
  { name: "zendesk", category: "strong_startups" },
  { name: "splunk", category: "strong_startups" },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectTierWithCategory(
  candidate: {
    company: string | null;
    headline: string | null;
    bio: string | null;
    rawText: string | null;
  },
  tierMap: Record<TierCategory, TierLevel> = DEFAULT_TIER_MAP,
  enabledCategories: TierCategory[] = Object.keys(DEFAULT_TIER_MAP) as TierCategory[]
): { tier: TierLevel; category: TierCategory | null } {
  const searchable = normalize(
    [candidate.company, candidate.headline, candidate.bio, candidate.rawText]
      .filter(Boolean)
      .join(" ")
  );

  for (const company of COMPANIES) {
    if (!enabledCategories.includes(company.category)) continue;

    const namesToCheck = [company.name, ...(company.aliases ?? [])];
    const matched = namesToCheck.some((n) => {
      const normalized = normalize(n);
      // Use word-boundary style check
      const idx = searchable.indexOf(normalized);
      if (idx === -1) return false;
      const before = searchable[idx - 1];
      const after = searchable[idx + normalized.length];
      const validBefore = !before || /[^a-z0-9]/.test(before);
      const validAfter = !after || /[^a-z0-9]/.test(after);
      return validBefore && validAfter;
    });

    if (matched) {
      return { tier: tierMap[company.category], category: company.category };
    }
  }

  return { tier: null, category: null };
}

// Backward-compatible wrapper
export function detectTier(
  candidate: {
    company: string | null;
    headline: string | null;
    bio: string | null;
    rawText: string | null;
  }
): TierLevel {
  return detectTierWithCategory(candidate).tier;
}

import type { TierLevel } from "@/lib/types";

// Tier 1: Elite — extremely high hiring bar
const TIER_1: string[] = [
  // Big Tech
  "google", "alphabet", "meta", "facebook", "apple", "amazon", "aws", "netflix", "microsoft",
  // Top trading / quant firms
  "jane street", "citadel", "two sigma", "de shaw", "d.e. shaw", "jump trading", "virtu",
  "hudson river trading", "hrt", "optiver", "imc trading", "imc", "akuna capital",
  "susquehanna", "sig", "tower research", "point72", "renaissance technologies",
  // Elite startups & fintechs
  "stripe", "robinhood", "coinbase", "plaid", "brex", "chime", "affirm", "palantir",
  // AI / ML leaders
  "openai", "anthropic", "deepmind", "google deepmind", "mistral", "cohere",
  "hugging face", "scale ai", "inflection", "xai", "groq",
  // Top crypto / blockchain
  "binance", "kraken", "uniswap", "chainlink", "paradigm", "a16z crypto",
];

// Tier 2: Strong — high bar, respected industry names
const TIER_2: string[] = [
  // Established tech
  "uber", "lyft", "airbnb", "spotify", "twitter", "x corp", "linkedin", "salesforce",
  "databricks", "snowflake", "confluent", "hashicorp", "datadog", "cloudflare",
  "shopify", "square", "block", "figma", "notion", "airtable", "vercel",
  // Solid fintechs
  "revolut", "n26", "monzo", "nubank", "klarna", "wise", "transferwise", "adyen",
  "checkout.com", "marqeta", "rapyd",
  // Solid trading / finance tech
  "bloomberg", "refinitiv", "tradeweb", "intercontinental exchange", "ice",
  "cboe", "nasdaq", "virtu financial",
  // Other respected tech
  "netflix", "pinterest", "snap", "dropbox", "atlassian", "zendesk", "twilio",
  "okta", "fastly", "new relic", "splunk", "elastic",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectTier(candidate: {
  company: string | null;
  headline: string | null;
  bio: string | null;
  rawText: string | null;
}): TierLevel {
  const searchable = normalize(
    [candidate.company, candidate.headline, candidate.bio, candidate.rawText]
      .filter(Boolean)
      .join(" ")
  );

  for (const name of TIER_1) {
    if (searchable.includes(normalize(name))) return 1;
  }
  for (const name of TIER_2) {
    if (searchable.includes(normalize(name))) return 2;
  }
  return null;
}

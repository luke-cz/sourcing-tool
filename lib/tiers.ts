import type { TierLevel } from "@/lib/types";

export type TierCategory =
  | "faang"
  | "hft_quant"
  | "big_tech"
  | "top_ai"
  | "top_fintech"
  | "web3"
  | "strong_startups"
  | "crypto_hft";

export const TIER_CATEGORY_LABELS: Record<TierCategory, string> = {
  faang: "FAANG",
  hft_quant: "HFT / Quant",
  big_tech: "Big Tech",
  top_ai: "Top AI",
  top_fintech: "Top Fintech",
  web3: "Web3 / Crypto",
  strong_startups: "Strong Startups",
  crypto_hft: "Crypto HFT / Quant",
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
  crypto_hft: 1,
};

interface Company {
  name: string;          // lowercase, used for detection
  displayName?: string;  // proper-cased, used for LinkedIn boolean queries
  aliases?: string[];
  category: TierCategory;
}

const COMPANIES: Company[] = [
  // ─── FAANG ───────────────────────────────────────────────────────────────
  { name: "meta", displayName: "Meta", aliases: ["facebook"], category: "faang" },
  { name: "apple", displayName: "Apple", category: "faang" },
  { name: "amazon", displayName: "Amazon", aliases: ["aws"], category: "faang" },
  { name: "netflix", displayName: "Netflix", category: "faang" },
  { name: "google", displayName: "Google", aliases: ["alphabet", "deepmind", "google deepmind", "waymo"], category: "faang" },

  // ─── HFT / QUANT ─────────────────────────────────────────────────────────
  { name: "jane street", displayName: "Jane Street", category: "hft_quant" },
  { name: "citadel", displayName: "Citadel", aliases: ["citadel securities", "citadel llc"], category: "hft_quant" },
  { name: "two sigma", displayName: "Two Sigma", category: "hft_quant" },
  { name: "de shaw", displayName: "D.E. Shaw", aliases: ["d.e. shaw", "d. e. shaw"], category: "hft_quant" },
  { name: "jump trading", displayName: "Jump Trading", category: "hft_quant" },
  { name: "virtu", displayName: "Virtu Financial", aliases: ["virtu financial"], category: "hft_quant" },
  { name: "hudson river trading", displayName: "Hudson River Trading", aliases: ["hrt"], category: "hft_quant" },
  { name: "optiver", displayName: "Optiver", category: "hft_quant" },
  { name: "imc trading", displayName: "IMC Trading", aliases: ["imc"], category: "hft_quant" },
  { name: "akuna capital", displayName: "Akuna Capital", category: "hft_quant" },
  { name: "susquehanna", displayName: "Susquehanna", aliases: ["sig", "susquehanna international group"], category: "hft_quant" },
  { name: "tower research", displayName: "Tower Research Capital", aliases: ["tower research capital"], category: "hft_quant" },
  { name: "renaissance technologies", displayName: "Renaissance Technologies", aliases: ["renaissance", "rentec"], category: "hft_quant" },
  { name: "point72", displayName: "Point72", aliases: ["point 72"], category: "hft_quant" },
  { name: "millennium management", displayName: "Millennium Management", aliases: ["millennium"], category: "hft_quant" },
  { name: "man group", displayName: "Man Group", aliases: ["man ahl", "man numeric"], category: "hft_quant" },
  { name: "winton", displayName: "Winton", aliases: ["winton group"], category: "hft_quant" },
  { name: "worldquant", displayName: "WorldQuant", category: "hft_quant" },
  { name: "drw", displayName: "DRW", aliases: ["drw trading", "cumberland drw"], category: "hft_quant" },
  { name: "xtx markets", displayName: "XTX Markets", category: "hft_quant" },
  { name: "flow traders", displayName: "Flow Traders", category: "hft_quant" },
  { name: "five rings", displayName: "Five Rings", aliases: ["five rings capital"], category: "hft_quant" },
  { name: "belvedere trading", displayName: "Belvedere Trading", category: "hft_quant" },
  { name: "tibra", displayName: "Tibra", category: "hft_quant" },
  { name: "squarepoint", displayName: "Squarepoint Capital", aliases: ["squarepoint capital"], category: "hft_quant" },
  { name: "marshall wace", displayName: "Marshall Wace", category: "hft_quant" },
  { name: "quantitative brokers", displayName: "Quantitative Brokers", category: "hft_quant" },
  { name: "g-research", displayName: "G-Research", aliases: ["g research"], category: "hft_quant" },
  { name: "qrt", displayName: "QRT", aliases: ["qube research", "qube research and technologies"], category: "hft_quant" },
  { name: "state street", displayName: "State Street", category: "hft_quant" },
  { name: "blackrock", displayName: "BlackRock", category: "hft_quant" },
  { name: "cubist", displayName: "Cubist Systematic Strategies", aliases: ["cubist systematic strategies"], category: "hft_quant" },

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
  { name: "marqeta", category: "top_fintech" },
  { name: "airwallex", category: "top_fintech" },
  { name: "gocardless", category: "top_fintech" },
  { name: "mollie", category: "top_fintech" },
  { name: "rapyd", category: "top_fintech" },
  { name: "nium", category: "top_fintech" },
  { name: "deel", category: "top_fintech" },
  { name: "gusto", category: "top_fintech" },
  { name: "remote", aliases: ["remote.com"], category: "top_fintech" },
  { name: "sofi", aliases: ["sofi technologies"], category: "top_fintech" },
  { name: "betterment", category: "top_fintech" },
  { name: "wealthfront", category: "top_fintech" },
  { name: "acorns", category: "top_fintech" },
  { name: "trade republic", category: "top_fintech" },
  { name: "etoro", category: "top_fintech" },
  { name: "scalable capital", category: "top_fintech" },
  { name: "tide", aliases: ["tide platform"], category: "top_fintech" },
  { name: "pleo", category: "top_fintech" },
  { name: "spendesk", category: "top_fintech" },
  { name: "payhawk", category: "top_fintech" },
  { name: "razorpay", category: "top_fintech" },
  { name: "phonepe", category: "top_fintech" },
  { name: "paytm", aliases: ["one97 communications"], category: "top_fintech" },
  { name: "dave", aliases: ["dave inc"], category: "top_fintech" },
  { name: "current", aliases: ["current banking"], category: "top_fintech" },
  { name: "lendingclub", aliases: ["lending club"], category: "top_fintech" },
  { name: "freetrade", category: "top_fintech" },
  { name: "trading 212", category: "top_fintech" },
  { name: "bitpanda", category: "top_fintech" },
  { name: "yapily", category: "top_fintech" },
  { name: "truelayer", category: "top_fintech" },
  { name: "curve", aliases: ["curve card"], category: "top_fintech" },
  { name: "monese", category: "top_fintech" },
  { name: "oaknorth", aliases: ["oak north"], category: "top_fintech" },

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
  { name: "ava labs", aliases: ["avalanche"], category: "web3" },
  { name: "parity technologies", aliases: ["polkadot", "substrate"], category: "web3" },
  { name: "near protocol", aliases: ["near", "pagoda"], category: "web3" },
  { name: "aptos labs", aliases: ["aptos"], category: "web3" },
  { name: "mysten labs", aliases: ["sui"], category: "web3" },
  { name: "protocol labs", aliases: ["filecoin", "ipfs"], category: "web3" },
  { name: "opensea", category: "web3" },
  { name: "the graph", aliases: ["graph protocol"], category: "web3" },
  { name: "lido finance", aliases: ["lido"], category: "web3" },
  { name: "gnosis", aliases: ["safe global", "gnosis safe"], category: "web3" },
  { name: "1inch", aliases: ["1inch network"], category: "web3" },
  { name: "magic eden", category: "web3" },
  { name: "jito labs", aliases: ["jito"], category: "web3" },
  { name: "helius", category: "web3" },
  { name: "pendle finance", aliases: ["pendle"], category: "web3" },
  { name: "euler finance", aliases: ["euler"], category: "web3" },
  { name: "morpho labs", aliases: ["morpho"], category: "web3" },
  { name: "tenderly", category: "web3" },
  { name: "nomic foundation", aliases: ["hardhat"], category: "web3" },
  { name: "cosmos", aliases: ["interchain", "tendermint"], category: "web3" },
  { name: "celestia", aliases: ["celestia labs"], category: "web3" },
  { name: "fuel labs", aliases: ["fuel network"], category: "web3" },
  { name: "scroll", aliases: ["scroll tech"], category: "web3" },
  { name: "zora", aliases: ["zora network"], category: "web3" },
  { name: "base", aliases: ["base protocol"], category: "web3" },
  { name: "jupiter exchange", aliases: ["jupiter ag"], category: "web3" },
  { name: "drift protocol", category: "web3" },
  { name: "cow protocol", aliases: ["cowswap"], category: "web3" },

  // ─── CRYPTO HFT / QUANT ───────────────────────────────────────────────────
  // Market makers
  { name: "wintermute", displayName: "Wintermute", aliases: ["wintermute trading"], category: "crypto_hft" },
  { name: "keyrock", displayName: "Keyrock", category: "crypto_hft" },
  { name: "gsr", displayName: "GSR", aliases: ["gsr markets"], category: "crypto_hft" },
  { name: "b2c2", displayName: "B2C2", category: "crypto_hft" },
  { name: "amber group", displayName: "Amber Group", aliases: ["amber"], category: "crypto_hft" },
  { name: "dwf labs", displayName: "DWF Labs", category: "crypto_hft" },
  { name: "auros", displayName: "Auros", aliases: ["auros global"], category: "crypto_hft" },
  { name: "wincent", displayName: "Wincent", category: "crypto_hft" },
  { name: "kronos research", displayName: "Kronos Research", aliases: ["kronos"], category: "crypto_hft" },
  { name: "selini capital", displayName: "Selini Capital", category: "crypto_hft" },
  { name: "gravity team", displayName: "Gravity Team", category: "crypto_hft" },
  { name: "acheron trading", displayName: "Acheron Trading", aliases: ["acheron"], category: "crypto_hft" },
  { name: "altonomy", displayName: "Altonomy", category: "crypto_hft" },
  { name: "folkvang", displayName: "Folkvang", aliases: ["folkvang trading"], category: "crypto_hft" },
  { name: "qcp capital", displayName: "QCP Capital", aliases: ["qcp"], category: "crypto_hft" },
  { name: "presto", displayName: "Presto", aliases: ["presto labs", "presto research", "presto trading"], category: "crypto_hft" },
  { name: "mgnr", displayName: "MGNR", category: "crypto_hft" },
  { name: "flowdesk", displayName: "Flowdesk", category: "crypto_hft" },
  { name: "portofino technologies", displayName: "Portofino Technologies", category: "crypto_hft" },
  { name: "radkl", displayName: "Radkl", category: "crypto_hft" },
  { name: "bastion trading", displayName: "Bastion Trading", category: "crypto_hft" },
  { name: "ledgerprime", displayName: "LedgerPrime", aliases: ["ledger prime"], category: "crypto_hft" },
  { name: "xr trading", displayName: "XR Trading", category: "crypto_hft" },
  { name: "jump crypto", displayName: "Jump Crypto", category: "crypto_hft" },
  { name: "cms holdings", displayName: "CMS Holdings", category: "crypto_hft" },
  { name: "symbolic capital", displayName: "Symbolic Capital Partners", aliases: ["symbolic capital partners"], category: "crypto_hft" },
  { name: "dexterity capital", displayName: "Dexterity Capital", category: "crypto_hft" },
  // Prime brokers
  { name: "falconx", displayName: "FalconX", aliases: ["falcon x"], category: "crypto_hft" },
  { name: "hidden road", displayName: "Hidden Road", aliases: ["hidden road partners", "ripple prime"], category: "crypto_hft" },
  { name: "copper.co", displayName: "Copper.co", aliases: ["copper co", "copper technologies"], category: "crypto_hft" },
  { name: "lmax digital", displayName: "LMAX Digital", aliases: ["lmax"], category: "crypto_hft" },
  { name: "blockchain.com", displayName: "Blockchain.com", aliases: ["blockchain"], category: "crypto_hft" },
  // Crypto trading infrastructure
  { name: "talos", displayName: "Talos", aliases: ["talos trading"], category: "crypto_hft" },
  { name: "gauntlet", displayName: "Gauntlet", aliases: ["gauntlet networks"], category: "crypto_hft" },
  { name: "chaos labs", displayName: "Chaos Labs", category: "crypto_hft" },
  // Quant-heavy crypto investment / trading firms
  { name: "galaxy digital", displayName: "Galaxy Digital", aliases: ["galaxy trading", "galaxy asset management"], category: "crypto_hft" },
  { name: "blocktower capital", displayName: "BlockTower Capital", aliases: ["blocktower"], category: "crypto_hft" },
  { name: "brevan howard digital", displayName: "Brevan Howard Digital", aliases: ["bh digital"], category: "crypto_hft" },
  { name: "hashkey capital", displayName: "HashKey Capital", aliases: ["hashkey"], category: "crypto_hft" },
  { name: "genesis trading", displayName: "Genesis Trading", aliases: ["genesis"], category: "crypto_hft" },
  { name: "matrixport", displayName: "Matrixport", category: "crypto_hft" },

  // ─── CRYPTO HFT / QUANT ───────────────────────────────────────────────────
  // Market Makers
  { name: "wintermute", displayName: "Wintermute", aliases: ["wintermute trading"], category: "crypto_hft" },
  { name: "keyrock", displayName: "Keyrock", category: "crypto_hft" },
  { name: "gsr", displayName: "GSR", aliases: ["gsr markets"], category: "crypto_hft" },
  { name: "b2c2", displayName: "B2C2", category: "crypto_hft" },
  { name: "amber group", displayName: "Amber Group", aliases: ["amber"], category: "crypto_hft" },
  { name: "dwf labs", displayName: "DWF Labs", category: "crypto_hft" },
  { name: "cumberland", displayName: "Cumberland", aliases: ["cumberland drw", "cumberland drw llc"], category: "crypto_hft" },
  { name: "auros", displayName: "Auros", aliases: ["auros global"], category: "crypto_hft" },
  { name: "wincent", displayName: "Wincent", category: "crypto_hft" },
  { name: "kronos research", displayName: "Kronos Research", aliases: ["kronos"], category: "crypto_hft" },
  { name: "selini capital", displayName: "Selini Capital", category: "crypto_hft" },
  { name: "gravity team", displayName: "Gravity Team", category: "crypto_hft" },
  { name: "acheron trading", displayName: "Acheron Trading", aliases: ["acheron"], category: "crypto_hft" },
  { name: "altonomy", displayName: "Altonomy", category: "crypto_hft" },
  { name: "folkvang", displayName: "Folkvang", aliases: ["folkvang trading"], category: "crypto_hft" },
  { name: "qcp capital", displayName: "QCP Capital", aliases: ["qcp"], category: "crypto_hft" },
  { name: "presto labs", displayName: "Presto", aliases: ["presto research", "presto trading"], category: "crypto_hft" },
  { name: "mgnr", displayName: "MGNR", aliases: ["mgnr.io"], category: "crypto_hft" },
  { name: "cms holdings", displayName: "CMS Holdings", category: "crypto_hft" },
  { name: "flowdesk", displayName: "Flowdesk", category: "crypto_hft" },
  { name: "portofino technologies", displayName: "Portofino Technologies", aliases: ["portofino"], category: "crypto_hft" },
  { name: "radkl", displayName: "Radkl", category: "crypto_hft" },
  { name: "bastion trading", displayName: "Bastion Trading", category: "crypto_hft" },
  { name: "ledgerprime", displayName: "LedgerPrime", aliases: ["ledger prime"], category: "crypto_hft" },
  { name: "xr trading", displayName: "XR Trading", category: "crypto_hft" },
  // Prime Brokers
  { name: "falconx", displayName: "FalconX", aliases: ["falcon x"], category: "crypto_hft" },
  { name: "hidden road", displayName: "Hidden Road", aliases: ["hidden road partners", "ripple prime"], category: "crypto_hft" },
  { name: "copper", displayName: "Copper.co", aliases: ["copper co", "copper technologies"], category: "crypto_hft" },
  { name: "lmax digital", displayName: "LMAX Digital", aliases: ["lmax"], category: "crypto_hft" },
  { name: "coinbase prime", displayName: "Coinbase Prime", category: "crypto_hft" },
  // Trading Infrastructure / Tech
  { name: "talos", displayName: "Talos", aliases: ["talos trading"], category: "crypto_hft" },
  { name: "paradigm", displayName: "Paradigm", aliases: ["paradigm.co"], category: "crypto_hft" },
  { name: "gauntlet", displayName: "Gauntlet", aliases: ["gauntlet networks"], category: "crypto_hft" },
  { name: "chaos labs", displayName: "Chaos Labs", category: "crypto_hft" },
  { name: "coinroutes", displayName: "CoinRoutes", category: "crypto_hft" },
  // Crypto Quant Investment / Hedge Funds
  { name: "galaxy digital", displayName: "Galaxy Digital", aliases: ["galaxy trading", "galaxy asset management"], category: "crypto_hft" },
  { name: "blocktower capital", displayName: "BlockTower Capital", aliases: ["blocktower"], category: "crypto_hft" },
  { name: "brevan howard digital", displayName: "Brevan Howard Digital", aliases: ["bh digital"], category: "crypto_hft" },
  { name: "multicoin capital", displayName: "Multicoin Capital", aliases: ["multicoin"], category: "crypto_hft" },
  { name: "pantera capital", displayName: "Pantera Capital", aliases: ["pantera"], category: "crypto_hft" },
  { name: "delphi digital", displayName: "Delphi Digital", aliases: ["delphi ventures"], category: "crypto_hft" },
  { name: "hashkey capital", displayName: "HashKey Capital", aliases: ["hashkey"], category: "crypto_hft" },

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

// Export companies grouped by category with display names for LinkedIn boolean queries
function toDisplayName(company: Company): string {
  if (company.displayName) return company.displayName;
  // Title-case the name
  return company.name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const COMPANIES_BY_CATEGORY: Record<TierCategory, { displayName: string }[]> = (() => {
  const result = {} as Record<TierCategory, { displayName: string }[]>;
  for (const company of COMPANIES) {
    if (!result[company.category]) result[company.category] = [];
    result[company.category].push({ displayName: toDisplayName(company) });
  }
  return result;
})();

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

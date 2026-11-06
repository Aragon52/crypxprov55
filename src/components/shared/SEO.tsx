import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RouteMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  keywords?: string;
}

const ROUTE_SEO_MAP: Record<string, RouteMeta> = {
  "/": {
    title: "CrypX-Pro® — Next-Gen Crypto Spot, 125x Futures & Financial Simulation Hub",
    description: "CrypX-Pro provides institutional cryptocurrency spot trading, up to 125x perpetual futures simulation, and high-yield staking vaults with real-time market liquidity.",
    image: "https://crypxpro.com/logo-full-highres.png",
    url: "https://crypxpro.com/",
    keywords: "crypto trading, cryptocurrency exchange, spot trading, bitcoin futures, perpetual contracts, 125x leverage, crypto earn, staking vaults, financial simulation"
  },
  "/auth": {
    title: "Sign In / Register — CrypX-Pro® Secure Crypto Gateway",
    description: "Access your CrypX-Pro portfolio with multi-layered biometric security, encrypted vault storage, and instant order routing.",
    image: "https://crypxpro.com/security-vault.jpg",
    url: "https://crypxpro.com/auth",
    keywords: "crypto login, secure crypto wallet, register trading account"
  },
  "/app/home": {
    title: "Crypto Dashboard & Live Markets — CrypX-Pro®",
    description: "Track global crypto asset movements, portfolio PnL, trending tokens, and real-time order books on your personalized CrypX-Pro dashboard.",
    image: "https://crypxpro.com/hero-abstract.jpg",
    url: "https://crypxpro.com/app/home",
    keywords: "crypto dashboard, real time btc price, crypto portfolio tracker"
  },
  "/app/spot": {
    title: "Spot Trading — CrypX-Pro® Ultra-Fast Crypto Exchange & Order Book",
    description: "Trade BTC, ETH, SOL, and 100+ digital assets with sub-millisecond execution, deep liquidity, live TradingView charts, and competitive zero-fee tiers.",
    image: "https://crypxpro.com/slide-spot.jpg",
    url: "https://crypxpro.com/app/spot",
    keywords: "spot trading, buy bitcoin, crypto order book, tradingview charts, low fee crypto exchange"
  },
  "/app/futures": {
    title: "Futures & Derivatives — CrypX-Pro® 125x Leverage Perpetual Contracts",
    description: "Trade crypto perpetual contracts with up to 125x leverage, dual-direction hedge mode, isolated & cross margin, and intelligent take-profit / stop-loss execution.",
    image: "https://crypxpro.com/slide-futures.jpg",
    url: "https://crypxpro.com/app/futures",
    keywords: "crypto futures, perpetual contracts, 125x leverage, bitcoin margin trading, derivatives exchange"
  },
  "/app/earn": {
    title: "Crypto Earn & Staking — CrypX-Pro® High-Yield Passive Asset Growth",
    description: "Maximize your crypto holdings with flexible and locked high-APY staking pools, daily compounded interest, and institutional-grade proof of reserves.",
    image: "https://crypxpro.com/slide-earn.jpg",
    url: "https://crypxpro.com/app/earn",
    keywords: "crypto earn, staking pools, high apy crypto, usdt staking, passive crypto income"
  },
  "/app/market": {
    title: "Live Crypto Market Overview & Heatmap — CrypX-Pro®",
    description: "Real-time ticker stream, 24h gainers and losers, market capitalization rankings, and algorithmic trend indicators across all crypto pairs.",
    image: "https://crypxpro.com/slide-spot.jpg",
    url: "https://crypxpro.com/app/market",
    keywords: "crypto market prices, top gainers crypto, 24h trading volume, coin rankings"
  },
  "/app/trade-fi": {
    title: "Trade-Fi Quant & Automated Strategies — CrypX-Pro®",
    description: "Deploy algorithmic grid trading bots, DCA automated strategies, and quantitative yield vaults with AI-optimized risk modeling.",
    image: "https://crypxpro.com/slide-futures.jpg",
    url: "https://crypxpro.com/app/trade-fi",
    keywords: "crypto quant bots, grid trading, dca automation, algorithmic trading"
  },
  "/app/assets": {
    title: "Asset Management & Secure Vault — CrypX-Pro®",
    description: "Monitor funding, spot, and futures wallet balances with multi-chain deposit and withdrawal security verification.",
    image: "https://crypxpro.com/security-vault.jpg",
    url: "https://crypxpro.com/app/assets",
    keywords: "crypto wallet, asset management, cold storage vault"
  },
  "/faq": {
    title: "Frequently Asked Questions & Knowledge Base — CrypX-Pro®",
    description: "Learn how to trade spot and futures, stake tokens in Earn vaults, deposit multi-chain assets, and secure your CrypX-Pro account.",
    image: "https://crypxpro.com/slide-support.jpg",
    url: "https://crypxpro.com/faq",
    keywords: "crypto trading faq, how to trade crypto, staking guide"
  },
  "/terms": {
    title: "Terms of Service & User Agreement — CrypX-Pro®",
    description: "Read the official Terms of Service, trading rules, risk disclosure statements, and platform agreement for CrypX-Pro.",
    image: "https://crypxpro.com/logo-full-highres.png",
    url: "https://crypxpro.com/terms",
    keywords: "terms of service, crypto trading terms, risk disclosure"
  },
  "/policies": {
    title: "Privacy Policy & Compliance Standard — CrypX-Pro®",
    description: "Understand how CrypX-Pro protects your personal data, enforces zero-knowledge authentication, and adheres to regulatory standards.",
    image: "https://crypxpro.com/logo-full-highres.png",
    url: "https://crypxpro.com/policies",
    keywords: "privacy policy, data security, compliance standard"
  }
};

export const RouteSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.toLowerCase().replace(/\/$/, "") || "/";
    const meta = ROUTE_SEO_MAP[pathname] || ROUTE_SEO_MAP["/"];

    // Update Document Title
    document.title = meta.title;

    // Helper to set or update meta tag
    const updateMetaTag = (attribute: "name" | "property", key: string, content: string) => {
      let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard Meta
    updateMetaTag("name", "description", meta.description);
    if (meta.keywords) {
      updateMetaTag("name", "keywords", meta.keywords);
    }

    // Open Graph
    updateMetaTag("property", "og:title", meta.title);
    updateMetaTag("property", "og:description", meta.description);
    updateMetaTag("property", "og:image", meta.image);
    updateMetaTag("property", "og:url", `https://crypxpro.com${pathname === "/" ? "" : pathname}`);
    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:site_name", "CrypX-Pro");

    // Twitter
    updateMetaTag("name", "twitter:title", meta.title);
    updateMetaTag("name", "twitter:description", meta.description);
    updateMetaTag("name", "twitter:image", meta.image);
    updateMetaTag("name", "twitter:url", `https://crypxpro.com${pathname === "/" ? "" : pathname}`);
    updateMetaTag("name", "twitter:card", "summary_large_image");

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://crypxpro.com${pathname === "/" ? "" : pathname}`);
  }, [location.pathname]);

  return null;
};

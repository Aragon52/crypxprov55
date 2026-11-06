import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

interface RouteSEOMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  keywords?: string;
}

const ROUTE_SEO_MAP: Record<string, RouteSEOMeta> = {
  "/": {
    title: "CrypX-Pro® — Next-Gen Crypto Trading & Financial Simulation Platform",
    description: "Experience institutional-grade cryptocurrency spot trading, high-leverage futures up to 125x, and high-yield staking with zero latency.",
    image: "https://crypxpro.com/logo-full-highres.png",
    url: "https://crypxpro.com/",
    keywords: "crypto trading, bitcoin exchange, cryptocurrency spot, perpetual futures, crypto staking, defi earn"
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

function injectDynamicSEO(html: string, rawUrl: string): string {
  const cleanPath = rawUrl.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const meta = ROUTE_SEO_MAP[cleanPath] || ROUTE_SEO_MAP["/"];

  // Replace Title
  let modified = html.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);

  // Replace Description
  modified = modified.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="description" content="${meta.description}" />`
  );

  // Replace Keywords if present
  if (meta.keywords) {
    modified = modified.replace(
      /<meta\s+name=["']keywords["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="keywords" content="${meta.keywords}" />`
    );
  }

  // Replace Open Graph Tags
  modified = modified.replace(
    /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:title" content="${meta.title}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:description" content="${meta.description}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:image" content="${meta.image}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:image:secure_url["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${meta.image}" />`
  );
  modified = modified.replace(
    /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:url" content="https://crypxpro.com${cleanPath === "/" ? "" : cleanPath}" />`
  );

  // Replace Twitter Cards
  modified = modified.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${meta.title}" />`
  );
  modified = modified.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${meta.description}" />`
  );
  modified = modified.replace(
    /<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:image" content="${meta.image}" />`
  );

  // Replace Canonical URL
  modified = modified.replace(
    /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
    `<link rel="canonical" href="https://crypxpro.com${cleanPath === "/" ? "" : cleanPath}" />`
  );

  return modified;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Use JSON middleware if needed for APIs
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Database Schema & Migration Exports
  app.get("/api/admin/schema.sql", (req, res) => {
    const schemaPath = path.resolve(process.cwd(), "schema.sql");
    if (fs.existsSync(schemaPath)) {
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", 'attachment; filename="crypx_pro_schema.sql"');
      return res.sendFile(schemaPath);
    }
    return res.status(404).send("-- Schema file not found");
  });

  app.get("/api/admin/setup_admin_auth.sql", (req, res) => {
    const authSqlPath = path.resolve(process.cwd(), "setup_admin_auth.sql");
    if (fs.existsSync(authSqlPath)) {
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", 'attachment; filename="setup_admin_auth.sql"');
      return res.sendFile(authSqlPath);
    }
    return res.status(404).send("-- Auth SQL file not found");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback with dynamic SEO in development
    app.get('*all', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip for API or static-looking paths
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }
      try {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const transformed = await vite.transformIndexHtml(url, template);
        const finalHtml = injectDynamicSEO(transformed, url);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    // SPA fallback: serve index.html with dynamic SEO for all non-file routes
    app.get('*all', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      
      const indexPath = path.join(distPath, 'index.html');
      try {
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          
          const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
          const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
          
          html = html.replace('__VITE_SUPABASE_URL__', supabaseUrl);
          html = html.replace('__VITE_SUPABASE_ANON_KEY__', supabaseAnonKey);
          
          html = injectDynamicSEO(html, req.originalUrl);
          
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        } else {
          return res.status(404).send('index.html not found');
        }
      } catch (err) {
        return next(err);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

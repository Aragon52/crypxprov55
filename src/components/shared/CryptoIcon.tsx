import React, { useState, useEffect } from "react";
import nasLogo from '@/assets/images/nas_token_logo_1786712749407.jpg';
import botLogo from '@/assets/images/bot_token_logo_1786712760680.jpg';
import cpxLogo from '@/assets/images/cpx_token_logo_1786712771148.jpg';
import octLogo from '@/assets/images/oct_token_logo_1786712780224.jpg';
import aepLogo from '@/assets/images/aep_token_logo_1786712790779.jpg';
import ttzsLogo from '@/assets/images/ttzs_token_logo_1786716384227.jpg';
import cfrLogo from '@/assets/images/cfr_token_logo_1786716396024.jpg';
import stcLogo from '@/assets/images/stc_token_logo_1786716408156.jpg';
import joeLogo from '@/assets/images/joe_token_logo_1786716418145.jpg';

// Custom Sample Tokens generated 3D image assets
import voltLogo from '@/assets/images/volt_energy_logo_1786723659659.jpg';
import cybrLogo from '@/assets/images/cybr_security_logo_1786723681318.jpg';
import qcoreLogo from '@/assets/images/qcore_quantum_logo_1786723694282.jpg';
import artsLogo from '@/assets/images/arts_asset_logo_1786723704071.jpg';
import axgLogo from '@/assets/images/axg_growth_logo_1786723716168.jpg';
import bgnxLogo from '@/assets/images/bgnx_biogen_logo_1786723727012.jpg';
import omniLogo from '@/assets/images/omni_media_logo_1786723738247.jpg';
import cineLogo from '@/assets/images/cine_movie_logo_1786723750188.jpg';
import tfraLogo from '@/assets/images/tfra_agri_logo_1786723760557.jpg';

// Custom simulated / training token logos (strictly for app custom sample tokens, NEVER for real tokens)
const CUSTOM_MOCK_LOGOS: Record<string, string> = {
  NAS: nasLogo,
  BOT: botLogo,
  CPX: cpxLogo,
  OCT: octLogo,
  AEP: aepLogo,
  TTZS: ttzsLogo,
  CFR: cfrLogo,
  STC: stcLogo,
  JOE: joeLogo,
  ECB: "/tokens/ECB.png",
  
  // Custom Sample tokens under Stocks & Commodities
  VOLT: voltLogo,
  CYBR: cybrLogo,
  QCORE: qcoreLogo,
  ARTS: artsLogo,
  AXG: axgLogo,
  BGNX: bgnxLogo,
  OMNI: omniLogo,
  CINE: cineLogo,
  TFRA: tfraLogo,
};

// Official open-source repositories & CDNs (TrustWallet Assets, CoinGecko, Spothq cryptocurrency-icons)
const OFFICIAL_OPENSOURCE_ICONS: Record<string, string[]> = {
  // USDT (Tether) - Official open-source assets
  USDT: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/usdt.svg",
    "https://assets.coingecko.com/coins/images/325/large/Tether.png"
  ],
  // DOGE (Dogecoin) - Official open-source assets
  DOGE: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/doge.svg",
    "https://assets.coingecko.com/coins/images/5/large/dogecoin.png"
  ],
  BTC: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/btc.svg",
    "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
  ],
  ETH: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/eth.svg",
    "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  ],
  BNB: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/bnb.svg",
    "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png"
  ],
  SOL: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/sol.svg",
    "https://assets.coingecko.com/coins/images/4128/large/solana.png"
  ],
  XRP: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/xrp.svg",
    "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png"
  ],
  USDC: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/usdc.svg",
    "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png"
  ],
  ADA: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/ada.svg",
    "https://assets.coingecko.com/coins/images/975/large/cardano.png"
  ],
  TRX: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/trx.svg",
    "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png"
  ],
  AVAX: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/avax.svg",
    "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png"
  ],
  LINK: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/link.svg",
    "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png"
  ],
  DOT: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/dot.svg",
    "https://assets.coingecko.com/coins/images/12171/large/polkadot.png"
  ],
  MATIC: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/matic.svg",
    "https://assets.coingecko.com/coins/images/4713/large/polygon.png"
  ],
  POL: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/matic.svg",
    "https://assets.coingecko.com/coins/images/4713/large/polygon.png"
  ],
  SHIB: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/shib.svg",
    "https://assets.coingecko.com/coins/images/11939/large/shiba.png"
  ],
  LTC: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/ltc.svg",
    "https://assets.coingecko.com/coins/images/2/large/litecoin.png"
  ],
  BCH: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/bch.svg",
    "https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png"
  ],
  NEAR: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/near.svg",
    "https://assets.coingecko.com/coins/images/10365/large/near.png"
  ],
  APT: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png",
    "https://assets.coingecko.com/coins/images/26455/large/aptos_round.png"
  ],
  SUI: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png",
    "https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png"
  ],
  PEPE: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png",
    "https://assets.coingecko.com/coins/images/29850/large/pepe-token.png"
  ],
  TON: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png",
    "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png"
  ],
  WIF: [
    "https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg"
  ],
  BONK: [
    "https://assets.coingecko.com/coins/images/28600/large/bonk.jpg"
  ],
  FLOKI: [
    "https://assets.coingecko.com/coins/images/16746/large/FLOKI.png"
  ],
  BOME: [
    "https://assets.coingecko.com/coins/images/36071/large/bome.png"
  ],
  POPCAT: [
    "https://assets.coingecko.com/coins/images/33760/large/popcat.png"
  ],
  BRETT: [
    "https://assets.coingecko.com/coins/images/35545/large/brett.png"
  ],
  FET: [
    "https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg"
  ],
  RENDER: [
    "https://assets.coingecko.com/coins/images/11636/large/rndr.png"
  ],
  WLD: [
    "https://assets.coingecko.com/coins/images/31062/large/worldcoin.png"
  ],
  UNI: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/uni.svg",
    "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png"
  ],
  ATOM: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/atom.svg",
    "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png"
  ],
  ETC: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/classic/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/etc.svg",
    "https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png"
  ],
  XLM: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/xlm.svg",
    "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png"
  ],
  ICP: [
    "https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png"
  ],
  OP: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    "https://assets.coingecko.com/coins/images/25244/large/Optimism.png"
  ],
  ARB: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png"
  ],
  SEI: [
    "https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png"
  ],
  FTM: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png",
    "https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png"
  ],
  ALGO: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/algorand/info/logo.png",
    "https://assets.coingecko.com/coins/images/4380/large/download.png"
  ],
  HBAR: [
    "https://assets.coingecko.com/coins/images/3688/large/hbar.png"
  ],
  VET: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/vechain/info/logo.png",
    "https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png"
  ],
  LUNC: [
    "https://assets.coingecko.com/coins/images/25767/large/luna.png",
    "https://s2.coinmarketcap.com/static/img/coins/64x64/20314.png"
  ],
  USTC: [
    "https://assets.coingecko.com/coins/images/12681/large/USTC.png",
    "https://s2.coinmarketcap.com/static/img/coins/64x64/15691.png"
  ],
  AAVE: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/aave.svg"
  ],
  MKR: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/mkr.svg"
  ],
  CRV: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/crv.svg"
  ],
  LDO: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98Fc0A5d45360b1120015B8b3C962A0cf33cE3/logo.png"
  ],
  FIL: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/filecoin/info/logo.png",
    "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/fil.svg"
  ],
  JASMY: [
    "https://assets.coingecko.com/coins/images/13876/large/JASMY.png"
  ],
  GALA: [
    "https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png"
  ],
  CHZ: [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/chiliz/info/logo.png"
  ],

  // Stocks & Real Multi-Tier CDN Logos
  TSLA: ["https://images.financialmodelingprep.com/symbol/TSLA.png", "https://logo.clearbit.com/tesla.com"],
  AAPL: ["https://images.financialmodelingprep.com/symbol/AAPL.png", "https://logo.clearbit.com/apple.com"],
  NVDA: ["https://images.financialmodelingprep.com/symbol/NVDA.png", "https://logo.clearbit.com/nvidia.com"],
  AMZN: ["https://images.financialmodelingprep.com/symbol/AMZN.png", "https://logo.clearbit.com/amazon.com"],
  MSFT: ["https://images.financialmodelingprep.com/symbol/MSFT.png", "https://logo.clearbit.com/microsoft.com"],
  GOOGL: ["https://images.financialmodelingprep.com/symbol/GOOGL.png", "https://logo.clearbit.com/google.com"],
  META: ["https://images.financialmodelingprep.com/symbol/META.png", "https://logo.clearbit.com/meta.com"],
  NFLX: ["https://images.financialmodelingprep.com/symbol/NFLX.png", "https://logo.clearbit.com/netflix.com"],
  AMD: ["https://images.financialmodelingprep.com/symbol/AMD.png", "https://logo.clearbit.com/amd.com"],
  COIN: ["https://images.financialmodelingprep.com/symbol/COIN.png", "https://logo.clearbit.com/coinbase.com"],
  MSTR: ["https://images.financialmodelingprep.com/symbol/MSTR.png", "https://logo.clearbit.com/microstrategy.com"],
  SPY: ["https://images.financialmodelingprep.com/symbol/SPY.png", "https://logo.clearbit.com/ssga.com"],
  VIX: ["https://images.financialmodelingprep.com/symbol/VIX.png", "https://logo.clearbit.com/cboe.com"],
  GOLD: ["https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x45804880De22913dAFE09f4980848ECE6EcbAf78/logo.png"],
  SILVER: ["https://assets.coingecko.com/coins/images/279/large/silver.png"],
  OIL: ["https://assets.coingecko.com/coins/images/15453/large/oil.png"],
};

// Helper for deterministic color generation for unmapped tokens
const getGradientForSymbol = (sym: string) => {
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 45) % 360;
  return {
    bg1: `hsl(${h1}, 75%, 45%)`,
    bg2: `hsl(${h2}, 85%, 35%)`,
  };
};

const normalizeCryptoSymbol = (sym: string): string => {
  if (!sym) return 'USDT';
  let s = sym.toUpperCase().trim();
  s = s.replace(/[/\-_ :]/g, '');
  
  if (s === 'USDT' || s.startsWith('USDT-') || s.startsWith('USDT_') || s === 'TETHER') {
    return 'USDT';
  }
  if (s.endsWith('USDT') && s.length > 4) {
    return s.slice(0, -4);
  }
  if (s.endsWith('USDC') && s.length > 4) {
    return s.slice(0, -4);
  }
  if (s.endsWith('PERP') && s.length > 4) {
    return s.slice(0, -4);
  }
  return s;
};

export interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({ symbol, size = 24, className = "" }) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  
  useEffect(() => {
    setSourceIndex(0);
    setImageFailed(false);
  }, [symbol]);

  const styleDim = size ? { width: size, height: size } : undefined;

  // 1. Custom mock sample tokens (strictly internal test tokens, never real cryptos)
  if (CUSTOM_MOCK_LOGOS[normalizedSymbol] && !imageFailed) {
    return (
      <img
        src={CUSTOM_MOCK_LOGOS[normalizedSymbol]}
        alt={`${normalizedSymbol} logo`}
        className={`rounded-full object-cover shadow-sm flex-shrink-0 border border-white/10 ${className}`}
        style={styleDim}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

  // 2. Official Open-Source Remote Icon Loader for Real Tokens (TrustWallet / CoinGecko / Spothq)
  const sources = OFFICIAL_OPENSOURCE_ICONS[normalizedSymbol];
  if (sources && sources.length > 0 && !imageFailed && sourceIndex < sources.length) {
    const currentUrl = sources[sourceIndex];
    return (
      <img
        key={`${normalizedSymbol}-${sourceIndex}-${currentUrl}`}
        src={currentUrl}
        alt={`${normalizedSymbol} official icon`}
        className={`rounded-full object-contain shadow-sm flex-shrink-0 bg-transparent ${className}`}
        style={styleDim}
        referrerPolicy="no-referrer"
        onError={() => {
          if (sourceIndex + 1 < sources.length) {
            setSourceIndex(prev => prev + 1);
          } else {
            setImageFailed(true);
          }
        }}
      />
    );
  }

  // 3. Official Vector Fallbacks for Top Real Tokens (Instant 0ms, Zero-Loss Vectors)

  // USDT - Official Tether USD Vector Fallback
  if (normalizedSymbol === 'USDT') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#26A17B" />
        <path
          fill="#FFFFFF"
          d="M17.9 11.8v-2h5.7V7H8.4v2.8h5.7v2c-4.9.3-8.6 1.8-8.6 3.6s3.7 3.3 8.6 3.6v6.9h3.8v-6.9c4.9-.3 8.6-1.8 8.6-3.6s-3.7-3.3-8.6-3.6zm0 5.4v-.8c4.2-.3 7.3-1.4 7.3-2.6 0-1.2-3.1-2.3-7.3-2.6v2.7c-.6 0-1.3 0-1.9 0v-2.7c-4.2.3-7.3 1.4-7.3 2.6 0 1.2 3.1 2.3 7.3 2.6v.8c-4.5-.3-7.8-1.5-7.8-3.4 0-2 3.7-3.6 8.3-3.6h8.9c4.6 0 8.3 1.6 8.3 3.6 0 1.9-3.3 3.1-7.8 3.4z"
        />
      </svg>
    );
  }

  // BTC - Official Bitcoin Logo (#F7931A & Official ₿)
  if (normalizedSymbol === 'BTC') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          fill="#FFFFFF"
          d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.535 2.146-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
        />
      </svg>
    );
  }

  // ETH - Official Ethereum Logo (#627EEA Diamond)
  if (normalizedSymbol === 'ETH') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g fill="#FFFFFF" fillRule="nonzero">
          <path fillOpacity=".6" d="M16.498 4v8.87l7.497 3.35z" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path fillOpacity=".6" d="M16.498 21.968v6.027L24 17.616z" />
          <path d="M16.498 27.995v-6.028L9 17.616z" />
          <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
          <path fillOpacity=".6" d="M9 16.22l7.498 4.353v-7.701z" />
        </g>
      </svg>
    );
  }

  // BNB - Official BNB Chain Logo (#F3BA2F)
  if (normalizedSymbol === 'BNB') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
        <path
          fill="#FFFFFF"
          d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6 9.856 12.144l2.26 2.26zm-6.116 1.596l2.26-2.26 2.26 2.26-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.26L16 26l-6.144-6.144 2.26-2.26zm9.884-1.596l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zm-7.74 0l1.74-1.74 1.74 1.74-1.74 1.74-1.74-1.74z"
        />
      </svg>
    );
  }

  // SOL - Official Solana Logo (Black with Dual Gradient Bands)
  if (normalizedSymbol === 'SOL') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <defs>
          <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#DC1FFF" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" fill="#18181b" />
        <path
          fill="url(#solGrad)"
          d="M9.2 19.8a.5.5 0 0 1 .38-.18h13.2a.3.3 0 0 1 .2.5l-2.8 2.8a.5.5 0 0 1-.38.18H6.6a.3.3 0 0 1-.2-.5l2.8-2.8zm0-10.8a.5.5 0 0 1 .38-.18h13.2a.3.3 0 0 1 .2.5l-2.8 2.8a.5.5 0 0 1-.38.18H6.6a.3.3 0 0 1-.2-.5l2.8-2.8zm13.6 5.4a.5.5 0 0 1-.38.18H9.22a.3.3 0 0 1-.2-.5l2.8-2.8a.5.5 0 0 1 .38-.18h13.2a.3.3 0 0 1 .2.5l-2.8 2.8z"
        />
      </svg>
    );
  }

  // XRP - Official Ripple / XRP Logo (#23292F)
  if (normalizedSymbol === 'XRP') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#23292F" />
        <path
          fill="#FFFFFF"
          d="M24.78 7.5h2.47l-5.6 5.52c-3.12 3.08-8.18 3.08-11.3 0L4.75 7.5h2.47l4.36 4.3a5.55 5.55 0 0 0 7.84 0l5.36-4.3zm-17.56 17h-2.47l5.6-5.52c3.12-3.08 8.18-3.08 11.3 0l5.6 5.52h-2.47l-4.36-4.3a5.55 5.55 0 0 0-7.84 0l-5.36 4.3z"
        />
      </svg>
    );
  }

  // DOGE - Official Dogecoin Logo (#C2A633 & Ð)
  if (normalizedSymbol === 'DOGE') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#C2A633" />
        <path
          fill="#FFFFFF"
          d="M12.5 7h4.8c4.2 0 7.2 2.8 7.2 9s-3 9-7.2 9h-4.8V7zm3.6 15h1.2c2.4 0 4-1.8 4-6s-1.6-6-4-6h-1.2v12zm-6.6-6.8h6.2v1.6H9.5v-1.6z"
        />
      </svg>
    );
  }

  // ADA - Official Cardano Logo (#0033AD)
  if (normalizedSymbol === 'ADA') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#0033AD" />
        <circle cx="16" cy="16" r="2.8" fill="#FFFFFF" />
        <circle cx="16" cy="8" r="1.4" fill="#FFFFFF" />
        <circle cx="16" cy="24" r="1.4" fill="#FFFFFF" />
        <circle cx="8" cy="16" r="1.4" fill="#FFFFFF" />
        <circle cx="24" cy="16" r="1.4" fill="#FFFFFF" />
        <circle cx="10.3" cy="10.3" r="1.4" fill="#FFFFFF" />
        <circle cx="21.7" cy="21.7" r="1.4" fill="#FFFFFF" />
        <circle cx="10.3" cy="21.7" r="1.4" fill="#FFFFFF" />
        <circle cx="21.7" cy="10.3" r="1.4" fill="#FFFFFF" />
      </svg>
    );
  }

  // TRX - Official TRON Logo (#EF0027)
  if (normalizedSymbol === 'TRX') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#EF0027" />
        <path fill="#FFFFFF" d="M7 8.5l17.5 3.2L16 25.5 7 8.5zm2.8 2.2l6.2 11.7 5.6-8.8-11.8-2.9zm1.7.5l9.2 2.2-7.3-1.3-1.9-.9z" />
      </svg>
    );
  }

  // AVAX - Official Avalanche Logo (#E84142)
  if (normalizedSymbol === 'AVAX') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#E84142" />
        <path
          fill="#FFFFFF"
          d="M17.48 7.37a1.7 1.7 0 0 0-2.96 0l-7.9 14.15a1.7 1.7 0 0 0 1.48 2.53h4.6a1.7 1.7 0 0 0 1.48-.86l4.88-8.73 2.1 3.75a1.7 1.7 0 0 0 1.48.86h1.76a1.7 1.7 0 0 0 1.48-2.53l-8.4-14.17z"
        />
      </svg>
    );
  }

  // LINK - Official Chainlink Logo (#375BD2)
  if (normalizedSymbol === 'LINK') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#375BD2" />
        <path
          fill="#FFFFFF"
          d="M16 6l-8.66 5v10L16 26l8.66-5V11L16 6zm5.77 13.33L16 22.67l-5.77-3.34v-6.66L16 9.33l5.77 3.34v6.66z"
        />
      </svg>
    );
  }

  // DOT - Official Polkadot Logo (#E6007A)
  if (normalizedSymbol === 'DOT') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#E6007A" />
        <circle cx="16" cy="10" r="3.2" fill="#FFFFFF" />
        <circle cx="16" cy="22" r="3.2" fill="#FFFFFF" />
        <circle cx="10" cy="16" r="3.2" fill="#FFFFFF" />
        <circle cx="22" cy="16" r="3.2" fill="#FFFFFF" />
      </svg>
    );
  }

  // MATIC / POL - Official Polygon Logo (#8247E5)
  if (normalizedSymbol === 'MATIC' || normalizedSymbol === 'POL') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#8247E5" />
        <path
          fill="#FFFFFF"
          d="M21.5 13.5l-3.3-1.9v-3.8l-3.3-1.9-3.3 1.9v3.8l-3.3 1.9 3.3 1.9v3.8l3.3 1.9 3.3-1.9v-3.8l3.3-1.9z"
        />
      </svg>
    );
  }

  // LTC - Official Litecoin Logo (#345D9D)
  if (normalizedSymbol === 'LTC') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#345D9D" />
        <path
          fill="#FFFFFF"
          d="M15.3 7h3.8l-2.4 9.6h3.4l-.8 3.2h-3.4l-1.4 5.2h8.6l-.8 3H11.5l5.2-21z"
        />
      </svg>
    );
  }

  // BCH - Official Bitcoin Cash Logo (#0AC18E)
  if (normalizedSymbol === 'BCH') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#0AC18E" />
        <path
          fill="#FFFFFF"
          d="M19.8 14.5c.3-1.9-1.2-2.9-3.1-3.6l.6-2.5-1.5-.4-.6 2.5c-.4-.1-.8-.2-1.2-.3l.6-2.5-1.5-.4-.6 2.5-1-.2-.1-.1-2.1-.5-.4 1.6s1.1.3 1.1.3c.6.2.7.6.7.9l-.7 2.9.2.1-1 4c-.1.2-.3.5-.7.4 0 0-1.1-.3-1.1-.3l-.8 1.8 2 .5c.4.1.7.2 1.1.3l-.6 2.5 1.5.4.6-2.5c.4.1.8.2 1.2.3l-.6 2.5 1.5.4.6-2.5c2.6.5 4.6.3 5.4-2 .6-1.9 0-3-1.4-3.7 1-.3 1.8-.9 2-2.3zm-3.5 5c-.5 1.9-3.7.9-4.7.6l.8-3.4c1 .3 4.4.8 3.9 2.8zm.5-5c-.4 1.7-3.1.8-4 .6l.8-3c.8.2 3.6.6 3.2 2.4z"
        />
      </svg>
    );
  }

  // USDC - Official USD Coin Logo (#2775CA)
  if (normalizedSymbol === 'USDC') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#2775CA" />
        <path
          fill="#FFFFFF"
          d="M16 5.5A10.5 10.5 0 1 0 26.5 16 10.5 10.5 0 0 0 16 5.5zm0 18.8a8.3 8.3 0 1 1 8.3-8.3 8.3 8.3 0 0 1-8.3 8.3z"
        />
        <path
          fill="#FFFFFF"
          d="M17.4 12.2a2.8 2.8 0 0 0-2.8-1.5c-1.5 0-2.4.8-2.4 1.8 0 1.2 1 1.6 2.7 2 1.8.5 3.3 1.3 3.3 3.2 0 1.8-1.3 3-3.2 3.3v1.5h-1.6v-1.5a3.8 3.8 0 0 1-3.3-2l1.6-.9a2.7 2.7 0 0 0 2.2 1.5c1.4 0 2.2-.8 2.2-1.8 0-1.2-1-1.6-2.6-2-1.9-.5-3.4-1.3-3.4-3.2 0-1.8 1.3-3 3.1-3.3V8.3h1.6v1.5a3.6 3.6 0 0 1 2.8 1.5z"
        />
      </svg>
    );
  }

  // TON - Official Toncoin Logo (#0088CC)
  if (normalizedSymbol === 'TON') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#0088CC" />
        <path
          fill="#FFFFFF"
          d="M24 10.5L16 6 8 10.5v9.8L16 26l8-5.7v-9.8zM16 8.4l5.6 3.1-5.6 3.4-5.6-3.4L16 8.4zm-6.2 4.1l5.4 3.3v7.6l-5.4-3.8v-7.1zm12.4 7.1l-5.4 3.8v-7.6l5.4-3.3v7.1z"
        />
      </svg>
    );
  }

  // SUI - Official Sui Logo (#4CA2FE)
  if (normalizedSymbol === 'SUI') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#4CA2FE" />
        <path
          fill="#FFFFFF"
          d="M16 6c-3.5 4.5-6.5 8.5-6.5 12.5a6.5 6.5 0 0 0 13 0C22.5 14.5 19.5 10.5 16 6zm0 15.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
        />
      </svg>
    );
  }

  // APT - Official Aptos Logo
  if (normalizedSymbol === 'APT') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#18181b" />
        <path
          fill="#FFFFFF"
          d="M16 6L6.5 22h3.8l2-3.4h7.4l2 3.4h3.8L16 6zm-.1 6.8l2.2 3.8h-4.4l2.2-3.8z"
        />
      </svg>
    );
  }

  // NEAR - Official NEAR Protocol Logo
  if (normalizedSymbol === 'NEAR') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#000000" />
        <path
          fill="#FFFFFF"
          d="M10.2 7h2.8l6.2 9.5V7h2.6v18h-2.8L12.8 15.5V25h-2.6V7z"
        />
      </svg>
    );
  }

  // PEPE - Official Pepe Logo
  if (normalizedSymbol === 'PEPE') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shadow-sm flex-shrink-0 ${className}`}
        style={styleDim}
      >
        <circle cx="16" cy="16" r="16" fill="#439641" />
        <circle cx="12" cy="13" r="3.5" fill="#FFFFFF" />
        <circle cx="20" cy="13" r="3.5" fill="#FFFFFF" />
        <circle cx="12.5" cy="13" r="1.8" fill="#18181b" />
        <circle cx="20.5" cy="13" r="1.8" fill="#18181b" />
        <path d="M9 19c2.5 3 11.5 3 14 0" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // 3. High-precision Graphical Vector Emblems for Main Market & Custom Training Tokens

  // CFT - Core Financial Futures
  if (normalizedSymbol === 'CFT') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="cftBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c0519" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id="cftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#cftBg)" stroke="#fb7185" strokeWidth="2" />
        <path d="M 50 18 L 80 72 L 50 58 L 20 72 Z" fill="url(#cftGrad)" />
        <path d="M 50 32 L 68 64 L 50 54 L 32 64 Z" fill="#ffffff" opacity="0.9" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
      </svg>
    );
  }

  // RTV - Real Time Velocity
  if (normalizedSymbol === 'RTV') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="rtvBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>
          <linearGradient id="rtvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#rtvBg)" stroke="#06b6d4" strokeWidth="2" />
        <path d="M 24 35 L 50 50 L 24 65" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 42 30 L 72 50 L 42 70" fill="none" stroke="url(#rtvGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="72" cy="50" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // REO - Reserve Ecosystem Oracle
  if (normalizedSymbol === 'REO') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="reoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
          <linearGradient id="reoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#reoBg)" stroke="#fbbf24" strokeWidth="2" />
        <polygon points="50,18 82,74 18,74" fill="none" stroke="url(#reoGrad)" strokeWidth="3" />
        <polygon points="50,30 72,70 28,70" fill="url(#reoGrad)" opacity="0.25" />
        <circle cx="50" cy="54" r="10" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="50" cy="54" r="5" fill="#ffffff" />
      </svg>
    );
  }

  // BEX - Block Exchange L2
  if (normalizedSymbol === 'BEX') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="bexBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bexBg)" stroke="#818cf8" strokeWidth="2" />
        <polygon points="50,18 74,30 50,42 26,30" fill="#a5b4fc" />
        <polygon points="50,38 74,50 50,62 26,50" fill="#818cf8" opacity="0.9" />
        <polygon points="50,58 74,70 50,82 26,70" fill="#38bdf8" />
        <circle cx="50" cy="30" r="3" fill="#ffffff" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
        <circle cx="50" cy="70" r="3" fill="#ffffff" />
      </svg>
    );
  }

  // RYR - Rhythm Yield Reserve
  if (normalizedSymbol === 'RYR') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="ryrBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="ryrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#ryrBg)" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M 22 50 Q 36 26 50 50 T 78 50" fill="none" stroke="url(#ryrGrad)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="5" fill="#ffffff" />
      </svg>
    );
  }

  // OAS - Oasis Alpha L2
  if (normalizedSymbol === 'OAS') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="oasBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="oasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#oasBg)" stroke="#10b981" strokeWidth="2" />
        <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="none" stroke="url(#oasGrad)" strokeWidth="3" />
        <polygon points="50,28 68,39 68,61 50,72 32,61 32,39" fill="url(#oasGrad)" opacity="0.3" />
        <path d="M 50 36 C 50 36 38 52 38 60 C 38 66 43 70 50 70 C 57 70 62 66 62 60 C 62 52 50 36 50 36 Z" fill="url(#oasGrad)" />
        <circle cx="47" cy="58" r="2" fill="#ffffff" />
      </svg>
    );
  }

  // JTC - Joint Training Coin
  if (normalizedSymbol === 'JTC') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="jtcBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#500724" />
          </linearGradient>
          <linearGradient id="jtcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#jtcBg)" stroke="#c084fc" strokeWidth="2" />
        <path d="M 34 38 C 22 38 22 62 34 62 C 46 62 54 38 66 38 C 78 38 78 62 66 62 C 54 62 46 38 34 38 Z" fill="none" stroke="url(#jtcGrad)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="34" cy="50" r="4" fill="#ffffff" />
        <circle cx="66" cy="50" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // FTT - Futures Training Token
  if (normalizedSymbol === 'FTT') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="fttBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="fttGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#fttBg)" stroke="#60a5fa" strokeWidth="2" />
        <polygon points="50,20 78,54 44,54" fill="url(#fttGrad)" />
        <polygon points="50,80 22,46 56,46" fill="#3b82f6" opacity="0.85" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // AUR - Aurora Synth
  if (normalizedSymbol === 'AUR') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="aurBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>
          <linearGradient id="aurWaves" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#aurBg)" stroke="#34d399" strokeWidth="2" />
        <path d="M 20 60 Q 35 25 50 50 T 80 40" fill="none" stroke="url(#aurWaves)" strokeWidth="6" strokeLinecap="round" />
        <path d="M 20 70 Q 35 35 50 60 T 80 50" fill="none" stroke="url(#aurWaves)" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
      </svg>
    );
  }

  // VTX - Vortex Protocol
  if (normalizedSymbol === 'VTX') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="vtxBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>
          <linearGradient id="vtxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#vtxBg)" stroke="#06b6d4" strokeWidth="2" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="url(#vtxGrad)" strokeWidth="4" strokeDasharray="30 15" />
        <circle cx="50" cy="50" r="16" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="18 10" />
        <circle cx="50" cy="50" r="5" fill="#ffffff" />
      </svg>
    );
  }

  // NEX - Nexus Chain
  if (normalizedSymbol === 'NEX') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="nexBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#nexBg)" stroke="#38bdf8" strokeWidth="2" />
        <line x1="50" y1="22" x2="74" y2="64" stroke="#38bdf8" strokeWidth="2" />
        <line x1="74" y1="64" x2="26" y2="64" stroke="#38bdf8" strokeWidth="2" />
        <line x1="26" y1="64" x2="50" y2="22" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="50" cy="22" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="74" cy="64" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="26" cy="64" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill="#38bdf8" />
      </svg>
    );
  }

  // GLX - Galaxya Network
  if (normalizedSymbol === 'GLX') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="glxBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e1065" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#glxBg)" stroke="#c084fc" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="34" ry="12" fill="none" stroke="#f472b6" strokeWidth="3" transform="rotate(-30 50 50)" />
        <circle cx="50" cy="50" r="14" fill="#8b5cf6" />
        <circle cx="46" cy="46" r="3" fill="#ffffff" />
      </svg>
    );
  }

  // PHX - Phoenix Token
  if (normalizedSymbol === 'PHX') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="phxBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <linearGradient id="phxFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#phxBg)" stroke="#f97316" strokeWidth="2" />
        <path d="M 50 20 C 56 32 76 38 76 56 C 76 70 64 80 50 80 C 36 80 24 70 24 56 C 24 38 44 32 50 20 Z" fill="url(#phxFire)" />
        <path d="M 50 36 C 54 44 64 50 64 60 C 64 68 58 74 50 74 C 42 74 36 68 36 60 C 36 50 46 44 50 36 Z" fill="#fef08a" />
      </svg>
    );
  }

  // ZEL - Zeta Labs
  if (normalizedSymbol === 'ZEL') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="zelBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#022c22" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#zelBg)" stroke="#10b981" strokeWidth="2" />
        <polygon points="50,18 80,72 20,72" fill="none" stroke="#34d399" strokeWidth="3" />
        <polygon points="50,32 68,64 32,64" fill="#10b981" opacity="0.6" />
        <circle cx="50" cy="48" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // CRY - Crypto Alpha
  if (normalizedSymbol === 'CRY') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="cryBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#cryBg)" stroke="#a855f7" strokeWidth="2" />
        <polygon points="50,18 78,42 66,78 34,78 22,42" fill="none" stroke="#c084fc" strokeWidth="3" />
        <polygon points="50,28 68,46 60,70 40,70 32,46" fill="#a855f7" opacity="0.4" />
        <circle cx="50" cy="48" r="5" fill="#ffffff" />
      </svg>
    );
  }

  // ION - Ion Layer
  if (normalizedSymbol === 'ION') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="ionBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#083344" />
            <stop offset="100%" stopColor="#164e63" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#ionBg)" stroke="#06b6d4" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="30" ry="12" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="30" ry="12" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(-30 50 50)" />
        <circle cx="50" cy="50" r="8" fill="#06b6d4" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
      </svg>
    );
  }

  // NOVA - Nova Network
  if (normalizedSymbol === 'NOVA') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="novaBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c0519" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#novaBg)" stroke="#f43f5e" strokeWidth="2" />
        <path d="M 50 18 L 54 44 L 80 50 L 54 56 L 50 82 L 46 56 L 20 50 L 46 44 Z" fill="#fb7185" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // LYN - Lynx Protocol
  if (normalizedSymbol === 'LYN') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={`rounded-full shadow-sm flex-shrink-0 ${className}`} style={styleDim}>
        <defs>
          <linearGradient id="lynBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#lynBg)" stroke="#fbbf24" strokeWidth="2" />
        <polygon points="50,22 72,50 64,74 36,74 28,50" fill="#f59e0b" />
        <polygon points="50,34 62,54 38,54" fill="#ffffff" opacity="0.85" />
        <circle cx="50" cy="62" r="3" fill="#ffffff" />
      </svg>
    );
  }

  // 4. Remote Image Fetching via Official Open-Source CDNs
  const fallbackSources = [
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${normalizedSymbol.toLowerCase()}.svg`,
    `https://assets.coincap.io/assets/icons/${normalizedSymbol.toLowerCase()}@2x.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${normalizedSymbol.toLowerCase()}/logo.png`,
  ];

  if (!imageFailed && sourceIndex < fallbackSources.length) {
    const currentUrl = fallbackSources[sourceIndex];
    return (
      <img
        key={`${normalizedSymbol}-fallback-${sourceIndex}-${currentUrl}`}
        src={currentUrl}
        alt={`${normalizedSymbol} icon`}
        className={`rounded-full object-contain flex-shrink-0 ${className}`}
        style={styleDim}
        referrerPolicy="no-referrer"
        onError={() => {
          if (sourceIndex + 1 < fallbackSources.length) {
            setSourceIndex(prev => prev + 1);
          } else {
            setImageFailed(true);
          }
        }}
      />
    );
  }

  // 5. Clean geometric fallback badge
  const fallbackGradient = getGradientForSymbol(normalizedSymbol);
  const fallbackFontSize = size ? (normalizedSymbol.length > 3 ? size * 0.28 : size * 0.36) : 10;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 border border-white/20 select-none ${className}`}
      style={{
        ...styleDim,
        background: `linear-gradient(135deg, ${fallbackGradient.bg1}, ${fallbackGradient.bg2})`,
        fontSize: fallbackFontSize,
      }}
      title={normalizedSymbol}
    >
      <span className="leading-none tracking-tight drop-shadow font-sans">
        {normalizedSymbol.slice(0, 4)}
      </span>
    </div>
  );
};

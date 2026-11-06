export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  ftid: string | null;
  balance: number;
  futures_balance: number;
  staked_balance: number;
  kyc_status: KYCStatus;
  withdrawal_address?: string | null;
  force_win: boolean;
  force_loss: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAsset {
  id: string;
  user_id: string;
  symbol: string;
  amount: number;
  created_at: string;
}

export interface SpotOrder {
  id: string;
  userId: string;
  pair: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'CONVERT';
  price: number;
  amount: number;
  total: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  createdAt: string;
  filledAt?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  url: string;
  imageUrl?: string;
}

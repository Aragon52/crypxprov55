import { useState, useEffect, useCallback } from 'react';
import { ArrowDown, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { marketService } from '@/services/market';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CryptoIcon } from "./CryptoIcon";

const QuickConvert = () => {
  const { user } = useAuth();
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'LINK', 'DOT', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'PEPE', 'WIF', 'NEAR', 'APT'];

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketService.getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      if (fromAsset === 'USDT') {
        const { data } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        if (data) setUserBalance(data.balance || 0);
      } else {
        const { data } = await supabase.from('user_assets').select('amount').eq('user_id', user.id).eq('symbol', fromAsset).single();
        if (data) setUserBalance(data.amount || 0);
        else setUserBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch balance');
    }
  }, [user, fromAsset]);

  useEffect(() => {
    fetchPrices();
    if (user) fetchBalance();
    
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [user, fromAsset, fetchBalance, fetchPrices]);

  useEffect(() => {
    if (fromAmount && Object.keys(prices).length > 0) {
      const fromPrice = prices[fromAsset] || 1;
      const toPrice = prices[toAsset] || 1;
      const result = (Number(fromAmount) * fromPrice) / toPrice;
      setToAmount(result.toFixed(fromAsset === 'USDT' ? 8 : 2));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromAsset, toAsset, prices]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromAmount(val);
  };

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleConvert = async () => {
    if (!user) {
      toast.error('Please login to trade');
      return;
    }

    const amount = Number(fromAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setConverting(true);
    try {
      const destinationAmount = Number(toAmount);
      
      // 1. Deduct from source with direct live DB checking
      if (fromAsset === 'USDT') {
        const { data: prof } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        const currentBal = prof?.balance || 0;
        if (amount > currentBal) {
          throw new Error(`Insufficient USDT balance`);
        }
        await supabase.from('profiles').update({ balance: Math.max(0, currentBal - amount) }).eq('id', user.id);
      } else {
        const { data: dbAsset } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('symbol', fromAsset).maybeSingle();
        if (!dbAsset || amount > (dbAsset.amount || 0)) {
          throw new Error(`Insufficient ${fromAsset} balance`);
        }
        
        const currentAmount = Number(dbAsset.amount || 0);
        const newAmt = Math.max(0, currentAmount - amount);
        const dustValueInUSDT = newAmt * (prices[fromAsset] || 0);
        
        if (dustValueInUSDT < 0.01) {
          const { error: delErr } = await supabase.from('user_assets').delete().eq('user_id', user.id).eq('symbol', fromAsset);
          if (delErr) {
            console.error("Delete asset error:", delErr);
            throw new Error(`Failed to deduct source asset: ${delErr.message}`);
          }
        } else {
          const { error: updErr } = await supabase.from('user_assets').update({ amount: newAmt }).eq('user_id', user.id).eq('symbol', fromAsset);
          if (updErr) {
            console.error("Update asset error:", updErr);
            throw new Error(`Failed to deduct source asset: ${updErr.message}`);
          }
        }
      }

      // 2. Add to destination with direct live DB checking to prevent unique index duplicates
      if (toAsset === 'USDT') {
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        const { error: profUpdErr } = await supabase.from('profiles').update({ balance: (profile?.balance || 0) + destinationAmount }).eq('id', user.id);
        if (profUpdErr) throw new Error(`Failed to credit USDT: ${profUpdErr.message}`);
      } else {
        const { data: existingAsset, error: existingErr } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('symbol', toAsset).maybeSingle();
        if (existingErr && existingErr.code !== 'PGRST116') {
          console.error("Select asset error:", existingErr);
        }
        
        if (existingAsset) {
          const { error: updErr2 } = await supabase.from('user_assets').update({ amount: Number(existingAsset.amount || 0) + destinationAmount }).eq('user_id', user.id).eq('symbol', toAsset);
          if (updErr2) throw new Error(`Failed to credit destination asset: ${updErr2.message}`);
        } else {
          const { error: insErr } = await supabase.from('user_assets').insert({ user_id: user.id, symbol: toAsset, amount: destinationAmount });
          if (insErr) throw new Error(`Failed to initialize destination asset: ${insErr.message}`);
        }
      }

      toast.success(`Successfully converted ${fromAmount} ${fromAsset} to ${toAmount} ${toAsset}`, {
        icon: <CheckCircle2 className="text-green-500" />
      });
      
      setFromAmount('');
      setToAmount('');
      fetchBalance();
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-foreground">Quick Convert</h3>
        <button onClick={fetchPrices} className={`p-2 rounded-full hover:bg-muted transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2">
        {/* From Section */}
        <div className="bg-muted/50 rounded-2xl p-4 border border-transparent focus-within:border-primary/30 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From</span>
            <span className="text-xs text-muted-foreground">Available: <span className="text-foreground font-bold">{userBalance.toFixed(fromAsset === 'USDT' ? 2 : 6)} {fromAsset}</span></span>
          </div>
          <div className="flex gap-4">
            <input
              type="number"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="0.00"
              className="bg-transparent border-none outline-none text-2xl font-bold w-full text-foreground max-w-[120px]"
            />
            <div className="flex bg-card border border-border rounded-xl ml-auto">
              <div className="pl-3 flex items-center pointer-events-none">
                <CryptoIcon symbol={fromAsset} size={20} />
              </div>
              <select
                value={fromAsset}
                onChange={(e) => setFromAsset(e.target.value)}
                className="bg-transparent pl-2 pr-3 py-1 text-sm font-bold text-foreground outline-none"
              >
                {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapAssets}
            className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform active:rotate-180"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* To Section */}
        <div className="bg-muted/50 rounded-2xl p-4 border border-transparent focus-within:border-primary/30 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To (Estimated)</span>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="bg-transparent border-none outline-none text-2xl font-bold w-full text-foreground max-w-[120px]"
            />
            <div className="flex bg-card border border-border rounded-xl ml-auto">
              <div className="pl-3 flex items-center pointer-events-none">
                <CryptoIcon symbol={toAsset} size={20} />
              </div>
              <select
                value={toAsset}
                onChange={(e) => setToAsset(e.target.value)}
                className="bg-transparent pl-2 pr-3 py-1 text-sm font-bold text-foreground outline-none"
              >
                {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-muted-foreground">Exchange Rate</span>
          <span className="text-foreground font-medium">1 {fromAsset} ≈ {(prices[fromAsset] / (prices[toAsset] || 1)).toFixed(6)} {toAsset}</span>
        </div>

        <button
          onClick={handleConvert}
          disabled={converting || !fromAmount || Number(fromAmount) <= 0}
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-brand hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {converting ? (
            <><RefreshCw className="animate-spin" size={20} /> Processing...</>
          ) : (
            'Convert Assets'
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center px-4 leading-normal">
          <AlertCircle size={10} className="inline mr-1" />
          The actual conversion rate may vary slightly due to market volatility. Zero fees applied.
        </p>
      </div>
    </div>
  );
};

export default QuickConvert;

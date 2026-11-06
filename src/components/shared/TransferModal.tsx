import { useState, useEffect, useCallback } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CryptoIcon } from "./CryptoIcon";

interface TransferModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultDirection?: "spot_to_futures" | "futures_to_spot";
}

export const TransferModal = ({ onClose, onSuccess, defaultDirection = "spot_to_futures" }: TransferModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"spot_to_futures" | "futures_to_spot">(defaultDirection);
  const [loading, setLoading] = useState(false);
  const [spotBalance, setSpotBalance] = useState(0);
  const [futuresBalance, setFuturesBalance] = useState(0);

  const fetchBalances = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("balance, futures_balance")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setSpotBalance(data.balance || 0);
        setFuturesBalance(data.futures_balance || 0);
      }
    } catch (err) {
      console.error("Failed to fetch balances", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user, fetchBalances]);

  const handleTransfer = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const transferAmount = Number(amount);
    
    // Validate balance
    if (direction === "spot_to_futures" && transferAmount > spotBalance) {
      toast.error("Insufficient Spot balance");
      return;
    }
    
    if (direction === "futures_to_spot" && transferAmount > futuresBalance) {
      toast.error("Insufficient Futures balance");
      return;
    }

    setLoading(true);

    try {
      const newSpotBalance = direction === "spot_to_futures" ? spotBalance - transferAmount : spotBalance + transferAmount;
      const newFuturesBalance = direction === "spot_to_futures" ? futuresBalance + transferAmount : futuresBalance - transferAmount;

      const { error } = await supabase
        .from("profiles")
        .update({
          balance: newSpotBalance,
          futures_balance: newFuturesBalance
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Transfer successful");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-foreground">Internal Transfer</h3>
            <button
              onClick={onClose}
              className="p-2 bg-muted hover:bg-accent rounded-full transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Direction Toggle */}
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">From</p>
                <p className="font-bold text-foreground">{direction === "spot_to_futures" ? "Spot Wallet" : "Futures Wallet"}</p>
              </div>
              <button 
                onClick={() => setDirection(d => d === "spot_to_futures" ? "futures_to_spot" : "spot_to_futures")}
                className="w-10 h-10 bg-primary/10 text-primary hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              >
                <ArrowRightLeft size={16} />
              </button>
              <div className="flex-1 text-right">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">To</p>
                <p className="font-bold text-foreground">{direction === "spot_to_futures" ? "Futures Wallet" : "Spot Wallet"}</p>
              </div>
            </div>

            {/* Asset Info */}
            <div className="bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <CryptoIcon symbol="USDT" size={32} />
                <div className="flex-1">
                  <h4 className="font-bold text-foreground">USDT</h4>
                  <p className="text-xs text-muted-foreground">Tether US</p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-muted-foreground">Amount</label>
                <span className="text-xs text-muted-foreground">
                  Available: <span className="text-foreground font-bold">{(direction === "spot_to_futures" ? spotBalance : futuresBalance).toFixed(2)} USDT</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl py-3 px-4 outline-none transition-all pr-16 font-mono"
                />
                <button 
                  onClick={() => setAmount((direction === "spot_to_futures" ? spotBalance : futuresBalance).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded-md"
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              onClick={handleTransfer}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-brand flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

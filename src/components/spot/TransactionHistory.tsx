import React, { useState } from 'react';
import { History, Clock, FileText, CheckCircle2, XCircle, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import type { SpotOrder } from '@/types';

interface TransactionHistoryProps {
  orders: SpotOrder[];
  onCancelOrder: (orderId: string) => void;
  onClearHistory?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  orders,
  onCancelOrder,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'trades'>('open');

  const openOrders = orders.filter(o => o.status === 'OPEN');
  const completedOrders = orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED');

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 transition-all border-b-2 ${
              activeTab === 'open'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Clock size={14} />
            <span>Open Orders</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-primary/10 text-primary rounded-full font-mono font-bold">
              {openOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 transition-all border-b-2 ${
              activeTab === 'history'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <History size={14} />
            <span>Order & Transaction History</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-muted text-muted-foreground rounded-full font-mono font-bold">
              {completedOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 transition-all border-b-2 ${
              activeTab === 'trades'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <FileText size={14} />
            <span>Trade Log</span>
          </button>
        </div>

        {completedOrders.length > 0 && activeTab === 'history' && onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 bg-muted/60 hover:bg-destructive/10 px-2 py-1 rounded-lg border border-border transition-colors"
          >
            <Trash2 size={11} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[160px] overflow-x-auto">
        {/* 1. OPEN ORDERS TAB */}
        {activeTab === 'open' && (
          openOrders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground space-y-1">
              <Clock size={28} className="mx-auto opacity-30" />
              <p className="text-xs font-bold">No active open orders</p>
              <p className="text-[10px] opacity-70">Limit orders you place will appear here until filled or cancelled.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Pair</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Side</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-right">Total (USDT)</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs font-mono font-medium">
                {openOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-2 text-muted-foreground text-[11px] font-sans">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-foreground font-sans">{order.pair}</td>
                    <td className="py-2.5 px-2 font-sans text-[10px] font-bold text-muted-foreground uppercase">{order.type}</td>
                    <td className="py-2.5 px-2 font-black font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">
                      ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-foreground">{order.amount.toFixed(4)} {order.symbol}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">${order.total.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => onCancelOrder(order.id)}
                        className="px-2.5 py-1 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg text-[10px] font-bold transition-all border border-destructive/20"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* 2. ORDER & TRANSACTION HISTORY TAB */}
        {activeTab === 'history' && (
          completedOrders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground space-y-1">
              <History size={28} className="mx-auto opacity-30" />
              <p className="text-xs font-bold">No transaction history yet</p>
              <p className="text-[10px] opacity-70">Completed buys, sells, and conversions will be logged here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 px-2">Date & Time</th>
                  <th className="py-2 px-2">Pair</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Side</th>
                  <th className="py-2 px-2 text-right">Executed Price</th>
                  <th className="py-2 px-2 text-right">Executed Amount</th>
                  <th className="py-2 px-2 text-right">Total Value</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs font-mono font-medium">
                {completedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-2 text-muted-foreground text-[11px] font-sans">
                      {new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-foreground font-sans">{order.pair}</td>
                    <td className="py-2.5 px-2 font-sans text-[10px] font-bold text-muted-foreground uppercase">{order.type}</td>
                    <td className="py-2.5 px-2 font-black font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        order.side === 'BUY' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : order.side === 'SELL' 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-primary/10 text-primary'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">
                      ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-foreground">{order.amount.toFixed(4)} {order.symbol}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">${order.total.toFixed(2)} USDT</td>
                    <td className="py-2.5 px-2 text-center font-sans">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'FILLED' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {order.status === 'FILLED' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {order.status === 'FILLED' ? 'Filled' : 'Cancelled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* 3. TRADE LOG TAB */}
        {activeTab === 'trades' && (
          orders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground space-y-1">
              <FileText size={28} className="mx-auto opacity-30" />
              <p className="text-xs font-bold">No trades recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="p-2.5 bg-muted/40 border border-border/80 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {order.side === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <div className="font-bold text-foreground font-sans">
                        {order.side} {order.amount.toFixed(4)} {order.symbol} @ ${order.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-sans">
                        {order.pair} • {order.type} Order • {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-foreground">${order.total.toFixed(2)} USDT</div>
                    <div className="text-[10px] text-emerald-500 font-bold uppercase">Spot Settlement Executed</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

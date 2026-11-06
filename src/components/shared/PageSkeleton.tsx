import React from 'react';
import { useLocation } from 'react-router-dom';

interface PageSkeletonProps {
  variant?: 'home' | 'market' | 'spot' | 'futures' | 'earn' | 'assets' | 'trade-fi' | 'general';
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant }) => {
  const location = useLocation();

  const getEffectiveVariant = () => {
    if (variant) return variant;
    const path = location.pathname;
    if (path.includes('/app/market')) return 'market';
    if (path.includes('/app/spot')) return 'spot';
    if (path.includes('/app/futures')) return 'futures';
    if (path.includes('/app/earn')) return 'earn';
    if (path.includes('/app/assets')) return 'assets';
    if (path.includes('/app/trade-fi')) return 'trade-fi';
    if (path.includes('/app/home')) return 'home';
    return 'general';
  };

  const effective = getEffectiveVariant();

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] p-4 md:p-6 space-y-6 animate-pulse select-none max-w-7xl mx-auto">
      {effective === 'home' && <HomeSkeleton />}
      {effective === 'market' && <MarketSkeleton />}
      {effective === 'spot' && <SpotSkeleton />}
      {effective === 'futures' && <FuturesSkeleton />}
      {effective === 'earn' && <EarnSkeleton />}
      {effective === 'assets' && <AssetsSkeleton />}
      {effective === 'trade-fi' && <TradeFiSkeleton />}
      {effective === 'general' && <GeneralSkeleton />}
    </div>
  );
};

// Sub-skeletons matching actual page geometry:

const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted/60 dark:bg-card/40 rounded-xl relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
  </div>
);

const HomeSkeleton = () => (
  <div className="space-y-6">
    {/* Top User Bar */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shimmer className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="w-32 h-4" />
          <Shimmer className="w-20 h-3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Shimmer className="w-9 h-9 rounded-xl" />
        <Shimmer className="w-9 h-9 rounded-xl" />
      </div>
    </div>

    {/* Big Hero / Balance Card */}
    <div className="p-6 rounded-3xl border border-border/60 bg-card/60 space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <Shimmer className="w-28 h-3" />
        <Shimmer className="w-16 h-4 rounded-full" />
      </div>
      <Shimmer className="w-56 h-9" />
      <div className="grid grid-cols-4 gap-3 pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Shimmer className="w-12 h-12 rounded-2xl" />
            <Shimmer className="w-12 h-2.5" />
          </div>
        ))}
      </div>
    </div>

    {/* Market Ticker Marquee Row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 rounded-2xl border border-border/50 bg-card/40 space-y-2">
          <div className="flex justify-between items-center">
            <Shimmer className="w-16 h-4" />
            <Shimmer className="w-10 h-3 rounded-full" />
          </div>
          <Shimmer className="w-24 h-6" />
          <Shimmer className="w-14 h-3" />
        </div>
      ))}
    </div>

    {/* Section List */}
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-center px-1">
        <Shimmer className="w-32 h-5" />
        <Shimmer className="w-16 h-4" />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-4 rounded-2xl border border-border/40 bg-card/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-12 h-3" />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <Shimmer className="w-24 h-4 ml-auto" />
            <Shimmer className="w-16 h-3.5 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MarketSkeleton = () => (
  <div className="space-y-5">
    {/* Header & Tabs */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <Shimmer className="w-36 h-7" />
        <Shimmer className="w-56 h-3.5" />
      </div>
      <Shimmer className="w-full sm:w-64 h-10 rounded-2xl" />
    </div>

    {/* Tab Pills */}
    <div className="flex gap-2 overflow-x-auto pb-1">
      {['All', 'Spot', 'Futures', 'Gainers', 'Volume'].map((_, i) => (
        <Shimmer key={i} className="w-20 h-9 rounded-xl shrink-0" />
      ))}
    </div>

    {/* Top 3 Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card/50 space-y-3">
          <div className="flex items-center gap-2">
            <Shimmer className="w-8 h-8 rounded-full" />
            <Shimmer className="w-20 h-4" />
          </div>
          <Shimmer className="w-32 h-6" />
          <div className="flex justify-between items-center pt-2">
            <Shimmer className="w-16 h-3" />
            <Shimmer className="w-14 h-4 rounded-md" />
          </div>
        </div>
      ))}
    </div>

    {/* Table Rows */}
    <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-3">
      <div className="flex justify-between px-2 pb-2 border-b border-border/40">
        <Shimmer className="w-20 h-3" />
        <Shimmer className="w-20 h-3" />
        <Shimmer className="w-20 h-3 hidden sm:block" />
        <Shimmer className="w-20 h-3" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="flex items-center justify-between py-2.5 px-2">
          <div className="flex items-center gap-3">
            <Shimmer className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Shimmer className="w-16 h-4" />
              <Shimmer className="w-10 h-2.5" />
            </div>
          </div>
          <Shimmer className="w-20 h-4" />
          <Shimmer className="w-24 h-4 hidden sm:block" />
          <Shimmer className="w-16 h-6 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

const SpotSkeleton = () => (
  <div className="space-y-4">
    {/* Ticker Bar */}
    <div className="p-4 rounded-2xl border border-border/60 bg-card/50 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Shimmer className="w-28 h-5" />
          <Shimmer className="w-20 h-3" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="space-y-1"><Shimmer className="w-12 h-2.5" /><Shimmer className="w-16 h-4" /></div>
        <div className="space-y-1"><Shimmer className="w-12 h-2.5" /><Shimmer className="w-16 h-4" /></div>
        <div className="space-y-1 hidden sm:block"><Shimmer className="w-12 h-2.5" /><Shimmer className="w-16 h-4" /></div>
      </div>
    </div>

    {/* Chart & Orderbook Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Chart Window */}
        <div className="p-4 rounded-2xl border border-border/50 bg-card/40 h-[380px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => <Shimmer key={i} className="w-10 h-6 rounded-md" />)}
            </div>
            <Shimmer className="w-20 h-6 rounded-md" />
          </div>
          <div className="space-y-2 py-8">
            <Shimmer className="w-full h-40 rounded-xl" />
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} className="w-12 h-3" />)}
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-4 rounded-2xl border border-border/50 bg-card/40 space-y-3">
          <div className="flex gap-4 border-b border-border/40 pb-2">
            <Shimmer className="w-24 h-4" />
            <Shimmer className="w-24 h-4" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2">
              <Shimmer className="w-28 h-3.5" />
              <Shimmer className="w-20 h-3.5" />
              <Shimmer className="w-16 h-3.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Trade Form Panel */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border border-border/60 bg-card/50 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Shimmer className="h-10 rounded-xl" />
            <Shimmer className="h-10 rounded-xl" />
          </div>
          <div className="space-y-3 pt-2">
            <Shimmer className="w-full h-11 rounded-xl" />
            <Shimmer className="w-full h-11 rounded-xl" />
            <div className="flex justify-between pt-1">
              {[1, 2, 3, 4].map(i => <Shimmer key={i} className="w-12 h-6 rounded" />)}
            </div>
            <Shimmer className="w-full h-12 rounded-xl mt-4" />
          </div>
        </div>

        {/* Mini Order Book */}
        <div className="p-4 rounded-2xl border border-border/50 bg-card/40 space-y-2">
          <Shimmer className="w-24 h-4 mb-2" />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex justify-between">
              <Shimmer className="w-16 h-3" />
              <Shimmer className="w-14 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FuturesSkeleton = () => (
  <div className="space-y-4">
    {/* Futures Header */}
    <div className="p-4 rounded-2xl border border-border/60 bg-card/50 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Shimmer className="w-32 h-5" />
          <Shimmer className="w-24 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Shimmer className="w-24 h-8 rounded-xl" />
        <Shimmer className="w-24 h-8 rounded-xl" />
      </div>
    </div>

    {/* Chart & Quick Contract Panel */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="p-4 rounded-2xl border border-border/50 bg-card/40 h-[360px] flex flex-col justify-between">
          <Shimmer className="w-40 h-6" />
          <Shimmer className="w-full h-44 rounded-xl" />
          <div className="flex justify-between">
            {[1, 2, 3, 4].map(i => <Shimmer key={i} className="w-14 h-3" />)}
          </div>
        </div>

        {/* Positions History Tab */}
        <div className="p-4 rounded-2xl border border-border/50 bg-card/40 space-y-3">
          <div className="flex gap-4 border-b border-border/40 pb-2">
            <Shimmer className="w-28 h-5" />
            <Shimmer className="w-28 h-5" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-xl border border-border/30 bg-muted/20 flex justify-between items-center">
              <div className="space-y-1">
                <Shimmer className="w-24 h-4" />
                <Shimmer className="w-16 h-3" />
              </div>
              <Shimmer className="w-20 h-5" />
            </div>
          ))}
        </div>
      </div>

      {/* Contract Controls */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card/50 space-y-4">
        <Shimmer className="w-32 h-4" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <Shimmer key={i} className="h-9 rounded-xl" />)}
        </div>
        <div className="space-y-2 pt-2">
          <Shimmer className="w-full h-11 rounded-xl" />
          <Shimmer className="w-full h-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <Shimmer className="h-14 rounded-2xl" />
          <Shimmer className="h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const EarnSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Shimmer className="w-40 h-7" />
        <Shimmer className="w-64 h-3.5" />
      </div>
      <Shimmer className="w-28 h-10 rounded-2xl" />
    </div>

    {/* Yield Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-6 rounded-3xl border border-border/60 bg-card/50 space-y-3">
        <Shimmer className="w-28 h-3" />
        <Shimmer className="w-48 h-8" />
        <Shimmer className="w-32 h-3" />
      </div>
      <div className="p-6 rounded-3xl border border-border/60 bg-card/50 space-y-3">
        <Shimmer className="w-28 h-3" />
        <Shimmer className="w-48 h-8" />
        <Shimmer className="w-32 h-3" />
      </div>
    </div>

    {/* Vault Offers List */}
    <div className="space-y-3">
      <Shimmer className="w-36 h-5" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Shimmer className="w-24 h-4" />
              <Shimmer className="w-16 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1"><Shimmer className="w-14 h-3" /><Shimmer className="w-16 h-5" /></div>
            <div className="space-y-1"><Shimmer className="w-14 h-3" /><Shimmer className="w-16 h-5" /></div>
            <Shimmer className="w-24 h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AssetsSkeleton = () => (
  <div className="space-y-6">
    {/* Total Portfolio Value Box */}
    <div className="p-6 rounded-3xl border border-border/60 bg-card/60 space-y-4">
      <div className="flex justify-between items-center">
        <Shimmer className="w-36 h-3.5" />
        <Shimmer className="w-8 h-8 rounded-full" />
      </div>
      <Shimmer className="w-64 h-10" />
      <div className="grid grid-cols-4 gap-3 pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Shimmer className="w-12 h-12 rounded-2xl" />
            <Shimmer className="w-14 h-3" />
          </div>
        ))}
      </div>
    </div>

    {/* Breakdown Tabs */}
    <div className="flex gap-2">
      {['Spot', 'Futures', 'Earn'].map((_, i) => (
        <Shimmer key={i} className="w-24 h-9 rounded-xl" />
      ))}
    </div>

    {/* Asset Holdings */}
    <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-3">
      <div className="flex justify-between pb-2 border-b border-border/30">
        <Shimmer className="w-20 h-3" />
        <Shimmer className="w-20 h-3" />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-12 h-3" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Shimmer className="w-24 h-4 ml-auto" />
            <Shimmer className="w-16 h-3 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TradeFiSkeleton = () => (
  <div className="space-y-6 max-w-4xl mx-auto py-4">
    <div className="text-center space-y-2">
      <Shimmer className="w-48 h-8 mx-auto" />
      <Shimmer className="w-72 h-4 mx-auto" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      {[1, 2].map(i => (
        <div key={i} className="p-6 rounded-3xl border border-border/60 bg-card/50 space-y-4">
          <Shimmer className="w-14 h-14 rounded-2xl" />
          <Shimmer className="w-36 h-6" />
          <Shimmer className="w-full h-12 rounded-xl" />
          <Shimmer className="w-full h-12 rounded-2xl mt-4" />
        </div>
      ))}
    </div>
  </div>
);

const GeneralSkeleton = () => (
  <div className="space-y-5">
    <div className="flex justify-between items-center">
      <Shimmer className="w-40 h-7" />
      <Shimmer className="w-24 h-9 rounded-xl" />
    </div>
    <div className="p-6 rounded-3xl border border-border/60 bg-card/50 space-y-4">
      <Shimmer className="w-full h-32 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl border border-border/50 bg-card/40 space-y-3">
        <Shimmer className="w-full h-24 rounded-xl" />
      </div>
      <div className="p-5 rounded-2xl border border-border/50 bg-card/40 space-y-3">
        <Shimmer className="w-full h-24 rounded-xl" />
      </div>
    </div>
  </div>
);

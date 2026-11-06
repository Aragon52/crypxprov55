import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Spot from './Spot';
import Futures from './Futures';
import { motion, AnimatePresence } from 'motion/react';

const TradeFi = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'futures' ? 'futures' : 'spot';
  const [activeTab, setActiveTab] = useState<'spot' | 'futures'>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'futures' || tab === 'spot') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'spot' | 'futures') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-background pt-4">
      {/* Navigation Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-8 border-b border-border">
          <button
            onClick={() => handleTabChange('spot')}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'spot' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Spot Trading
            {activeTab === 'spot' && (
              <motion.div
                layoutId="trade-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
              />
            )}
          </button>
          <button
            onClick={() => handleTabChange('futures')}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'futures' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Futures Markets
            {activeTab === 'futures' && (
              <motion.div
                layoutId="trade-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
              />
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'spot' ? (
            <motion.div
              key="spot-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Spot />
            </motion.div>
          ) : (
            <motion.div
              key="futures-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Futures />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeFi;

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, UTCTimestamp } from 'lightweight-charts';
import { marketService } from '@/services/market';

interface TradingChartProps {
  symbol?: string;
  pair?: string;
  className?: string;
  theme?: 'light' | 'dark';
  interval?: string;
}

const TradingChart = ({ symbol, pair, className = "h-64", theme, interval = '1h' }: TradingChartProps) => {
  const activePair = pair || symbol || 'BTC/USDT';
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    setLoading(true);
    let isMounted = true;

    const currentTheme = theme || (isDark ? 'dark' : 'light');
    const isActuallyDark = currentTheme === 'dark';
    const backgroundColor = isActuallyDark ? '#0a0b0d' : '#ffffff';
    const textColor = isActuallyDark ? '#e6e8ea' : '#2d4a7a';
    const gridColor = isActuallyDark ? '#1e2a3a' : '#e8ecf0';

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: backgroundColor }, 
        textColor,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: { 
        vertLines: { color: gridColor, style: 1 }, 
        horzLines: { color: gridColor, style: 1 } 
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: interval === '5s',
        borderColor: isActuallyDark ? '#2b2f36' : '#e8ecf0',
      },
      rightPriceScale: {
        borderColor: isActuallyDark ? '#2b2f36' : '#e8ecf0',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00c087',
      downColor: '#ff4d6d',
      borderVisible: false,
      wickUpColor: '#00c087',
      wickDownColor: '#ff4d6d',
    });

    const stepMap: Record<string, number> = {
      '5s': 5,
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    const step = stepMap[interval] || 3600;

    let lastCandle: any = null;

    marketService.getHistoricalData(activePair, interval, 100).then((data) => {
      if (isMounted) {
        const formatted = data.map(d => ({ ...d, time: d.time as UTCTimestamp }));
        candlestickSeries.setData(formatted);
        if (formatted.length > 0) {
          lastCandle = { ...formatted[formatted.length - 1] };
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    const unsubscribe = marketService.subscribeToTicker(activePair, (priceValue) => {
      if (!isMounted || !candlestickSeries) return;
      
      const nowSec = Math.floor(Date.now() / 1000);
      const candleTime = (Math.floor(nowSec / step) * step) as UTCTimestamp;
      
      if (lastCandle && candleTime < lastCandle.time) {
        // Safe guard against clock skew or misaligned timestamps
        return;
      }
      
      if (lastCandle && lastCandle.time === candleTime) {
        // Update existing candle
        lastCandle.close = priceValue;
        lastCandle.high = Math.max(lastCandle.high, priceValue);
        lastCandle.low = Math.min(lastCandle.low, priceValue);
        candlestickSeries.update(lastCandle);
      } else {
        // Create new candle
        const openPrice = lastCandle ? lastCandle.close : priceValue;
        const newCandle = {
          time: candleTime,
          open: openPrice,
          high: Math.max(openPrice, priceValue),
          low: Math.min(openPrice, priceValue),
          close: priceValue
        };
        lastCandle = newCandle;
        candlestickSeries.update(newCandle);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && isMounted) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      unsubscribe();
    };
  }, [activePair, theme, interval, isDark]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-inherit opacity-80">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default TradingChart;

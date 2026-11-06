import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface PageLoadingOverlayProps {
  isLoading?: boolean;
  message?: string;
  showTopBarOnly?: boolean;
}

export const PageLoadingOverlay = ({
  isLoading: explicitLoading,
  message = "Updating market data...",
  showTopBarOnly = false,
}: PageLoadingOverlayProps) => {
  const location = useLocation();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger smooth top laser progress on route transition
    setNavigating(true);
    setProgress(20);

    const t1 = setTimeout(() => setProgress(65), 100);
    const t2 = setTimeout(() => setProgress(100), 300);
    const t3 = setTimeout(() => {
      setNavigating(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  const showBar = navigating || explicitLoading;

  return (
    <>
      {/* Top glowing laser progress bar */}
      {showBar && (
        <div className="fixed top-0 left-0 right-0 z-[999] h-[2.5px] bg-transparent overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-primary to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-300 ease-out"
            style={{
              width: explicitLoading ? '85%' : `${progress}%`,
              transitionProperty: 'width, opacity',
            }}
          />
        </div>
      )}

      {/* Optional translucent overlay spinner when explicit async refresh happens */}
      {explicitLoading && !showTopBarOnly && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-all duration-200">
          <div className="bg-card/95 border border-border/80 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <span className="text-xs font-semibold tracking-wide text-foreground/90">{message}</span>
          </div>
        </div>
      )}
    </>
  );
};

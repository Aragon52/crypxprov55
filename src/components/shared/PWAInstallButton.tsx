import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, ChevronRight, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'badge' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // If already installed and running as standalone, don't display
  if (isInstalled) {
    return null;
  }

  // Banner variant
  if (variant === 'banner' && !dismissedBanner && (isInstallable || isIOS)) {
    return (
      <div className={`relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
              Install CrypX-Pro PWA
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              Instant access from home screen, offline caching, and faster execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} />
              Install
            </button>
          ) : isIOS ? (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold rounded-xl transition-all"
            >
              iOS Install
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setDismissedBanner(true)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="relative max-w-sm w-full bg-card rounded-3xl p-6 border border-border shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-primary" size={20} />
                  <h3 className="text-base font-bold text-foreground">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <p>Tap the <strong className="text-foreground flex items-center gap-1 inline-flex"><Share2 size={12} className="text-primary inline" /> Share</strong> icon in Safari toolbar at the bottom.</p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <p>Scroll down and tap <strong className="text-foreground flex items-center gap-1 inline-flex"><PlusSquare size={12} className="text-primary inline" /> Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <p>Tap <strong className="text-foreground">Add</strong> in the top right to launch full-screen CrypX-Pro.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact / Button variant
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all ${className}`}
      >
        <Download size={13} />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all ${className}`}
        >
          <Smartphone size={13} />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="relative max-w-sm w-full bg-card rounded-3xl p-6 border border-border shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-primary" size={20} />
                  <h3 className="text-base font-bold text-foreground">Install on iOS</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <p>Tap the <strong className="text-foreground inline-flex items-center gap-1"><Share2 size={12} className="text-primary" /> Share</strong> button in Safari.</p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <p>Select <strong className="text-foreground inline-flex items-center gap-1"><PlusSquare size={12} className="text-primary" /> Add to Home Screen</strong>.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
export default PWAInstallButton;

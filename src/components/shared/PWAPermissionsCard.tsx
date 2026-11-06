import React, { useState } from 'react';
import {
  HardDrive,
  Camera,
  Bell,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  RefreshCw,
  Zap,
  Info,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { usePWAPermissions } from '@/hooks/usePWAPermissions';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

interface PWAPermissionsCardProps {
  className?: string;
  onOpenModal?: () => void;
}

export const PWAPermissionsCard: React.FC<PWAPermissionsCardProps> = ({ className = '', onOpenModal }) => {
  const {
    storagePersisted,
    storageEstimate,
    cameraStatus,
    notificationStatus,
    wakeLockActive,
    wakeLockSupported,
    isStandalonePWA,
    requestPersistentStorage,
    requestCameraAccess,
    requestNotificationPermission,
    enableWakeLock,
    disableWakeLock,
    grantAllRecommended,
    refreshPermissions
  } = usePWAPermissions();

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGrantAll = async () => {
    setIsProcessing(true);
    try {
      const results = await grantAllRecommended();
      if (results.storage) {
        toast.success('Persistent storage granted. Local cache and charts protected.');
      }
      if (results.notifications) {
        toast.success('Push notifications enabled for order and account alerts.');
      }
      if (results.camera) {
        toast.success('Camera access enabled for KYC & receipt uploads.');
      }
      if (results.wakeLock) {
        toast.success('Screen Wake Lock active during live trading.');
      }
    } catch (err: any) {
      toast.error('Permission request notice: ' + (err.message || 'Complete manual selection below'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await disableWakeLock();
      toast.info('Screen wake lock turned off.');
    } else {
      const ok = await enableWakeLock();
      if (ok) {
        toast.success('Screen wake lock active: Screen will stay awake during trading.');
      } else {
        toast.error('Wake lock is not supported on this browser/tab.');
      }
    }
  };

  const allGranted =
    storagePersisted &&
    notificationStatus === 'granted' &&
    cameraStatus === 'granted';

  return (
    <div className={`bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Smartphone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">PWA & Device System Permissions</h3>
              {isStandalonePWA && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Installed App Mode
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Storage persistence, camera access, push notifications, and screen awake controls for peak performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => refreshPermissions()}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh permissions status"
          >
            <RefreshCw size={16} />
          </button>
          {!allGranted && (
            <button
              type="button"
              onClick={handleGrantAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Sparkles size={14} />
              {isProcessing ? 'Optimizing...' : 'Optimize All Permissions'}
            </button>
          )}
        </div>
      </div>

      {/* Quick PWA Install Banner if in browser */}
      {!isInstalled && isInstallable && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Smartphone className="text-blue-400 shrink-0" size={20} />
            <div>
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Install CrypX-Pro as Desktop/Mobile App</h4>
              <p className="text-xs text-blue-200/80">Get standalone native window performance, offline caching, and instant launch from home screen.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={install}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Install PWA
          </button>
        </div>
      )}

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Persistent Storage & Quota */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="text-primary" size={18} />
              <h4 className="text-sm font-bold text-foreground">Storage Durability & Quota</h4>
            </div>
            {storagePersisted ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Protected
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={12} /> Temporary
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Prevents the browser from clearing your cached trading data, offline wallets, and account preferences during storage cleanups.
          </p>

          {/* Storage Quota Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Space Used: <strong className="text-foreground">{storageEstimate.usageFormatted}</strong></span>
              <span className="text-muted-foreground">Quota: <strong className="text-foreground">{storageEstimate.quotaFormatted}</strong></span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${Math.max(2, storageEstimate.usagePercent)}%` }}
              />
            </div>
          </div>

          {!storagePersisted && (
            <button
              type="button"
              onClick={async () => {
                const ok = await requestPersistentStorage();
                if (ok) toast.success('Persistent storage granted!');
                else toast.info('Storage mode requested from browser.');
              }}
              className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-xl transition-colors mt-2"
            >
              Enable Storage Protection
            </button>
          )}
        </div>

        {/* 2. Camera & Photo Upload Permissions */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="text-purple-400" size={18} />
                <h4 className="text-sm font-bold text-foreground">Camera & Document Capture</h4>
              </div>
              {cameraStatus === 'granted' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Granted
                </span>
              ) : cameraStatus === 'denied' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> Denied
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> On-Demand
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Allows direct camera capture when submitting KYC identity documents (Passport, National ID, Selfie) and attaching deposit receipts.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await requestCameraAccess();
              if (ok) toast.success('Camera access granted and verified.');
              else toast.error('Camera access was not granted or declined in browser settings.');
            }}
            className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-xl transition-colors"
          >
            {cameraStatus === 'granted' ? 'Test Camera Access' : 'Grant Camera Permission'}
          </button>
        </div>

        {/* 3. Push Notifications */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="text-amber-400" size={18} />
                <h4 className="text-sm font-bold text-foreground">Trade & Account Notifications</h4>
              </div>
              {notificationStatus === 'granted' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Enabled
                </span>
              ) : notificationStatus === 'denied' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> Blocked
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> Disabled
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive instant alerts for order fill confirmations, liquidation warnings, deposit approvals, and support messages.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const res = await requestNotificationPermission();
              if (res === 'granted') toast.success('Notifications enabled!');
              else if (res === 'denied') toast.error('Notifications blocked by browser setting.');
              else toast.info('Notification permission: ' + res);
            }}
            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl transition-colors"
          >
            {notificationStatus === 'granted' ? 'Notification Alerts Active' : 'Enable Notification Alerts'}
          </button>
        </div>

        {/* 4. Screen Wake Lock (Live Trading Mode) */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sun className="text-emerald-400" size={18} />
                <h4 className="text-sm font-bold text-foreground">Screen Wake Lock (Live Charts)</h4>
              </div>
              {wakeLockActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <Zap size={12} /> Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-bold">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Keeps your display active and prevents sleep/dimming while watching live candlestick charts and order books.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleWakeLock}
            disabled={!wakeLockSupported}
            className={`w-full py-2 text-xs font-bold rounded-xl transition-colors border ${
              wakeLockActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {wakeLockActive ? 'Turn Off Wake Lock' : 'Keep Screen Awake (Live Mode)'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PWAPermissionsCard;

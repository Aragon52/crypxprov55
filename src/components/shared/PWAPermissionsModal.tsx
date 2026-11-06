import React, { useState } from 'react';
import {
  X,
  Smartphone,
  HardDrive,
  Camera,
  Bell,
  Sun,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { usePWAPermissions } from '@/hooks/usePWAPermissions';
import { toast } from 'sonner';

interface PWAPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAPermissionsModal: React.FC<PWAPermissionsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    storagePersisted,
    storageEstimate,
    cameraStatus,
    notificationStatus,
    wakeLockActive,
    requestPersistentStorage,
    requestCameraAccess,
    requestNotificationPermission,
    enableWakeLock,
    disableWakeLock,
    grantAllRecommended
  } = usePWAPermissions();

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleGrantAll = async () => {
    setIsProcessing(true);
    try {
      const results = await grantAllRecommended();
      if (results.storage) toast.success('Persistent storage granted!');
      if (results.notifications) toast.success('Notifications enabled!');
      if (results.camera) toast.success('Camera permission granted!');
      if (results.wakeLock) toast.success('Screen wake lock active!');
      toast.success('All device and PWA permissions optimized.');
      onClose();
    } catch (err: any) {
      toast.error('Permission setup notice: ' + (err.message || 'Please enable permissions individually.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-card rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">App & Device Permissions</h3>
              <p className="text-xs text-muted-foreground">Optimize your trading terminal performance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Introduction */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3 text-xs text-muted-foreground">
          <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
          <p>
            Enabling device permissions ensures your offline charts, KYC document verification, deposit receipts, and real-time trade alerts run smoothly without data eviction.
          </p>
        </div>

        {/* Permissions List */}
        <div className="space-y-3">
          {/* Storage */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <HardDrive size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground">Storage Persistence</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  Keeps charts & cache safe ({storageEstimate.usageFormatted} used)
                </p>
              </div>
            </div>
            {storagePersisted ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} /> Protected
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestPersistentStorage();
                  if (ok) toast.success('Persistent storage granted!');
                }}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-xl shrink-0"
              >
                Enable
              </button>
            )}
          </div>

          {/* Camera */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Camera size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground">Camera & Photo Access</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  For KYC identity photo & deposit receipts
                </p>
              </div>
            </div>
            {cameraStatus === 'granted' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} /> Granted
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestCameraAccess();
                  if (ok) toast.success('Camera permission granted!');
                }}
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-xl shrink-0"
              >
                Grant
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground">Trade & Deposit Alerts</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  Push notifications for order execution & account updates
                </p>
              </div>
            </div>
            {notificationStatus === 'granted' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} /> Enabled
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const res = await requestNotificationPermission();
                  if (res === 'granted') toast.success('Notifications enabled!');
                }}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl shrink-0"
              >
                Allow
              </button>
            )}
          </div>

          {/* Wake Lock */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Sun size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground">Keep Screen Awake</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  Prevents dimming during live chart trading
                </p>
              </div>
            </div>
            {wakeLockActive ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <Zap size={12} /> Active
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const ok = await enableWakeLock();
                  if (ok) toast.success('Screen wake lock enabled.');
                }}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl shrink-0"
              >
                Activate
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleGrantAll}
            disabled={isProcessing}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isProcessing ? 'Optimizing...' : 'Grant All Recommended'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PWAPermissionsModal;

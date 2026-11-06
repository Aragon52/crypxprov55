/**
 * PWA Permissions and Device Capabilities Service
 * Manages Persistent Storage, Camera/Media Access, Notifications, Screen Wake Lock,
 * and Storage Quota optimizations for PWA and Mobile Web experiences.
 */

export interface PermissionState {
  storagePersisted: boolean;
  storageEstimate: {
    usageBytes: number;
    quotaBytes: number;
    usageFormatted: string;
    quotaFormatted: string;
    usagePercent: number;
  };
  cameraStatus: 'granted' | 'prompt' | 'denied' | 'unsupported';
  notificationStatus: 'granted' | 'default' | 'denied' | 'unsupported';
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  clipboardSupported: boolean;
  isStandalonePWA: boolean;
}

class PWAPermissionService {
  private wakeLockSentinel: any = null;
  private listeners: Set<(state: PermissionState) => void> = new Set();
  private state: PermissionState = {
    storagePersisted: false,
    storageEstimate: {
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: '0 B',
      quotaFormatted: '0 B',
      usagePercent: 0
    },
    cameraStatus: 'prompt',
    notificationStatus: 'default',
    wakeLockActive: false,
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    clipboardSupported: typeof navigator !== 'undefined' && 'clipboard' in navigator,
    isStandalonePWA: false
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectStandalone();
      this.refreshPermissions();
      // Auto-request storage persistence on startup in standalone or modern browsers
      this.initAutoStoragePersistence();
    }
  }

  private detectStandalone(): boolean {
    const isStandalone =
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && (navigator as any).standalone === true) ||
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: fullscreen)').matches);
    this.state.isStandalonePWA = isStandalone;
    return isStandalone;
  }

  public getState(): PermissionState {
    return { ...this.state };
  }

  public subscribe(callback: (state: PermissionState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  /**
   * Automatically requests storage persistence to avoid cache & session eviction by the browser
   */
  private async initAutoStoragePersistence() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        const isPersisted = await navigator.storage.persisted();
        this.state.storagePersisted = isPersisted;
        if (!isPersisted && navigator.storage.persist) {
          const granted = await navigator.storage.persist();
          this.state.storagePersisted = granted;
        }
        await this.updateStorageEstimate();
        this.notify();
      }
    } catch (e) {
      console.debug('Storage persistence check notice:', e);
    }
  }

  public async updateStorageEstimate() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percent = quota > 0 ? (usage / quota) * 100 : 0;

        this.state.storageEstimate = {
          usageBytes: usage,
          quotaBytes: quota,
          usageFormatted: this.formatBytes(usage),
          quotaFormatted: this.formatBytes(quota),
          usagePercent: Math.min(100, Math.round(percent * 10) / 10)
        };
      }
    } catch (e) {
      console.debug('Storage estimate query failed:', e);
    }
  }

  public async refreshPermissions(): Promise<PermissionState> {
    this.detectStandalone();

    // 1. Storage persistence
    if (typeof navigator !== 'undefined' && navigator.storage?.persisted) {
      try {
        this.state.storagePersisted = await navigator.storage.persisted();
      } catch {
        this.state.storagePersisted = false;
      }
    }
    await this.updateStorageEstimate();

    // 2. Notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.state.notificationStatus = Notification.permission;
    } else {
      this.state.notificationStatus = 'unsupported';
    }

    // 3. Camera permission
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as any });
        this.state.cameraStatus = camPerm.state as any;
        camPerm.onchange = () => {
          this.state.cameraStatus = camPerm.state as any;
          this.notify();
        };
      } catch {
        // Fallback for browsers that don't support camera query via Permissions API
        this.state.cameraStatus = 'prompt';
      }
    }

    // 4. Wake Lock
    this.state.wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    this.state.clipboardSupported = typeof navigator !== 'undefined' && 'clipboard' in navigator;

    this.notify();
    return this.getState();
  }

  /**
   * Request Persistent Storage Permission
   */
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
      return false;
    }
    try {
      const granted = await navigator.storage.persist();
      this.state.storagePersisted = granted;
      await this.updateStorageEstimate();
      this.notify();
      return granted;
    } catch (err) {
      console.error('Failed to request persistent storage:', err);
      return false;
    }
  }

  /**
   * Request Camera / Document Capture Access
   */
  public async requestCameraAccess(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      // Stop all tracks immediately after granting
      stream.getTracks().forEach((track) => track.stop());
      this.state.cameraStatus = 'granted';
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Camera access was not granted:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.state.cameraStatus = 'denied';
      } else {
        this.state.cameraStatus = 'prompt';
      }
      this.notify();
      return false;
    }
  }

  /**
   * Request Push Notifications Permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      this.state.notificationStatus = result;
      this.notify();
      return result;
    } catch (err) {
      console.error('Notification permission request error:', err);
      return 'denied';
    }
  }

  /**
   * Enable Screen Wake Lock (prevents screen timeout during live charts/trading)
   */
  public async enableWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
        return true; // Already active
      }
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.state.wakeLockActive = true;

      this.wakeLockSentinel.addEventListener('release', () => {
        this.state.wakeLockActive = false;
        this.notify();
      });

      this.notify();
      return true;
    } catch (err) {
      console.warn('Screen Wake Lock request failed:', err);
      this.state.wakeLockActive = false;
      this.notify();
      return false;
    }
  }

  /**
   * Release Screen Wake Lock
   */
  public async disableWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch (err) {
        console.debug('Wake lock release notice:', err);
      }
      this.wakeLockSentinel = null;
    }
    this.state.wakeLockActive = false;
    this.notify();
  }

  /**
   * Request all recommended permissions in one seamless batch
   */
  public async grantAllRecommended(): Promise<{
    storage: boolean;
    camera: boolean;
    notifications: boolean;
    wakeLock: boolean;
  }> {
    const storageRes = await this.requestPersistentStorage();
    const notifRes = await this.requestNotificationPermission();
    const wakeLockRes = await this.enableWakeLock();
    let cameraRes = false;
    if (this.state.cameraStatus !== 'granted') {
      cameraRes = await this.requestCameraAccess();
    } else {
      cameraRes = true;
    }

    await this.refreshPermissions();

    return {
      storage: storageRes,
      camera: cameraRes,
      notifications: notifRes === 'granted',
      wakeLock: wakeLockRes
    };
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}

export const pwaPermissionService = new PWAPermissionService();

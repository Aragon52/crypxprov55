import { useState, useEffect } from 'react';
import { pwaPermissionService, PermissionState } from '@/services/permissionService';

export function usePWAPermissions() {
  const [permissions, setPermissions] = useState<PermissionState>(pwaPermissionService.getState());

  useEffect(() => {
    const unsubscribe = pwaPermissionService.subscribe((newState) => {
      setPermissions(newState);
    });
    return unsubscribe;
  }, []);

  return {
    ...permissions,
    requestPersistentStorage: () => pwaPermissionService.requestPersistentStorage(),
    requestCameraAccess: () => pwaPermissionService.requestCameraAccess(),
    requestNotificationPermission: () => pwaPermissionService.requestNotificationPermission(),
    enableWakeLock: () => pwaPermissionService.enableWakeLock(),
    disableWakeLock: () => pwaPermissionService.disableWakeLock(),
    grantAllRecommended: () => pwaPermissionService.grantAllRecommended(),
    refreshPermissions: () => pwaPermissionService.refreshPermissions()
  };
}

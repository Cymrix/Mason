import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DetectedPlatform = 'ios' | 'android' | 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInIframe, setIsInIframe] = useState(false);
  const [platform, setPlatform] = useState<DetectedPlatform>('other');

  useEffect(() => {
    // Detect iframe environment
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Detect browser / OS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/edg/.test(userAgent)) {
      setPlatform('edge');
    } else if (/chrome|crios/.test(userAgent) && !/edg/.test(userAgent)) {
      setPlatform('chrome');
    } else if (/safari/.test(userAgent) && !/chrome|crios/.test(userAgent)) {
      setPlatform('safari');
    } else if (/firefox|fxios/.test(userAgent)) {
      setPlatform('firefox');
    } else {
      setPlatform('other');
    }

    // Check if app is already running in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setHasNativePrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setHasNativePrompt(false);
      setDeferredPrompt(null);
      console.log('[Mason PWA] App installed successfully');
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerNativeInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[Mason PWA] User accepted installation prompt');
        setIsInstalled(true);
        setHasNativePrompt(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[Mason PWA] User dismissed installation prompt');
        return false;
      }
    } catch (err) {
      console.error('[Mason PWA] Installation prompt failed:', err);
      return false;
    }
  };

  return {
    hasNativePrompt,
    isInstalled,
    isOffline,
    isInIframe,
    platform,
    triggerNativeInstall
  };
};

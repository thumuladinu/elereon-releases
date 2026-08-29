import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { DownloadOutlined, ShareAltOutlined, PlusSquareOutlined, DesktopOutlined } from '@ant-design/icons';
import logo from '../../assets/images/logo.png';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      });
    }

    // 2. Check if app is already running as an installed PWA (Standalone mode)
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('pwaInstalled') === 'true';

    setIsStandalone(inStandalone);
    if (inStandalone) return; // Never show install prompt if already installed/standalone

    // Check if dismissed recently (e.g., within session or 7 days)
    const lastDismissed = localStorage.getItem('pwaPromptDismissedAt');
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        return; // Don't prompt again for 3 days after user dismissed
      }
    }

    // 3. Device & Platform Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent) || window.innerWidth <= 768;
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    setIsMobile(isMobileDevice);
    setIsIos(isIosDevice);

    // 4. Handle Native PWA BeforeInstallPrompt (Works on PC Chrome/Edge & Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Handle AppInstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      localStorage.setItem('pwaInstalled', 'true');
      setIsStandalone(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. iOS Safari Fallback (Since iOS doesn't support beforeinstallprompt)
    if (isIosDevice && !inStandalone) {
      const iosDismissed = localStorage.getItem('iosPwaPromptDismissed');
      if (!iosDismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    if (outcome === 'accepted') {
      localStorage.setItem('pwaInstalled', 'true');
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissedAt', Date.now().toString());
    if (isIos) {
      localStorage.setItem('iosPwaPromptDismissed', 'true');
    }
  };

  // DO NOT show if app is already installed/standalone or prompt is hidden
  if (isStandalone || !showPrompt) return null;

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      centered
      width={isMobile ? 340 : 420}
      title={null}
      closable={true}
      style={{ borderRadius: '16px', overflow: 'hidden' }}
    >
      <div style={{ textAlign: 'center', padding: '16px 12px' }}>
        <img
          src={logo}
          alt="D&D Engineers"
          style={{ width: '72px', height: '72px', borderRadius: '16px', marginBottom: '14px', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}
        />
        <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
          Install D&D Engineers App
        </h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '18px', lineHeight: '1.4' }}>
          {isMobile
            ? 'Install this app on your phone for fast home screen access and a full-screen mobile app experience.'
            : 'Install this app directly on your Windows PC or Mac for fast desktop launch, full-screen view, and offline performance.'}
        </p>

        {isIos ? (
          <div
            style={{
              background: '#f0f5ff',
              border: '1px solid #adc6ff',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '12px',
              textAlign: 'left',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#1890ff' }}>
              How to install on iPhone / iPad:
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
              <li style={{ marginBottom: '4px' }}>
                Tap the <ShareAltOutlined style={{ color: '#1890ff' }} /> <strong>Share</strong> button in Safari.
              </li>
              <li>
                Tap <PlusSquareOutlined style={{ color: '#1890ff' }} /> <strong>Add to Home Screen</strong>.
              </li>
            </ol>
          </div>
        ) : (
          <Button
            type="primary"
            icon={isMobile ? <DownloadOutlined /> : <DesktopOutlined />}
            size="large"
            block
            onClick={handleInstallClick}
            style={{
              height: '48px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '10px',
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              boxShadow: '0 4px 14px rgba(24, 144, 255, 0.35)'
            }}
          >
            {isMobile ? 'Install Mobile App' : 'Install Desktop App'}
          </Button>
        )}

        <Button type="text" onClick={handleDismiss} style={{ color: '#888', fontSize: '13px' }}>
          Maybe Later
        </Button>
      </div>
    </Modal>
  );
};

export default PwaInstallPrompt;

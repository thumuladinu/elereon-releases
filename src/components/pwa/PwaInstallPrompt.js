import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { DownloadOutlined, ShareAltOutlined, PlusSquareOutlined } from '@ant-design/icons';
import logo from '../../assets/images/logo.png';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      });
    }

    // 2. Check if running in standalone mode (already installed)
    const inStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
      
    setIsStandalone(inStandalone);
    if (inStandalone) return;

    // 3. Mobile Device Detection (Show ONLY for Mobile Phones)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileDevice = isMobileUserAgent || isSmallScreen;
    setIsMobile(isMobileDevice);

    if (!isMobileDevice) return; // Do NOT show for desktop devices

    // 4. Detect iOS Safari
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 5. Handle Android / Chrome PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Handle iOS prompt if not installed and not dismissed before
    if (isIosDevice && !inStandalone) {
      const iosDismissed = localStorage.getItem('iosPwaPromptDismissed');
      if (!iosDismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIos) {
      localStorage.setItem('iosPwaPromptDismissed', 'true');
    }
  };

  // Only render on mobile devices that are not already in standalone mode
  if (isStandalone || !isMobile || !showPrompt) return null;

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      centered
      width={340}
      title={null}
      closable={true}
      style={{ borderRadius: '16px', overflow: 'hidden' }}
    >
      <div style={{ textAlign: 'center', padding: '12px 6px' }}>
        <img
          src={logo}
          alt="D&D Engineers"
          style={{ width: '64px', height: '64px', borderRadius: '14px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#111' }}>
          Install D&D Engineers App
        </h3>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
          Install this app on your phone to access it quickly from your home screen with a full-screen mobile experience.
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
            icon={<DownloadOutlined />}
            size="large"
            block
            onClick={handleInstallClick}
            style={{
              height: '46px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '15px',
              marginBottom: '8px',
              backgroundColor: '#1890ff',
              borderColor: '#1890ff'
            }}
          >
            Install App
          </Button>
        )}

        <Button type="text" onClick={handleDismiss} style={{ color: '#888', fontSize: '12px' }}>
          Maybe Later
        </Button>
      </div>
    </Modal>
  );
};

export default PwaInstallPrompt;

import React, { useState, useEffect } from 'react';
import { Alert } from 'antd';
import { WifiOff, Wifi } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

const OfflineBanner = styled.div<{ isVisible: boolean; isOnline: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  animation: ${props => props.isVisible ? slideDown : slideUp} 0.3s ease-out forwards;
  
  .ant-alert {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    text-align: center;
    
    .ant-alert-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }
`;

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowBanner(true);
                // Hide "back online" banner after 3 seconds
                setTimeout(() => setShowBanner(false), 3000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    // Don't render anything if online and banner not showing
    if (isOnline && !showBanner) {
        return null;
    }

    return (
        <OfflineBanner isVisible={showBanner} isOnline={isOnline}>
            <Alert
                message={
                    isOnline ? (
                        <>
                            <Wifi size={16} />
                            You're back online!
                        </>
                    ) : (
                        <>
                            <WifiOff size={16} />
                            You're offline. Some features may not work.
                        </>
                    )
                }
                type={isOnline ? 'success' : 'warning'}
                showIcon={false}
                banner
            />
        </OfflineBanner>
    );
};

export default OfflineIndicator;

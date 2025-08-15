import React, { useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';

/**
 * ToastStack - Positioned toast container that provides anchor for LiveFeedTerminal
 */
export function ToastStack() {
  const toastRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Update CSS custom property for LiveFeedTerminal positioning
    const updateToastHeight = () => {
      if (toastRef.current) {
        const height = toastRef.current.offsetHeight || 80;
        document.documentElement.style.setProperty('--toast-stack-height', `${height}px`);
      }
    };
    
    // Initial measurement
    updateToastHeight();
    
    // Monitor for changes (new toasts, etc.)
    const observer = new MutationObserver(updateToastHeight);
    if (toastRef.current) {
      observer.observe(toastRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    // Also listen for resize events
    const resizeObserver = new ResizeObserver(updateToastHeight);
    if (toastRef.current) {
      resizeObserver.observe(toastRef.current);
    }
    
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);
  
  return (
    <div 
      ref={toastRef}
      className="toast-stack-anchor"
      style={{
        position: 'fixed',
        top: 'var(--space-md)',
        right: 'var(--space-md)',
        zIndex: 'var(--z-toast)',
        pointerEvents: 'none'
      }}
    >
      <Toaster />
    </div>
  );
}
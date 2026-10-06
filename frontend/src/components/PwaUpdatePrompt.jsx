import React, { useState, useEffect } from 'react';

const PwaUpdatePrompt = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
            }
          });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!waitingWorker) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '0.75rem 1.25rem',
        borderRadius: '10px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem'
      }}
    >
      <span>App update available!</span>
      <button
        onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}
        style={{
          backgroundColor: '#ea580c',
          color: '#ffffff',
          border: 'none',
          padding: '0.35rem 0.75rem',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  );
};

export default PwaUpdatePrompt;

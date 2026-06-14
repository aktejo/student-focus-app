import React, { useState, useEffect } from 'react';
import { getLandscapeForDate, LANDSCAPE_URLS_365 } from '../lib/backgroundImages';
import { RefreshCw } from 'lucide-react';

interface BackgroundImageLayerProps {
  manualSeed: number | null;
  onRefresh: () => void;
}

export const BackgroundImageLayer: React.FC<BackgroundImageLayerProps> = ({ manualSeed, onRefresh }) => {
  const [bgA, setBgA] = useState('');
  const [bgB, setBgB] = useState('');
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');

  useEffect(() => {
    let active = true;

    // Determine the base image URL
    let targetUrl = '';
    if (manualSeed !== null) {
      targetUrl = LANDSCAPE_URLS_365[manualSeed % LANDSCAPE_URLS_365.length];
    } else {
      targetUrl = getLandscapeForDate(new Date());
    }

    // Initialize the active layer with the target url on mount
    if (!bgA && !bgB) {
      setBgA(targetUrl);
      setActiveLayer('A');
      return;
    }

    const currentActiveUrl = activeLayer === 'A' ? bgA : bgB;
    if (currentActiveUrl === targetUrl) return;

    // Preload image before crossfading
    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      if (!active) return;
      if (activeLayer === 'A') {
        setBgB(targetUrl);
        setActiveLayer('B');
      } else {
        setBgA(targetUrl);
        setActiveLayer('A');
      }
    };

    return () => {
      active = false;
    };
  }, [manualSeed, activeLayer, bgA, bgB]);

  return (
    <div className="background-container">
      {/* Layer A */}
      <div
        className={`background-layer ${activeLayer === 'A' ? 'active' : ''}`}
        style={{
          backgroundImage: bgA ? `url(${bgA})` : 'none',
          transition: 'opacity 0.8s ease-in-out',
        }}
      />
      
      {/* Layer B */}
      <div
        className={`background-layer ${activeLayer === 'B' ? 'active' : ''}`}
        style={{
          backgroundImage: bgB ? `url(${bgB})` : 'none',
          transition: 'opacity 0.8s ease-in-out',
        }}
      />

      {/* Global dark overlay for text readability */}
      <div className="background-overlay-dark" />
      
      {/* Radial vignette for cinematic depth */}
      <div className="background-vignette" />

      {/* Subtle manual background refresh button in bottom right corner */}
      <button
        onClick={onRefresh}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 5,
          cursor: 'pointer',
          padding: 6,
          borderRadius: '50%',
          background: 'rgba(8, 13, 23, 0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s, background-color 0.2s'
        }}
        title="Refresh landscape"
        className="bg-refresh-btn"
      >
        <RefreshCw size={12} />
      </button>

      <style>{`
        .bg-refresh-btn:hover {
          color: var(--accent-cyan) !important;
          background: rgba(8, 13, 23, 0.6) !important;
        }
      `}</style>
    </div>
  );
};

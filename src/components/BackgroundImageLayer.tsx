import React, { useState, useEffect } from 'react';
import { getLandscapeForDate, LANDSCAPE_URLS_365 } from '../lib/backgroundImages';

interface BackgroundImageLayerProps {
  manualSeed: number | null;
}

export const BackgroundImageLayer: React.FC<BackgroundImageLayerProps> = ({ manualSeed }) => {
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
    </div>
  );
};

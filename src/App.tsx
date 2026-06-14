import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { FocusScreen } from './components/FocusScreen';
import { PlannerScreen } from './components/PlannerScreen';
import { TaskModal } from './components/TaskModal';
import { PlanTodayModal } from './components/PlanTodayModal';
import { BackgroundImageLayer } from './components/BackgroundImageLayer';
import { getUserLocationAndWeather } from './lib/weather';
import type { WeatherData } from './lib/weather';
import { Settings as SetIcon, Clock, Calendar, X, Cloud } from 'lucide-react';
import './App.css';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedTaskId,
    isPlanTodayOpen,
    settings,
    updateSettings,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  // Custom background state
  const [bgSeed, setBgSeed] = useState<number | null>(null);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather on mount
  useEffect(() => {
    getUserLocationAndWeather().then((data) => {
      setWeather(data);
    });
  }, []);

  // Handle manual background refresh
  const handleBgRefresh = () => {
    // Pick a random day of the year seed (0 to 364)
    const randomSeed = Math.floor(Math.random() * 365);
    setBgSeed(randomSeed);
  };

  return (
    <div className="app-container">
      {/* Cinematic Landscape Background */}
      <BackgroundImageLayer manualSeed={bgSeed} />

      {/* Floating Controls Layer */}
      <div style={{ position: 'absolute', top: 24, left: 24, right: 24, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Top-Left: Planner Toggle Button */}
        <button
          onClick={() => setActiveTab(activeTab === 'Focus' ? 'Planner' : 'Focus')}
          className="glass-control"
          style={{
            pointerEvents: 'auto',
            height: 52,
            padding: activeTab === 'Focus' ? '0 20px' : '0 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: 'rgba(255,255,255,0.92)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: activeTab === 'Focus' ? 18 : '50%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title={activeTab === 'Focus' ? 'Open Planner' : 'Return to Focus Dashboard'}
        >
          {activeTab === 'Focus' ? (
            <>
              <Calendar size={18} color="var(--accent-cyan)" />
              <span style={{ transition: 'opacity 0.2s', opacity: 1 }}>Planner</span>
            </>
          ) : (
            <X size={18} color="var(--accent-red)" />
          )}
        </button>

        {/* Top-Right: Time & Weather Badge + Settings */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="glass-control"
            style={{
              height: 52,
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              color: 'rgba(255,255,255,0.92)',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="var(--accent-cyan)" />
              {currentTime || 'Loading...'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={weather?.condition || 'Loading weather...'}>
              {weather ? (
                <>
                  <span style={{ fontSize: '1rem' }}>{weather.emoji}</span>
                  <span>{weather.temp}°F</span>
                </>
              ) : (
                <>
                  <Cloud size={15} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-muted)' }}>--°F</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="glass-control"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
            title="Cockpit Settings"
          >
            <SetIcon size={16} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Main Focus View (dimmed/blurred under Planner overlay) */}
      <div
        className="app-body"
        style={{
          transition: 'filter 0.4s ease, transform 0.4s ease',
          filter: activeTab === 'Planner' ? 'blur(8px) brightness(0.4)' : 'none',
          transform: activeTab === 'Planner' ? 'scale(0.98)' : 'scale(1)',
          pointerEvents: activeTab === 'Planner' ? 'none' : 'auto'
        }}
      >
        <FocusScreen onRefreshBg={handleBgRefresh} />
      </div>

      {/* Planner Overlay Screen */}
      <div className={`planner-background-overlay ${activeTab === 'Planner' ? 'active' : ''}`}>
        {activeTab === 'Planner' && (
          <div style={{ position: 'absolute', inset: 0, padding: '100px 32px 32px 32px' }}>
            <PlannerScreen />
          </div>
        )}
      </div>

      {/* Global Modals / Overlays */}
      {selectedTaskId && <TaskModal />}
      {isPlanTodayOpen && <PlanTodayModal />}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>Cockpit Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ cursor: 'pointer', opacity: 0.8 }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pomodoro Focus Settings */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="var(--accent-cyan)" /> Timer Durations (minutes)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus</label>
                    <input
                      type="number"
                      value={settings.pomodoroFocusMinutes}
                      onChange={e => updateSettings({ pomodoroFocusMinutes: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6, fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Short Break</label>
                    <input
                      type="number"
                      value={settings.pomodoroBreakMinutes}
                      onChange={e => updateSettings({ pomodoroBreakMinutes: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6, fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Long Break</label>
                    <input
                      type="number"
                      value={settings.longBreakMinutes}
                      onChange={e => updateSettings({ longBreakMinutes: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* View options */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Visual Focus Prefs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.focusModeAutoCollapseLeftPanel}
                      onChange={e => updateSettings({ focusModeAutoCollapseLeftPanel: e.target.checked })}
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    <span>Collapse rail automatically in Focus mode</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.focusModeDimBackground}
                      onChange={e => updateSettings({ focusModeDimBackground: e.target.checked })}
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    <span>Dim other panels when timer runs</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setIsSettingsOpen(false)} className="btn-primary">
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;

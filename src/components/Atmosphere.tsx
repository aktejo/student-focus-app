import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Volume2, VolumeX, Flame, Waves, Coffee, CloudRain, ShieldAlert, Sparkles, ChevronDown, ChevronUp, RotateCcw, Pencil, Check, X } from 'lucide-react';
import { BlackHole } from './BlackHole';

export const Atmosphere: React.FC = () => {
  const {
    ambientChannels,
    toggleAmbientChannel,
    setAmbientChannelVolume,
    ambientPlaying,
    setAmbientPlaying,
    tasks,
    moveTask,
  } = useApp();

  const [lofiVisible, setLofiVisible] = useState(true);
  const [mixerVisible, setMixerVisible] = useState(true);
  const [doneVisible, setDoneVisible] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const [lofiSource, setLofiSource] = useState(() => {
    return localStorage.getItem('student_focus_lofi_source') || 'EWrX250Zhko';
  });
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [tempSource, setTempSource] = useState(lofiSource);

  const extractYoutubeId = (urlOrId: string) => {
    const trimmed = urlOrId.trim();
    if (!trimmed) return 'EWrX250Zhko';
    
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
    
    try {
      const urlObj = new URL(trimmed);
      const videoId = urlObj.searchParams.get('v');
      if (videoId && videoId.length === 11) {
        return videoId;
      }
    } catch (e) {
      // ignore URL parsing error
    }
    
    return trimmed;
  };

  const handleSaveSource = () => {
    const videoId = extractYoutubeId(tempSource);
    setLofiSource(videoId);
    setTempSource(videoId);
    localStorage.setItem('student_focus_lofi_source', videoId);
    setIsEditingSource(false);
  };

  const handleCancelSource = () => {
    setTempSource(lofiSource);
    setIsEditingSource(false);
  };

  // List of completed tasks
  const completedTasks = tasks.filter(t => t.status === 'done');

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'rain': return <CloudRain size={14} />;
      case 'brown-noise': return <ShieldAlert size={14} />; // generic wave/shield icon
      case 'cafe': return <Coffee size={14} />;
      case 'fireplace': return <Flame size={14} />;
      case 'waves': return <Waves size={14} />;
      default: return <Volume2 size={14} />;
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div
      style={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        paddingRight: 4, // scrollbar buffer
      }}
      className="right-atmosphere-panel-container"
    >
      {/* Lofi player Panel */}
      <div className="glass-panel" style={{ padding: 14 }}>
        {isEditingSource ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, width: '100%' }}>
            <input
              type="text"
              value={tempSource}
              onChange={(e) => setTempSource(e.target.value)}
              placeholder="Paste YouTube link or ID..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSource();
                if (e.key === 'Escape') handleCancelSource();
              }}
              autoFocus
            />
            <button
              onClick={handleSaveSource}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 4,
                color: 'var(--accent-green)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              title="Save source"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancelSource}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 4,
                color: 'var(--accent-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: lofiVisible ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lofi Stream</h4>
              <button
                onClick={() => {
                  setTempSource(lofiSource);
                  setIsEditingSource(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  outline: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Change stream source"
              >
                <Pencil size={11} />
              </button>
            </div>
            <button
              onClick={() => setLofiVisible(!lofiVisible)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              {lofiVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
        {lofiVisible && (
          <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', background: '#000', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${lofiSource}?autoplay=0&mute=0`}
              title="Lofi study stream"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Ambient Mixer Panel */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mixerVisible ? 16 : 0 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ambient Mixer</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setAmbientPlaying(!ambientPlaying)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: 8 }}
            >
              {ambientPlaying ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => setMixerVisible(!mixerVisible)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              {mixerVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {mixerVisible && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ambientChannels.map(channel => (
              <div key={channel.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => toggleAmbientChannel(channel.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: !channel.muted && channel.active ? 'rgba(103, 232, 249, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${!channel.muted && channel.active ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)'}`,
                    color: !channel.muted && channel.active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="mixer-channel-toggle"
                >
                  {channel.muted ? <VolumeX size={14} /> : getChannelIcon(channel.id)}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{channel.name}</span>
                    <span style={{ color: 'var(--text-very-muted)', fontSize: '0.7rem' }}>{channel.muted ? 'Muted' : `${channel.volume}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={channel.muted ? 0 : channel.volume}
                    onChange={e => setAmbientChannelVolume(channel.id, Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--accent-cyan)',
                      background: 'rgba(255,255,255,0.06)',
                      height: 4,
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Done Portal Panel */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: doneVisible ? 10 : 0 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</h4>
          <button
            onClick={() => setDoneVisible(!doneVisible)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
          >
            {doneVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {doneVisible && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <BlackHole />

            {/* Completed tasks dropdown list */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              <button
                onClick={() => setCompletedExpanded(!completedExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="var(--accent-cyan)" style={{ filter: 'drop-shadow(0 0 4px var(--accent-cyan))' }} />
                  <span>Completed ({completedTasks.length})</span>
                </div>
                {completedExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {completedExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, maxHeight: 150, overflowY: 'auto' }}>
                  {completedTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        cursor: 'grab'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ color: 'var(--accent-green)' }}>✓</span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-very-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                      </div>
                      <button
                        onClick={() => moveTask(task.id, 'inbox')}
                        title="Move back to Inbox"
                        style={{ color: 'var(--text-very-muted)', cursor: 'pointer', flexShrink: 0, marginLeft: 4 }}
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  ))}
                  {completedTasks.length === 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-very-muted)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
                      No completed tasks.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

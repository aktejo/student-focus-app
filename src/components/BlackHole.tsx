import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Moon } from 'lucide-react';

export const BlackHole: React.FC = () => {
  const { moveTask, tasks } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [warpingTaskTitle, setWarpingTaskTitle] = useState<string | null>(null);
  const [rippleActive, setRippleActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Trigger visual warping sequence
    setWarpingTaskTitle(task.title);
    setRippleActive(true);

    // Call move task to Done after animation completes
    setTimeout(() => {
      moveTask(taskId, 'done');
      setWarpingTaskTitle(null);
      setRippleActive(false);
    }, 750); // matches the 750ms CSS animation duration
  };

  return (
    <div className="black-hole-container">
      <div
        className={`black-hole-portal ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Core gravity node */}
        <Moon size={30} color="var(--accent-cyan)" style={{ filter: 'drop-shadow(0 0 10px var(--accent-cyan))', zIndex: 2 }} />

        {/* Orbit rings */}
        <div className="black-hole-ring"></div>
        <div className="black-hole-ring-2"></div>

        {/* Ripple effect */}
        {rippleActive && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid var(--accent-cyan)',
              boxShadow: '0 0 20px var(--accent-cyan)',
              animation: 'ripple-burst 0.75s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />
        )}

        {/* Warping Card Mock inside Portal */}
        {warpingTaskTitle && (
          <div
            className="warping-card"
            style={{
              position: 'absolute',
              padding: '8px 12px',
              background: 'rgba(103, 232, 249, 0.2)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 500,
              maxWidth: 120,
              textAlign: 'center',
              boxShadow: '0 0 15px rgba(103, 232, 249, 0.4)',
              zIndex: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {warpingTaskTitle}
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
        Drag tasks here to complete
      </p>

      {/* Ripple Animation inline styling */}
      <style>{`
        @keyframes ripple-burst {
          0% {
            width: 80px;
            height: 80px;
            opacity: 1;
          }
          100% {
            width: 220px;
            height: 220px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
export default BlackHole;

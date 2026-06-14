import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, Calendar, AlertCircle, Eye, GripHorizontal, Trash2, Plus, Edit, RefreshCw } from 'lucide-react';
import type { Task } from '../types';
import { Atmosphere } from './Atmosphere';

interface FocusScreenProps {
  onRefreshBg?: () => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({ onRefreshBg }) => {
  const {
    tasks,
    courses,
    activeTaskId,
    timerState,
    timerSecondsLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    activateTask,
    deactivateTask,
    completeActiveTask,
    moveTask,
    updateTask,
    parseQuickCapture,
    warningMessage,
    setWarningMessage,
    settings,
    startBreakMode,
    extendFocus,
    setSelectedTaskId,
  } = useApp();

  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [quickCaptureInput, setQuickCaptureInput] = useState('');
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  
  // Draggable active task card state
  const [isCardDraggable, setIsCardDraggable] = useState(false);

  // Subtask editing states
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');

  // Quote states
  const [currentQuote, setCurrentQuote] = useState<string>('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
    setCurrentQuote(INSPIRATIONAL_QUOTES[randomIndex]);
  }, []);

  const rotateQuote = () => {
    if (INSPIRATIONAL_QUOTES.length === 0) return;
    let nextQuote = currentQuote;
    // ensure we don't repeat the same quote if we have options
    let iterations = 0;
    while (nextQuote === currentQuote && INSPIRATIONAL_QUOTES.length > 1 && iterations < 10) {
      const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
      nextQuote = INSPIRATIONAL_QUOTES[randomIndex];
      iterations++;
    }
    setCurrentQuote(nextQuote);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Auto collapse left rail in Focus Mode if enabled in settings
  useEffect(() => {
    if (settings.focusModeAutoCollapseLeftPanel) {
      if (timerState === 'running' || timerState === 'break-running') {
        setLeftRailCollapsed(true);
      } else {
        setLeftRailCollapsed(false);
      }
    }
  }, [timerState, settings.focusModeAutoCollapseLeftPanel]);

  // Formatter for timer minutes and seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Quick Capture submit
  const handleQuickCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCaptureInput.trim()) return;

    const result = parseQuickCapture(quickCaptureInput);
    setCaptureMessage(result.message);
    setQuickCaptureInput('');

    setTimeout(() => {
      setCaptureMessage(null);
    }, 4000);
  };

  // Drag and drop setup for task lists
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, targetStatus);
    }
  };

  // Subtask actions for Active Task
  const handleAddActiveSubtask = () => {
    if (!newSubtaskTitle.trim() || !activeTask) return;
    const newSubtask = {
      id: Math.random().toString(36).substring(2, 9),
      taskId: activeTask.id,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateTask(activeTask.id, {
      subtasks: [...activeTask.subtasks, newSubtask],
    });
    setNewSubtaskTitle('');
  };

  const handleUpdateActiveSubtaskTitle = (subtaskId: string, newTitle: string) => {
    if (!activeTask || !newTitle.trim()) return;
    const updated = activeTask.subtasks.map(s => 
      s.id === subtaskId ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s
    );
    updateTask(activeTask.id, { subtasks: updated });
    setEditingSubtaskId(null);
  };

  const handleDeleteActiveSubtask = (subtaskId: string) => {
    if (!activeTask) return;
    const updated = activeTask.subtasks.filter(s => s.id !== subtaskId);
    updateTask(activeTask.id, { subtasks: updated });
  };

  // Lists
  const todayTasks = tasks.filter(t => t.status === 'today');
  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'low': return 'var(--accent-green)';
      case 'medium': return 'var(--accent-orange)';
      case 'high': return 'var(--accent-orange)';
      case 'urgent': return 'var(--accent-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const getEnergyText = (energy: Task['energyLevel']) => {
    switch (energy) {
      case 'low': return '⚡';
      case 'medium': return '⚡⚡';
      case 'high': return '⚡⚡⚡';
    }
  };

  // Compute Pomodoro ring properties
  const getTimerProgressInfo = () => {
    const totalSeconds = timerState.startsWith('break') 
      ? (timerState === 'break-running' || timerState === 'break-paused' ? settings.pomodoroBreakMinutes * 60 : settings.longBreakMinutes * 60)
      : settings.pomodoroFocusMinutes * 60;
    
    const progress = totalSeconds > 0 ? (totalSeconds - timerSecondsLeft) / totalSeconds : 0;
    const r = 150;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ * (1 - progress);
    
    // Position dot at progress end
    const angle = progress * 2 * Math.PI - Math.PI / 2;
    const dotX = 170 + r * Math.cos(angle);
    const dotY = 170 + r * Math.sin(angle);

    return { circ, strokeDashoffset, dotX, dotY, progress };
  };

  const { circ, strokeDashoffset, dotX, dotY } = getTimerProgressInfo();

  // Dimming factor for rails during Focus mode
  const isFocusing = timerState === 'running' || timerState === 'break-running';

  const CompactCard: React.FC<{ task: Task }> = ({ task }) => {
    const course = courses.find(c => c.id === task.courseId);
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        className="task-card"
        style={{
          borderLeft: `4px solid ${course?.color || 'rgba(255, 255, 255, 0.08)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingRight: 24 }}>
          {/* Draggable Icon handle */}
          <div style={{ color: 'var(--text-very-muted)', cursor: 'grab', display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <GripHorizontal size={12} style={{ transform: 'rotate(90deg)' }} />
          </div>

          {/* Checkbox circle to complete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Complete task via black hole dispatcher
              moveTask(task.id, 'done');
            }}
            style={{
              width: 15,
              height: 15,
              borderRadius: '50%',
              border: '1.5px solid var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              marginTop: 3,
            }}
            title="Complete task"
            className="task-circle-btn"
          >
            <span style={{ fontSize: '0.5rem', color: 'transparent' }}>✓</span>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </h5>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {course && (
                <span style={{ color: course.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span>{course.icon}</span>
                  <span>{course.displayName}</span>
                </span>
              )}
              <span style={{ color: getPriorityColor(task.priority), fontWeight: 600 }}>
                ▲ {task.priority.toUpperCase()}
              </span>
              <span title="Energy level">{getEnergyText(task.energyLevel)}</span>
              {task.dueDate && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedTaskId(task.id)}
            style={{ position: 'absolute', right: 8, top: 12, cursor: 'pointer', color: 'var(--text-very-muted)' }}
            title="Edit Details"
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Hover play button */}
        <div
          className="hover-play-btn"
          onClick={() => {
            activateTask(task.id);
            setTimeout(() => startTimer(), 100);
          }}
          title="FOCUS NOW"
        >
          <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
        </div>

        <style>{`
          .task-circle-btn:hover {
            border-color: var(--accent-green) !important;
            background: rgba(74, 222, 128, 0.1) !important;
          }
          .task-circle-btn:hover span {
            color: var(--accent-green) !important;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', padding: '100px 32px 32px 32px', gap: 32 }}>
      
      {/* Left Collapsible Rail */}
      <div
        className={`left-rail ${leftRailCollapsed ? 'collapsed' : ''}`}
        style={{
          opacity: isFocusing ? 0.35 : 1,
          transition: 'all 0.4s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'transparent',
          borderRight: 'none',
        }}
      >
        {/* Toggle Collapse bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
          {!leftRailCollapsed && <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Focus Rail</h3>}
          <button
            onClick={() => setLeftRailCollapsed(!leftRailCollapsed)}
            style={{ cursor: 'pointer', padding: 6, borderRadius: 10, background: 'rgba(8, 13, 23, 0.4)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            className="glass-control"
          >
            {leftRailCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {leftRailCollapsed ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px', fontWeight: 600 }}>
              TODAY <strong style={{ color: 'var(--accent-cyan)' }}>{todayTasks.length}/3</strong>
            </div>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px', fontWeight: 600 }}>
              INBOX <strong style={{ color: '#fff' }}>{inboxTasks.length}</strong>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16, overflowY: 'auto' }}>
            {/* Quick Capture */}
            <div className="glass-panel" style={{ padding: '16px 20px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                Quick Capture
              </h4>
              <form onSubmit={handleQuickCaptureSubmit} className="quick-capture-input-wrapper">
                <input
                  type="text"
                  placeholder="Capture note or 'task ...'"
                  value={quickCaptureInput}
                  onChange={e => setQuickCaptureInput(e.target.value)}
                  className="quick-capture-input"
                  style={{ color: '#fff' }}
                />
              </form>
              {captureMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: 8 }}>
                  <CheckCircle size={12} /> {captureMessage}
                </div>
              )}
            </div>

            {/* Warning popups */}
            {warningMessage && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: 16, color: 'var(--accent-red)', fontSize: '0.8rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  {warningMessage}
                  <button onClick={() => setWarningMessage(null)} style={{ display: 'block', textDecoration: 'underline', marginTop: 4, cursor: 'pointer' }}>Dismiss</button>
                </div>
              </div>
            )}

            {/* Today List */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'today')}
              className="glass-panel"
              style={{ padding: 20, minHeight: 180, display: 'flex', flexDirection: 'column' }}
            >
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Today's Selection</span>
                <span style={{ color: todayTasks.length >= 3 ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>{todayTasks.length}/3</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
                {todayTasks.map(t => <CompactCard key={t.id} task={t} />)}
                {todayTasks.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-very-muted)', textAlign: 'center', padding: '24px 0', border: '1.5px dashed var(--border-color)', borderRadius: 14 }}>
                    Drag up to 3 tasks here to commit
                  </div>
                )}
              </div>
            </div>

            {/* Inbox List */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'inbox')}
              className="glass-panel"
              style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}
            >
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Inbox
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
                {inboxTasks.map(t => <CompactCard key={t.id} task={t} />)}
                {inboxTasks.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-very-muted)', textAlign: 'center', padding: '40px 0', border: '1.5px dashed var(--border-color)', borderRadius: 14 }}>
                    No items in inbox. Capture something!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center Panel (Cockpit) */}
      <div
        className="center-focus-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 0,
          overflow: 'visible',
          height: '100%',
        }}
      >
        {/* Large Cinematic Timer Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10, position: 'relative' }}>
          <div className="pomodoro-timer-display">
            {/* SVG Progress Circle Ring */}
            <svg className="timer-ring-container" width="340" height="340">
              {/* Underlay ring */}
              <circle
                cx="170"
                cy="170"
                r="150"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="2"
              />
              {/* Progress ring */}
              <circle
                cx="170"
                cy="170"
                r="150"
                fill="transparent"
                stroke="var(--accent-cyan)"
                strokeWidth="2"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: isFocusing ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.35s ease'
                }}
              />
              {/* Glowing progress end dot */}
              <circle
                cx={dotX}
                cy={dotY}
                r="4.5"
                fill="var(--accent-cyan)"
                style={{
                  filter: 'drop-shadow(0 0 6px var(--accent-cyan))',
                  transition: isFocusing ? 'cx 1s linear, cy 1s linear' : 'cx 0.35s ease, cy 0.35s ease'
                }}
              />
            </svg>

            {/* Timer numbers and subtitle */}
            <div className="timer-text">
              {formatTime(timerSecondsLeft)}
            </div>
            
            <div 
              onClick={timerState.startsWith('break') ? undefined : rotateQuote}
              style={{ 
                fontSize: timerState.startsWith('break') ? '0.85rem' : '0.75rem', 
                fontWeight: timerState.startsWith('break') ? 600 : 400, 
                fontStyle: timerState.startsWith('break') ? 'normal' : 'italic',
                color: timerState.startsWith('break') ? 'var(--accent-green)' : 'var(--text-secondary)', 
                textTransform: timerState.startsWith('break') ? 'uppercase' : 'none', 
                letterSpacing: timerState.startsWith('break') ? '2px' : 'normal', 
                marginTop: 8, 
                zIndex: 2,
                cursor: timerState.startsWith('break') ? 'default' : 'pointer',
                textAlign: 'center',
                maxWidth: 240,
                lineHeight: 1.3,
                userSelect: 'none'
              }}
              title={timerState.startsWith('break') ? undefined : "Click to change quote"}
            >
              {timerState === 'break-running' || timerState === 'break-paused' ? 'Take a breath.' : (() => {
                const parts = currentQuote.split(' - ');
                if (parts.length > 1) {
                  return `"${parts[0]}" - ${parts[1]}`;
                }
                return `"${currentQuote}"`;
              })()}
            </div>

            {/* Change Background button under the quote */}
            {!timerState.startsWith('break') && onRefreshBg && (
              <button
                onClick={onRefreshBg}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 8,
                  color: 'var(--text-muted)',
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  marginTop: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  zIndex: 10,
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
                title="Change background scenery"
              >
                <RefreshCw size={10} />
                <span>Shuffle Scenery</span>
              </button>
            )}
          </div>

          {/* Start Focus / Pause Play Controls */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {timerState === 'running' || timerState === 'break-running' ? (
              <button onClick={pauseTimer} className="btn-secondary" style={{ height: 40, borderRadius: 12 }}>
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button
                onClick={startTimer}
                disabled={!activeTaskId}
                className="btn-primary"
                style={{ height: 40, borderRadius: 12 }}
              >
                <Play size={14} fill="currentColor" /> Start Focus
              </button>
            )}
            <button
              onClick={resetTimer}
              disabled={timerState === 'idle'}
              className="btn-secondary"
              style={{
                height: 40,
                borderRadius: 12,
                opacity: timerState === 'idle' ? 0.35 : 1,
                cursor: timerState === 'idle' ? 'not-allowed' : 'pointer'
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Active Task Card (positioned below the timer) */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'active')}
          style={{ width: '100%', maxWidth: '640px', marginTop: 40, position: 'relative' }}
        >
          {activeTask ? (
            <div
              draggable={isCardDraggable}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', activeTask.id);
              }}
              onDragEnd={() => setIsCardDraggable(false)}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                borderTop: `4px solid ${courses.find(c => c.id === activeTask.courseId)?.color || 'var(--border-color)'}`,
                position: 'relative'
              }}
             >
              {/* Centered top-middle Drag handle */}
              <div
                onMouseDown={() => setIsCardDraggable(true)}
                onMouseUp={() => setIsCardDraggable(false)}
                onDragEnd={() => setIsCardDraggable(false)}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'grab',
                  color: 'var(--text-very-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 14px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  zIndex: 10
                }}
                className="card-drag-handle"
                title="Grab to reschedule or move task"
              >
                <GripHorizontal size={13} />
              </div>

              {/* Active label and title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, marginTop: 4 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {activeTask.courseId && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, color: courses.find(c => c.id === activeTask.courseId)?.color }}>
                        {courses.find(c => c.id === activeTask.courseId)?.icon} {courses.find(c => c.id === activeTask.courseId)?.displayName}
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '1px' }}>
                      ACTIVE TASK
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.3 }}>
                    {activeTask.title}
                  </h3>
                </div>
                <button
                  onClick={deactivateTask}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: 6 }}
                >
                  Deactivate
                </button>
              </div>

              {/* Checklist / Subtasks */}
              <div style={{ marginTop: 10 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Subtasks</h4>
                
                {/* Scrollable list container */}
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 6, 
                    maxHeight: '110px', 
                    overflowY: 'auto', 
                    paddingRight: '6px',
                    marginBottom: 8
                  }}
                  className="custom-scrollbar"
                >
                  {activeTask.subtasks.map(sub => {
                    const isEditing = editingSubtaskId === sub.id;
                    return (
                      <div 
                        key={sub.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          fontSize: '0.8rem', 
                          padding: '3px 6px', 
                          borderRadius: 6, 
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => {
                              const list = activeTask.subtasks.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s);
                              updateTask(activeTask.id, { subtasks: list });
                            }}
                            style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                          />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingSubtaskTitle}
                              onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                              onBlur={() => handleUpdateActiveSubtaskTitle(sub.id, editingSubtaskTitle)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateActiveSubtaskTitle(sub.id, editingSubtaskTitle);
                                } else if (e.key === 'Escape') {
                                  setEditingSubtaskId(null);
                                }
                              }}
                              autoFocus
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--accent-cyan)',
                                borderRadius: 4,
                                color: '#fff',
                                padding: '2px 6px',
                                fontSize: '0.8rem',
                                width: '100%',
                                outline: 'none'
                              }}
                            />
                          ) : (
                            <span 
                              onDoubleClick={() => {
                                setEditingSubtaskId(sub.id);
                                setEditingSubtaskTitle(sub.title);
                              }}
                              style={{ 
                                textDecoration: sub.completed ? 'line-through' : 'none', 
                                color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: 'text',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}
                              title="Double click to edit"
                            >
                              {sub.title}
                            </span>
                          )}
                        </div>

                        {!isEditing && (
                          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                            <button
                              onClick={() => {
                                setEditingSubtaskId(sub.id);
                                setEditingSubtaskTitle(sub.title);
                              }}
                              style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                              title="Edit subtask"
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteActiveSubtask(sub.id)}
                              style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-red)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                              title="Delete subtask"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeTask.subtasks.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-very-muted)', fontStyle: 'italic', paddingLeft: 4 }}>
                      No subtasks added yet.
                    </p>
                  )}
                </div>

                {/* Add subtask input field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 6 }}>
                  <Plus size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Add subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddActiveSubtask();
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      padding: '2px 0',
                      width: '100%',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottom = '1px dashed var(--accent-cyan)')}
                    onBlur={(e) => (e.currentTarget.style.borderBottom = '1px dashed rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              {/* Notes */}
              {activeTask.notes && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Notes</h4>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    whiteSpace: 'pre-wrap', 
                    background: 'rgba(0,0,0,0.15)', 
                    padding: '8px 12px', 
                    borderRadius: 10, 
                    border: '1px solid rgba(255,255,255,0.03)',
                    maxHeight: '60px',
                    overflowY: 'auto'
                  }} className="custom-scrollbar">
                    {activeTask.notes}
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setSelectedTaskId(activeTask.id)}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.7rem', borderRadius: 6 }}
                >
                  Edit Task Details
                </button>
                <button
                  onClick={completeActiveTask}
                  className="btn-primary"
                  style={{ padding: '5px 12px', background: 'var(--accent-green)', color: '#020617', boxShadow: 'none', fontSize: '0.7rem', borderRadius: 6 }}
                >
                  Complete Task
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 20,
                padding: '32px 20px',
                textAlign: 'center',
                color: 'var(--text-very-muted)',
                fontSize: '0.85rem',
                cursor: 'default',
                background: 'rgba(8, 13, 23, 0.2)'
              }}
            >
              Drag a task here or press play on a card to start focusing.
            </div>
          )}
        </div>
      </div>

      {/* Right Collapsible Tool Rail (Atmosphere, Mixer, Done) */}
      <div
        style={{
          opacity: isFocusing ? 0.35 : 1,
          transition: 'all 0.4s ease',
          height: '100%',
        }}
      >
        <Atmosphere />
      </div>

      {/* End-of-focus Decision Modal */}
      {timerState === 'completed' && activeTask && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>
              Focus session complete! 🎉
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              How would you like to resolve <strong style={{ color: '#fff' }}>"{activeTask.title}"</strong>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => startBreakMode(false)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ☕ Take Short Break (5 min)
              </button>

              <button
                onClick={() => extendFocus(5)}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ➕ Focus for 5 more minutes
              </button>

              <button
                onClick={completeActiveTask}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-green)', color: '#020617', boxShadow: 'none' }}
              >
                ✨ Send to Done Black Hole
              </button>

              <button
                onClick={() => moveTask(activeTask.id, 'today')}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', color: 'var(--accent-orange)' }}
              >
                🔙 Return to Today selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const INSPIRATIONAL_QUOTES = [
  "Focus on being productive instead of busy. - Tim Ferriss",
  "The secret of getting ahead is getting started. - Mark Twain",
  "Deep work is the superpower of the 21st century. - Cal Newport",
  "It always seems impossible until it's done. - Nelson Mandela",
  "Do what you can, with what you have, where you are. - Theodore Roosevelt",
  "You do not rise to the level of your goals. You fall to the level of your systems. - James Clear",
  "The best way to predict the future is to create it. - Peter Drucker",
  "One day or day one. You decide.",
  "Your mind is for having ideas, not holding them. - David Allen",
  "Action is the foundational key to all success. - Pablo Picasso",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. - Stephen King",
  "Focus is a matter of deciding what things you're not going to do. - John Carmack",
  "Discipline is choosing between what you want now and what you want most. - Abraham Lincoln",
  "Simplicity is the ultimate sophistication. - Leonardo da Vinci",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "Do it now. Sometimes 'later' becomes 'never'.",
  "The successful warrior is the average man, with laser-like focus. - Bruce Lee",
  "Energy and persistence conquer all things. - Benjamin Franklin",
  "The search for perfect conditions is the perfect excuse for inaction.",
  "Grit is passion and perseverance for very long-term goals. - Angela Duckworth",
  "Done is better than perfect. - Sheryl Sandberg",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "A year from now you may wish you had started today. - Karen Lamb",
  "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
  "There is no substitute for hard work. - Thomas Edison",
  "Concentrate all your thoughts upon the work at hand. - Alexander Graham Bell",
  "Opportunities don't happen, you create them. - Chris Grosser",
  "It is not that I am so smart, it's just that I stay with problems longer. - Albert Einstein",
  "Quality is not an act, it is a habit. - Aristotle",
  "Small daily improvements over time lead to stunning results. - Robin Sharma",
  "If you spend too much time thinking about a thing, you'll never get it done. - Bruce Lee",
  "The master has failed more times than the beginner has even tried. - Stephen McCranie",
  "You can do anything, but not everything. - David Allen",
  "What you do today can improve all your tomorrows. - Ralph Marston",
  "Keep your eyes on the stars, and your feet on the ground. - Theodore Roosevelt",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "If it is important to you, you will find a way. If not, you will find an excuse.",
  "A journey of a thousand miles begins with a single step. - Lao Tzu",
  "Either you run the day or the day runs you. - Jim Rohn",
  "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
  "Never give up on a dream just because of the time it will take to accomplish it. - Earl Nightingale",
  "Focus on the step in front of you, not the whole staircase.",
  "Be not afraid of going slowly, be afraid only of standing still. - Chinese Proverb",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
  "You are what you repeatedly do. Excellence, then, is not an act, but a habit. - Will Durant",
  "Productivity is never an accident. It is always the result of a commitment to excellence. - Paul J. Meyer",
  "Yesterday you said tomorrow. Just do it. - Nike",
  "Make each day your masterpiece. - John Wooden",
  "Do not wait for the perfect moment. Take the moment and make it perfect.",
  "Patience is bitter, but its fruit is sweet. - Jean-Jacques Rousseau",
  "Don't count the days, make the days count. - Muhammad Ali",
  "There are no shortcuts to any place worth going. - Beverly Sills",
  "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
  "He who is not courageous enough to take risks will accomplish nothing in life. - Muhammad Ali",
  "If you want to live a happy life, tie it to a goal, not to people or things. - Albert Einstein",
  "Do something today that your future self will thank you for.",
  "It's not about having time, it's about making time.",
  "Strive for progress, not perfection.",
  "Work hard in silence, let your success be your noise. - Frank Ocean",
  "If you cannot do great things, do small things in a great way. - Napoleon Hill",
  "Big journeys begin with small steps.",
  "Great things are done by a series of small things brought together. - Vincent van Gogh",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
  "Do not let what you cannot do interfere with what you can do. - John Wooden",
  "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
  "Grit is the stubborn refusal to give up.",
  "Fall seven times, stand up eight. - Japanese Proverb",
  "Be stronger than your excuses.",
  "Every accomplishment starts with the decision to try. - John F. Kennedy",
  "The secret of your future is hidden in your daily routine. - Mike Murdock",
  "Study like there's no tomorrow because if you keep procrastinating, you have no future.",
  "No pressure, no diamonds. - Thomas Carlyle",
  "Study hard, for the well is deep, and our brains are shallow. - Richard Baxter",
  "Doubt kills more dreams than failure ever will. - Suzy Kassem",
  "The expert in anything was once a beginner. - Helen Hayes",
  "Your only limit is you.",
  "Push yourself, because no one else is going to do it for you.",
  "Success doesn't just find you. You have to go out and get it.",
  "Dream it. Wish it. Do it.",
  "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
  "Build your own dreams, or someone else will hire you to build theirs. - Farrah Gray",
  "The key to success is to focus on goals, not obstacles.",
  "Run when you can, walk if you must, crawl if you have to; just never give up. - Dean Karnazes",
  "Procrastination is the thief of time. - Edward Young",
  "You are capable of more than you know.",
  "To be a champ you have to believe in yourself when no one else will. - Sugar Ray Robinson",
  "If you're going through hell, keep going. - Winston Churchill",
  "Act as if what you do makes a difference. It does. - William James",
  "The standard you walk past is the standard you accept. - David Morrison",
  "Dream big and dare to fail. - Norman Vaughan",
  "Learn from yesterday, live for today, hope for tomorrow. - Albert Einstein",
  "Tough times never last, but tough people do. - Robert H. Schuller",
  "Everything you've ever wanted is on the other side of fear. - George Addair",
  "Hard work beats talent when talent doesn't work hard. - Tim Notke",
  "It is during our darkest moments that we must focus to see the light. - Aristotle Onassis",
  "Happiness is not something ready-made. It comes from your own actions. - Dalai Lama",
  "Turn your obstacles into opportunities.",
  "Be the change that you wish to see in the world. - Mahatma Gandhi"
];

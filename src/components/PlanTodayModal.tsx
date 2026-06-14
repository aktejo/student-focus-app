import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

export const PlanTodayModal: React.FC = () => {
  const {
    isPlanTodayOpen,
    setIsPlanTodayOpen,
    tasks,
    moveTask,
    addScheduledSession,
    scheduledSessions,
    courses,
  } = useApp();

  const [step, setStep] = useState(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Time blocking states for step 3
  const [scheduleTaskIndex, setScheduleTaskIndex] = useState(0);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');

  if (!isPlanTodayOpen) return null;

  // Filter tasks due soon or unscheduled
  const potentialTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'active');

  // Load current scheduled blocks for today
  const todaysSessions = scheduledSessions.filter(session => {
    const sessionDateStr = new Date(session.startTime).toISOString().split('T')[0];
    const todayDateStr = new Date().toISOString().split('T')[0];
    return sessionDateStr === todayDateStr;
  });

  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      if (prev.length >= 3) {
        return prev; // Max 3
      }
      return [...prev, taskId];
    });
  };

  const handleMoveToStep2 = () => {
    setStep(2);
  };

  const handleConfirmSelection = () => {
    // Clear current Today tasks (optional, or just add up to 3)
    // For MVP, we will move selected tasks to Today
    selectedTaskIds.forEach(id => {
      moveTask(id, 'today');
    });
    setStep(3);
  };

  const handleScheduleBlock = () => {
    const targetTaskId = selectedTaskIds[scheduleTaskIndex];
    if (!targetTaskId) return;

    const startStr = `${sessionDate}T${startTime}:00`;
    const endStr = `${sessionDate}T${endTime}:00`;
    
    addScheduledSession(targetTaskId, new Date(startStr).toISOString(), new Date(endStr).toISOString());

    // Move to next task or finish
    if (scheduleTaskIndex < selectedTaskIds.length - 1) {
      setScheduleTaskIndex(prev => prev + 1);
    } else {
      // Finished wizard
      setIsPlanTodayOpen(false);
      setStep(1);
      setSelectedTaskIds([]);
      setScheduleTaskIndex(0);
    }
  };

  const currentTaskToSchedule = tasks.find(t => t.id === selectedTaskIds[scheduleTaskIndex]);

  return (
    <div className="modal-overlay" onClick={() => setIsPlanTodayOpen(false)}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles color="var(--accent-orange)" size={20} /> Guided Plan Today
          </h2>
          <button onClick={() => setIsPlanTodayOpen(false)} style={{ cursor: 'pointer', opacity: 0.8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'
              }}
            />
          ))}
        </div>

        {/* Step 1: Today's calendar review */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>1. Review Today's Schedule</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Here are the blocks already scheduled for today. Take a moment to see where your open windows are.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 24 }}>
              {todaysSessions.map(s => {
                const t = tasks.find(task => task.id === s.taskId);
                const start = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const end = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t?.title || 'Calendar Event'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{start} - {end}</span>
                  </div>
                );
              })}
              {todaysSessions.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Your day is completely open. No scheduled tasks today.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleMoveToStep2} className="btn-primary">
                Next: Choose Today's Focus <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose up to 3 tasks */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>2. Choose Today's Selection (Max 3)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Pick up to three high-impact tasks to commit to. Doing less helps you focus and finish.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 20 }}>
              {potentialTasks.map(t => {
                const isSelected = selectedTaskIds.includes(t.id);
                const course = courses.find(c => c.id === t.courseId);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleToggleSelectTask(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: '2px solid var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                        background: isSelected ? 'var(--accent-blue)' : 'transparent'
                      }}>
                        {isSelected && <Check size={12} color="#fff" />}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{t.title}</span>
                        {course && (
                          <span style={{ fontSize: '0.7rem', display: 'block', color: course.color }}>
                            {course.icon} {course.displayName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.priority}</span>
                  </div>
                );
              })}
              {potentialTasks.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No tasks available. Add some tasks first.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedTaskIds.length === 0}
                className="btn-primary"
                style={{ opacity: selectedTaskIds.length === 0 ? 0.5 : 1 }}
              >
                Confirm Commit ({selectedTaskIds.length}/3) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Time blocking scheduling */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>3. Schedule Your Tasks</h3>
            {currentTaskToSchedule ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Block out specific time on the calendar to work on: <strong style={{ color: '#fff' }}>"{currentTaskToSchedule.title}"</strong>
                </p>

                <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={e => setSessionDate(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 8, fontSize: '0.85rem', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 8, fontSize: '0.85rem', color: '#fff' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 8, fontSize: '0.85rem', color: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => {
                      if (scheduleTaskIndex < selectedTaskIds.length - 1) {
                        setScheduleTaskIndex(prev => prev + 1);
                      } else {
                        setIsPlanTodayOpen(false);
                      }
                    }}
                    className="btn-secondary"
                  >
                    Skip scheduling
                  </button>
                  <button onClick={handleScheduleBlock} className="btn-primary">
                    {scheduleTaskIndex === selectedTaskIds.length - 1 ? 'Finish & Start Study' : 'Next task'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
                  All selected tasks have been scheduled or resolved!
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => { setIsPlanTodayOpen(false); setStep(1); }} className="btn-primary">
                    Let's Go Focus!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

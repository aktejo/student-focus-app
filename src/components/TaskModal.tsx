import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash2, Calendar, Link as LinkIcon, CheckSquare, Square, Clock } from 'lucide-react';
import type { Subtask } from '../types';

export const TaskModal: React.FC = () => {
  const {
    selectedTaskId,
    setSelectedTaskId,
    tasks,
    courses,
    updateTask,
    deleteTask,
    moveTask,
    scheduledSessions,
    deleteScheduledSession,
    addScheduledSession,
  } = useApp();

  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [courseId, setCourseId] = useState(task.courseId || '');
  const [type, setType] = useState(task.type);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes || 25);
  const [priority, setPriority] = useState(task.priority);
  const [energyLevel, setEnergyLevel] = useState(task.energyLevel);
  const [notes, setNotes] = useState(task.notes);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newLink, setNewLink] = useState('');

  // Scheduled sessions linked to this task
  const taskSessions = scheduledSessions.filter(s => s.taskId === task.id);

  // New scheduled session fields
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [sessionEndTime, setSessionEndTime] = useState('');

  const handleSave = () => {
    updateTask(task.id, {
      title,
      courseId: courseId || undefined,
      type,
      dueDate: dueDate || undefined,
      estimatedMinutes: Number(estimatedMinutes),
      priority,
      energyLevel,
      notes,
    });
    setSelectedTaskId(null);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      taskId: task.id,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateTask(task.id, {
      subtasks: [...task.subtasks, newSubtask],
    });
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subtaskId) {
        return { ...s, completed: !s.completed, updatedAt: Date.now() };
      }
      return s;
    });
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    let url = newLink.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    updateTask(task.id, {
      links: [...task.links, url],
    });
    setNewLink('');
  };

  const handleDeleteLink = (indexToRemove: number) => {
    updateTask(task.id, {
      links: task.links.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleAddSession = () => {
    if (!sessionDate || !sessionStartTime || !sessionEndTime) return;
    const startStr = `${sessionDate}T${sessionStartTime}:00`;
    const endStr = `${sessionDate}T${sessionEndTime}:00`;
    addScheduledSession(task.id, new Date(startStr).toISOString(), new Date(endStr).toISOString());
    setSessionDate('');
    setSessionStartTime('');
    setSessionEndTime('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      setSelectedTaskId(null);
    }
  };

  const selectedCourse = courses.find(c => c.id === courseId);

  return (
    <div className="modal-overlay" onClick={() => handleSave()}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ borderTop: `4px solid ${selectedCourse?.color || 'var(--border-color)'}` }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>Edit Task</h2>
          <button onClick={() => handleSave()} style={{ padding: 4, cursor: 'pointer', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="quick-capture-input"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8 }}
            />
          </div>

          {/* Core metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Course */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Course</label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8, color: '#fff' }}
              >
                <option value="">No Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.displayName} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Type */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8, color: '#fff' }}
              >
                <option value="assignment">📝 Assignment</option>
                <option value="reading">📖 Reading</option>
                <option value="lecture">🎥 Lecture</option>
                <option value="study">🧠 Study Session</option>
                <option value="admin">⚙️ Administrative</option>
                <option value="exam-prep">🎯 Exam Prep</option>
                <option value="other">💡 Other</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '9px 12px', borderRadius: 8, color: '#fff' }}
              />
            </div>

            {/* Estimated Minutes */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Estimated Minutes</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, paddingLeft: 12 }}>
                <Clock size={16} color="var(--text-secondary)" />
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(Number(e.target.value))}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px 12px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8, color: '#fff' }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Energy Level</label>
              <select
                value={energyLevel}
                onChange={e => setEnergyLevel(e.target.value as any)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8, color: '#fff' }}
              >
                <option value="low">⚡ Low Energy</option>
                <option value="medium">⚡⚡ Medium Energy</option>
                <option value="high">⚡⚡⚡ High Energy</option>
              </select>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckSquare size={16} /> Subtasks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 12 }}>
              {task.subtasks.map(sub => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                  <button onClick={() => toggleSubtask(sub.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left' }}>
                    {sub.completed ? (
                      <CheckSquare size={18} color="var(--accent-green)" />
                    ) : (
                      <Square size={18} color="var(--text-secondary)" />
                    )}
                    <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'var(--text-muted)' : '#fff' }}>
                      {sub.title}
                    </span>
                  </button>
                  <button onClick={() => handleDeleteSubtask(sub.id)} style={{ color: 'var(--accent-red)', opacity: 0.7, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {task.subtasks.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subtasks created yet.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Add new subtask..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button onClick={handleAddSubtask} className="btn-secondary" style={{ padding: '8px 12px' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Notes area */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Keep thoughts or details here..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 8, resize: 'vertical' }}
            />
          </div>

          {/* Links area */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <LinkIcon size={16} /> External Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {task.links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {link}
                  </a>
                  <button onClick={() => handleDeleteLink(idx)} style={{ color: 'var(--accent-red)', opacity: 0.7, cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {task.links.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No links added.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Paste URL..."
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button onClick={handleAddLink} className="btn-secondary" style={{ padding: '8px 12px' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Time blocking (Scheduled Sessions) inside Modal */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={16} /> Scheduled Time Blocks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {taskSessions.map(session => {
                const start = new Date(session.startTime);
                const end = new Date(session.endTime);
                return (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.8rem' }}>
                      {start.toLocaleDateString()} @ {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={() => deleteScheduledSession(session.id)} style={{ color: 'var(--accent-red)', cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
              {taskSessions.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not scheduled on the calendar yet.</div>
              )}
            </div>

            {/* Schedule new time block manually */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                style={{ flex: '1 1 120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px', fontSize: '0.8rem', color: '#fff' }}
              />
              <input
                type="time"
                value={sessionStartTime}
                onChange={e => setSessionStartTime(e.target.value)}
                style={{ flex: '1 1 80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px', fontSize: '0.8rem', color: '#fff' }}
              />
              <input
                type="time"
                value={sessionEndTime}
                onChange={e => setSessionEndTime(e.target.value)}
                style={{ flex: '1 1 80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px', fontSize: '0.8rem', color: '#fff' }}
              />
              <button onClick={handleAddSession} className="btn-secondary" style={{ padding: '8px 12px' }}>
                <Plus size={16} /> Block Time
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleDelete} className="btn-secondary" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <Trash2 size={16} /> Delete Task
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            {task.status !== 'today' && task.status !== 'active' && (
              <button onClick={() => { moveTask(task.id, 'today'); setSelectedTaskId(null); }} className="btn-secondary">
                Push to Today
              </button>
            )}
            <button onClick={() => handleSave()} className="btn-primary">
              Done Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

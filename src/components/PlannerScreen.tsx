import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, AlertCircle, Calendar, Clock, BookOpen, CheckSquare, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const PlannerScreen: React.FC = () => {
  const {
    tasks,
    courses,
    scheduledSessions,
    addScheduledSession,
    updateScheduledSession,
    deleteScheduledSession,
    focusSessions,
    setSelectedTaskId,
    googleCalendarSyncStatus,
    setGoogleCalendarSyncStatus,
    googleClientId,
    setGoogleClientId,
    setIsPlanTodayOpen,
    googleCalendarEvents,
    syncGoogleCalendar,
  } = useApp();

  // Google Calendar Auth config
  const [tempClientId, setTempClientId] = useState(googleClientId || '');

  // Clock state for current time line
  const [now, setNow] = useState(new Date());

  // Hover states for event tooltips
  const [hoveredEvent, setHoveredEvent] = useState<any | null>(null);
  const [hoveredEventCoords, setHoveredEventCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  // Week configuration
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    // Calculate current week days (Sun-Sat) based on weekOffset
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7); // apply weekly offset
    
    const day = now.getDay();
    const diff = now.getDate() - day; // Sunday is index 0
    const sunday = new Date(now.setDate(diff));
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
    setWeekDays(days);
  }, [weekOffset]);

  // Sync Google Calendar
  const handleGoogleSync = () => {
    if (!googleClientId) {
      setGoogleCalendarSyncStatus('failed'); // show client ID settings
    } else {
      syncGoogleCalendar();
    }
  };

  const handleSaveClientId = () => {
    const trimmedId = tempClientId.trim();
    setGoogleClientId(trimmedId || null);
    if (trimmedId) {
      setTimeout(() => syncGoogleCalendar(), 200);
    } else {
      setGoogleCalendarSyncStatus('not-configured');
    }
  };

  // Drag and drop task onto calendar
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleCalendarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCalendarDrop = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Check if it was an reschedule of an existing scheduled session
    if (taskId.startsWith('session_')) {
      const sessionId = taskId.replace('session_', '');
      const session = scheduledSessions.find(s => s.id === sessionId);
      if (session) {
        const targetDate = weekDays[dayIndex];
        const newStart = new Date(targetDate);
        newStart.setHours(hour, 0, 0, 0);
        const newEnd = new Date(newStart);
        newEnd.setHours(hour + 1, 0, 0, 0); // default 1 hour slot
        updateScheduledSession(sessionId, newStart.toISOString(), newEnd.toISOString());
      }
      return;
    }

    // Schedule new task session
    const targetDate = weekDays[dayIndex];
    const startTime = new Date(targetDate);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0); // 1 hour duration by default

    addScheduledSession(taskId, startTime.toISOString(), endTime.toISOString());
  };

  const handleMouseEnter = (e: React.MouseEvent, eventObj: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredEvent(eventObj);
    setHoveredEventCoords({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
    setHoveredEventCoords(null);
  };

  const getWeekRangeLabel = () => {
    if (weekDays.length === 0) return '';
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    const firstMonth = firstDay.toLocaleString(undefined, { month: 'short' });
    const firstYear = firstDay.getFullYear();
    
    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear()) {
      return `${firstDay.toLocaleString(undefined, { month: 'long' })} ${firstYear}`;
    } else if (firstDay.getFullYear() === lastDay.getFullYear()) {
      const lastMonth = lastDay.toLocaleString(undefined, { month: 'short' });
      return `${firstMonth} – ${lastMonth} ${firstYear}`;
    } else {
      const lastMonth = lastDay.toLocaleString(undefined, { month: 'short' });
      const lastYear = lastDay.getFullYear();
      return `${firstMonth} ${firstYear} – ${lastMonth} ${lastYear}`;
    }
  };

  // Filters for Right Task Tray
  const unscheduledTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'active' && t.scheduledSessions.length === 0);
  
  // Tasks due soon (next 7 days)
  const dueSoonTasks = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'active' || !t.dueDate) return false;
    const due = new Date(t.dueDate).getTime();
    const diff = due - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  // Get matching scheduled events for a specific day
  const getDayEvents = (dayIndex: number) => {
    const formatLocalYYYYMMDD = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const targetDate = weekDays[dayIndex];
    if (!targetDate) return [];
    const cellDateStr = formatLocalYYYYMMDD(targetDate);

    // 1. Fetch local scheduled sessions
    const sessions = scheduledSessions.filter(s => {
      const sessionDateStr = formatLocalYYYYMMDD(new Date(s.startTime));
      return sessionDateStr === cellDateStr;
    }).map(s => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return {
        id: s.id,
        taskId: s.taskId,
        startTime: s.startTime,
        endTime: s.endTime,
        startMinutes: start.getHours() * 60 + start.getMinutes(),
        endMinutes: end.getHours() * 60 + end.getMinutes(),
        isGoogle: false,
        title: '',
        color: undefined as string | undefined,
        isAllDay: false
      };
    });

    // 2. Fetch synced Google Calendar events
    const gEvents = googleCalendarEvents.filter(ge => {
      const isDateOnly = ge.startTime.length === 10;
      const parsedStart = isDateOnly ? new Date(ge.startTime + 'T00:00:00') : new Date(ge.startTime);
      const geDateStr = formatLocalYYYYMMDD(parsedStart);
      return geDateStr === cellDateStr;
    }).map(ge => {
      const isDateOnly = ge.startTime.length === 10;
      const parsedStart = isDateOnly ? new Date(ge.startTime + 'T00:00:00') : new Date(ge.startTime);
      const parsedEnd = isDateOnly ? new Date(ge.endTime + 'T23:59:59') : new Date(ge.endTime);
      return {
        id: ge.id,
        taskId: '',
        startTime: parsedStart.toISOString(),
        endTime: parsedEnd.toISOString(),
        startMinutes: parsedStart.getHours() * 60 + parsedStart.getMinutes(),
        endMinutes: parsedEnd.getHours() * 60 + parsedEnd.getMinutes(),
        isGoogle: true,
        title: ge.summary,
        color: ge.color || '#7f8c8d',
        isAllDay: isDateOnly
      };
    });

    // Deduplicate Google Calendar events by title and start time to avoid duplicates from multiple shared calendars
    const uniqueGEventsMap = new Map<string, any>();
    for (const ge of gEvents) {
      const key = `${ge.title || 'Event'}-${ge.startTime}`;
      if (!uniqueGEventsMap.has(key)) {
        uniqueGEventsMap.set(key, ge);
      }
    }
    const uniqueGEvents = Array.from(uniqueGEventsMap.values());

    return [...sessions, ...uniqueGEvents];
  };

  // Algorithm to position overlapping events side-by-side
  const layoutEvents = (events: any[]) => {
    if (events.length === 0) return [];

    // Sort by startMinutes, then by duration descending (longer first)
    const sorted = [...events].sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes;
      }
      return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes);
    });

    const isOverlapping = (a: any, b: any) => {
      const aDur = a.endMinutes - a.startMinutes;
      const bDur = b.endMinutes - b.startMinutes;
      if (aDur === 0 && bDur === 0) {
        return a.startMinutes === b.startMinutes;
      }
      if (aDur === 0) {
        return a.startMinutes >= b.startMinutes && a.startMinutes < b.endMinutes;
      }
      if (bDur === 0) {
        return b.startMinutes >= a.startMinutes && b.startMinutes < a.endMinutes;
      }
      return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
    };

    // Find connected components (clusters) using BFS graph traversal
    const clusters: any[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      if (visited.has(i)) continue;

      const cluster: any[] = [];
      const queue = [i];
      visited.add(i);

      while (queue.length > 0) {
        const currIdx = queue.shift()!;
        const currEvent = sorted[currIdx];
        cluster.push(currEvent);

        for (let j = 0; j < sorted.length; j++) {
          if (!visited.has(j)) {
            if (isOverlapping(currEvent, sorted[j])) {
              visited.add(j);
              queue.push(j);
            }
          }
        }
      }

      // Sort cluster to maintain layout consistency
      cluster.sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) {
          return a.startMinutes - b.startMinutes;
        }
        return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes);
      });

      clusters.push(cluster);
    }

    const positionedEvents: any[] = [];

    // Assign columns to each cluster
    for (const cluster of clusters) {
      const columns: any[][] = []; // tracks events in each column for this cluster

      const clusterWithCols = cluster.map(ev => {
        let colIndex = -1;
        for (let i = 0; i < columns.length; i++) {
          // Check if ev overlaps with any event already in column i
          let overlaps = false;
          for (const colEv of columns[i]) {
            if (isOverlapping(ev, colEv)) {
              overlaps = true;
              break;
            }
          }
          if (!overlaps) {
            colIndex = i;
            columns[i].push(ev);
            break;
          }
        }
        if (colIndex === -1) {
          colIndex = columns.length;
          columns.push([ev]);
        }
        return {
          ...ev,
          colIndex,
        };
      });

      const numCols = columns.length;
      for (const ev of clusterWithCols) {
        positionedEvents.push({
          ...ev,
          left: (ev.colIndex / numCols) * 100,
          width: (1 / numCols) * 100,
        });
      }
    }

    return positionedEvents;
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', gap: 32 }}>

      {/* Center panel: Calendar */}
      <div
        className="glass-panel planner-panel"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 24, height: '100%' }}
      >
        
        {/* Calendar Sync Status Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: 16 }}>
          {/* Left: Week Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', minWidth: 120 }}>
              {getWeekRangeLabel()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)} 
                className="btn-secondary" 
                style={{ padding: '4px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Previous Week"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setWeekOffset(0)} 
                className="btn-secondary" 
                style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#fff', cursor: 'pointer' }}
                title="Jump to Today"
              >
                Today
              </button>
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)} 
                className="btn-secondary" 
                style={{ padding: '4px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Next Week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: Sync Status & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: googleCalendarSyncStatus === 'synced' ? 'var(--accent-green)' : googleCalendarSyncStatus === 'failed' ? 'var(--accent-red)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {googleCalendarSyncStatus === 'synced' && 'Google Calendar synced'}
                {googleCalendarSyncStatus === 'failed' && 'Sync Error'}
                {googleCalendarSyncStatus === 'not-configured' && 'Not Connected'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleGoogleSync} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}>
                <RefreshCw size={12} /> {googleClientId ? 'Sync Now' : 'Connect'}
              </button>
              <button onClick={() => setIsPlanTodayOpen(true)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'var(--accent-cyan)', color: '#020617', boxShadow: 'none', borderRadius: 8 }}>
                ⚡ Plan Today Flow
              </button>
            </div>
          </div>
        </div>

        {/* Sync Failure Explanation Box */}
        {googleCalendarSyncStatus === 'failed' && (
          <div style={{ padding: 12, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: 12, fontSize: '0.8rem', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Google Sync Failed: Client-Side Authorization Required.</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  Vite environment lacks local Google OAuth Credentials. To connect real calendar events:
                </p>
                <ul style={{ paddingLeft: 16, marginTop: 4, color: 'var(--text-secondary)' }}>
                  <li>Make sure redirect URI matching `http://localhost:5173` is set in Google Console.</li>
                  <li>Enter your custom Google Client ID below.</li>
                </ul>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                placeholder="Paste Google Client ID here..."
                value={tempClientId}
                onChange={e => setTempClientId(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#fff' }}
              />
              <button onClick={handleSaveClientId} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, color: '#020617' }}>
                Save ID
              </button>
            </div>
          </div>
        )}

        {/* Calendar Week Grid header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0' }}>
          <div style={{ padding: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>GMT-7</div>
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const allDayEvents = getDayEvents(idx).filter(e => e.isAllDay);
            return (
              <div
                key={idx}
                style={{
                  padding: '8px 4px',
                  borderLeft: '1px solid var(--border-color)',
                  background: isToday ? 'rgba(103, 232, 249, 0.03)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  minWidth: 0,
                }}
              >
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isToday ? 'var(--accent-cyan)' : '#fff', marginBottom: 2 }}>
                  {day.getDate()}
                </span>
                {allDayEvents.map(event => (
                  <div
                    key={event.id}
                    onMouseEnter={(e) => handleMouseEnter(e, event)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      background: event.color ? `${event.color}33` : 'rgba(255, 255, 255, 0.05)',
                      borderLeft: `3px solid ${event.color || 'var(--text-muted)'}`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      color: '#fff',
                      marginTop: 4,
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                    }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Calendar Week Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderTop: 'none', background: 'rgba(3, 7, 18, 0.15)', borderRadius: '0 0 12px 12px' }} ref={el => {
          if (el) {
            // Scroll to 8:00 AM on initial load
            el.scrollTop = 8 * 60;
          }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gridTemplateRows: 'repeat(24, 60px)', position: 'relative' }}>
            
            {/* Hours list */}
            {Array.from({ length: 24 }).map((_, hour) => {
              const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
              return (
                <React.Fragment key={hour}>
                  {/* Left Hour Label */}
                  <div style={{ gridColumn: 1, gridRow: hour + 1, height: 60, borderBottom: '1px solid rgba(255,255,255,0.03)', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 6, paddingTop: 2, fontSize: '0.7rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                    {displayHour}
                  </div>
                  
                  {/* Background Day Cells (purely for borders and drag/drop hover/targets) */}
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <div
                      key={dayIdx}
                      onDragOver={handleCalendarDragOver}
                      onDrop={(e) => handleCalendarDrop(e, dayIdx, hour)}
                      style={{
                        gridColumn: dayIdx + 2,
                        gridRow: hour + 1,
                        height: 60,
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        borderRight: '1px solid rgba(255,255,255,0.03)',
                        position: 'relative',
                        zIndex: 1,
                      }}
                      className="calendar-bg-cell"
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {/* Day Columns Overlays for Positioning Events (absolute layer spanning 24 rows) */}
            {weekDays.map((day, dayIdx) => {
              const events = getDayEvents(dayIdx);
              const gridEvents = events.filter(e => !e.isAllDay);
              const positionedEvents = layoutEvents(gridEvents);
              
              const isToday = day && now.toDateString() === day.toDateString();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();

              return (
                <div
                  key={`overlay-${dayIdx}`}
                  style={{
                    gridColumn: dayIdx + 2,
                    gridRow: '1 / span 24',
                    position: 'relative',
                    pointerEvents: 'none', // passes clicks/drops to cell divs below
                    height: 24 * 60, // 1440px
                    zIndex: 2,
                  }}
                >
                  {/* Current Time Line Indicator */}
                  {isToday && (
                    <div
                      style={{
                        position: 'absolute',
                        top: currentMinutes,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: 'var(--accent-red, #f87171)',
                        zIndex: 10,
                        pointerEvents: 'none',
                        boxShadow: '0 0 4px rgba(248, 113, 113, 0.5)'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: -5,
                          top: -4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-red, #f87171)',
                          boxShadow: '0 0 8px var(--accent-red, #f87171)'
                        }}
                      />
                    </div>
                  )}

                  {positionedEvents.map((event) => {
                    const top = event.startMinutes;
                    const height = Math.max(25, event.endMinutes - event.startMinutes) - 4; // leave 2px padding top/bottom
                    
                    if (event.isGoogle) {
                      return (
                        <div
                          key={event.id}
                          onMouseEnter={(e) => handleMouseEnter(e, event)}
                          onMouseLeave={handleMouseLeave}
                          style={{
                            position: 'absolute',
                            top: top + 2,
                            height: height,
                            left: `${event.left}%`,
                            width: `${event.width - 1}%`,
                            background: event.color ? `${event.color}22` : 'rgba(255, 255, 255, 0.05)',
                            borderLeft: `3px solid ${event.color || 'var(--text-muted)'}`,
                            borderRadius: 6,
                            padding: '4px 6px',
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            pointerEvents: 'auto', // receive hover and details triggers
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
                            {event.title}
                          </div>
                        </div>
                      );
                    }

                    const task = tasks.find(t => t.id === event.taskId);
                    if (!task) return null;
                    const course = courses.find(c => c.id === task.courseId);

                    // Check if focus session is completed on this block
                    const hasCompletedFocus = focusSessions.some(fs => fs.taskId === task.id && fs.result === 'completed');

                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, `session_${event.id}`)}
                        onClick={() => setSelectedTaskId(task.id)}
                        onMouseEnter={(e) => handleMouseEnter(e, { ...event, title: task.title })}
                        onMouseLeave={handleMouseLeave}
                        style={{
                          position: 'absolute',
                          top: top + 2,
                          height: height,
                          left: `${event.left}%`,
                          width: `${event.width - 1}%`,
                          background: course ? `${course.color}35` : 'rgba(255,255,255,0.06)',
                          borderLeft: `3px solid ${course?.color || 'var(--accent-cyan)'}`,
                          borderRadius: 6,
                          padding: '4px 6px',
                          fontSize: '0.7rem',
                          color: '#fff',
                          overflow: 'hidden',
                          cursor: 'grab',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          pointerEvents: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                            {hasCompletedFocus && <span style={{ color: 'var(--accent-green)' }}>✓</span>}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, fontSize: '0.62rem' }}>
                          <span style={{ color: course?.color || 'var(--text-muted)' }}>
                            {course?.displayName || 'Task'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScheduledSession(event.id);
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--accent-red)',
                              cursor: 'pointer',
                              fontSize: '0.62rem'
                            }}
                          >
                            remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel: Task Tray */}
      <div
        className="glass-panel planner-panel"
        style={{ width: 320, padding: 20, display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%' }}
      >
        {/* Unscheduled Tasks */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: 14, borderRadius: 16, marginBottom: 16, flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Unscheduled
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
            {unscheduledTasks.map(t => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, t.id)}
                onClick={() => setSelectedTaskId(t.id)}
                style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  cursor: 'grab'
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff' }}>{t.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: 4 }}>
                  <span>{courses.find(c => c.id === t.courseId)?.displayName || 'No Course'}</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>Drag to calendar</span>
                </div>
              </div>
            ))}
            {unscheduledTasks.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-very-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No unscheduled tasks.
              </div>
            )}
          </div>
        </div>

        {/* Due Soon (7 Days) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: 14, borderRadius: 16, minHeight: 140 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Due Soon (7 Days)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
            {dueSoonTasks.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                style={{
                  padding: '8px',
                  background: 'rgba(248, 113, 113, 0.03)',
                  border: '1px solid rgba(248, 113, 113, 0.1)',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff' }}>{t.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-red)', marginTop: 4 }}>
                  Due: {new Date(t.dueDate!).toLocaleDateString()}
                </div>
              </div>
            ))}
            {dueSoonTasks.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-very-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                No tasks due soon.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredEvent && hoveredEventCoords && (() => {
        const isGoogle = hoveredEvent.isGoogle;
        const task = hoveredEvent.taskId ? tasks.find(t => t.id === hoveredEvent.taskId) : null;
        const course = task?.courseId ? courses.find(c => c.id === task.courseId) : null;
        const title = isGoogle ? hoveredEvent.title : (task?.title || 'Untitled Session');

        // Formatter for dates/times
        const formatEventTimeRange = (startTimeStr: string, endTimeStr: string, isAllDay: boolean) => {
          const start = new Date(startTimeStr);
          const end = new Date(endTimeStr);
          
          const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
          
          if (isAllDay) {
            return `${dayFormatter.format(start)} (All-day)`;
          }
          
          const isSameDay = start.toDateString() === end.toDateString();
          if (isSameDay) {
            return `${dayFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
          } else {
            return `${dayFormatter.format(start)} ${timeFormatter.format(start)} – ${dayFormatter.format(end)} ${timeFormatter.format(end)}`;
          }
        };

        const timeString = formatEventTimeRange(hoveredEvent.startTime, hoveredEvent.endTime, hoveredEvent.isAllDay);

        // Adjust positioning to avoid going off-screen to the right
        const tooltipWidth = 300;
        const spacing = 12;
        const showOnLeft = hoveredEventCoords.x + hoveredEventCoords.width + tooltipWidth + spacing > window.innerWidth;
        const leftPos = showOnLeft
          ? hoveredEventCoords.x - tooltipWidth - spacing
          : hoveredEventCoords.x + hoveredEventCoords.width + spacing;

        // Vertically center/align, with viewport bounds check
        const tooltipHeight = 260; // rough guess for layout
        let topPos = hoveredEventCoords.y;
        if (topPos + tooltipHeight > window.innerHeight - 20) {
          topPos = Math.max(20, window.innerHeight - tooltipHeight - 20);
        }

        return (
          <div
            style={{
              position: 'fixed',
              left: leftPos,
              top: topPos,
              width: tooltipWidth,
              background: 'rgba(15, 23, 42, 0.93)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              color: '#fff',
              zIndex: 9999,
              pointerEvents: 'none',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Header category badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isGoogle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hoveredEvent.color || 'var(--text-muted)' }}>
                  <Calendar size={12} />
                  <span>Google Calendar Event</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: course?.color || 'var(--accent-cyan)' }}>
                  <BookOpen size={12} />
                  <span>{course?.displayName || 'Personal Task'}</span>
                </div>
              )}
              
              {!isGoogle && task && (
                <div style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: task.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' :
                             task.priority === 'high' ? 'rgba(249, 115, 22, 0.15)' :
                             task.priority === 'medium' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: task.priority === 'urgent' ? 'var(--accent-red)' :
                         task.priority === 'high' ? 'var(--accent-orange, #f97316)' :
                         task.priority === 'medium' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: `1px solid ${
                    task.priority === 'urgent' ? 'rgba(239, 68, 68, 0.3)' :
                    task.priority === 'high' ? 'rgba(249, 115, 22, 0.3)' :
                    task.priority === 'medium' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.1)'
                  }`
                }}>
                  {task.priority} priority
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, color: '#fff' }}>
              {title}
            </div>

            {/* Time range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Clock size={13} style={{ flexShrink: 0 }} />
              <span>{timeString}</span>
            </div>

            {/* Task specific details */}
            {!isGoogle && task && (
              <>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Energy & Estimated Duration */}
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {task.energyLevel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Energy:</span>
                        <span style={{ color: '#fff', textTransform: 'capitalize' }}>{task.energyLevel}</span>
                      </div>
                    )}
                    {task.estimatedMinutes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Estimate:</span>
                        <span style={{ color: '#fff' }}>⏱️ {task.estimatedMinutes}m</span>
                      </div>
                    )}
                  </div>

                  {/* Subtasks progress */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <CheckSquare size={12} />
                        <span>
                          Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 18 }}>
                        {task.subtasks.slice(0, 3).map(sub => (
                          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: sub.completed ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                            <span style={{ color: sub.completed ? 'var(--accent-green)' : 'var(--text-very-muted)' }}>
                              {sub.completed ? '✓' : '○'}
                            </span>
                            <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                        {task.subtasks.length > 3 && (
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-very-muted)', paddingLeft: 12 }}>
                            + {task.subtasks.length - 3} more subtasks...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes / Description */}
                  {task.notes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        <FileText size={12} />
                        <span>Notes</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                        {task.notes}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

    </div>
  );
};

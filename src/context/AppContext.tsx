import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Task, Note, Course, ScheduledSession, FocusSession, AmbientChannel, Settings } from '../types';

interface AppContextType {
  // Navigation & Tab State
  activeTab: 'Focus' | 'Planner';
  setActiveTab: (tab: 'Focus' | 'Planner') => void;

  // Data States
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  scheduledSessions: ScheduledSession[];
  focusSessions: FocusSession[];
  settings: Settings;

  // Task Operations
  addTask: (title: string, data?: Partial<Task>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetStatus: Task['status']) => boolean;
  completeActiveTask: () => void;

  // Course Operations
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Course;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;

  // Note Operations
  addNote: (content: string, courseId?: string, linkedTaskId?: string) => Note;
  deleteNote: (noteId: string) => void;

  // Scheduled Sessions
  addScheduledSession: (taskId: string, startTime: string, endTime: string) => ScheduledSession;
  updateScheduledSession: (sessionId: string, startTime: string, endTime: string) => void;
  deleteScheduledSession: (sessionId: string) => void;

  // Quick Capture Parser
  parseQuickCapture: (input: string) => { type: 'task' | 'note' | 'course'; message: string };

  // Pomodoro Timer State
  timerState: 'idle' | 'running' | 'paused' | 'completed' | 'break-running' | 'break-paused';
  timerSecondsLeft: number;
  timerTotalDuration: number;
  activeTaskId: string | null;
  activeFocusSessionId: string | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  activateTask: (taskId: string) => void;
  deactivateTask: () => void;
  extendFocus: (minutes: number) => void;
  startBreakMode: (isLong?: boolean) => void;
  logFocusSessionResult: (result: FocusSession['result']) => void;

  // Ambient Mixer Controls
  ambientChannels: AmbientChannel[];
  toggleAmbientChannel: (id: string) => void;
  setAmbientChannelVolume: (id: string, volume: number) => void;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;

  // Modal / UI States
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  isPlanTodayOpen: boolean;
  setIsPlanTodayOpen: (open: boolean) => void;
  isAddCourseOpen: boolean;
  setIsAddCourseOpen: (open: boolean) => void;
  warningMessage: string | null;
  setWarningMessage: (msg: string | null) => void;
  googleCalendarSyncStatus: 'synced' | 'failed' | 'not-configured';
  setGoogleCalendarSyncStatus: (status: 'synced' | 'failed' | 'not-configured') => void;
  updateSettings: (updates: Partial<Settings>) => void;
  googleClientId: string | null;
  setGoogleClientId: (clientId: string | null) => void;
  googleCalendarEvents: any[];
  syncGoogleCalendar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'Focus' | 'Planner'>('Focus');

  // Load from local storage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('focus_app_tasks');
    return local ? JSON.parse(local) : [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const local = localStorage.getItem('focus_app_courses');
    return local ? JSON.parse(local) : [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const local = localStorage.getItem('focus_app_notes');
    return local ? JSON.parse(local) : [];
  });

  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>(() => {
    const local = localStorage.getItem('focus_app_scheduled');
    return local ? JSON.parse(local) : [];
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const local = localStorage.getItem('focus_app_focus_sessions');
    return local ? JSON.parse(local) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const local = localStorage.getItem('focus_app_settings');
    if (local) return JSON.parse(local);
    return {
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      longBreakMinutes: 15,
      focusModeAutoCollapseLeftPanel: true,
      focusModeDimBackground: true,
      taskCalendarSyncMode: 'internal-only',
    };
  });

  const [googleClientId, setGoogleClientIdState] = useState<string | null>(() => {
    return localStorage.getItem('focus_app_google_client_id');
  });

  const setGoogleClientId = (id: string | null) => {
    setGoogleClientIdState(id);
    if (id) {
      localStorage.setItem('focus_app_google_client_id', id);
    } else {
      localStorage.removeItem('focus_app_google_client_id');
    }
  };

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('focus_app_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('focus_app_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('focus_app_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('focus_app_scheduled', JSON.stringify(scheduledSessions));
  }, [scheduledSessions]);

  useEffect(() => {
    localStorage.setItem('focus_app_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem('focus_app_settings', JSON.stringify(settings));
  }, [settings]);

  // Modal / Warning states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isPlanTodayOpen, setIsPlanTodayOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [googleCalendarSyncStatus, setGoogleCalendarSyncStatus] = useState<'synced' | 'failed' | 'not-configured'>('not-configured');
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);

  // Pomodoro States
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const local = localStorage.getItem('focus_app_active_task_id');
    return local || null;
  });
  const [timerState, setTimerState] = useState<AppContextType['timerState']>('idle');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(settings.pomodoroFocusMinutes * 60);
  const [timerTotalDuration, setTimerTotalDuration] = useState(settings.pomodoroFocusMinutes * 60);
  const [activeFocusSessionId, setActiveFocusSessionId] = useState<string | null>(null);

  // Sync activeTaskId to local storage
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('focus_app_active_task_id', activeTaskId);
    } else {
      localStorage.removeItem('focus_app_active_task_id');
    }
  }, [activeTaskId]);

  // Timer Ref
  const timerIntervalRef = useRef<any>(null);

  // Sound States and Web Audio API Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Record<string, { gainNode: GainNode; sourceNode: AudioNode | AudioScheduledSourceNode | null }>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  
  const [ambientChannels, setAmbientChannels] = useState<AmbientChannel[]>(() => {
    const local = localStorage.getItem('focus_app_ambient');
    let channels = local ? JSON.parse(local) : null;

    const defaultChannels = [
      { id: 'rain', name: 'Rain', sourceType: 'local-audio', sourceUrl: '', volume: 50, muted: true, active: false },
      { id: 'brown-noise', name: 'Brown Noise', sourceType: 'local-audio', sourceUrl: '', volume: 30, muted: true, active: false },
      { id: 'cafe', name: 'Cafe Chat', sourceType: 'remote-audio', sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2020/02/Coffee-shop-background-noise.mp3', volume: 40, muted: true, active: false },
      { id: 'fireplace', name: 'Fireplace', sourceType: 'remote-audio', sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2015/10/Fire-crackling.mp3', volume: 50, muted: true, active: false },
      { id: 'waves', name: 'Ocean Waves', sourceType: 'remote-audio', sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2014/10/Ocean-sound.mp3', volume: 30, muted: true, active: false },
    ];

    if (channels) {
      // Migrate 'keyboard' to 'waves' in existing local storage
      channels = channels.map((c: any) => {
        if (c.id === 'keyboard') {
          return { id: 'waves', name: 'Ocean Waves', sourceType: 'remote-audio', sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2014/10/Ocean-sound.mp3', volume: 30, muted: c.muted, active: c.active };
        }
        if (c.id === 'cafe') {
          return { ...c, sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2020/02/Coffee-shop-background-noise.mp3' };
        }
        if (c.id === 'fireplace') {
          return { ...c, sourceUrl: 'https://www.orangefreesounds.com/wp-content/uploads/2015/10/Fire-crackling.mp3' };
        }
        return c;
      });

      // Ensure 'waves' exists if not present
      if (!channels.some((c: any) => c.id === 'waves')) {
        channels.push(defaultChannels[4]);
      }
      // Remove any leftover 'keyboard' channel
      channels = channels.filter((c: any) => c.id !== 'keyboard');
      return channels;
    }
    return defaultChannels;
  });

  useEffect(() => {
    localStorage.setItem('focus_app_ambient', JSON.stringify(ambientChannels));
  }, [ambientChannels]);

  // Settings Updates
  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // If we are currently idle, update the timer seconds to match new settings
      if (timerState === 'idle') {
        setTimerSecondsLeft(next.pomodoroFocusMinutes * 60);
        setTimerTotalDuration(next.pomodoroFocusMinutes * 60);
      }
      return next;
    });
  };

  // Helper Web Audio synthesis for rain & brown noise offline capability
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const startProceduralNoise = (type: 'brown' | 'rain', volume: number, channelId: string) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Stop existing if any
    stopChannelAudio(channelId);

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate volume
      }
    } else { // rain synthesis (white noise + custom filter)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter for Rain to make it sound soft
    let finalNode: AudioNode = noiseSource;
    if (type === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      noiseSource.connect(filter);
      
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'peaking';
      filter2.frequency.value = 300;
      filter2.Q.value = 1.0;
      filter2.gain.value = 4;
      filter.connect(filter2);

      finalNode = filter2;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume / 100;

    finalNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(0);

    audioNodesRef.current[channelId] = {
      gainNode,
      sourceNode: noiseSource,
    };
  };



  const stopChannelAudio = (channelId: string) => {
    const item = audioNodesRef.current[channelId];
    if (item) {
      if (item.sourceNode && 'stop' in item.sourceNode) {
        try {
          (item.sourceNode as AudioScheduledSourceNode).stop();
        } catch (e) {}
      }
      try {
        item.gainNode.disconnect();
      } catch (e) {}
      delete audioNodesRef.current[channelId];
    }
  };

  const updateChannelVolume = (channelId: string, volume: number) => {
    const item = audioNodesRef.current[channelId];
    if (item) {
      item.gainNode.gain.value = volume / 100;
    }
  };

  const startHtml5Audio = (url: string, volume: number, channelId: string) => {
    let audio = audioElementsRef.current[channelId];
    if (!audio) {
      audio = new Audio(url);
      audio.loop = true;
      audioElementsRef.current[channelId] = audio;
      audio.volume = volume / 100;
      audio.play().catch(err => {
        console.warn("HTML5 audio playback blocked/failed for", channelId, err);
      });
    } else {
      if (audio.src !== url) {
        audio.pause();
        audio = new Audio(url);
        audio.loop = true;
        audioElementsRef.current[channelId] = audio;
        audio.volume = volume / 100;
        audio.play().catch(err => {
          console.warn("HTML5 audio playback blocked/failed for", channelId, err);
        });
      } else {
        audio.volume = volume / 100;
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
    }
  };

  const stopHtml5Audio = (channelId: string) => {
    const audio = audioElementsRef.current[channelId];
    if (audio) {
      audio.pause();
    }
  };



  useEffect(() => {
    if (ambientPlaying) {
      initAudio();
      ambientChannels.forEach(c => {
        if (!c.muted && c.active) {
          if (c.id === 'brown-noise') {
            if (!audioNodesRef.current[c.id]) {
              startProceduralNoise('brown', c.volume, c.id);
            } else {
              updateChannelVolume(c.id, c.volume);
            }
          } else if (c.id === 'rain') {
            if (!audioNodesRef.current[c.id]) {
              startProceduralNoise('rain', c.volume, c.id);
            } else {
              updateChannelVolume(c.id, c.volume);
            }
          } else if (c.sourceUrl) {
            // HTML5 Audio elements bypass CORS blocks on remote mp3 feeds
            startHtml5Audio(c.sourceUrl, c.volume, c.id);
          }
        } else {
          stopChannelAudio(c.id);
          stopHtml5Audio(c.id);
        }
      });
    } else {
      Object.keys(audioNodesRef.current).forEach(stopChannelAudio);
      Object.keys(audioElementsRef.current).forEach(stopHtml5Audio);
    }
  }, [ambientChannels, ambientPlaying]);

  const toggleAmbientChannel = (id: string) => {
    setAmbientChannels(prev => prev.map(c => {
      if (c.id === id) {
        const nextMute = !c.muted;
        return { ...c, muted: nextMute, active: !nextMute };
      }
      return c;
    }));
    setAmbientPlaying(true);
  };

  const setAmbientChannelVolume = (id: string, volume: number) => {
    setAmbientChannels(prev => prev.map(c => {
      if (c.id === id) {
        const isMuted = volume === 0;
        return { 
          ...c, 
          volume, 
          muted: isMuted ? true : false, 
          active: volume > 0 ? true : false 
        };
      }
      return c;
    }));
    if (volume > 0) {
      setAmbientPlaying(true);
    }
  };

  // Timer Tick logic
  useEffect(() => {
    if (timerState === 'running' || timerState === 'break-running') {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState]);

  const handleTimerComplete = () => {
    // Play completion beep
    try {
      const audio = new AudioContext();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audio.currentTime); // C5
      gain.gain.setValueAtTime(0.2, audio.currentTime);
      osc.start();
      osc.stop(audio.currentTime + 0.5);
    } catch(e) {}

    // Complete the Focus Session
    if (timerState === 'running') {
      setTimerState('completed');
      logFocusSessionResult('completed');
    } else if (timerState === 'break-running') {
      setTimerState('idle');
      setTimerSecondsLeft(settings.pomodoroFocusMinutes * 60);
      setTimerTotalDuration(settings.pomodoroFocusMinutes * 60);
    }
  };

  // Task Operations
  const addTask = (title: string, data: Partial<Task> = {}) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      status: 'inbox',
      priority: 'medium',
      energyLevel: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: 'other',
      notes: '',
      subtasks: [],
      scheduledSessions: [],
      focusSessions: [],
      source: 'manual',
      links: [],
      ...data,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          subtasks: updates.subtasks ? updates.subtasks : t.subtasks,
          updatedAt: Date.now(),
        };
      }
      return t;
    }));
  };

  const deleteTask = (taskId: string) => {
    if (activeTaskId === taskId) {
      deactivateTask();
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    // Remove its scheduled sessions
    setScheduledSessions(prev => prev.filter(s => s.taskId !== taskId));
  };

  const moveTask = (taskId: string, targetStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // Strict 3-task limit on Today
    if (targetStatus === 'today') {
      const todayCount = tasks.filter(t => t.status === 'today' && t.id !== taskId).length;
      if (todayCount >= 3) {
        setWarningMessage('Today is full. Move one task out before adding another.');
        return false;
      }
    }

    // Active limit
    if (targetStatus === 'active') {
      activateTask(taskId);
      return true;
    }

    // Deactivate if currently active
    if (task.status === 'active') {
      setActiveTaskId(null);
      if (timerState !== 'idle') {
        resetTimer();
      }
    }

    updateTask(taskId, {
      status: targetStatus,
      completedAt: targetStatus === 'done' ? Date.now() : undefined,
    });
    return true;
  };

  const activateTask = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    if (activeTaskId === taskId) return;

    // If timer is running and active task is replaced
    if (timerState === 'running' || timerState === 'break-running') {
      setWarningMessage('A focus session is already running. Please pause/reset before changing active tasks.');
      return;
    }

    // If there is an existing inactive/paused task in the Active slot, return it to Today/Inbox
    if (activeTaskId) {
      const oldActiveTask = tasks.find(t => t.id === activeTaskId);
      if (oldActiveTask) {
        const todayCount = tasks.filter(t => t.status === 'today').length;
        const targetStatus: Task['status'] = todayCount < 3 ? 'today' : 'inbox';
        updateTask(activeTaskId, { status: targetStatus });
      }
    }

    // Put new task in Active status
    updateTask(taskId, { status: 'active' });
    setActiveTaskId(taskId);

    // Prepare timer for focus mode
    setTimerSecondsLeft(settings.pomodoroFocusMinutes * 60);
    setTimerTotalDuration(settings.pomodoroFocusMinutes * 60);
    setTimerState('idle');
  };

  const deactivateTask = () => {
    if (!activeTaskId) return;
    const task = tasks.find(t => t.id === activeTaskId);
    if (task) {
      const todayCount = tasks.filter(t => t.status === 'today').length;
      const targetStatus: Task['status'] = todayCount < 3 ? 'today' : 'inbox';
      updateTask(activeTaskId, { status: targetStatus });
    }
    setActiveTaskId(null);
    resetTimer();
  };

  const completeActiveTask = () => {
    if (!activeTaskId) return;
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    logFocusSessionResult('completed');
    updateTask(activeTaskId, { status: 'done', completedAt: Date.now() });
    setActiveTaskId(null);
    setTimerState('idle');
  };

  // Course Operations
  const addCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, ...updates, updatedAt: Date.now() };
      }
      return c;
    }));
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    // Clear course references in tasks
    setTasks(prev => prev.map(t => {
      if (t.courseId === courseId) {
        return { ...t, courseId: undefined };
      }
      return t;
    }));
  };

  // Note Operations
  const addNote = (content: string, courseId?: string, linkedTaskId?: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      content: content.trim(),
      courseId,
      linkedTaskId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Scheduled Sessions
  const addScheduledSession = (taskId: string, startTime: string, endTime: string) => {
    const newSession: ScheduledSession = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      startTime,
      endTime,
      calendarSyncStatus: 'internal-only',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setScheduledSessions(prev => [...prev, newSession]);
    
    // Add reference to task
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          scheduledSessions: [...t.scheduledSessions, newSession.id],
        };
      }
      return t;
    }));

    return newSession;
  };

  const updateScheduledSession = (sessionId: string, startTime: string, endTime: string) => {
    setScheduledSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, startTime, endTime, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const deleteScheduledSession = (sessionId: string) => {
    const session = scheduledSessions.find(s => s.id === sessionId);
    if (!session) return;

    setScheduledSessions(prev => prev.filter(s => s.id !== sessionId));
    
    // Remove reference from task
    setTasks(prev => prev.map(t => {
      if (t.id === session.taskId) {
        return {
          ...t,
          scheduledSessions: t.scheduledSessions.filter(id => id !== sessionId),
        };
      }
      return t;
    }));
  };

  // Quick Capture Parser
  const parseQuickCapture = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return { type: 'task' as const, message: '' };

    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
      // Single word, create a task by default
      const task = addTask(trimmed, { source: 'quick-capture' });
      return { type: 'task' as const, message: `Created task: "${task.title}"` };
    }

    const prefix = trimmed.substring(0, spaceIndex).toLowerCase();
    const content = trimmed.substring(spaceIndex + 1).trim();

    if (prefix === 'note') {
      addNote(content);
      return { type: 'note' as const, message: `Captured note: "${content}"` };
    } else if (prefix === 'resource') {
      addNote(content);
      return { type: 'note' as const, message: `Added resource note: "${content}"` };
    } else if (prefix === 'exam') {
      const task = addTask(`Exam Prep: ${content}`, { type: 'exam-prep', priority: 'high', source: 'quick-capture' });
      return { type: 'task' as const, message: `Created exam task: "${task.title}"` };
    } else if (prefix === 'course') {
      const words = content.split(' ');
      const code = words[0].toUpperCase();
      const name = words.slice(1).join(' ') || code;
      const course = addCourse({
        name,
        displayName: code,
        color: '#8b5cf6', // default purple
        icon: '📚',
        links: [],
      });
      return { type: 'course' as const, message: `Added Course: ${course.displayName} (${course.name})` };
    } else if (prefix === 'task') {
      const task = addTask(content, { source: 'quick-capture' });
      return { type: 'task' as const, message: `Created task: "${task.title}"` };
    } else {
      // If prefix is not recognized, create a task with the entire input string
      const task = addTask(trimmed, { source: 'quick-capture' });
      return { type: 'task' as const, message: `Created task: "${task.title}"` };
    }
  };

  // Timer Controls
  const startTimer = () => {
    if (!activeTaskId) return;
    
    initAudio(); // Initialize audio context on user action if not done

    if (timerState === 'idle') {
      // Start a new Focus Session log
      const newSessionId = Math.random().toString(36).substring(2, 9);
      const newSession: FocusSession = {
        id: newSessionId,
        taskId: activeTaskId,
        startTime: Date.now(),
        plannedMinutes: settings.pomodoroFocusMinutes,
        sessionType: 'focus',
        result: 'unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setFocusSessions(prev => [...prev, newSession]);
      setActiveFocusSessionId(newSessionId);
      
      setTimerState('running');
    } else if (timerState === 'paused') {
      setTimerState('running');
    } else if (timerState === 'break-paused') {
      setTimerState('break-running');
    }
  };

  const pauseTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused');
    } else if (timerState === 'break-running') {
      setTimerState('break-paused');
    }
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerState('idle');
    setTimerSecondsLeft(settings.pomodoroFocusMinutes * 60);
    setTimerTotalDuration(settings.pomodoroFocusMinutes * 60);
    
    if (activeFocusSessionId) {
      logFocusSessionResult('interrupted');
    }
  };

  const extendFocus = (minutes: number) => {
    setTimerSecondsLeft(prev => prev + minutes * 60);
    setTimerTotalDuration(prev => prev + minutes * 60);
    setTimerState('running');
    
    // Update active focus session log if present
    if (activeFocusSessionId) {
      setFocusSessions(prev => prev.map(s => {
        if (s.id === activeFocusSessionId) {
          return {
            ...s,
            plannedMinutes: s.plannedMinutes + minutes,
            updatedAt: Date.now(),
          };
        }
        return s;
      }));
    }
  };

  const startBreakMode = (isLong = false) => {
    const breakMin = isLong ? settings.longBreakMinutes : settings.pomodoroBreakMinutes;
    setTimerSecondsLeft(breakMin * 60);
    setTimerTotalDuration(breakMin * 60);
    setTimerState('break-running');

    // Create break session log
    const breakSessionId = Math.random().toString(36).substring(2, 9);
    const newBreak: FocusSession = {
      id: breakSessionId,
      taskId: activeTaskId || '',
      startTime: Date.now(),
      plannedMinutes: breakMin,
      sessionType: 'break',
      result: 'unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFocusSessions(prev => [...prev, newBreak]);
  };

  const logFocusSessionResult = (result: FocusSession['result']) => {
    if (!activeFocusSessionId) return;

    const actualMin = Math.round((timerTotalDuration - timerSecondsLeft) / 60);
    
    setFocusSessions(prev => prev.map(s => {
      if (s.id === activeFocusSessionId) {
        return {
          ...s,
          endTime: Date.now(),
          actualMinutes: actualMin,
          result,
          updatedAt: Date.now(),
        };
      }
      return s;
    }));

    // Append session ID to active task focusSessions array
    if (activeTaskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === activeTaskId) {
          return {
            ...t,
            focusSessions: [...t.focusSessions, activeFocusSessionId],
          };
        }
        return t;
      }));
    }

    setActiveFocusSessionId(null);
  };

  // Load Google Identity Services script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchGoogleCalendarEvents = async (accessToken: string) => {
    try {
      // Calculate start of current week (Monday) to capture past events in the same week view
      const startOfWeek = new Date();
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff - 1); // Buffer of 1 day back (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      const timeMin = startOfWeek.toISOString();

      // 1. Fetch all user calendars (school, personal, classes)
      const listResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      let calendars = [{ id: 'primary', backgroundColor: '#3b82f6' }];
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.items && listData.items.length > 0) {
          calendars = listData.items.map((item: any) => ({
            id: item.id,
            backgroundColor: item.backgroundColor || '#3b82f6',
          }));
        }
      }

      // 2. Fetch events from all calendars in parallel
      const fetchPromises = calendars.map(async (cal) => {
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&maxResults=80&singleEvents=true&orderBy=startTime`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (!response.ok) return [];
          const data = await response.json();
          return (data.items || []).map((item: any) => ({
            id: item.id,
            summary: item.summary || 'Google Calendar Event',
            startTime: item.start.dateTime || item.start.date,
            endTime: item.end.dateTime || item.end.date,
            color: cal.backgroundColor,
          }));
        } catch (err) {
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const mergedEvents = results.flat();

      // Deduplicate events by id to avoid duplicate key issues in rendering
      const uniqueEventsMap = new Map<string, any>();
      for (const ev of mergedEvents) {
        if (ev && ev.id && !uniqueEventsMap.has(ev.id)) {
          uniqueEventsMap.set(ev.id, ev);
        }
      }
      const uniqueEvents = Array.from(uniqueEventsMap.values());

      setGoogleCalendarEvents(uniqueEvents);
      setGoogleCalendarSyncStatus('synced');
    } catch (e) {
      console.error("Failed to fetch google calendar:", e);
      setGoogleCalendarSyncStatus('failed');
    }
  };

  const syncGoogleCalendar = () => {
    if (!googleClientId) {
      setGoogleCalendarSyncStatus('failed');
      return;
    }
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setGoogleCalendarSyncStatus('failed');
            return;
          }
          await fetchGoogleCalendarEvents(tokenResponse.access_token);
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      console.error("OAuth init failed:", e);
      setGoogleCalendarSyncStatus('failed');
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      tasks,
      courses,
      notes,
      scheduledSessions,
      focusSessions,
      settings,

      addTask,
      updateTask,
      deleteTask,
      moveTask,
      completeActiveTask,

      addCourse,
      updateCourse,
      deleteCourse,

      addNote,
      deleteNote,

      addScheduledSession,
      updateScheduledSession,
      deleteScheduledSession,

      parseQuickCapture,

      timerState,
      timerSecondsLeft,
      timerTotalDuration,
      activeTaskId,
      activeFocusSessionId,
      startTimer,
      pauseTimer,
      resetTimer,
      activateTask,
      deactivateTask,
      extendFocus,
      startBreakMode,
      logFocusSessionResult,

      ambientChannels,
      toggleAmbientChannel,
      setAmbientChannelVolume,
      ambientPlaying,
      setAmbientPlaying,

      selectedTaskId,
      setSelectedTaskId,
      selectedCourseId,
      setSelectedCourseId,
      isPlanTodayOpen,
      setIsPlanTodayOpen,
      isAddCourseOpen,
      setIsAddCourseOpen,
      warningMessage,
      setWarningMessage,
      googleCalendarSyncStatus,
      setGoogleCalendarSyncStatus,
      updateSettings,
      googleClientId,
      setGoogleClientId,
      googleCalendarEvents,
      syncGoogleCalendar,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

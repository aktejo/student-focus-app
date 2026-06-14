export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  status: 'inbox' | 'today' | 'active' | 'done';
  courseId?: string;
  dueDate?: string; // ISO date/time or YYYY-MM-DD
  priority: 'low' | 'medium' | 'high' | 'urgent';
  energyLevel: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  type: 'assignment' | 'reading' | 'lecture' | 'study' | 'admin' | 'exam-prep' | 'other';
  notes: string;
  subtasks: Subtask[];
  scheduledSessions: string[]; // ScheduledSession IDs
  focusSessions: string[]; // FocusSession IDs
  source: 'quick-capture' | 'manual' | 'calendar' | 'imported' | 'other';
  links: string[];
}

export interface Note {
  id: string;
  content: string;
  courseId?: string;
  createdAt: number;
  updatedAt: number;
  linkedTaskId?: string;
}

export interface Course {
  id: string;
  name: string;
  displayName: string;
  color: string; // Tailwind-like color or hex (e.g. '#3b82f6')
  icon: string; // emoji or lucide icon name
  professor?: string;
  lectureTimes?: string;
  discussionTimes?: string;
  labTimes?: string;
  location?: string;
  links: string[];
  defaultPriority?: 'low' | 'medium' | 'high' | 'urgent';
  defaultEnergyLevel?: 'low' | 'medium' | 'high';
  defaultEstimatedMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduledSession {
  id: string;
  taskId: string;
  startTime: string; // ISO String (e.g. 2026-05-26T10:00:00Z)
  endTime: string; // ISO String
  calendarSyncStatus: 'internal-only' | 'synced' | 'pending' | 'failed';
  externalCalendarEventId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  plannedMinutes: number;
  actualMinutes?: number;
  sessionType: 'focus' | 'break';
  result: 'completed' | 'returned-to-today' | 'extended' | 'interrupted' | 'unknown';
  createdAt: number;
  updatedAt: number;
}

export interface AmbientChannel {
  id: string;
  name: string;
  sourceType: 'local-audio' | 'remote-audio' | 'video-embed';
  sourceUrl: string;
  volume: number; // 0-100
  muted: boolean;
  active: boolean;
}

export interface Settings {
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  longBreakMinutes: number;
  focusModeAutoCollapseLeftPanel: boolean;
  focusModeDimBackground: boolean;
  taskCalendarSyncMode: 'internal-only' | 'ask-every-time' | 'sync-automatically';
  googleClientId?: string;
}

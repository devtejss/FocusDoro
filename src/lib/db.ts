import Dexie, { type Table } from "dexie";

export type SessionType = "focus" | "short" | "long";

export interface SessionRow {
  id?: number;
  type: SessionType;
  startedAt: number; // epoch ms
  durationSec: number;
  completed: 1 | 0;
}

export type Priority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskRow {
  id?: number;
  title: string;
  category: string;
  categoryColor: string;
  tags: string[];
  subtasks: Subtask[];
  priority: Priority;
  emoji: string;
  recurring: boolean;
  recurDays: number[]; // 0..6
  completed: 0 | 1;
  createdAt: number;
}

class FocusdoroDB extends Dexie {
  sessions!: Table<SessionRow, number>;
  tasks!: Table<TaskRow, number>;
  constructor() {
    super("focusdoro");
    this.version(1).stores({
      sessions: "++id, startedAt, type, completed",
      tasks: "++id, completed, createdAt, priority",
    });
  }
}

let _db: FocusdoroDB | null = null;
export function getDB(): FocusdoroDB {
  if (typeof window === "undefined") {
    throw new Error("DB only available in browser");
  }
  if (!_db) _db = new FocusdoroDB();
  return _db;
}
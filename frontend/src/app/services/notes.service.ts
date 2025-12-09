import { Injectable, signal } from '@angular/core';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

type PartialNote = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>> & Partial<Pick<Note, 'updatedAt'>>;

const STORAGE_KEY = 'op_notes_v1';
const STORAGE_LAST_ID = 'op_notes_last_id';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private _notes = signal<Note[]>(this.load());
  private _currentId = signal<string | null>(this.loadLastId());
  private _lastSavedAt: number | null = null;
  private _saveTimeout: number | undefined = undefined;

  // PUBLIC_INTERFACE
  notes = this._notes.asReadonly.bind(this._notes)() as typeof this._notes;

  // PUBLIC_INTERFACE
  currentNoteId() { return this._currentId(); }

  // PUBLIC_INTERFACE
  getNote(id: string): Note | undefined {
    return this._notes().find(n => n.id === id);
  }

  // PUBLIC_INTERFACE
  createNote(): Note {
    const now = Date.now();
    const n: Note = {
      id: uid(),
      title: 'Untitled',
      content: '',
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    const list = [n, ...this._notes()];
    this._notes.set(list);
    this._currentId.set(n.id);
    this.persist();
    return n;
  }

  // PUBLIC_INTERFACE
  updateNote(id: string, patch: PartialNote): void {
    const list = this._notes().map(n => {
      if (n.id !== id) return n;
      const updated = { ...n, ...patch, updatedAt: Date.now() };
      return updated;
    });
    this._notes.set(list);
    this._currentId.set(id);
    this.scheduleSave();
  }

  // PUBLIC_INTERFACE
  deleteNote(id: string): void {
    const list = this._notes().filter(n => n.id !== id);
    this._notes.set(list);
    if (this._currentId() === id) {
      this._currentId.set(list[0]?.id ?? null);
    }
    this.persist();
  }

  // PUBLIC_INTERFACE
  getLastSavedAt(): Date | null {
    return this._lastSavedAt ? new Date(this._lastSavedAt) : null;
  }

  // PUBLIC_INTERFACE
  flushSaveNow(): void {
    if (this._saveTimeout !== undefined) {
      if (typeof globalThis.clearTimeout !== 'undefined') globalThis.clearTimeout(this._saveTimeout);
      this._saveTimeout = undefined;
    }
    this.persist();
  }

  // PUBLIC_INTERFACE
  getDefaultRouteNoteId(): string | null {
    if (this._currentId()) return this._currentId();
    const list = this._notes();
    if (list.length) return list.sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
    return null;
  }

  private scheduleSave() {
    if (this._saveTimeout !== undefined && typeof globalThis.clearTimeout !== 'undefined') {
      globalThis.clearTimeout(this._saveTimeout);
    }
    if (typeof globalThis.setTimeout !== 'undefined') {
      this._saveTimeout = globalThis.setTimeout(() => this.persist(), 600) as unknown as number;
    } else {
      this.persist();
    }
  }

  private persist() {
    try {
      if (typeof globalThis.localStorage === 'undefined') return;
      const data = JSON.stringify(this._notes());
      globalThis.localStorage.setItem(STORAGE_KEY, data);
      const currentId = this._currentId();
      if (currentId) globalThis.localStorage.setItem(STORAGE_LAST_ID, currentId);
      this._lastSavedAt = Date.now();
    } catch (e) {
      // Fallback no-op if storage unavailable
      console.error('Failed to persist notes', e);
    }
  }

  private load(): Note[] {
    try {
      if (typeof globalThis.localStorage === 'undefined') return [];
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw) as Note[];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private loadLastId(): string | null {
    try {
      if (typeof globalThis.localStorage === 'undefined') return null;
      return globalThis.localStorage.getItem(STORAGE_LAST_ID);
    } catch {
      return null;
    }
  }
}

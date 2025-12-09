import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotesService, Note } from '../../services/notes.service';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css'
})
export class NoteEditorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notes = inject(NotesService);

  id = signal<string | null>(null);
  note = signal<Note | null>(null);
  title = signal<string>('');
  content = signal<string>('');
  tags = signal<string[]>([]);
  pinned = signal<boolean>(false);
  lastSaved = signal<Date | null>(null);

  allTags = computed(() => {
    const s = new Set<string>();
    this.notes.notes().forEach(n => n.tags.forEach(t => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  });

  constructor() {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) {
        this.id.set(id);
        const n = this.notes.getNote(id);
        if (n) {
          this.note.set(n);
          this.title.set(n.title);
          this.content.set(n.content);
          this.tags.set([...n.tags]);
          this.pinned.set(!!n.pinned);
        } else {
          const created = this.notes.createNote();
          this.router.navigate(['/notes', created.id]);
        }
      } else {
        const created = this.notes.createNote();
        this.router.navigate(['/notes', created.id]);
      }
    });

    effect(() => {
      const id = this.id();
      if (!id) return;
      const patch: Partial<Note> = {
        title: this.title(),
        content: this.content(),
        tags: this.tags(),
        pinned: this.pinned()
      };
      this.notes.updateNote(id, patch);
      this.lastSaved.set(this.notes.getLastSavedAt());
    });
  }

  // PUBLIC_INTERFACE
  onTitleChange(val: any): void { this.title.set(String(val ?? '')); }
  // PUBLIC_INTERFACE
  onContentChange(val: any): void { this.content.set(String(val ?? '')); }

  // PUBLIC_INTERFACE
  addTagFromKeyEvent(ev: any): void {
    const inputEl = ev?.target;
    if (!inputEl) return;
    const tag = String(inputEl.value || '').trim();
    if (!tag) return;
    if (!this.tags().includes(tag)) this.tags.set([...this.tags(), tag]);
    inputEl.value = '';
  }

  // PUBLIC_INTERFACE
  removeTag(tag: string): void {
    this.tags.set(this.tags().filter(t => t !== tag));
  }

  // PUBLIC_INTERFACE
  togglePinned(): void {
    this.pinned.set(!this.pinned());
  }

  // PUBLIC_INTERFACE
  deleteNote(): void {
    const id = this.id();
    if (!id) return;
    const ok = typeof confirm !== 'undefined' ? confirm('Delete this note? This cannot be undone.') : true;
    if (!ok) return;
    this.notes.deleteNote(id);
    const next = this.notes.getDefaultRouteNoteId();
    if (next) this.router.navigate(['/notes', next]);
    else this.router.navigate(['/']);
  }

  // PUBLIC_INTERFACE
  formatAsMarkdown(): void {
    if (typeof alert !== 'undefined') {
      alert('Markdown preview can be added later. Content is saved as plain text for now.');
    }
  }

  // PUBLIC_INTERFACE
  canSave(): boolean {
    return !!this.id();
  }

  // PUBLIC_INTERFACE
  saveNow(): void {
    this.notes.flushSaveNow();
    this.lastSaved.set(this.notes.getLastSavedAt());
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: any): void {
    const key = (e?.key || '').toLowerCase?.() || '';
    const meta = !!(e?.ctrlKey || e?.metaKey);
    if (meta && key === 's') {
      e.preventDefault?.();
      this.saveNow();
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotesService, Note } from '../../services/notes.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private notesSvc = inject(NotesService);
  private router = inject(Router);

  query = signal<string>('');
  tagFilter = signal<string>('all');
  sortBy = signal<'updatedAt' | 'title'>('updatedAt');

  allTags = computed(() => {
    const tags = new Set<string>();
    for (const n of this.notesSvc.notes()) n.tags.forEach(t => tags.add(t));
    return ['all', ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tag = this.tagFilter();
    const sort = this.sortBy();
    let list = this.notesSvc.notes();

    if (tag !== 'all') list = list.filter(n => n.tags.includes(tag));
    if (q) {
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === 'updatedAt') return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      return a.title.localeCompare(b.title);
    });

    return list;
  });

  constructor() {
    effect(() => {
      const currentId = this.notesSvc.currentNoteId();
      if (!currentId && this.filtered().length) {
        this.router.navigate(['/notes', this.filtered()[0].id]);
      }
    });
  }

  // PUBLIC_INTERFACE
  selectTag(tag: string): void { this.tagFilter.set(tag); }

  // PUBLIC_INTERFACE
  onNew(): void {
    const note = this.notesSvc.createNote();
    this.router.navigate(['/notes', note.id]);
  }

  // PUBLIC_INTERFACE
  togglePin(n: Note, ev: any): void {
    if (ev?.stopPropagation) ev.stopPropagation();
    if (ev?.preventDefault) ev.preventDefault();
    this.notesSvc.updateNote(n.id, { pinned: !n.pinned });
  }

  // PUBLIC_INTERFACE
  trackById(_i: number, n: Note) { return n.id; }
}

import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Personal Notes Manager';
  private router = inject(Router);
  private notes = inject(NotesService);

  // PUBLIC_INTERFACE
  @HostListener('document:keydown', ['$event'])
  /** Handle global keyboard shortcuts: Ctrl/Cmd+N (new), Ctrl/Cmd+S (save), Delete (delete current). */
  onKeydown(e: any): void {
    const key = (e?.key || '').toLowerCase?.() || '';
    const meta = !!(e?.ctrlKey || e?.metaKey);
    if (meta && key === 'n') {
      e.preventDefault?.();
      const note = this.notes.createNote();
      this.router.navigate(['/notes', note.id]);
    } else if (meta && key === 's') {
      e.preventDefault?.();
      this.notes.flushSaveNow();
    } else if ((e?.key || '') === 'Delete') {
      const currentId = this.notes.currentNoteId();
      if (currentId) {
        const ok = typeof confirm !== 'undefined' ? confirm('Delete this note? This cannot be undone.') : true;
        if (ok) {
          this.notes.deleteNote(currentId);
          const next = this.notes.getDefaultRouteNoteId();
          if (next) this.router.navigate(['/notes', next]);
          else this.router.navigate(['/']);
        }
      }
    }
  }
}

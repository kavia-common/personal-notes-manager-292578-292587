import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  template: `<div style="padding:16px; color:#6b7280">Redirecting…</div>`
})
export class RedirectComponent {
  private router = inject(Router);
  private notes = inject(NotesService);

  constructor() {
    const id = this.notes.getDefaultRouteNoteId();
    if (id) this.router.navigate(['/notes', id]);
    else this.router.navigate(['/notes', 'new']);
  }
}

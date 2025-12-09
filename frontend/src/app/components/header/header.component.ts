import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private router = inject(Router);
  private notes = inject(NotesService);

  // PUBLIC_INTERFACE
  newNote(): void {
    const note = this.notes.createNote();
    this.router.navigate(['/notes', note.id]);
  }
}

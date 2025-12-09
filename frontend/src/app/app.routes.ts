import { Routes } from '@angular/router';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { RedirectComponent } from './components/redirect/redirect.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: RedirectComponent },
  { path: 'notes/new', component: NoteEditorComponent },
  { path: 'notes/:id', component: NoteEditorComponent },
  { path: '**', redirectTo: '' }
];

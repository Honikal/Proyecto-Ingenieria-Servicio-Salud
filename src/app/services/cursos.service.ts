import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { FirebaseService } from './firebase';
import { Curso } from '../../models/curso.model';

@Injectable({ providedIn: 'root' })
export class CursosService {
  private fb = inject(FirebaseService) as any;

  getCursosBySocio(idSocio: string): Observable<Curso[]> {
    const src$ =
      (this.fb.collection$ && this.fb.collection$('cursos')) ||
      (this.fb.getCollection$ && this.fb.getCollection$('cursos')) ||
      of([]);

    return src$.pipe(
      map((todos: any[]) => (todos || []).filter(c => c?.idSocio === idSocio))
    );
  }

  getCursoById(id: string): Observable<Curso | null> {
    const fn = this.fb.doc$ || this.fb.getDoc$;
    if (typeof fn === 'function') {
      return fn(`cursos/${id}`) as Observable<Curso | null>;
    }
    return of(null);
  }
}
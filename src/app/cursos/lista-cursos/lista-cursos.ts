import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Curso } from '../../../models/curso.model';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-cursos.html',
  styleUrls: ['./lista-cursos.css']
})
export class ListaCursos implements OnInit {
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  cursos$!: Observable<Curso[]>;
  filtroNombre$ = new BehaviorSubject<string>('');

  constructor(
    private firebaseService: FirebaseService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.firebaseService.getCursosActivos().subscribe(cursos => {
      this.cursosSubject.next(cursos);
    });

    this.cursos$ = combineLatest([
      this.cursosSubject.asObservable(),
      this.filtroNombre$.asObservable()
    ]).pipe(
      map(([cursos, filtro]) => {
        const texto = filtro.toLowerCase();
        return cursos.filter(c => c.nombre.toLowerCase().includes(texto));
      })
    );
  }

  actualizarFiltro(texto: string) {
    this.filtroNombre$.next(texto);
  }

  verCurso(id: string) {
    this.router.navigate(['/ver-curso', id]);
  }

  volver() {
    this.router.navigate(['/']);
  }
}
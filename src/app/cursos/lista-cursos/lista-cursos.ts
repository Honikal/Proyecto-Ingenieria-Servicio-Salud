import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map  } from 'rxjs/operators';
import { Curso } from '../../../models/curso.model';
import { User } from '../../../models/user.model';
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
  isAuto$!: Observable<boolean>;

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

    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);

      // Observable en tiempo real del estado isAuto
      this.isAuto$ = this.firebaseService.getUserRealtime(user.id).pipe(
        map((u: User | null) => u?.isAuto === true)
      );
    } else {
      // Si no hay usuario, siempre falso
      this.isAuto$ = of(false);
    }
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

  crearCurso() {
    this.isAuto$.pipe(
      map(isAuto => {
        if (!isAuto) {
          return false;
        }
        return true;
      })
    ).subscribe(canCreate => {
      if (canCreate) {
        this.router.navigate(['/crear-curso']);
      }
    });
  }

}
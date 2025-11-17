import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Curso } from '../../../models/curso.model';
import { User } from '../../../models/user.model';
import { FirebaseService } from '../../services/firebase';
import { ionAdd } from '@ng-icons/ionicons';

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
  idSocio: string | null = null;
  from: string | null = null;
  filtroNombre$ = new BehaviorSubject<string>('');
  isAuto$!: Observable<boolean>;
  isAdmin: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Leer idSocio desde queryParams
    this.route.queryParams.subscribe(params => {
      this.idSocio = params['idSocio'] || null;
      this.from = params['from'] || 'user';

      if (this.idSocio) {
        this.firebaseService.getCursosDeSocioActivos(this.idSocio).subscribe(cursos => {
          this.cursosSubject.next(cursos);
        });
      } else {
        this.firebaseService.getCursosActivos().subscribe(cursos => {
          this.cursosSubject.next(cursos);
        });
      }
    });

    this.cursos$ = combineLatest([
      this.cursosSubject.asObservable(),
      this.filtroNombre$.asObservable()
    ]).pipe(
      map(([cursos, filtro]) => {
        const texto = filtro.toLowerCase();
        return cursos
          .filter(c => c.nombre.toLowerCase().includes(texto))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
      })
    );

    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      this.isAdmin = user.isAdmin === true;

      this.isAuto$ = this.firebaseService.getUserRealtime(user.id).pipe(
        map((u: User | null) => u?.isAuto === true)
      );
    } else {
      this.isAuto$ = of(false);
    }
  }

  actualizarFiltro(texto: string) {
    this.filtroNombre$.next(texto);
  }

  verCurso(id: string) {
    if(this.isAdmin){
      const queryParams = this.idSocio ? { idSocio: this.idSocio, from: 'user' } : {};
      this.router.navigate(['/ver-curso', id], { queryParams });
    }else{
      const queryParams = this.idSocio ? { idSocio: this.idSocio, from: 'socio' } : {};
      this.router.navigate(['/ver-curso', id], { queryParams });
    }

  }

  volver() {
    if (!this.idSocio) {
      this.router.navigate(['/']);
      return;
    }

    if (this.from === 'socio') {
      this.router.navigate(['/socios/dashboard-socio', this.idSocio]);
    } else {
      this.router.navigate(['/socios', this.idSocio]);
    }
  }
  crearCurso() {
    this.isAuto$.pipe(take(1)).subscribe(isAuto => {
      if (isAuto) {
        this.router.navigate(['/crear-curso']);
      }
    });
  }

  imagenError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/imagenError.jpg';
  }
}
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CursosService } from '../services/cursos.service';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-socio-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './socio-cursos.html',
  styleUrls: ['./socio-cursos.css']
})
export class SocioCursos {
  socio: any = null;
  cursos: Curso[] = [];
  cargando = true;

  private cursosService = inject(CursosService);
  private router = inject(Router);

  ngOnInit() {
    const raw = localStorage.getItem('currentSocio');
    if (!raw) { this.cargando = false; return; }

    this.socio = JSON.parse(raw);
    const socioId = this.socio?._id || this.socio?.id;
    if (!socioId) { this.cargando = false; return; }

    this.cursosService.getCursosBySocio(socioId).subscribe({
      next: lista => { this.cursos = lista || []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  entrar(curso: any) {
    const id = curso?.id || curso?._id;
    this.router.navigate(['/socios/curso', id]); // entra SIN pedir código
  }
}
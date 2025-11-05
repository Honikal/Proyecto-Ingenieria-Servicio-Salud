import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CursosService } from '../services/cursos.service';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-socio-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './socio-curso.html',
  styleUrls: ['./socio-curso.css']
})
export class SocioCurso {
  curso: Curso | null = null;
  cargando = true;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cursosService = inject(CursosService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.cursosService.getCursoById(id).subscribe({
      next: c => { this.curso = c; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  verExamenSoloLectura() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.router.navigate(['/examen', id], { queryParams: { readonly: 'true' } });
  }
}
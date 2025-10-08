import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';

@Component({
  selector: 'app-ver-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-curso.html',
  styleUrls: ['./ver-curso.css']
})
export class VerCurso implements OnInit {
  curso?: Curso;
  cargando = true;
  cuposRestantes: number = 0; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.firebaseService.getCursosActivos().subscribe({
        next: (cursosActivos) => {
          const cursoEncontrado = cursosActivos.find(c => c.id === id);
          if (cursoEncontrado) {
            this.curso = cursoEncontrado;
            this.calcularCuposRestantes();
          }
          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al obtener curso:', error);
          this.cargando = false;
          this.cdRef.detectChanges();
        }
      });
    } else {
      this.cargando = false;
      this.cdRef.detectChanges();
    }
  }

  calcularCuposRestantes() {
    if (this.curso) {
      const disponibles = this.curso.cupos - this.curso.cantPersonas;
      this.cuposRestantes = disponibles >= 0 ? disponibles : 0;
    }
  }

  volver() {
    this.router.navigate(['/cursos']);
  }

  descargarCertificado() {
    alert('Descargando certificado...');
  }

  ingresarLeccion() {
    alert('Ingresando a la lección...');
  }
}
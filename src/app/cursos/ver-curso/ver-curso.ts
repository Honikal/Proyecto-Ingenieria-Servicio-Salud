import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';
import Swal from 'sweetalert2';

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

  async ingresarLeccion() {
    const userData = localStorage.getItem("currentUser");

    if (!userData) {
      await Swal.fire({
        icon: 'warning',
        title: 'Inicie sesión',
        text: 'Debe iniciar sesión para ingresar al curso.',
        confirmButtonText: 'Ir al login',
        confirmButtonColor: '#3085d6'
      });
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userData);
    if (!this.curso) {
      Swal.fire('Error', 'No se ha cargado la información del curso.', 'error');
      return;
    }

    try {
      const matricula = await this.firebaseService.getMatriculaPorUsuarioYCurso(user.id, this.curso.id);

      if (matricula) {
        this.router.navigate(['/realizar-curso', this.curso.id]);
        return;
      }

      const { value: codigoIngresado } = await Swal.fire({
        title: 'Ingrese el código del curso',
        input: 'text',
        inputPlaceholder: 'Código del curso',
        confirmButtonText: 'Matricularme',
        confirmButtonColor: '#009fb7',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) return 'Debe ingresar un código para continuar.';
          return null;
        }
      });

      if (!codigoIngresado) return; // Canceló

      // 4️⃣ Validar el código
      if (codigoIngresado.trim() === this.curso.codigo) {
        await this.firebaseService.matricularUsuario(user.id, this.curso.id);

        await Swal.fire({
          icon: 'success',
          title: '¡Matrícula completada!',
          text: 'Te has matriculado exitosamente en este curso.',
          confirmButtonColor: '#009fb7'
        });

        this.curso.cantPersonas++;
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Código incorrecto',
          text: 'El código ingresado no corresponde a este curso.',
          confirmButtonColor: '#d33'
        });
      }

    } catch (error) {
      console.error("Error al verificar o matricular:", error);
      Swal.fire('Error', 'Ocurrió un error al intentar matricularse.', 'error');
    }
  }


}
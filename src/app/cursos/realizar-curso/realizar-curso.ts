import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';
import { Modulo } from '../../../models/modulo.model';
import { Pantalla } from '../../../models/pantalla.model';
import { Pregunta } from '../../../models/pregunta.model';
import { NgZone } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-realizar-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realizar-curso.html',
  styleUrls: ['./realizar-curso.css']
})
export class RealizarCurso implements OnInit {
  curso?: Curso;
  modulos: Modulo[] = [];
  pantallaSeleccionada?: Pantalla;
  cargando: boolean = true;
  progreso: number = 0;
  htmlPantalla: SafeHtml = '';
  posicionesPantallas: Pantalla[] = [];
  mostrandoExamen: boolean = false; 
  preguntasExamen: Pregunta[] = []; 
  respuestasUsuario: { [idPregunta: string]: string } = {};
  notaFinal: number | null = null;
  cursoFinalizado: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const idCurso = this.route.snapshot.paramMap.get('id');

    if (!idCurso) return;

    this.firebaseService.getCursosActivos().subscribe({
      next: async cursos => {
        const curso = cursos.find(c => c.id === idCurso);
        if (!curso) {
          this.cargando = false;
          this.cdRef.detectChanges();
          return;
        }

        this.curso = curso;
      // Obtener matrícula del usuario
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          const matricula = await this.firebaseService.getMatricula(user.id, curso.id);
          if (matricula) {
            this.cursoFinalizado = matricula.finalizado || false;
            if (this.cursoFinalizado) {
              this.notaFinal = matricula.calificacion ?? null;
            }
          }
        }

        // Obtener módulos del curso
        this.modulos = await this.firebaseService.getModulosCurso(curso.id);
            console.log('Preguntas obtenidas del examen:', this.modulos);

        // Ordenar pantallas dentro de cada módulo por "pos"
        this.modulos.forEach(mod => {
          mod.pantallas.sort((a, b) => a.pos - b.pos);
        });

        if (curso) {
          // Aquí obtienes las preguntas del examen desde Firebase
          this.firebaseService.getExamenCurso(curso.id).then(preguntas => {
            this.preguntasExamen = preguntas;
          }).catch(err => {
            console.error('Error al obtener preguntas del examen:', err);
          });
        }
        // Crear lista lineal de pantallas para navegación
        this.posicionesPantallas = this.modulos.flatMap(mod => mod.pantallas);

        // Seleccionar primera pantalla
        if (this.posicionesPantallas.length > 0) {
          this.pantallaSeleccionada = this.posicionesPantallas[0];
          this.actualizarHtmlPantalla();
        }

        this.actualizarProgreso();
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: err => {
        console.error('Error al cargar curso:', err);
        this.cargando = false;
        this.cdRef.detectChanges();
      }
    });
  }

  seleccionarPantalla(p: Pantalla) {
    this.mostrandoExamen = false; 
    this.pantallaSeleccionada = p;
    this.actualizarHtmlPantalla();
    this.actualizarProgreso();
  }

  continuar() {
    if (!this.pantallaSeleccionada) return;
    const idx = this.posicionesPantallas.findIndex(p => p === this.pantallaSeleccionada);
    if (idx >= 0 && idx < this.posicionesPantallas.length - 1) {
      this.pantallaSeleccionada = this.posicionesPantallas[idx + 1];
    } else {
      alert('¡Curso completado!');
    }
    this.actualizarHtmlPantalla();
    this.actualizarProgreso();
  }

  retroceder() {
    if (!this.pantallaSeleccionada) return;
    const idx = this.posicionesPantallas.findIndex(p => p === this.pantallaSeleccionada);
    if (idx > 0) {
      this.pantallaSeleccionada = this.posicionesPantallas[idx - 1];
    }
    this.actualizarHtmlPantalla();
    this.actualizarProgreso();
  }

  actualizarProgreso() {
    if (!this.pantallaSeleccionada || this.posicionesPantallas.length === 0) {
      this.progreso = 0;
      return;
    }
    const idx = this.posicionesPantallas.findIndex(p => p === this.pantallaSeleccionada);
    this.progreso = Math.round(((idx + 1) / this.posicionesPantallas.length) * 100);
  }

  private actualizarHtmlPantalla() {
    if (!this.pantallaSeleccionada) {
      this.htmlPantalla = '';
      return;
    }

    const html = this.pantallaSeleccionada.html || '';
    const css = this.pantallaSeleccionada.css || '';

    const contenido = `
      <html>
        <head>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: auto;
            }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    this.htmlPantalla = this.sanitizer.bypassSecurityTrustHtml(contenido);
    this.cdRef.detectChanges();
  }

  mostrarExamen() {
    this.mostrandoExamen = true;
    this.pantallaSeleccionada = undefined; // ocultar pantallas normales
  }
  
  seleccionarRespuesta(preguntaId: string, opcion: string) {
    this.respuestasUsuario[preguntaId] = opcion;
  }

  async enviarExamen() {
    if (!this.curso) return;
    if (this.preguntasExamen.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin preguntas',
        text: 'No hay preguntas para calificar en este examen.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      this.cargando = true;
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo identificar al usuario.',
          confirmButtonText: 'Aceptar'
        });
        this.cargando = false;
        return;
      }

      const user = JSON.parse(userData);
      const nota = await this.firebaseService.enviarExamen(user.id, this.curso.id, this.respuestasUsuario);

      this.zone.run(() => {
        this.notaFinal = nota;
        this.cargando = false;
        this.mostrandoExamen = true;
        this.cdRef.detectChanges();

        if (nota >= 70) {
          Swal.fire({
            icon: 'success',
            title: '¡Examen aprobado!',
            html: `
              <p>Tu calificación final es: <strong>${nota}%</strong></p>
              <p>¡Felicidades, has pasado el examen!</p>
            `,
            confirmButtonText: 'Volver al curso',
            confirmButtonColor: '#3085d6'
          }).then(() => {
            this.volver();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Examen reprobado',
            html: `
              <p>Tu calificación final es: <strong>${nota}%</strong></p>
              <p>No alcanzaste la nota mínima. Inténtalo de nuevo.</p>
            `,
            confirmButtonText: 'Volver al curso',
            confirmButtonColor: '#d33'
          }).then(() => {
            this.volver();
          });
        }
      });

    } catch (error) {
      console.error('Error al enviar examen:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al calificar el examen.',
        confirmButtonText: 'Aceptar'
      });
      this.cargando = false;
    }
  }



  volver() {
    if (this.curso) {
      this.router.navigate(['/ver-curso', this.curso.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}

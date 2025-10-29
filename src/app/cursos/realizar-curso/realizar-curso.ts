import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';
import { Modulo } from '../../../models/modulo.model';
import { Pantalla } from '../../../models/pantalla.model';

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
  posicionesPantallas: Pantalla[] = []; // Lista lineal de todas las pantallas ordenadas por pos

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef
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

        // Obtener módulos del curso
        this.modulos = await this.firebaseService.getModulosCurso(curso.id);

        // Ordenar pantallas dentro de cada módulo por "pos"
        this.modulos.forEach(mod => {
          mod.pantallas.sort((a, b) => a.pos - b.pos);
        });

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


  volver() {
    if (this.curso) {
      this.router.navigate(['/ver-curso', this.curso.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}

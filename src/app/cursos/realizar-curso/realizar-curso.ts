import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';
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
  pantallas: Pantalla[] = [];
  gruposPantallas: { [pos: number]: Pantalla[] } = {};
  posiciones: number[] = [];
  pantallaSeleccionada?: Pantalla;
  cargando: boolean = true;
  progreso: number = 0; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idCurso = this.route.snapshot.paramMap.get('id');

    if (idCurso) {
      this.firebaseService.getCursosActivos().subscribe({
        next: (cursos) => {
          const curso = cursos.find(c => c.id === idCurso);
          if (curso) {
            this.curso = curso;
            this.firebaseService.getPantallasCurso(curso.id).subscribe({
              next: (pantallas) => {
                this.pantallas = pantallas.sort((a, b) => a.pos - b.pos || a.ubi - b.ubi);

                this.gruposPantallas = this.pantallas.reduce((acc, p) => {
                  if (!acc[p.pos]) acc[p.pos] = [];
                  acc[p.pos].push(p);
                  return acc;
                }, {} as { [pos: number]: Pantalla[] });

                for (const pos in this.gruposPantallas) {
                  this.gruposPantallas[pos].sort((a, b) => a.ubi - b.ubi);
                }

                this.posiciones = Object.keys(this.gruposPantallas)
                  .map(Number)
                  .sort((a, b) => a - b);

                const primeraPos = this.posiciones[0];
                this.pantallaSeleccionada = this.gruposPantallas[primeraPos][0];
                this.actualizarProgreso();

                this.cargando = false;
                this.cdRef.detectChanges();
              },
              error: (err) => {
                console.error('Error al cargar pantallas:', err);
                this.cargando = false;
                this.cdRef.detectChanges();
              }
            });
          } else {
            this.cargando = false;
            this.cdRef.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error al cargar curso:', err);
          this.cargando = false;
          this.cdRef.detectChanges();
        }
      });
    }
  }

  seleccionarPosicion(pos: number) {
    const grupo = this.gruposPantallas[pos];
    if (grupo && grupo.length > 0) {
      this.pantallaSeleccionada = grupo[0];
      this.actualizarProgreso();
    }
  }

  get textoContinuar(): string {
    if (!this.pantallaSeleccionada) return '';
    const { pos, ubi } = this.pantallaSeleccionada;
    const grupo = this.gruposPantallas[pos];
    const indicePosActual = this.posiciones.indexOf(pos);

    const haySiguienteEnGrupo = grupo.some(p => p.ubi === ubi + 1);
    const haySiguienteGrupo = indicePosActual + 1 < this.posiciones.length;

    if (haySiguienteEnGrupo) return 'Continuar >';
    if (haySiguienteGrupo) return 'Ir a siguiente sección >';
    return 'Finalizar curso';
  }

  continuar() {
    if (!this.pantallaSeleccionada) return;

    const { pos, ubi } = this.pantallaSeleccionada;
    const grupo = this.gruposPantallas[pos];

    const siguiente = grupo.find(p => p.ubi === ubi + 1);
    if (siguiente) {
      this.pantallaSeleccionada = siguiente;
    } else {
      const indicePosActual = this.posiciones.indexOf(pos);
      const siguientePos = this.posiciones[indicePosActual + 1];
      if (siguientePos !== undefined) {
        this.pantallaSeleccionada = this.gruposPantallas[siguientePos][0];
      } else {
        alert('¡Curso completado!');
      }
    }
    this.actualizarProgreso();
  }

  retroceder() {
    if (!this.pantallaSeleccionada) return;

    const { pos, ubi } = this.pantallaSeleccionada;
    const grupo = this.gruposPantallas[pos];

    const anterior = grupo.find(p => p.ubi === ubi - 1);
    if (anterior) {
      this.pantallaSeleccionada = anterior;
    } else {
      const indicePosActual = this.posiciones.indexOf(pos);
      const posAnterior = this.posiciones[indicePosActual - 1];
      if (posAnterior !== undefined) {
        const grupoAnterior = this.gruposPantallas[posAnterior];
        this.pantallaSeleccionada = grupoAnterior[grupoAnterior.length - 1];
      }
    }
    this.actualizarProgreso();
  }

  actualizarProgreso() {
    if (!this.pantallaSeleccionada || this.pantallas.length === 0) {
      this.progreso = 0;
      return;
    }
    const indiceActual = this.pantallas.findIndex(p => p.id === this.pantallaSeleccionada?.id);
    this.progreso = Math.round(((indiceActual + 1) / this.pantallas.length) * 100);
  }

  get htmlPantalla(): SafeHtml {
    return this.pantallaSeleccionada
      ? this.sanitizer.bypassSecurityTrustHtml(this.pantallaSeleccionada.info || '')
      : '';
  }

  volver() {
    if (this.curso) {
      this.router.navigate(['/ver-curso', this.curso.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}

import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';import { FirebaseService } from '../../services/firebase';
import { Router } from '@angular/router';
import { Plantilla } from '../../../models/plantilla.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, Observable } from 'rxjs';
import { Area } from '../../../models/area.model';

@Component({
  selector: 'app-crear-cursos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './crear-cursos.html',
  styleUrls: ['./crear-cursos.css']
})
export class CrearCursos implements OnInit {
  paso = 1;
  nombreCurso = '';
  cursoForm: FormGroup;
  areas$: Observable<Area[]> = new Observable<Area[]>();
  
  plantillaSeleccionada: Plantilla | null = null;
  plantillas$!: Observable<Plantilla[]>;
  plantillasPreview: { [id: string]: SafeHtml } = {};
  camposEditable: {
    tipo: 'texto' | 'img' | 'fondo';
    valor: string;
    referencia: Element;
    nombre: string;
  }[] = [];

  @ViewChild('previewFrame') previewFrame!: ElementRef;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
    this.cursoForm = this.fb.group({
      nombre: ['', Validators.required],
      tema: ['', Validators.required],
      area: ['', Validators.required],
      codigo: ['', Validators.required],
      cupos: [1, [Validators.required, Validators.min(1)]],
      duracion: [''],
      descripcion: [''],
      infoGeneral: [''],
      imagen: [''],
      isActive: [false]
    });
  }

  async ngOnInit() {
    this.plantillas$ = this.firebaseService.getPlantillas().pipe(
      map((plantillas) => {
        this.plantillasPreview = {};
        plantillas.forEach(p => {
          this.plantillasPreview[p.id] = this.generarPreviewHtml(p);
        });

        if (this.plantillaSeleccionada) {
          const existe = plantillas.some(p => p.id === this.plantillaSeleccionada?.id);
          if (!existe) this.plantillaSeleccionada = null;
        }

        return plantillas;
      })
    );

    this.areas$ = this.firebaseService.getAreas();
  }

  volver() {
    this.router.navigate(['/cursos']);
  }

  continuar() {
    if (this.paso === 1) {
      // Validar formulario del paso 1
      if (this.cursoForm.valid) {
        const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}');

        const cursoTemp = {
          ...this.cursoForm.value,
          idUser: usuario?.id || '',         
          plantillaSeleccionada: this.plantillaSeleccionada || null,
          time: new Date().toISOString()  
        };

        localStorage.setItem('cursoTemporal', JSON.stringify(cursoTemp));

        this.paso = 2;
      } else {
        this.cursoForm.markAllAsTouched();
      }

    } else if (this.paso === 2) {
      if (this.plantillaSeleccionada) {
        this.paso = 3;

        // Esperar a que Angular renderice el iframe
        setTimeout(() => {
          this.cargarPlantilla();
        }, 0);
      }
    }
  }

  generarPreviewHtml(plantilla: Plantilla): SafeHtml {
    const htmlPreview = `
      <html>
        <head>
          <style>
            body {
              margin:0;
              padding:0;
              font-family: sans-serif;
              background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px;
            }
            img { max-width: 100%; height: auto; }
            h1,h2,h3,p,span,div { 
              margin: 5px 0; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
            }
          </style>
          <style>${plantilla.css}</style>
        </head>
        <body>
          ${plantilla.html}
        </body>
      </html>
    `;

    return this.sanitizer.bypassSecurityTrustHtml(htmlPreview);
  }

  seleccionarPlantilla(p: Plantilla) {
    this.plantillaSeleccionada = p;
  }

  cargarPlantilla() {
    if (this.previewFrame?.nativeElement) {
      this.previewFrame.nativeElement.onload = null;
    }

    if (!this.previewFrame || !this.plantillaSeleccionada) return;

    const iframe = this.previewFrame.nativeElement as HTMLIFrameElement;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const cssTransparencia = `
      .sin-fondo {
        background-image: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px !important;
        background-color: transparent !important;
      }
    `;

    const htmlCompleto = `
    <html>
      <head>
        <style>
          ${this.plantillaSeleccionada.css}
          ${cssTransparencia}
          
          /* Limitar ancho del contenido y centrar */
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center; /* centra horizontal */
          }
          .contenido-principal {
            max-width: 800px; /* igual que el panel principal */
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="contenido-principal">
          ${this.plantillaSeleccionada.html}
        </div>
      </body>
    </html>
    `;

    doc.open();
    doc.write(htmlCompleto);
    doc.close();

    iframe.onload = () => {
      const contenido = iframe.contentDocument || iframe.contentWindow?.document;
      if (contenido) {
        this.zone.run(() => {
          this.activarEdicion(contenido);
        });
      }
    };
  }


  activarEdicion(doc: Document) {
    if (!doc || !doc.body) {
      console.warn('Documento del iframe aún no disponible');
      return;
    }

    this.camposEditable = [];

    const textos = Array.from(doc.querySelectorAll('h1, h2, h3, p, span, div'))
      .filter(el => {
        const texto = el.textContent?.trim() || '';
        const tieneTexto = texto.length > 1;
        const tieneHijos = Array.from(el.children).length > 0;
        return tieneTexto && !tieneHijos;
      });

    textos.forEach((el) => {
      const nombre = el.getAttribute('data-nombre') || el.id || 'Texto';
      this.camposEditable.push({
        tipo: 'texto',
        valor: el.textContent || '',
        referencia: el,
        nombre
      });
    });

    const imagenes = Array.from(doc.querySelectorAll('img'))
      .filter(img => img.getAttribute('src'));

    imagenes.forEach((img) => {
      const nombre = img.getAttribute('data-nombre') || img.id || 'Imagen';
      this.camposEditable.push({
        tipo: 'img',
        valor: img.getAttribute('src') || '',
        referencia: img,
        nombre
      });
    });

    const secciones = Array.from(doc.querySelectorAll('div, section'))
      .filter(el => {
        const bg = window.getComputedStyle(el).backgroundImage;
        return bg && bg !== 'none';
      });

    secciones.forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      const url = bg.replace(/url\(["']?|["']?\)/g, '');
      const nombre = el.getAttribute('data-nombre') || el.id || 'Fondo';

      this.camposEditable.push({
        tipo: 'fondo',
        valor: url,
        referencia: el,
        nombre
      });
    });

    const body = doc.body;
    const fondo = body.style.backgroundImage || '';
    this.camposEditable.push({
      tipo: 'fondo',
      valor: fondo.replace(/url\(["']?|["']?\)/g, ''),
      referencia: body,
      nombre: 'Fondo General'
    });

    console.log('✅ Campos detectados (texto, img y fondo):', this.camposEditable.length);

    this.zone.run(() => {
      this.cdr.detectChanges();
    });
  }


  actualizarCampo(index: number) {
    const campo = this.camposEditable[index];
    if (!campo) return;

    if (campo.tipo === 'texto') {
      (campo.referencia as HTMLElement).textContent = campo.valor;
    } else if (campo.tipo === 'img') {
      (campo.referencia as HTMLImageElement).src = campo.valor;
    } else if (campo.tipo === 'fondo') {
      const elemento = campo.referencia as HTMLElement;

      if (!campo.valor.trim()) {
        elemento.style.backgroundImage = 'none';
        elemento.style.backgroundColor = 'transparent';
        elemento.classList.add('sin-fondo');
      } else {
        elemento.style.backgroundImage = `url('${campo.valor}')`;
        elemento.style.backgroundSize = 'cover';
        elemento.style.backgroundRepeat = 'no-repeat';
        elemento.style.backgroundPosition = 'center';
        elemento.style.backgroundColor = 'transparent';
        elemento.classList.remove('sin-fondo'); 
      }
    }

    const iframe = this.previewFrame.nativeElement as HTMLIFrameElement;
    const doc = iframe.contentDocument;
    if (doc) this.actualizarHTML(doc);
  }

  actualizarHTML(doc: Document) {
    const nuevoHTML = doc.body.innerHTML;
    if (this.plantillaSeleccionada) {
      this.plantillaSeleccionada.html = nuevoHTML;
    }
  }

  guardarCurso() {
    console.log('HTML final:', this.plantillaSeleccionada?.html);
    alert(`Curso "${this.nombreCurso}" guardado con plantilla "${this.plantillaSeleccionada?.nombre}"`);
    this.router.navigate(['/lista-cursos']);
  }


}

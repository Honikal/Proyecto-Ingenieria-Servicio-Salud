import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase';
import { Router } from '@angular/router';
import { Plantilla } from '../../../models/plantilla.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, Observable } from 'rxjs';
import { Area } from '../../../models/area.model';
import { Modulo } from '../../../models/modulo.model';
import { Pantalla } from '../../../models/pantalla.model';

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
  tituloPantalla = '';
  moduloNombre = '';

  modulos: Modulo[] = []; // ✅ uso del modelo
  cursoForm: FormGroup;
  areas$: Observable<Area[]> = new Observable<Area[]>();
  moduloSeleccionado: Modulo | null = null; // ✅ tipado correcto
  pantallaSeleccionada: Pantalla | null = null; // ✅ tipado correcto
  plantillaSeleccionada: Plantilla | null = null;
  plantillaOriginal: Plantilla | null = null;
  plantillas$!: Observable<Plantilla[]>;
  plantillasPreview: { [id: string]: SafeHtml } = {};
  pasoAnterior: number | null = null;
  moduloSeleccionadoId: string = '';

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

    const modulosGuardados = JSON.parse(localStorage.getItem('modulosTemporales') || '[]');
    this.modulos = Array.isArray(modulosGuardados) ? modulosGuardados as Modulo[] : [];
  }

  volver() {
    localStorage.removeItem('cursoTemporal');
    localStorage.removeItem('modulosTemporales');
    localStorage.removeItem('plantillaSeleccionada');
    this.router.navigate(['/cursos']);
  }

  continuar() {
    if (this.paso === 1) {
      if (this.cursoForm.valid) {
        const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const cursoTemp = {
          ...this.cursoForm.value,
          idUser: usuario?.id || '',
          time: new Date().toISOString()
        };
        localStorage.setItem('cursoTemporal', JSON.stringify(cursoTemp));
        this.paso = 1.5;
      } else {
        this.cursoForm.markAllAsTouched();
      }
    } else if (this.paso === 1.5) {
      if (this.modulos.length === 0) {
        alert('Debe agregar al menos un módulo antes de continuar.');
        return;
      }
      this.pasoAnterior = null;
      this.paso = 2;
    } else if (this.paso === 2) {
      if (this.plantillaSeleccionada) {
        this.paso = 3;
        setTimeout(() => this.cargarPlantilla(), 0);
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
        <body>${plantilla.html}</body>
      </html>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(htmlPreview);
  }

  seleccionarPlantilla(p: Plantilla) {
    this.plantillaSeleccionada = p;
    this.plantillaOriginal = p;
  }

  cargarPlantilla() {
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
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
            }
            .contenido-principal {
              max-width: 800px;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="contenido-principal">${this.plantillaSeleccionada.html}</div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlCompleto);
    doc.close();

    iframe.onload = () => {
      const contenido = iframe.contentDocument || iframe.contentWindow?.document;
      if (contenido) {
        this.zone.run(() => this.activarEdicion(contenido));
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
  
  agregarModuloTemporal() {
    if (!this.moduloNombre.trim()) {
      alert('Debe ingresar un nombre para el módulo.');
      return;
    }

    const nuevoModulo: Modulo = {
      id: this.modulos.length + 1,
      nombre: this.moduloNombre.trim(),
      pantallas: []
    };

    this.modulos.push(nuevoModulo);
    localStorage.setItem('modulosTemporales', JSON.stringify(this.modulos));
    this.moduloNombre = '';
  }

  eliminarModulo(index: number) {
    if (index >= 0 && index < this.modulos.length) {
      this.modulos.splice(index, 1);
      localStorage.setItem('modulosTemporales', JSON.stringify(this.modulos));
    }
  }

  agregarPlantilla() {
    if (!this.tituloPantalla.trim()) {
      alert('Debe ingresar un título para la pantalla.');
      return;
    }
    if (!this.plantillaSeleccionada) {
      alert('No hay plantilla seleccionada.');
      return;
    }

    const modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]') as Modulo[];
    if (!modulos.length) {
      alert('Debe crear un módulo antes de agregar una pantalla.');
      return;
    }

    const moduloActual = modulos.find(m => m.id === this.moduloSeleccionado?.id);
    if (!moduloActual) {
      alert('Debe seleccionar un módulo antes de agregar una pantalla.');
      return;
    }

    const iframe = this.previewFrame.nativeElement as HTMLIFrameElement;
    const doc = iframe.contentDocument;
    const htmlActual = doc ? doc.body.innerHTML : '';

    const nuevaPantalla: Pantalla = {
      nombre: this.tituloPantalla.trim(),
      css: this.plantillaSeleccionada.css,
      html: htmlActual,
      pos: (moduloActual.pantallas?.length || 0) + 1
    };

    moduloActual.pantallas.push(nuevaPantalla);

    const indiceModulo = modulos.findIndex(m => m.id === moduloActual.id);
    modulos[indiceModulo] = moduloActual;

    localStorage.setItem('modulosTemporales', JSON.stringify(modulos));

    console.log('📌 Módulos actuales y sus pantallas:');
    modulos.forEach(m => {
      console.log(`Módulo: ${m.nombre}`);
      m.pantallas?.forEach(p => console.log(` - Pantalla: ${p.nombre}`));
    });

    if (this.moduloSeleccionado?.id === moduloActual.id) {
      this.moduloSeleccionado.pantallas = moduloActual.pantallas;
    }

    this.pantallaSeleccionada = null;
    this.tituloPantalla = '';
    this.plantillaSeleccionada = this.plantillaOriginal;
    setTimeout(() => this.cargarPlantilla(), 0);
    
    alert(`Pantalla "${nuevaPantalla.nombre}" agregada al módulo "${moduloActual.nombre}".`);
  }

  agregarModulo() {
    this.pasoAnterior = this.paso; 
    this.modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]');
    this.moduloNombre = '';

    if (this.paso === 3) {
      localStorage.setItem('plantillaSeleccionada', JSON.stringify(this.plantillaSeleccionada));
    }

    this.paso = 1.5;
  }


  volverDesdeModulo() {
    if (this.pasoAnterior === 3) {
      const plantillaGuardada = localStorage.getItem('plantillaSeleccionada');
      if (plantillaGuardada) {
        this.plantillaSeleccionada = JSON.parse(plantillaGuardada);
      }
      this.paso = 3;
      setTimeout(() => this.cargarPlantilla(), 0);
    } else {
      this.paso = 1;
    }
  }

actualizarPantallasDisponibles() {
  this.pantallaSeleccionada = null;
  this.modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]');

  if (this.moduloSeleccionado) {
    const moduloActualizado = this.modulos.find(
      m => m.nombre === this.moduloSeleccionado!.nombre
    );
    if (moduloActualizado) {
      this.moduloSeleccionado!.pantallas = moduloActualizado.pantallas || [];
    }
  }
}

  cargarPantallaSeleccionada() {
    if (!this.pantallaSeleccionada) {
      if (this.plantillaOriginal) {
        this.tituloPantalla = "";
        this.plantillaSeleccionada = this.plantillaOriginal;
      }
    } else {
      this.tituloPantalla = this.pantallaSeleccionada.nombre;
      this.plantillaSeleccionada = {
        id: '',
        nombre: this.pantallaSeleccionada.nombre,
        html: this.pantallaSeleccionada.html,
        css: this.pantallaSeleccionada.css
      };
    }

    setTimeout(() => this.cargarPlantilla(), 0);
  }


  actualizarModuloSeleccionado() {
    const modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]') as Modulo[];
    this.modulos = modulos;
    this.moduloSeleccionado = this.modulos.find(m => m.nombre === this.moduloSeleccionadoId) || null;
    this.pantallaSeleccionada = null;
  }

  eliminarPantalla() {
    if (!this.pantallaSeleccionada || !this.moduloSeleccionado) return;

    const modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]') as Modulo[];
    const moduloActual = modulos.find(m => m.nombre === this.moduloSeleccionado!.nombre);
    if (!moduloActual || !moduloActual.pantallas) return;

    // Eliminar la pantalla seleccionada
    moduloActual.pantallas = moduloActual.pantallas.filter(
      p => p.nombre !== this.pantallaSeleccionada!.nombre
    );

    // Actualizar localStorage
    const indiceModulo = modulos.findIndex(m => m.nombre === moduloActual.nombre);
    modulos[indiceModulo] = moduloActual;
    localStorage.setItem('modulosTemporales', JSON.stringify(modulos));

    // Limpiar selección y volver a "Nueva Pantalla"
    this.pantallaSeleccionada = null;
    this.tituloPantalla = '';
    this.plantillaSeleccionada = this.plantillaOriginal;
    this.cargarPlantilla();

    // Actualizar módulo seleccionado en UI
    this.actualizarPantallasDisponibles();

    alert('Pantalla eliminada. Ahora puede crear una nueva.');
  }

  editarPantalla() {
    if (!this.moduloSeleccionado) {
      alert('Debe seleccionar un módulo para editar la pantalla.');
      return;
    }
    if (!this.pantallaSeleccionada) {
      alert('Debe seleccionar una pantalla para editar.');
      return;
    }

    const modulos = JSON.parse(localStorage.getItem('modulosTemporales') || '[]') as Modulo[];
    const moduloActual = modulos.find(m => m.id === this.moduloSeleccionado!.id);
    if (!moduloActual) {
      alert('No se encontró el módulo seleccionado.');
      return;
    }

    const iframe = this.previewFrame.nativeElement as HTMLIFrameElement;
    const doc = iframe.contentDocument;
    if (!doc) {
      alert('El contenido de la pantalla aún no está cargado.');
      return;
    }

    // Obtener el HTML y CSS actualizado
    const htmlActualizado = doc.body.innerHTML;
    const cssActualizado = this.plantillaSeleccionada?.css || '';

    // Actualizar la pantalla seleccionada dentro del módulo
    const indexPantalla = moduloActual.pantallas.findIndex(
      p => p.nombre === this.pantallaSeleccionada!.nombre
    );

    if (indexPantalla !== -1) {
      moduloActual.pantallas[indexPantalla] = {
        ...moduloActual.pantallas[indexPantalla],
        nombre: this.tituloPantalla.trim() || this.pantallaSeleccionada!.nombre,
        html: htmlActualizado,
        css: cssActualizado
      };
    }

    // Guardar cambios en localStorage
    const indiceModulo = modulos.findIndex(m => m.id === moduloActual.id);
    modulos[indiceModulo] = moduloActual;
    localStorage.setItem('modulosTemporales', JSON.stringify(modulos));

    // Actualizar módulo seleccionado en UI
    this.moduloSeleccionado.pantallas = moduloActual.pantallas;

    this.pantallaSeleccionada = null;
    this.tituloPantalla = '';
    this.plantillaSeleccionada = this.plantillaOriginal;
    setTimeout(() => this.cargarPlantilla(), 0);

    alert(`Pantalla "${this.tituloPantalla}" editada correctamente.`);
  }

  async guardarCurso() {
    try {
      const cursoTemp = JSON.parse(localStorage.getItem('cursoTemporal') || '{}');
      if (!cursoTemp) {
        alert('No se encontró información del curso. Por favor, complete los pasos anteriores.');
        return;
      }

      if (!this.modulos.length) {
        alert('Debe agregar al menos un módulo con pantallas.');
        return;
      }

      const cursoData = {
        nombre: cursoTemp.nombre,
        tema: cursoTemp.tema,
        area: cursoTemp.area,
        codigo: cursoTemp.codigo,
        cantPersonas: 0,
        cupos: Number(cursoTemp.cupos),
        descrip: cursoTemp.descripcion,
        infoGeneral: cursoTemp.infoGeneral,
        idUser: cursoTemp.idUser,
        imagen: cursoTemp.imagen,
        isActive: Boolean(cursoTemp.isActive),
        time: cursoTemp.time
      };

      const cursoRef = await this.firebaseService.addDoc('cursos', cursoData);

      for (const modulo of this.modulos) {
        const moduloRef = await this.firebaseService.addDoc(`cursos/${cursoRef.id}/modulo`, { nombre: modulo.nombre });

        let posCounter = 1;
        if (modulo.pantallas && modulo.pantallas.length) {
          for (const pantalla of modulo.pantallas) {
            await this.firebaseService.addDoc(`cursos/${cursoRef.id}/modulo/${moduloRef.id}/pantalla`, {
              nombre: pantalla.nombre,
              html: pantalla.html,
              css: pantalla.css,
              pos: posCounter
            });
            posCounter++;
          }
        }
      }

      localStorage.removeItem('cursoTemporal');
      localStorage.removeItem('modulosTemporales');
      localStorage.removeItem('plantillaSeleccionada');
      alert('✅ Curso guardado correctamente en Firebase.');
      this.router.navigate(['/cursos']);
    } catch (error) {
      console.error('Error guardando el curso:', error);
      alert('Ocurrió un error al guardar el curso. Revise la consola.');
    }
  }

}

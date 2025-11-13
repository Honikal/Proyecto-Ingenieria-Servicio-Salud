import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';
import { Curso } from '../../../models/curso.model';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { Timestamp } from '@angular/fire/firestore';

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
  isAdmin: boolean = false;
  isSocio: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    //Verificar si el usuario logueado es admin
    const userData = localStorage.getItem('currentUser');
    const socioData = localStorage.getItem('currentSocio');
    if (userData) {
      const user = JSON.parse(userData);
      this.isAdmin = user.isAdmin === true;
      this.isSocio = false;
    } else if (socioData) {
      const socio = JSON.parse(socioData);
      this.isSocio = true;
      this.isAdmin = false;
      console.log('Sesión iniciada como socio:', socio);
    }

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
    const idSocio = this.route.snapshot.queryParamMap.get('idSocio');
    if (idSocio) {
      this.router.navigate(['/cursos'], { queryParams: { idSocio } });
    } else {
      this.router.navigate(['/cursos']);
    }
  }

  async descargarCertificado() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      await Swal.fire({
        icon: 'warning',
        title: 'Inicie sesión',
        text: 'Debe iniciar sesión para descargar el certificado.',
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

    //NUEVO BLOQUE PARA ADMIN
    if (this.isAdmin) {
      const socio = await this.firebaseService.getSocioById(this.curso.idSocio);

      if (!socio) {
        Swal.fire('Error', 'No se encontró información del socio.', 'error');
        return;
      }

      const matriculaPrueba = {
        fechaFinalizacion: new Date(),
        calificacion: 100,
        finalizado: true
      };

      await Swal.fire({
        icon: 'info',
        title: 'Certificado de prueba',
        text: 'Como administrador, estás generando un certificado de prueba.',
        confirmButtonText: 'Generar',
        confirmButtonColor: '#009fb7'
      });

      await this.generarCertificadoPDF(matriculaPrueba, this.curso, user, socio);
      return; 
    }

    try {
      const matricula = await this.firebaseService.getMatricula(user.id, this.curso.id);

      if (!matricula) {
        Swal.fire('No matriculado', 'No estás matriculado en este curso.', 'warning');
        return;
      }

      if (!matricula.finalizado) {
        Swal.fire('Curso no finalizado', 'Debes completar el curso antes de descargar el certificado.', 'info');
        return;
      }

      if (matricula.calificacion >= 70) {
        const socio = await this.firebaseService.getSocioById(this.curso.idSocio);

        if (!socio) {
          Swal.fire('Error', 'No se encontró información del socio.', 'error');
          return;
        }

        await this.generarCertificadoPDF(matricula, this.curso, user, socio);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No aprobó el curso',
          text: `Tu calificación final fue ${matricula.calificacion}. No puedes descargar el certificado.`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        });
      }

    } catch (error) {
      console.error('Error al obtener la matrícula:', error);
      Swal.fire('Error', 'Ocurrió un error al verificar tu matrícula.', 'error');
    }
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
      const matricula = await this.firebaseService.getMatricula(user.id, this.curso.id);

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

  async generarCertificadoPDF(matricula: any, curso: any, usuario: any, socio: any) {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === PALETA DE COLORES ===
    const colorPrincipal: [number, number, number] = [0, 159, 183];   // #009FB7
    const colorOscuro: [number, number, number] = [0, 77, 92];        // #004D5C
    const colorTexto: [number, number, number] = [19, 21, 21];        // #131515
    const colorFondo: [number, number, number] = [240, 244, 245];     // #f0f4f5

    // === FONDO GENERAL ===
    doc.setFillColor(...colorFondo);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // === ENCABEZADO SUPERIOR ===
    const headerAltura = 70;
    doc.setFillColor(...colorPrincipal);
    doc.rect(0, 0, pageWidth, headerAltura, 'F');

    // === CONTENEDOR BLANCO CENTRAL ===
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(50, 100, pageWidth - 100, pageHeight - 200, 15, 15, 'F');

    // === LOGO DEL SOCIO (CENTRADO ARRIBA) ===
    if (socio.logo) {
      try {
        const logoImg = await this.loadImage(socio.logo);
        const logoWidth = 100;
        const logoHeight = 60;
        doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 120, logoWidth, logoHeight);
      } catch (e) {
        console.warn('Error cargando logo del socio:', e);
      }
    }

    // === NOMBRE DEL SOCIO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...colorOscuro);
    doc.text(socio.nombre || '', pageWidth / 2, 210, { align: 'center' });

    // === TÍTULO 1 ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...colorTexto);
    doc.text('OTORGA EL PRESENTE CERTIFICADO A', pageWidth / 2, 250, { align: 'center' });

    // === NOMBRE DEL USUARIO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(...colorOscuro);
    doc.text(usuario.fullName || '', pageWidth / 2, 300, { align: 'center' });

    // === TEXTO DE RECONOCIMIENTO ===
    const fechaFinalizacion = this.formatDate(matricula.fechaFinalizacion);
    const textoReconocimiento = [
      'Ha participado en el curso',
      `"${curso.nombre}"`,
      'impartido de manera 100% virtual y realizado el',
      `${fechaFinalizacion},`,
      `con una duración de ${curso.time}.`
    ].join(' ');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...colorTexto);
    doc.text(textoReconocimiento, pageWidth / 2, 350, {
      align: 'center',
      maxWidth: pageWidth - 200,
    });

    // === NOTA FINAL ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...colorPrincipal);
    doc.text(`Evaluación final: ${matricula.calificacion}`, pageWidth / 2, 400, { align: 'center' });

    // === FECHA DE EMISIÓN ===
    const fechaEmision = new Date();
    const fechaEmisionStr = fechaEmision.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...colorTexto);
    doc.text(`Emitido el ${fechaEmisionStr}`, pageWidth / 2, 430, { align: 'center' });

    // === DECORACIÓN INFERIOR ===
    doc.setDrawColor(...colorOscuro);
    doc.setLineWidth(3);
    doc.line(120, pageHeight - 80, pageWidth - 120, pageHeight - 80);

    // === PIE DE PÁGINA ===
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Certificado emitido por la plataforma en nombre de ${socio.nombre}`,
      pageWidth / 2,
      pageHeight - 50,
      { align: 'center' }
    );

        // === MARCA DE AGUA PARA ADMIN ===
    if (this.isAdmin) {
      // Simula transparencia con un color gris claro
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200); // gris claro
      doc.text(
        'SOLO DEMOSTRATIVO',
        pageWidth / 2,
        pageHeight / 2,
        {
          angle: 0,
          align: 'center'
        }
      );

      // Texto adicional pequeño
      doc.setFontSize(12);
      doc.setTextColor(120);
      doc.text(
        'Certificado de prueba - emitido por administrador',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }
    // === GUARDAR PDF ===
    const nombreArchivo = `${usuario.fullName}_Certificado_${curso.nombre}.pdf`;
    doc.save(nombreArchivo);
  }


  // === Función auxiliar para cargar imágenes ===
  private async loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No se pudo crear el contexto del canvas.');

        canvas.width = img.width;
        canvas.height = img.height;

        // 🔹 Fondo blanco para evitar el fondo negro en transparencias
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 🔹 Dibuja la imagen sobre el fondo blanco
        ctx.drawImage(img, 0, 0);

        // 🔹 Devuelve la imagen limpia como Base64
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // === Formatear fecha de finalización (día, mes, año) ===
  private formatDate(date: any): string {
    let d: Date;
    if (date instanceof Timestamp) d = date.toDate();
    else d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }


  async desactivarCurso() {
    if (!this.curso) return;

    const confirm = await Swal.fire({
      title: '¿Desactivar curso?',
      text: 'Esta acción hará que el curso ya no esté disponible para los usuarios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (confirm.isConfirmed) {
      try {
        await this.firebaseService.actualizarCurso(this.curso.id, { isActive: false });

        Swal.fire({
          icon: 'success',
          title: 'Curso desactivado',
          text: 'El curso ha sido desactivado correctamente.',
          confirmButtonColor: '#009fb7'
        });

        this.router.navigate(['/cursos'], { queryParams: { idSocio: this.curso.idSocio } });
      } catch (error) {
        console.error('Error al desactivar el curso:', error);
        Swal.fire('Error', 'No se pudo desactivar el curso.', 'error');
      }
    }
  }

  async eliminarCurso(id: string, event?: Event) {
    if (event) event.stopPropagation();
    const confirm = await Swal.fire({
      title: '¿Eliminar curso?',
      text: 'Esta acción eliminará el curso permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await this.firebaseService.deleteCurso(id);
        Swal.fire('Eliminado', 'El curso fue eliminado correctamente.', 'success');
      } catch (error) {
        console.error('Error al eliminar el curso:', error);
        Swal.fire('Error', 'Ocurrió un error al eliminar el curso.', 'error');
      }
    }
  }

}
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
        const socios = await this.firebaseService.getSociosByUser(user.id);
        const socio = socios.find(s => s.id === this.curso?.idSocio);
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

  async generarCertificadoPDF(matricula: any, curso: any, user: any, socio: any) {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === COLORES PRINCIPALES ===
    const colorAzul: [number, number, number] = [0, 159, 183];
    const colorSuperior: [number, number, number] = [0, 77, 92];
    const colorVerde: [number, number, number] =[0, 153, 102];
    const colorMorado: [number, number, number] = [102, 51, 153];
    const colorGris: [number, number, number] = [240, 240, 240];

    // === FONDO PRINCIPAL ===
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // === BARRA SUPERIOR (ROJA) ===
    doc.setFillColor(...colorSuperior);
    doc.rect(0, 0, pageWidth, 80, 'F');

    // === LOGO DEL SOCIO ===
    if (socio.logo) {
      try {
        const logoImg = await this.loadImage(socio.logo);
        doc.addImage(logoImg, 'PNG', 40, 15, 120, 50);
      } catch (e) {
        console.warn('Error cargando logo del socio:', e);
      }
    }

    // === TÍTULO PRINCIPAL ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(0, 159, 183);
    doc.text('CERTIFICADO DE FINALIZACIÓN DE CURSO', pageWidth / 2, 130, { align: 'center' });

    // === NOMBRE DEL USUARIO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(user.fullName, pageWidth / 2, 190, { align: 'center' });

    // === TEXTO DE RECONOCIMIENTO ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(
      'Por haber completado satisfactoriamente el curso virtual:',
      pageWidth / 2,
      220,
      { align: 'center' }
    );

    // === NOMBRE DEL CURSO ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 153, 102);
    doc.text(curso.nombre, pageWidth / 2, 250, { align: 'center' });

    // === CUADRO DE NOTA Y FECHA ===
    const boxY = 290;
    const boxHeight = 100;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(120, boxY, pageWidth - 240, boxHeight, 10, 10, 'F');

    // Bordes decorativos morados
    doc.setDrawColor(102, 51, 153);
    doc.setLineWidth(2);
    doc.roundedRect(120, boxY, pageWidth - 240, boxHeight, 10, 10, 'S');

    // Nota
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(102, 51, 153);
    doc.text(`Nota Final: ${matricula.calificacion}%`, pageWidth / 2, boxY + 40, { align: 'center' });

    // Fecha
    const fechaStr = this.formatDate(matricula.fechaFinalizacion);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Emitido el: ${fechaStr}`, pageWidth / 2, boxY + 70, { align: 'center' });

    // === FIRMA Y SELLO ===
    const firmaY = 450;
    doc.setDrawColor(0, 159, 183);
    doc.line(pageWidth / 2 - 100, firmaY, pageWidth / 2 + 100, firmaY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.text('Firma', pageWidth / 2, firmaY + 20, { align: 'center' });

    // === LOGO PEQUEÑO ABAJO (SOCIO) ===
    if (socio.logo) {
      try {
        const logoImg = await this.loadImage(socio.logo);
        doc.addImage(logoImg, 'PNG', pageWidth - 180, pageHeight - 100, 100, 50);
      } catch (e) {}
    }

    // === PIE DE PÁGINA ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Certificado generado automáticamente por la plataforma de aprendizaje • ${socio.nombre}`,
      pageWidth / 2,
      pageHeight - 40,
      { align: 'center' }
    );

    // === GUARDAR PDF ===
    doc.save(`${user.fullName}_Certificado_${curso.nombre}.pdf`);
  }

  // Función auxiliar para cargar imágenes (logo)
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  private formatDate(date: Date | string | Timestamp): string {
    let d: Date;

    // Si es un Timestamp de Firebase
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }

    // Formatear usando la zona horaria local
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: undefined,
      minute: undefined,
      hour12: false
    });
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core'; 
import { ionEye, ionEyeOff } from '@ng-icons/ionicons'; 
import { User } from '../../models/user.model'; 
import { Socio } from '../../models/socio.model';
import { FirebaseService } from '../services/firebase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Area } from '../../models/area.model';
import { CommonModule } from '@angular/common';
import { OtpModal } from '../otp-modal/otp-modal';

@Component({
  selector: 'app-manage-users',
  imports: [ReactiveFormsModule, CommonModule, OtpModal],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
  providers: [provideIcons( { ionEye, ionEyeOff })]
})
export class ManageUsers implements OnInit {
  isEditing = false; //Función para definir si actualmente se está editando
  showPassword = false;

  user: User | null = null;
  socio: Socio | null = null;    // si es socio

  userForm!: FormGroup;
  socioForm!: FormGroup;

  areas: Area[] = [];

  //Manejo del otp
  showOTPModal = false;                     //Modal del OTP
  isSubmitting = false;                     //Estado del OTP o del código en subida o no
  private pendingSave = false;              //Trackeamos si ocupamos guardar después de verificación OTP

  //Creamos nuestro constructor y de acá extraemos al usuario
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  //La lógica de inicialización irá en el código de ngOnInit
  async ngOnInit(){
    // FORMULARIO PARA USUARIO NORMAL
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      area: ['']
    })

    // FORMULARIO PARA SOCIO
    this.socioForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: [''],
      logo: ['']
    });

    this.firebaseService.getAreas().subscribe(areas => {
      this.areas = areas;
    });

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser){
      const parsed = JSON.parse(storedUser);
      if (parsed.id){
        this.user = await this.firebaseService.getUser(parsed.id);
        this.cdr.detectChanges(); 

        if (this.user){
          this.userForm.patchValue({
            fullName: this.user.fullName,
            email: this.user.email,
            phone: this.user.phone,
            area: this.user.area
          })
        }
      }
    }

    // 2️⃣ SI NO HAY USER → buscar SOCIO
    const storedSocio = localStorage.getItem('currentSocio');
    if (storedSocio) {
      const parsed = JSON.parse(storedSocio);

      if (parsed.id) {
        this.socio = await this.firebaseService.getSocio(parsed.id);
        this.cdr.detectChanges();

        if (this.socio) {
          this.socioForm.patchValue({
            nombre: this.socio.nombre,
            email: this.socio.email,
            telefono: this.socio.telefono,
            password: this.socio.password,
            logo: this.socio.logo
          });
        }
      }
    }
  }

  onPasswordToggle(){
    this.showPassword = !this.showPassword;
  }

  getInitials() : string | null{
    const name = this.user?.fullName || this.socio?.nombre;
    if (!name) return null;
    const parts = name.split(' ');
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  async onEditClick(){
    if (!this.user) return;

    if (this.isEditing){
      if (this.userForm.valid){
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
        //Guardamos los cambios editados
          const parsed = JSON.parse(storedUser);
          const updatedData = this.userForm.value;

          await this.firebaseService.updateUser(parsed.id, updatedData);
          alert("Cambios guardados correctamente");

          //Actualizamos los datos de forma local
          this.user = { ...this.user, ...updatedData }
          const userData = {
            id: parsed.id,
            fullName: this.user?.fullName,
            email: this.user?.email,
            isAdmin: this.user?.isAdmin
          };
          localStorage.setItem("currentUser", JSON.stringify(userData));
          this.isEditing = false; //Quitamos el modo de edición
          this.cdr.detectChanges();
        }
      } else {
        alert("Por favor completa los cargos requeridos");
      }
    } else {
      //Pasamos al modo de edición
      this.isEditing = true;
    }
  }

  /* 
  async onEditClick() {
    if (!this.user && !this.socio) return;

    if (this.isEditing) {
      const form = this.user ? this.userForm : this.socioForm;

      if (!form.valid) {
        form.markAllAsTouched();
        return;
      }

      this.pendingSave = true;

      this.isSubmitting = true;
      this.showOTPModal = true;

    } else {
      this.isEditing = true;
    }
  }
  */

  onCancelEdit() {
    if (this.user) {
      this.userForm.patchValue({
        fullName: this.user.fullName,
        email: this.user.email,
        phone: this.user.phone,
        area: this.user.area
      });
    }

    if (this.socio) {
      this.socioForm.patchValue({
        nombre: this.socio.nombre,
        email: this.socio.email,
        telefono: this.socio.telefono,
        password: this.socio.password,
        logo: this.socio.logo
      });
    }

    this.isEditing = false;
    this.pendingSave = false;
  }

  //===============Eventos de Modal===============//
  onOtpVerified(){
    if (this.pendingSave){
      this.saveUserChanges();
    }
  }
  onOtpCancelled(){
    this.showOTPModal = false;
    this.isSubmitting = false;
    this.pendingSave  = false;
  }
  onOtpError(error: string){
    console.error('OTP Error:', error);
    // You can show a global error message if needed
  }

  //=================Funciones originales=================//
  onDeleteClick(){
    alert(`Eliminamos el usuario en la ubicación: `);
  }

  volver() {
    if (this.user?.isAdmin) {
      this.router.navigate(['/admin']);
    } else if(this.socio) {
      this.router.navigate(['/socios/dashboard-socio', this.socio.id]);
    }else{
      this.router.navigate(['/']);
    }
  }

  getAreaName(areaId: string | undefined): string {
    if (!areaId || !this.areas) return 'Sin área';
    const area = this.areas.find(a => a.id === areaId);
    return area ? area.nombre : 'Sin área';
  }

private async saveUserChanges() {

  try {

    /* =====================================================
       ===============   USUARIO NORMAL   ==================
       ===================================================== */
    if (this.user) {

      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) return;

      const parsed = JSON.parse(storedUser);
      const updatedData = this.userForm.value;

      // Guardar en Firestore
      await this.firebaseService.updateUser(parsed.id, updatedData);

      alert("Cambios guardados correctamente");

      // Actualizar objeto local
      this.user = { ...this.user, ...updatedData };

      // Actualizar localStorage
      const newLS = {
        id: parsed.id,
        fullName: this.user?.fullName,
        email: this.user?.email,
        isAdmin: this.user?.isAdmin
      };
      localStorage.setItem("currentUser", JSON.stringify(newLS));

      this.isEditing = false;
      this.cdr.detectChanges();

      this.showOTPModal = false;
      this.isSubmitting = false;
      this.pendingSave = false;

      this.router.navigate(['/']);
      return;
    }



    /* =====================================================
       =====================   SOCIO   ======================
       ===================================================== */
    if (this.socio) {

      const storedSocio = localStorage.getItem('currentSocio');
      if (!storedSocio) return;

      const parsed = JSON.parse(storedSocio);
      const updatedData = this.socioForm.value;

      // Guardar en Firestore
      await this.firebaseService.updateSocio(parsed.id, updatedData);

      alert("Cambios guardados correctamente");

      // Actualizar objeto local
      this.socio = { ...this.socio, ...updatedData };

      // Actualizar localStorage
      const newLS = {
        id: parsed.id,
        nombre: this.socio?.nombre,
        email: this.socio?.email,
        logo: this.socio?.logo
      };
      localStorage.setItem("currentSocio", JSON.stringify(newLS));

      this.isEditing = false;
      this.cdr.detectChanges();

      this.showOTPModal = false;
      this.isSubmitting = false;
      this.pendingSave = false;

      this.router.navigate(['/']);
      return;
    }

  } catch (error) {
    console.error("Error al guardar cambios:", error);
    alert("Error al guardar los cambios");
  }
}

}

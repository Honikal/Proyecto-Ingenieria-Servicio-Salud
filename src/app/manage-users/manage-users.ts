import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core'; 
import { ionEye, ionEyeOff } from '@ng-icons/ionicons'; 
import { User } from '../../models/user.model'; 
import { FirebaseService } from '../services/firebase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Area } from '../../models/area.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-users',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
  providers: [provideIcons( { ionEye, ionEyeOff })]
})
export class ManageUsers implements OnInit {
  isEditing = false; //Función para definir si actualmente se está editando
  showPassword = false;
  user: User | null = null;
  userForm!: FormGroup;
  areas: Area[] = [];

  //Creamos nuestro constructor y de acá extraemos al usuario
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  //La lógica de inicialización irá en el código de ngOnInit
  async ngOnInit(){
    //Creamos el form del usuario
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      area: ['']
    })

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
  }

  onPasswordToggle(){
    this.showPassword = !this.showPassword;
  }

  getInitials() : string | null{
    if (!this.user?.fullName) return null;
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p : string) => p[0].toUpperCase()).join('');
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

  onDeleteClick(){
    alert(`Eliminamos el usuario en la ubicación: `);
  }

  onGoLandingPage() {
    this.router.navigate(['/']);
  }

  getAreaName(areaId: string | undefined): string {
    if (!areaId || !this.areas) return 'Sin área';
    const area = this.areas.find(a => a.id === areaId);
    return area ? area.nombre : 'Sin área';
  }
}

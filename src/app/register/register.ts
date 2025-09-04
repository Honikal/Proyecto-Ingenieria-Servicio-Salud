import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core'; //Para poder incluir iconos
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';  //Componente de icon de ionicons

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [provideIcons( { ionEye, ionEyeOff })]
})
export class Register {
  showPassword : boolean = false; //Valor para determinar si es verdadero o falso

  //Injectamos el router para permitir enrutamiento
  constructor(private router: Router) {};

  //Para activar y desactivar el botón de ver contraseña
  onPasswordToggle(){
    this.showPassword = !this.showPassword;
  }


  onSignUpClick(){
    alert("Se hace registro del usuario... aún por trabajar");
  }
  onCancelClick(){ //Vuelta a la página principal
    this.router.navigate(['/']);
  }
  onLoginClick(){
    this.router.navigate(['/login']); //Navegamos a la página de Login
  }

}

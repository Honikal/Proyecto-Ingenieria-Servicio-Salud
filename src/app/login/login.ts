import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core'; //Para poder incluir iconos
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';  //Componente de icon de ionicons

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIconsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [provideIcons( { ionEye, ionEyeOff })]

})
export class Login {
  showPassword : boolean = false; //Valor para determinar si es verdadero o falso

  //Injectamos el router para permitir enrutamiento
  constructor(private router: Router) {};

  //Para activar y desactivar el botón de ver contraseña
  onPasswordToggle(){
    this.showPassword = !this.showPassword;
  }

  onLoginClick(){
    alert("Se hace el login ... por trabajar");
  }

  onCancelClick(){
    this.router.navigate(['/']);
  }

  onSignUpClick(){
    this.router.navigate(['/register'])
  }

  onForgetPassword(){
    alert("Se redirige a la página encargada de editar el password .. por trabajar")
  }
}

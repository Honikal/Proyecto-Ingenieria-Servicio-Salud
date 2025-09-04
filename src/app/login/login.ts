import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  //Injectamos el router para permitir enrutamiento
  constructor(private router: Router) {};

  onLoginClick(){
    alert("Se hace el login ... por trabajar");
  }

  onCancelClick(){
    this.router.navigate(['/']);
  }

  onSignUpClick(){
    alert("Se redirige de login a registrar ... por trabajar");
  }

  onForgetPassword(){
    alert("Se redirige a la página encargada de editar el password .. por trabajar")
  }
}

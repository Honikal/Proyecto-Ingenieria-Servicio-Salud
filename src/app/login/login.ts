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

  onCancelClick(){
    this.router.navigate(['/']);
  }
}

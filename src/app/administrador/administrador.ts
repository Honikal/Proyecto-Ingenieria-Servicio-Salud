import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './administrador.html',
  styleUrl: './administrador.css'
})
export class Administrador {
  constructor(private router: Router) {}

  cerrarSesion() {
    console.log('Cerrando sesión...');
  }
}

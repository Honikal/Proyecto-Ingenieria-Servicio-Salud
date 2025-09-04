import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core'; //Para poder incluir iconos
import { ionChevronDown } from '@ng-icons/ionicons';  //Componente de icon de ionicons

@Component({
  selector: 'app-header-tab',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './header-tab.html',
  styleUrl: './header-tab.css',
  providers: [provideIcons( { ionChevronDown })]
})
export class HeaderTab {
  //Variables de importancia
  menuOpen : boolean = false; //Determina si el botón está activado o encendido

  //Injectamos el router para permitir enrutamiento
  constructor(private router: Router) {};

  //Al presionar el botón de Login cambia a la ruta de Login 
  onLoginClick() {
    this.router.navigate(['/login']);
  }
  //Al presionar el botón de Registrarse cambia a la ruta de Registro 
  onSignUpClick(){
    this.router.navigate(['/register'])
  }

  //Encargado de cambiar la sección seleccionada para cambiar la página
  toggleMenu(){
    //Apagamos o encendemos las secciones de botones
    this.menuOpen = !this.menuOpen;
  }
  selectOption(value: string){
    //Cambiamos o nos dirigimos a la ruta
    alert(`Hemos cambiado al valor del selector a: ${value}`);
  }
}
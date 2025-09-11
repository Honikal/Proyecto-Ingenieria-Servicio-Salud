import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';  //Para poder incluir iconos
import { ionChevronDown } from '@ng-icons/ionicons';   //Componente de icon de ionicons

//Esto es para testear que espere un usuario User
interface User {
  nombre: string;
  correo?: string;
  password: string;
  telefono?: string;
  area?: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  providers: [provideIcons( { ionChevronDown })]
})
export class LandingPage {
  //Variables de importancia

  //Determina si el botón está activado o encendido
  menuOpen : boolean = false; 
  userMenuOpen : boolean = false;

  //Espera un objeto de tipo usuario para el sistema
  //user: User | null = null; 
  user: User | null = { nombre:'Eduardo Jiménez', password:'1234', area:'Ing en computacion', correo:'edward128pix@gmail.com', telefono:"72096994"}; 

  //Injectamos el router para permitir enrutamiento
  constructor(private router: Router) {};

  //Al presionar el botón de Login cambia a la ruta de Login 
  onLoginClick() {
    this.router.navigate(['/login']);
  }
  //Al presionar el botón de Registrarse cambia a la ruta de Registro 
  onSignUpClick(){
    this.router.navigate(['/register']);
  }
  //Al presionar el botón de Salir Sesión, se sale de sesión
  onLogoutClick(){
    alert("Acá se navega a la misma página y se limpia el usuario del sistema");
    //this.router.navigate(['/']);
  }
  //Al presionar el botón de Gestionar, se pasa a la página de Gestionar de Usuario
  onManageClick(){
    this.router.navigate(['/users']);
  }

  onAdminClick(){
    this.router.navigate(['/admin']);
  }


  //Encargado de cambiar la sección seleccionada para cambiar la página
  toggleMenu(value: boolean){
    //Apagamos o encendemos las secciones de botones
    if (value == true){
      this.menuOpen = !this.menuOpen;
    } else if (value == false) {
      this.userMenuOpen = !this.userMenuOpen;
    }
  }

  selectOption(value: string){
    //Cambiamos o nos dirigimos a la ruta
    alert(`Hemos cambiado al valor del selector a: ${value}`);
  }

  //Esta función se encarga de agarrar los iniciales al nombre y segundo nombre
  getInitials() : string {
    if (!this.user?.nombre) return '??';
    const parts = this.user.nombre.split(' ');
    return parts.slice(0, 2).map((p : string) => p[0].toUpperCase()).join('');
  }


}

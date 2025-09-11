import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';  
import { ionChevronDown } from '@ng-icons/ionicons';  
import { User } from '../../models/user.model'; 

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  providers: [provideIcons( { ionChevronDown })]
})
export class LandingPage {
  menuOpen : boolean = false; 
  userMenuOpen : boolean = false;

  user: User | null = null;

    constructor(private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
  onSignUpClick(){
    this.router.navigate(['/register']);
  }
  onLogoutClick(){
    localStorage.removeItem('currentUser');
    this.user = null;
    this.router.navigate(['/']); 
  }

  onManageClick(){
    this.router.navigate(['/users']);
  }

  onAdminClick(){
    this.router.navigate(['/admin']);
  }

  //Encargado de cambiar la sección seleccionada para cambiar la página
  toggleMenu(value: boolean){
    if (value == true){
      this.menuOpen = !this.menuOpen;
    } else if (value == false) {
      this.userMenuOpen = !this.userMenuOpen;
    }
  }

  selectOption(value: string){
    alert(`Hemos cambiado al valor del selector a: ${value}`);
  }

  getInitials() : string {
    if (!this.user?.fullName) return '??';
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }


}

import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css'],
  standalone: true
})
export class AdminPage {
  constructor(private router: Router) {}

  // Navegar a la lista de miembros (usuarios activos)
  goToUsers(): void {
    this.router.navigate(['/members']);
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLanding() {
    this.router.navigate(['']);
  }
}

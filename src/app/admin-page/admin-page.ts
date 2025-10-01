import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AdminPage {
  userMenuOpen: boolean = false;
  user: User | null = null;

  constructor(private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  toggleMenu(value: boolean) {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToUsers(): void {
    this.router.navigate(['/members']);
  }

  goToSocios(): void {
    this.router.navigate(['/socios']);
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogoutClick() {
    localStorage.removeItem('currentUser');
    this.user = null;
    this.router.navigate(['/']); 
  }

  onManageClick() {
    this.router.navigate(['/users']); 
  }

  getInitials() : string {
    if (!this.user?.fullName) return '??';
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }
}

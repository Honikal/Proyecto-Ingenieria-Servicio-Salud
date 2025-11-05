import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common'; 
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-member-list',
  templateUrl: './sociosMember-list.html',
  styleUrls: ['./sociosMember-list.css'],
  standalone: true,
  imports: [AsyncPipe, CommonModule]
})
export class SociosMemberList {
  userList$: Observable<any[]>; // 🔹 Ahora contiene relaciones users-socios
  userMenuOpen: boolean = false;
  user: any | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.userList$ = this.firebaseService.getUsersXSociosFull();

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  toggleMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goBackToAdmin() {
    this.router.navigate(['/admin']);
  }

  onLogoutClick() {
    localStorage.removeItem('currentUser');
    this.user = null;
    this.router.navigate(['/']);
  }

  onManageClick() {
    this.router.navigate(['/users']);
  }

  getInitials(): string {
    if (!this.user?.fullName) return '??';
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }

  formatDate(date: Date | string | Timestamp): string {
    let d: Date;

    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }

    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}

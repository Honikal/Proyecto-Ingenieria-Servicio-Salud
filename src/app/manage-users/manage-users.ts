import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common'; // 👈 importa AsyncPipe

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
  standalone: true,
  imports: [NgFor, AsyncPipe] 
})
export class ManageUsers {
  userList$: Observable<User[]>;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.userList$ = this.firebaseService.getUsers();
  }

  getInitials(usuario: User): string {
    if (!usuario.fullName) return '??';
    const parts = usuario.fullName.split(' ');
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  onEditClick(index: number) {
    alert(`Editamos el usuario en la ubicación: ${index}`);
  }

  onDeleteClick(index: number) {
    alert(`Eliminamos el usuario en la ubicación: ${index}`);
  }

  onGoLandingPage() {
    this.router.navigate(['/']);
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common'; 

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
  standalone: true,
  imports: [NgFor, AsyncPipe] 
})
export class MemberList {
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

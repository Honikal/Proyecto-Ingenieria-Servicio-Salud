// manage-users.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
  standalone: true
})
export class ManageUsers implements OnInit {
  listaUsuarios: User[] = [];

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.firebaseService.getUsers().subscribe((users) => {
      this.listaUsuarios = users;
    });
  }

  getInitials(usuario: User): string {
    if (!usuario.fullName) return '??';
    const parts = usuario.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
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

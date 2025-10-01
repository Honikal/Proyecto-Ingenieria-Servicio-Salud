import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';
import { AsyncPipe,CommonModule } from '@angular/common'; 
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.html',
  styleUrls: ['./member-list.css'],
  standalone: true,
  imports: [AsyncPipe,CommonModule] 
})
export class MemberList {
  userList$: Observable<User[]>;
  userMenuOpen: boolean = false;
  user: User | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.userList$ = this.firebaseService.getUsers();

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  toggleMenu(value: boolean) {
    this.userMenuOpen = !this.userMenuOpen;
  }
  
  async toggleAuthorization(usuario: User & { id?: string }) {
    if (!usuario.id) return; 

    // No permitir cambios si es administrador
    if (usuario.isAdmin) {
      alert('Los administradores no pueden ser modificados.');
      return;
    }

    try {
      const updatedValue = !usuario.isAuto;
      await this.firebaseService.updateUser(usuario.id, { isAuto: updatedValue });
      usuario.isAuto = updatedValue;
    } catch (error) {
      console.error('Error al actualizar la autorización:', error);
    }
  }

  async onDeleteClick(usuario: User & { id?: string }) {
    if (!usuario.id) return;

    // No permitir eliminar administradores
    if (usuario.isAdmin) {
      alert('Los administradores no pueden ser eliminados.');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro que deseas eliminar a ${usuario.fullName}?`);
    if (!confirmDelete) return;

    try {
      await this.firebaseService.deleteUser(usuario.id);
      alert(`${usuario.fullName} ha sido eliminado.`);
      this.userList$ = this.firebaseService.getUsers(); 
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
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

  getInitials() : string {
    if (!this.user?.fullName) return '??';
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }

formatDate(date: Date | string | Timestamp): string {
    let d: Date;

    // Si es un Timestamp de Firebase
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }

    // Formatear usando la zona horaria local
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

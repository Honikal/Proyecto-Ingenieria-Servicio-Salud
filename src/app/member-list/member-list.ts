import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { User } from '../../models/user.model';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
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
  //Datos originales de Firebase
  private usersSubject = new BehaviorSubject<User[]>([]);
  //Filtro por nombre
  filtroNombre$ = new BehaviorSubject<string>("");
  //Paginación
  page$ = new BehaviorSubject<number>(1);
  pageSize = 10;
  //Resultado final después de filtrar + paginar
  userList$: Observable<User[]>;
  userMenuOpen: boolean = false;
  user: User | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    // Cargar usuarios desde Firebase
    this.firebaseService.getUsers().subscribe(users => {
      this.usersSubject.next(users);
    });

    // 🔹 Combinar Filtro + Página + Usuarios
    this.userList$ = combineLatest([
      this.usersSubject.asObservable(),
      this.filtroNombre$,
      this.page$
    ]).pipe(
      map(([users, filtro, page]) => {
        let lista = users;

        // Filtro
        if (filtro.trim() !== "") {
          const lower = filtro.toLowerCase();
          lista = lista.filter(u => u.fullName.toLowerCase().includes(lower));
        }

        // Ordenar por nombre
        lista = lista.sort((a, b) =>
          a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' })
        );

        // Paginación
        const start = (page - 1) * this.pageSize;
        return lista.slice(start, start + this.pageSize);
      })
    );

    // Usuario logueado
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  // -------- PAGINACIÓN --------
  nextPage() {
    const total = this.usersSubject.getValue().length;
    const totalPages = Math.ceil(total / this.pageSize);
    if (this.page$.value < totalPages) this.page$.next(this.page$.value + 1);
  }

  prevPage() {
    if (this.page$.value > 1) this.page$.next(this.page$.value - 1);
  }

  get totalPages(): number {
    const total = this.usersSubject.getValue().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  // -------- BÚSQUEDA --------
  actualizarFiltro(value: string) {
    this.filtroNombre$.next(value);
    this.page$.next(1); // Reiniciar página
  }
  
  // -------- OTROS MÉTODOS --------
  toggleMenu(value: boolean) {
    this.userMenuOpen = !this.userMenuOpen;
  }
  
  async toggleAuthorization(usuario: User & { id?: string }) {
    if (!usuario.id || usuario.isAdmin) return;
    const updatedValue = !usuario.isAuto;
    await this.firebaseService.updateUser(usuario.id, { isAuto: updatedValue });
  }

  async onDeleteClick(usuario: User & { id?: string }) {
    if (!usuario.id || usuario.isAdmin) return;
    if (!confirm(`¿Eliminar a ${usuario.fullName}?`)) return;
    await this.firebaseService.deleteUser(usuario.id);
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

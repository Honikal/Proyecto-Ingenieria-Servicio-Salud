import { Component } from '@angular/core';

interface User {
  nombre: string;
  correo?: string;
  password: string;
  telefono?: string;
  area?: string;
}

@Component({
  selector: 'app-manage-users',
  imports: [],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css'
})
export class ManageUsers {
  //listaUsuarios : User[] = [];
  listaUsuarios : User[] = [
    { nombre: 'Juan Pérez', correo: 'juan@example.com', password: '1234', telefono: '8888-8888', area: 'Marketing' },
   { nombre: 'Ana Gómez', correo: 'ana@example.com', password: '5678', telefono: '7777-7777', area: 'Finanzas' },
    { nombre: 'Carlos López', correo: 'carlos@example.com', password: 'abcd', telefono: '6666-6666', area: 'TI' },
  ];

  getInitials(usuario: User ) : string {
    if (!usuario.nombre) return '??';
    const parts = usuario.nombre.split(' ');
    return parts.slice(0, 2).map((p : string) => p[0].toUpperCase()).join('');
  }

  onEditClick(index: number){
    alert(`Editamos el usuario en la ubicación: ${index}`)
  }

  onDeleteClick(index: number){
    alert(`Eliminamos el usuario en la ubicación: ${index}`)
  }
}

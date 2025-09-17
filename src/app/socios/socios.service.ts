import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, addDoc, updateDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Socio {
  id?: string;
  nombre: string;
  cantidadAsociados: number;
  email: string;
  telefono: string;
  cursos?: { nombre: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class SociosService {
  private sociosRef;

  constructor(private firestore: Firestore) {
    this.sociosRef = collection(this.firestore, 'socios');
  }

  // Obtener todos los socios
  getSocios(): Observable<Socio[]> {
    return collectionData(this.sociosRef, { idField: 'id' }) as Observable<Socio[]>;
  }

  // Obtener un socio en tiempo real
  getSocioById$(id: string): Observable<Socio | null> {
    const socioDoc = doc(this.firestore, 'socios', id);
    return docData(socioDoc, { idField: 'id' }) as Observable<Socio | null>;
  }

  // Obtener socio solo una vez
  async getSocioById(id: string): Promise<Socio | null> {
    const socioDoc = doc(this.firestore, 'socios', id);
    const snapshot = await getDoc(socioDoc);
    return snapshot.exists() ? { ...(snapshot.data() as Socio), id: snapshot.id } : null;
  }

  // Crear socio
  async createSocio(socio: Omit<Socio, 'id'>): Promise<void> {
    await addDoc(this.sociosRef, socio);
  }

  // Actualizar socio
  async updateSocio(id: string, socio: Partial<Socio>): Promise<void> {
    const socioDoc = doc(this.firestore, 'socios', id);
    await updateDoc(socioDoc, socio);
  }

  // Eliminar socio
  async deleteSocio(id: string): Promise<void> {
    const socioDoc = doc(this.firestore, 'socios', id);
    await deleteDoc(socioDoc);
  }
}
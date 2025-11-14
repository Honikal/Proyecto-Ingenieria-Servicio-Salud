import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, addDoc, updateDoc, deleteDoc, docData, query, where, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Socio } from '../../models/socio.model';
import bcrypt from 'bcryptjs';

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

  async createSocio(socio: Omit<Socio, 'id'>): Promise<void> {

    // 1. Verificar si el correo ya existe
    const exists = await this.emailExists(socio.email);
    if (exists) {
      throw new Error('EMAIL_EXISTS');
    }

    // 2. Hashear contraseña
    const hashedPassword = await bcrypt.hash(socio.password, 10);

    const newSocio: Omit<Socio, 'id'> = {
      ...socio,
      password: hashedPassword,
      cantidadAsociados: 0,
      isActive: true,
      fecha: new Date()
    };

    await addDoc(this.sociosRef, newSocio);
  }

  // Actualizar socio
  async updateSocio(id: string, socio: Partial<Socio>): Promise<void> {
    const socioDoc = doc(this.firestore, 'socios', id);

    const dataToUpdate: any = { ...socio };

    // Si viene contraseña → hashearla
    if (socio.password && socio.password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(socio.password, 10);
    } else {
      delete dataToUpdate.password; // evitar guardar string vacío
    }

    await updateDoc(socioDoc, dataToUpdate);
  }
  // Eliminar socio
  async deleteSocio(id: string): Promise<void> {
    const socioDoc = doc(this.firestore, 'socios', id);
    await deleteDoc(socioDoc);
  }

  // Iniciar sesión de socio
  async loginSocio(email: string, password: string): Promise<Socio | null> {
    const q = query(this.sociosRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Socio;

    // Comparar contraseñas
    const match = await bcrypt.compare(password, data.password);
    if (!match) return null;

    return { ...data, id: docSnap.id };
  }

  // Verificar si un email ya existe
  async emailExists(email: string): Promise<boolean> {
    const q = query(this.sociosRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async emailExistsForAnotherUser(email: string, currentId: string): Promise<boolean> {
    const q = query(this.sociosRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    return snapshot.docs.some(doc => doc.id !== currentId);
  }
}

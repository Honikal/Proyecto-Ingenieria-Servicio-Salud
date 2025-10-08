import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, addDoc, doc, query, where, getDoc, getDocs, updateDoc, deleteDoc} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { Area } from '../../models/area.model';
import { Curso } from '../../models/curso.model';
import { Pantalla } from '../../models/pantalla.model';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  constructor(private firestore: Firestore){}

  async addUser(user: User){
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userRef = collection(this.firestore, 'users');

    const newUser: User = {
      ...user,
      password: hashedPassword,
      isAdmin: false,
      isAuto: false,
      createdAt: new Date(),
    };
    await addDoc(userRef, newUser);

  }

  async login(email: string, password: string){
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as User;
    const id = userDoc.id;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    return { ...user, id };;
  }

  async getUser(userID: string){
    const userRef = doc(this.firestore, 'users', userID);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()){
      return null;
    }

    return { id: snapshot.id, ...(snapshot.data() as User) };
  }

  async updateUser(userID: string, updatedData: Partial<User>){
    const userRef = doc(this.firestore, 'users', userID);
    await updateDoc(userRef, updatedData);
  }

  getUsers(): Observable<User[]> {
    const userRef = collection(this.firestore, 'users');
    return collectionData(userRef, { idField: 'id' }) as Observable<User[]>;
  }

  getAreas(): Observable<Area[]> {
    const areaRef = collection(this.firestore, 'areas');
    return collectionData(areaRef, { idField: 'id' }) as Observable<Area[]>;
  }

  async deleteUser(userID: string) {
    const userRef = doc(this.firestore, 'users', userID);
    await deleteDoc(userRef);
  }

  getCursosActivos(): Observable<Curso[]> {
    const cursosRef = collection(this.firestore, 'cursos');
    const q = query(cursosRef, where('isActive', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<Curso[]>;
  }

  async getMatriculaPorUsuarioYCurso(idUser: string, idCurso: string) {
    const matriculasRef = collection(this.firestore, 'matricula');
    const q = query(
      matriculasRef,
      where('idUser', '==', idUser),
      where('idCurso', '==', idCurso)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null; // no está matriculado
    }

    const docMatricula = snapshot.docs[0];
    return { id: docMatricula.id, ...(docMatricula.data() as any) };
  }

  async matricularUsuario(idUser: string, idCurso: string) {
    const matriculasRef = collection(this.firestore, 'matricula');

    const nuevaMatricula = {
      idUser,
      idCurso,
      finalizado: false,
      fechaMatricula: new Date(),     
      fechaFinalizacion: null,       
      calificacion: -1               
    };

    await addDoc(matriculasRef, nuevaMatricula);

    const cursoRef = doc(this.firestore, 'cursos', idCurso);
    const cursoSnap = await getDoc(cursoRef);
    if (cursoSnap.exists()) {
      const cursoData = cursoSnap.data() as any;
      const nuevoConteo = (cursoData.cantPersonas || 0) + 1;
      await updateDoc(cursoRef, { cantPersonas: nuevoConteo });
    }

    return true;
  }

  getPantallasCurso(idCurso: string): Observable<Pantalla[]> {
    const pantallasRef = collection(this.firestore, `cursos/${idCurso}/pantalla`);
    return collectionData(pantallasRef, { idField: 'id' }) as Observable<Pantalla[]>;
  }
  
}
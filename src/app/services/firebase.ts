  import { Injectable } from '@angular/core';
  import { collection, collectionData, Firestore, addDoc, doc, query, where, getDoc, getDocs, updateDoc, deleteDoc, docData } from '@angular/fire/firestore';
  import { from, mergeMap, Observable, toArray } from 'rxjs';
  import { User } from '../../models/user.model';
  import { Area } from '../../models/area.model';
  import { Curso } from '../../models/curso.model';
  import { Pantalla } from '../../models/pantalla.model';
  import { Plantilla } from '../../models/plantilla.model';
  import { Modulo } from '../../models/modulo.model';
  import { Pregunta } from '../../models/pregunta.model';
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

    getUsersXSocios(): Observable<any[]> {
      const colRef = collection(this.firestore, 'usersxsocios');
      return collectionData(colRef, { idField: 'id' }) as Observable<any[]>;
    }

    getUsersXSociosFull(): Observable<any[]> {
      const usersXSociosRef = collection(this.firestore, 'usersxsocios');

      return collectionData(usersXSociosRef, { idField: 'id' }).pipe(
        mergeMap((relations: any[]) =>
          from(relations).pipe(
            mergeMap(async (rel) => {
              const userSnap = await getDoc(doc(this.firestore, `usuarios/${rel.idUser}`));
              const socioSnap = await getDoc(doc(this.firestore, `socios/${rel.idSocio}`));

              const userData = userSnap.exists() ? userSnap.data() : {};
              const socioData = socioSnap.exists() ? socioSnap.data() : {};

              return {
                id: rel.id,
                idUser: rel.idUser,
                idSocio: rel.idSocio,
                userName: userData ? userData['fullName'] || userData['nombre'] || '(sin nombre)' : '(sin usuario)',
                socioName: socioData ? socioData['nombre'] || socioData['nombreSocio'] || '(sin socio)' : '(sin socio)',
              };
            }),
            toArray()
          )
        )
      );
    }

    async getMatricula(idUser: string, idCurso: string) {
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

    getPlantillas(): Observable<Plantilla[]> {
      const plantillasRef = collection(this.firestore, 'plantillas');
      return collectionData(plantillasRef, { idField: 'id' }) as Observable<Plantilla[]>;
    }
    
    async isUserAuto(userId: string): Promise<boolean> {
      const user = await this.getUser(userId);
      return user?.isAuto === true;
    }

    getUserRealtime(userId: string): Observable<User | null> {
      const userRef = doc(this.firestore, 'users', userId);
      return docData(userRef, { idField: 'id' }) as Observable<User | null>;
    }

    async addDoc(ruta: string, data: any) {
      const ref = collection(this.firestore, ruta);
      const docRef = await addDoc(ref, data);
      return docRef; 
    }

    async getSociosByUser(idUser: string) {
      const relRef = collection(this.firestore, 'usersxsocios');
      const q = query(relRef, where('idUser', '==', idUser));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];

      const sociosIds = snapshot.docs.map(doc => (doc.data() as any).idSocio);
      const socios: any[] = [];

      for (const id of sociosIds) {
        const socioRef = doc(this.firestore, 'socios', id);
        const socioSnap = await getDoc(socioRef);
        if (socioSnap.exists()) {
          socios.push({ id: socioSnap.id, ...(socioSnap.data() as any) });
        }
      }

      return socios;
    }

    async getModulosCurso(idCurso: string): Promise<Modulo[]> {
      const modulosRef = collection(this.firestore, `cursos/${idCurso}/modulo`);
      const snapshot = await getDocs(modulosRef);
      const modulos: Modulo[] = [];
      for (const docSnap of snapshot.docs) {
        const modData = docSnap.data() as Modulo;
        // Obtener pantallas dentro del módulo
        const pantRef = collection(this.firestore, `cursos/${idCurso}/modulo/${docSnap.id}/pantalla`);
        const pantSnap = await getDocs(pantRef);
        const pantallas: Pantalla[] = pantSnap.docs.map(d => ({ id: d.id, ...(d.data() as Pantalla) }));
        modulos.push({ ...modData, pantallas });
      }
      return modulos;
    }

    async getExamenCurso(idCurso: string): Promise<Pregunta[]> {
      const preguntasRef = collection(this.firestore, `cursos/${idCurso}/preguntas`);
      const snapshot = await getDocs(preguntasRef);
      return snapshot.docs.map(d => {
        const data = d.data() as Omit<Pregunta, 'id'>; 
        return { id: d.id, ...data };
      });
    }

  async enviarExamen(idUser: string, idCurso: string, respuestasUsuario: { [idPregunta: string]: string }) {

    const preguntasRef = collection(this.firestore, `cursos/${idCurso}/preguntas`);
    const snapshot = await getDocs(preguntasRef);
    const preguntas = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Pregunta) }));

    if (preguntas.length === 0) {
      throw new Error('No hay preguntas disponibles para este examen.');
    }
    // Calcular nota en servidor
    let correctas = 0;
    for (const pregunta of preguntas) {
      const respuestaUsuario = respuestasUsuario[pregunta.id];
      if (respuestaUsuario && respuestaUsuario === pregunta.res) {
        correctas++;
      }
    }

    const nota = Math.round((correctas / preguntas.length) * 100);

    const matriculaRef = collection(this.firestore, 'matricula');
    const q = query(matriculaRef, where('idUser', '==', idUser), where('idCurso', '==', idCurso));
    const snapshotMatricula = await getDocs(q);

    if (!snapshotMatricula.empty) {
      const docMatricula = snapshotMatricula.docs[0];
      const ref = doc(this.firestore, 'matricula', docMatricula.id);

      await updateDoc(ref, {
        finalizado: true,
        calificacion: nota,
        fechaFinalizacion: new Date()
      });
    } else {
      console.warn('Usuario no matriculado en el curso'); 
    }

    return nota;
  }


  }
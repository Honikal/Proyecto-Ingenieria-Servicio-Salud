// firebase.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { collection, Firestore, addDoc, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.model';
import * as bcrypt from 'bcryptjs';
//import { v4 as uuidv4 } from 'uuid';
//import * as nodemailer from 'nodemailer';


//const verificationToken = uuidv4();

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  constructor(private firestore: Firestore){}
/*
  private async sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: 'ProveedorCorreo',
      auth: {
        user: 'Correo',
        pass: 'Contraseña'
      }
    });
    await transporter.sendMail({
      from: 'Correo',
      to: email,
      subject: 'Verificación',
      html: `<p>Haz clic aquí para verificar tu cuenta: <a href="https://tuapp.com/verify-email?token=${token}">Verificar correo</a></p>`
    });
  }
*/
  async addUser(user: User){
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userRef = collection(this.firestore, 'users');
    //const verificationToken = uuidv4();

    const newUser: User = {
      ...user,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
      //verificationToken
    };
    await addDoc(userRef, newUser);

    //await this.sendVerificationEmail(newUser.email, verificationToken);
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

  return { ...user, id };
}

  // 🔹 Nuevo: obtener usuarios en tiempo real
  getUsers(): Observable<User[]> {
    const userRef = collection(this.firestore, 'users');
    return collectionData(userRef, { idField: 'id' }) as Observable<User[]>;
  }
}

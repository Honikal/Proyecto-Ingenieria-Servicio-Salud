import { Injectable } from '@angular/core';
import { collection, Firestore, addDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  constructor(private firestore: Firestore){}

  addUser(user: User){
    const userRef = collection(this.firestore, 'users');
    return addDoc(userRef, user);
  }
}

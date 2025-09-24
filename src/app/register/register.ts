import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase'; 
import { Observable } from 'rxjs';
import { Area } from '../../models/area.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class Register {
  showPassword = false;
  registerForm: FormGroup;
  areas$: Observable<Area[]> = new Observable<Area[]>();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService 
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      area: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,}$/)]]
    });
  }

  ngOnInit() {
    this.areas$ = this.firebaseService.getAreas();
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async onSignUpClick() {
    if (this.registerForm.valid) {
      try {
        await this.firebaseService.addUser(this.registerForm.value);
        console.log("Usuario agregado correctamente:");
        this.router.navigate(['/login']);
      } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error al registrar");
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  onCancelClick() {
    this.router.navigate(['/']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
}
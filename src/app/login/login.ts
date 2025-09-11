import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core'; 
import { ionEye, ionEyeOff } from '@ng-icons/ionicons'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIconComponent, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [provideIcons( { ionEye, ionEyeOff })]

})
export class Login {
  showPassword = false;
  loginForm: FormGroup;

  constructor(
    private router: Router, 
    private fb: FormBuilder,
    private firebaseService: FirebaseService 
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onPasswordToggle(){
    this.showPassword = !this.showPassword;
  }

async onLoginClick() {
  if (!this.loginForm.valid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const { email, password } = this.loginForm.value;

  try {
    const user = await this.firebaseService.login(email, password);

    if (!user) {
      alert("Correo o contraseña incorrectos");
      return;
    }

    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));

    if (user.isAdmin) {
      this.router.navigate(['/administrador'])
    } else {
      alert("Bienvenido " + user.fullName);
      this.router.navigate(['/'])
    }

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error al iniciar sesión");
  }
}


  onCancelClick(){
    this.router.navigate(['/']);
  }

  onSignUpClick(){
    this.router.navigate(['/register'])
  }

  onForgetPassword(){
    alert("Se redirige a la página encargada de editar el password .. por trabajar")
  }
}

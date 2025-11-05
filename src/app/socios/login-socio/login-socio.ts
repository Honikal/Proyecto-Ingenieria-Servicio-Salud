import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SociosService } from '../../services/socios.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';

@Component({
  selector: 'app-login-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  templateUrl: './login-socio.html',
  styleUrls: ['./login-socio.css'],
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class LoginSocio {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private sociosService: SociosService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      const socio = await this.sociosService.loginSocio(email, password);

      if (!socio) {
        alert('Correo o contraseña incorrectos');
        return;
      }

      localStorage.setItem('currentSocio', JSON.stringify({
        id: socio.id,
        nombre: socio.nombre,
        email: socio.email
      }));

      this.router.navigate(['/socios/dashboard-socio']);
    } catch (error) {
      console.error('Error al iniciar sesión de socio:', error);
      alert('Error al iniciar sesión');
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }

  onRegisterClick() {
    this.router.navigate(['/socios/registrar']);
  }

  onForgetPassword() {
    alert('Se redirige al flujo de recuperación de contraseña de socio (por implementar)');
  }
}

import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';
import { Register } from './register/register';
import { ManageUsers } from './manage-users/manage-users';
import { MemberList } from './member-list/member-list';
import { AdminPage } from './admin-page/admin-page';
import { ListaSociosComponent } from './socios/lista-socios/lista-socios.component';
import { RegistrarSocioComponent } from './socios/registrar-socio/registrar-socio.component';
import { GestionarSocioComponent } from './socios/gestionar-socio/gestionar-socio.component';
import { Component } from '@angular/core';

// dropdown sin implementar
@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `<h2 style="text-align:center; margin-top: 2rem;">
               Esta sección aún no está implementada
             </h2>`
})
export class PlaceholderComponent {}

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'members', component: MemberList },
  { path: 'admin', component: AdminPage },
  { path: 'users', component: ManageUsers },
  { path: 'socios', component: ListaSociosComponent },
  { path: 'socios/registrar', component: RegistrarSocioComponent },
  { path: 'socios/:id', component: GestionarSocioComponent },

  // sin implementar
  { path: 'cursos', component: PlaceholderComponent },
  { path: 'podcasts', component: PlaceholderComponent }
];
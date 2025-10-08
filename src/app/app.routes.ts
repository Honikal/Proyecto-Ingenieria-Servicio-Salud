import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';
import { Register } from './register/register';
import { ManageUsers } from './manage-users/manage-users';
import { MemberList } from './member-list/member-list';
import { AdminPage } from './admin-page/admin-page';
import { ListaSocios } from './socios/lista-socios/lista-socios';
import { RegistrarSocio } from './socios/registrar-socio/registrar-socio';
import { GestionarSocio } from './socios/gestionar-socio/gestionar-socio';
import { VerCurso } from './cursos/ver-curso/ver-curso';
import { Component } from '@angular/core';
import { ListaCursos } from './cursos/lista-cursos/lista-cursos';
import { RealizarCurso } from './cursos/realizar-curso/realizar-curso';

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
  { path: 'socios', component: ListaSocios },
  { path: 'socios/registrar', component: RegistrarSocio },
  { path: 'socios/:id', component: GestionarSocio},
  { path: 'ver-curso/:id',component: VerCurso},
  { path: 'realizar-curso/:id',component: RealizarCurso},

  // sin implementar
  { path: 'cursos', component: ListaCursos },
  { path: 'podcasts', component: PlaceholderComponent }
];
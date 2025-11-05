import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaSocios } from './lista-socios/lista-socios';
import { GestionarSocio } from './gestionar-socio/gestionar-socio';
import { RegistrarSocio } from './registrar-socio/registrar-socio';
import { SocioCursos } from '../socio-cursos/socio-cursos';
import { SocioCurso } from '../socio-curso/socio-curso';

const routes: Routes = [
  { path: '', component: ListaSocios },
  { path: 'registrar', component: RegistrarSocio },
  { path: ':id', component: GestionarSocio },
  { path: 'cursos', component: SocioCursos },
  { path: 'curso/:id', component: SocioCurso },
  { path: 'mis-cursos', redirectTo: 'cursos' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SociosRoutingModule {}
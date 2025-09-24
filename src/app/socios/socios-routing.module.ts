import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaSocios } from './lista-socios/lista-socios';
import { GestionarSocio } from './gestionar-socio/gestionar-socio';
import { RegistrarSocio } from './registrar-socio/registrar-socio';

const routes: Routes = [
  { path: '', component: ListaSocios },
  { path: 'registrar', component: RegistrarSocio },
  { path: ':id', component: GestionarSocio }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SociosRoutingModule {}
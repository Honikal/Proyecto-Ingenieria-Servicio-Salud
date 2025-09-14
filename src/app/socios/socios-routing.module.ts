import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaSociosComponent } from './lista-socios/lista-socios.component';
import { GestionarSocioComponent } from './gestionar-socio/gestionar-socio.component';
import { RegistrarSocioComponent } from './registrar-socio/registrar-socio.component';

const routes: Routes = [
  { path: '', component: ListaSociosComponent },
  { path: 'registrar', component: RegistrarSocioComponent },
  { path: ':id', component: GestionarSocioComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SociosRoutingModule {}
import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';

export const routes: Routes = [
    {path: '', component: LandingPage},
    {path: 'login', component: Login}
];

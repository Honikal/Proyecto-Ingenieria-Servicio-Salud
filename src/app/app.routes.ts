import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';
import { Register } from './register/register';
import { ManageUsers } from './manage-users/manage-users';
import { MemberList } from './member-list/member-list';

export const routes: Routes = [
    {path: '', component: LandingPage},
    {path: 'login', component: Login},
    {path: 'register', component: Register},
    {path: 'users', component: ManageUsers},
    {path: 'members', component: MemberList}
];

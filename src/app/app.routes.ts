import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';
import { Register } from './register/register';
import { ManageUsers } from './manage-users/manage-users';
import { MemberList } from './member-list/member-list';
import { AdminPage } from './admin-page/admin-page'; 


export const routes: Routes = [
    {path: '', component: LandingPage},
    {path: 'login', component: Login},
    {path: 'register', component: Register},
    {path: 'members', component: MemberList},
    {path: 'admin', component: AdminPage},
    {path: 'users', component: ManageUsers}
];

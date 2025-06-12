import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ProjectComponent } from './pages/project/project.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Router danh mục dự án
  { path: 'welcome', component: WelcomeComponent },
  { path: 'project', component: ProjectComponent }, // Dự án master
];

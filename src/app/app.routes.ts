import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectPartlistPurchaseRequestComponent } from './pages/project-partlist-purchase-request/project-partlist-purchase-request.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AppComponent } from './app.component';
import { MenusComponent } from './pages/menus/menus.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'welcome',
        component: WelcomeComponent,
      },
    ],
  },

  {
    path: '',
    component: MainLayoutComponent, // layout chứa sidebar, topbar, etc.
    canActivate: [authGuard],
    children: [
      { path: 'menu', component: MenusComponent },
      {
        path: 'project-partlist-price-request',
        loadComponent: () =>
          import(
            './pages/project-partlist-purchase-request/project-partlist-purchase-request.component'
          ).then((m) => m.ProjectPartlistPurchaseRequestComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];

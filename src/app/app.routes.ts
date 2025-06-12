import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectPartlistPurchaseRequestComponent } from './pages/project-partlist-purchase-request/project-partlist-purchase-request.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Router danh mục dự án
  { path: 'welcome', component: WelcomeComponent },
  { path: 'project', component: ProjectComponent }, // Dự án master
{
  path: 'project-partlist-purchase-request',
  loadComponent: () =>
    import('./pages/project-partlist-purchase-request/project-partlist-purchase-request.component').then(
      m => m.ProjectPartlistPurchaseRequestComponent
    )
},
{
  path: 'project-partlist-price-request',
  loadComponent: () =>
    import('./pages/project-partlist-price-request/project-partlist-price-request.component').then(
      m => m.ProjectPartlistPriceRequestComponent
    )
}


];

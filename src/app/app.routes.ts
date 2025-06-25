import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectPartlistPurchaseRequestComponent } from './pages/project-partlist-purchase-request/project-partlist-purchase-request.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
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
},
  {
    path: 'training-registration',
    loadComponent: () =>
      import('./pages/training-registration/training-registration.component').then(
        m => m.TrainingRegistrationComponent
      )
  }
];

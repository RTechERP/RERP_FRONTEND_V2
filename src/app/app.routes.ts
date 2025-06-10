import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { PokhComponent } from './pages/pokh/pokh.component';
import { ProjectTestComponent } from './pages/project-test/project-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  { path: 'pokh', component: PokhComponent},
  { path: 'test', component: ProjectTestComponent}
];

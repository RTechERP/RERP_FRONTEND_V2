import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectListWorkReportComponent } from './pages/project/project-list-work-report/project-list-work-report.component';
import { ProjectWorkCategoryComponent } from './pages/project/project-work-category/project-work-category.component';
import { ProjectWorkPropressComponent } from './pages/project/project-work-propress/project-work-propress.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  { path: 'projectListWork/:id', component: ProjectListWorkReportComponent }, // Dự án master
  { path: 'projectWorkCategory', component: ProjectWorkCategoryComponent }, // Hạng mục dự án
  { path: 'projectWorkPropress/:id', component: ProjectWorkPropressComponent }, // Tiến độ công việc
];

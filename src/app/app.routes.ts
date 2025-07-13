import { ProjectSurveyComponent } from './pages/project/project-survey/project-survey.component';
import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectListWorkReportComponent } from './pages/project/project-list-work-report/project-list-work-report.component';
import { ProjectWorkCategoryComponent } from './pages/project/project-work-category/project-work-category.component';
import { ProjectWorkPropressComponent } from './pages/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from './pages/project/project-work-timeline/project-work-timeline.component';
import { ProjectItemLateComponent } from './pages/project/project-item-late/project-item-late.component';
import { ProjectWorkItemTimelineComponent } from './pages/project/project-work-item-timeline/project-work-item-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from './pages/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project/:id', component: ProjectComponent }, // 2 là tổng hợp công việc AGV còn lại là dự án
  { path: 'projectListWork/:id', component: ProjectListWorkReportComponent }, // Dự án master
  { path: 'projectWorkCategory', component: ProjectWorkCategoryComponent }, // Hạng mục dự án
  { path: 'projectWorkPropress/:id', component: ProjectWorkPropressComponent }, // Tiến độ công việc
  { path: 'projectWorkTimeline', component: ProjectWorkTimelineComponent }, // TimeLine công việc
  { path: 'projectSurvey', component: ProjectSurveyComponent }, // Khảo sát dự án
  { path: 'projectItemlate', component: ProjectItemLateComponent }, // Hạng mục công việc chậm tiến độ
  { path: 'projectWorkItemTimeline', component: ProjectWorkItemTimelineComponent }, // Hạng mục công việc chậm tiến độ
  { path: 'synthesisOfGeneratedMaterials', component: SynthesisOfGeneratedMaterialsComponent }, // Tổng hợp vật tư phát sinh
];

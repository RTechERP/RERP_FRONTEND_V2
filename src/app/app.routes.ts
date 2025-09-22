import { ProjectSurveyComponent } from './pages/project/project-survey/project-survey.component';
import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ProjectComponent } from './pages/project/project.component';

import { ProjectListWorkReportComponent } from './pages/project/project-list-work-report/project-list-work-report.component';
import { ProjectWorkCategoryComponent } from './pages/project/project-work-category/project-work-category.component';
import { ProjectWorkPropressComponent } from './pages/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from './pages/project/project-work-timeline/project-work-timeline.component';
import { ProjectItemLateComponent } from './pages/project/project-item-late/project-item-late.component';
import { ProjectWorkItemTimelineComponent } from './pages/project/project-work-item-timeline/project-work-item-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from './pages/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProjectSynthesisDepartmentComponent } from './pages/project/project-synthesis-department/project-synthesis-department.component';

import { ProjectPartlistPurchaseRequestComponent } from './pages/project-partlist-purchase-request/project-partlist-purchase-request.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AppComponent } from './app.component';
import { MenusComponent } from './pages/menus/menus.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { TsAssetManagementPersonalComponent } from './pages/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetAllocationPersonalComponent } from './pages/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetRecoveryPersonalComponent } from './pages/ts-asset-recovery-personal/ts-asset-recovery-personal.component';
import { TsAssetUnitcountComponent } from './pages/ts-asset-unitcount/ts-asset-unitcount.component';
import { TsAssetTypeComponent } from './pages/ts-asset-type/ts-asset-type.component';
import { TsAssetStatusComponent } from './pages/ts-asset-status/ts-asset-status.component';
import { TsAssetSourceComponent } from './pages/ts-asset-source/ts-asset-source.component';
import { TsAssetManagementComponent } from './pages/ts-asset-management/ts-asset-management.component';
import { TsAssetAllocationComponent } from './pages/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetRecoveryComponent } from './pages/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from './pages/ts-asset-transfer/ts-asset-transfer.component';
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
    component: HomeLayoutComponent,
    canActivate: [],
    children: [{ path: 'home', component: HomeLayoutComponent }],
  },

  {
    path: '',
    component: MainLayoutComponent, // layout chứa sidebar, topbar, etc.
    canActivate: [authGuard],
    children: [
      { path: 'welcome', component: WelcomeComponent },
      { path: 'menu', component: MenusComponent },
      {
        path: 'project-partlist-price-request',
        loadComponent: () =>
          import(
            './pages/project-partlist-purchase-request/project-partlist-purchase-request.component'
          ).then((m) => m.ProjectPartlistPurchaseRequestComponent),
      },
      // Router danh mục dự án
      { path: 'project/:id', component: ProjectComponent }, // 2 là tổng hợp công việc AGV còn lại là dự án
      {
        path: 'projectListWork/:id',
        component: ProjectListWorkReportComponent,
      }, // Dự án master
      { path: 'projectWorkCategory', component: ProjectWorkCategoryComponent }, // Hạng mục dự án
      {
        path: 'projectWorkPropress/:id',
        component: ProjectWorkPropressComponent,
      }, // Tiến độ công việc
      { path: 'projectWorkTimeline', component: ProjectWorkTimelineComponent }, // TimeLine công việc
      { path: 'projectSurvey', component: ProjectSurveyComponent }, // Khảo sát dự án
      { path: 'projectItemlate', component: ProjectItemLateComponent }, // Hạng mục công việc chậm tiến độ
      {
        path: 'projectWorkItemTimeline',
        component: ProjectWorkItemTimelineComponent,
      }, // Hạng mục công việc chậm tiến độ
      {
        path: 'synthesisOfGeneratedMaterials',
        component: SynthesisOfGeneratedMaterialsComponent,
      }, // Tổng hợp vật tư phát sinh
      {
        path: 'projectSynthesisDepartment',
        component: ProjectSynthesisDepartmentComponent,
      }, // Tổng hợp vật tư phát sinh
    ],
  },
];

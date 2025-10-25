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
import { CustomerComponent } from './pages/customer/customer.component';
import { ProductComponent } from './pages/product/product.component';
import { TbProductRtcComponent } from './pages/tb-product-rtc/tb-product-rtc.component';
import { ProductSaleComponent } from './pages/Sale/ProductSale/product-sale.component';
import { TrainingRegistrationComponent } from './pages/training-registration/training-registration.component';
import { InventoryComponent } from './pages/Sale/Inventory/inventory.component';
import { ProductLocationComponent } from './pages/product-location/product-location.component';
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

      //#region CRM
      {
        path: 'customer', //DANH SÁCH KHÁCH HÀNG
        component: CustomerComponent,
      },
      //#endregion

      //#region KHO
      {
        path: 'product-demo', //DANH SÁCH SẢN PHẨM DEMO
        component: TbProductRtcComponent,
      },
      // {
      //   path: 'inventory-sale', //DANH SÁCH SẢN PHẨM DEMO
      //   component: InventoryComponent,
      // },
      {
        path: 'product-sale', //DANH SÁCH SẢN PHẨM SALE
        component: ProductSaleComponent,
      },
      {
        path: 'product-location', //QUẢN LÝ VỊ TRÍ SẢN PHẨM
        component: ProductLocationComponent,
      },
    ],
  },
  {
    path: 'training-registration',
    loadComponent: () =>
      import(
        './pages/training-registration/training-registration.component'
      ).then((m) => m.TrainingRegistrationComponent),
  },
  {
    path: 'currency-list',
    loadComponent: () =>
      import('./pages/currency-list/currency-list.component').then(
        (m) => m.CurrencyListComponent
      ),
  },
    {
    path: 'project-type-report',
    loadComponent: () =>
      import('./pages/project-type-report/project-type-report.component').then(
        (m) => m.ProjectTypeReportComponent
      ),
  },
    {
    path: 'test-iq',
    loadComponent: () =>
      import('./pages/test-IQ/test-IQ.component').then(
        (m) => m.TestIQComponent
      ),
  },
    {
    path: 'project-po-report',
    loadComponent: () =>
      import('./pages/project-po-report/project-po-report.component').then(
        (m) => m.ProjectPoReportComponent
      ),
  },
      {
    path: 'bill-export-build',
    loadComponent: () =>
      import('./pages/billexport-build/billexport-build.component').then(
        (m) => m.BillexportBuildComponent
      ),
  },
  {
    path: 'firm',
    loadComponent: () =>
      import('./pages/firm/firm.component').then(
        (m) => m.FirmComponent
      ),
  },
];

import { ProjectSurveyComponent } from './pages/old/project/project-survey/project-survey.component';
import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/old/welcome/welcome.component';
import { ProjectComponent } from './pages/old/project/project.component';
import { PokhComponent } from './pages/old/pokh/pokh.component';
import { RequestInvoiceComponent } from './pages/old/request-invoice/request-invoice.component';
import { ViewPokhComponent } from './pages/old/view-pokh/view-pokh.component';
// import { HandoverMinutesComponent } from './pages/old/pages/handover-minutes/handover-minutes.component';
import { QuotationKhComponent } from './pages/old/quotation-kh/quotation-kh.component';
import { PokhKpiComponent } from './pages/old/pokh-kpi/pokh-kpi.component';

import { PokhHistoryComponent } from './pages/old/pokh-history/pokh-history.component';
import { TradePriceComponent } from './pages/old/Sale/TinhGia/trade-price/trade-price.component';
import { QuotationSaleComponent } from './pages/old/Sale/TinhGia/quotation-sale/quotation-sale.component';
import { ProjectMachinePriceComponent } from './pages/old/Sale/TinhGia/project-machine-price/project-machine-price.component';
import { PlanWeekComponent } from './pages/old/VisionBase/plan-week/plan-week.component';
import { CustomerComponent } from './pages/old/VisionBase/customer/customer.component';

import { ProjectListWorkReportComponent } from './pages/old/project/project-list-work-report/project-list-work-report.component';
import { ProjectWorkCategoryComponent } from './pages/old/project/project-work-category/project-work-category.component';
import { ProjectWorkPropressComponent } from './pages/old/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from './pages/old/project/project-work-timeline/project-work-timeline.component';
import { ProjectItemLateComponent } from './pages/old/project/project-item-late/project-item-late.component';
import { ProjectWorkItemTimelineComponent } from './pages/old/project/project-work-item-timeline/project-work-item-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from './pages/old/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProjectSynthesisDepartmentComponent } from './pages/old/project/project-synthesis-department/project-synthesis-department.component';
import { ProjectPartlistPurchaseRequestComponent } from './pages/old/project-partlist-purchase-request/project-partlist-purchase-request.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AppComponent } from './app.component';
import { MenusComponent } from './pages/old/menus/menus.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { TsAssetManagementPersonalComponent } from './pages/old/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetAllocationPersonalComponent } from './pages/old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetRecoveryPersonalComponent } from './pages/old/ts-asset-recovery-personal/ts-asset-recovery-personal.component';
import { TsAssetUnitcountComponent } from './pages/old/ts-asset-unitcount/ts-asset-unitcount.component';
import { TsAssetTypeComponent } from './pages/old/ts-asset-type/ts-asset-type.component';
import { TsAssetStatusComponent } from './pages/old/ts-asset-status/ts-asset-status.component';
import { TsAssetSourceComponent } from './pages/old/ts-asset-source/ts-asset-source.component';
import { TsAssetManagementComponent } from './pages/old/ts-asset-management/ts-asset-management.component';
import { TsAssetAllocationComponent } from './pages/old/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetRecoveryComponent } from './pages/old/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from './pages/old/ts-asset-transfer/ts-asset-transfer.component';
// import { CustomerComponent } from './pages/customer/customer.component';
import { ProductComponent } from './pages/old/product/product.component';
import { TbProductRtcComponent } from './pages/old/tb-product-rtc/tb-product-rtc.component';
import { ProductSaleComponent } from './pages/old/Sale/ProductSale/product-sale.component';
import { HrmComponent } from './pages/hrm/hrm.component';
import { HrhiringRequestComponent } from './pages/hrm/hrhiring-request/hrhiring-request.component';
import { HandoverMinutesComponent } from './pages/old/handover-minutes/handover-minutes.component';
import { GeneralCategoryComponent } from './pages/general-category/general-category.component';
import { TrainingRegistrationComponent } from './pages/training-registration/training-registration.component';
import { CrmComponent } from './pages/crm/crm.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
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
      { path: 'app', component: WelcomeComponent, canActivate: [authGuard] },
      { path: 'menu', component: MenusComponent, canActivate: [authGuard] },
      //   {
      //     path: 'project-partlist-price-request',
      //     loadComponent: () =>
      //       import(
      //         './pages/old/project-partlist-purchase-request/project-partlist-purchase-request.component'
      //       ).then((m) => m.ProjectPartlistPurchaseRequestComponent),
      //   },
      // Router danh mục dự án
      {
        path: 'project/:id',
        component: ProjectComponent,
        canActivate: [authGuard],
      }, // 2 là tổng hợp công việc AGV còn lại là dự án
      {
        path: 'projectListWork/:id',
        component: ProjectListWorkReportComponent,
        canActivate: [authGuard],
      }, // Dự án master
      {
        path: 'projectWorkCategory',
        component: ProjectWorkCategoryComponent,
        canActivate: [authGuard],
      }, // Hạng mục dự án
      {
        path: 'projectWorkPropress/:id',
        component: ProjectWorkPropressComponent,
        canActivate: [authGuard],
      }, // Tiến độ công việc
      {
        path: 'projectWorkTimeline',
        component: ProjectWorkTimelineComponent,
        canActivate: [authGuard],
      }, // TimeLine công việc
      {
        path: 'projectSurvey',
        component: ProjectSurveyComponent,
        canActivate: [authGuard],
      }, // Khảo sát dự án
      {
        path: 'projectItemlate',
        component: ProjectItemLateComponent,
        canActivate: [authGuard],
      }, // Hạng mục công việc chậm tiến độ
      {
        path: 'projectWorkItemTimeline',
        component: ProjectWorkItemTimelineComponent,
        canActivate: [authGuard],
      }, // Hạng mục công việc chậm tiến độ
      {
        path: 'synthesisOfGeneratedMaterials',
        component: SynthesisOfGeneratedMaterialsComponent,
        canActivate: [authGuard],
      }, // Tổng hợp vật tư phát sinh
      {
        path: 'projectSynthesisDepartment',
        component: ProjectSynthesisDepartmentComponent,
        canActivate: [authGuard],
      }, // Tổng hợp vật tư phát sinh

      //#region CRM
      {
        path: 'crm',
        component: CrmComponent,
        canActivate: [authGuard],
      },
      {
        path: 'customer', //DANH SÁCH KHÁCH HÀNG
        component: CustomerComponent,
        canActivate: [authGuard],
      },
      //#endregion

      //#region KHO
      {
        path: 'warehouse',
        component: WarehouseComponent,
        canActivate: [authGuard],
      },
      {
        path: 'product-demo', //DANH SÁCH SẢN PHẨM DEMO
        component: TbProductRtcComponent,
        canActivate: [authGuard],
      },

      {
        path: 'product-sale', //DANH SÁCH SẢN PHẨM SALE
        component: ProductSaleComponent,
        canActivate: [authGuard],
      },

      //#endregion

      //#region HRM
      {
        path: 'hrm', //phân hệ nhân sự
        component: HrmComponent,
        canActivate: [authGuard],
      },
      {
        path: 'hrhiring', //tuyển dụng
        component: HrhiringRequestComponent,
        canActivate: [authGuard],
      },
      //#endregion

      //#region DANH MỤC CHUNG
      {
        path: 'category',
        component: GeneralCategoryComponent,
        canActivate: [authGuard],
      },
      {
        path: 'training-registration', //Đăng ký đào tạo
        component: TrainingRegistrationComponent,
        canActivate: [authGuard],
      },
      //#endregion
      {
        path: 'project',
        component: ProjectComponent,
        canActivate: [authGuard],
      }, // NTA Bổ sung path 25/09/25
      { path: 'pokh', component: PokhComponent, canActivate: [authGuard] },
      {
        path: 'handover-minutes',
        component: HandoverMinutesComponent,
        canActivate: [authGuard],
      },
      {
        path: 'request-invoice',
        component: RequestInvoiceComponent,
        canActivate: [authGuard],
      },
      {
        path: 'quotation-kh',
        component: QuotationKhComponent,
        canActivate: [authGuard],
      },
      {
        path: 'pokh-kpi',
        component: PokhKpiComponent,
        canActivate: [authGuard],
      },
      {
        path: 'pokh-history',
        component: PokhHistoryComponent,
        canActivate: [authGuard],
      },
      {
        path: 'trade-price',
        component: TradePriceComponent,
        canActivate: [authGuard],
      },
      {
        path: 'quotation-sale',
        component: QuotationSaleComponent,
        canActivate: [authGuard],
      },
      {
        path: 'project-machine-price',
        component: ProjectMachinePriceComponent,
        canActivate: [authGuard],
      },
      {
        path: 'plan-week',
        component: PlanWeekComponent,
        canActivate: [authGuard],
      },
      {
        path: 'customer',
        component: CustomerComponent,
        canActivate: [authGuard],
      }, // NTA Bổ sung path 25/09/25  END
    ],
  },
];

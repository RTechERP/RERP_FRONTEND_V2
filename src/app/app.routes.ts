import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/old/welcome/welcome.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { HomeLayoutNewComponent } from './layouts/home-layout/home-layout-new/home-layout-new.component';
import { FoodOrderComponent } from './pages/hrm/food-order/food-order.component';
import { DayOffComponent } from './pages/hrm/day-off/day-off.component';
import { MenuApp } from './pages/systems/menu-app/model/menu-app';
import { MenuAppComponent } from './pages/systems/menu-app/menu-app.component';

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
        // component: HomeLayoutComponent,
        component: HomeLayoutNewComponent,
        canActivate: [],
        // children: [{ path: 'home', component: HomeLayoutComponent }],
        children: [{ path: 'home', component: HomeLayoutNewComponent }],
    },

    {
        path: '',
        component: MainLayoutComponent, // layout chứa sidebar, topbar, etc.
        canActivate: [authGuard],
        children: [
            { path: 'app', component: WelcomeComponent, canActivate: [authGuard] },
            { path: 'datcom', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'nghiphep', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'menu', component: MenuAppComponent, canActivate: [authGuard] },
            //   { path: 'menu', component: MenusComponent, canActivate: [authGuard] },
            //   {
            //     path: 'project-partlist-price-request',
            //     loadComponent: () =>
            //       import(
            //         './pages/old/project-partlist-purchase-request/project-partlist-purchase-request.component'
            //       ).then((m) => m.ProjectPartlistPurchaseRequestComponent),
            //   },
            // Router danh mục dự án
            //   {
            //     path: 'project/:id',
            //     component: ProjectComponent,
            //     canActivate: [authGuard],
            //   }, // 2 là tổng hợp công việc AGV còn lại là dự án
            //   {
            //     path: 'projectListWork/:id',
            //     component: ProjectListWorkReportComponent,
            //     canActivate: [authGuard],
            //   }, // Dự án master
            //   {
            //     path: 'projectWorkCategory',
            //     component: ProjectWorkCategoryComponent,
            //     canActivate: [authGuard],
            //   }, // Hạng mục dự án
            //   {
            //     path: 'projectWorkPropress/:id',
            //     component: ProjectWorkPropressComponent,
            //     canActivate: [authGuard],
            //   }, // Tiến độ công việc
            //   {
            //     path: 'projectWorkTimeline',
            //     component: ProjectWorkTimelineComponent,
            //     canActivate: [authGuard],
            //   }, // TimeLine công việc
            //   {
            //     path: 'projectSurvey',
            //     component: ProjectSurveyComponent,
            //     canActivate: [authGuard],
            //   }, // Khảo sát dự án
            //   {
            //     path: 'projectItemlate',
            //     component: ProjectItemLateComponent,
            //     canActivate: [authGuard],
            //   }, // Hạng mục công việc chậm tiến độ
            //   {
            //     path: 'projectWorkItemTimeline',
            //     component: ProjectWorkItemTimelineComponent,
            //     canActivate: [authGuard],
            //   }, // Hạng mục công việc chậm tiến độ
            //   {
            //     path: 'synthesisOfGeneratedMaterials',
            //     component: SynthesisOfGeneratedMaterialsComponent,
            //     canActivate: [authGuard],
            //   }, // Tổng hợp vật tư phát sinh
            //   {
            //     path: 'projectSynthesisDepartment',
            //     component: ProjectSynthesisDepartmentComponent,
            //     canActivate: [authGuard],
            //   }, // Tổng hợp vật tư phát sinh

            //   //#region CRM
            //   {
            //     path: 'crm',
            //     component: CrmComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'customer', //DANH SÁCH KHÁCH HÀNG
            //     component: CustomerComponent,
            //     canActivate: [authGuard],
            //   },
            //   //#endregion

            //   //#region KHO
            //   {
            //     path: 'warehouse',
            //     component: WarehouseComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'product-demo', //DANH SÁCH SẢN PHẨM DEMO
            //     component: TbProductRtcComponent,
            //     canActivate: [authGuard],
            //   },

            //   {
            //     path: 'product-sale', //DANH SÁCH SẢN PHẨM SALE
            //     component: ProductSaleComponent,
            //     canActivate: [authGuard],
            //   },

            //   //#endregion

            //   //#region HRM
            //   {
            //     path: 'hrm', //phân hệ nhân sự
            //     component: HrmComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'hrhiring', //tuyển dụng
            //     component: HrhiringRequestComponent,
            //     canActivate: [authGuard],
            //   },
            //   //#endregion

            //   //#region DANH MỤC CHUNG
            //   {
            //     path: 'category',
            //     component: GeneralCategoryComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'training-registration', //Đăng ký đào tạo
            //     component: TrainingRegistrationComponent,
            //     canActivate: [authGuard],
            //   },
            //   //#endregion
            //   {
            //     path: 'project',
            //     component: ProjectComponent,
            //     canActivate: [authGuard],
            //   }, // NTA Bổ sung path 25/09/25
            //   { path: 'pokh', component: PokhComponent, canActivate: [authGuard] },
            //   {
            //     path: 'handover-minutes',
            //     component: HandoverMinutesComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'request-invoice',
            //     component: RequestInvoiceComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'quotation-kh',
            //     component: QuotationKhComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'pokh-kpi',
            //     component: PokhKpiComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'pokh-history',
            //     component: PokhHistoryComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'trade-price',
            //     component: TradePriceComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'quotation-sale',
            //     component: QuotationSaleComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'project-machine-price',
            //     component: ProjectMachinePriceComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'plan-week',
            //     component: PlanWeekComponent,
            //     canActivate: [authGuard],
            //   },
            //   {
            //     path: 'customer',
            //     component: CustomerComponent,
            //     canActivate: [authGuard],
            //   }, // NTA Bổ sung path 25/09/25  END
        ],
    },
];

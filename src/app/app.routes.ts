import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { OfficeSupplyUnitComponent } from './pages/OfficeSuppliesManagement/OfficeSupplyUnit/office-supply-unit.component';
import { DailyreportComponent } from './pages/DailyReport/daily-report.component';
import { OfficeSupplyRequestSummaryComponent } from './pages/OfficeSuppliesManagement/OfficeSupplyRequestSummary/office-supply-request-summary.component';
import { OfficeSupplyRequestsComponent } from './pages/OfficeSuppliesManagement/OfficeSupplyRequests/office-supply-requests.component';
import { OfficeSupplyComponent } from './pages/OfficeSuppliesManagement/OfficeSupply/office-supply.component';
import { ProductSaleComponent } from './pages/Sale/ProductSale/product-sale.component';
export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  
  //Router danh muc VPP - ous
  {path: 'officesupplyunit', component:OfficeSupplyUnitComponent},
  //router báo cáo công việc 
  {path: 'dailyreport', component:DailyreportComponent},
  {path:'officesupplyrequestsummury', component:OfficeSupplyRequestSummaryComponent},
  {path:'officesupplyrequest', component:OfficeSupplyRequestsComponent},
  {path:'officesupply', component:OfficeSupplyComponent},
  {path:'productsale', component:ProductSaleComponent}
];

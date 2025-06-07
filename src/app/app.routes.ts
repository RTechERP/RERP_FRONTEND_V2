import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import {OfficeSupplyComponentComponent} from './pages/VPP/OfficeSupplyUnit/office-supply-component/office-supply-component.component'
import { DailyreportComponent } from './pages/dailyreport/dailyreport.component';
import { OfficeSupplyRequestSummaryComponent } from './pages/VPP/OfficeSupplyRequestSummary/office-supply-request-summary/office-supply-request-summary.component';
import { OfficeSupplyRequestsComponent } from './pages/VPP/OfficeSupplyRequests/office-supply-requests.component';
export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  
  //Router danh muc VPP - ous
  {path: 'officesupplyunit', component:OfficeSupplyComponentComponent},
  //router báo cáo công việc 
  {path: 'dailyreport', component:DailyreportComponent},
  {path:'officesupplyrequestsummury', component:OfficeSupplyRequestSummaryComponent},
  {path:'officesupplyrequest', component:OfficeSupplyRequestsComponent}
];

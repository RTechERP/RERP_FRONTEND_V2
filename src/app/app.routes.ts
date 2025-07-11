import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { PokhComponent } from './pages/pokh/pokh.component';
import { RequestInvoiceComponent } from './pages/request-invoice/request-invoice.component';
import { ViewPokhComponent } from './pages/view-pokh/view-pokh.component';
import { HandoverMinutesComponent } from './pages/handover-minutes/handover-minutes.component';
import { QuotationKhComponent } from './pages/quotation-kh/quotation-kh.component';
import { PokhKpiComponent } from './pages/pokh-kpi/pokh-kpi.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },

  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  { path: 'pokh', component: PokhComponent},
  { path: 'handover-minutes', component: HandoverMinutesComponent},
  { path: 'request-invoice', component: RequestInvoiceComponent},
  { path: 'quotation-kh', component: QuotationKhComponent},
  { path: 'pokh-kpi', component: PokhKpiComponent}
  
];

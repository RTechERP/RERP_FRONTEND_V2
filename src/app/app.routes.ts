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

import { PokhHistoryComponent } from './pages/pokh-history/pokh-history.component';
import { TradePriceComponent } from './pages/Sale/TinhGia/trade-price/trade-price.component';
import { QuotationSaleComponent } from './pages/Sale/TinhGia/quotation-sale/quotation-sale.component';
import { ProjectMachinePriceComponent } from './pages/Sale/TinhGia/project-machine-price/project-machine-price.component';
import { PlanWeekComponent } from './pages/VisionBase/plan-week/plan-week.component';
import { CustomerComponent } from './pages/VisionBase/customer/customer.component';

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
  { path: 'pokh-kpi', component: PokhKpiComponent},
  { path: 'pokh-history', component: PokhHistoryComponent},
  { path: 'trade-price', component: TradePriceComponent},
  { path: 'quotation-sale', component: QuotationSaleComponent},
  { path: 'project-machine-price', component: ProjectMachinePriceComponent},
  { path: 'plan-week', component: PlanWeekComponent},
  { path: 'customer', component: CustomerComponent}
];

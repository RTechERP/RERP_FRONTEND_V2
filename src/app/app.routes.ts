import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { AppComponent } from './app.component';
import { ProjectComponent } from './pages/project/project.component';
import { EarlyLateComponent } from './pages/early-late/early-late.component';
import { DayOffComponent } from './pages/day-off/day-off.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { TeamComponent } from './pages/team/team.component';
import { FoodOrderComponent } from './pages/food-order/food-order.component';
import { HolidayComponent } from './pages/holiday/holiday.component';
import { PositionsComponent } from './pages/positions/positions.component';
import { ContractComponent } from './pages/contract/contract.component';
import { DepartmentComponent } from './pages/department/department.component';
import { OverTimeComponent } from './pages/over-time/over-time.component';
import { NightShiftComponent } from './pages/night-shift/night-shift.component';
import { EmployeeBussinessComponent } from './pages/employee-bussiness/employee-bussiness.component';
export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'app', component: AppComponent },
  { path: 'welcome', component: WelcomeComponent },
  // Router danh mục dự án
  { path: 'project', component: ProjectComponent }, // Dự án master
  { path: 'early-late', component: EarlyLateComponent }, // Dự án master
  { path: 'day-off', component: DayOffComponent},
  { path: 'customer', component: CustomerComponent},
  { path: 'employee', component: EmployeeComponent},
  { path: 'team', component: TeamComponent},
  { path: 'food-order', component: FoodOrderComponent},
  { path: 'holiday', component: HolidayComponent},
  { path: 'position', component: PositionsComponent},
  { path: 'contract', component: ContractComponent},
  { path: 'department', component: DepartmentComponent},
  { path: 'over-time', component: OverTimeComponent},
  { path: 'night-shift', component: NightShiftComponent},
  { path: 'employee-bussiness', component: EmployeeBussinessComponent}
];

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
import { InventoryComponent } from './pages/old/Sale/Inventory/inventory.component';
import { CustomerComponent } from './pages/crm/customers/customer/customer.component';

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

            //#region hệ thống
            { path: 'menu', component: MenuAppComponent, canActivate: [authGuard] },
            //#endregion

            //#region crm
            { path: 'khachhang', component: CustomerComponent, canActivate: [authGuard] },

            //#endregion

            { path: 'datcom', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'nghiphep', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'tonkho', component: InventoryComponent, canActivate: [authGuard] },

        ],
    },
];

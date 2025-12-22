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
import { PaymentOrder } from './pages/general-category/payment-order/model/payment-order';
import { PaymentOrderComponent } from './pages/general-category/payment-order/payment-order.component';

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
            { path: 'welcome', component: WelcomeComponent, canActivate: [authGuard] },

            //#region hệ thống
            { path: 'menuApp', component: MenuAppComponent, canActivate: [authGuard] },
            //#endregion

            //#region crm
            { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            //#endregion

            //#region kế toán
            { path: 'paymentorder', component: PaymentOrderComponent, canActivate: [authGuard] },

            //#endregion

            { path: 'foodorder', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'dayoff', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'inventory', component: InventoryComponent, canActivate: [authGuard] },

        ],
    },
];

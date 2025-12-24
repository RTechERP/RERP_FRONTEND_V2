import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Params, Router, RouteReuseStrategy, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ReactiveFormsModule } from '@angular/forms';
// import { MenuService } from '../../pages/old/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDestroyService } from 'ng-zorro-antd/core/services';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NgComponentOutlet } from '@angular/common';
import { Type, Injector } from '@angular/core';
// import { AppNotifycationDropdownComponent, NotifyItem } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
// import { AppNotifycationDropdownComponent } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
// import { AppUserDropdownComponent } from '/pages/old/app/app-user-dropdown/app-user-dropdown.component';
import { Title } from '@angular/platform-browser';
import { ProjectComponent } from '../../pages/project/project.component';
// import { EmployeePayrollComponent } from '../../pages/hrm/employee/employee-payroll/employee-payroll/employee-payroll.component';
// import { CustomerComponent } from '../../pages/customer/customer.component';
import { TbProductRtcComponent } from '../../pages/old/tb-product-rtc/tb-product-rtc.component';
import { CustomerComponent } from '../../pages/crm/customers/customer/customer.component';
// import { AppUserDropdownComponent } from '../../pages/systems/app-user/app-user-dropdown.component';

// import { menus } from '../../pages/old/menus/menus.component';
import {
    GroupItem,
    LeafItem,
    MenuItem,
    MenuService,
} from '../../pages/systems/menus/menu-service/menu.service';
import { MenuEventService } from '../../pages/systems/menus/menu-service/menu-event.service';
import { AppUserDropdownComponent } from '../../pages/systems/app-user/app-user-dropdown.component';
import {
    AppNotifycationDropdownComponent,
    NotifyItem,
} from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
import { MenusComponent } from '../../pages/old/menus/menus.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ɵɵRouterOutlet } from "@angular/router/testing";
import { MenuAppService } from '../../pages/systems/menu-app/menu-app.service';
import { NOTIFICATION_TITLE } from '../../app.config';
import { environment } from '../../../environments/environment';
import { CustomRouteReuseStrategy } from '../../custom-route-reuse.strategy';
import { LayoutEventService } from '../layout-event.service';
import { take } from 'rxjs';

type TabItem = {
    title: string;
    // comp: Type<any>;
    // injector?: Injector;
    data?: any; // Lưu data để so sánh unique key
    route: string;
    queryParams?: any;    // vd: { warehouseCode: 'HN' }
    key: string;
};
// export type BaseItem = {
//   key: string;
//   title: string;
//   isOpen: boolean;
//   icon?: string | null;

// };

// export type LeafItem = BaseItem & {
//   kind: 'leaf';
//   comp: Type<any>;
// };

// export type GroupItem = BaseItem & {
//   kind: 'group';
//   children: MenuItem[]; // cho phép lồng group
// };

// export type MenuItem = LeafItem | GroupItem;

export const isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
export const isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';

const COMPONENT_REGISTRY: Record<string, Type<any>> = {
    customer: CustomerComponent,
    productRTC: TbProductRtcComponent,
    project: ProjectComponent,
};

// Reverse mapping để serialize component -> key
const COMPONENT_TO_KEY: Map<Type<any>, string> = new Map(
    Object.entries(COMPONENT_REGISTRY).map(([key, comp]) => [comp, key])
);
@Component({
    selector: 'app-main-layout',
    imports: [
        RouterLink,
        NzBadgeModule,
        RouterOutlet,
        NzIconModule,
        NzLayoutModule,
        NzMenuModule,
        NzButtonModule,
        NzTabsModule,
        NzDropDownModule,
        ReactiveFormsModule,
        CommonModule,
        AppNotifycationDropdownComponent,
        AppUserDropdownComponent,
        NzGridModule,
    ],
    templateUrl: '../../app.component.html',
    styleUrl: '../../app.component.css',
    standalone: true,
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
    CustomerComponent = CustomerComponent;
    ProductRtcComponent = TbProductRtcComponent;
    ProjectComponent = ProjectComponent;
    constructor(
        private auth: AuthService,
        private router: Router,
        public menuService: MenuService,
        public menuAppService: MenuAppService,
        private notification: NzNotificationService,
        private injector: Injector,
        private menuEventService: MenuEventService,
        private reuse: RouteReuseStrategy,
        private layoutEvent: LayoutEventService
    ) {
        // this.menus = this.menuService.getMenus();
    }
    notificationComponent = AppNotifycationDropdownComponent;
    //#region Khai báo biến
    isCollapsed = true;
    isMobile = window.innerHeight <= 768;
    isDatcom = false;
    selectedIndex = 0;
    trackKey = (_: number, x: any) => x?.key ?? x?.title ?? _;
    // isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
    // isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
    menus: any[] = [];
    dynamicTabs: TabItem[] = [];

    menu: any = {};
    //#endregion
    notifItems: NotifyItem[] = [
        // {
        //   id: 1,
        //   title: 'Phiếu xe #A123 đã duyệt',
        //   detail: 'Xe VP Hà Nội',
        //   time: '09:12',
        //   group: 'today',
        //   icon: 'car',
        // },
        // {
        //   id: 2,
        //   title: 'Bàn giao TS BM-09 hoàn tất',
        //   detail: 'Phòng IT • BB556',
        //   time: '08:55',
        //   group: 'today',
        //   icon: 'file-done',
        // },
        // {
        //   id: 3,
        //   title: 'Đơn cấp phát #CP-778 tạo mới',
        //   detail: 'Kho TB • 5 mục',
        //   time: '16:40',
        //   group: 'yesterday',
        //   icon: 'plus-square',
        // },
        // {
        //   id: 1,
        //   title: 'Phiếu xe #A123 đã duyệt',
        //   detail: 'Xe VP Hà Nội',
        //   time: '09:12',
        //   group: 'today',
        //   icon: 'car',
        // },
        // {
        //   id: 2,
        //   title: 'Bàn giao TS BM-09 hoàn tất',
        //   detail:
        //     'Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556',
        //   time: '08:55',
        //   group: 'today',
        //   icon: 'file-done',
        // },
    ];

    menuKey: string = '';
    ngOnInit(): void {
        // const saved = localStorage.getItem('openMenuKey') || '';
        // console.log(this.menus);
        // this.setOpenMenu(saved || null);

        this.getMenus();

        // console.log(' this.menuKey :', this.menuKey);

        this.menuService.menuKey$.subscribe((x) => {
            this.menuKey = x;
            console.log(this.menuKey);
        });

        this.setOpenMenu(this.menuKey);

        // Khôi phục các tabs đã mở từ localStorage
        // this.restoreTabs();

        // // Subscribe vào event mở tab từ các component con
        // this.menuEventService.onOpenTab$.subscribe((tabData) => {
        //     // this.newTab(tabData.comp, tabData.title, tabData.data);
        // });


    }

    ngAfterViewInit(): void {
        this.layoutEvent.toggleMenu$.pipe(take(1)).subscribe(key => {
            // this.menuKey = key;
            if (key) this.toggleMenu(key);

            this.menuService.menuKey$.subscribe((key) => {
                this.menuKey = key;
            });
            this.setOpenMenu(key);
        });
    }

    getMenus() {
        this.menuAppService.getAll().subscribe({
            next: (response) => {

                console.log(response);

                const map = new Map<number, any>();
                // this.nodes = [];
                // Tạo map trước
                response.data.menus.forEach((item: any) => {
                    map.set(item.ID, {
                        id: item.ID,
                        stt: item.STT,
                        key: item.Code,
                        title: item.Title,
                        router: item.Router == '' ? '#' : `${item.Router}`,
                        icon: `${environment.host}api/share/software/icon/${item.Icon}`,
                        isPermission: item.IsPermission,
                        ParentID: item.ParentID,
                        children: [],
                        isOpen: item.ParentID > 0,
                        queryParams: (item.QueryParam || ''),
                    });
                });

                // Gắn cha – con
                response.data.menus.forEach((item: any) => {
                    const node = map.get(item.ID);

                    if (item.ParentID && map.has(item.ParentID)) {
                        const parent = map.get(item.ParentID);
                        parent.children.push(node);
                    } else {
                        this.menus.push(node);
                    }
                });


                console.log(this.menus);

                this.layoutEvent.toggleMenu$.pipe(take(1)).subscribe(key => {
                    // this.menuKey = key;
                    if (key) this.toggleMenu(key);

                    this.menuService.menuKey$.subscribe((key) => {
                        this.menuKey = key;
                    });
                    this.setOpenMenu(key);
                });
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        })
    }

    // newTab(comp: Type<any>, title: string, data?: any) {
    //     if (this.isMobile) {
    //         this.isCollapsed = !this.isCollapsed;
    //     }

    //     const idx = this.dynamicTabs.findIndex((t) => t.title === title);
    //     if (idx >= 0) {
    //         this.selectedIndex = idx;
    //         return;
    //     }

    //     const injector = Injector.create({
    //         providers: [{ provide: 'tabData', useValue: data }],
    //         parent: this.injector,
    //     });

    //     this.dynamicTabs = [...this.dynamicTabs, { title, comp, injector }];
    //     setTimeout(() => (this.selectedIndex = this.dynamicTabs.length - 1));

    //     // Lưu tabs vào localStorage
    //     // this.saveTabs();
    // }



    // newTab(route: string, title: string) {
    //     const idx = this.dynamicTabs.findIndex(t => t.route === route);

    //     if (idx >= 0) {
    //         this.selectedIndex = idx;
    //         this.router.navigateByUrl(route);
    //         return;
    //     }

    //     this.dynamicTabs = [...this.dynamicTabs, { title, route }];

    //     setTimeout(() => {
    //         this.selectedIndex = this.dynamicTabs.length - 1;
    //         this.router.navigateByUrl(route);
    //     });
    // }

    newTab(route: string, title: string, queryParams?: any) {

        // console.log('queryParams new tab:', queryParams, typeof queryParams);
        queryParams = queryParams == '' ? '' : JSON.parse(queryParams);
        const normalizedParams =
            typeof queryParams === 'string'
                ? undefined
                : (queryParams && Object.keys(queryParams).length ? queryParams : undefined);
        // const key = route + JSON.stringify(queryParams ?? {});
        const key = route + JSON.stringify(normalizedParams ?? {});

        const idx = this.dynamicTabs.findIndex(t => t.key === key);
        if (idx >= 0) {
            this.selectedIndex = idx;
            this.router.navigate([route], { queryParams });
            return;
        }

        this.dynamicTabs = [
            ...this.dynamicTabs,
            { title, route, queryParams, key }
        ];

        setTimeout(() => {
            this.selectedIndex = this.dynamicTabs.length - 1;
            this.router.navigate([route], { queryParams });
        });
    }



    onTabChange(index: number) {
        const tab = this.dynamicTabs[index];
        if (tab) {
            this.router.navigateByUrl(tab.route);
        }
    }


    // closeTab({ index }: { index: number }) {
    //     this.dynamicTabs.splice(index, 1);
    //     if (this.selectedIndex >= this.dynamicTabs.length)
    //         this.selectedIndex = this.dynamicTabs.length - 1;

    //     // Lưu tabs vào localStorage sau khi đóng
    //     // this.saveTabs();
    // }

    closeTab(index: number): void {
        const tab = this.dynamicTabs[index];
        if (!tab) return;

        // 1. Clear route cache (nếu có RouteReuseStrategy)
        const reuse = this.reuse as CustomRouteReuseStrategy;
        reuse?.clear(tab.route);

        const isActive = this.selectedIndex === index;

        // 2. Remove tab
        this.dynamicTabs.splice(index, 1);

        // 3. Xử lý selectedIndex
        if (this.dynamicTabs.length === 0) {
            this.selectedIndex = 0;
            this.router.navigateByUrl('/app'); // route mặc định
            return;
        }

        if (isActive) {
            const nextIndex = Math.max(index - 1, 0);
            this.selectedIndex = nextIndex;
            this.router.navigateByUrl(this.dynamicTabs[nextIndex].route);
        } else if (this.selectedIndex > index) {
            // đóng tab phía trước tab đang active
            this.selectedIndex--;
        }
    }

    logout() {
        this.auth.logout();
    }
    onPick(n: NotifyItem) {
        console.log('picked:', n);
        // TODO: điều hướng/đánh dấu đã đọc...
    }
    // toggleMenu(key: string) {
    //   const m = this.menus.find((x) => x.key === key);
    //   if (m) m.isOpen = !m.isOpen;
    // }
    // isMenuOpen(key: string): boolean {
    //   const m = this.menus.find((x) => x.key === key);
    //   return !!m && !!m.isOpen;
    // }
    private setOpenMenu(key: string | null) {
        this.menus.forEach((m) => (m.isOpen = key !== null && m.key === key));
        // localStorage.setItem('openMenuKey', key ?? '');
    }

    isMenuOpen = (key: string) =>
        this.menus.some((m) => m.key === key && m.isOpen);

    toggleMenu(key: string) {
        // this.menus.forEach((x) => (x.isOpen = false));

        const m = this.menus.find((x) => x.key === key);
        if (m) m.isOpen = !m.isOpen;

        if (m?.isOpen) this.menuKey = key;
    }

    // dùng khi muốn mở thẳng 1 group từ nơi khác
    openOnly(key: string) {
        this.setOpenMenu(key);
    }

    /**
     * Lưu các tabs hiện tại vào localStorage
     */
    //   private saveTabs() {
    //     const tabsData = this.dynamicTabs.map((tab) => ({
    //       title: tab.title,
    //       compKey: COMPONENT_TO_KEY.get(tab.comp) || '',
    //     }));
    //     localStorage.setItem('openTabs', JSON.stringify(tabsData));
    //     localStorage.setItem('selectedTabIndex', String(this.selectedIndex));
    //   }

    //   /**
    //    * Khôi phục các tabs từ localStorage
    //    */
    //   private restoreTabs() {
    //     try {
    //       const savedTabs = localStorage.getItem('openTabs');
    //       const savedIndex = localStorage.getItem('selectedTabIndex');

    //       if (savedTabs) {
    //         const tabsData = JSON.parse(savedTabs) as Array<{
    //           title: string;
    //           compKey: string;
    //         }>;

    //         tabsData.forEach(({ title, compKey }) => {
    //           const comp = COMPONENT_REGISTRY[compKey];
    //           if (comp) {
    //             const injector = Injector.create({
    //               providers: [{ provide: 'tabData', useValue: undefined }],
    //               parent: this.injector,
    //             });
    //             this.dynamicTabs.push({ title, comp, injector });
    //           }
    //         });

    //         if (savedIndex && this.dynamicTabs.length > 0) {
    //           const index = parseInt(savedIndex, 10);
    //           this.selectedIndex = Math.min(index, this.dynamicTabs.length - 1);
    //         }
    //       }
    //     } catch (error) {
    //       console.error('Error restoring tabs:', error);
    //     }
    //   }
}

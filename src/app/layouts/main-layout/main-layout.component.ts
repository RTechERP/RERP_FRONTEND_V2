import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router, RouteReuseStrategy, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
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
import { UpdateVersionService } from '../../pages/systems/update-version/update-version.service';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { UpdateVersionDetailComponent } from '../../pages/systems/update-version/update-version-detail/update-version-detail.component';
// import { LayoutEventService } from '../layout-event.service';
import { take, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TabServiceService, TabCompPayload } from '../tab-service.service';

type TabItem = {
    title: string;
    // comp: Type<any>;
    // injector?: Injector;
    data?: any; // Lưu data để so sánh unique key
    route: string;
    queryParams?: any;    // vd: { warehouseCode: 'HN' }
    key: string;
    // outlet: string; // 👈 RẤT QUAN TRỌNG
};

type TabItemComp = {
    title: string;
    comp: Type<any>;
    injector?: Injector;
    data?: any; // Lưu data để so sánh unique key
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

// const COMPONENT_REGISTRY: Record<string, Type<any>> = {
//     customer: CustomerComponent,
//     productRTC: TbProductRtcComponent,
//     project: ProjectComponent,
// };

// // Reverse mapping để serialize component -> key
// const COMPONENT_TO_KEY: Map<Type<any>, string> = new Map(
//     Object.entries(COMPONENT_REGISTRY).map(([key, comp]) => [comp, key])
// );

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
        NzModalModule,
        NgbModalModule
    ],
    templateUrl: '../../app.component.html',
    styleUrl: '../../app.component.css',
    standalone: true,
})
export class MainLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
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
        // private layoutEvent: LayoutEventService,
        private cd: ChangeDetectorRef,
        private route: ActivatedRoute,
        private tabService: TabServiceService,
        private updateVersionService: UpdateVersionService,
        private nzModal: NzModalService,
        private modalService: NgbModal,
    ) {

        // this.menuComps = this.menuService.getMenus();
    }
    notificationComponent = AppNotifycationDropdownComponent;
    //#region Khai báo biến
    userAppVersion: string = localStorage.getItem('currentAppVersion') || '0.0.0';

    isCollapsed = true;
    isMobile = window.innerHeight <= 768;
    isDatcom = false;
    selectedIndex = 0;
    trackKey = (_: number, x: any) => x?.key ?? x?.title ?? _;

    menus: any[] = [];
    dynamicTabs: TabItem[] = [];
    private isNavigatingFromNewTab = false; // Flag để biết navigation có phải từ newTab không


    menu: any = {};
    //#endregion

    currentAppVersion: string = '';
    hasNewVersion: boolean = false;
    latestVersionDetails: any = null;
    isAppMenuVisible = false;
    private eventSource: EventSource | null = null;
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
    private routerSubscription?: Subscription;

    rootMenuKey: string = '';


    menuComps: MenuItem[] = [];
    dynamicTabComps: TabItemComp[] = [];
    menuCompKey: string = '';
    selectedCompIndex = 0;
    isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
    isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
    get hasDynamicTabComp(): boolean {
        return this.dynamicTabComps.length > 0;
    }


    tabOpens: string[] = [];

    ngOnInit(): void {

        const tabOpenedsRaw = localStorage.getItem('tabOpeneds');
        this.tabOpens = tabOpenedsRaw ? JSON.parse(tabOpenedsRaw) : []
        // console.log('this.tabOpens:', this.tabOpens);
        // console.log('this.tabOpenedsRaw:', tabOpenedsRaw);

        this.menuService.menuKey$.subscribe((x) => {
            // console.log(x);
            this.menuCompKey = x;
            this.isCollapsed = x == '';
        });
        // this.menuComps = this.menuService.getCompMenus(this.menuCompKey);
        this.menuService.getCompMenus(this.menuCompKey).subscribe(menus => {
            this.menuComps = menus;
            const router = this.router.url.split('?')[0].replace('/', '');

            this.toggleMenuComp(this.findRootKeyByRouter(this.menuComps, router) || '');


            // if (!window.name) {
            //     // window.name = 'APP_WINDOW';
            //     console.log('🆕 New window', window.name);
            // } else {
            //     console.log('♻ Existing window');
            // }


            // if (this.tabOpens.length > 0) {
            //     this.tabOpens.forEach((item, i) => {
            //         const menu = this.findMenuByRouter(menus, item) as LeafItem;
            //         if (menu) {
            //             this.newTabComp(menu.comp, menu.title, (menu.router ?? ''), menu.data);
            //         }
            //     })
            // } else 
            {
                const menu = this.findMenuByRouter(menus, router) as LeafItem;
                // console.log('menu:', menu, router);
                // console.log('menus:', menus);
                if (menu) {
                    this.newTabComp(menu.comp, menu.title, (menu.router ?? ''), menu.data);
                }
            }

        });

        // Subscribe to TabService for opening component tabs from other components
        this.tabService.tabCompRequest$.subscribe((payload: TabCompPayload) => {
            // console.log('[MainLayout] Received tabCompRequest:', payload);
            this.newTabComp(payload.comp, payload.title, payload.key, payload.data);
        });

        // Trì hoãn SSE và version check để các API quan trọng cho UI load trước
        // (tránh SSE chiếm slot kết nối HTTP của trình duyệt)
        // setTimeout(() => {
        //     this.loadCurrentVersion();
        //     this.initSseConnection();
        // }, 3000);
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    // newTabComp(comp: Type<any>, title: string, data?: any, key: string,) {
    //     this.isCollapsed = true;

    //     // Tạo unique key dựa trên component và data để phân biệt các tab cùng component nhưng khác data
    //     const getTabKey = (tab: TabItemComp): string => {
    //         const compName = tab.comp?.name || '';
    //         const dataKey = tab.data ? JSON.stringify(tab.data) : '';
    //         return `${compName}_${dataKey}`;
    //     };

    //     const currentTabKey = `${comp?.name || ''}_${data ? JSON.stringify(data) : ''}`;
    //     const injector = Injector.create({
    //         providers: [{ provide: 'tabData', useValue: data }],
    //         parent: this.injector,
    //     });

    //     const idx = this.dynamicTabComps.findIndex((t) => getTabKey(t) === currentTabKey);
    //     if (idx >= 0) {
    //         this.selectedCompIndex = idx;
    //         return;
    //     }

    //     this.dynamicTabComps = [...this.dynamicTabComps, { title, comp, injector, data }];
    //     setTimeout(() => (this.selectedCompIndex = this.dynamicTabComps.length - 1));

    //     // console.log('this.dynamicTabComps:', this.dynamicTabComps);

    //     // Lưu tabs vào localStorage
    //     // this.saveTabs();


    // }

    // tabOpens: any[] = localStorage.getItem('tabOpened') || [];



    newTabComp(
        comp: Type<any>,
        title: string,
        key: string,
        data?: any,
    ) {
        this.isCollapsed = true;

        // console.log('newTabComp data:', data);

        // stringify ổn định (tránh khác thứ tự key)
        const normalize = (v: any): string =>
            v ? JSON.stringify(v, Object.keys(v).sort()) : '';

        const getTabKey = (tab: TabItemComp): string =>
            `${tab.key}_${normalize(tab.data)}`;

        const currentTabKey = `${key}_${normalize(data)}`;

        const injector = Injector.create({
            providers: [{ provide: 'tabData', useValue: data }],
            parent: this.injector,
        });

        const idx = this.dynamicTabComps.findIndex(
            t => getTabKey(t) === currentTabKey
        );

        // Nếu tab đã tồn tại → cập nhật title và focus
        if (idx >= 0) {
            this.dynamicTabComps[idx].title = title;
            this.selectedCompIndex = idx;
            return;
        }

        // Thêm tab mới
        this.dynamicTabComps = [
            ...this.dynamicTabComps,
            {
                title,
                comp,
                key,
                injector,
                data
            },
        ];

        setTimeout(() => {
            this.selectedCompIndex = this.dynamicTabComps.length - 1;
        });

        if (!this.tabOpens.includes(key)) {
            this.tabOpens.push(key);
            localStorage.setItem('tabOpeneds', JSON.stringify(this.tabOpens));
        }


    }

    // closeTabComp({ index }: { index: number }) {
    //     this.dynamicTabComps.splice(index, 1);
    //     if (this.selectedCompIndex >= this.dynamicTabComps.length)
    //         this.selectedCompIndex = this.dynamicTabComps.length - 1;

    //     // Lưu tabs vào localStorage sau khi đóng
    //     // this.saveTabs();
    // }

    closeTabComp({ index }: { index: number }) {

        const closedTab = this.dynamicTabComps[index];
        const key = closedTab?.key; // hoặc closedTab.key

        // 1️⃣ Remove khỏi tabOpens + localStorage
        if (key) {
            this.tabOpens = this.tabOpens.filter(t => t !== key);
            localStorage.setItem('tabOpeneds', JSON.stringify(this.tabOpens));
        }

        // 1️⃣ Xóa tab → component tab bị destroy
        this.dynamicTabComps.splice(index, 1);

        // 2️⃣ Điều chỉnh selected index
        if (this.dynamicTabComps.length === 0) {
            // ❗ Không còn tab nào → clear router
            this.selectedCompIndex = 0;
            this.router.navigateByUrl('/app', { replaceUrl: true });
            return;
        }

        // Nếu đóng tab đang active hoặc tab trước nó
        if (this.selectedCompIndex >= index) {
            this.selectedCompIndex = Math.max(0, this.selectedCompIndex - 1);
        }
    }

    private setOpenMenuComp(key: string | null) {
        // console.log('setOpenMenuComp:', key);
        this.menuComps.forEach((m) => (m.isOpen = key !== null && m.key === key));
        // localStorage.setItem('openMenuKey', key ?? '');
    }

    isMenuCompOpen = (key: string) =>
        this.menuComps.some((m) => m.key === key && m.isOpen);
    toggleMenuComp(key: string) {
        const m = Array.from(this.menuComps).find(x => x.key === key);
        if (m) m.isOpen = !m.isOpen;
        if (m?.isOpen) this.menuCompKey = key;
        this.isCollapsed = false;
    }

    // Hàm check và tạo tab từ current route (khi paste URL trực tiếp lần đầu)
    private checkAndCreateTabFromCurrentRoute(): void {
        const currentUrl = this.router.url;
        if (currentUrl && currentUrl !== '/app' && currentUrl !== '/home' && currentUrl !== '/login') {
            this.handleDirectNavigation(currentUrl);
        }
    }

    // Hàm tìm menu item theo route
    private findMenuItemByRoute(route: string, items: any[]): any | null {
        for (const item of items) {
            // So sánh route (có thể có hoặc không có / ở đầu)
            const itemRoute = item.router === '#' ? '' : item.router.replace(/^\//, '');
            if (itemRoute === route || itemRoute === `/${route}` || item.router === route || item.router === `/${route}`) {
                return item;
            }
            if (item.children && item.children.length > 0) {
                const found = this.findMenuItemByRoute(route, item.children);
                if (found) return found;
            }
        }
        return null;
    }

    // Hàm xử lý khi navigate trực tiếp từ URL (paste URL)
    private handleDirectNavigation(url: string): void {
        // Bỏ qua nếu navigation đến từ newTab (để tránh tạo tab trùng)
        if (this.isNavigatingFromNewTab) {
            // console.log('Skipping handleDirectNavigation - navigation from newTab');
            return;
        }

        // Loại bỏ base path và query string để lấy route
        const urlWithoutQuery = url.split('?')[0];
        const route = urlWithoutQuery.startsWith('/') ? urlWithoutQuery.substring(1) : urlWithoutQuery;

        // Bỏ qua nếu là route mặc định hoặc không phải route con
        if (!route || route === 'app' || route === 'home' || route === 'login') {
            return;
        }

        // Lấy queryParams từ URL (nếu có)
        const urlObj = new URL(url, window.location.origin);
        let queryParams: any = {};
        urlObj.searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });

        // Nếu URL không có queryParams, tìm trong menu app xem có queryParams không
        let menuItem: any = null;
        let menuQueryParams: any = null;

        if (Object.keys(queryParams).length === 0 && this.menus.length > 0) {
            menuItem = this.findMenuItemByRoute(route, this.menus);
            if (menuItem && menuItem.queryParams && menuItem.queryParams !== '') {
                // Parse queryParams từ menu
                try {
                    menuQueryParams = typeof menuItem.queryParams === 'string'
                        ? JSON.parse(menuItem.queryParams)
                        : menuItem.queryParams;
                    // console.log('Found queryParams from menu for route:', route, menuQueryParams);
                } catch (e) {
                    // console.error('Error parsing menu queryParams:', e);
                }
            }
        }

        // Ưu tiên queryParams từ URL, nếu không có thì dùng từ menu
        const finalQueryParams = Object.keys(queryParams).length > 0 ? queryParams : menuQueryParams;
        const normalizedParams = finalQueryParams && Object.keys(finalQueryParams).length > 0 ? finalQueryParams : undefined;

        // Nếu có queryParams từ menu mà URL không có, navigate lại với queryParams
        if (menuQueryParams && Object.keys(queryParams).length === 0) {
            // Build URL với queryParams từ menu
            let newUrl = `/${route}`;
            if (menuQueryParams) {
                const params = new URLSearchParams();
                Object.keys(menuQueryParams).forEach(key => {
                    params.append(key, String(menuQueryParams[key]));
                });
                newUrl += `?${params.toString()}`;
            }
            // console.log('Navigating with queryParams from menu:', newUrl);
            this.router.navigateByUrl(newUrl);
            return; // Return để đợi navigation xong, sẽ gọi lại handleDirectNavigation
        }

        // Tạo key giống như trong newTab
        const key = route + JSON.stringify(normalizedParams ?? {});

        // Kiểm tra xem tab đã tồn tại chưa
        const existingTab = this.dynamicTabs.find(t => t.key === key);
        if (existingTab) {
            // Tab đã tồn tại, chỉ cần set selectedIndex
            this.selectedIndex = this.dynamicTabs.indexOf(existingTab);
            return;
        }

        // Tìm title từ menu
        let title = route; // default title
        if (!menuItem) {
            menuItem = this.findMenuItemByRoute(route, this.menus);
        }
        if (menuItem && menuItem.title) {
            title = menuItem.title;
        }

        // Tạo tab mới
        const newTab: TabItem = {
            title,
            route,
            queryParams: normalizedParams,
            key
        };

        this.dynamicTabs = [...this.dynamicTabs, newTab];
        this.selectedIndex = this.dynamicTabs.length - 1;

        // console.log('Auto-created tab from direct navigation:', newTab);
    }

    ngAfterViewInit(): void {
        // this.layoutEvent.toggleMenu$.pipe(take(1)).subscribe(key => {
        //     // this.menuKey = key;
        //     if (key) this.toggleMenu(key);

        //     this.menuService.menuKey$.subscribe((key) => {
        //         this.menuKey = key;
        //     });
        //     this.setOpenMenu(key);
        // });
    }


    findRootKeyByRouter(
        items: any[],
        router: string
    ): string | null {
        for (const root of items) {
            // nếu chính root match
            if (root.router === router) {
                return root.key;
            }

            // nếu route nằm trong children của root
            if (root.children?.length) {
                const found = this.findKeyByRouter(root.children, router);
                if (found) {
                    return root.key; // 👈 TRẢ VỀ KEY CẤP 0
                }
            }
        }
        return null;
    }

    private findKeyByRouter(
        items: any[],
        router: string
    ): string | null {
        for (const item of items) {
            if (item.router === router) return item.key;

            if (item.children?.length) {
                const found = this.findKeyByRouter(item.children, router);
                if (found) return found;
            }
        }
        return null;
    }

    findByRouter(node: any, router: string): any | null {
        if (!node) return null;

        if (node.router === router) {
            return node;
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                const found = this.findByRouter(child, router);
                if (found) return found;
            }
        }

        return null;
    }

    findMenuByRouter(menus: any[], router: string): any | null {
        for (const menu of menus) {
            const found = this.findByRouter(menu, router);
            if (found) return found;
        }
        return null;
    }





    // getMenus() {
    //     // console.log('this.is getMenus:', this.isCollapsed);
    //     this.menuAppService.getAll().subscribe({
    //         next: (response) => {

    //             // console.log(response);

    //             this.menuService.menuKey$.subscribe((x) => {
    //                 this.menuKey = x;
    //                 this.isCollapsed = x == '';
    //             });

    //             const map = new Map<number, any>();
    //             // this.nodes = [];
    //             // Tạo map trước
    //             response.data.menus.forEach((item: any) => {
    //                 const menuItem = {
    //                     id: item.ID,
    //                     stt: item.STT,
    //                     key: item.Code,
    //                     title: item.Title,
    //                     router: item.Router == '' ? '#' : `${item.Router}`,
    //                     icon: `${environment.host}api/share/software/icon/${item.Icon}`,
    //                     isPermission: item.IsPermission,
    //                     ParentID: item.ParentID,
    //                     children: [],
    //                     isOpen: item.ParentID > 0 || item.Code == this.menuKey,
    //                     queryParams: (item.QueryParam || ''),
    //                 };

    //                 // Log để debug queryParams từ database
    //                 if (item.QueryParam && item.QueryParam !== '') {
    //                     // console.log(`Menu item [${item.Code}] - QueryParam from DB:`, item.QueryParam, 'Type:', typeof item.QueryParam);
    //                 }

    //                 map.set(item.ID, menuItem);
    //             });

    //             // Gắn cha – con
    //             response.data.menus.forEach((item: any) => {
    //                 const node = map.get(item.ID);

    //                 if (item.ParentID && map.has(item.ParentID)) {
    //                     const parent = map.get(item.ParentID);
    //                     parent.children.push(node);
    //                 } else {
    //                     this.menus.push(node);
    //                 }
    //             });

    //             // console.log(this.menus);

    //             this.menus = this.menuAppService.sortBySTTImmutable(this.menus, i => i.STT ?? i.stt ?? 0);

    //             // console.log('response.data.menus:', this.router.url.split('?')[0]);

    //             const router = this.router.url.split('?')[0].replace('/', '');
    //             this.rootMenuKey = this.findRootKeyByRouter(this.menus, router) || '';
    //             if (this.rootMenuKey) {
    //                 this.menus.forEach(item => {
    //                     item.isOpen = item.key === this.rootMenuKey
    //                 });
    //             }

    //             // Sau khi menus đã load, check current route và tự động tạo tab nếu cần
    //             // (khi paste URL trực tiếp)
    //             setTimeout(() => {
    //                 this.checkAndCreateTabFromCurrentRoute();
    //             }, 0);

    //             // Subscribe vào router events để tự động tạo tab khi navigate trực tiếp
    //             if (!this.routerSubscription) {
    //                 this.routerSubscription = this.router.events
    //                     .pipe(filter(event => event instanceof NavigationEnd))
    //                     .subscribe((event: any) => {
    //                         if (event instanceof NavigationEnd) {
    //                             // Delay một chút để đảm bảo menus đã load
    //                             setTimeout(() => {
    //                                 this.handleDirectNavigation(event.url);
    //                             }, 100);
    //                         }
    //                     });
    //             }


    //         },
    //         error: (err) => {
    //             this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
    //         },
    //     })
    // }

    get currentTab() {
        return this.dynamicTabs[this.selectedIndex];
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

        // console.log('=== newTab called ===');
        // console.log('route:', route);
        // console.log('title:', title);
        // console.log('queryParams (raw):', queryParams);
        // console.log('queryParams type:', typeof queryParams);

        // Parse queryParams nếu là string JSON từ database
        let parsedParams: any = null;
        if (queryParams && queryParams !== '') {
            if (typeof queryParams === 'string') {
                try {
                    parsedParams = JSON.parse(queryParams);
                    // console.log('Parsed queryParams:', parsedParams);
                } catch (e) {
                    // console.error('Error parsing queryParams:', e, 'queryParams value:', queryParams);
                    parsedParams = null;
                }
            } else if (typeof queryParams === 'object') {
                // Đã là object rồi, không cần parse
                parsedParams = queryParams;
                // console.log('queryParams already object:', parsedParams);
            }
        } else {
            // console.log('queryParams is empty or undefined');
        }

        // Normalize: chỉ lấy object có keys, loại bỏ null/undefined/empty
        const normalizedParams =
            parsedParams && typeof parsedParams === 'object' && Object.keys(parsedParams).length > 0
                ? parsedParams
                : undefined;

        // const key = route + JSON.stringify(queryParams ?? {});
        const key = route + JSON.stringify(normalizedParams ?? {});

        // console.log('new tab key:', key);
        // console.log('new tab normalizedParams:', normalizedParams);
        // console.log('=== end newTab ===');



        // Loại bỏ / ở đầu route nếu có (vì route nằm trong children của MainLayoutComponent)
        const cleanRoute = route.startsWith('/') ? route.substring(1) : route;

        const idx = this.dynamicTabs.findIndex(t => t.key === key);
        if (idx >= 0) {
            this.selectedIndex = idx;
            // this.router.navigate([route], { queryParams });
            // console.log('Navigate to existing tab:', cleanRoute, 'with queryParams:', normalizedParams);
            // Build URL với queryParams - convert tất cả values sang string
            let url = `/${cleanRoute}`;
            if (normalizedParams) {
                const params = new URLSearchParams();
                Object.keys(normalizedParams).forEach(key => {
                    const value = normalizedParams[key];
                    // Convert boolean, number sang string
                    params.append(key, String(value));
                });
                url += `?${params.toString()}`;
            }
            // console.log('Navigating to URL:', url);
            // Set flag để skip handleDirectNavigation
            this.isNavigatingFromNewTab = true;
            this.router.navigateByUrl(url).then(() => {
                // Reset flag sau khi navigation xong
                setTimeout(() => {
                    this.isNavigatingFromNewTab = false;
                }, 100);
            });
            return;
        }

        // this.dynamicTabs = [];


        if (this.dynamicTabs.length) {
            for (let i = 0; i < this.dynamicTabs.length; i++) {
                this.closeTab(i);
            }
        }

        this.isCollapsed = true;

        // console.log('this.isCollapsed newtab:', this.isCollapsed);

        // console.log(this.dynamicTabs);

        this.dynamicTabs = [
            ...this.dynamicTabs,
            // { title, route, queryParams, key }
            { title, route: cleanRoute, queryParams: normalizedParams, key }
        ];

        // console.log('new tab this.dynamicTabs:', this.dynamicTabs);

        // setTimeout(() => {

        this.cd.detectChanges();
        this.selectedIndex = this.dynamicTabs.length - 1;
        // this.router.navigate([route], { queryParams });
        // console.log('Navigate to new tab:', cleanRoute, 'with queryParams:', normalizedParams);
        // Build URL với queryParams - convert tất cả values sang string
        let url = `/${cleanRoute}`;
        if (normalizedParams) {
            const params = new URLSearchParams();
            Object.keys(normalizedParams).forEach(key => {
                const value = normalizedParams[key];
                // Convert boolean, number sang string
                params.append(key, String(value));
            });
            url += `?${params.toString()}`;
        }
        // console.log('Navigating to URL:', url);
        // Set flag để skip handleDirectNavigation
        this.isNavigatingFromNewTab = true;
        this.router.navigateByUrl(url).then(() => {
            // Reset flag sau khi navigation xong
            setTimeout(() => {
                this.isNavigatingFromNewTab = false;
            }, 100);
        });
        // });
    }

    // newTab(route: string, title: string, queryParams?: any) {

    //     // const lastDash = route.lastIndexOf('-');
    //     // const result = route.slice(lastDash + 1); // "HN"

    //     const outlet = route;
    //     let normalizedParams: any = null;
    //     if (queryParams) {
    //         try {
    //             normalizedParams = typeof queryParams === 'string' ? JSON.parse(queryParams) : queryParams;
    //             normalizedParams = Object.keys(normalizedParams || {}).length ? normalizedParams : null;
    //         } catch {
    //             normalizedParams = null;
    //         }
    //     }

    //     // Check nếu tab đã tồn tại
    //     const existingIndex = this.dynamicTabs.findIndex(t => t.route === route);
    //     if (existingIndex !== -1) {
    //         this.selectedIndex = existingIndex;
    //     } else {
    //         this.dynamicTabs.push({
    //             title,
    //             route,
    //             outlet,
    //             queryParams: normalizedParams,
    //             key: route
    //         });
    //         this.selectedIndex = this.dynamicTabs.length - 1;
    //     }

    //     // Navigate
    //     this.router.navigate(
    //         [{ outlets: { [this.currentTab.outlet]: [route] } }],
    //         { relativeTo: this.route, queryParams: normalizedParams || undefined }
    //     );
    // }


    handleClickLink(route: string, queryParams?: any) {
        // const outlet = route;
        // let normalizedParams: any = null;
        // if (queryParams) {
        //     try {
        //         normalizedParams = typeof queryParams === 'string' ? JSON.parse(queryParams) : queryParams;
        //         normalizedParams = Object.keys(normalizedParams || {}).length ? normalizedParams : null;
        //     } catch {
        //         normalizedParams = null;
        //     }
        // }

        // // Check nếu tab đã tồn tại
        // const existingIndex = this.dynamicTabs.findIndex(t => t.route === route);
        // if (existingIndex !== -1) {
        //     this.selectedIndex = existingIndex;
        // } else {
        //     // this.dynamicTabs.push({
        //     //     title,
        //     //     route,
        //     //     outlet,
        //     //     queryParams: normalizedParams,
        //     //     key: route
        //     // });
        //     // this.selectedIndex = this.dynamicTabs.length - 1;
        // }

        // Navigate
        // this.router.navigateByUrl(route);
        this.router.navigate([route], {
            queryParams
        });

    }



    onTabChange(index: number) {
        const tab = this.dynamicTabs[index];
        if (tab) {
            // this.router.navigateByUrl(tab.route);
            // Đảm bảo truyền queryParams khi chuyển tab
            // console.log('onTabChange - Navigate to:', tab.route, 'with queryParams:', tab.queryParams);
            // Build URL với queryParams - convert tất cả values sang string
            let url = `/${tab.route}`;
            if (tab.queryParams) {
                const params = new URLSearchParams();
                Object.keys(tab.queryParams).forEach(key => {
                    const value = tab.queryParams[key];
                    // Convert boolean, number sang string
                    params.append(key, String(value));
                });
                url += `?${params.toString()}`;
            }
            // console.log('onTabChange - Navigating to URL:', url);
            // Set flag để skip handleDirectNavigation
            this.isNavigatingFromNewTab = true;
            this.router.navigateByUrl(url).then(() => {
                // Reset flag sau khi navigation xong
                setTimeout(() => {
                    this.isNavigatingFromNewTab = false;
                }, 100);
            });
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
        if (reuse && typeof reuse.clear === 'function') {
            reuse.clear(tab.route);
        }

        const isActive = this.selectedIndex === index;

        // 2. Remove tab
        this.dynamicTabs.splice(index, 1);

        // 3. Xử lý selectedIndex
        if (this.dynamicTabs.length === 0) {
            this.selectedIndex = 0;
            // Set flag để skip handleDirectNavigation
            this.isNavigatingFromNewTab = true;
            this.router.navigateByUrl('/app').then(() => {
                setTimeout(() => {
                    this.isNavigatingFromNewTab = false;
                }, 100);
            });
            return;
        }

        if (isActive) {
            const nextIndex = Math.max(index - 1, 0);
            this.selectedIndex = nextIndex;
            const nextTab = this.dynamicTabs[nextIndex];
            // Build URL với queryParams nếu có
            let url = `/${nextTab.route}`;
            if (nextTab.queryParams) {
                const params = new URLSearchParams();
                Object.keys(nextTab.queryParams).forEach(key => {
                    params.append(key, String(nextTab.queryParams[key]));
                });
                url += `?${params.toString()}`;
            }
            // Set flag để skip handleDirectNavigation
            this.isNavigatingFromNewTab = true;
            this.router.navigateByUrl(url).then(() => {
                setTimeout(() => {
                    this.isNavigatingFromNewTab = false;
                }, 100);
            });
        } else if (this.selectedIndex > index) {
            // đóng tab phía trước tab đang active
            this.selectedIndex--;
        }
    }

    // closeTab(index: number): void {
    //     const tab = this.dynamicTabs[index];
    //     if (!tab) return;

    //     const isActive = this.selectedIndex === index;

    //     // 1. Xóa tab khỏi mảng
    //     this.dynamicTabs.splice(index, 1);

    //     // 2. Xử lý selectedIndex
    //     if (this.dynamicTabs.length === 0) {
    //         this.selectedIndex = 0;
    //         this.router.navigate(['/app']); // route mặc định
    //         return;
    //     }

    //     if (isActive) {
    //         // nếu tab active bị đóng → chọn tab bên trái, hoặc tab đầu tiên
    //         const nextIndex = Math.max(index - 1, 0);
    //         this.selectedIndex = nextIndex;

    //         const nextTab = this.dynamicTabs[nextIndex];
    //         this.router.navigate(
    //             [{ outlets: { [nextTab.outlet]: [nextTab.route] } }],
    //             { relativeTo: this.route, queryParams: nextTab.queryParams || undefined }
    //         );
    //     } else if (this.selectedIndex > index) {
    //         // nếu đóng tab phía trước tab đang active → giảm selectedIndex
    //         this.selectedIndex--;
    //     }
    // }



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
        // console.log('setOpenMenu key:', key);
        // console.log('setOpenMenu trước:', this.menus);
        this.menus.forEach((m) => (m.isOpen = key !== null && m.key === key));


        // this.menus.forEach(item => item.isOpen = true);


        // console.log('setOpenMenu sau:', this.menus);
        // localStorage.setItem('openMenuKey', key ?? '');

    }

    isMenuOpen = (key: string) =>
        this.menus.some((m) => m.key === key && m.isOpen);

    toggleMenu(event: MouseEvent, route: string, key: string) {

        if (route == '') return;
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault(); // chặn reload

            const m = this.menus.find((x) => x.key === key);
            if (m) m.isOpen = !m.isOpen;

            if (m?.isOpen) this.menuKey = key;
            this.isCollapsed = false;

        }
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
    loadCurrentVersion() {
        const localVersion = localStorage.getItem('currentAppVersion');
        this.updateVersionService.getCurrentVersion().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.currentAppVersion = res.data;
                    console.log('Current App Version:', this.currentAppVersion);

                    if (localVersion && localVersion !== this.currentAppVersion) {
                        this.hasNewVersion = true;
                        this.fetchVersionDetails(this.currentAppVersion);
                    } else if (!localVersion) {
                        localStorage.setItem('currentAppVersion', this.currentAppVersion);
                        this.userAppVersion = this.currentAppVersion;
                    }
                }
            },
            error: (err) => console.error('Lỗi lấy phiên bản hiện tại:', err)
        });
    }

    fetchVersionDetails(code: string) {
        this.updateVersionService.getUpdateVersions().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    const data = res.data?.data || [];
                    this.latestVersionDetails = data.find((v: any) => v.Code === code);
                }
            }
        });
    }

    initSseConnection() {
        const sseUrl = this.updateVersionService.getSseUrl();
        this.eventSource = new EventSource(sseUrl);

        this.eventSource.addEventListener('contract-updated', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE Event [contract-updated]:', data);

                if (data.code && data.code !== this.currentAppVersion) {
                    this.hasNewVersion = true;
                    this.currentAppVersion = data.code;
                    this.fetchVersionDetails(data.code);
                    this.showUpdatePrompt(data.code);
                }
            } catch (e) {
                console.error('Lỗi parse dữ liệu SSE:', e, event.data);
            }
        });

        this.eventSource.onerror = (error) => {
            console.error('SSE Connection error:', error);
        };
    }

    showUpdatePrompt(newVersion: string) {
        if (this.latestVersionDetails && this.latestVersionDetails.Code === newVersion) {
            this.showUpdateModal();
        } else {
            this.updateVersionService.getUpdateVersions().subscribe({
                next: (res) => {
                    if (res?.status === 1) {
                        const data = res.data?.data || [];
                        this.latestVersionDetails = data.find((v: any) => v.Code === newVersion);

                        if (this.latestVersionDetails) {
                            this.showUpdateModal();
                        } else {
                            this.showConfirmFallback(newVersion);
                        }
                    } else {
                        this.showConfirmFallback(newVersion);
                    }
                },
                error: (err) => {
                    console.error('Lỗi load chi tiết phiên bản:', err);
                    this.showConfirmFallback(newVersion);
                }
            });
        }
    }

    private showConfirmFallback(newVersion: string) {
        this.nzModal.confirm({
            nzTitle: 'Cập nhật phiên bản mới',
            nzContent: `Hệ thống đã có phiên bản mới (<b>${newVersion}</b>). Bạn có muốn cập nhật ngay không?`,
            nzOkText: 'Có (Tải lại trang)',
            nzCancelText: 'Để sau',
            nzOnOk: () => {
                localStorage.setItem('currentAppVersion', newVersion);
                window.location.reload();
            }
        });
    }

    showUpdateModal() {
        if (!this.latestVersionDetails) {
            this.showUpdatePrompt(this.currentAppVersion);
            return;
        }

        const modalRef = this.modalService.open(UpdateVersionDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: true,
            scrollable: true
        });

        modalRef.componentInstance.versionData = this.latestVersionDetails;

        modalRef.result.then((result) => {
            if (result === 'update') {
                localStorage.setItem('currentAppVersion', this.currentAppVersion);
                window.location.reload();
            }
        }).catch(() => {
        });
    }
}

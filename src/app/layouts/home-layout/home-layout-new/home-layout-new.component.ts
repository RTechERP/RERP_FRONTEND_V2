import { ChangeDetectorRef, Component, Injector, OnInit, Type } from '@angular/core';
import { AppNotifycationDropdownComponent, NotifyItem } from "../../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component";
import { AppUserDropdownComponent } from "../../../pages/systems/app-user/app-user-dropdown.component";
import { NzBadgeComponent } from "ng-zorro-antd/badge";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";

import { CommonModule, NgSwitchCase } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HomeLayoutService } from '../home-layout-service/home-layout.service';
import { HolidayServiceService } from '../../../pages/hrm/holiday/holiday-service/holiday-service.service';
import { Router, RouterLink } from '@angular/router';
import { AppUserService } from '../../../services/app-user.service';
import { PermissionService } from '../../../services/permission.service';
import { GroupItem, LeafItem, MenuItem, MenuService } from '../../../pages/systems/menus/menu-service/menu.service';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { FormsModule } from '@angular/forms';
import { MenuAppService } from '../../../pages/systems/menu-app/menu-app.service';
import { environment } from '../../../../environments/environment';
// import { LayoutEventService } from '../../layout-event.service';
import { TabsModule } from 'primeng/tabs';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { TabServiceService } from '../../tab-service.service';
import { AvatarModule } from 'primeng/avatar';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ApproveTpService } from '../../../pages/person/approve-tp/approve-tp-service/approve-tp.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NewsletterDetailComponent } from '../../../pages/old/newsletter/newsletter/newsletter-detail/newsletter-detail.component';
@Component({
    selector: 'app-home-layout-new',
    imports: [
        CommonModule,
        FormsModule,
        AppNotifycationDropdownComponent,
        AppUserDropdownComponent,
        NzBadgeComponent,
        NzDropDownModule,
        NzGridModule,
        NzCalendarModule,
        RouterLink,
        TabsModule,
        NzLayoutModule,
        AvatarModule,
        NzTabsModule,
        NgSwitchCase,
        HasPermissionDirective,
        NgbModalModule
    ],
    templateUrl: './home-layout-new.component.html',
    styleUrl: './home-layout-new.component.css'
})
export class HomeLayoutNewComponent implements OnInit {

    isMobile = window.innerHeight <= 768;

    notifItems: NotifyItem[] = [];
    menus: any[] = [];
    menuApproves: any = {};
    menuPersons: any[] = [];
    menuWeekplans: any = {};
    menuQickAcesss: any = {};
    // menuKey: string = '';

    // isMenuOpen = (key: string) => this.menus.some((m) => m.key === key && m.isOpen);
    // isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
    // isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';

    dynamicTabs: any[] = [];
    selectedIndex = 0;

    today = new Date();
    calendarDate = new Date();
    holidays: any[] = [];
    scheduleWorkSaturdays: any[] = [];
    quantityApprove: any = {};

    isHoliday(date: Date): boolean {
        let isHoliday = this.holidays.some(
            (x) =>
                x.HolidayYear === date.getFullYear() &&
                x.HolidayMonth === date.getMonth() + 1 &&
                x.HolidayDay === date.getDate()
        );
        return isHoliday;
    }

    isSaturday(date: Date): boolean {
        let isSaturday = this.scheduleWorkSaturdays.some(
            (x) =>
                x.WorkYear === date.getFullYear() &&
                x.WorkMonth === date.getMonth() + 1 &&
                x.WorkDay === date.getDate()
        );
        return isSaturday;
    }

    employeeOnleaves: any = [];
    employeeWfhs: any = [];

    totalEmployeeOnleave = 0;
    totalEmployeeWfh = 0;

    activeTab = 0;

    newsletters: any[] = [];


    constructor(
        private notification: NzNotificationService,
        private homepageService: HomeLayoutService,
        private cdr: ChangeDetectorRef,
        private holidayService: HolidayServiceService,
        private router: Router,
        private appUserService: AppUserService,
        public menuService: MenuService,
        public menuAppService: MenuAppService,
        private permissionService: PermissionService,
        private tabService: TabServiceService,
        private approveTpService: ApproveTpService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        this.getMenus();
        this.appUserService.user$.subscribe(() => {
            this.permissionService.refreshPermissions();
            this.cdr.markForCheck?.();
        });

        this.getHoliday(this.today.getFullYear(), this.today.getMonth());
        this.getEmployeeOnleaveAndWFH();
        this.getQuantityApprove();
        this.loadNewsletters();
    }



    getQuantityApprove() {
        this.approveTpService.getQuantityApprove().subscribe({
            next: (res: any) => {
                // console.log('API Response:', res); // Debug log
                this.quantityApprove = res.data;
                // console.log('Assigned quantityApprove:', this.quantityApprove); // Debug log
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        })
    }
    newTabApprove() {
        const approvalType = this.quantityApprove?.Type;
        // if (!approvalType || !this.quantityApprove || Object.keys(this.quantityApprove).length === 0) {
        //     this.notification.warning('Thông báo', 'Đang tải dữ liệu, vui lòng thử lại sau vài giây!');
        //     return;
        // }
        let route = '';
        let title = '';
        switch (approvalType) {
            case 'Senior':
                route = 'senior-approve?isSeniorMode=true';
                title = 'Senior duyệt';
                break;
            case 'TP':
                route = 'tbp-approve';
                title = 'TP duyệt';
                break;
            case 'BGD':
                route = 'tbp-approve';
                title = 'BGD duyệt';
                break;
            default:
                route = 'tbp-approve';
                title = 'Duyệt';
        }
        this.newTab(route, title);
    }
    getMenus() {
        this.menuAppService.getAll().subscribe({
            next: (response) => {

                const map = new Map<number, any>();
                // this.nodes = [];
                // Tạo map trước
                response.data.menus.forEach((item: any) => {
                    map.set(item.ID, {
                        STT: item.STT,
                        Code: item.Code,
                        Title: item.Title,
                        Router: item.Router == '' ? '' : `${environment.baseHref}/${item.Router}`,
                        Icon: `${environment.host}api/share/software/icon/${item.Icon}`,
                        IsPermission: item.IsPermission,
                        IsOpen: true,
                        ParentID: item.ParentID,
                        Children: [],
                        ID: item.ID
                    });
                });

                // Gắn cha – con
                response.data.menus.forEach((item: any) => {
                    const node = map.get(item.ID);

                    if (item.ParentID && map.has(item.ParentID)) {
                        const parent = map.get(item.ParentID);
                        parent.Children.push(node);
                    } else {
                        this.menus.push(node);
                    }
                });

                // console.log('this.menus:', this.menus);

                this.menus = this.menuAppService.sortBySTTImmutable(this.menus, i => i.STT ?? i.stt ?? 0);

                this.menuApproves = this.menus.find((x) => x.Code == 'appvovedperson');
                // console.log('this.menuApproves:', this.menuApproves);

                var pesons = this.menus.find((x) => x.Code == 'person');
                this.menuPersons = pesons.Children.filter((x: any) => x.Code == 'registerpayroll' || x.Code == 'dailyreport' || x.Code == 'registercommon');
                // console.log('this.menuPersons', this.menuPersons);
                this.menuWeekplans = pesons.Children.find((x: any) => x.Code == 'planweek');

                this.menuQickAcesss = this.menus.find((x) => x.Code == 'M4');
                // console.log('this.menuQickAcesss:', this.menuQickAcesss);
                // console.log('this.menuWeekplans:', this.menuWeekplans);

            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        })
    }


    getHoliday(year: number, month: number): void {
        this.holidayService.getHolidays(month + 1, year).subscribe({
            next: (response) => {
                this.holidays = response.data.holidays;
                this.scheduleWorkSaturdays = response.data.scheduleWorkSaturdays;
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        });
    }

    getEmployeeOnleaveAndWFH(): void {

        this.homepageService.getEmployeeOnleaveAndWFH().subscribe({
            next: (response) => {
                this.employeeOnleaves = response.data.employeeOnleaves || [];
                this.employeeWfhs = response.data.employeeWfhs || [];

                this.totalEmployeeOnleave = this.employeeOnleaves.reduce(
                    (sum: any, dept: any) => sum + dept.Employees.length,
                    0
                );
                this.totalEmployeeWfh = this.employeeWfhs.reduce(
                    (sum: any, dept: any) => sum + dept.Employees.length,
                    0
                );

                // console.log('employeeWfhs:', this.employeeWfhs);
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
            }
        })

    }

    loadNewsletters(): void {
        this.homepageService.getNewsletters().subscribe({
            next: (response) => {
                this.newsletters = response.data || [];
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
            }
        });
    }

    onPick(n: NotifyItem) {
        console.log('picked:', n);
    }


    openModule(event: MouseEvent, route: string, key: string) {

        if (route == '') return;
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault(); // chặn reload
            // this.newTab(route, title);

            this.menuService.setMenuKey(key);
            this.router.navigate(['/app']); // hoặc route tới MainLayout
        }
    }

    // newTab(route: string, title: string, data?: any) {
    //     route = route.replace(environment.baseHref, '');
    //     console.log('this.dynamicTabs:', this.dynamicTabs);

    //     const idx = this.dynamicTabs.findIndex(t => t.route === route);

    //     this.tabService.openTab({ route: route, title: title, queryParams: queryParams });
    //     this.router.navigate(['/app']);
    //     // route = route.replace(environment.baseHref, '');
    //     // const idx = this.dynamicTabs.findIndex(t => t.route === route);

    //     this.dynamicTabs = [
    //         ...this.dynamicTabs,
    //         { title, route, data }
    //     ];
    //     console.log('this.dynamicTabs after add:', this.dynamicTabs);

    //     // this.dynamicTabs = [
    //     //     ...this.dynamicTabs,
    //     //     { title, route, data }
    //     // ];

    //     // setTimeout(() => {
    //     //     this.selectedIndex = this.dynamicTabs.length - 1;
    //     //     this.router.navigateByUrl(route);
    //     // });
    // }

    newTab(route: string, title: string, data?: any) {
        route = route.replace(environment.baseHref, '');

        const idx = this.dynamicTabs.findIndex(t => t.route === route);

        if (idx >= 0) {
            this.selectedIndex = idx;
            this.router.navigateByUrl(route);
            return;
        }

        this.dynamicTabs = [
            ...this.dynamicTabs,
            { title, route, data }
        ];
        // console.log('this.dynamicTabs after add:', this.dynamicTabs);

        setTimeout(() => {
            this.selectedIndex = this.dynamicTabs.length - 1;
            this.router.navigateByUrl(route);
        });
    }

    handleClickLink(event: MouseEvent, route: string, title: string) {
        // console.log('route:', route);
        if (route == '') return;
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault(); // chặn reload
            this.newTab(route, title);
        }
    }

    onSelectChangeCalendar(value: Date): void {
        // this.calendarDate = value;
        this.getHoliday(value.getFullYear(), value.getMonth());
    }

    openNewsletterDetail(newsletterId: number): void {
        const modalRef = this.modalService.open(NewsletterDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: true,
            scrollable: true
        });

        modalRef.componentInstance.newsletterId = newsletterId;
    }

    getNewsletterImageUrl(item: any): string {
        const serverPath = item?.ServerImgPath;
        const imageName = item?.Image; // Keep consistency with item properties

        if (!serverPath && !imageName) return 'assets/images/no-image.png';

        const host = environment.host + 'api/share/';
        let urlImage = (serverPath || imageName || '').replace("\\\\192.168.1.190\\", "");
        urlImage = urlImage.replace(/\\/g, '/');

        return host + urlImage;
    }
}

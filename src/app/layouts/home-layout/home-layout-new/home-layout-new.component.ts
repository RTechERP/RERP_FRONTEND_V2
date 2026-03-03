import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, Type } from '@angular/core';
import { AppNotifycationDropdownComponent, NotifyItem } from "../../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component";
import { AppUserDropdownComponent } from "../../../pages/systems/app-user/app-user-dropdown.component";
import { NzBadgeComponent } from "ng-zorro-antd/badge";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzModalModule } from 'ng-zorro-antd/modal';

import { CommonModule, NgSwitchCase } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HomeLayoutService } from '../home-layout-service/home-layout.service';
import { HolidayServiceService } from '../../../pages/hrm/holiday/holiday-service/holiday-service.service';
import { Router, RouterLink } from '@angular/router';
import { AppUserService } from '../../../services/app-user.service';
import { BorrowService } from '../../../pages/old/inventory-demo/borrow/borrow-service/borrow.service';
import { PermissionService } from '../../../services/permission.service';
import {
  GroupItem,
  LeafItem,
  MenuItem,
  MenuService,
} from '../../../pages/systems/menus/menu-service/menu.service';
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
import { HostListener } from '@angular/core';
import { UpdateVersionService } from '../../../pages/systems/update-version/update-version.service';
import { NzModalService } from 'ng-zorro-antd/modal';
interface LiXi {
    id: number;
    left: number;
    animationDuration: number;
    delay: number;
    rotation: number;
    icon: string;
}
import { NewsletterDetailComponent } from '../../../pages/old/newsletter/newsletter/newsletter-detail/newsletter-detail.component';
import { DateTime } from 'luxon';
import { UpdateVersionDetailComponent } from '../../../pages/systems/update-version/update-version-detail/update-version-detail.component';
import { NzButtonModule } from "ng-zorro-antd/button";
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
        NgbModalModule,
        NzModalModule,
        NzButtonModule
    ],
    templateUrl: './home-layout-new.component.html',
    styleUrl: './home-layout-new.component.css'
})
export class HomeLayoutNewComponent implements OnInit, OnDestroy {
    private eventSource: EventSource | null = null;
    currentAppVersion: string = '';
    userAppVersion: string = localStorage.getItem('currentAppVersion') || '0.0.0';
    lixis: LiXi[] = [];
    showLixiRain: boolean = false;
    hasNewVersion: boolean = false;
    latestVersionDetails: any = null;
    private lixiIntervalId: any;
    private lixiIdCounter = 0;
    private clickCount = 0;
    private clickTimer: any;
    isMobile = window.innerHeight <= 768;

    notifItems: NotifyItem[] = [];
    isAppMenuVisible = false;
    selectedModuleKey = '';
    menus: any[] = [];
    menuApproves: any = {};
    menuPersons: any[] = [];
    menuWeekplans: any = {};
    menuQickAcesss: any = {};
    // menuKey: string = '';

    hasMenuApprovePermission = true;


    date = new Date();

    dynamicTabs: any[] = [];
    selectedIndex = 0;

    today = new Date();
    calendarDate = new Date();
    holidays: any[] = [];
    scheduleWorkSaturdays: any[] = [];
    quantityApprove: any = {};
    quantityBorrow: any = {};
    quantityBorrowExpried: any = {};

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
        private modalService: NgbModal,
        private borrowService: BorrowService,
        private updateVersionService: UpdateVersionService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.appUserService.user$.subscribe(() => {
            this.permissionService.refreshPermissions();
            this.cdr.markForCheck?.();

            // this.id = this.appUserService.currentUser?.ID || 0;
            // this.employeeID = this.appUserService.currentUser?.EmployeeID || 0;
            // this.departmentID = this.appUserService.currentUser?.DepartmentID || 0;
            // this.positionID = this.appUserService.currentUser?.PositionID || 0;
            // this.isHR =
            //     (this.employeeHRs.includes(this.employeeID) ||
            //         this.departmentHRs.includes(this.departmentID)) || false;

            // this.isAdmin = (this.appUserService.currentUser?.IsAdmin) || false;
        });
        this.getMenus();
        this.getHoliday(this.today.getFullYear(), this.today.getMonth());
        this.getEmployeeOnleaveAndWFH();
        this.getQuantityApprove();
        this.getQuantityBorrow();
        this.loadNewsletters();

        // Trì hoãn SSE và version check để các API quan trọng cho UI load trước
        // (tránh SSE chiếm slot kết nối HTTP của trình duyệt)
        // setTimeout(() => {
        //     this.loadCurrentVersion();
        //     this.initSseConnection();
        // }, 3000);
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


    getQuantityBorrow() {
        this.borrowService.getQuantityBorrow().subscribe({
            next: (res: any) => {
                this.quantityBorrow = res.data.QuantitySemiExpired;
                // console.log('Sắp hết hạn:', this.quantityBorrow);
                this.quantityBorrowExpried = res.data.QuantityExpired;
                // console.log('Hết hạn:', this.quantityBorrowExpried);
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

        const menuPersonCodes: any[] = ['registerpayroll', 'dailyreport', 'registercommon'];
        this.menuService.getCompMenus('').subscribe(menus => {

            // this.menuComps = menus;

            this.menus = menus;
            // console.log('this.menus:', this.menus);

            this.menuApproves = this.menus.find((x) => x.key == 'appvovedperson');
            // console.log('this.menuApproves:', this.menuApproves);

            this.hasMenuApprovePermission = this.menuApproves?.children?.every(
                (item: any) => (item.isPermission || false) === false
            );
            // console.log('hasMenuApprovePermission', this.hasMenuApprovePermission);

            var pesons = this.menus.find((x) => x.key == 'person');
            this.menuPersons = pesons.children.filter((x: any) => menuPersonCodes.includes(x.key));
            this.menuWeekplans = pesons.children.find((x: any) => x.key == 'planweek');
            this.menuQickAcesss = this.menus.find((x) => x.key == 'M4');
        });
    }
    this.newTab(route, title);
  }
  getMenus() {
    // console.log('this.appUserService.currentUser:', this.appUserService.currentUser);

    this.menuAppService.getAll().subscribe({
      next: (response) => {
        const map = new Map<number, any>();
        // this.nodes = [];
        // Tạo map trước
        response.data.menus.forEach((item: any) => {
          let isPermission = item.IsPermission;

          //Nếu là AGV-Cơ khí
          if (item.Router == 'daily-report-machine') {
            isPermission =
              this.isAdmin ||
              this.departmentAgvCokhis.includes(this.departmentID) ||
              this.userAllReportTechs.includes(this.id);
          }

          //nếu là sale
          if (
            item.Router == 'daily-report-sale-admin' ||
            item.Router == 'daily-report-sale' ||
            item.Code == 'M66'
          ) {
            isPermission =
              this.isAdmin || this.departmentSales.includes(this.departmentID);
          }

          //Nếu là Kỹ thuật
          if (item.Router == 'daily-report-tech') {
            isPermission =
              this.isAdmin ||
              this.departmentTechs.includes(this.departmentID) ||
              this.userAllReportTechs.includes(this.id);
          }

          //Nếu là HR
          if (
            item.Router == 'daily-report-thr' ||
            item.Router == 'daily-report-lxcp' ||
            item.Code == 'M70'
          ) {
            isPermission =
              this.isAdmin ||
              this.isHR ||
              this.positinCPs.includes(this.positionID) ||
              this.positinLXs.includes(this.positionID);
          }

          //Nếu là lắp rap
          if (item.Router == 'daily-report-lr') {
            isPermission =
              this.isAdmin ||
              this.departmentLapraps.includes(this.departmentID) ||
              this.userAllReportTechs.includes(this.id);
          }

          //Nếu là MKT
          if (item.Router == 'daily-report-mkt') {
            isPermission =
              this.isAdmin || this.marketings.includes(this.departmentID);
          }

          map.set(item.ID, {
            STT: item.STT,
            Code: item.Code,
            Title: item.Title,
            Router:
              item.Router == '' ? '' : `${environment.baseHref}/${item.Router}`,
            Icon: `${environment.host}api/share/software/icon/${item.Icon}`,
            IsPermission: isPermission,
            IsOpen: true,
            ParentID: item.ParentID,
            Children: [],
            ID: item.ID,
            QueryParam: item.QueryParam ?? '',
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

    openModule(event: MouseEvent, route: string, key: string) {

        if (route == '') return;
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault(); // chặn reload
            // this.newTab(route, title);

            this.menuService.setMenuKey(key);
            this.selectedModuleKey = key;
            this.router.navigate(['/app']); // hoặc route tới MainLayout
            localStorage.removeItem('tabOpeneds');
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

        this.menuApproves = this.menus.find((x) => x.Code == 'appvovedperson');
        // console.log('this.menuApproves:', this.menuApproves);

        var pesons = this.menus.find((x) => x.Code == 'person');
        this.menuPersons = pesons.Children.filter(
          (x: any) =>
            x.Code == 'registerpayroll' ||
            x.Code == 'dailyreport' ||
            x.Code == 'registercommon',
        );

    newTab(route: string, title: string, queryParams?: any) {
        route = route.replace(environment.baseHref, '');

        // Parse queryParams nếu là string JSON
        let parsedParams: any = null;
        if (queryParams && queryParams !== '') {
            if (typeof queryParams === 'string') {
                try {
                    parsedParams = JSON.parse(queryParams);
                } catch (e) {
                    parsedParams = null;
                }
            } else if (typeof queryParams === 'object') {
                parsedParams = queryParams;
            }
        }

        // Tạo URL với queryParams
        let fullUrl = route;
        if (parsedParams && Object.keys(parsedParams).length > 0) {
            const params = new URLSearchParams();
            Object.keys(parsedParams).forEach(key => {
                params.append(key, String(parsedParams[key]));
            });
            fullUrl = `${route}?${params.toString()}`;
        }

        const idx = this.dynamicTabs.findIndex(t => t.route === fullUrl);

        if (idx >= 0) {
            this.selectedIndex = idx;
            this.router.navigateByUrl(fullUrl);
            return;
        }

        this.dynamicTabs = [
            ...this.dynamicTabs,
            { title, route: fullUrl, data: parsedParams }
        ];

        setTimeout(() => {
            this.selectedIndex = this.dynamicTabs.length - 1;
            this.router.navigateByUrl(fullUrl);
        });
    }

    handleClickLink(event: MouseEvent, route: string, title: string, queryParams?: string) {
        // console.log('route:', route, 'queryParams:', queryParams);
        if (route == '') return;
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault(); // chặn reload
            this.newTab(route, title, queryParams);

            localStorage.removeItem('tabOpeneds');
        }
      } else if (typeof queryParams === 'object') {
        // Đã là object rồi, không cần parse
        parsedParams = queryParams;
        // console.log('queryParams already object:', parsedParams);
      }
    } else {
      // console.log('queryParams is empty or undefined');
    }

    const normalizedParams =
      parsedParams &&
      typeof parsedParams === 'object' &&
      Object.keys(parsedParams).length > 0
        ? parsedParams
        : undefined;
    // if (idx >= 0) {
    this.selectedIndex = idx;

    const cleanRoute = route.startsWith('/') ? route.substring(1) : route;
    let url = `/${cleanRoute}`;
    if (normalizedParams) {
      const params = new URLSearchParams();
      Object.keys(normalizedParams).forEach((key) => {
        const value = normalizedParams[key];
        // Convert boolean, number sang string
        params.append(key, String(value));
      });
      url += `?${params.toString()}`;
    }

    // this.router.navigateByUrl(route);
    // console.log('navigateByUrl(url):', url);
    this.router.navigateByUrl(url).then(() => {
      // Reset flag sau khi navigation xong
      setTimeout(() => {
        // this.isNavigatingFromNewTab = false;
      }, 100);
    });
    return;
    // }

    this.dynamicTabs = [...this.dynamicTabs, { title, route, queryParams }];
    // console.log('this.dynamicTabs after add:', this.dynamicTabs);

    setTimeout(() => {
      this.selectedIndex = this.dynamicTabs.length - 1;
      this.router.navigateByUrl(route);
    });
  }

  handleClickLink(
    event: MouseEvent,
    route: string,
    title: string,
    queryParam?: string,
  ) {
    // console.log('route:', route);
    if (route == '') return;
    if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); // chặn reload
      this.newTab(route, title, queryParam);
    }
    ngOnDestroy(): void {
        clearTimeout(this.clickTimer);
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

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

                // data.code là mã phiên bản mới từ server bắn về
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
        // Nếu đã có dữ liệu chi tiết của phiên bản này thì hiện modal luôn
        if (this.latestVersionDetails && this.latestVersionDetails.Code === newVersion) {
            this.showUpdateModal();
        } else {
            // Nếu chưa có thì load lại rồi hiện
            this.updateVersionService.getUpdateVersions().subscribe({
                next: (res) => {
                    if (res?.status === 1) {
                        const data = res.data?.data || [];
                        this.latestVersionDetails = data.find((v: any) => v.Code === newVersion);

                        if (this.latestVersionDetails) {
                            this.showUpdateModal();
                        } else {
                            // Fallback nếu không tìm thấy chi tiết
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
            // Modal dismissed
        });
    }
}

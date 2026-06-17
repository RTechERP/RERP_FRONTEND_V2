import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, Type } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
import { GroupItem, LeafItem, MenuItem, MenuService } from '../../../pages/systems/menus/menu-service/menu.service';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
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
import { NotificationService } from '../../../services/notification.service';
import { NewsletterDetailComponent } from '../../../pages/old/newsletter/newsletter/newsletter-detail/newsletter-detail.component';
import { DateTime } from 'luxon';
import { UpdateVersionDetailComponent } from '../../../pages/systems/update-version/update-version-detail/update-version-detail.component';
import { NzButtonModule } from "ng-zorro-antd/button";
import { ProjectTaskSumaryAttendanceService } from '../../../pages/project_task/project-task-sumary-attendance/project-task-sumary-attendance.service';

interface LiXi {
    id: number;
    left: number;
    animationDuration: number;
    delay: number;
    rotation: number;
    icon: string;
}
import { HistoryBorrowSaleService } from '../../../pages/old/Sale/HistoryBorrowSale/history-borrow-sale-service/history-borrow-sale.service';
import { ProjectTaskService } from '../../../pages/project_task/project-task/project-task.service';
import { PollFormService } from '../../../pages/poll-form/poll-form.service';
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
    userAppVersion: string = localStorage.getItem('currentAppVersion') || '1.0.3';
    lixis: LiXi[] = [];
    isPollModalVisible: boolean = false;
    currentPopupPoll: any = null;
    pendingPolls: any[] = [];
    showLixiRain: boolean = false;
    hasNewVersion: boolean = false;
    latestVersionDetails: any = null;
    private lixiIntervalId: any;
    private lixiIdCounter = 0;
    private clickCount = 0;
    private clickTimer: any;
    isMobile = window.innerHeight <= 768;

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
    projectTaskAttendances: number = 0;
    quantityApprove: any = {};
    quantityBorrow: any = {};
    quantityBorrowExpried: any = {};
    quantityBorrowSale: any = {};
    quantityBorrowExpriedSale: any = {};
    quantityOverdueProjectTask: number = 0;
    hasBorrowSale: boolean = true;
    hasBorrowDemo: boolean = true;
    contractExpiryInfo: { daysLeft: number | null; contractEndDate: string | null } = { daysLeft: null, contractEndDate: null };
    pendingReview = { asEmployee: 0, asEvaluator: 0, asTBP: 0, asHR: 0, asBGD: 0 };

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
        private historyBorrowSaleService: HistoryBorrowSaleService,
        private updateVersionService: UpdateVersionService,
        private nzModal: NzModalService,
        public notifService: NotificationService,
        private projectTaskService: ProjectTaskService,
        private projectTaskAttendanceService: ProjectTaskSumaryAttendanceService,
        private pollFormService: PollFormService,
    ) { }

    get notifItems(): NotifyItem[] { return this.notifService.items; }

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

        // this.getMenus();
        // this.getHoliday(this.today.getFullYear(), this.today.getMonth());
        // this.getEmployeeOnleaveAndWFH();
        // this.getQuantityApprove();
        // this.getQuantityBorrow();
        // this.loadNewsletters();

        // Gom các API load UI vào forkJoin để biết khi nào tất cả đã xong
        this.notifService.setItems([]);
        forkJoin([
            this.getMenus(),
            this.getHoliday(this.today.getFullYear(), this.today.getMonth()),
            this.getEmployeeOnleaveAndWFH(),
            this.getQuantityApprove(),
            this.getQuantityBorrow(),
            this.getQuantityBorrowSale(),
            this.getQuantityOverdueProjectTask(),
            this.loadNewsletters(),
            this.getPendingContractReview(),
            this.getProjectTaskAttendance(),
            this.getPendingPollCount(),
        ]).subscribe({
            next: () => {
                console.log('Tất cả API quan trọng đã load xong. Khởi tạo SSE và check version...');
                // this.loadCurrentVersion();
                // this.initSseConnection();
            },
            error: (err) => {
                console.error('Có lỗi khi load API quan trọng, vẫn khởi tạo SSE...', err);
                // this.loadCurrentVersion();
                // this.initSseConnection();
            }
        });
    }
    getQuantityApprove() {
        if (!this.permissionService.hasPermission('N1,N85,N32')) {
            this.quantityApprove = { Count: 0 };
            return of(null);
        }
        return this.approveTpService.getQuantityApprove().pipe(
            tap((res: any) => {
                this.quantityApprove = res.data;
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            })
        );
    }


    getQuantityBorrow() {
        return this.borrowService.getQuantityBorrow().pipe(
            tap((res: any) => {
                this.quantityBorrow = res.data.QuantitySemiExpired;
                this.quantityBorrowExpried = res.data.QuantityExpired;
                if (this.quantityBorrow > 0 || this.quantityBorrowExpried > 0) {
                    this.hasBorrowDemo = false;
                }
                if (this.quantityBorrow > 0) {
                    this.notifService.addItem({
                        id: 1,
                        time: new Date().toISOString(),
                        title: 'Vật tư sắp hết hạn kho demo',
                        text: `Bạn đang có ${this.quantityBorrow} vật tư mượn sắp hết hạn`,
                        group: 'today',
                        icon: 'clock-circle',
                        route: 'summary-asset-persional',
                        queryParams: { activeTab: 2 }
                    });
                }
                if (this.quantityBorrowExpried > 0) {
                    this.notifService.addItem({
                        id: 2,
                        time: new Date().toISOString(),
                        title: 'Vật tư quá hạn kho demo',
                        text: `Bạn đang có ${this.quantityBorrowExpried} vật tư mượn quá hạn`,
                        group: 'today',
                        icon: 'warning',
                        route: 'summary-asset-persional',
                        queryParams: { activeTab: 2 }
                    });
                }
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            })
        );

    }

    getQuantityBorrowSale() {
        return this.historyBorrowSaleService.getQuantityBorrow().pipe(
            tap((res: any) => {
                this.quantityBorrowSale = res.data.quantityBorrowSale;
                this.quantityBorrowExpriedSale = res.data.quantityBorrowExpriedSale;

                if (this.quantityBorrowSale > 0 || this.quantityBorrowExpriedSale > 0) {
                    this.hasBorrowSale = false;
                }
                if (this.quantityBorrowSale > 0) {
                    this.notifService.addItem({
                        id: 3,
                        time: new Date().toISOString(),
                        title: 'Vật tư sắp hết hạn kho sale',
                        text: `Bạn đang có ${this.quantityBorrowSale} vật tư mượn sắp hết hạn`,
                        group: 'today',
                        icon: 'clock-circle',
                        route: 'summary-asset-persional',
                        queryParams: { activeTab: 1 }
                    });
                }
                if (this.quantityBorrowExpriedSale > 0) {
                    this.notifService.addItem({
                        id: 4,
                        time: new Date().toISOString(),
                        title: 'Vật tư quá hạn kho sale',
                        text: `Bạn đang có ${this.quantityBorrowExpriedSale} vật tư mượn quá hạn`,
                        group: 'today',
                        icon: 'warning',
                        route: 'summary-asset-persional',
                        queryParams: { activeTab: 1 }
                    });
                }
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            })
        );
    }

    getQuantityOverdueProjectTask() {
        return this.projectTaskService.getNumberOverdue().pipe(
            tap((res: any) => {
                if (res.status === 1 && res.data?.result?.length > 0) {
                    this.quantityOverdueProjectTask = res.data.result[0][''] || 0;
                }
            }),
            catchError((err: any) => {
                return of(null);
            })
        );
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
        return this.menuService.getCompMenus('').pipe(
            tap(menus => {
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
                var tasks = this.menus.find((x) => x.key == 'M03');// Công việc
                this.menuPersons = pesons.children.filter((x: any) => menuPersonCodes.includes(x.key));
                // const menuWeekplans = pesons.children.find((x: any) => x.key === 'planweek');
                const menuWeekplans = tasks.children.find((x: any) => x.key === 'M10005');
                const menuProjectTask = tasks.children.find((x: any) => x.key === 'M10002');
                const menuTimeLine = menuProjectTask.children.find((x: any) => x.key === 'M10304');
                menuWeekplans.children.unshift(menuTimeLine);
                // if (menuWeekplans && menuProjectTask) {
                //     menuWeekplans.children = menuWeekplans.children || [];

                //     menuProjectTask.children.forEach((item: any) => {
                //         menuWeekplans.children.push({ ...item });
                //     });
                // }
                this.menuWeekplans = menuWeekplans;
                this.menuQickAcesss = this.menus.find((x) => x.key == 'M4');
                let quickAccessChildren = this.menuPersons.find((x) => x.key == 'registercommon').children.find((x: any) => x.key === 'M11205');
                this.menuQickAcesss.children.push(quickAccessChildren);

            }),
            catchError((err) => {
                return of(null);
            })
        );
    }


    getHoliday(year: number, month: number) {
        return this.holidayService.getHolidays(month + 1, year).pipe(
            tap((response) => {
                this.holidays = response.data.holidays;
                this.scheduleWorkSaturdays = response.data.scheduleWorkSaturdays;
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            }),
        );
    }

    getEmployeeOnleaveAndWFH() {
        return this.homepageService.getEmployeeOnleaveAndWFH().pipe(
            tap((response) => {
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
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            })
        );
    }

    loadNewsletters() {
        return this.homepageService.getNewsletters().pipe(
            tap((response) => {
                const data = response.data || [];
                // Sort by CreatedDate descending and take top 10
                this.newsletters = data;
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            })
        );
    }


    getContractExpiry() {
        return this.homepageService.getContractExpiryDays().pipe(
            tap((res: any) => {
                if (res?.status !== 1 || !res?.data) return;
                const daysLeft: number = res.data.daysLeft;
                const contractEndDate: string = res.data.contractEndDate;

                this.contractExpiryInfo = { daysLeft, contractEndDate };

                if (daysLeft <= 0) {
                    // Đã hết hạn hoặc hết hạn hôm nay
                    this.notifService.addItem({
                        id: 10,
                        time: new Date().toISOString(),
                        title: 'Hợp đồng đã hết hạn!',
                        text: daysLeft === 0
                            ? `Hợp đồng của bạn hết hạn hôm nay (${contractEndDate})!`
                            : `Hợp đồng của bạn đã hết hạn ${Math.abs(daysLeft)} ngày trước (${contractEndDate})!`,
                        group: 'today',
                        icon: 'close-circle',
                        route: '',
                        queryParams: {}
                    });
                } else if (daysLeft <= 10) {
                    // Sắp hết hạn
                    this.notifService.addItem({
                        id: 10,
                        time: new Date().toISOString(),
                        title: 'Hợp đồng sắp hết hạn',
                        text: `Hợp đồng của bạn còn ${daysLeft} ngày nữa sẽ hết hạn (${contractEndDate})!`,
                        group: 'today',
                        icon: 'warning',
                        route: '',
                        queryParams: {}
                    });
                }
            }),
            catchError(() => of(null)) // Bỏ qua lỗi, không ảnh hưởng các API khác
        );
    }

    /** Lấy số phiếu đánh giá chuyển HĐLĐ đang chờ xử lý của người dùng hiện tại */
    getPendingContractReview() {
        return this.homepageService.getPendingContractReviewCount().pipe(
            tap((res: any) => {
                if (res?.status !== 1 || !res?.data) return;
                this.pendingReview = {
                    asEmployee: res.data.AsEmployee || 0,
                    asEvaluator: res.data.AsEvaluator || 0,
                    asTBP: res.data.AsTBP || 0,
                    asHR: res.data.AsHR || 0,
                    asBGD: res.data.AsBGD || 0,
                };
                const total = this.pendingReview.asEmployee + this.pendingReview.asEvaluator
                    + this.pendingReview.asTBP + this.pendingReview.asHR + this.pendingReview.asBGD;
                if (total > 0) {
                    this.notifService.addItem({
                        id: 11,
                        time: new Date().toISOString(),
                        title: 'Phiếu đánh giá chuyển HĐLĐ',
                        text: `Bạn có ${total} phiếu chờ xử lý`,
                        group: 'today',
                        icon: 'file-done',
                        route: 'contract-transfer-review',
                        queryParams: {}
                    });
                }
            }),
            catchError(() => of(null))
        );
    }



    getProjectTaskAttendance() {
        return this.projectTaskAttendanceService.getCheckProjectTaskAttendance(this.appUserService.currentUser?.EmployeeID || 0).pipe(
            tap((res: any) => {
                const data = res.data;
                this.projectTaskAttendances = data.length;
            }),
            catchError((err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                return of(null);
            }))
    };
    getPendingPollCount() {
        return this.pollFormService.getPendingCount().pipe(
            tap((res: any) => {
                if (res?.status !== 1 || !res?.data || res.data.length === 0) {
                    this.pendingPolls = [];
                    return;
                }
                const pendingPolls = res.data;
                this.pendingPolls = pendingPolls;
                const count = pendingPolls.length;
                this.notifService.addItem({
                    id: 12,
                    time: new Date().toISOString(),
                    title: ' Bình chọn',
                    text: `Bạn có ${count} bình chọn chưa hoàn thành`,
                    group: 'today',
                    icon: 'form',
                    route: 'poll-vote',
                    queryParams: {}
                });

                this.showPollPopup(pendingPolls);
            }),
            catchError(() => of(null))
        );
    }

    showPollPopup(polls: any[]) {
        const hasUnseen = polls.some(p => !sessionStorage.getItem(`poll_popup_dismissed_${p.ID}`));
        if (hasUnseen) {
            this.isPollModalVisible = true;
        }
    }

    handlePollModalCancel() {
        this.isPollModalVisible = false;
        if (this.pendingPolls && this.pendingPolls.length > 0) {
            this.pendingPolls.forEach(p => {
                sessionStorage.setItem(`poll_popup_dismissed_${p.ID}`, 'true');
            });
        }
    }

    goToPollVote(id?: any) {
        this.isPollModalVisible = false;
        const pollId = id || (this.currentPopupPoll ? this.currentPopupPoll.ID : null);
        if (pollId) {
            sessionStorage.setItem(`poll_popup_dismissed_${pollId}`, 'true');
            this.newTab('poll-vote/' + pollId, 'Bình chọn');
        }
    }

    onPick(n: NotifyItem) {
        if (n.route) {
            this.newTab(n.route, n.title || 'Thông báo', n.queryParams);
        }
    }

    onPickHistoryProduct() {
        this.newTab('summary-asset-persional', '', { activeTab: 2 });
    }

    onPickHistoryProductSale() {
        this.newTab('summary-asset-persional', '', { activeTab: 1 });
    }

    onPickProjectTaskOverdue() {
        this.newTab('project-task', 'Công việc');
    }



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

    //     // this.dynamicTabs = [
    //     //     ...this.dynamicTabs,
    //     //     { title, route, data }
    //     // ];

    //     // setTimeout(() => {
    //     //     this.selectedIndex = this.dynamicTabs.length - 1;
    //     //     this.router.navigateByUrl(route);
    //     // });
    // }

    newTab(route: string, title: string, queryParams?: any) {
        if (environment.baseHref && route.startsWith(environment.baseHref)) {
            route = route.substring(environment.baseHref.length);
        }

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
    }

    onSelectChangeCalendar(value: Date): void {
        // this.calendarDate = value;
        this.getHoliday(value.getFullYear(), value.getMonth()).subscribe();
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
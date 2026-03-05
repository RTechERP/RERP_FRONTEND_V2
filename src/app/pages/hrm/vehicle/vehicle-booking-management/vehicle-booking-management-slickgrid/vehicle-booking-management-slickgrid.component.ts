import { ChangeDetectorRef, Component, ViewEncapsulation, ViewContainerRef, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { VehicleScheduleFormComponent } from '../vehicle-schedule-form/vehicle-schedule-form.component';
import { ExportVehicleScheduleFormComponent } from '../export-vehicle-schedule-form/export-vehicle-schedule-form.component';
import { VehicleBookingFileImagesFormComponent } from '../vehicle-booking-file-images-form/vehicle-booking-file-images-form.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../../auth/auth.service';
import { DateTimePickerEditorComponent } from '../date-time-picker-editor.component';
import { UpdateVehicleMoneyFormComponent } from '../update-vehicle-money-form/update-vehicle-money-form.component';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { VehicleBookingManagementDetailComponent } from '../vehicle-booking-management-detail/vehicle-booking-management-detail.component';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { PaymentOrder } from '../../../../general-category/payment-order/model/payment-order';
import { PaymentOrderDetailComponent } from '../../../../general-category/payment-order/payment-order-detail/payment-order-detail.component';
import { PaymentOrderSpecialComponent } from '../../../../general-category/payment-order/payment-order-special/payment-order-special.component';
import { Menubar } from 'primeng/menubar';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
@Component({
  selector: 'app-vehicle-booking-management-slickgrid',
  imports: [
    NzCardModule,
    NzCheckboxModule,
    FormsModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzInputNumberModule,
    Menubar,
  ],
  templateUrl: './vehicle-booking-management-slickgrid.component.html',
  styleUrl: './vehicle-booking-management-slickgrid.component.css'
})
export class VehicleBookingManagementSlickgridComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private vehicleBookingManagementService: VehicleBookingManagementService,
    private cdRef: ChangeDetectorRef,
    private authService: AuthService,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private viewContainerRef: ViewContainerRef,
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) { }
  private ngbModal = inject(NgbModal);
  @ViewChild('dataTableVehicleBookingManagement', { static: false })
  tableElementRef!: ElementRef;
  vehicleBookingManagementTable: Tabulator | null = null;
  vehicleBookingManagementList: any[] = [];
  keyWord: string = '';
  searchText: string = '';
  isSearchVisible: boolean = false;

  // Menu bars
  menuBars: any[] = [];
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  dateFormat = 'dd/MM/yyyy';
  checked = false;
  selected: any;
  vehicleBookingListId: any[] = [];
  employees: any[] = [];
  employeesDriver: any[] = [];
  exportingExcel: boolean = false;
  editingCell: { cell: any; originalValue: any; rowId: number } | null = null;
  pendingChanges: Map<number, { id: number; departureDateActual: Date }> = new Map();
  hasPendingChanges: boolean = false;
  savingChanges: boolean = false;
  dateStart: string = DateTime.local().toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local().toFormat('yyyy-MM-dd');
  getDay() {
    console.log(
      DateTime.fromISO(this.dateStart)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      DateTime.fromISO(this.dateEnd)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
  }
  categoryId: any = 0;
  employeeId: any = 0;
  driverEmployeeId: any = 0;
  statusId: any = 0;

  // Tạo mảng category
  lstCategory = [
    { Category: 0, CategoryText: 'Tất cả' },
    { Category: 1, CategoryText: 'Đăng ký người đi' },
    { Category: 5, CategoryText: 'Đăng ký người về' },
    { Category: 4, CategoryText: 'Chủ động phương tiện' },
    { Category: 2, CategoryText: 'Đăng ký giao hàng thương mại' },
    { Category: 6, CategoryText: 'Đăng ký lấy hàng thương mại' },
    { Category: 7, CategoryText: 'Đăng ký lấy hàng Demo/triển Lãm' },
    { Category: 8, CategoryText: 'Đăng ký giao hàng Demo/triển lãm' },
  ];

  lstStatus = [
    { Status: 0, StatusText: 'Tất cả' },
    { Status: 1, StatusText: 'Chờ xếp' },
    { Status: 2, StatusText: 'Đã xếp' },
    { Status: 4, StatusText: 'Chủ động phương tiện' },
  ];


  //#region chạy khi mở chương trình
  currentUser: any = null;
  isAdmin: boolean = false;
  isEmployeeSelectDisabled: boolean = false;

  // Kiểm tra quyền
  private hasAdminOrSpecialPermissions(): boolean {
    if (this.isAdmin) {
      return true;
    }
    const specialPermissions = ['N2', 'N34', 'N1', 'N71'];
    return this.permissionService.hasAnyPermission(specialPermissions);
  }

  ngOnInit() {
    this.getCurrentUser();
    this.getEmployees();
    this.getEmployeesDriver();
    this.initMenuBar();
  }

  ngAfterViewInit(): void {
    // Ensure ViewChild is initialized before drawing table
    this.cdRef.detectChanges();
    // Initialize table first with empty data to show the table structure
    this.initTable();
    // Then load data from API
    this.getVehicleBookingManagement();
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  searchData(): void {
    this.getVehicleBookingManagement();
  }

  initMenuBar(): void {
    this.menuBars = [];

    // Thêm/Sửa/Xóa/Copy
    this.menuBars.push(
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.openVehicleBookingManagementDetailModal()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEdit()
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => this.onCopy()
      },
      {
        label: 'Đăng ký hủy',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onCancelBooking()
      },
      {
        label: 'Xếp xe',
        icon: 'fa-solid fa-car-side fa-lg text-info',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.onVehicleSchedule()
      },
      {
        label: 'Chờ xếp xe',
        icon: 'fa-solid fa-clock fa-lg text-warning',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.onWatingArrange()
      },
      {
        label: 'Hủy lịch đặt',
        icon: 'fa-solid fa-xmark fa-lg text-danger',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.Cancel_Click()
      },
      {
        label: 'Đăng ký xe',
        icon: 'fa-solid fa-car-side fa-lg text-info',
        visible: this.permissionService.hasPermission('N2,N34,N1,N68'),
        command: () => this.test()
      }
    );


    // Duyệt menu - chỉ hiện với quyền N34,N71,N1
    this.menuBars.push({
      label: 'Duyệt',
      visible: this.permissionService.hasPermission('N34,N71,N1'),
      icon: 'fa-solid fa-check-circle fa-lg text-success',
      items: [
        {
          label: 'Duyệt',
          icon: 'fa-solid fa-circle-check fa-lg text-success',
          command: () => this.Approve(true)
        },
        {
          label: 'Hủy duyệt',
          icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
          command: () => this.Approve(false)
        }
      ]
    });

    // Xem ảnh kiện hàng - chỉ hiện với quyền N34,N2,N1
    this.menuBars.push({
      label: 'Xem ảnh kiện hàng',
      visible: this.permissionService.hasPermission('N34,N2,N1'),
      icon: 'fa-solid fa-images fa-lg text-info',
      command: () => this.onVehicleBookingFileImages()
    });

    // Xuất Excel và Lịch trình
    this.menuBars.push(
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel()
      },
      {
        label: 'Lịch trình xe',
        icon: 'fa-solid fa-route fa-lg text-primary',
        command: () => this.onExportVehicleSchedule()
      }
    );

    // Lưu thay đổi - chỉ hiện với quyền N2,N34,N1
    this.menuBars.push({
      label: 'Lưu thay đổi',
      visible: this.permissionService.hasPermission('N2,N34,N1'),
      icon: 'fa-solid fa-save fa-lg text-primary',
      command: () => this.saveAllChanges()
    });

    // Đề nghị thanh toán
    this.menuBars.push({
      label: 'Đề nghị thanh toán',
      icon: 'fa-solid fa-money-bill fa-lg text-success',
      command: () => this.openPaymentOrderFromRow()
    });
  }
  getCurrentUser() {
    this.isAdmin = this.appUserService.isAdmin;
    const employeeID = this.appUserService.employeeID;
    const hasSpecialPermission = this.hasAdminOrSpecialPermissions();

    if (!hasSpecialPermission && employeeID) {
      this.employeeId = employeeID;
      this.isEmployeeSelectDisabled = true;
    } else {
      this.employeeId = 0;
      this.isEmployeeSelectDisabled = false;
    }

    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
  }

  getEmployees() {
    this.vehicleBookingManagementService.getEmployee().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.employees = (data.data || []).filter((emp: any) => {
            const fullName = emp.FullName || emp.Name || '';
            return fullName && fullName.trim().length > 0;
          });
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
      }
    });
  }
  getEmployeesDriver() {
    this.vehicleBookingManagementService.getEmployee().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.employeesDriver = (data.data || []).filter((emp: any) => emp.ChucVuHDID === 6);
        }
      }
    });
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  onCategoryChange(categoryId: number) {
    this.categoryId = categoryId;
  }

  onStatusChange(statusId: number) {
    this.statusId = statusId;
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
  }

  updateChecked() {
    console.log(this.checked);
    this.getVehicleBookingManagement();
  }
  onSearch() {
    this.getVehicleBookingManagement();
  }
  setDefautSearch() {
    this.dateStart = DateTime.local().toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local().toFormat('yyyy-MM-dd');
    this.categoryId = 0;
    this.statusId = 0;
    this.checked = false;
    this.keyWord = '';

    const hasSpecialPermission = this.hasAdminOrSpecialPermissions();
    if (!hasSpecialPermission) {
      const employeeID = this.appUserService.employeeID;
      this.employeeId = employeeID || 0;
    } else {
      this.employeeId = 0;
    }

    this.getVehicleBookingManagement();
  }

  openVehicleBookingManagementDetailModal() {
    const modalRef = this.modalService.open(VehicleBookingManagementDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.result.then(
      (result) => {
        if (result) {
          setTimeout(() => this.getVehicleBookingManagement(), 100);
        }
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onVehicleBookingFileImages() {
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Lỗi', 'Vui lòng chọn ít nhất một dòng!');
      return;
    }
    const modalRef = this.modalService.open(
      VehicleBookingFileImagesFormComponent,
      {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = this.vehicleBookingListId;
    modalRef.result.then(
      (result) => {
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onVehicleSchedule() {
    if (!this.validatechecked()) {
      return;
    }
    const modalRef = this.modalService.open(VehicleScheduleFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.vehicleBookingListId;
    modalRef.result.then(
      (result) => {
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onExportVehicleSchedule() {
    const modalRef = this.modalService.open(
      ExportVehicleScheduleFormComponent,
      {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
      }
    );
    modalRef.result.then(
      (result) => {
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onWatingArrange() {
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.error('Thông báo', 'Chọn ít nhất một thông tin xe');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
      return;
    }
    console.log(
      'vehicleBookingListId.length ',
      this.vehicleBookingListId.length
    );
    var checkUpdatesuccess = true;
    this.vehicleBookingListId.forEach((item) => {
      const request = {
        ID: item.ID,
        Status: 1,
        IsCancel: false,
        DepartureDateActual: item.DepartureDateActual,
      };
      this.vehicleBookingManagementService
        .postVehicleBookingManagement(request)
        .subscribe({
          next: () => { },
          error: () => {
            checkUpdatesuccess = false;
          },
        });
    });
    if (checkUpdatesuccess) {
      this.notification.success('Thông báo', 'Xếp xe thành công');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    } else {
      this.notification.create('error', 'Thông báo', 'Lỗi lưu!');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
  }
  Cancel_Click() {
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.error('Thông báo', 'Chọn ít nhất một thông tin xe');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
      return;
    }
    console.log(
      'vehicleBookingListId.length ',
      this.vehicleBookingListId.length
    );
    var checkUpdatesuccess = true;
    this.vehicleBookingListId.forEach((item) => {
      const request = {
        ID: item.ID,
        Status: 3,
        IsCancel: true,
      };
      this.vehicleBookingManagementService
        .postVehicleBookingManagement(request)
        .subscribe({
          next: () => { },
          error: () => {
            checkUpdatesuccess = false;
          },
        });
    });
    if (checkUpdatesuccess) {
      this.notification.success('Thông báo', 'Hủy lịch đặt thành công');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    } else {
      this.notification.create('error', 'Thông báo', 'Lỗi lưu!');
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
  }

  Approve(status: boolean) {
    const isApprovedText = status ? 'duyệt' : 'huỷ duyệt';

    // Kiểm tra có chọn dòng không
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.warning(
        'Thông báo',
        `Vui lòng chọn đăng ký xe muốn ${isApprovedText}!`
      );
      return;
    }

    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isApprovedText} danh sách đặt xe phát sinh đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lấy thông tin user hiện tại
        if (!this.currentUser) {
          this.notification.warning(
            'Thông báo',
            'Không thể lấy thông tin user hiện tại!'
          );
          return;
        }

        const currentDepartmentID = this.currentUser.DepartmentID || 0;
        const currentEmployeeID = this.currentUser.EmployeeID || 0;
        const isAdmin = this.currentUser.IsAdmin || false;

        // Xử lý logic: Global.DepartmentID = Global.EmployeeID == 54 ? 2 : Global.DepartmentID
        let departmentID = currentDepartmentID;
        if (currentEmployeeID === 54) {
          departmentID = 2;
        }

        // Lọc các item hợp lệ để xử lý và thu thập lý do lỗi
        const validItems: any[] = [];
        const errors: string[] = [];
        let noProblemCount = 0;

        this.vehicleBookingListId.forEach((item) => {
          // Kiểm tra ID > 0
          if (!item.ID || item.ID <= 0) {
            return;
          }

          // Chỉ xử lý nếu có phát sinh (IsProblemArises == true)
          if (!item.IsProblemArises) {
            noProblemCount++;
            return;
          }

          // Kiểm tra department permission: Global.DepartmentID != departmentId && !Global.IsAdmin
          const itemDepartmentID = item.DepartmentID || 0;
          if (departmentID !== itemDepartmentID && !isAdmin) {
            errors.push(
              `Bạn không phải TBP của phòng ${item.DepartmentName}, không thể duyệt đơn của ${item.FullName}.`
            );
            return;
          }

          validItems.push(item);
        });

        if (noProblemCount > 0) {
          errors.unshift(
            `Có ${noProblemCount} đơn không có vấn đề phát sinh, không cần duyệt.`
          );
        }

        if (errors.length > 0) {
          // Hiển thị lỗi chi tiết (tối đa 3 lỗi đầu tiên để tránh spam)
          const errorMsg =
            errors.slice(0, 3).join('<br>') +
            (errors.length > 3
              ? `<br>...và ${errors.length - 3} lỗi khác.`
              : '');
          this.notification.warning('Không thể duyệt một số đơn', errorMsg, {
            nzDuration: 5000,
          });
        }

        if (validItems.length === 0) {
          return;
        }

        // Tạo requests để xử lý đồng thời
        const requests = validItems.map((item) => {
          const request = {
            ...item,
            IsApprovedTBP: status,
          };
          return this.vehicleBookingManagementService
            .approveBooking(request)
            .pipe(
              catchError((error) => {
                console.error(
                  `Lỗi khi ${isApprovedText} đơn ${item.ID}:`,
                  error
                );
                return of({ success: false, error, item });
              })
            );
        });

        // Xử lý tất cả requests đồng thời
        forkJoin(requests).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter(
              (r) => r.success !== false
            ).length;
            const failCount = responses.filter(
              (r) => r.success === false
            ).length;

            if (successCount > 0) {
              this.notification.success(
                'Thông báo',
                `${isApprovedText.charAt(0).toUpperCase() +
                isApprovedText.slice(1)
                } thành công cho ${successCount} đơn đăng ký.`
              );
            }

            if (failCount > 0) {
              this.notification.error(
                'Thông báo',
                `Có ${failCount} đơn đăng ký ${isApprovedText} thất bại.`
              );
            }

            // Reload data sau khi xử lý
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          },
          error: (error) => {
            console.error(`Lỗi khi ${isApprovedText}:`, error);
            this.notification.error('Thông báo', `Lỗi khi ${isApprovedText}!`);
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          },
        });
      },
    });
  }
  test() { }
  async exportToExcel() {
    let table = this.vehicleBookingManagementTable;
    if (!table) return;
    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    this.exportingExcel = true;

    // Hiển thị notification đang chuẩn bị file
    const loadingNotification = this.notification.create(
      'info',
      'Đang chuẩn bị file để xuất',
      'Vui lòng đợi trong giây lát...',
      {
        nzDuration: 0, // Không tự động đóng
        nzStyle: { fontSize: '0.75rem' }
      }
    );

    try {

      // Lấy danh sách ảnh cho các item giao hàng (Category 2: Đăng ký giao hàng, Category 6: Đăng ký lấy hàng)
      const deliveryItems = data.filter(
        (item: any) => item.Category === 2 || item.Category === 6
      );
      const deliveryItemRequests = deliveryItems.map((item: any) => ({
        ID: item.ID,
        ReceiverName: item.ReceiverName || '',
        TimeNeedPresent: item.TimeNeedPresent || '',
        ReceiverPhoneNumber: item.ReceiverPhoneNumber || '',
        PackageName: item.PackageName || '',
        SpecificDestinationAddress: item.SpecificDestinationAddress || '',
      }));

      let imageMap: Map<number, string[]> = new Map();

      if (deliveryItemRequests.length > 0) {
        try {
          const imageResponse: any = await this.vehicleBookingManagementService.getListImage(deliveryItemRequests).toPromise();
          console.log('Image response:', imageResponse);
          if (imageResponse?.data && Array.isArray(imageResponse.data)) {
            // Duyệt qua từng item trong response
            imageResponse.data.forEach((imgItem: any) => {
              console.log('Image item:', imgItem);

              // Thử nhiều cách để lấy booking ID:
              // 1. Từ Title (nếu Title là ID dạng string)
              let bookingId: number | null = null;
              if (imgItem.Title) {
                const titleStr = imgItem.Title.toString().trim();
                if (titleStr && !isNaN(parseInt(titleStr))) {
                  bookingId = parseInt(titleStr);
                }
              }

              // 2. Nếu không có từ Title, thử tìm trong deliveryItemRequests theo các field khác
              if (!bookingId && imgItem.urlImage) {
                // Tìm item matching dựa trên ReceiverName, PackageName, hoặc các field khác
                const matchedItem = deliveryItemRequests.find((req: any) => {
                  return (req.ReceiverName && imgItem.ReceiverName && req.ReceiverName === imgItem.ReceiverName) ||
                    (req.PackageName && imgItem.PackageName && req.PackageName === imgItem.PackageName) ||
                    (req.ID && imgItem.ID && req.ID === imgItem.ID);
                });
                if (matchedItem) {
                  bookingId = matchedItem.ID;
                }
              }

              // 3. Nếu vẫn không có, thử dùng ID trực tiếp từ imgItem (nếu có)
              if (!bookingId && imgItem.ID) {
                bookingId = typeof imgItem.ID === 'number' ? imgItem.ID :
                  (typeof imgItem.ID === 'string' && !isNaN(parseInt(imgItem.ID)) ? parseInt(imgItem.ID) : null);
              }

              // Thêm vào map nếu có bookingId và urlImage
              if (bookingId && imgItem.urlImage) {
                if (!imageMap.has(bookingId)) {
                  imageMap.set(bookingId, []);
                }
                imageMap.get(bookingId)!.push(imgItem.urlImage);
                console.log(`Mapped image for booking ID ${bookingId}:`, imgItem.urlImage);
              } else {
                console.warn('Cannot map image item:', imgItem, 'bookingId:', bookingId);
              }
            });

            console.log('Final imageMap:', Array.from(imageMap.entries()));
          }
        } catch (error) {
          console.error('Không thể lấy danh sách ảnh:', error);
        }
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Đăng ký xe');
      const columns = table.getColumns();

      // Bỏ cột đầu tiên bằng cách slice từ index 1
      const filteredColumns = columns.slice(1);
      // Lọc bỏ cột có title là 'ID'
      const filteredColumnsID = filteredColumns.filter(
        (col: any) => col.getDefinition().title !== 'ID'
      );
      // Thêm dòng header
      const headers = filteredColumnsID.map(
        (col: any) => col.getDefinition().title
      );

      // Thêm cột "Link ảnh" vào cuối
      headers.push('Link ảnh');

      // Thêm dòng header và lưu lại dòng đó để thao tác
      const headerRow = worksheet.addRow(headers);

      // Gán style màu cho header (màu xanh dương đậm)
      headerRow.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }, // Màu xanh dương
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' }, // Màu trắng cho chữ
          size: 11,
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      });

      // Đặt chiều cao cho header
      headerRow.height = 25;

      // Tìm index của cột "Tiền xe" để format số tiền
      const vehicleMoneyColIndex = filteredColumnsID.findIndex((col: any) => col.getField() === 'VehicleMoney');
      // Tìm index của cột "Link ảnh" (cột cuối cùng)
      const imageLinkColIndex = headers.length - 1;

      data.forEach((row: any, rowIndex: number) => {
        const rowData = filteredColumnsID.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }

          return value;
        });

        // Thêm link ảnh vào cuối mỗi dòng (tạm thời để rỗng, sẽ set hyperlink sau)
        const imageLinks = imageMap.get(row.ID) || [];
        rowData.push(imageLinks.length > 0 ? imageLinks.join('\n') : '');

        const excelRow = worksheet.addRow(rowData);

        // Tạo hyperlink cho các link ảnh
        if (imageLinks.length > 0) {
          const imageCell = excelRow.getCell(imageLinkColIndex + 1);
          // Nếu có nhiều link, tạo text với hyperlink cho từng link
          if (imageLinks.length === 1) {
            // Chỉ có 1 link, tạo hyperlink trực tiếp
            imageCell.value = {
              text: imageLinks[0],
              hyperlink: imageLinks[0],
              tooltip: 'Click để mở ảnh trong trình duyệt'
            };
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };
          } else {
            // Nhiều link, tạo hyperlink cho link đầu tiên, các link khác hiển thị text
            imageCell.value = {
              text: imageLinks[0],
              hyperlink: imageLinks[0],
              tooltip: 'Click để mở ảnh trong trình duyệt'
            };
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };
            // Thêm các link còn lại vào cell (người dùng có thể copy)
            if (imageLinks.length > 1) {
              const remainingLinks = imageLinks.slice(1).map((link: string, idx: number) => {
                return `Link ${idx + 2}: ${link}`;
              });
              const currentValue = imageCell.value.text || imageCell.value;
              imageCell.value = typeof currentValue === 'string'
                ? `${currentValue}\n${remainingLinks.join('\n')}`
                : { text: `${currentValue.text}\n${remainingLinks.join('\n')}`, hyperlink: currentValue.hyperlink };
            }
          }
        }
      });

      const startRow = 2;
      const column = 'A';

      const rowCount = worksheet.rowCount;

      for (let i = startRow; i <= rowCount - 2; i += 3) {
        const cell1 = worksheet.getCell(`${column}${i}`);
        const cell2 = worksheet.getCell(`${column}${i + 1}`);
        const cell3 = worksheet.getCell(`${column}${i + 2}`);

        if (cell1.value === cell2.value && cell1.value === cell3.value) {
          worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
          // Căn giữa nếu cần
          cell1.alignment = { vertical: 'middle' };
        }
      }

      // Format cột có giá trị là Date và format số tiền
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return; // bỏ qua tiêu đề
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          // Format Date
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy hh:mm'; // Format ngày giờ đầy đủ
          }

          // Format số tiền cho cột VehicleMoney
          if (
            vehicleMoneyColIndex !== -1 &&
            colNumber === vehicleMoneyColIndex + 1
          ) {
            const numValue =
              typeof cell.value === 'number'
                ? cell.value
                : typeof cell.value === 'string' && cell.value.trim() !== ''
                  ? parseFloat(cell.value.replace(/[^\d.-]/g, ''))
                  : null;
            if (numValue !== null && !isNaN(numValue)) {
              cell.value = numValue;
              cell.numFmt = '#,##0'; // Format số với dấu phẩy ngăn cách hàng nghìn
            }
          }

          // Thêm border cho tất cả các ô
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          };
        });
      });

      // Tự động căn chỉnh độ rộng cột với tính toán tốt hơn
      worksheet.columns.forEach((column: any, index: number) => {
        let maxLength = 10;
        let maxLines = 1;

        // Tính độ dài cho header
        const headerValue = headers[index] ? headers[index].toString() : '';
        maxLength = Math.max(maxLength, headerValue.length);

        // Tính độ dài cho các ô dữ liệu
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          if (cell.value !== null && cell.value !== undefined) {
            const cellValue = cell.value.toString();
            // Đếm số dòng nếu có xuống dòng
            const lines = cellValue.split('\n').length;
            maxLines = Math.max(maxLines, lines);

            // Tính độ dài tối đa của một dòng
            const maxLineLength = Math.max(
              ...cellValue.split('\n').map((line: string) => line.length)
            );
            maxLength = Math.max(maxLength, maxLineLength);
          }
        });

        // Đặt độ rộng cột (tối thiểu 10, tối đa 80 để đảm bảo hiển thị đầy đủ)
        // Cộng thêm 2 cho padding
        column.width = Math.min(Math.max(maxLength + 2, 10), 80);
      });

      // Áp dụng text wrapping và căn chỉnh cho tất cả các ô
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: 'top', // Căn trên để dễ đọc khi có nhiều dòng
            horizontal: colNumber === 1 ? 'center' : 'left', // Cột đầu căn giữa, các cột khác căn trái
          };
        });

        // Tự động điều chỉnh chiều cao hàng dựa trên nội dung
        if (rowNumber > 1) {
          let maxLines = 1;
          row.eachCell((cell: ExcelJS.Cell) => {
            if (cell.value !== null && cell.value !== undefined) {
              const cellValue = cell.value.toString();
              const lines = cellValue.split('\n').length;
              maxLines = Math.max(maxLines, lines);
            }
          });
          // Đặt chiều cao hàng (tối thiểu 15, mỗi dòng thêm 15)
          row.height = Math.max(15, maxLines * 15);
        }
      });

      // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
      worksheet.autoFilter = {
        from: {
          row: 1,
          column: 1,
        },
        to: {
          row: 1,
          column: headers.length,
        },
      };

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Format ngày tháng hiện tại: dd-MM-yyyy
      const now = DateTime.local();
      const formattedDate = now.toFormat('dd-MM-yyyy');

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Đăng ký xe - ${formattedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      // Hiển thị thông báo thành công (notification loading sẽ tự đóng hoặc người dùng đóng)
      this.notification.success('Thông báo', 'Xuất Excel thành công!', {
        nzStyle: { fontSize: '0.75rem' }
      });
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error('Thông báo', 'Lỗi khi xuất file Excel!', {
        nzStyle: { fontSize: '0.75rem' }
      });
    } finally {
      this.exportingExcel = false;
    }
  }


  getVehicleBookingManagement() {
    // Format date theo local time để tránh lệch timezone
    const formatLocalDate = (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const request = {
      StartDate: formatLocalDate(this.dateStart),
      EndDate: formatLocalDate(this.dateEnd),
      Category: this.categoryId || 0,
      EmployeeId: this.employeeId || 0,
      DriverEmployeeId: this.driverEmployeeId || 0,
      Status: this.statusId || 0,
      Keyword: this.keyWord || '',
      IsCancel: this.checked,
    };
    console.log('request:', request);
    this.vehicleBookingManagementService
      .getVehicleBookingManagement(request)
      .subscribe((response: any) => {
        this.vehicleBookingManagementList = response.data.data || [];

        this.vehicleBookingManagementList.sort((a, b) => {
          const aValue = a.VehicleInformation || '';
          const bValue = b.VehicleInformation || '';
          const aMatch = aValue.match(/^(\d+)/);
          const bMatch = bValue.match(/^(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1], 10) : Infinity;
          const bNum = bMatch ? parseInt(bMatch[1], 10) : Infinity;
          if (aNum !== bNum) {
            return aNum - bNum;
          }
          return aValue.localeCompare(bValue);
        });
        console.log(this.vehicleBookingManagementList);
        // Clear pending changes khi reload data
        this.pendingChanges.clear();
        this.hasPendingChanges = false;
        this.cdRef.detectChanges();
        this.drawTable();
      });
  }

  //#region Drawtable
  private initTable(): void {
    if (!this.tableElementRef) {
      return;
    }

    if (!this.vehicleBookingManagementTable) {
      // Tạo context menu
      const rowMenu = [
        {
          label: 'Cập nhật tiền xe',
          action: (e: any, row: any) => {
            const rowData = row.getData();
            this.openUpdateVehicleMoneyModal(rowData);
          }
        },
        // {
        //   label: 'Lưu thời gian xuất phát thực tế',
        //   action: (e: any, row: any) => {
        //     const rowData = row.getData();
        //     const rowId = rowData['ID'];

        //     // Kiểm tra xem dòng này có thay đổi pending không
        //     if (this.pendingChanges.has(rowId)) {
        //       const change = this.pendingChanges.get(rowId);
        //       if (change) {
        //         // Lưu thay đổi của dòng này
        //         this.saveSingleChange(rowId, change.departureDateActual);
        //       }
        //     } else {
        //       this.notification.info('Thông báo', 'Dòng này không có thay đổi để lưu.');
        //     }
        //   },
        //   visible: (e: any, row: any) => {
        //     const rowData = row.getData();
        //     const rowId = rowData['ID'];
        //     return this.pendingChanges.has(rowId);
        //   }
        // }
      ];

      this.vehicleBookingManagementTable = new Tabulator(
        this.tableElementRef.nativeElement,
        {
          ...DEFAULT_TABLE_CONFIG,
          layout: 'fitColumns',
          height: '100%',
          paginationMode: 'local',
          paginationSize: 500,
          rowContextMenu: rowMenu,
          groupBy: (row: any) => row.VehicleInformation || null,
          groupHeader: (value: string, count: number) => {
            if (!value)
              return `Thông tin xe: Khác (${count} dòng)`;
            return `Thông tin xe: ${value} (${count} dòng)`;
          },
          initialSort: [
            {
              column: 'VehicleInformation',
              dir: 'asc',
            },
          ],

          // 👇 Thêm formatter cho hàng - tô màu theo Status
          rowFormatter: (row: any) => {
            const data = row.getData();
            const status = data.Status;
            const isApprovedTBP = data.IsApprovedTBP;
            const isProblemArises = data.IsProblemArises;
            const element = row.getElement();

            // Status == 3 (Hủy xếp) - background đỏ, chữ trắng
            if (status === 3) {
              element.style.backgroundColor = '#dc3545'; // Màu đỏ
              element.style.color = '#ffffff'; // Chữ trắng
            }
            // Status == 1 hoặc 4 (Chưa xếp) - background vàng
            else if (status === 1 || status === 4) {
              // Nếu !isApprovedTBP && isProblemArises - background xám nhạt
              if (!isApprovedTBP && isProblemArises) {
                element.style.backgroundColor = '#d3d3d3'; // Màu xám nhạt
                element.style.color = ''; // Màu chữ mặc định
              } else {
                element.style.backgroundColor = '#ffc107'; // Màu vàng
                element.style.color = ''; // Màu chữ mặc định
              }
            }
            // Giữ logic cũ cho IsCancel nếu cần
            else if (data.IsCancel === true) {
              element.style.backgroundColor = '#ffcccc'; // đỏ nhạt
            } else {
              // Reset về mặc định cho các trường hợp khác
              element.style.backgroundColor = '';
              element.style.color = '';
            }
          },
          columns: [
            {
              //create column group
              cssClass: 'group-booking-info',
              title: 'Thông tin đặt xe',
              columns: [

                { title: 'Hình thức đặt', field: 'CategoryText', width: 120, formatter: 'textarea' },
                // {
                //   title: 'Họ tên',
                //   // field: 'FullName',
                //   field: 'BookerVehicles',
                //   width: 100,
                //   bottomCalc: 'count',
                //   formatter: 'textarea',
                // },
                // { title: 'Phòng ban', field: 'DepartmentName', width: 120, formatter: 'textarea', },
                {
                  title: 'Tên người đi',
                  field: 'PassengerName',
                  hozAlign: 'center',
                  width: 150,
                  formatter: 'textarea'
                },
                {
                  title: 'SDT Người đi',
                  field: 'PassengerPhoneNumber',
                  hozAlign: 'center',
                  width: 120,
                  formatter: 'textarea'
                },
                { title: 'Tên người giao', field: 'DeliverName', width: 150, formatter: 'textarea' },
                {
                  title: 'Điểm xuất phát',
                  field: 'DepartureAddress',
                  width: 100,
                  formatter: 'textarea',
                },
                {
                  title: 'Thời gian xuất phát',
                  field: 'DepartureDate',
                  hozAlign: 'center',
                  width: 120,
                  formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return '';
                    const date = new Date(value);

                    const dd = String(date.getDate()).padStart(2, '0');
                    const MM = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    const ss = String(date.getSeconds()).padStart(2, '0');

                    return `${dd}/${MM}/${yyyy} ${hh}:${mm}`;
                  },
                },
                {
                  title: 'Thời gian xuất phát thực tế',
                  field: 'DepartureDateActual',
                  hozAlign: 'center',
                  width: 120,
                  editor: this.createDateTimeEditor.bind(this),
                  formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return '';
                    const date = new Date(value);

                    const dd = String(date.getDate()).padStart(2, '0');
                    const MM = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    const ss = String(date.getSeconds()).padStart(2, '0');

                    return `${dd}/${MM}/${yyyy} ${hh}:${mm}`;
                  },
                },
                {
                  title: 'Ghi chú',
                  field: 'Note',
                  width: 150,
                  formatter: 'textarea',
                },
                {
                  title: 'Loại phương tiện',
                  field: 'VehicleTypeText',
                  width: 100,
                },
              ],
            },
            {
              //create column group
              cssClass: 'group-destination',
              title: 'Thông tin điểm đến',
              columns: [
                {
                  title: 'Tên công ty',
                  field: 'CompanyNameArrives',
                  width: 100,
                  formatter: 'textarea',
                },
                {
                  title: 'Địa chỉ cụ thể',
                  field: 'SpecificDestinationAddress',
                  width: 160, formatter: 'textarea',
                },
                { title: 'Tỉnh', field: 'ProvinceName', width: 100, formatter: 'textarea' },

                {
                  title: 'Thời gian cần đến',
                  field: 'TimeNeedPresent',
                  width: 160,
                  formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return '';
                    const date = new Date(value);

                    const dd = String(date.getDate()).padStart(2, '0');
                    const MM = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    const ss = String(date.getSeconds()).padStart(2, '0');

                    return `${dd}/${MM}/${yyyy} ${hh}:${mm}`;
                  },
                },
                {
                  title: 'Thời gian về',
                  field: 'TimeReturn',
                  width: 150,
                  formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return '';
                    const date = new Date(value);

                    const dd = String(date.getDate()).padStart(2, '0');
                    const MM = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    const ss = String(date.getSeconds()).padStart(2, '0');

                    return `${dd}/${MM}/${yyyy} ${hh}:${mm}`;
                  },
                },
              ],
            },
            {
              //create column group
              cssClass: 'group-passenger',
              title: 'Thông tin người đặt',
              columns: [
                // {
                //   title: 'Tên người đi',
                //   field: 'PassengerName',
                //   hozAlign: 'center',
                //   width: 150,
                // },

                {
                  title: 'Họ tên',
                  // field: 'FullName',
                  field: 'BookerVehicles',
                  width: 100,
                  bottomCalc: 'count',
                  formatter: 'textarea',
                },
                { title: 'Phòng ban', field: 'DepartmentName', width: 120, formatter: 'textarea', },
              ],
            },
            {
              //create column group
              cssClass: 'group-delivery',
              title: 'Thông tin hàng giao',
              columns: [
                // { title: 'Tên người giao', field: 'DeliverName', width: 150 },
                {
                  title: 'SDT người giao',
                  field: 'DeliverPhoneNumber',
                  width: 120,
                },
                { title: 'Tên người nhận', field: 'ReceiverName', width: 120, formatter: 'textarea' },
                {
                  title: 'SDT người nhận',
                  field: 'ReceiverPhoneNumber',
                  width: 120,
                },
                { title: 'Tên kiện hàng', field: 'PackageName', width: 80, formatter: 'textarea' },
                { title: 'Kích thước(cm)', field: 'PackageSize', width: 120 },
                { title: 'Cân nặng(kg)', field: 'PackageWeight', width: 120 },
                {
                  title: 'Số lượng kiện hàng',
                  field: 'PackageQuantity',
                  width: 160,
                },
                {
                  title: 'Tiền xe',
                  field: 'VehicleMoney',
                  width: 200,
                  formatter: (cell: any) => {
                    const value = cell.getValue();
                    if (!value && value !== 0) return '';
                    return `${Number(value).toLocaleString('vi-VN')}đ`;
                  },
                },
                { title: 'Dự án', field: 'ProjectFullName', width: 300, formatter: 'textarea' },
                { title: 'Dự án', field: 'ProjectID', width: 300, formatter: 'textarea', visible: false },

              ],
            },
            { title: 'Tên TBP duyệt', field: 'FullNameTBP', width: 120, formatter: 'textarea' },
            { title: 'TBP duyệt', field: 'ApprovedTBPText', width: 100, formatter: 'textarea' },

            {
              title: 'Lý do phát sinh',
              field: 'ProblemArises',
              width: 120,
              formatter: 'textarea',
            },
          ],

        }
      );

      this.vehicleBookingManagementTable.on(
        'rowDblClick',
        (e: any, row: any) => {
          this.selected = row.getData();
        }
      );

      this.vehicleBookingManagementTable.on(
        'rowSelectionChanged',
        (data: any[]) => {
          this.vehicleBookingListId = data; // Cập nhật danh sách ID được chọn
          console.log('vehicleBookingListId', this.vehicleBookingListId);
        }
      );
    }
  }

  private drawTable(): void {
    if (!this.vehicleBookingManagementTable) {
      // If table is not initialized, initialize it first
      this.initTable();
    }

    if (this.vehicleBookingManagementTable) {
      this.vehicleBookingManagementTable.setData(
        this.vehicleBookingManagementList
      );
    }
  }

  //#endregion

  validatechecked(): boolean {
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning(
        'Lỗi',
        'Vui lòng chọn ít nhất một dòng để xếp xe!'
      );
      return false;
    }

    return true;
  }

  // Format date theo local time để tránh lệch timezone
  private formatLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  // Custom editor cho cột "Thời gian xuất phát thực tế" sử dụng nz-date-picker
  createDateTimeEditor(cell: CellComponent, onRendered: any, success: any, cancel: any) {
    const row = cell.getRow();
    const rowData = row.getData();
    const originalValue = cell.getValue();
    const rowId = rowData['ID'];

    // Kiểm tra xem có nhiều dòng được chọn không
    const selectedRows = this.vehicleBookingManagementTable?.getSelectedRows() || [];
    const isBatchUpdate = selectedRows.length > 1 && selectedRows.some((r: any) => r.getData().ID === rowId);

    // Tạo container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '5px';
    container.style.width = '100%';
    container.style.position = 'relative';

    // Tạo component DateTimePickerEditorComponent
    const componentRef = createComponent(DateTimePickerEditorComponent, {
      environmentInjector: this.injector,
    });

    // Set giá trị ban đầu
    if (originalValue) {
      componentRef.instance.value = originalValue instanceof Date ? originalValue : new Date(originalValue);
    }

    // Lưu thông tin editing
    this.editingCell = { cell, originalValue, rowId };

    let currentValue: Date | null = null;
    let isClosing = false;

    // Xử lý khi giá trị thay đổi
    componentRef.instance.valueChange.subscribe((date: Date | null) => {
      currentValue = date;
    });

    // Xử lý khi đóng picker
    componentRef.instance.closeEditor.subscribe(() => {
      if (isClosing) return;
      isClosing = true;

      setTimeout(() => {
        if (this.editingCell && this.editingCell.cell === cell) {
          // Set giây về 0 trước khi lưu
          let dateToSave: Date | null = null;
          if (currentValue) {
            dateToSave = new Date(currentValue);
            dateToSave.setSeconds(0, 0); // Set giây và milliseconds về 0
          }

          if (isBatchUpdate && dateToSave) {
            const selectedData = selectedRows.map((r: any) => r.getData());
            let updatedCount = 0;

            // Format date theo local time
            const dateToSaveStr = this.formatLocalDateTime(dateToSave);

            selectedData.forEach((item: any) => {
              const itemId = item.ID;
              if (itemId) {
                const itemOriginalValue = item.DepartureDateActual || null;
                let itemOriginalValueStr: string | null = null;

                if (itemOriginalValue) {
                  const itemOriginalDate = itemOriginalValue instanceof Date ? new Date(itemOriginalValue) : new Date(itemOriginalValue);
                  itemOriginalDate.setSeconds(0, 0);
                  itemOriginalValueStr = this.formatLocalDateTime(itemOriginalDate);
                }

                if (dateToSaveStr !== itemOriginalValueStr) {
                  this.addPendingChange(itemId, dateToSave, itemOriginalValue);
                  const itemRow = selectedRows.find((r: any) => r.getData().ID === itemId);
                  if (itemRow) {
                    itemRow.update({ DepartureDateActual: dateToSaveStr });
                    updatedCount++;
                  }
                }
              }
            });

            this.hasPendingChanges = this.pendingChanges.size > 0;
            this.cdRef.detectChanges();

            success(dateToSaveStr);
          } else {
            // Cập nhật cho một dòng như cũ
            if (dateToSave) {
              // Format date theo local time
              const newValueStr = this.formatLocalDateTime(dateToSave);

              // Xử lý originalValue để so sánh (cũng set giây về 0)
              let originalValueStr: string | null = null;
              if (originalValue) {
                const originalDate = originalValue instanceof Date ? new Date(originalValue) : new Date(originalValue);
                originalDate.setSeconds(0, 0);
                originalValueStr = this.formatLocalDateTime(originalDate);
              }

              const hasChanged = newValueStr !== originalValueStr;

              if (hasChanged) {
                // Thêm vào pending changes
                this.addPendingChange(rowId, dateToSave, originalValue);
                success(newValueStr);
              } else {
                cancel();
              }
            } else {
              cancel();
            }
          }

          this.editingCell = null;
          componentRef.destroy();
        }
      }, 100);
    });

    // Attach component vào DOM
    const hostElement = (componentRef.hostView as any).rootNodes[0];
    if (hostElement) {
      hostElement.style.flex = '1';
      container.appendChild(hostElement);
    }
    this.appRef.attachView(componentRef.hostView);

    // Xử lý khi nhấn ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isClosing = true;
        cancel();
        this.editingCell = null;
        componentRef.destroy();
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
    container.addEventListener('keydown', handleKeyDown);

    onRendered(() => {
      // Focus vào date picker
      setTimeout(() => {
        const pickerInput = container.querySelector('input');
        if (pickerInput) {
          pickerInput.focus();
          pickerInput.click(); // Mở picker
        }
      }, 100);
    });

    return container;
  }

  // Thêm thay đổi vào danh sách pending
  addPendingChange(id: number, departureDateActual: Date, originalValue: any) {
    // Format theo local time để so sánh
    const newValueStr = this.formatLocalDateTime(departureDateActual);
    let originalValueStr: string | null = null;

    if (originalValue) {
      const originalDate = originalValue instanceof Date ? new Date(originalValue) : new Date(originalValue);
      originalDate.setSeconds(0, 0);
      originalValueStr = this.formatLocalDateTime(originalDate);
    }

    // Chỉ thêm nếu có thay đổi
    if (newValueStr !== originalValueStr) {
      this.pendingChanges.set(id, { id, departureDateActual });
      this.hasPendingChanges = this.pendingChanges.size > 0;
      this.cdRef.detectChanges();
    }
  }

  // Lưu thay đổi của một dòng cụ thể
  saveSingleChange(id: number, departureDateActual: Date) {
    this.vehicleBookingManagementService.postVehicleBookingManagement({
      ID: id,
      DepartureDateActual: this.formatLocalDateTime(departureDateActual)
    }).subscribe({
      next: () => {
        // Xóa khỏi pending changes
        this.pendingChanges.delete(id);
        this.hasPendingChanges = this.pendingChanges.size > 0;
        this.cdRef.detectChanges();

        this.notification.success('Thông báo', 'Lưu thời gian xuất phát thực tế thành công!');

        // Reload data sau khi lưu
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      error: (error) => {
        console.error('Lỗi khi lưu:', error);
        this.notification.error('Thông báo', 'Lỗi khi lưu thời gian xuất phát thực tế!');
      }
    });
  }

  // Mở modal cập nhật tiền xe
  openUpdateVehicleMoneyModal(rowData: any) {
    const modalRef = this.modalService.open(UpdateVehicleMoneyFormComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.vehicleMoney = rowData['VehicleMoney'] || null;

    // Xử lý khi lưu
    modalRef.componentInstance.save.subscribe((vehicleMoney: number) => {
      const request = {
        ID: rowData['ID'],
        VehicleMoney: vehicleMoney
      };

      this.vehicleBookingManagementService.postVehicleBookingManagement(request).subscribe({
        next: () => {
          this.notification.success('Thông báo', 'Cập nhật tiền xe thành công!');
          modalRef.close();
          // Reload data sau khi lưu
          setTimeout(() => this.getVehicleBookingManagement(), 100);
        },
        error: (error) => {
          console.error('Lỗi khi lưu:', error);
          this.notification.error('Thông báo', 'Lỗi khi cập nhật tiền xe!');
        }
      });
    });

    // Xử lý khi đóng modal
    modalRef.result.then(
      () => {
        // Modal closed
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // Lưu tất cả thay đổi
  saveAllChanges() {
    if (this.pendingChanges.size === 0) {
      return;
    }

    this.savingChanges = true;
    const changes = Array.from(this.pendingChanges.values());
    const requests = changes.map(change =>
      this.vehicleBookingManagementService.postVehicleBookingManagement({
        ID: change.id,
        DepartureDateActual: this.formatLocalDateTime(change.departureDateActual)
      }).pipe(
        catchError((error) => {
          console.error(`Lỗi khi lưu ID ${change.id}:`, error);
          return of({ success: false, id: change.id, error });
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        const successCount = responses.filter(r => r.success !== false).length;
        const failCount = responses.filter(r => r.success === false).length;

        if (successCount > 0) {
          this.notification.success(
            'Thông báo',
            `Lưu thành công ${successCount} thay đổi!`
          );
        }

        if (failCount > 0) {
          this.notification.error(
            'Thông báo',
            `Có ${failCount} thay đổi lưu thất bại!`
          );
        }

        // Xóa pending changes và reload data
        this.pendingChanges.clear();
        this.hasPendingChanges = false;
        this.savingChanges = false;
        this.cdRef.detectChanges();

        // Reload data sau khi lưu
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      error: (error) => {
        console.error('Lỗi khi lưu:', error);
        this.notification.error('Thông báo', 'Lỗi khi lưu thay đổi!');
        this.savingChanges = false;
        this.cdRef.detectChanges();
      }
    });
  }

  // Hàm lưu thời gian xuất phát thực tế (giữ lại để tương thích)
  saveDepartureDateActual(id: number, departureDateActual: Date) {
    const request = {
      ID: id,
      DepartureDateActual: this.formatLocalDateTime(departureDateActual)
    };

    this.vehicleBookingManagementService.postVehicleBookingManagement(request).subscribe({
      next: () => {
        this.notification.success('Thông báo', 'Lưu thời gian xuất phát thực tế thành công!');
        // Reload data sau khi lưu
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      error: (error) => {
        console.error('Lỗi khi lưu:', error);
        this.notification.error('Thông báo', 'Lỗi khi lưu thời gian xuất phát thực tế!');
      }
    });
  }

  // Nút Sửa - Mở modal edit với dòng được chọn
  onEdit() {
    // Kiểm tra có dòng được chọn không
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để sửa!');
      return;
    }

    // Chỉ cho phép sửa 1 dòng
    if (this.vehicleBookingListId.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ được chọn một dòng để sửa!');
      return;
    }

    const selectedItem = this.vehicleBookingListId[0];
    const currentEmployeeID = this.currentUser?.EmployeeID || 0;

    // Kiểm tra quyền sửa: phải là người đặt hoặc người đi (giống MVC)
    if (selectedItem.EmployeeID !== currentEmployeeID &&
      selectedItem.PassengerEmployeeID !== currentEmployeeID) {
      this.notification.warning('Thông báo', 'Bạn không có quyền sửa đơn đăng ký này!');
      return;
    }

    // Kiểm tra trạng thái: chỉ cho phép sửa khi Status == 1 (Chưa xếp) và chưa được TBP duyệt
    if (selectedItem.Status !== 1) {
      this.notification.warning('Thông báo', 'Chỉ có thể sửa đơn đăng ký có trạng thái "Chưa xếp"!');
      return;
    }

    if (selectedItem.IsApprovedTBP) {
      this.notification.warning('Thông báo', 'Không thể sửa đơn đăng ký đã được TBP duyệt!');
      return;
    }

    // Mở modal edit
    const modalRef = this.modalService.open(VehicleBookingManagementDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedItem;
    modalRef.componentInstance.isEdit = true;
    modalRef.result.then(
      (result) => {
        if (result) {
          setTimeout(() => this.getVehicleBookingManagement(), 100);
        }
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onCopy() {
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để copy!');
      return;
    }

    if (this.vehicleBookingListId.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ được chọn một dòng để copy!');
      return;
    }

    const selectedItem = this.vehicleBookingListId[0];

    // Tạo bản copy của selectedItem và reset ID về 0 để tạo mới
    const copiedItem = { ...selectedItem, ID: 0 };

    const modalRef = this.modalService.open(VehicleBookingManagementDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = copiedItem;
    modalRef.componentInstance.isEdit = false;
    modalRef.result.then(
      (result) => {
        if (result) {
          setTimeout(() => this.getVehicleBookingManagement(), 100);
        }
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  // Nút Đăng ký hủy - Hủy booking
  onCancelBooking() {
    // Kiểm tra có dòng được chọn không
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một dòng để hủy!');
      return;
    }

    const currentEmployeeID = this.currentUser?.EmployeeID || 0;

    // Lọc các item hợp lệ để hủy
    const validItems: any[] = [];
    const errors: string[] = [];

    this.vehicleBookingListId.forEach((item) => {
      // Kiểm tra quyền hủy: phải là người đặt hoặc người đi (giống MVC)
      if (item.EmployeeID !== currentEmployeeID &&
        item.PassengerEmployeeID !== currentEmployeeID) {
        errors.push(`Bạn không có quyền hủy đơn của ${item.FullName || 'nhân viên khác'}.`);
        return;
      }

      // Kiểm tra trạng thái: chỉ cho phép hủy khi Status == 1 (Chưa xếp) và chưa được TBP duyệt
      if (item.Status !== 1) {
        errors.push(`Đơn của ${item.FullName || 'nhân viên'} không ở trạng thái "Chưa xếp".`);
        return;
      }

      if (item.IsApprovedTBP) {
        errors.push(`Đơn của ${item.FullName || 'nhân viên'} đã được TBP duyệt, không thể hủy.`);
        return;
      }

      validItems.push(item);
    });

    if (errors.length > 0) {
      const errorMsg = errors.slice(0, 3).join('<br>') +
        (errors.length > 3 ? `<br>...và ${errors.length - 3} lỗi khác.` : '');
      this.notification.warning('Không thể hủy một số đơn', errorMsg, { nzDuration: 5000 });
    }

    if (validItems.length === 0) {
      return;
    }

    // Hiển thị confirm dialog
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy đăng ký',
      nzContent: `Bạn có chắc muốn hủy ${validItems.length} đơn đăng ký xe đã chọn?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Gọi API hủy cho từng item
        const requests = validItems.map((item) =>
          this.vehicleBookingManagementService.cancelBooking(item.ID).pipe(
            catchError((error) => {
              console.error(`Lỗi khi hủy đơn ${item.ID}:`, error);
              return of({ success: false, error, item });
            })
          )
        );

        forkJoin(requests).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter((r) => r.success !== false).length;
            const failCount = responses.filter((r) => r.success === false).length;

            if (successCount > 0) {
              this.notification.success(
                'Thông báo',
                `Hủy thành công ${successCount} đơn đăng ký.`
              );
            }

            if (failCount > 0) {
              this.notification.error(
                'Thông báo',
                `Có ${failCount} đơn đăng ký hủy thất bại.`
              );
            }

            // Reload data sau khi xử lý
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          },
          error: (error) => {
            console.error('Lỗi khi hủy:', error);
            this.notification.error('Thông báo', 'Lỗi khi hủy đăng ký!');
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          },
        });
      },
    });
  }
  initModal(paymentOrder: any = new PaymentOrder(), isCopy: boolean = false, initialContentPayment: string = '') {
    const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      fullscreen: true,
    });
    modalRef.componentInstance.paymentOrder = paymentOrder;
    modalRef.componentInstance.isCopy = isCopy;
    modalRef.componentInstance.initialContentPayment = initialContentPayment;
  }
  openPaymentOrderFromRow() {
    if (this.vehicleBookingListId.length === 0 || this.vehicleBookingListId.length > 1) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 dòng để đề nghị thanh toán chuyến xe!');
      return;
    }
    const selectedItem = this.vehicleBookingListId[0];
    console.log('Selected row data:', selectedItem);
    if (!selectedItem.VehicleInformation || !selectedItem.VehicleInformation.includes('Chủ động phương tiện')) {
      this.notification.warning('Thông báo', 'Chỉ đề nghị thanh toán với những chuyến xe chủ động phương tiện!');
      return;
    }
    const paymentOrder = new PaymentOrder();
    paymentOrder.ID = 0;
    paymentOrder.TypeOrder = 2;
    paymentOrder.PaymentOrderTypeID = 22;
    paymentOrder.ReceiverInfo = selectedItem.FullName;
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };
    paymentOrder.ReasonOrder = "Đề nghị thanh toán tiền phương tiện ngày " + formatDate(selectedItem.DepartureDate);
    paymentOrder.StartLocation = selectedItem.DepartureAddress;
    paymentOrder.EndLocation = selectedItem.CompanyNameArrives + " - " + selectedItem.SpecificDestinationAddress;
    paymentOrder.ProjectID = selectedItem.ProjectID;
    paymentOrder.ApprovedTBPID = selectedItem.ApprovedTBP;
    paymentOrder.EmployeeID = selectedItem.EmployeeID || null;
    paymentOrder.FullName = selectedItem.FullName || '';
    paymentOrder.DepartmentName = selectedItem.DepartmentName || '';
    paymentOrder.Note = selectedItem.Note || '';
    paymentOrder.ProjectID = selectedItem.ProjectID || null;
    paymentOrder.ProjectFullName = selectedItem.ProjectFullName || '';
    const contentPayment = "Đề nghị thanh toán tiền phương tiện ngày " + formatDate(selectedItem.DepartureDate);
    this.initModal(paymentOrder, false, contentPayment);
  }
}

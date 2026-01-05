import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FoodOrderService } from './food-order-service/food-order.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { SummaryFoodOrderComponent } from './summary-food-order/summary-food-order.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectService } from '../../project/project-service/project.service';
import { AuthService } from '../../../auth/auth.service';

import { PermissionService } from '../../../services/permission.service';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-food-order',
  templateUrl: './food-order.component.html',
  styleUrls: ['./food-order.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
    NzSplitterModule,
    NzRadioModule,
    SummaryFoodOrderComponent,
    NgIf,
    NzSpinModule,
    HasPermissionDirective,
    Menubar
  ],
})
export class FoodOrderComponent implements OnInit, AfterViewInit {
  private foodOrderHNTabulator!: Tabulator;
  private foodOrderĐPTabulator!: Tabulator;
  foodOrderList: any[] = [];
  foodOrderHNList: any[] = [];
  foodOrderĐPList: any[] = [];
  employeeList: any[] = [];
  searchForm!: FormGroup;
  foodOrderForm!: FormGroup;
  sizeSearch: string = '0';
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  // Menu bars
  menuBars: any[] = [];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  selectedFoodOrderHN: any = null;
  selectedFoodOrderĐP: any = null;

  isLoading = false;

  @ViewChild('tb_foodOrder_HN', { static: false })
  tb_foodOrderHN!: ElementRef;

  @ViewChild('tb_foodOrder_ĐP', { static: false })
  tb_foodOrderĐP!: ElementRef;

  userPermissions = ['N2', 'N23', 'N34', 'N1', 'N80'];

  hasPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.userPermissions.includes(p));
  }
  canOrderAfter10AM(): boolean {
    const specialPermissions = ['N2', 'N23', 'N34', 'N1', 'N80'];
    return this.hasPermission(specialPermissions);
  }

  // Kiểm tra xem có thể chọn Xưởng Đan Phượng không (phải trước 19h)
  canSelectDanPhuong(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < 19;
  }
  // những n có quền
  hasAdminPermission(): boolean {
    // Kiểm tra IsAdmin trước
    if (this.currentUser?.IsAdmin === true) {
      return true;
    }
    // Kiểm tra quyền N1, N2, N23, N34, N80
    return this.permissionService.hasPermission('N1') ||
      this.permissionService.hasPermission('N2') ||
      this.permissionService.hasPermission('N23') ||
      this.permissionService.hasPermission('N34') ||
      this.permissionService.hasPermission('N80');
  }

  private isSameLocalDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private getLocalDayMillis(value: any): number | null {
    if (!value) return null;
    let dt: DateTime;
    if (value instanceof Date) {
      dt = DateTime.fromJSDate(value);
    } else if (typeof value === 'string') {
      dt = DateTime.fromISO(value, { setZone: true });
    } else {
      dt = DateTime.fromJSDate(new Date(value));
    }
    if (!dt.isValid) return null;
    return dt.toLocal().startOf('day').toMillis();
  }

  currentUser: any;
  currenEmployee: any;
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private foodOrderService: FoodOrderService,
    private employeeService: EmployeeService,
    private projectService: ProjectService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {
    this.initSearchForm();
    this.initForm();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ngOnInit() {
    this.initMenuBar();
    this.loadFoodOrder();
    this.loadEmployees();
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      this.currenEmployee = Array.isArray(this.currentUser)
        ? this.currentUser[0]
        : this.currentUser;
    });

    // Setup listener cho Location để tự động cập nhật DateOrder
    this.setupLocationChangeListener();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.openAddModal()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.openEditModal()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteFoodOrder()
      },
      {
        label: 'Duyệt',
        icon: 'fa-solid fa-circle-check fa-lg text-success',
        visible: this.permissionService.hasPermission("N2,N23,N34,N1,N80"),
        command: () => this.approved(true)
      },
      {
        label: 'Hủy duyệt',
        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
        visible: this.permissionService.hasPermission("N2,N23,N34,N1,N80"),
        command: () => this.approved(false)
      },
      {
        label: 'Báo cáo ăn ca',
        icon: 'fa-solid fa-chart-column fa-lg text-primary',
        visible: this.permissionService.hasPermission("N34,N1,N2,N80"),
        command: () => this.openSummaryFoodOrderModal()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel()
      }
    ];
  }

  private initForm() {
    const canEditEmployee = this.permissionService.hasPermission('N80,N1,N34');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.foodOrderForm = this.fb.group({
      ID: [0],
      EmployeeID: [{ value: this.currenEmployee?.EmployeeID, disabled: true }, [Validators.required]],
      DateOrder: [{ value: today, disabled: true }, [Validators.required]],
      Quantity: [1, [Validators.required, Validators.min(1)]],
      IsApproved: [false],
      Location: ['1', [Validators.required]],
      Note: [''],
      FullName: [''],
      IsDeleted: [false],
    });


    if (canEditEmployee) {
      this.foodOrderForm.get('EmployeeID')?.enable();
      this.foodOrderForm.get('DateOrder')?.enable();
    }
  }

  private setupLocationChangeListener(): void {
    this.foodOrderForm.get('Location')?.valueChanges.subscribe((location: string) => {
      // Chỉ tự động cập nhật khi không phải edit mode (ID = 0) và user không có quyền admin
      const currentID = this.foodOrderForm.get('ID')?.value;
      const hasAdminPermission = this.hasAdminPermission();

      if ((currentID === 0 || currentID === null || currentID === undefined) && !hasAdminPermission) {
        if (location === '2') {
          // Xưởng Đan Phượng: set ngày mai
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          this.foodOrderForm.patchValue({
            DateOrder: tomorrow
          }, { emitEvent: false });
        } else if (location === '1') {
          // VP Hà Nội: set ngày hôm nay
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          this.foodOrderForm.patchValue({
            DateOrder: today
          }, { emitEvent: false });
        }
      }
    });
  }

  private initSearchForm() {
    // Kiểm tra quyền N1, N2, N34 hoặc IsAdmin
    const hasAdminPermission = this.hasAdminPermission();

    let dateStart: Date;
    let dateEnd: Date;

    if (hasAdminPermission) {
      // Người có quyền N1/N2: set về hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateStart = today;
      dateEnd = today;
    } else {
      // Người không có quyền: set từ đầu tháng đến cuối tháng
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      dateStart = firstDay;

      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDay.setHours(0, 0, 0, 0);
      dateEnd = lastDay;
    }

    this.searchForm = this.fb.group({
      dateStart: dateStart,
      dateEnd: dateEnd,
      employeeId: 0,
      pageNumber: 1,
      pageSize: 100000,
      keyWord: '',
    });
  }

  ngAfterViewInit(): void {
    this.foodOrderHNTable(this.tb_foodOrderHN.nativeElement);
    this.foodOrderĐPTable(this.tb_foodOrderĐP.nativeElement);
  }

  loadFoodOrder() {
    this.isLoading = true;
    if (this.searchForm.value.employeeId == null) {
      this.searchForm.patchValue({
        employeeId: 0,
      });
    }

    // Kiểm tra quyền N1, N2, N34 hoặc IsAdmin
    const hasAdminPermission = this.hasAdminPermission();

    const formValue = this.searchForm.value;
    let dateStart = null;
    let dateEnd = null;

    // Nếu có quyền N1/N2: lấy dữ liệu trong ngày hôm nay
    // Nếu không có quyền: lấy từ đầu tháng đến cuối tháng
    if (hasAdminPermission) {
      // Người có quyền N1/N2: lấy dữ liệu hôm nay
      dateStart = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || '';
      dateEnd = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || '';
    } else {
      // Người không có quyền: lấy từ đầu tháng đến cuối tháng
      const now = DateTime.local();
      const firstDay = now.startOf('month');
      dateStart = firstDay.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || '';

      const lastDay = now.endOf('month');
      dateEnd = lastDay.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || '';
    }

    // Nếu user đã chọn dateStart/dateEnd trong form, ưu tiên dùng giá trị đó
    if (formValue.dateStart) {
      let startDate: DateTime;
      if (formValue.dateStart instanceof Date) {
        startDate = DateTime.fromJSDate(formValue.dateStart).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else if (typeof formValue.dateStart === 'string') {
        const parsed = DateTime.fromISO(formValue.dateStart);
        startDate = parsed.isValid
          ? parsed.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          : DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else {
        startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      }
      dateStart = startDate.isValid ? startDate.toISO() || '' : '';
    }

    if (formValue.dateEnd) {
      let endDate: DateTime;
      if (formValue.dateEnd instanceof Date) {
        endDate = DateTime.fromJSDate(formValue.dateEnd).set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      } else if (typeof formValue.dateEnd === 'string') {
        const parsed = DateTime.fromISO(formValue.dateEnd);
        endDate = parsed.isValid
          ? parsed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
          : DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      } else {
        endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      }
      dateEnd = endDate.isValid ? endDate.toISO() || '' : '';
    }

    const request = {
      ...formValue,
      dateStart: dateStart,
      dateEnd: dateEnd
    };

    this.foodOrderService
      .getEmployeeFoodOrder(request)
      .subscribe({
        next: (data) => {
          this.foodOrderList = Array.isArray(data.data)
            ? data.data
            : [data.data];
          this.foodOrderHNList = this.foodOrderList.filter(
            (fo) => fo.Location === 1 || fo.Location === null
          );
          this.foodOrderĐPList = this.foodOrderList.filter(
            (fo) => fo.Location === 2
          );
          this.foodOrderHNTable(this.tb_foodOrderHN.nativeElement);
          this.foodOrderĐPTable(this.tb_foodOrderĐP.nativeElement);
          this.isLoading = false;
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
          this.notification.error(
            NOTIFICATION_TITLE.error,
            errorMessage
          );
          this.isLoading = false;
        },
      });
  }

  loadEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + errorMessage
        );
      },
    });
  }

  private foodOrderHNTable(container: HTMLElement): void {
    this.foodOrderHNTabulator = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      height: '82vh',
      data: this.foodOrderHNList,
      layout: 'fitDataStretch',
      selectableRows: true,

      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          bottomCalc: 'count',
        },
        {
          title: 'Họ và tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          headerSort: false,
          width: 200,
        },
        {
          title: 'Ngày',
          field: 'DateOrder',
          hozAlign: 'center',
          minWidth: 200,
          headerSort: false,
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
      ],

    });
  }

  private foodOrderĐPTable(container: HTMLElement): void {
    this.foodOrderĐPTabulator = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.foodOrderĐPList,
      layout: 'fitDataStretch',
      selectableRows: true,
      paginationMode: 'local',

      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          bottomCalc: 'count',
        },
        {
          title: 'Họ và tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          headerSort: false,
          width: 200,
        },
        {
          title: 'Ngày',
          field: 'DateOrder',
          hozAlign: 'center',
          minWidth: 200,
          headerSort: false,
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
      ],

    });
  }

  openAddModal() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultLocation = this.currentUser?.EmployeeID === 586 ? '2' : '1';

    this.foodOrderForm.reset({
      ID: 0,
      EmployeeID: this.currenEmployee?.EmployeeID,
      DateOrder: today,
      Quantity: 1,
      IsApproved: false,
      Location: defaultLocation,
      Note: '',
      FullName: '',
      IsDeleted: false,
    });


    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addFoodOrderModal')
    );
    modal.show();
  }

  openEditModal() {
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();

    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn đơn đặt cần sửa'
      );
      return;
    }

    // Kiểm tra trạng thái duyệt
    if (
      (selectedRowsHN.length > 0 &&
        selectedRowsHN[0].getData()['IsApproved'] === true) ||
      (selectedRowsĐP.length > 0 &&
        selectedRowsĐP[0].getData()['IsApproved'] === true)
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Đơn đặt cơm đã được duyệt. Vui lòng hủy duyệt trước khi sửa!'
      );
      return;
    }

    // Kiểm tra thời gian: sau 10h không thể sửa đơn của ngày hôm nay và các ngày trước (trừ N1, N2)
    const selectedData = selectedRowsHN.length > 0
      ? selectedRowsHN[0].getData()
      : selectedRowsĐP[0].getData();

    const hasAdminPermission = this.hasAdminPermission();
    if (!hasAdminPermission && this.isAfter10AM() && this.isTodayOrPastDate(selectedData['DateOrder'])) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không thể sửa phiếu đặt cơm sau 10h'
      );
      return;
    }
    if (selectedRowsHN.length > 0) {
      this.selectedFoodOrderHN = selectedRowsHN[0].getData();
      const dateOrderHN = this.selectedFoodOrderHN?.DateOrder
        ? new Date(this.selectedFoodOrderHN.DateOrder)
        : new Date();
      this.foodOrderForm.patchValue({
        ID: this.selectedFoodOrderHN.ID,
        EmployeeID: this.selectedFoodOrderHN.EmployeeID,
        FullName: this.selectedFoodOrderHN.FullName,
        DateOrder: isNaN(dateOrderHN.getTime()) ? new Date() : dateOrderHN,
        Quantity: this.selectedFoodOrderHN.Quantity,
        IsApproved: this.selectedFoodOrderHN.IsApproved,
        Location: this.selectedFoodOrderHN.Location?.toString(),
        Note: this.selectedFoodOrderHN.Note,
        IsDeleted: this.selectedFoodOrderHN.IsDeleted,
      });
    }
    if (selectedRowsĐP.length > 0) {
      this.selectedFoodOrderĐP = selectedRowsĐP[0].getData();
      const dateOrderĐP = this.selectedFoodOrderĐP?.DateOrder
        ? new Date(this.selectedFoodOrderĐP.DateOrder)
        : new Date();
      this.foodOrderForm.patchValue({
        ID: this.selectedFoodOrderĐP.ID,
        EmployeeID: this.selectedFoodOrderĐP.EmployeeID,
        FullName: this.selectedFoodOrderĐP.FullName,
        DateOrder: isNaN(dateOrderĐP.getTime()) ? new Date() : dateOrderĐP,
        Quantity: this.selectedFoodOrderĐP.Quantity,
        IsApproved: this.selectedFoodOrderĐP.IsApproved,
        Location: this.selectedFoodOrderĐP.Location?.toString(),
        Note: this.selectedFoodOrderĐP.Note,
        IsDeleted: this.selectedFoodOrderĐP.IsDeleted,
      });
    }

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addFoodOrderModal')
    );
    modal.show();
  }

  onSubmit() {

    if (this.foodOrderForm.invalid) {
      Object.values(this.foodOrderForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    const formData = this.foodOrderForm.getRawValue();
    const hasPermission = this.hasAdminPermission();

    if (!hasPermission) {
      const now = new Date();
      const currentHour = now.getHours();
      const dateOrder = formData.DateOrder ? new Date(formData.DateOrder) : null;

      if (dateOrder) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const orderDate = new Date(dateOrder.getFullYear(), dateOrder.getMonth(), dateOrder.getDate());

        if (orderDate.getTime() === today.getTime()) {
          if (currentHour >= 10) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Chỉ có thể đặt cơm trước 10h sáng'
            );
            return;
          }
        }
      }
    }

    const location = parseInt(formData.Location);
    const dateOrder = formData.DateOrder ? new Date(formData.DateOrder) : null;

    // Kiểm tra thời gian 19h cho Xưởng Đan Phượng - chỉ áp dụng cho người không có quyền đặc biệt
    if (!hasPermission && location === 2 && dateOrder) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const orderDate = new Date(dateOrder.getFullYear(), dateOrder.getMonth(), dateOrder.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (orderDate.getTime() === tomorrow.getTime()) {
        const currentHour = now.getHours();
        if (currentHour >= 19) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Đăng ký cơm cho Xưởng Đan Phượng phải thực hiện trước 19h ngày hôm trước. Bạn không thể đăng ký cơm cho ngày mai sau 19h hôm nay.'
          );
          return;
        }
      }
    }

    // Format DateOrder: lấy ngày từ form nhưng giờ phút giây lấy thời gian hiện tại (thời điểm đăng ký)
    let dateOrderFormatted: string | Date = formData.DateOrder;
    if (formData.DateOrder) {
      const now = DateTime.local(); // Thời gian hiện tại
      let selectedDate: DateTime;

      if (formData.DateOrder instanceof Date) {
        selectedDate = DateTime.fromJSDate(formData.DateOrder);
      } else if (typeof formData.DateOrder === 'string') {
        const parsed = DateTime.fromISO(formData.DateOrder);
        selectedDate = parsed.isValid ? parsed : DateTime.local();
      } else {
        selectedDate = DateTime.local();
      }

      if (selectedDate.isValid) {
        // Lấy ngày từ form, nhưng giờ phút giây từ thời gian hiện tại
        dateOrderFormatted = selectedDate.set({
          hour: now.hour,
          minute: now.minute,
          second: now.second,
          millisecond: now.millisecond
        }).toISO() || '';
      } else {
        // Fallback: dùng thời gian hiện tại
        dateOrderFormatted = now.toISO() || '';
      }
    } else {
      // Nếu không có DateOrder, dùng thời gian hiện tại
      dateOrderFormatted = DateTime.local().toISO() || '';
    }

    const foodOrderData = {
      ID: formData.ID,
      EmployeeID: formData.EmployeeID,
      DateOrder: dateOrderFormatted,
      Quantity: formData.Quantity,
      IsApproved: formData.IsApproved,
      Location: parseInt(formData.Location),
      Note: formData.Note,
      IsDeleted: formData.IsDeleted,
    };

    this.foodOrderService.saveEmployeeFoodOrder(foodOrderData).subscribe({
      next: (response) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          formData.ID === 0
            ? 'Thêm đơn đặt cơm thành công'
            : 'Cập nhật đơn đặt cơm thành công'
        );

        this.closeModal();
        this.loadFoodOrder();
        this.foodOrderForm.reset({
          ID: 0,
          EmployeeID: null,
          DateOrder: new Date(),
          Quantity: 1,
          IsApproved: false,
          Location: '1',
          Note: '',
          FullName: '',
          IsDeleted: false,
        });
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi lưu đơn đặt cơm';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      },
    });
  }

  deleteFoodOrder() {
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();

    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn đơn đặt cần xóa'
      );
      return;
    }

    // Collect all selected food orders
    const foodOrdersToDelete: any[] = [];

    if (selectedRowsHN.length > 0) {
      selectedRowsHN.forEach((row) => {
        foodOrdersToDelete.push(row.getData());
      });
    }

    if (selectedRowsĐP.length > 0) {
      selectedRowsĐP.forEach((row) => {
        foodOrdersToDelete.push(row.getData());
      });
    }

    if (foodOrdersToDelete.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy đơn đặt cần xóa'
      );
      return;
    }
    // Sau 10h: không cho xóa phiếu đặt cơm của ngày hôm nay và các ngày trước đó (trừ N1, N2, N34, IsAdmin)
    const hasAdminPermission = this.hasAdminPermission();
    if (!hasAdminPermission && this.isAfter10AM()) {
      const hasTodayOrPastOrder = foodOrdersToDelete.some((fo) =>
        this.isTodayOrPastDate(fo['DateOrder'])
      );

      if (hasTodayOrPastOrder) {
        const fullNames = foodOrdersToDelete
          .filter(fo => this.isTodayOrPastDate(fo['DateOrder']))
          .map(fo => fo['FullName'] || 'N/A')
          .join(', ');
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Không thể xóa phiếu đặt cơm sau 10h:\n${fullNames}`
        );
        return;
      }
    }
    const approvedOrders = foodOrdersToDelete.filter(
      (fo) => fo.IsApproved === true
    );
    if (approvedOrders.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Có đơn đặt cơm đã được duyệt. Vui lòng hủy duyệt trước khi xóa!`
      );
      return;
    }

    const employeeNames = foodOrdersToDelete
      .map((fo) => fo.FullName)
      .join(', ');
    let completed = 0;
    const total = foodOrdersToDelete.length;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${foodOrdersToDelete.length} đơn đặt cơm của nhân viên: "${employeeNames}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const deletePromises = foodOrdersToDelete.map((foodOrder) => {
          const deleteData = {
            ...foodOrder,
            IsDeleted: true,
          };
          return this.foodOrderService
            .saveEmployeeFoodOrder(deleteData)
            .subscribe({
              next: (response) => {
                completed++;
                if (completed === total) {
                  this.notification.success(
                    NOTIFICATION_TITLE.success,
                    'Xóa đơn đặt cơm thành công'
                  );
                  this.loadFoodOrder();
                }
              },
              error: (error: any) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  'Xóa đơn đặt cơm thất bại: ' + errorMessage
                );
              },
            });
        });
      },
      nzCancelText: 'Hủy',
    });
  }

  approved(isApproved: boolean) {
    const approvedText = isApproved ? 'duyệt' : 'hủy duyệt';
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();
    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn đơn đặt cần ${approvedText}`
      );
      return;
    }

    // Gộp các dòng được chọn từ cả hai bảng
    const selectedRows = [
      ...selectedRowsHN.map((row) => row.getData()),
      ...selectedRowsĐP.map((row) => row.getData()),
    ];

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${approvedText} danh sách đặt cơm không?`,
      nzOnOk: () => {
        this.isLoading = true;

        // Cập nhật IsApproved cho tất cả các đơn đã chọn
        const foodOrdersToApprove = selectedRows.map((row) => ({
          ...row,
          IsApproved: isApproved
        }));

        // Gọi API save-approve với danh sách đơn đặt cơm
        this.foodOrderService.saveApprove(foodOrdersToApprove).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `${approvedText.charAt(0).toUpperCase() + approvedText.slice(1)} đơn đặt cơm thành công!`
            );
            this.loadFoodOrder();
          },
          error: (error: any) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
            this.notification.error(
              NOTIFICATION_TITLE.error,
              `${approvedText.charAt(0).toUpperCase() + approvedText.slice(1)} đơn đặt cơm thất bại: ${errorMessage}`
            );
          }
        });
      },
    });
  }

  closeModal() {
    const modal = document.getElementById('addFoodOrderModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.foodOrderForm.reset({
      ID: 0,
      EmployeeID: null,
      DateOrder: new Date(),
      Quantity: 1,
      IsApproved: false,
      Location: '1',
      Note: '',
      FullName: '',
      IsDeleted: false,
    });

  }

  async exportToExcel() {
    const exportDataHN = this.foodOrderHNList.map((foodOrder, idx) => {
      const safe = (val: any) =>
        val && typeof val === 'object' && Object.keys(val).length === 0
          ? ''
          : val;
      return {
        Duyệt: foodOrder.IsApproved ? 'Đã duyệt' : 'Chưa duyệt',
        'Mã nhân viên': safe(foodOrder.Code),
        'Họ và tên': safe(foodOrder.FullName),
        'Ngày đặt': safe(
          DateTime.fromISO(foodOrder.DateOrder).toFormat('dd/MM/yyyy')
        ),
        'Số lượng': safe(foodOrder.Quantity),
      };
    });

    const exportDataĐP = this.foodOrderĐPList.map((foodOrder, idx) => {
      const safe = (val: any) =>
        val && typeof val === 'object' && Object.keys(val).length === 0
          ? ''
          : val;
      return {
        Duyệt: foodOrder.IsApproved ? 'Đã duyệt' : 'Chưa duyệt',
        'Mã nhân viên': safe(foodOrder.Code),
        'Họ và tên': safe(foodOrder.FullName),
        'Ngày đặt': safe(
          DateTime.fromISO(foodOrder.DateOrder).toFormat('dd/MM/yyyy')
        ),
        'Số lượng': safe(foodOrder.Quantity),
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheetHN = workbook.addWorksheet('VP Hà Nội');
    const worksheetĐP = workbook.addWorksheet('Xưởng Đan Phượng');

    // Cấu hình cột cho sheet VP Hà Nội
    worksheetHN.columns = [
      { header: 'Duyệt', key: 'Duyệt', width: 20 },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 40 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 70 },
      { header: 'Ngày đặt', key: 'Ngày đặt', width: 50 },
      { header: 'Số lượng', key: 'Số lượng', width: 20 },
    ];

    // Cấu hình cột cho sheet Xưởng Đan Phượng
    worksheetĐP.columns = [
      { header: 'Duyệt', key: 'Duyệt', width: 20 },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 40 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 70 },
      { header: 'Ngày đặt', key: 'Ngày đặt', width: 50 },
      { header: 'Số lượng', key: 'Số lượng', width: 20 },
    ];

    // Thêm dữ liệu cho sheet VP Hà Nội
    exportDataHN.forEach((row) => worksheetHN.addRow(row));

    // Thêm dữ liệu cho sheet Xưởng Đan Phượng
    exportDataĐP.forEach((row) => worksheetĐP.addRow(row));

    // Định dạng header cho sheet VP Hà Nội
    worksheetHN.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
    });
    worksheetHN.getRow(1).height = 30;

    // Định dạng header cho sheet Xưởng Đan Phượng
    worksheetĐP.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
    });
    worksheetĐP.getRow(1).height = 30;

    // Định dạng các dòng dữ liệu cho sheet VP Hà Nội
    worksheetHN.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      row.height = 40;
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        if (colNumber !== 1) {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
        }
      });
    });

    // Định dạng các dòng dữ liệu cho sheet Xưởng Đan Phượng
    worksheetĐP.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      row.height = 40;
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        if (colNumber !== 1) {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
        }
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      blob,
      `DanhSachDatCom_${new Date()
        .toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
        .replace(/\//g, '')}.xlsx`
    );
  }

  resetSearch() {
    // Kiểm tra quyền N1, N2, N34 hoặc IsAdmin
    const hasAdminPermission = this.hasAdminPermission();

    let dateStart: Date;
    let dateEnd: Date;

    if (hasAdminPermission) {
      // Người có quyền N1/N2: set về hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateStart = today;

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      dateEnd = todayEnd;
    } else {
      // Người không có quyền: set từ đầu tháng đến cuối tháng
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      dateStart = firstDay;

      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDay.setHours(23, 59, 59, 999);
      dateEnd = lastDay;
    }

    this.searchForm.patchValue({
      dateStart: dateStart,
      dateEnd: dateEnd,
      employeeId: 0,
    });
    this.loadFoodOrder();
  }

  // Helper method để kiểm tra đã qua 10h chưa
  private isAfter10AM(): boolean {
    const now = new Date();
    return now.getHours() >= 10;
  }

  // Helper method để kiểm tra ngày đặt cơm là hôm nay hoặc ngày đã qua
  private isTodayOrPastDate(dateOrder: any): boolean {
    if (!dateOrder) return false;

    const orderDayMillis = this.getLocalDayMillis(dateOrder);
    if (orderDayMillis === null) return true; // Không parse được => chặn để an toàn

    const now = DateTime.local();
    const todayMillis = now.startOf('day').toMillis();

    return orderDayMillis <= todayMillis;
  }

  @ViewChild(SummaryFoodOrderComponent)
  summaryFoodOrderComponent!: SummaryFoodOrderComponent;
  openSummaryFoodOrderModal() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('summaryFoodOrderModal')
    );
    modal.show();
    this.summaryFoodOrderComponent.ngOnInit();
  }
}

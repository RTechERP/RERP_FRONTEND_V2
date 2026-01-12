import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeRegisterBussinessFormComponent } from './employee-register-bussiness-form/employee-register-bussiness-form.component';
import { VehicleSelectModalComponent } from './employee-register-bussiness-form/vehicle-select-modal/vehicle-select-modal.component';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-employee-register-bussiness',
  templateUrl: './employee-register-bussiness.component.html',
  styleUrls: ['./employee-register-bussiness.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzSpinModule,
    NgIf,
    NzGridModule,
    Menubar,
  ]
})
export class EmployeeRegisterBussinessComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_employee_register_bussiness', { static: false }) tbEmployeeRegisterBussinessRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  searchForm!: FormGroup;
  exportingExcel = false;
  sizeSearch: string = '0';
  isLoading = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  // Dropdown data for search
  typeList: any[] = [];
  vehicleList: any[] = [];
  vehicleBussinessList: any[] = []; // Danh sách phương tiện của chuyến công tác

  // Data
  employeeBussinessList: any[] = [];

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

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private bussinessService: EmployeeBussinessService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.initMenuBar();
    this.loadTypes();
    this.loadVehicles();
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => {
          this.openAddModal();
        }
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => {
          this.openEditModal();
        }
      },
      {
        label: 'Xem phương tiện',
        icon: 'fa-solid fa-eye fa-lg text-info',
        command: () => {
          this.openViewVehicleModal();
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.openDeleteModal();
        }
      },
      {
        label: 'Sao chép',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => {
          this.openCopyModal();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        }
      }
    ];
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    // Load dữ liệu sau khi table đã được khởi tạo
    setTimeout(() => {
      this.loadEmployeeBussinessPerson();
    }, 100);
  }

  private initializeForm(): void {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm = this.fb.group({
      startDate: [firstDay],
      endDate: [lastDay],
      status: [-1],
      type: [null],
      vehicleId: [null],
      notCheckIn: [null],
      keyWord: ['']
    });
  }


  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
  }

  loadTypes() {
    this.bussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại công tác: ' + error.message);
      }
    });
  }

  loadVehicles() {
    this.bussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (data: any) => {
        this.vehicleList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }

  resetSearch() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm.reset({
      startDate: firstDay,
      endDate: lastDay,
      status: -1,
      type: null,
      vehicleId: null,
      notCheckIn: null,
      keyWord: ''
    });
    this.loadEmployeeBussinessPerson();
  }

  loadEmployeeBussinessPerson() {
    if (!this.tabulator) {
      return;
    }

    this.isLoading = true;
    const formValue = this.searchForm.value;

    const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
    const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;

    // Xử lý NotCheckIn: nếu là null hoặc undefined thì gửi -1, còn lại gửi giá trị thực (0 hoặc 1)
    let notCheckInValue = -1;
    if (formValue.notCheckIn === 0) {
      notCheckInValue = 0;
    } else if (formValue.notCheckIn === 1) {
      notCheckInValue = 1;
    } else {
      notCheckInValue = -1; // null, undefined, hoặc giá trị khác
    }

    const request: any = {
      DateStart: startDate,
      DateEnd: endDate,
      Keyword: formValue.keyWord || "",
      EmployeeID: 0,
      IsApproved: formValue.status !== -1 ? formValue.status : -1,
      Type: formValue.type || null,
      VehicleID: formValue.vehicleId || null,
      NotCheckIn: notCheckInValue
    };

    this.bussinessService.getEmployeeBussinesssPerson(request).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data || [];
          this.employeeBussinessList = data;
          this.tabulator.setData(data);
        } else {
          this.employeeBussinessList = [];
          this.tabulator.setData([]);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.tabulator.setData([]);
        this.isLoading = false;
      }
    });
  }

  private initializeTable(): void {
    if (!this.tbEmployeeRegisterBussinessRef?.nativeElement) {
      return;
    }

    this.tabulator = new Tabulator(this.tbEmployeeRegisterBussinessRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      selectableRows: true,
      paginationMode: 'local',
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },
      data: [],
      columns: [
        {
          title: 'TBP duyệt', field: 'StatusTBPText', width: 120, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const row = cell.getRow().getData();
            const statusTBP = row.StatusTBP;
            return this.formatApprovalBadge(statusTBP);
          }
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', width: 120, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const row = cell.getRow().getData();
            const statusHR = row.StatusHR;
            return this.formatApprovalBadge(statusHR);
          }
        },
        {
          title: 'Bổ sung', field: 'IsProblem', width: 70, headerHozAlign: 'center', headerSort: false,
          formatter: 'tickCross', hozAlign: 'center'
        },
        {
          title: 'Họ tên', field: 'EmployeeName', width: 150, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea', bottomCalc: 'count'
        },
        {
          title: 'ID', field: 'ID', width: 150, visible: false, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea', bottomCalc: 'count'
        },
        {
          title: 'Trưởng phòng', field: 'ApprovedName', width: 150, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Nhân sự', field: 'ApprovedHR', width: 150, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Ngày', field: 'DayBussiness', width: 100, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            if (!value) return '<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;"></p>';
            try {
              const formatted = DateTime.fromISO(value).isValid
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : DateTime.fromJSDate(new Date(value)).toFormat('dd/MM/yyyy');
              return `<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;">${formatted}</p>`;
            } catch {
              return '<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;"></p>';
            }
          }
        },
        {
          title: 'Địa điểm', field: 'Location', width: 300, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Lý do', field: 'Reason', width: 300, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Loại', field: 'TypeName', width: 150, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Phí công tác', field: 'CostType', width: 100, hozAlign: 'right', headerHozAlign: 'center', headerSort: false,
          formatter: 'money', formatterParams: { precision: false },
          bottomCalc: 'sum', bottomCalcFormatter: 'money', bottomCalcFormatterParams: { precision: false }
        },
        {
          title: 'Phương tiện', field: 'CostVehicle', width: 100, hozAlign: 'right', headerHozAlign: 'center', headerSort: false,
          formatter: 'money', formatterParams: { precision: false },
          bottomCalc: 'sum', bottomCalcFormatter: 'money', bottomCalcFormatterParams: { precision: false }
        },
        {
          title: 'Ăn tối', field: 'Overnight', width: 70, headerHozAlign: 'center', headerSort: false,
          formatter: 'tickCross', hozAlign: 'center'
        },
        {
          title: 'Xuất phát trước 7h15', field: 'CostWorkEarly', width: 120, hozAlign: 'right', headerHozAlign: 'center', headerSort: false,
          formatter: 'money', formatterParams: { precision: false },
          bottomCalcFormatter: 'money', bottomCalcFormatterParams: { precision: false }
        },
        {
          title: 'Tổng chi phí', field: 'TotalMoney', width: 100, hozAlign: 'right', headerHozAlign: 'center', headerSort: false,
          formatter: 'money', formatterParams: { precision: false },
          bottomCalc: 'sum', bottomCalcFormatter: 'money', bottomCalcFormatterParams: { precision: false }
        },
        {
          title: 'Chấm công', field: 'NotChekInText', width: 100, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Ghi chú', field: 'Note', width: 200, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Ngày tạo', field: 'CreatedDate', width: 170, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            if (!value) return '<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;"></p>';
            try {
              const formatted = DateTime.fromISO(value).isValid
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm')
                : DateTime.fromJSDate(new Date(value)).toFormat('dd/MM/yyyy HH:mm');
              return `<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;">${formatted}</p>`;
            } catch {
              return '<p class="m-0" style="white-space:pre-wrap;line-height: normal;font-weight: unset;"></p>';
            }
          }
        },
      ],
    });

    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
    });

    // Set font-size 12px cho Tabulator
    setTimeout(() => {
      const tabulatorElement = this.tbEmployeeRegisterBussinessRef?.nativeElement;
      if (tabulatorElement) {
        tabulatorElement.style.fontSize = '12px';
        const allElements = tabulatorElement.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.style) {
            el.style.fontSize = '12px';
          }
        });

        const style = document.createElement('style');
        style.id = 'tabulator-employee-register-bussiness-font-size-override';
        style.textContent = `
          #tb_employee_register_bussiness,
          #tb_employee_register_bussiness.tabulator,
          #tb_employee_register_bussiness .tabulator,
          #tb_employee_register_bussiness .tabulator-table,
          #tb_employee_register_bussiness .tabulator-cell,
          #tb_employee_register_bussiness .tabulator-cell-content,
          #tb_employee_register_bussiness .tabulator-header,
          #tb_employee_register_bussiness .tabulator-col,
          #tb_employee_register_bussiness .tabulator-col-content,
          #tb_employee_register_bussiness .tabulator-col-title,
          #tb_employee_register_bussiness .tabulator-row,
          #tb_employee_register_bussiness .tabulator-row .tabulator-cell,
          #tb_employee_register_bussiness * {
            font-size: 12px !important;
          }
          #tb_employee_register_bussiness .badge {
            font-size: 9px !important;
          }
        `;
        const existingStyle = document.getElementById('tabulator-employee-register-bussiness-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);
  }

  openAddModal() {
    const modalRef = this.modalService.open(EmployeeRegisterBussinessFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadEmployeeBussinessPerson();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sửa');
      return;
    }

    const selectedData = selectedRows[0].getData();
    const statusTBP = selectedData['StatusTBP'];
    const statusHR = selectedData['StatusHR'];
    if (statusTBP === 1 || statusHR === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể chỉnh sửa');
      return;
    }

    const bussinessID = selectedData['ID'] || selectedData['Id'] || 0;
    if (!bussinessID || bussinessID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID bản ghi');
      return;
    }

    const modalRef = this.modalService.open(EmployeeRegisterBussinessFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.id = bussinessID;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadEmployeeBussinessPerson();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  openViewVehicleModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để xem phương tiện');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để xem phương tiện');
      return;
    }

    const selectedData = selectedRows[0].getData();
    const bussinessID = selectedData['ID'] || selectedData['Id'] || 0;

    if (!bussinessID || bussinessID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi chưa được lưu, không thể xem phương tiện');
      return;
    }

    // Load danh sách phương tiện
    this.isLoading = true;
    this.bussinessService.getEmployeeBussinessVehicle(bussinessID).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          const vehicles = Array.isArray(response.data) ? response.data : [response.data];

          // Chuyển đổi dữ liệu từ API sang format của VehicleItem
          // Format từ stored procedure: ID, EmployeeBussinesID, EmployeeVehicleBussinessID, VehicleName, VehicleID, Cost, BillImage, Note
          const vehicleItems = vehicles.map((v: any, index: number) => ({
            id: `vehicle_detail_${index + 2}`,
            vehicleId: v.EmployeeVehicleBussinessID || 0,
            vehicleName: v.VehicleName || '',
            cost: v.Cost || 0,
            note: v.Note || '',
            customName: (v.EmployeeVehicleBussinessID === 0 || v.EmployeeVehicleBussinessID === null) ? (v.VehicleName || '') : '', // Nếu là phương tiện khác, dùng VehicleName làm customName
            vehicleItemID: v.ID || 0 // ID của bản ghi EmployeeBussinessVehicle
          }));

          // Kiểm tra trạng thái duyệt
          const statusTBP = selectedData['StatusTBP'];
          const statusHR = selectedData['StatusHR'];
          const isApproved = statusTBP === 1 || statusHR === 1;

          // Mở modal
          const modalRef = this.modalService.open(VehicleSelectModalComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false
          });

          const componentInstance = modalRef.componentInstance;
          if (componentInstance) {
            componentInstance.vehicleList = this.vehicleList;
            componentInstance.selectedVehicles = vehicleItems;
            componentInstance.isViewMode = isApproved; // Chỉ cho phép edit nếu Chờ duyệt
            componentInstance.bussinessID = bussinessID; // Lưu ID để cập nhật
          }

          modalRef.result.then(
            (result: any) => {
              if (result && !isApproved) {
                const vehicles = result.vehicles || result; // Hỗ trợ cả format cũ và mới
                const deletedVehicles = result.deletedVehicles || [];
                this.updateVehiclesAndRecalculate(bussinessID, vehicles, deletedVehicles, selectedData);
              }
            },
            () => {
            }
          );
        } else {
          // Không có phương tiện, mở modal trống
          const modalRef = this.modalService.open(VehicleSelectModalComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false
          });

          const componentInstance = modalRef.componentInstance;
          if (componentInstance) {
            componentInstance.vehicleList = this.vehicleList;
            componentInstance.selectedVehicles = [];
            componentInstance.isViewMode = false;
            componentInstance.bussinessID = bussinessID;
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }

  // Cập nhật phương tiện và tính lại chi phí
  private updateVehiclesAndRecalculate(bussinessID: number, vehicles: any[], deletedVehicles: any[], selectedData: any): void {
    this.isLoading = true;

    const totalVehicleCost = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
    const costBussiness = selectedData['CostBussiness'] || selectedData['CostType'] || 0;
    const costWorkEarly = selectedData['CostWorkEarly'] || 0;
    const costOvernight = selectedData['CostOvernight'] || 0;
    const totalMoney = Number(costBussiness) + Number(totalVehicleCost) + Number(costWorkEarly) + Number(costOvernight);

    const updateData: any = {
      employeeBussiness: {
        ID: bussinessID,
        CostVehicle: totalVehicleCost,
        TotalMoney: totalMoney
      },
      employeeBussinessFiles: null,
      employeeBussinessVehicle: null
    };

    if (vehicles.length > 0) {
      const firstVehicle = vehicles[0];
      updateData.employeeBussinessVehicle = {
        ID: firstVehicle.vehicleItemID || 0,
        EmployeeBussinesID: bussinessID,
        EmployeeVehicleBussinessID: firstVehicle.vehicleId || 0,
        Cost: firstVehicle.cost || 0,
        BillImage: '',
        Note: firstVehicle.note || '',
        VehicleName: firstVehicle.vehicleName || firstVehicle.customName || ''
      };
    }

    this.bussinessService.saveDataEmployee(updateData).subscribe({
      next: () => {
        if (vehicles.length > 1) {
          this.saveRemainingVehiclesForView(bussinessID, vehicles.slice(1), deletedVehicles, totalMoney);
        } else {
          this.deleteVehicles(bussinessID, deletedVehicles);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi cập nhật phương tiện: ' + error.message);
      }
    });
  }

  // Lưu các phương tiện còn lại
  private saveRemainingVehiclesForView(bussinessID: number, remainingVehicles: any[], deletedVehicles: any[], totalMoney: number): void {
    let completedCount = 0;
    const totalVehicles = remainingVehicles.length;

    if (totalVehicles === 0) {
      this.deleteVehicles(bussinessID, deletedVehicles);
      return;
    }

    remainingVehicles.forEach((vehicle) => {
      const vehicleDto: any = {
        employeeBussiness: null,
        employeeBussinessFiles: null,
        employeeBussinessVehicle: {
          ID: vehicle.vehicleItemID || 0,
          EmployeeBussinesID: bussinessID,
          EmployeeVehicleBussinessID: vehicle.vehicleId || 0,
          Cost: vehicle.cost || 0,
          BillImage: '',
          Note: vehicle.note || '',
          VehicleName: vehicle.vehicleName || vehicle.customName || ''
        }
      };

      this.bussinessService.saveDataEmployee(vehicleDto).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === totalVehicles) {
            this.deleteVehicles(bussinessID, deletedVehicles);
          }
        },
        error: (error) => {
          completedCount++;
          if (completedCount === totalVehicles) {
            this.deleteVehicles(bussinessID, deletedVehicles);
          }
        }
      });
    });
  }

  // Xóa mềm các phương tiện đã bị xóa
  private deleteVehicles(bussinessID: number, deletedVehicles: any[]): void {
    if (!deletedVehicles || deletedVehicles.length === 0) {
      this.isLoading = false;
      this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật phương tiện thành công');
      this.loadEmployeeBussinessPerson();
      return;
    }

    let completedCount = 0;
    const totalDeleted = deletedVehicles.length;

    deletedVehicles.forEach((vehicle) => {
      const vehicleDto: any = {
        employeeBussiness: null,
        employeeBussinessFiles: null,
        employeeBussinessVehicle: {
          ID: vehicle.vehicleItemID || 0,
          EmployeeBussinesID: bussinessID,
          EmployeeVehicleBussinessID: vehicle.vehicleId || 0,
          Cost: vehicle.cost || 0,
          BillImage: '',
          Note: vehicle.note || '',
          VehicleName: vehicle.vehicleName || vehicle.customName || '',
          IsDeleted: true
        }
      };

      this.bussinessService.saveDataEmployee(vehicleDto).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === totalDeleted) {
            this.isLoading = false;
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật phương tiện thành công');
            this.loadEmployeeBussinessPerson();
          }
        },
        error: (error) => {
          completedCount++;
          if (completedCount === totalDeleted) {
            this.isLoading = false;
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật phương tiện thành công');
            this.loadEmployeeBussinessPerson();
          }
        }
      });
    });
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());

    // Kiểm tra các bản ghi đã duyệt
    const approvedRecords = selectedData.filter(item => item['StatusTBP'] === 1 || item['StatusHR'] === 1);
    if (approvedRecords.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Có ${approvedRecords.length} bản ghi đã được duyệt, không thể xóa`);
      return;
    }

    const ids = selectedData.map(item => item['ID']).filter(id => id > 0);

    if (ids.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} bản ghi đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteEmployeeBussiness(ids);
      },
      nzCancelText: 'Hủy'
    });
  }

  deleteEmployeeBussiness(ids: number[]) {
    this.isLoading = true;
    this.bussinessService.deletedEmployeeBussiness(ids).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa bản ghi thành công');
        this.loadEmployeeBussinessPerson();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Xóa bản ghi thất bại: ' + error.message);
        this.isLoading = false;
      }
    });
  }

  openCopyModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sao chép');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sao chép');
      return;
    }

    const selectedData = selectedRows[0].getData();

    // Cho phép sao chép cả bản ghi đã duyệt - sẽ reset trạng thái duyệt về Chờ duyệt

    const bussinessID = selectedData['ID'] || selectedData['Id'] || 0;
    if (!bussinessID || bussinessID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID bản ghi');
      return;
    }

    // Gọi API để lấy dữ liệu đầy đủ
    this.bussinessService.getEmployeeBussinessByID(bussinessID).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const result = response.data;

          // Tạo bản copy với ID = 0 và ngày mới
          const copyData = {
            ID: 0,
            EmployeeID: result.EmployeeID || result.EmployeeId || 0,
            DayBussiness: new Date(),
            ApprovedId: result.ApprovedID || result.ApprovedId || result.ApproverID || null,
            Location: result.Location || '',
            NotCheckIn: result.NotChekIn || result.NotCheckIn || 0,
            Type: result.TypeBusiness || result.Type || result.TypeID || null,
            CostBussiness: result.CostBussiness || result.CostType || 0,
            VehicleID: result.VehicleID || result.VehicleId || null,
            CostVehicle: result.CostVehicle || 0,
            WorkEarly: result.WorkEarly === true || result.WorkEarly === 1 || result.WorkEarly === 'true' || result.WorkEarly === '1' || result.WorkEarly === 'True',
            CostWorkEarly: result.CostWorkEarly || 0,
            Overnight: result.OvernightType !== undefined ? result.OvernightType : (result.Overnight === true ? 1 : 0),
            CostOvernight: result.CostOvernight || 0,
            TotalMoney: result.TotalMoney || 0,
            Note: result.Note || '',
            Reason: result.Reason || '',
            IsProblem: result.IsProblem || false,
            AttachFileName: result.AttachFileName || ''
          };

          const modalRef = this.modalService.open(EmployeeRegisterBussinessFormComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false
          });

          modalRef.componentInstance.data = copyData;
          modalRef.componentInstance.isEditMode = false;

          modalRef.result.then(
            (result) => {
              if (result?.success) {
                this.loadEmployeeBussinessPerson();
              }
            },
            () => {
              // Modal dismissed
            }
          );
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lấy dữ liệu để sao chép');
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
      }
    });
  }

  // Map dữ liệu từ table sang format của form
  private mapTableDataToFormData(tableData: any): any {
    return {
      ID: tableData.ID !== null && tableData.ID !== undefined ? tableData.ID : (tableData.Id !== null && tableData.Id !== undefined ? tableData.Id : 0),
      EmployeeID: tableData.EmployeeID || tableData.EmployeeId || 0,
      DayBussiness: tableData.DayBussiness || null,
      ApprovedId: tableData.ApprovedId || tableData.ApprovedID || tableData.ApproverID || null,
      Location: tableData.Location || '',
      Type: tableData.Type || tableData.TypeID || tableData.TypeBusiness || null,
      CostBussiness: tableData.CostBussiness || tableData.CostType || 0,
      VehicleID: tableData.VehicleID || tableData.VehicleId || null,
      CostVehicle: tableData.CostVehicle || 0,
      NotCheckIn: tableData.NotCheckIn || tableData.NotChekIn || 0,
      WorkEarly: tableData.WorkEarly === true || tableData.WorkEarly === 1 || tableData.WorkEarly === 'true' || tableData.WorkEarly === '1' || tableData.WorkEarly === 'True',
      CostWorkEarly: tableData.CostWorkEarly || 0,
      Overnight: tableData.OvernightType !== undefined ? tableData.OvernightType : (tableData.Overnight === true ? 1 : 0),
      CostOvernight: tableData.CostOvernight || 0,
      TotalMoney: tableData.TotalMoney || 0,
      Note: tableData.Note || '',
      Reason: tableData.Reason || '',
      IsProblem: tableData.IsProblem || false,
      AttachFileName: tableData.AttachFileName || ''
    };
  }

  async exportToExcel() {
    if (!this.tabulator) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
      return;
    }

    this.exportingExcel = true;

    try {
      const allData = this.employeeBussinessList;

      if (allData.length === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const exportData = allData.map((item: any, idx: number) => {
        const formatDate = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
          }
        };

        return {
          'STT': idx + 1,
          'Mã nhân viên': item.Code || '',
          'Tên nhân viên': item.FullName || '',
          'Ngày công tác': formatDate(item.DayBussiness),
          'Nơi công tác': item.Location || '',
          'Loại': item.TypeName || '',
          'Phương tiện': item.VehicleName || '',
          'Chấm công': item.NotCheckIn === 1 ? 'Không chấm công' : 'Có chấm công',
          'Trạng thái': item.IsApproved ? 'Đã duyệt' : 'Chờ duyệt',
          'Ghi chú': item.Note || ''
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DangKyCongTac');

      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30 },
        { header: 'Ngày công tác', key: 'Ngày công tác', width: 18 },
        { header: 'Nơi công tác', key: 'Nơi công tác', width: 25 },
        { header: 'Loại', key: 'Loại', width: 25 },
        { header: 'Phương tiện', key: 'Phương tiện', width: 20 },
        { header: 'Chấm công', key: 'Chấm công', width: 20 },
        { header: 'Trạng thái', key: 'Trạng thái', width: 20 },
        { header: 'Ghi chú', key: 'Ghi chú', width: 40 },
      ];

      exportData.forEach((row: any) => worksheet.addRow(row));

      worksheet.eachRow((row: ExcelJS.Row) => {
        row.eachCell((cell: ExcelJS.Cell) => {
          if (!cell.font) {
            cell.font = { name: 'Times New Roman', size: 10 };
          } else {
            cell.font = { ...cell.font, name: 'Times New Roman', size: 10 };
          }
        });
      });

      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }
        };
      });
      worksheet.getRow(1).height = 30;

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          row.getCell('STT').font = { name: 'Times New Roman', size: 10 };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `DangKyCongTac_${startDateStr}_${endDateStr}.xlsx`);

    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }

  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chờ duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus = status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px;">Chờ duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px;">Không xác định</span>';
    }
  }
}


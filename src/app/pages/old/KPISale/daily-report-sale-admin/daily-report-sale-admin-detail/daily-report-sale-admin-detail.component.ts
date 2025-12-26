import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
  ColumnDefinition,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { SelectControlComponent } from '../../../select-control/select-control.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AppUserService } from '../../../../../services/app-user.service';
import { TabulatorPopupService } from '../../../../../shared/components/tabulator-popup';

import { DailyReportSaleAdminService } from '../daily-report-sale-admin-service/daily-report-sale-admin.service';

@Component({
  selector: 'app-daily-report-sale-admin-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    CommonModule,
    NzTreeSelectModule,
  ],
  templateUrl: './daily-report-sale-admin-detail.component.html',
  styleUrl: './daily-report-sale-admin-detail.component.css'
})
export class DailyReportSaleAdminDetailComponent implements OnInit, AfterViewInit {
  @Input() selectedRowId: number = 0;
  @Input() isEditMode: boolean = false;
  @ViewChild('tb_DataTable', { static: false })
  tb_DataTableElement!: ElementRef;

  private tb_DataTable!: Tabulator;

  mainData: any[] = [];
  listIdsDel: any[] = [];

  employees: any[] = [];
  reportTypes: any[] = [];
  projects: any[] = [];
  customers: any[] = [];
  isSaveEnabled: boolean = false; // Trạng thái enable/disable nút lưu

  // Modal thêm loại báo cáo
  showReportTypeModal: boolean = false;
  reportTypeForm!: FormGroup;
  isSavingReportType: boolean = false;

  // Column definitions cho popup
  employeePopupColumns: ColumnDefinition[] = [
    { title: 'Mã NV', field: 'Code', width: 120 },
    { title: 'Tên nhân viên', field: 'FullName', width: 200 },
  ];

  reportTypePopupColumns: ColumnDefinition[] = [
    // { title: 'Mã loại', field: 'ReportTypeCode', width: 120 },
    { title: 'Tên loại báo cáo', field: 'ReportTypeName', width: 200 },
  ];

  projectPopupColumns: ColumnDefinition[] = [
    { title: 'Mã dự án', field: 'ProjectCode', width: 250 },
    { title: 'Tên dự án', field: 'ProjectName', width: 250 },
  ];

  customerPopupColumns: ColumnDefinition[] = [
    { title: 'Mã KH', field: 'CustomerCode', width: 150 },
    { title: 'Tên khách hàng', field: 'CustomerName', width: 250 },
  ];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder,
    private dailyReportSaleAdminService: DailyReportSaleAdminService,
    private appUserService: AppUserService,
    private tabulatorPopupService: TabulatorPopupService
  ) { 
    this.initReportTypeForm();
  }

  closeModal(): void {
    this.activeModal.close();
  }

  initReportTypeForm(): void {
    this.reportTypeForm = this.fb.group({
      reportTypeName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Nếu không phải edit mode, enable nút lưu bình thường
    if (!this.isEditMode) {
      this.isSaveEnabled = true;
    }
    this.loadAllData();
    if (this.isEditMode && this.selectedRowId > 0) {
      this.loadDetail();
    }
  }

  ngAfterViewInit(): void {
  }

  loadAllData(): void {
    forkJoin({
      employees: this.dailyReportSaleAdminService.getEmployees(),
      reportTypes: this.dailyReportSaleAdminService.getReportTypes(),
      projects: this.dailyReportSaleAdminService.getProjects(),
      customers: this.dailyReportSaleAdminService.getCustomers(),
    }).subscribe({
      next: (responses) => {
        if (responses.employees.status === 1) {
          this.employees = (responses.employees.data || []).filter((item: any) => {
            return item.FullName && item.FullName.trim().length > 0;
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, responses.employees.message);
        }

        if (responses.reportTypes.status === 1) {
          this.reportTypes = responses.reportTypes.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, responses.reportTypes.message);
        }

        if (responses.projects.status === 1) {
          this.projects = responses.projects.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, responses.projects.message);
        }

        if (responses.customers.status === 1) {
          this.customers = responses.customers.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, responses.customers.message);
        }

        setTimeout(() => {
          this.initTable();
        }, 0);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu');
      },
    });
  }

  loadDetail(): void {
    this.dailyReportSaleAdminService.getDetail(this.selectedRowId).subscribe((response) => {
      if (response.status === 1) {
        this.mainData = response.data;
        this.tb_DataTable.replaceData(this.mainData);
        // Chỉ kiểm tra quyền lưu khi ở chế độ edit
        if (this.isEditMode) {
          this.checkSavePermission();
        }
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message);
      }
    }, () => {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu');
    });
  }

  checkSavePermission(): void {
    // Chỉ check khi ở chế độ edit
    if (!this.isEditMode) {
      this.isSaveEnabled = true;
      return;
    }

    const data = this.tb_DataTable.getData();

    // Lấy dòng đầu tiên trong bảng
    const firstRow = data[0];
    const firstRowEmployeeID = firstRow?.EmployeeID || 0;
    
    // Lấy ID của user đang đăng nhập
    const currentUserId = this.appUserService.employeeID || 0;

    // Chỉ enable nút lưu nếu ID user đăng nhập đúng với EmployeeID của dòng đầu tiên
    this.isSaveEnabled = currentUserId === firstRowEmployeeID && firstRowEmployeeID > 0;
  }

  loadEmployees(): void {
    this.dailyReportSaleAdminService.getEmployees().subscribe((response) => {
      if (response.status === 1) {
        this.employees = (response.data || []).filter((item: any) => {
          return item.FullName && item.FullName.trim().length > 0;
        });
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message);
      }
    });
  }

  loadReportTypes(): void {
    this.dailyReportSaleAdminService.getReportTypes().subscribe((response) => {
      if (response.status === 1) {
        this.reportTypes = response.data;
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message);
      }
    });
  }

  loadProjects(): void {
    this.dailyReportSaleAdminService.getProjects().subscribe((response) => {
      if (response.status === 1) {
        this.projects = response.data;
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message);
      }
    });
  }

  loadCustomers(): void {
    this.dailyReportSaleAdminService.getCustomers().subscribe((response) => {
      if (response.status === 1) {
        this.customers = response.data;
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message);
      }
    });
  }

  validateForm(): boolean {
    if (!this.tb_DataTable) {
      return false;
    }

    const allData = this.tb_DataTable.getData();
    const validRows = allData.filter((row: any) => !row.IsDeleted);

    if (validRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất một dòng dữ liệu!');
      return false;
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      if (!row.ReportContent || row.ReportContent.trim().length === 0) {
        this.notification.warning('Cảnh báo', 'Vui lòng nhập nội dung báo cáo');
        return false;
      }

      if (!row.Result || row.Result.trim().length === 0) {
        this.notification.warning('Cảnh báo', 'Vui lòng nhập kết quả');
        return false;
      }

      if (!row.EmployeeID || row.EmployeeID <= 0) {
        this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên');
        return false;
      }

      if (!row.ReportTypeID || row.ReportTypeID <= 0) {
        this.notification.warning('Cảnh báo', 'Vui lòng chọn loại báo cáo');
        return false;
      }

      if (!row.DateReport) {
        this.notification.warning('Cảnh báo', 'Vui lòng nhập ngày báo cáo');
        return false;
      }

      let dateReport: Date | null = null;
      if (row.DateReport instanceof Date) {
        dateReport = row.DateReport;
      } else if (typeof row.DateReport === 'string') {
        dateReport = new Date(row.DateReport);
      }

      if (!dateReport || isNaN(dateReport.getTime())) {
        this.notification.warning('Cảnh báo', 'Vui lòng nhập ngày báo cáo hợp lệ');
        return false;
      }
    }

    return true;
  }

  saveData(): void {
    if (!this.tb_DataTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
      return;
    }

    // Validate form trước khi lưu
    if (!this.validateForm()) {
      return;
    }

    // Lấy tất cả data từ table (bao gồm cả các row chưa bị xóa)
    const allData = this.tb_DataTable.getData();

    // Filter các row không bị xóa và format data
    const requestData = allData
      .filter((row: any) => !row.IsDeleted)
      .map((row: any) => {
        // Format DateReport nếu có
        let dateReport = null;
        if (row.DateReport) {
          if (row.DateReport instanceof Date) {
            dateReport = row.DateReport;
          } else if (typeof row.DateReport === 'string') {
            dateReport = new Date(row.DateReport);
          } else {
            dateReport = row.DateReport;
          }
        }

        return {
          ID: row.ID || 0,
          PlanNextDay: row.PlanNextDay || '',
          Problem: row.Problem || '',
          ProblemSolve: row.ProblemSolve || '',
          ReportContent: row.ReportContent || '',
          Result: row.Result || '',
          EmployeeID: row.EmployeeID || 0,
          EmployeeRequestID: row.EmployeeRequestID || 0,
          CustomerID: row.CustomerID || 0,
          ReportTypeID: row.ReportTypeID || 0,
          DateReport: dateReport,
          ProjectID: row.ProjectID || 0,
        };
      });

    // Tạo payload theo format API yêu cầu
    const payload = {
      request: requestData,
      IdsDel: this.listIdsDel || [],
    };

    // Gọi API save
    this.dailyReportSaleAdminService.saveData(payload).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi lưu dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error saving data:', error);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu'
        );
      },
    });
  }

  addNewRow(): void {
    // Lấy employeeID của người đang đăng nhập
    const currentEmployeeID = this.appUserService.employeeID || 0;
    
    const newRow = {
      ID: null,
      DateReport: new Date(), // Mặc định là ngày hôm nay
      EmployeeID: currentEmployeeID > 0 ? currentEmployeeID : null,
      ReportTypeID: null,
      ReportContent: '',
      ProjectID: null,
      CustomerID: null,
      EmployeeRequestID: null,
      Result: '',
      Problem: '',
      ProblemSolve: '',
      PlanNextDay: '',
      // IsDeleted: false,
    };
    this.tb_DataTable.addRow(newRow);
  }

  initTable(): void {
    if (!this.tb_DataTableElement?.nativeElement) {
      console.warn('tb_DataTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_DataTable) {
      this.tb_DataTable.destroy();
    }
    this.tb_DataTable = new Tabulator(this.tb_DataTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.mainData,
      pagination: false,
      paginationMode: 'local',
      height: '75vh',
      rowHeader: false,
      selectableRows: 1,
      layout: 'fitColumns',
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus cursor-pointer" style="color: #22c55e;" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewRow();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fullName = data['FullName'];
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa nhân viên sale`,
              nzContent: `${fullName}`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.listIdsDel.includes(id)) this.listIdsDel.push(id);
                  this.tb_DataTable.deleteRow(cell.getRow());
                } else {
                  this.tb_DataTable.deleteRow(cell.getRow());
                }
              },
            });
          },
        },
        {
          title: 'Thời gian báo cáo', field: 'DateReport', editor: 'date', frozen: true, width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        },
        {
          title: 'Nhân viên',
          field: 'EmployeeID',
          frozen: true,
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          tooltip: true,
          formatter: (cell) => {
            const value = cell.getValue();
            const employee = this.employees.find((e) => e.ID === value);
            const displayText = employee ? employee.FullName : 'Chọn NV';
            return `
              <button class="btn-toggle-detail w-100 h-100" style="background-color: white; border: 1px solid #d9d9d9;" title="${displayText}">
                <span class="employee-text">${displayText}</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showEmployeePopup(cell);
          },
        },
        {
          title: 'Loại báo cáo',
          field: 'ReportTypeID',
          frozen: true,
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          tooltip: true,
          formatter: (cell) => {
            const value = cell.getValue();
            const reportType = this.reportTypes.find((rt) => rt.ID === value);
            const displayText = reportType ? reportType.ReportTypeName : 'Chọn loại';
            return `
              <button class="btn-toggle-detail w-100 h-100" style="background-color: white; border: 1px solid #d9d9d9;" title="${displayText}">
                <span class="report-type-text">${displayText}</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showReportTypePopup(cell);
          },
        },
        { title: 'Nội dung báo cáo', field: 'ReportContent', editor: 'textarea', width: 250, },
        {
          title: 'Mã dự án',
          field: 'ProjectID',
          hozAlign: 'center',
          headerHozAlign: 'center',
          tooltip: true,
          width: 200,
          formatter: (cell) => {
            const value = cell.getValue();
            const project = this.projects.find((p) => p.ID === value);
            const displayText = project ? (project.ProjectCode + ' - ' + project.ProjectName) : 'Chọn dự án';
            return `
              <button class="btn-toggle-detail w-100 h-100" style="background-color: white; border: 1px solid #d9d9d9;" title="${displayText}">
                <span class="project-text">${displayText}</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showProjectPopup(cell);
          },
        },
        {
          title: 'Khách hàng',
          field: 'CustomerID',
          width: 200,
          hozAlign: 'center',
          headerHozAlign: 'center',
          tooltip: true,
          formatter: (cell) => {
            const value = cell.getValue();
            const customer = this.customers.find((c) => c.ID === value);
            const displayText = customer ? (customer.CustomerCode + ' - ' + customer.CustomerName) : 'Chọn KH';
            return `
              <button class="btn-toggle-detail w-100 h-100" style="background-color: white; border: 1px solid #d9d9d9;" title="${displayText}">
                <span class="customer-text">${displayText}</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showCustomerPopup(cell);
          },
        },
        {
          title: 'Người yêu cầu',
          field: 'EmployeeRequestID',
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          tooltip: true,
          formatter: (cell) => {
            const value = cell.getValue();
            const employee = this.employees.find((e) => e.ID === value);
            const displayText = employee ? employee.FullName : 'Chọn NV';
            return `
              <button class="btn-toggle-detail w-100 h-100" style="background-color: white; border: 1px solid #d9d9d9;" title="${displayText}">
                <span class="employee-request-text">${displayText}</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showEmployeeRequestPopup(cell);
          },
        },
        { title: 'Kết quả xử lí', field: 'Result', editor: 'textarea', width: 250, },
        { title: 'Vấn đề tồn đọng', field: 'Problem', editor: 'textarea', width: 250, },
        { title: 'Giải quyết vấn đề', field: 'ProblemSolve', editor: 'textarea', width: 250, },
        { title: 'Kế hoạch tiếp theo', field: 'PlanNextDay', editor: 'textarea', width: 250, },
      ],
    });
  }

  // Methods để mở popup cho từng loại
  showEmployeePopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    // Toggle: nếu đang mở thì đóng
    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.employees || [],
        columns: this.employeePopupColumns,
        searchFields: ['Code', 'FullName'],
        searchPlaceholder: 'Tìm kiếm nhân viên...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedEmployee) => {
          const parentRow = cell.getRow();
          parentRow.update({
            EmployeeID: selectedEmployee.ID,
          });
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          cellElement.classList.remove('popup-open');
        },
      },
      cellElement
    );
    cellElement.classList.add('popup-open');
  }

  showReportTypePopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.reportTypes || [],
        columns: this.reportTypePopupColumns,
        searchFields: ['ReportTypeCode', 'ReportTypeName'],
        searchPlaceholder: 'Tìm kiếm loại báo cáo...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedReportType) => {
          const parentRow = cell.getRow();
          parentRow.update({
            ReportTypeID: selectedReportType.ID,
          });
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          cellElement.classList.remove('popup-open');
        },
      },
      cellElement
    );
    cellElement.classList.add('popup-open');
  }

  showProjectPopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.projects || [],
        columns: this.projectPopupColumns,
        searchFields: ['ProjectCode', 'ProjectName'],
        searchPlaceholder: 'Tìm kiếm dự án...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedProject) => {
          const parentRow = cell.getRow();
          parentRow.update({
            ProjectID: selectedProject.ID,
          });
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          cellElement.classList.remove('popup-open');
        },
      },
      cellElement
    );
    cellElement.classList.add('popup-open');
  }

  showCustomerPopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.customers || [],
        columns: this.customerPopupColumns,
        searchFields: ['CustomerCode', 'CustomerName'],
        searchPlaceholder: 'Tìm kiếm khách hàng...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedCustomer) => {
          const parentRow = cell.getRow();
          parentRow.update({
            CustomerID: selectedCustomer.ID,
          });
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          cellElement.classList.remove('popup-open');
        },
      },
      cellElement
    );
    cellElement.classList.add('popup-open');
  }

  showEmployeeRequestPopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.employees || [],
        columns: this.employeePopupColumns,
        searchFields: ['Code', 'FullName'],
        searchPlaceholder: 'Tìm kiếm nhân viên...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedEmployee) => {
          const parentRow = cell.getRow();
          parentRow.update({
            EmployeeRequestID: selectedEmployee.ID,
          });
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          cellElement.classList.remove('popup-open');
        },
      },
      cellElement
    );
    cellElement.classList.add('popup-open');
  }

  // Các hàm xử lý modal loại báo cáo
  onAddReportType(): void {
    // Reset form và mở modal
    this.reportTypeForm.reset({
      reportTypeName: ''
    });
    this.showReportTypeModal = true;
  }

  onReportTypeModalCancel(): void {
    this.showReportTypeModal = false;
    this.reportTypeForm.reset();
  }

  saveAndCloseReportType(): void {
    if (this.reportTypeForm.invalid) {
      // Đánh dấu các trường là touched để hiển thị lỗi
      Object.values(this.reportTypeForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.isSavingReportType = true;
    const reportTypeName = this.reportTypeForm.get('reportTypeName')?.value;

    // Gọi API để lưu loại báo cáo
    this.dailyReportSaleAdminService.saveReportType(reportTypeName).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Thêm loại báo cáo thành công!');
          this.loadReportTypes(); // Load lại danh sách loại báo cáo
          this.showReportTypeModal = false;
          this.reportTypeForm.reset();
        } else {
          this.notification.error('Lỗi', response.message || 'Thêm loại báo cáo thất bại!');
        }
        this.isSavingReportType = false;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi thêm loại báo cáo!');
        this.isSavingReportType = false;
      }
    });
  }
}

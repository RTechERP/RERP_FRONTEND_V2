import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  Input,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs,
  SlickRowDetailView,
  ExtensionName
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import * as ExcelJS from 'exceljs';
import { ChangeDetectorRef } from '@angular/core';

// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../services/permission.service';
import { AuthService } from '../../../../auth/auth.service';
import { CancelApproveReasonFormComponent } from '../cancel-approve-reason-form/cancel-approve-reason-form.component';
import { RowDetailViewComponent } from './row-detail-view.component';

@Component({
  selector: 'app-approve-job-requirement',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
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
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    NzDropDownModule,
    NzMenuModule,
    NzSpinModule,
    HasPermissionDirective,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './approve-job-requirement.component.html',
  styleUrl: './approve-job-requirement.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ApproveJobRequirementComponent implements OnInit, AfterViewInit {

  @Input() approvalMode: 1 | 2 | 3 | null = null; // 1: TBP, 2: HR, 3: BGD

  // SlickGrid instance
  angularGrid!: AngularGridInstance;

  // Column definitions
  columnDefinitions: Column[] = [];

  // Grid options
  gridOptions: GridOption = {};

  // Dataset
  dataset: any[] = [];

  searchParams = {
    DateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    DateEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    Request: '',
    EmployeeID: null,
    DepartmentID: null,
    ApprovedTBPID: null,
    Step: 0,
  };

  JobrequirementData: any[] = [];
  JobrequirementID: number = 0;
  data: any[] = [];
  dataDepartment: any[] = [];
  cbbEmployee: any[] = [];

  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  isLoading: boolean = false;
  dateFormat = 'dd/MM/yyyy';

  // Menu bars
  menuBars: any[] = [];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  currentUser: any = null;

  constructor(
    private notification: NzNotificationService,
    private JobRequirementService: JobRequirementService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
  ) {
  }

  ngOnInit(): void {
    // Initialize grid first to ensure columns are defined before view renders
    this.initGrid();

    this.route.queryParams.subscribe(params => {
      const typeApprove = params['typeApprove'] || 0;

      if (typeApprove === '2' || typeApprove === 2) {
        this.approvalMode = 1; // TBP duyệt
        this.searchParams.Step = 1;
      } else if (typeApprove === '3' || typeApprove === 3) {
        this.approvalMode = 3; // BGD duyệt
      }

      // Call getCurrentUser AFTER approvalMode is set
      this.getCurrentUser();
      // Initialize menubar after approvalMode is set
      this.initMenuBar();
    });

    this.getdataEmployee();
    this.getdataDepartment();
  }

  initMenuBar(): void {
    this.menuBars = [];

    // Xuất Excel - always available
    this.menuBars.push({
      label: 'Xuất Excel',
      icon: 'fa-solid fa-file-excel fa-lg text-success',
      command: () => this.exportToExcel()
    });

    // TBP Menu - approval mode 1
    if (this.approvalMode === 1) {
      this.menuBars.push({
        label: 'Trưởng Bộ Phận',
        //   visible: this.permissionService.hasPermission("N56,N32,N1"),
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        items: [
          {
            label: 'Duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            // visible: this.permissionService.hasPermission("N56,N32,N1"),
            command: () => this.onApproveJobRequirement('btnApproveTBP_New')
          },
          {
            label: 'Hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            //        visible: this.permissionService.hasPermission("N56,N32,N1"),
            command: () => this.onApproveJobRequirement('btnUnApproveTBP_New')
          }
        ]
      });
    }

    // BGD Menu - approval mode 3
    if (this.approvalMode === 3) {
      this.menuBars.push({
        label: 'Ban Giám Đốc',
        //   visible: this.permissionService.hasPermission("N58,N1"),
        icon: 'fa-solid fa-user-tie fa-lg text-primary',
        items: [
          {
            label: 'Duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.onApproveJobRequirement('btnSuccessApproved')
          },
          {
            label: 'Hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.onApproveJobRequirement('btnUnApproveBGĐ')
          }
        ]
      });
    }
  }

  ngAfterViewInit(): void {
    // Grid initialization moved to ngOnInit
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;
        if (this.approvalMode === 1 && this.currentUser?.EmployeeID) {
          this.searchParams.ApprovedTBPID = this.currentUser.EmployeeID;
        }
        this.getJobrequirement();
      },
      error: (err) => {
        this.notification.error("Lỗi", err.error.message);
      }
    });
  }

  //search
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  getJobrequirement(): void {
    this.isLoading = true;
    this.JobRequirementService.getJobrequirement(
      this.searchParams.DepartmentID ?? 0,
      this.searchParams.EmployeeID ?? 0,
      this.searchParams.ApprovedTBPID ?? 0,
      this.searchParams.Step,
      this.searchParams.Request,
      this.searchParams.DateStart,
      this.searchParams.DateEnd
    ).subscribe({
      next: (response: any) => {
        this.JobrequirementData = response.data || [];

        // Map data with id for SlickGrid
        this.dataset = this.JobrequirementData.map((item: any, index: number) => ({
          ...item,
          id: item.ID,
          RowIndex: index + 1
        }));

        // Apply distinct filters after data is loaded
        setTimeout(() => {
          this.applyDistinctFilters();

          // Select first row if data exists
          if (this.dataset.length > 0 && this.angularGrid?.slickGrid) {
            this.JobrequirementID = this.dataset[0].ID;
            this.angularGrid.slickGrid.setSelectedRows([0]);
          } else {
            this.JobrequirementID = 0;
          }
        }, 100);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
        );
      }
    });
  }

  getdataDepartment() {
    this.JobRequirementService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  getdataEmployee() {
    this.JobRequirementService.getAllEmployee().subscribe((response: any) => {
      this.cbbEmployee = response.data || [];
    });
  }

  /**
   * Map button name sang step và status
   */
  private getStepAndStatusFromButton(buttonName: string): { step: number; status: number } | null {
    const buttonMap: { [key: string]: { step: number; status: number } } = {
      // Step 2: TBP xác nhận
      'btnApproveTBP_New': { step: 2, status: 1 },
      'btnUnApproveTBP_New': { step: 2, status: 2 },
      'btnTBP': { step: 2, status: 1 },

      // Step 5: BGĐ xác nhận
      'btnSuccessApproved': { step: 5, status: 1 },
      'btnBGĐ': { step: 5, status: 1 },
      'btnUnApproveBGĐ': { step: 5, status: 2 },
    };

    return buttonMap[buttonName] || null;
  }

  /**
   * Xử lý duyệt/hủy duyệt job requirement
   */
  onApproveJobRequirement(buttonName: string): void {
    const selected = this.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một bản ghi để duyệt!'
      );
      return;
    }

    // Lấy step và status từ button name
    const stepStatus = this.getStepAndStatusFromButton(buttonName);
    if (!stepStatus) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bước duyệt tương ứng với nút này!'
      );
      return;
    }

    const { step, status } = stepStatus;

    // Nếu là hủy duyệt (status = 2), cần nhập lý do
    if (status === 2) {
      this.showCancelReasonModal(selected, step);
    } else {
      // Duyệt (status = 1), gọi API trực tiếp
      this.processApprove(selected, step, status, '');
    }
  }

  /**
   * Hiển thị modal nhập lý do hủy
   */
  private showCancelReasonModal(selected: any[], step: number): void {
    const modalRef = this.modalService.open(CancelApproveReasonFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result
      .then((reasonCancel: string) => {
        if (reasonCancel && reasonCancel.trim()) {
          this.processApprove(selected, step, 2, reasonCancel.trim());
        }
      })
      .catch(() => {
        // User cancelled, do nothing
      });
  }

  /**
   * Xử lý duyệt/hủy duyệt
   */
  private processApprove(selected: any[], step: number, status: number, reasonCancel: string): void {
    // Tạo danh sách approve request
    const approveList = selected.map((row: any) => ({
      JobRequirementID: row.ID || 0,
      Step: step,
      Status: status,
      ReasonCancel: reasonCancel || ''
    })).filter((item: any) => item.JobRequirementID > 0);

    if (approveList.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi cần duyệt!'
      );
      return;
    }

    // Gọi API approve
    this.JobRequirementService.approveJobRequirement(approveList).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const results = response.data || [];
          let successCount = 0;
          let failCount = 0;
          const errorMessages: string[] = [];

          results.forEach((result: any) => {
            if (result.Success) {
              successCount++;
            } else {
              failCount++;
              if (result.Message) {
                errorMessages.push(result.Message);
              }
            }
          });

          // Hiển thị thông báo kết quả
          if (successCount > 0 && failCount === 0) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `Duyệt thành công ${successCount} bản ghi!`
            );
            // Refresh lại table
            this.getJobrequirement();
          } else if (successCount > 0 && failCount > 0) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Duyệt thành công ${successCount} bản ghi, thất bại ${failCount} bản ghi. ${errorMessages.join('; ')}`
            );
            // Refresh lại table
            this.getJobrequirement();
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              errorMessages.length > 0 ? errorMessages.join('; ') : 'Duyệt thất bại!'
            );
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response?.message || 'Duyệt thất bại!'
          );
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Duyệt thất bại!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  searchData() {
    this.getJobrequirement();
  }

  onKeywordChange(value: string) {
    this.searchParams.Request = value;
  }

  /**
   * Xuất dữ liệu Excel theo các cột hiển thị trên bảng
   */
  exportToExcel(): void {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Yêu cầu công việc');

      // Get columns from SlickGrid column definitions
      const headers: string[] = [];
      const columnFields: string[] = [];
      const columnWidths: number[] = [];

      this.columnDefinitions.forEach((col: Column) => {
        if (col.field && col.name && !col.hidden) {
          headers.push(col.name as string);
          columnFields.push(col.field);
          columnWidths.push(col.width || 120);
        }
      });

      // Add headers
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }
        };
      });
      headerRow.height = 30;

      // Add data rows
      this.JobrequirementData.forEach((row: any) => {
        const rowData = columnFields.map(field => {
          const value = row[field];
          // Format date fields
          if (field === 'DateRequest' || field === 'DeadlineRequest' || field === 'DateApprovedTBP' ||
            field === 'DateApprovedHR' || field === 'DateApprovedBGD') {
            if (value) {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
            }
            return '';
          }
          // Format boolean/checkbox fields
          if (field === 'IsRequestBGDApproved' || field === 'IsRequestBuy' || field === 'IsRequestPriceQuote') {
            return (value === true || value === 'true' || value === 1 || value === '1') ? 'Có' : 'Không';
          }
          return value ?? '';
        });
        worksheet.addRow(rowData);
      });

      // Set font Times New Roman cỡ 10 và wrap text cho tất cả các cell dữ liệu
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 25;
          row.eachCell((cell: ExcelJS.Cell) => {
            cell.font = { name: 'Times New Roman', size: 10 };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // Auto fit columns
      worksheet.columns.forEach((column: any, index: number) => {
        if (column && column.eachCell) {
          let maxLength = 0;
          column.eachCell({ includeEmpty: false }, (cell: any) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // Generate file
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `Duyet_yeu_cau_cong_viec_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
        saveAs(blob, fileName);
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Xuất Excel thành công!'
        );
      });
    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất Excel: ' + (error?.message || 'Unknown error')
      );
    }
  }

  // SlickGrid ready handler
  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
  }

  // Initialize main grid
  initGrid(): void {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value === true || value === 'true' || value === 1 || value === '1';
      return `<div style="text-align: center;"><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
    };

    const tooltipFormatter = (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
      if (!value) return '';
      const fieldName = _column.field;
      return `
                <span
                    title="${dataContext[fieldName] || value}"
                    style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                    ${value}
                </span>
            `;
    };

    this.columnDefinitions = [
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', excludeFromExport: true, hidden: true },
      { id: 'RowIndex', name: 'STT', field: 'RowIndex', type: 'number', width: 60, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-center' },


      {
        id: 'NumberRequest',
        name: 'Số yêu cầu',
        field: 'NumberRequest',
        type: 'string',
        width: 130,
        minWidth: 110,
        sortable: true,
        filterable: true,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="Click để xem chi tiết: ${value}"
              style="display:block; color:#1677ff; text-decoration:underline; cursor:pointer; font-weight:500;"
            >
              ${value}
            </span>
          `;
        },
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'DateRequest',
        name: 'Ngày yêu cầu',
        field: 'DateRequest',
        type: 'string',
        width: 110,
        minWidth: 100,
        sortable: true,
        filterable: true,
        formatter: formatDate,
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'EmployeeName',
        name: 'Tên nhân viên',
        field: 'EmployeeName',
        type: 'string',
        width: 150,
        minWidth: 130,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'EmployeeDepartment',
        name: 'Bộ phận yêu cầu',
        field: 'EmployeeDepartment',
        type: 'string',
        width: 150,
        minWidth: 130,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'FullNameApprovedTBP',
        name: 'TBP duyệt',
        field: 'FullNameApprovedTBP',
        type: 'string',
        width: 150,
        minWidth: 120,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'RequiredDepartment',
        name: 'Bộ phận được yêu cầu',
        field: 'RequiredDepartment',
        type: 'string',
        width: 150,
        minWidth: 100,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'CoordinationDepartment',
        name: 'Bộ phận phối hợp',
        field: 'CoordinationDepartment',
        type: 'string',
        width: 150,
        minWidth: 120,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'IsApprovedText',
        name: 'Trạng thái duyệt',
        field: 'IsApprovedText',
        type: 'string',
        width: 120,
        minWidth: 100,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
        }
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        type: 'string',
        width: 200,
        minWidth: 150,
        sortable: true,
        filterable: true,
        formatter: tooltipFormatter,
        filter: { model: Filters['compoundInputText'] }
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '#approveJobRequirementGridContainer',
        rightPadding: 0,
        bottomPadding: 0,
        calculateAvailableSizeBy: 'container',
        resizeDetection: "container"
      },
      enableAutoResize: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: { hideSelectAllCheckbox: false },
      rowSelectionOptions: { selectActiveRow: true },
      rowHeight: 35,
      headerRowHeight: 52,
      forceFitColumns: false,
      enableAutoSizeColumns: true,
      autoFitColumnsOnFirstLoad: false,
      gridWidth: '100%',
      enableRowDetailView: true,
      rowDetailView: {
        process: (item) => {
          // The RowDetailViewComponent will handle its own data fetching
          return Promise.resolve(item);
        },
        loadOnce: false,
        preloadComponent: RowDetailViewComponent,
        viewComponent: RowDetailViewComponent,
        // Optional: you can adjust the row height when expanded
        panelRows: 12,
      }
    };
  }

  // Handle row click
  onCellClicked(e: Event, args: OnClickEventArgs): void {
    const cellIndex = (args as any)?.cell;
    const rowNumber = (args as any)?.row;

    // Get item from dataView using row index (more reliable than dataContext)
    let item = (args as any)?.dataContext;
    if (!item && rowNumber !== undefined && this.angularGrid?.dataView) {
      item = this.angularGrid.dataView.getItem(rowNumber);
    }

    console.log('onCellClicked fired', { cellIndex, rowNumber, item, args });

    // Lấy column từ angularGrid instance
    let columnId = '';
    if (this.angularGrid?.slickGrid && cellIndex !== undefined) {
      const columns = this.angularGrid.slickGrid.getColumns();
      if (columns && columns[cellIndex]) {
        columnId = columns[cellIndex].id as string;
      }
    }

    console.log('columnId:', columnId);

    if (item) {
      this.JobrequirementID = item.ID || 0;
      this.data = [item];

      // Mở Row Detail khi click vào cột "Mã yêu cầu" (NumberRequest)
      if (columnId === 'NumberRequest') {
        console.log('NumberRequest column clicked, rowNumber:', rowNumber);

        if (rowNumber !== undefined && this.angularGrid?.slickGrid) {
          // Simulate clicking the expand/collapse icon (+/-)
          const gridEl = document.getElementById('approveJobRequirementGrid');
          if (gridEl) {
            // Find the row and the expand toggle icon
            const rows = gridEl.querySelectorAll('.slick-row');
            const targetRow = rows[rowNumber] as HTMLElement;
            if (targetRow) {
              // Find the expand icon - typically in the first cell with class containing 'detail' or 'toggle'
              const expandIcon = targetRow.querySelector('.detailView-toggle, .slick-row-detail-icon, [class*="detail-view-toggle"]') as HTMLElement;
              if (expandIcon) {
                console.log('Clicking expand icon:', expandIcon);
                expandIcon.click();
              } else {
                // Try the first cell
                const firstCell = targetRow.querySelector('.slick-cell:first-child') as HTMLElement;
                if (firstCell) {
                  const toggleIcon = firstCell.querySelector('span, i, div') as HTMLElement;
                  if (toggleIcon) {
                    console.log('Clicking toggle in first cell:', toggleIcon);
                    toggleIcon.click();
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Handle row selection changed
  onSelectedRowsChanged(e: Event, args: OnSelectedRowsChangedEventArgs): void {
    if (args?.rows?.length > 0 && this.angularGrid?.dataView) {
      const selectedIdx = args.rows[0];
      const item = this.angularGrid.dataView.getItem(selectedIdx);
      if (item) {
        this.JobrequirementID = item.ID || 0;
        this.data = [item];
      }
    } else {
      this.JobrequirementID = 0;
      this.data = [];
    }
  }

  // Get selected data from grid
  getSelectedData(): any[] {
    if (!this.angularGrid?.slickGrid) return [];
    const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) return [];
    return selectedRows.map((idx: number) => this.angularGrid.dataView.getItem(idx)).filter((item: any) => item);
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    const fieldsToFilter = [
      'StatusText', 'NumberRequest', 'EmployeeName', 'EmployeeDepartment',
      'FullNameApprovedTBP', 'RequiredDepartment', 'CoordinationDepartment', 'IsApprovedText'
    ];
    this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, fieldsToFilter);
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    columnDefs.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
}

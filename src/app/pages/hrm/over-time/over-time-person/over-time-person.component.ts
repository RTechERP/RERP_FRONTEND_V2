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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { OverTimeService } from '../over-time-service/over-time.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OverTimePersonFormComponent } from './over-time-person-form/over-time-person-form.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-over-time-person',
  templateUrl: './over-time-person.component.html',
  styleUrls: ['./over-time-person.component.css'],
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
  ]
})
export class OverTimePersonComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_over_time_person', { static: false }) tbOverTimePersonRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  searchForm!: FormGroup;
  exportingExcel = false;
  sizeSearch: string = '0';
  isLoading = false;

  // Dropdown data for search
  typeList: any[] = [];

  // Data
  overTimeList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private overTimeService: OverTimeService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadTypes();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    // Load dữ liệu sau khi table đã được khởi tạo
    setTimeout(() => {
      this.loadOverTimeByEmployee();
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
      keyWord: ['']
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
  }

  loadTypes() {
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại làm thêm: ' + error.message);
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
      keyWord: ''
    });
    this.loadOverTimeByEmployee();
  }

  loadOverTimeByEmployee() {
    if (!this.tabulator) {
      return;
    }

    this.isLoading = true;
    const formValue = this.searchForm.value;

    const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
    const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;

    const request: any = {
      DateStart: startDate,
      DateEnd: endDate,
      KeyWord: formValue.keyWord || "",
      EmployeeID: 0, // Will be set by backend from current user
      IsApprove: formValue.status !== -1 ? formValue.status : -1,
      Type: formValue.type || 0
    };

    this.overTimeService.getOverTimeByEmployee(request).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data || [];
          this.overTimeList = data;
          this.tabulator.setData(data);
        } else {
          this.overTimeList = [];
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
    if (!this.tbOverTimePersonRef?.nativeElement) {
      return;
    }

    this.tabulator = new Tabulator(this.tbOverTimePersonRef.nativeElement, {
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
            // Kiểm tra status: có thể là boolean hoặc number (0/1/2)
            let status = row.IsApproved || row.IsApprovedTBP;
            if (row.StatusTBP !== null && row.StatusTBP !== undefined) {
              status = row.StatusTBP;
            }
            const numStatus = status === null || status === undefined ? 0 : (status === true ? 1 : (status === false ? 0 : Number(status)));
            
            switch (numStatus) {
              case 0:
                return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Chờ duyệt</span>';
              case 1:
                return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Đã duyệt</span>';
              case 2:
                return '<span class="badge bg-danger" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Không đồng ý duyệt</span>';
              default:
                return '<span class="badge bg-secondary" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Không xác định</span>';
            }
          }
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', width: 120, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const row = cell.getRow().getData();
            // Kiểm tra status: có thể là boolean hoặc number (0/1/2)
            let status = row.IsApprovedHR;
            if (row.StatusHR !== null && row.StatusHR !== undefined) {
              status = row.StatusHR;
            }
            const numStatus = status === null || status === undefined ? 0 : (status === true ? 1 : (status === false ? 0 : Number(status)));
            
            switch (numStatus) {
              case 0:
                return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Chờ duyệt</span>';
              case 1:
                return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Đã duyệt</span>';
              case 2:
                return '<span class="badge bg-danger" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Không đồng ý duyệt</span>';
              default:
                return '<span class="badge bg-secondary" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Không xác định</span>';
            }
          }
        },
        {
          title: 'Bổ sung', field: 'IsProblem', width: 80, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const row = cell.getRow().getData();
            const isProblem = row.IsProblem || false;
            const checked = isProblem ? 'checked' : '';
            return `<input type="checkbox" ${checked} onclick="return false;">`;
          }
        },
        {
          title: 'Họ tên', field: 'EmployeeFullName',bottomCalc: 'count', width: 120, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
         formatter: 'textarea'
        },
        {
          title: 'Trưởng phòng', field: 'ApprovedTBP', width: 120, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Nhân sự', field: 'ApprovedHR', width: 120, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            return value || '';
          }
        },
        {
          title: 'Loại', field: 'TypeName', width: 120, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            return value || (cell.getRow().getData().Type || '');
          }
        },
        {
          title: 'Ngày', field: 'DateRegister', width: 120, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            if (!value) return '';
            try {
              const dateValue = value instanceof Date ? value : (DateTime.fromISO(value).isValid ? DateTime.fromISO(value).toJSDate() : new Date(value));
              const formattedDate = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy');
              return `<span style="display: inline-block; padding: 4px 8px; background-color: #1677FF; color: white; border: 1px solid #0958d9; border-radius: 4px; text-align: center;">${formattedDate}</span>`;
            } catch {
              return '';
            }
          }
        },
        {
          title: 'Từ', field: 'TimeStart', width: 100, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            if (!value) return '';
            try {
              const dateValue = value instanceof Date ? value : (DateTime.fromISO(value).isValid ? DateTime.fromISO(value).toJSDate() : new Date(value));
              const formattedDate = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
              return `<div style="white-space: pre-wrap; word-wrap: break-word;">${formattedDate}</div>`;
              
            } catch {
              return '';
            }
          }
        },
        {
          title: 'Đến', field: 'EndTime', width: 100, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            if (!value) return '';
            try {
              const dateValue = value instanceof Date ? value : (DateTime.fromISO(value).isValid ? DateTime.fromISO(value).toJSDate() : new Date(value));
              const formattedDate = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
              return `<div style="white-space: pre-wrap; word-wrap: break-word;">${formattedDate}</div>`;
            } catch {
              return '';
            }
          }
        },
        {
          title: 'Dự án', field: 'ProjectName', width: 250, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Số giờ', field: 'TimeReality', width: 80, hozAlign: 'right', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea',
          bottomCalc: 'sum',
          bottomCalcParams: {
            precision: 2
          },
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined || isNaN(value)) return '0.00';
            return Number(value).toFixed(2);
          }
        },
        {
          title: 'Địa điểm', field: 'LocationText', width: 120, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            return value || (cell.getRow().getData().Location || '');
          }
        },
        {
          title: 'Lý do', field: 'Reason', width: 250, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Ăn tối', field: 'Overnight', width: 100, hozAlign: 'center', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const row = cell.getRow().getData();
            const overnight = row.Overnight || false;
            const checked = overnight ? 'checked' : '';
            return `<input type="checkbox" ${checked} onclick="return false;">`;
          }
        },
        {
          title: 'File bổ sung', field: 'FileName', width: 200, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const fileName = rowData.FileName || '';
            if (fileName) {
              return `<a href="javascript:void(0)" style="color: #1677ff; text-decoration: underline; cursor: pointer;">${fileName}</a>`;
            }
            return '';
          },
          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            if (rowData.FileName) {
              this.downloadFile(rowData);
            }
          }
        },
        {
          title: 'ID', field: 'ID', width: 150, visible: false, hozAlign: 'left', headerHozAlign: 'center', headerSort: false,
          formatter: 'textarea'
        },
      ],
    });

    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
    });

    // Set font-size 12px cho Tabulator
    setTimeout(() => {
      const tabulatorElement = this.tbOverTimePersonRef?.nativeElement;
      if (tabulatorElement) {
        tabulatorElement.style.fontSize = '12px';
        const allElements = tabulatorElement.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.style) {
            el.style.fontSize = '12px';
          }
        });

        const style = document.createElement('style');
        style.id = 'tabulator-over-time-person-font-size-override';
        style.textContent = `
          #tb_over_time_person,
          #tb_over_time_person.tabulator,
          #tb_over_time_person .tabulator,
          #tb_over_time_person .tabulator-table,
          #tb_over_time_person .tabulator-cell,
          #tb_over_time_person .tabulator-cell-content,
          #tb_over_time_person .tabulator-header,
          #tb_over_time_person .tabulator-col,
          #tb_over_time_person .tabulator-col-content,
          #tb_over_time_person .tabulator-col-title,
          #tb_over_time_person .tabulator-row,
          #tb_over_time_person .tabulator-row .tabulator-cell,
          #tb_over_time_person *:not(.badge) {
            font-size: 12px !important;
          }
          #tb_over_time_person .badge {
            font-size: 9px !important;
          }
        `;
        const existingStyle = document.getElementById('tabulator-over-time-person-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);
  }

  openAddModal() {
    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
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
          this.loadOverTimeByEmployee();
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
    
    // Kiểm tra trạng thái duyệt
    if (this.isApproved(selectedData)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể chỉnh sửa');
      return;
    }
    
    const formData = this.mapTableDataToFormData(selectedData);
    
    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.data = formData;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadOverTimeByEmployee();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  openDeleteModal(id?: number, timeStart?: string, endTime?: string) {
    if (id !== undefined && id > 0) {
      // Xóa từ cellClick - cần tìm row data từ ID
      const allData = this.overTimeList;
      const itemToDelete = allData.find(item => (item.ID || item.Id) === id);
      
      if (itemToDelete) {
        // Kiểm tra trạng thái duyệt
        if (this.isApproved(itemToDelete)) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể xóa');
          return;
        }
      }
      
      let timeStartFormatted = '';
      let endTimeFormatted = '';
      
      if (timeStart) {
        try {
          const dateValue = DateTime.fromISO(timeStart).isValid ? DateTime.fromISO(timeStart).toJSDate() : new Date(timeStart);
          timeStartFormatted = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
        } catch {
          timeStartFormatted = timeStart;
        }
      }
      
      if (endTime) {
        try {
          const dateValue = DateTime.fromISO(endTime).isValid ? DateTime.fromISO(endTime).toJSDate() : new Date(endTime);
          endTimeFormatted = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
        } catch {
          endTimeFormatted = endTime;
        }
      }

      const confirmText = `Bạn có thực sự muốn xóa làm thêm\n${timeStartFormatted ? `từ: ${timeStartFormatted}\n` : ''}${endTimeFormatted ? `đến: ${endTimeFormatted}` : ''}\nkhông?`;

      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: confirmText,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          this.deleteOverTime([id]);
        },
        nzCancelText: 'Hủy'
      });
      return;
    }

    // Xóa từ nút xóa (chọn nhiều row)
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());
    
    // Kiểm tra trạng thái duyệt cho tất cả các bản ghi đã chọn
    const approvedItems = selectedData.filter(item => this.isApproved(item));
    if (approvedItems.length > 0) {
      const fullNames = approvedItems.map(item => item['EmployeeFullName'] || item['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Có ${approvedItems.length} bản ghi đã được duyệt, không thể xóa:\n${fullNames}`
      );
      return;
    }
    
    const ids = selectedData.map(item => item['ID'] || item['Id']).filter((id: any) => id > 0);

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
        this.deleteOverTime(ids);
      },
      nzCancelText: 'Hủy'
    });
  }

  deleteOverTime(ids: number[]) {
    this.isLoading = true;
    
    // Lấy dữ liệu từ overTimeList hoặc từ selectedRows
    let dataToDelete: any[] = [];
    
    if (ids.length > 0) {
      // Tìm từ overTimeList
      dataToDelete = this.overTimeList.filter(item => {
        const itemId = item['ID'] || item['Id'];
        return ids.includes(itemId);
      });
    } else {
      // Lấy từ selectedRows
      const selectedRows = this.tabulator.getSelectedRows();
      dataToDelete = selectedRows.map(row => row.getData());
    }
    
    if (dataToDelete.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để xóa');
      this.isLoading = false;
      return;
    }
    
    // Kiểm tra lại trạng thái duyệt trước khi xóa
    const approvedItems = dataToDelete.filter(item => this.isApproved(item));
    if (approvedItems.length > 0) {
      const fullNames = approvedItems.map(item => item['EmployeeFullName'] || item['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi đã được duyệt, không thể xóa:\n${fullNames}`
      );
      this.isLoading = false;
      return;
    }
    
    // Chỉ gửi ID và IsDeleted
    const dto: any = {
      EmployeeOvertimes: dataToDelete.map(item => ({
        ID: item['ID'] || item['Id'] || 0,
        IsDeleted: true
      })),
      employeeOvertimeFile: null // Không xử lý file khi xóa bản ghi
    };

    this.overTimeService.saveDataEmployee(dto).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, `Xóa ${dataToDelete.length} bản ghi thành công`);
        this.loadOverTimeByEmployee();
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Xóa bản ghi thất bại: ' + error.message);
        this.isLoading = false;
        // Vẫn reload để cập nhật danh sách
        this.loadOverTimeByEmployee();
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
    
    // Kiểm tra trạng thái duyệt
    if (this.isApproved(selectedData)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể sao chép');
      return;
    }
    
    // Map dữ liệu từ table sang format của form
    const formData = this.mapTableDataToFormData(selectedData);
    
    // Tạo bản copy với ID = 0 và ngày mới
    const copyData = {
      ...formData,
      ID: 0,
      DateRegister: new Date()
    };

    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
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
          this.loadOverTimeByEmployee();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // Map dữ liệu từ table sang format của form
  private mapTableDataToFormData(tableData: any): any {
    return {
      ID: tableData.ID !== null && tableData.ID !== undefined ? tableData.ID : (tableData.Id !== null && tableData.Id !== undefined ? tableData.Id : 0),
      EmployeeID: tableData.EmployeeID || tableData.EmployeeId || 0,
      DateRegister: tableData.DateRegister || null,
      ApprovedID: tableData.ApprovedID || tableData.ApprovedId || null,
      TimeStart: tableData.TimeStart || null,
      EndTime: tableData.EndTime || null,
      Location: tableData.Location || tableData.LocationID || 0,
      TypeID: tableData.TypeID || tableData.Type || null,
      ProjectID: tableData.ProjectID || tableData.ProjectId || 0,
      Overnight: tableData.Overnight || false,
      Reason: tableData.Reason || '',
      ReasonHREdit: tableData.ReasonHREdit || '',
      IsProblem: tableData.IsProblem || false,
      FileName: tableData.FileName || ''
    };
  }

  async exportToExcel() {
    if (!this.tabulator) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
      return;
    }

    this.exportingExcel = true;

    try {
      const allData = this.overTimeList;
      
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

        const formatDateTime = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
          }
        };

        return {
          'STT': idx + 1,
          'TBP duyệt': item.StatusTBPText || (item.IsApproved || item.IsApprovedTBP ? 'Đã duyệt' : 'Chưa duyệt'),
          'HR duyệt': item.StatusHRText || (item.IsApprovedHR ? 'Đã duyệt' : 'Chưa duyệt'),
          'Bổ sung': item.IsProblem ? 'Có' : 'Không',
          'Họ tên': item.EmployeeFullName || item.FullName || '',
          'Trưởng phòng': item.ApprovedTBP || '',
          'Nhân sự': item.ApprovedHR || '',
          'Loại': item.TypeName || item.Type || '',
          'Ngày': formatDate(item.DateRegister),
          'Từ': formatDateTime(item.TimeStart),
          'Đến': formatDateTime(item.EndTime),
          'Dự án': item.ProjectName || '',
          'Số giờ': item.TimeReality || '',
          'Địa điểm': item.LocationText || item.Location || '',
          'Lý do': item.Reason || '',
          'Lý do không duyệt': item.ReasonDeciline || '',
          'Ăn tối': item.Overnight ? 'Có' : 'Không',
          'File bổ sung': item.FileName || ''
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DangKyLamThem');

      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 15 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 15 },
        { header: 'Bổ sung', key: 'Bổ sung', width: 12 },
        { header: 'Họ tên', key: 'Họ tên', width: 25 },
        { header: 'Trưởng phòng', key: 'Trưởng phòng', width: 20 },
        { header: 'Nhân sự', key: 'Nhân sự', width: 20 },
        { header: 'Loại', key: 'Loại', width: 20 },
        { header: 'Ngày', key: 'Ngày', width: 15 },
        { header: 'Từ', key: 'Từ', width: 20 },
        { header: 'Đến', key: 'Đến', width: 20 },
        { header: 'Dự án', key: 'Dự án', width: 25 },
        { header: 'Số giờ', key: 'Số giờ', width: 12 },
        { header: 'Địa điểm', key: 'Địa điểm', width: 20 },
        { header: 'Lý do', key: 'Lý do', width: 30 },
        { header: 'Lý do không duyệt', key: 'Lý do không duyệt', width: 30 },
        { header: 'Ăn tối', key: 'Ăn tối', width: 12 },
        { header: 'File bổ sung', key: 'File bổ sung', width: 25 },
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
      saveAs(blob, `DangKyLamThem_${startDateStr}_${endDateStr}.xlsx`);

    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }

  private formatApprovalBadge(status: any): string {
    // true: Đã duyệt, false/null: Chưa duyệt
    const isApproved = status === true || status === 1 || status === '1';
    
    if (isApproved) {
      return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Đã duyệt</span>';
    } else {
      return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 9px !important; padding: 2px 6px !important;">Chưa duyệt</span>';
    }
  }

  // Helper method để kiểm tra bản ghi đã được duyệt chưa
  private isApproved(item: any): boolean {
    // Kiểm tra trạng thái duyệt TBP: có thể là boolean hoặc number (0/1/2)
    let statusTBP = item['IsApproved'] || item['IsApprovedTBP'];
    if (item['StatusTBP'] !== null && item['StatusTBP'] !== undefined) {
      statusTBP = item['StatusTBP'];
    }
    const numStatusTBP = statusTBP === null || statusTBP === undefined ? 0 : (statusTBP === true ? 1 : (statusTBP === false ? 0 : Number(statusTBP)));
    
    // Kiểm tra trạng thái duyệt HR: có thể là boolean hoặc number (0/1/2)
    let statusHR = item['IsApprovedHR'];
    if (item['StatusHR'] !== null && item['StatusHR'] !== undefined) {
      statusHR = item['StatusHR'];
    }
    const numStatusHR = statusHR === null || statusHR === undefined ? 0 : (statusHR === true ? 1 : (statusHR === false ? 0 : Number(statusHR)));
    
    // Kiểm tra trạng thái duyệt Senior (nếu có)
    let statusSenior = item['IsSeniorApproved'];
    if (item['StatusSenior'] !== null && item['StatusSenior'] !== undefined) {
      statusSenior = item['StatusSenior'];
    }
    const numStatusSenior = statusSenior === null || statusSenior === undefined ? 0 : (statusSenior === true ? 1 : (statusSenior === false ? 0 : Number(statusSenior)));
    
    // Nếu TBP, HR hoặc Senior đã duyệt (status = 1) thì không cho sửa/xóa
    return numStatusTBP === 1 || numStatusHR === 1 || numStatusSenior === 1;
  }

  downloadFile(rowData: any) {
    const id = rowData.ID || rowData.Id || 0;
    if (!id || id <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID bản ghi');
      return;
    }

    this.isLoading = true;
    this.overTimeService.getEmployeeOverTimeByID(id).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          // API trả về: { employeeOverTime, overTimeFile }
          const overTimeFile = data.overTimeFile || null;
          
          if (!overTimeFile) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có file đính kèm');
            return;
          }

          let serverPath = overTimeFile.ServerPath || '';
          const fileName = overTimeFile.FileName || '';
          
          if (!fileName) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có tên file để tải xuống');
            return;
          }

          // Đảm bảo ServerPath không chứa tên file ở cuối
          // Nếu ServerPath kết thúc bằng fileName, loại bỏ fileName khỏi ServerPath
          if (serverPath && fileName) {
            const normalizedServerPath = serverPath.replace(/[\\/]+$/, ''); // Loại bỏ dấu \ hoặc / ở cuối
            const normalizedFileName = fileName.replace(/^[\\/]+/, ''); // Loại bỏ dấu \ hoặc / ở đầu
            if (normalizedServerPath.endsWith(normalizedFileName)) {
              serverPath = normalizedServerPath.substring(0, normalizedServerPath.length - normalizedFileName.length);
              serverPath = serverPath.replace(/[\\/]+$/, ''); // Loại bỏ dấu \ hoặc / ở cuối sau khi cắt
            }
          }

          // Ghép serverPath và fileName để tạo URL download
          // subPath là đường dẫn thư mục (không bao gồm tên file), fileName là tên file
          const downloadUrl = `${environment.host}api/home/download-by-key?key=LamThem&subPath=${encodeURIComponent(serverPath)}&fileName=${encodeURIComponent(fileName)}`;
          
          // Tạo link download và tự động click để tải file
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName; // Đặt tên file khi download
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lấy thông tin file');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file: ' + errorMessage);
      }
    });
  }
}


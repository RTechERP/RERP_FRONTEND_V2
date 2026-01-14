import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EmployeeNightShiftService } from '../employee-night-shift-service/employee-night-shift.service';
import { DepartmentServiceService } from '../../../department/department-service/department-service.service';
import { AuthService } from '../../../../../auth/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-employee-night-shift-person-summary',
  templateUrl: './employee-night-shift-person-summary.component.html',
  styleUrls: ['./employee-night-shift-person-summary.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzGridModule,
    NzSpinModule,
  ]
})
export class EmployeeNightShiftPersonSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_employee_night_shift_person_summary', { static: false }) tbEmployeeNightShiftPersonSummaryRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  searchForm!: FormGroup;
  departmentList: any[] = [];
  exportingExcel = false;
  sizeSearch: string = '0';
  currentUser: any = null;
  currentDepartmentId: number = 0;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private nightShiftService: EmployeeNightShiftService,
    private departmentService: DepartmentServiceService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartments();
    this.getCurrentUser();
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.currentDepartmentId = data?.DepartmentID || 0;
        // Cập nhật departmentId trong form sau khi lấy được currentUser
        if (this.searchForm) {
          this.searchForm.patchValue({
            departmentId: this.currentDepartmentId || 0
          });
        }
        // Reload table sau khi đã có currentUser
        if (this.tabulator) {
          this.tabulator.setData();
        }
      } else {
        // Nếu không lấy được user, vẫn reload table với giá trị mặc định
        if (this.tabulator) {
          this.tabulator.setData();
        }
      }
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  resetSearch() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.searchForm.reset({
      startDate: today,
      endDate: today,
      departmentId: this.currentDepartmentId || 0,
      status: -1,
      keyWord: '',
    });
    this.loadEmployeeNightShiftPerson();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  private initializeForm(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.searchForm = this.fb.group({
      startDate: [today],
      endDate: [today],
      departmentId: [this.currentDepartmentId || 0],
      status: -1,
      keyWord: '',
    });
  }

  loadEmployeeNightShiftPerson() {
    // Reload table với dữ liệu mới từ form
    if (this.tabulator) {
      this.tabulator.setData();
    }
  }

  private initializeTable(): void {
    if (!this.tbEmployeeNightShiftPersonSummaryRef?.nativeElement) {
      return;
    }
    this.tabulator = new Tabulator(this.tbEmployeeNightShiftPersonSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh', 
      ajaxURL: this.nightShiftService.getEmployeeNightShiftPersonAjax(),
      ajaxRequestFunc: (_url, _config, params) => {
        const formValue = this.searchForm.value;
        
        // Format dates: startDate 00:00:00, endDate 23:59:59
        let startDate: string | null = null;
        let endDate: string | null = null;
        
        if (formValue.startDate) {
          const start = new Date(formValue.startDate);
          start.setHours(0, 0, 0, 0);
          startDate = start.toISOString();
        }
        
        if (formValue.endDate) {
          const end = new Date(formValue.endDate);
          end.setHours(23, 59, 59, 999);
          endDate = end.toISOString();
        }

        // Map status: -1 (Tất cả) -> -1, 0 (Chưa duyệt) -> 0, 1 (Đã duyệt) -> 1
        const isApproved = formValue.status ?? -1;

        const request: any = {
          EmployeeID: 0,
          Page: params.page || 1,
          Size: 100000,
          KeyWord: formValue.keyWord || "",
          DateStart: startDate,
          DateEnd: endDate,
          IsApproved: isApproved,
          DepartmentID: formValue.departmentId || 0
        };
        return this.nightShiftService.getEmployeeNightShiftPerson(request).toPromise();
      },
      ajaxResponse: (url, params, res) => {
        // Response structure: { status: 1, data: { nightShiftdata: [...], TotalPage: [...] }, message: "..." }
        if (res && res.status === 1 && res.data) {
          const data = res.data.nightShiftdata || [];
          // TotalPage có thể là array hoặc number
          let totalPage = 1;
          if (res.data.TotalPage) {
            if (Array.isArray(res.data.TotalPage) && res.data.TotalPage.length > 0) {
              totalPage = res.data.TotalPage[0]?.TotalPage || res.data.TotalPage[0] || 1;
            } else if (typeof res.data.TotalPage === 'number') {
              totalPage = res.data.TotalPage;
            }
          }
          return {
            data: data,
            last_page: totalPage,
          };
        }
        // Trường hợp lỗi hoặc response không đúng format
        return {
          data: [],
          last_page: 1,
        };
      },
      columnCalcs: 'both',
      groupBy: 'DepartmentName',
      groupHeader: function (value, count, data, group) {
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " nhân viên)</span>";
      },
      columns: [
        {
          title: 'TBP duyệt', field: 'IsApprovedTBPText', hozAlign: 'center', headerHozAlign: 'center', width: 100, minWidth: 100, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'HR duyệt', field: 'IsApprovedHRText', hozAlign: 'center', headerHozAlign: 'center', width: 100, minWidth: 100, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false, frozen: true,
        },
        {
          title: 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 250, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true, bottomCalc: 'count',
        },
        {
          title: 'Ngày đăng ký', field: 'DateRegister', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
            } catch {
              const date = new Date(value);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          }
        },
        {
          title: 'Bắt đầu', field: 'DateStart', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
            } catch {
              const date = new Date(value);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          }
        },
        {
          title: 'Kết thúc', field: 'DateEnd', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
            } catch {
              const date = new Date(value);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          }
        },
        {
          title: 'Số giờ', field: 'TotalHours', hozAlign: 'right', headerHozAlign: 'center', width: 100, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value != null ? value.toString() : '';
          }
        },
        {
          title: 'Địa điểm', field: 'Location', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do không duyệt', field: 'ResonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 250, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
      ],
    });
    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
    });
    setTimeout(() => {
      const tabulatorElement = this.tbEmployeeNightShiftPersonSummaryRef?.nativeElement;
      if (tabulatorElement) {
        tabulatorElement.style.fontSize = '12px';
        const allElements = tabulatorElement.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.style) {
            el.style.fontSize = '12px';
          }
        });

        // Inject global style để đảm bảo
        const style = document.createElement('style');
        style.id = 'tabulator-employee-night-shift-person-summary-font-size-override';
        style.textContent = `
          #tb_employee_night_shift_person_summary,
          #tb_employee_night_shift_person_summary.tabulator,
          #tb_employee_night_shift_person_summary .tabulator,
          #tb_employee_night_shift_person_summary .tabulator-table,
          #tb_employee_night_shift_person_summary .tabulator-cell,
          #tb_employee_night_shift_person_summary .tabulator-cell-content,
          #tb_employee_night_shift_person_summary .tabulator-header,
          #tb_employee_night_shift_person_summary .tabulator-col,
          #tb_employee_night_shift_person_summary .tabulator-col-content,
          #tb_employee_night_shift_person_summary .tabulator-col-title,
          #tb_employee_night_shift_person_summary .tabulator-row,
          #tb_employee_night_shift_person_summary .tabulator-row .tabulator-cell,
          #tb_employee_night_shift_person_summary .tabulator-group-header,
          #tb_employee_night_shift_person_summary .tabulator-group-title,
          #tb_employee_night_shift_person_summary .tabulator-footer,
          #tb_employee_night_shift_person_summary .tabulator-paginator,
          #tb_employee_night_shift_person_summary .tabulator-paginator *,
          #tb_employee_night_shift_person_summary * {
            font-size: 12px !important;
          }
        `;
        // Remove existing style if any
        const existingStyle = document.getElementById('tabulator-employee-night-shift-person-summary-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);

    // Set lại font size mỗi khi data được load
    this.tabulator.on("dataLoaded", () => {
      setTimeout(() => {
        const tabulatorElement = this.tbEmployeeNightShiftPersonSummaryRef?.nativeElement;
        if (tabulatorElement) {
          tabulatorElement.style.fontSize = '12px';
          const allElements = tabulatorElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.fontSize = '12px';
            }
          });
        }
      }, 100);
    });
  }

  async exportToExcel() {
    if (!this.tabulator) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
      return;
    }

    this.exportingExcel = true;

    try {
      // Lấy tất cả dữ liệu từ server với pageSize lớn
      const formValue = this.searchForm.value;
      
      // Format dates: startDate 00:00:00, endDate 23:59:59
      let startDateISO: string | null = null;
      let endDateISO: string | null = null;
      
      if (formValue.startDate) {
        const start = new Date(formValue.startDate);
        start.setHours(0, 0, 0, 0);
        startDateISO = start.toISOString();
      }
      
      if (formValue.endDate) {
        const end = new Date(formValue.endDate);
        end.setHours(23, 59, 59, 999);
        endDateISO = end.toISOString();
      }
      
      const isApproved = formValue.status ?? -1;

      const request: any = {
        EmployeeID: 0,
        Page: 1,
        Size: 1000000, // Lấy tất cả dữ liệu
        KeyWord: formValue.keyWord || "",
        DateStart: startDateISO,
        DateEnd: endDateISO,
        IsApproved: isApproved,
        DepartmentID: formValue.departmentId || 0
      };

      const response = await this.nightShiftService.getEmployeeNightShiftPerson(request).toPromise();
      
      if (!response || response.status !== 1 || !response.data || !response.data.nightShiftdata) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const allData = response.data.nightShiftdata || [];
      
      if (allData.length === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      // Chuẩn bị dữ liệu xuất
      const exportData = allData
        .filter((item: any) => Object.keys(item).length > 0)
        .map((item: any, idx: number) => {
          // Format ngày tháng
          const formatDate = (val: any) => {
            if (!val) return '';
            try {
              return DateTime.fromISO(val).toFormat('dd/MM/yyyy');
            } catch {
              const date = new Date(val);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          };
          // Format checkbox - nếu true thì trả về 'X', còn không thì rỗng
          const formatCheckbox = (val: any) => {
            if (val === null || val === undefined || val === false || val === 'false' || val === 0 || val === '0' || val === '') {
              return '';
            }
            // Kiểm tra các trường hợp true
            if (val === true || val === 'true' || val === 1 || val === '1') {
              return 'X';
            }
            // Mặc định trả về rỗng
            return '';
          };
          return {
            'STT': idx + 1,
            'TBP duyệt': formatCheckbox(item.IsApprovedTBPText),
            'HR duyệt': formatCheckbox(item.IsApprovedHRText),
            'Mã nhân viên': item.Code || '',
            'Họ và tên': item.FullName || '',
            'Ngày đăng ký': formatDate(item.DateRegister),
            'Bắt đầu': formatDate(item.DateStart),
            'Kết thúc': formatDate(item.DateEnd),
            'Số giờ': item.TotalHours != null ? item.TotalHours : '',
            'Địa điểm': item.Location || '',
            'Ghi chú': item.Note || '',
            'Lý do không duyệt': item.ResonDeciline || '',
            'Phòng ban': item.DepartmentName || ''
          };
        });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('LamDem');

      // Thêm header
      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 20 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 20 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 20 },
        { header: 'Họ và tên', key: 'Họ và tên', width: 35 },
        { header: 'Ngày đăng ký', key: 'Ngày đăng ký', width: 18 },
        { header: 'Bắt đầu', key: 'Bắt đầu', width: 18 },
        { header: 'Kết thúc', key: 'Kết thúc', width: 18 },
        { header: 'Số giờ', key: 'Số giờ', width: 15 },
        { header: 'Địa điểm', key: 'Địa điểm', width: 25 },
        { header: 'Ghi chú', key: 'Ghi chú', width: 40 },
        { header: 'Lý do không duyệt', key: 'Lý do không duyệt', width: 40 },
        { header: 'Phòng ban', key: 'Phòng ban', width: 30 },
      ];

      // Thêm dữ liệu
      exportData.forEach((row: any) => worksheet.addRow(row));

      // Set font mặc định cho toàn bộ worksheet
      worksheet.eachRow((row: ExcelJS.Row) => {
        row.eachCell((cell: ExcelJS.Cell) => {
          if (!cell.font) {
            cell.font = { name: 'Times New Roman', size: 10};
          } else {
            cell.font = { ...cell.font, name: 'Times New Roman', size: 10 };
          }
        });
      });

      // Định dạng header
      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' } // Màu xanh #1677ff
        };
      });
      worksheet.getRow(1).height = 30;

      // Định dạng các dòng dữ liệu
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          // Căn giữa cho STT
          row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          row.getCell('STT').font = { name: 'Times New Roman', size: 10 };
          
          // Căn giữa cho các cột ngày tháng và checkbox
          ['Ngày đăng ký', 'Bắt đầu', 'Kết thúc', 'TBP duyệt', 'HR duyệt'].forEach((colName: string) => {
            const cell = row.getCell(colName);
            if (cell) {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.font = { name: 'Times New Roman', size: 10 };
            }
          });
          
          // Căn phải cho số giờ
          const totalHoursCell = row.getCell('Số giờ');
          if (totalHoursCell) {
            totalHoursCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
            totalHoursCell.font = { name: 'Times New Roman', size: 10 };
          }
          
          // Căn trái cho các cột chữ (các cột còn lại)
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            const headerValue = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
            if (colNumber !== 1 && 
                !['Ngày đăng ký', 'Bắt đầu', 'Kết thúc', 'Số giờ', 'TBP duyệt', 'HR duyệt'].includes(headerValue)) {
              cell.font = { name: 'Times New Roman', size: 10 };
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
          });
        }
      });

      // Auto width cho các cột (trừ các cột checkbox đã set width cố định)
      worksheet.columns.forEach((column: any, index: number) => {
        const headerValue = column.header ? column.header.toString() : '';
        
        // Giữ nguyên width cho các cột checkbox (TBP duyệt, HR duyệt)
        if (headerValue === 'TBP duyệt' || headerValue === 'HR duyệt') {
          column.width = 20; // Giữ width cố định
          return;
        }
        
        let maxLength = 10;
        maxLength = Math.max(maxLength, headerValue.length);

        column.eachCell({ includeEmpty: true }, (cell: any) => {
          if (cell.value !== null && cell.value !== undefined) {
            let cellValue = '';
            if (cell.value instanceof Date) {
              cellValue = cell.value.toLocaleDateString('vi-VN');
            } else {
              cellValue = cell.value.toString();
            }
            // Tính độ dài với wrapText (chia cho số dòng ước tính)
            const estimatedLines = Math.ceil(cellValue.length / (column.width || 20));
            maxLength = Math.max(maxLength, Math.ceil(cellValue.length / estimatedLines));
          }
        });

        // Set width hợp lý, tối thiểu 10, tối đa 50
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
      
      // Đảm bảo các cột checkbox có width đủ lớn sau khi auto width
      const tbpDuyetCol = worksheet.getColumn('TBP duyệt');
      const hrDuyetCol = worksheet.getColumn('HR duyệt');
      if (tbpDuyetCol) tbpDuyetCol.width = 20;
      if (hrDuyetCol) hrDuyetCol.width = 20;

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `TongHopLamDem_${startDateStr}_${endDateStr}.xls`);
      
   
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}


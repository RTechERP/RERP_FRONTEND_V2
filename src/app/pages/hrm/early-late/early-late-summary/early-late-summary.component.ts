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
import { EarlyLateService } from '../early-late-service/early-late.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { AuthService } from '../../../../auth/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-early-late-summary',
  templateUrl: './early-late-summary.component.html',
  styleUrls: ['./early-late-summary.component.css'],
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
export class EarlyLateSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_early_late_summary', { static: false }) tbEarlyLateSummaryRef!: ElementRef<HTMLDivElement>;

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
    private earlyLateService: EarlyLateService,
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
            departmentId: this.currentDepartmentId || null
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
      departmentId: this.currentDepartmentId || null,
      status: -1,
      keyWord: '',
      IDApprovedTP: 0
    });
    this.loadEmployeeEarlyLate();
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
      departmentId: [this.currentDepartmentId || null],
      status: -1,
      keyWord: '',
      IDApprovedTP: 0
    });
  }

  loadEmployeeEarlyLate() {
    // Reload table với dữ liệu mới từ form
    if (this.tabulator) {
      this.tabulator.setData();
    }
  }

  private initializeTable(): void {
    if (!this.tbEarlyLateSummaryRef?.nativeElement) {
      return;
    }
    this.tabulator = new Tabulator(this.tbEarlyLateSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh', 
      ajaxURL: this.earlyLateService.getEmployeeEarlyLatePersonAjax(),
      ajaxRequestFunc: (_url, _config, params) => {
        const formValue = this.searchForm.value;
        
        // Format dates: DateStart = 00:00:00, DateEnd = 23:59:59
        let startDate = null;
        let endDate = null;
        
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
        const statusValue = formValue.status ?? -1;

        const request: any = {
          Page: params.page || 1,
          Size: params.size || 50,
          Keyword: formValue.keyWord || "",
          DateStart: startDate,
          DateEnd: endDate,
          IDApprovedTP: formValue.IDApprovedTP || 0,
          Status: statusValue,
          DepartmentID: formValue.departmentId || 0
        };
        return this.earlyLateService.getEmployeeEarlyLatePerson(request).toPromise();
      },
      ajaxResponse: (url, params, res) => {
        // Response structure: { status: 1, data: { data: [...], TotalPages: [{ TotalPage: 139 }] }, message: "..." }
        if (res && res.status === 1 && res.data) {
          const data = res.data.data || [];
          // TotalPages là array chứa object có property TotalPage
          let totalPage = 1;
          if (res.data.TotalPages && Array.isArray(res.data.TotalPages) && res.data.TotalPages.length > 0) {
            totalPage = res.data.TotalPages[0]?.TotalPage || 1;
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
          title: 'TBP duyệt', field: 'IsApprovedTP', hozAlign: 'center', headerHozAlign: 'center', width: 50, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'HR duyệt', field: 'IsApproved', hozAlign: 'center', headerHozAlign: 'center', width: 50, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, headerSort: false, frozen: true,bottomCalc: 'count',
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true,
        },
        {
          title: 'Ngày đăng ký', field: 'DateRegister', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
            } catch {
              // Nếu không phải ISO format, thử parse như Date
              const date = new Date(value);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          }
        },
        {
          title: 'Thời gian (Phút)', field: 'TimeRegister', hozAlign: 'right', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value != null ? value.toString() : '';
          }
        },
        {
          title: 'Loại', field: 'TypeText', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false, formatter: 'textarea',
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 400, formatter: 'textarea', headerSort: false,
        },
      ],
    });
    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
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
      
      // Format dates: DateStart = 00:00:00, DateEnd = 23:59:59
      let startDateISO = null;
      let endDateISO = null;
      
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
      
      const statusValue = formValue.status ?? -1;

      const request: any = {
        Page: 1,
        Size: 1000000, // Lấy tất cả dữ liệu
        Keyword: formValue.keyWord || "",
        DateStart: startDateISO,
        DateEnd: endDateISO,
        IDApprovedTP: formValue.IDApprovedTP || 0,
        Status: statusValue,
        DepartmentID: formValue.departmentId || 0
      };

      const response = await this.earlyLateService.getEmployeeEarlyLatePerson(request).toPromise();
      
      if (!response || response.status !== 1 || !response.data || !response.data.data) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const allData = response.data.data || [];
      
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
            'TBP duyệt': formatCheckbox(item.IsApprovedTP),
            'HR duyệt': formatCheckbox(item.IsApproved || item.IsApprovedHR),
            'Mã nhân viên': item.Code || '',
            'Tên nhân viên': item.FullName || '',
            'Ngày đăng ký': formatDate(item.DateRegister),
            'Thời gian (Phút)': item.TimeRegister != null ? item.TimeRegister : '',
            'Loại': item.TypeText || '',
            'Lý do': item.Reason || ''
          };
        });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DiMuonVeSom');

      // Thêm header
      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 20 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 20 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 18 },
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30 },
        { header: 'Ngày đăng ký', key: 'Ngày đăng ký', width: 18 },
        { header: 'Thời gian (Phút)', key: 'Thời gian (Phút)', width: 18 },
        { header: 'Loại', key: 'Loại', width: 25 },
        { header: 'Lý do', key: 'Lý do', width: 40 },
      ];

      // Thêm dữ liệu
      exportData.forEach((row: any) => worksheet.addRow(row));

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
          ['Ngày đăng ký', 'TBP duyệt', 'HR duyệt'].forEach((colName: string) => {
            const cell = row.getCell(colName);
            if (cell) {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.font = { name: 'Times New Roman', size: 10 };
            }
          });
          
          // Căn phải cho số (Thời gian Phút)
          const timeRegisterCell = row.getCell('Thời gian (Phút)');
          if (timeRegisterCell) {
            timeRegisterCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
            timeRegisterCell.font = { name: 'Times New Roman', size: 10 };
          }
          
          // Căn trái cho các cột chữ (các cột còn lại)
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            const headerValue = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
            if (colNumber !== 1 && 
                !['Ngày đăng ký', 'Thời gian (Phút)', 'TBP duyệt', 'HR duyệt'].includes(headerValue)) {
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
      saveAs(blob, `TongHopDiMuonVeSom_${startDateStr}_${endDateStr}.xls`);
      
      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}


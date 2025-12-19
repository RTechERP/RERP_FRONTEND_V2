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
import { DayOffService } from '../day-off-service/day-off.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { AuthService } from '../../../../auth/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-person-day-off',
  templateUrl: './person-day-off.component.html',
  styleUrls: ['./person-day-off.component.css'],
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
export class PersonDayOffComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_person_day_off', { static: false }) tbPersonDayOffRef!: ElementRef<HTMLDivElement>;

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
    private dayOffService: DayOffService,
    private departmentService: DepartmentServiceService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartments();
    this.getCurrentUser();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
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
    this.loadEmployeeOnLeave();
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

  loadEmployeeOnLeave() {
    // Reload table với dữ liệu mới từ form
    if (this.tabulator) {
      this.tabulator.setData();
    }
  }

  private initializeTable(): void {
    if (!this.tbPersonDayOffRef?.nativeElement) {
      return;
    }
    this.tabulator = new Tabulator(this.tbPersonDayOffRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh', 
      ajaxURL: this.dayOffService.getEmployeeOnLeavePersonAjax(),
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
        return this.dayOffService.getEmployeeOnLeavePerson(request).toPromise();
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
      paginationMode: 'remote',
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 50,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
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
          title: 'HR duyệt', field: 'IsApprovedHR', hozAlign: 'center', headerHozAlign: 'center', width: 50, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'BGĐ duyệt', field: 'IsApprovedBGD', hozAlign: 'center', headerHozAlign: 'center', width: 50, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, headerSort: false, frozen: true,
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 180, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true,
        },
        {
          title: 'Người duyệt', field: 'ApprovedName', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Thời gian nghỉ', field: 'TimeOnLeaveText', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Ngày bắt đầu', field: 'StartDate', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Ngày kết thúc', field: 'EndDate', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Số ngày', field: 'TotalDay', hozAlign: 'right', headerHozAlign: 'center', width: 100, headerSort: false,bottomCalc: 'sum',
        },
        {
          title: 'Loại', field: 'TypeText', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerSort: false,
        },
        {
          title: 'Loại HR', field: 'TypeHR', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerSort: false,
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 500, formatter: 'textarea', headerSort: false,
        },
      
    
        {
          title: 'NV hủy đăng ký', field: 'IsCancelRegister', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'TBP duyệt hủy đăng ký', field: 'IsCancelTP', hozAlign: 'center', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'HR duyệt hủy đăng ký', field: 'IsCancelHR', hozAlign: 'center', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
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

      const response = await this.dayOffService.getEmployeeOnLeavePerson(request).toPromise();
      
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
          // Format ngày tháng với giờ
          const formatDateTime = (val: any) => {
            if (!val) return '';
            try {
              return DateTime.fromISO(val).toFormat('HH:mm dd/MM/yyyy');
            } catch {
              const date = new Date(val);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('HH:mm dd/MM/yyyy');
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
            'HR duyệt': formatCheckbox(item.IsApprovedHR),
            'BGĐ duyệt': formatCheckbox(item.IsApprovedBGD),
            'Mã nhân viên': item.Code || '',
            'Tên nhân viên': item.FullName || '',
            'Người duyệt': item.ApprovedName || '',
            'Thời gian nghỉ': item.TimeOnLeaveText || '',
            'Ngày bắt đầu': formatDateTime(item.StartDate),
            'Ngày kết thúc': formatDateTime(item.EndDate),
            'Số ngày': item.TotalDay != null ? item.TotalDay : '',
            'Loại': item.TypeText || '',
            'Loại HR': item.TypeHR || '',
            'Lý do': item.Reason || '',
            'NV hủy đăng ký': formatCheckbox(item.IsCancelRegister),
            'TBP duyệt hủy đăng ký': formatCheckbox(item.IsCancelTP),
            'HR duyệt hủy đăng ký': formatCheckbox(item.IsCancelHR)
          };
        });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('NgayNghiPhep');

      // Thêm header
      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 20 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 20 },
        { header: 'BGĐ duyệt', key: 'BGĐ duyệt', width: 20 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 25 },
        { header: 'Người duyệt', key: 'Người duyệt', width: 20 },
        { header: 'Thời gian nghỉ', key: 'Thời gian nghỉ', width: 18 },
        { header: 'Ngày bắt đầu', key: 'Ngày bắt đầu', width: 18 },
        { header: 'Ngày kết thúc', key: 'Ngày kết thúc', width: 18 },
        { header: 'Số ngày', key: 'Số ngày', width: 10 },
        { header: 'Loại', key: 'Loại', width: 20 },
        { header: 'Loại HR', key: 'Loại HR', width: 15 },
        { header: 'Lý do', key: 'Lý do', width: 30 },
        { header: 'NV hủy đăng ký', key: 'NV hủy đăng ký', width: 20 },
        { header: 'TBP duyệt hủy đăng ký', key: 'TBP duyệt hủy đăng ký', width: 20 },
        { header: 'HR duyệt hủy đăng ký', key: 'HR duyệt hủy đăng ký', width: 20 },
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
          try {
            const sttCell = row.getCell('STT');
            if (sttCell) {
              sttCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              sttCell.font = { name: 'Times New Roman', size: 10 };
            }
          } catch (e) {
            // Bỏ qua nếu không tìm thấy cột STT
          }
          
          // Căn giữa cho các cột ngày tháng và checkbox
          ['Ngày bắt đầu', 'Ngày kết thúc', 'TBP duyệt', 'HR duyệt', 'BGĐ duyệt', 'NV hủy đăng ký', 'TBP duyệt hủy đăng ký', 'HR duyệt hủy đăng ký'].forEach((colName: string) => {
            try {
              const cell = row.getCell(colName);
              if (cell) {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Times New Roman', size: 10 };
              }
            } catch (e) {
              // Bỏ qua nếu không tìm thấy cột
            }
          });
          
          // Căn phải cho số ngày
          try {
            const totalDayCell = row.getCell('Số ngày');
            if (totalDayCell) {
              totalDayCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
              totalDayCell.font = { name: 'Times New Roman', size: 10 };
            }
          } catch (e) {
            // Bỏ qua nếu không tìm thấy cột Số ngày
          }
          
          // Căn trái cho các cột còn lại
          row.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell, colNumber: number) => {
            try {
              const headerCell = worksheet.getRow(1).getCell(colNumber);
              if (!headerCell) return;
              
              const headerValue = headerCell.value?.toString() || '';
              if (colNumber !== 1 && 
                  !['Ngày bắt đầu', 'Ngày kết thúc', 'Số ngày', 'TBP duyệt', 'HR duyệt', 'BGĐ duyệt', 'NV hủy đăng ký', 'TBP duyệt hủy đăng ký', 'HR duyệt hủy đăng ký'].includes(headerValue)) {
                cell.font = { name: 'Times New Roman', size: 10 };
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
              }
            } catch (e) {
              // Bỏ qua nếu có lỗi
            }
          });
        }
      });

      // Auto width cho các cột (trừ các cột checkbox đã set width cố định)
      try {
        worksheet.columns.forEach((column: any, index: number) => {
          if (!column) return;
          
          const headerValue = column.header ? column.header.toString() : '';
          
          // Giữ nguyên width cho các cột checkbox
          const checkboxColumns = ['TBP duyệt', 'HR duyệt', 'BGĐ duyệt', 'NV hủy đăng ký', 'TBP duyệt hủy đăng ký', 'HR duyệt hủy đăng ký'];
          if (checkboxColumns.includes(headerValue)) {
            column.width = 20; // Giữ width cố định
            return;
          }
          
          let maxLength = 10;
          maxLength = Math.max(maxLength, headerValue.length);

          try {
            column.eachCell({ includeEmpty: false }, (cell: any) => {
              if (cell && cell.value !== null && cell.value !== undefined) {
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
          } catch (e) {
            // Bỏ qua nếu có lỗi khi duyệt cell
          }

          // Set width hợp lý, tối thiểu 10, tối đa 50
          if (column.width !== undefined) {
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
          }
        });
        
        // Đảm bảo các cột checkbox có width đủ lớn sau khi auto width
        const checkboxCols = ['TBP duyệt', 'HR duyệt', 'BGĐ duyệt', 'NV hủy đăng ký', 'TBP duyệt hủy đăng ký', 'HR duyệt hủy đăng ký'];
        checkboxCols.forEach((colName: string) => {
          const col = worksheet.getColumn(colName);
          if (col) col.width = 20;
        });
      } catch (e) {
        // Bỏ qua nếu có lỗi khi tính auto width
      }

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `TongHopQuanLyNghi_${startDateStr}_${endDateStr}.xls`);
      
   
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}


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
        
        // Format dates to ISO string
        const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
        const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;

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
          title: 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true,
        },
        {
          title: 'Người duyệt', field: 'ApprovedName', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true,
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
          title: 'Số ngày', field: 'TotalDay', hozAlign: 'right', headerHozAlign: 'center', width: 100, headerSort: false,
        },
        {
          title: 'Loại', field: 'TypeHR', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerSort: false,
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 500, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do hủy', field: 'ReasonCancel', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Ngày hủy', field: 'DateCancel', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
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

    let data = this.tabulator.getData();
    if (data == null || data.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
      return;
    }

    this.exportingExcel = true;

    try {
      // Chuẩn bị dữ liệu xuất từ tabulator
      const exportData = data
        .filter((item: any) => Object.keys(item).length > 0)
        .map((item: any, idx: number) => {
          // Format ngày tháng
          const formatDate = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
          return {
            'STT': idx + 1,
            'TBP duyệt': item.StatusText || '',
            'HR duyệt': item.StatusHRText || '',
            'BGĐ duyệt': item.IsApprovedBGD != null ? item.IsApprovedBGD : '',
            'Mã nhân viên': item.Code || '',
            'Họ và tên': item.FullName || '',
            'Phòng ban': item.DepartmentName || '',
            'Người duyệt': item.ApprovedName || '',
            'Thời gian nghỉ': item.TimeOnLeaveText || '',
            'Ngày bắt đầu': formatDate(item.StartDate),
            'Ngày kết thúc': formatDate(item.EndDate),
            'Số ngày': item.TotalDay != null ? item.TotalDay : '',
            'Loại': item.TypeHR || '',
            'Lý do': item.Reason || '',
            'Lý do sửa': item.ReasonHREdit || '',
            'Lý do hủy': item.ReasonCancel || '',
            'Lý do không đồng ý duyệt': item.ReasonDeciline || '',
            'Ngày hủy': formatDate(item.DateCancel),
            'NV hủy đăng kí': item.IsCancelRegister,
            'TBP duyệt hủy đăng kí': item.IsCancelTP,
            'HR duyệt hủy đăng kí': item.IsCancelHR
          };
        });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('NgayNghiPhep');

      // Thêm header
      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 15 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 15 },
        { header: 'BGĐ duyệt', key: 'BGĐ duyệt', width: 15 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
        { header: 'Họ và tên', key: 'Họ và tên', width: 25 },
        { header: 'Phòng ban', key: 'Phòng ban', width: 20 },
        { header: 'Người duyệt', key: 'Người duyệt', width: 20 },
        { header: 'Thời gian nghỉ', key: 'Thời gian nghỉ', width: 15 },
        { header: 'Ngày bắt đầu', key: 'Ngày bắt đầu', width: 15 },
        { header: 'Ngày kết thúc', key: 'Ngày kết thúc', width: 15 },
        { header: 'Số ngày', key: 'Số ngày', width: 10 },
        { header: 'Loại', key: 'Loại', width: 15 },
        { header: 'Lý do', key: 'Lý do', width: 25 },
        { header: 'Lý do sửa', key: 'Lý do sửa', width: 25 },
        { header: 'Lý do hủy', key: 'Lý do hủy', width: 25 },
        { header: 'Lý do không đồng ý duyệt', key: 'Lý do không đồng ý duyệt', width: 25 },
        { header: 'Ngày hủy', key: 'Ngày hủy', width: 15 },
        { header: 'NV hủy đăng kí', key: 'NV hủy đăng kí', width: 15 },
        { header: 'TBP duyệt hủy đăng kí', key: 'TBP duyệt hủy đăng kí', width: 15 },
        { header: 'HR duyệt hủy đăng kí', key: 'HR duyệt hủy đăng kí', width: 15 },
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
          
          // Căn giữa cho các cột ngày tháng
          ['Ngày bắt đầu', 'Ngày kết thúc', 'Ngày hủy'].forEach((colName: string) => {
            const cell = row.getCell(colName);
            if (cell) {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.font = { name: 'Times New Roman', size: 10 };
            }
          });
          
          // Căn phải cho số ngày
          const totalDayCell = row.getCell('Số ngày');
          if (totalDayCell) {
            totalDayCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
            totalDayCell.font = { name: 'Times New Roman', size: 10 };
          }
          
          // Căn trái cho các cột còn lại
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            const headerValue = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
            if (colNumber !== 1 && 
                !['Ngày bắt đầu', 'Ngày kết thúc', 'Ngày hủy', 'Số ngày'].includes(headerValue)) {
              cell.font = { name: 'Times New Roman', size: 10 };
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
          });
        }
      });

      // Auto width cho các cột
      worksheet.columns.forEach((column: any, index: number) => {
        let maxLength = 10;
        const headerValue = column.header ? column.header.toString() : '';
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

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `DangKyNghi_${startDateStr}_${endDateStr}.xlsx`);
      
      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}


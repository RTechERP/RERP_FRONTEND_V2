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
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { DepartmentServiceService } from '../../../department/department-service/department-service.service';
import { AuthService } from '../../../../../auth/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-employee-bussiness-person-summary',
  templateUrl: './employee-bussiness-person-summary.component.html',
  styleUrls: ['./employee-bussiness-person-summary.component.css'],
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
export class EmployeeBussinessPersonSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_employee_bussiness_person_summary', { static: false }) tbEmployeeBussinessPersonSummaryRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_employee_bussiness_summary', { static: false }) tbEmployeeBussinessSummaryRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  private summaryTabulator!: Tabulator;
  searchForm!: FormGroup;
  departmentList: any[] = [];
  exportingExcel = false;
  isLoadTable = false;
  sizeSearch: string = '0';
  currentUser: any = null;
  currentDepartmentId: number = 0;
  summaryData: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private bussinessService: EmployeeBussinessService,
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
          this.loadEmployeeBussinessPerson();
        }
      } else {
        // Nếu không lấy được user, vẫn reload table với giá trị mặc định
        if (this.tabulator) {
          this.loadEmployeeBussinessPerson();
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
    this.loadEmployeeBussinessPerson();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    // Load dữ liệu sau khi khởi tạo table
    setTimeout(() => {
      this.loadEmployeeBussinessPerson();
    }, 100);
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

  loadEmployeeBussinessPerson() {
    // Gọi API và load dữ liệu vào Tabulator
    if (!this.tabulator) {
      return;
    }

    this.isLoadTable = true; // Bắt đầu loading

    const formValue = this.searchForm.value;
    
    // Format dates to ISO string
    const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
    const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;

    // Map status: -1 (Tất cả) -> -1, 0 (Chưa duyệt) -> 0, 1 (Đã duyệt) -> 1
    const statusValue = formValue.status ?? -1;

    const request: any = {
      pageNumber: 1,
      pageSize: 1000000, // Lấy tất cả dữ liệu
      keyword: formValue.keyWord || "",
      dateStart: startDate,
      dateEnd: endDate,
      idApprovedTp: formValue.IDApprovedTP || 0,
      status: statusValue,
      departmentId: formValue.departmentId || 0
    };

    this.bussinessService.getEmployeeBussinessPerson(request).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data.result || [];
          // Set dữ liệu vào Tabulator
          this.tabulator.setData(data);
          
          // Lưu và cập nhật summary data
          this.summaryData = res.data.summary || [];
          if (this.summaryTabulator) {
            this.summaryTabulator.setData(this.summaryData);
          }
        } else {
          this.tabulator.setData([]);
          this.summaryData = [];
          if (this.summaryTabulator) {
            this.summaryTabulator.setData([]);
          }
        }
        this.isLoadTable = false; // Kết thúc loading
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.tabulator.setData([]);
        this.summaryData = [];
        if (this.summaryTabulator) {
          this.summaryTabulator.setData([]);
        }
        this.isLoadTable = false; // Kết thúc loading
      }
    });
  }

  private initializeTable(): void {
    if (!this.tbEmployeeBussinessPersonSummaryRef?.nativeElement) {
      return;
    }
    this.tabulator = new Tabulator(this.tbEmployeeBussinessPersonSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      paginationMode: 'local', // Local pagination
      data: [], // Khởi tạo với dữ liệu rỗng, sẽ được load sau
      columnCalcs: 'both',
      groupBy: 'DepartmentName',
 
      columns: [
        {
          title: 'Duyệt', field: 'IsApproved', hozAlign: 'center', headerHozAlign: 'center', width: 80, minWidth: 80, headerWordWrap: true, headerSort: false, frozen: true,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true,
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true, bottomCalc: 'count',
        },
        {
          title: 'Người duyệt', field: 'ApFullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Ngày công tác', field: 'DayBussiness', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
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
          title: 'Nơi công tác', field: 'Location', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Loại', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Phương tiện', field: 'VehicleName', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Check in', field: 'NotChekInText', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Tổng chi phí', field: 'TotalMoney', hozAlign: 'right', headerHozAlign: 'center', width: 150, headerWordWrap: true, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, visible: false,
        },
      ],
    });
    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
    });

    // Set font-size 12px cho Tabulator sau khi render
    setTimeout(() => {
      const tabulatorElement = this.tbEmployeeBussinessPersonSummaryRef?.nativeElement;
      if (tabulatorElement) {
        // Set style trực tiếp cho element
        tabulatorElement.style.fontSize = '12px';
        
        // Set style cho tất cả các phần tử con
        const allElements = tabulatorElement.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.style) {
            el.style.fontSize = '12px';
          }
        });

        // Inject global style để đảm bảo
        const style = document.createElement('style');
        style.id = 'tabulator-employee-bussiness-person-summary-font-size-override';
        style.textContent = `
          #tb_employee_bussiness_person_summary,
          #tb_employee_bussiness_person_summary.tabulator,
          #tb_employee_bussiness_person_summary .tabulator,
          #tb_employee_bussiness_person_summary .tabulator-table,
          #tb_employee_bussiness_person_summary .tabulator-cell,
          #tb_employee_bussiness_person_summary .tabulator-cell-content,
          #tb_employee_bussiness_person_summary .tabulator-header,
          #tb_employee_bussiness_person_summary .tabulator-col,
          #tb_employee_bussiness_person_summary .tabulator-col-content,
          #tb_employee_bussiness_person_summary .tabulator-col-title,
          #tb_employee_bussiness_person_summary .tabulator-row,
          #tb_employee_bussiness_person_summary .tabulator-row .tabulator-cell,
          #tb_employee_bussiness_person_summary .tabulator-group-header,
          #tb_employee_bussiness_person_summary .tabulator-group-title,
          #tb_employee_bussiness_person_summary .tabulator-footer,
          #tb_employee_bussiness_person_summary .tabulator-paginator,
          #tb_employee_bussiness_person_summary .tabulator-paginator *,
          #tb_employee_bussiness_person_summary * {
            font-size: 12px !important;
          }
        `;
        // Remove existing style if any
        const existingStyle = document.getElementById('tabulator-employee-bussiness-person-summary-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);

    // Set lại font size mỗi khi data được load
    this.tabulator.on("dataLoaded", () => {
      setTimeout(() => {
        const tabulatorElement = this.tbEmployeeBussinessPersonSummaryRef?.nativeElement;
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

    // Khởi tạo summary table
    this.initializeSummaryTable();
  }

  private initializeSummaryTable(): void {
    if (!this.tbEmployeeBussinessSummaryRef?.nativeElement) {
      return;
    }
    this.summaryTabulator = new Tabulator(this.tbEmployeeBussinessSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      paginationMode: 'local',
      rowHeader: false,
      data: this.summaryData,
      columns: [
        {
          title: 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Tổng chi phí', field: 'TotalCost', hozAlign: 'right', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            // Format số với dấu phẩy ngăn cách hàng nghìn
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
      ],
    });

    // Set font-size 12px cho Summary Tabulator
    setTimeout(() => {
      const tabulatorElement = this.tbEmployeeBussinessSummaryRef?.nativeElement;
      if (tabulatorElement) {
        tabulatorElement.style.fontSize = '12px';
        const allElements = tabulatorElement.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.style) {
            el.style.fontSize = '12px';
          }
        });

        const style = document.createElement('style');
        style.id = 'tabulator-employee-bussiness-summary-font-size-override';
        style.textContent = `
          #tb_employee_bussiness_summary,
          #tb_employee_bussiness_summary.tabulator,
          #tb_employee_bussiness_summary .tabulator,
          #tb_employee_bussiness_summary .tabulator-table,
          #tb_employee_bussiness_summary .tabulator-cell,
          #tb_employee_bussiness_summary .tabulator-cell-content,
          #tb_employee_bussiness_summary .tabulator-header,
          #tb_employee_bussiness_summary .tabulator-col,
          #tb_employee_bussiness_summary .tabulator-col-content,
          #tb_employee_bussiness_summary .tabulator-col-title,
          #tb_employee_bussiness_summary .tabulator-row,
          #tb_employee_bussiness_summary .tabulator-row .tabulator-cell,
          #tb_employee_bussiness_summary .tabulator-footer,
          #tb_employee_bussiness_summary .tabulator-paginator,
          #tb_employee_bussiness_summary .tabulator-paginator *,
          #tb_employee_bussiness_summary * {
            font-size: 12px !important;
          }
        `;
        const existingStyle = document.getElementById('tabulator-employee-bussiness-summary-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);
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
      const startDateISO = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
      const endDateISO = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;
      const statusValue = formValue.status ?? -1;

      const request: any = {
        pageNumber: 1,
        pageSize: 1000000, // Lấy tất cả dữ liệu
        keyword: formValue.keyWord || "",
        dateStart: startDateISO,
        dateEnd: endDateISO,
        idApprovedTp: formValue.IDApprovedTP || 0,
        status: statusValue,
        departmentId: formValue.departmentId || 0
      };

      const response = await this.bussinessService.getEmployeeBussinessPerson(request).toPromise();
      
      if (!response || response.status !== 1 || !response.data || !response.data.result) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const allData = Array.isArray(response.data.result) ? response.data.result : [];
      // Cập nhật summary data
      this.summaryData = response.data.summary || [];
      if (this.summaryTabulator) {
        this.summaryTabulator.setData(this.summaryData);
      }
      
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
          // Format số tiền
          const formatMoney = (val: any) => {
            if (val == null || val === undefined) return '';
            return new Intl.NumberFormat('vi-VN').format(Number(val));
          };
          return {
            'STT': idx + 1,
            'Duyệt': formatCheckbox(item.IsApproved),
            'Mã nhân viên': item.Code || '',
            'Tên nhân viên': item.FullName || '',
            'Người duyệt': item.ApFullName || '',
            'Ngày công tác': formatDate(item.DayBussiness),
            'Nơi công tác': item.Location || '',
            'Loại': item.TypeName || '',
            'Phương tiện': item.VehicleName || '',
            'Check in': item.NotChekInText || '',
            'Tổng chi phí': formatMoney(item.TotalMoney),
            'Ghi chú': item.Note || '',
            'Phòng ban': item.DepartmentName || ''
          };
        });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CongTac');

      // Thêm header
      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Duyệt', key: 'Duyệt', width: 20 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30 },
        { header: 'Người duyệt', key: 'Người duyệt', width: 30 },
        { header: 'Ngày công tác', key: 'Ngày công tác', width: 18 },
        { header: 'Nơi công tác', key: 'Nơi công tác', width: 25 },
        { header: 'Loại', key: 'Loại', width: 25 },
        { header: 'Phương tiện', key: 'Phương tiện', width: 20 },
        { header: 'Check in', key: 'Check in', width: 20 },
        { header: 'Tổng chi phí', key: 'Tổng chi phí', width: 18 },
        { header: 'Ghi chú', key: 'Ghi chú', width: 40 },
        { header: 'Phòng ban', key: 'Phòng ban', width: 25 },
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
          ['Ngày công tác', 'Duyệt'].forEach((colName: string) => {
            const cell = row.getCell(colName);
            if (cell) {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.font = { name: 'Times New Roman', size: 10 };
            }
          });
          
          // Căn phải cho cột Tổng chi phí
          const totalCostCell = row.getCell('Tổng chi phí');
          if (totalCostCell) {
            totalCostCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
            totalCostCell.font = { name: 'Times New Roman', size: 10 };
          }
          
          // Căn trái cho các cột chữ (các cột còn lại) - đảm bảo font size 10
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            const headerValue = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
            if (colNumber !== 1 && 
                !['Ngày công tác', 'Duyệt', 'Tổng chi phí'].includes(headerValue)) {
              cell.font = { name: 'Times New Roman', size: 10 };
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
          });
        }
      });

      // Auto width cho các cột (trừ các cột checkbox đã set width cố định)
      worksheet.columns.forEach((column: any, index: number) => {
        const headerValue = column.header ? column.header.toString() : '';
        
        // Giữ nguyên width cho các cột checkbox (Duyệt)
        if (headerValue === 'Duyệt') {
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
      const duyetCol = worksheet.getColumn('Duyệt');
      if (duyetCol) duyetCol.width = 20;

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `TongHopCongTac_${startDateStr}_${endDateStr}.xls`);
      
    
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}


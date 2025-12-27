import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { OverTimeService } from '../over-time-service/over-time.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { AuthService } from '../../../../auth/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-over-time-summary-person',
  templateUrl: './over-time-summary-person.component.html',
  styleUrls: ['./over-time-summary-person.component.css'],
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
    NzDatePickerModule,
    NzGridModule,
    NzSpinModule,
  ]
})
export class OverTimeSummaryPersonComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_over_time_person_summary', { static: false }) tbOverTimePersonSummaryRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_over_time_summary', { static: false }) tbOverTimeSummaryRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  private summaryTabulator!: Tabulator;
  searchForm!: FormGroup;
  departmentList: any[] = [];
  employeeList: any[] = [];
  teamList: any[] = [];
  exportingExcel = false;
  isLoadTable = false;
  sizeSearch: string = '0';
  currentUser: any = null;
  currentDepartmentId: number = 0;
  summaryData: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private overTimeService: OverTimeService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartments();
    this.loadEmployees();
    this.getCurrentUser();
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.currentDepartmentId = data?.DepartmentID || 0;
        if (this.searchForm) {
          this.searchForm.patchValue({
            departmentId: this.currentDepartmentId || null
          });
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

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
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
      filterText: '',
      idApprovedTP: 0,
      employeeId: 0,
      teamId: 0
    });
    
    if (this.tabulator) {
      this.tabulator.setData();
    }
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
      filterText: '',
      idApprovedTP: 0,
      employeeId: 0,
      teamId: 0
    });
  }

  onSearch() {
    if (this.tabulator) {
      this.tabulator.setPage(1);
      this.tabulator.setData();
    }
  }

  private initializeTable(): void {
    if (!this.tbOverTimePersonSummaryRef?.nativeElement) {
      return;
    }
    
    this.tabulator = new Tabulator(this.tbOverTimePersonSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 10000000,
      rowHeader: false,
      paginationSizeSelector: [10, 20, 30, 50, 100],
      ajaxURL: 'dummy',
      ajaxRequestFunc: (_url, _config, params) => {
        this.isLoadTable = true;
        const formValue = this.searchForm.value;
        
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

        const request: any = {
          filterText: formValue.filterText || "",
          page: params.page || 1,
          size: params.size || 30,
          dateStart: startDate,
          dateEnd: endDate,
          departmentID: formValue.departmentId || 0,
          idApprovedTP: formValue.idApprovedTP || 0,
          status: formValue.status ?? -1,
          employeeID: formValue.employeeId || 0,
          teamID: formValue.teamId || 0
        };

        return this.overTimeService.getSummaryOverTimePerson(request).toPromise();
      },
      ajaxResponse: (_url, _params, response) => {
        this.isLoadTable = false;
        if (response && response.status === 1 && response.data) {
          this.summaryData = response.data.summaryPerson || [];
          if (this.summaryTabulator) {
            this.summaryTabulator.setData(this.summaryData);
          }
          
          const dataArray = response.data.data || [];
          const totalPages = dataArray.length > 0 ? (dataArray[0].TotalPage || 1) : 1;
          
          return {
            data: dataArray,
            last_page: totalPages
          };
        }
        this.summaryData = [];
        if (this.summaryTabulator) {
          this.summaryTabulator.setData([]);
        }
        return {
          data: [],
          last_page: 1
        };
      },
      columnCalcs: 'both',
      groupBy: 'DepartmentName',
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 70,
          headerSort: false,
          frozen: true,
          formatter: 'rownum'
        },
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          headerSort: false,
          formatter: 'tickCross',
         
        },
        {
          title: 'Tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
          frozen: true,
        },
        {
          title: 'Ngày',
          field: 'DateRegister',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 120,
          headerSort: false,
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
          title: 'Từ',
          field: 'TimeStart',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 150,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
            } catch {
              return value;
            }
          }
        },
        {
          title: 'Đến',
          field: 'EndTime',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 150,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
            } catch {
              return value;
            }
          }
        },
        {
          title: 'Số giờ',
          field: 'TimeReality',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 100,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(Number(value));
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(Number(value));
          }
        },
        {
          title: 'Địa điểm',
          field: 'LocationText',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Lý do',
          field: 'Reason',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            return `<a href="#" onclick="event.preventDefault(); window.open('${value}', '_blank')">${value}</a>`;
          }
        },
        {
          title: 'Loại',
          field: 'Type',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
          headerSort: false,
        },
    
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
          visible: false,
        },
      ],
    });

    this.tabulator.on("pageLoaded", () => {
      this.tabulator.redraw();
    });

    this.initializeSummaryTable();
  }

  private initializeSummaryTable(): void {
    if (!this.tbOverTimeSummaryRef?.nativeElement) {
      return;
    }
    this.summaryTabulator = new Tabulator(this.tbOverTimeSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      rowHeader: false,
      paginationSize: 10000000,
      paginationMode: 'local',
      data: this.summaryData,
      columns: [
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            return `Tổng: ${value} người`;
          }
        },
        {
          title: 'Số giờ đăng ký',
          field: 'HourSummary',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 120,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
          }
        },
        {
          title: 'Số giờ được hưởng',
          field: 'TotalBenefitPeriod',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 120,
          headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '';
            return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
          }
        },
      ],
    });
  }

  async exportToExcel() {
    if (!this.tabulator) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
      return;
    }

    this.exportingExcel = true;

    try {
      // Lấy data trực tiếp từ Tabulator
      const tabulatorData = this.tabulator.getData();
      
      if (!tabulatorData || tabulatorData.length === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

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
          return val;
        }
      };
      
      const formatNumber = (val: any) => {
        if (val == null || val === undefined) return '';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(Number(val));
      };

      // Map data từ Tabulator sang format Excel
      const exportData = tabulatorData.map((item: any, idx: number) => ({
        'STT': idx + 1,
      
        'Tên nhân viên': item.FullName || '',
        'Phòng ban': item.DepartmentName || '',
        'Ngày': formatDate(item.DateRegister),
        'Từ': formatDateTime(item.TimeStart),
        'Đến': formatDateTime(item.EndTime),
        'Số giờ': formatNumber(item.TimeReality),
        'Địa điểm': item.LocationText || '',
        'Lý do': item.Reason || '',
        'Loại': item.Type || ''
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TongHopLamThem');

      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8 },
     
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30 },
        { header: 'Phòng ban', key: 'Phòng ban', width: 25 },
        { header: 'Ngày', key: 'Ngày', width: 18 },
        { header: 'Từ', key: 'Từ', width: 20 },
        { header: 'Đến', key: 'Đến', width: 20 },
        { header: 'Số giờ', key: 'Số giờ', width: 15 },
        { header: 'Địa điểm', key: 'Địa điểm', width: 30 },
        { header: 'Lý do', key: 'Lý do', width: 30 },
        { header: 'Loại', key: 'Loại', width: 15 },
      ];

      exportData.forEach((row: any) => worksheet.addRow(row));

      // Style cho header
      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }
        };
      });
      worksheet.getRow(1).height = 30;

      // Style cho data rows
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            cell.font = { name: 'Times New Roman', size: 10 };
            cell.alignment = { 
              horizontal: colNumber === 8 ? 'right' : 'left',
              vertical: 'middle', 
              wrapText: true
            };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `TongHopLamThem_${startDateStr}_${endDateStr}.xlsx`);
      
      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}

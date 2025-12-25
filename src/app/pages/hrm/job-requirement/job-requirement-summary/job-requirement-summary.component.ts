import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-job-requirement-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './job-requirement-summary.component.html',
  styleUrl: './job-requirement-summary.component.css'
})
export class JobRequirementSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('summaryTable', { static: false }) summaryTableElement!: ElementRef;

  summaryTable: Tabulator | null = null;
  isLoading: boolean = false;

  // Filter params
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  request: string = '';
  employeeID: number = 0;
  step: number = 0;
  departmentID: number = 0;

  // Data
  summaryData: any[] = [];
  employeeList: any[] = [];
  departmentList: any[] = [];
  stepList: any[] = [
    { value: 0, label: 'Tất cả' },
    { value: 1, label: 'NV đề nghị' },
    { value: 2, label: 'TBP xác nhận' },
    { value: 3, label: 'HR check hồ sơ' },
    { value: 4, label: 'TBP HR xác nhận' },
    { value: 5, label: 'Ban giám đốc xác nhận' },
    { value: 6, label: 'Phòng mua hàng hoặc P.HCNS triển khai' }
  ];

  constructor(
    private notification: NzNotificationService,
    private jobRequirementService: JobRequirementService,
    public activeModal: NgbActiveModal
  ) {
    // Set default dates: đầu tháng hiện tại đến cuối tháng hiện tại
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  ngOnInit() {
    this.loadEmployeeList();
    this.loadDepartmentList();
  }

  loadEmployeeList() {
    this.jobRequirementService.getAllEmployee().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.employeeList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.employeeList = [];
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải danh sách nhân viên!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  loadDepartmentList() {
    this.jobRequirementService.getDataDepartment().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.departmentList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.departmentList = [];
        }
        this.loadData();
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải danh sách phòng ban!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
        this.loadData();
      }
    });
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  loadData() {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn khoảng thời gian!'
      );
      return;
    }

    this.isLoading = true;
    this.jobRequirementService.getSummaryJobRequirement(
      this.dateStart!,
      this.dateEnd!,
      this.request || '',
      this.employeeID || 0,
      this.step || 0,
      this.departmentID || 0
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          this.summaryData = Array.isArray(response.data) ? response.data : [];
        } else {
          this.summaryData = [];
        }
        if (this.summaryTable) {
          this.summaryTable.setData(this.summaryData);
        } else {
          this.drawTable();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  resetSearch() {
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.request = '';
    this.employeeID = 0;
    this.step = 0;
    this.departmentID = 0;
    this.loadData();
  }

  exportToExcel() {
    if (!this.summaryTable || this.summaryData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tổng hợp yêu cầu công việc');

      // Định nghĩa tất cả các cột cần xuất (đồng bộ với columns trong drawTable)
      const exportColumns = [
        { title: 'STT', field: '', isRowNum: true },
        { title: 'Yêu cầu mua', field: 'IsRequestBuy', isCheckbox: true },
        { title: 'Trạng thái', field: 'StatusText' },
        { title: 'Mã yêu cầu', field: 'NumberRequest' },
        { title: 'Ngày yêu cầu', field: 'DateRequest', isDate: true },
        { title: 'Tên nhân viên', field: 'EmployeeName' },
        { title: 'Bộ phận yêu cầu', field: 'EmployeeDepartment' },
        { title: 'Bộ phận được yêu cầu', field: 'RequiredDepartment' },
        { title: 'Bộ phận phối hợp', field: 'CoordinationDepartment' },
        { title: 'Trạng thái duyệt', field: 'IsApprovedText' },
        { title: 'Thời gian hoàn thành', field: 'DeadlineRequest', isDate: true },
        { title: 'Đề mục', field: 'Category' },
        { title: 'Diễn giải', field: 'Description' },
        { title: 'Mục tiêu cần đạt', field: 'Target' },
        { title: 'Ghi chú', field: 'Note' },
      ];

      const headers = exportColumns.map(col => col.title);

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
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 30;

      // Add data rows
      this.summaryData.forEach((row: any, index: number) => {
        const rowData = exportColumns.map(col => {
          // STT column
          if (col.isRowNum) {
            return index + 1;
          }
          
          const value = row[col.field];
          
          // Checkbox columns
          if (col.isCheckbox) {
            return (value === true || value === 'true' || value === 1 || value === '1') ? 'Có' : 'Không';
          }
          
          // Date columns
          if (col.isDate && value) {
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
            } catch {
              return value || '';
            }
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
      worksheet.columns.forEach((column: any) => {
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
        const fileName = `Tong_hop_yeu_cau_cong_viec_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
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

  private drawTable(): void {
    if (this.summaryTable) {
      this.summaryTable.setData(this.summaryData || []);
    } else {
      // Helper function for checkbox formatter
      const checkboxFormatter = (cell: any) => {
        const value = cell.getValue();
        const checked = value === true || value === 'true' || value === 1 || value === '1';
        return `<div style='text-align:center'><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
      };

      // Helper function for date formatter
      const dateFormatter = (cell: any) => {
        const value = cell.getValue();
        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
      };

      // Helper function for number formatter
      const numberFormatter = (cell: any) => {
        const value = cell.getValue();
        if (value === null || value === undefined || value === '') return '';
        return typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
      };

      this.summaryTable = new Tabulator(this.summaryTableElement.nativeElement, {
        data: this.summaryData || [],
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        height: '84vh',
        rowHeader: false,
        layout: 'fitDataStretch',
        columns: [
          {
            title: 'STT',
          formatter:'rownum',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 60,
            frozen: true,
          },
          {
            title: 'Yêu cầu mua',
            field: 'IsRequestBuy',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            frozen: true,
            formatter: checkboxFormatter,
          },
          {
            title: 'Trạng thái',
            field: 'StatusText',
            headerHozAlign: 'center',
            width: 120,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Mã yêu cầu',
            field: 'NumberRequest',
            headerHozAlign: 'center',
            width: 150,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Ngày yêu cầu',
            field: 'DateRequest',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
            formatter: dateFormatter,
          },
          {
            title: 'Tên nhân viên',
            field: 'EmployeeName',
            headerHozAlign: 'center',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Bộ phận yêu cầu',
            field: 'EmployeeDepartment',
            headerHozAlign: 'center',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Bộ phận được yêu cầu',
            field: 'RequiredDepartment',
            headerHozAlign: 'center',
            width: 170,
            formatter: 'textarea',
          },
          {
            title: 'Bộ phận phối hợp',
            field: 'CoordinationDepartment',
            headerHozAlign: 'center',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Trạng thái duyệt',
            field: 'IsApprovedText',
            headerHozAlign: 'center',
            width: 130,
            formatter: 'textarea',
          },
          {
            title: 'Thời gian hoàn thành',
            field: 'DeadlineRequest',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            formatter: dateFormatter,
          },
          {
            title: 'Đề mục',
            field: 'Category',
            headerHozAlign: 'center',
            width: 200,
            formatter: 'textarea',
          },
          {
            title: 'Diễn giải',
            field: 'Description',
            headerHozAlign: 'center',
            width: 250,
            formatter: 'textarea',
          },
          {
            title: 'Mục tiêu cần đạt',
            field: 'Target',
            headerHozAlign: 'center',
            width: 200,
            formatter: 'textarea',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            widthGrow: 1,
            formatter: 'textarea',
          },
        ],
      });

      // Set font-size
      setTimeout(() => {
        const tableElement = this.summaryTableElement.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
        }
      }, 200);
    }
  }
}

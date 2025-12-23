import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DateTime } from 'luxon';
import { EmployeeService } from '../employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

@Component({
  selector: 'app-employee-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzSplitterModule,
  ],
  templateUrl: './employee-contact.component.html',
  styleUrl: './employee-contact.component.css'
})
export class EmployeeContactComponent implements OnInit, AfterViewInit {
  @ViewChild('contactTable') tableRef!: ElementRef;

  keyword: string = '';
  contactData: any[] = [];
  contactTable: Tabulator | null = null;
  totalEmployees: number = 0;

  constructor(
    private employeeService: EmployeeService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.loadContactData();
  }

  ngAfterViewInit(): void {
    this.drawContactTable();
  }

  /**
   * Load dữ liệu liên hệ nhân viên
   */
  loadContactData(): void {
    this.employeeService.getAllContact(0, this.keyword).subscribe({
      next: (response: any) => {
        this.contactData = response.data || [];
        this.totalEmployees = this.contactData.length;
        
        if (this.contactTable) {
          this.contactTable.setData(this.contactData);
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
        );
      }
    });
  }

  /**
   * Tìm kiếm theo từ khóa
   */
  onSearch(): void {
    this.loadContactData();
  }

  /**
   * Vẽ bảng Tabulator
   */
  private drawContactTable(): void {
    if (this.contactTable) {
      this.contactTable.setData(this.contactData);
      return;
    }

    // Tính scale screen
    const screenWidth = window.screen.width;
    const baseWidth = 1920;
    const scaleX = screenWidth / baseWidth;
    const scale = Math.min(scaleX, 1);
    const width = scale !== 1 ? 300 : 0;

    this.contactTable = new Tabulator(this.tableRef.nativeElement, {
      data: this.contactData,
      layout: 'fitDataStretch',
      height: '100%',
      groupBy: ['DepartmentName', 'EmployeeTeamName'],
      groupClosedShowCalcs: false,
      columnCalcs: 'table',
      columnDefaults: {
        vertAlign: 'middle',
        headerHozAlign: 'center',
        headerWordWrap: true,
        hozAlign: 'center',
      },
      columns: [
        {
          title: 'STT',
          field: 'STT',
          width: 70,
          frozen: true,
          formatter: 'textarea',
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width: 100,
          frozen: true,
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Họ tên',
          field: 'FullName',
          width: 250,
          frozen: true,
          formatter: 'textarea',
          hozAlign: 'left',
        },
        {
          title: 'Phòng ban',
          width: 200,
          field: 'DepartmentName',
          formatter: 'textarea',
          hozAlign: 'left',
        },
        {
          title: 'Chức vụ',
          field: 'ChucVu',
          width: width || 200,
          formatter: 'textarea',
          hozAlign: 'left',
        },
        {
          title: 'Điện thoại',
          field: 'SDTCaNhan',
          width: 200,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            const listSdt = value.split('\n');
            let html = '';
            listSdt.forEach((item: string, i: number) => {
              const separator = listSdt.length <= 1 ? '' : (i % 2 === 0 ? '<br/>' : '');
              html += `<a href="tel:${item}">${item}</a> ${separator}`;
            });
            return html;
          },
          hozAlign: 'left',
        },
        {
          title: 'Email',
          field: 'EmailCongTy',
          width: 300,
          formatter: 'textarea',
          hozAlign: 'left',
        },
        {
          title: 'Ngày vào',
          field: 'StartWorking',
          width: 100,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
          accessorDownload: (value: any) => {
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Năm sinh',
          field: 'BirthOfDate',
          width: 100,
          formatter: (cell: any) => {
            const value = cell.getValue() || '';
            return value ? DateTime.fromISO(value).toFormat('yyyy') : '';
          },
          accessorDownload: (value: any) => {
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
      ],
      rowFormatter: (row: any) => {
        const data = row.getData();
        const position = data.ChucVu || '';
        if (position.includes('Intern')) {
          row.getElement().style.backgroundColor = '#a5c4e7';
        }
      },
    });

    // Set group header
    this.contactTable.setGroupHeader((value: any, count: number) => {
      return `${value} (${count} NS)`;
    });
  }

  /**
   * Xuất Excel
   */
  onExportExcel(): void {
    if (!this.contactTable) return;

    const currentMonth = DateTime.now().toFormat('MM-yy');
    this.contactTable.download('xlsx', `DanhSachLienHeNhanVien_T${currentMonth}.xlsx`, {
      sheetName: 'THÔNG TIN LIÊN HỆ',
      documentProcessing: (workbook: any) => {
        const ws_name = workbook.SheetNames[0];
        const ws = workbook.Sheets[ws_name];

        // Setting column width
        const wscols = [
          { wch: 7 },   // STT
          { wch: 10 },  // Mã NV
          { wch: 25 },  // Họ tên
          { wch: 20 },  // Phòng ban
          { wch: 50 },  // Chức vụ
          { wch: 20 },  // Điện thoại
          { wch: 30 },  // Email
          { wch: 10 },  // Ngày vào
          { wch: 10 },  // Năm sinh
        ];

        ws['!cols'] = wscols;
        ws['!autofilter'] = { ref: 'A1:I1' };

        return workbook;
      },
    });
  }
}

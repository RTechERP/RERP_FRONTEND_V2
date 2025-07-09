import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DayOffService } from '../day-off-service/day-off.service';


@Component({
  selector: 'app-summary-day-off',
  templateUrl: './summary-day-off.component.html',
  styleUrls: ['./summary-day-off.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
  ]
})
export class SummaryDayOffComponent implements OnInit {

  private tabulator!: Tabulator;

  searchForm!: FormGroup;
  summaryDayOff: any[] = [];
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private dayOffService: DayOffService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.initializeTabulator();
    this.loadSummaryDayOff();
  }

  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]],
      keyWord: ''
    });

  }

  loadSummaryDayOff() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    const keyWord = this.searchForm.get('keyWord')?.value;

    this.dayOffService.getSummaryEmployeeOnLeave(month, year, keyWord).subscribe({
      next: (data) => {
        this.summaryDayOff = data.data;
        this.tabulator.setData(this.summaryDayOff);
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải  danh sách ')
      }
      
    })
  }

  resetSearch() {
    this.initializeForm();
    this.loadSummaryDayOff();
  }


  private initializeTabulator(): void {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value || new Date().getFullYear();
    
    this.tabulator = new Tabulator('#tb_summary_day_off', {
      data: this.summaryDayOff,
      selectableRows: 1,
      layout: 'fitDataStretch',
      height: '80vh',
      columns: [
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tổng không lương', field: 'totalKhongLuong', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tổng nghỉ phép', field: 'totalNghiPhep', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tổng có hưởng lương', field: 'totalCoHuongLuong', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tổng ngày nghỉ', field: 'totalDayOnleave', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '1', field: 'D1', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '2', field: 'D2', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '3', field: 'D3', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '4', field: 'D4', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '5', field: 'D5', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '6', field: 'D6', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '7', field: 'D7', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '8', field: 'D8', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '9', field: 'D9', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '10', field: 'D10', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '11', field: 'D11', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '12', field: 'D12', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '13', field: 'D13', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '14', field: 'D14', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '15', field: 'D15', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '16', field: 'D16', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '17', field: 'D17', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '18', field: 'D18', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '19', field: 'D19', hozAlign: 'left', headerHozAlign: 'center'},
        { title: '20', field: 'D20', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '21', field: 'D21', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '22', field: 'D22', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '23', field: 'D23', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '24', field: 'D24', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '25', field: 'D25', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '26', field: 'D26', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '27', field: 'D27', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '28', field: 'D28', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '29', field: 'D29', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '30', field: 'D30', hozAlign: 'left', headerHozAlign: 'center' },
        { title: '31', field: 'D31', hozAlign: 'left', headerHozAlign: 'center' },
      ],
    });
  }

  async exportToExcel() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    // Chuẩn bị dữ liệu xuất
    const exportData = this.summaryDayOff.map((item: any, idx: number) => {
      const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
      const row: any = {
        'Mã nhân viên': safe(item.Code),
        'Họ và tên': safe(item.FullName),
        'Chức vụ': safe(item.PositionName),
        'Tổng không lương': safe(item.totalKhongLuong),
        'Tổng nghỉ phép': safe(item.totalNghiPhep),
        'Tổng có hưởng lương': safe(item.totalCoHuongLuong),
        'Tổng ngày nghỉ': safe(item.totalDayOnleave),
      };
      // Thêm các cột ngày động từ D1 đến D31 (tùy tháng)
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = `D${i}`;
        row[`Ngày ${i}`] = safe(item[dayKey]);
      }
      return row;
    });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Báo cáo nghỉ phép T${month}_${year}`);
    // Cấu hình cột
    const columns = [
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 25 },
      { header: 'Chức vụ', key: 'Chức vụ', width: 20 },
      { header: 'Tổng không lương', key: 'Tổng không lương', width: 15 },
      { header: 'Tổng nghỉ phép', key: 'Tổng nghỉ phép', width: 15 },
      { header: 'Tổng có hưởng lương', key: 'Tổng có hưởng lương', width: 18 },
      { header: 'Tổng ngày nghỉ', key: 'Tổng ngày nghỉ', width: 15 },
    ];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      columns.push({ header: `Ngày ${i}`, key: `Ngày ${i}`, width: 8 });
    }
    worksheet.columns = columns;
    // Header chính của bảng (dòng 1)
    const headerRow = worksheet.getRow(1);
    headerRow.values = [
      'Mã nhân viên', 'Họ và tên', 'Chức vụ', 'Tổng không lương', 'Tổng nghỉ phép', 'Tổng có hưởng lương', 'Tổng ngày nghỉ',
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    headerRow.height = 30;
    // Thêm dữ liệu (bắt đầu từ dòng 2)
    exportData.forEach(row => {
      const newRow = worksheet.addRow(row);
      newRow.height = 25;
    });
    // Định dạng các dòng dữ liệu
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber > 1) {
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
      }
    });
    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BaoCaoNghiPhep_T${month}_${year}.xlsx`);
  }

}

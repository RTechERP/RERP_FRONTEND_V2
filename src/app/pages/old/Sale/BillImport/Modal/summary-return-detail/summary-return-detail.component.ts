import { Component, ElementRef, Input, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { DateTime } from 'luxon';
import { HistoryBorrowSaleService } from '../../../HistoryBorrowSale/history-borrow-sale-service/history-borrow-sale.service';

@Component({
  selector: 'app-summary-return-detail',
  standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      NzModalModule,
      NzSelectModule,
      NzSplitterModule,
      NzIconModule,
      NzButtonModule,
      NzProgressModule,
      NzInputModule,
      NzFormModule,
      NzInputNumberModule,
      NzCheckboxModule,
      NgbModule,
      NzDatePickerModule,
      NzDropDownModule,
      NzMenuModule,
    ],
  templateUrl: './summary-return-detail.component.html',
  styleUrls: ['./summary-return-detail.component.css']
})
export class SummaryReturnDetailComponent implements OnInit, AfterViewInit {
  table!: Tabulator;
  @ViewChild('summaryTable', {static: false}) summaryTable!: ElementRef;
  @Input() _exportDetailID: number = 0;
  @Input() warehouseID: number = 0;
  data: any[] = [];

  constructor(
    private srv: HistoryBorrowSaleService,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  loadData() {
    this.srv.getSummaryReturn(this._exportDetailID).subscribe((res) => {
      this.data = res.data;
      console.log('data:', this.data);

      if (this.table) {
        this.table.replaceData(this.data);
      }
    });
  }

  drawTable() {
    this.table = new Tabulator(this.summaryTable.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      height: '70vh',
      reactiveData: true,
      movableColumns: true,
      resizableRows: true,
      columns: [
        {
          title: 'STT',
          field: 'No',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 60,
        },
        {
          title: 'Trạng thái',
          field: 'ReturnedStatus',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? 'Đã trả' : 'Chưa trả';
          }
        },
        {
          title: 'Mã phiếu',
          field: 'BillImportCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 130,
          formatter: 'textarea',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 110,
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Mã nhân viên',
          field: 'EmployeeCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 120,
          formatter: 'textarea',
        },
        {
          title: 'Họ và Tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 120,
          formatter: 'textarea',
        },
        {
          title: 'Mã hàng',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 120,
          formatter: 'textarea',
        },
        {
          title: 'Mã theo dự án',
          field: 'ProjectCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 130,
          formatter: 'textarea',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'SerialNumber',
          field: 'SerialNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 120,
          formatter: 'textarea',
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Số lượng',
          field: 'Qty',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 100,
          formatter: 'money',
          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
        },
        {
          title: 'Mã dự án/Công ty',
          field: 'ProjectCodeText',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 130,
          formatter: 'textarea',
        },
        {
          title: 'Tên dự án',
          field: 'ProjectNameText',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
      ],
    });
  }

  closeModal() {
    this.activeModal.close();
  }

  async exportExcel() {
    if (!this.table || !this.data || this.data.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Chi tiết trả hàng');

      // Define headers
      const headers = [
        'STT',
        'Trạng thái',
        'Mã phiếu',
        'Ngày tạo',
        'Mã nhân viên',
        'Họ và Tên',
        'Mã nội bộ',
        'Mã hàng',
        'Mã theo dự án',
        'Tên sản phẩm',
        'SerialNumber',
        'ĐVT',
        'Số lượng',
        'Mã dự án/Công ty',
        'Tên dự án',
        'Ghi chú'
      ];

      // Add header row
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      this.data.forEach((item) => {
        const row = worksheet.addRow([
          item.No,
          item.ReturnedStatus ? 'Đã trả' : 'Chưa trả',
          item.BillImportCode,
          item.CreatDate ? DateTime.fromISO(item.CreatDate).toFormat('dd/MM/yyyy') : '',
          item.EmployeeCode,
          item.FullName,
          item.ProductNewCode,
          item.ProductCode,
          item.CodeMaPhieuMuon,
          item.ProductName,
          item.SerialNumber,
          item.Unit,
          item.Qty,
          item.ProjectCode,
          item.ProjectName,
          item.Note
        ]);

        // Alignment for each column
        row.getCell(1).alignment = { horizontal: 'center' }; // STT
        row.getCell(2).alignment = { horizontal: 'center' }; // Trạng thái
        row.getCell(4).alignment = { horizontal: 'center' }; // Ngày tạo
        row.getCell(12).alignment = { horizontal: 'center' }; // ĐVT
        row.getCell(13).alignment = { horizontal: 'right' }; // Số lượng
      });

      // Set column widths
      worksheet.columns = [
        { width: 8 },   // STT
        { width: 12 },  // Trạng thái
        { width: 15 },  // Mã phiếu
        { width: 12 },  // Ngày tạo
        { width: 15 },  // Mã nhân viên
        { width: 20 },  // Họ và Tên
        { width: 15 },  // Mã nội bộ
        { width: 15 },  // Mã hàng
        { width: 18 },  // Mã theo dự án
        { width: 25 },  // Tên sản phẩm
        { width: 15 },  // SerialNumber
        { width: 10 },  // ĐVT
        { width: 12 },  // Số lượng
        { width: 18 },  // Mã dự án/Công ty
        { width: 20 },  // Tên dự án
        { width: 25 }   // Ghi chú
      ];

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Chi_tiet_tra_hang_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error) {
      console.error('Export excel error:', error);
      this.notification.error('Lỗi', 'Xuất Excel thất bại!');
    }
  }
}

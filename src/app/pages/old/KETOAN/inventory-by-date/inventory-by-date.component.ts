import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
  Optional,
  Inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { InventoryByDateService } from '../inventory-by-date/inventory-by-date-service/inventory-by-date.service';
@Component({
  selector: 'app-inventory-by-date',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    NzTreeSelectModule,
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './inventory-by-date.component.html',
  styleUrl: './inventory-by-date.component.css'
})
export class InventoryByDateComponent implements OnInit, AfterViewInit {

  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;
  dateTime: Date = new Date();
  constructor(
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private inventoryByDateService: InventoryByDateService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  search(){
    this.loadData();
  }

  loadData(): void {
    this.inventoryByDateService.loadData(this.dateTime).subscribe((response: any) => {
      if (response.status === 1 && response.data) {
        this.tb_Master.replaceData(response.data);
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi tải dữ liệu');
      }
    });
  }

  initTable(): void {
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: false,
      paginationMode: 'local',
      layout: 'fitColumns',
      columns: [
        {
          title: 'Ngày',
          field: 'CreatDate',
          sorter: 'string',
          widthGrow: 15,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          widthGrow: 25,
        },
        {
          title: 'SL nhập',
          field: 'QtyImport',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Số lượng tồn',
          field: 'QtyValues3',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Tồn kho',
          field: 'QtyValues1',
          sorter: 'string',
          widthGrow: 1,
          visible: false,
        },
        {
          title: 'Tồn cuối',
          field: 'TotalQuantityLast',
          sorter: 'string',
          widthGrow: 1,
          visible: false,
        },
      ],
    });
  }

  async exportToExcel() {
    if (!this.tb_Master) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bảng dữ liệu chưa được khởi tạo!'
      );
      return;
    }

    const data = this.tb_Master.getData();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tồn kho theo ngày');

    const columns = this.tb_Master.getColumns();
    const headers = columns.map((col: any) => col.getDefinition().title);

    // Thêm dòng header
    const headerRow = worksheet.addRow(headers);

    // Format header
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Thêm dữ liệu
    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        // Chuyển đổi date string thành Date object nếu cần
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      const excelRow = worksheet.addRow(rowData);

      // Format date columns
      excelRow.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Auto fit columns
    worksheet.columns.forEach((column: any) => {
      if (column.header) {
        column.width = column.header.length < 20 ? 20 : column.header.length + 2;
      }
    });

    // Tạo file và tải xuống
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Tạo tên file với ngày hiện tại
    const dateStr = DateTime.fromJSDate(this.dateTime).toFormat('dd-MM-yyyy');
    link.download = `TonKhoTheoNgay_${dateStr}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notification.success(
      NOTIFICATION_TITLE.success,
      'Xuất Excel thành công!'
    );
  }
}

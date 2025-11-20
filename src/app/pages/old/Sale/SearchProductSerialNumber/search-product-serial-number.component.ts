import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
import { SearchProductSerialNumberServiceService } from './search-product-serial-number-service/search-product-serial-number-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  selector: 'app-search-product-serial-number',
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
    NzSpinModule,
  ],
  templateUrl: './search-product-serial-number.component.html',
  styleUrl: './search-product-serial-number.component.css',
})
export class SearchProductSerialNumberComponent
  implements OnInit, AfterViewInit
{
  constructor(
    private searchProductSerialNumberService: SearchProductSerialNumberServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}

  isLoading = false;

  table_Import: any;
  dataImport: any[] = [];

  table_Export: any;
  dataExport: any[] = [];

  keyword: string = '';
  ngOnInit(): void {
    this.loadData();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  loadData() {
    this.isLoading = true;
    this.searchProductSerialNumberService.getAll(this.keyword).subscribe({
      next: (res: any) => {
        this.dataImport = res.dataImport;
        this.dataExport = res.dataExport;
        if (this.dataImport) {
          this.table_Import.replaceData(this.dataImport);
        }
        if (this.dataExport) {
          this.table_Export.replaceData(this.dataExport);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu lịch sử mượn/trả'
        );
        this.isLoading = false;
      },
    });
  }
  drawTable() {
    this.table_Import = new Tabulator('#table_import', {
      data: this.dataImport,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataFill',
      height: '89vh',
      selectableRows: true, // Cho phép checkbox chọn dòng
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 50,
      columns: [
        {
          title: 'Duyệt',
          field: 'Status',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          formatter: (cell) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${
              value === true ? 'checked' : ''
            } disabled />`;
          },
        },
        {
          title: 'Mã phiếu nhập',
          field: 'BillImportCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },
        {
          title: 'Mã theo dự án',
          field: 'ProjectName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Serial Number',
          field: 'SerialNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú (PO)',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });
    if (this.dataImport && this.dataImport.length > 0) {
      this.table_Import.replaceData(this.dataImport);
    }
    //bang xuat
    this.table_Export = new Tabulator('#table_export', {
      data: this.dataExport,
       ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataFill',
      height: '89vh',
            paginationMode: 'local',
      selectableRows: true, // Cho phép checkbox chọn dòng
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      pagination: true,
      paginationSize: 50,

      columns: [
        {
          title: 'Duyệt',
          field: 'Status',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          formatter: (cell) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${
              value === true ? 'checked' : ''
            } disabled />`;
          },
        },
        {
          title: 'Mã phiếu Xuất',
          field: 'Code',
          hozAlign: 'left',
          width: 80,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },
        {
          title: 'Mã theo dự án',
          field: 'ProjectName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Serial Number',
          field: 'SerialNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú (PO)',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });

    if (this.dataExport && this.dataExport.length > 0) {
      this.table_Export.replaceData(this.dataExport);
    }
  }
}

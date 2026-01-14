import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
} from '@angular/core';
import { NgForm } from '@angular/forms';
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
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

import { InventoryByDateService } from '../inventory-by-date-service/inventory-by-date.service';
@Component({
  selector: 'app-chi-tiet-san-pham-sale-for-kt',
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
    CommonModule,
    NzTreeSelectModule,
    NzCollapseModule,
    NzFormModule,
  ],
  templateUrl: './chi-tiet-san-pham-sale-for-kt.component.html',
  styleUrl: './chi-tiet-san-pham-sale-for-kt.component.css'
})
export class ChiTietSanPhamSaleForKtComponent implements OnInit, AfterViewInit {
  @Input() productSaleId: number = 0;
  @Input() warehouseCode: string = '';
  @Input() dateValues: Date = new Date();
  @Input() productCode: string = '';
  @Input() totalQuantityFirst: number = 0;
  @ViewChild('tb_ImportTable', { static: false }) importTableElementRef!: ElementRef;
  tb_ImportTable!: Tabulator;
  @ViewChild('tb_ExportTable', { static: false }) exportTableElementRef!: ElementRef;
  tb_ExportTable!: Tabulator;

  dtImport: any[] = [];
  dtExport: any[] = [];
  dtHistory: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private inventoryByDateService: InventoryByDateService,
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.initImportTable();
    this.initExportTable();
    this.loadData();
  }

  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
  }

  loadData(): void {
    this.inventoryByDateService.getImportExportInventoryByDate(this.productSaleId, this.warehouseCode, this.dateValues).subscribe((response: any) => {
      if (response.status === 1 && response.data) {
        this.dtImport = response.data.dataImport;
        this.dtExport = response.data.dataExport;
        this.dtHistory = response.data.dataHistory;
        this.tb_ImportTable.setData(this.dtImport);
        this.tb_ExportTable.setData(this.dtExport);
      }
    });
  }

  initImportTable(): void {
    this.tb_ImportTable = new Tabulator(this.importTableElementRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '70vh',
      layout: 'fitColumns',
      rowHeader: false,
      columns: [
        { title: 'Số phiếu', field: 'BillImportCode',width: 150 },
        {
          title: 'Ngày tạo', field: 'CreatDate', width: 150,
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
        { title: 'Nhà cung cấp', field: 'Suplier', width: 250, formatter: 'textarea' },
        { title: 'Số lượng', field: 'Qty', width: 100, },
        {
          title: 'Duyệt', field: 'Status', hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
      ],
    });
  }

  initExportTable(): void {
    this.tb_ExportTable = new Tabulator(this.exportTableElementRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '70vh',
      layout: 'fitColumns',
      rowHeader: false,
      columns: [
        { title: 'Trạng thái', field: 'nameStatus' },
        { title: 'Số phiếu', field: 'Code', width: 150},
        {
          title: 'Ngày tạo', field: 'CreatDate',width: 150,
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
        { title: 'Số lượng', field: 'Qty' },
        {
          title: 'Duyệt', field: 'IsApproved',
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        { title: 'Khách hàng', field: 'CustomerName', width: 250, formatter: 'textarea' },
      ],
    });
  }
}

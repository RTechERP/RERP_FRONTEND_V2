import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
// import * as bootstrap from 'bootstrap';

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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
// Thêm các import này vào đầu file
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { SelectControlComponent } from '../select-control/select-control.component';
import { ProjectComponent } from '../../../../../project/project.component';
@Component({
  selector: 'app-history-delete-bill',
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
    NgbModule,
    NzDividerModule,
    NzDatePickerModule,
    SelectControlComponent,
  ],
  templateUrl: './history-delete-bill.component.html',
  styleUrl: './history-delete-bill.component.css',
})
export class HistoryDeleteBillComponent implements OnInit, AfterViewInit {
  table: any; // instance của Tabulator
  dataTable: any[] = [];
  message: string = '';
  @Input() billExportID: number = 0;
  @Input() billImportID: number = 0;
  @Input() billType: number = 0;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billExportService: BillExportService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    if (this.billType == 1) {
      this.message += ' - PHIẾU NHẬP';
    } else if (this.billType == 2) {
      this.message += ' - PHIẾU NHẬP DEMO';
    } else if (this.billType == 3) {
      this.message += ' - PHIẾU XUẤT DEMO';
    } else {
      this.message += ' - PHIẾU XUẤT';
    }
    this.drawTable();
    this.getHistoryDeleteBillByBillType();
  }
  getHistoryDeleteBillByBillType() {
    this.billExportService
      .getHistoryDeleteBillByBillType(
        this.billExportID,
        this.billImportID,
        this.billType
      )
      .subscribe((res: any) => {
        this.dataTable = res.data;
        this.table.replaceData(this.dataTable);
        console.log(this.dataTable);
      });
  }
  closeModal() {
    this.activeModal.close();
  }
  drawTable() {
    const customDateFormatter = (cell: any) => {
      const value = cell.getValue();
      if (!value) return '';

      const date = new Date(value);
      if (isNaN(date.getTime())) return '';

      const day: string = ('0' + date.getDate()).slice(-2);
      const month: string = ('0' + (date.getMonth() + 1)).slice(-2);
      const year: number = date.getFullYear();

      return `${day}/${month}/${year}`;
    };
    if (this.table) {
      this.table.replaceData(this.dataTable);
    } else {
      this.table = new Tabulator('#table_HistoryDeleteBill', {
        layout: 'fitDataFill',
        height: '70vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: [
          {
            title: 'Mã phiếu',
            field: 'BillCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: '25%',
          },
          {
            title: 'Trạng thái',
            field: 'StatusBillText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: '25%',
          },
          {
            title: 'Ngày',
            field: 'DateStatus',
            width: '25%',
            hozAlign: 'center',
            headerHozAlign: 'center',
            // formatter: customDateFormatter,
          },
          {
            title: 'Người nhận',
            field: 'CreatedName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: '25%',
          },
        ],
      });
    }
  }
}

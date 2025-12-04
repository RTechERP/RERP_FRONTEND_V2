import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import {
  NgbActiveModal,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
import { environment } from '../../../../../../../environments/environment';
@Component({
  standalone: true,
  selector: 'app-bill-return',
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
    NzTabsModule,
    // HasPermissionDirective,
  ],
  templateUrl: './bill-return.component.html',
  styleUrls: ['./bill-return.component.css'],
})
export class BillReturnComponent implements OnInit, AfterViewInit {
  @ViewChild('tableReturn', { static: false }) tableReturn!: ElementRef;
  table!: Tabulator;
  dataReturn: any[] = [];
  @Input() billImportDetailModel: any;
  @Input() productID: number = 0;
  @Input() Type: number = 0;
  @Input() maphieu: string = '';
  @Output() maphieuSelected = new EventEmitter<string>();
  selectedCode: string = '';

  constructor(
    private srv: BillImportServiceService,
    private activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    this.loadPhieuTra();
  }

  ngAfterViewInit() {
    this.drawTable();
  }

  loadPhieuTra() {
    this.srv.getPhieutra(this.productID).subscribe(
      (res: any) => {
        this.dataReturn = res.data;
        if (this.table) {
          this.table.setData(this.dataReturn);
        }
      },
      (error: any) => {
        console.error('Error loading bill returns:', error);
      }
    );
  }

  drawTable() {
    this.table = new Tabulator(this.tableReturn.nativeElement, {
      data: this.dataReturn,
      layout: 'fitDataStretch',
      reactiveData: true,
      selectableRows: 1,
      height: '65vh',
      placeholder: 'Không có dữ liệu',
      rowFormatter: (row) => {
        const remain = row.getData()['Remain'];
        if (remain !== 0) {
          row.getElement().style.backgroundColor = '#FFFF00';
        }
      },
      columns: [
        {
          title: 'Ngày tạo',
          hozAlign: 'center',
          width: 150,
          field: 'CreatedDate',
        },
        { title: 'Mã phiếu mượn', field: 'Code', width: 150 },
        { title: 'Người mượn', field: 'FullName', width: 150 },
        { title: 'Số lượng mượn', field: 'Qty', width: 150 },
        { title: 'Số lượng trả', field: 'ReturnAmount', width: 150 },
        { title: 'Đang mượn', field: 'Remain', width: 150 },
      ],
    });

    this.table.on('rowDblClick', (_e: any, row: any) => {
      this.selectPhieuTra(row.getData());
    });
  }

  selectPhieuTra(rowData: any) {
    if (rowData && rowData.Code) {
      this.maphieu = rowData.Code;
      this.maphieuSelected.emit(rowData.Code);
      console.log('Selected bill code:', this.maphieu);
    }
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  isRowSelected(): boolean {
    return !!this.table && this.table.getSelectedData().length > 0;
  }

  getSelectedRow(): any {
    if (this.table && this.table.getSelectedData().length > 0) {
      return this.table.getSelectedData()[0];
    }
    return null;
  }
}

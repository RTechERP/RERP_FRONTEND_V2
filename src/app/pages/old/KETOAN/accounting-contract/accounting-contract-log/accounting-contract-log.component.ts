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

import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { setupTabulatorCellCopy } from '../../../../../shared/utils/tabulator-cell-copy.util';

import { AccountingContractService } from '../accounting-contract-service/accounting-contract.service';

@Component({
  selector: 'app-accounting-contract-log',
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
  templateUrl: './accounting-contract-log.component.html',
  styleUrl: './accounting-contract-log.component.css'
})
export class AccountingContractLogComponent implements OnInit, AfterViewInit {
  @Input() contractIdfromAccountingContract!: any;
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;
  contractId: number = 0;
  userId: number = 0;
  dataContract: any[] = [];
  dataUser: any[] = [];
  constructor(
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private accountingContractService: AccountingContractService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  closeModal(): void {
    this.activeModal.close({ success: false, reloadData: false });
  }

  ngOnInit(): void {
    this.loadContract();
    this.loadUsers();
    this.contractId = this.contractIdfromAccountingContract;
  }

  ngAfterViewInit(): void {
    this.initMasterTable();
    this.loadAccountingContractLog();
  }

  search() {
    this.loadAccountingContractLog();
  }

  loadAccountingContractLog() {
    if (this.contractId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn hợp đồng');
      return;
    }

    this.accountingContractService.getAccountingContractLog(this.contractId, this.userId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.tb_Master.setData(response.data);
        } else {
          this.notification.error('Lỗi khi tải dữ liệu log:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu log:', error);
        return;
      }
    );
  }

  loadContract() {
    this.accountingContractService.getContractForLog().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataContract = response.data;
        } else {
          this.notification.error('Lỗi khi tải nhà cung cấp:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhà cung cấp:', error);
        return;
      }
    );
  }

  loadUsers() {
    this.accountingContractService.getUsers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataUser = response.data;
        } else {
          this.notification.error('Lỗi khi tải nhà cung cấp:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhà cung cấp:', error);
        return;
      }
    );
  }

  initMasterTable() {
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      layout: 'fitColumns',
      height: '100%',
      selectableRows: 1,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500, 99999999],
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
        },
        {
          title: 'Số HĐ/PL',
          field: 'ContractNumber',
          sorter: 'string',
          width: '15%',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc số HĐ/PL',
        },
        {
          title: 'Ngày thay đổi',
          field: 'DateLog',
          sorter: 'date',
          width: '12%',
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
          title: 'Tình trạng hồ sơ gốc',
          field: 'IsReceivedContractText',
          sorter: 'string',
          width: '18%',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc tình trạng hồ sơ gốc',
        },
        {
          title: 'Tình trạng hợp đồng',
          field: 'IsApprovedText',
          sorter: 'string',
          width: '18%',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc tình trạng hợp đồng',
        },
        {
          title: 'Nội dung thay đổi',
          field: 'ContentLog',
          sorter: 'string',
          width: '25%',
          formatter: 'textarea',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc nội dung thay đổi',
        },
        {
          title: 'Người thực hiện',
          field: 'FullName',
          sorter: 'string',
          width: '12%',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc người thực hiện',
        },
      ],
    });
  }

  exportToExcel() {
    const data = this.tb_Master?.getData() || [];
    if (data.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch sử cập nhật hợp đồng');

    worksheet.columns = [
      { header: 'Số HĐ/PL', key: 'ContractNumber', width: 20 },
      { header: 'Ngày thay đổi', key: 'DateLog', width: 15 },
      { header: 'Tình trạng hồ sơ gốc', key: 'IsReceivedContractText', width: 20 },
      { header: 'Tình trạng hợp đồng', key: 'IsApprovedText', width: 20 },
      { header: 'Nội dung thay đổi', key: 'ContentLog', width: 40 },
      { header: 'Người thực hiện', key: 'FullName', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    data.forEach((row: any) => {
      worksheet.addRow({
        ...row,
        DateLog: row.DateLog ? new Date(row.DateLog).toLocaleDateString('vi-VN') : '',
      });
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LichSuCapNhatHopDong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }


}

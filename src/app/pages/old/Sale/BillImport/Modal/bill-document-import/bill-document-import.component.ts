import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  Type,
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  Output,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import {
  NgbModal,
  NgbModule,
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { RowComponent } from 'tabulator-tables';

import { SelectControlComponent } from '../../../BillExport/Modal/select-control/select-control.component';
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';

interface DocumentImportPoNCC {
  ID: number;
  Status: number;
  ReasonCancel: string;
  DateRecive: Date;
  BillImportID?: number;
  DocumentImportID?: number;
  Note?: string;
  StatusPurchase: number;
  StatusHr: number;
  UpdateBy: string;
  UpdateDate: Date;
}

@Component({
  selector: 'app-bill-document-import',
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
    ProductSaleDetailComponent,
    SelectControlComponent,
  ],
  templateUrl: './bill-document-import.component.html',
  styleUrls: ['./bill-document-import.component.css'],
})
export class BillDocumentImportComponent implements OnInit, AfterViewInit {
  @Input() id: number = 0;
  @Input() code: string = '';
  @Output() dataSaved = new EventEmitter<void>(); // To notify parent to reload

  @ViewChild('tableBillDocumentImport') tableBillDocumentImportRef!: ElementRef;
  @ViewChild('tableBillDocumentImportLog') tableBillDocumentImportLogRef!: ElementRef;

  displayedData: any;
  flag: boolean = true;
  dataBillDocumentImport: any[] = [];
  table_billDocumentImport: any;
  dataBillDocumentImportLog: any[] = [];
  table_billDocumentImportLog: any;
  bdeID: number = 0;
  activeKT: boolean = false;
  activeHR: boolean = false;
  activePur: boolean = false;
  documentImportID: number = 0;

  cbbStatus: any = [
    { ID: 1, Name: 'Đã nhận' },
    { ID: 2, Name: 'Đã hủy nhận' },
    { ID: 3, Name: 'Không có' },
  ];

  cbbStatusPur: any = [
    { ID: 1, Name: 'Đã bàn giao' },
    { ID: 2, Name: 'Hủy bàn giao' },
    { ID: 3, Name: 'Không cần' },
  ];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billImportService: BillImportServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal,
    private modalServiceConfirm: NzModalService,
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    if (this.appUserService.isAdmin) {
      this.activeKT = true;
      this.activeHR = true;
      this.activePur = true;
    } else if (this.appUserService.departmentID === 6) {
      this.activeHR = true;
    } else if (this.appUserService.departmentID === 5) {
      this.activeKT = true;
    } else if (this.appUserService.departmentID === 4) {
      this.activePur = true;
    }
    this.getBillDocumentImport();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawTable();
    }, 100);
  }

  getBillDocumentImport() {
    this.billImportService.getDocumenImportPONCC(this.id).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.displayedData = res.data;
          console.log(res.data);
          this.dataBillDocumentImport = JSON.parse(JSON.stringify(res.data)); // bản sao để so sánh'
          this.table_billDocumentImport?.replaceData(this.displayedData);
          // this.dataBillDocumentImport = res.data;
          // this.table_billDocumentImport?.replaceData(this.dataBillDocumentImport);
          // this.getBillDocumentImportLog(this.id, res.data[0].DocumentImportID);

        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lấy chứng từ');
        console.error('Lỗi khi lấy chứng từ', err);
      },
    });
  }

  getBillDocumentImportLog(bdeID: number, documentImportID: number) {
    this.billImportService
      .getBillDocumentImportLog(bdeID, documentImportID)
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataBillDocumentImportLog = res.data;
            console.log('datalog:',this.dataBillDocumentImportLog);

            this.table_billDocumentImportLog?.replaceData(
              this.dataBillDocumentImportLog
            );
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lấy lịch sử chứng từ');
          console.error('Lỗi khi lấy lịch sử chứng từ', err);
        },
      });
  }

  closeModal() {
    if (!this.flag) {
      this.modalServiceConfirm.confirm({
        nzTitle: 'Xác nhận thoát',
        nzContent:
          'Bạn có chắc chắn muốn thoát không? Mọi thay đổi chưa lưu sẽ bị mất.',
        nzOkText: 'Thoát',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.activeModal.dismiss(true);
        },
      });
    } else {
      this.activeModal.dismiss(true);
    }
  }

  saveData() {
    const currentData = this.table_billDocumentImport.getData();

    const changedData = [];

    for (const item of currentData) {
      if (item._edited) {
        // Validate
        if (
          !item.DocumentStatus ||
          isNaN(item.DocumentStatus) ||
          item.DocumentStatus <= 0
        ) {
          this.notification.error(
            'Lỗi',
            `Vui lòng nhập Trạng thái cho chứng từ [${
              item.DocumentImportCode || 'N/A'
            }].`
          );
          return;
        }

        if (
          item.DocumentStatus === 2 &&
          (!item.ReasonCancel || item.ReasonCancel.trim() === '')
        ) {
          this.notification.error(
            'Lỗi',
            `Vui lòng nhập Lý do hủy cho chứng từ [${
              item.DocumentImportCode || 'N/A'
            }].`
          );
          return;
        }

        changedData.push({
          ID: item.ID || 0,
          Status: parseInt(item.DocumentStatus, 10) || null,
          DateRecive: DateTime.now().toISO(),
          ReasonCancel: item.ReasonCancel || '',
          BillImportID: this.id,
          DocumentImportID: item.DocumentImportID,
          Note: item.Note || '',
          StatusHr: parseInt(item.DocumentStatusHR, 10) || null,
          StatusPurchase: parseInt(item.DocumentStatusPur, 10) || null,
          UpdateBy: 'admin',
          UpdateDate: DateTime.now().toISO(),
        });
      }
    }

    if (changedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi để lưu.');
      return;
    }

    this.billImportService.saveBillDocumentImport(changedData).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thành công', 'Dữ liệu đã được lưu.');
          this.flag = true;
          this.getBillDocumentImport(); // load lại bảng + reset cờ _edited
          this.dataSaved.emit();
        } else {
          this.notification.error(
            'Lỗi',
            res.error || 'Có lỗi xảy ra khi lưu dữ liệu.'
          );
        }
      },
      error: (err) => {
        const errorMsg = err.error?.errors
          ? Object.values(err.error.errors).flat().join('; ')
          : err.error?.error || 'Có lỗi xảy ra khi lưu dữ liệu.';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        console.error('Lỗi khi lưu dữ liệu:', err);
      },
    });
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: { valueField: string; labelField: string; placeholder?: string }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = getData();
      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder)
        componentRef.instance.placeholder = config.placeholder;

      componentRef.instance.valueChange.subscribe((val: any) => success(val));

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  drawTable() {
    const formatDate = (cell: any) => {
      const value = cell.getValue();
      const date = new Date(value);
      if (!value || isNaN(date.getTime())) return '';
      return `${('0' + date.getDate()).slice(-2)}/${(
        '0' +
        (date.getMonth() + 1)
      ).slice(-2)}/${date.getFullYear()}`;
    };

    if (!this.table_billDocumentImport) {
      this.table_billDocumentImport = new Tabulator(
        this.tableBillDocumentImportRef.nativeElement,
        {
          index: 'ID',
          data: this.dataBillDocumentImport,
          layout: 'fitDataStretch',
          height: '100%',
          reactiveData: true,
          resizableRows: true,
          selectableRows: 1,

          columns: [
            {
              title: 'Trạng thái KT',
              field: 'DocumentStatus',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
              editable: this.activeKT,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.cbbStatus,
                { valueField: 'ID', labelField: 'Name' }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if ((!val && val !== 0) || val == 0)
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p><i class="fas fa-angle-down"></i></div>';
                const st = this.cbbStatus.find(
                  (p: any) => p.ID === parseInt(val) || p.ID === val
                );
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${
                  st ? st.Name : val
                }</p><i class="fas fa-angle-down"></i></div>`;
              },
            },
            {
              title: 'Trạng thái Pur',
              field: 'DocumentStatusPur',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
              editable: this.activePur,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.cbbStatusPur,
                { valueField: 'ID', labelField: 'Name' }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if ((!val && val !== 0) || val == 0)
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p><i class="fas fa-angle-down"></i></div>';
                const st = this.cbbStatusPur.find(
                  (p: any) => p.ID === parseInt(val) || p.ID === val
                );
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${
                  st ? st.Name : val
                }</p><i class="fas fa-angle-down"></i></div>`;
              },
            },
            {
              title: 'Trạng thái HR',
              field: 'DocumentStatusHR',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editable: this.activeHR,
              width: 150,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.cbbStatus,
                { valueField: 'ID', labelField: 'Name' }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if ((!val && val !== 0) || val == 0)
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p><i class="fas fa-angle-down"></i></div>';
                const st = this.cbbStatus.find(
                  (p: any) => p.ID === parseInt(val) || p.ID === val
                );
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${
                  st ? st.Name : val
                }</p><i class="fas fa-angle-down"></i></div>`;
              },
            },
            {
              title: 'Mã chứng từ',
              field: 'DocumentImportCode',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Tên chứng từ',
              field: 'DocumentImportName',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do',
              field: 'ReasonCancel',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
              width: 200,
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
              width: 200,
            },
            {
              title: 'Người thay đổi',
              field: 'UpdatedBy',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày thay đổi',
              field: 'UpdatedDate',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: formatDate,
            },
          ],
        }
      );

      this.table_billDocumentImport.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        console.log('documentimportid',this.id);

        this.documentImportID = rowData['DocumentImportID'];
        this.getBillDocumentImportLog(this.id, this.documentImportID);
      });

      this.table_billDocumentImport.on('rowDeselected', () => {
        if (this.table_billDocumentImport.getSelectedRows().length === 0) {
          this.bdeID = 0;
          this.documentImportID = 0;
          this.table_billDocumentImportLog?.replaceData([]);
        }
      });
      this.table_billDocumentImport.on('cellEdited', (cell: any) => {
        const rowData = cell.getRow().getData();
        rowData._edited = true; // đánh dấu là dòng đã sửa
        this.flag = false;
      });
    } else {
      this.table_billDocumentImport.replaceData(this.dataBillDocumentImport);
    }

    if (!this.table_billDocumentImportLog) {
      this.table_billDocumentImportLog = new Tabulator(
        this.tableBillDocumentImportLogRef.nativeElement,
        {
          index: 'ID',
          data: this.dataBillDocumentImportLog,
          layout: 'fitDataStretch',
          height: '30vh',
          reactiveData: true,
          resizableRows: true,
          selectableRows: 1,
          columns: [
            {
              title: 'Trạng thái',
              field: 'DocumentStatusText',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Mã chứng từ',
              field: 'DocumentImportCode',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Tên chứng từ',
              field: 'DocumentImportName',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do / Ghi chú',
              field: 'Note',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày thay đổi',
              field: 'UpdatedDate',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: formatDate,
            },
            {
              title: 'Người thay đổi',
              field: 'UpdatedBy',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày thay đổi',
              field: 'UpdatedDate',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: formatDate,
            },
          ],
        }
      );
    } else {
      this.table_billDocumentImportLog.replaceData(
        this.dataBillDocumentImportLog
      );
    }
  }
}

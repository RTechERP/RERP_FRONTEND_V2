import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
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
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { RequestInvoiceStatusLinkService } from './request-invoice-status-link-service/request-invoice-status-link.service';
import { RequestInvoiceStatusComponent } from '../request-invoice-status/request-invoice-status.component';
@Component({
  selector: 'app-request-invoice-status-link',
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
  ],
  templateUrl: './request-invoice-status-link.component.html',
  styleUrl: './request-invoice-status-link.component.css'
})
export class RequestInvoiceStatusLinkComponent implements OnInit, AfterViewInit {
  @Input() requestInvoiceID: number = 0;
  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;

  private tb_Table!: Tabulator;

  @ViewChild('tb_File', { static: false }) tb_FileElement!: ElementRef;

  private tb_File!: Tabulator;


  mainData: any[] = [];
  fileData: any[] = [];
  selectStatusData: any[] = [];
  listIdsStatusDel: number[] = [];
  private readonly SUPPLEMENT_STATUS_VALUE = 4;
  approvedStatus: any[] = [
    { value: 1, label: 'Chờ duyệt' },
    { value: 2, label: 'Duyệt' },
    { value: 3, label: 'Không duyệt' },
    { value: 4, label: 'Yêu cầu bổ sung' },
  ];
  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private requestInvoiceStatusLinkService: RequestInvoiceStatusLinkService
  ) { }

  ngOnInit(): void {
    this.loadStatusInvoice();
    this.loadFile();
    this.loadStatus();
  }

  ngAfterViewInit(): void {
    this.initTable();
    this.initFileTable();
  }

  closeModal() {
    this.activeModal.close();
  }

  loadStatusInvoice() {
    this.requestInvoiceStatusLinkService.getStatusInvoice(this.requestInvoiceID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = response.data;
          if (this.mainData.length > 0 && this.tb_Table) {
            this.tb_Table.replaceData(this.mainData);
            this.tb_Table.redraw(true);
          }
        } else {
          console.error('Lỗi khi tải trạng thái:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải trạng thái:', error);
      }
    );
  }

  loadStatus() {
    this.requestInvoiceStatusLinkService.getStatus().subscribe(
      (response) => {
        if (response.status === 1) {
          this.selectStatusData = response.data || [];
          this.refreshStatusColumnEditor();

        } else {
          console.error('Lỗi khi tải trạng thái:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải trạng thái:', error);
      }
    );
  }

  loadFile() {
    this.requestInvoiceStatusLinkService.getStatusInvoiceFile(this.requestInvoiceID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.fileData = response.data;
          if (this.fileData.length > 0 && this.tb_File) {
            this.tb_File.replaceData(this.fileData);
          }
        } else {
          console.error('Lỗi khi tải file:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải file:', error);
      }
    );
  }

  openRequestInvoiceStatusModal(): void {
    const modalRef = this.modalService.open(RequestInvoiceStatusComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadStatus()
          setTimeout(() => {
            this.loadStatusInvoice();
          }, 300); 
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  saveAndClose() {
    if (!this.tb_Table) {
      return;
    }
    const tableData = this.tb_Table.getData();
    const missingReason = tableData.find(
      (row) =>
        row['IsApproved'] === this.SUPPLEMENT_STATUS_VALUE &&
        !(row['AmendReason'] || '').trim()
    );
    if (missingReason) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập lý do cho trạng thái "Yêu cầu bổ sung".'
      );
      return;
    }
    const payload = {
      StatusRequestInvoiceLinks: tableData.map((row) => ({
        ID: row['ID'] ?? 0,
        StatusID: row['StatusID'],
        IsApproved: row['IsApproved'],
        IsCurrent: !!row['IsCurrent'],
        AmendReason: row['AmendReason'] ?? '',
      })),
      listIdsStatusDel: this.listIdsStatusDel,
      requestInvoiceId: this.requestInvoiceID,
    };
    this.requestInvoiceStatusLinkService.saveStatusInvoice(payload).subscribe(
      (response) => {
        if (response?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            response?.message || 'Lưu dữ liệu thành công.'
          );
          this.closeModal();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response?.message || 'Không thể lưu dữ liệu.'
          );
        }
      },
      (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.message || 'Có lỗi xảy ra khi lưu dữ liệu.'
        );
      }
    );
  }

  initTable(): void {
    if (!this.tb_TableElement) {
      console.error('tb_Table element not found');
      return;
    }
    this.tb_Table = new Tabulator(this.tb_TableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: this.mainData,
      height: '100%',
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'string',
          visible: false,
        },
        {
          title: 'Trạng thái',
          field: 'StatusID',
          sorter: 'string',
          width: "25%",
          editor: 'list',
          editorParams: {
            values: this.buildStatusEditorValues(),
            autocomplete: true
          },
          formatter: (cell) => {
            const id = cell.getValue();
            const status = this.selectStatusData.find(x => x.ID === id);
            return status ? status.StatusName : '';
          }
        },
        {
          title: 'Tình trạng',
          field: 'IsApproved',
          sorter: 'number',
          width: "20%",
          editor: 'list',
          editorParams: {
            values: this.approvedStatus.map(x => ({
              value: x.value,
              label: x.label
            }))
          },
          formatter: (cell) => {
            const val = cell.getValue();
            const selected = this.approvedStatus.find(x => x.value === val);
            return selected ? selected.label : '';
          }
        },
        {
          title: 'Trạng thái hiện tại',
          field: 'IsCurrent',
          sorter: 'boolean',
          width: "20%",
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center; cursor: pointer;">
            <input type="checkbox" ${checked} style="width: 16px; height: 16px; pointer-events: none;"/>
          </div>`;
          },
        },
        {
          title: 'Lý do yêu cầu bổ sung chứng từ',
          field: 'AmendReason',
          sorter: 'string',
          width: "30%",
          editor: 'textarea',
          editable: (cell) =>
            this.requiresAmendReason(cell.getRow().getData()),
        },
      ],
    });
    this.attachTableEvents();

  }

  initFileTable(): void {
    if (!this.tb_FileElement) {
      console.error('tb_File element not found');
      return;
    }
    this.tb_File = new Tabulator(this.tb_FileElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: this.fileData,
      height: '100%',
      rowHeader: false,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          width: 150,
          visible: false,
        },
        {
          title: 'File',
          field: 'FileName',
          sorter: 'string',
          width: "105%",
        }
      ],
    });
  }

  private buildStatusEditorValues() {
    return this.selectStatusData.map((x: any) => {
      const label =
        x.StatusName.length > 50
          ? x.StatusName.substring(0, 50) + '...'
          : x.StatusName;
      return {
        label,
        value: x.ID,
        id: x.ID,
      };
    });
  }

  private refreshStatusColumnEditor(): void {
    if (!this.tb_Table) {
      return;
    }
    (this.tb_Table as any).updateColumnDefinition('StatusID', {
      editorParams: {
        values: this.buildStatusEditorValues(),
        autocomplete: true,
      },
    });
    (this.tb_Table as any).redraw(true);
  }

  private attachTableEvents(): void {
    if (!this.tb_Table) {
      return;
    }
    const tableAny = this.tb_Table as any;
    tableAny.on('cellEdited', (cell: CellComponent) => {
      const field = cell.getField();
      if (field === 'StatusID') {
        const newValue = cell.getValue();
        const currentRowId = cell.getRow().getData()['ID'];
        const duplicated = this.tb_Table
          .getData()
          .some(
            (row) => row['ID'] !== currentRowId && row['StatusID'] === newValue
          );
        if (duplicated) {
          cell.setValue(cell.getOldValue(), true);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Trạng thái này đã tồn tại ở dòng khác.'
          );
        }
        return;
      }
    });
    tableAny.on(
      'cellClick',
      (_event: MouseEvent, cell: CellComponent) => {
        if (cell.getField() !== 'IsCurrent') {
          return;
        }
        const nextValue = !cell.getValue();
        if (nextValue) {
          this.tb_Table.getRows().forEach((row) => {
            if (row !== cell.getRow()) {
              row.update({ IsCurrent: false });
            }
          });
        }
        cell.getRow().update({ IsCurrent: nextValue });
      }
    );
  }

  private requiresAmendReason(rowData: any): boolean {
    return rowData?.['IsApproved'] === this.SUPPLEMENT_STATUS_VALUE;
  }
}

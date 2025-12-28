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
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
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
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';

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
    // ProductSaleDetailComponent,
    // SelectControlComponent,
    HasPermissionDirective,
    AngularSlickgridModule
  ],
  templateUrl: './bill-document-import.component.html',
  styleUrls: ['./bill-document-import.component.css'],
})
export class BillDocumentImportComponent implements OnInit, AfterViewInit {
  @Input() id: number = 0;
  @Input() code: string = '';
  @Output() dataSaved = new EventEmitter<void>(); // To notify parent to reload

  // Store original BillImportID
  billImportID: number = 0;

  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  dataBillDocumentImport: any[] = [];

  angularGridLog!: AngularGridInstance;
  columnDefinitionsLog: Column[] = [];
  gridOptionsLog: GridOption = {};
  dataBillDocumentImportLog: any[] = [];

  displayedData: any;
  flag: boolean = true;
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
  ) { }

  ngOnInit(): void {
    this.billImportID = this.id;
    
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
    this.initGridMaster();
    this.initGridLog();
    this.getBillDocumentImport();
  }

  ngAfterViewInit(): void {
  }

  getBillDocumentImport() {
    this.billImportService.getDocumenImportPONCC(this.id).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.displayedData = res.data;
          console.log('Data received:', res.data);
          this.dataBillDocumentImport = res.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index, 
            _edited: false 
          }));
          console.log('Data mapped for SlickGrid:', this.dataBillDocumentImport);
          this.flag = true; 
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi lấy chứng từ'
        );
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
            this.dataBillDocumentImportLog = res.data.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index // SlickGrid requires lowercase 'id' property
            }));
            console.log('Log data mapped for SlickGrid:', this.dataBillDocumentImportLog);
          }
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi lấy lịch sử chứng từ'
          );
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

  saveDataAndClose() {
    // Commit any pending edits before saving
    try {
      const slickGrid = (this.angularGridMaster as any).grid || (this.angularGridMaster as any).slickGrid;
      if (slickGrid && slickGrid.getEditorLock && slickGrid.getEditorLock().isActive()) {
        slickGrid.getEditorLock().commitCurrentEdit();
      }
    } catch (e) {
      console.log('Could not commit current edit:', e);
    }
    
    // const currentData = this.table_billDocumentImport.getData();
    const currentData = this.dataBillDocumentImport;

    const changedData = [];

    for (const item of currentData) {
      if (item._edited) {
        if (
          item.DocumentStatus === 2 &&
          (!item.ReasonCancel || item.ReasonCancel.trim() === '')
        ) {
          this.notification.error(
            'Lỗi',
            `Vui lòng nhập Lý do hủy cho chứng từ [${item.DocumentImportCode || 'N/A'
            }].`
          );
          return;
        }

        changedData.push({
          ID: item.ID || 0,
          Status: parseInt(item.DocumentStatus, 10) || null,
          DateRecive: DateTime.now().toISO(),
          ReasonCancel: item.ReasonCancel || '',
          BillImportID: this.billImportID, // Use stored BillImportID from @Input
          DocumentImportID: item.DocumentImportID,
          Note: item.Note || '',
          StatusHr: parseInt(item.DocumentStatusHR, 10) || null,
          StatusPurchase: parseInt(item.DocumentStatusPur, 10) || null,
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
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Dữ liệu đã được lưu.'
          );
          this.flag = true;
          this.getBillDocumentImport(); // load lại bảng + reset cờ _edited
          this.dataSaved.emit();
          // Close modal after successful save
            this.activeModal.dismiss(true);
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

  saveOnly() {
    // Commit any pending edits before saving
    try {
      const slickGrid = (this.angularGridMaster as any).grid || (this.angularGridMaster as any).slickGrid;
      if (slickGrid && slickGrid.getEditorLock && slickGrid.getEditorLock().isActive()) {
        slickGrid.getEditorLock().commitCurrentEdit();
      }
    } catch (e) {
      console.log('Could not commit current edit:', e);
    }
    
    const currentData = this.dataBillDocumentImport;
    const changedData = [];

    for (const item of currentData) {
      if (item._edited) {
        if (
          item.DocumentStatus === 2 &&
          (!item.ReasonCancel || item.ReasonCancel.trim() === '')
        ) {
          this.notification.error(
            'Lỗi',
            `Vui lòng nhập Lý do hủy cho chứng từ [${item.DocumentImportCode || 'N/A'
            }].`
          );
          return;
        }

        changedData.push({
          ID: item.ID || 0,
          Status: parseInt(item.DocumentStatus, 10) || null,
          DateRecive: DateTime.now().toISO(),
          ReasonCancel: item.ReasonCancel || '',
          BillImportID: this.billImportID,
          DocumentImportID: item.DocumentImportID,
          Note: item.Note || '',
          StatusHr: parseInt(item.DocumentStatusHR, 10) || null,
          StatusPurchase: parseInt(item.DocumentStatusPur, 10) || null,
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
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Dữ liệu đã được lưu.'
          );
          this.flag = true;
          
          // Reset cờ _edited cho các items đã lưu
          for (const item of currentData) {
            if (item._edited) {
              item._edited = false;
            }
          }
          
          this.dataSaved.emit();
          // Không reload, không đóng modal - người dùng tiếp tục sửa
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

  initGridMaster() {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;
      } catch (e) {
        return value;
      }
    };

    this.columnDefinitionsMaster = [
      {
        id: 'DocumentStatus',
        name: 'Trạng thái KT',
        field: 'DocumentStatus',
        type: 'string',
        width: 100,
        sortable: true,
        filterable: true,
        editor: this.activeKT ? {
          model: Editors['singleSelect'],
          collection: [{ ID: null, Name: '-- Bỏ chọn --' }, ...this.cbbStatus],
          customStructure: {
            value: 'ID',
            label: 'Name'
          }
        } : undefined,
        formatter: (row: number, cell: number, value: any) => {
          if ((!value && value !== 0) || value == 0) return '';
          const st = this.cbbStatus.find((p: any) => p.ID === parseInt(value) || p.ID === value);
          return st ? st.Name : value;
        }
      },
      {
        id: 'DocumentStatusPur',
        name: 'Trạng thái Pur',
        field: 'DocumentStatusPur',
        type: 'string',
        width: 100,
        sortable: true,
        filterable: true,
        editor: this.activePur ? {
          model: Editors['singleSelect'],
          collection: [{ ID: null, Name: '-- Chọn --' }, ...this.cbbStatusPur],
          customStructure: {
            value: 'ID',
            label: 'Name'
          }
        } : undefined,
        formatter: (row: number, cell: number, value: any) => {
          if ((!value && value !== 0) || value == 0) return '';
          const st = this.cbbStatusPur.find((p: any) => p.ID === parseInt(value) || p.ID === value);
          return st ? st.Name : value;
        }
      },
      {
        id: 'DocumentStatusHR',
        name: 'Trạng thái HR',
        field: 'DocumentStatusHR',
        type: 'string',
        width: 100,
        sortable: true,
        filterable: true,
        editor: this.activeHR ? {
          model: Editors['singleSelect'],
          collection: [{ ID: null, Name: '-- Chọn --' }, ...this.cbbStatus],
          customStructure: {
            value: 'ID',
            label: 'Name'
          }
        } : undefined,
        formatter: (row: number, cell: number, value: any) => {
          if ((!value && value !== 0) || value == 0) return '';
          const st = this.cbbStatus.find((p: any) => p.ID === parseInt(value) || p.ID === value);
          return st ? st.Name : value;
        }
      },
      {
        id: 'DocumentImportCode',
        name: 'Mã chứng từ',
        field: 'DocumentImportCode',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'DocumentImportName',
        name: 'Tên chứng từ',
        field: 'DocumentImportName',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true
      },
      {
        id: 'ReasonCancel',
        name: 'Lý do',
        field: 'ReasonCancel',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['longText']
        }
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['longText']
        }
      },
      {
        id: 'UpdatedBy',
        name: 'Người thay đổi',
        field: 'UpdatedBy',
        type: 'string',
        width: 100,
        sortable: true,
        filterable: true
      },
      {
        id: 'UpdatedDate',
        name: 'Ngày thay đổi',
        field: 'UpdatedDate',
        type: 'date',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: formatDate,
        cssClass: 'text-center'
      }
    ];

    this.gridOptionsMaster = {
      autoResize: {
        container: '#grid-container',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createPreHeaderPanel: false,
      showPreHeaderPanel: false,
      editable: true,
      autoEdit: true,
    };
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;
    
    // Add cell change handler using DataView
    angularGrid.dataView.onRowsChanged.subscribe((e: any, args: any) => {
      // Check if any rows were updated
      if (args.rows && args.rows.length > 0) {
        for (const row of args.rows) {
          const item = this.dataBillDocumentImport[row];
          if (item) {
            item._edited = true;
            this.flag = false; // Set flag to false when data is edited
            console.log('Row changed - row:', row, 'item:', item);
          }
        }
      }
    });

    // Add onCellChange event to track cell edits
    angularGrid.slickGrid.onCellChange.subscribe((e: any, args: any) => {
      const item = angularGrid.dataView.getItem(args.row);
      if (item) {
        item._edited = true;
        this.flag = false;
        console.log('Cell changed - row:', args.row, 'cell:', args.cell, 'item:', item);
      }
    });
  }

  onCellClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.id = item['ID'] || 0;
      console.log('documentimportid', this.id);
      this.documentImportID = item['DocumentImportID'] || 0;
      this.getBillDocumentImportLog(this.id, this.documentImportID);
    }
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.dataBillDocumentImport[args.rows[0]];
      if (selectedRow) {
        this.id = selectedRow['ID'] || 0;
        this.documentImportID = selectedRow['DocumentImportID'] || 0;
        console.log('Selected row - ID:', this.id, 'DocumentImportID:', this.documentImportID);
        this.getBillDocumentImportLog(this.id, this.documentImportID);
      }
    } else {
      // Clear selection
      this.bdeID = 0;
      this.documentImportID = 0;
      this.dataBillDocumentImportLog = [];
      console.log('Row deselected, cleared log data');
    }
  }

  initGridLog() {
    // Format date helper for log
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;
      } catch (e) {
        return value;
      }
    };

    this.columnDefinitionsLog = [
      {
        id: 'DocumentStatusText',
        name: 'Trạng thái',
        field: 'DocumentStatusText',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'DocumentImportCode',
        name: 'Mã chứng từ',
        field: 'DocumentImportCode',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'DocumentImportName',
        name: 'Tên chứng từ',
        field: 'DocumentImportName',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true
      },
      {
        id: 'Note',
        name: 'Lý do / Ghi chú',
        field: 'Note',
        type: 'string',
        width: 350,
        sortable: true,
        filterable: true
      },
      {
        id: 'UpdatedDate',
        name: 'Ngày thay đổi',
        field: 'UpdatedDate',
        type: 'date',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: formatDate,
        cssClass: 'text-center'
      },
      {
        id: 'UpdatedBy',
        name: 'Người thay đổi',
        field: 'UpdatedBy',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      }
    ];

    this.gridOptionsLog = {
      autoResize: {
        container: '#grid-container',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createPreHeaderPanel: false,
      showPreHeaderPanel: false
    };
  }

  angularGridLogReady(angularGrid: AngularGridInstance) {
    this.angularGridLog = angularGrid;
  }

  onCellLogClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
  }

  handleRowLogSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
  }
}

import { Component, OnInit, AfterViewInit, NgZone, Input, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { ReportImportExportService } from '../report-import-export-service/report-import-export.service';
import { BillExportDetailNewComponent } from '../../BillExport/bill-export-detail-new/bill-export-detail-new.component';
import { BillImportDetailNewComponent } from '../../BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';

import {
  AngularGridInstance,
  AngularSlickgridComponent,
  Column,
  Filters,
  Formatters,
  GridOption,
} from 'angular-slickgrid';

@Component({
  selector: 'app-history-modal',
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
    NzDatePickerModule,
    NgbModule,
    AngularSlickgridComponent,
  ],
  templateUrl: './import-export-detail-modal.component.html',
  styleUrl: './import-export-detail-modal.component.css'
})
export class ImportExportModalComponent implements OnInit, AfterViewInit {
  @Input() productID: number = 0;

  // Unique grid identifiers using crypto
  private readonly uniqueId = crypto.randomUUID();
  readonly gridIdImport = `gridimportexportdetailimport${this.uniqueId}`;
  readonly gridIdExport = `gridimportexportdetailexport${this.uniqueId}`;

  // Grid instances
  angularGridImport!: AngularGridInstance;
  angularGridExport!: AngularGridInstance;

  // Grid configurations
  columnDefinitionsImport: Column[] = [];
  gridOptionsImport!: GridOption;
  datasetImport: any[] = [];

  columnDefinitionsExport: Column[] = [];
  gridOptionsExport!: GridOption;
  datasetExport: any[] = [];

  constructor(
    private reportImportExportService: ReportImportExportService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
  ) { }

  ExportID: number = 0;
  ImportID: number = 0;

  dataImport: any[] = [];
  dataExport: any = [];

  product: any[] = [];
  productSale = {
    productCode: '',
    productName: '',
    tonDauKy: 0,
    tonCuoiky: 0,
    tongNhap: 0,
    tongXuat: 0,
    soLuongGiu: 0
  }

  ngOnInit(): void {
    this.initGridColumns();
    this.initGridOptions();
    this.getHistory();
  }

  ngAfterViewInit(): void {
    // Grids will be resized once ready
  }

  private initGridOptions(): void {
    const commonOptions: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableSelection: true,
      selectionOptions: {
        selectActiveRow: true,
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      enableHeaderMenu: false,
    };

    this.gridOptionsImport = { ...commonOptions };
    this.gridOptionsExport = { ...commonOptions };
  }

  private initGridColumns(): void {
    const formatDate = (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const formatNumber = (value: any, decimalPlaces: number = 2) => {
      if (value === null || value === undefined || value === '') return '';
      const num = Number(value);
      if (isNaN(num)) return value;
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    };

    this.columnDefinitionsImport = [
      {
        id: 'Status',
        field: 'Status',
        name: 'Nhận chứng từ',
        width: 100,
        sortable: true,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center',
      },
      {
        id: 'DateStatus',
        field: 'DateStatus',
        name: 'Ngày nhận',
        width: 110,
        sortable: true,
        formatter: (row, cell, value) => formatDate(value),
        cssClass: 'text-center',
      },
      {
        id: 'BillImportCode',
        field: 'BillImportCode',
        name: 'Số phiếu',
        width: 130,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'CreatDate',
        field: 'CreatDate',
        name: 'Ngày tạo',
        width: 110,
        sortable: true,
        formatter: (row, cell, value) => formatDate(value),
        cssClass: 'text-center',
      },
      {
        id: 'Reciver',
        field: 'Reciver',
        name: 'Người nhận',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Deliver',
        field: 'Deliver',
        name: 'Người giao',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Suplier',
        field: 'Suplier',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Qty',
        field: 'Qty',
        name: 'Số lượng',
        width: 100,
        sortable: true,
        formatter: (row, cell, value) => formatNumber(value, 2),
        cssClass: 'text-right',
      },
      {
        id: 'Project',
        field: 'Project',
        name: 'Dự án',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
    ];

    this.columnDefinitionsExport = [
      {
        id: 'IsApproved',
        field: 'IsApproved',
        name: 'Trạng thái',
        width: 100,
        sortable: true,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center',
      },
      {
        id: 'DateStatus',
        field: 'DateStatus',
        name: 'Ngày nhận',
        width: 110,
        sortable: true,
        formatter: (row, cell, value) => formatDate(value),
        cssClass: 'text-center',
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Số phiếu',
        width: 130,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'CreatDate',
        field: 'CreatDate',
        name: 'Ngày tạo',
        width: 110,
        sortable: true,
        formatter: (row, cell, value) => formatDate(value),
        cssClass: 'text-center',
      },
      {
        id: 'Receiver',
        field: 'Receiver',
        name: 'Người nhận',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Deliver',
        field: 'Deliver',
        name: 'Người giao',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'CustomerName',
        field: 'CustomerName',
        name: 'Khách Hàng',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Qty',
        field: 'Qty',
        name: 'Số lượng',
        width: 100,
        sortable: true,
        formatter: (row, cell, value) => formatNumber(value, 2),
        cssClass: 'text-right',
      },
      {
        id: 'ReturnAmount',
        field: 'ReturnAmount',
        name: 'Số lượng trả',
        width: 120,
        sortable: true,
        formatter: (row, cell, value) => formatNumber(value, 2),
        cssClass: 'text-right',
      },
      {
        id: 'Remain',
        field: 'Remain',
        name: 'Số lượng chưa trả',
        width: 130,
        sortable: true,
        formatter: (row, cell, value) => formatNumber(value, 2),
        cssClass: 'text-right',
      },
      {
        id: 'Project',
        field: 'Project',
        name: 'Dự án',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
    ];
  }

  angularGridReadyImport(angularGrid: AngularGridInstance): void {
    this.angularGridImport = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridReadyExport(angularGrid: AngularGridInstance): void {
    this.angularGridExport = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  handleRowDoubleClickImport(event: any): void {
    const customEvent = event as CustomEvent;
    if (customEvent?.detail) {
      const args = customEvent.detail.args;
      if (args?.dataContext) {
        this.ImportID = args.dataContext.ID || 0;
        this.zone.run(() => {
          this.openModalBillImportDetail(true);
        });
      }
    }
  }

  handleRowDoubleClickExport(event: any): void {
    const customEvent = event as CustomEvent;
    if (customEvent?.detail) {
      const args = customEvent.detail.args;
      if (args?.dataContext) {
        this.ExportID = args.dataContext.ID || 0;
        this.zone.run(() => {
          this.openModalBillExportDetail(true);
        });
      }
    }
  }

  getHistory() {
    this.reportImportExportService.getHistoryImportExport(this.productID, "HN")
      .subscribe({
        next: (res) => {
          if (res?.data?.length) {
            const row = res.data[0] ?? [];     // Thông tin tổng quan sản phẩm
            const dtI = res.data[1] ?? [];     // Dữ liệu nhập
            const dtE = res.data[2] ?? [];

            this.dataImport = dtI;
            this.dataExport = dtE;

            // Map data with id unique for SlickGrid
            this.datasetImport = (dtI || []).map((item: any, index: number) => ({
              ...item,
              id: item.ID || `imp_${index}_${Date.now()}`
            }));

            this.datasetExport = (dtE || []).map((item: any, index: number) => ({
              ...item,
              id: item.ID || `exp_${index}_${Date.now()}`
            }));

            this.cdr.detectChanges();

            setTimeout(() => {
              if (this.angularGridImport) {
                this.angularGridImport.resizerService.resizeGrid();
              }
              if (this.angularGridExport) {
                this.angularGridExport.resizerService.resizeGrid();
              }
            }, 100);

            // Thông tin tổng quan sản phẩm
            if (row.length > 0) {
              this.productSale = {
                productCode: row[0].ProductCode,
                productName: row[0].ProductName,
                tonDauKy: row[0].TotalQuantityFirst ?? 0,
                // tonCuoiky: (row[0].TotalQuantityFirst ?? 0) + (row[0].TotalImport ?? 0) - (row[0].TotalExport ?? 0) - (row[0].TotalRequestExport ?? 0) - (row[0].TotalKeep ?? 0),
                tonCuoiky: (row[0].TotalQuantityLast ?? 0),
                tongNhap: row[0].TotalImport ?? 0,
                tongXuat: row[0].TotalExport ?? 0,
                soLuongGiu: row[0].TotalKeep,
              };
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy dữ liệu', err);
        }
      });
  }

  closeModal() {
    this.activeModal.dismiss(true);
  }

  openModalBillExportDetail(ischeckmode: boolean) {
    const modalRef = this.modalService.open(BillExportDetailNewComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.isCheckmode = ischeckmode;
    modalRef.componentInstance.id = this.ExportID;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.ExportID = 0;
        }
      },
    );
  }

  openModalBillImportDetail(ischeckmode: boolean) {
    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.isCheckmode = ischeckmode;
    modalRef.componentInstance.id = this.ImportID;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.ImportID = 0;
        }
      },
    );
  }
}


import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  Inject,
  Optional,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SplitterModule } from 'primeng/splitter';
import { CardModule } from 'primeng/card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';

import { ChiTieitSanPhamSaleService } from '../chi-tieit-san-pham-sale.service';
import { ClipboardService } from '../../../../../services/clipboard.service';
import { BillImportDetailNewComponent } from '../../BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';
import { BillExportDetailNewComponent } from '../../BillExport/bill-export-detail-new/bill-export-detail-new.component';

// Lightweight column definition for p-table
interface Col {
  field: string;
  header: string;
  width: string;
  align?: 'left' | 'center' | 'right';
  format?: (val: any, row?: any) => string;
  footerType?: 'sum' | 'count';
}

@Component({
  selector: 'app-chi-tiet-san-pham-sale-new',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSpinModule,
    TableModule,
    InputTextModule,
    MultiSelectModule,
    SplitterModule,
    CardModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './chi-tiet-san-pham-sale-new.component.html',
  styleUrl: './chi-tiet-san-pham-sale-new.component.css',
})
export class ChiTietSanPhamSaleNewComponent
  implements OnInit, AfterViewInit, OnChanges
{
  // ─── Inputs ──────────────────────────────────────────────────────────────
  @Input() code: string = '';
  @Input() suplier: string = '';
  @Input() productName: string = '';
  @Input() numberDauKy: string = '';
  @Input() numberCuoiKy: string = '';
  @Input() import: string = '';
  @Input() export: string = '';
  @Input() productSaleID: number = 0;
  @Input() wareHouseCode: string = '';
  @Input() oProductSaleModel: any;

  // ─── Data ────────────────────────────────────────────────────────────────
  dtProduct: any[] = [];
  dtImport: any[] = [];
  dtExport: any[] = [];
  dtRequestImport: any[] = [];
  dtRequestExport: any[] = [];
  dtHold: any[] = [];

  isLoading: boolean = false;

  // ─── Totals ──────────────────────────────────────────────────────────────
  totalImport: number = 0;
  totalExport: number = 0;
  totalRequestExport: number = 0;
  totalKeep: number = 0;
  totalLast: number = 0;

  // ─── Column definitions ───────────────────────────────────────────────────
  colsImport: Col[] = [];
  colsExport: Col[] = [];
  colsRequestExport: Col[] = [];
  colsRequestImport: Col[] = [];
  colsHold: Col[] = [];

  // ─── Filter option caches (for multiselect) ───────────────────────────────
  filterCache: { [tableKey: string]: { [field: string]: { label: string; value: any }[] } } = {};

  // ─── Clipboard ────────────────────────────────────────────────────────────
  private selectedCellValue: string | null = null;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'c' && this.selectedCellValue !== null) {
      event.preventDefault();
      this.clipboardService.copy(this.selectedCellValue);
    }
  }

  // ─── Constructor ─────────────────────────────────────────────────────────
  constructor(
    private srv: ChiTieitSanPhamSaleService,
    private notificationService: NzNotificationService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private clipboardService: ClipboardService,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    if (this.tabData) {
      this.code = this.tabData.code || '';
      this.suplier = this.tabData.suplier || '';
      this.productName = this.tabData.productName || '';
      this.numberDauKy = this.tabData.numberDauKy || '';
      this.numberCuoiKy = this.tabData.numberCuoiKy || '';
      this.import = this.tabData.import || '';
      this.export = this.tabData.export || '';
      this.productSaleID = this.tabData.productSaleID || 0;
      this.wareHouseCode = this.tabData.wareHouseCode || '';
      this.oProductSaleModel = this.tabData.oProductSaleModel;
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    this.initColumns();
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.code = params['code'] || '';
        this.suplier = params['suplier'] || '';
        this.productName = params['productName'] || '';
        this.numberDauKy = params['numberDauKy'] || '';
        this.numberCuoiKy = params['numberCuoiKy'] || '';
        this.import = params['import'] || '';
        this.export = params['export'] || '';
        this.productSaleID = parseInt(params['productSaleID'] || '0', 10);
        this.wareHouseCode = params['wareHouseCode'] || '';
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['oProductSaleModel'] && this.oProductSaleModel) {
      if (this.oProductSaleModel.ProductSaleID !== undefined) {
        this.productSaleID = this.oProductSaleModel.ProductSaleID;
      } else if (this.oProductSaleModel.productSaleID !== undefined) {
        this.productSaleID = this.oProductSaleModel.productSaleID;
      }
    }

    if (
      (changes['productSaleID'] ||
        changes['wareHouseCode'] ||
        changes['oProductSaleModel']) &&
      this.productSaleID &&
      this.wareHouseCode
    ) {
      this.loaddata();
    }
  }

  ngAfterViewInit() {
    if (this.productSaleID && this.wareHouseCode) {
      this.loaddata();
    }
  }

  // ─── Format helpers ───────────────────────────────────────────────────────
  fmtDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  fmtDateTime(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return (
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  fmtNum(val: any): string {
    if (val == null) return '';
    const n = parseFloat(val);
    return isNaN(n) ? '' : n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /** Called from the template to format a cell value using the column's format fn */
  getCellValue(row: any, col: Col): string {
    const raw = row[col.field];
    return col.format ? col.format(raw, row) : (raw ?? '');
  }

  /** Sum a numeric field across displayed rows */
  getFooterSum(data: any[], field: string): string {
    const s = data.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
    return this.fmtNum(s);
  }

  // ─── Column init ─────────────────────────────────────────────────────────
  initColumns() {
    // Phiếu nhập
    this.colsImport = [
      { field: 'BillTypeText', header: 'Trạng thái',    width: '120px' },
      { field: 'BillImportCode', header: 'Số phiếu',    width: '130px' },
      { field: 'CreatDate',    header: 'Ngày nhập',      width: '110px', align: 'center', format: v => this.fmtDate(v) },
      { field: 'Reciver',      header: 'Người nhận',     width: '140px' },
      { field: 'Deliver',      header: 'Người giao',     width: '140px' },
      { field: 'Suplier',      header: 'Nhà cung cấp',   width: '180px' },
      { field: 'Qty',          header: 'Số lượng',       width: '90px',  align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'Project',      header: 'Dự án',          width: '160px' },
      { field: 'Status',       header: 'Nhận chứng từ',  width: '110px', align: 'center', format: v => v === true ? '✓' : '' },
      { field: 'DateStatus',   header: 'Ngày nhận CT',   width: '120px', align: 'center', format: v => this.fmtDate(v) },
      { field: 'CreatedDate',  header: 'Ngày tạo',       width: '130px', align: 'center', format: v => this.fmtDateTime(v) },
    ];

    // Phiếu xuất
    this.colsExport = [
      { field: 'nameStatus',    header: 'Trạng thái',         width: '120px' },
      { field: 'Code',          header: 'Số phiếu',           width: '130px' },
      { field: 'CreatDate',     header: 'Ngày xuất',          width: '110px', align: 'center', format: v => this.fmtDate(v) },
      { field: 'Receiver',      header: 'Người nhận',         width: '140px' },
      { field: 'Deliver',       header: 'Người giao',         width: '140px' },
      { field: 'Qty',           header: 'Số lượng',           width: '90px',  align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'ReturnAmount',  header: 'SL trả',             width: '90px',  align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'Remain',        header: 'SL chưa trả',        width: '110px', align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'CustomerName',  header: 'Khách hàng',         width: '160px' },
      { field: 'Project',       header: 'Dự án',              width: '160px' },
      { field: 'IsApproved',    header: 'Nhận chứng từ',      width: '110px', align: 'center', format: v => v === true ? '✓' : '' },
      { field: 'DateStatusE',   header: 'Ngày nhận CT',       width: '120px', align: 'center', format: v => this.fmtDate(v) },
      { field: 'CreatedDate',   header: 'Ngày tạo',           width: '130px', align: 'center', format: v => this.fmtDateTime(v) },
    ];

    // Phiếu yêu cầu xuất — same structure
    this.colsRequestExport = [...this.colsExport];

    // Phiếu yêu cầu nhập — same as import
    this.colsRequestImport = [...this.colsImport];

    // Hàng giữ
    this.colsHold = [
      { field: 'ProductCode',         header: 'Mã sản phẩm',  width: '130px', footerType: 'count' },
      { field: 'ProductName',         header: 'Tên sản phẩm', width: '200px' },
      { field: 'ProductNewCode',      header: 'Mã nội bộ',    width: '120px' },
      { field: 'Unit',                header: 'ĐVT',           width: '70px',  align: 'center' },
      { field: 'AddressBox',          header: 'Vị trí',        width: '100px' },
      { field: 'Quantity',            header: 'SL giữ',        width: '90px',  align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'TotalQuantityExport', header: 'SL xuất',       width: '90px',  align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'TotalQuantityRemain', header: 'SL còn lại',    width: '100px', align: 'right', format: v => this.fmtNum(v), footerType: 'sum' },
      { field: 'ProjectCode',         header: 'Mã dự án',      width: '110px' },
      { field: 'ProjectName',         header: 'Tên dự án',     width: '180px' },
      { field: 'CustomerName',        header: 'Khách hàng',    width: '160px' },
      { field: 'POCode',              header: 'Mã POKH',       width: '110px' },
      { field: 'PONumber',            header: 'Số POKH',       width: '110px' },
      { field: 'Code',                header: 'Mã NV',         width: '90px' },
      { field: 'FullName',            header: 'Tên NV',        width: '140px' },
      { field: 'Note',                header: 'Ghi chú',       width: '150px' },
      { field: 'CreatedDate',         header: 'Ngày tạo',      width: '130px', align: 'center', format: v => this.fmtDateTime(v) },
    ];
  }

  // ─── Filter options (text filter only, no multiselect for simplicity) ─────
  getFilterOptions(data: any[], field: string): { label: string; value: any }[] {
    const unique = [...new Set((data || []).map(r => r[field]).filter(v => v != null))];
    return unique.map(v => ({ label: String(v), value: v }));
  }

  // ─── Footer helpers ──────────────────────────────────────────────────────
  getFooterValue(data: any[], col: Col): string {
    if (!col.footerType) return '';
    if (col.footerType === 'count') return String(data.length);
    if (col.footerType === 'sum') {
      return this.getFooterSum(data, col.field);
    }
    return '';
  }

  // ─── Data loading ─────────────────────────────────────────────────────────
  loaddata() {
    this.isLoading = true;
    this.srv
      .getHistoryImportExportProductSale(this.productSaleID, this.wareHouseCode)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.status === 1 && res.data) {
            this.dtProduct       = res.data.dtProduct       || [];
            this.dtImport        = res.data.dtImport        || [];
            this.dtExport        = res.data.dtExport        || [];
            this.dtRequestImport = res.data.dtRequestImport || [];
            this.dtRequestExport = res.data.dtRequestExport || [];
            this.dtHold          = res.data.dtHold          || [];

            if (this.dtProduct.length > 0) {
              const p = this.dtProduct[0];
              this.productName  = p.ProductName || '';
              this.code         = p.ProductCode || '';
              this.numberDauKy  = p.TotalQuantityFirst?.toString() || '0';
              this.numberCuoiKy = p.TotalQuantityLast?.toString()  || '0';
              this.import       = p.TotalImport?.toString()        || '0';
              this.export       = p.TotalExport?.toString()        || '0';
            }

            this.calculator();
            this.filterCache = {}; // clear cached filter options
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.notificationService.error('Lỗi', err.error?.message || 'Không thể tải dữ liệu.');
        },
      });
  }

  calculator() {
    this.totalImport        = this.dtImport.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0);
    this.totalExport        = this.dtExport.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0);
    this.totalRequestExport = this.dtRequestExport.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0);
    this.totalKeep          = this.dtHold.reduce((s, r) => s + (parseFloat(r.TotalQuantityRemain) || 0), 0);
    const dk = parseFloat(this.numberDauKy) || 0;
    this.totalLast = dk + this.totalImport - this.totalExport - this.totalRequestExport - this.totalKeep;
  }

  onProductChange(productSaleID: number) {
    if (!productSaleID) return;
    this.productSaleID = productSaleID;
    const p = this.dtProduct.find(x => x.ProductSaleID === productSaleID);
    if (p) {
      this.productName = p.ProductName || p.productname || '';
      this.code        = p.ProductCode || p.productcode || '';
    }
    this.loaddata();
  }

  refreshData() { this.loaddata(); }

  // ─── Row style (yellow for export rows with remaining qty) ────────────────
  exportRowStyle(row: any): any {
    return (parseFloat(row['Remain']) || 0) > 0 && row['Status'] == 0
      ? { 'background-color': '#FFFF00' }
      : {};
  }

  // ─── Cell click for Ctrl+C ────────────────────────────────────────────────
  onCellClick(val: any) {
    this.selectedCellValue = val !== null && val !== undefined ? String(val) : '';
  }

  // ─── Modal openers ────────────────────────────────────────────────────────
  openBillImportDetail(rowData: any) {
    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      centered: true, backdrop: 'static', keyboard: false, fullscreen: true,
    });
    modalRef.componentInstance.newBillImport = rowData;
    modalRef.componentInstance.isCheckmode   = true;
    modalRef.componentInstance.id            = rowData.ID || rowData.id || 0;
    modalRef.componentInstance.WarehouseCode = this.wareHouseCode;
    modalRef.result.finally(() => this.loaddata());
  }

  openBillExportDetail(rowData: any) {
    const modalRef = this.modalService.open(BillExportDetailNewComponent, {
      centered: true, backdrop: 'static', keyboard: false, fullscreen: true,
    });
    modalRef.componentInstance.newBillExport  = rowData;
    modalRef.componentInstance.isCheckmode    = true;
    modalRef.componentInstance.id             = rowData.ID || rowData.id || 0;
    modalRef.componentInstance.warehouseCode  = this.wareHouseCode;
    modalRef.result.catch((result) => { if (result == true) this.loaddata(); });
  }
}

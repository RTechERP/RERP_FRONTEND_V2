import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabSetComponent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, ColumnDefinition, RowComponent, CellComponent } from 'tabulator-tables';
import { PONCCService } from './poncc.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { SupplierSaleService } from '../supplier-sale/supplier-sale.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NzSpinComponent } from "ng-zorro-antd/spin";
import { PonccDetailComponent } from './poncc-detail/poncc-detail.component';
import { PonccSummaryComponent } from './poncc-summary/poncc-summary.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { BillImportDetailComponent } from '../../old/Sale/BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { firstValueFrom } from 'rxjs';
import { BillImportTechnicalComponent } from '../../old/bill-import-technical/bill-import-technical.component';
import { BillImportTechnicalFormComponent } from '../../old/bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
@Component({
  selector: 'app-poncc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSplitterModule,
    NzTabSetComponent,
    NzTabComponent,
    NzSpinComponent,
    NzModalModule,
    HasPermissionDirective,
    NzDropDownModule
  ],
  templateUrl: './poncc.component.html',
  styleUrls: ['./poncc.component.css'],
})
export class PONCCComponent implements OnInit, AfterViewInit {
  @ViewChild('table_poThuongMai', { static: false }) tablePoThuongMaiRef!: ElementRef;
  @ViewChild('table_poMuon', { static: false }) tablePoMuonRef!: ElementRef;
  @ViewChild('table_ponccdetail', { static: false }) detailRef!: ElementRef;

  tablePoThuongMai!: Tabulator;
  tablePoMuon!: Tabulator;
  tableDetail!: Tabulator;
  activeTabIndex: number = 0;
  lastMasterId: number | null = null;
  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  supplierId: number = 0;
  employeeId: number = 0;
  status: number = -1;
  keyword: string = '';
  pageNumber = 1;
  pageSize = 1000;
  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  suppliers: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;
  listAllID: string[] = [];
  checkList: boolean[] = [];

  listDetail: any[] = [];

  // Map to store details for each master PONCC ID
  private masterDetailsMap: Map<number, any[]> = new Map();

  constructor(
    private srv: PONCCService,
    private modal: NzModalService,
    private notify: NzNotificationService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private supplierSaleService: SupplierSaleService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    this.initTables();
    this.initDetailTable();
    setTimeout(() => {
      this.onSearch();
    }, 0);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  /**
   * Reset all search filters to default values
   */
  resetSearch(): void {
    this.dateStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.dateEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    this.supplierId = 0;
    this.employeeId = 0;
    this.status = -1;
    this.keyword = '';

    // Optionally trigger search after reset
    this.onSearch();
  }

  private loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
    this.supplierSaleService.getNCC().subscribe({
      next: (res) => (this.suppliers = res.data || []),
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhà cung cấp: ' + error.message);
      },
    });
  }

  onSearch(): void {
    this.isLoading = true;
    const filter = {
      DateStart: new Date(this.dateStart.setHours(0, 0, 0, 0)).toISOString(),
      DateEnd: new Date(this.dateEnd.setHours(23, 59, 59, 999)).toISOString(),
      Status: this.status,
      SupplierID: this.supplierId || 0,
      EmployeeID: this.employeeId || 0,
      Keyword: this.keyword?.trim() || '',
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      POType: this.activeTabIndex, // 0: PO thương mại, 1: PO mượn
    };

    this.srv.getAll(filter).subscribe({
      next: (rows) => {
        const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
        currentTable?.setData(rows.data || []);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notify.error('Lỗi', 'Không tải được dữ liệu PO NCC');
      },
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.onSearch();
  }

  // private loadDetails(poid: number): void {
  //   this.isLoading = true;
  //   this.srv.getDetails(poid).subscribe({
  //     next: (res: any) => {
  //       console.log(res);
  //       this.tableDetail?.setData(res.data.data || []).then(() => {
  //         this.tableDetail?.selectRow();
  //       });
  //       this.listAllID = res.data.listAllID;
  //       this.checkList = res.data.checkList;
  //       this.isLoading = false;
  //     },
  //     error: () => {
  //       this.isLoading = false;
  //       this.notify.error('Lỗi', 'Không tải được chi tiết');
  //     },
  //   });
  // }

  /**
   * Handle master table selection changes
   * - Detail table: Shows only the latest selected master's details  
   * - Map: Stores all details from all selected masters (for other operations)
   */
  private handleMasterSelectionChange(selectedMasters: any[]): void {
    const selectedIds = selectedMasters.map(m => m.ID);

    // Nếu không còn master nào → clear hết
    if (selectedIds.length === 0) {
      this.masterDetailsMap.clear();
      this.lastMasterId = null;
      this.tableDetail?.clearData();
      this.sizeTbDetail = '0';
      return;
    }

    this.sizeTbDetail = '35%';

    const newMasterIds = selectedIds.filter(id => !this.masterDetailsMap.has(id));
    const deselectedIds = Array.from(this.masterDetailsMap.keys()).filter(id => !selectedIds.includes(id));
    deselectedIds.forEach(id => this.masterDetailsMap.delete(id));

    if (newMasterIds.length > 0) {

      const latestMasterId = newMasterIds[newMasterIds.length - 1];

      if (this.lastMasterId && this.masterDetailsMap.has(this.lastMasterId)) {
        const currentSelectedDetails = this.tableDetail?.getSelectedData() || [];
        const selectedDetailIds = new Set(currentSelectedDetails.map((d: any) => d.ID));

        const oldDetails = this.masterDetailsMap.get(this.lastMasterId) || [];
        const filtered = oldDetails.filter(d => selectedDetailIds.has(d.ID));

        if (filtered.length > 0) {
          this.masterDetailsMap.set(this.lastMasterId, filtered);
        } else {
          this.masterDetailsMap.delete(this.lastMasterId);
        }
      }
      this.lastMasterId = latestMasterId;

      this.isLoading = true;
      let loadedCount = 0;

      // Load detail cho master mới
      newMasterIds.forEach(masterId => {
        this.srv.getDetails(masterId).subscribe({
          next: (res: any) => {
            this.masterDetailsMap.set(masterId, res.data.data || []);
            loadedCount++;

            if (loadedCount === newMasterIds.length) {
              this.displayDetailsForMaster(latestMasterId);
              this.isLoading = false;
            }
          },
          error: () => {
            loadedCount++;

            if (loadedCount === newMasterIds.length) {
              this.displayDetailsForMaster(latestMasterId);
              this.isLoading = false;
            }

            this.notify.error('Lỗi', `Không tải được chi tiết cho PO ID: ${masterId}`);
          },
        });
      });

    } else {
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      this.lastMasterId = lastSelectedId;
      this.displayDetailsForMaster(lastSelectedId);
    }

    console.log(this.masterDetailsMap);
  }


  private displayDetailsForMaster(masterId: number): void {
    const details = this.masterDetailsMap.get(masterId) || [];

    // Update detail table with only this master's details
    this.tableDetail?.setData(details).then(() => {
      this.tableDetail?.selectRow();
    });
  }


  private initTables() {
    const columns: ColumnDefinition[] = [
      {
        title: 'Duyệt', field: 'IsApproved', hozAlign: 'center', width: 70, headerSort: false, frozen: true,
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      { title: 'Trạng thái', field: 'StatusText', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea', frozen: true, },
      {
        title: 'Ngày PO', field: 'RequestDate', width: 100, headerSort: false, hozAlign: 'center', frozen: true,
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
      },
      {
        title: 'Ngày giao hàng', field: 'DeliveryDate', width: 100, headerSort: false, hozAlign: 'center', frozen: true,
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
      },
      { title: 'Số PO', field: 'POCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea', bottomCalc: 'count' },
      { title: 'Số đơn hàng', field: 'BillCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea', bottomCalc: 'count' },
      {
        title: 'Tổng tiền', field: 'TotalMoneyPO', width: 120, headerSort: false, hozAlign: 'right',
        bottomCalc: 'sum', bottomCalcFormatter: (cell: any) => this.formatNumberEnUS(cell.getValue()),
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'Loại tiền', field: 'CurrencyText', width: 80, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Tỷ giá', field: 'CurrencyRate', width: 100, headerSort: false, hozAlign: 'right',
        bottomCalc: 'sum', bottomCalcFormatter: (cell: any) => this.formatNumberEnUS(cell.getValue()),
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'Nhà cung cấp', field: 'NameNCC', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },

      { title: 'Nhân viên mua', field: 'FullName', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },

      {
        title: 'Công nợ', field: 'DeptSupplier', width: 120, headerSort: false, hozAlign: 'center',
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      {
        title: 'Phí ngân hàng', field: 'BankCharge', width: 120, headerSort: false, hozAlign: 'right',
        bottomCalc: 'sum', bottomCalcFormatter: (cell: any) => this.formatNumberEnUS(cell.getValue()),
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'Điều khoản TT', field: 'RulePayName', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Công ty', field: 'CompanyText', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },


      { title: 'Fedex account', field: 'FedexAccount', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Điều khoản Incoterm', field: 'RuleIncoterm', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Chứng từ NCC', field: 'SupplierVoucher', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Xuất xứ', field: 'OriginItem', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Diễn giải', field: 'Note', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },

      { title: 'Loại PO', field: 'POTypeText', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
    ];

    if (this.tablePoThuongMaiRef) {
      this.tablePoThuongMai = new Tabulator(this.tablePoThuongMaiRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        columns: columns,
        height: '52vh',
        data: [],
        layout: 'fitDataStretch',
        selectableRows: true,
        paginationMode: 'local',
      } as any);
      this.tablePoThuongMai.on('rowSelectionChanged', (data: any[], rows: any[]) => {
        this.handleMasterSelectionChange(data);
      });
    }

    if (this.tablePoMuonRef) {
      this.tablePoMuon = new Tabulator(this.tablePoMuonRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        columns: columns,
        height: '52vh',
        layout: 'fitDataStretch',
        data: [],
        selectableRows: true,
        paginationMode: 'local',
      });
      this.tablePoMuon.on('rowSelectionChanged', (data: any[], rows: any[]) => {
        this.handleMasterSelectionChange(data);
      });
    }
  }

  private initDetailTable() {
    const columns: ColumnDefinition[] = [
      { title: 'STT', field: 'STT', width: 50, headerSort: false, hozAlign: 'center', formatter: 'textarea', frozen: true, },
      { title: 'Mã sản phẩm', field: 'ProductCode', width: 120, headerSort: false, frozen: true, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên sản phẩm', field: 'ProductName', width: 200, headerSort: false, frozen: true, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên nhóm', field: 'ProductGroupName', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã SP NCC', field: 'ProductCodeOfSupplier', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã cha', field: 'ParentProductCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã dự án', field: 'ProjectCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên dự án', field: 'ProjectName', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },

      { title: 'ĐVT', field: 'UnitName', width: 80, headerSort: false, hozAlign: 'left', formatter: 'textarea' },


      { title: 'SL yêu cầu', field: 'QtyRequest', width: 100, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0) },
      { title: 'SL đã yêu cầu', field: 'QuantityRequested', width: 100, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0) },
      { title: 'SL đã về', field: 'QuantityReturn', width: 100, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0) },
      { title: 'SL còn lại', field: 'QuantityRemain', width: 100, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0) },

      { title: 'Đơn giá', field: 'UnitPrice', width: 120, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },
      { title: 'Thành tiền', field: 'ThanhTien', width: 120, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },

      { title: 'VAT (%)', field: 'VAT', width: 80, headerSort: false, hozAlign: 'right', formatter: 'textarea' },
      { title: 'Tổng tiền VAT', field: 'VATMoney', width: 120, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },
      {
        title: 'Hóa đơn', field: 'IsBill', hozAlign: 'center', width: 80, headerSort: false,
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },

      { title: 'Chiết khấu (%)', field: 'DiscountPercent', width: 100, headerSort: false, hozAlign: 'right', formatter: 'textarea' },
      { title: 'Tiền chiết khấu', field: 'Discount', width: 120, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },

      { title: 'Phí vận chuyển', field: 'FeeShip', width: 120, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },
      { title: 'Tổng tiền', field: 'TotalPrice', width: 120, headerSort: false, hozAlign: 'right', bottomCalc: 'sum', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },

      { title: 'Deadline giao hàng', field: 'DeadlineDelivery', width: 100, headerSort: false, hozAlign: 'center', formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue()) },
      { title: 'Ngày dự kiến', field: 'ExpectedDate', width: 100, headerSort: false, hozAlign: 'center', formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue()) },
      { title: 'Ngày thực tế', field: 'ActualDate', width: 100, headerSort: false, hozAlign: 'center', formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue()) },

      { title: 'Giá bán', field: 'PriceSale', width: 120, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },
      { title: 'Giá lịch sử', field: 'PriceHistory', width: 120, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },
      { title: 'Giá thầu', field: 'BiddingPrice', width: 120, headerSort: false, hozAlign: 'right', formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()) },

      { title: 'Diễn giải', field: 'Note', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
    ];

    if (this.detailRef) {
      this.tableDetail = new Tabulator(this.detailRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        columns: columns,
        layout: 'fitDataStretch',
        height: '100%',
        data: [],
        pagination: false,
      });

      this.tableDetail.on('rowSelectionChanged', (data: any[], rows: any[]) => {
        this.handleSelectionChange(data);
      });
    }
  }

  handleSelectionChange(selectedRows: any[]) {
    const selectedIds = selectedRows.map(r => r.ID);
    this.listDetail = selectedIds;
  }

  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  private formatDateDDMMYYYY(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const p2 = (n: number) => String(n).padStart(2, '0');
      return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  }

  onAddPoncc() {
    const modalRef = this.modalService.open(PonccDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  onEditPoncc() {
    // Get selected row from current active table
    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
    const selectedRows = currentTable?.getSelectedData();

    // Validate selection
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một PO để sửa');
      return;
    }

    const selectedPO = selectedRows[0];

    // Show loading
    this.isLoading = true;

    // Load detail data from API
    this.srv.getDetails(selectedPO.ID).subscribe({
      next: (detailResponse: any) => {
        this.isLoading = false;

        // Open modal with master and detail data
        const modalRef = this.modalService.open(PonccDetailComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          windowClass: 'full-screen-modal',
        });

        // Pass data to modal component
        modalRef.componentInstance.poncc = selectedPO;
        modalRef.componentInstance.dtRef = detailResponse.data.dtRef || [];; // Master PO data
        modalRef.componentInstance.ponccDetail = detailResponse.data.data || []; // Detail items

        // Reload table after modal closes
        modalRef.result.finally(() => {
          this.onSearch();
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', 'Không thể tải chi tiết PO');
      }
    });
  }

  /**
   * Delete selected PO(s)
   * Logic: Skip approved POs or POs with import slips (TotalImport > 0)
   * Soft delete by setting IsDeleted = true
   */
  onDeletePoncc() {
    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
    const selectedRows = currentTable?.getSelectedData();

    // Validate selection
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn PO muốn xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa danh sách PO đã chọn không?<br>
                  <strong>Lưu ý:</strong> Những PO đã được duyệt hoặc đã có phiếu nhập sẽ bỏ qua!`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Filter POs that can be deleted
        const posToDelete: any[] = [];
        const skippedPOs: string[] = [];

        selectedRows.forEach((po: any) => {
          // Skip if ID is invalid
          if (!po.ID || po.ID <= 0) {
            return;
          }

          // Skip if already approved
          if (po.IsApproved === true || po.IsApproved === 1 || po.IsApproved === '1') {
            skippedPOs.push(`${po.POCode} (đã duyệt)`);
            return;
          }

          // Skip if has import slips
          if (po.TotalImport && po.TotalImport > 0) {
            skippedPOs.push(`${po.POCode} (đã có phiếu nhập)`);
            return;
          }

          // Add to delete list
          posToDelete.push({
            ...po,
            IsDeleted: true
          });
        });

        // Check if there are POs to delete
        if (posToDelete.length === 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có PO nào có thể xóa. Tất cả đều đã được duyệt hoặc đã có phiếu nhập!'
          );
          return;
        }

        // Show loading
        this.isLoading = true;

        // Call API to soft delete (update IsDeleted = true)
        this.srv.updatePONCC(posToDelete).subscribe({
          next: (response: any) => {
            this.isLoading = false;

            // Show success message
            let message = `Đã xóa thành công ${posToDelete.length} PO`;
            if (skippedPOs.length > 0) {
              message += `<br><br><strong>Bỏ qua ${skippedPOs.length} PO:</strong><br>` + skippedPOs.join('<br>');
            }

            this.notification.success(NOTIFICATION_TITLE.success, message);

            // Reload table
            this.onSearch();
          },
          error: (err) => {
            this.isLoading = false;
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xóa PO. Vui lòng thử lại!');
          }
        });
      }
    });
  }

  onApprovePoncc(isApprove: boolean): void {
    const isApproveText = isApprove ? 'duyệt' : 'hủy duyệt';
    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
    const selectedRows = currentTable?.getSelectedData();

    // Validate selection
    if (!selectedRows || selectedRows.length <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn PO muốn ${isApproveText}!`
      );
      return;
    }

    // Confirmation dialog
    this.modal.confirm({
      nzTitle: `Xác nhận ${isApproveText}`,
      nzContent: `Bạn có chắc muốn ${isApproveText} danh sách PO đã chọn không?`,
      nzOkText: isApprove ? 'Duyệt' : 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Collect valid POs
        const listPONCC: any[] = [];
        selectedRows.forEach((po: any) => {
          if (po.ID && po.ID > 0) {
            listPONCC.push(po);
          }
        });

        // Check if there are valid POs
        if (listPONCC.length <= 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có PO hợp lệ để cập nhật!'
          );
          return;
        }

        // Prepare data for update - only send necessary fields
        const updateData = listPONCC.map(po => ({
          ID: po.ID,
          IsApproved: isApprove
        }));

        // Show loading
        this.isLoading = true;

        // Call API to update IsApproved
        this.srv.updatePONCC(updateData).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `Đã ${isApproveText} thành công ${listPONCC.length} PO`
            );

            this.onSearch();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              `Không thể ${isApproveText} PO. Vui lòng thử lại!`
            );
          }
        });
      }
    });
  }

  onCopyPO() {
    // Get selected row from current active table
    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
    const selectedRows = currentTable?.getSelectedData();

    // Validate selection
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một PO để sao chép');
      return;
    }

    const selectedPO = selectedRows[0];

    // Show loading
    this.isLoading = true;

    // Load detail data from API
    this.srv.getDetails(selectedPO.ID).subscribe({
      next: (detailResponse: any) => {
        this.isLoading = false;

        // Open modal with master and detail data
        const modalRef = this.modalService.open(PonccDetailComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          windowClass: 'full-screen-modal',
        });

        const details = detailResponse.data.data.map((row: any) => ({
          ...row,
          ID: 0,
          PONCCID: 0,
          ProjectPartlistPurchaseRequestID: 0
        }));

        // Pass data to modal component
        modalRef.componentInstance.poncc = selectedPO;
        modalRef.componentInstance.isCopy = true;
        modalRef.componentInstance.dtRef = []; // Master PO data
        modalRef.componentInstance.ponccDetail = details || []; // Detail items

        // Reload table after modal closes
        modalRef.result.finally(() => {
          this.onSearch();
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', 'Không thể tải chi tiết PO');
      }
    });
  }

  /**
   * Export master table to Excel with footer using ExcelJS
   */
  async onExportToExcel(): Promise<void> {
    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;

    if (!currentTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const data = currentTable.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const tabName = this.activeTabIndex === 0 ? 'PO Thương mại' : 'PO Mượn';

    // Format dates for filename: DDMMYY
    const formatDate = (date: Date | null): string => {
      if (!date) return new Date().toLocaleDateString('en-GB').split('/').map(p => p.padStart(2, '0')).join('').slice(0, 6);
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}${month}${year}`;
    };

    const dateStartStr = formatDate(this.dateStart);
    const dateEndStr = formatDate(this.dateEnd);
    const fileName = `DanhSachPO_${dateStartStr}_${dateEndStr}.xlsx`;

    // Use ExcelJS to create workbook
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tabName);

    // Get visible columns
    const columns = currentTable.getColumns();
    const visibleColumns = columns
      .map((col: any) => col.getDefinition())
      .filter((def: any) => def.formatter !== 'rowSelection');

    const headers = visibleColumns.map((def: any) => def.title);

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Detect columns with bottomCalc
    const sumFields: string[] = [];
    const countFields: string[] = [];
    visibleColumns.forEach((col: any) => {
      if (col.bottomCalc === 'sum') {
        sumFields.push(col.field);
      } else if (col.bottomCalc === 'count') {
        countFields.push(col.field);
      }
    });

    // Initialize totals
    const totals: any = {};
    sumFields.forEach(field => totals[field] = 0);
    countFields.forEach(field => totals[field] = 0);

    // Add data rows
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.field;
        let value = row[field];

        // Calculate sum
        if (sumFields.includes(field) && value) {
          totals[field] += Number(value) || 0;
        }

        // Calculate count
        if (countFields.includes(field)) {
          totals[field] += 1;
        }

        // Format boolean
        if (typeof value === 'boolean') {
          return value ? 'V' : 'X';
        }

        // Format date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      const dataRow = worksheet.addRow(rowData);
      dataRow.alignment = { vertical: 'middle', wrapText: true };

      dataRow.eachCell((cell, colNumber) => {
        const field = visibleColumns[colNumber - 1]?.field;

        if (sumFields.includes(field)) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }

        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Add footer row
    const footerData = visibleColumns.map((col: any) => {
      const field = col.field;

      if (sumFields.includes(field)) {
        return totals[field];
      }

      if (countFields.includes(field)) {
        return totals[field];
      }

      if (field === visibleColumns[0].field) {
        return 'Tổng cộng';
      }

      return '';
    });

    const footerRow = worksheet.addRow(footerData);
    footerRow.font = { bold: true };
    footerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    footerRow.alignment = { vertical: 'middle', horizontal: 'left' };

    footerRow.eachCell((cell, colNumber) => {
      const field = visibleColumns[colNumber - 1]?.field;
      if (sumFields.includes(field) || countFields.includes(field)) {
        cell.numFmt = '#,##0';
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = headers[index]?.length || 10;
      column.eachCell({ includeEmpty: false }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onImportWareHouse(warehouseID: number) {

    const currentTable = this.activeTabIndex === 0 ? this.tablePoThuongMai : this.tablePoMuon;
    const selectedRows = currentTable?.getSelectedData();
    const selectedRowDetail = this.tableDetail.getSelectedData();
    // Validate selection
    if (!selectedRows || selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn PO!');
      return;
    }

    for (const po of selectedRows) {
      const id = po.ID || 0;
      if (id <= 0) continue;

      const status = po.Status || 0;
      const statusText = po.StatusText || '';
      const code = po.POCode || '';

      if (status !== 0 && status !== 5) {
        this.modal.warning({
          nzTitle: 'Thông báo',
          nzContent: `PO [${code}] đã ${statusText}.\nBạn không thể yêu cầu nhập kho!`,
          nzOkText: 'Đóng'
        });
        return;
      }
    }

    this.modal.confirm({
      nzTitle: `Xác nhận yêu cầu nhập kho`,
      nzContent: `Bạn có chắc muốn yêu cầu nhập kho danh sách PO đã chọn không?`,
      nzOkText: 'OK',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const ids = selectedRows.map(x => x.ID).join(',');
        const idString = Array.from(this.masterDetailsMap.values())
          .flat()
          .map(x => x.ID)
          .filter(id => id != null)
          .join(',');
        this.srv.getPonccDetail(ids, warehouseID, idString).subscribe((res) => {
          let dataSale = res.data.dataSale || [];
          let dataDemo = res.data.dataDemo || [];
          let listSaleDetail = res.data.listSaleDetail || [];
          let listDemoDetail = res.data.listDemoDetail || [];
          let listDemoPonccId = res.data.listDemoPonccId || [];
          let listSalePonccId = res.data.listSalePonccId || [];

          if (dataSale.length > 0) {
            this.openBillImportModalSequentially(dataSale, listSaleDetail, listSalePonccId, warehouseID, 0, 0);
          }

          if (dataDemo.length > 0) {
            this.openBillImportModalSequentially(dataDemo, listDemoDetail, listDemoPonccId, warehouseID, 0, 1);
          }

        });
      }
    });
  }

  private openBillImportModalSequentially(listData: any[], listDetail: any[], listPonccId: any[],
    warehouseID: number, index: number, type: number) {
    let warehouseCode = '';
    switch (warehouseID) {
      case 1: warehouseCode = 'HN'; break;
      case 2: warehouseCode = 'HCM'; break;
      case 3: warehouseCode = 'BN'; break;
      case 4: warehouseCode = 'HP'; break;
      case 6: warehouseCode = 'DP'; break;
      default: warehouseCode = ''; break;
    }

    if (index >= listData.length) {
      console.log('Đã hoàn thành việc mở danh sách modal.');
      return;
    }

    let dataMaster = listData[index];
    let dataDetail = listDetail[index];
    let ponccId = listPonccId[index];

    console.log('Mở modal thứ', index + 1);
    console.log('Data master:', dataMaster);
    console.log('Data detail:', dataDetail);
    console.log('PO NCC ID:', ponccId);

    if (type === 0) {
      const modalRef = this.modalService.open(BillImportDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'full-screen-modal',
      });

      console.log('Sale', index + 1);
      console.log('Mở modal thứ', index + 1);
      console.log('Data master:', dataMaster);
      console.log('Data detail:', dataDetail);
      console.log('PO NCC ID:', ponccId);

      modalRef.componentInstance.newBillImport = dataMaster;
      modalRef.componentInstance.WarehouseCode = warehouseCode;
      modalRef.componentInstance.selectedList = dataDetail;
      modalRef.componentInstance.id = dataMaster.ID ?? 0;
      modalRef.componentInstance.poNCCId = ponccId ?? 0;

      modalRef.result
        .then((result) => {
          console.log(`Modal thứ ${index + 1} đã đóng. Kết quả:`, result);

          this.openBillImportModalSequentially(listData, listDetail, listPonccId, warehouseID, index + 1, type);
        })
        .catch((reason) => {
          console.log(`Modal thứ ${index + 1} bị tắt (dismiss):`, reason);

          this.openBillImportModalSequentially(listData, listDetail, listPonccId, warehouseID, index + 1, type);
        });
    }

    if (type === 1) {
      const modalRef = this.modalService.open(BillImportTechnicalFormComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'full-screen-modal',
      });

      console.log('demo', index + 1);
      console.log('Mở modal thứ', index + 1);
      console.log('Data master:', dataMaster);
      console.log('Data detail:', dataDetail);
      console.log('PO NCC ID:', ponccId)

      modalRef.componentInstance.newBillImport = dataMaster;
      modalRef.componentInstance.warehouseID = warehouseID;
      modalRef.componentInstance.flag = 1;
      modalRef.componentInstance.dtDetails = dataDetail;
      modalRef.componentInstance.PonccID = ponccId ?? 0;

      modalRef.result
        .then((result) => {
          console.log(`Modal thứ ${index + 1} đã đóng. Kết quả:`, result);

          this.openBillImportModalSequentially(listData, listDetail, listPonccId, warehouseID, index + 1, type);
        })
        .catch((reason) => {
          console.log(`Modal thứ ${index + 1} bị tắt (dismiss):`, reason);

          this.openBillImportModalSequentially(listData, listDetail, listPonccId, warehouseID, index + 1, type);
        });
    }


  }

  onOpenSummary() {
    const modalRef = this.modalService.open(PonccSummaryComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });
  }
}


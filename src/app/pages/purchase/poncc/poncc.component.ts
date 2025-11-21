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
import { NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, ColumnDefinition, RowComponent, CellComponent } from 'tabulator-tables';
import { PONCCService } from './poncc.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  ],
  templateUrl: './poncc.component.html',
  styleUrls: ['./poncc.component.css'],
})
export class PONCCComponent implements OnInit, AfterViewInit {
  @ViewChild('masterContainer', { static: true }) masterRef!: ElementRef;
  @ViewChild('detailContainer', { static: true }) detailRef!: ElementRef;

  tableMaster!: Tabulator;
  tableDetail!: Tabulator;

  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  supplierId: number = 0;
  employeeId: number = 0;
  status: number = -1;
  keyword: string = '';
  pageNumber = 1;
  pageSize = 1000;

  suppliers: any[] = [];
  employees: any[] = [];

  constructor(
    private srv: PONCCService,
    private notify: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    this.initTables();
    this.onSearch();
  }

  private loadLookups() {
    this.srv.getSuppliers().subscribe({ next: (res) => (this.suppliers = res || []) });
    this.srv.getEmployees(0).subscribe({ next: (res) => (this.employees = res || []) });
  }

  private headerMenu(table: any): any[] {
    const menu: any[] = [];
    const columns = (table?.getColumns?.() || []) as any[];
    columns.forEach((column: any) => {
      const icon = document.createElement('i');
      icon.classList.add('fas');
      icon.classList.add(column.isVisible() ? 'fa-check-square' : 'fa-square');

      const label = document.createElement('span');
      const title = document.createElement('span');
      title.textContent = ' ' + (column.getDefinition().title || column.getField());
      label.appendChild(icon);
      label.appendChild(title);

      menu.push({
        label: label,
        action: (_e: any) => {
          column.toggle();
          icon.classList.toggle('fa-check-square', column.isVisible());
          icon.classList.toggle('fa-square', !column.isVisible());
        },
      });
    });
    return menu;
  }

  private initTables(): void {
    const masterCols: ColumnDefinition[] = [
      { title: 'Duyệt', field: 'IsApproved', formatter: 'tickCross', hozAlign: 'center', headerHozAlign: 'center' },
      { title: 'Trạng thái', field: 'StatusText', headerMenu: [] as any },
      { title: 'Số PO', field: 'POCode', headerMenu: [] as any },
      { title: 'Tổng tiền', field: 'TotalMoneyPO', formatter: (c) => this.formatNumber(c.getValue()), hozAlign: 'right', headerHozAlign: 'right', headerMenu: [] as any },
      { title: 'Nhà cung cấp', field: 'NameNCC', headerMenu: [] as any },
      { title: 'Ngày PO', field: 'RequestDate', formatter: (c) => this.formatDate(c.getValue()), hozAlign: 'center', headerHozAlign: 'center', headerMenu: [] as any },
      { title: 'NV mua', field: 'FullName', headerMenu: [] as any },
      { title: 'Loại tiền', field: 'CurrencyText', headerMenu: [] as any },
      { title: 'Ngày giao hàng', field: 'DeliveryDate', formatter: (c) => this.formatDate(c.getValue()), hozAlign: 'center', headerHozAlign: 'center', headerMenu: [] as any },
      { title: 'Số đơn hàng', field: 'BillCode', headerMenu: [] as any },
      { title: 'Điều khoản TT', field: 'RulePayName', headerMenu: [] as any },
      { title: 'Công ty', field: 'CompanyText', headerMenu: [] as any },
      { title: 'Loại PO', field: 'POTypeText', headerMenu: [] as any },
    ];

    this.tableMaster = new Tabulator(this.masterRef.nativeElement, {
      layout: 'fitDataFill',
      height: '86vh',
      reactiveData: true,
      selectableRows: 1,
      data: [],
      rowContextMenu: () => this.buildRowContextMenu(),
      columns: masterCols,
    });
    const items = this.headerMenu(this.tableMaster);
    masterCols.forEach((col) => ((col as any).headerMenu = items));

    this.tableMaster.on('rowSelected', (row: RowComponent) => {
      const id = Number((row.getData() as any)?.ID) || 0;
      if (id > 0) this.loadDetails(id);
    });

    const detailCols: ColumnDefinition[] = [
      { title: 'Mã SP', field: 'ProductCode' },
      { title: 'Tên SP', field: 'ProductName' },
      { title: 'Mã nội bộ', field: 'ProductNewCode' },
      { title: 'ĐVT', field: 'Unit', hozAlign: 'center', headerHozAlign: 'center' },
      { title: 'SL yêu cầu', field: 'QtyRequest', formatter: (c) => this.formatNumber(c.getValue()), hozAlign: 'right', headerHozAlign: 'right' },
      { title: 'Đơn giá', field: 'UnitPrice', formatter: (c) => this.formatNumber(c.getValue()), hozAlign: 'right', headerHozAlign: 'right' },
      { title: 'Thành tiền', field: 'TotalPrice', formatter: (c) => this.formatNumber(c.getValue()), hozAlign: 'right', headerHozAlign: 'right' },
      { title: '% VAT', field: 'VAT', formatter: (c) => this.formatNumber(c.getValue(), 0), hozAlign: 'right', headerHozAlign: 'right' },
      { title: 'Tiền VAT', field: 'VATMoney', formatter: (c) => this.formatNumber(c.getValue()), hozAlign: 'right', headerHozAlign: 'right' },
      { title: 'Mã DA', field: 'ProjectCode' },
      { title: 'Tên DA', field: 'ProjectName' },
      { title: 'Deadline', field: 'DeadlineDelivery', formatter: (c) => this.formatDate(c.getValue()), hozAlign: 'center', headerHozAlign: 'center' },
      { title: 'Ghi chú', field: 'Note' },
    ];
    this.tableDetail = new Tabulator(this.detailRef.nativeElement, {
      layout: 'fitDataFill',
      height: '86vh',
      reactiveData: true,
      data: [],
      columns: detailCols,
    });
  }

  private formatNumber(v: any, digits = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  private formatDate(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const p2 = (x: number) => String(x).padStart(2, '0');
      return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch { return ''; }
  }

  onSearch(): void {
    const filter = {
      DateStart: new Date(this.dateStart.setHours(0, 0, 0, 0)).toISOString(),
      DateEnd: new Date(this.dateEnd.setHours(23, 59, 59, 999)).toISOString(),
      Status: this.status,
      SupplierID: this.supplierId || 0,
      EmployeeID: this.employeeId || 0,
      Keyword: this.keyword?.trim() || '',
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
    };
    this.srv.getAll(filter).subscribe({
      next: (rows) => this.tableMaster?.setData(rows || []),
      error: () => this.notify.error('Lỗi', 'Không tải được dữ liệu PO NCC'),
    });
  }

  private loadDetails(poid: number): void {
    this.srv.getDetails(poid).subscribe({
      next: (rows) => this.tableDetail?.setData(rows || []),
      error: () => this.notify.error('Lỗi', 'Không tải được chi tiết'),
    });
  }

  // Row context menu actions
  private buildRowContextMenu(): any[] {
    return [
      { label: 'Duyệt', action: () => this.onApprove(true) },
      { label: 'Huỷ duyệt', action: () => this.onApprove(false) },
      { label: 'Yêu cầu nhập kho (HN)', action: () => this.onRequestImport(1) },
      { label: 'Yêu cầu nhập kho (HCM)', action: () => this.onRequestImport(2) },
      { label: 'Yêu cầu nhập kho (BN)', action: () => this.onRequestImport(3) },
      { label: 'Yêu cầu nhập kho (HP)', action: () => this.onRequestImport(4) },
    ];
  }

  private getSelectedMaster(): any[] {
    return (this.tableMaster?.getSelectedData() as any[]) || [];
  }

  onApprove(isApproved: boolean): void {
    const rows = this.getSelectedMaster();
    if (!rows.length) {
      this.notify.warning('Thông báo', 'Chọn PO để cập nhật');
      return;
    }
    const ids = rows.map((r) => Number(r['ID'])).filter((x) => x > 0);
    if (!ids.length) return;
    this.srv.approve(ids, isApproved).subscribe({
      next: () => {
        this.notify.success('Thành công', isApproved ? 'Đã duyệt' : 'Đã huỷ duyệt');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Cập nhật duyệt thất bại'),
    });
  }

  onRequestImport(warehouseID: number): void {
    const rows = this.getSelectedMaster();
    if (!rows.length) {
      this.notify.warning('Thông báo', 'Chọn PO để yêu cầu nhập kho');
      return;
    }
    const ids = rows.map((r) => Number(r['ID'])).filter((x) => x > 0);
    if (!ids.length) return;
    this.srv.requestImport(warehouseID, ids).subscribe({
      next: () => {
        this.notify.success('Thành công', `Đã yêu cầu nhập kho (${warehouseID})`);
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Yêu cầu nhập kho thất bại'),
    });
  }

  onAdd(): void {
    // Open PONCCDetail modal in create mode
    const modalRef = this.modalService.open(PONCCDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    const instance = modalRef.componentInstance as any;
    instance.mode = 'create-new';

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.notify.success('Thành công', 'Đã tạo PO mới!');
          this.onSearch();
        }
      },
      () => {}
    );
  }

  onEdit(): void {
    const rows = this.getSelectedMaster();
    if (!rows.length) {
      this.notify.warning('Thông báo', 'Chọn PO để sửa');
      return;
    }
    if (rows.length > 1) {
      this.notify.warning('Thông báo', 'Chỉ chọn 1 PO để sửa');
      return;
    }

    const po = rows[0];
    const poID = Number(po['ID']);
    if (!poID) return;

    // Open PONCCDetail modal in edit mode
    const modalRef = this.modalService.open(PONCCDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    const instance = modalRef.componentInstance as any;
    instance.mode = 'edit';
    instance.poID = poID;
    instance.initialPOCode = po['POCode'];
    instance.initialBillCode = po['BillCode'];

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.notify.success('Thành công', 'Đã cập nhật PO!');
          this.onSearch();
        }
      },
      () => {}
    );
  }

  onDelete(): void {
    const rows = this.getSelectedMaster();
    if (!rows.length) {
      this.notify.warning('Thông báo', 'Chọn PO để xóa');
      return;
    }

    const po = rows[0];
    const poID = Number(po['ID']);
    const isApproved = po['IsApproved'];
    const totalImport = Number(po['TotalImport']) || 0;

    // Validate delete permissions
    if (isApproved) {
      this.notify.error('Lỗi', 'PO đã được duyệt, không thể xóa!');
      return;
    }

    if (totalImport > 0) {
      this.notify.error('Lỗi', 'PO đã có phiếu nhập kho, không thể xóa!');
      return;
    }

    // Confirm delete
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa PO: ${po['POCode']}?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.srv.delete(poID).subscribe({
          next: () => {
            this.notify.success('Thành công', 'Đã xóa PO!');
            this.onSearch();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Xóa PO thất bại';
            this.notify.error('Lỗi', msg);
          },
        });
      },
    });
  }
}

// Note: PONCCDetailComponent will be created in Phase 4
declare const PONCCDetailComponent: any;
import {
  Component,
  Input,
  OnInit,
  Optional,
  Inject
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../app.config';

import { TableModule as PrimeTableModule } from 'primeng/table';
import { ButtonModule as PrimeButtonModule } from 'primeng/button';
import { SelectModule as PrimeSelectModule } from 'primeng/select';
import { InputTextModule as PrimeInputTextModule } from 'primeng/inputtext';

import { HistoryMoneyService } from '../history-money/history-money-service/history-money.service';
import { PokhService } from '../pokh/pokh-service/pokh.service';

@Component({
  selector: 'app-history-money-primeng',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzFormModule,
    CommonModule,
    PrimeTableModule,
    PrimeButtonModule,
    PrimeSelectModule,
    PrimeInputTextModule,
  ],
  templateUrl: './history-money-primeng.component.html',
  styleUrl: './history-money-primeng.component.css'
})
export class HistoryMoneyPrimengComponent implements OnInit {

  @Input() filterText: any;

  // Data arrays
  dataProduct: any[] = [];
  mainData: any[] = [];
  bankNames: any[] = [];
  bankNameOptions: any[] = [];
  salesEmployeeOptions: any[] = [];

  // Selection
  selectedProduct: any = null;

  // State
  rowSelectedTotalPriceIncludeVAT: any;
  rowSelectedPokhDetailId: number = 0;
  rowSelectedPokhId: number = 0;
  listIdsDel: any[] = [];

  // Row key sequence for new rows
  private dataRowKeySequence = 0;

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    @Optional() @Inject('tabData') private tabData: any,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private historyMoneyService: HistoryMoneyService,
    private pokhService: PokhService
  ) { }

  ngOnInit(): void {
    if (this.tabData && this.tabData.filterText) {
      this.filterText = this.tabData.filterText;
    }
    this.loadBankNames();
    this.loadEmployeeManagers();
    this.loadProduct(this.filterText);
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.close({ success: false, reloadData: false });
    }
  }

  onSearch() {
    this.loadProduct(this.filterText);
  }

  //#region Load dữ liệu từ API
  loadBankNames(): void {
    this.historyMoneyService.getBankNames().subscribe(
      (response) => {
        if (response.status === 1) {
          this.bankNames = response.data;
          this.bankNameOptions = this.bankNames.map((bank) => ({
            label: bank.BankName,
            value: bank.BankName,
          }));
        } else {
          this.notification.error('Lỗi khi tải tên ngân hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải tên ngân hàng:', error);
      }
    );
  }

  loadEmployeeManagers(): void {
    this.pokhService.loadEmployeeManagers(0, 0, 0).subscribe(
      (response) => {
        if (response.status === 1) {
          let dataUsers = response.data.result || [];
          if (response.data && Array.isArray(response.data.list)) {
            const list0 = response.data.list[0] || [];
            const list3 = response.data.list[3] || [];
            const allUsers = [...list0, ...list3];
            dataUsers = allUsers.filter((u: any) => u.TeamType === 2);
          }

          this.salesEmployeeOptions = dataUsers.map((user: any) => ({
            label: user.FullName,
            value: user.UserID
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi tải nhân viên');
        }
      },
      (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi kết nối khi tải nhân viên');
      }
    );
  }

  getEmployeeName(id: any): string {
    if (!id) return '';
    const emp = this.salesEmployeeOptions.find(opt => opt.value === id);
    return emp ? emp.label : '';
  }

  loadProduct(text: string): void {
    this.historyMoneyService.getProductData(text).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataProduct = response.data;

          // Auto select first row
          if (this.dataProduct && this.dataProduct.length > 0) {
            this.selectedProduct = this.dataProduct[0];
            this.onProductRowSelect({ data: this.selectedProduct });
          }
        } else {
          this.notification.error('Lỗi khi tải sản phẩm:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải sản phẩm:', error);
      }
    );
  }

  loadHistoryMoneyPO(pokhDetailId: number): void {
    this.listIdsDel = [];
    this.historyMoneyService.getHistoryMoneyPO(pokhDetailId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = this.normalizeDataRows(this.prepareVatForTable(response.data));
        } else {
          this.notification.error('Lỗi khi tải PO:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải PO:', error);
      }
    );
  }
  //#endregion

  //#region Row events
  onProductRowSelect(event: any): void {
    const data = event.data;
    this.rowSelectedPokhDetailId = data['ID'];
    this.rowSelectedTotalPriceIncludeVAT = data['TotalPriceIncludeVAT'];
    this.rowSelectedPokhId = data['POKHID'];
    if (this.rowSelectedPokhDetailId) {
      this.loadHistoryMoneyPO(this.rowSelectedPokhDetailId);
    }
  }
  //#endregion

  //#region Add / Delete rows
  addNewRow(): void {
    const newRow = {
      ID: 0,
      MoneyDate: null,
      Money: 0,
      Note: '',
      BankName: '',
      InvoiceNo: '',
      VAT: 0,
      MoneyVAT: 0,
      UserID: null,
      IsFilm: false,
      IsDeleted: false,
    };
    this.mainData = this.normalizeDataRows([...this.mainData, newRow]);
  }

  deleteDataRow(row: any): void {
    if (!row || row.IsDeleted) {
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn xóa dòng này?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = row.ID;
        if (id > 0) {
          if (!this.listIdsDel.includes(id)) this.listIdsDel.push(id);
        }
        this.mainData = this.mainData.filter((item) => item.__rowKey !== row.__rowKey);
      },
    });
  }
  //#endregion

  //#region Save
  saveAndClose() {
    if (!this.selectedProduct || !this.rowSelectedPokhDetailId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng PO trước khi lưu');
      return;
    }

    const normalizedTableData = this.mainData.map((row) => {
      const { __rowKey, ...rest } = row;
      return {
        ...rest,
        VAT: this.convertVatToDecimal(row.VAT),
      };
    });

    const requestBody = {
      historyMoneyPOs: normalizedTableData,
      pokhDetailId: this.rowSelectedPokhDetailId,
      pokhId: this.rowSelectedPokhId,
      totalMoneyIncludeVAT: this.rowSelectedTotalPriceIncludeVAT,
      listIdsDel: this.listIdsDel,
    };

    this.historyMoneyService.saveHistoryMoney(requestBody).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');

          // Update TotalMoneyRemaining for the selected product row
          if (response.data && response.data.TotalMoneyRemaining !== undefined) {
            const selectedIdx = this.dataProduct.findIndex(
              (p: any) => p.ID === this.rowSelectedPokhDetailId
            );
            if (selectedIdx >= 0) {
              this.dataProduct[selectedIdx] = {
                ...this.dataProduct[selectedIdx],
                TotalMoneyRemaining: response.data.TotalMoneyRemaining,
              };
              this.dataProduct = [...this.dataProduct];
            }
          }

          if (this.activeModal) {
            this.activeModal.close({ success: true });
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.message || 'Không thể lưu dữ liệu');
      },
    });
  }

  exportExcel() {
    if (!this.rowSelectedPokhDetailId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng PO trước khi xuất Excel');
      return;
    }

    this.historyMoneyService.exportHistoryMoneyExcel(this.rowSelectedPokhDetailId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LichSuTienVe_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel');
      }
    });
  }
  //#endregion

  //#region Helpers - Row key normalization
  private normalizeDataRows(rows: any[]): any[] {
    return (rows || []).map((row) => {
      if (row.userID !== undefined && row.UserID === undefined) {
        row.UserID = row.userID;
      } else if (row.userId !== undefined && row.UserID === undefined) {
        row.UserID = row.userId;
      }
      return {
        ...row,
        __rowKey: row.__rowKey || this.createDataRowKey(row),
      };
    });
  }

  private createDataRowKey(row: any): string {
    const persistedKey = row?.ID;
    return persistedKey && persistedKey > 0
      ? `data-${persistedKey}`
      : `data-new-${++this.dataRowKeySequence}`;
  }
  //#endregion

  //#region Helpers - VAT conversion
  private prepareVatForTable(data: any[]): any[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      VAT: this.convertVatToPercent(item?.VAT),
    }));
  }

  private convertVatToPercent(value: any): number {
    const sanitized = this.sanitizeVatValue(value);
    if (sanitized === null) {
      return 0;
    }
    return sanitized > 1 ? sanitized : sanitized * 100;
  }

  private convertVatToDecimal(value: any): number {
    const sanitized = this.sanitizeVatValue(value);
    if (sanitized === null) {
      return 0;
    }
    if (sanitized > 1) {
      return sanitized / 100;
    }
    return sanitized;
  }

  private sanitizeVatValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    let processedValue = value;
    if (typeof processedValue === 'string') {
      processedValue = processedValue.replace('%', '').trim();
    }
    const parsed = Number(processedValue);
    return isNaN(parsed) ? null : parsed;
  }
  //#endregion

  //#region Helpers - Formatting
  formatMoney(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  formatDateVi(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  toDateInputValue(value: any): string {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  onMoneyDateChanged(rowData: any, value: string): void {
    rowData.MoneyDate = value || null;
    this.mainData = [...this.mainData];
  }
  //#endregion
}

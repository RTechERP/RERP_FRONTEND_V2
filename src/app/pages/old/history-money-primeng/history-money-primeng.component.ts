import {
  Component,
  Input,
  OnInit,
  Optional,
  Inject,
  ViewChild,
  TemplateRef
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
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
    NzDatePickerModule,
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
  @Input() pokhIds: number[] = []; // Danh sách POKH IDs (cho multi-PO support)

  // Data arrays
  dataProduct: any[] = [];
  mainData: any[] = [];
  bankNames: any[] = [];
  bankNameOptions: any[] = [];
  salesEmployeeOptions: any[] = [];
  departmentOptions: any[] = [];

  // Export filter
  exportFromDate: Date | null = null;
  exportToDate: Date | null = null;
  exportDepartmentId: number | null = null;
  exportUserId: number | null = null;

  @ViewChild('exportFilterModal') exportFilterModal!: TemplateRef<any>;
  exportFilterModalRef: NzModalRef | null = null;

  // Selection
  selectedProduct: any = null;
  selectedProducts: any[] = [];
  selectedPOKHDetailIds: number[] = []; // Lưu danh sách POKHDetail IDs từ dataProduct
  isMultiPOMode: boolean = false; // Flag để phân biệt single-PO và multi-PO mode

  // State
  rowSelectedTotalPriceIncludeVAT: any;
  rowSelectedPokhDetailId: number = 0;
  rowSelectedPokhId: number = 0;
  listIdsDel: { id: number; pokhDetailId: number }[] = [];
  isSaving = false; // Chặn spam nút Lưu

  // Selected POKH Info map: POKHDetailId -> { pokhId, totalMoneyIncludeVAT, ponumber }
  selectedPOKHInfoMap: Map<number, { pokhId: number; totalMoneyIncludeVAT: number; ponumber?: string }> = new Map();

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
    // Nhận data từ tabService (pokhIds hoặc filterText)
    if (this.tabData) {
      if (this.tabData.pokhIds && Array.isArray(this.tabData.pokhIds)) {
        this.pokhIds = this.tabData.pokhIds;
      }
      if (this.tabData.filterText) {
        this.filterText = this.tabData.filterText;
      }
    }
    this.loadBankNames();
    this.loadEmployeeManagers();
    this.loadDepartments();
    // Ưu tiên load theo pokhIds nếu có (multi-PO), không thì load theo filterText
    if (this.pokhIds && this.pokhIds.length > 0) {
      this.isMultiPOMode = true;
      this.loadProductsByPOKHIds(this.pokhIds);
    } else {
      this.isMultiPOMode = false;
      this.loadProduct(this.filterText);
    }
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

  loadDepartments(): void {
    this.historyMoneyService.getDepartments().subscribe(
      (response) => {
        if (response.status === 1) {
          this.departmentOptions = (response.data || []).map((t: any) => ({
            label: t.Name || t.name,
            value: t.ID || t.id
          }));
        }
      },
      (err: any) => {
        console.error('Error loading departments', err);
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
            this.selectedProducts = [this.dataProduct[0]];
            this.onProductSelectionChange(this.selectedProducts);
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

  /**
   * Load sản phẩm theo nhiều POKH IDs (cho multi-PO support)
   */
  loadProductsByPOKHIds(pokhIds: number[]): void {
    if (!pokhIds || pokhIds.length === 0) {
      this.dataProduct = [];
      return;
    }

    this.historyMoneyService.getProductsByPOKHIds(pokhIds.join(',')).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataProduct = response.data;
          // Lưu danh sách POKHDetail IDs
          this.selectedPOKHDetailIds = this.dataProduct.map((p: any) => p.ID).filter((id: number) => id > 0);

          // Auto select all rows by default in multi-PO mode
          if (this.dataProduct && this.dataProduct.length > 0) {
            this.selectedProducts = [...this.dataProduct];
            this.onProductSelectionChange(this.selectedProducts);
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

  /**
   * Load lịch sử tiền về theo nhiều POKHDetail IDs (cho multi-PO support)
   */
  loadHistoryMoneyPOMultiple(pokhDetailIds: number[]): void {
    this.listIdsDel = [];
    if (!pokhDetailIds || pokhDetailIds.length === 0) {
      this.mainData = [];
      return;
    }

    this.historyMoneyService.getHistoryMoneyPOMultiple(pokhDetailIds.join(',')).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = this.normalizeDataRows(this.prepareVatForTable(response.data));
        } else {
          this.notification.error('Lỗi khi tải lịch sử tiền về:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải lịch sử tiền về:', error);
      }
    );
  }
  //#endregion

  onProductRowSelect(event: any): void {
    const data = event.data;
    this.rowSelectedPokhDetailId = data['ID'];
    this.rowSelectedTotalPriceIncludeVAT = data['TotalPriceIncludeVAT'];
    this.rowSelectedPokhId = data['POKHID'];
    if (this.rowSelectedPokhDetailId) {
      this.loadHistoryMoneyPO(this.rowSelectedPokhDetailId);
    }
  }

  onProductSelectionChange(selectedList: any[]): void {
    this.selectedProducts = selectedList || [];
    this.selectedPOKHDetailIds = this.selectedProducts.map((p: any) => p.ID).filter((id: number) => id > 0);

    // Build POKH Info Map
    this.selectedPOKHInfoMap.clear();
    this.selectedProducts.forEach((p: any) => {
      this.selectedPOKHInfoMap.set(p.ID, {
        pokhId: p.POKHID,
        totalMoneyIncludeVAT: p.TotalPriceIncludeVAT,
        ponumber: p.PONumber || p.POKHCode || ''
      });
    });
    
    // Sync selectedProduct for single-PO checks/fallback
    this.selectedProduct = this.selectedProducts.length > 0 ? this.selectedProducts[0] : null;

    if (this.selectedPOKHDetailIds.length > 0) {
      if (this.selectedPOKHDetailIds.length === 1) {
        const singleSelected = this.selectedProducts[0];
        this.rowSelectedPokhDetailId = singleSelected.ID;
        this.rowSelectedTotalPriceIncludeVAT = singleSelected.TotalPriceIncludeVAT;
        this.rowSelectedPokhId = singleSelected.POKHID;
        this.loadHistoryMoneyPO(this.rowSelectedPokhDetailId);
      } else {
        this.rowSelectedPokhDetailId = 0;
        this.rowSelectedTotalPriceIncludeVAT = 0;
        this.rowSelectedPokhId = 0;
        this.loadHistoryMoneyPOMultiple(this.selectedPOKHDetailIds);
      }
    } else {
      this.rowSelectedPokhDetailId = 0;
      this.rowSelectedTotalPriceIncludeVAT = 0;
      this.rowSelectedPokhId = 0;
      this.mainData = [];
    }
  }

  isRowSelected(rowData: any): boolean {
    return this.selectedProducts && this.selectedProducts.some((p: any) => p.ID === rowData.ID);
  }
  //#endregion

  //#region Add / Delete rows

  // Add new row for a specific product (called from + button on left table)
  addNewRowForProduct(product: any): void {
    const newRow = {
      ID: 0,
      POKHDetailID: product.ID,
      POKHID: product.POKHID,
      POCode: product.POCode || '',
      PONumber: product.PONumber || product.POKHCode || '',
      ProductNewCode: product.ProductNewCode || '',
      MoneyDate: null,
      Money: 0,
      Note: '',
      BankName: '',
      InvoiceNo: '',
      VAT: 0,
      MoneyVAT: 0,
      UserID: null,
      PMUserID: null,
      IsFilm: false,
      IsDeleted: false,
    };
    this.mainData = this.normalizeDataRows([...this.mainData, newRow]);
  }

  addNewRow(): void {
    // For multi-select mode, add a new row for each selected POKHDetail
    if (this.selectedPOKHDetailIds.length > 1) {
      // Multi-select: add row for each selected PO
      const newRows = this.selectedProducts
        .filter((p: any) => p.ID > 0)
        .map((p: any) => ({
          ID: 0,
          POKHDetailID: p.ID,
          POKHID: p.POKHID,
          PONumber: p.PONumber || p.POKHCode || '',
          POCode: p.POCode || '',
          ProductNewCode: p.ProductNewCode || '',
          MoneyDate: null,
          Money: 0,
          Note: '',
          BankName: '',
          InvoiceNo: '',
          VAT: 0,
          MoneyVAT: 0,
          UserID: null,
          PMUserID: null,
          IsFilm: false,
          IsDeleted: false,
        }));
      this.mainData = this.normalizeDataRows([...this.mainData, ...newRows]);
    } else {
      // Single select: add one row
      const newRow = {
        ID: 0,
        POKHDetailID: this.rowSelectedPokhDetailId,
        POKHID: this.rowSelectedPokhId,
        PONumber: '',
        POCode: '',
        ProductNewCode: '',
        MoneyDate: null,
        Money: 0,
        Note: '',
        BankName: '',
        InvoiceNo: '',
        VAT: 0,
        MoneyVAT: 0,
        UserID: null,
        PMUserID: null,
        IsFilm: false,
        IsDeleted: false,
      };
      this.mainData = this.normalizeDataRows([...this.mainData, newRow]);
    }
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
          // Lưu lại POKHDetailID để biết dòng này thuộc POKHDetail nào
          const pokhDetailId = row.POKHDetailID || this.rowSelectedPokhDetailId;
          // Thêm vào list xóa kèm POKHDetailID
          this.listIdsDel.push({ id, pokhDetailId });
        }
        // Đánh dấu IsDeleted = true để giữ row trong array (để build rowsDelByPOKHDetailId)
        row.IsDeleted = true;
        this.mainData = [...this.mainData]; // Trigger change detection
      },
    });
  }
  //#endregion

  //#region Save
  saveAndClose() {
    if (this.isSaving) return; // Chặn spam
    if (this.selectedProducts.length === 0 || this.selectedPOKHDetailIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 PO trước khi lưu');
      return;
    }

    this.isSaving = true;

    // Normalize data - filter out deleted rows for sending to API
    const normalizedTableData = this.mainData
      .filter(row => !row.IsDeleted) // Loại bỏ rows đã đánh dấu xóa
      .map((row) => {
        const { __rowKey, ...rest } = row;
        return {
          ...rest,
          VAT: this.convertVatToDecimal(row.VAT),
          PMUserID: row.PMUserID ?? null,
        };
      });

    // Group rows by POKHDetailID
    const rowsByPOKHDetailId = new Map<number, any[]>();
    normalizedTableData.forEach(row => {
      const pokhDetailId = row.POKHDetailID || this.rowSelectedPokhDetailId;
      if (!rowsByPOKHDetailId.has(pokhDetailId)) {
        rowsByPOKHDetailId.set(pokhDetailId, []);
      }
      rowsByPOKHDetailId.get(pokhDetailId)!.push(row);
    });

    // Get rows to delete by POKHDetailID from listIdsDel (now contains {id, pokhDetailId})
    const rowsDelByPOKHDetailId = new Map<number, any[]>();
    this.listIdsDel.forEach(delItem => {
      if (!rowsDelByPOKHDetailId.has(delItem.pokhDetailId)) {
        rowsDelByPOKHDetailId.set(delItem.pokhDetailId, []);
      }
      rowsDelByPOKHDetailId.get(delItem.pokhDetailId)!.push(delItem.id);
    });

    // Build requests for each POKHDetailID
    const saveRequests: Observable<any>[] = [];
    const pokhDetailIdList = Array.from(rowsByPOKHDetailId.keys());

    pokhDetailIdList.forEach(pokhDetailId => {
      const rows = rowsByPOKHDetailId.get(pokhDetailId) || [];
      const pokhInfo = this.selectedPOKHInfoMap.get(pokhDetailId);

      const requestBody = {
        historyMoneyPOs: rows,
        pokhDetailId: pokhDetailId,
        pokhId: pokhInfo?.pokhId || 0,
        totalMoneyIncludeVAT: pokhInfo?.totalMoneyIncludeVAT || 0,
        listIdsDel: rowsDelByPOKHDetailId.get(pokhDetailId) || [],
      };

      saveRequests.push(this.historyMoneyService.saveHistoryMoney(requestBody));
    });

    // Execute all save requests
    forkJoin(saveRequests).subscribe({
      next: (responses: any[]) => {
        let allSuccess = true;
        let totalMoneyRemainingMap = new Map<number, number>();

        responses.forEach((response, index) => {
          if (response.status === 1) {
            // Collect TotalMoneyRemaining updates
            if (response.data && response.data.TotalMoneyRemaining !== undefined) {
              const pokhDetailId = pokhDetailIdList[index];
              totalMoneyRemainingMap.set(pokhDetailId, response.data.TotalMoneyRemaining);
            }
          } else {
            this.isSaving = false;
            allSuccess = false;
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi lưu dữ liệu');
          }
        });

        if (allSuccess) {
          this.isSaving = false;
          this.notification.success(NOTIFICATION_TITLE.success, `Lưu thành công cho ${pokhDetailIdList.length} PO`);

          // Update TotalMoneyRemaining in dataProduct
          totalMoneyRemainingMap.forEach((remaining, pokhDetailId) => {
            const selectedIdx = this.dataProduct.findIndex((p: any) => p.ID === pokhDetailId);
            if (selectedIdx >= 0) {
              this.dataProduct[selectedIdx] = {
                ...this.dataProduct[selectedIdx],
                TotalMoneyRemaining: remaining,
              };
            }
          });
          this.dataProduct = [...this.dataProduct];

          // Clear listIdsDel
          this.listIdsDel = [];

          // Reload history money for current selection
          if (this.selectedPOKHDetailIds.length === 1) {
            this.loadHistoryMoneyPO(this.rowSelectedPokhDetailId);
          } else {
            this.loadHistoryMoneyPOMultiple(this.selectedPOKHDetailIds);
          }

          if (this.activeModal) {
            this.activeModal.close({ success: true });
          }
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.message || 'Lỗi khi lưu dữ liệu');
      },
    });
  }

  exportExcel() {
    // Nếu có nhiều POKHDetail IDs (multi-PO), xuất tất cả
    if (this.selectedPOKHDetailIds && this.selectedPOKHDetailIds.length > 0) {
      this.exportExcelMultiple();
    } else if (!this.rowSelectedPokhDetailId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng PO trước khi xuất Excel');
    } else {
      this.exportExcelSingle();
    }
  }

  private exportExcelSingle() {
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

  private exportExcelMultiple() {
    if (!this.selectedPOKHDetailIds || this.selectedPOKHDetailIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel');
      return;
    }

    this.historyMoneyService.exportHistoryMoneyExcelMultiple(this.selectedPOKHDetailIds.join(',')).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LichSuTienVe_Multiple_${new Date().getTime()}.xlsx`;
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

  openExportFilterModal() {
    this.exportFromDate = null;
    this.exportToDate = null;
    this.exportDepartmentId = null;
    this.exportUserId = null;

    this.exportFilterModalRef = this.modal.create({
      nzTitle: 'Xuất Excel - Lịch sử tiền về',
      nzContent: this.exportFilterModal,
      nzWidth: 500,
      nzOkText: 'Xuất Excel',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.doExportExcelFilter();
        return false;
      }
    });
  }

  doExportExcelFilter() {
    const fromDate = this.exportFromDate ? this.formatDateISO(this.exportFromDate) : null;
    const toDate = this.exportToDate ? this.formatDateISO(this.exportToDate) : null;

    this.historyMoneyService.exportHistoryMoneyExcelFilter(
      fromDate,
      toDate,
      this.exportDepartmentId,
      this.exportUserId
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LichSuTienVe_Export_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công');
        if (this.exportFilterModalRef) {
          this.exportFilterModalRef.close();
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel');
      }
    });
  }

  private formatDateISO(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
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

      // Get PONumber and POCode from dataProduct if not present
      if (!row.PONumber || !row.POCode) {
        const pokhDetailId = row.POKHDetailID;
        const productInfo = this.dataProduct.find((p: any) => p.ID === pokhDetailId);
        if (productInfo) {
          if (!row.PONumber) {
            row.PONumber = productInfo.PONumber || productInfo.POKHCode || '';
          }
          if (!row.POCode) {
            row.POCode = productInfo.POCode || '';
          }
          if (!row.ProductNewCode) {
            row.ProductNewCode = productInfo.ProductNewCode || '';
          }
        }
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
    return data.map((item) => {
      // Lấy ProductNewCode từ dataProduct nếu có
      const productInfo = this.dataProduct.find((p: any) => p.ID === item.POKHDetailID);
      return {
        ...item,
        VAT: this.convertVatToPercent(item?.VAT),
        ProductNewCode: item.ProductNewCode || productInfo?.ProductNewCode || ''
      };
    });
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

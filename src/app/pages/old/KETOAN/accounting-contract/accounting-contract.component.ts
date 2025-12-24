import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
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
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { AppComponent } from '../../../../app.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { setupTabulatorCellCopy } from '../../../../shared/utils/tabulator-cell-copy.util';

import { AccountingContractService } from './accounting-contract-service/accounting-contract.service';
import { AccountingContractDetailComponent } from './accounting-contract-detail/accounting-contract-detail.component';

@Component({
  selector: 'app-accounting-contract',
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
    HasPermissionDirective,
    NgbModalModule,
    AccountingContractDetailComponent,
  ],
  templateUrl: './accounting-contract.component.html',
  styleUrl: './accounting-contract.component.css'
})
export class AccountingContractComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_AccountingContract', { static: false }) tb_AccountingContractElement!: ElementRef;
  tb_AccountingContract!: Tabulator;
  @ViewChild('tb_AccountingContractFile', { static: false }) tb_AccountingContractFileElement!: ElementRef;
  tb_AccountingContractFile!: Tabulator;
  tb_Detail!: Tabulator;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  dataCustomers: any[] = [];
  dataSuppliers: any[] = [];
  dataAccountingContractFiles: any[] = [];
  selectedRow: any = null;
  
  filters: any = {
    startDate: (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    })(),
    endDate: (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    })(),
    customerId: 0,
    supplierId: 0,
    isReceivedContract: 0,
    isComingExpired: 0,
    keyword: '',
  };

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private accountingContractService: AccountingContractService,
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadCustomers();
    this.loadSuppliers();
  }

  ngAfterViewInit(): void {
    this.initMasterTable();
    this.initFileTable();
  }

  search() {
    // Update ajaxParams và reload data
    this.tb_AccountingContract.setData(this.accountingContractService.getAccountingContractAjax());
    this.tb_AccountingContract.replaceData();
  }

  loadData() {
    this.tb_AccountingContract.setData(null, true);
  }

  loadCustomers() {
    this.accountingContractService.getCustomers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataCustomers = response.data;
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
        return;
      }
    );
  }

  loadSuppliers() {
    this.accountingContractService.getSuppliers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataSuppliers = response.data;
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

  loadContractFiles(accountingContractId: number): void {
    if (!accountingContractId || accountingContractId <= 0) {
      this.dataAccountingContractFiles = [];
      if (this.tb_AccountingContractFile) {
        this.tb_AccountingContractFile.setData([]);
      }
      return;
    }

    this.accountingContractService.getAccountingContractFile(accountingContractId).subscribe({
      next: (response: any) => {
        if (response && (response.status === 1 || response.Status === 1)) {
          this.dataAccountingContractFiles = response.data || [];
          if (this.tb_AccountingContractFile) {
            this.tb_AccountingContractFile.setData(this.dataAccountingContractFiles);
          }
        } else {
          this.dataAccountingContractFiles = [];
          if (this.tb_AccountingContractFile) {
            this.tb_AccountingContractFile.setData([]);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading contract files:', error);
        this.dataAccountingContractFiles = [];
        if (this.tb_AccountingContractFile) {
          this.tb_AccountingContractFile.setData([]);
        }
      }
    });
  }

  onAdd() {
    const modalRef = this.modalService.open(AccountingContractDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });
    modalRef.result.then(
      (result) => {
        if (result === 'saved' || result === 'success') {
          this.loadData();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onEdit() {
    if (!this.selectedRow || !this.selectedRow.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn hợp đồng để sửa'
      );
      return;
    }

    const modalRef = this.modalService.open(AccountingContractDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });
    
    modalRef.componentInstance.editId = this.selectedRow.ID;
    modalRef.componentInstance.isReceivedContractMode = this.selectedRow.IsReceivedContract === true;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved' || result === 'success') {
          this.loadData();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onDelete() {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn ít nhất một hợp đồng để xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Xác nhận`,
      nzContent: `Bạn có chắc chắn muốn xóa hợp đồng đã chọn?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.accountingContractService.deleteAccountingContract(this.selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response && (response.status === 1 || response.Status === 1)) {
              const message = 'Xóa hợp đồng thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.loadData();
            } else {
              const errorMessage = response?.message || response?.Message || 'Có lỗi xảy ra';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
          },
          error: (error: any) => {
            console.error('Error in deleteAccountingContract:', error);
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra khi xóa hợp đồng';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          }
        });
      }
    });
  }

  handleApproval(isApprove: boolean) {
    const selectedRows = this.tb_AccountingContract.getSelectedData();
    
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn ít nhất một hợp đồng để ' + (isApprove ? 'duyệt' : 'hủy duyệt')
      );
      return;
    }

    const contractIds = selectedRows
      .map((row: any) => row.ID)
      .filter((id: any) => id && id > 0);

    if (contractIds.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Không tìm thấy ID hợp đồng hợp lệ'
      );
      return;
    }

    const actionText = isApprove ? 'duyệt' : 'hủy duyệt';
    const actionTextCapitalized = isApprove ? 'Duyệt' : 'Hủy duyệt';
    
    this.modal.confirm({
      nzTitle: `Xác nhận ${actionTextCapitalized}`,
      nzContent: `Bạn có chắc chắn muốn ${actionText} ${contractIds.length} hợp đồng đã chọn?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.accountingContractService.approval(isApprove, contractIds).subscribe({
          next: (response: any) => {
            if (response && (response.status === 1 || response.Status === 1)) {
              const message = isApprove ? 'Duyệt hợp đồng thành công' : 'Hủy duyệt hợp đồng thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.loadData();
            } else {
              const errorMessage = response?.message || response?.Message || 'Có lỗi xảy ra';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
          },
          error: (error: any) => {
            console.error('Error in handleApproval:', error);
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra khi ' + actionText + ' hợp đồng';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          }
        });
      }
    });
  }
  
  onReceiveContract() {
    if (!this.selectedRow || !this.selectedRow.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn hợp đồng để sửa'
      );
      return;
    }

    const modalRef = this.modalService.open(AccountingContractDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });
    
    modalRef.componentInstance.editId = this.selectedRow.ID;
    modalRef.componentInstance.isReceivedContractMode = true;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved' || result === 'success') {
          this.loadData();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onCancelReceiveContract() {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn hợp đồng để hủy nhận chứng từ'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Xác nhận`,
      nzContent: `Bạn có chắc chắn muốn hủy nhận chứng từ hợp đồng đã chọn?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.accountingContractService.cancelContract(this.selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response && (response.status === 1 || response.Status === 1)) {
              const message = 'Hủy nhận chứng từ hợp đồng thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.loadData();
            } else {
              const errorMessage = response?.message || response?.Message || 'Có lỗi xảy ra';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
          },
          error: (error: any) => {
            console.error('Error in onCancelReceiveContract:', error);
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra khi hủy nhận chứng từ hợp đồng';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          }
        });
      }
    });
  }

  onOpenAccountingContractLogModal(){
      if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn hợp đồng để xem lịch sử cập nhật'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Xác nhận`,
      nzContent: `Bạn có chắc chắn muốn hủy nhận chứng từ hợp đồng đã chọn?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.accountingContractService.cancelContract(this.selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response && (response.status === 1 || response.Status === 1)) {
              const message = 'Hủy nhận chứng từ hợp đồng thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.loadData();
            } else {
              const errorMessage = response?.message || response?.Message || 'Có lỗi xảy ra';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
          },
          error: (error: any) => {
            console.error('Error in onCancelReceiveContract:', error);
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra khi hủy nhận chứng từ hợp đồng';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          }
        });
      }
    });
  }

  onCopy() {
    if (!this.selectedRow || !this.selectedRow.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning, 
        'Vui lòng chọn hợp đồng để sửa'
      );
      return;
    }

    const modalRef = this.modalService.open(AccountingContractDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });

    modalRef.componentInstance.editId = this.selectedRow.ID;
    modalRef.componentInstance.isCopyMode = true;
    modalRef.componentInstance.isReceivedContractMode = false;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved' || result === 'success') {
          this.loadData();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  getAjaxParams(): any {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    
    return {
      dateStart: formatLocalDate(this.filters.startDate),
      dateEnd: formatLocalDate(this.filters.endDate),
      customerId: this.filters.customerId,
      supplierId: this.filters.supplierId,
      isReceivedContract: this.filters.isReceivedContract,
      isComingExpired: this.filters.isComingExpired,
      keyword: this.filters.keyword,
    };
  }

  initMasterTable() {
    const token = localStorage.getItem('token');
    this.tb_AccountingContract = new Tabulator(this.tb_AccountingContractElement.nativeElement, {
      layout: 'fitColumns',
      height: '100%',
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      selectableRows: 1,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500, 99999999],
      ajaxURL: this.accountingContractService.getAccountingContractAjax(),
      ajaxParams: () => this.getAjaxParams(),
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      ajaxResponse: (url, params, res) => {
        const flatData = res.data || [];
        const totalPage = flatData.length > 0 && flatData[0].TotalPage ? flatData[0].TotalPage : 1;

        console.log('total', totalPage);
        console.log('flat data', flatData);

        // Convert flat data to tree structure
        const treeData = this.convertToTreeData(flatData);

        console.log('tree data', treeData);

        return {
          data: treeData,
          last_page: totalPage,
        };
      },
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
      rowContextMenu: this.getContextMasterMenu(),
      rowFormatter: (row: any) => {
        const data = row.getData();
        const isComingExpired = data.IsComingExpired || 0;
        const accountingContractTypeID = data.AccountingContractTypeID || 0;
        
        // Bôi màu cam nếu isComingExpired == 1 và AccountingContractTypeID == 1 (HĐ Nguyên tắc)
        if (isComingExpired === 1 && accountingContractTypeID === 1) {
          const rowElement = row.getElement();
          if (rowElement) {
            rowElement.style.backgroundColor = '#FFA500'; 
          }
        }
        return '';
      },
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
        },
        {
          title: 'STT',
          field: 'RowNumber',
          sorter: 'string',
          width: 50,
        },
        {
          title: 'Duyệt',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 80,
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Nhận hồ sơ gốc',
          field: 'IsReceivedContract',
          sorter: 'boolean',
          width: 80,
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Ngày nhập',
          field: 'DateInput',
          sorter: 'date',
          width: 150,
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
          title: 'Công ty',
          field: 'CompanyName',
          sorter: 'string',
          width: 100,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc công ty',
        },
        {
          title: 'Phân loại HĐ chính',
          field: 'ContractGroupText',
          sorter: 'string',
          width: 200,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc phân loại HĐ chính',
        },
        {
          title: 'Loại HĐ',
          field: 'TypeName',
          sorter: 'string',
          width: 200,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc loại HĐ',
        },
        {
          title: 'Tên khách hàng / Nhà cung cấp',
          field: 'CustomerOrSupplier',
          sorter: 'string',
          width: 250,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc tên KH / NCC',
        },
        {
          title: 'Số HĐ/PL',
          field: 'ContractNumber',
          sorter: 'string',
          width: 200,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc số HĐ/PL',
        },
        {
          title: 'Ngày HĐ',
          field: 'DateContract',
          sorter: 'date',
          width: 150,
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
          title: 'Nội dung HĐ',
          field: 'ContractContent',
          sorter: 'string',
          formatter: 'textarea',
          width: 350,
        },
        {
          title: 'Giá trị HĐ',
          field: 'ContractValue',
          sorter: 'number',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Nội dung thanh toán',
          field: 'ContentPayment',
          sorter: 'string',
          formatter: 'textarea',
          width: 350,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc nội dung thanh toán',
        },
        {
          title: 'Hiệu lực HĐ',
          field: 'DateExpired',
          sorter: 'date',
          width: 150,
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
          title: 'Ngày duyệt bản mềm',
          field: 'DateIsApprovedGroup',
          sorter: 'date',
          width: 150,
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
          title: 'NV phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Thông tin thay đổi',
          field: 'Note',
          sorter: 'string',
          formatter: 'textarea',
          width: 250,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc thông tin thay đổi',
        },
        {
          title: 'Ngày trả hồ sơ gốc',
          field: 'DateReceived',
          sorter: 'date',
          width: 150,
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
          title: 'Số lượng hồ sơ',
          field: 'QuantityDocument',
          sorter: 'number',
          width: 150,
        },
        {
          title: 'File đính kèm',
          field: 'FileNames',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Người tạo',
          field: 'CreatedName',
          sorter: 'string',
          width: 150,
        },
      ],
    });
    this.tb_AccountingContract.on('rowClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      // Load file khi chọn dòng
      if (this.selectedRow && this.selectedRow.ID) {
        this.loadContractFiles(this.selectedRow.ID);
      }
    });
  }

  private getContextMasterMenu(): any[] {
    return [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i>Duyệt</span>',
        action: () => this.handleApproval(true),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i>Hủy Duyệt</span>',
        action: () => this.handleApproval(false),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i> Nhận chứng từ</span>',
        // action: () => this.openProjectPartlistPriceRequestNew(),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i>Hủy nhận chứng từ</span>',
        // action: () => this.exportToExcel(),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i>Lịch sử cập nhật</span>',
        // action: () => this.exportToExcel(),
      },
    ];
  }

  initFileTable(): void {
    this.tb_AccountingContractFile = new Tabulator(this.tb_AccountingContractFileElement.nativeElement, {
      data: this.dataAccountingContractFiles,
      layout: 'fitDataFill',
      height: '100%',
      movableColumns: true,
      resizableRows: true,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
        {
          title: 'STT',
          formatter: 'rownum',
          width: '5%',
          hozAlign: 'center',
          headerSort: false,
        },
        {
          title: 'Số HĐ/PL',
          field: 'ContractNumber',
          sorter: 'string',
          width: '20%',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          sorter: 'string',
          width: '20%',
        },
        {
          title: 'Thư mục gốc',
          field: 'OriginPath',
          sorter: 'string',
          width: '30%',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          sorter: 'date',
          width: '20%',
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
          title: 'Người tạo',
          field: 'FullName',
          sorter: 'string',
          width: '20%',
        },
      ],
    });
  }

  async exportToExcel() {
    try {
      // Lấy dữ liệu từ Tabulator table
      const tableData = this.tb_AccountingContract.getData();

      if (!tableData || tableData.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel');
        return;
      }

      // Tạo workbook và worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Hợp đồng kế toán');

      // Định nghĩa headers dựa trên columns của table
      const headers = [
        { header: 'STT', key: 'RowNumber', width: 10 },
        { header: 'Duyệt', key: 'IsApproved', width: 10 },
        { header: 'Nhận hồ sơ gốc', key: 'IsReceivedContract', width: 15 },
        { header: 'Ngày nhập', key: 'DateInput', width: 15 },
        { header: 'Công ty', key: 'CompanyName', width: 20 },
        { header: 'Phân loại HĐ chính', key: 'ContractGroupText', width: 20 },
        { header: 'Loại HĐ', key: 'TypeName', width: 20 },
        { header: 'Tên khách hàng / Nhà cung cấp', key: 'CustomerOrSupplier', width: 30 },
        { header: 'Số HĐ/PL', key: 'ContractNumber', width: 20 },
        { header: 'Ngày HĐ', key: 'DateContract', width: 15 },
        { header: 'Nội dung HĐ', key: 'ContractContent', width: 40 },
        { header: 'Giá trị HĐ', key: 'ContractValue', width: 20 },
        { header: 'ĐVT', key: 'Unit', width: 10 },
        { header: 'Nội dung thanh toán', key: 'ContentPayment', width: 40 },
        { header: 'Hiệu lực HĐ', key: 'DateExpired', width: 15 },
        { header: 'Ngày duyệt bản mềm', key: 'DateIsApprovedGroup', width: 18 },
        { header: 'NV phụ trách', key: 'FullName', width: 20 },
        { header: 'Thông tin thay đổi', key: 'Note', width: 30 },
        { header: 'Ngày trả hồ sơ gốc', key: 'DateReceived', width: 20 },
        { header: 'Số lượng hồ sơ', key: 'QuantityDocument', width: 15 },
        { header: 'File đính kèm', key: 'FileNames', width: 20 },
        { header: 'Người tạo', key: 'CreatedName', width: 20 },
      ];

      // Thêm headers vào worksheet
      worksheet.columns = headers;

      // Style cho header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 30;

      // Thêm dữ liệu
      tableData.forEach((row: any, index: number) => {
        const excelRow = worksheet.addRow({
          RowNumber: row.RowNumber || index + 1,
          IsApproved: row.IsApproved ? 'Có' : 'Không',
          IsReceivedContract: row.IsReceivedContract ? 'Có' : 'Không',
          DateInput: row.DateInput ? this.formatDateForExcel(row.DateInput) : '',
          CompanyName: row.CompanyName || '',
          ContractGroupText: row.ContractGroupText || '',
          TypeName: row.TypeName || '',
          CustomerOrSupplier: row.CustomerOrSupplier || '',
          ContractNumber: row.ContractNumber || '',
          DateContract: row.DateContract ? this.formatDateForExcel(row.DateContract) : '',
          ContractContent: row.ContractContent || '',
          ContractValue: row.ContractValue || 0,
          Unit: row.Unit || '',
          ContentPayment: row.ContentPayment || '',
          DateExpired: row.DateExpired ? this.formatDateForExcel(row.DateExpired) : '',
          DateIsApprovedGroup: row.DateIsApprovedGroup ? this.formatDateForExcel(row.DateIsApprovedGroup) : '',
          FullName: row.FullName || '',
          Note: row.Note || '',
          DateReceived: row.DateReceived ? this.formatDateForExcel(row.DateReceived) : '',
          QuantityDocument: row.QuantityDocument || 0,
          FileNames: row.FileNames || '',
          CreatedName: row.CreatedName || '',
        });

        // Format số tiền
        const moneyCell = excelRow.getCell('ContractValue');
        if (moneyCell.value && typeof moneyCell.value === 'number') {
          moneyCell.numFmt = '#,##0';
        }

        // Format số lượng hồ sơ
        const quantityCell = excelRow.getCell('QuantityDocument');
        if (quantityCell.value && typeof quantityCell.value === 'number') {
          quantityCell.numFmt = '#,##0';
          quantityCell.alignment = { horizontal: 'center' };
        }

        // Format ngày tháng
        ['DateInput', 'DateContract', 'DateExpired', 'DateIsApprovedGroup', 'DateReceived'].forEach(field => {
          const dateCell = excelRow.getCell(field);
          if (dateCell.value && typeof dateCell.value === 'string') {
            dateCell.alignment = { horizontal: 'center' };
          }
        });

        // Căn giữa cho các cột checkbox và STT
        excelRow.getCell('RowNumber').alignment = { horizontal: 'center' };
        excelRow.getCell('IsApproved').alignment = { horizontal: 'center' };
        excelRow.getCell('IsReceivedContract').alignment = { horizontal: 'center' };
      });

      // Auto fit columns
      worksheet.columns.forEach((column: any) => {
        if (column.width) {
          column.width = column.width;
        }
      });

      // Thêm border cho tất cả các cells
      worksheet.eachRow((row: any) => {
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Tạo file và download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Tạo tên file với ngày tháng
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;
      link.download = `HopDongKeToan_${dateStr}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công');
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + (error.message || 'Unknown error'));
    }
  }

  private formatDateForExcel(dateValue: any): string {
    if (!dateValue) return '';

    let date: Date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return String(dateValue);
    }

    if (isNaN(date.getTime())) return String(dateValue);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }

}

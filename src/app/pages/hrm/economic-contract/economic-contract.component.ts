import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { EconomicContractService } from './economic-contract-service/economic-contract.service';
import { EconomicContractFormComponent } from './economic-contract-form/economic-contract-form.component';
import { DateTime } from 'luxon';

@Component({
  standalone: true,
  selector: 'app-economic-contract',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NzNotificationModule,
    NzModalModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule,
    Menubar,
    AngularSlickgridModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './economic-contract.component.html',
  styleUrl: './economic-contract.component.css'
})
export class EconomicContractComponent implements OnInit {
  private ngbModal = inject(NgbModal);

  menuBars: MenuItem[] = [];
  searchForm!: FormGroup;

  // Search bar visibility
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  isLoading = false;

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  // Dropdown options
  typeNCCOptions = [
    { value: 0, label: 'Tất cả' },
    { value: 1, label: 'NCC' },
    { value: 2, label: 'KH' }
  ];
  contractTypes: any[] = [];

  // SlickGrid
  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  private excelExportService = new ExcelExportService();

  constructor(
    private fb: FormBuilder,
    private economicContractService: EconomicContractService,
    private notification: NzNotificationService,
    private nzModal: NzModalService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadContractTypes();
    this.initMenuBar();
    this.initGrid();
    this.loadData();
  }

  private initializeForm(): void {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm = this.fb.group({
      dateStart: [firstDay],
      dateEnd: [lastDay],
      keyword: [''],
      typeNCC: [0],
      type: [0]
    });
  }

  loadContractTypes() {
    this.economicContractService.getEconomicContractTypes().subscribe({
      next: (res) => {
        if (res?.status === 1) {
          this.contractTypes = [{ ID: 0, TypeName: 'Tất cả' }, ...(res.data || [])];
        }
      }
    });
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => {
          this.onCreate();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => {
          this.onEdit();
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.onDelete();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        }
      },
      {
        label: 'Nhập Excel',
        icon: 'fa-solid fa-file-import fa-lg text-primary',
        command: () => {
          this.importExcel();
        }
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => {
          this.loadData();
        }
      }
    ];
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        type: 'number',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-center',
      },
      {
        id: 'ContractNumber',
        name: 'Số hợp đồng',
        field: 'ContractNumber',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'TypeNCCText',
        name: 'Loại',
        field: 'TypeNCCText',
        type: 'string',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'TypeName',
        name: 'Loại hợp đồng',
        field: 'TypeName',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'TermName',
        name: 'Điều khoản',
        field: 'TermName',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ContractContent',
        name: 'Nội dung hợp đồng',
        field: 'ContractContent',
        type: 'string',
        minWidth: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'NameNcc',
        name: 'Tên NCC/KH',
        field: 'NameNcc',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'MSTNcc',
        name: 'MST',
        field: 'MSTNcc',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'AddressNcc',
        name: 'Địa chỉ',
        field: 'AddressNcc',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SDTNcc',
        name: 'SĐT',
        field: 'SDTNcc',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'EmailNcc',
        name: 'Email',
        field: 'EmailNcc',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SignedAmount',
        name: 'Giá trị ký',
        field: 'SignedAmount',
        type: 'number',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
        formatter: (_row, _cell, value) => {
          if (value == null) return '';
          return Number(value).toLocaleString('vi-VN');
        },
      },
      {
        id: 'MoneyType',
        name: 'Loại tiền',
        field: 'MoneyType',
        type: 'string',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'SignDate',
        name: 'Ngày ký',
        field: 'SignDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'EffectDateFrom',
        name: 'Hiệu lực từ',
        field: 'EffectDateFrom',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'EffectDateTo',
        name: 'Hiệu lực đến',
        field: 'EffectDateTo',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'TimeUnit',
        name: 'Đơn vị thời gian',
        field: 'TimeUnit',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Adjustment',
        name: 'Điều chỉnh',
        field: 'Adjustment',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
        hidden: true,
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        hidden: true,
      },
    ];

    this.gridOptions = {
      datasetIdPropertyName: 'id',
      autoResize: {
        container: '#grid-container-economic-contract',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      multiSelect: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: false,
        hideSelectAllCheckbox: false,
        applySelectOnAllPages: true
      },
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowHeight: 30,
      headerRowHeight: 35,

      // Excel Export
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
        columnHeaderStyle: {
          font: { fontName: 'Times New Roman', size: 12, bold: true, color: '#000000' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF33CC33' },
          alignment: { horizontal: 'center' },
          border: {
            top: { color: 'FF000000', style: 'thin' },
            left: { color: 'FF000000', style: 'thin' },
            right: { color: 'FF000000', style: 'thin' },
            bottom: { color: 'FF000000', style: 'thin' }
          }
        },
        dataStyle: {
          font: { fontName: 'Times New Roman', size: 12 },
          border: {
            top: { color: 'FF000000', style: 'thin' },
            left: { color: 'FF000000', style: 'thin' },
            right: { color: 'FF000000', style: 'thin' },
            bottom: { color: 'FF000000', style: 'thin' }
          }
        }
      } as any,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid.dataView;
  }

  loadData() {
    this.isLoading = true;
    const formValue = this.searchForm.value;

    const request = {
      dateStart: formValue.dateStart ? new Date(formValue.dateStart).toISOString() : '',
      dateEnd: formValue.dateEnd ? new Date(formValue.dateEnd).toISOString() : '',
      keyword: formValue.keyword || '',
      typeNCC: formValue.typeNCC || 0,
      type: formValue.type || 0
    };

    this.economicContractService.getEconomicContracts(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.status === 1) {
          const dataList = res.data?.[0] || [];
          this.dataset = dataList.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1
          }));
          this.updateFilterCollections();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Lỗi khi lấy dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi lấy dữ liệu:', err);
      }
    });
  }

  resetSearch() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm.reset({
      dateStart: firstDay,
      dateEnd: lastDay,
      keyword: '',
      typeNCC: 0,
      type: 0
    });
    this.loadData();
  }

  onCreate() {
    const modalRef = this.ngbModal.open(EconomicContractFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.loadData();
    });
    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      (dismissed) => { }
    );
  }

  onEdit() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
      return;
    }
    const rowIndex = selectedRows[0];
    const rowData = this.angularGrid.dataView.getItem(rowIndex);

    const modalRef = this.ngbModal.open(EconomicContractFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = { ...rowData };
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.loadData();
    });
    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      (dismissed) => { }
    );
  }

  onDelete() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng để xóa!');
      return;
    }

    const selectedIds = selectedRows.map(index => this.angularGrid.dataView.getItem(index).ID);
    let content = '';
    if (selectedIds.length === 1) {
      const rowData = this.angularGrid.dataView.getItem(selectedRows[0]);
      content = `Bạn chắc chắn muốn xóa hợp đồng <b>${rowData.ContractNumber}</b>?`;
    } else {
      content = `Bạn chắc chắn muốn xóa <b>${selectedIds.length}</b> hợp đồng đã chọn?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        return this.economicContractService.deleteEconomicContract(selectedIds)
          .toPromise()
          .then((res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công');
              this.loadData();
              this.angularGrid.slickGrid.setSelectedRows([]);
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          })
          .catch((err) => {
            const msg = err?.error?.message || err?.message || 'Không gọi được API';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          });
      },
    });
  }

  exportToExcel() {
    const dateStart = DateTime.fromJSDate(this.searchForm.value.dateStart).toFormat('ddMMyyyy');
    const dateEnd = DateTime.fromJSDate(this.searchForm.value.dateEnd).toFormat('ddMMyyyy');
    const now = DateTime.fromJSDate(new Date()).toFormat('HHmmss');
    this.excelExportService.exportToExcel({
      filename: `HopDongKinhTe_${dateStart}_${dateEnd}_${now}`,
      format: 'xlsx',
    });
  }

  importExcel() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          this.notification.error(NOTIFICATION_TITLE.error, 'File Excel không có sheet nào');
          return;
        }

        const data: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const rowData = {
            ContractNumber: row.getCell(1).value?.toString() || '',
            TypeNCC: row.getCell(2).value === 'NCC' ? 1 : (row.getCell(2).value === 'KH' ? 2 : 0),
            ContractContent: row.getCell(3).value?.toString() || '',
            NameNcc: row.getCell(4).value?.toString() || '',
            MSTNcc: row.getCell(5).value?.toString() || '',
            AddressNcc: row.getCell(6).value?.toString() || '',
            SDTNcc: row.getCell(7).value?.toString() || '',
            EmailNcc: row.getCell(8).value?.toString() || '',
            SignedAmount: Number(row.getCell(9).value) || 0,
            MoneyType: row.getCell(10).value?.toString() || 'VND',
            Note: row.getCell(11).value?.toString() || '',
          };
          if (rowData.ContractNumber) {
            data.push(rowData);
          }
        });

        if (data.length === 0) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để nhập');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of data) {
          try {
            const res = await this.economicContractService.saveEconomicContract(item).toPromise();
            if (res?.status === 1) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }

        if (successCount > 0) {
          this.notification.success(NOTIFICATION_TITLE.success, `Đã nhập thành công ${successCount} hợp đồng`);
          this.loadData();
        }
        if (errorCount > 0) {
          this.notification.warning(NOTIFICATION_TITLE.warning, `${errorCount} hợp đồng nhập thất bại`);
        }

      } catch (err) {
        console.error('Error importing Excel:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi đọc file Excel');
      }
    };
    input.click();
  }

  updateFilterCollections() {
    if (!this.angularGrid?.slickGrid) return;

    this.columnDefinitions.forEach(column => {
      if (column.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field as string;
        const uniqueValues = Array.from(new Set(this.dataset.map(item => item[field])))
          .filter(val => val !== undefined && val !== null && val !== '')
          .sort()
          .map(val => ({ label: String(val), value: val }));

        column.filter.collection = uniqueValues;
      }
    });

    // Sử dụng setColumns thay vì reassign columnDefinitions để giữ lại checkbox column
    this.angularGrid.slickGrid.setColumns(this.angularGrid.slickGrid.getColumns());
  }
}

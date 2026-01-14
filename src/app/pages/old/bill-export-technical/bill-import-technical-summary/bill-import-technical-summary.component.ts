import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../app.config';

// Angular SlickGrid imports
import {
  AngularSlickgridModule,
  Column,
  GridOption,
  Formatters,
  AngularGridInstance,
  Editors,
  SlickGrid,
} from 'angular-slickgrid';

// Service import
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';

// Form component import
import { BillImportTechnicalFormComponent } from '../../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';

// NgbModal
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface DocumentImport {
  ID: number;
  DocumentImportName: string;
}

interface BillImportTechnicalSummary {
  ID: number;
  IDDetail: number;
  Status: boolean;
  CreatedDate: string;
  BillTypeText: string;
  DateRequestImport: string;
  BillImportCode: string;
  CodeNCC: string;
  NameNCC: string;
  DepartmentName: string;
  Code: string;
  Deliver: string;
  Reciver: string;
  DeliverID: number;
  SomeBill: string;
  DateSomeBill: string;
  DPO: number;
  DueDate: string;
  TaxReduction: number;
  COFormE: number;
  IsSuccess: number;
  IsSuccessText: string;
  TotalPage: number;
  [key: string]: any; // Cho phép dynamic columns (D1, D2, D3...)
}

@Component({
  selector: 'app-bill-import-technical-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzDividerModule,
    NzDatePickerModule,
    NzSpinModule,
    NzCheckboxModule,
    NzInputNumberModule,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-import-technical-summary.component.html',
  styleUrls: ['./bill-import-technical-summary.component.css'],
})
export class BillImportTechnicalSummaryComponent
  implements OnInit, AfterViewInit
{
  @Input() warehouseId: number = 0;

  // Grid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: BillImportTechnicalSummary[] = [];
  gridObj!: SlickGrid;

  // State
  isLoading: boolean = false;
  isAdmin: boolean = false;
  currentUserID: number = 0;

  // Filter
  searchParams = {
    dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    billType: -1,
    filterText: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000000,
    warehouseId: 0,
  };

  // Dropdowns
  billTypes = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
  ];

  // Pagination
  totalPages: number = 1;

  // Document columns (dynamic)
  documents: DocumentImport[] = [];

  // Track edited cells
  changedRows: Map<number, any> = new Map();

  constructor(
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private billImportTechnicalService: BillImportTechnicalService,
    private ngbModal: NgbModal,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.appUserService.isAdmin;
    this.currentUserID = this.appUserService.id || 0;
    this.searchParams.warehouseId = this.warehouseId;

    this.initGridOptions();
    this.buildFixedColumns();
  }

  ngAfterViewInit(): void {
    // Load data sau khi view init
    setTimeout(() => {
      this.loadBillImportTechnicalSummary();
    }, 0);
  }

  initGridOptions(): void {
    this.gridOptions = {
      datasetIdPropertyName: 'id',
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
      editable: true,
      autoEdit: false,
      autoCommitEdit: true,
      enableColumnReorder: true,
      enableGridMenu: true,
      gridHeight: 600,
      gridWidth: '100%',
      rowHeight: 35,
      headerRowHeight: 40,
      frozenColumn: 5, // Frozen đến cột Mã NCC (index 5, tính từ 0)
      forceFitColumns: false, // Tắt auto-fit columns
      enableExcelExport: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableCheckboxSelector: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      excelExportOptions: {
        exportWithFormatter: true,
      },
      gridMenu: {
        hideExportCsvCommand: false,
        hideExportExcelCommand: false,
        hideExportTextDelimitedCommand: true,
        hideClearAllFiltersCommand: false,
        hideToggleFilterCommand: false,
      },
      autoResize: {
        container: '#gridContainer',
        calculateAvailableSizeBy: 'container',
      },
      // Enable context menu for double-click detail view
      enableContextMenu: true,
      contextMenu: {
        hideCloseButton: false,
        width: 200,
        commandItems: [
          {
            command: 'view-detail',
            title: 'Xem chi tiết phiếu',
            iconCssClass: 'fa fa-eye',
            action: (_e: any, args: any) => {
              const row = args.dataContext;
              this.openBillDetailModal(row);
            },
          },
        ],
      },
    };
  }

  angularGridReady(event: Event): void {
    const customEvent = event as CustomEvent<AngularGridInstance>;
    this.angularGrid = customEvent.detail;
    this.gridObj = this.angularGrid.slickGrid;

    // Thiết lập metadata provider để bôi màu dòng
    if (this.angularGrid.dataView) {
      const originalGetItemMetadata = this.angularGrid.dataView.getItemMetadata;
      this.angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = this.angularGrid.dataView.getItem(row);
        let metadata = originalGetItemMetadata
          ? originalGetItemMetadata.call(this.angularGrid.dataView, row)
          : {};

        if (item && item.IsSuccess === 0) {
          metadata = metadata || {};
          metadata.cssClasses = (metadata.cssClasses || '') + ' row-warning';
        }

        return metadata;
      };
    }

    // Lắng nghe sự kiện cell change để tự động tính DueDate
    this.gridObj.onCellChange.subscribe((_e: any, args: any) => {
      if (args && args.item) {
        const item = args.item;
        const field = this.gridObj.getColumns()[args.cell]?.field;

        // Tự động tính DueDate khi DateSomeBill hoặc DPO thay đổi
        if (field === 'DateSomeBill' || field === 'DPO') {
          const dpo = item.DPO || 0;
          if (item.DateSomeBill) {
            const dateSomeBill = DateTime.fromISO(item.DateSomeBill);
            if (dateSomeBill.isValid) {
              item.DueDate = dateSomeBill.plus({ days: dpo }).toISO();
              // Update grid
              this.gridObj.invalidateRow(args.row);
              this.gridObj.render();
            }
          }
        }

        // Track changed rows
        if (item.IDDetail) {
          this.changedRows.set(item.IDDetail, item);
        }
      }
    });
  }

  onCheckAllChange(checked: boolean): void {
    this.searchParams.checkAll = checked;
    this.loadBillImportTechnicalSummary();
  }

  onSearch(): void {
    this.loadBillImportTechnicalSummary();
  }

  loadBillImportTechnicalSummary(): void {
    this.isLoading = true;

    const dateStart = this.searchParams.checkAll
      ? null
      : DateTime.fromJSDate(new Date(this.searchParams.dateStart))
          .startOf('day')
          .toISO();

    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd))
      .endOf('day')
      .toISO();

    this.billImportTechnicalService
      .getBillImportTechnicalSummary({
        pageNumber: this.searchParams.pageNumber,
        pageSize: this.searchParams.pageSize,
        dateStart: dateStart,
        dateEnd: dateEnd || '',
        status: this.searchParams.billType,
        filterText: this.searchParams.filterText,
        warehouseId: this.warehouseId,
        isAll: this.searchParams.checkAll,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.status === 1) {
            // Lấy documents và data từ response
            this.documents = res.documents || [];
            let index = 1;
            this.dataset = res.data || [];
            this.dataset = this.dataset.map((item) => ({
              ...item,
              id: index++,
            }));

            if (this.dataset.length > 0) {
              this.totalPages = this.dataset[0].TotalPage || 1;
            }

            // Build columns với dynamic document columns
            this.buildColumns();

            // Clear changed rows khi load data mới
            this.changedRows.clear();

            // Refresh grid
            if (this.angularGrid && this.angularGrid.dataView) {
              this.angularGrid.dataView.setItems(this.dataset);
              this.gridObj.invalidate();
            }
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Không thể tải dữ liệu'
            );
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading data:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi tải dữ liệu'
          );
        },
      });
  }

  buildFixedColumns(): void {
    // Build fixed columns trước, dynamic columns sẽ được thêm sau khi có data
    this.columnDefinitions = [
      {
        id: 'Status',
        name: 'Nhận chứng từ',
        field: 'Status',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => {
          return value ? '✓' : '';
        },
        width: 70,
        cssClass: 'text-center',
      },
      {
        id: 'CreatedDate',
        name: 'Ngày nhận',
        field: 'CreatedDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        width: 120,
      },
      {
        id: 'BillTypeText',
        name: 'Loại phiếu',
        field: 'BillTypeText',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'DateRequestImport',
        name: 'Ngày Y/C nhập',
        field: 'DateRequestImport',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        width: 130,
      },
      {
        id: 'BillCode',
        name: 'Số phiếu',
        field: 'BillCode',
        sortable: true,
        filterable: true,
        width: 160,
      },
      {
        id: 'CodeNCC',
        name: 'Mã NCC',
        field: 'CodeNCC',
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        id: 'IsSuccess',
        name: 'Trạng thái',
        field: 'IsSuccess',
        sortable: true,
        filterable: true,
        width: 0,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        hidden: true,
      },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp / Bộ phận',
        field: 'NameNCC',
        sortable: true,
        filterable: true,
        width: 300,
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Code',
        name: 'Mã NV',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'Deliver',
        name: 'Người giao / Người trả',
        field: 'Deliver',
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        id: 'Receiver',
        name: 'Người nhận',
        field: 'Receiver',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'CreatDate',
        name: 'Ngày nhập kho',
        field: 'CreatDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        width: 130,
      },
      {
        id: 'ProductCode',
        name: 'Mã hàng',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'WarehouseName',
        name: 'Kho',
        field: 'WarehouseName',
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        id: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        field: 'ProductCodeRTC',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'UnitCode',
        name: 'DVT',
        field: 'UnitCode',
        sortable: true,
        filterable: true,
        width: 80,
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Quantity',
        name: 'SL thực tế',
        field: 'Quantity',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 100,
      },
      {
        id: 'ProductGroupRTCID',
        name: 'Loại hàng',
        field: 'ProductGroupName',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'IsBill',
        name: 'Hóa đơn',
        field: 'IsBill',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => {
          return value ? '✓' : '';
        },
        width: 80,
        cssClass: 'text-center',
      },
      {
        id: 'SomeBill',
        name: 'Số hóa đơn',
        field: 'SomeBill',
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['text'],
        },
        width: 150,
      },
      {
        id: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        field: 'DateSomeBill',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        editor: {
          model: Editors['date'],
        },
        width: 150,
      },
      {
        id: 'DPO',
        name: 'Số ngày công nợ',
        field: 'DPO',
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['integer'],
        },
        width: 150,
      },
      {
        id: 'DueDate',
        name: 'Ngày tới hạn',
        field: 'DueDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        width: 150,
      },
      {
        id: 'TaxReduction',
        name: 'Tiền thuế giảm',
        field: 'TaxReduction',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        width: 150,
      },
      {
        id: 'COFormE',
        name: 'Chi phí FE',
        field: 'COFormE',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        width: 150,
      },
      {
        id: 'DoccumentReceiver',
        name: 'Người giao',
        field: 'DoccumentReceiver',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 250,
      },
      {
        id: 'BillCodePO',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Price',
        name: 'Đơn giá',
        field: 'Price',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 120,
      },
      {
        id: 'TotalPrice',
        name: 'Tổng tiền',
        field: 'TotalPrice',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 150,
      },
      {
        id: 'UnitPricePO',
        name: 'Đơn giá PO',
        field: 'UnitPricePO',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 120,
      },
      {
        id: 'VATPO',
        name: 'Thuế',
        field: 'VATPO',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 100,
      },
      {
        id: 'TotalPricePO',
        name: 'Tổng tiền PO',
        field: 'TotalPricePO',
        sortable: true,
        filterable: true,
        formatter: Formatters.decimal,
        width: 150,
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 200,
      },
    ];
  }

  buildColumns(): void {
    // Bắt đầu với fixed columns
    this.buildFixedColumns();

    // Status column
    const statusColumn: Column = {
      id: 'IsSuccessText',
      name: 'Trạng thái chứng từ',
      field: 'IsSuccessText',
      sortable: true,
      filterable: true,
      width: 250,
    };

    // Dynamic document columns
    const documentColumns: Column[] = this.documents.map((doc) => ({
      id: `D${doc.ID}`,
      name: doc.DocumentImportName,
      field: `D${doc.ID}`,
      sortable: true,
      filterable: true,
      width: 250,
    }));

    // Combine all columns
    this.columnDefinitions = [
      ...this.columnDefinitions,
      statusColumn,
      ...documentColumns,
    ];

    // Update grid columns nếu grid đã sẵn sàng
    if (this.angularGrid && this.gridObj) {
      this.gridObj.setColumns(this.columnDefinitions);
      this.gridObj.invalidate();
    }
  }

  saveChanges(): void {
    if (this.changedRows.size === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thay đổi để lưu!'
      );
      return;
    }

    const dataToSave: any[] = [];
    const deniedRows: string[] = [];

    this.changedRows.forEach((row) => {
      const id = row.IDDetail || 0;
      if (id <= 0) return;

      // Kiểm tra quyền
      const deliverID = row.DeliverID || 0;
      if (deliverID !== this.currentUserID && !this.isAdmin) {
        deniedRows.push(row.BillImportCode || `ID: ${id}`);
        return;
      }

      // Lấy DPO (backend sẽ tự tính DueDate)
      const dpo = row.DPO || 0;

      dataToSave.push({
        IDDetail: id,
        DeliverID: deliverID,
        SomeBill: row.SomeBill || '',
        DateSomeBill: row.DateSomeBill || null,
        DPO: dpo,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
      });
    });

    if (deniedRows.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn không có quyền sửa ${deniedRows.length} phiếu`
      );
    }

    if (dataToSave.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu hợp lệ để lưu!'
      );
      return;
    }

    this.billImportTechnicalService
      .updateBillImportDetails(dataToSave)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              res.message || 'Lưu thành công!'
            );
            this.changedRows.clear();
            this.loadBillImportTechnicalSummary();
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Lưu thất bại!'
            );
          }
        },
        error: (err) => {
          console.error('Error saving:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lưu dữ liệu'
          );
        },
      });
  }

  exportExcel(): void {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel'
      );
      return;
    }

    // Hướng dẫn người dùng sử dụng Grid Menu để export
    this.notification.info(
      'Xuất Excel',
      'Vui lòng sử dụng Grid Menu (icon ⚙ ở góc phải header) → chọn "Export to Excel"'
    );
  }

  /**
   * Mở modal chi tiết phiếu nhập kỹ thuật
   * @param rowData Dữ liệu dòng được chọn
   */
  openBillDetailModal(rowData: any): void {
    if (!rowData || !rowData.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có thông tin phiếu nhập để xem chi tiết'
      );
      return;
    }

    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });

    // Truyền ID phiếu nhập vào form component
    modalRef.componentInstance.billImportTechnicalID = rowData.ID;
    modalRef.componentInstance.warehouseID = this.warehouseId;
    modalRef.componentInstance.isViewMode = true; // Chế độ xem

    // Lắng nghe sự kiện đóng modal để reload lại dữ liệu nếu có thay đổi
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Reload data nếu có lưu thay đổi
          this.loadBillImportTechnicalSummary();
        }
      },
      () => {
        // Modal dismissed (cancelled)
      }
    );
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }
}

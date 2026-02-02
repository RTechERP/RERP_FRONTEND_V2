import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AssetsManagementService } from '../../ts-asset-management/ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { AssetAllocationService } from '../ts-asset-allocation-service/ts-asset-allocation.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
} from 'angular-slickgrid';

@Component({
  standalone: true,
  selector: 'app-ts-asset-choose-assets',
  templateUrl: './ts-asset-choose-assets.component.html',
  styleUrls: ['./ts-asset-choose-assets.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    AngularSlickgridModule,
  ],
})
export class TsAssetChooseAssetsComponent implements OnInit {
  @Input() dataInput: any;
  searchText = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();

  constructor(private notification: NzNotificationService) { }

  private assetManagementService = inject(AssetsManagementService);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  public activeModal = inject(NgbActiveModal);
  private unitService = inject(UnitService);
  private sourceService = inject(AssetsService);
  private typeService = inject(TypeAssetsService);
  private assetAllocationService = inject(AssetAllocationService);

  @Input() existingIds: number[] = [];

  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  allData: any[] = [];
  selectedCount = 0;
  totalAssets = 0;
  // Lưu các ID đã chọn để duy trì selection khi filter
  selectedIds: Set<number> = new Set();
  gridId = this.generateUUIDv4();

  generateUUIDv4(): string {
    return 'g-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  ngOnInit(): void {
    this.initGrid();
    this.getAssetmanagement();
  }

  getAssetmanagement(): void {
    const request = {
      filterText: '',
      pageNumber: 1,
      pageSize: 10000,
      dateStart: '2022-05-22T00:00:00',
      dateEnd: '2027-05-22T23:59:59',
      status: '1',
      department: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,22,23',
    };
    this.assetManagementService.getAsset(request).subscribe({
      next: (response: any) => {
        const assets = response.data?.assets || [];
        // Lọc bỏ những tài sản đã có trong existingIds
        this.allData = assets.filter((a: any) => !this.existingIds.includes(a.ID));
        this.totalAssets = this.allData.length;
        this.dataset = this.allData.map((item: any, index: number) => ({
          ...item,
          id: item.ID || index + 1,
          STT: index + 1,
        }));
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu tài sản');
      },
    });
  }

  private initGrid(): void {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    // Status formatter với màu sắc
    const statusFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      if (!value) return '';
      let bgColor = '#e0e0e0';
      let textColor = '#000';

      switch (value) {
        case 'Chưa sử dụng':
          bgColor = '#AAAAAA';
          textColor = '#fff';
          break;
        case 'Đang sử dụng':
          bgColor = '#b4ecb4';
          textColor = '#2cb55a';
          break;
        case 'Đã thu hồi':
          bgColor = '#FFCCCC';
          textColor = '#000';
          break;
        case 'Mất':
          bgColor = '#fbc4c4';
          textColor = '#d40000';
          break;
        case 'Hỏng':
          bgColor = '#cadff';
          textColor = '#4147f2';
          break;
        case 'Thanh lý':
          bgColor = '#d4fbff';
          textColor = '#08aabf';
          break;
        case 'Đề nghị thanh lý':
          bgColor = '#fde3c1';
          textColor = '#f79346';
          break;
        case 'Sữa chữa, Bảo dưỡng':
          bgColor = '#bcaa93';
          textColor = '#c37031';
          break;
      }

      return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 8px; border-radius: 5px; display: inline-block;">${value}</span>`;
    };

    this.columnDefinitions = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        minWidth: 60,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TSCodeNCC',
        name: 'Mã tài sản',
        field: 'TSCodeNCC',
        width: 200,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TSAssetName',
        name: 'Tên tài sản',
        field: 'TSAssetName',
        width: 280,
        minWidth: 280,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Seri',
        name: 'Seri',
        field: 'Seri',
        width: 150,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SpecificationsAsset',
        name: 'Thông số',
        field: 'SpecificationsAsset',
        width: 250,
        minWidth: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DateBuy',
        name: 'Ngày mua',
        field: 'DateBuy',
        width: 120,
        minWidth: 120,
        sortable: true,
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filterable: true,
        cssClass: 'text-center',
      },
      {
        id: 'Insurance',
        name: 'Bảo hành (tháng)',
        field: 'Insurance',
        width: 130,
        minWidth: 130,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
      },
      {
        id: 'AssetType',
        name: 'Loại tài sản',
        field: 'AssetType',
        width: 180,
        minWidth: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Name',
        name: 'Phòng ban',
        field: 'Name',
        width: 180,
        minWidth: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Status',
        name: 'Trạng thái',
        field: 'Status',
        width: 160,
        minWidth: 160,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: statusFormatter as any,
      },
      {
        id: 'SourceName',
        name: 'Nguồn gốc',
        field: 'SourceName',
        width: 150,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'FullName',
        name: 'Người quản lý',
        field: 'FullName',
        width: 180,
        minWidth: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
        minWidth: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#' + this.gridId + '_container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableCellNavigation: true,
      enableFiltering: true,
      rowHeight: 35,
      headerRowHeight: 40,
      // Tắt auto fit để có thể scroll ngang
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      // Bật checkbox selection
      enableCheckboxSelector: true,
      enableRowSelection: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
        width: 50,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      // Cho phép chọn nhiều dòng
      multiSelect: true,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Lắng nghe sự kiện thay đổi selection
    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        const selectedRowIndices = args.rows || [];

        // Lấy tất cả IDs hiện đang được chọn trong view
        const currentViewSelectedIds = new Set<number>();
        selectedRowIndices.forEach((rowIndex: number) => {
          const item = this.angularGrid.dataView.getItem(rowIndex);
          if (item && item.ID) {
            currentViewSelectedIds.add(item.ID);
          }
        });

        // Lấy tất cả IDs hiện đang hiển thị trong view
        const visibleIds = new Set<number>();
        const totalRows = this.angularGrid.dataView.getLength();
        for (let i = 0; i < totalRows; i++) {
          const item = this.angularGrid.dataView.getItem(i);
          if (item && item.ID) {
            visibleIds.add(item.ID);
          }
        }

        // Xóa các ID hiện đang hiển thị nhưng không được chọn
        visibleIds.forEach((id) => {
          if (!currentViewSelectedIds.has(id)) {
            this.selectedIds.delete(id);
          }
        });

        // Thêm các ID mới được chọn
        currentViewSelectedIds.forEach((id) => {
          this.selectedIds.add(id);
        });

        this.selectedCount = this.selectedIds.size;
      });
    }
  }

  applyFilter(): void {
    if (!this.angularGrid?.dataView) return;

    const kw = (this.searchText || '').toLowerCase().trim();

    if (!kw) {
      this.angularGrid.dataView.setFilter(() => true);
      this.angularGrid.dataView.refresh();
      this.restoreSelection();
      return;
    }

    this.angularGrid.dataView.setFilter((item: any) => {
      const fields = [
        'TSAssetCode',
        'TSAssetName',
        'Seri',
        'TSCodeNCC',
        'SpecificationsAsset',
        'SourceName',
        'FullName',
        'Name',
        'Note',
        'AssetType',
        'Status',
      ];

      return fields.some((f) => {
        const v = (item[f] ?? '').toString().toLowerCase();
        return v.includes(kw);
      });
    });

    this.angularGrid.dataView.refresh();
    this.restoreSelection();
  }

  // Khôi phục selection sau khi filter
  private restoreSelection(): void {
    if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;

    const rowsToSelect: number[] = [];
    const dataView = this.angularGrid.dataView;
    const totalRows = dataView.getLength();

    for (let i = 0; i < totalRows; i++) {
      const item = dataView.getItem(i);
      if (item && this.selectedIds.has(item.ID)) {
        rowsToSelect.push(i);
      }
    }

    this.angularGrid.slickGrid.setSelectedRows(rowsToSelect);
  }

  selectAssets(): void {
    if (!this.angularGrid?.slickGrid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chờ bảng tải xong.');
      return;
    }

    // Lấy tất cả các item đã chọn từ selectedIds
    if (this.selectedIds.size === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một tài sản.');
      return;
    }

    // Lấy data từ allData dựa trên selectedIds
    const selectedData = this.allData.filter((item: any) => this.selectedIds.has(item.ID));

    // Bỏ những cái đã có ở cha (double check)
    const filtered = selectedData.filter((r) => !this.existingIds.includes(r.ID));
    const skipped = selectedData.length - filtered.length;
    if (skipped > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Bỏ qua ${skipped} tài sản trùng.`);
    }
    if (filtered.length === 0) return;

    const newRows = filtered.map((row) => ({
      AssetManagementID: row.ID,
      TSAssetID: row.TSAssetID,
      TSAssetCode: row.TSAssetCode,
      TSAssetName: row.TSAssetName,
      Quantity: 1,
      TSCodeNCC: row.TSCodeNCC,
      Note: row.Note || '',
      Seri: row.Seri,
      UnitID: row.UnitID,
      UnitName: row.UnitName,
      SpecificationsAsset: row.SpecificationsAsset,
      DateBuy: row.DateBuy,
      Insurance: row.Insurance,
      AssetType: row.AssetType,
      DepartmentID: row.DepartmentID,
      Name: row.Name,
      SourceID: row.SourceID,
      SourceName: row.SourceName,
      FullName: row.FullName,
      CreatedBy: row.CreatedBy,
      CreatedDate: row.CreatedDate,
      UpdatedBy: row.UpdatedBy,
      UpdatedDate: row.UpdatedDate,
      IsAllocation: row.IsAllocation,
      OfficeActiveStatus: row.OfficeActiveStatus,
      WindowActiveStatus: row.WindowActiveStatus,
    }));

    this.formSubmitted.emit(newRows);
    this.activeModal.dismiss();
  }

  close(): void {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}

import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AssetsRecoveryService } from '../ts-asset-recovery-service/ts-asset-recovery.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
} from 'angular-slickgrid';

@Component({
  standalone: true,
  selector: 'app-ts-asset-recovery-by-employee',
  templateUrl: './ts-asset-recovery-by-employee.component.html',
  styleUrls: ['./ts-asset-recovery-by-employee.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    AngularSlickgridModule,
  ],
})
export class TsAssetRecoveryByEmployeeComponent implements OnInit {
  searchText = '';
  @Input() dataInput1: any;
  @Input() existingIds: number[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();

  public activeModal = inject(NgbActiveModal);
  private assetsRecoveryService = inject(AssetsRecoveryService);

  assetByEmployeeData: any[] = [];
  allData: any[] = [];

  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
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

  constructor(private notification: NzNotificationService) { }

  ngOnInit() {
    this.initGrid();
    this.getRecoveryByemployee();
  }

  getRecoveryByemployee() {
    if (!this.dataInput1?.RecoverID) {
      this.dataInput1.RecoverID = 0;
    }
    this.assetsRecoveryService
      .getRecoveryByEmployee(this.dataInput1.RecoverID, this.dataInput1.EmployeeReturnID)
      .subscribe((response: any) => {
        const assets = response?.assetsRecoveryByEmployee ?? [];
        // Lọc bỏ những tài sản đã có trong existingIds
        const block = new Set((this.existingIds || []).map(Number));
        this.allData = assets.filter((a: any) => !block.has(Number(a.ID)));
        this.totalAssets = this.allData.length;
        this.dataset = this.allData.map((item: any, index: number) => ({
          ...item,
          id: item.ID || index + 1,
          STT: index + 1,
        }));
      });
  }

  private initGrid(): void {
    // Status formatter với màu sắc
    const statusFormatter = (
      row: number,
      cell: number,
      value: any,
      columnDef: any,
      dataContext: any
    ) => {
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
        id: 'ID',
        name: 'ID',
        field: 'ID',
        width: 60,
        hidden: true,
      },
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
        name: 'Mã NCC',
        field: 'TSCodeNCC',
        width: 150,
        minWidth: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TSAssetName',
        name: 'Tên tài sản',
        field: 'TSAssetName',
        width: 280,
        minWidth: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Status',
        name: 'Trạng thái',
        field: 'Status',
        width: 160,
        minWidth: 140,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: statusFormatter as any,
      },
      {
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 100,
        minWidth: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-center',
      },
      {
        id: 'Name',
        name: 'Phòng ban',
        field: 'Name',
        width: 180,
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
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
        minWidth: 150,
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
      const fields = ['TSCodeNCC', 'TSAssetName', 'FullName', 'Name', 'Note', 'Status'];

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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chờ bảng tải xong.'
      );
      return;
    }

    // Lấy tất cả các item đã chọn từ selectedIds
    if (this.selectedIds.size === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một tài sản.'
      );
      return;
    }

    // Lấy data từ allData dựa trên selectedIds
    const selectedData = this.allData.filter((item: any) =>
      this.selectedIds.has(item.ID)
    );

    // Bỏ những cái đã có ở cha (double check)
    const block = new Set((this.existingIds || []).map(Number));
    const filtered = selectedData.filter((r) => !block.has(Number(r.ID)));
    const skipped = selectedData.length - filtered.length;
    if (skipped > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bỏ qua ${skipped} tài sản trùng.`
      );
    }
    if (filtered.length === 0) return;

    const newRows = filtered.map((row) => ({
      ID: 0,
      AssetManagementID: row.ID,
      TSAssetRecoveryID: this.dataInput1.RecoverID,
      EmployeeID: row.EmployeeID,
      FullName: row.FullName,
      Name: row.Name,
      Note: row.Note,
      Quantity: row.Quantity,
      STT: row.STT,
      Status: row.Status,
      TSAssetName: row.TSAssetName,
      TSCodeNCC: row.TSCodeNCC,
    }));

    this.formSubmitted.emit(newRows);
    this.activeModal.dismiss();
  }

  close(): void {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
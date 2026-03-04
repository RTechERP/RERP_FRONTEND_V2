import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
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
import { forkJoin } from 'rxjs';

import { NOTIFICATION_TITLE } from '../../../app.config';
import { UpdateVersionService } from './update-version.service';
import { UpdateVersionFormComponent } from './update-version-form/update-version-form.component';
import { UpdateVersionDetailComponent } from './update-version-detail/update-version-detail.component';
import { DomSanitizer } from '@angular/platform-browser';

interface UpdateVersion {
  ID: number;
  Code: string;
  Name: string;
  Content: string;
  Status: number;
  PublicDate: string;
  Note: string;
  CreatedDate: string;
  CreatedBy: string;
  UpdatedDate: string;
  UpdatedBy: string;
  FileNameFE: string;
  FileNameBE: string;
  IsDeleted: boolean;
}

@Component({
  standalone: true,
  selector: 'app-update-version',
  imports: [
    CommonModule,
    FormsModule,
    NgbModalModule,
    NzNotificationModule,
    NzModalModule,
    NzCardModule,
    NzSplitterModule,
    Menubar,
    AngularSlickgridModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './update-version.component.html',
  styleUrl: './update-version.component.css'
})
export class UpdateVersionComponent implements OnInit, OnDestroy {
  private ngbModal = inject(NgbModal);
  private eventSource: EventSource | null = null;

  menuBars: MenuItem[] = [];

  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: any = {};
  dataset: any[] = [];
  nextCode: string = '';

  private excelExportService = new ExcelExportService();

  constructor(
    private updateVersionService: UpdateVersionService,
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrid();
    this.loadData();
    this.initSseConnection();
  }

  ngOnDestroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  initSseConnection() {
    const sseUrl = this.updateVersionService.getSseUrl();
    this.eventSource = new EventSource(sseUrl);

    this.eventSource.addEventListener('contract-updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Event [contract-updated]:', data);

        // Optional: Hiển thị thông báo hoặc refresh lưới nếu cần
        // this.notification.info(NOTIFICATION_TITLE.info, `Phiên bản ${data.code} đã được public`);
        // this.loadData();
      } catch (e) {
        console.error('Lỗi parse dữ liệu SSE:', e, event.data);
      }
    });

    this.eventSource.onopen = (event) => {
      console.log('SSE Connection opened:', event);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Connection error:', error);
      // EventSource tự động reconnect nếu không gọi close()
    };
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
        label: 'Public',
        icon: 'fa-solid fa-globe fa-lg text-info',
        command: () => {
          this.onPublic();
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
        label: 'Xem chi tiết',
        icon: 'fa-solid fa-magnifying-glass-plus fa-lg text-primary',
        command: () => {
          this.onViewDetailSelected();
        }
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-warning',
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
        excelExportOptions: { width: 8 }
      },
      {
        id: 'IsPublic',
        name: 'Public',
        field: 'Status',
        type: 'number',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { label: '✓', value: 1 },
            { label: '✗', value: 2 }
          ],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row, cell, value) => {
          return value === 1
            ? '<span style="color: #28a745; font-size: 18px; font-weight: bold;">✓</span>'
            : '<span style="color: #dc3545; font-size: 18px; font-weight: bold;">✗</span>';
        },
        cssClass: 'text-center',
        excelExportOptions: { width: 10 }
      },
      {
        id: 'Code',
        name: 'Mã phiên bản',
        field: 'Code',
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
        excelExportOptions: { width: 20 }
      },
      {
        id: 'Name',
        name: 'Tên bản cập nhật',
        field: 'Name',
        type: 'string',
        minWidth: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        excelExportOptions: { width: 40 }
      },
      {
        id: 'Content',
        name: 'Nội dung',
        field: 'Content',
        type: 'string',
        minWidth: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        excelExportOptions: { width: 60 },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          const strippedValue = value.replace(/<[^>]*>/g, '');
          return `
            <span
              title="${strippedValue}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${strippedValue}
            </span>
          `;
        },
        customTooltip: {
          formatter: (_row, _cell, _value, _column, dataContext) => {
            if (!dataContext.Content) return '';
            return `<div style="max-width: 500px; max-height: 400px; overflow-y: auto; white-space: normal; padding: 5px;">${dataContext.Content}</div>`;
          }
        },
      },
      {
        id: 'Status',
        name: 'Trạng thái',
        field: 'Status',
        type: 'number',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { label: 'Đã public', value: 1 },
            { label: 'Chưa public', value: 2 }
          ],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row, cell, value) => {
          return value === 1 ? 'Đã public' : 'Chưa public';
        },
        excelExportOptions: { width: 15 }
      },
      {
        id: 'PublicDate',
        name: 'Ngày public',
        field: 'PublicDate',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: (row, cell, value) => {
          if (!value) return '';
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        },
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center',
        excelExportOptions: { width: 20 }
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
        excelExportOptions: { width: 30 }
      },
      {
        id: 'FileNameFE',
        name: 'File FE',
        field: 'FileNameFE',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        excelExportOptions: { width: 20 }
      },
      {
        id: 'FileNameBE',
        name: 'File BE',
        field: 'FileNameBE',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        excelExportOptions: { width: 20 }
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
        params: { dateFormat: 'DD/MM/YYYY HH:mm' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
        hidden: true,
        excludeFromExport: true
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
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
        hidden: true,
        excludeFromExport: true
      },
      {
        id: 'UpdatedDate',
        name: 'Ngày cập nhật',
        field: 'UpdatedDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY HH:mm' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
        hidden: true,
        excludeFromExport: true
      },
      {
        id: 'UpdatedBy',
        name: 'Người cập nhật',
        field: 'UpdatedBy',
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
        hidden: true,
        excludeFromExport: true
      },
    ];

    this.gridOptions = {
      datasetIdPropertyName: 'id',
      autoResize: {
        container: '#grid-container-update-version',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableRowSelection: true,
      multiSelect: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: false,
        hideSelectAllCheckbox: false,
        applySelectOnAllPages: true
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowHeight: 30,
      headerRowHeight: 35,
      enableAutoTooltip: true,
      enableCustomTooltip: true,
      customTooltipOptions: {
        maxTooltipLength: 1000,
      },
      // Excel Export
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
        columnHeaderStyle: {
          font: { fontName: 'Times New Roman', size: 12, bold: false, color: '#220000' },
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
    } as any;
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid.dataView;

    const slickGrid = this.angularGrid.slickGrid;
    const dataView = this.angularGrid.dataView;
    let clickTimeout: any = null;
    slickGrid.onClick.subscribe((e: any, args: any) => {
      const column = slickGrid.getColumns()[args.cell];
      if (column.id === '_checkbox_selector') return;
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
        return;
      }
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        const row = args.row;
        const selectedRows = slickGrid.getSelectedRows() as number[];
        const newSelectedRows = [...selectedRows];
        const index = newSelectedRows.indexOf(row);

        if (index > -1) {
          newSelectedRows.splice(index, 1);
        } else {
          newSelectedRows.push(row);
        }

        slickGrid.setSelectedRows(newSelectedRows);
      }, 250);
    });

    // Double click vào dòng để sửa
    slickGrid.onDblClick.subscribe((e: any, args: any) => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      if (args.row !== undefined && args.row >= 0) {
        const rowData = dataView.getItem(args.row);
        if (rowData) {
          this.openEditForm(rowData);
        }
      }
    });
  }

  loadData() {
    this.updateVersionService.getUpdateVersions().subscribe({
      next: (res) => {
        if (res?.status === 1) {
          const data = res.data?.data || [];
          this.nextCode = res.data?.nextCode || '';
          this.dataset = data.map((item: any, index: number) => ({ ...item, id: item.ID, STT: index + 1 }));
          this.updateFilterCollections();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || `${err?.error || ''}\n${err?.message || 'Lỗi khi lấy dữ liệu'}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        console.error('Lỗi lấy dữ liệu:', err);
      }
    });
  }

  onCreate() {
    const modalRef = this.ngbModal.open(UpdateVersionFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.nextCode = this.nextCode;
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
    this.openEditForm(rowData);
  }

  openEditForm(rowData: any) {
    if (!rowData) return;

    // Kiểm tra nếu đã public thì không cho sửa
    if (rowData.Status === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiên bản đã public không thể sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(UpdateVersionFormComponent, {
      size: 'lg',
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

    // // Kiểm tra nếu có bản ghi đã public thì không cho xóa
    // const hasPublished = selectedRows.some(index => {
    //   const rowData = this.angularGrid.dataView.getItem(index);
    //   return rowData.Status === 1;
    // });
    // if (hasPublished) {
    //   this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể xóa phiên bản đã public!');
    //   return;
    // }

    let content = '';
    if (selectedIds.length === 1) {
      const rowData = this.angularGrid.dataView.getItem(selectedRows[0]);
      content = `Bạn chắc chắn muốn xóa phiên bản <b>${rowData.Code} - ${rowData.Name}</b>?`;
    } else {
      content = `Bạn chắc chắn muốn xóa <b>${selectedIds.length}</b> phiên bản đã chọn?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const tasks = selectedIds.map(id => this.updateVersionService.saveUpdateVersion({ ID: id, IsDeleted: true }));
        forkJoin(tasks).subscribe({
          next: (results: any[]) => {
            const allSuccess = results.every(res => res?.status === 1);
            if (allSuccess) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadData();
              this.angularGrid.slickGrid.setSelectedRows([]);
            } else {
              const firstError = results.find(res => res?.status !== 1);
              this.notification.error(NOTIFICATION_TITLE.error, firstError?.message || 'Xóa thất bại');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err?.error || ''}\n${err?.message || ''}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              });
          }
        });
      },
    });
  }

  onViewDetailSelected() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để xem chi tiết!');
      return;
    }
    const rowIndex = selectedRows[0];
    const rowData = this.angularGrid.dataView.getItem(rowIndex);
    this.onViewDetail(rowData);
  }

  onViewDetail(rowData: any) {
    const modalRef = this.ngbModal.open(UpdateVersionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.versionData = { ...rowData };
    modalRef.result.then(
      (result) => {
        if (result === 'update') {
          // Thực hiện reload trang nếu người dùng chọn cập nhật ngay
          window.location.reload();
        }
      },
      (dismissed) => { }
    );
  }

  onPublic() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để public!');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chỉ chọn một dòng để public!');
      return;
    }
    const rowIndex = selectedRows[0];
    const rowData = this.angularGrid.dataView.getItem(rowIndex);

    // Kiểm tra nếu đã public rồi thì không cho public nữa
    if (rowData.Status === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiên bản này đã được public!');
      return;
    }

    // Xác nhận public
    this.nzModal.confirm({
      nzTitle: 'Xác nhận public',
      nzContent: `Bạn chắc chắn muốn public phiên bản <b>${rowData.Code} - ${rowData.Name}</b>?`,
      nzOkText: 'Public',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Cập nhật trạng thái và ngày public
        const payload = {
          ...rowData,
          Status: 1,
          PublicDate: new Date()
        };

        return this.updateVersionService.saveUpdateVersion(payload)
          .toPromise()
          .then((res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Public thành công!');
              this.loadData();
              this.angularGrid.slickGrid.setSelectedRows([]);
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Public thất bại');
            }
          })
          .catch((err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err?.error?.message || `${err?.error || ''}\n${err?.message || 'Có lỗi xảy ra khi public'}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          });
      },
    });
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'PhienBanCapNhat',
      format: 'xlsx',
    });
  }

  updateFilterCollections() {
    if (!this.angularGrid?.slickGrid) return;

    this.columnDefinitions.forEach(column => {
      if (column.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field as string;
        const uniqueValues = Array.from(new Set(this.dataset.map(item => item[field])))
          .filter(val => val !== undefined && val !== null && val !== '')
          .sort()
          .map(val => ({ label: val, value: val }));

        column.filter.collection = uniqueValues;
      }
    });

    // Sử dụng setColumns thay vì reassign columnDefinitions để giữ lại checkbox column
    this.angularGrid.slickGrid.setColumns(this.angularGrid.slickGrid.getColumns());
  }
}

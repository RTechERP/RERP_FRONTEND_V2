import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// NG Zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAlertModule } from 'ng-zorro-antd/alert';

// PrimeNG imports
import { Menubar } from 'primeng/menubar';

// SlickGrid imports
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
} from 'angular-slickgrid';

// Service
import { KpiCriteriaService } from './kpi-criteria-service/kpi-criteria.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { trigger } from '@angular/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KpiCriteriaDetailComponent } from './kpi-criteria-detail/kpi-criteria-detail.component';

@Component({
  selector: 'app-kpi-criteria',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzInputNumberModule,
    NzFormModule,
    NzModalModule,
    NzAlertModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './kpi-criteria.component.html',
  styleUrl: './kpi-criteria.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiCriteriaComponent implements OnInit, OnDestroy {
  // Menu bar items
  menuBars: any[] = [];

  // Filters
  filters: any = {
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    filterText: '',
  };

  // SlickGrid properties for Criteria table
  angularGridCriteria!: AngularGridInstance;
  columnDefinitionsCriteria: Column[] = [];
  gridOptionsCriteria: GridOption = {};
  datasetCriteria: any[] = [];

  // SlickGrid properties for Criteria Detail table
  angularGridCriteriaDetail!: AngularGridInstance;
  columnDefinitionsCriteriaDetail: Column[] = [];
  gridOptionsCriteriaDetail: GridOption = {};
  datasetCriteriaDetail: any[] = [];

  // Selection state
  selectedId: number = 0;
  selectedRow: any = null;

  // Copy modal
  @ViewChild('copyModalTemplate', { static: false }) copyModalTemplate!: TemplateRef<any>;
  copyQuarter: number = 1;
  copyYear: number = new Date().getFullYear();
  copyModalRef?: NzModalRef;

  constructor(
    private kpiCriteriaService: KpiCriteriaService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGridCriteria();
    this.initGridCriteriaDetail();
    this.loadCriteriaList();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  //#region Menu Bar
  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => {
          this.onAdd();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => {
          this.onEdit();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.onDelete();
        },
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => {
          this.onCopy();
        },
      },
    ];
  }
  //#endregion

  //#region Grid Initialization
  initGridCriteria(): void {
    this.columnDefinitionsCriteria = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        minWidth: 60,
        sortable: true,
        cssClass: 'text-center',
      },
      {
        id: 'KPICriteriaYear',
        name: 'Năm',
        field: 'KPICriteriaYear',
        width: 80,
        minWidth: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'KPICriteriaQuater',
        name: 'Quý',
        field: 'KPICriteriaQuater',
        width: 60,
        minWidth: 60,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'CriteriaCode',
        name: 'Mã Tiêu Chí',
        field: 'CriteriaCode',
        width: 150,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CriteriaName',
        name: 'Tên Tiêu Chí',
        field: 'CriteriaName',
        width: 500,
        minWidth: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsCriteria = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-criteria',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableCheckboxSelector: false,
      multiColumnSort: true,
    };
  }

  initGridCriteriaDetail(): void {
    this.columnDefinitionsCriteriaDetail = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        minWidth: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-center',
      },
      {
        id: 'Point',
        name: 'Mức điểm hệ số',
        field: 'Point',
        width: 130,
        minWidth: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        formatter: this.numberFormatter,
        cssClass: 'text-end',
      },
      {
        id: 'PointPercent',
        name: 'Mức điểm %',
        field: 'PointPercent',
        width: 110,
        minWidth: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        formatter: this.percentFormatter,
        cssClass: 'text-end',
      },
      {
        id: 'CriteriaContent',
        name: 'Nội dung',
        field: 'CriteriaContent',
        width: 600,
        minWidth: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsCriteriaDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-criteria-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableCheckboxSelector: false,
      multiColumnSort: true,
      forceFitColumns: true,
    };
  }
  //#endregion

  //#region Formatters
  numberFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  percentFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + '%';
  }
  //#endregion

  //#region Grid Ready Events
  angularGridReadyCriteria(angularGrid: AngularGridInstance): void {
    this.angularGridCriteria = angularGrid;
  }

  angularGridReadyCriteriaDetail(angularGrid: AngularGridInstance): void {
    this.angularGridCriteriaDetail = angularGrid;
  }
  //#endregion

  //#region Data Loading
  loadCriteriaList(): void {
    this.kpiCriteriaService
      .getData(this.filters.quarter, this.filters.year, this.filters.filterText)
      .subscribe({
        next: (response: any) => {
          if (response.status === 1 && Array.isArray(response.data)) {
            this.datasetCriteria = response.data.map((item: any, index: number) => ({
              ...item,
              id: item.ID,
              STT: index + 1,
            }));
          } else {
            this.datasetCriteria = [];
          }
          // Clear detail when reloading master
          this.datasetCriteriaDetail = [];
          this.selectedId = 0;
          this.selectedRow = null;
        },
        error: (error: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu tiêu chí: ' + error);
          this.datasetCriteria = [];
        },
      });
  }

  loadCriteriaDetail(criteriaId: number): void {
    this.kpiCriteriaService.getDetail(criteriaId).subscribe({
      next: (response: any) => {
        if (response.status === 1 && Array.isArray(response.data)) {
          this.datasetCriteriaDetail = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1,
          }));
        } else {
          this.datasetCriteriaDetail = [];
        }
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết tiêu chí: ' + error);
        this.datasetCriteriaDetail = [];
      },
    });
  }
  //#endregion

  //#region Filter Events
  onYearChange(): void {
    this.searchCriteria();
  }

  onQuarterChange(): void {
    this.searchCriteria();
  }

  searchCriteria(): void {
    this.loadCriteriaList();
  }
  //#endregion

  //#region Row Click Events
  onCriteriaRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedId = item['ID'];
      this.selectedRow = item;
      this.loadCriteriaDetail(this.selectedId);
    }
  }

  onCriteriaRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedId = item['ID'];
      this.selectedRow = item;
      this.onEdit();
    }
  }
  //#endregion

  //#region CRUD Operations
  onAdd(): void {
    const modalRef = this.modalService.open(KpiCriteriaDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.editId = 0;
    modalRef.componentInstance.year = this.filters.year;
    modalRef.componentInstance.quarter = this.filters.quarter;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadCriteriaList();
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  onEdit(): void {
    if (!this.selectedId || this.selectedId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tiêu chí cần sửa!');
      return;
    }

    const modalRef = this.modalService.open(KpiCriteriaDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.editId = this.selectedId;
    modalRef.componentInstance.year = this.selectedRow?.KPICriteriaYear || this.filters.year;
    modalRef.componentInstance.quarter = this.selectedRow?.KPICriteriaQuater || this.filters.quarter;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadCriteriaList();
          this.loadCriteriaDetail(this.selectedId);
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  onDelete(): void {
    if (!this.selectedId || this.selectedId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tiêu chí cần xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa tiêu chí "${this.selectedRow?.CriteriaName}"?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiCriteriaService.delete([this.selectedId]).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa tiêu chí thành công');
              this.loadCriteriaList();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Có lỗi xảy ra khi xóa');
            }
          },
          error: (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa tiêu chí: ' + error);
          },
        });
      },
    });
  }

  onCopy(): void {
    // Initialize with default values for destination
    this.copyQuarter = 1;
    this.copyYear = new Date().getFullYear();

    // Create modal with template
    this.copyModalRef = this.modal.create({
      nzTitle: 'Copy Tiêu Chí KPI',
      nzContent: this.copyModalTemplate,
      nzOkText: 'Copy',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Validate destination quarter and year
        if (!this.copyQuarter || this.copyQuarter < 1 || this.copyQuarter > 4) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Quý phải từ 1 đến 4!');
          return false;
        }

        if (!this.copyYear || this.copyYear < 2024) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Năm không hợp lệ!');
          return false;
        }

        // Call API with source (from filters) and destination (from modal)
        return new Promise<boolean>((resolve) => {
          this.kpiCriteriaService.copyCriteria(
            this.filters.quarter,    // Source quarter from filter
            this.filters.year,        // Source year from filter
            this.copyQuarter,         // Destination quarter from modal
            this.copyYear             // Destination year from modal
          ).subscribe({
            next: (response: any) => {
              if (response.status === 1) {
                this.notification.success(NOTIFICATION_TITLE.success, 'Copy tiêu chí thành công!');
                this.loadCriteriaList();
                resolve(true);
              } else {
                const errorMessage = response.message || 'Có lỗi xảy ra khi copy tiêu chí!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                resolve(false);
              }
            },
            error: (error: any) => {
              const errorMessage = error?.error?.message || error?.message || 'Lỗi khi copy tiêu chí!';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
              resolve(false);
            },
          });
        });
      },
    });
  }
  //#endregion
}

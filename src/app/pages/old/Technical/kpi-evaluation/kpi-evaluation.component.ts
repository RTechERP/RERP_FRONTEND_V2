import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  Optional,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
} from 'angular-slickgrid';

import { Menubar } from 'primeng/menubar';

import { KpiEvaluationService } from './kpi-evaluation-service/kpi-evaluation.service';
import { KpiEvaluationDetailComponent } from './kpi-evaluation-detail/kpi-evaluation-detail.component';

@Component({
  selector: 'app-kpi-evaluation',
  imports: [
    CommonModule,
    NzModalModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './kpi-evaluation.component.html',
  styleUrl: './kpi-evaluation.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiEvaluationComponent implements OnInit {
  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Menu bar
  menuBars: any[] = [];

  // Params
  departmentId: number = 0;

  // Selected row
  selectedId: number = 0;
  selectedRow: any = null;

  constructor(
    private service: KpiEvaluationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    this.route.queryParams.subscribe((params) => {
      this.departmentId = params['departmentId'] ?? this.tabData?.departmentId ?? 0;
    });
  }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrid();
    this.loadData();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAdd(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEdit(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDelete(),
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => this.loadData(),
      },
    ];
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        sortable: true,
        filterable: true,
        hidden: true,
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        sortable: true,
        filterable: true,
        minWidth: 60,
        maxWidth: 80,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
      },
      {
        id: 'EvaluationCode',
        name: 'Mã nội dung',
        field: 'EvaluationCode',
        sortable: true,
        filterable: true,
        minWidth: 220,
      },
      {
        id: 'ErrorCode',
        name: 'Mã lỗi',
        field: 'ErrorCode',
        sortable: true,
        filterable: true,
        minWidth: 220,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        minWidth: 260,
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          return String(value);
        },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      rowHeight: 35,
      headerRowHeight: 40,
      autoEdit: false,
      autoCommitEdit: false,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
  }

  loadData(): void {
    const prevSelectedId = this.selectedId;

    this.service.getKPIEvaluation(this.departmentId).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          const data = Array.isArray(res.data) ? res.data : [];
          this.dataset = data.map((item: any, index: number) => ({
            ...item,
            id: item.ID ?? index,
            STT: index + 1,
          }));

          if (prevSelectedId) {
            const rowIndex = this.dataset.findIndex((x) => x?.ID === prevSelectedId);
            if (rowIndex >= 0) {
              this.selectedId = prevSelectedId;
              this.selectedRow = this.dataset[rowIndex];

              if (this.angularGrid?.slickGrid) {
                const grid = this.angularGrid.slickGrid;
                const colIndex = (grid as any).getColumnIndex
                  ? (grid as any).getColumnIndex('EvaluationCode')
                  : 0;
                grid.setActiveCell(rowIndex, colIndex ?? 0);
              }
              return;
            }
          }

          this.selectedId = 0;
          this.selectedRow = null;
        } else {
          this.notification.error('Lỗi', res?.message || 'Không thể tải dữ liệu');
        }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu');
      },
    });
  }

  onRowClick(_e: any, args: any): void {
    if (!args || args.row === undefined || !this.angularGrid?.slickGrid) return;

    const grid = this.angularGrid.slickGrid;
    const dataItem = grid.getDataItem(args.row);
    if (!dataItem) return;

    this.selectedId = dataItem.ID;
    this.selectedRow = dataItem;
  }

  onRowDblClick(eventData: any, args: any): void {
    this.onRowClick(eventData, args);
    this.onEdit();
  }

  onAdd(): void {
    const modalRef = this.modalService.open(KpiEvaluationDetailComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.departmentId = this.departmentId;
    modalRef.componentInstance.detail = null;

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => { }
    );
  }

  onEdit(): void {
    if (!this.selectedId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationDetailComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = this.selectedId;
    modalRef.componentInstance.departmentId = this.departmentId;
    modalRef.componentInstance.detail = this.selectedRow;

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => { }
    );
  }

  onDelete(): void {
    if (!this.selectedId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
      return;
    }

    const code = this.selectedRow?.EvaluationCode || '';

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa mã nội dung [${code}] không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.service.delete(this.selectedId).subscribe({
          next: (response: any) => {
            if (response?.status === 1) {
              this.notification.success('Thành công', 'Xóa thành công');
              this.selectedId = 0;
              this.selectedRow = null;
              this.loadData();
            } else {
              this.notification.error('Lỗi', response?.message || 'Xóa thất bại');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể xóa dữ liệu');
          },
        });
      },
    });
  }
}


import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  GridOption,
} from 'angular-slickgrid';
import { Menubar } from 'primeng/menubar';
import { KpiErrorTypeService } from './kpi-error-type-service/kpi-error-type.service';
import { KpiErrorTypeDetailComponent } from './kpi-error-type-detail/kpi-error-type-detail.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-kpi-error-type',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './kpi-error-type.component.html',
  styleUrl: './kpi-error-type.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiErrorTypeComponent implements OnInit {
  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Menu bar
  menuBars: any[] = [];

  // Selected row
  selectedId: number = 0;
  selectedRow: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private kpiErrorTypeService: KpiErrorTypeService
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrid();
    this.loadKPIErrorType();
  }

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
    ];
  }

  loadKPIErrorType(): void {
    this.kpiErrorTypeService.getKPIErrorType().subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          this.dataset = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: item.STT || index + 1,
          }));
        }
      },
      error: (error: any) => {
        console.error('Error loading KPI error types:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách loại lỗi');
      }
    });
  }

  onRowClick(e: any, args: any): void {
    if (args && args.row !== undefined) {
      const grid = this.angularGrid.slickGrid;
      const dataItem = grid.getDataItem(args.row);
      if (dataItem) {
        this.selectedId = dataItem.ID;
        this.selectedRow = dataItem;
      }
    }
  }

  onAdd(): void {
    const modalRef = this.modalService.open(KpiErrorTypeDetailComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.id = 0;

    modalRef.result.then(
      () => {
        this.loadKPIErrorType();
      },
      () => { }
    );
  }

  onEdit(): void {
    if (!this.selectedId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa');
      return;
    }

    const modalRef = this.modalService.open(KpiErrorTypeDetailComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = this.selectedId;

    modalRef.result.then(
      () => {
        this.loadKPIErrorType();
      },
      () => { }
    );
  }

  onDelete(): void {
    if (!this.selectedId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại lỗi này?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiErrorTypeService.deleteKPIErrorType(this.selectedId).subscribe({
          next: (response: any) => {
            if (response?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.selectedId = 0;
              this.selectedRow = null;
              this.loadKPIErrorType();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Xóa thất bại');
            }
          },
          error: (error: any) => {
            console.error('Error deleting:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xóa dữ liệu');
          },
        });
      },
    });
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        hidden: true,
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        sortable: true,
        minWidth: 60,
        maxWidth: 80,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
      },
      {
        id: 'Code',
        name: 'Mã loại lỗi',
        field: 'Code',
        sortable: true,
        filterable: true,
        minWidth: 100,
      },
      {
        id: 'Name',
        name: 'Tên loại lỗi',
        field: 'Name',
        sortable: true,
        filterable: true,
        minWidth: 300,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      enableFiltering: true,
      rowHeight: 35,
      headerRowHeight: 40,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

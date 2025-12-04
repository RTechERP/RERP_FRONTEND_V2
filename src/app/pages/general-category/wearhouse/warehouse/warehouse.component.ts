import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { WarehouseService } from '../warehouse-service/warehouse.service';
import { WarehouseFormComponent } from '../warehouse-form/warehouse-form.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import{HasPermissionDirective} from '../../../../directives/has-permission.directive';
@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpaceModule,
    NzSpinModule,
    NzSplitterModule,
    NzModalModule,
    NgbModalModule,
    HasPermissionDirective
  ],
  templateUrl: './warehouse.component.html',
  styleUrl: './warehouse.component.css',
})
export class WarehouseComponent1 implements OnInit, AfterViewInit {
  warehouseTable: Tabulator | null = null;
  warehouseList: any[] = [];
  selectedRow: any = null;
  selectedRows: any[] = [];
  keyword: string = '';
  loading: boolean = false;

  private notification = inject(NzNotificationService);
  private modalService = inject(NzModalService);
  private ngbModal = inject(NgbModal);
  private warehouseService = inject(WarehouseService);

  ngOnInit(): void {
    // no-op
  }

  ngAfterViewInit(): void {
    this.drawTable();
    setTimeout(() => {
      this.loadData();
    }, 0);
  }

  drawTable(): void {
    this.warehouseTable = new Tabulator('#warehouseTable', {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      layout: 'fitDataStretch',
      selectableRows: true,
      data: this.warehouseList,
      columns: [
        {
          title: 'STT',
          width: 60,
          formatter: 'rownum',
          hozAlign: 'center',
        },
        {
          title: 'Mã kho',
          field: 'WarehouseCode',
          minWidth: 120,
          hozAlign: 'left',
        },
        {
          title: 'Tên kho',
          field: 'WarehouseName',
          minWidth: 200,
          hozAlign: 'left',
        },
      ],
    });

    this.warehouseTable.on('rowClick', (_e, row) => {
      this.selectedRow = row.getData();
    });

    this.warehouseTable.on('rowSelectionChanged', (data: any[]) => {
      this.selectedRows = data;
    });

    this.warehouseTable.on('rowDblClick', (_e, row) => {
      this.selectedRow = row.getData();
      this.onEdit();
    });
  }

  loadData(): void {
    this.loading = true;
    this.warehouseService.getWarehouses().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? [];
        this.warehouseList = Array.isArray(data) ? data : [];
        if (this.warehouseTable) {
          this.warehouseTable.setData(this.warehouseList);
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách kho!',
        );
      },
    });
  }

  onSearch(): void {
    if (!this.warehouseTable) return;
    const text = (this.keyword || '').toLowerCase().trim();
    if (!text) {
      this.warehouseTable.clearFilter(true);
      return;
    }
    this.warehouseTable.setFilter([
      [
        { field: 'WarehouseCode', type: 'like', value: text },
        { field: 'WarehouseName', type: 'like', value: text },
      ],
    ]);
  }

  resetFilter(): void {
    this.keyword = '';
    if (this.warehouseTable) {
      this.warehouseTable.clearFilter(true);
    }
  }

  onAdd(): void {
    const modalRef = this.ngbModal.open(WarehouseFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => {},
    );
  }

  onEdit(): void {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(WarehouseFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = this.selectedRow;

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => {},
    );
  }

  onDelete(): void {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kho muốn xóa!');
      return;
    }

    const ids = this.selectedRows
      .map((x: any) => Number(x.ID) || 0)
      .filter((id: number) => id > 0);

    if (ids.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có kho hợp lệ để xóa!');
      return;
    }

    const confirmMessage =
      ids.length === 1
        ? 'Bạn có chắc muốn xóa kho đã chọn không?'
        : `Bạn có chắc muốn xóa ${ids.length} kho đã chọn không?`;

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteObservables = ids.map((id: number) => {
          const payload = {
            ID: id,
            IsDeleted: true,
          };
          return this.warehouseService.saveWarehouse(payload).pipe(
            catchError((error) => {
              console.error(`Lỗi khi xóa ID ${id}:`, error);
              return of({ success: false, error, id });
            }),
          );
        });

        forkJoin(deleteObservables).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter((r) => r.success !== false).length;
            const failCount = responses.filter((r) => r.success === false).length;

            if (successCount > 0) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Xóa thành công ${successCount} kho!`,
              );
            }

            if (failCount > 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Có ${failCount} kho xóa thất bại!`,
              );
            }

            this.loadData();
          },
          error: (error) => {
            console.error('Lỗi khi xóa:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa kho!');
          },
        });
      },
    });
  }
}



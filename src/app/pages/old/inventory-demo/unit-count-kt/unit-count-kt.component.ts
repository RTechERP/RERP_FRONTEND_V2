import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { UnitCountKtService } from './unit-count-kt-service/unit-count-kt.service';
import { UnitCountKtDetailComponent } from './unit-count-kt-detail/unit-count-kt-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-unit-count-kt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzModalModule,
  ],
  templateUrl: './unit-count-kt.component.html',
  styleUrls: ['./unit-count-kt.component.css'],
})
export class UnitCountKtComponent implements OnInit, AfterViewInit {
  @ViewChild('unitCountKTTable', { static: false }) unitCountKTTableRef!: ElementRef;
  unitCountKTTable: any;
  listUnitCountKT: any[] = [];
  isLoading: boolean = false;
  searchText: string = '';

  constructor(
    private unitCountKtService: UnitCountKtService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
  }

  drawTable() {
    const el = this.unitCountKTTableRef?.nativeElement;
    if (!el) {
      console.warn('unitCountKTTable element chưa sẵn sàng');
      return;
    }
    this.unitCountKTTable = new Tabulator(el, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      paginationMode: 'local',
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Mã đơn vị tính', field: 'UnitCountCode', width: 400 },
        { title: 'Tên đơn vị tính', field: 'UnitCountName' },
      ],
    });
  }

  loadData() {
    this.isLoading = true;
    this.unitCountKtService.getUnitCountKT().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.listUnitCountKT = res.data || [];
          if (this.unitCountKTTable) {
            this.unitCountKTTable.setData(this.listUnitCountKT);
          }
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Không thể tải đơn vị tính!'
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi tải đơn vị tính!'
        );
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  onAddClick() {
    const modalRef = this.modalService.open(UnitCountKtDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'custom-modal',
    });
    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  onEditClick() {
    const selectedData = this.unitCountKTTable.getSelectedData();
    if (selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn đơn vị tính để sửa!'
      );
      return;
    }
    if (selectedData.length > 1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Chỉ có thể sửa 1 đơn vị tính!'
      );
      return;
    }
    const modalRef = this.modalService.open(UnitCountKtDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'custom-modal',
    });

    modalRef.componentInstance.unitCountKT = selectedData[0];

    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  onDeleteClick() {
    const selected = this.unitCountKTTable?.getSelectedData?.() || [];
    if (!selected || selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn đơn vị tính để xóa!'
      );
      return;
    }

    const names = selected
      .map((r: any) => r.UnitCountName || r.UnitCountCode)
      .join(', ');
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa các đơn vị tính: <strong>${names}</strong>?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = selected.map((item: any) => ({
          ID: item.ID,
          IsDeleted: true,
        }));
        this.unitCountKtService.saveDataUnitCountKT(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa đơn vị tính thành công!'
              );
              this.loadData();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                res.message || 'Không thể xóa đơn vị tính!'
              );
            }
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Có lỗi xảy ra khi xóa đơn vị tính!'
            );
            console.error(err);
          },
        });
      },
    });
  }

  onSearch(): void {
    const keyword = (this.searchText || '').trim().toLowerCase();
    if (!this.unitCountKTTable) return;

    if (!keyword) {
      this.unitCountKTTable.clearFilter(false);
    } else {
      this.unitCountKTTable.setFilter([
        [
          { field: 'UnitCountCode', type: 'like', value: keyword },
          { field: 'UnitCountName', type: 'like', value: keyword },
        ],
      ]);
    }
  }
}

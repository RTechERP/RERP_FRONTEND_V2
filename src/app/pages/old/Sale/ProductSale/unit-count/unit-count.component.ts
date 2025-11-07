import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
// import { NSelectComponent } from '../n-select/n-select.component';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { UnitCountDetailComponent } from '../unit-count-detail/unit-count-detail.component';
@Component({
  selector: 'app-unit-count',
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    CommonModule,
    NzFormModule,
    NzDropDownModule,
    NzModalModule,
    HasPermissionDirective
  ],
  templateUrl: './unit-count.component.html',
  styleUrl: './unit-count.component.css'
})
export class UnitCountComponent implements OnInit, AfterViewInit {
  @ViewChild('unitCountTable', { static: false }) unitCountTableRef!: ElementRef;
  unitCountTable: any;
  listUnitCount: any[] = [];
  constructor(
    private productsaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) { }
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.loadUnitCount();
  }
  loadUnitCount() {
    this.productsaleService.getdataUnitCount().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.listUnitCount = res.data || [];
          if (this.unitCountTable) {
            this.unitCountTable.setData(this.listUnitCount);
          }
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể tải đơn vị tính!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải đơn vị tính!');
        console.error(err);
      }
    });
  }
  drawTable() {
    const el = this.unitCountTableRef?.nativeElement;
    if (!el) {
      console.warn('unitCountTable element chưa sẵn sàng');
      return;
    }
    this.unitCountTable = new Tabulator(el, {
      ...DEFAULT_TABLE_CONFIG,      
      layout: 'fitDataStretch',      // đơn giản, tránh tính toán dồn dọc
      paginationMode: 'local',         // tắt phân trang ở bảng này
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Mã đơn vị tính', field: 'UnitCode', width: 400 },
        { title: 'Tên đơn vị tính', field: 'UnitName' },
      ],
    });
  }
  onAddClick() {
    const modalRef = this.modalService.open(UnitCountDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'custom-modal',
    });
    modalRef.result.then((result) => {
      if (result) {
        this.loadUnitCount();
      }
    });
  }
  onEditClick() {
    const selectedData = this.unitCountTable.getSelectedData();
    if (selectedData.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn đơn vị tính để sửa!');
      return;
    }
    if (selectedData.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ có thể sửa 1 đơn vị tính!');
      return;
    }
    const modalRef = this.modalService.open(UnitCountDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'custom-modal',
    });

    modalRef.componentInstance.unitCount = selectedData[0];

    modalRef.result.then((result) => {
      if (result) {
        this.loadUnitCount();
      }
    });

  }
  onDeleteClick() {
    const selected = this.unitCountTable?.getSelectedData?.() || [];
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn đơn vị tính để xóa!');
      return;
    }

    const names = selected.map((r: any) => r.UnitName || r.UnitCode).join(', ');
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa các đơn vị: <strong>${names}</strong>?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = selected.map((item: any) => ({ ID: item.ID, IsDeleted: true }));
        this.productsaleService.saveDataUnitCount(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Xóa đơn vị tính thành công!');
              this.loadUnitCount();
            } else {
              this.notification.warning('Thông báo', res.message || 'Không thể xóa đơn vị tính!');
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa đơn vị tính!');
            console.error(err);
          }
        });
      }
    });
  }
  searchText: string = '';

  onSearch(): void {
      const keyword = (this.searchText || '').trim().toLowerCase();
      if (!this.unitCountTable) return;
  
      if (!keyword) {
          this.unitCountTable.clearFilter(false);
      } else {
          this.unitCountTable.setFilter([
              [
                  { field: 'UnitCode', type: 'like', value: keyword },
                  { field: 'UnitName', type: 'like', value: keyword },
              ],
          ]);
      }
  }
}

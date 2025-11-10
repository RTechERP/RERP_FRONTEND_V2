import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ProductLocationService } from './product-location-service/product-location.service';
import { ProductLocationFormComponent } from './product-location-form/product-location-form.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-product-location',
  standalone: true,
  templateUrl: './product-location.component.html',
  styleUrls: ['./product-location.component.css'],
  imports: [
    CommonModule,
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
    NgbModalModule,
    NzModalModule, // bổ sung để cung cấp NzModalService
    HasPermissionDirective
  ]
})
export class ProductLocationComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  productLocationData: any[] = [];
  filteredProductLocationData: any[] = [];
  productLocationTable: Tabulator | null = null;
  selectedProductLocation: any = {};
  searchText: string = '';

  constructor(
    private productLocationService: ProductLocationService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.getProductLocations();
  }

  getProductLocations() {
    this.productLocationService.getProductLocations().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.productLocationData = response.data || [];
          this.filteredProductLocationData = [...this.productLocationData];
          this.drawTable();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error loading product locations:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
  }

  private drawTable(): void {
    if (this.productLocationTable) {
      this.productLocationTable.setData(this.filteredProductLocationData);
    } else {
      this.productLocationTable = new Tabulator('#dataProductLocation', {
        data: this.filteredProductLocationData,
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        layout: 'fitDataStretch',
        
        groupBy: 'ProductGroupName',

        columns: [
          { title: 'ID', field: 'ID', headerHozAlign: 'center', width: 90, visible: false },
          // { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 100, headerHozAlign: 'center' },
          { title: 'Mã vị trí', field: 'LocationCode', width: 200, formatter: "textarea" },
          { title: 'Tên vị trí', field: 'LocationName', width: 200, formatter: "textarea" },
          { title: 'Kho', field: 'ProductGroupName', width: 200, formatter: "textarea", visible: false },
          { title: 'Kho', field: 'ProductGroupID', visible: false },

        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.productLocationTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedProductLocation = row.getData();
        },
      } as any);
    }
  }

  onAddProductLocation() {
    const modalRef = this.ngbModal.open(ProductLocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.resetSearchAndReload();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditProductLocation(): void {
    const selected = this.productLocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một vị trí để sửa!');
      return;
    }
    if (selected.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chỉ chọn một vị trí để sửa!');
      return;
    }
    const selectedProductLocation = { ...selected[0] };
    const modalRef = this.ngbModal.open(ProductLocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedProductLocation;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.resetSearchAndReload();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onDeleteProductLocation() {
    const selected = this.productLocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí để xóa!');
      return;
    }

    const locationCode = selected[0].LocationCode;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa vị trí có mã: <strong>${locationCode}</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productLocationService.deleteProductLocation(selected[0].ID).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, "Xóa thành công");
              setTimeout(() => this.resetSearchAndReload(), 100);
            } else {
              this.notification.warning("Thông báo", "Xóa thất bại");
            }
          },
          error: (err) => {
            console.error(err);
            this.notification.warning("Thông báo", "Lỗi kết nối");
          }
        });
      }
    });
  }

  onSearch(): void {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredProductLocationData = [...this.productLocationData];
    } else {
      const searchTerm = this.searchText.toLowerCase().trim();
      this.filteredProductLocationData = this.productLocationData.filter(item =>
        (item.LocationCode && item.LocationCode.toLowerCase().includes(searchTerm)) ||
        (item.LocationName && item.LocationName.toLowerCase().includes(searchTerm)) ||
        (item.ProductGroupName && item.ProductGroupName.toLowerCase().includes(searchTerm))
      );
    }
    this.drawTable();
  }

  onClearSearch(): void {
    this.searchText = '';
    this.filteredProductLocationData = [...this.productLocationData];
    this.drawTable();
  }

  resetSearchAndReload(): void {
    this.searchText = '';
    this.getProductLocations();
  }
}
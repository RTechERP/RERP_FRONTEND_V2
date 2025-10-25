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
import { ProductLocationService } from './product-location-service/product-location.service';
import { ProductLocationFormComponent } from './product-location-form/product-location-form.component';

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
  ]
})
export class ProductLocationComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  productLocationData: any[] = [];
  productLocationTable: Tabulator | null = null;
  selectedProductLocation: any = {};

  constructor(
    private productLocationService: ProductLocationService,
    private notification: NzNotificationService,
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
          this.drawTable();
        } else {
          this.notification.warning('Thông báo', response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error loading product locations:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
  }

  private drawTable(): void {
    if (this.productLocationTable) {
      this.productLocationTable.setData(this.productLocationData);
    } else {
      this.productLocationTable = new Tabulator('#dataProductLocation', {
        data: this.productLocationData,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 1,
        height: '83vh',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        history: true,
        columns: [
          { title: 'ID', field: 'ID', headerHozAlign: 'center', width: 90, visible: false },
          { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 100, headerHozAlign: 'center' },
          { title: 'Mã vị trí', field: 'LocationCode', headerHozAlign: 'center' },
          { title: 'Tên vị trí', field: 'LocationName', headerHozAlign: 'center' },
          { title: 'Tên cũ', field: 'OldLocationName', headerHozAlign: 'center' },
          { title: 'Kho ID', field: 'WarehouseID', headerHozAlign: 'center' },
          { title: 'Tọa độ X', field: 'CoordinatesX', headerHozAlign: 'center' },
          { title: 'Tọa độ Y', field: 'CoordinatesY', headerHozAlign: 'center' },
          {
            title: 'Loại vị trí',
            field: 'LocationType',
            headerHozAlign: 'center',
            formatter: (cell: CellComponent) => {
              const type = cell.getValue();
              switch (type) {
                case 1: return 'Tủ mũ & quần áo';
                case 2: return 'Tủ giày';
                default: return 'Chưa xác định';
              }
            }
          },
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
        this.getProductLocations();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditProductLocation(): void {
    const selected = this.productLocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một vị trí để sửa!');
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
        this.getProductLocations();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onDeleteProductLocation() {
    const selected = this.productLocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vị trí để xóa!');
      return;
    }

    const locationCode = selected[0].LocationCode;
    if (confirm(`Bạn có chắc chắn muốn xóa vị trí có mã: ${locationCode} không?`)) {
      this.productLocationService.deleteProductLocation(selected[0].ID).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success("Thông báo", "Xóa thành công");
            setTimeout(() => this.getProductLocations(), 100);
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
  }
}
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ProductLocationTechnicalService } from './product-location-technical.service';
import { ProductLocationTechnicalDetailComponent } from './product-location-technical-detail/product-location-technical-detail.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-product-location-technical',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule
    ,HasPermissionDirective
  ],
  templateUrl: './product-location-technical.component.html',
  styleUrls: ['./product-location-technical.component.css']
})
export class ProductLocationTechnicalComponent implements OnInit, AfterViewInit {
  @ViewChild('dataProductLocationTech', { static: false }) dataProductLocationTech!: ElementRef;

  productLocationTable: Tabulator | null = null;
  productLocationData: any[] = [];
  filteredProductLocationData: any[] = [];
  selectedProductLocation: any = {};
  searchText: string = '';
  @Input() warehouseID: number = 1; 
  @Input() warehouseType: number = 1;
  constructor(
    private productLocationService: ProductLocationTechnicalService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit() {
    this.setTitle();
    if (this.tabData) {
      this.warehouseID = this.tabData.warehouseID || 1;
      this.warehouseType = this.tabData.warehouseType || 1;
    }
  }

  ngAfterViewInit(): void {
    this.loadData();
  }

  setTitle() {
    document.title = 'Quản lý vị trí sản phẩm Kỹ thuật';
  }

  loadData() {
    this.productLocationService.getProductLocations(this.warehouseID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.productLocationData = response.data || [];
          if(this.warehouseType === 2){
            this.productLocationData = this.productLocationData.filter((item: any) => item.LocationType === 4);
          }
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
      this.productLocationTable = new Tabulator(this.dataProductLocationTech.nativeElement, {
        data: this.filteredProductLocationData,
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        height: '100%',
        layout: 'fitDataStretch',
        groupBy: 'LocationTypeText',
        columns: [
          { title: 'ID', field: 'ID', headerHozAlign: 'center', width: 90, visible: false },
          {
            title: 'STT',
            field: 'STT',
            width: 80,
            hozAlign: 'center',
            headerHozAlign: 'center'
          },
          {
            title: 'Mã vị trí',
            field: 'LocationCode',
            width: 150,
            formatter: 'textarea'
          },
          {
            title: 'Vị trí hiện tại',
            field: 'LocationName',
            width: 200,
            formatter: 'textarea'
          },
          {
            title: 'Vị trí cũ',
            field: 'OldLocationName',
            width: 200,
            formatter: 'textarea'
          },
          {
            title: 'Loại',
            field: 'LocationTypeText',
            width: 150,
            visible: false
          }
        ],
        rowClick: (_e: MouseEvent, row: RowComponent) => {
          this.productLocationTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedProductLocation = row.getData();
        },
        rowDblClick: (_e: MouseEvent, row: RowComponent) => {
          this.selectedProductLocation = row.getData();
          this.onEditProductLocation();
        }
      } as any);
    }
  }

  onAddProductLocation() {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm vị trí sản phẩm',
      nzContent: ProductLocationTechnicalDetailComponent,
      nzWidth: 600,
      nzFooter: null,
      nzMaskClosable: false,
      nzData: {
        warehouseID: this.warehouseID,
        warehouseType: this.warehouseType,
        isEdit: false
      }
    });

    modalRef.afterClose.subscribe(() => {
      // Luôn load lại dữ liệu khi modal đóng
      this.loadData();
    });
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

    // Lấy dữ liệu từ row đã chọn (vì backend chưa có API get-by-id)
    const selectedModel = selected[0];

    const modalRef = this.modal.create({
      nzTitle: 'Sửa vị trí sản phẩm',
      nzContent: ProductLocationTechnicalDetailComponent,
      nzWidth: 600,
      nzFooter: null,
      nzMaskClosable: false,
      nzData: {
        warehouseID: this.warehouseID,
        warehouseType: this.warehouseType,
        isEdit: true,
        model: selectedModel
      }
    });

    modalRef.afterClose.subscribe(() => {
      // Luôn load lại dữ liệu khi modal đóng
      this.loadData();
    });
  }

  onDeleteProductLocation() {
    const selected = this.productLocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí để xóa!');
      return;
    }

    const locationIDs = selected.map((item: any) => item.ID);
    const locationCodes = selected.map((item: any) => item.LocationCode).join(', ');
    const confirmMessage = selected.length === 1
      ? `Bạn có chắc chắn muốn xóa vị trí có mã: <strong>${locationCodes}</strong> không?`
      : `Bạn có chắc chắn muốn xóa <strong>${selected.length}</strong> vị trí đã chọn không?<br/>Mã: <strong>${locationCodes}</strong>`;

    // Hiển thị confirm xóa trực tiếp, không check location in use
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productLocationService.deleteProductLocations(locationIDs).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');

              // Xóa các dòng trên grid
              const rowsToDelete = this.productLocationTable?.getSelectedRows();
              if (rowsToDelete && rowsToDelete.length > 0) {
                rowsToDelete.forEach(row => row.delete());
              }

              setTimeout(() => this.loadData(), 100);
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Xóa thất bại');
            }
          },
          error: (err) => {
            console.error(err);
            const errorMessage = err.error?.message || 'Lỗi kết nối';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
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
        (item.OldLocationName && item.OldLocationName.toLowerCase().includes(searchTerm)) ||
        (item.LocationTypeText && item.LocationTypeText.toLowerCase().includes(searchTerm))
      );
    }
    this.drawTable();
  }

  onClearSearch(): void {
    this.searchText = '';
    this.filteredProductLocationData = [...this.productLocationData];
    this.drawTable();
  }

  onRefresh(): void {
    this.searchText = '';
    this.loadData();
  }
}

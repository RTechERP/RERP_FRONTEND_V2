import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef,
} from '@angular/core';
import { Tabulator } from 'tabulator-tables';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { VehicleManagementService } from '../vehicle-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehicleManagementFormComponent } from '../vehicle-management-form/vehicle-management-form.component';
import { VehicleCategoryFormComponent } from './vehicle-category-form/vehicle-category-form.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { forkJoin } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
@Component({
  selector: 'app-vehicle-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    FormsModule,
    NzFlexModule,
    NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzModalModule,
    NzNotificationModule,
    NgbModalModule,
    HasPermissionDirective,
    // NgbActiveModal,
  ],
  templateUrl: './vehicle-category.component.html',
  styleUrl: './vehicle-category.component.css',
})
export class VehicleCategoryComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleManagementService = inject(VehicleManagementService);
  vehicleCategoryList: any[] = [];
  tb_vehicleCategory: Tabulator | null = null;
  selectedRow: any = null;
  searchText: string = '';
  selectedID: number | null = 0;

  ngOnInit(): void {
    this.getVehicleCategory();
  }

  async getVehicleCategory() {
    this.vehicleManagementService.getVehicleCategory().subscribe({
      next: (response: any) => {
        console.log('tb_vehicleCategory', response.data);
        this.vehicleCategoryList = response.data;
        this.drawTbVehicleCategory();
      },
      error: (res: any) => {
        console.error('Lỗi:', res.error?.message);
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Lỗi khi tải dữ liệu');
      },
    });
  }
  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }

  getSelectedIds(): number[] {
    const selectedRows = this.tb_vehicleCategory?.getSelectedData();
    if (selectedRows && selectedRows.length > 0) {
      return selectedRows.map((row: any) => row.ID);
    }
    // Nếu không có hàng nào được chọn, dùng selectedID
    if (this.selectedID && this.selectedID > 0) {
      return [this.selectedID];
    }
    return [];
  }

  onDeleteVehicle() {
    const selectedIds = this.getSelectedIds();
    
    if (!selectedIds || selectedIds.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn loại xe để xóa!');
      return;
    }

    const selectedCount = selectedIds.length;
    const confirmMessage = selectedCount === 1 
      ? 'Bạn có chắc muốn xóa loại xe đã chọn?'
      : `Bạn có chắc muốn xóa ${selectedCount} loại xe đã chọn?`;

    this.modal.confirm({
      nzTitle: this.createdText(confirmMessage),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Tạo mảng các Observable để xóa
        const deleteObservables = selectedIds.map(id => 
          this.vehicleManagementService.saveDataVehicleCategory({
            ID: id,
            IsDelete: true,
          })
        );

        // Sử dụng forkJoin để xóa tất cả cùng lúc
        forkJoin(deleteObservables).subscribe({
          next: (results: any[]) => {
            const successCount = results.filter(res => res.status === 1).length;
            const failCount = results.length - successCount;

            if (successCount === results.length) {
              this.notification.success(
                'Thông báo',
                successCount === 1 
                  ? 'Xóa loại xe thành công' 
                  : `Xóa thành công ${successCount} loại xe`
              );
              setTimeout(() => this.getVehicleCategory(), 100);
            } else if (successCount > 0) {
              this.notification.warning(
                'Thông báo',
                `Xóa thành công ${successCount} loại xe, thất bại ${failCount} loại xe`
              );
              setTimeout(() => this.getVehicleCategory(), 100);
            } else {
              this.notification.error('Thông báo', 'Xóa thất bại');
            }
          },
          error: (res: any) => {
            console.error(res);
            this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Lỗi kết nối khi xóa');
          },
        });
      },
    });
  }

  //#endregion
  onSearch() {
    if (this.tb_vehicleCategory) {
      if (!this.searchText.trim()) {
        this.tb_vehicleCategory.clearFilter(false); // <-- Thêm false ở đây
      } else {
        this.tb_vehicleCategory.setFilter([
          [
            { field: 'CategoryName', type: 'like', value: this.searchText },
            { field: 'CategoryCode', type: 'like', value: this.searchText },
            { field: 'STT', type: 'like', value: this.searchText },
          ],
        ]);
      }
    }
  }
  //#region Vẽ bảng khảo sát dự án
  drawTbVehicleCategory() {
    this.tb_vehicleCategory = new Tabulator('#tb_vehicleCategory', {
      ...DEFAULT_TABLE_CONFIG,
      height: '50vh',
    
      paginationMode: 'local',
      layout: 'fitColumns',
      locale: 'vi',
      groupBy: 'VehicleCategoryText',
      selectableRows: true,
      data: this.vehicleCategoryList,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã loại xe',
          field: 'CategoryCode',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên loại xe',
          field: 'CategoryName',
          headerHozAlign: 'center',
        },
      ],
    });
    this.tb_vehicleCategory.on('rowDblClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.onEditVehicle();
    });

    this.tb_vehicleCategory.on('rowClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.selectedID = this.selectedRow.ID;
      console.log('selectedID', this.selectedID);
    });
  }
  //#endregion

  //#region Add Product
  onAddVehicle() {
    const modalRef = this.modalService.open(VehicleCategoryFormComponent, {
      size: 'l',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        this.notification.success('Thông báo', 'Tạo sản phẩm thành công');
        setTimeout(() => this.getVehicleCategory(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  //#endregion

  onEditVehicle() {
    if (this.selectedRow == null) {
      const selected = this.tb_vehicleCategory?.getSelectedData();
      if (!selected || selected.length === 0) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn một đơn vị để sửa!'
        );
        return;
      }
      this.selectedRow = { ...selected[0] };
    }

    const modalRef = this.modalService.open(VehicleCategoryFormComponent, {
      size: 'l',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    console.log(this.selectedRow);
    modalRef.componentInstance.dataInput = this.selectedRow;
    modalRef.result.then(
      (result) => {
        this.notification.success(
          'Thông báo',
          'Sửa lĩnh vực dựa án thành công'
        );
        setTimeout(() => this.getVehicleCategory(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}

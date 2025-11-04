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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }

  onDeleteVehicle() {
    if (!this.selectedID || this.selectedID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn loại xe để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa dự án đã chọn?'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const status = {
          ID: this.selectedID,
          IsDelete: true,
        };
        console.log('Payload xóa lĩnh vực dự án', status);
        this.vehicleManagementService
          .saveDataVehicleCategory(status)
          .subscribe({
            next: (res) => {
              if (res.status === 1) {
                this.notification.success(
                  'Thông báo',
                  'Xóa lĩnh vực dự án thành công'
                );
                setTimeout(() => this.getVehicleCategory(), 100);
              } else {
                this.notification.warning('Thông báo', 'Thất bại');
              }
            },
            error: (err) => {
              console.error(err);
              this.notification.warning('Thông báo', 'Lỗi kết nối');
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
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      groupBy: 'VehicleCategoryText',
      selectableRows: 1,
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

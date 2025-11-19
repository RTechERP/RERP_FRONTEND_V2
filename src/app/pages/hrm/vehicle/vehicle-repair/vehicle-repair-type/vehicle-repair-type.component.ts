import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { VehicleRepairService } from '../vehicle-repair-service/vehicle-repair.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { VehicleManagementService } from '../../vehicle-management/vehicle-management.service';
import { filter, forkJoin, last } from 'rxjs';
import { debounce } from 'rxjs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  TabulatorFull as CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { VehicleRepairTypeFormComponent } from './vehicle-repair-type-form/vehicle-repair-type-form.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

@Component({
  standalone: true,
  imports: [
    NzUploadModule,
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
    HasPermissionDirective,
    NzModalModule,
  ],
  selector: 'app-vehicle-repair-type',
  templateUrl: './vehicle-repair-type.component.html',
  styleUrl: './vehicle-repair-type.component.css',
})
export class VehicleRepairTypeComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private VehicleRepairService: VehicleRepairService,
    private nzModal: NzModalService,
    private vehicleManagementService: VehicleManagementService
  ) {}
  dataInput: any = {};
  vehicleRepairTypeTable: Tabulator | null = null;
  private ngbModal = inject(NgbModal);
  Size: number = 100000;
  Page: number = 1;
  modalData: any = [];
  DateStart: Date = new Date(2000, 0, 1); // 2000-01-01
  DateEnd: Date = new Date(2099, 0, 1); // 2099-01-01
  EmployeeID: number = 0;
  TypeID: number = 0;
  FilterText: string = '';
  VehicleID: number = 0;
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  isSearchVisible: boolean = false;
  private debounceTimer: any;
  repairTypes: any[] = [];
  employeeList: any[] = [];
  vehicleList: any[] = [];
  selectedType: any = {};
  ngAfterViewInit(): void {
    this.getRepairType();
  }
  ngOnInit(): void {}
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  getRepairType() {
    this.VehicleRepairService.getVehicleRepairType().subscribe((res) => {
      this.repairTypes = res.data || [];
      console.log('res', res);
      console.log('repairTypes', this.repairTypes);
      this.drawTable();
    });
  }
  drawTable() {
    if (this.vehicleRepairTypeTable) {
      this.vehicleRepairTypeTable.setData(this.repairTypes);
    } else {
      this.vehicleRepairTypeTable = new Tabulator('#vehicleRepairType', {
        data: this.repairTypes,
        ...DEFAULT_TABLE_CONFIG,
        selectable: true,
        paginationMode: 'local',
        layout: 'fitDataStretch',
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            width: 60,
            headerHozAlign: 'center',
            formatter: 'rownum',
            headerSort: false,
          },
          { title: 'ID', field: 'ID', visible: false },
          { title: 'Mã loại', field: 'RepairTypeCode' },
          { title: 'Tên loại', field: 'RepairTypeName' },
          { title: ' Ghi chú', field: 'Note' },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.vehicleRepairTypeTable!.getSelectedRows().forEach((r) =>
            r.deselect()
          );
          row.select();
          this.selectedType = row.getData();
          console.log('Select ', this.selectedType);
        },
      } as any);
    }
  }
  addType() {
    const modalRef = this.ngbModal.open(VehicleRepairTypeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.result.then(
      (result) => {
        this.getRepairType();
      },
      (dismissed) => {
        // console.log('Modal dismissed');
      }
    );
  }
  editType() {
    const rows = this.vehicleRepairTypeTable?.getSelectedRows() ?? [];
    if (rows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một loại để sửa.');
      return;
    }
    const rowData = rows[0].getData(); // <— lấy data, KHÔNG spread mảng

    const modalRef = this.ngbModal.open(VehicleRepairTypeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = { ...rowData }; // <— đúng object
    modalRef.result.then(
      () => this.getRepairType(),
      () => {}
    );
  }
  getSelectedIds(): number[] {
    if (this.vehicleRepairTypeTable) {
      const selectedRows = this.vehicleRepairTypeTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }

  deleteType() {
    if (!this.vehicleRepairTypeTable) return;

    const selectedRows = this.vehicleRepairTypeTable.getSelectedData() ?? [];

    if (!selectedRows.length) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một loại để xóa.'
      );
      return;
    }

    const selectedIds = selectedRows.map((row: any) => row.ID);
    const names = selectedRows.map((row: any) => row.RepairTypeName || 'N/A');

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `
      Bạn có chắc chắn muốn xóa <strong>${
        selectedRows.length
      }</strong> loại sửa chữa này không?<br/>
      <span>${names.join(', ')}</span>
    `,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Tạo list request
        const requests = selectedIds.map((id) => {
          const payload = {
            vehicleRepairType: {
              ID: id,
              IsDeleted: true,
            },
          };
          return this.VehicleRepairService.saveData(payload);
        });

        // Gọi song song
        return forkJoin(requests)
          .toPromise()
          .then(() => {
            this.notification.success(
              'Thành công',
              `Đã xóa ${selectedRows.length} loại sửa chữa.`
            );
            this.getRepairType();
          })
          .catch(() => {
            this.notification.error('Lỗi', 'Xóa loại sửa chữa thất bại.');
          });
      },
    });
  }
}

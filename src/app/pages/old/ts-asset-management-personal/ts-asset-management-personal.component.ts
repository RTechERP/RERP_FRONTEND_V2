import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
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
import { TsAssetManagementPersonalService } from './ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { inject } from '@angular/core';
import { DateTime } from 'luxon';
import { TsAssetAllocationPersonalService } from '../ts-asset-allocation-personal/ts-asset-allocation-personal-service/ts-asset-allocation-personal.service';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalFormComponent } from './ts-asset-management-personal-form/ts-asset-management-personal-form.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
@Component({
  selector: 'app-ts-asset-management-personal',
  standalone: true,
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
    NzModalModule,
    NzNotificationModule,
    NgbModalModule,
    HasPermissionDirective
  ],
  templateUrl: './ts-asset-management-personal.component.html',
  styleUrls: ['./ts-asset-management-personal.component.css'],
})
export class TsAssetManagementPersonalComponent
  implements OnInit, AfterViewInit
{
  assetManagemnetPersonalData: any[] = [];
  private ngbModal = inject(NgbModal);
  tableAssetManagementPersonal: Tabulator | null = null;
  constructor(
    private tsAssetmanagementPersonal: TsAssetManagementPersonalService,
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private tsAssetAllocationPersonalService: TsAssetAllocationPersonalService
  ) {}
  ngOnInit() {
    this.getAssetManagementPersonal();
  }
  ngAfterViewInit(): void {
    this.getAssetManagementPersonal();
    this.drawTableAssetManagementPersonal();
  }
  getAssetManagementPersonal() {
    this.tsAssetmanagementPersonal
      .getAssetsManagementPersonal()
      .subscribe((response: any) => {
        this.assetManagemnetPersonalData = response.data;
        this.tableAssetManagementPersonal?.setData(response.data);
        console.log('Data:', this.assetManagemnetPersonalData);
      });
  }
  drawTableAssetManagementPersonal(): void {
    this.tableAssetManagementPersonal = new Tabulator(
      '#dataTableAssetManagementPersonal',
      {
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        layout: 'fitDataStretch',
        columns: [
          {
            title: 'STT',
            field: 'STT',
            hozAlign: 'right',
            width: 70,
            headerHozAlign: 'center',
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'right',
            width: 70,
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Mã tài sản',
            field: 'Code',
            headerHozAlign: 'center',
            bottomCalc: 'count',
          },
          { title: 'Tên tài sản', field: 'Name', headerHozAlign: 'center' },

          { title: 'Đơn vị tính', field: 'UnitName', headerHozAlign: 'center' },
          {
            title: 'Số lượng trong kho',
            field: 'RemainingQuantity',
            headerHozAlign: 'center',
            hozAlign: 'right',
          },
          {
            title: 'Ngày mua',
            field: 'DateBuy',
            hozAlign: 'left',
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = DateTime.fromISO(value);
              return date.isValid ? date.toFormat('dd/MM/yyyy') : '';
            },
          },
          { title: 'Ghi chú', field: 'Note', hozAlign: 'left', width: 300 },
        ],
      }
    );
  }

  addAssetPersonal() {
    const modalRef = this.ngbModal.open(
      TsAssetManagementPersonalFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    //     modalRef.componentInstance.dataInput =null;
    modalRef.result.then(
      (result) => {
        this.getAssetManagementPersonal();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  editAssetPersonal() {
    const selected = this.tableAssetManagementPersonal?.getSelectedData() || [];
    if (!selected.length) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để sửa!');
      return;
    }
    const rowData = { ...selected[0] };

    const modalRef = this.ngbModal.open(
      TsAssetManagementPersonalFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );

    modalRef.componentInstance.dataInput = rowData;

    modalRef.result.then(
      () => this.getAssetManagementPersonal(),
      () => {}
    );
  }
  deleteAssetPersonal() {
    const selected = this.tableAssetManagementPersonal?.getSelectedData() || [];
    if (selected.length !== 1) {
      this.notification.warning('Thông báo', 'Chọn đúng một dòng để xóa');
      return;
    }
    const { ID, Code } = selected[0];

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn chắc chắn muốn xóa tài sản ${Code ?? ''}?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = {
          tSAssetManagementPersonal: { id: ID, isDeleted: true },
        };
        return this.tsAssetAllocationPersonalService
          .saveAssetAllocationPerson(payload)
          .toPromise()
          .then((res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thành công', 'Đã xóa');
              this.getAssetManagementPersonal();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          })
          .catch(() => this.notification.error(NOTIFICATION_TITLE.error, 'Không gọi được API'));
      },
    });
  }
}

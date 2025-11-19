import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
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
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { log } from 'ng-zorro-antd/core/logger';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { AssetsService } from './ts-asset-source-service/ts-asset-source.service';
import { TsAssetSourceFormComponent } from './ts-asset-source-form/ts-asset-source-form.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
@Component({
  standalone: true,
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
    NzModalModule,
    HasPermissionDirective
    // TsAssetSourceFormComponent,
  ],
  selector: 'app-ts-asset-source',
  templateUrl: './ts-asset-source.component.html',
  styleUrls: ['./ts-asset-source.component.css'],
})
export class TsAssetSourceComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  assetSourceData: any[] = [];
  modalData: any = [];
  constructor(
    private notification: NzNotificationService,
    private assetSourceService: AssetsService,
    private nzModal: NzModalService
  ) { }
  assetSourceTable: Tabulator | null = null;
  selectedSource: any = {};
  ngOnInit() { }
  ngAfterViewInit(): void {
    this.drawTable();
    this.getAssetSource();
  }
  getAssetSource() {
    this.assetSourceService.getAssets().subscribe((response: any) => {
      this.assetSourceData = response.data;
      console.log('source', this.assetSourceData);
      this.drawTable();
    });
  }
  private drawTable(): void {
    if (this.assetSourceTable) {
      this.assetSourceTable.setData(this.assetSourceData);
    } else {
      this.assetSourceTable = new Tabulator('#dataSourceAsset', {
        data: this.assetSourceData,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 1,
        height: '89vh',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        history: true,
        langs: {
          vi: {
            pagination: {
              first: '<<',
              last: '>>',
              prev: '<',
              next: '>',
            },
          },
        },
         locale: 'vi',
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            width: 60,
            headerHozAlign: 'center',
            formatter: 'rownum',
            headerSort: false
          }
          ,
          { title: 'ID', field: 'ID', visible: false },
          { title: 'Mã nguồn gốc', field: 'SourceCode' },
          { title: 'Tên nguồn gốc', field: 'SourceName' },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.assetSourceTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedSource = row.getData();
          console.log("Select ", this.selectedSource);
        },
      } as any);
    }
  }
  onAdd() {
    const modalRef = this.ngbModal.open(TsAssetSourceFormComponent
      , {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        centered: true
      });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetSource();
      },
      (dismissed) => {

      }
    );
  }
  onEdit(): void {
    const selected = this.assetSourceTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một loại tài sản để sửa!');
      return;
    }
    const selecteStatus = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetSourceFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selecteStatus;
    modalRef.result.then(
      (result) => {
        this.getAssetSource();

      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onDeleted() {
    const selected = this.assetSourceTable?.getSelectedData();
    if (!selected?.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại tài sản để xóa!');
      return;
    }

    const item = selected[0];
    const name = item.SourceName || item.SourceCode || `ID ${item.ID}`;
    const payload = { ID: item.ID, IsDeleted: true };

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <strong>${name}</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.assetSourceService.SaveData(payload).subscribe({
          next: (res) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Thành công');
              this.getAssetSource();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Thất bại');
            }
          },
          error: (err) => {
            console.error(err);
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi kết nối');
          }
        });
      }
    });
  }

}

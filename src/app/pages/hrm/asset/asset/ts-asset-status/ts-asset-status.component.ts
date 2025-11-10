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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { log } from 'ng-zorro-antd/core/logger';
import { TsAssetStatusFormComponent } from './ts-asset-status-form/ts-asset-status-form.component';
import { AssetStatusService } from './ts-asset-status-service/ts-asset-status.service';
import { HasPermissionDirective } from "../../../../../directives/has-permission.directive";
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
    HasPermissionDirective
],
  selector: 'app-ts-asset-status',
  templateUrl: './ts-asset-status.component.html',
  styleUrls: ['./ts-asset-status.component.css']
})
export class TsAssetStatusComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  assetStatusData: any[] = [];
  assetStatusTable: Tabulator | null = null;
  selectedStatus: any = {};
  constructor(private notification: NzNotificationService,
    private tsAssetService: AssetStatusService
  ) { }

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getAssetStatus();
  }
  getAssetStatus() {
    this.tsAssetService.getStatus().subscribe((resppon: any) => {
      this.assetStatusData = resppon.data;
      this.drawTable();
    });
  }
  private drawTable(): void {
    if (this.assetStatusTable) {
      this.assetStatusTable.setData(this.assetStatusData);
    } else {
      this.assetStatusTable = new Tabulator('#dataStatusAsset', {
        data: this.assetStatusData,
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
           {
            title: 'STT',
            hozAlign: 'center',
            width: 60,
            headerHozAlign: 'center',
            formatter: 'rownum',
            headerSort: false
          }
          ,
          { title: 'ID', field: 'ID', visible:false},
          { title: 'Trạng thái', field: 'Status' },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.assetStatusTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedStatus = row.getData();
          console.log("Select ", this.selectedStatus);
        },
      } as any);
    }
  }
  onAddStatusAsset() {
    const modalRef = this.ngbModal.open(TsAssetStatusFormComponent
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
        this.getAssetStatus();
      },
      (dismissed) => {
      
      }
    );
  }
  onEditTypeAsset(): void {
    const selected = this.assetStatusTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một loại tài sản để sửa!');
      return;
    }
    const selecteStatus = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetStatusFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selecteStatus;
    modalRef.result.then(
      (result) => {
        this.drawTable();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onDeleteTypeAsset() {
    const selected = this.assetStatusTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại tài sản để xóa!');
      return;
    }
    const payloadStatusAsset = {
      ID: selected[0].ID,
      IsDeleted: true
    }
    console.log(payloadStatusAsset);
    this.tsAssetService.saveData(payloadStatusAsset).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
          setTimeout(() => this.getAssetStatus(), 100);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, "Thất bại");
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning(NOTIFICATION_TITLE.warning, "Lỗi kết nối");
      }
    });
  }
}

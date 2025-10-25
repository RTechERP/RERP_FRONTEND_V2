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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TypeAssetsService } from './ts-asset-type-service/ts-asset-type.service';
import { TyAssetTypeFormComponent } from './ts-asset-type-form/ts-asset-type-form.component';

@Component({
  standalone: true,

  selector: 'app-ts-asset-type',
  templateUrl: './ts-asset-type.component.html',
  styleUrls: ['./ts-asset-type.component.css'],
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
    NgbModalModule,]
})
export class TsAssetTypeComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  typeAssetData: any[] = [];
  typeAssetTable: Tabulator | null = null;
  selecteType: any = {};
  constructor(
    private typeAssetService: TypeAssetsService,
    private notification: NzNotificationService
  ) {}

  ngOnInit() {}
  ngAfterViewInit(): void {
    this.getTypeAsset();
  }
  getTypeAsset() {
    this.typeAssetService.getTypeAssets().subscribe((resppon: any) => {
      this.typeAssetData = resppon.data;
      console.log('Type', this.typeAssetData);
      this.drawTable();
    });
  }
  private drawTable(): void {
    if (this.typeAssetTable) {
      this.typeAssetTable.setData(this.typeAssetData);
    } else {
      this.typeAssetTable = new Tabulator('#dataTypeAsset', {
        data: this.typeAssetData,
        layout: 'fitDataStretch',
        pagination: true,
        selectableRows: 1,
        height: '83vh',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: 'bottom',
        history: true,
        columns: [
          {
            title: 'ID',
            field: 'ID',
            headerHozAlign: 'center',
            width: 90,
            visible: false,
          },
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 100,
            headerHozAlign: 'center',
          },
          {
            title: 'Mã loại tài sản',
            field: 'AssetCode',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên loại tài sản',
            field: 'AssetType',
            headerHozAlign: 'center',
          },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.typeAssetTable!.getSelectedRows().forEach((r) => r.deselect());
          row.select();
          this.selecteType = row.getData();
          console.log('Select ', this.selecteType);
        },
      } as any);
    }
  }
  onAddTypeAsset() {
    const modalRef = this.ngbModal.open(TyAssetTypeFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getTypeAsset();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditTypeAsset(): void {
    const selected = this.typeAssetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một loại tài sản để sửa!'
      );
      return;
    }
    const selecteType = { ...selected[0] };
    const modalRef = this.ngbModal.open(TyAssetTypeFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selecteType;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.drawTable();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onDeleteTypeAsset() {
    const selected = this.typeAssetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn loại tài sản để xóa!'
      );
      return;
    }
    const payloadTypeAsset = {
      ID: selected[0].ID,
      IsDeleted: true,
    };
    console.log(payloadTypeAsset);
    this.typeAssetService.SaveData(payloadTypeAsset).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thành công');
          setTimeout(() => this.getTypeAsset(), 100);
        } else {
          this.notification.warning('Thông báo', 'Thất bại');
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning('Thông báo', 'Lỗi kết nối');
      },
    });
  }
}

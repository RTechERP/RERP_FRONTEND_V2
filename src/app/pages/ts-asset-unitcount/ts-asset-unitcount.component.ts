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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
declare var bootstrap: any;
import { TsAssetUnitFormComponent } from './ts-asset-unit-form/ts-asset-unit-form.component';
import { UnitService } from './ts-asset-unit-service/ts-asset-unit.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
@Component({
  standalone: true,
  selector: 'app-ts-asset-unitcount',
  templateUrl: './ts-asset-unitcount.component.html',
  styleUrls: ['./ts-asset-unitcount.component.css'],
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
    NgbModalModule
  ]
})
export class TsAssetUnitcountComponent implements OnInit,AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  unitData: any[] = [];
  unitTbData: any[] = [];
  selectedUnit: any = {};
  unitTable: Tabulator | null = null;
  constructor(private unitService: UnitService,
    private notification: NzNotificationService,
  ) { }
  ngOnInit() { }
  ngAfterViewInit(): void {
    this.getunit();
  }
  private getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      this.drawTableUnit();
    });
  }
  private drawTableUnit() {
    if (this.unitTable) {
      this.unitTable.setData(this.unitData);
    } else {
      this.unitTable = new Tabulator('#datatableunit', {
        data: this.unitData,
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
            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            hozAlign: 'center',
            headerSort: false,
            width: 50,
            headerHozAlign: 'center',
            cssClass: 'custom-checkbox-cell'
          },
          { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 100, headerHozAlign: 'center' },

          { title: 'Tên đơn vị', field: 'UnitName', headerHozAlign: 'center' },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.unitTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedUnit = row.getData();
        },
      } as any);
    }
  }
  onAddUnit(): void {
    const modalRef = this.ngbModal.open(TsAssetUnitFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getunit();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditUnit(): void {
    const selected = this.unitTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedUnit = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetUnitFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedUnit;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getunit();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onDeleteUnit() {
    const selected = this.unitTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để xóa!');
      return;
    }
    const payloadUnit = {
      ID: selected[0].ID,
      IsDeleted: true
    }
    console.log(payloadUnit);
    this.unitService.SaveData([payloadUnit]).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success("Thông báo", "Thành công");
         setTimeout(() => this.getunit(), 100);
        } else {
          this.notification.warning("Thông báo", "Thất bại");
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning("Thông báo", "Lỗi kết nối");
      }
    });
  }
}

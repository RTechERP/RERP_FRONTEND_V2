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
import { FirmService } from './firm-service/firm.service';
import { FirmFormComponent } from './firm-form/firm-form.component';

@Component({
  selector: 'app-firm',
  standalone: true,
  templateUrl: './firm.component.html',
  styleUrls: ['./firm.component.css'],
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
export class FirmComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  firmData: any[] = [];
  firmTable: Tabulator | null = null;
  selectedFirm: any = {};

  constructor(
    private firmService: FirmService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.getFirms();
  }

  getFirms() {
    this.firmService.getFirms().subscribe((response: any) => {
      this.firmData = response.data || response;
      this.drawTable();
    });
  }

  private drawTable(): void {
    if (this.firmTable) {
      this.firmTable.setData(this.firmData);
    } else {
      this.firmTable = new Tabulator('#dataFirm', {
        data: this.firmData,
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
          { title: 'Mã', field: 'FirmCode', headerHozAlign: 'center' },
          { title: 'Tên', field: 'FirmName', headerHozAlign: 'center' },
          {
            title: 'Loại',
            field: 'FirmType',
            headerHozAlign: 'center',
            formatter: (cell: CellComponent) => {
              const type = cell.getValue();
              switch (type) {
                case 1: return 'Nhà cung cấp';
                case 2: return 'Khách hàng';
                case 3: return 'Đối tác';
                default: return 'Chưa xác định';
              }
            }
          },
        ],
        rowClick: (e: MouseEvent, row: RowComponent) => {
          this.firmTable!.getSelectedRows().forEach(r => r.deselect());
          row.select();
          this.selectedFirm = row.getData();
        },
      } as any);
    }
  }

  onAddFirm() {
    const modalRef = this.ngbModal.open(FirmFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getFirms();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditFirm(): void {
    const selected = this.firmTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một công ty để sửa!');
      return;
    }
    const selectedFirm = { ...selected[0] };
    const modalRef = this.ngbModal.open(FirmFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedFirm;
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

  onDeleteFirm() {
    const selected = this.firmTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn công ty để xóa!');
      return;
    }

    const firmCode = selected[0].FirmCode;
    if (confirm(`Bạn có chắc chắn muốn xóa công ty có mã: ${firmCode} không?`)) {
      const payload = {
        ID: selected[0].ID,
        IsDelete: true
      };

      this.firmService.saveFirm(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success("Thông báo", "Xóa thành công");
            setTimeout(() => this.getFirms(), 100);
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

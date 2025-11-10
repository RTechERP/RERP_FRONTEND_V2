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
import { NzModalService, NzModalModule  } from 'ng-zorro-antd/modal';
import { FirmService } from './firm-service/firm.service';
import { FirmFormComponent } from './firm-form/firm-form.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';

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
    HasPermissionDirective,
    NzModalModule,
  ]
})
export class FirmComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  firmData: any[] = [];
  firmTable: Tabulator | null = null;
  selectedFirm: any = {};
  searchText: string = '';
  originalData: any[] = [];

  constructor(
    private firmService: FirmService,
    private notification: NzNotificationService,
    private modal: NzModalService,
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.getFirms();
  }

  getFirms() {
    this.firmService.getFirms().subscribe((response: any) => {
      this.firmData = response.data || response;
      this.originalData = [...this.firmData]; // Lưu trữ dữ liệu gốc
      this.drawTable();
    });
  }

  onSearch() {
    if (!this.searchText.trim()) {
      // Nếu ô tìm kiếm trống, hiển thị lại tất cả dữ liệu
      this.firmData = [...this.originalData];
    } else {
      // Lọc dữ liệu theo mã hoặc tên
      const searchTerm = this.searchText.toLowerCase().trim();
      this.firmData = this.originalData.filter(firm =>
        (firm.FirmCode && firm.FirmCode.toLowerCase().includes(searchTerm)) ||
        (firm.FirmName && firm.FirmName.toLowerCase().includes(searchTerm))
      );
    }

    // Cập nhật dữ liệu cho bảng
    if (this.firmTable) {
      this.firmTable.setData(this.firmData);
    }
  }

  private drawTable(): void {
    if (this.firmTable) {
      this.firmTable.setData(this.firmData);
    } else {
      this.firmTable = new Tabulator('#dataFirm', {
        data: this.firmData,
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local', // Override để sử dụng local pagination thay vì remote
        layout: "fitDataStretch",
        groupBy: "FirmType", // Nhóm theo FirmType
        groupHeader: function(value: number, count: number, data: any[], group: any) {
          let displayValue = '';
          if (value === 1) {
            displayValue = 'Sale';
          } else if (value === 2) {
            displayValue = 'Demo';
          } else {
            displayValue = 'Chưa phân loại';
          }
          return displayValue + ' <span class="group-count">(' + count + ' nhà cung cấp)</span>';
        },
        columns: [
          { title: 'ID', field: 'ID', headerHozAlign: 'center', width: 90, visible: false },
          { title: 'Mã hãng', field: 'FirmCode', width: 300, headerHozAlign: 'center', formatter: 'textarea' },
          { title: 'Tên hãng', field: 'FirmName', headerHozAlign: 'center', formatter: 'textarea' },
          {
            title: 'Loại',
            field: 'FirmType',
            headerHozAlign: 'center',
            formatter: function(cell: CellComponent) {
              const value = cell.getValue();
              if (value === 1) {
                return 'Sale';
              } else if (value === 2) {
                return 'Demo';
              } else {
                return '';
              }
            }
            ,visible: false
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
        this.searchText = ''; // Xóa nội dung tìm kiếm sau khi thêm mới
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditFirm(): void {
    const selected = this.firmTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một hãng để sửa!');
      return;
    }

    // Chỉ cho phép sửa 1 dòng
    if (selected.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chỉ chọn một hãng để sửa!');
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
        this.getFirms(); // Gọi getFirms() thay vì drawTable() để load lại dữ liệu từ server
        this.searchText = ''; // Xóa nội dung tìm kiếm sau khi sửa
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onDeleteFirm() {
    const selected = this.firmTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hãng để xóa!');
      return;
    }

    // Lấy danh sách mã hãng và ID để hiển thị xác nhận
    const firmCodes = selected.map((x: any) => x.FirmCode).join(', ');
    const ids = selected.map((x: any) => x['ID']);
    const numberIds = ids.map((id: number) => Number(id));


    // Sử dụng NZ Modal thay vì confirm
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa các hãng có mã: <strong>${firmCodes}</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {

    this.firmService.deleteFirm(numberIds).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công!');
        this.getFirms();
      },
      error: (err) => {
        console.error(err);
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Có lỗi xảy ra khi xóa!');
      }
    });
      }
    });
  }
}

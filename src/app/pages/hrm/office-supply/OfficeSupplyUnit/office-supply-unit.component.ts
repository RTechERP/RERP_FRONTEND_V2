import {
  Component,
  OnInit,
  AfterViewInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { RowComponent } from 'tabulator-tables';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { OfficeSupplyUnitService } from './office-supply-unit-service/office-supply-unit-service.service';
import { OfficeSupplyUnitDetailComponent } from './office-supply-unit-detail/office-supply-unit-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
interface newOfficeSupplyUnit {
  ID?: number;
  Name: string;
}
@Component({
  selector: 'app-office-supply-unit-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzModalModule,
    NzSplitterModule,
    NzIconModule,
    NzTypographyModule,
    NzButtonModule,
    NzFormModule,
    OfficeSupplyUnitDetailComponent,
    HasPermissionDirective,
  ],
  templateUrl: './office-supply-unit.component.html',
  styleUrl: './office-supply-unit.component.css',
  //encapsulation: ViewEncapsulation.None,
})
export class OfficeSupplyUnitComponent implements OnInit, AfterViewInit {
  newOfficeSupplyUniy: newOfficeSupplyUnit = {
    Name: '',
  };
  lstOUS: any[] = [];
  table: any; // instance của Tabulator
  dataTable: any[] = [];
  searchText: string = '';
  selectedItem: any = {};
  isCheckmode: boolean = false;
  selectedList: any[] = [];
  lastAddedId: number | null = null; // Thêm biến để theo dõi ID của đơn vị mới thêm
  sizeSearch: string = '0';
  sizeTable: string = '0';
  private fb: NonNullableFormBuilder;
  validateForm: any;

  constructor(
    private officesupplyunitSV: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService
  ) {
    this.fb = inject(NonNullableFormBuilder);
    this.initForm();
  }

  private initForm() {
    this.validateForm = this.fb.group({
      unitName: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTable();
    this.get();
  }
  drawTable() {
    if (this.table) {
      this.table.replaceData(this.dataTable);
    } else {
      this.table = new Tabulator('#datatableunit', {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',

        paginationMode: 'local',

        columns: [
          {
            title: 'STT',
            formatter: 'rownum',

            //   width: 60,
          },
          {
            title: 'Tên đơn vị',
            field: 'Name',
            hozAlign: 'left',
          },
        ],
      });
      this.table.on('rowClick', (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();

        this.getdatabyid(rowData['ID']);
      });
    }
  }
  getdatabyid(id: number) {
    console.log('id', id);
    this.officesupplyunitSV.getdatafill(id).subscribe({
      next: (response) => {
        console.log('Dữ liệu click sửa được:', response);
        let data = null;
        if (response?.data) {
          data = Array.isArray(response.data)
            ? response.data[0]
            : response.data;
        } else {
          data = response;
        }

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          this.selectedItem = {
            ID: data.ID || '',
            Name: data.Name || '',
          };
          // Set giá trị vào form
          this.validateForm.patchValue({
            unitName: data.Name,
          });
        } else {
          console.warn('Không có dữ liệu để fill');
          console.log('Giá trị data:', data);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
      },
    });
  }

  onNameChange(value: string) {
    // Nếu người dùng xóa hết và gõ cái gì đó khác ban đầu
    if (!value || value.trim() === '') {
      this.selectedItem = { ID: 0, Name: '' };
    }
  }
  deleteUnit() {
    const rows = this.table?.getSelectedData?.() || [];
    this.selectedList = rows;
    if (this.selectedList.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 đơn vị để xóa'
      );
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 đơn vị để xóa');
      return;
    }

    const names = this.selectedList.map((x) => x.Name).join(', ');
    this.modal.create({
      nzTitle: 'Xác nhận',
      nzContent: `Xóa các đơn vị: ${names} ?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        // tạo danh sách request SaveData cho từng ID
        const requests = this.selectedList.map((x) => {
          const payload = { ID: x.ID, Name: x.Name ?? '', IsDeleted: true };
          return this.officesupplyunitSV.savedata(payload).pipe(
            catchError(() => of({ status: 0 })) // không văng lỗi chuỗi
          );
        });

        forkJoin(requests).subscribe((results: any[]) => {
          const ok = results.filter((r) => r?.status === 1).length;
          const fail = results.length - ok;

          if (ok > 0)
            this.notification.success(
              'Thông báo',
              `Xóa thành công ${ok} đơn vị`
            );
          if (fail > 0)
            this.notification.error('Thông báo', `Xóa lỗi ${fail} đơn vị`);
          if (ok > 0) this.notification.success(NOTIFICATION_TITLE.success, `Xóa thành công ${ok} đơn vị`);
          if (fail > 0) this.notification.error(NOTIFICATION_TITLE.error, `Xóa lỗi ${fail} đơn vị`);

          this.get();
          this.selectedList = [];
          this.table.deselectRow(); // bỏ chọn
        });
      },
      nzCancelText: 'Hủy',
      nzClosable: true,
      nzMaskClosable: true,
    });
  }
  openUnitModal() {
    const modalRef = this.modalService.open(OfficeSupplyUnitDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.selectedItem = this.selectedItem;
    modalRef.componentInstance.reloadData.subscribe(() => {
      this.get(); // reload bảng
    });
    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.get();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }
  openUnitModalForNewUnit() {
    this.isCheckmode = false;
    this.selectedItem = {};
    this.validateForm.reset();
    this.openUnitModal();
  }
  openUnitModalForUpdateUnit() {
    this.isCheckmode = true;

    const rows = this.table?.getSelectedData?.() || [];
    if (rows.length !== 1) {
      this.notification.warning(
        'Thông báo',
        rows.length === 0 ? 'Chọn 1 dòng để sửa' : 'Chỉ chọn 1 dòng để sửa'
      );
      this.notification.warning(NOTIFICATION_TITLE.warning, rows.length === 0 ? 'Chọn 1 dòng để sửa' : 'Chỉ chọn 1 dòng để sửa');
      return;
    }

    const r = rows[0]; // dữ liệu đã có sẵn trong bảng
    this.selectedItem = {
      ID: r.ID ?? 0,
      Name: r.Name ?? '',
    };
    this.validateForm?.patchValue?.({ unitName: this.selectedItem.Name });
    this.openUnitModal();
  }

  closeUnitModal() {
    this.modalService.dismissAll();
  }
  get(): void {
    this.officesupplyunitSV.getdata().subscribe({
      next: (response) => {
        console.log('Dữ liệu nhận được:', response);
        this.lstOUS = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        this.dataTable = this.lstOUS;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        } else {
          this.drawTable();
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi API:', err);
        this.lstOUS = [];
        this.dataTable = [];
        this.drawTable();
      },
    });
  }
  onSearch() {
    const keyword = (this.searchText || '').trim().toLowerCase();
    if (!keyword) {
      this.table?.clearFilter(); // bỏ filter nếu trống
      return;
    }

    this.table?.setFilter([{ field: 'Name', type: 'like', value: keyword }]);
  }
}

import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { SelectControlComponent } from '../../../../old/select-control/select-control.component';

import { CustomerMajorService } from '../customer-major-service/customer-major.service';
import { CustomerMajorDetailComponent } from '../customer-major-detail/customer-major-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
@Component({
  selector: 'app-customer-major',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
    NzTreeSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './customer-major.component.html',
  styleUrl: './customer-major.component.css',
})
export class CustomerMajorComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;

  private tb_MainTable!: Tabulator;

  selectedRow: any = null;
  selectedId: number = 0;
  isEditMode: boolean = false;
  data: any[] = [];
  keyword = '';


  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private customerMajorService: CustomerMajorService,
    
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initMainTable();
  }

  closeModal() {
    this.activeModal.close();
  }

  onEdit(): void {
    const selectedRows = this.tb_MainTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một ngành nghề để sửa!');
      return;
    }
      this.selectedId = selectedRows[0].ID;
      this.isEditMode = true;
      this.openCustomerMajorDetail();
  }
  getdataFind(){
    const key = this.keyword?.trim().toLowerCase() || '';
    this.customerMajorService.search(key).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.data = response.data;
          if (this.tb_MainTable) {
            this.tb_MainTable.setData(this.data);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });

  }

  onDelete() {
    const selectedRows = this.tb_MainTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một ngành nghề để xóa!');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const model = {
          ID: this.selectedId,
          IsDeleted: true,
        };
        this.customerMajorService.save(model).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công');
              if (this.tb_MainTable) {
                this.keyword='';
                this.loadData();
              }
            } else {
              this.notification.error(
                'Lỗi',
                res?.message || 'Không thể xóa dữ liệu'
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Lỗi',
              err?.message || 'Không thể xóa dữ liệu'
            );
          },
        });
      },
    });
  }

  openCustomerMajorDetail(): void {
    const modalRef = this.modalService.open(CustomerMajorDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'm',
    });
    modalRef.componentInstance.isEditMode = this.isEditMode;
    modalRef.componentInstance.EditID = this.selectedId;
    modalRef.result.then(
      (result) => {
        if (result==true) {
          this.selectedRow = [];
          this.selectedId = 0;
          this.isEditMode = false;
          this.keyword='';
          if (this.tb_MainTable) {
            this.loadData();
          }
        } else {
          this.isEditMode = false;
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  loadData() {
    this.customerMajorService.getData().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.data = response.data;
          if (this.tb_MainTable) {
            this.tb_MainTable.setData(this.data);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });
  }

  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.data,
      //layout: 'fitColumns',
      paginationMode: 'local',
      // columnDefaults: {
      //   headerWordWrap: true,
      //   headerVertical: false,
      //   headerHozAlign: 'center',
      //   minWidth: 60,
      //   resizable: true,
      // },
      height: '70vh',
      selectableRows:1,
      layout: "fitColumns",
      responsiveLayout: true,
      rowHeader:false,

      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'STT', field: 'STT', width:"10%"},
        { title: 'Mã ngành nghề', field: 'Code'},
        { title: 'Tên ngành nghề', field: 'Name'},
      ],
    });
    this.tb_MainTable.on('rowClick', (e: any, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedRow = rowData;
      this.selectedId = rowData['ID'];
    });
  }
}

import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
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
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
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

import { CustomerPartService } from './customer-part/customer-part.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-customer-part',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './customer-part.component.html',
  styleUrl: './customer-part.component.css',
})
export class CustomerPartComponent implements OnInit, AfterViewInit {
  @Input() customerId: number = 0;
  @ViewChild('CustomerPartTable', { static: false })
  CustomerPartTableElement!: ElementRef;

  private customerPartTable!: Tabulator;

  customers: any[] = [];
  customerParts: any[] = [];
  originalCustomerParts: any[] = [];
  selectedCustomer: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private customePartService: CustomerPartService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngAfterViewInit(): void {}

  loadCustomers(): void {
    this.customePartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
          if (this.customerId > 0) {
            this.selectedCustomer = this.customers.find(
              (c) => c.ID === this.customerId
            );
            if (this.selectedCustomer) {
              this.loadCustomerParts(this.customerId);
            }
          }
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
      }
    );
  }

  loadCustomerParts(customerId: number): void {
    this.customePartService.getPart(customerId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.customerParts = response.data[0];
          this.originalCustomerParts = JSON.parse(
            JSON.stringify(this.customerParts)
          );
          this.initCustomerPartsTable();
        } else {
          this.notification.error('Lỗi khi lấy CustomerPart', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải CustomerPart', error);
      }
    );
  }

  onCustomerChange(event: any): void {
    if (event) {
      this.loadCustomerParts(event.ID);
    }
  }

  initCustomerPartsTable(): void {
    if (
      !this.CustomerPartTableElement ||
      !this.CustomerPartTableElement.nativeElement
    )
      return;

    if (this.customerPartTable) {
      this.customerPartTable.destroy();
    }

    this.customerPartTable = new Tabulator(
      this.CustomerPartTableElement.nativeElement,
      {
        data: this.customerParts,
        layout: 'fitDataFill',
        pagination: true,
        paginationSize: 20,
        height: '35vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: [
          {
            title: '',
            field: 'actions',
            formatter: (cell, formatterParams) => {
              return `<i class="bi bi-trash3 text-danger" style="font-size:15px; cursor:pointer"></i>`;
            },
            width: '10%',
            cellClick: (e, cell) => {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa bộ phận này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  cell.getRow().delete();
                },
              });
            },
          },
          {
            title: 'Mã bộ phận',
            field: 'PartCode',
            sorter: 'string',
            width: '45%',
            editor: 'input',
          },
          {
            title: 'Tên bộ phận',
            field: 'PartName',
            sorter: 'string',
            width: '45%',
            editor: 'input',
          },
        ],
      }
    );
  }

  addNewRow(): void {
    if (!this.selectedCustomer) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khách hàng trước!');
      return;
    }

    const newRow = {
      PartCode: '',
      PartName: '',
      CustomerID: this.selectedCustomer.ID,
    };

    this.customerPartTable.addRow(newRow, true);
  }
  saveCustomerParts() {
    if (!this.selectedCustomer) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khách hàng trước!');
      return;
    }
    //Lấy dữ liệu ban đầu
    const originalData = this.originalCustomerParts;

    //Lấy dữ liệu hiện tại của bảng
    const currentData = this.customerPartTable.getData();

    //Phân loại dữ liệu
    const addedParts = currentData
      .filter((row) => !row.ID)
      .map((row) => ({
        PartCode: row.PartCode || '',
        PartName: row.PartName || '',
        CustomerID: this.selectedCustomer.ID,
      }));

    const updatedParts = currentData
      .filter((row) => {
        if (!row.ID) return false;
        const originalRow = originalData.find((o) => o.ID === row.ID);
        if (!originalRow) return false;

        return (
          originalRow.PartCode !== row.PartCode ||
          originalRow.PartName !== row.PartName
        );
      })
      .map((row) => {
        // Chỉ gửi các field cần thiết để tránh lỗi validation
        const cleanedRow: any = {
          ID: row.ID,
          PartCode: row.PartCode || '',
          PartName: row.PartName || '',
          CustomerID: this.selectedCustomer.ID,
        };

        // Chỉ thêm STT nếu có giá trị hợp lệ
        if (row.STT !== null && row.STT !== undefined && !isNaN(row.STT)) {
          cleanedRow.STT = parseInt(row.STT.toString());
        }

        return cleanedRow;
      });

    const deletedPartIds = originalData
      .filter(
        (original) => !currentData.some((current) => current.ID === original.ID)
      )
      .map((part) => part.ID);

    //Gộp
    const saveData = {
      model: 'CustomerPart',
      customerId: this.selectedCustomer.ID,
      addedParts,
      updatedParts,
      deletedPartIds,
    };

    // Debug logs
    console.log('Original Data:', originalData);
    console.log('Current Data:', currentData);
    console.log('Updated Parts:', updatedParts);
    console.log('Save Data:', saveData);

    this.customePartService.saveCustomerPart(saveData).subscribe(
      (response) => {
        if (response.status === 1) {
          this.notification.success('Thông báo', 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi lưu: ' + response.message
          );
        }
      },
      (error) => {
        console.error('Lỗi khi lưu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    );
  }
  closeModal() {
    this.activeModal.close();
  }
}

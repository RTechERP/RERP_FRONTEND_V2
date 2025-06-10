import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input } from '@angular/core';
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
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
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

import { HandoverMinutesComponent } from '../handover-minutes/handover-minutes.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';

@Component({
  selector: 'app-view-pokh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule
  ],
  templateUrl: './view-pokh.component.html',
  styleUrl: './view-pokh.component.css'
})
export class ViewPokhComponent implements OnInit, AfterViewInit {
  @ViewChild('ViewPOKH', { static: false }) viewPOKHTableElement!: ElementRef;
  sizeSearch: string = '0';

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  private viewPOKH!: Tabulator;

  public groups: any[] = [];
  public customers: any[] = [];
  public users: any[] = [];
  public statuses: any[] = [];
  public colors: any[] = [];
  public EmployeeTeamSale: any[] = [];
  data: any[] = [];
  selectedRows: any[] = [];
  filters: any = {
    groupId: 0,
    customerId: 0,
    poType: 0,
    userId: 0,
    status: 0,
    color: null,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
    keyword: ""
  };

  constructor(
    public activeModal: NgbActiveModal,
    private viewPokhService: ViewPokhService,
    private modalService: NgbModal
  ) { }



  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadCustomer();
    this.loadEmployeeTeamSale();
    this.loadGroupSale();
    this.loadMainIndex();
    this.loadUser();
  }

  ngAfterViewInit(): void {
    this.initViewPOKHTable();
    this.loadData();

    setTimeout(() => {
      const table = this.viewPOKHTableElement.nativeElement;
      table.addEventListener('click', (e: any) => {
        const target = e.target as HTMLInputElement;
        if (target.classList.contains('group-checkbox')) {
          const groupValue = target.getAttribute('data-group');
          const rows = this.viewPOKH.getRows().filter(row => row.getData()["PONumber"] === groupValue);

          if (target.checked) {
            rows.forEach(row => {
              row.select();
              const rowData = row.getData();
              if (!this.selectedRows.some(r => r["ID"] === rowData["ID"])) {
                this.selectedRows.push(rowData);
              }
            });
          } else {
            rows.forEach(row => {
              row.deselect();
              const rowData = row.getData();
              this.selectedRows = this.selectedRows.filter(r => r["ID"] !== rowData["ID"]);
            });
          }
          console.log('Selected Rows:', this.selectedRows);
        }
      });
    });
  }
  //#region Hàm xử lý modal
  openHandoverMinutesModal() {
    if (this.selectedRows.length > 0) {
      const modalRef = this.modalService.open(HandoverMinutesComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false
      });
    } else {
      alert('Vui lòng chọn ít nhất 1 dòng để xem biên bản giao hàng');
      console.log("Số dòng đã chọn", this.selectedRows.length);
      return;
    }
  }
  closeModal(): void {
    this.activeModal.close();
  }
  //#endregion
  //#region Hàm tải dữ liệu
  loadData(): void {
    const startDate = new Date(this.filters.startDate);
    const endDate = new Date(this.filters.endDate);

    const params = {
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      userId: this.filters.userId || 0,
      poType: this.filters.poType || 0,
      status: this.filters.status || 0,
      customerId: this.filters.customerId || 0,
      keyword: this.filters.keyword || ""
    };

    this.viewPokhService.loadViewPOKH(
      startDate,
      endDate,
      params.employeeTeamSaleId,
      params.userId,
      params.poType,
      params.status,
      params.customerId,
      params.keyword
    )
      .subscribe((response) => {
        this.data = response.data;
        console.log(this.data);
        if (this.viewPOKH) {
          this.viewPOKH.setData(this.data);
        }
      });
  }
  loadEmployeeTeamSale(): void {
    this.viewPokhService.loadEmployeeTeamSale().subscribe(
      response => {
        if (response.status === 1) {
          this.EmployeeTeamSale = response.data;
        } else {
          console.error('Lỗi khi tải EmployeeTeamSale:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải EmployeeTeamSale:', error);
      }
    );
  }
  loadMainIndex(): void {
    this.viewPokhService.loadMainIndex().subscribe(
      response => {
        if (response.status === 1) {
          this.statuses = response.data;
        } else {
          console.error('Lỗi khi tải Status:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Status:', error);
      }
    );
  }
  loadGroupSale(): void {
    this.viewPokhService.loadGroupSale().subscribe(
      response => {
        if (response.status === 1) {
          this.groups = response.data;
        } else {
          console.error('Lỗi khi tải GroupSale:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải GroupSale:', error);
      }
    );
  }
  loadCustomer(): void {
    this.viewPokhService.loadCustomer().subscribe(
      response => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          console.error('Lỗi khi tải Customer:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }
  loadUser(): void {
    this.viewPokhService.loadUser().subscribe(
      response => {
        if (response.status === 1) {
          this.users = response.data;
        } else {
          console.error('Lỗi khi tải users:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải users:', error);
      }
    );
  }
  //#endregion
  //#region Hàm vẽ bảng
  initViewPOKHTable(): void {
    this.viewPOKH = new Tabulator(this.viewPOKHTableElement.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      paginationSize: 50,
      height: "80vh",
      resizableRows: true,
      reactiveData: true,
      groupBy: "PONumber",
      selectableRows: true,
      selectableRange: true,
      groupHeader: (value, count, data, group) => {
        return `<div class="group-header">
          <input type="checkbox" class="group-checkbox" data-group="${value}">
          <span>${value} (${count} items)</span>
        </div>`;
      },
      columns: [
        {
          title: "",
          formatter: "rowSelection",
          titleFormatter: "rowSelection",
          hozAlign: "center",
          headerSort: false,
          width: 40,
          cellClick: (e, cell) => {
            // Sửa logic chọn dòng đơn lẻ
            const row = cell.getRow();
            const rowData = row.getData();

            // Kiểm tra trạng thái hiện tại của dòng TRƯỚC khi toggle
            const isCurrentlySelected = row.isSelected();

            if (isCurrentlySelected) {
              // Nếu đang được chọn -> bỏ chọn
              row.deselect();
              this.selectedRows = this.selectedRows.filter(r => r["ID"] !== rowData["ID"]);
            } else {
              // Nếu chưa được chọn -> chọn
              row.select();
              if (!this.selectedRows.some(r => r["ID"] === rowData["ID"])) {
                this.selectedRows.push(rowData);
              }
            }
            console.log('Selected Rows:', this.selectedRows);
          }
        },
        { title: 'Mã dự án', field: 'ProjectCode', sorter: 'string', width: 120 },
        { title: 'Số POKH', field: 'PONumber', sorter: 'string', width: 70 },
        { title: 'Trạng thái', field: 'Status', sorter: 'number', width: 80 },
        {
          title: 'Ngày PO',
          field: 'ReceivedDatePO',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        { title: 'Sale phụ trách', field: 'FullName', sorter: 'string', width: 150 },
        { title: 'Hãng', field: 'Maker', sorter: 'string', width: 100 },
        { title: 'Mã nội bộ', field: 'ProductNewCode', sorter: 'string', width: 120 },
        { title: 'Mã theo khách', field: 'GuestCode', sorter: 'string', width: 120 },
        { title: 'SL PO', field: 'Qty', sorter: 'number', width: 80 },
        { title: 'SL đã giao', field: 'QuantityDelived', sorter: 'number', width: 120 },
        { title: 'SL Pending', field: 'QuantityPending', sorter: 'number', width: 120 },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 80 },
        { title: 'Đơn giá NET', field: 'NetUnitPrice', sorter: 'number', width: 120 },
        { title: 'Đơn giá (chưa VAT)', field: 'UnitPrice', sorter: 'number', width: 120 },
        { title: 'Tổng giá (chưa VAT)', field: 'IntoMoney', sorter: 'number', width: 120 },
        { title: 'VAT(%)', field: 'VAT', sorter: 'number', width: 80 },
        { title: 'Tổng tiền (gồm VAT)', field: 'TotalPriceIncludeVAT', sorter: 'number', width: 150 },
        {
          title: 'Ngày dự kiến giao hàng',
          field: 'DeliveryRequestedDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        { title: 'Ngày giao hàng thực tế', field: 'DateMinutes', sorter: 'string', width: 120 },
        {
          title: 'Ngày thanh toán dự kiến',
          field: 'PayDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        {
          title: 'Ngày tiền về',
          field: 'MoneyDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        { title: 'Công ty', field: 'CompanyName', sorter: 'string', width: 150 },
        { title: 'Số hóa đơn', field: 'BillNumber', sorter: 'string', width: 120 },
        {
          title: 'Ngày hóa đơn',
          field: 'BillDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        {
          title: 'Ngày đặt hàng',
          field: 'RequestDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        {
          title: 'Ngày hàng về',
          field: 'DateRequestImport',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        { title: 'Nhà cung cấp', field: 'SupplierName', sorter: 'string', width: 150 },
        { title: 'Đầu vào (số hóa đơn/số tờ khai)', field: 'SomeBill', sorter: 'string', width: 120 },
        {
          title: 'Ngày dự kiến hàng về',
          field: 'ExpectedDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100
        },
        { title: 'PNK', field: 'BillImportCode', sorter: 'string', width: 120 },
        // { title: 'POKHID', field: 'POKHID', sorter: 'number', width: 100 },
        // { title: 'ID', field: 'ID', sorter: 'number', width: 100 },
        // { title: 'ProductID', field: 'ProductID', sorter: 'number', width: 100 },
        // { title: 'CustomerID', field: 'CustomerID', sorter: 'number', width: 100 },
        // { title: 'ProjectID', field: 'ProjectID', sorter: 'number', width: 100 },
        // { title: 'ProductCode', field: 'ProductCode', sorter: 'string', width: 120 },
        // { title: 'ProductName', field: 'ProductName', sorter: 'string', width: 200 },
        // { title: 'Trạng thái', field: 'StatusText', sorter: 'string', width: 150 },

      ]
    });
    // Thêm event listener cho việc chọn toàn bộ (header checkbox)
    this.viewPOKH.on("rowSelectionChanged", (data, rows) => {
      // Cập nhật selectedRows khi có thay đổi selection từ header checkbox
      this.selectedRows = data;
      console.log('Selection changed - Selected Rows:', this.selectedRows);
    });
  }
  //#endregion

}

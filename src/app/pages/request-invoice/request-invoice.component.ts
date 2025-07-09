import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input, IterableDiffers } from '@angular/core';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { RequestInvoiceService } from './request-invoice-service/request-invoice-service.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';

@Component({
  selector: 'app-request-invoice',
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
  ],
  templateUrl: './request-invoice.component.html',
  styleUrl: './request-invoice.component.css'
})
export class RequestInvoiceComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false }) tb_MainTableElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;
  @ViewChild('tb_File', { static: false }) tb_FileTableElement!: ElementRef;


  private mainTable!: Tabulator;
  private detailTable!: Tabulator;
  private fileTable!: Tabulator;

  constructor(
    private modalService: NgbModal,
    private RequestInvoiceService: RequestInvoiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private RequestInvoiceDetailService: RequestInvoiceDetailService,
  ) { }

  data: any[] = [];
  dataDetail: any[] = [];
  dataFile: any[] = [];
  selectedId: number = 0;

  filters: any = {
    filterText: "",
    startDate: new Date(),
    endDate: new Date(),
  };

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Lấy dữ liệu 1000 ngày trước tạm thời
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadMainData(this.filters.startDate, this.filters.endDate, this.filters.filterText);
  }

  ngAfterViewInit(): void {
    this.initMainTable()
    this.initDetailTable()
    this.initFileTable()
  }

  loadMainData(startDate: Date, endDate: Date, keywords: string): void {
    // Đặt giờ bắt đầu là 00:00:00 và giờ kết thúc là 23:59:59
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    this.RequestInvoiceService.getRequestInvoice(start, end, keywords).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.data = response.data;
          this.initMainTable();
          if (this.mainTable) {
            this.mainTable.setData(this.data);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }

  loadDetailData(id: number): void {
    this.RequestInvoiceService.getDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataDetail = response.data;
          this.dataFile = response.files;
          if (this.detailTable) {
            this.detailTable.setData(this.dataDetail);
          }
          if (this.fileTable) {
            this.fileTable.setData(this.dataFile);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  onEdit() {
    if (!this.selectedId) {
      this.notification.error("Lỗi", "Vui lòng chọn bản ghi cần sửa")
      return;
    }
    this.RequestInvoiceService.getDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const DETAIL = response.data;
          const FILE = response.files;
          const MAINDATA = this.data.find(item => item.ID === this.selectedId);
          const groupedData = [{
            MainData: MAINDATA,
            ID: this.selectedId,
            items: DETAIL,
            files: FILE
          }];
          const modalRef = this.modalService.open(RequestInvoiceDetailComponent, {
            centered: true,
            size: "xl",
            backdrop: 'static'
          });
          modalRef.componentInstance.groupedData = groupedData;
          modalRef.componentInstance.isEditMode = true;
          modalRef.componentInstance.selectedId = this.selectedId;
          modalRef.result.then(
            (result) => {
              if (result.success && result.reloadData) {
                this.loadMainData(this.filters.startDate, this.filters.endDate, this.filters.filterText);
              }
            },
            (reason) => {
              console.log('Modal closed');
            }
          );
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }

  openModal() {
    const modalRef = this.modalService.open(RequestInvoiceDetailComponent, {
      centered: true,
      size: "xl",
      backdrop: 'static',
    });
    modalRef.componentInstance.groupedData = [{
      ID: 0,
      items: [],
    }];
    modalRef.componentInstance.isMultipleGroups = false;
    modalRef.componentInstance.selectedId = this.selectedId;

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadMainData(this.filters.startDate, this.filters.endDate, this.filters.filterText);
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }
  onDelete() {
    if (!this.selectedId) {
      this.notification.error("Thông báo!", "Vui lòng chọn yêu cầu cần xóa!");
      return;
    }
    this.modal.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa?',
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const DATA = {
          ID: this.selectedId,
          IsDeleted: true
        }

        this.RequestInvoiceDetailService.saveData({
          RequestInvoices: DATA,
          RequestInvoiceDetails: []
        }).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Lưu dữ liệu thành công');
              this.loadMainData(this.filters.startDate, this.filters.endDate, this.filters.filterText)
            } else {
              this.notification.error('Lỗi', response.message || 'Lưu dữ liệu thất bại!');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Không thể lưu dữ liệu!');
          }
        });
      }
    })
  }
  initMainTable(): void {
    this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      height: '100%',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      columns: [
        { title: 'ID', field: 'ID', sorter: 'string', width: 50 },
        { title: 'Trạng thái', field: 'StatusText', sorter: 'string', width: 100 },
        { title: 'Mã lệnh', field: 'Code', sorter: 'string', width: 200 },
        { title: 'Khách hàng', field: 'CustomerName', sorter: 'string', width: 215 },
        { title: 'Địa chỉ', field: 'Address', sorter: 'string', width: 200 },
        { title: 'Công ty bán', field: 'Name', sorter: 'string', width: 140 },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 200 },
        {
          title: 'Ngày yêu cầu', field: 'DateRequest', sorter: 'string', width: 200, formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
      ]
    });
    this.mainTable.on('rowClick', (e: any, row: RowComponent) => {
      const ID = row.getData()['ID'];
      this.selectedId = ID;
      this.loadDetailData(ID);
    });
  }
  initDetailTable(): void {
    this.detailTable = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      height: '50vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      columns: [
        { title: 'Mã nội bộ', field: 'ProductNewCode', sorter: 'string', width: 100 },
        { title: 'Mã sản phẩm', field: 'ProductCode', sorter: 'string', width: 150 },
        { title: 'Mã sản phẩm theo dự án', field: 'ProductByProject', sorter: 'string', width: 150 },
        { title: 'Tên sản phẩm', field: 'ProductName', sorter: 'string', width: 150 },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 150 },
        { title: 'Số lượng', field: 'Quantity', sorter: 'string', width: 150 },
        { title: 'Dự án', field: 'ProjectName', sorter: 'string', width: 150 },
        { title: 'Mã dự án', field: 'ProjectCode', sorter: 'string', width: 150 },
        { title: 'Ghi chú (PO)', field: 'Note', sorter: 'string', width: 150 },
        { title: 'Thông số kỹ thuật', field: 'Specifications', sorter: 'string', width: 150 },
        { title: 'Số hóa đơn', field: 'InvoiceNumber', sorter: 'string', width: 150 },
        {
          title: 'Ngày hóa đơn', field: 'InvoiceDate', sorter: 'string', width: 150, formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },

      ]
    });
  }
  initFileTable(): void {
    this.fileTable = new Tabulator(this.tb_FileTableElement.nativeElement, {
      data: this.dataFile,
      layout: 'fitDataFill',
      height: '34.9vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      columns: [
        { title: 'Tên file', field: 'FileName', sorter: 'string', width: "100%" },
        { title: 'Server Path', field: 'ServerPath', sorter: 'string', visible: false },
      ]
    });
  }
}

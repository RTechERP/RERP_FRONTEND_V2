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

import { HandoverMinutesService } from './handover-minutes-service/handover-minutes-service.service';
import { HandoverMinutesDetailService } from '../handover-minutes-detail/handover-minutes-detail/handover-minutes-detail.service';
import { HandoverMinutesDetailComponent } from '../handover-minutes-detail/handover-minutes-detail.component';
@Component({
  selector: 'app-handover-minutes',
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
  templateUrl: './handover-minutes.component.html',
  styleUrl: './handover-minutes.component.css',
})
export class HandoverMinutesComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;

  private mainTable!: Tabulator;
  private detailTable!: Tabulator;

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private HandoverMinutesService: HandoverMinutesService,
    private notification: NzNotificationService,
    private HandoverMinutesDetailService: HandoverMinutesDetailService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}

  data: any[] = [];
  dataDetail: any[] = [];
  selectedId: number = 0;
  isEditMode: boolean = false;

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  filters: any = {
    filterText: '',
    startDate: new Date(),
    endDate: new Date(),
  };

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Lấy dữ liệu 30 ngày gần nhất
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.filterText
    );
  }

  ngAfterViewInit(): void {
    this.initDetailTable();
  }
  loadMainData(startDate: Date, endDate: Date, keywords: string): void {
    // Đặt giờ bắt đầu là 00:00:00 và giờ kết thúc là 23:59:59
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    this.HandoverMinutesService.getHandoverMinutes(
      start,
      end,
      keywords
    ).subscribe({
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
      },
    });
  }
  loadDetailData(id: number): void {
    this.HandoverMinutesService.getDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataDetail = response.data;
          if (this.detailTable) {
            this.detailTable.setData(this.dataDetail);
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
  openModal() {
    const modalRef = this.modalService.open(HandoverMinutesDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });
    modalRef.componentInstance.groupedData = [
      {
        ID: 0,
        items: [],
      },
    ];
    modalRef.componentInstance.isMultipleGroups = false;

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.filterText
          );
          this.detailTable.setData([]);
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  onEdit() {
    if (!this.selectedId) {
      this.notification.error('Lỗi', 'Vui lòng chọn bản ghi cần sửa');
      return;
    }

    this.HandoverMinutesService.getDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const DetailDATA = response.data;
          const MainData = this.data.find(
            (item) => item.ID === this.selectedId
          );
          const groupedData = [
            {
              MainData: MainData,
              ID: this.selectedId,
              items: DetailDATA,
            },
          ];
          const modalRef = this.modalService.open(
            HandoverMinutesDetailComponent,
            {
              centered: true,
              size: 'xl',
              backdrop: 'static',
            }
          );
          modalRef.componentInstance.groupedData = groupedData;
          modalRef.componentInstance.isMultipleGroups = false;
          modalRef.componentInstance.isEditMode = true;
          modalRef.result.then(
            (result) => {
              if (result.success && result.reloadData) {
                this.loadMainData(
                  this.filters.startDate,
                  this.filters.endDate,
                  this.filters.filterText
                );
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
      },
    });
  }
  onDelete() {
    if (!this.selectedId) {
      this.notification.error('Thông báo!', 'Vui lòng chọn yêu cầu cần xóa!');
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
          IsDeleted: true,
        };
        this.HandoverMinutesDetailService.save(DATA).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Đã xóa thành công!');
              this.loadMainData(
                this.filters.startDate,
                this.filters.endDate,
                this.filters.filterText
              );
            } else {
              this.notification.error('Lỗi', response.message);
            }
          },
          error: (error) => {
            this.notification.error('Lỗi', error);
          },
        });
      },
    });
  }
  onExport() {
    if (!this.selectedId) {
      this.notification.error('Lỗi', 'Vui lòng chọn bản ghi cần xuất file');
      return;
    }
    const selectedHandover = this.data.find(
      (item) => item.ID === this.selectedId
    );
    this.HandoverMinutesService.export(this.selectedId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const dateString = `${now.getFullYear().toString().slice(-2)}-${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const fileName = `${
          selectedHandover?.Code || 'export'
        }_${dateString}.xlsx`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notification.success('Thành công', 'Đã xuất file thành công!');
      },
      error: () => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi xuất file.');
      },
    });
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
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        { title: 'STT', field: 'STT', sorter: 'string', width: 50 },
        { title: 'Mã biên bản', field: 'Code', sorter: 'string', width: 150 },
        {
          title: 'Ngày lập',
          field: 'DateMinutes',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Tên khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Địa chỉ',
          field: 'CustomerAddress',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Người liên hệ',
          field: 'CustomerContact',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'SDT khách hàng',
          field: 'CustomerPhone',
          sorter: 'string',
          width: 150,
        },
        { title: 'Nhân viên', field: 'FullName', sorter: 'string', width: 150 },
        {
          title: 'Bộ phận',
          field: 'DepartmentName',
          sorter: 'string',
          width: 150,
        },
        { title: 'Email', field: 'EmailCaNhan', sorter: 'string', width: 150 },
        {
          title: 'SDT nhân viên',
          field: 'SDTCaNhan',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Người nhận',
          field: 'Receiver',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'SDT người nhận',
          field: 'ReceiverPhone',
          sorter: 'string',
          width: 150,
        },
      ],
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
      movableColumns: true,
      height: '88.5vh',
      resizableRows: true,
      reactiveData: true,
      columns: [
        { title: 'STT', field: 'STT', sorter: 'string', width: 80 },
        {
          title: 'Số PO / Số Hợp đồng',
          field: 'POCode',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Hãng sản xuất',
          field: 'Maker',
          sorter: 'string',
          width: 150,
        },
        { title: 'Số lượng', field: 'Quantity', sorter: 'string', width: 100 },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 100 },
        {
          title: 'Tình trạng hàng',
          field: 'ProductStatus',
          sorter: 'string',
          width: 200,
        },
        { title: 'Bảo hành', field: 'Guarantee', sorter: 'string', width: 200 },
        {
          title: 'Tình trạng giao hàng(Nhận đủ/Thiếu)',
          field: 'DeliveryStatus',
          sorter: 'string',
          width: 200,
        },
      ],
    });
  }
}

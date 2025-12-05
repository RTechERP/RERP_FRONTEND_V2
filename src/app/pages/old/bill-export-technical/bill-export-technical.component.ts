import { ElementRef, inject, Inject, Optional, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
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
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
// @ts-ignore
import { saveAs } from 'file-saver';
import { BillExportTechnicalFormComponent } from './bill-export-technical-form/bill-export-technical-form.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillExportTechnicalService } from './bill-export-technical-service/bill-export-technical.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  standalone: true,
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
  ],
  selector: 'app-bill-export-technical',
  templateUrl: './bill-export-technical.component.html',
  styleUrls: ['./bill-export-technical.component.css'],
})
export class BillExportTechnicalComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private billExportTechnicalService: BillExportTechnicalService,
    private appUserService: AppUserService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
  private ngbModal = inject(NgbModal);
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number = 1;
  selectedApproval: number | null = null;
  isSearchVisible: boolean = false;
  //List  Dữ liệu phiếu xuất
  billExportTechnicalData: any[] = [];
  // Bảng Tabulator của phiếu xuất
  billExportTechnicalTable: Tabulator | null = null;
  //List Detail  Dữ liệu phiếu xuất
  billExportTechnicalDetailData: any[] = [];
  // Bảng Tabulator của chi tiết  phiếu xuất
  billExportTechnicalDetailTable: Tabulator | null = null;
  // Danh sách nhân viên
  emPloyeeLists: any[] = [];
  // danh sách trạng thái
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' },
  ];
  warehouseType: number = 0;
  @ViewChild('billExportTechnicalTableRef', { static: true })
  billExportTechnicalTableRef!: ElementRef;
  @ViewChild('billExportTechnicalDetailTableRef', { static: true })
  billExportTechnicalDetailTableRef!: ElementRef;

  ngOnInit() {
    if (this.tabData?.warehouseID) {
      this.warehouseID = this.tabData.warehouseID;
      this.warehouseType = this.tabData.warehouseType;
    }
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  // Hàm vẽ bảng Tabulator cho phiếu xuất kỹ thuật, thiếu cái load quay quay như number
  public drawTable(): void {
    this.billExportTechnicalTable = new Tabulator(
      this.billExportTechnicalTableRef.nativeElement,
      {
        layout: 'fitDataStretch',
        height: '100%',
        pagination: true,
        selectableRows: 5,
        movableColumns: true,
        ajaxURL: this.billExportTechnicalService.getBillExport(),
        ajaxConfig: 'POST',
        columnDefaults: {
          headerWordWrap: true,
          headerVertical: false,
          headerHozAlign: 'center',
          minWidth: 60,
          resizable: true,
        },
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        paginationMode: 'remote',
        ajaxRequestFunc: (url, config, params) => {
          const request = {
            Page: params.page,
            Size: params.size,
            dateStart: this.dateStart || '2024-12-01',
            dateEnd: this.dateEnd || '2025-12-31',
            status:
              this.selectedApproval !== null
                ? this.selectedApproval === 1
                  ? '1'
                  : '0'
                : '-1',
            filterText: this.filterText || '',
            warehouseID: this.warehouseID || 1,
          };
          return this.billExportTechnicalService
            .getBillExportTechnical(request)
            .toPromise();
        },
        ajaxResponse: (url, params, response) => {
          return {
            data: response.billExportTechnical || [],
            last_page: response.TotalPage?.[0]?.TotalPage || 1,
          };
        },
        placeholder: 'Không có dữ liệu',
        langs: {
          vi: {
            pagination: {
              first: '<<',
              last: '>>',
              prev: '<',
              next: '>',
            },
          },
        },
        locale: 'vi',
        dataTree: true,
        addRowPos: 'bottom',
        history: true,
        columns: [
          { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 60 },
          {
            title: 'Duyệt',
            field: 'Status',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked =
                value === true ||
                value === 'true' ||
                value === 1 ||
                value === '1';
              return `<input type="checkbox" ${
                checked ? 'checked' : ''
              } style="pointer-events: none; accent-color: #1677ff;" />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày Duyệt / Hủy duyệt',
            field: 'ApprovalDate',
            formatter: formatDateCell,
            hozAlign: 'center',
          },
          { title: 'Người Duyệt / Hủy duyệt', field: 'EmployeeApproveName' },
          { title: 'Loại', field: 'BillTypeText' },
          { title: 'Mã phiếu xuất', field: 'Code' },
          { title: 'Dự án', field: 'ProjectName' },
          { title: 'Nhà cung cấp', field: 'NameNCC' },
          { title: 'Khách hàng', field: 'CustomerName' },
          { title: 'Người giao', field: 'Deliver' },
          { title: 'Phòng ban', field: 'DepartmentName' },
          { title: 'Mã nhân viên', field: 'EmployeeCode' },
          { title: 'Người nhận', field: 'Receiver' },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            formatter: formatDateCell,
            hozAlign: 'center',
          },
          { title: 'Loại kho', field: 'WarehouseType' },
          { title: 'Địa chỉ', field: 'Addres' },
        ],
      }
    );
    this.billExportTechnicalTable.on(
      'rowClick',
      (evt: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedRow = rowData;
        this.sizeTbDetail = null;
        const id = rowData['ID'];
        this.billExportTechnicalService
          .getBillExportDetail(id)
          .subscribe((res) => {
            const details = Array.isArray(res.billDetail) ? res.billDetail : [];
            this.billExportTechnicalDetailData = details;
            this.drawDetailTable();
          });
      }
    );
  }
  drawDetailTable(): void {
    if (this.billExportTechnicalDetailTable) {
      this.billExportTechnicalDetailTable.setData(
        this.billExportTechnicalDetailData
      );
    } else {
      this.billExportTechnicalDetailTable = new Tabulator(
        this.billExportTechnicalDetailTableRef.nativeElement,
        {
          data: this.billExportTechnicalDetailData,
          layout: 'fitDataStretch',
          pagination: false,
          height: '100%',
          movableColumns: true,
          reactiveData: true,
          columns: [
            {
              title: 'STT',
              formatter: 'rownum',
              hozAlign: 'center',
              width: 60,
            },
            { title: 'Mã QRCode', field: 'ProductQRCode' },
            { title: 'Mã sản phẩm', field: 'ProductCode' },
            { title: 'Mã nội bộ', field: 'InternalCode' },
            { title: 'Tên sản phẩm', field: 'ProductName' },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
            { title: 'ĐVT', field: 'UnitName', hozAlign: 'center' },
            { title: 'Tình trạng hàng', field: 'WarehouseType' },
            { title: 'Hãng', field: 'Maker' },
            { title: 'Ghi chú', field: 'Note' },
          ],
        }
      );
    }
  }
  onSearch(): void {
    this.billExportTechnicalTable?.setData();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  getSelectedIds(): number[] {
    if (this.billExportTechnicalTable) {
      const selectedRows = this.billExportTechnicalTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteBillImportTechnical() {
    const selectedData = this.billExportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn biên bản cần xóa!'
      );
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === 1) {
      this.notification.warning(
        'Không thể xóa',
        'Biên bản đã được duyệt, không thể xóa!'
      );
      return;
    }
    const selectedIds = this.getSelectedIds();
    const payload = {
      billExportTechnical: {
        ID: selectedIds[0],
        IsDeleted: true,
      },
      historyDeleteBill: {
        ID: 0,
        UserID: 1,
        BillID: selectedIds[0],
        Name: 'AdminSW',
        TypeBill: selectedRow.BillCode,
        DeleteDate: DateTime.now().toUTC().toISO(),
      },
    };
    this.billExportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Xóa biên bản thành công!'
        );
        this.billExportTechnicalTable?.setData();
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối máy chủ!'
        );
      },
    });
  }
  onApprove() {
    const selectedRow = this.billExportTechnicalTable?.getSelectedData()?.[0];
    if (!selectedRow) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn biên bản cần duyệt!'
      );
      return;
    }

    this.billExportTechnicalService
      .approveBill(selectedRow.ID, true)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              res.message || 'Duyệt phiếu thành công!'
            );
            this.billExportTechnicalTable?.setData();
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Có lỗi xảy ra khi duyệt phiếu!'
            );
          }
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Lỗi kết nối máy chủ!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        },
      });
  }
  onUnApprove() {
    const selectedRow = this.billExportTechnicalTable?.getSelectedData()?.[0];
    if (!selectedRow) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn biên bản cần bỏ duyệt!'
      );
      return;
    }

    this.billExportTechnicalService
      .approveBill(selectedRow.ID, false)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              res.message || 'Bỏ duyệt phiếu thành công!'
            );
            this.billExportTechnicalTable?.setData();
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Có lỗi xảy ra khi bỏ duyệt phiếu!'
            );
          }
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Lỗi kết nối máy chủ!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        },
      });
  }
  // Mở modal thêm  phiếu xuất
  openModalExportTechnical() {
    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    // Lắng nghe sự kiện lưu dữ liệu thành công để reload table
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.billExportTechnicalTable?.setData();
    });
  }
  // Hàm xuất Excel
  onExportExcel() {
    const selectedMaster =
      this.billExportTechnicalTable?.getSelectedData()?.[0];
    const details = this.billExportTechnicalDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }
    const payload = {
      master: {
        ID: selectedMaster.ID,
        Code: selectedMaster.Code,
        CreatedDate: selectedMaster.CreatedDate,
        SupplierName: selectedMaster.SupplierName,
        CustomerName: selectedMaster.CustomerName,
        Deliver: selectedMaster.Deliver,
        EmployeeReceiverName: selectedMaster.EmployeeReceiverName,
        DepartmentName: selectedMaster.DepartmentName,
      },
      details: details.map((item: any) => ({
        ProductCode: item.ProductCode,
        ProductName: item.ProductName,
        Quantity: item.Quantity,
        UnitName: item.UnitName,
        Maker: item.Maker,
        WarehouseType: item.WarehouseType,
        ProductCodeRTC: item.ProductCodeRTC,
        Note: item.Note,
      })),
    };
    this.billExportTechnicalService
      .exportBillExportTechnical(payload)
      .subscribe({
        next: (blob: Blob) => {
          const fileName = `PhieuXuatKT_${selectedMaster.Code}.xlsx`;
          saveAs(blob, fileName);
        },
        error: (err) => {
          console.error(err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể xuất phiếu nhập kỹ thuật!'
          );
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể xuất phiếu nhập kỹ thuật!'
          );
        },
      });
  }
  // Mở modal , gửi dữ liệu để edit phiếu xuất kỹ thuậts
  onEditExportTechnical() {
    const selectedData = this.billExportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn biên bản cần sửa!'
      );
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning(
        'Không thể sửa',
        'Biên bản đã duyệt, không thể sửa!'
      );
      return;
    }
    // Mở modal và truyền dữ liệu vào
    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.masterId = selectedRow.ID; // Để form tự gọi chi tiết
    modalRef.componentInstance.dataEdit = selectedRow;
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    const currentDetails =
      this.billExportTechnicalDetailTable?.getData?.() || [];
    modalRef.componentInstance.dataInput = { details: currentDetails };

    // Lắng nghe sự kiện lưu dữ liệu thành công để reload table
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.billExportTechnicalTable?.setData();
    });
  }
}

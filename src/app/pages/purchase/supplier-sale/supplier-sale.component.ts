import { Component, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { SupplierSaleService } from './supplier-sale.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ProjectService } from '../../project/project-service/project.service';
import { SupplierSaleDetailComponent } from './supplier-sale-detail/supplier-sale-detail.component';
import { SupplierSaleImportExcelComponent } from './supplier-sale-import-excel/supplier-sale-import-excel.component';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
@Component({
  selector: 'app-supplier-sale',
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    HasPermissionDirective,
  ],
  templateUrl: './supplier-sale.component.html',
  styleUrl: './supplier-sale.component.css',
})
export class SupplierSaleComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private projectService: ProjectService
  ) {}
  @ViewChild('tb_supplier', { static: false })
  tb_supplierContainer!: ElementRef;
  tb_supplierBody: any;

  @ViewChild('tb_supplierSaleContact', { static: false })
  tb_supplierSaleContactContainer!: ElementRef;
  tb_supplierSaleContactBody: any;

  tableHeight: any = '89vh';
  isLoadTable: any = false;
  sizeTbDetail: any = '0';
  keyword: string = '';
  selectedArrSupplierSaleID: Set<number> = new Set();
  //#endregion

  //#region hàm chạy khi mở chương trình
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTbSupplier(this.tb_supplierContainer.nativeElement);
    this.drawTbSupplierSaleContact(
      this.tb_supplierSaleContactContainer.nativeElement
    );
  }
  //#endregion

  //#region Tìm kiếm
  getAjaxParams() {
    return {
      keyword: this.keyword ?? '',
    };
  }

  onSearch() {
    this.tb_supplierBody.setData(
      this.supplierSaleService.getSupplierSale(),
      this.getAjaxParams()
    );
  }

  resetSearch() {
    this.keyword = '';
    this.onSearch();
  }
  //#endregion

  //#region Khởi tạo bảng
  drawTbSupplier(container: HTMLElement) {
    this.tb_supplierBody = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: this.tableHeight,
      layout: 'fitDataStretch',
      selectableRows: true,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 100,
      paginationSizeSelector: [30, 50, 100, 200, 500],
      ajaxURL: this.supplierSaleService.getSupplierSale(),
      ajaxParams: { keyword: this.keyword ?? '' },
      ajaxConfig: {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      },
      ajaxResponse: (url, params, res) => {
        return {
          data: res.data.data,
          last_page: res.data.totalPage,
        };
      },
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

      columns: [
        {
          title: '',
          field: '',
          headerHozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 50,
          cellClick: function (e, cell) {
            e.stopPropagation();
          },
        },
        {
          title: 'Ngày update',
          field: 'NgayUpdate',
          width: 100,
          hozAlign: 'center',
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return '';
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          },
          headerSort: false,
          headerWordWrap: true,
        },
        {
          title: 'Công ty nhập',
          field: 'CompanyText',
          width: 150,
          hozAlign: 'center',
          headerSort: false,
          headerWordWrap: true,
          formatter: 'textarea',
        },
        {
          title: 'Mã NCC',
          field: 'CodeNCC',
          width: 150,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Tên viết tắt',
          field: 'ShortNameSupplier',
          width: 150,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Tên NCC',
          field: 'NameNCC',
          width: 250,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Tên tiếng Anh',
          field: 'TenTiengAnh',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Hãng/Brand',
          field: 'Brand',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Mã nhóm',
          field: 'MaNhom',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Địa chỉ',
          field: 'AddressNCC',
          width: 200,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'NV phụ trách',
          field: 'NVPhuTrach',
          width: 100,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Loại hàng hóa',
          field: 'LoaiHangHoa',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Mã số thuế',
          field: 'MaSoThue',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Website',
          field: 'Website',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Công nợ',
          field: 'Debt',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Số TK',
          field: 'SoTK',
          width: 300,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Điện thoại',
          field: 'PhoneNCC',
          width: 100,
          hozAlign: 'center',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Người đặt hàng',
          field: 'OrderNCC',
          width: 200,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          width: 100,
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
      ],
    });
    this.selectedArrSupplierSaleID.clear();
    this.tb_supplierBody.on('dataLoading', () => {
      this.tb_supplierBody.deselectRow();
      this.sizeTbDetail = '0';
    });
    this.tb_supplierBody.on('rowDblClick', (e: any, row: any) => {
      //this.onSaveSupplierSale('update');
    });
    // Lắng nghe sự kiện chọn
    this.tb_supplierBody.on('rowSelected', (row: any) => {
      if (this.selectedArrSupplierSaleID.size > 0) {
        this.sizeTbDetail = '0';
      } else {
        this.sizeTbDetail = null;
      }
      const id = row.getData().ID;
      this.getSupplierSaleContact(id);
      this.selectedArrSupplierSaleID.add(id);
      console.log('Selected IDs:', this.selectedArrSupplierSaleID);
    });

    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_supplierBody.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target
        .closest('.tabulator-cell')
        ?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_supplierBody.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_supplierBody.on('rowDeselected', (row: any) => {
      if (this.selectedArrSupplierSaleID.size > 0) {
        this.sizeTbDetail = '0';
      } else {
        this.sizeTbDetail = null;
      }
      const id = row.getData().ID;
      this.selectedArrSupplierSaleID.delete(id);
    });
  }

  //#region Tạo bảng supplier sale contact
  drawTbSupplierSaleContact(container: HTMLElement) {
    this.tb_supplierSaleContactBody = new Tabulator(container, {
      height: this.tableHeight,
      layout: 'fitDataStretch',
      columns: [
        {
          title: 'Tên liên hệ',
          width: 100,
          field: 'SupplierName',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Số điện thoại',
          width: 100,
          field: 'SupplierPhone',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Email',
          width: 150,
          field: 'SupplierEmail',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
        {
          title: 'Mô tả',
          width: 200,
          field: 'Describe',
          headerWordWrap: true,
          formatter: 'textarea',
          headerSort: false,
        },
      ],
    });
    this.tb_supplierSaleContactBody.redraw(true);
  }

  getSupplierSaleContact(supplierID: number) {
    this.tb_supplierSaleContactBody.clearData();
    this.supplierSaleService.getSupplierSaleContact(supplierID).subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.tb_supplierSaleContactBody.setData(data.data);
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có dữ liệu liên hệ nào được tìm thấy cho NCC này.'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
      },
    });
  }
  //#endregion

  //#region Xuất excel
  async exportExcel() {
    const table = this.tb_supplierBody;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }
    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    this.projectService.exportExcelGroup(
      this.tb_supplierBody,
      data,
      'DanhSachNCC',
      `DanhSachNCC_${formattedDate}`,
      ''
    );
  }
  //#endregion

  //#region Thêm mới
  onAddSupplierSale() {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0;
    modalRef.result.finally(() => {
      this.getSupplierSaleContact(
        Array.from(this.selectedArrSupplierSaleID).at(-1) ?? 0
      );
      this.drawTbSupplier(this.tb_supplierContainer.nativeElement);
    });
  }
  //#endregion

  //#region Sửa
  onEditSupplierSale() {
    if (this.selectedArrSupplierSaleID.size <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhà cung cấp cần cập nhật.'
      );
      return;
    }
    if (this.selectedArrSupplierSaleID.size > 1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 nhà cung cấp để cập nhật.'
      );
      return;
    }

    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = Array.from(
      this.selectedArrSupplierSaleID
    ).at(-1);
    modalRef.result.finally(() => {
      this.getSupplierSaleContact(
        Array.from(this.selectedArrSupplierSaleID).at(-1) ?? 0
      );
      this.drawTbSupplier(this.tb_supplierContainer.nativeElement);
    });
  }
  //#endregion

  //#region Xóa
  onDeleteSupplierSale() {
    if (this.selectedArrSupplierSaleID.size == 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhà cung cấp cần xóa!'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedArrSupplierSaleID.size} nhà cung cấp không?`,
        nzOkText: 'Xóa',
        nzCancelText: 'Hủy',
        nzOkDanger: true,
        nzOnOk: () => {
          const deleteRequests = Array.from(this.selectedArrSupplierSaleID).map(
            (id) => {
              const data = {
                ID: id,
                IsDeleted: true,
              };

              return this.supplierSaleService
                .saveSupplierSale(data)
                .toPromise()
                .then(() => ({ id, success: true }))
                .catch((error) => {
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    `Lỗi xóa NCC ${error.error.message}`
                  );
                  return;
                });
            }
          );

          Promise.all(deleteRequests).then((results) => {
            const successCount = results.filter((r: any) => r.success).length;
            const failed = results
              .filter((r: any) => !r.success)
              .map((r: any) => r.id);

            if (successCount > 0) {
              this.drawTbSupplier(this.tb_supplierContainer.nativeElement);
              this.selectedArrSupplierSaleID.clear();
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa ${successCount} nhà cung cấp thành công!`
              );
            }

            if (failed.length > 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Không thể xóa các nhà cung cấp có id: ${failed.join(', ')}`
              );
            }
          });
        },
      });
    }
  }
  //#endregion

  //#region Nhập excel
  onImportExcel() {
    const modalRef = this.modalService.open(SupplierSaleImportExcelComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.finally(() => {
      this.getSupplierSaleContact(
        Array.from(this.selectedArrSupplierSaleID).at(-1) ?? 0
      );
      this.drawTbSupplier(this.tb_supplierContainer.nativeElement);
    });
  }
  //#endregion
}

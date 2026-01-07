import { Component, OnInit, ViewEncapsulation, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficeSupplyRequestSummaryService } from './office-supply-request-summary-service/office-supply-request-summary-service.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { en_US, NzI18nService, zh_CN } from 'ng-zorro-antd/i18n';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPriceRequestFormComponent } from '../../../old/project-partlist-price-request/project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ProjectPartlistPriceRequestComponent } from '../../../old/project-partlist-price-request/project-partlist-price-request.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../../../purchase/project-partlist-purchase-request/project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { MenuEventService } from '../../../systems/menus/menu-service/menu-event.service';
import { UnsubscriptionError } from 'rxjs';
@Component({
  selector: 'app-office-supply-request-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTypographyModule,
    NzMessageModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSpinModule,
    HasPermissionDirective,
    NgbModalModule
  ],
  templateUrl: './office-supply-request-summary.component.html',
  styleUrl: './office-supply-request-summary.component.css',
  //encapsulation: ViewEncapsulation.None
})
export class OfficeSupplyRequestSummaryComponent implements OnInit, AfterViewInit {
  datatable: any[] = [];

  table: Tabulator | undefined;
  dataDeparment: any[] = [];
  searchParams = {
    year: new Date().getFullYear(),
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    departmentId: 0,
    keyword: ''
  };
  isVisible = false;
  sizeSearch = '0';
  isLoading = false;
  monthFormat = 'MM/yyyy';

  private ngbModal = inject(NgbModal);
  private modalService = inject(NzModalService);

  constructor(
    private officeSupplyRequestSummaryService: OfficeSupplyRequestSummaryService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private menuEventService: MenuEventService
  ) { }

  ngOnInit(): void {
    this.getDataDeparment();
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.getDataOfficeSupplyRequestSummary();
  }

  searchData(date: Date): void {
    this.isLoading = true;
    if (date) {
      this.searchParams.month = date;
      this.searchParams.year = date.getFullYear();
      setTimeout(() => {
        this.getDataOfficeSupplyRequestSummary();
      }, 1500);
      this.toggleSearchPanel();
    }
  }
  getDataOfficeSupplyRequestSummary(): void {
    const selectedYear = this.searchParams.month ? this.searchParams.month.getFullYear() : new Date().getFullYear();
    const selectedMonth = this.searchParams.month ? this.searchParams.month.getMonth() + 1 : new Date().getMonth() + 1;
    const departmentId = this.searchParams.departmentId || 0;
    console.log('Search params:', this.searchParams);
    this.officeSupplyRequestSummaryService.getdataOfficeSupplyRequestSummary(
      departmentId,
      selectedYear,
      selectedMonth,
      this.searchParams.keyword
    ).subscribe({
      next: (res) => {
        this.datatable = res.data;
        console.log('Danh sách VPP:', this.datatable);
        if (this.table) {

          this.table.setData(this.datatable).then(() => {

          }).catch(error => {
            console.error('Lỗi khi cập nhật dữ liệu:', error);
          });
        } else {
          console.warn('Bảng chưa được khởi tạo');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.message.error('Có lỗi xảy ra khi lấy dữ liệu');
        this.isLoading = false;
      }
    });
  }

  getDataDeparment(): void {
    this.officeSupplyRequestSummaryService.getdataDepartment().subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.dataDeparment = res.data;
        } else {
          this.dataDeparment = [];
          console.warn("Phản hồi không chứa danh sách");
        }
      },
      error: (err) => {
        console.error(err.message || err.error.message);
        this.message.error('Có lỗi xảy ra khi lấy danh sách phòng ban');
      }
    });
  }

  async exportToExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách tổng hợp VPP');

    // Định nghĩa các cột số lượng
    const quantityFields = ['GD', 'HR', 'KT', 'MH', 'MKT', 'KD', 'KYTHUAT', 'TKCK', 'AGV', 'BN', 'HP', 'HCM', 'LR', 'TotalQuantity'];

    // Định nghĩa headers thủ công với cột Đơn vị tính
    const headers = [
      'STT',
      'Tên sản phẩm',
      'Đơn vị tính',
      'Ban giám đốc',
      'HCNS',
      'Kế toán',
      'Mua hàng',
      'Phòng Marketing',
      'Kinh doanh',
      'Kỹ thuật',
      'Cơ khí- Thiết kế',
      'AGV',
      'Văn Phòng BN',
      'Văn Phòng HP',
      'Văn Phòng HCM',
      'Lắp ráp',
      'Tổng',
      'Đơn giá (VND)',
      'Thành tiền (VND)',
      'Ghi chú'
    ];

    // Định nghĩa fields tương ứng
    const fields = [
      'STT',
      'OfficeSupplyName',
      'OfficeSupplyUnit',
      'GD',
      'HR',
      'KT',
      'MH',
      'MKT',
      'KD',
      'KYTHUAT',
      'TKCK',
      'AGV',
      'BN',
      'HP',
      'HCM',
      'LR',
      'TotalQuantity',
      'UnitPrice',
      'TotalPrice',
      'Note'
    ];

    // Thêm header row
    const headerRow = worksheet.addRow(headers);

    // Style cho header: màu xám, font Tahoma 8.5
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC0C0C0' } // Màu xám
      };
      cell.font = {
        name: 'Tahoma',
        size: 8.5,
        bold: true
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Thêm data rows
    data.forEach((row: any) => {
      const rowData = fields.map((field) => {
        let value = row[field];

        // Nếu là cột số lượng và giá trị = 0 thì trả về ""
        if (quantityFields.includes(field) && (value === 0 || value === '0' || value === null || value === undefined)) {
          return '';
        }

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      const dataRow = worksheet.addRow(rowData);

      // Style cho data row: font Tahoma 8.5, căn giữa các số
      dataRow.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Tahoma',
          size: 8.5
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        const field = fields[colNumber - 1];
        // Căn giữa cho các cột số lượng và STT
        if (quantityFields.includes(field) || field === 'STT') {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
        } else if (field === 'UnitPrice' || field === 'TotalPrice') {
          // Căn phải cho cột tiền
          cell.alignment = {
            horizontal: 'right',
            vertical: 'middle'
          };
          // Format số có dấu phẩy phân cách hàng nghìn
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        } else {
          cell.alignment = {
            vertical: 'middle',
            wrapText: true
          };
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
      });
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: headers.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DanhSachTongHopVPP.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  private drawTable(): void {
    try {
      if (!this.table) {
        // Create reusable formatters
        const quantityFormatter = function (cell: any) {
          return cell.getValue() == 0 ? "" : cell.getValue();
        };

        const moneyFormatterParams = {
          precision: 0,
          decimal: ".",
          thousand: ",",
          symbol: "",
          symbolAfter: true
        };


        this.table = new Tabulator("#office-supply-request-summary-table", {
          data: this.datatable,
          layout: 'fitColumns',
          height: '89vh',
          ...DEFAULT_TABLE_CONFIG,
          pagination: true,
          paginationMode: 'local',
          paginationSize: 50,
          paginationSizeSelector: [5, 10, 20, 50, 100],
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 15,
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

          columnDefaults: {
            headerWordWrap: true,
            headerVertical: false,
            headerHozAlign: "center",
            minWidth: 100,
            vertAlign: "middle",
            resizable: true,

          },
          columns: [
            {
              title: "Thông tin sản phẩm",
              frozen: true,
              columns: [
                {
                  title: "STT", field: "STT", hozAlign: "center", resizable: true
                  //  frozen: true 
                },
                {
                  title: "Tên sản phẩm",
                  field: "OfficeSupplyName",

                  resizable: true,
                  variableHeight: true,
                  bottomCalc: "count",
                  formatter: "textarea",
                  // frozen: true
                },
                {
                  title: "Đơn vị",
                  field: "OfficeSupplyUnit",
                  resizable: true,
                  variableHeight: true,
                  bottomCalc: "count",
                  formatter: "textarea",
                  // frozen: true
                }
              ]
            },
            {
              title: "Số lượng",
              columns: [
                {
                  title: "Ban giám đốc", field: "GD", hozAlign: "right", resizable: true, sorter: "number", headerFilterParams: { "tristate": true },
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "HCNS", field: "HR", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Kế toán", field: "KT", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Mua hàng", field: "MH", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Phòng Marketing", field: "MKT", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Kinh doanh", field: "KD", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Kỹ thuật", field: "KYTHUAT", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Cơ khí- Thiết kế", field: "TKCK", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "AGV", field: "AGV", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Văn Phòng BN", field: "BN", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Văn Phòng HP", field: "HP", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Văn Phòng HCM", field: "HCM", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
                {
                  title: "Lắp ráp", field: "LR", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter
                },
              ],
            },
            {
              title: "",
              columns: [
                {
                  title: "Tổng", field: "TotalQuantity", hozAlign: "right", resizable: true,
                  bottomCalc: "sum", bottomCalcFormatter: quantityFormatter
                },
                {
                  title: "Đơn giá (VND)",
                  field: "UnitPrice",

                  resizable: true,
                  hozAlign: "right",
                  formatter: "money",
                  formatterParams: moneyFormatterParams,
                  bottomCalcFormatterParams: moneyFormatterParams
                },

                {
                  title: "Thành tiền (VND)",
                  field: "TotalPrice",
                  resizable: true,
                  hozAlign: "right",
                  formatter: "money",

                  // Thêm cái này vào để bỏ .00 ở từng ô
                  formatterParams: {
                    precision: 0,
                    thousand: ",",
                    symbol: "",
                    symbolAfter: true
                  },

                  bottomCalc: "sum",
                  bottomCalcFormatter: "money",
                  bottomCalcFormatterParams: {
                    precision: 0,
                    thousand: ",",
                    symbol: "",
                    symbolAfter: true
                  }
                },
                {
                  title: "Ghi chú",
                  field: "Note",
                  minWidth: 400,
                  resizable: true,
                  formatter: "textarea",
                  variableHeight: true
                },
              ],
            },
          ],
        });
        console.log('Bảng đã được khởi tạo');
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo bảng:', error);
      this.message.error('Có lỗi xảy ra khi khởi tạo bảng');
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  resetform(): void {
    this.searchParams = {
      year: new Date().getFullYear(),
      month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      departmentId: 0,
      keyword: ''
    }
    this.getDataOfficeSupplyRequestSummary();
  }

  createPriceRequest(): void {
    if (!this.table) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
      return;
    }

    // Lấy các dòng được chọn
    const selectedRows = this.table.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm muốn báo giá!');
      return;
    }

    // Hiển thị confirm dialog
    this.modalService.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có xác nhận yêu cầu báo giá những sản phẩm đã chọn?',
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.processPriceRequest(selectedRows);
      }
    });
  }

  private processPriceRequest(selectedRows: any[]): void {
    let countSTT = 0;
    const dataToSend: any[] = [];

    selectedRows.forEach((row) => {
      const rowData = row.getData();

      // Lấy các giá trị từ dữ liệu
      const totalQuantity = Number(rowData['TotalQuantity'] || 0);
      const quantityHCM = Number(rowData['HCM'] || 0);

      // Chỉ lấy dòng có totalQuantity - quantityHCM > 0
      if (totalQuantity - quantityHCM <= 0) {
        return;
      }

      countSTT++;

      // Tạo record mới theo format giống WinForm
      const record: any = {
        STT: countSTT,
        ProductCode: rowData['CodeRTC'] || rowData['ProductCode'] || '',
        ProductName: rowData['OfficeSupplyName'] || rowData['ProductName'] || '',
        Quantity: totalQuantity - quantityHCM,
        Unit: rowData['OfficeSupplyUnit'] || rowData['Unit'] || rowData['UnitCount'] || '',
        UnitCount: rowData['OfficeSupplyUnit'] || rowData['Unit'] || rowData['UnitCount'] || '',
        ProjectPartlistID: 0,
        UnitPrice: 0,
        TotalPrice: 0,
        SupplyUnitID: 0,
        Note: '',
        JobRequirementID: 0,
        IsJobRequirement: true,
        IsCommercialProduct: false
      };

      dataToSend.push(record);
    });

    if (dataToSend.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có sản phẩm nào thỏa mãn điều kiện (Tổng số lượng - Số lượng HCM > 0)!');
      return;
    }

    // Mở modal form yêu cầu báo giá
    const modalRef = this.ngbModal.open(ProjectPartlistPriceRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // Set các Input properties theo logic WinForm: frmProjectPartlistPriceRequestDetailNew(0,3)
    modalRef.componentInstance.dataInput = dataToSend;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = 0;
    modalRef.componentInstance.initialPriceRequestTypeID = 3; // Hàng HR (giống WinForm)
    modalRef.componentInstance.isVPP = true; // Set flag isVPP = true

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {

        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  viewPriceRequest(): void {
    // Mở new tab với ProjectPartlistPriceRequestComponent
    // Type = 3 (hàng HR) tương ứng với activeTabId = -2 (HCNS) theo mapping
    const title = 'Yêu cầu báo giá';
    const data = {
      initialTabId: -2, // -2 là tab HCNS (tương ứng với type = 3 hàng HR)
      isVPP: true
    };

    this.menuEventService.openNewTab(
      ProjectPartlistPriceRequestComponent,
      title,
      data
    );
  }

  createPurchaseRequest(): void {
    if (!this.table) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
      return;
    }

    // Lấy các dòng được chọn
    const selectedRows = this.table.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm muốn yêu cầu mua hàng!');
      return;
    }

    // Hiển thị confirm dialog
    this.modalService.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có xác nhận yêu cầu mua những sản phẩm đã chọn?',
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.processPurchaseRequest(selectedRows);
      }
    });
  }

  private processPurchaseRequest(selectedRows: any[]): void {
    // Xử lý từng dòng đã chọn - mở modal cho từng sản phẩm
    selectedRows.forEach((row) => {
      const rowData = row.getData();

      // Lấy các giá trị từ dữ liệu
      const codeRTC = rowData['CodeRTC'] || rowData['ProductCode'] || '';
      const unit = rowData['OfficeSupplyUnit'] || rowData['Unit'] || rowData['UnitCount'] || '';
      const totalQuantity = Number(rowData['TotalQuantity'] || 0);
      const totalPrice = Number(rowData['TotalPrice'] || 0);
      const unitPrice = Number(rowData['UnitPrice'] || 0);

      // Tạo object dữ liệu để truyền vào form purchase request
      const purchaseRequestData = {
        ID: 0,
        ProductCode: codeRTC,
        ProductName: rowData['OfficeSupplyName'] || rowData['ProductName'] || '',
        ProductSaleID: 0,
        ProductGroupID: 0,
        EmployeeID: 0,
        EmployeeIDRequestApproved: 0,
        Quantity: totalQuantity,
        UnitName: unit,
        UnitPrice: unitPrice,
        TotalPrice: totalPrice,
        DateReturnExpected: null,
        Note: '',
        IsTechBought: false
      };

      // Mở modal form yêu cầu mua hàng
      const modalRef = this.ngbModal.open(ProjectPartlistPurchaseRequestDetailComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });

      // Truyền dữ liệu vào component qua @Input projectPartlistDetail
      modalRef.componentInstance.projectPartlistDetail = purchaseRequestData;

      modalRef.result.then(
        (result) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Tạo yêu cầu mua hàng thành công!');
          // Có thể reload dữ liệu nếu cần
          // this.getDataOfficeSupplyRequestSummary();
        },
        (dismissed) => {
          console.log('Modal dismissed');
        }
      );
    });
  }

} 

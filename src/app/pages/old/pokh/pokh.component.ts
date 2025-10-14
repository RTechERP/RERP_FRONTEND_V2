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

import { PokhService } from './pokh-service/pokh.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { CustomerPartComponent } from '../customer-part/customer-part.component';
import { ViewPokhComponent } from '../view-pokh/view-pokh.component';
import { WarehouseReleaseRequestComponent } from '../warehouse-release-request/warehouse-release-request.component';
import { AppComponent } from '../../../app.component';
import { POKHControllerComponent } from '../pokh-control/pokh-control';
import { FollowProductReturnComponent } from '../follow-product-return/follow-product-return.component';
import { PoRequestBuyComponent } from '../po-request-buy/po-request-buy.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { PokhDetailComponent } from '../pokh-detail/pokh-detail.component';
@Component({
  selector: 'app-pokh',
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
  templateUrl: './pokh.component.html',
  styleUrl: './pokh.component.css',
})
export class PokhComponent implements OnInit, AfterViewInit {
  @ViewChild('addModalContent') addModalContent!: TemplateRef<any>;
  @ViewChild('tbProductDetailTreeList', { static: false })
  tbProductDetailTreeListElement!: ElementRef;
  @ViewChild('tbDetailUser', { static: false })
  tbDetailUserElement!: ElementRef;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private POKHService: PokhService,
    private modal: NzModalService,
    private customerPartService: CustomerPartService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private viewPOKHService: ViewPokhService
  ) {}

  //#region : Khai báo
  //Khai báo các bảng
  tb_POKH!: Tabulator;
  tb_POKHProduct!: Tabulator;
  tb_POKHFile!: Tabulator;
  tb_POKHDetailFile!: Tabulator;
  tb_ProductDetailTreeList!: Tabulator;
  tb_DetailUser!: Tabulator;
  private modalRef: any;

  //Lưu dữ liệu
  nextRowId: number = 0;
  dictDetailUser: { [key: number]: string } = {};
  deletedPOKHDetailIds: number[] = [];
  deletedDetailUserIds: number[] = [];
  deletedFileIds: number[] = [];
  selectedId: number = 0;
  selectedRow: any = null;
  filterUserData: any[] = [];
  filterEmployeeTeamSale: any[] = [];
  dataPOKH: any[] = [];
  dataPOKHProduct: any[] = [];
  dataPOKHFiles: any[] = [];
  dataPOKHDetailFile: any[] = [];
  dataCurrency: any[] = [];
  dataCustomers: any[] = [];
  dataUsers: any[] = [];
  dataProjects: any[] = [];
  dataPOTypes: any[] = [];
  dataParts: any[] = [];
  dataProducts: any[] = [];
  dataCurrencies: any[] = [];
  dataPOKHDetailUser: any[] = [];
  selectedCustomer: any = null;

  filters: any = {
    filterText: '',
    pageNumber: 1,
    pageSize: 50,
    customerId: 0,
    userId: 0,
    POType: 0,
    status: 0,
    group: 0,
    warehouseId: 1,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  //Mode
  isEditMode: boolean = false;
  isModalOpen: boolean = false;
  lockEvents: boolean = false;
  isResponsibleUsersEnabled: boolean = false;
  isCopy: boolean = false;

  //#endregion
  //#region : Hàm khởi tạo
  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadPOKH();
    this.loadCustomers();
    this.loadUser();
    this.loadEmployeeTeamSale();
    this.loadProjects();
    this.loadTypePO();

    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.drawPOKHTable();
    this.initProductTable();
    this.initFileTable();
  }
  //#endregion

  loadPOKH(): void {
    if (this.tb_POKH) {
      // Gọi setData() với tham số true để force reload data từ server
      this.tb_POKH.setData(null, true);
    }
  }

  getPOKHAjaxParams(): any {
    return (params: any) => {
      console.log('Params từ Tabulator:', params);

      return {
        filterText: this.filters.filterText || '',
        customerId: this.filters.customerId || 0,
        userId: this.filters.userId || 0,
        POType: this.filters.POType || 0,
        status: this.filters.status || 0,
        group: this.filters.group || 0,
        warehouseId: this.filters.warehouseId || 1,
        employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
        startDate:
          this.filters.startDate?.toISOString() || new Date().toISOString(),
        endDate:
          this.filters.endDate?.toISOString() || new Date().toISOString(),
      };
    };
  }
  loadCustomers(): void {
    this.customerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataCustomers = response.data;
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
        return;
      }
    );
  }

  loadProjects(): void {
    this.POKHService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataProjects = response.data;
        } else {
          this.notification.error('Lỗi khi tải dự án:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dự án:', error);
        return;
      }
    );
  }
  loadTypePO(): void {
    this.POKHService.getTypePO().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataPOTypes = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải loại PO: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải loại PO: ' + error
        );
      },
    });
  }

  loadPOKHProducts(id: number = 0, idDetail: number = 0): void {
    this.POKHService.getPOKHProduct(id, idDetail).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const flatData = response.data;
          const treeData = this.convertToTreeData(flatData);
          this.dataPOKHProduct = treeData;
          this.tb_POKHProduct.setData(this.dataPOKHProduct);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải chi tiết POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải chi tiết POKH: ' + error
        );
      },
    });
  }
  loadPOKHFiles(id: number = 0): void {
    this.POKHService.getPOKHFile(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataPOKHFiles = response.data;
          this.tb_POKHFile.setData(this.dataPOKHFiles);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // this.notification.error(
        //   'Thông báo',
        //   'Lỗi kết nối khi tải tệp POKH: ' + error
        // );
      },
    });
  }
  loadUser(): void {
    this.viewPOKHService.loadUser().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // this.notification.error(
        //   'Thông báo',
        //   'Lỗi kết nối khi tải tệp POKH: ' + error
        // );
      },
    });
  }
  loadEmployeeTeamSale(): void {
    this.viewPOKHService.loadEmployeeTeamSale().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterEmployeeTeamSale = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // this.notification.error(
        //   'Thông báo',
        //   'Lỗi kết nối khi tải tệp POKH: ' + error
        // );
      },
    });
  }
  loadProducts(): void {
    this.POKHService.loadProducts().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProducts = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải sản phẩm: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải sản phẩm: ' + error
        );
      },
    });
  }

  //#endregion

  //#region : Hàm xử lý duyệt và hủy duyệt
  handlePOKHApproval(isApprove: boolean) {
    if (!this.selectedId) {
      this.notification.error(
        'Lỗi',
        'Vui lòng chọn POKH cần duyệt hoặc hủy duyệt'
      );
      return;
    }

    // Kiểm tra trạng thái duyệt hiện tại
    const selectedPOKH = this.selectedRow;
    if (!selectedPOKH) {
      this.notification.error('Lỗi', 'Không tìm thấy thông tin POKH');
      return;
    }

    if (isApprove && selectedPOKH.IsApproved) {
      this.notification.info('Thông báo', 'POKH này đã được duyệt rồi!');
      return;
    }

    if (!isApprove && !selectedPOKH.IsApproved) {
      this.notification.info('Thông báo', 'POKH này chưa được duyệt!');
      return;
    }

    const confirmMessage = isApprove
      ? `Bạn có chắc chắn muốn DUYỆT - POKH ID: ${this.selectedId} ?`
      : `Bạn có chắc chắn muốn HỦY DUYỆT - POKH ID: ${this.selectedId} ?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requestBody = {
          POKH: {
            ID: this.selectedId,
            IsApproved: isApprove,
          },
          pOKHDetails: [],
          pOKHDetailsMoney: [],
        };

        this.POKHService.handlePOKH(requestBody).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                'Thông báo',
                isApprove
                  ? 'Duyệt POKH thành công'
                  : 'Hủy duyệt POKH thành công'
              );
              this.selectedId = 0;
              this.loadPOKH();
            } else {
              this.notification.error('Lỗi', 'Có lỗi xảy ra khi xử lý POKH');
            }
          },
          error: (error) => {
            this.notification.error(
              'Thông báo',
              'Error handling POKH: ' + error
            );
          },
        });
      },
    });
  }
  //#endregion
  //#region : Hàm xử lý upload files
  uploadFiles(pokhId: number) {
    const formData = new FormData();

    // Thêm từng file vào FormData
    this.dataPOKHDetailFile.forEach((fileObj: any) => {
      if (fileObj.file) {
        formData.append('files', fileObj.file);
      }
    });

    // Xử lý upload files mới
    if (this.dataPOKHDetailFile.length > 0) {
      this.POKHService.uploadFiles(formData, pokhId).subscribe({
        next: (response) => {
          console.log('Upload files thành công');
        },
        error: (error) => {
          this.notification.error('Thông báo', 'Lỗi upload files: ' + error);
        },
      });
    }

    // Xử lý xóa files
    if (this.deletedFileIds.length > 0) {
      this.POKHService.deleteFiles(this.deletedFileIds).subscribe({
        next: (response) => {
          this.deletedFileIds = [];
        },
        error: (error) => {
          this.notification.error('Lỗi xóa files:', error);
        },
      });
    }
  }
  //#endregion
  //#region : Hàm xử lý xuất excel PO
  async exportToExcel() {
    if (!this.tb_POKHProduct) {
      this.notification.warning(
        'Cảnh báo!',
        'Vui lòng chọn một PO để xuất Excel'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PO Details');

    // Get column definitions from the table
    const columns = this.tb_POKHProduct.getColumns();

    // Add headers
    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Function to process rows recursively
    const processRows = (rows: any[], level: number = 0) => {
      rows.forEach((row) => {
        const rowData = columns.map((col) => {
          const field = col.getField();
          return row.getData()[field];
        });

        // Add indentation for child rows
        if (level > 0) {
          rowData[0] = '  '.repeat(level) + rowData[0]; // Indent the first column (STT)
        }

        const excelRow = worksheet.addRow(rowData);

        // Add indentation style for child rows
        if (level > 0) {
          excelRow.font = { italic: true };
        }

        // Process child rows if they exist
        const children = row.getTreeChildren();
        if (children && children.length > 0) {
          processRows(children, level + 1);
        }
      });
    };

    // Start processing from root rows
    const rootRows = this.tb_POKHProduct
      .getRows()
      .filter((row) => !row.getTreeParent());
    processRows(rootRows);

    // Function to calculate total for a column including all children
    const calculateTotal = (column: any) => {
      let total = 0;
      const processRow = (row: any) => {
        const value = row.getData()[column.getField()];
        if (typeof value === 'number') {
          total += value;
        }
        const children = row.getTreeChildren();
        if (children && children.length > 0) {
          children.forEach(processRow);
        }
      };
      rootRows.forEach(processRow);
      return total;
    };

    // Add bottom calculations
    const bottomCalcRow = worksheet.addRow(
      columns.map((col) => {
        const column = col.getDefinition();
        if (column.bottomCalc) {
          const total = calculateTotal(col);

          // Format the total based on the column's formatter
          if (column.bottomCalcFormatter === 'money') {
            return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(total);
          }
          return total;
        }
        return '';
      })
    );

    // Style the bottom calc row
    bottomCalcRow.font = { bold: true };
    bottomCalcRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add a label for the total row
    const totalLabelCell = bottomCalcRow.getCell(1);
    totalLabelCell.value = 'Tổng cộng';
    totalLabelCell.font = { bold: true };

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_${this.selectedId}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  //#endregion
  //#region : Hàm xử lý xuất excel Phiếu
  async exportMainTableToExcel() {
    if (!this.tb_POKH) {
      this.notification.error('Lỗi', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('POKH List');

    // Get column definitions from the table
    const columns = this.tb_POKH.getColumns();

    // Add headers
    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Get current page data
    const currentPage = Number(this.tb_POKH.getPage());
    const pageSize = Number(this.tb_POKH.getPageSize());
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get all data and slice for current page
    const allData = this.tb_POKH.getData();
    const currentPageData = allData.slice(startIndex, endIndex);

    // Process rows
    currentPageData.forEach((rowData) => {
      const row = columns.map((col) => {
        const field = col.getField();
        const value = rowData[field];

        // Format boolean values
        if (typeof value === 'boolean') {
          return value ? 'Có' : 'Không';
        }

        // Format date values
        if (field === 'ReceivedDatePO' && value) {
          return new Date(value).toLocaleDateString('vi-VN');
        }

        // Format money values
        if (
          typeof value === 'number' &&
          (field === 'TotalMoneyPO' ||
            field === 'TotalMoneyKoVAT' ||
            field === 'ReceiveMoney' ||
            field === 'Debt')
        ) {
          return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        }

        return value;
      });

      worksheet.addRow(row);
    });

    // Add bottom calculations for money columns
    const bottomCalcRow = worksheet.addRow(
      columns.map((col) => {
        const column = col.getDefinition();
        if (column.bottomCalc) {
          // Calculate total for current page only
          let total = 0;
          currentPageData.forEach((rowData) => {
            const value = rowData[column.field as string];
            if (typeof value === 'number') {
              total += value;
            }
          });

          // Format the total based on the column's formatter
          if (column.bottomCalcFormatter === 'money') {
            return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(total);
          }
          return total;
        }
        return '';
      })
    );

    // Style the bottom calc row
    bottomCalcRow.font = { bold: true };
    bottomCalcRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add a label for the total row
    const totalLabelCell = bottomCalcRow.getCell(1);
    totalLabelCell.value = 'Tổng cộng';
    totalLabelCell.font = { bold: true };

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POKH_List_Page_${currentPage}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  //#endregion
  //#region : Hàm xử lý dữ liệu
  getTreeRows(data: any[]): any[] {
    let dataTree: any[] = [];

    data.forEach((row) => {
      const processedRow = {
        ...row,
        KHID: !row.KHID || Object.keys(row.KHID).length === 0 ? 0 : row.KHID,
        IndexPO:
          !row.IndexPO || Object.keys(row.IndexPO).length === 0
            ? null
            : row.IndexPO,
        RecivedMoneyDate:
          !row.RecivedMoneyDate ||
          Object.keys(row.RecivedMoneyDate).length === 0
            ? null
            : row.RecivedMoneyDate,
        BillDate:
          !row.BillDate || Object.keys(row.BillDate).length === 0
            ? null
            : row.BillDate,
        ActualDeliveryDate:
          !row.ActualDeliveryDate ||
          Object.keys(row.ActualDeliveryDate).length === 0
            ? null
            : row.ActualDeliveryDate,
        DeliveryRequestedDate:
          !row.DeliveryRequestedDate ||
          Object.keys(row.DeliveryRequestedDate).length === 0
            ? null
            : row.DeliveryRequestedDate,
        PayDate:
          !row.PayDate || Object.keys(row.PayDate).length === 0
            ? null
            : row.PayDate,
        CreatedDate:
          !row.CreatedDate || Object.keys(row.CreatedDate).length === 0
            ? null
            : row.CreatedDate,
        UpdatedDate:
          !row.UpdatedDate || Object.keys(row.UpdatedDate).length === 0
            ? null
            : row.UpdatedDate,
        QuotationDetailID: 0,
        QtyTT:
          !row.QtyTT || Object.keys(row.QtyTT).length === 0 ? 0 : row.QtyTT,
        QtyCL:
          !row.QtyCL || Object.keys(row.QtyCL).length === 0 ? 0 : row.QtyCL,
        IsExport:
          !row.IsExport || Object.keys(row.IsExport).length === 0
            ? false
            : row.IsExport,
        QtyRequest:
          !row.QtyRequest || Object.keys(row.QtyRequest).length === 0
            ? 0
            : row.QtyRequest,
        Note: !row.Note || Object.keys(row.Note).length === 0 ? '' : row.Note,
        CurrencyID:
          !row.CurrencyID || Object.keys(row.CurrencyID).length === 0
            ? null
            : row.CurrencyID,
        TT: !row.TT || Object.keys(row.TT).length === 0 ? '' : row.TT,
        ProjectPartListID:
          !row.ProjectPartListID ||
          Object.keys(row.ProjectPartListID).length === 0
            ? 0
            : row.ProjectPartListID,
        Spec: !row.Spec || Object.keys(row.Spec).length === 0 ? '' : row.Spec,
        ReceiveMoney:
          !row.ReceiveMoney || Object.keys(row.ReceiveMoney).length === 0
            ? 0
            : row.ReceiveMoney,
      };
      dataTree.push(processedRow);

      if (row._children && Array.isArray(row._children)) {
        dataTree = dataTree.concat(this.getTreeRows(row._children));
      }
    });
    return dataTree;
  }

  calculateTotalMoneyKoVAT() {
    let total = 0;
    const processRows = (rows: any[]) => {
      rows.forEach((row) => {
        total += Number(row.IntoMoney) || 0;
        if (row._children && Array.isArray(row._children)) {
          processRows(row._children);
        }
      });
    };
    processRows(this.tb_ProductDetailTreeList.getData());
    return total;
  }
  formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9-]/g, ''));
  };

  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }
  private getAllRowIds(row: any): number[] {
    const ids: number[] = [];
    const rowData = row.getData();

    if (rowData.ID) {
      ids.push(rowData.ID);
    }

    if (rowData._children && rowData._children.length > 0) {
      rowData._children.forEach((child: any) => {
        const childRow = {
          getData: () => child,
        };
        ids.push(...this.getAllRowIds(childRow));
      });
    }

    return ids;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  //#endregion
  //#region : Các hàm xử lý sự kiện

  onCopy(): void {
    if (this.selectedId > 0) {
      this.isCopy = true;
      this.isEditMode = true;
      this.openModal();
    } else {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn một bản ghi cần copy!'
      );
    }
  }
  onDelete(): void {
    if (!this.selectedRow) {
      this.notification.info('Thông báo', 'Vui lòng chọn một PO cần xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa PO này?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const pokhData = {
          ID: this.selectedRow['ID'],
          IsDeleted: true,
        };

        this.POKHService.handlePOKH({
          POKH: pokhData,
          pOKHDetails: [],
          pOKHDetailsMoney: [],
        }).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thông báo', 'Xóa PO thành công');
              this.loadPOKH();
              this.selectedRow = null;
              this.selectedId = 0;
            } else {
              this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa PO');
            }
          },
          error: (error) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa PO');
            console.error(error);
          },
        });
      },
    });
  }

  openFollowProductReturnModal() {
    const modalRef = this.modalService.open(FollowProductReturnComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
  }
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        if (fileObj.size > MAX_FILE_SIZE) {
          this.notification.error(
            'Thông báo',
            `File ${fileObj.name} vượt quá giới hạn dung lượng cho phép (50MB)`
          );
          return;
        }
        this.addFileToTable(fileObj);
      });
      // this.fileInput.nativeElement.value = '';
    }
  }

  addRowDetailUser(): void {
    const newRow = {
      ResponsibleUser: '',
      PercentUser: 0,
      MoneyUser: 0,
    };
    this.dataPOKHDetailUser = [...this.dataPOKHDetailUser, newRow];
    if (this.tb_DetailUser) {
      this.tb_DetailUser.setData(this.dataPOKHDetailUser);
    }
  }

  addFileToTable(file: File): void {
    const newFile = {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.name),
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      file: file, // Lưu file gốc
    };
    this.dataPOKHDetailFile = [...this.dataPOKHDetailFile, newFile];
    if (this.tb_POKHDetailFile) {
      this.tb_POKHDetailFile.setData(this.dataPOKHDetailFile);
    }
  }
  // deleteFile(index: number): void {
  //   if (confirm('Bạn có chắc chắn muốn xóa file này?')) {
  //     this.dataPOKHDetailFile.splice(index, 1);
  //     if (this.tb_POKHDetailFile) {
  //       this.tb_POKHDetailFile.setData(this.dataPOKHDetailFile);
  //     }
  //   }
  // }

  searchPOKH() {
    this.loadPOKH();
  }
  // Thêm hàm xử lý khi bấm Thêm mới
  onAdd(): void {
    this.isEditMode = false;
    this.selectedId = 0;
    this.openModal();
  }
  onEdit(): void {
    if (this.selectedId > 0) {
      this.isEditMode = true;
      this.openModal();
    } else {
      this.notification.info('Thông báo', 'Vui lòng chọn một bản ghi cần sửa!');
    }
  }
  //#endregion
  //#region : Các hàm xử lý modal
  openModalViewPOKH() {
    this.modalService.open(ViewPokhComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
  }
  openWarehouseReleaseRequestModal() {
    this.modalService.open(WarehouseReleaseRequestComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'full-screen-modal',
    });
  }
  openPORequestBuyModal() {
    if (!this.selectedId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn POKH trước!');
      return;
    }

    const modalRef = this.modalService.open(PoRequestBuyComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.pokhId = this.selectedId;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Handle successful modal close if needed
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
  }
  openModal() {
    this.isModalOpen = true;
    this.modalRef = this.modalService.open(PokhDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
    });

    // Truyền dữ liệu sang modal con
    this.modalRef.componentInstance.isEditMode = this.isEditMode;
    this.modalRef.componentInstance.selectedId = this.selectedId;
  }

  //#endregion
  //#region : Các hàm vẽ bảng
  drawPOKHTable(): void {
    this.tb_POKH = new Tabulator(`#tb_POKH`, {
      layout: 'fitDataFill',
      height: '87vh',
      selectableRows: 1,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      ajaxURL: this.POKHService.getPOKHAjax(),
      ajaxParams: this.getPOKHAjaxParams(),
      ajaxResponse: (url, params, res) => {
        console.log('total', res.totalPages[0].TotalPage);
        console.log('data', res.data);
        return {
          data: res.data,
          last_page: res.totalPages[0].TotalPage,
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
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 80,
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          sorter: 'string',
          width: 150,
        },
        { title: 'Loại', field: 'MainIndex', sorter: 'string', width: 70 },
        {
          title: 'New Account',
          field: 'NewAccount',
          sorter: 'boolean',
          width: 100,
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        { title: 'Số POKH', field: 'ID', sorter: 'number', width: 100 },
        { title: 'Mã PO', field: 'POCode', sorter: 'string', width: 150 },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        { title: 'Dự án', field: 'ProjectName', sorter: 'string', width: 200 },
        {
          title: 'Ngày nhận PO',
          field: 'ReceivedDatePO',
          sorter: 'date',
          width: 150,
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyCode',
          sorter: 'string',
          width: 80,
        },
        {
          title: 'Tổng tiền Xuất VAT',
          field: 'TotalMoneyKoVAT',
          sorter: 'number',
          width: 150,
          formatter: 'money',
        },
        {
          title: 'Tổng tiền nhận PO',
          field: 'TotalMoneyPO',
          sorter: 'number',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tiền về',
          field: 'ReceiveMoney',
          sorter: 'number',
          width: 150,
          formatter: 'money',
        },
        {
          title: 'Tình trạng tiến độ giao hàng',
          field: 'DeliveryStatusText',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Tình trạng xuất kho',
          field: 'ExportStatusText',
          sorter: 'string',
          width: 150,
        },
        { title: 'End User', field: 'EndUser', sorter: 'string', width: 150 },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 120 },
        {
          title: 'Công nợ',
          field: 'Debt',
          sorter: 'number',
          width: 120,
          formatter: 'money',
        },
        {
          title: 'Hóa đơn',
          field: 'ImportStatus',
          sorter: 'string',
          width: 150,
        },
        { title: 'Đặt hàng', field: 'PONumber', sorter: 'string', width: 150 },
      ],
    });

    // Thêm sự kiện khi chuyển trang
    this.tb_POKH.on('pageLoaded', (pageno: number) => {
      this.filters.pageNumber = pageno;
      console.log('Trang hiện tại:', pageno);
    });

    // Thêm sự kiện khi thay đổi kích thước trang
    this.tb_POKH.on('pageSizeChanged', (size: number) => {
      this.filters.pageSize = size;
      console.log('Kích thước trang:', size);
    });

    this.tb_POKH.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      const id = row.getData()['ID'];
      this.selectedId = id;
      console.log('selectedId: ', this.selectedId);
      this.onEdit();
    });
    this.tb_POKH.on('rowClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedId = rowData['ID'];
      this.selectedRow = rowData;
      this.loadPOKHProducts(this.selectedId);
      this.loadPOKHFiles(this.selectedId);
    });
  }

  initProductTable(): void {
    this.tb_POKHProduct = new Tabulator(`#tb_POKHProduct`, {
      data: this.dataPOKHProduct,
      dataTree: true,
      layout: 'fitDataFill',
      dataTreeStartExpanded: true,
      pagination: true,
      paginationSize: 10,
      height: '55vh',
      movableColumns: true,
      resizableRows: true,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          sorter: 'number',
          width: 70,
          frozen: true,
        },
        {
          title: 'Mã Nội Bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 100,
          frozen: true,
        },
        {
          title: 'Mã Sản Phẩm (Cũ)',
          field: 'ProductCode',
          sorter: 'string',
          width: 100,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Mã theo khách',
          field: 'GuestCode',
          sorter: 'string',
          width: 200,
        },
        { title: 'Hãng', field: 'Maker', sorter: 'string', width: 100 },
        {
          title: 'Số lượng',
          field: 'Qty',
          sorter: 'number',
          width: 100,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.Qty) {
                total += Number(row.Qty);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'SL đã về',
          field: 'QuantityReturn',
          sorter: 'number',
          width: 100,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.QuantityReturn) {
                total += Number(row.QuantityReturn);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'SL đã xuất',
          field: 'QuantityExport',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'SL còn lại',
          field: 'QuantityRemain',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Kích thước phim cắt/Model',
          field: 'FilmSize',
          sorter: 'string',
          width: 150,
        },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 100 },
        {
          title: 'Đơn giá trước VAT',
          field: 'UnitPrice',
          sorter: 'number',
          width: 200,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng tiền trước VAT',
          field: 'IntoMoney',
          sorter: 'number',
          width: 200,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.IntoMoney) {
                total += Number(row.IntoMoney);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'VAT (%)',
          field: 'VAT',
          sorter: 'number',
          width: 150,
          formatter: function (cell) {
            return cell.getValue() + '%';
          },
        },
        {
          title: 'Tổng tiền sau VAT',
          field: 'TotalPriceIncludeVAT',
          sorter: 'number',
          width: 200,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.TotalPriceIncludeVAT) {
                total += Number(row.TotalPriceIncludeVAT);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Người nhận',
          field: 'UserReceiver',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Ngày yêu cầu giao hàng',
          field: 'DeliveryRequestedDate',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Thanh toán dự kiến',
          field: 'EstimatedPay',
          sorter: 'number',
          width: 200,
        },
        {
          title: 'Ngày hóa đơn',
          field: 'BillDate',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Số hóa đơn',
          field: 'BillNumber',
          sorter: 'string',
          width: 200,
        },
        { title: 'Công nợ', field: 'Debt', sorter: 'number', width: 200 },
        {
          title: 'Ngày yêu cầu thanh toán',
          field: 'PayDate',
          sorter: 'string',
          width: 200,
        },
        { title: 'Nhóm', field: 'GroupPO', sorter: 'string', width: 100 },
        {
          title: 'Ngày giao hàng thực tế',
          field: 'ActualDeliveryDate',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Ngày tiền về',
          field: 'RecivedMoneyDate',
          sorter: 'string',
          width: 200,
        },
      ],
    });
  }
  initFileTable(): void {
    this.tb_POKHFile = new Tabulator(`#tb_POKHFile`, {
      data: this.dataPOKHFiles,
      layout: 'fitDataFill',
      pagination: true,
      paginationSize: 5,
      height: '30vh',
      movableColumns: true,
      resizableRows: true,
      columns: [
        {
          title: 'STT',
          formatter: 'rownum',
          width: '10%',
          hozAlign: 'center',
          headerSort: false,
        },
        {
          title: 'Tên file',
          field: 'FileName',
          sorter: 'string',
          width: '90%',
        },
      ],
    });
  }

  //#endregion

  // Hàm flatten dữ liệu chi tiết sản phẩm (tree -> flat array)
  flattenDetails(details: any[], flatList: any[] = [], parentId: number = 0) {
    details.forEach((item) => {
      // Nếu đã có ID âm thì giữ nguyên, nếu không thì tạo mới
      let tempId = item.ID;
      if (!tempId || tempId > 0) {
        tempId = Math.floor(Math.random() * -1000000); // ID âm tạm thời
      }
      flatList.push({
        ...item,
        ID: tempId,
        ParentID: parentId ?? 0,
      });
      if (item._children && item._children.length > 0) {
        this.flattenDetails(item._children, flatList, tempId);
      }
    });
    return flatList;
  }
}

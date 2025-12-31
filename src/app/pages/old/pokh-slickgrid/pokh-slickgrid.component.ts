import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  Optional,
  Inject,
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
// import {
//   TabulatorFull as Tabulator,
//   RowComponent,
//   CellComponent,
// } from 'tabulator-tables';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnEventArgs,
  SlickGrid,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MultipleSelectOption,
} from 'angular-slickgrid';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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

import { PokhSlickgridService } from './pokh-slickgrid-service/pokh-slickgrid.service';
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
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PoRequestPriceRtcComponent } from '../po-request-price-rtc/po-request-price-rtc.component';
import { HistoryMoneyComponent } from '../history-money/history-money.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
// import { setupTabulatorCellCopy } from '../../../shared/utils/tabulator-cell-copy.util';
import { ActivatedRoute } from '@angular/router';
import { ProjectPartlistPurchaseRequestNewComponent } from '../../purchase/project-partlist-purchase-request-new/project-partlist-purchase-request-new.component';
import { ProjectPartListPurchaseRequestSlickGridComponent } from '../../purchase/project-partlist-purchase-request/project-part-list-purchase-request-slick-grid/project-part-list-purchase-request-slick-grid.component';
import { WarehouseReleaseRequestSlickGridComponent } from '../warehouse-release-request-slick-grid/warehouse-release-request-slick-grid.component';
import { PoRequestBuySlickgridComponent } from '../po-request-buy-slickgrid/po-request-buy-slickgrid.component';
@Component({
  selector: 'app-pokh-slickgrid',
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
    HasPermissionDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './pokh-slickgrid.component.html',
  styleUrl: './pokh-slickgrid.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PokhSlickgridComponent implements OnInit, AfterViewInit {
  @ViewChild('addModalContent') addModalContent!: TemplateRef<any>;
  // @ViewChild('tbProductDetailTreeList', { static: false })
  // tbProductDetailTreeListElement!: ElementRef;
  // @ViewChild('tbDetailUser', { static: false })
  // tbDetailUserElement!: ElementRef;
  // @ViewChild('tb_POKH', { static: false })
  // tb_POKHElement!: ElementRef;
  // @ViewChild('tb_POKHProduct', { static: false })
  // tb_POKHProductElement!: ElementRef;
  // @ViewChild('tb_POKHFile', { static: false })
  // tb_POKHFileElement!: ElementRef;

  // SlickGrid properties for POKH table
  angularGridPOKH!: AngularGridInstance;
  columnDefinitionsPOKH: Column[] = [];
  gridOptionsPOKH: GridOption = {};
  datasetPOKH: any[] = [];

  // SlickGrid properties for POKHProduct table (Tree Data)
  angularGridPOKHProduct!: AngularGridInstance;
  columnDefinitionsPOKHProduct: Column[] = [];
  gridOptionsPOKHProduct: GridOption = {};
  datasetPOKHProduct: any[] = [];

  // SlickGrid properties for POKHFile table
  angularGridPOKHFile!: AngularGridInstance;
  columnDefinitionsPOKHFile: Column[] = [];
  gridOptionsPOKHFile: GridOption = {};
  datasetPOKHFile: any[] = [];
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private POKHService: PokhSlickgridService,
    private modal: NzModalService,
    private customerPartService: CustomerPartService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private viewPOKHService: ViewPokhService,
    private route: ActivatedRoute
  ) { }

  //#region : Khai báo
  //Khai báo các bảng (commented out old Tabulator)
  // tb_POKH!: Tabulator;
  // tb_POKHProduct!: Tabulator;
  // tb_POKHFile!: Tabulator;
  // tb_POKHDetailFile!: Tabulator;
  // tb_ProductDetailTreeList!: Tabulator;
  // tb_DetailUser!: Tabulator;
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
  mainIndexes: any[] = [];
  warehouseId: number = 0;
  filters: any = {
    filterText: '',
    pageNumber: 1,
    pageSize: 50,
    customerId: 0,
    userId: 0,
    POType: 0,
    status: 0,
    group: 0,
    warehouseId: 0,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  totalPage: number = 1;
  readonly pageSizeOptions: number[] = [10, 30, 50, 100, 300, 500, 999999];

  //Mode
  isEditMode: boolean = false;
  isModalOpen: boolean = false;
  lockEvents: boolean = false;
  isResponsibleUsersEnabled: boolean = false;
  isCopy: boolean = false;

  //#endregion
  //#region : Hàm khởi tạo
  ngOnInit(): void {
    // if (this.tabData?.warehouseId) {
    //     this.filters.warehouseId = this.tabData.warehouseId;
    // }

    this.route.queryParams.subscribe(params => {
      this.filters.warehouseId = params['warehouseId'] || 1
      // this.warehouseType = params['warehouseType'] || 1;
    });
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    startDate.setHours(0, 0, 0, 0);

    this.filters.startDate = startDate;
    this.filters.endDate = endDate;

    // Initialize SlickGrid tables (like payment-order)
    this.initGridPOKH();
    this.initGridPOKHProduct();
    this.initGridPOKHFile();

    // Load lookup data
    this.loadCustomers();
    this.loadUser();
    this.loadEmployeeTeamSale();
    this.loadProjects();
    this.loadTypePO();
    this.loadFilterMainIndexes();
    this.loadCurrencies();
    this.loadProducts();
  }

  ngAfterViewInit(): void {
  }
  //#endregion

  loadPOKH(): void {
    const params = this.getPOKHAjaxParamsObject();
    this.POKHService.getPOKHData(params).subscribe({
      next: (response: any) => {
        this.updatePaginationFromResponse(response);
        if (response.data && Array.isArray(response.data)) {
          this.datasetPOKH = response.data.map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`
          }));
        } else {
          this.datasetPOKH = [];
        }

        setTimeout(() => {
          this.applyDistinctFiltersToGrid(this.angularGridPOKH, this.columnDefinitionsPOKH, ['MainIndex', 'CurrencyCode']);
        }, 0);
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu POKH: ' + error);
      }
    });
  }

  private updatePaginationFromResponse(response: any): void {
    const apiTotalPage = Number(response?.totalPages?.[0]?.TotalPage);
    this.totalPage = Number.isFinite(apiTotalPage) && apiTotalPage > 0 ? apiTotalPage : 1;

    const currentPage = Number(this.filters?.pageNumber) || 1;
    if (currentPage > this.totalPage) {
      this.filters.pageNumber = this.totalPage;
    }
    if (currentPage < 1) {
      this.filters.pageNumber = 1;
    }
  }

  getPOKHAjaxParamsObject(): any {
    const formatDateToLocalISO = (date: Date, isStartDate: boolean = true): string => {
      const dateCopy = new Date(date);
      if (isStartDate) {
        dateCopy.setHours(0, 0, 0, 0);
      } else {
        dateCopy.setHours(23, 59, 59, 999);
      }
      const timezoneOffset = dateCopy.getTimezoneOffset();
      const adjustedDate = new Date(dateCopy.getTime() - timezoneOffset * 60 * 1000);
      return adjustedDate.toISOString();
    };

    const startDate = this.filters.startDate || new Date();
    const endDate = this.filters.endDate || new Date();

    return {
      filterText: (this.filters.filterText || '').trim(),
      customerId: this.filters.customerId || 0,
      userId: this.filters.userId || 0,
      POType: this.filters.status || 0,
      status: 0,
      group: this.filters.group || 0,
      warehouseId: this.filters.warehouseId || 1,
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      startDate: formatDateToLocalISO(startDate, true),
      endDate: formatDateToLocalISO(endDate, false),
      page: this.filters.pageNumber || 1,
      size: this.filters.pageSize || 50,
    };
  }

  getPOKHAjaxParams(): any {
    return (params: any) => {
      console.log('Params từ Tabulator:', params);

      const formatDateToLocalISO = (
        date: Date,
        isStartDate: boolean = true
      ): string => {
        const dateCopy = new Date(date);

        if (isStartDate) {
          dateCopy.setHours(0, 0, 0, 0);
        } else {
          dateCopy.setHours(23, 59, 59, 999);
        }

        const timezoneOffset = dateCopy.getTimezoneOffset();

        const adjustedDate = new Date(
          dateCopy.getTime() - timezoneOffset * 60 * 1000
        );

        return adjustedDate.toISOString();
      };

      const startDate = this.filters.startDate || new Date();
      const endDate = this.filters.endDate || new Date();

      return {
        filterText: (this.filters.filterText || '').trim(),
        customerId: this.filters.customerId || 0,
        userId: this.filters.userId || 0,
        POType: this.filters.status || 0,
        // status: this.filters.status || 0,
        status: 0,
        group: this.filters.group || 0,
        warehouseId: this.filters.warehouseId || 1,
        employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
        startDate: formatDateToLocalISO(startDate, true),
        endDate: formatDateToLocalISO(endDate, false),
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

  loadFilterMainIndexes(): void {
    this.viewPOKHService.loadMainIndex().subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainIndexes = response.data;
          console.log('main', this.mainIndexes);
        } else {
          this.notification.error('Lỗi khi tải Lọc:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Lọc:', error);
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
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải loại PO: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải loại PO: ' + error
        );
      },
    });
  }

  loadCurrencies(): void {
    this.POKHService.getCurrency().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataCurrencies = response.data;
          console.log('currencies', this.dataCurrencies);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải loại tiền: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải loại tiền: ' + error
        );
      },
    });
  }

  loadPOKHProducts(id: number = 0, idDetail: number = 0): void {
    this.POKHService.getPOKHProduct(id, idDetail).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const flatData = response.data;
          this.datasetPOKHProduct = flatData.map((item: any) => ({
            ...item,
            id: item.ID,
            parentId: item.ParentID === 0 ? null : item.ParentID
          }));
          
          setTimeout(() => {
            this.applyDistinctFiltersToGrid(this.angularGridPOKHProduct, this.columnDefinitionsPOKHProduct, ['Maker', 'Unit']);
          }, 500);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải chi tiết POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
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
          // Update SlickGrid dataset
          this.datasetPOKHFile = this.dataPOKHFiles.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1
          }));
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // Silent error
      },
    });
  }
  loadUser(): void {
    this.viewPOKHService.loadUser().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
          //   console.log("user", this.filterUserData)
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
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
            NOTIFICATION_TITLE.error,
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
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải sản phẩm: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
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
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy thông tin POKH'
      );
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
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Có lỗi xảy ra khi xử lý POKH'
              );
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
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi upload files: ' + error
          );
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
  //#region : Hàm xử lý xuất excel PO (SlickGrid version)
  async exportToExcel() {
    if (!this.datasetPOKHProduct || this.datasetPOKHProduct.length === 0) {
      this.notification.warning('Cảnh báo!', 'Vui lòng chọn một PO để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PO Details');

    // Add headers from SlickGrid column definitions
    const headers = this.columnDefinitionsPOKHProduct.map((col: any) => col.name);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Add data rows from SlickGrid dataset
    this.datasetPOKHProduct.forEach((rowData: any) => {
      const row = this.columnDefinitionsPOKHProduct.map((col: any) => {
        const value = rowData[col.field];
        if (typeof value === 'number') {
          return new Intl.NumberFormat('vi-VN').format(value);
        }
        return value ?? '';
      });
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => { column.width = 15; });

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_${this.selectedId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }


  //#region : Hàm xử lý xuất excel Phiếu (SlickGrid version)
  async exportMainTableToExcel() {
    if (!this.datasetPOKH || this.datasetPOKH.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('POKH List');

    // Add headers from SlickGrid column definitions
    const headers = this.columnDefinitionsPOKH.map((col: any) => col.name);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Add data rows from SlickGrid dataset
    this.datasetPOKH.forEach((rowData: any) => {
      const row = this.columnDefinitionsPOKH.map((col: any) => {
        const value = rowData[col.field];
        if (typeof value === 'boolean') {
          return value ? 'Có' : 'Không';
        }
        if (typeof value === 'number') {
          return new Intl.NumberFormat('vi-VN').format(value);
        }
        return value ?? '';
      });
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => { column.width = 15; });

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POKH_List_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    // Updated for SlickGrid - use datasetPOKHProduct instead of tb_ProductDetailTreeList
    processRows(this.datasetPOKHProduct);
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

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  openHistoryMoneyModal(): void {
    if (!this.selectedId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn POKH cần xem lịch sử tiền về'
      );
      return;
    }
    const modalRef = this.modalService.open(HistoryMoneyComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    if (this.selectedRow && this.selectedRow['POCode']) {
      modalRef.componentInstance.filterText = this.selectedRow['POCode'];
    }

    modalRef.result.then(
      (result: any) => {
        console.log('History money modal closed:', result);
      },
      (reason: any) => {
        console.log('History money modal dismissed:', reason);
      }
    );
  }

  openProjectPartlistPurchaseRequest(): void {
    if (!this.selectedId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn POKH trước!'
      );
      return;
    }
    this.modalRef = this.modalService.open(ProjectPartListPurchaseRequestSlickGridComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
    this.modalRef.componentInstance.pokhIdFilter = this.selectedId;
    this.modalRef.componentInstance.listRequestBuySelect = true;
  }

  openProjectPartlistPriceRequestNew(): void {
    if (!this.selectedId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn POKH trước!'
      );
      return;
    }
    this.modalRef = this.modalService.open(ProjectPartlistPriceRequestNewComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
    this.modalRef.componentInstance.poKHID = this.selectedId;
    this.modalRef.componentInstance.isFromPOKH = true;
  }

  private getContextMenuOptions(): MenuCommandItem[] {
    return [
      {
        iconCssClass: 'fas fa-eye',
        title: 'Lịch sử tiền về',
        command: 'history-money',
        positionOrder: 60,
      },
      {
        iconCssClass: 'fas fa-eye',
        title: 'Danh sách yêu cầu mua hàng',
        command: 'purchase-request',
        positionOrder: 61,
      },
      {
        iconCssClass: 'fas fa-eye',
        title: 'Danh sách yêu cầu báo giá',
        command: 'price-request',
        positionOrder: 62,
      },
    ];
  }

  private getContextFileMenuOptions(): MenuCommandItem[] {
    return [
      {
        iconCssClass: 'fas fa-file-download',
        title: 'Tải file',
        command: 'download-file',
        positionOrder: 60,
      },
    ];
  }

  handleContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'history-money':
        this.openHistoryMoneyModal();
        break;
      case 'purchase-request':
        this.openProjectPartlistPurchaseRequest();
        break;
      case 'price-request':
        this.openProjectPartlistPriceRequestNew();
        break;
    }
  }

  handleContextFileMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
    const command = args.command;
    const dataContext = args.dataContext;

    if (command === 'download-file') {
      const fileId = dataContext['ID'];
      const fileName = dataContext['FileName'] || `file_${fileId}`;

      if (fileId) {
        this.POKHService.downloadFile(fileId).subscribe({
          next: (blob: Blob) => {
            if (blob.type === 'application/json' || blob.size === 0) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const json = JSON.parse(reader.result as string);
                  if (json?.status === 0) {
                    this.notification.error(
                      NOTIFICATION_TITLE.error,
                      json.message || 'Không thể tải file!'
                    );
                    return;
                  }
                } catch {
                  this.downloadBlob(blob, fileName);
                }
              };
              reader.readAsText(blob);
            } else {
              this.downloadBlob(blob, fileName);
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi tải file: ' + (error?.message || error)
            );
            console.error('Error downloading file:', error);
          },
        });
      } else {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không tìm thấy ID file để tải!'
        );
      }
    }
  }

  openModalViewPOKH() {
    this.modalRef = this.modalService.open(ViewPokhComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
    this.modalRef.componentInstance.warehouseId = this.filters.warehouseId;
  }

  openWarehouseReleaseRequestModal() {
    // this.modalRef = this.modalService.open(WarehouseReleaseRequestComponent, {
    //   centered: true,
    //   backdrop: 'static',
    //   windowClass: 'full-screen-modal',
    // });
    // this.modalRef.componentInstance.warehouseId = this.filters.warehouseId;

    this.modalRef = this.modalService.open(WarehouseReleaseRequestSlickGridComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'full-screen-modal',
    });
    this.modalRef.componentInstance.warehouseId = this.filters.warehouseId;
  }

  // openPORequestBuyModal() {
  //   if (!this.selectedId) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng chọn POKH trước!'
  //     );
  //     return;
  //   }
  //   const modalRef = this.modalService.open(PoRequestBuyComponent, {
  //           centered: true,
  //           backdrop: 'static',
  //           windowClass: 'full-screen-modal',
  //       });
  //       modalRef.componentInstance.pokhId = this.selectedId;

  //       modalRef.result.then(
  //           (result) => {
  //               if (result) {
  //               }
  //           },
  //           (reason) => {
  //               console.log('Modal dismissed');
  //           }
  //       );
  // }
  
  openPORequestBuyModal() {
    if (!this.selectedId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn POKH trước!'
      );
      return;
    }
    const modalRef = this.modalService.open(PoRequestBuySlickgridComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.pokhId = this.selectedId;

    modalRef.result.then(
      (result) => {
        if (result) {
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
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
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa PO thành công'
              );
              this.loadPOKH();
              // SlickGrid data is reactive, no need to manually setData
              this.selectedRow = null;
              this.selectedId = 0;
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Có lỗi xảy ra khi xóa PO'
              );
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Có lỗi xảy ra khi xóa PO'
            );
            console.error(error);
          },
        });
      },
    });
  }

  openPORequestPriceRTC() {
    if (!this.selectedId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn POKH trước!');
      return;
    }
    this.isModalOpen = true;
    this.modalRef = this.modalService.open(PoRequestPriceRtcComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
    });

    // Truyền dữ liệu sang modal con
    this.modalRef.componentInstance.id = this.selectedId;

    this.modalRef.result.then(
      (result: any) => {
        console.log('result: ', result);
        if (result.success) {
        }
      },
      (reason: any) => {
        console.log('Modal dismissed:', reason);
      }
    );
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
            NOTIFICATION_TITLE.error,
            `File ${fileObj.name} vượt quá giới hạn dung lượng cho phép (50MB)`
          );
          return;
        }
        this.addFileToTable(fileObj);
      });
      // this.fileInput.nativeElement.value = '';
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
    // SlickGrid uses reactive data binding, no need to manually setData
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
    this.filters.pageNumber = 1;
    this.loadPOKH();
  }

  prevPage(): void {
    const current = Number(this.filters.pageNumber) || 1;
    if (current <= 1) return;
    this.filters.pageNumber = current - 1;
    this.loadPOKH();
  }

  nextPage(): void {
    const current = Number(this.filters.pageNumber) || 1;
    if (current >= this.totalPage) return;
    this.filters.pageNumber = current + 1;
    this.loadPOKH();
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(Number(page) || 1, 1), this.totalPage || 1);
    this.filters.pageNumber = next;
    this.loadPOKH();
  }

  onPageSizeChange(size: number): void {
    const nextSize = Number(size) || 50;
    this.filters.pageSize = nextSize;
    this.filters.pageNumber = 1;
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

  private getContextMenu(): any[] {
    return [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i> Lịch sử tiền về</span>',
        action: () => this.openHistoryMoneyModal(),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i> Danh sách yêu cầu mua hàng</span>',
        action: () => this.openProjectPartlistPurchaseRequest(),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i> Danh sách yêu cầu báo giá</span>',
        action: () => this.openProjectPartlistPriceRequestNew(),
      },
    ];
  }

  private getContextFileMenu(): any[] {
    return [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-file-download"></i> Tải file</span>',
        action: (e: any, row: any) => {
          const rowData = row;
          const fileId = rowData['ID'];
          const fileName = rowData['FileName'] || `file_${fileId}`;

          if (fileId) {
            this.POKHService.downloadFile(fileId).subscribe({
              next: (blob: Blob) => {
                // Kiểm tra nếu blob thực ra chứa lỗi dạng JSON
                if (blob.type === 'application/json' || blob.size === 0) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const json = JSON.parse(reader.result as string);
                      if (json?.status === 0) {
                        this.notification.error(
                          NOTIFICATION_TITLE.error,
                          json.message || 'Không thể tải file!'
                        );
                        return;
                      }
                    } catch {
                      // Nếu không parse được JSON, có thể là file thật
                      this.downloadBlob(blob, fileName);
                    }
                  };
                  reader.readAsText(blob);
                } else {
                  // Blob hợp lệ, tải xuống
                  this.downloadBlob(blob, fileName);
                }
              },
              error: (error) => {
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  'Lỗi khi tải file: ' + (error?.message || error)
                );
                console.error('Error downloading file:', error);
              },
            });
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Không tìm thấy ID file để tải!'
            );
          }
        },
      },
    ];
  }

  openModal() {
    this.isModalOpen = true;
    this.modalRef = this.modalService.open(PokhDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      // size: 'xl',
      windowClass: 'full-screen-modal',
      // windowClass: 'full-screen-modal',
    });

    // Truyền dữ liệu sang modal con
    this.modalRef.componentInstance.isEditMode = this.isEditMode;
    this.modalRef.componentInstance.selectedId = this.selectedId;
    this.modalRef.componentInstance.warehouseId = this.filters.warehouseId;
    this.modalRef.componentInstance.isCopy = this.isCopy;

    this.modalRef.result.then(
      (result: any) => {
        console.log('result: ', result);
        if (result.success) {
          this.loadPOKH();
          // SlickGrid data is reactive, no need to manually setData
        }
        this.isCopy = false;
      },
      (reason: any) => {
        console.log('Modal dismissed:', reason);
        this.isCopy = false;
      }
    );
  }

  //#endregion
  //#region : Các hàm vẽ bảng SlickGrid

  dateFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  moneyFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  checkboxFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    const checked = value ? 'checked' : '';
    return `<div style="text-align: center;">
      <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
    </div>`;
  }

  initGridPOKH(): void {
    this.columnDefinitionsPOKH = [
      { id: 'IsApproved', name: 'Duyệt', field: 'IsApproved', width: 80, minWidth: 50, formatter: this.checkboxFormatter, sortable: true, filterable: true, filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Đã duyệt' }, { value: false, label: 'Chưa duyệt' }] } },
      { id: 'StatusTextNew', name: 'Trạng thái', field: 'StatusTextNew', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'MainIndex',
        name: 'Loại',
        field: 'MainIndex',
        width: 200,
        minWidth: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: {
            addBlankEntry: true
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        }
      },
      { id: 'NewAccount', name: 'New Account', field: 'NewAccount', width: 100, minWidth: 70, formatter: this.checkboxFormatter, sortable: true, filterable: true, filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] } },
      { id: 'PONumber', name: 'Số POKH', field: 'PONumber', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'POCode', name: 'Mã PO', field: 'POCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', width: 300, minWidth: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'FullName', name: 'Người phụ trách', field: 'FullName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProjectName', name: 'Dự án', field: 'ProjectName', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReceivedDatePO', name: 'Ngày nhận PO', field: 'ReceivedDatePO', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'RecivedMoneyDate', name: 'Ngày tiền về', field: 'RecivedMoneyDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        width: 80,
        minWidth: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: {
            addBlankEntry: true
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        }
      },
      { id: 'TotalMoneyKoVAT', name: 'Tổng tiền Xuất VAT', field: 'TotalMoneyKoVAT', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'TotalMoneyPO', name: 'Tổng tiền nhận PO', field: 'TotalMoneyPO', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'ReceiveMoney', name: 'Tiền về', field: 'ReceiveMoney', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'DeliveryStatusText', name: 'Tình trạng tiến độ giao hàng', field: 'DeliveryStatusText', width: 150, minWidth: 150, sortable: true, filterable: true },
      { id: 'ExportStatusText', name: 'Tình trạng xuất kho', field: 'ExportStatusText', width: 150, minWidth: 150, sortable: true, filterable: true },
      { id: 'EndUser', name: 'End User', field: 'EndUser', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Debt', name: 'Công nợ', field: 'Debt', width: 120, minWidth: 120, sortable: true, filterable: true },
      { id: 'ImportStatus', name: 'Hóa đơn', field: 'ImportStatus', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];

    this.gridOptionsPOKH = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-pokh',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCheckboxSelector: false,
      multiColumnSort: true,
      enableContextMenu: true,
      contextMenu: {
        commandItems: this.getContextMenuOptions(),
        onCommand: (e, args) => this.handleContextMenuCommand(e, args),
      },
    };

  }

  angularGridReadyPOKH(angularGrid: AngularGridInstance): void {
    this.angularGridPOKH = angularGrid;
    this.loadPOKH();
  }

  updateMainIndexFilter(): void {
    if (this.angularGridPOKH && this.mainIndexes.length > 0) {
      const mainIndexColumn = this.columnDefinitionsPOKH.find(col => col.id === 'MainIndex');
      if (mainIndexColumn && mainIndexColumn.filter) {
        mainIndexColumn.filter.collection = this.mainIndexes.map(item => ({
          value: item.MainIndex1,
          label: item.MainIndex1
        }));
        // Update the column definition in the grid
        this.angularGridPOKH.slickGrid?.setColumns(this.columnDefinitionsPOKH);
      }
    }
  }

  updateCurrencyFilter(): void {
    if (this.angularGridPOKH && this.dataCurrencies.length > 0) {
      const currencyColumn = this.columnDefinitionsPOKH.find(col => col.id === 'CurrencyCode');
      if (currencyColumn && currencyColumn.filter) {
        currencyColumn.filter.collection = this.dataCurrencies.map(item => ({
          value: item.Code,
          label: item.Code
        }));
        // Update the column definition in the grid
        this.angularGridPOKH.slickGrid?.setColumns(this.columnDefinitionsPOKH);
      }
    }
  }

  onPOKHRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedId = item['ID'];
      this.selectedRow = item;
      this.loadPOKHProducts(this.selectedId);
      this.loadPOKHFiles(this.selectedId);
    } else {
      console.log('No item found - args:', args);
    }
  }

  onPOKHRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedId = item['ID'];
      this.onEdit();
    }
  }

  initGridPOKHProduct(): void {
    this.columnDefinitionsPOKHProduct = [
      { id: 'STT', name: 'STT', field: 'STT', width: 70, minWidth: 70, sortable: true, filterable: true, formatter: Formatters.tree, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'ProductNewCode', name: 'Mã Nội Bộ', field: 'ProductNewCode', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProductCode', name: 'Mã Sản Phẩm (Cũ)', field: 'ProductCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProductName', name: 'Tên sản phẩm', field: 'ProductName', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'GuestCode', name: 'Mã theo khách', field: 'GuestCode', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Maker', name: 'Hãng', field: 'Maker', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, } },
      { id: 'Qty', name: 'Số lượng', field: 'Qty', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'QuantityReturn', name: 'SL đã về', field: 'QuantityReturn', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'QuantityExport', name: 'SL đã xuất', field: 'QuantityExport', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'QuantityRemain', name: 'SL còn lại', field: 'QuantityRemain', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'FilmSize', name: 'Kích thước phim cắt/Model', field: 'FilmSize', width: 150, minWidth: 150, sortable: true, filterable: true },
      { id: 'Unit', name: 'ĐVT', field: 'Unit', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, } },
      { id: 'UnitPrice', name: 'Đơn giá trước VAT', field: 'UnitPrice', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'IntoMoney', name: 'Tổng tiền trước VAT', field: 'IntoMoney', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'VAT', name: 'VAT (%)', field: 'VAT', width: 150, minWidth: 150, sortable: true, filterable: true, cssClass: 'text-end' },
      { id: 'TotalPriceIncludeVAT', name: 'Tổng tiền sau VAT', field: 'TotalPriceIncludeVAT', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'UserReceiver', name: 'Người nhận', field: 'UserReceiver', width: 200, minWidth: 200, sortable: true, filterable: true },
      { id: 'DeliveryRequestedDate', name: 'Ngày yêu cầu giao hàng', field: 'DeliveryRequestedDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'EstimatedPay', name: 'Thanh toán dự kiến', field: 'EstimatedPay', width: 200, minWidth: 200, sortable: true, filterable: true },
      { id: 'BillDate', name: 'Ngày hóa đơn', field: 'BillDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'BillNumber', name: 'Số hóa đơn', field: 'BillNumber', width: 200, minWidth: 200, sortable: true, filterable: true },
      { id: 'Debt', name: 'Công nợ', field: 'Debt', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filter: { model: Filters['compoundInputNumber'] } },
      { id: 'PayDate', name: 'Ngày yêu cầu thanh toán', field: 'PayDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'GroupPO', name: 'Nhóm', field: 'GroupPO', width: 100, minWidth: 100, sortable: true, filterable: true },
      { id: 'ActualDeliveryDate', name: 'Ngày giao hàng thực tế', field: 'ActualDeliveryDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'RecivedMoneyDate', name: 'Ngày tiền về', field: 'RecivedMoneyDate', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
    ];

    this.gridOptionsPOKHProduct = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-pokh-product',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'STT',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCheckboxSelector: false,
      multiColumnSort: false,
      frozenColumn: 2
    };
  }

  angularGridReadyPOKHProduct(angularGrid: AngularGridInstance): void {
    this.angularGridPOKHProduct = angularGrid;
  }

  initGridPOKHFile(): void {
    this.columnDefinitionsPOKHFile = [
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true },
      { id: 'FileName', name: 'Tên file', field: 'FileName', width: 250, sortable: true, filterable: true },
    ];

    this.gridOptionsPOKHFile = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-pokh-file',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCheckboxSelector: false,
      enableContextMenu: true,
      contextMenu: {
        commandItems: this.getContextFileMenuOptions(),
        onCommand: (e, args) => this.handleContextFileMenuCommand(e, args),
      },
    };
  }

  angularGridReadyPOKHFile(angularGrid: AngularGridInstance): void {
    this.angularGridPOKHFile = angularGrid;
  }

  onPOKHFileRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item && item['ID']) {
      this.downloadFileFromGrid(item['ID'], item['FileName']);
    }
  }

  downloadFileFromGrid(fileId: number, fileName: string): void {
    this.POKHService.downloadFile(fileId).subscribe({
      next: (blob: Blob) => {
        if (blob.type === 'application/json' || blob.size === 0) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              if (json?.status === 0) {
                this.notification.error(NOTIFICATION_TITLE.error, json.message || 'Không thể tải file!');
                return;
              }
            } catch {
              this.downloadBlob(blob, fileName);
            }
          };
          reader.readAsText(blob);
        } else {
          this.downloadBlob(blob, fileName);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file: ' + (error?.message || error));
      },
    });
  }

  //#endregion

  //#region : OLD TABULATOR CODE (commented out)
  /*
  drawPOKHTable(): void {
    const token = localStorage.getItem('token');
    this.tb_POKH = new Tabulator(this.tb_POKHElement.nativeElement, {
      layout: 'fitColumns',
      height: '100%',
      selectableRows: 1,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500, 99999999],
      ajaxURL: this.POKHService.getPOKHAjax(),
      ajaxParams: this.getPOKHAjaxParams(),
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
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
      rowContextMenu: this.getContextMenu(),
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 80,
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
        },
        {
          title: 'Trạng thái',
          field: 'StatusTextNew',
          sorter: 'string',
          width: 150,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc trạng thái',
        },
        {
          title: 'Loại',
          field: 'MainIndex',
          sorter: 'string',
          width: 200,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc loại',
        },
        {
          title: 'New Account',
          field: 'NewAccount',
          sorter: 'boolean',
          width: 100,
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Số POKH',
          field: 'PONumber',
          sorter: 'number',
          width: 100,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc số POKH',
        },
        {
          title: 'Mã PO',
          field: 'POCode',
          sorter: 'string',
          width: 150,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc mã PO',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          formatter: 'textarea',
          width: 300,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc khách hàng',
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc người phụ trách',
        },
        {
          title: 'Dự án',
          field: 'ProjectName',
          sorter: 'string',
          width: 200,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc dự án',
        },
        {
          title: 'Ngày nhận PO',
          field: 'ReceivedDatePO',
          sorter: 'date',
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
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
          hozAlign: 'right',
        },
        {
          title: 'Tổng tiền nhận PO',
          field: 'TotalMoneyPO',
          sorter: 'number',
          width: 150,
          formatter: 'money',
          hozAlign: 'right',
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
          hozAlign: 'right',
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
        {
          title: 'End User',
          field: 'EndUser',
          sorter: 'string',
          width: 150,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc end user',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          formatter: 'textarea',
          width: 120,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc ghi chú',
        },
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
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc hóa đơn',
        },
        {
          title: 'Đặt hàng',
          field: 'PONumber',
          sorter: 'string',
          width: 150,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Lọc đặt hàng',
        },
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
    this.tb_POKHProduct = new Tabulator(
      this.tb_POKHProductElement.nativeElement,
      {
        data: this.dataPOKHProduct,
        dataTree: true,
        layout: 'fitColumns',
        dataTreeStartExpanded: true,
        pagination: true,
        paginationSize: 10,
        height: '100%',
        movableColumns: true,
        resizableRows: true,
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
          headerHozAlign: 'center',
          minWidth: 60,
          hozAlign: 'left',
          vertAlign: 'middle',
          resizable: true,
        },
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
            width: 150,
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
            hozAlign: 'right',
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
            hozAlign: 'right',
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
            hozAlign: 'right',
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
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              if (isNaN(date.getTime())) return value;
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
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
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              if (isNaN(date.getTime())) return value;
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
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
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              if (isNaN(date.getTime())) return value;
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
          },
          { title: 'Nhóm', field: 'GroupPO', sorter: 'string', width: 100 },
          {
            title: 'Ngày giao hàng thực tế',
            field: 'ActualDeliveryDate',
            sorter: 'string',
            width: 200,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              if (isNaN(date.getTime())) return value;
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
          },
          {
            title: 'Ngày tiền về',
            field: 'RecivedMoneyDate',
            sorter: 'string',
            width: 200,
          },
        ],
      }
    );
  }
  initFileTable(): void {
    this.tb_POKHFile = new Tabulator(this.tb_POKHFileElement.nativeElement, {
      data: this.dataPOKHFiles,
      layout: 'fitDataFill',
      height: '100%',
      movableColumns: true,
      resizableRows: true,
      rowContextMenu: this.getContextFileMenu(),
      columns: [
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
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
          width: '83%',
        },
      ],
    });
  }
  */
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

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance,
    columnDefinitions: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    // Update column definitions
    columnDefinitions.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
}

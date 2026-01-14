import {
  Component,
  ViewEncapsulation,
  Input,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzTableModule } from 'ng-zorro-antd/table';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  FieldType,
  Formatters,
  GridOption,
  Grouping,
  OnEventArgs,
  SlickGrid,
} from 'angular-slickgrid';

import { DateTime } from 'luxon';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { WarehouseReleaseRequestSlickGridService } from './warehouse-release-request/warehouse-release-request-slick-grid.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { AppUserService } from '../../../services/app-user.service';
import { BillExportDetailComponent } from '../Sale/BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { BillExportDetailNewComponent } from '../Sale/BillExport/bill-export-detail-new/bill-export-detail-new.component';
interface BillExportDetail {
  ProductID: number;
  Qty: number;
  ProjectID: number;
  Note: string;
  ProductCode: string;
  ProductNewCode: string;
  ProductName: string;
  Unit: string;
  ProductGroupName: string;
  ItemType: string;
  ProjectNameText: string;
  ProjectCodeText: string;
  ProjectCodeExport: string;
  productGroupID: number;
  POKHID: number;
  POKHDetailID: number;
  UserReceiver: string;
  QuantityRemain: number;
  CustomerID: number;
  KhoTypeID: number;
  UserID: number;
  IsMerge: boolean;
  ProductFullName: string;
  ParentID: string;
  TotalInventory: string;
  UnitPricePurchase: string;
  BillCode: string;
  UnitPricePOKH: string;
  STT?: number;
  ChildID?: string;
  POKHDetailIDActual?: string;
  PONumber?: string;
  POCode?: string;

}

interface BillExport {
  CustomerID: number;
  UserID: number;
  KhoTypeID: number;
  ProductType: number;
  IsMerge: boolean;
  Status: number;
  RequestDate: Date;
  WarehouseCode: string;
  Details: BillExportDetail[];
}

@Component({
  selector: 'app-warehouse-release-request-slick-grid',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzDrawerModule,
    NzDropDownModule,
    NzFlexModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzLayoutModule,
    NzModalModule,
    NzRadioModule,
    NzSelectModule,
    NzSpaceModule,
    NzSpinModule,
    NzSplitterModule,
    NzSwitchModule,
    NzTableModule,
    NzTabsModule,
    NzUploadModule,
    NzAutocompleteModule,
    AngularSlickgridModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './warehouse-release-request-slick-grid.component.html',
  styleUrl: './warehouse-release-request-slick-grid.component.css',
})
export class WarehouseReleaseRequestSlickGridComponent implements OnInit {
  @Input() warehouseId!: number;

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  isLoading: boolean = false;
  private isRestoringSelection: boolean = false; // Flag để biết khi nào đang restore selection

  // Data sources
  customers: any[] = [];
  projects: any[] = [];
  productGroups: any[] = [];
  warehouses: any[] = [];
  gridData: any[] = [];
  billExports: BillExport[] = [];
  selectedRowsAll: any[] = []; // Lưu toàn bộ các dòng đã chọn, không phụ thuộc data hiện tại

  // Selected values
  selectedCustomer: any;
  selectedProject: any;
  selectedProductGroup: any;
  keyword: string = '';

  // columnDefs = [
  //   {
  //     field: 'IsSelected',
  //     headerName: 'Chọn',
  //     checkboxSelection: true,
  //     width: 80,
  //   },
  //   { field: 'PONumber', headerName: 'Số PO', width: 120 },
  //   { field: 'StatusText', headerName: 'Trạng thái', width: 120 },
  //   { field: 'CustomerName', headerName: 'Khách hàng', width: 250 },
  //   { field: 'ProjectName', headerName: 'Dự án', width: 250 },
  //   { field: 'ProductCode', headerName: 'Mã sản phẩm', width: 120 },
  //   { field: 'ProductNewCode', headerName: 'Mã nội bộ', width: 120 },
  //   { field: 'GuestCode', headerName: 'Mã theo khách', width: 120 },
  //   { field: 'ProductName', headerName: 'Tên sản phẩm', width: 200 },
  //   { field: 'ProductGroupName', headerName: 'Loại kho', width: 150 },
  //   { field: 'Unit', headerName: 'ĐVT', width: 80 },
  //   {
  //     field: 'Qty',
  //     headerName: 'Số lượng PO',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   {
  //     title: 'SL yêu cầu xuất',
  //     field: 'QuantityRequestExport',
  //     width: 150,
  //     hozAlign: 'center',
  //     editor: 'input',
  //     cellEdited: (cell: CellComponent) => {
  //       const value = parseFloat(cell.getValue()) || 0;
  //       const rowData = cell.getRow().getData();
  //       const quantityRemain = rowData['QuantityRemain'] as number;

  //       // Remove leading zeros and update the cell value
  //       cell.setValue(Number(value));

  //       if (!Number.isInteger(value)) {
  //         this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số nguyên');
  //         cell.setValue(0);
  //         return;
  //       }

  //       if (value > quantityRemain) {
  //         this.notification.error(
  //           'Lỗi',
  //           'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
  //         );
  //         cell.setValue(0);
  //         return;
  //       }
  //     },
  //   },
  //   {
  //     field: 'QuantityExport',
  //     headerName: 'SL đã xuất',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   {
  //     field: 'QuantityRemain',
  //     headerName: 'SL còn lại',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   { field: 'UserReceiver', headerName: 'Người nhận', width: 180 },
  // ];

  // defaultColDef = {
  //   sortable: true,
  //   filter: true,
  //   resizable: true,
  // };

  constructor(
    public activeModal: NgbActiveModal,
    private WRRService: WarehouseReleaseRequestSlickGridService,
    private notification: NzNotificationService,
    private CustomerPartService: CustomerPartService,
    private RequestInvoiceDetailService: RequestInvoiceDetailService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.initGrid();
    this.loadWarehouse();
    this.loadProductGroup();
    this.loadCustomer();
    this.loadProject();
    this.loadPOKHExportRequest(this.warehouseId, 0, 0, 0, '');
  }

  //#region Các hàm load dữ liệu từ api
  loadWarehouse(): void {
    this.WRRService.loadWarehouse().subscribe(
      (response) => {
        if (response.status === 1) {
          this.warehouses = response.data;
        } else {
          this.notification.error('Lỗi khi tải kho:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải kho:', error);
      }
    );
  }
  loadProductGroup(): void {
    this.WRRService.loadProductGroup().subscribe(
      (response) => {
        if (response.status === 1) {
          this.productGroups = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải nhóm sản phẩm:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhóm sản phẩm:', error);
      }
    );
  }
  loadCustomer(): void {
    this.CustomerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
      }
    );
  }
  loadProject(): void {
    this.RequestInvoiceDetailService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          this.notification.error('Lỗi khi tải dự án:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dự án:', error);
      }
    );
  }

  loadPOKHExportRequest(
    warehouseId: number,
    customerId: number,
    projectId: number,
    productGroupId: number,
    keyword: string
  ): void {
    this.isLoading = true;
    this.WRRService.loadPOKHExportRequest(
      warehouseId,
      customerId,
      projectId,
      productGroupId,
      keyword
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          this.gridData = response.data;
          // Áp dụng cách xử lý tree data giống menu-app
          this.dataset = this.gridData.map((item: any) => ({
            ...item,
            id: item.POKHDetailID,
            parentId: item.ParentID == 0 ? null : item.ParentID
          }));

          // Select lại các dòng có trong selectedRowsAll
          if (this.angularGrid && this.angularGrid.slickGrid) {
            // Đợi grid render xong dataset mới
            setTimeout(() => {
              this.isRestoringSelection = true; // Đánh dấu đang restore selection
              const selectedIds = this.selectedRowsAll.map(r => r['POKHDetailID']);
              const rowsToSelect: number[] = [];

              // Duyệt qua dataView thay vì dataset để lấy đúng index sau khi tree render
              const dataView = this.angularGrid.dataView;
              const itemCount = dataView?.getLength() || 0;

              for (let i = 0; i < itemCount; i++) {
                const item = dataView?.getItem(i);
                if (item && selectedIds.includes(item.POKHDetailID)) {
                  rowsToSelect.push(i);
                }
              }

              // Luôn gọi setSelectedRows để reset selection, kể cả khi rowsToSelect rỗng
              this.angularGrid.slickGrid?.setSelectedRows(rowsToSelect);

              // Invalidate và render lại để cập nhật checkbox
              this.angularGrid.slickGrid?.invalidate();
              this.angularGrid.slickGrid?.render();

              console.log('Restored selection:', rowsToSelect.length, 'rows from', itemCount, 'items');

              setTimeout(() => {
                this.isRestoringSelection = false; // Tắt flag sau khi restore xong
              }, 50);
            }, 100);
          }
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu bảng:',
            response.message
          );
        }
        this.isLoading = false;
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu bảng:', error);
        this.isLoading = false;
      }
    );
  }

  /**
   * Flatten tree data thành flat array cho SlickGrid
   * Thêm level và indent info để hiển thị cấu trúc cây
   */
  private flattenTreeData(treeData: any[], level: number = 0): any[] {
    const result: any[] = [];
    treeData.forEach((item) => {
      const { _children, ...rest } = item;
      result.push({ ...rest, _treeLevel: level });
      if (_children && _children.length > 0) {
        result.push(...this.flattenTreeData(_children, level + 1));
      }
    });
    return result;
  }

  /**
   * Chuyển đổi dữ liệu từ flat structure (có ParentID) sang nested structure (có _children)
   * để Tabulator dataTree có thể hiển thị đúng
   */
  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Bước 1: Tạo map với key là ID của mỗi item và thêm _children rỗng
    flatData.forEach((item) => {
      map.set(item.POKHDetailID, { ...item, _children: [] });
    });

    // Bước 2: Xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.POKHDetailID);
      if (!item.ParentID || item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          // Nếu không tìm thấy parent, thêm vào root
          treeData.push(node);
        }
      }
    });

    return treeData;
  }
  //#endregion
  // onWarehouseSelect(warehouse: any): void {
  //   const selectedRows = this.table.getSelectedRows();

  //   if (selectedRows.length <= 0) {
  //     this.notification.warning(
  //       'Thông báo',
  //       'Vui lòng chọn sản phẩm muốn Yêu cầu xuất kho!'
  //     );
  //     return;
  //   }

  //   // Validate số lượng tồn kho trước khi hiển thị dialog xác nhận
  //   this.isLoading = true;

  //   const validateRequests = selectedRows.map((row) => {
  //     const dataRow = row.getData();
  //     return this.WRRService.validateKeep(
  //       warehouse.ID,
  //       Number(dataRow['ProductID']) || 0,
  //       0, // projectID = 0
  //       Number(dataRow['POKHDetailID']) || 0,
  //       0, // billExportDetailID = 0
  //       dataRow['Unit'] || '',
  //       Number(dataRow['QuantityRequestExport']) || 0,
  //       dataRow['ProductNewCode'] || ''
  //     ).pipe(
  //       map((response) => ({
  //         isValid: response.status === 1 && response.data?.IsValid === true,
  //         productNewCode: response.data?.ProductNewCode || dataRow['ProductNewCode'] || '',
  //         message: response.data?.Message || '',
  //         dataRow: dataRow,
  //       })),
  //       catchError((error) => {
  //         console.error('Lỗi khi validate keep:', error);
  //         return of({
  //           isValid: false,
  //           productNewCode: dataRow['ProductNewCode'] || '',
  //           message: 'Lỗi khi kiểm tra số lượng tồn kho',
  //           dataRow: dataRow,
  //         });
  //       })
  //     );
  //   });

  //   forkJoin(validateRequests).subscribe({
  //     next: (validateResults) => {
  //       this.isLoading = false;

  //       // Thu thập danh sách sản phẩm không đủ số lượng
  //       const productNewCodes: string[] = [];
  //       validateResults.forEach((result) => {
  //         if (!result.isValid) {
  //           const productNewCode = result.productNewCode;
  //           if (productNewCode && !productNewCodes.includes(productNewCode)) {
  //             productNewCodes.push(productNewCode);
  //           }
  //         }
  //       });

  //       // Hiển thị dialog xác nhận
  //       if (
  //         confirm(
  //           `Bạn có chắc muốn yêu cầu xuất kho danh sách sản phẩm đã chọn từ [${warehouse.WarehouseName}] không?`
  //         )
  //       ) {
  //         // Hiển thị cảnh báo về các sản phẩm không đủ số lượng
  //         if (productNewCodes.length > 0) {
  //           this.notification.warning(
  //             'Thông báo',
  //             `Các sản phẩm có mã nội bộ [${productNewCodes.join('; ')}] sẽ không được yêu cầu xuất kho vì không đủ số lượng!`
  //           );
  //         }

  //         // Chuẩn bị dữ liệu chi tiết (chỉ lấy những sản phẩm hợp lệ)
  //         const details: BillExportDetail[] = [];
  //         let stt = 0;

  //         for (let i = 0; i < validateResults.length; i++) {
  //           const result = validateResults[i];

  //           if (!result.isValid) {
  //             continue;
  //           }

  //           const dataRow = result.dataRow;
  //           const productID = Number(dataRow['ProductID']) || 0;
  //           const productNewCode = (dataRow['ProductNewCode'] || '').trim();
  //           const quantityRemain = Number(dataRow['QuantityRemain']) || 0;
  //           const quantityRequestExport = Number(dataRow['QuantityRequestExport']) || 0;

  //           if (productID <= 0 || productNewCode === '' || quantityRemain <= 0 || quantityRequestExport <= 0) {
  //             continue;
  //           }

  //           stt++;
  //           details.push({
  //             ProductID: productID,
  //             Qty: quantityRequestExport,
  //             ProjectID: Number(dataRow['ProjectID']) || 0,
  //             Note: dataRow['PONumber'] || '',
  //             ProductCode: dataRow['ProductCode'] || '',
  //             ProductNewCode: productNewCode,
  //             ProductName: dataRow['ProductName'] || '',
  //             Unit: dataRow['Unit'] || '',
  //             ProductGroupName: dataRow['ProductGroupName'] || '',
  //             ItemType: dataRow['ItemType'] || '',
  //             ProjectNameText: dataRow['ProjectName'] || '',
  //             ProjectCodeText: dataRow['ProjectCode'] || '',
  //             ProjectCodeExport: dataRow['ProjectCodeExport'] || '',
  //             productGroupID: Number(dataRow['productGroupID']) || 0,
  //             POKHID: Number(dataRow['POKHID']) || 0,
  //             POKHDetailID: Number(dataRow['POKHDetailID']) || 0,
  //             UserReceiver: dataRow['UserReceiver'] || '',
  //             QuantityRemain: quantityRemain,
  //             CustomerID: Number(dataRow['CustomerID']) || 0,
  //             KhoTypeID: Number(dataRow['KhoTypeID']) || 0,
  //             UserID: Number(dataRow['UserID']) || 0,
  //             IsMerge: Boolean(dataRow['IsMerge']) || false,
  //             ProductFullName: dataRow['GuestCode'] || '',
  //             ParentID: dataRow['ParentID'] || '',
  //             TotalInventory: dataRow['TotalInventory'] || '',
  //             UnitPricePurchase: dataRow['UnitPricePurchase'] || '',
  //             BillCode: dataRow['BillCode'] || '',
  //             UnitPricePOKH: dataRow['UnitPricePOKH'] || '',
  //             STT: stt,
  //             ChildID: String(dataRow['POKHDetailID'] || ''),
  //             POKHDetailIDActual: String(dataRow['POKHDetailID'] || ''),
  //             PONumber: dataRow['PONumber'] || '',
  //             POCode: dataRow['POCode'] || '',
  //           });
  //         }

  //         if (details.length === 0) {
  //           this.notification.warning(
  //             'Thông báo',
  //             'Không có sản phẩm nào hợp lệ để yêu cầu xuất kho!'
  //           );
  //           return;
  //         }

  //         // Kiểm tra xem có nhiều khách hàng hoặc loại kho khác nhau không
  //         const distinctValues = [
  //           ...new Set(details.map((d) => `${d.CustomerID}-${d.KhoTypeID}`)),
  //         ];

  //         if (distinctValues.length > 1) {
  //           this.notification.info(
  //             'Thông báo',
  //             `Bạn chọn sản phẩm từ ${distinctValues.length} Khách hàng hoặc Loại kho.\nNên phần mềm sẽ tự động tạo ${distinctValues.length} phiếu xuất.`
  //           );
  //         }

  //         // Tạo dữ liệu master cho từng nhóm khách hàng/kho
  //         this.billExports = distinctValues.map((value) => {
  //           const [customerID, khoTypeID] = value.split('-');
  //           const groupDetails = details.filter(
  //             (d) =>
  //               d.CustomerID.toString() === customerID &&
  //               d.KhoTypeID.toString() === khoTypeID
  //           );

  //           return {
  //             CustomerID: parseInt(customerID),
  //             UserID: this.appUserService.id || 0,
  //             KhoTypeID: parseInt(khoTypeID),
  //             ProductType: 1,
  //             IsMerge: groupDetails[0]?.IsMerge || false,
  //             Status: 6,
  //             RequestDate: new Date(),
  //             WarehouseCode: warehouse.WarehouseCode,
  //             Details: groupDetails,
  //           };
  //         });

  //         this.activeModal.close();

  //         // Mở modal chi tiết cho từng bill export (tuần tự)
  //         this.openBillExportDetailModals(0, warehouse);
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       this.notification.error('Lỗi', 'Lỗi khi kiểm tra số lượng tồn kho: ' + error.message);
  //     },
  //   });
  // }

  onWarehouseSelect(warehouse: any, isTransfer: boolean = false): void {
    if (this.selectedRowsAll.length <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn yêu cầu xuất kho!');
      return;
    }

    const actionText = isTransfer ? 'chuyển kho' : 'xuất kho';

    this.nzModal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn yêu cầu ${actionText} danh sách sản phẩm đã chọn từ [${warehouse.WarehouseName}] không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;

        const payload = {
          WarehouseID: warehouse.ID,
          Items: this.selectedRowsAll.map((d: any) => {
            return {
              ProductID: Number(d["ProductID"]) || 0,
              POKHDetailID: Number(d["POKHDetailID"]) || 0,
              UnitName: d["Unit"] || "",
              QuantityRequestExport: Number(d["QuantityRequestExport"]) || 0,
              ProductNewCode: d["ProductNewCode"] || ""
            };
          })
        };

        this.WRRService.validateKeepNew(payload).subscribe({
          next: (res) => {
            this.isLoading = false;

            const validSelected = res.data.ValidSelected || [];
            const invalidCodes = res.data.InvalidProductCodes || [];

            // Hiển thị thông báo về các sản phẩm không đủ số lượng
            if (invalidCodes.length > 0) {
              this.notification.warning(
                'Thông báo',
                `Các sản phẩm có mã nội bộ: ${invalidCodes.join('; ')} sẽ không được ${actionText} vì không đủ số lượng!`
              );
            }

            const validDetails = this.selectedRowsAll
              .filter((d: any) => validSelected.includes(d.POKHDetailID))
              .map((d: any) => this.convertToDetail(d));

            // Kiểm tra các sản phẩm không hợp lệ 
            const noRemainProducts: string[] = [];
            const finalValidDetails = validDetails.filter((d: BillExportDetail) => {
              const originalData = this.selectedRowsAll.find(
                (r: any) => r.POKHDetailID === d.POKHDetailID
              );

              if (!originalData) return false;

              const productID = Number(originalData.ProductID) || 0;
              const productNewCode = (originalData.ProductNewCode || '').trim();
              const quantityRemain = Number(originalData.QuantityRemain) || 0;

              if (productID <= 0 || productNewCode === '' || quantityRemain <= 0) {
                if (productNewCode && !noRemainProducts.includes(productNewCode)) {
                  noRemainProducts.push(productNewCode);
                }
                return false;
              }

              return true;
            });

            // Hiển thị thông báo về các sản phẩm không đủ số lượng còn lại
            if (noRemainProducts.length > 0) {
              this.notification.warning(
                'Thông báo',
                `Các sản phẩm sau không đủ số lượng còn lại nên sẽ bị bỏ qua: ${noRemainProducts.join('; ')}`
              );
            }

            if (finalValidDetails.length === 0) {
              this.notification.warning('Thông báo', `Không có sản phẩm nào hợp lệ để yêu cầu ${actionText}!`);
              return;
            }

            this.generateBillExport(finalValidDetails, warehouse, isTransfer);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('validate keep batch error:', err);
            this.notification.error('Lỗi', 'Không kiểm tra được số lượng tồn kho!');
          }
        });
      }
    });
  }


  onWarehouseTranferSelect(warehouse: any): void {
    this.onWarehouseSelect(warehouse, true);
  }

  private generateBillExport(details: BillExportDetail[], warehouse: any, isTransfer: boolean = false): void {
    const groupedKeys = [...new Set(
      details.map(d => `${d.CustomerID}-${d.KhoTypeID}`)
    )];

    const actionText = isTransfer ? 'chuyển kho' : 'xuất';

    if (groupedKeys.length > 1) {
      this.notification.info(
        'Thông báo',
        `Bạn chọn sản phẩm từ ${groupedKeys.length} Khách hàng hoặc Loại kho.\n` +
        `Hệ thống sẽ tự động tạo ${groupedKeys.length} phiếu ${actionText}.`
      );
    }

    this.billExports = groupedKeys.map(key => {
      const [customerID, khoTypeID] = key.split("-");
      const groupDetails = details.filter(
        d => d.CustomerID.toString() === customerID &&
          d.KhoTypeID.toString() === khoTypeID
      );

      return {
        CustomerID: Number(customerID),
        UserID: this.appUserService.id || 0,
        KhoTypeID: Number(khoTypeID),
        ProductType: 1,
        IsMerge: groupDetails[0]?.IsMerge || false,
        Status: 6,
        RequestDate: new Date(),
        WarehouseCode: warehouse.WarehouseCode,
        Details: groupDetails,
        IsTransfer: isTransfer,
      };
    });

    console.log('=== billExports data đẩy sang BillExport ===', this.billExports);

    // this.activeModal.close();
    this.openBillExportDetailModals(0, warehouse, isTransfer);
  }
  private convertToDetail(d: any): BillExportDetail {
    return {
      ProductID: Number(d.ProductID) || 0,
      Qty: Number(d.QuantityRequestExport) || 0,
      ProjectID: Number(d.ProjectID) || 0,
      Note: d.PONumber || "",
      ProductCode: d.ProductCode || "",
      ProductNewCode: d.ProductNewCode || "",
      ProductName: d.ProductName || "",
      Unit: d.Unit || "",
      ProductGroupName: d.ProductGroupName || "",
      ItemType: d.ItemType || "",
      ProjectNameText: d.ProjectName || "",
      ProjectCodeText: d.ProjectCode || "",
      ProjectCodeExport: d.ProjectCodeExport || "",
      productGroupID: Number(d.productGroupID) || 0,
      POKHID: Number(d.POKHID) || 0,
      POKHDetailID: Number(d.POKHDetailID) || 0,
      UserReceiver: d.UserReceiver || "",
      QuantityRemain: Number(d.QuantityRemain) || 0,
      CustomerID: Number(d.CustomerID) || 0,
      KhoTypeID: Number(d.KhoTypeID) || 0,
      UserID: Number(d.UserID) || 0,
      IsMerge: Boolean(d.IsMerge) || false,
      ProductFullName: d.GuestCode || "",
      ParentID: d.ParentID || "",
      TotalInventory: d.TotalInventory || "",
      UnitPricePurchase: d.UnitPricePurchase || "",
      BillCode: d.BillCode || "",
      UnitPricePOKH: d.UnitPricePOKH || "",
      STT: 0,
      ChildID: String(d.POKHDetailID),
      POKHDetailIDActual: String(d.POKHDetailID),
      PONumber: d.PONumber,
      POCode: d.POCode,
    };
  }


  /**
   * Mở modal chi tiết cho từng bill export tuần tự
   * @param index - Index của bill export hiện tại trong mảng billExports
   * @param warehouse - Warehouse object từ onWarehouseSelect
   * @param isTransfer - Cờ xác định có phải là chuyển kho hay không
   */
  private openBillExportDetailModals(index: number, warehouse: any, isTransfer: boolean = false): void {
    if (index >= this.billExports.length) {
      return;
    }

    const billExport = this.billExports[index];

    const billExportForModal = {
      TypeBill: false,
      Code: '',
      Address: '',
      CustomerID: billExport.CustomerID,
      UserID: billExport.UserID,
      SenderID: 0,
      WarehouseType: '',
      GroupID: '',
      KhoTypeID: billExport.KhoTypeID,
      ProductType: billExport.ProductType,
      AddressStockID: 0,
      WarehouseID: warehouse.ID, //  WarehouseID từ selected warehouse
      Status: billExport.Status,
      SupplierID: 0,
      CreatDate: billExport.RequestDate,
      RequestDate: billExport.RequestDate,
      IsTransfer: isTransfer,
    };

    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      // size: 'xl',
      windowClass: 'full-screen-modal',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.newBillExport = billExportForModal;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.isPOKH = true;
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.wareHouseCode = billExport.WarehouseCode;
    modalRef.componentInstance.isFromWarehouseRelease = true; // FLAG RIÊNG cho luồng Warehouse Release Request

    const detailsForModal = billExport.Details.map((detail: any) => ({
      ID: 0,
      POKHDetailID: detail.POKHDetailID || 0,
      ProductID: detail.ProductID || 0,
      ProductNewCode: detail.ProductNewCode || '',
      ProductCode: detail.ProductCode || '',
      ProductName: detail.ProductName || '',
      Unit: detail.Unit || '',
      // TotalInventory sẽ được fill từ productOptions trong updateTotalInventoryForExistingRows()
      TotalInventory: 0,
      Qty: detail.Qty || 0,
      QuantityRemain: detail.QuantityRemain || 0,
      ProjectID: detail.ProjectID || 0,
      ProjectCodeExport: detail.ProjectCodeExport || '',
      ProjectNameText: detail.ProjectNameText || '',
      ProductFullName: detail.ProductFullName || '',
      Note: detail.Note || '',
      UnitPricePOKH: detail.UnitPricePOKH || 0,
      UnitPricePurchase: detail.UnitPricePurchase || 0,
      BillCode: detail.BillCode || '',
      UserReceiver: detail.UserReceiver || '',
      POKHID: detail.POKHID || 0,
    }));

    setTimeout(() => {
      modalRef.componentInstance.dataTableBillExportDetail = detailsForModal;

      if (modalRef.componentInstance.table_billExportDetail) {
        modalRef.componentInstance.table_billExportDetail.replaceData(detailsForModal);

        // Update TotalInventory after data is set into table
        // Wait a bit for productOptions to be loaded if not already
        setTimeout(() => {
          if (modalRef.componentInstance.updateTotalInventoryForExistingRows) {
            modalRef.componentInstance.updateTotalInventoryForExistingRows();
          }
        }, 500);
      }
    }, 200);

    modalRef.result.then(
      (result) => {
        // Modal đóng thành công (result có thể là undefined, true, hoặc bất kỳ giá trị nào)
        // Luôn mở modal tiếp theo nếu chưa phải modal cuối cùng
        if (index < this.billExports.length - 1) {
          this.openBillExportDetailModals(index + 1, warehouse);
        } else {
          this.activeModal.close();
        }
      },
      (dismissed) => {
        // Modal bị dismiss, vẫn tiếp tục mở modal tiếp theo nếu có
        if (index < this.billExports.length - 1) {
          this.openBillExportDetailModals(index + 1, warehouse);
        } else {
          this.activeModal.close();
        }
      }
    );
  }

  onCustomerChange(event: any): void {
    // TODO: Implement customer change logic
    console.log('Selected customer:', event);
  }

  onProjectChange(event: any): void {
    // TODO: Implement project change logic
    console.log('Selected project:', event);
  }

  onProductGroupChange(event: any): void {
    // TODO: Implement product group change logic
    console.log('Selected product group:', event);
  }

  onSearch() {
    this.isLoading = true;
    this.WRRService.loadPOKHExportRequest(
      this.warehouseId,
      this.selectedCustomer,
      this.selectedProject,
      this.selectedProductGroup,
      this.keyword
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          let data = response.data;
          this.dataset = data.map((item: any) => ({
            ...item,
            id: item.POKHDetailID,
            parentId: item.ParentID == 0 ? null : item.ParentID
          }));

          // Select lại các dòng có trong selectedRowsAll
          if (this.angularGrid && this.angularGrid.slickGrid) {
            // Đợi grid render xong dataset mới
            setTimeout(() => {
              this.isRestoringSelection = true; // Đánh dấu đang restore selection
              const selectedIds = this.selectedRowsAll.map(r => r['POKHDetailID']);
              const rowsToSelect: number[] = [];

              // Duyệt qua dataView thay vì dataset để lấy đúng index sau khi tree render
              const dataView = this.angularGrid.dataView;
              const itemCount = dataView?.getLength() || 0;

              for (let i = 0; i < itemCount; i++) {
                const item = dataView?.getItem(i);
                if (item && selectedIds.includes(item.POKHDetailID)) {
                  rowsToSelect.push(i);
                }
              }

              // Luôn gọi setSelectedRows để reset selection, kể cả khi rowsToSelect rỗng
              this.angularGrid.slickGrid?.setSelectedRows(rowsToSelect);

              // Invalidate và render lại để cập nhật checkbox
              this.angularGrid.slickGrid?.invalidate();
              this.angularGrid.slickGrid?.render();

              console.log('Restored selection in search:', rowsToSelect.length, 'rows from', itemCount, 'items');

              setTimeout(() => {
                this.isRestoringSelection = false; // Tắt flag sau khi restore xong
              }, 50);
            }, 100);
          }
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu bảng:',
            response.message
          );
        }
        this.isLoading = false;
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu bảng:', error);
        this.isLoading = false;
      }
    );
  }

  onSubmit(): void {
    // TODO: Implement submit logic
    console.log('Submit data');
    this.activeModal.close('submit');
  }

  closeModal(): void {
    this.activeModal.dismiss('close');
  }

  onCustomerSelect(customer: any): void {
    this.selectedCustomer = customer.CustomerID;
    this.onCustomerChange(customer);
  }

  onProjectSelect(project: any): void {
    this.selectedProject = project.ProjectID;
    this.onProjectChange(project);
  }
  //#region Hàm vẽ bảng SlickGrid
  initGrid(): void {
    this.columnDefinitions = [
      // {
      //   id: 'POKHDetailID',
      //   name: 'ID',
      //   field: 'POKHDetailID',
      //   width: 120,
      //   sortable: true,
      //   filterable: true,
      // },
      // {
      //   id: 'ParentID',
      //   name: 'ID cha',
      //   field: 'ParentID',
      //   width: 120,
      //   sortable: true,
      //   filterable: true,
      // },
      {
        id: 'STTDetail',
        name: 'STT',
        field: 'STTDetail',
        width: 100,
        minWidth: 100,
        sortable: true,
        filterable: true,
        type: 'string',
        formatter: Formatters.tree,  // Thêm tree formatter để hiển thị expand/collapse icons
      },
      {
        id: 'PONumber',
        name: 'Số PO',
        field: 'PONumber',
        width: 120,
        minWidth: 120,
        sortable: true,
        filterable: true,
        type: FieldType.string,
        // formatter: Formatters.tree,  // Thêm tree formatter để hiển thị expand/collapse icons
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 200,
        minWidth: 200,
        sortable: true,
        filterable: true,
        type: 'string',
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        width: 300,
        minWidth: 300,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'ProjectName',
        name: 'Dự án',
        field: 'ProjectName',
        width: 200,
        minWidth: 200,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 200,
        minWidth: 200,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 350,
        minWidth: 150,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'GuestCode',
        name: 'Mã theo khách',
        field: 'GuestCode',
        width: 250,
        minWidth: 250,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        minWidth: 250,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'ProductGroupName',
        name: 'Loại kho',
        field: 'ProductGroupName',
        width: 250,
        minWidth: 100,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        width: 100,
        minWidth: 50,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'Qty',
        name: 'Số lượng PO',
        field: 'Qty',
        width: 100,
        minWidth: 70,
        sortable: true,
        type: FieldType.number,
        cssClass: 'text-right',
      },
      {
        id: 'QuantityRequestExport',
        name: 'SL yêu cầu xuất',
        field: 'QuantityRequestExport',
        width: 150,
        minWidth: 70,
        sortable: true,
        type: FieldType.number,
        cssClass: 'text-right',
        editor: {
          model: Editors['integer'],
        },
      },
      {
        id: 'QuantityExport',
        name: 'SL đã xuất',
        field: 'QuantityExport',
        width: 150,
        minWidth: 50,
        sortable: true,
        type: FieldType.number,
        cssClass: 'text-right',
      },
      {
        id: 'QuantityRemain',
        name: 'SL còn lại',
        field: 'QuantityRemain',
        width: 100,
        minWidth: 70,
        sortable: true,
        type: FieldType.number,
        cssClass: 'text-right',
      },
      {
        id: 'UserReceiver',
        name: 'Người nhận',
        field: 'UserReceiver',
        width: 150,
        minWidth: 150,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
      {
        id: 'BillExportCode',
        name: 'Mã phiếu xuất',
        field: 'BillExportCode',
        width: 250,
        minWidth: 250,
        sortable: true,
        filterable: true,
        type: FieldType.string,
      },
    ];

    this.gridOptions = {
      // autoResize: {
      //   container: '#gridContainer',
      //   rightPadding: 10,
      //   bottomPadding: 20,
      // },
      // enableAutoResize: false, // Tắt auto resize để sử dụng width cố định
      gridWidth: '100%', // Đặt chiều rộng tổng thể của grid
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      multiColumnSort: false, // Required for Tree Data
      enableFiltering: true,
      enableGrouping: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
        columnIndexPosition: 0,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      multiSelect: true,
      rowHeight: 35,
      headerRowHeight: 40,
      enablePagination: false, // Tree Data does not support pagination
      editable: true,
      autoEdit: false,
      autoCommitEdit: true,
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'STTDetail',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      frozenColumn: 6,
    };
  }

  onAngularGridCreated(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Grouping theo số PO
    if (this.angularGrid.dataView) {
      this.angularGrid.dataView.setGrouping({
        getter: 'PONumber',
        formatter: (g) => `PO: ${g.value || 'Không có PO'} <span style="color:green">(${g.count} items)</span>`,
        collapsed: false,
        lazyTotalsCalculation: true,
      } as Grouping);
    }

    // Xử lý sự kiện khi selected rows thay đổi
    this.angularGrid.slickGrid?.onSelectedRowsChanged.subscribe((e: any, args: any) => {
      // Bỏ qua nếu đang restore selection sau khi tìm kiếm/filter
      if (this.isRestoringSelection) {
        return;
      }

      const selectedRows = args.rows as number[];
      const grid = this.angularGrid.slickGrid;

      if (!grid) return;

      // Lấy danh sách POKHDetailID của các dòng đang được chọn trong view hiện tại
      const currentSelectedIds = selectedRows.map((rowIdx: number) => {
        const rowData = grid.getDataItem(rowIdx);
        return rowData?.POKHDetailID;
      }).filter((id: any) => id !== undefined);

      // Lấy danh sách POKHDetailID của dataset hiện tại
      const datasetIds = this.dataset.map((d: any) => d.POKHDetailID);

      // Tìm các dòng vừa được chọn (có trong currentSelectedIds nhưng chưa có trong selectedRowsAll)
      selectedRows.forEach((rowIdx: number) => {
        const rowData = grid.getDataItem(rowIdx);
        if (rowData && rowData.POKHDetailID !== undefined && rowData.POKHDetailID !== null) {
          const pokhDetailID = rowData.POKHDetailID;
          const index = this.selectedRowsAll.findIndex(r => r['POKHDetailID'] === pokhDetailID);

          if (index === -1) {
            // Thêm mới vào selectedRowsAll
            this.selectedRowsAll.push({ ...rowData });
          } else {
            // Cập nhật data mới nhất
            this.selectedRowsAll[index] = { ...rowData };
          }
        }
      });

      // Tìm các dòng vừa bị bỏ chọn (có trong dataset hiện tại, có trong selectedRowsAll, nhưng không có trong currentSelectedIds)
      const deselectedIds = datasetIds.filter((id: any) =>
        !currentSelectedIds.includes(id) &&
        this.selectedRowsAll.some(r => r['POKHDetailID'] === id)
      );

      // Xóa các dòng bị bỏ chọn khỏi selectedRowsAll
      if (deselectedIds.length > 0) {
        this.selectedRowsAll = this.selectedRowsAll.filter(
          r => !deselectedIds.includes(r['POKHDetailID'])
        );
      }

      console.log("Dòng đã chọn không phụ thuộc datasource", this.selectedRowsAll);
    });

    // Xử lý sự kiện khi cell được edit
    this.angularGrid.slickGrid?.onCellChange.subscribe((e: any, args: any) => {
      const columnId = this.columnDefinitions[args.cell]?.id;

      if (columnId === 'QuantityRequestExport') {
        const rowData = args.item;
        const value = parseFloat(rowData.QuantityRequestExport) || 0;
        const quantityRemain = rowData.QuantityRemain as number;

        if (!Number.isInteger(value)) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số nguyên');
          rowData.QuantityRequestExport = 0;
          this.angularGrid.slickGrid?.invalidateRow(args.row);
          this.angularGrid.slickGrid?.render();
          return;
        }

        if (value > quantityRemain) {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
          );
          rowData.QuantityRequestExport = 0;
          this.angularGrid.slickGrid?.invalidateRow(args.row);
          this.angularGrid.slickGrid?.render();
          return;
        }

        // Cập nhật lại data trong selectedRowsAll nếu dòng này đã được chọn
        const pokhDetailID = rowData.POKHDetailID;
        const index = this.selectedRowsAll.findIndex(r => r['POKHDetailID'] === pokhDetailID);
        if (index !== -1) {
          this.selectedRowsAll[index] = { ...rowData };
        }
      }
    });
  }
  //#endregion
}

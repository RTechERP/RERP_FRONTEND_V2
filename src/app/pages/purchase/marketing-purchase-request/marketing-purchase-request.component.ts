import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Input, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnCellChangeEventArgs,
  OnEventArgs,
  AngularSlickgridModule
} from 'angular-slickgrid';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subscription } from 'rxjs';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request/project-partlist-purchase-request.service';
import { PONCCService } from '../poncc/poncc.service';
import { FirmService } from '../../general-category/firm/firm-service/firm.service';
import { ProjectService } from '../../project/project-service/project.service';
import { ProjectPartListService } from '../../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

const PRODUCT_GROUP_MKT_ID = 81; // ID nhóm sản phẩm Marketing

@Component({
  selector: 'app-marketing-purchase-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzSpinModule,
    NzModalModule,
    NgbModule
  ],
  templateUrl: './marketing-purchase-request.component.html',
  styleUrls: ['./marketing-purchase-request.component.css']
})
export class MarketingPurchaseRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('angularGrid') angularGrid!: AngularGridInstance;

  // Input properties
  @Input() requestTypeID: number = 7; // RequestTypeID cho Marketing (default = 7)

  // Form data
  @Input() employeeID: number = 0;
  @Input() dateRequest: Date = new Date();
  @Input() initialDataset: any[] = []; // Dataset ban đầu từ component cha

  // Master data
  employees: any[] = [];
  productSales: any[] = [];
  firms: any[] = [];
  suppliers: any[] = [];
  currencies: any[] = [];
  productGroups: any[] = [];
  unitCounts: any[] = [];

  // Grid data
  dataset: any[] = [];
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  angularGridInstance!: AngularGridInstance;
  gridService: any; // GridService từ angularGrid

  // UI state
  isLoading: boolean = false;

  // Helper getter
  get isAdmin(): boolean {
    return this.appUserService.isAdmin;
  }

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private srv: ProjectPartlistPurchaseRequestService,
    private ponccService: PONCCService,
    private firmService: FirmService,
    private projectService: ProjectService,
    private projectPartListService: ProjectPartListService,
    private appUserService: AppUserService,
    private notify: NzNotificationService,
    private modal: NzModalService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.employeeID = this.appUserService.employeeID || 0;
  }

  ngOnInit(): void {
    // Khởi tạo Form - chưa load dữ liệu
    this.initForm();
  }

  ngAfterViewInit(): void {
    // Load dữ liệu sau khi view init
    this.loadData();
    
    // Nếu có initialDataset, set vào dataset sau khi grid ready
    if (this.initialDataset && this.initialDataset.length > 0) {
      setTimeout(() => {
        if (this.angularGridInstance) {
          // Đảm bảo mỗi item có id và STT đúng
          this.initialDataset.forEach((item: any, index: number) => {
            if (!item.id) {
              item.id = Date.now() + index;
            }
            item.TT = index + 1;
          });
          
          this.dataset = [...this.initialDataset];
          this.angularGridInstance.dataView.setItems(this.dataset);
          this.angularGridInstance.dataView.refresh();
          this.angularGridInstance.slickGrid.render();
        }
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Khởi tạo Form
  private initForm(): void {
    // Set default values nếu chưa được set từ @Input
    if (!this.employeeID || this.employeeID <= 0) {
      this.employeeID = this.appUserService.employeeID || 0;
    }
    if (!this.dateRequest) {
      this.dateRequest = new Date();
    }
  }

  // Load tất cả dữ liệu
  private loadData(): void {
    this.isLoading = true;
    
    // Load theo thứ tự
    this.loadProductSale();
    this.loadEmployee();
    this.loadCurrency();
    this.loadProductGroup();
    this.loadFirm();
    this.loadNCC();
    this.loadUnitCount();
    
    // LoadData để khởi tạo Grid
    this.loadGridData();
  }

  // Load ProductSale
  private loadProductSale(): void {
    const sub = this.ponccService.getProductSale().subscribe({
      next: (data) => {
        this.productSales = data || [];
      },
      error: (err) => {
        console.error('Error loading product sales:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách sản phẩm');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load Employee
  private loadEmployee(): void {
    const sub = this.projectService.getUsers().subscribe({
      next: (response: any) => {
        const data = response.data || response || [];
        this.employees = this.projectService.createdDataGroup(data, 'DepartmentName');
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load Currency
  private loadCurrency(): void {
    const sub = this.srv.getCurrencies().subscribe({
      next: (data) => {
        this.currencies = data || [];
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách tiền tệ');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load ProductGroup
  private loadProductGroup(): void {
    const sub = this.srv.getProductGroups().subscribe({
      next: (data) => {
        this.productGroups = data || [];
      },
      error: (err) => {
        console.error('Error loading product groups:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhóm sản phẩm');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load Firm
  private loadFirm(): void {
    const sub = this.firmService.getFirms().subscribe({
      next: (response: any) => {
        this.firms = response.data || response || [];
      },
      error: (err) => {
        console.error('Error loading firms:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách hãng');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load NCC (Supplier)
  private loadNCC(): void {
    const sub = this.srv.getSupplierSales().subscribe({
      next: (data) => {
        this.suppliers = data || [];
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhà cung cấp');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load UnitCount
  private loadUnitCount(): void {
    const sub = this.projectPartListService.getUnitCount().subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          this.unitCounts = response.data || [];
        } else if (Array.isArray(response)) {
          this.unitCounts = response;
        } else if (response.data) {
          this.unitCounts = response.data;
        } else {
          this.unitCounts = [];
        }
      },
      error: (err) => {
        console.error('Error loading unit counts:', err);
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách đơn vị tính');
      }
    });
    this.subscriptions.push(sub);
  }

  // Load Grid Data - Khởi tạo Grid rỗng
  private loadGridData(): void {
    // Gọi API để lấy cấu trúc bảng
    const filter: any = {
      DateStart: this.toStartOfDayISO(new Date(new Date().getFullYear(), 0, 1)),
      DateEnd: this.toEndOfDayISO(new Date()),
      StatusRequest: 0,
      ProjectID: 0,
      Keyword: '',
      SupplierSaleID: 0,
      IsApprovedTBP: -1,
      IsApprovedBGD: -1,
      IsCommercialProduct: -1,
      POKHID: 0,
      ProductRTCID: -1,
      IsDeleted: 0,
      IsTechBought: -1,
      IsJobRequirement: -1, // Chỉ lấy 1 dòng để lấy cấu trúc
    };

    const sub = this.srv.getAll(filter).subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : response?.data || response || [];
        
        // Clone cấu trúc để tạo bảng rỗng
        if (data.length > 0) {
          // Tạo dataset rỗng với cấu trúc từ dòng đầu tiên
          this.dataset = [];
        } else {
          // Nếu không có dữ liệu, tạo dataset rỗng
          this.dataset = [];
        }

        // Khởi tạo columns
        this.initGridColumns();
        this.initGridOptions();

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading grid data:', err);
        // Vẫn khởi tạo grid rỗng nếu có lỗi
        this.dataset = [];
        this.initGridColumns();
        this.initGridOptions();
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // Initialize Grid Columns
  private initGridColumns(): Column[] {
    this.columnDefinitions = [
      {
        id: 'DeleteRow',
        field: 'DeleteRow',
        name: '',
        width: 50,
        sortable: false,
        filterable: false,
        formatter: Formatters.icon,
        params: { iconCssClass: 'mdi mdi-delete pointer' },
        onCellClick: (e: Event, args: OnEventArgs) => {
          this.deleteRow(args);
        }
      },
      {
        id: 'TT',
        field: 'TT',
        name: 'STT',
        width: 60,
        sortable: false,
        filterable: false,
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 150,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getProductSaleCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          const product = this.productSales.find((p: any) => p.ProductCode === value || p.ProductNewCode === value);
          return product ? `${product.ProductCode} - ${product.ProductName}` : value;
        },
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm (*)',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm (*)',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Manufacturer',
        field: 'Manufacturer',
        name: 'Hãng',
        width: 150,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getFirmCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          const firm = this.firms.find((f: any) => f.FirmCode === value || f.ID === value);
          return firm ? `${firm.FirmCode} - ${firm.FirmName}` : value;
        },
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getSupplierCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          const supplier = this.suppliers.find((s: any) => s.ID === value);
          return supplier ? `${supplier.CodeNCC || ''} - ${supplier.NameNCC || ''}`.replace(/^ - |^ -$| - $/g, '').trim() || supplier.NameNCC : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'DateReturnExpected',
        field: 'DateReturnExpected',
        name: 'Deadline (*)',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['date'],
        },
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'SL yêu cầu (*)',
        width: 120,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'ĐVT',
        width: 100,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getUnitCountCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          // value có thể là ID hoặc UnitName
          const unit = this.unitCounts.find((u: any) => u.ID === value || u.UnitName === value);
          return unit ? unit.UnitName : value;
        },
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getCurrencyCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          const currency = this.currencies.find((c: any) => c.ID === value);
          return currency ? `${currency.Code || ''} - ${this.formatNumberEnUS(currency.CurrencyRate || 0, 2)}` : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ProductGroupID',
        field: 'ProductGroupID',
        name: 'Loại kho',
        width: 150,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getProductGroupCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          const group = this.productGroups.find((g: any) => g.ID === value);
          return group ? group.ProductGroupName : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['longText'],
        },
        filter: { model: Filters['compoundInputText'] },
      }
    ];

    return this.columnDefinitions;
  }

  // Initialize Grid Options
  private initGridOptions(): GridOption {
    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
        columnIndexPosition: 0,
        width: 35,
      },
      editable: true,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,
      enableGrouping: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enablePagination: false,
    };

    return this.gridOptions;
  }

  // Grid ready event handler
  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridInstance = angularGrid;
    this.gridService = angularGrid.gridService;
    
    // Tự động sync dataset khi có thay đổi (giống payment-order-detail)
    this.angularGridInstance.dataView.onRowCountChanged.subscribe(() => {
      this.dataset = [...this.angularGridInstance.dataView.getItems()];
    });

    this.angularGridInstance.dataView.onRowsChanged.subscribe(() => {
      this.dataset = [...this.angularGridInstance.dataView.getItems()];
    });
    
    setTimeout(() => {
      if (angularGrid.resizerService) {
        angularGrid.resizerService.resizeGrid();
      }
    }, 100);
  }

  // Cell change event handler
  onCellChange(e: Event, args: OnCellChangeEventArgs): void {
    if (!this.angularGridInstance) return;

    const rowIndex = args.row;
    const item = this.angularGridInstance.dataView.getItem(rowIndex);
    if (!item) return;

    const column = args.column;
    const field = column?.field || '';
    const newValue = args.item?.[field];

    // Handle ProductNewCode change - auto-fill product data
    if (field === 'ProductNewCode') {
      this.onProductSaleChanged(item, newValue);
    }

    // Handle CurrencyID change - update CurrencyRate
    if (field === 'CurrencyID') {
      this.onCurrencyChanged(item, newValue);
    }

    // Update item in dataView
    this.angularGridInstance.dataView.updateItem(item.id, item);
    this.angularGridInstance.slickGrid.invalidate();
    this.angularGridInstance.slickGrid.render();

    // Sync dataset (giống payment-order-detail)
    this.dataset = [...this.angularGridInstance.dataView.getItems()];
  }

  // Handle ProductSale selection change
  private onProductSaleChanged(item: any, productCode: string): void {
    if (!productCode) return;

    const product = this.productSales.find((p: any) => 
      p.ProductCode === productCode || 
      p.ProductNewCode === productCode ||
      `${p.ProductCode} - ${p.ProductName}` === productCode
    );

    if (product) {
      // Auto-fill product data
      item.ProductCode = product.ProductCode || '';
      item.ProductName = product.ProductName || '';
      item.Manufacturer = product.Maker || '';
      item.ProductNewCode = product.ProductNewCode || product.ProductCode || '';
      
      // Find UnitCount ID from UnitName (theo WinForm: set UnitName bằng ID)
      if (product.Unit) {
        const unit = this.unitCounts.find((u: any) => 
          u.UnitName === product.Unit
        );
        if (unit && unit.ID) {
          item.UnitName = unit.ID; // Set ID, không phải tên
        }
      }

      // Set ProductGroupID từ product hoặc default Marketing
      if (product.ProductGroupID) {
        item.ProductGroupID = product.ProductGroupID;
      } else {
        // Set default to Marketing group
        item.ProductGroupID = PRODUCT_GROUP_MKT_ID;
      }
    }
  }

  // Handle Currency selection change - có thể update nhiều dòng nếu đã chọn
  private onCurrencyChanged(item: any, currencyId: number): void {
    if (!currencyId || currencyId <= 0) {
      item.CurrencyRate = 0;
      return;
    }

    const currency = this.currencies.find((c: any) => c.ID === currencyId);
    if (currency) {
      const currencyRate = currency.CurrencyRate || 0;
      
      // Nếu có nhiều dòng được chọn, update tất cả
      if (this.angularGridInstance) {
        const selectedRows = this.angularGridInstance.slickGrid.getSelectedRows();
        
        if (selectedRows.length > 0) {
          // Update tất cả các dòng được chọn
          selectedRows.forEach((rowIndex: number) => {
            const selectedItem = this.angularGridInstance.dataView.getItem(rowIndex);
            if (selectedItem) {
              selectedItem.CurrencyID = currencyId;
              selectedItem.CurrencyRate = currencyRate;
              this.angularGridInstance.dataView.updateItem(selectedItem.id, selectedItem);
            }
          });
        } else {
          // Chỉ update dòng hiện tại
          item.CurrencyID = currencyId;
          item.CurrencyRate = currencyRate;
        }
      } else {
        // Fallback: chỉ update item hiện tại
        item.CurrencyID = currencyId;
        item.CurrencyRate = currencyRate;
      }
    }
  }

  // Add new row - sử dụng gridService.addItem() (giống payment-order-detail)
  addNewRow(): void {
    if (!this.angularGridInstance || !this.gridService) return;

    // Lấy dataset hiện tại để tính STT và ID
    const currentItems = this.angularGridInstance.dataView.getItems() || [];
    const maxId = currentItems.length > 0 
      ? Math.max(...currentItems.map((item: any) => item.id || 0))
      : 0;

    const newRow: any = {
      id: maxId + 1, // Temporary ID
      TT: currentItems.length + 1,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      Manufacturer: '',
      SupplierSaleID: null,
      DateReturnExpected: null,
      Quantity: 0,
      UnitName: '',
      CurrencyID: null,
      CurrencyRate: 0,
      ProductGroupID: PRODUCT_GROUP_MKT_ID, // Default to Marketing group
      Note: '',
      ID: 0 // New row
    };

    // Sử dụng gridService.addItem() - event listeners sẽ tự động sync dataset
    this.gridService.addItem(newRow, { position: 'top', highlightRow: true });

    // Cập nhật lại STT cho tất cả các dòng và focus vào cell để edit
    setTimeout(() => {
      this.updateSTT();
      
      // Focus on new row (row 0 vì thêm vào đầu) và enable edit
      setTimeout(() => {
        // Tìm index của cột ProductNewCode
        const columns = this.angularGridInstance.slickGrid.getColumns();
        let productNewCodeColIndex = -1;
        
        for (let i = 0; i < columns.length; i++) {
          if (columns[i].field === 'ProductNewCode') {
            productNewCodeColIndex = i;
            break;
          }
        }
        
        if (productNewCodeColIndex >= 0) {
          // Set active cell
          this.angularGridInstance.slickGrid.setActiveCell(0, productNewCodeColIndex);
          
          // Đợi một chút để đảm bảo cell đã được set active, sau đó edit
          setTimeout(() => {
            try {
              this.angularGridInstance.slickGrid.editActiveCell();
            } catch (e) {
              console.warn('Could not edit active cell:', e);
              // Thử lại một lần nữa
              setTimeout(() => {
                this.angularGridInstance.slickGrid.editActiveCell();
              }, 100);
            }
          }, 150);
        }
      }, 100);
    }, 100);
  }

  // Delete row - sử dụng gridService.deleteItemById() (giống payment-order-detail)
  deleteRow(args: OnEventArgs): void {
    if (!this.angularGridInstance || !this.gridService) return;

    const item = args.dataContext;
    if (!item || !item.id) return;

    this.modal.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa dòng này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Sử dụng gridService.deleteItemById() - event listeners sẽ tự động sync dataset
        this.gridService.deleteItemById(item.id);
        
        // Cập nhật lại STT cho tất cả các dòng
        setTimeout(() => {
          this.updateSTT();
        }, 100);
      }
    });
  }

  // Cập nhật STT cho tất cả các dòng
  private updateSTT(): void {
    if (!this.angularGridInstance) return;

    const items = this.angularGridInstance.dataView.getItems() || [];
    items.forEach((item: any, index: number) => {
      item.TT = index + 1;
    });

    // Update items trong grid (event listeners sẽ tự động sync dataset)
    this.angularGridInstance.dataView.refresh();
    this.angularGridInstance.slickGrid.render();
  }

  // Close modal
  close(): void {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    }
  }

  // Save data
  saveData(): void {
    if (!this.angularGridInstance) return;

    // End edit
    this.angularGridInstance.slickGrid.setActiveCell(-1, -1);

    // Sync dataset từ dataView trước khi validate và lưu (đảm bảo dữ liệu mới nhất)
    const currentItems = this.angularGridInstance.dataView.getItems() || [];
    this.dataset = [...currentItems];

    // Validate
    if (!this.validateData()) {
      return;
    }

    // Prepare data to save
    const dataToSave = this.prepareDataToSave();

    if (dataToSave.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Bạn có muốn lưu dữ liệu không?',
      nzOkText: 'Lưu',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;

        const sub = this.srv.saveData(dataToSave).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || 'Lưu dữ liệu thành công');
            this.isLoading = false;
            
            // Đóng modal sau khi lưu thành công
            if (this.activeModal) {
              this.activeModal.close('saved');
            }
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lưu dữ liệu thất bại');
            this.isLoading = false;
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  // Validate data
  private validateData(): boolean {
    // Check employee
    if (!this.employeeID || this.employeeID <= 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn người yêu cầu!');
      return false;
    }

    // Check at least 1 row
    if (!this.dataset || this.dataset.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng tạo ít nhất một yêu cầu!');
      return false;
    }

    // Validate each row
    for (let i = 0; i < this.dataset.length; i++) {
      const row = this.dataset[i];
      const rowNumber = i + 1;

      // Check ProductCode
      if (!row.ProductCode || String(row.ProductCode).trim() === '') {
        this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Mã sản phẩm tại dòng [${rowNumber}]!`);
        return false;
      }

      // Check ProductName
      if (!row.ProductName || String(row.ProductName).trim() === '') {
        this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Tên sản phẩm tại dòng [${rowNumber}]!`);
        return false;
      }

      // Check Deadline
      if (!row.DateReturnExpected) {
        this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Deadline sản phẩm tại dòng [${rowNumber}]!`);
        return false;
      }

      // Check Deadline valid (>= 2 working days)
      if (!this.checkDeadline(new Date(row.DateReturnExpected))) {
        // Message đã được hiển thị trong checkDeadline
        return false;
      }

      // Check Quantity
      const quantity = parseFloat(row.Quantity) || 0;
      if (quantity <= 0) {
        this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập SL yêu cầu tại dòng [${rowNumber}]!`);
        return false;
      }
    }

    return true;
  }

  // Check deadline (>= 2 working days, exclude Saturday and Sunday)
  private checkDeadline(deadline: Date): boolean {
    if (!deadline) return false;

    // Admin bypass
    // if (this.appUserService.isAdmin) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const time = 15; // 15:00
    
    // Nếu ngày yêu cầu từ sau 15h, thì bắt đầu tính từ ngày hôm sau
    let dateRequest = new Date(now);
    if (currentHour >= time) {
      dateRequest.setDate(dateRequest.getDate() + 1);
    }

    // Nếu ngày yêu cầu là T7 hoặc CN thì bắt đầu tính từ T2
    const dayOfWeek = dateRequest.getDay();
    if (dayOfWeek === 6) { // Saturday
      dateRequest.setDate(dateRequest.getDate() + 2); // +2 để đến Monday
    } else if (dayOfWeek === 0) { // Sunday
      dateRequest.setDate(dateRequest.getDate() + 1); // +1 để đến Monday
    }

    // Set to start of day
    dateRequest.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    // Tính số ngày làm việc (không tính T7, CN)
    const listDates: Date[] = [];
    const totalDays = Math.ceil((deadlineDate.getTime() - dateRequest.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(dateRequest);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (!listDates.some(d => d.getTime() === date.getTime())) {
          listDates.push(date);
        }
      }
    }

    if (listDates.length < 2) {
      const dateStr = dateRequest.toLocaleDateString('vi-VN');
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Deadline phải ít nhất là 2 ngày tính từ [${dateStr}] và KHÔNG tính Thứ 7, Chủ nhật`
      );
      return false;
    }

    return true;
  }

  // Prepare data to save
  private prepareDataToSave(): any[] {
    const result: any[] = [];

    this.dataset.forEach((row: any) => {
      // Tìm ProductSaleID từ ProductNewCode (theo WinForm logic)
      let productSaleID = 0;
      const productNewCode = String(row.ProductNewCode || '').trim();
      if (productNewCode) {
        // Tìm ProductSale có ProductNewCode khớp
        const product = this.productSales.find((p: any) => 
          String(p.ProductNewCode || '').trim() === productNewCode ||
          String(p.ProductCode || '').trim() === productNewCode
        );
        if (product && product.ID) {
          productSaleID = product.ID;
        }
      }

      // Lấy UnitCountID từ UnitName (có thể là ID hoặc UnitName)
      let unitCountID = 0;
      if (row.UnitName) {
        const unit = this.unitCounts.find((u: any) => 
          u.ID === row.UnitName || 
          u.UnitName === row.UnitName
        );
        if (unit && unit.ID) {
          unitCountID = unit.ID;
        } else if (typeof row.UnitName === 'number') {
          unitCountID = row.UnitName;
        }
      }

      // Lấy UnitName string để lưu
      let unitNameString = '';
      if (unitCountID > 0) {
        const unit = this.unitCounts.find((u: any) => u.ID === unitCountID);
        unitNameString = unit ? unit.UnitName : '';
      } else if (row.UnitName) {
        unitNameString = String(row.UnitName);
      }

      const model: any = {
        ID: row.ID || 0,
        ProjectPartlistPurchaseRequestTypeID: this.requestTypeID,
        EmployeeID: this.employeeID,
        DateRequest: this.toStartOfDayISO(this.dateRequest),
        DateReturnExpected: row.DateReturnExpected ? this.toStartOfDayISO(new Date(row.DateReturnExpected)) : null,
        ProductCode: String(row.ProductCode || '').trim(),
        ProductName: String(row.ProductName || '').trim(),
        Manufacturer: String(row.Manufacturer || '').trim(),
        UnitName: unitNameString,
        UnitCountID: unitCountID,
        Quantity: parseFloat(row.Quantity) || 0,
        ProductGroupID: PRODUCT_GROUP_MKT_ID, // Fix = PRODUCT_GROUP_MKT_ID
        CurrencyID: row.CurrencyID || null,
        CurrencyRate: parseFloat(row.CurrencyRate) || 0,
        SupplierSaleID: row.SupplierSaleID || null,
        Note: String(row.Note || '').trim(),
        StatusRequest: 1, // Yêu cầu báo giá
        ProductNewCode: String(row.ProductNewCode || '').trim(),
        ProductSaleID: productSaleID,
      };

      result.push(model);
    });

    return result;
  }

  // Collection helpers
  private getProductSaleCollection(): Array<{ value: string; label: string }> {
    return (this.productSales || []).map((p: any) => ({
      value: p.ProductNewCode || p.ProductCode || '',
      label: `${p.ProductCode || ''} - ${p.ProductName || ''}`
    }));
  }

  private getFirmCollection(): Array<{ value: string; label: string }> {
    return (this.firms || []).map((f: any) => ({
      value: f.FirmCode || String(f.ID || ''),
      label: `${f.FirmCode || ''} - ${f.FirmName || ''}`
    }));
  }

  private getSupplierCollection(): Array<{ value: number; label: string }> {
    return (this.suppliers || []).map((s: any) => ({
      value: s.ID,
      label: `${s.CodeNCC || ''} - ${s.NameNCC || ''}`.replace(/^ - |^ -$| - $/g, '').trim() || s.NameNCC || ''
    }));
  }

  private getCurrencyCollection(): Array<{ value: number; label: string; currencyRate: number }> {
    return (this.currencies || []).map((c: any) => ({
      value: c.ID,
      label: `${c.Code || ''} - ${this.formatNumberEnUS(c.CurrencyRate || 0, 2)}`,
      currencyRate: c.CurrencyRate || 0
    }));
  }

  private getProductGroupCollection(): Array<{ value: number; label: string }> {
    return (this.productGroups || []).map((g: any) => ({
      value: g.ID,
      label: g.ProductGroupName || ''
    }));
  }

  private getUnitCountCollection(): Array<{ value: number; label: string }> {
    return (this.unitCounts || []).map((u: any) => ({
      value: u.ID || 0,
      label: u.UnitName || ''
    }));
  }

  // Format number
  private formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // Date formatting helpers
  private toStartOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const year = x.getFullYear();
    const month = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private toEndOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    const year = x.getFullYear();
    const month = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59`;
  }
}

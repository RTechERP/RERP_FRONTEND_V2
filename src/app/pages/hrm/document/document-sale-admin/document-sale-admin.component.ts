import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DocumentService } from '../document-service/document.service';
import { DocumentSaleAdminFormComponent } from '../document-sale-admin-form/document-sale-admin-form.component';
import * as ExcelJS from 'exceljs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { PermissionService } from '../../../../services/permission.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';

interface Document {
  STT: number;
  Code: string;
  NameDocument: string;
  DepartmentID: number;
  DatePromulgate: Date | null;
  DateEffective: Date | null;
  GroupType: number;
  IsPromulgated?: boolean;
  IsOnWeb?: boolean;
}

interface DocumentFile {
  ID: number;
  FileName: string;
}

@Component({
  selector: 'app-document-sale-admin',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzSplitterModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzSpinModule,
    HasPermissionDirective,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './document-sale-admin.component.html',
  styleUrl: './document-sale-admin.component.css',
})
export class DocumentSaleAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridFile!: AngularGridInstance;

  // Column definitions
  columnDefinitions: Column[] = [];
  columnDefinitionsFile: Column[] = [];

  // Grid options
  gridOptions: GridOption = {};
  gridOptionsFile: GridOption = {};

  // Datasets
  dataset: any[] = [];
  datasetFile: any[] = [];

  newDocument: Document = {
    STT: 0,
    Code: '',
    NameDocument: '',
    DepartmentID: 0,
    DatePromulgate: null,
    DateEffective: null,
    GroupType: 2,
  };

  newDocumentFile: DocumentFile = {
    ID: 0,
    FileName: '',
  };

  searchParams = {
    departmentID: -1,
    idDocumentType: 2,
  };

  data: any[] = [];
  documentData: any[] = [];
  documentID: number = 0;
  documentFileData: any[] = [];
  dataDepartment: any[] = [];

  isCheckmode: boolean = false;
  isLoading: boolean = false;

  selectedDocumentId: number = 0;
  selectedDocumentName: string = '';
  selectedDocumentTypeID: number = 0;
  selectedDocumentTypeCode: string = '';
  selectedRowData: any = null;
  documentFileID: number = 0;

  currentUser: any = null;

  // Menu bars
  menuBars: any[] = [];

  // Search bar visibility
  showSearchBar: boolean =
    typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  constructor(
    private notification: NzNotificationService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private message: NzMessageService,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Lấy thông tin user hiện tại
    this.currentUser = this.appUserService.currentUser;

    // Auto set phòng ban theo user đăng nhập
    if (this.currentUser?.DepartmentID) {
      this.searchParams.departmentID = this.currentUser.DepartmentID;
    }

    // Initialize grids
    this.initGrid();
    this.initGridFile();

    // Initialize menu bar
    this.initMenuBar();
  }

  ngAfterViewInit(): void {
    this.getdataDepartment();
  }

  initMenuBar(): void {
    this.menuBars = [];

    // Thêm/Sửa/Xóa
    this.menuBars.push(
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.onAddDocument(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.editDocument(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.onDeleteDocument(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel(),
      },
      {
        separator: true,
      },
      {
        label: 'Upload File',
        icon: 'fa-solid fa-upload fa-lg text-info',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.triggerFileInput(),
      },
      {
        label: 'Xóa File',
        icon: 'fa-solid fa-file-circle-xmark fa-lg text-danger',
        visible: this.permissionService.hasPermission('N2,N34,N1'),
        command: () => this.onDeleteDocumentFile(),
      },
      {
        label: 'Tải File',
        icon: 'fa-solid fa-download fa-lg text-primary',
        command: () => this.downloadFile(),
      }
    );
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  initGrid(): void {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    this.columnDefinitions = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        sortable: true,
        filterable: true,
      },
      {
        id: 'NameDocumentType',
        name: 'Loại văn bản',
        field: 'NameDocumentType',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'TypeCode',
        name: 'Mã loại văn bản',
        field: 'CodeDocumentType',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Code',
        name: 'Mã văn bản',
        field: 'Code',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'NameDocument',
        name: 'Tên văn bản',
        field: 'NameDocument',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'DatePromulgate',
        name: 'Ngày ban hành',
        field: 'DatePromulgate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: formatDate,
        type: 'date',
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'DateEffective',
        name: 'Ngày hiệu lực',
        field: 'DateEffective',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: formatDate,
        type: 'date',
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'DepartmentCode',
        name: 'Mã bộ phận',
        field: 'DepartmentCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'DepartmentName',
        name: 'Bộ phận phát hành',
        field: 'DepartmentName',
        width: 180,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'EmployeeSignCode',
        name: 'Mã người ký',
        field: 'EmployeeSignCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'EmployeeSignName',
        name: 'Tên người ký',
        field: 'EmployeeSignName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'AffectedScope',
        name: 'Phạm vi áp dụng',
        field: 'AffectedScope',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            autoAdjustDropPosition: true,
          } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#documentGridContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableCellNavigation: true,
      enableFiltering: true,
      rowHeight: 35,
      headerRowHeight: 40,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
    };
  }

  initGridFile(): void {
    this.columnDefinitionsFile = [
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (row, cell, value) => {
          if (value) {
            return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
          }
          return '';
        },
      },
    ];

    this.gridOptionsFile = {
      autoResize: {
        container: '#documentFileGridContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      rowHeight: 35,
      headerRowHeight: 40,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Map để track index màu của mỗi phòng ban
    const departmentColorMap = new Map<string, number>();
    let deptColorIndex = 0;

    // Setup grouping by DepartmentName và NameDocumentType
    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.setGrouping([
        {
          getter: 'DepartmentName',
          comparer: () => 0,
          formatter: (g: any) => {
            const deptName = g.value || 'Văn bản chung';

            // Gán màu cho phòng ban nếu chưa có
            if (!departmentColorMap.has(deptName)) {
              departmentColorMap.set(deptName, deptColorIndex % 10);
              deptColorIndex++;
            }
            const colorIndex = departmentColorMap.get(deptName);


            return `<span class="group-color-${colorIndex}" data-level="0">Phòng ban: <strong>${deptName}</strong>
                                <span style="margin-left:10px;">
                                (${g.count} VB)
                                </span></span>`;
          },
        },
        {
          getter: 'NameDocumentType',
          comparer: () => 0,
          formatter: (g: any) => {
            const docTypeName = g.value || 'Không phân loại';

            // Lấy phòng ban từ các rows trong group để lấy màu của phòng ban cha
            let deptName = '';
            if (g.rows && g.rows.length > 0) {
              deptName = g.rows[0].DepartmentName || 'Văn bản chung';
            }

            // Sử dụng CÙNG màu với phòng ban cha
            if (!departmentColorMap.has(deptName)) {
              departmentColorMap.set(deptName, deptColorIndex % 10);
              deptColorIndex++;
            }
            const colorIndex = departmentColorMap.get(deptName);

            return `<span class="group-color-${colorIndex}" data-level="1">Loại VB: <strong>${docTypeName}</strong>
                                <span style="margin-left:10px;">
                                (${g.count} VB)
                                </span></span>`;
          },
        },
      ]);
    }
  }

  angularGridFileReady(angularGrid: AngularGridInstance): void {
    this.angularGridFile = angularGrid;
  }

  onCellClicked(e: Event, args: any): void {
    const rowData = this.angularGrid?.dataView?.getItem(args.row);
    if (rowData) {
      this.selectedDocumentId = rowData.ID;
      this.selectedDocumentName = rowData.NameDocument || rowData.Code || '';
      this.selectedDocumentTypeID = rowData.DocumentTypeID || 0;
      this.selectedDocumentTypeCode = rowData.CodeDocumentType || '';
      this.selectedRowData = rowData;
      console.log('>>> Document selected:', {
        id: this.selectedDocumentId,
        name: this.selectedDocumentName,
        typeCode: this.selectedDocumentTypeCode,
        selectedRowData: this.selectedRowData
      });
      this.getDocumentFileByID(this.selectedDocumentId);
    }
  }

  onCellDblClicked(e: Event, args: any): void {
    const rowData = this.angularGrid?.dataView?.getItem(args.row);
    if (rowData) {
      this.editDocument(rowData);
    }
  }

  onFileCellDblClicked(e: Event, args: any): void {
    const rowData = this.angularGridFile?.dataView?.getItem(args.row);
    if (rowData) {
      this.data = [rowData];
      this.downloadFile();
    }
  }

  onSelectedRowsChanged(e: Event, args: any): void {
    if (args && args.rows && args.rows.length > 0) {
      const rowData = this.angularGrid?.dataView?.getItem(args.rows[0]);
      if (rowData) {
        this.selectedDocumentId = rowData.ID;
        this.selectedDocumentName = rowData.NameDocument || rowData.Code || '';
        this.selectedDocumentTypeID = rowData.DocumentTypeID || 0;
        this.selectedDocumentTypeCode = rowData.CodeDocumentType || '';
        this.selectedRowData = rowData;
        console.log('>>> Document selected (row change):', {
          id: this.selectedDocumentId,
          name: this.selectedDocumentName,
          typeCode: this.selectedDocumentTypeCode,
          selectedRowData: this.selectedRowData
        });
        this.getDocumentFileByID(this.selectedDocumentId);
      }
    }
  }

  onFileSelectedRowsChanged(e: Event, args: any): void {
    if (args && args.rows && args.rows.length > 0) {
      const rowData = this.angularGridFile?.dataView?.getItem(args.rows[0]);
      if (rowData) {
        this.data = [rowData];
        this.documentFileID = rowData.ID;
      }
    }
  }

  getSelectedData(): any[] {
    if (!this.angularGrid?.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes
      .map((idx: number) => this.angularGrid.dataView?.getItem(idx))
      .filter(Boolean);
  }

  applyDistinctFilters(): void {
    if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;

    const columnsToDistinct = [
      'STT',
      'NameDocumentType',
      'CodeDocumentType',
      'Code',
      'NameDocument',
      'DepartmentCode',
      'DepartmentName',
      'EmployeeSignCode',
      'EmployeeSignName',
      'AffectedScope',
    ];

    const data = this.angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const columns = this.angularGrid.slickGrid.getColumns();

    columnsToDistinct.forEach((field) => {
      const distinctValues = Array.from(
        new Set(
          data
            .map((item) => item[field])
            .filter((val) => val !== null && val !== undefined && val !== '')
        )
      );
      const collection = distinctValues
        .sort()
        .map((val) => ({ value: String(val), label: String(val) }));

      // Update both the component's columnDefinitions and the grid's active columns
      const colDef = this.columnDefinitions.find((c) => c.field === field);
      if (colDef && colDef.filter) {
        colDef.filter.collection = collection;
      }

      const activeCol = columns.find((c) => c.field === field);
      if (activeCol && activeCol.filter) {
        activeCol.filter.collection = collection;
      }
    });

    // Force grid to recognize new column definitions (and their filters)
    this.angularGrid.slickGrid.setColumns(columns);
    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();
  }

  getDocument() {
    this.isLoading = true;
    this.documentService
      .getDocumentAdminSale(this.searchParams.departmentID)
      .subscribe({
        next: (response: any) => {
          // API mới trả về trực tiếp data là array
          this.documentData = response.data || [];
          this.dataset = this.documentData.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index + 1,
          }));

          // Apply distinct filters after data is loaded
          setTimeout(() => {
            this.applyDistinctFilters();

            // Force resize
            if (this.angularGrid?.resizerService) {
              this.angularGrid.resizerService.resizeGrid();
            }
            if (this.angularGridFile?.resizerService) {
              this.angularGridFile.resizerService.resizeGrid();
            }

            // Select first row if data exists
            if (this.dataset.length > 0 && this.angularGrid?.slickGrid) {
              const firstItem = this.dataset[0];
              if (firstItem && firstItem.ID) {
                this.selectedDocumentId = firstItem.ID;
                this.selectedDocumentTypeCode = firstItem.CodeDocumentType || '';
                this.selectedRowData = firstItem;
                this.angularGrid.slickGrid.setSelectedRows([0]);
                this.getDocumentFileByID(this.selectedDocumentId);
              } else {
                this.selectedDocumentId = 0;
                this.datasetFile = [];
              }
            } else {
              this.selectedDocumentId = 0;
              this.datasetFile = [];
            }
          }, 100);

          this.isLoading = false;
        },
        error: (err: any) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE['error'],
            'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
          );
        },
      });
  }

  getDocumentFileByID(id: number) {
    this.documentService.getDocumentFileByID(id).subscribe((response: any) => {
      this.documentFileData = response.data || [];
      this.datasetFile = this.documentFileData.map(
        (item: any, index: number) => ({
          ...item,
          id: item.ID || index + 1,
        })
      );
    });
  }

  getdataDepartment() {
    this.documentService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];

      // Thêm 1 phần tử mới vào mảng
      this.dataDepartment.push({
        ID: 0,
        Name: 'Văn bản chung',
      });
      this.getDocument();
    });
  }

  //search phòng ban
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  onDepartmentChange(value: number) {
    this.searchParams.departmentID = value;
    this.getDocument();
  }

  onAddDocument() {
    const modalRef = this.modalService.open(DocumentSaleAdminFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newwarehouse = this.newDocument;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.warehouseID = this.documentID;
    modalRef.componentInstance.dataDepartment = this.dataDepartment;
    modalRef.componentInstance.searchParams = this.searchParams;
    modalRef.componentInstance.documentTypeID = 2;
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDocument();
        }
      },
      (reason) => { }
    );
  }

  editDocument(documentData?: any) {
    const dataToEdit = documentData || this.getSelectedData()?.[0];

    if (!dataToEdit) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một văn bản để sửa!'
      );
      return;
    }

    const modalRef = this.modalService.open(DocumentSaleAdminFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newwarehouse = this.newDocument;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.warehouseID = this.documentID;
    modalRef.componentInstance.dataDepartment = this.dataDepartment;
    modalRef.componentInstance.searchParams = this.searchParams;
    modalRef.componentInstance.documentTypeID = 2;
    modalRef.componentInstance.dataInput = dataToEdit;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDocument();
        }
      },
      (reason) => { }
    );
  }

  onDeleteDocument() {
    const dataSelect = this.getSelectedData();

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }

    const payloads = {
      ...dataSelect[0],
      IsDeleted: true,
      UpdatedBy: 'admin',
    };

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].Code} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.documentService.saveDocument(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.getDocument();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

  // Upload file
  beforeUpload = (file: NzUploadFile): boolean => {
    if (!this.selectedDocumentId) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn văn bản để upload file!'
      );
      return false;
    }

    const rawFile = (file as any).originFileObj || file;

    if (!(rawFile instanceof File)) {
      this.notification.error('Thông báo', 'Không lấy được file gốc!');
      return false;
    }

    this.uploadFile(rawFile);
    return false;
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
      input.value = '';
    }
  }

  uploadFile(file: File): void {
    if (!this.selectedDocumentId) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn văn bản để upload file!'
      );
      return;
    }

    // Tạo subPath dùng tên văn bản để dễ hiểu
    const safeName = this.selectedDocumentName.replace(/[\\/:*?"<>|]/g, '_'); // Loại bỏ ký tự không hợp lệ
    const subPath = `Documents/${safeName}`;

    const loadingMsg = this.message.loading(`Đang tải lên ${file.name}...`, {
      nzDuration: 0,
    }).messageId;

    console.log('>>> DocumentSaleAdminComponent.uploadFile:', {
      selectedDocumentId: this.selectedDocumentId,
      selectedDocumentTypeCode: this.selectedDocumentTypeCode,
      subPath: subPath
    });

    this.documentService
      .uploadMultipleFiles([file], this.selectedDocumentTypeCode, subPath, 'EconomicContract')
      .subscribe({
        next: (res) => {
          this.message.remove(loadingMsg);

          if (res?.status === 1 && res?.data?.length > 0) {
            const uploadedFile = res.data[0];

            const fileRecord = {
              DocumentID: this.selectedDocumentId,
              FileName: uploadedFile.SavedFileName,
              FilePath: uploadedFile.FilePath,
              FileNameOrigin: uploadedFile.OriginalFileName || file.name,
            };

            this.documentService.saveDocumentFile(fileRecord).subscribe({
              next: (saveRes) => {
                if (saveRes?.status === 1) {
                  this.notification.success(
                    'Thành công',
                    `Upload ${file.name} hoàn tất!`
                  );
                  this.getDocumentFileByID(this.selectedDocumentId);
                } else {
                  this.notification.error(
                    'Lỗi',
                    saveRes?.message || 'Lưu thông tin file thất bại!'
                  );
                }
              },
              error: (err) => {
                this.notification.error(
                  'Lỗi',
                  err?.error?.message || 'Lưu thông tin file thất bại!'
                );
              },
            });
          } else {
            this.notification.error(
              'Lỗi',
              res?.message || 'Upload file thất bại!'
            );
          }
        },
        error: (err) => {
          this.message.remove(loadingMsg);
          this.notification.error(
            'Lỗi',
            err?.error?.message || 'Upload file thất bại!'
          );
        },
      });
  }

  triggerFileInput(): void {
    if (!this.selectedDocumentId) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn văn bản để upload file!'
      );
      return;
    }
    this.fileInput.nativeElement.click();
  }

  exportExcel(): void {
    // Get filtered data from grid
    const filteredData =
      this.angularGrid?.dataView?.getFilteredItems() || this.dataset;

    if (!filteredData.length) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('VĂN BẢN SALE ADMIN');

    const columns = this.columnDefinitions.filter(
      (c) => c.field && c.field.trim() !== ''
    );

    worksheet.addRow(columns.map((c) => c.name || c.field || ''));

    filteredData.forEach((row: any) => {
      worksheet.addRow(
        columns.map((c) => {
          const val = row[c.field!];
          switch (c.field) {
            case 'DatePromulgate':
            case 'DateEffective':
              return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
            default:
              return val ?? '';
          }
        })
      );
    });

    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.font = { bold: true, name: 'Times New Roman', size: 12 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
          };
        } else {
          cell.font = { name: 'Tahoma', size: 8.5 };
        }
      });
    });

    const currentDate = DateTime.now().toFormat('dd-MM-yyyy');
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VanBanChung_${currentDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadFile() {
    if (!this.data || this.data.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một file để tải xuống!'
      );
      return;
    }

    const file = this.data[0];

    //Fallback download if FilePath is missing (Legacy Sale Admin structure)
    if (!file.FilePath && file.FileName) {
      if (this.selectedRowData) {
        const deptCode = this.selectedRowData.DepartmentCode || 'Unknown';
        const typeName = this.selectedRowData.NameDocumentType || 'Unknown';
        const directUrl = `http://14.232.152.154:8083/api/formadminsale/${deptCode}/${typeName}/${file.FileName}`;

        const link = document.createElement('a');
        link.href = directUrl;
        link.download = file.FileName || 'downloaded_file';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.notification.success('Thông báo', 'Đang tải xuống file từ server dự phòng...');
        return;
      } else {
        this.notification.error('Thông báo', 'Không có thông tin văn bản để tải file dự phòng!');
        return;
      }
    }

    if (!file.FilePath) {
      this.notification.error(
        'Thông báo',
        'Không có đường dẫn file để tải xuống!'
      );
      return;
    }

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.documentService
      .downloadFileSale(file.FileName, this.selectedDocumentName, this.selectedDocumentTypeCode)
      .subscribe({
        next: (blob: Blob) => {
          this.message.remove(loadingMsg);

          if (blob && blob.size > 0) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download =
              file.FileName || file.FileNameOrigin || 'downloaded_file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.notification.success('Thông báo', 'Tải xuống thành công!');
          } else {
            this.notification.error('Thông báo', 'File tải về không hợp lệ!');
          }
        },
        error: (res: any) => {
          this.message.remove(loadingMsg);
          const errorMsg =
            res?.error?.message ||
            res?.message ||
            'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        },
      });
  }

  onDeleteDocumentFile() {
    if (!this.data || this.data.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một file để xóa!'
      );
      return;
    }

    const dataSelect = this.data;
    const payloads = {
      ...dataSelect[0],
      IsDeleted: true,
      UpdatedBy: 'admin',
    };

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].FileName} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.documentService.saveDocumentFile(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.datasetFile = this.datasetFile.filter(
                (f) => f.ID !== dataSelect[0].ID
              );
              this.data = [];
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }
}

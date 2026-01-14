import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnClickEventArgs,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { EconomicContractService } from './economic-contract-service/economic-contract.service';
import { EconomicContractFormComponent } from './economic-contract-form/economic-contract-form.component';
import { EconomicContractImportExcelComponent } from './economic-contract-import-excel/economic-contract-import-excel.component';
import { DateTime } from 'luxon';
import { saveAs } from 'file-saver';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-economic-contract',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NzNotificationModule,
    NzModalModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule,
    Menubar,
    AngularSlickgridModule,
    EconomicContractImportExcelComponent,
    NzTabsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './economic-contract.component.html',
  styleUrl: './economic-contract.component.css'
})
export class EconomicContractComponent implements OnInit {
  private ngbModal = inject(NgbModal);

  menuBars: MenuItem[] = [];
  searchForm!: FormGroup;

  // Search bar visibility
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  isLoading = false;

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  // Dropdown options
  typeNCCOptions = [
    { value: 0, label: 'Tất cả' },
    { value: 1, label: 'NCC' },
    { value: 2, label: 'KH' }
  ];
  contractTypes: any[] = [];

  // SlickGrid Master
  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // SlickGrid Detail - File
  angularGridFile!: AngularGridInstance;
  gridDataFile: any;
  columnDefinitionsFile: Column[] = [];
  gridOptionsFile: GridOption = {};
  datasetFile: any[] = [];

  // Selected rows
  selectedRow: any = null;
  selectedFileRow: any = null;

  // File upload
  @ViewChild('fileUploadInput') fileUploadInput!: ElementRef<HTMLInputElement>;

  private excelExportService = new ExcelExportService();

  constructor(
    private fb: FormBuilder,
    private economicContractService: EconomicContractService,
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private message: NzMessageService
  ) {
    this.initializeForm();
  }


  ngOnInit(): void {
    this.loadContractTypes();
    this.initMenuBar();
    this.initGrid();
    this.initGridFile();
    this.loadData();
  }

  private initializeForm(): void {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm = this.fb.group({
      dateStart: [firstDay],
      dateEnd: [lastDay],
      keyword: [''],
      typeNCC: [0],
      type: [0]
    });
  }

  loadContractTypes() {
    this.economicContractService.getEconomicContractTypes().subscribe({
      next: (res) => {
        if (res?.status === 1) {
          const data = res.data?.data || [];
          this.contractTypes = [{ ID: 0, TypeName: 'Tất cả' }, ...data];
        }
      }
    });
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => {
          this.onCreate();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => {
          this.onEdit();
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.onDelete();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        }
      },
      {
        label: 'Nhập Excel',
        icon: 'fa-solid fa-file-import fa-lg text-primary',
        command: () => {
          this.importExcel();
        }
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => {
          this.loadData();
        }
      }
    ];
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        type: 'number',
        width: 60,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Thông tin hợp đồng',
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-center',
      },

      {
        id: 'TypeName',
        name: 'Mã loại',
        field: 'TypeCode',
        type: 'string',
        width: 80,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Thông tin hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'TypeName',
        name: 'Tên loại',
        field: 'TypeName',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Thông tin hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ContractNumber',
        name: 'Số hợp đồng',
        field: 'ContractNumber',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Thông tin hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ContractContent',
        name: 'Nội dung hợp đồng',
        field: 'ContractContent',
        type: 'string',
        minWidth: 300,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Thông tin hợp đồng',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TermName',
        name: 'Điều khoản',
        field: 'TermName',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //   columnGroup: 'Thông tin hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'TypeNCCText',
        name: 'Loại NCC/KH',
        field: 'TypeNCCText',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        //  columnGroup: 'NCC/KH',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'NameNcc',
        name: 'Tên NCC/KH',
        field: 'NameNcc',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        //   columnGroup: 'NCC/KH',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'MSTNcc',
        name: 'MST',
        field: 'MSTNcc',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        // columnGroup: 'NCC/KH',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'AddressNcc',
        name: 'Địa chỉ',
        field: 'AddressNcc',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        /// columnGroup: 'NCC/KH',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SDTNcc',
        name: 'SĐT',
        field: 'SDTNcc',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        //   columnGroup: 'NCC/KH',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'EmailNcc',
        name: 'Email',
        field: 'EmailNcc',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        // columnGroup: 'NCC/KH',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SignedAmount',
        name: 'Giá trị ký',
        field: 'SignedAmount',
        type: 'number',
        width: 150,
        sortable: true,
        filterable: true,
        //   columnGroup: 'Chi tiết hợp đồng',
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
        formatter: (_row, _cell, value) => {
          if (value == null) return '';
          return Number(value).toLocaleString('vi-VN');
        },
      },
      {
        id: 'MoneyType',
        name: 'Loại tiền',
        field: 'MoneyType',
        type: 'string',
        width: 80,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Chi tiết hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'SignDate',
        name: 'Ngày ký',
        field: 'SignDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Chi tiết hợp đồng',
        formatter: Formatters.dateEuro,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'EffectDateFrom',
        name: 'Hiệu lực từ',
        field: 'EffectDateFrom',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        // columnGroup: 'Chi tiết hợp đồng',
        formatter: Formatters.dateEuro,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'EffectDateTo',
        name: 'Hiệu lực đến',
        field: 'EffectDateTo',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Chi tiết hợp đồng',
        formatter: Formatters.dateEuro,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'TimeUnit',
        name: 'Đơn vị thời gian',
        field: 'TimeUnit',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Chi tiết hợp đồng',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Adjustment',
        name: 'Điều chỉnh',
        field: 'Adjustment',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //columnGroup: 'Chi tiết hợp đồng',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'StatusContractText',
        name: 'Trạng thái',
        field: 'StatusContractText',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //  columnGroup: 'Chi tiết hợp đồng',
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        //    columnGroup: 'Chi tiết hợp đồng',
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        filterable: true,
        //    columnGroup: 'Chi tiết hợp đồng',
        formatter: Formatters.dateIso,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
        hidden: true,
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        //    columnGroup: 'Chi tiết hợp đồng',
        filter: { model: Filters['compoundInputText'] },
        hidden: true,
      },
    ];

    this.gridOptions = {
      datasetIdPropertyName: 'id',
      autoResize: {
        container: '#grid-container-economic-contract',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      multiSelect: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: false,
        hideSelectAllCheckbox: false,
        applySelectOnAllPages: true
      },
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowHeight: 30,
      headerRowHeight: 35,
      createPreHeaderPanel: false,
      showPreHeaderPanel: false,
      preHeaderPanelHeight: 28,

      // Excel Export
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
        columnHeaderStyle: {
          font: { fontName: 'Times New Roman', size: 12, bold: true, color: '#000000' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF33CC33' },
          alignment: { horizontal: 'center' },
          border: {
            top: { color: 'FF000000', style: 'thin' },
            left: { color: 'FF000000', style: 'thin' },
            right: { color: 'FF000000', style: 'thin' },
            bottom: { color: 'FF000000', style: 'thin' }
          }
        },
        dataStyle: {
          font: { fontName: 'Times New Roman', size: 12 },
          border: {
            top: { color: 'FF000000', style: 'thin' },
            left: { color: 'FF000000', style: 'thin' },
            right: { color: 'FF000000', style: 'thin' },
            bottom: { color: 'FF000000', style: 'thin' }
          }
        }
      } as any,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid.dataView;
  }

  // Grid File initialization
  initGridFile() {
    this.columnDefinitionsFile = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        type: 'number',
        width: 60,
        sortable: true,
        cssClass: 'text-center',
      },
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        type: 'string',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'OriginPath',
        name: 'Tên file gốc',
        field: 'OriginPath',
        type: 'string',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        type: 'dateIso',
        width: 120,
        sortable: true,
        cssClass: 'text-center',
        formatter: Formatters.dateEuro,
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      }
    ];

    this.gridOptionsFile = {
      datasetIdPropertyName: 'id',
      autoResize: {
        container: '#grid-container-contract-file',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCellNavigation: true,
      enableFiltering: false,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      rowHeight: 30,
      headerRowHeight: 35,
    };
  }

  angularGridFileReady(angularGrid: AngularGridInstance) {
    this.angularGridFile = angularGrid;
    this.gridDataFile = angularGrid.dataView;
  }

  // Master grid cell click - load file detail
  onCellClicked(e: Event, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      // Tránh gọi lại nếu click vào cùng 1 row
      if (this.selectedRow?.ID === item.ID) {
        return;
      }
      this.selectedRow = item;
      this.selectedFileRow = null; // Reset selected file khi đổi contract
      this.loadFilesByContractId(item.ID);
    }
  }

  // File grid cell click
  onFileCellClicked(e: Event, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.selectedFileRow = item;
    }
  }

  // File double click - download/view file
  onFileDoubleClick(e: Event, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item && item.ServerPath) {
      // ServerPath format: \\192.168.1.190\Software\Teast\...
      // Cần lấy phần từ Software trở đi: Software/Teast/...
      const serverPath = item.ServerPath.replace(/\\/g, '/'); // Replace all \ with /

      // Tìm vị trí của 'Software' và lấy từ đó
      const softwareIndex = serverPath.indexOf('Software');
      if (softwareIndex === -1) {
        console.error('Không tìm thấy "Software" trong đường dẫn:', serverPath);
        return;
      }

      const path = serverPath.substring(softwareIndex);
      const fileUrl = environment.host + 'api/share/' + path;
      window.open(fileUrl, '_blank');
    }
  }

  // Load files by contract ID
  loadFilesByContractId(contractId: number) {
    if (!contractId) {
      this.datasetFile = [];
      return;
    }

    this.economicContractService.getFileByContractId(contractId).subscribe({
      next: (res) => {
        console.log('File response:', res);
        if (res?.status === 1) {
          const files = res.data || [];
          this.datasetFile = files.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1
          }));
          console.log('datasetFile:', this.datasetFile);

          // Trigger grid resize after data is loaded
          setTimeout(() => {
            if (this.angularGridFile?.resizerService) {
              this.angularGridFile.resizerService.resizeGrid();
            }
          }, 100);
        } else {
          this.datasetFile = [];
        }
      },
      error: () => {
        this.datasetFile = [];
      }
    });
  }

  // Upload file button click
  onUploadFile() {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một hợp đồng trước');
      return;
    }
    this.fileUploadInput.nativeElement.click();
  }

  // File input change - upload files
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.uploadFiles(files);
    input.value = ''; // Reset input
  }

  // Upload files to server
  private uploadFiles(files: File[]) {
    if (!this.selectedRow) return;

    const contract = this.selectedRow;
    // Build subPath: TypeCode/ContractNumber/SignDate
    const typeCode = contract.TypeCode || 'Unknown';
    const contractNumber = contract.ContractNumber || 'Unknown';
    const signDate = contract.SignDate
      ? DateTime.fromISO(contract.SignDate).toFormat('yyyy-MM-dd')
      : 'UnknownDate';
    const subPath = `${typeCode}/${contractNumber}/${signDate}`;

    this.isLoading = true;

    // Sử dụng service thay vì fetch native để có Authorization header
    this.economicContractService.uploadMultipleFiles(files, subPath).subscribe({
      next: (uploadRes: any) => {
        if (uploadRes?.status !== 1 || !uploadRes?.data?.length) {
          this.notification.error(NOTIFICATION_TITLE.error, uploadRes?.message || 'Upload file thất bại');
          this.isLoading = false;
          return;
        }

        // Save metadata for each uploaded file
        const savePromises = uploadRes.data.map((fileInfo: any) => {
          const payload = {
            ID: 0,
            EconomicContractID: contract.ID,
            FileName: fileInfo.SavedFileName,
            OriginPath: fileInfo.OriginalFileName,
            ServerPath: fileInfo.FilePath,
            IsDeleted: false
          };
          return this.economicContractService.saveContractFile(payload).toPromise();
        });

        Promise.all(savePromises)
          .then(() => {
            this.notification.success(NOTIFICATION_TITLE.success, `Upload ${files.length} file thành công!`);
            this.loadFilesByContractId(contract.ID);
            this.isLoading = false;
          })
          .catch(err => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lưu thông tin file thất bại');
            this.isLoading = false;
          });
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Upload file thất bại');
        this.isLoading = false;
      }
    });
  }

  // Delete file
  onDeleteFile() {
    if (!this.selectedFileRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một file để xóa');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa file "${this.selectedFileRow.FileName}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = {
          ID: this.selectedFileRow.ID,
          IsDeleted: true
        };

        this.economicContractService.saveContractFile(payload).subscribe({
          next: (res) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa file thành công!');
              this.loadFilesByContractId(this.selectedRow.ID);
              this.selectedFileRow = null;
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa file thất bại');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Xóa file thất bại');
          }
        });
      }
    });
  }


  loadData() {
    this.isLoading = true;
    const formValue = this.searchForm.value;

    const request = {
      dateStart: formValue.dateStart ? new Date(formValue.dateStart).toISOString() : '',
      dateEnd: formValue.dateEnd ? new Date(formValue.dateEnd).toISOString() : '',
      keyword: formValue.keyword || '',
      typeNCC: formValue.typeNCC || 0,
      type: formValue.type || 0
    };

    this.economicContractService.getEconomicContracts(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.status === 1) {
          const dataList = res.data?.[0] || [];
          this.dataset = dataList.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1
          }));
          this.updateFilterCollections();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Lỗi khi lấy dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi lấy dữ liệu:', err);
      }
    });
  }

  resetSearch() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm.reset({
      dateStart: firstDay,
      dateEnd: lastDay,
      keyword: '',
      typeNCC: 0,
      type: 0
    });
    this.loadData();
  }

  onCreate() {
    const modalRef = this.ngbModal.open(EconomicContractFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.loadData();
    });
    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      (dismissed) => { }
    );
  }

  onEdit() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
      return;
    }
    const rowIndex = selectedRows[0];
    const rowData = this.angularGrid.dataView.getItem(rowIndex);

    const modalRef = this.ngbModal.open(EconomicContractFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = { ...rowData };
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      this.loadData();
    });
    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      (dismissed) => { }
    );
  }

  onDelete() {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng để xóa!');
      return;
    }

    const selectedIds = selectedRows.map(index => this.angularGrid.dataView.getItem(index).ID);
    let content = '';
    if (selectedIds.length === 1) {
      const rowData = this.angularGrid.dataView.getItem(selectedRows[0]);
      content = `Bạn chắc chắn muốn xóa hợp đồng <b>${rowData.ContractNumber}</b>?`;
    } else {
      content = `Bạn chắc chắn muốn xóa <b>${selectedIds.length}</b> hợp đồng đã chọn?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        return this.economicContractService.deleteEconomicContract(selectedIds)
          .toPromise()
          .then((res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công');
              this.loadData();
              this.angularGrid.slickGrid.setSelectedRows([]);
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          })
          .catch((err) => {
            const msg = err?.error?.message || err?.message || 'Không gọi được API';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          });
      },
    });
  }

  async exportToExcel() {
    const formValue = this.searchForm.value;
    const dateStart = DateTime.fromJSDate(formValue.dateStart).toFormat('ddMMyyyy');
    const dateEnd = DateTime.fromJSDate(formValue.dateEnd).toFormat('ddMMyyyy');
    const now = DateTime.fromJSDate(new Date()).toFormat('HHmmss');
    const fileName = `HopDongKinhTe_${dateStart}_${dateEnd}_${now}.xlsx`;

    // Kiểm tra có dữ liệu không
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }

    // Hiển thị loading
    const loadingMsg = this.message.loading('Đang xuất Excel...', {
      nzDuration: 0,
    }).messageId;

    try {
      // Lấy template từ API share
      const templateUrl = environment.host + 'api/share/Software/Template/ExportExcel/TemplateExportExcelEconomicContract.xlsx';

      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error('Không thể tải template Excel');
      }

      const templateBlob = await response.arrayBuffer();

      // Load template bằng ExcelJS
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBlob);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        this.message.remove(loadingMsg);
        this.notification.error(NOTIFICATION_TITLE.error, 'Template Excel không hợp lệ!');
        return;
      }

      // Đổ dữ liệu từ dòng 4
      const startRow = 4;
      this.dataset.forEach((item, index) => {
        const rowIndex = startRow + index;
        const row = worksheet.getRow(rowIndex);

        // Map dữ liệu vào các cột theo template
        row.getCell(1).value = index + 1; // STT
        row.getCell(2).value = item.TypeCode || '';
        row.getCell(3).value = item.TypeName || '';
        row.getCell(4).value = item.ContractNumber || '';
        row.getCell(5).value = item.ContractContent || '';
        row.getCell(6).value = item.TypeNCCText || '';
        row.getCell(7).value = item.NameNcc || '';
        row.getCell(8).value = item.MSTNcc || '';
        row.getCell(9).value = item.AddressNcc || '';
        row.getCell(10).value = item.SDTNcc || '';
        row.getCell(11).value = item.EmailNcc || '';
        row.getCell(12).value = item.SignedAmount || 0;
        row.getCell(13).value = item.MoneyType || '';
        row.getCell(14).value = item.TimeUnit || '';
        row.getCell(15).value = item.Adjustment || '';
        row.getCell(16).value = item.Note || '';
        row.getCell(17).value = item.SignDate ? DateTime.fromISO(item.SignDate).toFormat('dd/MM/yyyy') : '';
        row.getCell(18).value = item.EffectDateFrom ? DateTime.fromISO(item.EffectDateFrom).toFormat('dd/MM/yyyy') : '';
        row.getCell(19).value = item.EffectDateFrom ? DateTime.fromISO(item.EffectDateFrom).toFormat('dd/MM/yyyy') : '';
        row.getCell(20).value = item.EffectDateTo ? DateTime.fromISO(item.EffectDateTo).toFormat('dd/MM/yyyy') : '';
        row.getCell(21).value = item.TermCode || '';
        row.getCell(22).value = item.TermName || '';
        row.getCell(23).value = item.StatusContractText || '';
        row.commit();
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      this.message.remove(loadingMsg);
      saveAs(blob, fileName);
      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');

    } catch (err) {
      this.message.remove(loadingMsg);
      console.error('Lỗi xuất Excel:', err);
      this.notification.error(NOTIFICATION_TITLE.error, 'Xuất Excel thất bại! Vui lòng thử lại.');
    }
  }



  openModalImportExcel() {
    const modalRef = this.ngbModal.open(EconomicContractImportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        // Reload data after modal closes
        this.loadData();
      },
      (dismissed) => {
        // Reload data even when dismissed
        this.loadData();
      }
    );
  }

  importExcel() {
    this.openModalImportExcel();
  }

  updateFilterCollections() {
    if (!this.angularGrid?.slickGrid) return;

    this.columnDefinitions.forEach(column => {
      if (column.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field as string;
        const uniqueValues = Array.from(new Set(this.dataset.map(item => item[field])))
          .filter(val => val !== undefined && val !== null && val !== '')
          .sort()
          .map(val => ({ label: String(val), value: val }));

        column.filter.collection = uniqueValues;
      }
    });

    // Sử dụng setColumns thay vì reassign columnDefinitions để giữ lại checkbox column
    this.angularGrid.slickGrid.setColumns(this.angularGrid.slickGrid.getColumns());
  }
}

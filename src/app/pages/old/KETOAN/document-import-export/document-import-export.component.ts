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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
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

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { DocumentImportExportService } from './document-import-export-service/document-import-export.service';
import { DocumentImportExportDetailComponent } from './document-import-export-detail/document-import-export-detail.component';

@Component({
  selector: 'app-document-import-export',
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
    NzFormModule,
    NzTreeSelectModule,
    CommonModule,
    HasPermissionDirective,
    DocumentImportExportDetailComponent,
  ],
  templateUrl: './document-import-export.component.html',
  styleUrl: './document-import-export.component.css'
})
export class DocumentImportExportComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Import', { static: false }) tb_ImportElement!: ElementRef;
  @ViewChild('tb_Export', { static: false }) tb_ExportElement!: ElementRef;

  tb_Import!: Tabulator;
  tb_Export!: Tabulator;

  isModalVisible: boolean = false;
  isModalLoading: boolean = false;
  modalTitle: string = '';
  currentDocumentType: number = 1; // 1 = Import, 2 = Export
  editId: number | null = null;
  formData = {
    code: '',
    name: ''
  };

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private documentImportExportService: DocumentImportExportService,
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.initExportTable();
    this.initImportTable();

    this.loadDataExportTable();
    this.loadDataImportTable();
  }

  loadDataImportTable() {
    this.documentImportExportService.getDocumentImport().subscribe(
      (response) => {
        if (response.status === 1) {
          this.tb_Import.setData(response.data);
        } else {
          this.notification.error('Lỗi khi tải loại chứng từ phiếu nhập:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải loại chứng từ phiếu nhập:', error);
        return;
      }
    );
  }

  loadDataExportTable() {
    this.documentImportExportService.getDocumentExport().subscribe(
      (response) => {
        if (response.status === 1) {
          this.tb_Export.setData(response.data);
        } else {
          this.notification.error('Lỗi khi tải loại chứng từ phiếu xuất:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải loại chứng từ phiếu xuất:', error);
        return;
      }
    );
  }

  onAddImport() {
  const modalRef = this.modalService.open(DocumentImportExportDetailComponent, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });
  
  modalRef.componentInstance.documentType = 1; // Import
  modalRef.componentInstance.isEditMode = false;
  modalRef.componentInstance.documentId = 0;
  modalRef.componentInstance.documentData = null;

  modalRef.result.then(
    (result) => {
      if (result.success && result.reloadData) {
        this.loadDataImportTable();
      }
    },
    (reason) => {
      console.log('Modal closed');
    }
  );
}

  onEditImport() {
  const selectedRows = this.tb_Import.getSelectedRows();
  if (selectedRows.length === 0) {
    this.notification.warning('Cảnh báo', 'Vui lòng chọn dòng cần sửa');
    return;
  }

  const selectedData = this.tb_Import.getRow(selectedRows[0]).getData();
  
  const modalRef = this.modalService.open(DocumentImportExportDetailComponent, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });
  
  modalRef.componentInstance.documentType = 1; // Import
  modalRef.componentInstance.isEditMode = true;
  modalRef.componentInstance.documentId = selectedData['ID'];
  modalRef.componentInstance.documentData = selectedData;

  modalRef.result.then(
    (result) => {
      if (result.success && result.reloadData) {
        this.loadDataImportTable();
      }
    },
    (reason) => {
      console.log('Modal closed');
    }
  );
}

  onDeleteImport() {
    const selectedRows = this.tb_Import.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn dòng cần xóa');
      return;
    }

    // TODO: Implement delete functionality
    this.notification.info('Thông báo', 'Chức năng xóa đang phát triển');
  }

  onAddExport() {
  const modalRef = this.modalService.open(DocumentImportExportDetailComponent, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });
  
  modalRef.componentInstance.documentType = 2; // Export
  modalRef.componentInstance.isEditMode = false;
  modalRef.componentInstance.documentId = 0;
  modalRef.componentInstance.documentData = null;

  modalRef.result.then(
    (result) => {
      if (result.success && result.reloadData) {
        this.loadDataExportTable();
      }
    },
    (reason) => {
      console.log('Modal closed');
    }
  );
}

  onEditExport() {
  const selectedRows = this.tb_Export.getSelectedRows();
  if (selectedRows.length === 0) {
    this.notification.warning('Cảnh báo', 'Vui lòng chọn dòng cần sửa');
    return;
  }

  const selectedData = this.tb_Export.getRow(selectedRows[0]).getData();
  
  const modalRef = this.modalService.open(DocumentImportExportDetailComponent, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });
  
  modalRef.componentInstance.documentType = 2; // Export
  modalRef.componentInstance.isEditMode = true;
  modalRef.componentInstance.documentId = selectedData['ID'];
  modalRef.componentInstance.documentData = selectedData;

  modalRef.result.then(
    (result) => {
      if (result.success && result.reloadData) {
        this.loadDataExportTable();
      }
    },
    (reason) => {
      console.log('Modal closed');
    }
  );
}

  onDeleteExport() {
    const selectedRows = this.tb_Export.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn dòng cần xóa');
      return;
    }

    // TODO: Implement delete functionality
    this.notification.info('Thông báo', 'Chức năng xóa đang phát triển');
  }

  initImportTable(): void {
    this.tb_Import = new Tabulator(this.tb_ImportElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: false,
      paginationMode: 'local',
      layout: 'fitColumns',
      rowHeader: false,
      selectableRows: 1,
      columns: [
        {
          title: 'Mã chứng từ',
          field: 'DocumentImportCode',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Tên chứng từ',
          field: 'DocumentImportName',
          sorter: 'string',
          widthGrow: 15,
        },
      ],
    });
  }

  initExportTable(): void {
    this.tb_Export = new Tabulator(this.tb_ExportElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: false,
      paginationMode: 'local',
      layout: 'fitColumns',
      rowHeader: false,
      selectableRows: 1,
      columns: [
        {
          title: 'Mã chứng từ',
          field: 'Code',
          sorter: 'string',
          widthGrow: 15,
        },
        {
          title: 'Tên chứng từ',
          field: 'Name',
          sorter: 'string',
          widthGrow: 15,
        },
      ],
    });
  }
}

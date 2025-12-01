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
import { NzMessageService } from 'ng-zorro-antd/message';
import * as ExcelJS from 'exceljs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { RequestInvoiceStatusLinkService } from './request-invoice-status-link-service/request-invoice-status-link.service';
import { RequestInvoiceStatusComponent } from '../request-invoice-status/request-invoice-status.component';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { RequestInvoiceService } from '../request-invoice/request-invoice-service/request-invoice-service.service';
@Component({
  selector: 'app-request-invoice-status-link',
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
  templateUrl: './request-invoice-status-link.component.html',
  styleUrl: './request-invoice-status-link.component.css'
})
export class RequestInvoiceStatusLinkComponent implements OnInit, AfterViewInit {
  @Input() requestInvoiceID: number = 0;
  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;

  private tb_Table!: Tabulator;

  @ViewChild('tb_File', { static: false }) tb_FileElement!: ElementRef;

  private tb_File!: Tabulator;


  mainData: any[] = [];
  fileData: any[] = [];
  selectStatusData: any[] = [];
  listIdsStatusDel: number[] = [];
  deletedFileIds: number[] = [];
  selectedFile: any = null;
  private readonly SUPPLEMENT_STATUS_VALUE = 4;
  approvedStatus: any[] = [
    { value: 1, label: 'Chờ duyệt' },
    { value: 2, label: 'Duyệt' },
    { value: 3, label: 'Không duyệt' },
    { value: 4, label: 'Yêu cầu bổ sung' },
  ];
  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private requestInvoiceStatusLinkService: RequestInvoiceStatusLinkService,
    private requestInvoiceDetailService: RequestInvoiceDetailService,
    private requestInvoiceService: RequestInvoiceService
  ) { }

  ngOnInit(): void {
    this.loadStatusInvoice();
    this.loadFile();
    this.loadStatus();
  }

  ngAfterViewInit(): void {
    this.initTable();
    this.initFileTable();
  }

  closeModal() {
    this.activeModal.close({ success: true, reloadData: true });
  }

  loadStatusInvoice() {
    this.requestInvoiceStatusLinkService.getStatusInvoice(this.requestInvoiceID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = response.data;
          if (this.mainData.length > 0 && this.tb_Table) {
            this.tb_Table.replaceData(this.mainData);
            this.tb_Table.redraw(true);
          }
        } else {
          console.error('Lỗi khi tải trạng thái:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải trạng thái:', error);
      }
    );
  }

  loadStatus() {
    this.requestInvoiceStatusLinkService.getStatus().subscribe(
      (response) => {
        if (response.status === 1) {
          this.selectStatusData = response.data || [];
          this.refreshStatusColumnEditor();

        } else {
          console.error('Lỗi khi tải trạng thái:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải trạng thái:', error);
      }
    );
  }

  loadFile() {
    this.requestInvoiceStatusLinkService.getStatusInvoiceFile(this.requestInvoiceID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.fileData = response.data.map((file: any) => ({
            ...file,
            fileName: file.FileName || file.fileName,
            FileName: file.FileName || file.fileName,
            fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
            fileType: file.FileName ? this.getFileType(file.FileName) : '',
            uploadDate: file.UploadDate
              ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
              : new Date().toLocaleDateString('vi-VN'),
            ServerPath: file.ServerPath || file.serverPath || '',
          }));
          if (this.tb_File) {
            this.tb_File.replaceData(this.fileData);
          }
        } else {
          console.error('Lỗi khi tải file:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải file:', error);
      }
    );
  }

  openRequestInvoiceStatusModal(): void {
    const modalRef = this.modalService.open(RequestInvoiceStatusComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadStatus()
          setTimeout(() => {
            this.loadStatusInvoice();
          }, 300); 
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  saveAndClose() {
    if (!this.tb_Table) {
      return;
    }
    const tableData = this.tb_Table.getData();
    const missingReason = tableData.find(
      (row) =>
        row['IsApproved'] === this.SUPPLEMENT_STATUS_VALUE &&
        !(row['AmendReason'] || '').trim()
    );
    if (missingReason) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập lý do cho trạng thái "Yêu cầu bổ sung".'
      );
      return;
    }
    const payload = {
      StatusRequestInvoiceLinks: tableData.map((row) => ({
        ID: row['ID'] ?? 0,
        StatusID: row['StatusID'],
        IsApproved: row['IsApproved'],
        IsCurrent: !!row['IsCurrent'],
        AmendReason: row['AmendReason'] ?? '',
      })),
      listIdsStatusDel: this.listIdsStatusDel,
      requestInvoiceId: this.requestInvoiceID,
    };
    this.requestInvoiceStatusLinkService.saveStatusInvoice(payload).subscribe(
      (response) => {
        if (response?.status === 1) {
          // Upload files sau khi lưu thành công
          if (this.fileData.length > 0 || this.deletedFileIds.length > 0) {
            this.uploadFiles(this.requestInvoiceID);
          }
          this.notification.success(
            NOTIFICATION_TITLE.success,
            response?.message || 'Lưu dữ liệu thành công.'
          );
          this.closeModal();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response?.message || 'Không thể lưu dữ liệu.'
          );
        }
      },
      (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.message || 'Có lỗi xảy ra khi lưu dữ liệu.'
        );
      }
    );
  }

  initTable(): void {
    if (!this.tb_TableElement) {
      console.error('tb_Table element not found');
      return;
    }
    this.tb_Table = new Tabulator(this.tb_TableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: this.mainData,
      height: '100%',
      rowHeader: false,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'string',
          visible: false,
        },
        {
          title: 'Trạng thái',
          field: 'StatusID',
          sorter: 'string',
          width: "25%",
          editor: 'list',
          editorParams: {
            values: this.buildStatusEditorValues(),
            autocomplete: true
          },
          formatter: (cell) => {
            const id = cell.getValue();
            const status = this.selectStatusData.find(x => x.ID === id);
            return status ? status.StatusName : '';
          }
        },
        {
          title: 'Tình trạng',
          field: 'IsApproved',
          sorter: 'number',
          width: "10%",
          editor: 'list',
          editorParams: {
            values: this.approvedStatus.map(x => ({
              value: x.value,
              label: x.label
            }))
          },
          formatter: (cell) => {
            const val = cell.getValue();
            const selected = this.approvedStatus.find(x => x.value === val);
            return selected ? selected.label : '';
          }
        },
        {
          title: 'Trạng thái hiện tại',
          field: 'IsCurrent',
          sorter: 'boolean',
          width: "20%",
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center; cursor: pointer;">
            <input type="checkbox" ${checked} style="width: 16px; height: 16px; pointer-events: none;"/>
          </div>`;
          },
        },
        {
          title: 'Lý do yêu cầu bổ sung chứng từ',
          field: 'AmendReason',
          sorter: 'string',
          width: "45%",
          editor: 'textarea',
          editable: (cell) =>
            this.requiresAmendReason(cell.getRow().getData()),
        },
      ],
    });
    this.attachTableEvents();

  }

  initFileTable(): void {
    if (!this.tb_FileElement) {
      console.error('tb_File element not found');
      return;
    }

    const contextMenuItems = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedFile) {
            this.downloadFile(this.selectedFile);
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Vui lòng chọn file để tải xuống!'
            );
          }
        },
      },
    ];

    this.tb_File = new Tabulator(this.tb_FileElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: this.fileData,
      pagination: false,
      height: '80%',
      rowHeader: false,
      selectableRows: 1,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: '',
          field: 'actions',
          width: '10%',
          hozAlign: 'center',
          formatter: () =>
            `<button class="btn text-danger p-0 border-0" style="font-size:15px;">
              <i class="bi bi-trash3"></i>
            </button>`,
          cellClick: (_e, cell) => {
            const row = cell.getRow();
            const rowData = row.getData();
            const fileName = rowData['fileName'] || rowData['FileName'] || '';

            this.modal.confirm({
              nzTitle: 'Xác nhận xóa',
              nzContent: fileName
                ? `Bạn có chắc chắn muốn xóa file "${fileName}"?`
                : 'Bạn có chắc chắn muốn xóa file này?',
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                const rowId = rowData['ID'];
                if (rowId && !this.deletedFileIds.includes(rowId)) {
                  this.deletedFileIds.push(rowId);
                }

                row.delete();
                this.fileData = this.tb_File.getData();
              },
            });
          },
        },
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          width: 150,
          visible: false,
        },
        {
          title: 'Tên file',
          field: 'fileName',
          sorter: 'string',
        }
      ],
    });

    this.tb_File.on('rowSelected', (row: RowComponent) => {
      this.selectedFile = row.getData();
    });

    this.tb_File.on('rowDeselected', () => {
      const selectedRows = this.tb_File.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedFile = null;
      }
    });

    this.tb_File.on('rowDblClick', (_e, row: RowComponent) => {
      this.selectedFile = row.getData();
      this.downloadFile(this.selectedFile);
    });
  }

  private buildStatusEditorValues() {
    return this.selectStatusData.map((x: any) => {
      const label =
        x.StatusName.length > 50
          ? x.StatusName.substring(0, 50) + '...'
          : x.StatusName;
      return {
        label,
        value: x.ID,
        id: x.ID,
      };
    });
  }

  private refreshStatusColumnEditor(): void {
    if (!this.tb_Table) {
      return;
    }
    (this.tb_Table as any).updateColumnDefinition('StatusID', {
      editorParams: {
        values: this.buildStatusEditorValues(),
        autocomplete: true,
      },
    });
    (this.tb_Table as any).redraw(true);
  }

  private attachTableEvents(): void {
    if (!this.tb_Table) {
      return;
    }
    const tableAny = this.tb_Table as any;
    tableAny.on('cellEdited', (cell: CellComponent) => {
      const field = cell.getField();
      if (field === 'StatusID') {
        const newValue = cell.getValue();
        const currentRowId = cell.getRow().getData()['ID'];
        const duplicated = this.tb_Table
          .getData()
          .some(
            (row) => row['ID'] !== currentRowId && row['StatusID'] === newValue
          );
        if (duplicated) {
          cell.setValue(cell.getOldValue(), true);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Trạng thái này đã tồn tại ở dòng khác.'
          );
        }
        return;
      }
    });
    tableAny.on(
      'cellClick',
      (_event: MouseEvent, cell: CellComponent) => {
        if (cell.getField() !== 'IsCurrent') {
          return;
        }
        const nextValue = !cell.getValue();
        if (nextValue) {
          this.tb_Table.getRows().forEach((row) => {
            if (row !== cell.getRow()) {
              row.update({ IsCurrent: false });
            }
          });
        }
        cell.getRow().update({ IsCurrent: nextValue });
      }
    );
  }

  private requiresAmendReason(rowData: any): boolean {
    return rowData?.['IsApproved'] === this.SUPPLEMENT_STATUS_VALUE;
  }

  //#region : Hàm xử lý upload files
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
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }

  addFileToTable(file: File): void {
    const newFile = {
      fileName: file.name,
      FileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.name),
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      file: file,
      ServerPath: '',
    };
    this.fileData = [...this.fileData, newFile];
    if (this.tb_File) {
      this.tb_File.setData(this.fileData);
    }
  }

  downloadFile(file: any): void {
    if (!file) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn file để tải xuống!'
      );
      return;
    }
    const fullPath = this.buildFullFilePath(file);
    const fileName =
      file.FileName || file.fileName || file.FileNameOrigin || 'downloaded_file';
    if (!fullPath) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không xác định được đường dẫn file! (Có thể file mới chưa được upload lên server).'
      );
      return;
    }
    this.downloadFromServer(fullPath, fileName);
  }

  private buildFullFilePath(file: any): string {
    if (!file) {
      return '';
    }
    const serverPath =
      (file.ServerPath || file.serverPath || '').toString().trim();
    const fileName =
      (file.FileName ||
        file.fileName ||
        file.FileNameOrigin ||
        '').toString().trim();

    if (!serverPath) {
      return '';
    }

    if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
      return serverPath;
    }

    if (!fileName) {
      return serverPath;
    }

    const normalizedPath = serverPath.replace(/[\\/]+$/, '');
    return `${normalizedPath}\\${fileName}`;
  }

  private downloadFromServer(fullPath: string, fileName: string): void {
    if (!fullPath) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không xác định được đường dẫn file!'
      );
      return;
    }

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.requestInvoiceService.downloadFile(fullPath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'File tải về không hợp lệ!'
          );
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        if (err?.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errText = JSON.parse(reader.result as string);
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errText.message || 'Tải xuống thất bại!'
              );
            } catch {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Tải xuống thất bại!'
              );
            }
          };
          reader.readAsText(err.error);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || err?.message || 'Tải xuống thất bại!'
          );
        }
      },
    });
  }

  uploadFiles(RIID: number) {
    // Lọc ra các file mới có thuộc tính file (giống cách làm bên TrainingRegistration)
    const newFiles = this.fileData.filter(
      (fileObj: any) => fileObj.file
    );
    const hasDeletedFiles = this.deletedFileIds.length > 0;

    // Nếu không có file mới và không có file bị xóa thì không gọi API
    if (newFiles.length === 0 && !hasDeletedFiles) {
      return;
    }

    if (newFiles.length > 0) {
      const formData = new FormData();

      // Thêm từng file mới vào FormData
      newFiles.forEach((fileObj: any) => {
        formData.append('files', fileObj.file);
      });

      // key: để backend nhận biết loại tài liệu
      formData.append('key', 'TuanBeoTest');

      // Tạo subPath dựa trên RequestInvoiceID
      const sanitize = (s: string) =>
        s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();

      const subPath = [
        'RequestInvoiceStatus',
        sanitize(RIID.toString())
      ].join('/');

      formData.append('subPath', subPath);

      // Gọi API upload
      this.requestInvoiceDetailService.uploadFiles(formData, RIID, 2).subscribe({
        next: () => {
          console.log('Upload files thành công');
        },
        error: (error) => {
          this.notification.error('Thông báo', 'Lỗi upload files: ' + error);
        },
      });
    }

    // Xử lý xóa files
    if (hasDeletedFiles) {
      this.requestInvoiceDetailService.deleteFiles(this.deletedFileIds).subscribe({
        next: () => {
          this.deletedFileIds = [];
        },
        error: (error) => {
          this.notification.error('Lỗi xóa files:', error);
        },
      });
    }
  }
  //#endregion
}

import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
  HostListener
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DocumentService } from './document-service/document.service';
import { DocumentTypeFormComponent } from './document-type-form/document-type-form.component';
import { DocumentFormComponent } from './document-form/document-form.component';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { saveAs } from 'file-saver';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PermissionService } from '../../../services/permission.service';
interface DocumentType {
  Code: string;
  Name: string;
}

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
  selector: 'app-document',
  standalone: true,
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
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    HasPermissionDirective
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.css',
})
export class DocumentComponent implements OnInit, AfterViewInit {
  @ViewChild('DocumentTable') tableRef2!: ElementRef;
  @ViewChild('DocumentTypeTable') tableRef1!: ElementRef;
  @ViewChild('DocumentFileTable') tableRef3!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';

  dataInput: any = {};

  newDocumentType: DocumentType = {
    Code: '',
    Name: '',
  };

  newDocument: Document = {
    STT: 0,
    Code: '',
    NameDocument: '',
    DepartmentID: 0,
    DatePromulgate: null,
    DateEffective: null,
    GroupType: 1,
  };

  newDocumentFile: DocumentFile = {
    ID: 0,
    FileName: '',
  };

  searchParams = {
    departmentID: -1,
    idDocumentType: 0,
  };
  sizeSearch: string = '0';

  data: any[] = [];
  documentTypeTable: Tabulator | null = null;
  documentTypeData: any[] = [];
  documentTypeID: number = 0;

  documentTable: Tabulator | null = null;
  documentData: any[] = [];
  documentID: number = 0;

  documentFileTable: Tabulator | null = null;
  documentFileData: any[] = [];

  dataDepartment: any[] = [];

  isCheckmode: boolean = false;
  keyword: string = '';
  filteredDocuments: any[] = [];

  fileList: any[] = [];
  uploadUrl: string = '';

  selectedDocumentId: number = 0;

  selectedFileId: number | null = null;
  selectedFileName: string = '';

  documentFileID: number = 0;

  constructor(
    private notification: NzNotificationService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private breakpointObserver: BreakpointObserver,
    private message: NzMessageService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });
  }



  ngAfterViewInit(): void {
    this.draw_documentTypeTable();
    this.draw_documentTable();
    this.draw_documentFileTable();
    this.getDataDocumentType();
    this.getdataDepartment();
  }

  getDataDocumentType() {
    this.documentService.getDataDocumentType().subscribe((response: any) => {
      this.documentTypeData = response.data || [];
      if (this.documentTypeTable) {
        this.documentTypeTable.replaceData(this.documentTypeData);
        // Force redraw để đảm bảo bảng được refresh
        setTimeout(() => {
          this.documentTypeTable?.redraw(true);
        }, 100);
        if (this.documentTypeData.length > 0) {
          this.searchParams.idDocumentType = this.documentTypeData[0].ID;
          this.getDocument();
        }
      } else {
        this.draw_documentTypeTable();
      }
    });
  }

  getDocument() {
    this.documentService
      .getAllDocument(
        this.searchParams.departmentID,
        this.searchParams.idDocumentType
      )
      .subscribe((response: any) => {
        this.documentData = response.data?.asset || [];
        if (this.documentTable) {
          this.documentTable.setData(this.documentData);
        } else {
          this.draw_documentTable();
        }
      });
  }

  getDocumentFileByID(id: number) {
    this.documentService.getDocumentFileByID(id).subscribe((response: any) => {
      this.documentFileData = response.data || [];
      if (this.documentFileTable) {
        this.documentFileTable.setData(this.documentFileData);
      } else {
        this.draw_documentFileTable();
      }
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

  searchData() {
    this.getDocument();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '15%' : '0';
  }

  //Tìm kiếm document
  onSearchChange() {
    if (this.documentTable) {
      if (this.keyword && this.keyword.trim() !== '') {
        this.documentTable.setFilter([
          [
            { field: 'NameDocument', type: 'like', value: this.keyword },
            { field: 'Code', type: 'like', value: this.keyword },
            { field: 'NameDocumentType', type: 'like', value: this.keyword },
            { field: 'DateEffective', type: 'like', value: this.keyword },
            { field: 'DatePromulgate', type: 'like', value: this.keyword },
          ],
        ]);
      } else {
        this.getDocument();
      }
    }
  }
  //search phòng ban
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  onDepartmentChange(value: -1) {
    this.searchParams.departmentID = value;
    this.getDocument();
  }


  onAddDocumentType() {
    const modalRef = this.modalService.open(DocumentTypeFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newwarehouse = this.newDocumentType;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.warehouseID = this.documentTypeID;
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataDocumentType();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      }
    );
  }

  editDocumentType(documentTypeData?: any) {
    const dataToEdit = documentTypeData || this.documentTypeTable?.getSelectedData()?.[0];

    if (!dataToEdit) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một loại văn bản để sửa!');
      return;
    }

    const modalRef = this.modalService.open(DocumentTypeFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newwarehouse = this.newDocumentType;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.warehouseID = this.documentTypeID;
    modalRef.componentInstance.dataInput = dataToEdit;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataDocumentType();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      }
    );
  }

  onDeleteDocumentType() {

    const dataSelect: DocumentType[] =
      this.documentTypeTable!.getSelectedData();
    const payloads = {
      ID: this.documentTypeID,
      IsDeleted: true,
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một văn bản để xóa!'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].Code} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.documentService.saveDocumentType(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.getDataDocumentType();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

  onAddDocument() {
    const modalRef = this.modalService.open(DocumentFormComponent, {
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
    modalRef.componentInstance.documentTypeID = this.documentTypeID;
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.catch((result) => {
      if (result == true) {
        // Reload dữ liệu từ server
        this.getDocument();
      }
    });
  }

  editDocument(documentData?: any) {
    const dataToEdit = documentData || this.documentTable?.getSelectedData()?.[0];

    if (!dataToEdit) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một văn bản để sửa!');
      return;
    }

    const modalRef = this.modalService.open(DocumentFormComponent, {
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
    modalRef.componentInstance.documentTypeID = this.documentTypeID;
    modalRef.componentInstance.dataInput = dataToEdit;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.catch((result) => {
      if (result == true) {
        // Reload dữ liệu từ server
        this.getDocument();
      }
    });
  }

  onDeleteDocument() {
    const dataSelect: Document[] = this.documentTable!.getSelectedData();
    const payloads = {
      ...dataSelect[0],
      IsDeleted: true,
      UpdatedBy: 'admin',
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }
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
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

  // Bắt sự kiện upload file
  beforeUpload = (file: NzUploadFile): boolean => {
    if (!this.selectedDocumentId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn văn bản để upload file!');
      return false;
    }

    // Lấy file gốc
    const rawFile = (file as any).originFileObj || file;

    if (!(rawFile instanceof File)) {
      this.notification.error('Thông báo', 'Không lấy được file gốc!');
      return false;
    }

    this.uploadFile(rawFile);
    return false;
  };

  // Xử lý khi chọn file từ input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
      // Reset input để có thể chọn lại file cùng tên
      input.value = '';
    }
  }

  // Hàm upload file
  uploadFile(file: File): void {
    if (!this.selectedDocumentId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn văn bản để upload file!');
      return;
    }

    const subPath = `Documents/${this.selectedDocumentId}`;

    // Hiển thị loading
    const loadingMsg = this.message.loading(`Đang tải lên ${file.name}...`, {
      nzDuration: 0,
    }).messageId;

    this.documentService.uploadMultipleFiles([file], subPath).subscribe({
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
                this.notification.success('Thành công', `Upload ${file.name} hoàn tất!`);
                // Reload danh sách file
                this.getDocumentFileByID(this.selectedDocumentId);
              } else {
                this.notification.error('Lỗi', saveRes?.message || 'Lưu thông tin file thất bại!');
              }
            },
            error: (err) => {
              this.notification.error('Lỗi', err?.error?.message || 'Lưu thông tin file thất bại!');
            },
          });
        } else {
          this.notification.error('Lỗi', res?.message || 'Upload file thất bại!');
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error('Lỗi', err?.error?.message || 'Upload file thất bại!');
      },
    });
  }

  // Trigger file input từ context menu
  triggerFileInput(): void {
    if (!this.selectedDocumentId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn văn bản để upload file!');
      return;
    }
    this.fileInput.nativeElement.click();
  }

  exportExcel(id: number, customFileName?: string): void {
    const fileName = customFileName || `VBPhatHanh${id}.xlsx`;

    const loadingMsg = this.message.loading('Đang xuất Excel...', {
      nzDuration: 0,
    }).messageId;

    this.documentService.exportExcel(id).subscribe({
      next: (blob: Blob) => {
        // Ẩn thông báo đang tải
        this.message.remove(loadingMsg);

        if (!blob || blob.size === 0) {
          this.notification.error(
            'Thông báo',
            'Không có dữ liệu để xuất Excel!'
          );
          return;
        }

        saveAs(blob, fileName);
        this.notification.success('Thông báo', 'Xuất Excel thành công!');
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error(
          'Thông báo',
          'Xuất Excel thất bại! Vui lòng thử lại.'
        );
      },
    });
  }

  downloadFile() {
    if (!this.data || this.data.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    const file = this.data[0];

    if (!file.FilePath) {
      this.notification.error('Thông báo', 'Không có đường dẫn file để tải xuống!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.documentService.downloadFile(file.FilePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
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
        console.error('Lỗi khi tải file:', res);

        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        }
      },
    });
  }

  onDeleteDocumentFile() {
    const dataSelect: DocumentFile[] =
      this.documentFileTable!.getSelectedData();
    const payloads = {
      ...dataSelect[0],
      IsDeleted: true,
      UpdatedBy: 'admin',
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một văn bản để xóa!'
      );
      return;
    }
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
              this.documentFileData = this.documentFileData.filter(f => f.ID !== dataSelect[0].ID);
              this.documentFileTable!.setData(this.documentFileData);
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

  draw_documentTypeTable(): void {
    if (this.documentTypeTable) {
      this.documentTypeTable.setData(this.documentTypeData);
    } else {
      this.documentTypeTable = new Tabulator(this.tableRef1.nativeElement, {
        data: this.documentTypeData,
        ...DEFAULT_TABLE_CONFIG,
        selectableRows: 1,
        paginationMode: 'local',
        // layout: 'fitDataStretch',
        // pagination: true,
        // selectableRows: 1,
        // height: '100%',
        // movableColumns: true,
        // paginationSize: 30,
        // paginationSizeSelector: [5, 10, 20, 50, 100],
        // reactiveData: true,
        // placeholder: 'Không có dữ liệu',
        // addRowPos: 'bottom',
        // history: true,
        // rowHeader: {
        //   headerSort: false,
        //   resizable: false,
        //   frozen: true,
        //   formatter: 'rowSelection',
        //   headerHozAlign: 'center',
        //   hozAlign: 'center',
        //   titleFormatter: 'rowSelection',
        //   cellClick: (e: any, cell: any) => {
        //     e.stopPropagation();
        //   },
        // },
        columns: [
          {
            title: 'Mã loại VB',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'Code',
          },
          {
            title: 'Tên loại VB',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'center',
            resizable: false,
          },
        ],
      });
      this.documentTypeTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        // Nếu cần dùng property riêng của chuột thì ép kiểu:
        this.searchParams.idDocumentType = rowData['ID'];
        const mouseEvent = e as MouseEvent;
        this.getDocument();
      });

      this.documentTypeTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.editDocumentType(rowData);
      });

      //THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.documentTypeTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.documentTypeID = this.data[0].ID;
      });
      this.documentTypeTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.documentTypeTable!.getSelectedRows();
        this.documentTypeID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data về mảng rỗng
        }
      });
    }
  }

  draw_documentTable(): void {
    if (this.documentTable) {
      this.documentTable.setData(this.documentData);
    } else {
      this.documentTable = new Tabulator(this.tableRef2.nativeElement, {
        data: this.documentData,
        ...DEFAULT_TABLE_CONFIG,
        // layout: 'fitDataStretch',
        // pagination: true,
        selectableRows: 1,
        //  height: '100%',
        paginationMode: 'local',
        // movableColumns: true,
        // paginationSize: 30,
        // paginationSizeSelector: [5, 10, 20, 50, 100],
        // reactiveData: true,
        // placeholder: 'Không có dữ liệu',
        // addRowPos: 'bottom',
        // history: true,
        // rowHeader: {
        //   headerSort: false,
        //   resizable: false,
        //   frozen: true,
        //   formatter: 'rowSelection',
        //   headerHozAlign: 'center',
        //   hozAlign: 'center',
        //   titleFormatter: 'rowSelection',
        //   cellClick: (e: any, cell: any) => {
        //     e.stopPropagation();
        //   },
        // },
        // Group theo Mã dự án -> sau đó nhóm theo Kho
        groupBy: [
          (data) => {
            return data.DepartmentName
              ? `Phòng ban: ${data.DepartmentName ? `  ${data.DepartmentName}` : ''
              }`
              : 'Phòng ban: ';
          },
          // (data) => data.StoreName ? `Kho: ${data.StoreName}` : "Kho: Kho HN"
        ],
        groupStartOpen: true,
        groupToggleElement: 'header',
        groupHeader: (value, count, data, group) => {
          // Không hiện (3), (5) v.v.
          return value;
        },

        columns: [
          {
            title: 'STT',
            hozAlign: 'right',
            headerHozAlign: 'center',
            field: 'STT',
            sorter: 'number',
          },
          {
            title: 'Loại văn bản',
            field: 'NameDocumentType',  
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã văn bản',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên văn bản',
            field: 'NameDocument',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày ban hành',
            field: 'DatePromulgate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Ngày hiệu lực',
            field: 'DateEffective',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            resizable: false,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },

          },
          {
            title: 'Đã ban hành',
            field: 'IsPromulgated',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
          },
          {
            title: 'Mã bộ phận',
            field: 'DepartmentCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Bộ phận phát hành',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã người ký',
            field: 'EmployeeSignCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên người ký',
            field: 'EmployeeSignName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Phạm vi áp dụng',
            field: 'AffectedScope',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });

      this.documentTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        // Nếu cần dùng property riêng của chuột thì ép kiểu:
        const mouseEvent = e as MouseEvent;
        this.getDocumentFileByID(rowData['ID']);
      });

      this.documentTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.editDocument(rowData);
      });

      this.documentTable.on('rowSelected', (row: any) => {
        const rowData = row.getData();
        this.selectedDocumentId = rowData.ID;

        // Load file list của dòng đó
        this.getDocumentFileByID(this.selectedDocumentId);
      });
      this.documentTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.documentTable!.getSelectedRows();
        this.documentID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data về mảng rỗng
        }
      });
    }
  }

  draw_documentFileTable(): void {
    if (this.documentFileTable) {
      this.documentFileTable.setData(this.documentFileData);
    } else {
      // Tạo context menu dựa trên permission
      const contextMenuItems: any[] = [];

      if (this.permissionService.hasPermission('N2,N34,N1')) {
        contextMenuItems.push({
          label: 'Xóa',
          action: () => {
            this.onDeleteDocumentFile();
          }
        });
      }

      contextMenuItems.push({
        label: 'Tải xuống',
        action: () => {
          this.downloadFile();
        }
      });

      this.documentFileTable = new Tabulator(this.tableRef3.nativeElement, {
        data: this.documentFileData,
        ...DEFAULT_TABLE_CONFIG,
        selectableRows: 1,
        paginationMode: 'local',
        layout: 'fitDataStretch',
        rowContextMenu: contextMenuItems,
        columns: [
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false, // Ẩn cột ID nếu không cần hiển thị
          },
          {
            title: 'Tên file',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'FileName',
            resizable: false,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value) {
                return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
              }
              return '';
            }
          },
        ],
      });

      //THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.documentFileTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.documentFileID = this.data[0].ID;
      });
      this.documentFileTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.documentFileTable!.getSelectedRows();
        this.documentFileID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data về mảng rỗng
        }
      });

      // Double click vào tên file để tải xuống
      this.documentFileTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        // Set data để downloadFile() có thể sử dụng
        this.data = [rowData];
        this.downloadFile();
      });
    }
  }
}

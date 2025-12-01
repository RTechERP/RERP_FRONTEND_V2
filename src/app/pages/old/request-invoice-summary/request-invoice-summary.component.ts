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
import { RequestInvoiceService } from '../request-invoice/request-invoice-service/request-invoice-service.service'
import { RequestInvoiceStatusLinkComponent } from '../request-invoice-status-link/request-invoice-status-link.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';

@Component({
  selector: 'app-request-invoice-summary',
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
  templateUrl: './request-invoice-summary.component.html',
  styleUrl: './request-invoice-summary.component.css'
})
export class RequestInvoiceSummaryComponent implements OnInit, AfterViewInit {

  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;
  private tb_Table!: Tabulator;

  @ViewChild('tb_File', { static: false }) tb_FileElement!: ElementRef;
  private tb_File!: Tabulator;

  @ViewChild('tb_FilePO', { static: false }) tb_FilePOElement!: ElementRef;
  private tb_FilePO!: Tabulator;

  mainData: any[] = [];
  dataFile: any[] = [];
  dataFilePO: any[] = [];
  customers: any[] = [];
  users: any[] = [];
  selectedFile: any = null;
  selectedPOFile: any = null;

  dateStart: Date = new Date();
  dateEnd: Date = new Date();
  customerId: number = 0;
  userId: number = 0;
  status: number = 0;
  keywords: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private requestInvoiceService: RequestInvoiceService,
    private viewPokhService: ViewPokhService
  ) { }

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Lấy dữ liệu 1 ngày trước
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    this.dateStart = startDate;
    this.dateEnd = endDate;
    this.loadMainData();
  }

  ngAfterViewInit(): void {
    this.initTable();
    this.initFileTable();
    this.initPOFileTable();
  }

  closeModal() {
    this.activeModal.close({ success: true, reloadData: true });
  }

  loadMainData() {
    const start = new Date(this.dateStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.dateEnd);
    end.setHours(23, 59, 59, 999);

    this.requestInvoiceService.getRequestInvoiceSummary(
      start,
      end,
      this.customerId,
      this.userId,
      0,
      this.keywords
    ).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.mainData = response.data;
          if (this.tb_Table) {
            this.tb_Table.setData(this.mainData);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadFileData(requestInvoiceId: number): void {
    this.requestInvoiceService.getDetail(requestInvoiceId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataFile = response.files;
          this.selectedFile = null; // Reset selected file
          if (this.tb_File) {
            this.tb_File.setData(this.dataFile);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadFilePOData(pokhId: number): void {
    this.requestInvoiceService.getPOKHFile(pokhId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataFilePO = response.data;
          this.selectedPOFile = null; // Reset selected PO file
          if (this.tb_FilePO) {
            this.tb_FilePO.setData(this.dataFilePO);
          }
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải POKHFile:', error);
      }
    );
  }


  loadCustomer(): void {
    this.requestInvoiceService.getCustomer().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadUser(): void {
    this.viewPokhService.loadUser().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.users = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  openRequestInvoiceStatusLinkModal(): void {
    const modalRef = this.modalService.open(RequestInvoiceStatusLinkComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Define columns (keys and widths only)
    worksheet.columns = [
      { key: 'IsUrgency', width: 15 },
      { key: 'DealineUrgency', width: 15 },
      { key: 'StatusText', width: 20 },
      { key: 'Code', width: 20 },
      { key: 'IsCustomsDeclared', width: 15 },
      { key: 'AmendReason', width: 30 },
      { key: 'FullName', width: 20 },
      { key: 'CustomerName', width: 30 },
      { key: 'Address', width: 40 },
      { key: 'Name', width: 20 },
      { key: 'Note', width: 30 },
      { key: 'ProductNewCode', width: 15 },
      { key: 'ProductCode', width: 20 },
      { key: 'GuestCode', width: 20 },
      { key: 'ProductName', width: 30 },
      { key: 'Unit', width: 10 },
      { key: 'Quantity', width: 15 },
      { key: 'ProjectCode', width: 20 },
      { key: 'ProjectName', width: 20 },
      { key: 'NotePO', width: 30 },
      { key: 'Specifications', width: 20 },
      { key: 'InvoiceNumber', width: 20 },
      { key: 'InvoiceDate', width: 15 },
      { key: 'PONumber', width: 20 },
      { key: 'POCode', width: 20 },
      { key: 'RequestDate', width: 15 },
      { key: 'DateRequestImport', width: 15 },
      { key: 'SupplierName', width: 30 },
      { key: 'SomeBill', width: 20 },
      { key: 'ExpectedDate', width: 15 },
      { key: 'BillImportCode', width: 20 },
    ];

    // Add Band Row (Row 1)
    const bandValues = new Array(25).fill('');
    bandValues.push('Thông tin đầu vào');
    const bandRow = worksheet.addRow(bandValues);

    // Merge cells for Band
    worksheet.mergeCells('A1:Y1');
    worksheet.mergeCells('Z1:AE1');

    // Add Header Row (Row 2)
    const headerRow = worksheet.addRow([
      'Yêu cầu gấp', 'Deadline', 'Trạng thái', 'Mã lệnh', 'Tờ khai HQ',
      'Lý do yêu cầu bổ sung', 'Người yêu cầu', 'Khách hàng', 'Địa chỉ', 'Công ty bán',
      'Ghi chú', 'Mã nội bộ', 'Mã sản phẩm', 'Mã theo khách', 'Tên sản phẩm',
      'ĐVT', 'Số lượng', 'Mã dự án', 'Dự án', 'Ghi chú (PO)',
      'Thông số kỹ thuật', 'Số hóa đơn', 'Ngày hóa đơn', 'Số PO', 'Mã PO',
      'Ngày đặt hàng', 'Ngày hàng về', 'Nhà cung cấp', 'Hóa đơn đầu vào', 'Ngày hàng về dự kiến', 'PNK'
    ]);

    // Style Band Row
    bandRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCE6F1' }, // Light Blue
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Style Header Row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCE6F1' }, // Light Blue
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Add data
    this.mainData.forEach((item) => {
      const row = worksheet.addRow({
        IsUrgency: item.IsUrgency ? 'Có' : '',
        DealineUrgency: item.DealineUrgency ? DateTime.fromISO(item.DealineUrgency).toFormat('dd/MM/yyyy') : '',
        StatusText: item.StatusText,
        Code: item.Code,
        IsCustomsDeclared: item.IsCustomsDeclared ? 'Có' : '',
        AmendReason: item.AmendReason,
        FullName: item.FullName,
        CustomerName: item.CustomerName,
        Address: item.Address,
        Name: item.Name,
        Note: item.Note,
        ProductNewCode: item.ProductNewCode,
        ProductCode: item.ProductCode,
        GuestCode: item.GuestCode,
        ProductName: item.ProductName,
        Unit: item.Unit,
        Quantity: item.Quantity,
        ProjectCode: item.ProjectCode,
        ProjectName: item.ProjectName,
        NotePO: item.Note,
        Specifications: item.Specifications,
        InvoiceNumber: item.InvoiceNumber,
        InvoiceDate: item.InvoiceDate ? DateTime.fromISO(item.InvoiceDate).toFormat('dd/MM/yyyy') : '',
        PONumber: item.PONumber,
        POCode: item.POCode,
        RequestDate: item.RequestDate ? DateTime.fromISO(item.RequestDate).toFormat('dd/MM/yyyy') : '',
        DateRequestImport: item.DateRequestImport ? DateTime.fromISO(item.DateRequestImport).toFormat('dd/MM/yyyy') : '',
        SupplierName: item.SupplierName,
        SomeBill: item.SomeBill,
        ExpectedDate: item.ExpectedDate ? DateTime.fromISO(item.ExpectedDate).toFormat('dd/MM/yyyy') : '',
        BillImportCode: item.BillImportCode,
      });

      // Color row if IsUrgency is true
      if (item.IsUrgency) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFA500' }, // Orange
          };
        });
      }

      // Add borders to all cells
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Save file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TongHopYeuCauXuatHoaDon.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  private buildFullFilePath(file: any): string {
    if (!file) {
      return '';
    }
    const serverPath = (file.ServerPath || '').trim();
    const fileName = (file.FileName || file.FileNameOrigin || '').trim();

    if (!serverPath) {
      return '';
    }

    // Nếu ServerPath đã chứa tên file thì dùng luôn
    if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
      return serverPath;
    }

    if (!fileName) {
      return serverPath;
    }

    const normalizedPath = serverPath.replace(/[\\/]+$/, '');
    return `${normalizedPath}\\${fileName}`;
  }

  downloadFile(file: any): void {
    if (!file || !file.ServerPath) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    const fullPath = this.buildFullFilePath(file);
    if (!fullPath) {
      this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.requestInvoiceService.downloadFile(fullPath).subscribe({
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

  downloadPOFile(file: any): void {
    if (!file || !file.ServerPath) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    const fullPath = this.buildFullFilePath(file);
    if (!fullPath) {
      this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.requestInvoiceService.downloadFile(fullPath).subscribe({
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
      selectableRows: 1,
      rowFormatter: (row: RowComponent) => {
        const data = row.getData();
        const element = row.getElement();
        if (element) {
          if (data['IsUrgency']) {
            element.style.backgroundColor = '#FFA500';
          } else {
            element.style.backgroundColor = '';
          }
        }
      },
      columns: [
        {
          title: '',
          columns: [
            {
              title: 'ID',
              field: 'ID',
              sorter: 'string',
              visible: false,
              frozen: true,
            },
            {
              title: 'Yêu cầu gấp',
              field: 'IsUrgency',
              sorter: 'boolean',
              width: 50,
              hozAlign: 'center',
              frozen: true,
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
              },
            },
            {
              title: 'Deadline',
              field: 'DealineUrgency',
              sorter: 'date',
              frozen: true,
              width: 100,
              formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              },
            },
            {
              title: 'Trạng thái',
              field: 'StatusText',
              sorter: 'string',
              frozen: true,
              width: 150,
            },
            { title: 'Mã lệnh', frozen: true, field: 'Code', sorter: 'string', width: 150 },
            {
              title: 'Tờ khai HQ',
              field: 'IsCustomsDeclared',
              sorter: 'boolean',
              frozen: true,
              width: 70,
              hozAlign: 'center',
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
              },
            },
            {
              title: 'Lý do yêu cầu bổ sung',
              field: 'AmendReason',
              sorter: 'string',
              width: 215,
              formatter: 'textarea'
            },
            {
              title: 'Người yêu cầu',
              field: 'FullName',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Khách hàng',
              field: 'CustomerName',
              sorter: 'string',
              formatter: 'textarea',
              width: 250,
            },
            { title: 'Địa chỉ', field: 'Address', sorter: 'string', width: 300, formatter: 'textarea' },
            { title: 'Công ty bán', field: 'Name', sorter: 'string', width: 140 },
            { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 200, formatter: 'textarea' },
            {
              title: 'Mã nội bộ',
              field: 'ProductNewCode',
              sorter: 'string',
              width: 100,
            },
            {
              title: 'Mã sản phẩm',
              field: 'ProductCode',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Mã theo khách',
              field: 'GuestCode',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              sorter: 'string',
              formatter: 'textarea',
              width: 200,
            },
            { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 150 },
            { title: 'Số lượng', field: 'Quantity', sorter: 'string', width: 150 },
            {
              title: 'Mã dự án',
              field: 'ProjectCode',
              sorter: 'string',
              width: 150,
            },
            { title: 'Dự án', field: 'ProjectName', sorter: 'string', width: 150 },
            { title: 'Ghi chú (PO)', field: 'Note', sorter: 'string', width: 150, formatter: 'textarea' },
            {
              title: 'Thông số kỹ thuật',
              field: 'Specifications',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Số hóa đơn',
              field: 'InvoiceNumber',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Ngày hóa đơn',
              field: 'InvoiceDate',
              sorter: 'date',
              width: 150,
              formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              },
            },
            {
              title: 'Số PO',
              field: 'PONumber',
              sorter: 'string',
              width: 150,
            },
            {
              title: 'Mã PO',
              field: 'POCode',
              sorter: 'string',
              width: 150,
            },
          ]
        },
        {
          title: 'Thông tin đầu vào',
          field: '',
          sorter: 'string',
          width: 200,
          columns: [
            {
              title: 'Ngày đặt hàng',
              field: 'RequestDate',
              sorter: 'date',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'Ngày hàng về',
              field: 'DateRequestImport',
              sorter: 'date',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'Nhà cung cấp',
              field: 'SupplierName',
              sorter: 'string',
              formatter: 'textarea',
              width: 250,
            },
            {
              title: 'Hóa đơn đầu vào',
              field: 'SomeBill',
              sorter: 'string',
              width: 250,
            },
            {
              title: 'Ngày hàng về dự kiến',
              field: 'ExpectedDate',
              sorter: 'date',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'PNK',
              field: 'BillImportCode',
              sorter: 'string',
              width: 250,
            },
          ]
        }
      ],
    });

    this.tb_Table.on('rowClick', (_event: Event, row: RowComponent) => {
      this.handleMainRowSelection(row.getData());
    });
  }

  private handleMainRowSelection(rowData: any): void {
    if (!rowData) {
      return;
    }

    const requestInvoiceId = rowData.RequestInvoiceID ?? rowData.ID;
    if (requestInvoiceId) {
      this.loadFileData(requestInvoiceId);
    } else {
      this.dataFile = [];
      if (this.tb_File) {
        this.tb_File.setData(this.dataFile);
      }
    }

    const pokhId = rowData.POKHID ?? rowData.PokhId ?? rowData.POKHId;
    if (pokhId) {
      this.loadFilePOData(pokhId);
    } else {
      this.dataFilePO = [];
      if (this.tb_FilePO) {
        this.tb_FilePO.setData(this.dataFilePO);
      }
    }
  }

  initFileTable(): void {
    // Tạo context menu
    const contextMenuItems: any[] = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedFile) {
            this.downloadFile(this.selectedFile);
          } else {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
          }
        }
      }
    ];

    this.tb_File = new Tabulator(this.tb_FileElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataFile,
      layout: 'fitDataFill',
      height: '100%',
      selectableRows: 1,
      pagination: false,
      rowHeader: false,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: 'Tên file',
          field: 'FileName',
          sorter: 'string',
          width: '100%',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value) {
              return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
            }
            return '';
          }
        },
        {
          title: 'Server Path',
          field: 'ServerPath',
          sorter: 'string',
          visible: false,
        },
      ],
    });

    // Thêm sự kiện rowSelected để lưu file được chọn
    this.tb_File.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      this.selectedFile = rowData;
    });

    this.tb_File.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.tb_File!.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedFile = null;
      }
    });

    // Double click để tải file
    this.tb_File.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedFile = rowData;
      this.downloadFile(rowData);
    });
  }

  initPOFileTable(): void {
    // Tạo context menu
    const contextMenuItems: any[] = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedPOFile) {
            this.downloadPOFile(this.selectedPOFile);
          } else {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
          }
        }
      }
    ];

    this.tb_FilePO = new Tabulator(this.tb_FilePOElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataFilePO,
      layout: 'fitDataFill',
      height: '100%',
      selectableRows: 1,
      pagination: false,
      rowHeader: false,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: 'Tên file',
          field: 'FileName',
          sorter: 'string',
          width: '100%',
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

    // Thêm sự kiện rowSelected để lưu file được chọn
    this.tb_FilePO.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      this.selectedPOFile = rowData;
    });

    this.tb_FilePO.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.tb_FilePO!.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedPOFile = null;
      }
    });

    // Double click để tải file
    this.tb_FilePO.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedPOFile = rowData;
      this.downloadPOFile(rowData);
    });
  }
}

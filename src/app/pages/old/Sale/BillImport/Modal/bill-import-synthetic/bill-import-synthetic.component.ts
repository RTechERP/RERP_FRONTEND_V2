import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  input,
  Input,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
// import * as bootstrap from 'bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
// Thêm các import này vào đầu file
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
} from '@angular/core';
import { SelectControlComponent } from '../../../BillExport/Modal/select-control/select-control.component';
import { ProjectComponent } from '../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../../../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
interface data {
  idsPONCC: []; // array of number
  documentImportID: number;
  deliverID: number;
}
@Component({
  selector: 'app-bill-import-synthetic',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NgbModule,
    NzFormModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    SelectControlComponent,
    NzCheckboxModule,
  ],
  templateUrl: './bill-import-synthetic.component.html',
  styleUrl: './bill-import-synthetic.component.css',
})
export class BillImportSyntheticComponent implements OnInit, AfterViewInit {
  dataProductGroup: any[] = [];
  checked: any;
  dataTable: any[] = [];
  table: any;
  //
  selectedKhoTypes: number[] = [];
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Mượn' },
    { ID: 1, Name: 'Tồn Kho' },
    { ID: 2, Name: 'Đã Xuất Kho' },
    { ID: 5, Name: 'Xuất trả NCC' },
    { ID: 6, Name: 'Yêu cầu xuất kho' },
  ];
  data: data = {
    idsPONCC: [], // array of number
    documentImportID: 0,
    deliverID: 0,
  };
  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    listproductgroupID: '',
    status: -1,
    warehousecode: 'HN',
    keyword: '',
    checkAll: true,
    pageNumber: 1,
    pageSize: 1000,
    isDeleted: false,
  };

  dataContextMenu: any[] = [];

  searchText: string = '';
  dateFormat = 'dd/MM/yyyy';
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billImportService: BillImportServiceService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private billExportService: BillExportService,
    private appUserService: AppUserService
  ) {}
  ngOnInit(): void {
    this.getProductGroup();
    this.loadDataBillImportSynthetic();
  }
  ngAfterViewInit(): void {
    this.getDataContextMenu();
  }

  closeModal() {
    this.modalService.dismissAll(true);
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tổng hợp phiếu xuất');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = [
      'STT',
      ...filteredColumns.map((col: any) => col.getDefinition().title),
    ];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        ...filteredColumns.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          if (field === 'IsApproved') {
            value = value === true ? '✓' : ''; // hoặc '✓' / '✗'
          }
          return value;
        }),
      ];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }, // Freeze hàng đầu tiên
      ];
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `TongHopPhieuNhap.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  getProductGroup() {
    this.billExportService.getProductGroup(
      this.appUserService.isAdmin,
      this.appUserService.departmentID || 0
    ).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataProductGroup = res.data;
          console.log('>>> Kết quả getProductGroup:', res);
          this.selectedKhoTypes = this.dataProductGroup.map((item) => item.ID);
          this.searchParams.listproductgroupID =
            this.selectedKhoTypes.join(',');
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy nhóm vật tư', err);
      },
    });
  }
  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }
  resetform(): void {
    this.selectedKhoTypes = [];
    this.searchParams = {
      dateStart: new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      listproductgroupID: '',
      status: -1,
      warehousecode: 'HN',
      keyword: '',
      checkAll: false,
      pageNumber: 1,
      pageSize: 1000,
      isDeleted: false,
    };
    this.searchText = '';
  }

  onCheckboxChange() {
    this.loadDataBillImportSynthetic();
  }
  loadDataBillImportSynthetic() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.billImportService
      .getBillImportSynthetic(
        this.searchParams.listproductgroupID,
        this.searchParams.status,
        dateStart,
        dateEnd,
        this.searchParams.keyword,
        this.checked,
        this.searchParams.pageNumber,
        this.searchParams.pageSize,
        this.searchParams.warehousecode
      )
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.dataTable = res.data;
            console.log('jdjhdjd', this.dataTable);
            if (this.table) {
              this.table.replaceData(this.dataTable);
            }
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu phiếu xuất');
        },
      });
  }

  getDataContextMenu() {
    this.billImportService.getDataContextMenu().subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataContextMenu = res.data;
          this.drawTable(); // Chuyển drawTable vào đây
        } else {
          console.warn('Không có dữ liệu context menu');
          this.drawTable(); // Vẫn vẽ bảng nếu không có dữ liệu
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu chứng từ:', err);
        this.drawTable(); // Vẫn vẽ bảng nếu có lỗi
      },
    });
  }
  UpdateDocument() {
    this.billImportService.updateDocument(this.data).subscribe({
      next: (res) => {
        if (res.status == 1) {
          this.notification.success(
            'Thông báo',
            res.message || 'Cập nhật thành công'
          );
          this.drawTable();
        } else {
          console.warn('Không có dữ liệu context menu');
          this.drawTable(); // Vẫn vẽ bảng nếu không có dữ liệu
        }
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật:', err);
        this.drawTable(); // Vẫn vẽ bảng nếu có lỗi
      },
    });
  }

  //xoa phieu nhap

  drawTable() {
    const rowMenu = [
      {
        label: 'Bổ sung chứng từ',
        menu: this.dataContextMenu.map((item) => ({
          label: item.DocumentImportName,
          action: (e: any, row: any) => {
            // Lấy tất cả các dòng đang được chọn trong bảng
            const selectedRows = this.table.getSelectedData();

            if (!selectedRows.length) {
              alert('Vui lòng chọn ít nhất một phiếu!');
              return;
            }

            // Lấy danh sách PONCCID từ các dòng đã chọn
            this.data.idsPONCC = selectedRows.map((r: any) => r.PONCCID);

            // Lấy DeliverID từ dòng đầu tiên (nếu cần đồng bộ tất cả)
            this.data.deliverID = selectedRows[0].DeliverID;

            // DocumentImportID lấy từ menu
            this.data.documentImportID = item.ID;

            console.log('dataUpdate', this.data);
            this.UpdateDocument();
          },
        })),
      },
    ];

    var headerMenu = function (this: any) {
      var menu = [];
      var columns = this.getColumns();

      for (let column of columns) {
        //create checkbox element using font awesome icons
        let icon = document.createElement('i');
        icon.classList.add('fas');
        icon.classList.add(
          column.isVisible() ? 'fa-check-square' : 'fa-square'
        );

        //build label
        let label = document.createElement('span');
        let title = document.createElement('span');

        title.textContent = ' ' + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
          label: label,
          action: function (e: any) {
            //prevent menu closing
            e.stopPropagation();

            //toggle current column visibility
            column.toggle();

            //change menu item icon
            if (column.isVisible()) {
              icon.classList.remove('fa-square');
              icon.classList.add('fa-check-square');
            } else {
              icon.classList.remove('fa-check-square');
              icon.classList.add('fa-square');
            }
          },
        });
      }

      return menu;
    };
    this.table = new Tabulator('#table_BillImportSynthetic', {
      data: this.dataTable,
      layout: 'fitDataFill',
      height: '65vh',
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: true, // Cho phép chọn nhiều dòng
      rowContextMenu: rowMenu,
      columnDefaults: {
        resizable: true,
      },
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: 40,
          frozen: true,
        },
        {
          title: 'Nhận chứng từ',
          field: 'Status',
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: true,
          formatter: (cell) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${
              value === true ? 'checked' : ''
            } disabled />`;
          },
          headerMenu: headerMenu,
        },
        {
          title: 'Ngày nhận',
          field: 'CreatedDate',
          hozAlign: 'center',
          width: 120,
          frozen: true,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Loại phiếu',
          field: 'BillTypeText',
          width: 120,
          frozen: true,
        },
        {
          title: 'Ngày Y/c nhập',
          field: 'DateRequestImport',
          width: 130,
          frozen: true,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Số phiếu',
          field: 'BillImportCode',
          width: 160,
          bottomCalc: 'count',
          frozen: true,
        },
        { title: 'Mã NCC', field: 'CodeNCC', width: 120 },
        { title: 'Nhà cung cấp / Bộ phận', field: 'NameNCC', width: 280 },
        { title: 'Phòng ban', field: 'DepartmentName', width: 150 },
        { title: 'Mã NV', field: 'Code', width: 100 },
        { title: 'Người giao / Người trả', field: 'Deliver', width: 160 },
        { title: 'Người nhận', field: 'Reciver', width: 160 },

        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          hozAlign: 'center',
          width: 120,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        { title: 'Loại vật tư', field: 'KhoType', width: 160 },
        { title: 'Kho', field: 'WarehouseName', width: 120 },
        { title: 'Mã hàng', field: 'ProductCode', width: 150 },
        { title: 'ĐVT', field: 'Unit', width: 100 },
        { title: 'Mã nội bộ', field: 'ProductNewCode', width: 150 },
        { title: 'SL thực tế', field: 'Qty', width: 120 },
        { title: 'Loại hàng', field: 'Maker', width: 150 },
        { title: 'Số hóa đơn', field: 'SomeBill', width: 150 },

        {
          title: 'Ngày hóa đơn',
          field: 'DateSomeBill',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        { title: 'Mã dự án', field: 'ProjectCode', width: 130 },
        { title: 'Tên sản phẩm', field: 'ProductName', width: 250 },
        { title: 'Tên dự án', field: 'ProjectName', width: 250 },
        { title: 'SerialNumber', field: 'SerialNumber', width: 150 },

        { title: 'Ghi chú', field: 'Note', width: 200 },
        {
          title: 'Trạng thái chứng từ',
          field: 'IsSuccessText',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
        {
          title: 'PO',
          field: 'BillCodePO',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
        {
          title: 'Biên bản bàn giao',
          field: 'D1',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
        {
          title: 'Phiếu Xuất Kho',
          field: 'D2',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
        {
          title: 'Chứng Nhận Xuất xứ',
          field: 'D3',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
        {
          title: 'Chứng nhận chất lượng',
          field: 'D5',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
        },
      ],
    });
  }
}

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
import { BillExportService } from '../../bill-export-service/bill-export.service';
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
import { SelectControlComponent } from '../select-control/select-control.component';
import { ProjectComponent } from '../../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
@Component({
  selector: 'app-bill-export-synthetic',
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
  templateUrl: './bill-export-synthetic.component.html',
  styleUrl: './bill-export-synthetic.component.css',
})
export class BillExportSyntheticComponent implements OnInit, AfterViewInit {
  dataProductGroup: any[] = [];
  checked: any;
  dataTable: any[] = [];
  table: any;
  selectedKhoTypes: number[] = [];
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
  ];
  @Input() warehouseCode: string = 'HN';

  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    listproductgroupID: '',
    status: -1,
    warehousecode: this.warehouseCode,
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000,
    isDeleted: false,
  };

  searchText: string = '';
  dateFormat = 'dd/MM/yyyy';
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billExportService: BillExportService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    this.getProductGroup();
    this.loadDataBillExportSynthetic();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  getProductGroup() {
    this.billExportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID ?? 0
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            console.log('>>> Kết quả getProductGroup:', res);
            this.selectedKhoTypes = this.dataProductGroup.map(
              (item) => item.ID
            );
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
  loadDataBillExportSynthetic() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.billExportService
      .getBillExportSynthetic(
        this.searchParams.listproductgroupID,
        this.searchParams.status,
        dateStart,
        dateEnd,
        this.searchParams.keyword,
        this.checked,
        this.searchParams.pageNumber,
        this.searchParams.pageSize,
        this.searchParams.warehousecode,
        this.searchParams.isDeleted
      )
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.dataTable = res.data;
            console.log('dataSynthetic', this.dataTable);
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
  onCheckboxChange() {
    this.loadDataBillExportSynthetic();
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
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
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
        // Giới hạn độ dài tối đa của cell là 50 ký tựu
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
    link.download = `TongHopPhieuXuat.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion

  //#region  vẽ bảng
  drawTable() {
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
    if (this.table) {
      this.table.replaceData(this.dataTable);
    } else {
      this.table = new Tabulator('#table_BillExportSynthetic', {
        data: this.dataTable,
        layout: 'fitDataFill',
        height: '65vh',
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columnDefaults: {
          resizable: true,
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
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            headerSort: false,
            frozen: true,
          },
          {
            title: 'Nhận chứng từ',
            field: 'IsApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
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
            field: 'DateStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${
                value === true ? 'checked' : ''
              } disabled />`;
            },
          },
          {
            title: 'Trạng Thái',
            field: 'nameStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Ngày yêu cầu xuất kho',
            field: 'RequestDate',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Số phiếu',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã NV',
            field: 'EmployeeCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên NV',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã khách hàng',
            field: 'CustomerCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã NCC',
            field: 'CodeNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhà cung cấp',
            field: 'NameNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày xuất',
            field: 'CreatDate',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Loại vật tư',
            field: 'ProductTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Kho',
            field: 'WarehouseName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Loại phiếu',
            field: 'nameStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'FullNameSender',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Tổng số lượng',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
            editor: 'input',
            validator: 'numeric',
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'ĐVT',
            field: 'Unit',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã nội bộ',
            field: 'ProductNewCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Dự án',
            field: 'ProjectNameText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Loại hàng',
            field: 'ItemType',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'SerialNumber',
            field: 'SerialNumber',
            hozAlign: 'left',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            hozAlign: 'left',
            headerHozAlign: 'center',
            editor: 'input',
          },
        ],
      });
    }
  }
  //#endregion
}

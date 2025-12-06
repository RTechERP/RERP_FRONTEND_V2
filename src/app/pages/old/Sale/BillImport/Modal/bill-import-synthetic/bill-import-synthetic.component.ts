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
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
import { ProjectComponent } from '../../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../../../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
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
    NzSpinModule,
    // ProductSaleDetailComponent,
    // SelectControlComponent,
    NzCheckboxModule,
    HasPermissionDirective,
  ],
  templateUrl: './bill-import-synthetic.component.html',
  styleUrl: './bill-import-synthetic.component.css',
})
export class BillImportSyntheticComponent implements OnInit, AfterViewInit {
  dataProductGroup: any[] = [];
  checked: any;
  dataTable: any[] = [];
  table: any;
  isAdmin: boolean = false;
  currentUserID: number = 0;
  isLoading: boolean = false;
  //
  selectedKhoTypes: number[] = [];
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
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
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000000,
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
    this.isAdmin = this.appUserService.isAdmin;
    this.currentUserID = this.appUserService.id || 0;
  }
  ngAfterViewInit(): void {
    // Đảm bảo load data trước khi vẽ bảng
    this.getProductGroup();
  }

  closeModal() {
    this.modalService.dismissAll(true);
  }
  saveData() {
    if (!this.table) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    // Lấy tất cả các dòng đã được chỉnh sửa (edited rows) từ Tabulator
    // Sử dụng getEditedCells() để lấy danh sách các cell đã edit
    const editedCells = this.table.getEditedCells();

    if (!editedCells || editedCells.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thay đổi để lưu!'
      );
      return;
    }

    // Lấy danh sách các row unique từ edited cells
    const editedRowsMap = new Map();
    editedCells.forEach((cell: any) => {
      const rowData = cell.getRow().getData();
      editedRowsMap.set(rowData.ID, rowData);
    });

    const editedRows = Array.from(editedRowsMap.values());

    // Map dữ liệu theo logic C# - chỉ lưu các dòng được phép
    const dataToSave: any[] = [];
    const deniedRows: string[] = [];

    editedRows.forEach((row: any) => {
      // Kiểm tra ID Detail
      const id = row.IDDetail || 0;
      if (id <= 0) return;

      // Kiểm tra quyền: chỉ admin hoặc người giao hàng mới được sửa
      const deliverID = row.DeliverID || 0;
      if (deliverID !== this.currentUserID && !this.isAdmin) {
        deniedRows.push(row.BillImportCode || `ID: ${id}`);
        return;
      }

      // Tính toán DueDate từ DateSomeBill và DPO
      const dpo = row.DPO || 0;
      let dueDate = null;
      if (row.DateSomeBill) {
        const dateSomeBill = DateTime.fromISO(row.DateSomeBill);
        if (dateSomeBill.isValid) {
          dueDate = dateSomeBill.plus({ days: dpo }).toISO();
        }
      }

      // Tạo object để gửi lên API (match với BillImportDetail model)
      const updateData = {
        ID: id,
        SomeBill: row.SomeBill || '',
        DateSomeBill: row.DateSomeBill || null,
        DPO: dpo,
        DueDate: dueDate,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
        UpdatedBy: this.appUserService.loginName || '',
        UpdatedDate: new Date().toISOString(),
      };

      dataToSave.push(updateData);
    });

    // Thông báo nếu có dòng không được phép sửa
    if (deniedRows.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn không có quyền sửa ${deniedRows.length} phiếu: ${deniedRows
          .slice(0, 3)
          .join(', ')}${deniedRows.length > 3 ? '...' : ''}`
      );
    }

    if (dataToSave.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu hợp lệ để lưu! Bạn chỉ có thể sửa các phiếu do mình tạo hoặc nếu là Admin.'
      );
      return;
    }

    // Gửi dữ liệu lên API
    this.billImportService.SaveDataBillDetail(dataToSave).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Lưu thành công!'
          );

          // Clear edited cells sau khi lưu thành công
          this.table.clearCellEdited();

          // Reload lại dữ liệu
          this.loadDataBillImportSynthetic();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Lưu thất bại!'
          );
        }
      },
      error: (err) => {
        console.error('Lỗi khi lưu dữ liệu:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
        );
      },
    });
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tổng hợp phiếu nhập');

    const columns = table.getColumns();

    // Lọc các cột: bỏ cột đầu tiên (checkbox) và chỉ lấy các cột visible
    const filteredColumns = columns.slice(1).filter((col: any) => {
      const colDef = col.getDefinition();
      // Nếu không có thuộc tính visible hoặc visible = true thì mới lấy
      return colDef.visible !== false;
    });

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
        column: filteredColumns.length + 1, // +1 vì có cột STT
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
    this.billExportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID || 0
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
            // Load dữ liệu trước, sau đó mới load context menu và vẽ bảng
            this.loadDataBillImportSynthetic();
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy nhóm vật tư', err);
          // Vẫn vẽ bảng nếu có lỗi
          this.getDataContextMenu();
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
    // DateStart: set về đầu ngày (00:00:00)
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    ).startOf('day');

    // DateEnd: set về cuối ngày (23:59:59.999)
    const dateEnd = DateTime.fromJSDate(
      new Date(this.searchParams.dateEnd)
    ).endOf('day');

    this.isLoading = true;
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
          this.isLoading = false;
          if (res.status === 1) {
            this.dataTable = res.data;
            console.log('jdjhdjd', this.dataTable);
            if (this.table) {
              this.table.replaceData(this.dataTable);
            } else {
              // Nếu chưa có bảng, gọi getDataContextMenu để vẽ bảng với dữ liệu
              this.getDataContextMenu();
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải dữ liệu phiếu xuất'
          );
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
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTable,
      layout: 'fitDataFill',
      height: '100%',
      maxHeight: '100%',
      pagination: true,
      paginationSize: 50,
      paginationMode: 'local',
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: true, // Cho phép chọn nhiều dòng
      rowContextMenu: rowMenu,
      columns: [
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
        {
          title: 'Nhà cung cấp / Bộ phận',
          field: 'NameNCC',
          width: 300,
          formatter: 'textarea',
        },
        { title: 'Phòng ban', field: 'DepartmentName', width: 150 },
        { title: 'Mã NV', field: 'Code', width: 100 },
        { title: 'Người giao / Người trả', field: 'Deliver', width: 200 },
        { title: 'Người nhận', field: 'Reciver', width: 200 },

        {
          title: 'Ngày nhập kho',
          field: 'CreatDateActual',
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
        { title: 'SL thực tế', field: 'Qty', width: 120, bottomCalc: 'sum' },
        { title: 'Loại hàng', field: 'Maker', width: 150 },
        {
          title: 'Hóa đơn',
          field: 'IsBill',
          width: 150,
          hozAlign: 'center',
          formatter: function (cell) {
            const value = cell.getValue();
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value === true || value === 1;
            input.disabled = true; // Không cho click + chỉ hiển thị
            return input;
          },
        },
        {
          title: 'Số hóa đơn',
          field: 'SomeBill',
          width: 150,
          editor: 'input',
          editorParams: {
            elementAttributes: {
              maxlength: '100',
            },
          },
        },

        {
          title: 'Ngày hóa đơn',
          field: 'DateSomeBill',
          width: 150,
          editor: 'date',
          editorParams: {
            format: 'yyyy-MM-dd',
            verticalNavigation: 'table',
            elementAttributes: {
              title: 'Chọn ngày hóa đơn',
            },
          },
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },

        {
          title: 'Số ngày công nợ',
          field: 'DPO',
          width: 120,
          editor: 'number',
          editorParams: {
            min: 0,
            step: 1,
            elementAttributes: {
              maxlength: '10',
            },
          },
        },
        {
          title: 'Ngày tới hạn',
          field: 'DueDate',
          width: 150,
          formatter: (cell) => {
            const row = cell.getRow().getData();
            if (row['DateSomeBill'] && row['DPO']) {
              const dateSomeBill = DateTime.fromISO(row['DateSomeBill']);
              if (dateSomeBill.isValid) {
                const dueDate = dateSomeBill.plus({ days: row['DPO'] || 0 });
                return dueDate.toFormat('dd/MM/yyyy');
              }
            }
            return '';
          },
        },
        {
          title: 'Tiền thuế giảm',
          field: 'TaxReduction',
          width: 130,
          editor: 'number',
          editorParams: {
            min: 0,
            step: 0.01,
          },
          formatter: 'money',
          formatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
        },
        {
          title: 'Chi phí FE',
          field: 'COFormE',
          width: 130,
          editor: 'number',
          editorParams: {
            min: 0,
            step: 0.01,
          },
          formatter: 'money',
          formatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
        },
        { title: 'Mã dự án', field: 'ProjectCode', width: 130 },
        { title: 'Người giao', field: 'Deliver', width: 130 },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          width: 300,
          formatter: 'textarea',
        },
        {
          title: 'Mã theo dự án',
          field: 'ProjectCode',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          width: 300,
          formatter: 'textarea',
        },
        { title: 'Đơn mua hàng', field: 'BillCodePO', width: 150 },
        {
          title: 'Đơn giá',
          field: 'UnitPricePO',
          width: 100,
          formatter: 'money',
          formatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
        },
        { title: 'Thuế', field: 'VATPO', width: 150 },
        {
          title: 'Tổng tiền',
          field: 'TotalPricePO',
          width: 150,
          bottomCalc: 'sum',
          formatter: 'money',
          formatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 2,
          },
        },
        { title: 'Loại tiền', field: 'CurrencyCode', width: 150 },

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
        // {
        //   title: 'PO',
        //   field: 'BillCodePO',
        //   width: 250,
        //   formatter: 'textarea',
        //   formatterParams: {
        //     maxHeight: 250,
        //   },
        // },
        {
          title: 'Biên bản bàn giao',
          field: 'D1',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
          visible: false,
        },
        {
          title: 'Phiếu Xuất Kho',
          field: 'D2',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
          visible: false,
        },
        {
          title: 'Chứng Nhận Xuất xứ',
          field: 'D3',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
          visible: false,
        },
        {
          title: 'Chứng nhận chất lượng',
          field: 'D5',
          width: 250,
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 250,
          },
          visible: false,
        },
      ],
    });

    // Lưu giá trị cũ trước khi edit
    let oldValue: any = null;
    this.table.on('cellEditing', (cell: any) => {
      oldValue = cell.getValue();
    });

    // Lắng nghe sự kiện cellEdited để tự động cập nhật DueDate khi DateSomeBill hoặc DPO thay đổi
    this.table.on('cellEdited', (cell: any) => {
      const field = cell.getField();
      const newValue = cell.getValue();

      // Nếu giá trị mới là null, undefined hoặc chuỗi rỗng, khôi phục giá trị cũ
      if (newValue === null || newValue === undefined || newValue === '') {
        // Chỉ khôi phục nếu giá trị cũ có dữ liệu
        if (oldValue !== null && oldValue !== undefined && oldValue !== '') {
          cell.setValue(oldValue, true); // true = không trigger cellEdited event
          return;
        }
      }

      // Khi DateSomeBill hoặc DPO thay đổi, cập nhật lại DueDate
      if (field === 'DateSomeBill' || field === 'DPO') {
        const row = cell.getRow();
        const rowData = row.getData();

        // Tính toán DueDate mới
        let newDueDate = null;
        if (rowData.DateSomeBill && rowData.DPO) {
          const dateSomeBill = DateTime.fromISO(rowData.DateSomeBill);
          if (dateSomeBill.isValid) {
            newDueDate = dateSomeBill.plus({ days: rowData.DPO || 0 }).toISO();
          }
        }

        // Chỉ cập nhật nếu DueDate thực sự thay đổi
        const currentDueDate = rowData.DueDate;
        if (newDueDate !== currentDueDate) {
          // Cập nhật giá trị DueDate vào data của row (không silent để đánh dấu là edited)
          row.update({ DueDate: newDueDate });
        }
      }
    });
  }
}

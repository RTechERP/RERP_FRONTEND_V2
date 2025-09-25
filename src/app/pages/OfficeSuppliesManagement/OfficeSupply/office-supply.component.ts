import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { OfficeSupplyDetailComponent } from './office-supply-detail/office-supply-detail.component';
import { OfficeSupplyUnitDetailComponent } from '../OfficeSupplyUnit/office-supply-unit-detail/office-supply-unit-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyUnitModalComponent } from './office-supply-unit-modal/office-supply-unit-modal.component';
import { ImportExcelComponent } from './import-excel/import-excel.component';

import {OfficeSupplyService } from './office-supply-service/office-supply-service.service';


interface Unit {
  ID: number;
  Name: string;
  Code: string;
}


interface Product {
  ID?: number;
  CodeRTC: string;
  CodeNCC: string;
  NameRTC: string;
  NameNCC: string;
  SupplyUnitID: number;
  Price: number;
  RequestLimit: number;
  Type: number;
}

declare var bootstrap: any; // Đảm bảo khai báo bên ngoài class, trước constructor hoặc ngOnInit
@Component({
  selector: 'app-office-supply',
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
    OfficeSupplyDetailComponent,
    OfficeSupplyUnitModalComponent,
    ImportExcelComponent
  ],
  templateUrl: './office-supply.component.html',
  styleUrls: ['./office-supply.component.css'],
})
export class OfficeSupplyComponent implements OnInit, AfterViewInit {

  validateForm!: FormGroup;
  lstVP: any[] = [];
  listUnit: any[] = [];
  table: any; // instance của Tabulator
  table2: any; // instance của Tabulator cho bảng thứ hai
 
  dataTable: any[] = [];

  lastAddedIdProduct: number | null = null; // Thêm biến để theo dõi ID của sản phẩm mới thêm 

  newProduct: Product = {
    CodeRTC: '',
    CodeNCC: '',
    NameRTC: '',
    NameNCC: '',
    SupplyUnitID: 0,
    Price: 0,
    RequestLimit: 0,
    Type: 2 // default to Dùng chung
  };
  searchText: string = ''; // chứa từ khoá tìm kiếm
  isCheckmode: boolean = false;
  selectedList: any[] = [];
  selectedItem: any = {};

  
  typeOptions = [
    { id: 2, name: 'Dùng chung' },
    { id: 1, name: 'Cá nhân' }
  ];

  constructor(
    private lstVPP: OfficeSupplyService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) { }

  private initForm() {
    this.validateForm= this.fb.group({
      unitName: [null, [Validators.required]]
    });
  }
  ngOnInit(): void {
    this.getAll();
   
  }

  ngAfterViewInit(): void {
    this.drawTable(); // Khởi tạo tất cả các bảng ở đây
  }


  
  drawTable() {
    // Khởi tạo bảng chính (this.table)
    if (!this.table) { // Chỉ khởi tạo nếu chưa có
      this.table = new Tabulator('#datatable', {
        data: this.dataTable,
        layout: 'fitDataFill',
        height: '85vh',
        selectableRows: 10,
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,   
        columns: [
          { 
            title: "",
            formatter: "rowSelection", 
            titleFormatter: "rowSelection",
            hozAlign: "center",
            headerHozAlign: "center",
            headerSort: false,
            width: 40,
            frozen: true,
            
          },
          { title: 'Mã RTC', field: 'CodeRTC', hozAlign: 'left', headerHozAlign: 'center', width: 80,   bottomCalc: "count",},
          { title: 'Mã NCC', field: 'CodeNCC', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
          { title: 'Tên (RTC)', field: 'NameRTC', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
          { title: 'Tên (NCC)', field: 'NameNCC', hozAlign: 'left', headerHozAlign: 'center', width: 350 },
          {
            title: 'Đơn vị tính', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80
          },
          {
            title: 'Giá (VND)', field: 'Price', hozAlign: 'right', headerHozAlign: 'center', 
            width: 120,
            formatter: "money",
            formatterParams: {
              precision: 0,
              decimal: ".",
              thousand: ",",
              symbol: "",
              symbolAfter: true
            },
            bottomCalc: "sum",
            bottomCalcFormatter: "money",
            bottomCalcFormatterParams: {
              precision: 0,
              decimal: ".",
              thousand: ",",
              symbol: "",
              symbolAfter: true
            }
          },
          { title: 'Định mức', field: 'RequestLimit', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
          { title: 'Loại', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center', width: 80 }
        ],
      });
    }
  }
  getdataUnitbyid(id: number) {
    console.log("id", id);
    this.lstVPP.getdataUnitfill(id).subscribe({
      next: (response) => {
        console.log('Dữ liệu click sửa được:', response);
        let data = null;
        if (response?.data) {
          data = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          data = response;
        }

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          this.selectedItem = {
            ID: data['ID'] || '',
            Name: data['Name'] || '',
          };
          console.log('Selected item after API call:', this.selectedItem);
        } else {
          console.warn('Không có dữ liệu để fill');
          console.log('Giá trị data:', data);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
      }
    });
  }
 

  //lấy ra dữ liệu
  getAll(): void {
    this.lstVPP.getdata(this.searchText).subscribe({
      next: (res) => {
        console.log('Dữ liệu nhận được:', res);
        this.lstVP = res.data.officeSupply;
        
        // Sắp xếp dữ liệu: sản phẩm mới nhất lên đầu, các sản phẩm khác theo thứ tự tăng dần
        if (this.lastAddedIdProduct) {
          const newItem = this.lstVP.find(item => item.ID === this.lastAddedIdProduct);
          if (newItem) {
            // Tách sản phẩm mới ra khỏi danh sách
            this.lstVP = this.lstVP.filter(item => item.ID !== this.lastAddedIdProduct);
            // Sắp xếp các sản phẩm còn lại theo ID tăng dần
            this.lstVP.sort((a, b) => a.ID - b.ID);
            // Thêm sản phẩm mới vào đầu danh sách
            this.lstVP.unshift(newItem);
          }
        } else {
          // Nếu không có sản phẩm mới, sắp xếp tất cả theo ID tăng dần
          this.lstVP.sort((a, b) => a.ID - b.ID);
        }

        // Cập nhật lại dataTable và reload bảng
        this.dataTable = this.lstVP;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        } else {
          this.drawTable(); // Lần đầu thì vẽ bảng
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi API:', err);
        this.lstVP = [];
        this.dataTable = [];
        this.drawTable();
      },
    });
  }
  onSearchChange(event: any = null): void {
    this.getAll();
  }

  add(): void {
    if (!this.newProduct.CodeNCC || !this.newProduct.NameNCC || !this.newProduct.Price || !this.newProduct.SupplyUnitID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    this.lstVPP.adddata(this.newProduct).subscribe({
      next: (res) => {
        if(res && res.data){
          const newItem = Array.isArray(res.data) ? res.data[0] : res.data;
          this.lastAddedIdProduct = newItem.ID;
        }
        this.notification.success('Thông báo', 'Thêm thành công!');
        this.closeModal();
        this.getAll(); 

        // Cập nhật lại dataTable và reload bảng
        this.dataTable = this.lstVP;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }
  delete(): void {
    var dataSelect = this.table.getSelectedData();
    dataSelect.forEach((row: any) => {
      if (!this.selectedList.some(item => item.ID === row.ID)) {
        this.selectedList.push(row);
      }
    });
    const ids = this.selectedList.map(item => item.ID);
    if (ids.length == 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 sản phẩm để xóa!');
      return;
    }
    
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.lstVPP.deletedata(ids).subscribe({
          next: () => {
            this.notification.success('Thông báo', 'Đã xóa thành công!');
            this.getAll();
            this.selectedList = [];
          },
          error: (err: any) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa dữ liệu!');
          }
        });
      }
    });
  }

  //fill dữ liệu lên modal khi update dữ liệu
  getdatabyid(id: number) {
    console.log("id", id);

    this.lstVPP.getdatafill(id).subscribe({
      next: (res) => {
        let data = null;
        this.isCheckmode = true;
        if (res?.data) {
          data = Array.isArray(res.data) ? res.data[0] : res.data;
        } else {
          data = res; // fallback nếu không có res.data
        }

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          this.newProduct = {
            ID: data.ID || id,
            CodeRTC: data.CodeRTC || '',
            CodeNCC: data.CodeNCC || '',
            NameRTC: data.NameRTC || '',
            NameNCC: data.NameNCC || '',
            Price: data.Price ?? null,
            SupplyUnitID: data.SupplyUnitID ?? 0,
            RequestLimit: data.RequestLimit ?? null,
            Type: data.Type ?? 0,
          };

        } else {

          console.warn('Không có dữ liệu để fill');
          console.log('Giá trị data:', data);
        }
      }
    });

  }

  openModalDVT() {
    const modalRef = this.modalService.open(OfficeSupplyUnitModalComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getAll();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  closeModalDVT() {
    this.modalService.dismissAll();
  }

  //liên quản đến đóng mở modal để khi thêm và update dữ liệu
  // openModal() {
  //   const modalEl = document.getElementById('detailProductModal');
  //   if (modalEl) {
  //     const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  //     modal.show();
  //     console.log('ischeckmode:', this.isCheckmode);
  //   }
  // }
  openModal() {
    const modalRef = this.modalService.open(OfficeSupplyDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.newProduct = this.newProduct;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.listUnit = this.listUnit;
    modalRef.componentInstance.typeOptions = this.typeOptions;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getAll();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }
  
  openModalForNewProduct() {
    this.isCheckmode = false;
  
    // Gọi API để lấy mã CodeRTC mới
    this.lstVPP.getdata(this.searchText).subscribe({
      next: (res) => {
        console.log('Response từ nextCodeRTC:', res);
        this.newProduct = {
          CodeRTC: res.data.nextCode,
          CodeNCC: '',
          NameRTC: '',
          NameNCC: '',
          Price: 0,
          SupplyUnitID: 0,
          RequestLimit: 0,
          Type: 2,
        };
        this.openModal();
      },
      error: (err) => {
        console.error('Lỗi khi lấy CodeRTC:', err);
        this.newProduct = {
          CodeRTC: 'VPP-TAM',
          CodeNCC: '',
          NameRTC: '',
          NameNCC: '',
          Price: 0,
          SupplyUnitID: 0,
          RequestLimit: 0,
          Type: 2,
        };
        this.openModal();
      }
    });
  }
  openModalForUpdateProduct() {
    var dataSelect = this.table.getSelectedData();
    dataSelect.forEach((row: any) => {
      if (!this.selectedList.some(item => item.ID === row.ID)) {
        this.selectedList.push(row);
      }
    });
    const ids = this.selectedList.map(item => item.ID);
    this.isCheckmode = true;
    if (this.selectedList.length == 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 sản phẩm để sửa!');
      this.selectedList=[];
      return;
    } else if (this.selectedList.length > 1) {
      this.notification.warning('Thông báo', 'Vui lòng chỉ chọn 1 sản phẩm để sửa!');
      this.selectedList=[];
      return;
    } else {
      this.getdatabyid(this.selectedList[0].ID);
      this.openModal();
    }
  }
  closeModal() {
    this.selectedList=[];
    const modalEl = document.getElementById('detailProductModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
  }
// Thêm đơn vị tính
//   addNewUnit(): void {
//     if (!this.newUnit.Name) {
//       this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin đơn vị!');
//       return;
//     }
//     this.lstVPP.addUnit(this.newUnit).subscribe({
//       next: (response: any) => {
//         this.notification.success('Thông báo', 'Thêm đơn vị thành công!');
//         this.newUnit={ID:0,Name:''};
//         this.closeUnitModal();
//         this.getUnits(); 
//       },
//       error: (error: any) => {
//         this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm đơn vị!');
//       }
//     });
//   }

  closeUnitModal() {
    const modalEl = document.getElementById('addUnitModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
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
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
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
    link.download = `DanhSachVPP.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion

  formatCurrency(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '');
    const number = Number(value);
    event.target.value = number.toLocaleString('vi-VN');
    this.newProduct.Price = number;
  }

  edit(): void {
    var dataSelect = this.table.getSelectedData();
    dataSelect.forEach((row: any) => {
      if (!this.selectedList.some(item => item.ID === row.ID)) {
        this.selectedList.push(row);
      }
    });
    
    if (this.selectedList.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 sản phẩm để sửa!');
      return;
    } else if (this.selectedList.length > 1) {
      this.notification.warning('Thông báo', 'Vui lòng chỉ chọn 1 sản phẩm để sửa!');
      this.selectedList = [];
      return;
    }

    this.isCheckmode = true;
    this.getdatabyid(this.selectedList[0].ID);
    this.openModal();
  }
  OpenModalExcel(): void {
    const modalRef = this.modalService.open(ImportExcelComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    // Pass variables to the modal component
    modalRef.componentInstance.lstVP = this.lstVP;
    modalRef.componentInstance.dataTable = this.dataTable;
    modalRef.componentInstance.table = this.table;
    modalRef.componentInstance.lastAddedIdProduct = this.lastAddedIdProduct;
    modalRef.componentInstance.searchText = this.searchText;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getAll();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }
}

import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import {OfficeSuppliesService } from './office-supplies-service/office-supplies-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

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
  selector: 'app-office-supplies',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzMessageModule, 
    NzModalModule,
    NzSelectModule
  ],
  templateUrl: './office-supplies.component.html',
  styleUrls: ['./office-supplies.component.css'],
})
export class OfficeSuppliesComponent implements OnInit {

  lstVP: any[] = [];
  listUnit: any[] = [];
  table: any; // instance của Tabulator
  table2: any; // instance của Tabulator cho bảng thứ hai
  tableExcel: any;
  dataTable: any[] = [];
  dataTable2: any[]=[];
  dataTableExcel: any[]=[];
  lastAddedId: number | null = null; // Thêm biến để theo dõi ID của đơn vị tính mới thêm
  lastAddedIdProduct: number | null = null; // Thêm biến để theo dõi ID của sản phẩm mới thêm 
  newUnit: any = {ID:0,Name:''};
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
  selectid: number = 0;
  selectedList: any[] = [];
  selectedId = 0;
  selectedItem: any = {};
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB

  typeOptions = [
    { id: 2, name: 'Dùng chung' },
    { id: 1, name: 'Cá nhân' }
  ];

  constructor(
    private lstVPP: OfficeSuppliesService,
    private message: NzMessageService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.drawTable(); // Khởi tạo tất cả các bảng ở đây
    this.getAll();
    this.getUnits();
  }

//lấy ra danh sách đơn vị tính
  getUnits(): void {
    this.lstVPP.getUnit().subscribe({
      next: (res) => {
        console.log('Danh sách đơn vị tính:', res);
        this.listUnit = Array.isArray(res?.data) ? res.data : [];
        this.dataTable2 = res.data;
        if(this.lastAddedId){
          const newItem = this.listUnit.find(item => item.ID === this.lastAddedId);
          if(newItem){
            //Tách đơn vị mới ra khỏi danh sách
            this.listUnit = this.listUnit.filter(item => item.ID !== this.lastAddedId);
            //Sắp xếp các đơn vị còn lại theo ID tăng dần
            this.listUnit.sort((a, b) => a.ID - b.ID);
            //Thêm đơn vị mới vào đầu danh sách
            this.listUnit.unshift(newItem);
          }
        }else{
          //Nếu không có đơn vị mới, sắp xếp tất cả theo ID tăng dần
          this.listUnit.sort((a, b) => a.ID - b.ID);
        }
        if (this.table2) {
          this.table2.replaceData(this.dataTable2);
        } else {
          // Nếu table2 chưa được khởi tạo (ví dụ: trường hợp lỗi ngOnInit), gọi drawTable
          this.drawTable(); 
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
      }
    });
  }
  
  private drawTable(): void {
    // Khởi tạo bảng chính (this.table)
    if (!this.table) { // Chỉ khởi tạo nếu chưa có
      this.table = new Tabulator('#datatable', {
        data: this.dataTable,
        layout: 'fitDataFill',
        height: '70vh',
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

    // Khởi tạo bảng thứ hai (this.table2)
    if (!this.table2) { // Chỉ khởi tạo nếu chưa có
      this.table2 = new Tabulator('#datatable2', {
        data: this.dataTable2,
        layout: 'fitDataFill',
        height: '50vh',
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: [
          {
            title: 'Mã đơn vị',
            field: 'ID',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên đơn vị',
            field: 'Name',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: "50%"
          }
        ]
      });

      // Thêm sự kiện click cho bảng thứ hai
      this.table2.on("rowClick", (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedItem = {
          ID: rowData['ID'],
          Name: rowData['Name']
        };
        console.log('Selected item:', this.selectedItem);
        // Gọi API để lấy dữ liệu chi tiết
        this.getdataUnitbyid(rowData['ID']);
      });
    }
    
    // Khởi tạo bảng dữ liệu Excel (this.tableExcel)
    // Đặt chiều cao hợp lý cho bảng trong modal
    if (!this.tableExcel) { // Chỉ khởi tạo nếu chưa có
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel, // Dữ liệu ban đầu rỗng
        layout: 'fitDataFill',
        height: '300px', // Chiều cao cố định cho bảng trong modal
        selectableRows: 10,
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true, // Tự động tạo cột dựa trên dữ liệu
        autoColumnsDefinitions: {
          STT: { title: "STT", field: "STT", hozAlign: "center", headerHozAlign: "center", width: 50 },
          CodeRTC: { title: "Mã RTC", field: "CodeRTC", hozAlign: "left", headerHozAlign: "center", width: 80 },
          CodeNCC: { title: "Mã NCC", field: "CodeNCC", hozAlign: "left", headerHozAlign: "center", width: 100 },
          NameRTC: { title: "Tên (RTC)", field: "NameRTC", hozAlign: "left", headerHozAlign: "center", width: 200 },
          NameNCC: { title: "Tên (NCC)", field: "NameNCC", hozAlign: "left", headerHozAlign: "center", width: 350 },
          Unit: { title: "Đơn vị tính", field: "Unit", hozAlign: "left", headerHozAlign: "center", width: 80 },
          Price: { 
            title: "Giá (VND)", 
            field: "Price", 
            hozAlign: "right", 
            headerHozAlign: "center", 
            width: 120 
          },
          RequestLimit: { title: "Định mức", field: "RequestLimit", hozAlign: "right", headerHozAlign: "center", width: 80 },
          Type: { title: "Loại", field: "Type", hozAlign: "left", headerHozAlign: "center", width: 80 }
        }
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
  saveSelectedItem() {
    if (!this.selectedItem?.Name) {
      this.message.error('Tên đơn vị không được để trống!');
      return;
    }

    // Nếu không có ID hoặc ID = 0, tạo mới
    if (!this.selectedItem?.ID || this.selectedItem.ID === 0) {
      this.lstVPP.addUnit({ ID: 0, Name: this.selectedItem.Name }).subscribe({
        next: (response) => {
          if(response && response.data){
            const newItem = Array.isArray(response.data) ? response.data[0] : response.data;
            this.lastAddedId = newItem.ID;
          }
          this.message.success('Thêm mới thành công!');
          this.selectedItem = {};
          this.getUnits();
        },
        error: (err) => {
          console.error('Lỗi khi thêm mới:', err);
          this.message.error('Có lỗi xảy ra khi thêm mới!');
        }
      });
    } else {
      // Nếu có ID, cập nhật
      this.lstVPP.updatedataUnit(this.selectedItem).subscribe({
        next: (response) => {
          this.message.success('Cập nhật thành công!');
          this.selectedItem = {};
          this.getUnits();
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật dữ liệu:', err);
          this.message.error('Có lỗi xảy ra khi cập nhật dữ liệu!');
        }
      });
    }
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
      this.message.warning('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    this.lstVPP.adddata(this.newProduct).subscribe({
      next: (res) => {
        if(res && res.data){
          const newItem = Array.isArray(res.data) ? res.data[0] : res.data;
          this.lastAddedIdProduct = newItem.ID;
        }
        this.message.success('Thêm thành công!');
        this.closeModal();
        this.getAll(); 

        // Cập nhật lại dataTable và reload bảng
        this.dataTable = this.lstVP;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        }
      },
      error: (err) => {
        this.message.error('Có lỗi xảy ra khi thêm dữ liệu!');
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
      this.message.warning('Vui lòng chọn 1 sản phẩm để xóa!');
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
            this.message.success('Đã xóa thành công!');
            this.getAll();
            this.selectedList = [];
          },
          error: (err: any) => {
            this.message.error('Có lỗi xảy ra khi xóa dữ liệu!');
          }
        });
      }
    });
  }

  //cập nhật
  update(): void {
    if (!this.newProduct.CodeNCC || !this.newProduct.NameNCC || !this.newProduct.Price || !this.newProduct.SupplyUnitID) {
      this.message.warning('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    console.log('Dữ liệu update:', this.newProduct);
    this.lstVPP.updatedata(this.newProduct).subscribe({
      next: (res) => {
        this.message.success('Cập nhật thành công!');
        this.closeModal();
        this.getAll();
      },
      error: (err) => {
        this.message.error('Có lỗi xảy ra khi cập nhật dữ liệu!');
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

  openModalDVT(){
    const modalEl = document.getElementById('officeSupplyUnitModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

      modal.show();
      console.log('ischeckmode:', this.isCheckmode);
    }
  }
  closeModalDVT() {
    this.selectedList=[];
    const modalEl = document.getElementById('officeSupplyUnitModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
  }
  //liên quản đến đóng mở modal để khi thêm và update dữ liệu
  openModal() {
    const modalEl = document.getElementById('detailProductModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

      modal.show();
      console.log('ischeckmode:', this.isCheckmode);
    }
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
      this.message.warning('Vui lòng chọn 1 sản phẩm để sửa!');
      this.selectedList=[];
      return;
    } else if (this.selectedList.length > 1) {
      this.message.warning('Vui lòng chỉ chọn 1 sản phẩm để sửa!');
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
//Thêm đơn vị tính
  addNewUnit(): void {
    if (!this.newUnit.Name) {
      this.message.warning('Vui lòng điền đầy đủ thông tin đơn vị!');
      return;
    }
    this.lstVPP.addUnit(this.newUnit).subscribe({
      next: (response: any) => {
        this.message.success('Thêm đơn vị thành công!');
        this.newUnit={ID:0,Name:''};
        this.closeUnitModal();
        this.getUnits(); 
        
      },
      error: (error: any) => {
        this.message.error('Có lỗi xảy ra khi thêm đơn vị!');
      }
    });
  }

  closeUnitModal() {
    const modalEl = document.getElementById('addUnitModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
  }

  // exportToExcel() {
  //   const now = new Date();
  //   const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    
  //   if (this.table) {
  //     this.table.download("xlsx", `DanhSachVPP_${dateStr}.xlsx`, {
  //       sheetName: "Danh sách VPP",
  //       sheetHeader: true,
  //       columnHeaders: true,
  //       columnGroups: false,
  //       rowGroups: false,
  //       columnCalcs: false,
  //       dataTree: false,
  //       style: true
  //     });
  //   } else {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Oops...',
  //       text: 'Bảng chưa được khởi tạo!',
  //     });
  //   }
  // }

  public async exportToExcel(fileName: string = 'van-phong-pham.xlsx', mainSheetTitle: string = 'BẢNG KÊ VĂN PHÒNG PHẨM') {
    // Tạo một workbook mới
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1'); // Bạn có thể đặt tên cho sheet của mình

    // 1. Thêm tiêu đề chính cho bảng và gộp ô
    const numberOfDataColumns = 8; // Số cột dữ liệu gốc (không tính STT)
    const totalColumns = numberOfDataColumns + 1; // Bao gồm cả cột STT
    const lastColumnLetter = String.fromCharCode(64 + totalColumns); // A=65, B=66,...

    worksheet.mergeCells(`A1:${lastColumnLetter}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = mainSheetTitle;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000080' } }; // Màu xanh đậm
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Dòng trống sau tiêu đề chính (dòng 2)
    // worksheet.addRow([]); // Không cần thiết nếu muốn tiêu đề cột ngay sau tiêu đề chính

    // 2. Định nghĩa các cột cho ExcelJS (dòng tiêu đề cột sẽ là dòng 2 hoặc 3)
    // Dòng tiêu đề cột sẽ là dòng 2
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 7, style: { alignment: { horizontal: 'center' } } },
      { header: 'Mã RTC', key: 'CodeRTC', width: 15 },
      { header: 'Mã NCC', key: 'CodeNCC', width: 15 },
      { header: 'Tên (RTC)', key: 'NameRTC', width: 30 },
      { header: 'Tên (NCC)', key: 'NameNCC', width: 45 },
      { header: 'Đơn vị tính', key: 'Unit', width: 12 },
      {
        header: 'Giá (VND)',
        key: 'Price',
        width: 20,
        style: { numFmt: '#,##0', alignment: { horizontal: 'right' } }
      },
      { header: 'Định mức', key: 'RequestLimit', width: 10, style: { alignment: { horizontal: 'right' } } },
      { header: 'Loại', key: 'TypeName', width: 15 }
    ];

    // Định dạng cho dòng tiêu đề cột (bây giờ là dòng 2)
    const headerRow = worksheet.getRow(2); // Dòng tiêu đề cột
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Chữ trắng
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' } // Màu xanh dương đậm cho nền header
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
      };
    });
    headerRow.height = 25;


    // 3. Thêm các dòng từ dataTable của bạn, bắt đầu từ dòng 3
    const firstDataRowNumber = 3;
    (this.dataTable as any[]).forEach((rowData: any, index: number) => {
      const newRowDataWithSTT = {
        stt: index + 1,
        ...rowData
      };
      worksheet.addRow(newRowDataWithSTT);
    });

    // Định dạng đặc biệt cho cột 'Giá (VND)' (cột G)
    // Dữ liệu bắt đầu từ firstDataRowNumber
    const priceColumnKey = 'Price'; // Sử dụng key để lấy cột
    const priceColumn = worksheet.getColumn(priceColumnKey);
    if (priceColumn) {
        priceColumn.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
            // Bỏ qua các dòng không phải dữ liệu (tiêu đề chính, tiêu đề cột)
            if (rowNumber >= firstDataRowNumber && cell.value !== null && typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'right' };
            }
        });
    }
    
    // Áp dụng border cho các ô dữ liệu
    for (let i = firstDataRowNumber; i < firstDataRowNumber + (this.dataTable as any[]).length; i++) {
        const dataRow = worksheet.getRow(i);
        dataRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
            };
        });
    }


    // 4. Tính toán ở dòng cuối
    const lastDataRowNumber = firstDataRowNumber + (this.dataTable as any[]).length - 1;
    const totalDisplayRowNumber = lastDataRowNumber + 2; // Dòng hiển thị tổng, sau 1 dòng trống

    // Tổng số lượng mục (đặt ở cột B - 'Mã RTC')
    worksheet.getCell(`B${totalDisplayRowNumber}`).value = `Tổng số mục: ${(this.dataTable as any[]).length}`;
    worksheet.getCell(`B${totalDisplayRowNumber}`).font = { bold: true };
    worksheet.getCell(`B${totalDisplayRowNumber}`).alignment = { horizontal: 'left' };

    // Tổng cho 'Giá (VND)' (cột G)
    const priceColumnLetterForFormula = 'G'; // STT(A), Mã RTC(B), Mã NCC(C), Tên RTC(D), Tên NCC(E), Unit(F), Price(G)
    
    // Nhãn "Tổng giá:" đặt ở cột F (Đơn vị tính)
    worksheet.getCell(`F${totalDisplayRowNumber}`).value = 'Tổng cộng:';
    worksheet.getCell(`F${totalDisplayRowNumber}`).font = { bold: true };
    worksheet.getCell(`F${totalDisplayRowNumber}`).alignment = { horizontal: 'right' };

    // Giá trị tổng đặt ở cột G (Giá VND)
    worksheet.getCell(`${priceColumnLetterForFormula}${totalDisplayRowNumber}`).value = {
      formula: `SUM(${priceColumnLetterForFormula}${firstDataRowNumber}:${priceColumnLetterForFormula}${lastDataRowNumber})`
    };
    worksheet.getCell(`${priceColumnLetterForFormula}${totalDisplayRowNumber}`).numFmt = '#,##0';
    worksheet.getCell(`${priceColumnLetterForFormula}${totalDisplayRowNumber}`).font = { bold: true };
    worksheet.getCell(`${priceColumnLetterForFormula}${totalDisplayRowNumber}`).alignment = { horizontal: 'right' };
    
    // Định dạng cho dòng tổng cộng
    const totalRowStyle = worksheet.getRow(totalDisplayRowNumber);
    totalRowStyle.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' } // Màu xám rất nhạt cho dòng tổng
        };
         cell.border = { // Thêm border cho dòng tổng
            top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
            left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
            bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
            right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
        };
    });


    // Kích hoạt tải tệp xuống
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Giải phóng bộ nhớ
    }).catch(err => {
      console.error('Lỗi khi ghi bộ đệm Excel: ', err);
      // Thêm thông báo lỗi cho người dùng nếu cần
    });
  }

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
      this.message.warning('Vui lòng chọn 1 sản phẩm để sửa!');
      return;
    } else if (this.selectedList.length > 1) {
      this.message.warning('Vui lòng chỉ chọn 1 sản phẩm để sửa!');
      this.selectedList = [];
      return;
    }

    this.isCheckmode = true;
    this.getdatabyid(this.selectedList[0].ID);
    this.openModal();
  }
  OpenModalExcel(): void {
    const modalEl = document.getElementById('ExcelModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      // Reset trạng thái tiến trình khi mở modal
      this.resetExcelImportState(); // Sử dụng hàm reset
    }
  }

  importFromExcel(): void {
    if (this.table) {
      this.table.import("xlsx", [".xlsx", ".csv", ".ods"], "buffer");
    } else {
      this.message.warning('Bảng chưa được khởi tạo!');
    }
  }

  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        console.log('File đã chọn:', file.name); // Log để kiểm tra
        console.log('Phần mở rộng:', fileExtension); // Log để kiểm tra

        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            this.message.warning('Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
            input.value = ''; // Xóa input để có thể chọn lại file
            this.resetExcelImportState(); // Reset trạng thái khi có lỗi định dạng
            return;
        }

        this.filePath = file.name;
        this.excelSheets = [];
        this.selectedSheet = '';
        this.dataTableExcel = [];
        this.totalRowsAfterFileRead = 0;
        this.processedRowsForSave = 0; // Reset cho giai đoạn lưu

        // Đặt trạng thái ban đầu cho thanh tiến trình: Đang đọc file
        this.displayProgress = 0;
        this.displayText = 'Đang đọc file...'; 
        console.log('Progress bar state set to: Đang đọc file...'); // Log trạng thái ban đầu

        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                this.displayProgress = Math.round((event.loaded / event.total) * 100);
                this.displayText = `Đang tải file: ${this.displayProgress}%`;
                // console.log(`Tiến trình đọc file: ${this.displayProgress}%`); // Bỏ comment nếu muốn log chi tiết tiến trình tải
            }
        };

        let startTime = Date.now(); // Ghi lại thời gian bắt đầu đọc file

        reader.onload = async (e: any) => {
            const data = e.target.result;
            try {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(data);
                console.log('Workbook đã được tải bởi ExcelJS.'); // Log

                this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
                console.log('Danh sách sheets tìm thấy:', this.excelSheets); // Log

                if (this.excelSheets.length > 0) {
                    this.selectedSheet = this.excelSheets[0];
                    console.log('Sheet mặc định được chọn:', this.selectedSheet); // Log
                    await this.readExcelData(workbook, this.selectedSheet);
                    
                    const elapsedTime = Date.now() - startTime;
                    const minDisplayTime = 500; // Thời gian hiển thị tối thiểu cho trạng thái tải (500ms)

                    if (elapsedTime < minDisplayTime) {
                        // Nếu quá trình xử lý nhanh hơn thời gian tối thiểu, đợi thêm
                        setTimeout(() => {
                            this.displayProgress = 0; // Luôn hiển thị 0% cho trạng thái "0/tổng số dòng"
                            if (this.totalRowsAfterFileRead === 0) {
                                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                            } else {
                                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                            }
                            console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật (sau delay).');
                        }, minDisplayTime - elapsedTime);
                    } else {
                        // Nếu quá trình xử lý đã đủ lâu, cập nhật ngay lập tức
                        this.displayProgress = 0;
                        if (this.totalRowsAfterFileRead === 0) {
                            this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                        } else {
                            this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                        }
                        console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật.');
                    }

                } else {
                    console.warn('File Excel không chứa bất kỳ sheet nào.'); // Log
                    this.message.warning('File Excel không có sheet nào!');
                    this.resetExcelImportState();
                }
            } catch (error) {
                console.error('Lỗi khi đọc tệp Excel trong FileReader.onload:', error); // Log chi tiết lỗi
                this.message.error('Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
                this.resetExcelImportState(); // Reset trạng thái khi có lỗi
            }
            input.value = ''; // Xóa input để có thể chọn lại cùng file
        };
        reader.readAsArrayBuffer(file); // Bắt đầu đọc file ngay lập tức
    }
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`); // Log
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`); // Log lỗi cụ thể
      }

      // Đọc header từ hàng đầu tiên
      const headerRow = worksheet.getRow(2);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Cập nhật cấu hình cột cho bảng Excel
      const columns = [
        {title: headers[0] || 'STT', field:'STT',hozAlign:'center',headerHozAlign:"center",width:50},
        { title: headers[1] || 'CodeRTC', field: 'CodeRTC', hozAlign: 'left', headerHozAlign: 'center', width: 80 },
        { title: headers[2] || 'CodeNCC', field: 'CodeNCC', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[3] || 'NameRTC', field: 'NameRTC', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
        { title: headers[4] || 'NameNCC', field: 'NameNCC', hozAlign: 'left', headerHozAlign: 'center', width: 350 },
        {
          title: headers[5] || 'Unit', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80
        },
        {
          title: headers[6] || 'Price', field: 'Price', hozAlign: 'right', headerHozAlign: 'center', 
          width: 120,
        },
        { title: headers[7] || 'RequestLimit', field: 'RequestLimit', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[8] || 'Type', field: 'Type', hozAlign: 'left', headerHozAlign: 'center', width: 80 }
      ];

      // Cập nhật cấu hình cột cho bảng Excel
      if (this.tableExcel) {
        this.tableExcel.setColumns(columns);
      }

      const data: any[] = []; // Dữ liệu cho bảng preview
      let validRecords = 0; // Số lượng bản ghi hợp lệ
      let foundFirstDataRow = false; // Biến flag để xác định hàng dữ liệu hợp lệ đầu tiên

      // Đọc dữ liệu từ hàng thứ 2 trở đi
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Bỏ qua hàng tiêu đề đầu tiên
          const firstCell = row.getCell(1).value;
          const secondCell = row.getCell(2).value;
          const thirdCell = row.getCell(3).value;
          
          // Kiểm tra nếu cell(1) là số
          const isFirstCellNumber = typeof firstCell === 'number' && !isNaN(firstCell);

          // Kiểm tra nếu hàng không rỗng hoàn toàn
          // Đồng thời đảm bảo secondCell và thirdCell không được rỗng
          const isEmptyRow = !firstCell || (!secondCell || !thirdCell);

          // Nếu hàng không trống, tạo rowData và thêm vào dataTableExcel
          if (!isEmptyRow) {
             const rowData: any = {
               STT: firstCell?.toString() || '', // Lấy giá trị gốc, chuyển sang chuỗi
               CodeRTC: row.getCell(2).value?.toString() || '',
               CodeNCC: row.getCell(3).value?.toString() || '',
               NameRTC: row.getCell(4).value?.toString() || '',
               NameNCC: row.getCell(5).value?.toString() || '',
               Unit: row.getCell(6).value?.toString() || '',
               // Giữ nguyên logic kiểm tra kiểu dữ liệu đã sửa
               Price: typeof row.getCell(7).value === 'number' ? row.getCell(7).value : row.getCell(7).value?.toString() || '',
               RequestLimit: typeof row.getCell(8).value === 'number' ? row.getCell(8).value : row.getCell(8).value?.toString() || '',
               Type: row.getCell(9).value?.toString() || ''
             };
             data.push(rowData); // Thêm vào data cho bảng preview
          }

          // Logic để xác định khi nào bắt đầu đếm validRecords
          if (typeof firstCell === 'number' && !isNaN(firstCell)) {
            foundFirstDataRow = true; // Đánh dấu đã tìm thấy hàng dữ liệu đầu tiên có STT số
          }

          // Đếm validRecords chỉ sau khi tìm thấy hàng đầu tiên có STT số và hàng đó không trống
          if (foundFirstDataRow && !isEmptyRow) {
             validRecords++;
          }
        }
      });

      this.dataTableExcel = data; // Gán dữ liệu đầy đủ cho bảng preview
      this.totalRowsAfterFileRead = validRecords; // Cập nhật tổng số dòng hợp lệ (đếm từ hàng có STT số)
      console.log(`Đã đọc ${data.length} dòng dữ liệu không trống từ sheet (hiển thị preview).`);
      console.log(`Tìm thấy ${validRecords} bản ghi hợp lệ (bắt đầu từ STT số).`); // Log rõ ràng hơn

      // Cập nhật hiển thị sau khi đọc dữ liệu xong (0/tổng số dòng)
      this.displayProgress = 0; 
      if (this.totalRowsAfterFileRead === 0) {
        this.displayText = 'Không có dữ liệu hợp lệ trong sheet.'; // Thông báo rõ ràng hơn
      } else {
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      }
      
      // Cập nhật Tabulator
      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        // Trường hợp này ít xảy ra nếu drawTable được gọi trong ngOnInit
        this.drawTable();     
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet trong readExcelData:', error); // Log chi tiết lỗi
      this.message.error('Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetExcelImportState(); // Reset trạng thái khi có lỗi
    }
  }

  onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.filePath) {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (e: any) => {
                const data = e.target.result;
                try {
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(data);
                    await this.readExcelData(workbook, this.selectedSheet);
                    // Sau khi thay đổi sheet và đọc dữ liệu, đặt lại thanh tiến trình
                    this.displayProgress = 0;
                    // displayText được cập nhật trong readExcelData
                    console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.'); // Log
                } catch (error) {
                    console.error('Lỗi khi đọc tệp Excel khi thay đổi sheet:', error);
                    this.message.error('Không thể đọc dữ liệu từ sheet đã chọn!');
                    this.resetExcelImportState(); // Reset trạng thái khi có lỗi
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }
  }

  saveExcelData() {
    console.log('--- Bắt đầu saveExcelData ---');
    console.log('Tổng số bản ghi cần lưu (trước lọc):', this.dataTableExcel.length);
    console.log('Dữ liệu Excel hiện tại (trước lọc):', this.dataTableExcel);

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.message.warning('Không có dữ liệu để lưu!');
      console.log('Không có dữ liệu để lưu.');
      return;
    }

    // Lọc dữ liệu để chỉ lấy các dòng có STT là số để xử lý lưu
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      // Kiểm tra nếu STT là kiểu số hoặc chuỗi có thể chuyển đổi thành số
      return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(parseFloat(stt as string)) && isFinite(parseFloat(stt as string)));
    });

    console.log('Số lượng bản ghi hợp lệ để lưu (sau lọc STT số):', validDataToSave.length);
    console.log('Dữ liệu hợp lệ để lưu:', validDataToSave);

    if (validDataToSave.length === 0) {
      this.message.warning('Không có dữ liệu hợp lệ (STT là số) để lưu!');
      console.log('Không có dữ liệu hợp lệ (STT là số) để lưu.');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    } 

    // Reset tiến trình cho giai đoạn lưu dữ liệu
    this.processedRowsForSave = 0;
    const totalProductsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalProductsToSave} bản ghi`;
    this.displayProgress = 0;

    // Lấy danh sách mã sản phẩm cần kiểm tra từ dữ liệu đã lọc
    const codesToCheck = validDataToSave.map(item => ({
      CodeRTC: item.CodeRTC,
      CodeNCC: item.CodeNCC
    }));

    console.log('codesToCheck (dữ liệu gửi đi kiểm tra, đã lọc STT số):', codesToCheck);

    // Gọi API để kiểm tra các mã và lấy ID
    this.lstVPP.checkProductCodes(codesToCheck).subscribe({
      next: (response: any) => {
        console.log('Response từ checkProductCodes API:', response);
        const existingProducts = (response.data && Array.isArray(response.data.existingProducts)) ? response.data.existingProducts : [];
        console.log('existingProducts (sau khi xử lý response):', existingProducts);
        
        // Chuẩn bị dữ liệu để gửi đi lưu
        const processedData = validDataToSave.map((row, index) => {
          const existingProduct = existingProducts.find((p: any) => 
            p.CodeRTC === row.CodeRTC && p.CodeNCC === row.CodeNCC
          );

          const assignedId = existingProduct ? existingProduct.ID : 0;

          return {
            id: assignedId,
            codeRTC: row.CodeRTC || '',
            codeNCC: row.CodeNCC || '',
            nameRTC: row.NameRTC || '',
            nameNCC: row.NameNCC || '',
            SupplyUnitID: this.getUnitIdByName(row.Unit),
            price: Number(row.Price) || 0,
            requestLimit: Number(row.RequestLimit) || null,
            type: row.Type === 'Cá nhân' ? 1 : 2,
            isActive: true
          };
        });

        console.log('processedData (dữ liệu cuối cùng gửi đi lưu, đã lọc STT số):', processedData);

        let successCount = 0;
        let errorCount = 0;
        let completedRequests = 0;

        if (processedData.length === 0) {
          this.message.info('Không có sản phẩm hợp lệ để tiến hành lưu.');
          this.closeExcelModal();
          console.log('Không có sản phẩm nào để lưu sau xử lý map.');
          return;
        }

        // Hàm để xử lý lưu từng sản phẩm với delay
        const saveProductWithDelay = (index: number) => {
          if (index >= processedData.length) {
            // Đã xử lý xong tất cả sản phẩm
            console.log('--- Tất cả các request adddata đã hoàn thành ---');
            this.showSaveSummary(successCount, errorCount, totalProductsToSave);
            return;
          }

          const product = processedData[index];
          console.log(`Gửi lưu sản phẩm ${index + 1}/${totalProductsToSave}:`, product);

          // Thêm delay 0,0005 giây trước khi lưu mỗi sản phẩm
          setTimeout(() => {
            this.lstVPP.adddata(product).subscribe({
              next: (response) => {
                console.log(`Response từ adddata cho sản phẩm ${index + 1}:`, response);
                if (response.status === 1) {
                  successCount++;
                } else {
                  errorCount++;
                  console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, response.message);
                }

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

                // Xử lý sản phẩm tiếp theo
                saveProductWithDelay(index + 1);
              },
              error: (err) => {
                errorCount++;
                console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, err);

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

                // Xử lý sản phẩm tiếp theo
                saveProductWithDelay(index + 1);
              }
            });
          }, 5); // Delay 0,0005s
        };

        // Bắt đầu xử lý từ sản phẩm đầu tiên
        saveProductWithDelay(0);
      },
      error: (err) => {
        console.error('Lỗi khi kiểm tra mã sản phẩm từ API:', err);
        this.message.error('Có lỗi xảy ra khi kiểm tra mã sản phẩm từ database!');
        this.displayText = 'Lỗi kiểm tra sản phẩm!';
        this.displayProgress = 0;
      }
    });
  }

  // Thêm phương thức hiển thị tóm tắt kết quả lưu
  showSaveSummary(successCount: number, errorCount: number, totalProducts: number) {
    console.log('--- Hiển thị tóm tắt kết quả lưu ---');
    console.log(`Tổng sản phẩm: ${totalProducts}, Thành công: ${successCount}, Thất bại: ${errorCount}`);

    if (errorCount === 0) {
      this.message.success(`Đã lưu ${successCount} sản phẩm thành công`);
    } else if (successCount === 0) {
        this.message.error(`Lưu thất bại ${errorCount}/${totalProducts} sản phẩm`);
    } else {
      this.message.warning(`Đã lưu ${successCount} sản phẩm thành công, ${errorCount} sản phẩm thất bại`);
    }
    this.closeExcelModal();
    this.getAll(); // Refresh the table
    console.log('--- Kết thúc hiển thị tóm tắt ---');
  }

  // Hàm helper để lấy ID của đơn vị tính từ tên
  private getUnitIdByName(unitName: string): number {
    const unit = this.listUnit.find(u => u.Name === unitName);
    return unit ? unit.ID : 0;
  }

  // Hàm mới để reset trạng thái nhập Excel
  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0'; 
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    this.processedRowsForSave = 0;
    
    if (this.tableExcel) {
      this.tableExcel.replaceData([]); // Xóa dữ liệu trong Tabulator preview
    }
    console.log('Trạng thái nhập Excel đã được reset.'); // Log
  }

  closeExcelModal() {
    const modalEl = document.getElementById('ExcelModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
    this.resetExcelImportState(); // Gọi hàm reset khi đóng modal
  }
}

import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';

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
import { EmployeeService } from '../employee-service/employee.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { PositionServiceService } from '../../positions/position-service/position-service.service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-employee-import-excel',
  templateUrl: './employee-import-excel.component.html',
  styleUrls: ['./employee-import-excel.component.css'],
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
  ]
})
export class EmployeeImportExcelComponent implements OnInit, AfterViewInit{

  @Input() dataTable: any[] = [];
  @Input() table: any;

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[]=[];

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh

  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB

  listDepartments: any[] = [];
  listContractPositions: any[] = [];
  listInternalPositions: any[] = [];
  listMaritalStatus: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private positionService : PositionServiceService
  ) { }

  ngOnInit() {
    this.loadData();
    // Test mapping functions after data is loaded
    setTimeout(() => {
      this.testMappingFunctions();
    }, 2000);
  }

  ngAfterViewInit(): void {
    this.drawtable();
  }

  drawtable(){
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
          STT: { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center', width: 50 },
        Code: { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        IDChamCongMoi: { title: 'ID Chấm công', field: 'IDChamCongMoi', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        FullName: { title: 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        DepartmentName: { title: 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        ChucVuHD: { title: 'Chức vụ (HĐLĐ)', field: 'ChucVuHD', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        ChucVu: { title: 'Chức vụ (Nội bộ)', field: 'ChucVu', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        DvBHXH: { title: 'Đơn vị BHXH', field: 'DvBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DateStartContract: { title: 'Ngày bắt đầu làm việc', field: 'DateStartContract', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        BirthOfDate: { title: 'Ngày sinh', field: 'BirthOfDate', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        NoiSinh: { title: 'Nơi sinh', field: 'NoiSinh', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        GioiTinh: { title: 'Giới tính', field: 'GioiTinh', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
        DanToc: { title: 'Dân tộc', field: 'DanToc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TonGiao: { title: 'Tôn giáo', field: 'TonGiao', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        QuocTich: { title: 'Quốc tịch', field: 'QuocTich', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TinhTrangHonNhan: { title: 'Tình trạng hôn nhân', field: 'TinhTrangHonNhan', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        DiaDiemLamViec: { title: 'Địa điểm làm việc', field: 'DiaDiemLamViec', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        SDTCaNhan: { title: 'SĐT cá nhân', field: 'SDTCaNhan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        EmailCaNhan: { title: 'Email cá nhân', field: 'EmailCaNhan', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        SDTCongTy: { title: 'SĐT công ty', field: 'SDTCongTy', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        EmailCongTy: { title: 'Email công ty', field: 'EmailCongTy', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        CMTND: { title: 'CMND/CCCD', field: 'CMTND', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        NgayCap: { title: 'Ngày cấp', field: 'NgayCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        NoiCap: { title: 'Nơi cấp', field: 'NoiCap', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        DcThuongTru: { title: 'Địa chỉ thường trú', field: 'DcThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        TinhTPThuongTru: { title: 'Tỉnh/TP thường trú', field: 'TinhTPThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        QuanHuyenThuongTru: { title: 'Quận/Huyện thường trú', field: 'QuanHuyenThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        PhuongXaThuongTru: { title: 'Phường/Xã thường trú', field: 'PhuongXaThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        DuongThuongTru: { title: 'Đường thường trú', field: 'DuongThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        SoNhaThuongTru: { title: 'Số nhà thường trú', field: 'SoNhaThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DcTamTru: { title: 'Địa chỉ tạm trú', field: 'DcTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        TinhTPTamTru: { title: 'Tỉnh/TP tạm trú', field: 'TinhTPTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        QuanHuyenTamTru: { title: 'Quận/Huyện tạm trú', field: 'QuanHuyenTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        PhuongXaTamTru: { title: 'Phường/Xã tạm trú', field: 'PhuongXaTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        DuongTamTru: { title: 'Đường tạm trú', field: 'DuongTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        SoNhaTamTru: { title: 'Số nhà tạm trú', field: 'SoNhaTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        SoSoBHXH: { title: 'Số sổ BHXH', field: 'SoSoBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        NguoiGiuSoBHXH: { title: 'Người giữ sổ BHXH', field: 'NguoiGiuSoBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        NgayBatDauBHXH: { title: 'Ngày bắt đầu đóng BHXH', field: 'NgayBatDauBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        MucDongBHXHHienTai: { title: 'Mức đóng BHXH hiện tại', field: 'MucDongBHXHHienTai', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        GiamTruBanThan: { title: 'Giảm trừ bản thân', field: 'GiamTruBanThan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        SoNguoiPT: { title: 'Số người phụ thuộc', field: 'SoNguoiPT', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TongTien: { title: 'Tổng tiền giảm trừ', field: 'TongTien', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        MST: { title: 'MST cá nhân', field: 'MST', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        STKChuyenLuong: { title: 'STK chuyển lương', field: 'STKChuyenLuong', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        LuongThuViec: { title: 'Lương thử việc', field: 'LuongThuViec', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        LuongCoBan: { title: 'Lương cơ bản', field: 'LuongCoBan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        AnCa: { title: 'Phụ cấp ăn ca', field: 'AnCa', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        XangXe: { title: 'Phụ cấp xăng xe', field: 'XangXe', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DienThoai: { title: 'Phụ cấp điện thoại', field: 'DienThoai', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        NhaO: { title: 'Phụ cấp nhà ở', field: 'NhaO', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TrangPhuc: { title: 'Phụ cấp trang phục', field: 'TrangPhuc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        ChuyenCan: { title: 'Phụ cấp chuyên cần', field: 'ChuyenCan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        Khac: { title: 'Phụ cấp khác', field: 'Khac', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TongPhuCap: { title: 'Tổng phụ cấp', field: 'TongPhuCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TongLuong: { title: 'Tổng lương', field: 'TongLuong', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        TinhTrang: { title: 'Tình trạng', field: 'TinhTrang', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        SYLL: { title: 'SYLL', field: 'SYLL', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        GiayKS: { title: 'Giấy KS', field: 'GiayKS', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        CMNDorCCCD: { title: 'CMND/CCCD (Checklist)', field: 'CMNDorCCCD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        SoHK: { title: 'Sổ HK', field: 'SoHK', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        GiayKSK: { title: 'Giấy KSK', field: 'GiayKSK', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        XNNS: { title: 'XNNS', field: 'XNNS', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        BangCap: { title: 'Bằng cấp', field: 'BangCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        CV: { title: 'CV', field: 'CV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DXV: { title: 'ĐXV', field: 'DXV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        CamKetTs: { title: 'Cam kết tài sản', field: 'CamKetTs', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        ToTrinhTD: { title: 'Tờ trình tuyển dụng', field: 'ToTrinhTD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        ThuMoiNhanViec: { title: 'Thư mời nhận việc', field: 'ThuMoiNhanViec', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        QDTD: { title: 'Quyết định tuyển dụng', field: 'QDTD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        HDTV: { title: 'Hợp đồng thử việc', field: 'HDTV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DGTV: { title: 'Đánh giá thử việc', field: 'DGTV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        HDLDXDTH: { title: 'HDLD KXDTH(12T-36T)', field: 'HDLDXDTH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        DGChuyenHD: { title: 'Đánh giá chuyển hợp đồng', field: 'DGChuyenHD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        HDLDKXDTH: { title: 'HDLDKXDTH', field: 'HDLDKXDTH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      }
      });   
    }
  }

  formatProgressText = (percent: number): string => {
    return this.displayText;
  }

  importFromExcel(): void {
    if (this.table) {
      this.table.import("xlsx", [".xlsx", ".csv", ".ods"], "buffer");
    } else {
      this.notification.warning('Thông báo', 'Bảng chưa được khởi tạo!');
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

      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning('Thông báo', 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = '';
        this.resetExcelImportState();
        return;
      }

      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.processedRowsForSave = 0;
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';

      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            await this.readExcelData(workbook, this.selectedSheet);
          } else {
            this.notification.warning('Thông báo', 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (error) {
          this.notification.error('Thông báo', 'Không thể đọc tệp Excel.');
          this.resetExcelImportState();
        }
        input.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      this.notification.error('Thông báo', `Sheet "${sheetName}" không tồn tại!`);
      return;
    }

    // Đọc header từ hàng đầu tiên
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });

    const columns = [
      { title: headers[0] || 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 50 },
      { title: headers[1] || 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[2] || 'ID Chấm công', field: 'IDChamCongMoi', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[3] || 'Họ và tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[4] || 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[5] || 'Chức vụ (HĐLĐ)', field: 'ChucVuHD', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[6] || 'Chức vụ (Nội bộ)', field: 'ChucVu', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[7] || 'Đơn vị BHXH', field: 'DvBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[8] || 'Ngày bắt đầu làm việc', field: 'DateStartContract', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[9] || 'Ngày sinh', field: 'BirthOfDate', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[10] || 'Nơi sinh', field: 'NoiSinh', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[11] || 'Giới tính', field: 'GioiTinh', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
      { title: headers[12] || 'Dân tộc', field: 'DanToc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[13] || 'Tôn giáo', field: 'TonGiao', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[14] || 'Quốc tịch', field: 'QuocTich', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[15] || 'Tình trạng hôn nhân', field: 'TinhTrangHonNhan', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[16] || 'Địa điểm làm việc', field: 'DiaDiemLamViec', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[17] || 'SĐT cá nhân', field: 'SDTCaNhan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[18] || 'Email cá nhân', field: 'EmailCaNhan', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[19] || 'SĐT công ty', field: 'SDTCongTy', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[20] || 'Email công ty', field: 'EmailCongTy', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[21] || 'CMND/CCCD', field: 'CMTND', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[22] || 'Ngày cấp', field: 'NgayCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[23] || 'Nơi cấp', field: 'NoiCap', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[24] || 'Địa chỉ thường trú', field: 'DcThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[25] || 'Tỉnh/TP thường trú', field: 'TinhTPThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[26] || 'Quận/Huyện thường trú', field: 'QuanHuyenThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[27] || 'Phường/Xã thường trú', field: 'PhuongXaThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[28] || 'Đường thường trú', field: 'DuongThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[29] || 'Số nhà thường trú', field: 'SoNhaThuongTru', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[30] || 'Địa chỉ tạm trú', field: 'DcTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: headers[31] || 'Tỉnh/TP tạm trú', field: 'TinhTPTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[32] || 'Quận/Huyện tạm trú', field: 'QuanHuyenTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[33] || 'Phường/Xã tạm trú', field: 'PhuongXaTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[34] || 'Đường tạm trú', field: 'DuongTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[35] || 'Số nhà tạm trú', field: 'SoNhaTamTru', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[36] || 'Số sổ BHXH', field: 'SoSoBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[37] || 'Người giữ sổ BHXH', field: 'NguoiGiuSoBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[38] || 'Ngày bắt đầu đóng BHXH', field: 'NgayBatDauBHXH', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[39] || 'Mức đóng BHXH hiện tại', field: 'MucDongBHXHHienTai', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: headers[40] || 'Giảm trừ bản thân', field: 'GiamTruBanThan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[41] || 'Số người phụ thuộc', field: 'SoNguoiPT', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[42] || 'Tổng tiền giảm trừ', field: 'TongTien', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[43] || 'MST cá nhân', field: 'MST', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[44] || 'STK chuyển lương', field: 'STKChuyenLuong', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[45] || 'Lương thử việc', field: 'LuongThuViec', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[46] || 'Lương cơ bản', field: 'LuongCoBan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[47] || 'Phụ cấp ăn ca', field: 'AnCa', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[48] || 'Phụ cấp xăng xe', field: 'XangXe', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[49] || 'Phụ cấp điện thoại', field: 'DienThoai', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[50] || 'Phụ cấp nhà ở', field: 'NhaO', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[51] || 'Phụ cấp trang phục', field: 'TrangPhuc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[52] || 'Phụ cấp chuyên cần', field: 'ChuyenCan', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[53] || 'Phụ cấp khác', field: 'Khac', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[54] || 'Tổng phụ cấp', field: 'TongPhuCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[55] || 'Tổng lương', field: 'TongLuong', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[56] || 'Tình trạng', field: 'TinhTrang', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[57] || 'SYLL', field: 'SYLL', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[58] || 'Giấy KS', field: 'GiayKS', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[59] || 'CMND/CCCD (Checklist)', field: 'CMNDorCCCD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[60] || 'Sổ HK', field: 'SoHK', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[61] || 'Giấy KSK', field: 'GiayKSK', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[62] || 'XNNS', field: 'XNNS', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[63] || 'Bằng cấp', field: 'BangCap', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[64] || 'CV', field: 'CV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[65] || 'ĐXV', field: 'DXV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[66] || 'Cam kết tài sản', field: 'CamKetTs', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[67] || 'Tờ trình tuyển dụng', field: 'ToTrinhTD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[68] || 'Thư mời nhận việc', field: 'ThuMoiNhanViec', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[69] || 'Quyết định tuyển dụng', field: 'QDTD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[70] || 'Hợp đồng thử việc', field: 'HDTV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[71] || 'Đánh giá thử việc', field: 'DGTV', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[72] || 'HDLD KXDTH(12T-36T)', field: 'HDLDXDTH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[73] || 'Đánh giá chuyển hợp đồng', field: 'DGChuyenHD', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: headers[74] || 'HDLDKXDTH', field: 'HDLDKXDTH', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
    ];

    if (this.tableExcel) {
        this.tableExcel.setColumns(columns);
    }

    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const data: any[] = []; // Dữ liệu cho bảng preview
    let validRecords = 0; // Số lượng bản ghi hợp lệ
    let foundFirstDataRow = false; // Biến flag để xác định hàng dữ liệu hợp lệ đầu tiên

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const firstCell = row.getCell(1).value;
            const secondCell = row.getCell(2).value;
            const thirdCell = row.getCell(3).value;

            // Kiểm tra nếu cell(1) là số
            const isFirstCellNumber = typeof firstCell === 'number' && !isNaN(firstCell);

            // Kiểm tra nếu hàng không rỗng hoàn toàn
            // Đồng thời đảm bảo secondCell và thirdCell không được rỗng
            const isEmptyRow = !firstCell || (!secondCell || !thirdCell);

            if (!isEmptyRow) {
              const rowData: any = {
                STT: this.formatCellValue(row.getCell(1).value), // Cột A: Số thứ tự
                Code: this.formatCellValue(row.getCell(2).value), // Cột B: Mã nhân viên
                IDChamCongMoi: this.formatCellValue(row.getCell(3).value), // Cột C: ID Chấm công
                FullName: this.formatCellValue(row.getCell(4).value), // Cột D: Họ và tên
                DepartmentName: this.formatCellValue(row.getCell(5).value), // Cột E: Phòng ban
                ChucVuHD: this.formatCellValue(row.getCell(6).value), // Cột F: Chức vụ (HĐLĐ)
                ChucVu: this.formatCellValue(row.getCell(7).value), // Cột G: Chức vụ (Nội bộ)
                DvBHXH: this.formatCellValue(row.getCell(8).value), // Cột H: Đơn vị BHXH
                DateStartContract: this.formatCellValue(row.getCell(9).value), // Cột I: Ngày bắt đầu làm việc
                BirthOfDate: this.formatCellValue(row.getCell(10).value), // Cột J: Ngày sinh
                NoiSinh: this.formatCellValue(row.getCell(11).value), // Cột K: Nơi sinh
                GioiTinh: this.formatCellValue(row.getCell(12).value), // Cột L: Giới tính
                DanToc: this.formatCellValue(row.getCell(13).value), // Cột M: Dân tộc
                TonGiao: this.formatCellValue(row.getCell(14).value), // Cột N: Tôn giáo
                QuocTich: this.formatCellValue(row.getCell(15).value), // Cột O: Quốc tịch
                TinhTrangHonNhan: this.formatCellValue(row.getCell(16).value), // Cột P: Tình trạng hôn nhân
                DiaDiemLamViec: this.formatCellValue(row.getCell(17).value), // Cột Q: Địa điểm làm việc
                SDTCaNhan: this.formatCellValue(row.getCell(18).value), // Cột R: SĐT cá nhân
                EmailCaNhan: this.formatCellValue(row.getCell(19).value), // Cột S: Email cá nhân
                SDTCongTy: this.formatCellValue(row.getCell(20).value), // Cột T: SĐT công ty
                EmailCongTy: this.formatCellValue(row.getCell(21).value), // Cột U: Email công ty
                CMTND: this.formatCellValue(row.getCell(22).value), // Cột V: CMND/CCCD
                NgayCap: this.formatCellValue(row.getCell(23).value), // Cột W: Ngày cấp
                NoiCap: this.formatCellValue(row.getCell(24).value), // Cột X: Nơi cấp
                DcThuongTru: this.formatCellValue(row.getCell(25).value), // Cột Y: Địa chỉ thường trú
                TinhTPThuongTru: this.formatCellValue(row.getCell(26).value), // Cột Z: Tỉnh/TP thường trú
                QuanHuyenThuongTru: this.formatCellValue(row.getCell(27).value), // Cột AA: Quận/Huyện thường trú
                PhuongXaThuongTru: this.formatCellValue(row.getCell(28).value), // Cột AB: Phường/Xã thường trú
                DuongThuongTru: this.formatCellValue(row.getCell(29).value), // Cột AC: Đường thường trú
                SoNhaThuongTru: this.formatCellValue(row.getCell(30).value), // Cột AD: Số nhà thường trú
                DcTamTru: this.formatCellValue(row.getCell(31).value), // Cột AE: Địa chỉ tạm trú
                TinhTPTamTru: this.formatCellValue(row.getCell(32).value), // Cột AF: Tỉnh/TP tạm trú
                QuanHuyenTamTru: this.formatCellValue(row.getCell(33).value), // Cột AG: Quận/Huyện tạm trú
                PhuongXaTamTru: this.formatCellValue(row.getCell(34).value), // Cột AH: Phường/Xã tạm trú
                DuongTamTru: this.formatCellValue(row.getCell(35).value), // Cột AI: Đường tạm trú
                SoNhaTamTru: this.formatCellValue(row.getCell(36).value), // Cột AJ: Số nhà tạm trú
                SoSoBHXH: this.formatCellValue(row.getCell(37).value), // Cột AK: Số sổ BHXH
                NguoiGiuSoBHXH: this.formatCellValue(row.getCell(38).value), // Cột AL: Người giữ sổ BHXH
                NgayBatDauBHXH: this.formatCellValue(row.getCell(39).value), // Cột AM: Ngày bắt đầu đóng BHXH
                MucDongBHXHHienTai: this.formatCellValue(row.getCell(40).value), // Cột AN: Mức đóng BHXH hiện tại
                GiamTruBanThan: this.formatCellValue(row.getCell(41).value), // Cột AO: Giảm trừ bản thân
                SoNguoiPT: this.formatCellValue(row.getCell(42).value), // Cột AP: Số người phụ thuộc
                TongTien: this.formatCellValue(row.getCell(43).value), // Cột AQ: Tổng tiền giảm trừ
                MST: this.formatCellValue(row.getCell(44).value), // Cột AR: MST cá nhân
                STKChuyenLuong: this.formatCellValue(row.getCell(45).value), // Cột AS: STK chuyển lương
                LuongThuViec: this.formatCellValue(row.getCell(46).value), // Cột AT: Lương thử việc
                LuongCoBan: this.formatCellValue(row.getCell(47).value), // Cột AU: Lương cơ bản
                AnCa: this.formatCellValue(row.getCell(48).value), // Cột AV: Phụ cấp ăn ca
                XangXe: this.formatCellValue(row.getCell(49).value), // Cột AW: Phụ cấp xăng xe
                DienThoai: this.formatCellValue(row.getCell(50).value), // Cột AX: Phụ cấp điện thoại
                NhaO: this.formatCellValue(row.getCell(51).value), // Cột AY: Phụ cấp nhà ở
                TrangPhuc: this.formatCellValue(row.getCell(52).value), // Cột AZ: Phụ cấp trang phục
                ChuyenCan: this.formatCellValue(row.getCell(53).value), // Cột BA: Phụ cấp chuyên cần
                Khac: this.formatCellValue(row.getCell(54).value), // Cột BB: Phụ cấp khác
                TongPhuCap: this.formatCellValue(row.getCell(55).value), // Cột BC: Tổng phụ cấp
                TongLuong: this.formatCellValue(row.getCell(56).value), // Cột BD: Tổng lương
                TinhTrang: this.formatCellValue(row.getCell(57).value), // Cột BE: Tình trạng
                SYLL: this.formatCellValue(row.getCell(58).value), // Cột BF: SYLL
                GiayKS: this.formatCellValue(row.getCell(59).value), // Cột BG: Giấy KS
                CMNDorCCCD: this.formatCellValue(row.getCell(60).value), // Cột BH: CMND/CCCD (Checklist)
                SoHK: this.formatCellValue(row.getCell(61).value), // Cột BI: Sổ HK
                GiayKSK: this.formatCellValue(row.getCell(62).value), // Cột BJ: Giấy KSK
                XNNS: this.formatCellValue(row.getCell(63).value), // Cột BK: XNNS
                BangCap: this.formatCellValue(row.getCell(64).value), // Cột BL: Bằng cấp
                CV: this.formatCellValue(row.getCell(65).value), // Cột BM: CV
                DXV: this.formatCellValue(row.getCell(66).value), // Cột BN: ĐXV
                CamKetTs: this.formatCellValue(row.getCell(67).value), // Cột BO: Cam kết tài sản
                ToTrinhTD: this.formatCellValue(row.getCell(68).value), // Cột BP: Tờ trình tuyển dụng
                ThuMoiNhanViec: this.formatCellValue(row.getCell(69).value), // Cột BQ: Thư mời nhận việc
                QDTD: this.formatCellValue(row.getCell(70).value), // Cột BR: Quyết định tuyển dụng
                HDTV: this.formatCellValue(row.getCell(71).value), // Cột BS: Hợp đồng thử việc
                DGTV: this.formatCellValue(row.getCell(72).value), // Cột BT: Đánh giá thử việc
                HDLDXDTH: this.formatCellValue(row.getCell(73).value), // Cột BU: HDLD KXDTH(12T-36T)
                DGChuyenHD: this.formatCellValue(row.getCell(74).value), // Cột BV: Đánh giá chuyển hợp đồng
                HDLDKXDTH: this.formatCellValue(row.getCell(75).value), // Cột BW: HDLDKXDTH
              };
              data.push(rowData);
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

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = validRecords;
    this.displayProgress = 0;
    this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;

    // Cập nhật Tabulator preview
    if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
    } else {
        this.drawtable();
    }
}
// Hàm hỗ trợ để chuẩn hóa giá trị ô
private formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    // Định dạng ngày tháng theo yêu cầu, ví dụ: DD/MM/YYYY
    return `${value.getDate().toString().padStart(2, '0')}/${(value.getMonth() + 1).toString().padStart(2, '0')}/${value.getFullYear()}`;
  }
  return value.toString().trim();
}

  onSheetChange() {
    // Đọc lại file và gọi readExcelData với sheet mới
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
        } catch (error) {
          this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
          this.resetExcelImportState();
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  saveExcelData() {
    // Kiểm tra dữ liệu Excel có tồn tại không
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }
  
    // Lọc dữ liệu để chỉ lấy các dòng có STT là số
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(parseFloat(stt)) && isFinite(parseFloat(stt)));
    });
  
  
    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    }
  
    // Reset tiến trình
    this.processedRowsForSave = 0;
    const totalEmployeesToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalEmployeesToSave} bản ghi`;
    this.displayProgress = 0;
  
    // Lấy danh sách mã nhân viên để kiểm tra
    const codesToCheck = validDataToSave.map(item => ({
      Code: item.Code?.trim() || ''
    }));
  
  
    // Gọi API kiểm tra mã nhân viên
    this.employeeService.checkEmployeeCodes(codesToCheck).subscribe({
      next: (response: any) => {
        const existingEmployees = (response.data && Array.isArray(response.data.existingEmployees)) ? response.data.existingEmployees : [];
  
        // Chuẩn bị dữ liệu nhân viên và hợp đồng
        const mappingErrors: string[] = [];
        const processedData = validDataToSave.map(row => {
          const code = row.Code?.trim() || '';
          const existingEmployee = existingEmployees.find((e: any) => e.Code === code);
  
          // Kiểm tra và cảnh báo nếu không tìm thấy mapping
          const departmentID = this.getDepartmentIDByName(row.DepartmentName?.trim() || '');
          const chucVuHDID = this.getChucVuHDIDByName(row.ChucVuHD?.trim() || '');
          const chuVuID = this.getChucVuIDByName(row.ChucVu?.trim() || '');
          const tinhTrangHonNhanID = this.getTinhTrangHonNhanIDByName(row.TinhTrangHonNhan?.trim() || '');
  
          if (departmentID === 0 && row.DepartmentName?.trim()) {
            const errorMsg = `Nhân viên ${row.Code}: Không tìm thấy phòng ban "${row.DepartmentName.trim()}"`;
            mappingErrors.push(errorMsg);
          }
          if (chucVuHDID === 0 && row.ChucVuHD?.trim()) {
            const errorMsg = `Nhân viên ${row.Code}: Không tìm thấy chức vụ HĐLĐ "${row.ChucVuHD.trim()}"`;
            mappingErrors.push(errorMsg);
          }
          if (chuVuID === 0 && row.ChucVu?.trim()) {
            const errorMsg = `Nhân viên ${row.Code}: Không tìm thấy chức vụ nội bộ "${row.ChucVu.trim()}"`;
            mappingErrors.push(errorMsg);
          }
          if (tinhTrangHonNhanID === 0 && row.TinhTrangHonNhan?.trim()) {
            const errorMsg = `Nhân viên ${row.Code}: Không tìm thấy tình trạng hôn nhân "${row.TinhTrangHonNhan.trim()}"`;
            mappingErrors.push(errorMsg);
          }
  
          // Chuẩn bị dữ liệu nhân viên
          const employeeData: any = {
            ID: existingEmployee ? existingEmployee.ID : 0,
            UserID: 0,
            STT: row.STT || 0,
            Code: row.Code?.trim() || '',
            IDChamCongMoi: row.IDChamCongMoi?.trim() || '',
            FullName: row.FullName?.trim() || '',
            AnhCBNV: row.AnhCBNV?.trim() || '',
            ChucVuHDID: chucVuHDID,
            DepartmentID: departmentID,
            ChuVuID: chuVuID,
            DvBHXH: row.DvBHXH?.trim() || '',
            DiaDiemLamViec: row.DiaDiemLamViec?.trim() || '',
            StartWorking: this.parseDate(row.DateStartContractTV),
            RoleID: 2,
            BirthOfDate: this.parseDate(row.BirthOfDate),
            NoiSinh: row.NoiSinh?.trim() || '',
            GioiTinh: this.parseGender(row.GioiTinh?.trim() || ''),
            DanToc: row.DanToc?.trim() || '',
            TonGiao: row.TonGiao?.trim() || '',
            QuocTich: row.QuocTich?.trim() || '',
            TinhTrangHonNhanID: tinhTrangHonNhanID,
            CMTND: row.CMTND?.trim() || '',
            NgayCap: this.parseDate(row.NgayCap),
            NoiCap: row.NoiCap?.trim() || '',
            TinhDcThuongTru: row.TinhDcThuongTru?.trim() || '',
            QuanDcThuongTru: row.QuanDcThuongTru?.trim() || '',
            PhuongDcThuongTru: row.PhuongDcThuongTru?.trim() || '',
            DuongDcThuongTru: row.DuongDcThuongTru?.trim() || '',
            SoNhaDcThuongTru: row.SoNhaDcThuongTru?.trim() || '',
            DcThuongTru: row.DcThuongTru?.trim() || '',
            TinhDcTamTru: row.TinhDcTamTru?.trim() || '',
            QuanDcTamTru: row.QuanDcTamTru?.trim() || '',
            PhuongDcTamTru: row.PhuongDcTamTru?.trim() || '',
            DuongDcTamTru: row.DuongDcTamTru?.trim() || '',
            SoNhaDcTamTru: row.SoNhaDcTamTru?.trim() || '',
            DcTamTru: row.DcTamTru?.trim() || '',
            SDTCaNhan: row.SDTCaNhan?.trim() || '',
            EmailCaNhan: row.EmailCaNhan?.trim() || '',
            SDTCongTy: row.SDTCongTy?.trim() || '',
            EmailCongTy: row.EmailCongTy?.trim() || '',
            NguoiLienHeKhiCan: row.NguoiLienHeKhiCan?.trim() || '',
            MoiQuanHe: row.MoiQuanHe?.trim() || '',
            SDTNguoiThan: row.SDTNguoiThan?.trim() || '',
            SchoolName: row.SchoolName?.trim() || '',
            RankType: row.RankType?.trim() || '',
            TrainType: row.TrainType?.trim() || '',
            Major: row.Major?.trim() || '',
            YearGraduate: row.YearGraduate?.trim() || '',
            Classification: row.Classification?.trim() || '',
            LoaiHDLD: row.LoaiHDLD?.trim() || '',
            TinhTrangKyHD: row.TinhTrangKyHD?.trim() || '',
            DateStartContractTV: row.DateStartContractTV?.trim() || '',
            DateEndContractTV: row.DateEndContractTV?.trim() || '',
            ContractNumberTV: row.ContractNumberTV?.trim() || '',
            DateStartContractOneYear: row.DateStartContractOneYear?.trim() || '',
            DateEndContractOneYear: row.DateEndContractOneYear?.trim() || '',
            ContractNumberOneYear: row.ContractNumberOneYear?.trim() || '',
            DateStartContractThreeYear: row.DateStartContractThreeYear?.trim() || '',
            DateEndContractThreeYear: row.DateEndContractThreeYear?.trim() || '',
            ContractNumberThreeYear: row.ContractNumberThreeYear?.trim() || '',
            DateStartContract: row.DateStartContract?.trim() || '',
            ContractNumber: row.ContractNumber?.trim() || '',
            SoSoBHXH: row.SoSoBHXH?.trim() || '',
            NguoiGiuSoBHXHText: row.NguoiGiuSoBHXHText?.trim() || '',
            NgayBatDauBHXHCty: this.parseDate(row.NgayBatDauBHXHCty),
            NgayBatDauBHXH: this.parseDate(row.NgayBatDauBHXH),
            NgayKetThucBHXH: this.parseDate(row.NgayKetThucBHXH),
            MucDongBHXHHienTai: this.parseDecimal(row.MucDongBHXHHienTai) ?? 0,
            LuongThuViec: this.parseDecimal(row.LuongThuViec) ?? 0,
            LuongCoBan: this.parseDecimal(row.LuongCoBan) ?? 0,
            AnCa: this.parseDecimal(row.AnCa) ?? 0,
            XangXe: this.parseDecimal(row.XangXe) ?? 0,
            DienThoai: this.parseDecimal(row.DienThoai) ?? 0,
            NhaO: this.parseDecimal(row.NhaO) ?? 0,
            TrangPhuc: this.parseDecimal(row.TrangPhuc) ?? 0,
            ChuyenCan: this.parseDecimal(row.ChuyenCan) ?? 0,
            Khac: this.parseDecimal(row.Khac) ?? 0,
            TongPhuCap: this.parseDecimal(row.TongPhuCap) ?? 0,
            TongLuong: this.parseDecimal(row.TongLuong) ?? 0,
            GiamTruBanThan: this.parseDecimal(row.GiamTruBanThan) ?? 0,
            SoNguoiPT: this.parseInt(row.SoNguoiPT) ?? 0,
            TongTien: this.parseInt(row.TongTien) ?? 0,
            MST: row.MST?.trim() || '',
            STKChuyenLuong: row.STKChuyenLuong?.trim() || '',
            SYLL: this.parseBoolean(row.SYLL?.trim()),
            GiayKS: this.parseBoolean(row.GiayKS?.trim()),
            CMNDorCCCD: this.parseBoolean(row.CMNDorCCCD?.trim()),
            SoHK: this.parseBoolean(row.SoHK?.trim()),
            GiayKSK: this.parseBoolean(row.GiayKSK?.trim()),
            XNNS: this.parseBoolean(row.XNNS?.trim(), 'cheked'),
            BangCap: this.parseBoolean(row.BangCap?.trim()),
            CV: this.parseBoolean(row.CV?.trim()),
            DXV: this.parseBoolean(row.DXV?.trim()),
            CamKetTs: this.parseBoolean(row.CamKetTs?.trim()),
            ToTrinhTD: this.parseBoolean(row.ToTrinhTD?.trim()),
            ThuMoiNhanViec: this.parseBoolean(row.ThuMoiNhanViec?.trim()),
            QDTD: this.parseBoolean(row.QDTD?.trim()),
            HDTV: this.parseBoolean(row.HDTV?.trim()),
            DGTV: this.parseBoolean(row.DGTV?.trim()),
            HDLDXDTHYear: this.parseBoolean(row.HDLDXDTHYear?.trim()),
            DGChuyenHDYear: this.parseBoolean(row.DGChuyenHDYear?.trim()),
            HDLDXDTH: this.parseBoolean(row.HDLDXDTH?.trim()),
            DGChuyenHD: this.parseBoolean(row.DGChuyenHD?.trim()),
            TinhTrangCapDongPhuc: this.parseBoolean(row.TinhTrangCapDongPhuc?.trim()),
            CreatedBy: 'admin',
            CreatedDate: new Date(),
            UpdatedBy: 'admin',
            UpdatedDate: new Date(),
            Status: 0,
            ReasonDeleted: row.ReasonDeleted?.trim() || '',
            EndWorking: this.parseDate(row.EndWorking)
          };
  
          return { employeeData };
        });
  
        
        // Debug logging cho các ID được map
        processedData.forEach((item, index) => {
          console.log(`Row ${index + 1} mapped IDs:`, {
            DepartmentID: item.employeeData.DepartmentID,
            ChucVuHDID: item.employeeData.ChucVuHDID,
            ChuVuID: item.employeeData.ChuVuID,
            TinhTrangHonNhanID: item.employeeData.TinhTrangHonNhanID
          });
        });

        // Hiển thị cảnh báo về lỗi mapping nếu có
        if (mappingErrors.length > 0) {
          const errorMessage = `Có ${mappingErrors.length} lỗi mapping:\n${mappingErrors.slice(0, 5).join('\n')}${mappingErrors.length > 5 ? '\n...' : ''}`;
          this.notification.warning('Cảnh báo', errorMessage);
        }
  
        let successCount = 0;
        let errorCount = 0;
        let completedRequests = 0;
  
        if (processedData.length === 0) {
          this.notification.info('Thông báo', 'Không có nhân viên hợp lệ để lưu.');
          this.closeExcelModal();
          return;
        }
  
        // Hàm lưu từng nhân viên với độ trễ
        const saveEmployeeWithDelay = (index: number) => {
          if (index >= processedData.length) {
            this.showSaveSummary(successCount, errorCount, totalEmployeesToSave);
            return;
          }

          const { employeeData } = processedData[index];

          setTimeout(() => {
            this.employeeService.saveEmployee(employeeData).subscribe({
              next: (response:any) => {
                if (response.status === 1) {
                  successCount++;
                } else {
                  errorCount++;
                }

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalEmployeesToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalEmployeesToSave} bản ghi`;

                saveEmployeeWithDelay(index + 1);
              },
              error: (err: any) => {
                errorCount++;

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalEmployeesToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalEmployeesToSave} bản ghi`;

                saveEmployeeWithDelay(index + 1);
              }
            });
          }, 5); // Delay 0.005s
        };
  
        // Bắt đầu lưu từ nhân viên đầu tiên
        saveEmployeeWithDelay(0);
      },
      error: (err : any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi kiểm tra mã nhân viên từ database!');
        this.displayText = 'Lỗi kiểm tra nhân viên!';
        this.displayProgress = 0;
      }
    });
  }
  
  // Hàm hỗ trợ
  private parseDate(value: any): Date | null {
    if (!value) return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  
  private parseDecimal(value: any): number | null {
    if (!value) return null;
    const num = parseFloat(value.toString());
    return isNaN(num) ? null : num;
  }
  
  private parseInt(value: any): number | null {
    if (!value) return null;
    const num = parseInt(value.toString(), 10);
    return isNaN(num) ? null : num;
  }
  
  private parseGender(value: string): number {
    if (!value) return 2;
    const lowerValue = value.toLowerCase();
    return lowerValue.includes('nữ') ? 0 : lowerValue.includes('nam') ? 1 : 2;
  }
  
  private parseBoolean(value: string, keyword?: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return keyword ? !lowerValue.includes(keyword) : !!lowerValue;
  }
  
  private getChucVuHDIDByName(name: string): number {
    if (!name || !this.listContractPositions) return 0;
    
    const chucVu = this.listContractPositions.find((p: any) => p.Name === name);
    
    if (chucVu) {
      return chucVu.ID;
    }
    
    // Fallback: tìm kiếm không phân biệt hoa thường
    const chucVuIgnoreCase = this.listContractPositions.find((p: any) => 
      p.Name && p.Name.toLowerCase() === name.toLowerCase()
    );
    
    return chucVuIgnoreCase ? chucVuIgnoreCase.ID : 0;
  }

  private getChucVuIDByName(name: string): number {
    if (!name || !this.listInternalPositions) return 0;
    
    const chucVu = this.listInternalPositions.find((p: any) => p.Name === name);
    
    if (chucVu) {
      return chucVu.ID;
    }
    
    // Fallback: tìm kiếm không phân biệt hoa thường
    const chucVuIgnoreCase = this.listInternalPositions.find((p: any) => 
      p.Name && p.Name.toLowerCase() === name.toLowerCase()
    );
    
    return chucVuIgnoreCase ? chucVuIgnoreCase.ID : 0;
  }
  
  private getDepartmentIDByName(name: string): number {
    if (!name || !this.listDepartments) return 0;
    
    const department = this.listDepartments.find((d: any) => d.Name === name);
    
    if (department) {
      return department.ID;
    }
    
    // Fallback: tìm kiếm không phân biệt hoa thường
    const departmentIgnoreCase = this.listDepartments.find((d: any) => 
      d.Name && d.Name.toLowerCase() === name.toLowerCase()
    );
    
    return departmentIgnoreCase ? departmentIgnoreCase.ID : 0;
  }
  
  private getTinhTrangHonNhanIDByName(name: string): number {
    // Tạm thời hardcode mapping cho tình trạng hôn nhân
    // Vì chưa có API riêng cho tình trạng hôn nhân
    const lowerName = name.toLowerCase().trim();
    if (lowerName.includes('độc thân') || lowerName.includes('chưa kết hôn')) {
      return 1;
    } else if (lowerName.includes('đã kết hôn') || lowerName.includes('có gia đình')) {
      return 2;
    }
    return 0; // Mặc định
  }
  
  private getCurrentContractID(hdtv: string, hd12t: string, hd36t: string, hd: string): number {
    // Giả lập: xác định loại hợp đồng dựa trên chuỗi truyền vào
    if (hdtv) return 1;
    if (hd12t) return 2;
    if (hd36t) return 3;
    if (hd) return 4;
    return 0;
  }
  
  private getNguoiGiuSoBHXH(code: string): number {
    // Giả lập: trả về ID người giữ sổ BHXH
    if (!code) return 0;
    // Thực tế nên tìm trong danh sách nhân viên
    return 1;
  }

  private showSaveSummary(successCount: number, errorCount: number, totalEmployees: number) {

    if (errorCount === 0) {
      this.notification.success('Thông báo', `Đã lưu ${successCount} nhân viên thành công`);
    } else if (successCount === 0) {
      this.notification.error('Thông báo', `Lưu thất bại ${errorCount}/${totalEmployees} nhân viên`);
    } else {
      this.notification.warning('Thông báo', `Đã lưu ${successCount} nhân viên thành công, ${errorCount} nhân viên thất bại`);
    }
    this.closeExcelModal();
  }

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
      this.tableExcel.replaceData([]);
    }
  }

  closeExcelModal() {
    const modal = document.getElementById('importExcelForm');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

  private loadData() {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        // Kiểm tra cấu trúc dữ liệu trả về
       
        this.listDepartments = res.data || res || [];
       
      },
      error: (err: any) => {
       
      }
    });

    this.positionService.getPositionContract().subscribe({
      next: (res: any) => {
        // Kiểm tra cấu trúc dữ liệu trả về
        this.listContractPositions = res.data || res || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách chức vụ:', err);
      }
    });
    this.positionService.getPositionInternal().subscribe({
      next: (res: any) => {
        // Kiểm tra cấu trúc dữ liệu trả về
        this.listInternalPositions = res.data || res || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách chức vụ:', err);
      }
    });

    // Tạm thời hardcode danh sách tình trạng hôn nhân
    // TODO: Tạo service riêng cho tình trạng hôn nhân
    this.listMaritalStatus = [
      { ID: 1, Name: 'Độc thân' },
      { ID: 2, Name: 'Đã kết hôn' }
    ];

  }

  // Hàm test để kiểm tra các hàm mapping
  private testMappingFunctions() {
    // Test department mapping
    if (this.listDepartments && this.listDepartments.length > 0) {
      const testDeptName = this.listDepartments[0].Name;
      const deptID = this.getDepartmentIDByName(testDeptName);
     
    }
    
    // Test contract position mapping
    if (this.listContractPositions && this.listContractPositions.length > 0) {
      const testPosName = this.listContractPositions[0].Name;
      const posID = this.getChucVuHDIDByName(testPosName);
     
    }
    
    // Test internal position mapping
    if (this.listInternalPositions && this.listInternalPositions.length > 0) {
      const testPosName = this.listInternalPositions[0].Name;
      const posID = this.getChucVuIDByName(testPosName);
    }
    
    // Test marital status mapping
    const testMaritalStatuses = ['Độc thân', 'Đã kết hôn', 'Chưa kết hôn', 'Có gia đình'];
    testMaritalStatuses.forEach(status => {
      const statusID = this.getTinhTrangHonNhanIDByName(status);
    });
    
  }

}

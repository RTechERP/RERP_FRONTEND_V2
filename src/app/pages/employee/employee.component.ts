import { Component, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { RowComponent, TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EmployeeService } from './employee-service/employee.service';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckListModule } from 'ng-zorro-antd/check-list';
import { NzCheckboxOption } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { PositionServiceService } from '../positions/position-service/position-service.service';
import { PositionContractComponent } from '../positions/position-contract/position-contract.component';
import { PositionInternalComponent } from '../positions/position-internal/position-internal.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { EmployeeApproveComponent } from "./employee-approve/employee-approve.component";
import { EmployeeLoginManagerComponent } from './employee-login-manager/employee-login-manager.component';
import { EmployeeContractComponent } from './employee-contract/employee-contract.component';
import { EmployeeImportExcelComponent } from "./employee-import-excel/employee-import-excel.component";
import { EmployeeTeamComponent } from "./employee-team/employee-team.component";


@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzNotificationModule,
    NzCheckboxModule,
    NzSelectModule,
    NzUploadModule,
    NzCheckListModule,
    NzFormModule,
    CommonModule,
    PositionContractComponent,
    PositionInternalComponent,
    EmployeeApproveComponent,
    EmployeeContractComponent,
    EmployeeLoginManagerComponent,
    EmployeeImportExcelComponent,
    EmployeeTeamComponent
],
  providers: [
    NzModalService,
    NzNotificationService,
    NzConfigService
  ],
  standalone: true
})
export class EmployeeComponent implements OnInit {
  private tabulatorEmployee!: Tabulator;
  private tabulatorEducation: Tabulator | null = null;

  employees: any[] = [];
  departmentList: any[] = [];
  positionContractList: any[] = [];
  positionInternalList: any[] = [];
  educationCreate: any[] = [];
  sizeSearch: string = '0';
  isEditMode: boolean = false;
  employeeForm!: FormGroup;
  department: any = null;
  positionContract: any = null;
  positionInternal: any = null;
  avatarUrl: string = '';
  fileList: NzUploadFile[] = [];


  selectedEmployee: any = null;
  deleteForm!: FormGroup;
  searchForm!: FormGroup;
  endContractControl = new FormControl(false);

  constructor(
    private employeeService : EmployeeService,
    private departmentService: DepartmentServiceService,
    private positionService: PositionServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) { 
    // Subscribe to EndContract changes
    this.endContractControl.valueChanges.subscribe(checked => {
      if (checked) {
        // Filter employees with expiring contracts
        const filteredEmployees = this.employees.filter(emp => emp.IsExpireContract === 0.5);
        this.tabulatorEmployee.setData(filteredEmployees);
      } else {
        // Reset to normal search
        this.tabulatorEmployee.setData(this.employees);
      }
    });
  }

  private initSearchForm() {
    this.searchForm = this.fb.group({
      status: [0],
      department: [0],
      keyword: ['']
    });
  }


  private initForm() {
    this.employeeForm = this.fb.group({
      ID: [0],
      UserID: [0],
      // Thông tin cơ bản
      STT: [0],
      Code: ['', [Validators.required]],
      IDChamCongMoi: ['', [Validators.required]],
      FullName: ['', [Validators.required]],
      AnhCBNV: [''],
      ChucVuHDID: [null , [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      ChuVuID: [null, [Validators.required]],
      DvBHXH: ['', [Validators.required]],
      DiaDiemLamViec: ['', [Validators.required]],
      StartWorking:['', [Validators.required]],
      RoleID:[2],

      // Thông tin cá nhân
      BirthOfDate: ['',[Validators.required]],
      NoiSinh: ['',[Validators.required]],
      GioiTinh: [0, [Validators.required]],
      DanToc: ['', [Validators.required]],
      TonGiao: ['', [Validators.required]],
      QuocTich: ['', [Validators.required]],
      TinhTrangHonNhanID: [0, [Validators.required]],

      // CMND/CCCD
      CMTND: ['', [Validators.required]],
      NgayCap: [null, [Validators.required]],
      NoiCap: ['', [Validators.required]],

      // Địa chỉ thường trú
      TinhDcThuongTru: ['', [Validators.required]],
      QuanDcThuongTru: ['', [Validators.required]],
      PhuongDcThuongTru: ['', [Validators.required]],
      DuongDcThuongTru:[''],
      SoNhaDcThuongTru: [''],
      DcThuongTru: ['', [Validators.required]],

      // Địa chỉ tạm trú
      TinhDcTamTru: ['', [Validators.required]],
      QuanDcTamTru: ['', [Validators.required]],
      PhuongDcTamTru: ['', [Validators.required]],
      DuongDcTamTru:[''],
      SoNhaDcTamTru: [''],
      DcTamTru: ['', [Validators.required]],

      // Thông tin liên hệ
      SDTCaNhan: ['',[Validators.required]],
      EmailCaNhan: ['',[Validators.required]],
      SDTCongTy: [''],
      EmailCongTy: [''],
      NguoiLienHeKhiCan: ['',[Validators.required]],
      MoiQuanHe: ['',[Validators.required]],
      SDTNguoiThan: ['',[Validators.required]],

      // Trình độ
      SchoolName: [''],
      RankType: [''],
      TrainType: [''],
      Major: [''],
      YearGraduate: [''],
      Classification: [''],

      // Hợp đồng
      LoaiHDLD: [''],
      TinhTrangKyHD: [''],
      DateStartContractTV: [''],
      DateEndContractTV: [''],
      ContractNumberTV: [''],
      DateStartContractOneYear: [''],
      DateEndContractOneYear: [''],
      ContractNumberOneYear: [''],
      DateStartContractThreeYear: [''],
      DateEndContractThreeYear: [''],
      ContractNumberThreeYear: [''],
      DateStartContract: [''],
      ContractNumber: [''],

      // BHXH
      SoSoBHXH: [''],
      NguoiGiuSoBHXHText: [''],
      NgayBatDauBHXHCty: [''],
      // NgayBatDauBHXH: [null],
      // NgayKetThucBHXH: [''],
      MucDongBHXHHienTai: [0],

      // Lương và phụ cấp
      LuongThuViec: [0],
      LuongCoBan: [0],
      AnCa: [0],
      XangXe: [0],
      DienThoai: [0],
      NhaO: [0],
      TrangPhuc: [0],
      ChuyenCan: [0],
      Khac: [0],
      TongPhuCap: [0],
      TongLuong: [0],

      // Giảm trừ
      GiamTruBanThan: [0],
      SoNguoiPT: [0],
      TongTien: [0],

      // Thông tin khác
      MST: [''],
      STKChuyenLuong: [''],

      // Check list hồ sơ
      SYLL: [false],
      GiayKS: [false],
      CMNDorCCCD: [false],
      SoHK: [false],
      GiayKSK: [false],
      XNNS: [false],
      BangCap: [false],
      CV: [false],
      DXV: [false],
      CamKetTs: [false],
      ToTrinhTD: [false],
      ThuMoiNhanViec: [false],
      QDTD: [false],
      HDTV: [false],
      DGTV: [false],
      HDLDXDTHYear: [false],
      DGChuyenHDYear: [false],
      HDLDXDTH: [false],
      DGChuyenHD: [false],
      HDLDKXDTH: [false],

      ReasonDeleted: [''],
      EndWorking: [new Date()],
      Status: [0],
      allChecked: [false]
      
    });

    this.deleteForm = this.fb.group({
      EndWorking: [new Date()],
      ReasonDeleted: ['']
    });
  }


  ngOnInit() {
    this.initForm();
    this.initSearchForm();
    this.initializeTableEmployee();
    this.loadEmployees();
    this.loadDepartments();
    this.loadPositionContract();
    this.loadPositionInternal();

    
    this.employeeForm.get('allChecked')?.valueChanges.subscribe(checked => {
      const checklistControls = [
        'SYLL', 'GiayKS', 'CMNDorCCCD', 'SoHK', 'GiayKSK', 'XNNS', 
        'BangCap', 'CV', 'DXV', 'CamKetTs', 'ToTrinhTD', 'ThuMoiNhanViec',
        'QDTD', 'HDTV', 'DGTV', 'HDLDXDTHYear', 'DGChuyenHD', 'HDLDKXDTH'
      ];

      checklistControls.forEach(controlName => {
        this.employeeForm.get(controlName)?.setValue(checked, { emitEvent: false });
      });
    });

    // Subscribe to individual checkbox changes
    const checklistControls = [
      'SYLL', 'GiayKS', 'CMNDorCCCD', 'SoHK', 'GiayKSK', 'XNNS', 
      'BangCap', 'CV', 'DXV', 'CamKetTs', 'ToTrinhTD', 'ThuMoiNhanViec',
      'QDTD', 'HDTV', 'DGTV', 'HDLDXDTHYear', 'DGChuyenHD', 'HDLDKXDTH'
    ];

    checklistControls.forEach(controlName => {
      this.employeeForm.get(controlName)?.valueChanges.subscribe(() => {
        const allChecked = checklistControls.every(
          control => this.employeeForm.get(control)?.value === true
        );
        this.employeeForm.get('allChecked')?.setValue(allChecked, { emitEvent: false });
      });
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onTabChange(index: number) {
    if (index === 4) { // Index của tab Trình độ học vấn
      setTimeout(() => {
        this.initializeTableEducation();
      }, 100);
    }
  }

  //#region Hàm load dữ liệu từ API
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((data) => {
      this.employees = data.data || [];
      this.tabulatorEmployee.setData(this.employees);
    });
  }
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
        
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }
  loadPositionContract() {
    this.positionService.getPositionContract().subscribe({
      next: (data: any) => {
        this.positionContractList = data;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách chức vụ theo hợp đồng: ' + error.message);
      }
    });
  }
  loadPositionInternal() {
    this.positionService.getPositionInternal().subscribe({
      next: (data: any) => {
        this.positionInternalList = data;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách chức vụ theo nội bộ: ' + error.message);
      }
    });
  }
  //#endregion
  //#region Hàm khởi tạo bảng nhân viên
  private initializeTableEmployee(): void {
    setTimeout(() => {
      const element = document.getElementById('tb_employee');
      if (element) {
        this.tabulatorEmployee = new Tabulator('#tb_employee', {
      data: this.employees,
      height: "90vh",
      layout: "fitDataStretch",
      selectableRows: 1,
      groupBy:"DepartmentName",
      groupHeader: function(value, count, data, group){
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " thành viên)</span>";
      },
      columns: [
        {
          title: "",
          columns: [
            { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'ID Chấm công', field: 'IDChamCongMoi', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Họ tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "",
          columns: [
            { title: 'Ảnh CBNV', field: 'AnhCBNV', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Chức vụ (Theo HĐLĐ)', field: 'ChucVuHD', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Phòng / Bộ phận', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Chức vụ (Theo nội vụ)', field: 'ChucVu', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Nhóm', field: 'Department', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Đơn vị tham gia BHXH', field: 'DvBHXH', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Địa điểm làm việc', field: 'DiaDiemLamViec', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày sinh', field: 'BirthOfDate', hozAlign: 'left', headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Nơi sinh', field: 'NoiSinh', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Giới tính', field: 'GioiTinhText', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Dân tộc', field: 'DanToc', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Tôn giáo', field: 'TonGiao', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Quốc tịch', field: 'QuocTich', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Tình trạng hôn nhân', field: 'TinhTrangHonNhan', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "CMND/CCCD",
          columns: [
            { title: 'Số', field: 'CMTND', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày cấp', field: 'NgayCap', hozAlign: 'left', headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Nơi cấp', field: 'NoiCap', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "ĐỊA CHỈ",
          columns: [
            { title: 'Đ/c thường trú (Theo sổ HK)', field: 'DcThuongTru', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Đ/c tạm trú (Đ/c hiện tại sinh sống)', field: 'DcTamTru', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "THÔNG TIN LIÊN HỆ",
          columns: [
            { title: 'SĐT cá nhân', field: 'SDTCaNhan', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Email cá nhân', field: 'EmailCaNhan', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'SĐT công ty cấp', field: 'SDTCongTy', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Email công ty cấp', field: 'EmailCongTy', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Họ tên người thân liên hệ khi cần', field: 'NguoiLienHeKhiCan', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Mối quan hệ', field: 'MoiQuanHe', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'SĐT của người thân', field: 'SDTNguoiThan', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "TRÌNH ĐỘ",
          columns: [
            { title: 'Trường', field: 'SchoolName', editor: 'input', hozAlign: 'left', headerHozAlign: 'center'},
            { 
              title: 'Cấp bậc', 
              field: 'RankType', 
              editor: 'list' as any,
              hozAlign: 'left', 
              headerHozAlign: 'center', 
              formatter: (cell:any) => {
                const value = cell.getValue();
                if(value == 1) {
                  return 'Đại học';
                } else if(value == 2) {
                  return 'Cao đẳng';
                } else if(value == 3){
                  return 'Trung cấp';
                }
                return value;
              }
            },
            { 
              title: 'Loại hình đào tạo', 
              field: 'TrainType', 
              editor: 'list' as any,
              hozAlign: 'left', 
              headerHozAlign: 'center', 
              formatter: (cell:any) => {
                const value = cell.getValue();
                if(value == 1) {
                  return 'Đào tạo chính quy';
                } else if(value == 2) {
                  return 'Đào tạo nghề';
                } else if(value == 3){
                  return 'Đào tạo từ xa';
                } else if(value == 4) {
                  return 'Đào tạo liên kết quốc tế';
                } else if(value == 5) {
                  return 'Đào tạo thường xuyên';
                } else if(value == 6) {
                  return 'Đào tạo theo nhu cầu doanh nghiệp';
                }
                return value;
              }
            },
            { title: 'Chuyên ngành', field: 'Major', editor: 'input', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Năm tốt nghiệp', field: 'YearGraduate', editor: 'input', hozAlign: 'right', headerHozAlign: 'center' },
            { 
              title: 'Xếp loại', 
              field: 'Classification', 
              editor: 'list' as any,
              hozAlign: 'left', 
              headerHozAlign: 'center',
              formatter: (cell:any) => {
                const value = cell.getValue();
                if(value == 1) {
                  return 'Xuất sắc';
                } else if(value == 2) {
                  return 'Giỏi';
                } else if(value == 3){
                  return 'Khá';
                } else if(value == 4) {
                  return 'Trung bình';
                } else if(value == 5) {
                  return 'Yếu';
                }
                return value;
              }
            },
          ],
        },
        {
          title: "",
          columns: [
            { title: 'Loại hợp đồng hiện tại', field: 'LoaiHDLD', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Tình trạng kí hợp đồng', field: 'TinhTrangKyHD', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày vào', field: 'DateStartContractTV', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
          ],
        },
        {
          title: "NGÀY VÀO/ THỬ VIỆC",
          columns: [
            {
              title: 'Ngày bắt đầu', field: 'DateStartContractTV', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            {
              title: 'Ngày kết thúc', field: 'DateEndContractTV', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Số HĐ', field: 'ContractNumberTV', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "HĐLĐ XĐTH 12T",
          columns: [
            {
              title: 'Ngày hiệu lực', field: 'DateStartContractOneYear', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            {
              title: 'Ngày kết thúc', field: 'DateEndContractOneYear', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Số HĐ', field: 'ContractNumberOneYear', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "HĐLĐ XĐTH 36T",
          columns: [
            {
              title: 'Ngày hiệu lực', field: 'DateStartContractThreeYear', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            {
              title: 'Ngày kết thúc', field: 'DateEndContractThreeYear', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Số HĐ', field: 'ContractNumberThreeYear', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "HĐLĐ KXĐTH",
          columns: [
            {
              title: 'Ngày hiệu lực', field: 'DateStartContract', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Số HĐ', field: 'ContractNumber', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "",
          columns: [
            {
              title: 'Ngày nghỉ việc', field: 'STT', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return '';
              }
            },
          ],
        },
        {
          title: "BHXH",
          columns: [
            {
              title: "",
              columns: [
                { title: 'Số sổ', field: 'SoSoBHXH', hozAlign: 'left', headerHozAlign: 'center' },
                { title: 'Người giữ sổ', field: 'NguoiGiuSoBHXHText', hozAlign: 'left', headerHozAlign: 'center' },
                {
                  title: 'Ngày bắt đầu đóng tại công ty', field: 'NgayBatDauBHXHCty', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                    const value = cell.getValue();
                    return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                  }
                },
              ]
            },
            {
              title: "Hợp đồng lao động (dùng đóng BHXH)",
              columns: [
                {
                  title: 'Ngày bắt đầu', field: 'NgayBatDauBHXH', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                    const value = cell.getValue();
                    return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                  }
                },
                {
                  title: 'Ngày kết thúc', field: 'NgayKetThucBHXH', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                    const value = cell.getValue();
                    return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                  }
                },
              ]
            }
          ],
        },
        {
          title: "",
          columns: [
            { title: 'Mức đóng hiện tại', field: 'MucDongBHXHHienTai', hozAlign: 'left', headerHozAlign: 'center' },
          ],
        },
        {
          title: "LƯƠNG",
          columns: [
            {
              title: "",
              columns: [
                { title: 'Lương thử việc', field: 'LuongThuViec', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Lương CB', field: 'LuongCoBan', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
              ]
            },
            {
              title: "Phụ cấp",
              columns: [
                { title: 'Ăn ca', field: 'AnCa', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Xăng xe', field: 'XangXe', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Điện thoại', field: 'DienThoai', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Nhà ở', field: 'NhaO', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Trang phục', field: 'TrangPhuc', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Chuyên cần', field: 'ChuyenCan', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Khác', field: 'Khac', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
                { title: 'Tổng phụ cấp', field: 'TongPhuCap', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
              ]
            },
            {
              title: "",
              columns: [
                { title: 'Tổng lương', field: 'TongLuong', hozAlign: 'left', headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  },
                },
              ]
            }
          ]
        },
        {
          title: "",
          columns: [
            { title: 'Giảm trừ bản thân', field: 'GiamTruBanThan', hozAlign: 'left', headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              },
            },
          ]
        },
        {
          title: "GIẢM TRỪ GIA CẢNH",
          columns: [
            { title: 'Số người PT', field: 'SoNguoiPT', hozAlign: 'left', headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              },
            },
            { title: 'Tổng tiền', field: 'TongTien', hozAlign: 'left', headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                return 'đ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              },
            },
          ]
        },
        {
          title: "",
          columns: [
            { title: 'MST cá nhân', field: 'MST', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'STK chuyển lương', field: 'STKChuyenLuong', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "CHECK LIST HỒ SƠ",
          columns: [
            { title: 'SYLL', field: 'SYLL', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Giấy KS', field: 'GiayKS', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'CMND/CCCD', field: 'CMNDorCCCD', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Số HK', field: 'SoHK', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Giấy KSK', field: 'GiayKSK', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'XNNS', field: 'XNNS', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Bằng cấp (photo công chứng)', field: 'BangCap', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'CV', field: 'CV', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'ĐXV', field: 'DXV', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Cam kết TS (AD đ/v nữ)', field: 'CamKetTs', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Tờ trình TD', field: 'ToTrinhTD', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'Thư mời nhận việc', field: 'ThuMoiNhanViec', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'QĐTD', field: 'QDTD', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'HĐTV', field: 'HDTV', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'ĐG TV', field: 'DGTV', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'HĐLĐ XĐTH (12T)', field: 'HDLDXDTHYear', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'ĐG chuyển HĐ 12T', field: 'DGChuyenHDYear', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'HĐLĐ XĐTH (36T)', field: 'HDLDXDTH', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'ĐG chuyển HĐ 36T', field: 'DGChuyenHD', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },
            { title: 'HĐLĐ KXĐTH', field: 'HDLDKXDTH', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            },

          ]
        },
        {
          title: "",
          columns: [
            { title: 'Tình trạng cấp phát đồng phục', field: 'TinhTrangCapDongPhuc', hozAlign: 'center', headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: ''
              }
            }
          ]
        },
        {
          title: "BỔ NHIỆM",
          columns: [
            { title: 'Số QĐ', field: '', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày HL', field: '', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Lý do bổ nhiệm', field: '', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "MIỄN NHIỆM",
          columns: [
            { title: 'Số QĐ', field: '', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày HL', field: '', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Lý do miễn nhiệm', field: '', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "THUYÊN CHUYỂN",
          columns: [
            { title: 'Số QĐ', field: '', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày HL', field: '', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Lý do thuyên chuyển', field: '', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "NGHỈ VIỆC",
          columns: [
            { title: 'Số QĐ', field: '', hozAlign: 'left', headerHozAlign: 'center' },
            {
              title: 'Ngày HL', field: '', hozAlign: 'left', headerHozAlign: 'center', formatter: (cell) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }
            },
            { title: 'Lý do nghỉ', field: '', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        },
        {
          title: "",
          columns: [
            { title: 'Ghi chú', field: '', hozAlign: 'left', headerHozAlign: 'center' },
            { title: 'Lý do nghỉ', field: 'ReasonDeleted', hozAlign: 'left', headerHozAlign: 'center' },
          ]
        }
      ],
      rowFormatter:function(row){
        //row - row component
        
        var data = row.getData();
        
        if(data['Status'] == 1) {
          row.getElement().style.backgroundColor = 'wheat';
          row.getElement().style.color = 'black';
        }
        else 
        if(data['IsExpireContract'] == 1){
            row.getElement().style.backgroundColor = 'yellow';
            row.getElement().style.color = 'black';
        } else if(data['IsExpireContract'] == 0.5) {
          row.getElement().style.backgroundColor = 'red';
            row.getElement().style.color = 'white';
        }
    },
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
        });
      }
    });
  }
  //#endregion
  //#region Hàm khởi tạo bảng Trình độ học vấn của nhân viên
  private initializeTableEducation(): void {
    const element = document.getElementById('tb_education');
    if (element) {
      if (this.tabulatorEducation) {
        this.tabulatorEducation.destroy();
      }
      
      this.tabulatorEducation = new Tabulator('#tb_education', {
        data: this.educationCreate,
        layout: 'fitColumns',
        responsiveLayout: true,
        height: '100%',
        minHeight: 200,
        columns: [
          {
            title: ' + ',
            field: 'actions',
            formatter: 'buttonCross',
            headerSort: false,
            width: 40,
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerFormatter: function() {
              return "<i class='fas fa-plus' style='cursor:pointer;font-size:1.2rem;color:blue;' title='Thêm dòng'></i>";
            },
            headerClick: (e: any, column: any) => {
              this.addEducationRow();
            },
            cellClick: (e: any, cell: any) => {
              cell.getRow().delete();
            }
          } as any,
          { title: 'Trường', field: 'SchoolName', editor: 'input', hozAlign: 'left', headerHozAlign: 'center'},
          { 
            title: 'Cấp bậc', 
            field: 'RankType', 
            editor: 'list' as any,
            editorParams: {
              values: {
                "1": "Đại học",
                "2": "Cao đẳng",
                "3": "Trung cấp"
              }
            },
            hozAlign: 'left', 
            headerHozAlign: 'center', 
            formatter: (cell:any) => {
              const value = cell.getValue();
              if(value == 1) {
                return 'Đại học';
              } else if(value == 2) {
                return 'Cao đẳng';
              } else if(value == 3){
                return 'Trung cấp';
              }
              return value;
            }
          },
          { 
            title: 'Loại hình đào tạo', 
            field: 'TrainType', 
            editor: 'list' as any,
            editorParams: {
              values: {
                "1": "Đào tạo chính quy",
                "2": "Đào tạo nghề",
                "3": "Đào tạo từ xa",
                "4": "Đào tạo liên kết quốc tế",
                "5": "Đào tạo thường xuyên",
                "6": "Đào tạo theo nhu cầu doanh nghiệp"
              }
            },
            hozAlign: 'left', 
            headerHozAlign: 'center', 
            formatter: (cell:any) => {
              const value = cell.getValue();
              if(value == 1) {
                return 'Đào tạo chính quy';
              } else if(value == 2) {
                return 'Đào tạo nghề';
              } else if(value == 3){
                return 'Đào tạo từ xa';
              } else if(value == 4) {
                return 'Đào tạo liên kết quốc tế';
              } else if(value == 5) {
                return 'Đào tạo thường xuyên';
              } else if(value == 6) {
                return 'Đào tạo theo nhu cầu doanh nghiệp';
              }
              return value;
            }
          },
          { title: 'Chuyên ngành', field: 'Major', editor: 'input', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Năm tốt nghiệp', field: 'YearGraduate', editor: 'input', hozAlign: 'right', headerHozAlign: 'center' },
          { 
            title: 'Xếp loại', 
            field: 'Classification', 
            editor: 'list' as any,
            editorParams: {
              values: {
                "1": "Xuất sắc",
                "2": "Giỏi",
                "3": "Khá",
                "4": "Trung bình",
                "5": "Yếu"
              }
            },
            hozAlign: 'left', 
            headerHozAlign: 'center',
            formatter: (cell:any) => {
              const value = cell.getValue();
              if(value == 1) {
                return 'Xuất sắc';
              } else if(value == 2) {
                return 'Giỏi';
              } else if(value == 3){
                return 'Khá';
              } else if(value == 4) {
                return 'Trung bình';
              } else if(value == 5) {
                return 'Yếu';
              }
              return value;
            }
          },  
        ],
        tabEndNewRow: true,
        keybindings: {
          "navNext": "tab",
          "navPrev": "shift+tab"
        }
      });

      if (this.tabulatorEducation) {
        this.tabulatorEducation.on('tableBuilt', () => {
          // Load data after table is fully built
          this.employeeService.getEmployeeEducationLevelByEmployeeID(this.selectedEmployee.ID).subscribe((data) => {
            if (this.tabulatorEducation) {
              console.log('Education data from API:', data);
              this.educationCreate = data.data;
              this.tabulatorEducation.setData(data.data);
            }
          });
        });

        this.tabulatorEducation.on('cellEdited', () => {
          this.educationCreate = this.tabulatorEducation!.getData();
        });
        this.tabulatorEducation.on('dataChanged', () => {
          this.educationCreate = this.tabulatorEducation!.getData();
        });
      }
    }
  }
  //#endregion

  addEducationRow() {
    if (this.tabulatorEducation) {
      this.tabulatorEducation.addRow({});
    }
  }

  //#region Hàm mở modal thêm nhân viên
  openAddModal() {
    this.isEditMode = false;
    this.employeeForm.reset();
    this.employeeForm.patchValue({
      ID: 0,
      // Thông tin cơ bản
      STT: 0,
      Code: '',
      IDChamCongMoi: '',
      FullName: '',
      AnhCBNV: '',
      ChucVuHD: '',
      DepartmentName: '',
      ChucVu: '',
      Department: '',
      DvBHXH: '',
      DiaDiemLamViec: '',

      // Thông tin cá nhân
      BirthOfDate: '',
      NoiSinh: '',
      GioiTinh: 0,
      DanToc: '',
      TonGiao: '',
      QuocTich: '',
      TinhTrangHonNhan: '',

      // CMND/CCCD
      CMTND: '',
      NgayCap: '',
      NoiCap: '',

      // Địa chỉ thường trú
      TinhDcThuongTru: '',
      QuanDcThuongTru: '',
      PhuongDcThuongTru: '',
      DuongDcThuongTru: '',
      SoNhaDcThuongTru: '',
      DcThuongTru: '',

      // Địa chỉ tạm trú
      TinhDcTamTru: '',
      QuanDcTamTru: '',
      PhuongDcTamTru: '',
      DuongDcTamTru: '',
      SoNhaDcTamTru: '',
      DcTamTru: '',

      // Thông tin liên hệ
      SDTCaNhan: '',
      EmailCaNhan: '',
      SDTCongTy: '',
      EmailCongTy: '',
      NguoiLienHeKhiCan: '',
      MoiQuanHe: '',
      SDTNguoiThan: '',

      // Trình độ
      SchoolName: '',
      RankType: '',
      TrainType: '',
      Major: '',
      YearGraduate: '',
      Classification: '',

      // Hợp đồng
      LoaiHDLD: '',
      TinhTrangKyHD: '',
      DateStartContractTV: '',
      DateEndContractTV: '',
      ContractNumberTV: '',
      DateStartContractOneYear: '',
      DateEndContractOneYear: '',
      ContractNumberOneYear: '',
      DateStartContractThreeYear: '',
      DateEndContractThreeYear: '',
      ContractNumberThreeYear: '',
      DateStartContract: '',
      ContractNumber: '',

      // BHXH
      SoSoBHXH: '',
      NguoiGiuSoBHXHText: '',
      NgayBatDauBHXHCty: '',
      NgayBatDauBHXH: '',
      NgayKetThucBHXH: '',
      MucDongBHXHHienTai: 0,

      // Lương và phụ cấp
      LuongThuViec: 0,
      LuongCoBan: 0,
      AnCa: 0,
      XangXe: 0,
      DienThoai: 0,
      NhaO: 0,
      TrangPhuc: 0,
      ChuyenCan: 0,
      Khac: 0,
      TongPhuCap: 0,
      TongLuong: 0,

      // Giảm trừ
      GiamTruBanThan: 0,
      SoNguoiPT: 0,
      TongTien: 0,

      // Thông tin khác
      MST: '',
      STKChuyenLuong: '',

      // Check list hồ sơ
      SYLL: false,
      GiayKS: false,
      CMNDorCCCD: false,
      SoHK: false,
      GiayKSK: false,
      XNNS: false,
      BangCap: false,
      CV: false,
      DXV: false,
      CamKetTs: false,
      ToTrinhTD: false,
      ThuMoiNhanViec: false,
      QDTD: false,
      HDTV: false,
      DGTV: false,
      HDLDXDTHYear: false,
      DGChuyenHDYear: false,
      HDLDXDTH: false,
      DGChuyenHD: false,
      HDLDKXDTH: false,
    });
    if (this.tabulatorEducation) {
      this.educationCreate = [];
    }
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
    
    // Khởi tạo bảng education sau khi modal được mở
    setTimeout(() => {
      this.initializeTableEducation();
    }, 100);
  }
  //#endregion

  //#region Hàm mở modal sửa và fill dữ liệu lên modal
  openEditModal() {
    this.isEditMode = true;
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên cần chỉnh sửa');
      return;
    }
    this.selectedEmployee = selectedRows[0].getData();

    this.employeeForm.reset();
    this.employeeForm.patchValue({
      ID: this.selectedEmployee.ID,
      // Thông tin cơ bản
      STT: this.selectedEmployee.STT,
      Code: this.selectedEmployee.Code,
      IDChamCongMoi: this.selectedEmployee.IDChamCongMoi,
      FullName: this.selectedEmployee.FullName,
      AnhCBNV: this.selectedEmployee.AnhCBNV,
      ChucVuHDID: this.selectedEmployee.ChucVuHDID,
      ChuVuID: this.selectedEmployee.ChuVuID,
      DepartmentID: this.selectedEmployee.DepartmentID,
      DvBHXH: this.selectedEmployee.DvBHXH,
      DiaDiemLamViec: this.selectedEmployee.DiaDiemLamViec,
      StartWorking: this.selectedEmployee.StartWorking,

      // Thông tin cá nhân
      BirthOfDate: this.selectedEmployee.BirthOfDate,
      NoiSinh: this.selectedEmployee.NoiSinh,
      GioiTinh: this.selectedEmployee.GioiTinh,
      DanToc: this.selectedEmployee.DanToc,
      TonGiao: this.selectedEmployee.TonGiao,
      QuocTich: this.selectedEmployee.QuocTich,
      TinhTrangHonNhanID: this.selectedEmployee.TinhTrangHonNhanID,

      // CMND/CCCD
      CMTND: this.selectedEmployee.CMTND,
      NgayCap: this.selectedEmployee.NgayCap,
      NoiCap: this.selectedEmployee.NoiCap,

      // Địa chỉ thường trú
      TinhDcThuongTru: this.selectedEmployee.TinhDcThuongTru,
      QuanDcThuongTru: this.selectedEmployee.QuanDcThuongTru,
      PhuongDcThuongTru: this.selectedEmployee.PhuongDcThuongTru,
      DuongDcThuongTru: this.selectedEmployee.DuongDcThuongTru,
      SoNhaDcThuongTru: this.selectedEmployee.SoNhaDcThuongTru,
      DcThuongTru: this.selectedEmployee.DcThuongTru,

      // Địa chỉ tạm trú
      TinhDcTamTru: this.selectedEmployee.TinhDcTamTru,
      QuanDcTamTru: this.selectedEmployee.QuanDcTamTru,
      PhuongDcTamTru: this.selectedEmployee.PhuongDcTamTru,
      DuongDcTamTru: this.selectedEmployee.DuongDcTamTru,
      SoNhaDcTamTru: this.selectedEmployee.SoNhaDcTamTru,
      DcTamTru: this.selectedEmployee.DcTamTru,

      // Thông tin liên hệ
      SDTCaNhan: this.selectedEmployee.SDTCaNhan,
      EmailCaNhan: this.selectedEmployee.EmailCaNhan,
      SDTCongTy: this.selectedEmployee.SDTCongTy,
      EmailCongTy: this.selectedEmployee.EmailCongTy,
      NguoiLienHeKhiCan: this.selectedEmployee.NguoiLienHeKhiCan,
      MoiQuanHe: this.selectedEmployee.MoiQuanHe,
      SDTNguoiThan: this.selectedEmployee.SDTNguoiThan,

      // Trình độ
      SchoolName: this.selectedEmployee.SchoolName,
      RankType: this.selectedEmployee.RankType,
      TrainType: this.selectedEmployee.TrainType,
      Major: this.selectedEmployee.Major,
      YearGraduate: this.selectedEmployee.YearGraduate,
      Classification: this.selectedEmployee.Classification,

      // Hợp đồng
      LoaiHDLD: this.selectedEmployee.LoaiHDLD,
      TinhTrangKyHD: this.selectedEmployee.TinhTrangKyHD,
      DateStartContractTV: this.selectedEmployee.DateStartContractTV,
      DateEndContractTV: this.selectedEmployee.DateEndContractTV,
      ContractNumberTV: this.selectedEmployee.ContractNumberTV,
      DateStartContractOneYear: this.selectedEmployee.DateStartContractOneYear,
      DateEndContractOneYear: this.selectedEmployee.DateEndContractOneYear,
      ContractNumberOneYear: this.selectedEmployee.ContractNumberOneYear,
      DateStartContractThreeYear: this.selectedEmployee.DateStartContractThreeYear,
      DateEndContractThreeYear: this.selectedEmployee.DateEndContractThreeYear,
      ContractNumberThreeYear: this.selectedEmployee.ContractNumberThreeYear,
      DateStartContract: this.selectedEmployee.DateStartContract,
      ContractNumber: this.selectedEmployee.ContractNumber,

      // BHXH
      SoSoBHXH: this.selectedEmployee.SoSoBHXH,
      NguoiGiuSoBHXHText: this.selectedEmployee.NguoiGiuSoBHXHText,
      NgayBatDauBHXHCty: this.selectedEmployee.NgayBatDauBHXHCty,
      // NgayBatDauBHXH: this.selectedEmployee.NgayBatDauBHXH,
      // NgayKetThucBHXH: this.selectedEmployee.NgayKetThucBHXH,
      MucDongBHXHHienTai: this.selectedEmployee.MucDongBHXHHienTai,

      // Lương và phụ cấp
      LuongThuViec: this.selectedEmployee.LuongThuViec,
      LuongCoBan: this.selectedEmployee.LuongCoBan,
      AnCa: this.selectedEmployee.AnCa,
      XangXe: this.selectedEmployee.XangXe,
      DienThoai: this.selectedEmployee.DienThoai,
      NhaO: this.selectedEmployee.NhaO,
      TrangPhuc: this.selectedEmployee.TrangPhuc,
      ChuyenCan: this.selectedEmployee.ChuyenCan,
      Khac: this.selectedEmployee.Khac,
      TongPhuCap: this.selectedEmployee.TongPhuCap,
      TongLuong: this.selectedEmployee.TongLuong,

      // Giảm trừ
      GiamTruBanThan: this.selectedEmployee.GiamTruBanThan,
      SoNguoiPT: this.selectedEmployee.SoNguoiPT,
      TongTien: this.selectedEmployee.TongTien,

      // Thông tin khác
      MST: this.selectedEmployee.MST,
      STKChuyenLuong: this.selectedEmployee.STKChuyenLuong,

      // Check list hồ sơ
      SYLL: this.selectedEmployee.SYLL,
      GiayKS: this.selectedEmployee.GiayKS,
      CMNDorCCCD: this.selectedEmployee.CMNDorCCCD,
      SoHK: this.selectedEmployee.SoHK,
      GiayKSK: this.selectedEmployee.GiayKSK,
      XNNS: this.selectedEmployee.XNNS,
      BangCap: this.selectedEmployee.BangCap,
      CV: this.selectedEmployee.CV,
      DXV: this.selectedEmployee.DXV,
      CamKetTs: this.selectedEmployee.CamKetTs,
      ToTrinhTD: this.selectedEmployee.ToTrinhTD,
      ThuMoiNhanViec: this.selectedEmployee.ThuMoiNhanViec,
      QDTD: this.selectedEmployee.QDTD,
      HDTV: this.selectedEmployee.HDTV,
      DGTV: this.selectedEmployee.DGTV,
      HDLDXDTHYear: this.selectedEmployee.HDLDXDTHYear,
      DGChuyenHDYear: this.selectedEmployee.DGChuyenHDYear,
      HDLDXDTH: this.selectedEmployee.HDLDXDTH,
      DGChuyenHD: this.selectedEmployee.DGChuyenHD,
      HDLDKXDTH: this.selectedEmployee.HDLDKXDTH,
    });

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
    
    // Khởi tạo bảng education sau khi modal được mở
    setTimeout(() => {
      this.initializeTableEducation();
    }, 100);
  }
  //#endregion

  //#region Hàm xóa nhân viên
  openDeleteModal() {
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên muốn xóa!');
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    // Reset form với ngày nghỉ việc mặc định là ngày hiện tại
    this.deleteForm.patchValue({
      EndWorking: new Date(),
      ReasonDeleted: ''
    });

    const modal = new (window as any).bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  async deleteEmployee() {
    if (!this.deleteForm.get('EndWorking')?.value) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập ngày nghỉ việc!');
      return;
    }

    if (!this.deleteForm.get('ReasonDeleted')?.value) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập lý do nghỉ việc!');
      return;
    }

    try {
      const updateData = {
        ...this.selectedEmployee,
        Status: 1,
        EndWorking: this.deleteForm.get('EndWorking')?.value,
        ReasonDeleted: this.deleteForm.get('ReasonDeleted')?.value
      };


      this.employeeService.saveEmployee(updateData).subscribe({
        next: (response) => {
          this.notification.success('Thành công', 'Cập nhật trạng thái nhân viên thành công!');
          this.closeDeleteModal();
          this.loadEmployees();
        
        },
        error: (error) => {
          this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật trạng thái nhân viên!');
        }
      });
    } catch (error) {
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái nhân viên!');
    }
  }
  //#endregion

  closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.deleteForm.reset();
  }

  openPositionContractForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('positionContractModal'));
    modal.show();
  }

  openPositionInternalForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('positionInternalModal'));
    modal.show();
  }

  openEmployeeApproveForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeApprove'));
    modal.show();
  }

  openImportExcelForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('importExcelForm'));
    modal.show();
  }

  openEmployeeTeamForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeTeamForm'));
    modal.show();
  }

  openLoginManagerForm() {
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên cần quản lý đăng nhập!');
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    const modal = new (window as any).bootstrap.Modal(document.getElementById('loginManagerForm'));
    modal.show();
  }

  openEmployeeContract() {
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên muốn xem hợp đồng lao động!');
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeContractForm'));
    modal.show();
  }

  //#region Upload ảnh
  beforeUpload = (file: NzUploadFile): boolean => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      this.notification.error('Lỗi', 'Chỉ hỗ trợ file JPG/PNG!');
      return false;
    }
    const isLt2M = file.size! / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.notification.error('Lỗi', 'Kích thước ảnh phải nhỏ hơn 2MB!');
      return false;
    }
    return true;
  };

  private getBase64(img: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result!.toString()));
    reader.readAsDataURL(img);
  }

  handleChange(info: { file: NzUploadFile }): void {
    switch (info.file.status) {
      case 'uploading':
        break;
      case 'done':
        // Get this url from response in real world.
        this.getBase64(info.file.originFileObj!, (img: string) => {
          this.avatarUrl = img;
          this.employeeForm.patchValue({
            AnhCBNV: img
          });
        });
        break;
      case 'error':
        this.notification.error('Lỗi', 'Upload ảnh thất bại!');
        break;
    }
  }
  //#endregion

  //#region Hàm lưu dữ liệu
  onSubmit() {
    if (this.employeeForm.invalid) {
      Object.keys(this.employeeForm.controls).forEach(key => {
        const control = this.employeeForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.error('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formData = this.employeeForm.getRawValue();
    const currentEducation = this.tabulatorEducation?.getData() || [];
    
    const employeeData = {
      ...formData,
      EmployeeEducationLevels: currentEducation.map(education => ({
        ID: education.ID || 0,
        EmployeeID: education.EmployeeID,
        SchoolName: education.SchoolName,
        RankType: education.RankType,
        TrainType: education.TrainType,
        Major: education.Major,
        YearGraduate: education.YearGraduate,
        Classification: education.Classification
      }))
    }

    // Lấy dữ liệu từ bảng education
    if (this.tabulatorEducation) {
      formData.educations = this.tabulatorEducation.getData();
    }

    if (this.isEditMode) {
      // Cập nhật nhân viên
      this.employeeService.saveEmployee(employeeData).subscribe({
        next: (response) => {
          this.notification.success('Thành công', 'Cập nhật nhân viên thành công');
          this.closeModal();
          this.loadEmployees();
        
        },
        error: (error) => {
          this.notification.error('Lỗi', 'Cập nhật nhân viên thất bại: ' + error.message);
        }
      });
    } else {
      // Thêm nhân viên mới
      this.employeeService.saveEmployee(employeeData).subscribe({
        next: (response) => {
          this.notification.success('Thành công', 'Thêm nhân viên thành công');
          this.loadEmployees();
          this.closeModal();
          
        },
        error: (error) => {
          this.notification.error('Lỗi', 'Thêm nhân viên thất bại: ' + error.message);
        }
      });
    }
  }
  //#endregion

  closeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.employeeForm.reset();
  }

  //#region Hàm xuất excel
  async exportToExcel() {
    // Hàm format date
    const formatDate = (date: any) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Hàm format checklist
    const formatChecklist = (value: boolean) => {
      return value ? '✓' : '';
    };

    // Lấy dữ liệu từ Tabulator
    const tableData = this.tabulatorEmployee.getData();

    // Chuẩn bị dữ liệu xuất
    const exportData = tableData
      .filter(employee => Object.keys(employee).length > 0)
      .map((employee, idx) => {
        // Loại bỏ các trường object rỗng nếu có
        const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
        return {
          'STT': idx + 1,
          'Mã nhân viên': safe(employee.Code),
          'ID Chấm công': safe(employee.IDChamCongMoi),
          'Họ và tên': safe(employee.FullName),
          'Phòng ban': safe(employee.DepartmentName),
          'Chức vụ (HĐLĐ)': safe(employee.ChucVuHD),
          'Chức vụ (Nội bộ)': safe(employee.ChucVu),
          'Đơn vị BHXH': safe(employee.DvBHXH),
          'Ngày bắt đầu làm việc': formatDate(employee.StartWorking),
          'Ngày sinh': formatDate(employee.BirthOfDate),
          'Nơi sinh': safe(employee.NoiSinh),
          'Giới tính': safe(employee.GioiTinh === 1 ? 'Nam' : employee.GioiTinh === 0 ? 'Nữ' : 'Khác'),
          'Dân tộc': safe(employee.DanToc),
          'Tôn giáo': safe(employee.TonGiao),
          'Quốc tịch': safe(employee.QuocTich),
          'Tình trạng hôn nhân': safe(employee.TinhTrangHonNhanID === 0 ? 'Đã kết hôn' : 'Độc thân'),
          'Địa điểm làm việc': safe(employee.DiaDiemLamViec),
          'SĐT cá nhân': safe(employee.SDTCaNhan),
          'Email cá nhân': safe(employee.EmailCaNhan),
          'SĐT công ty': safe(employee.SDTCongTy),
          'Email công ty': safe(employee.EmailCongTy),
          'CMND/CCCD': safe(employee.CMTND),
          'Ngày cấp': formatDate(employee.NgayCap),
          'Nơi cấp': safe(employee.NoiCap),
          'Địa chỉ thường trú': safe(employee.DcThuongTru),
          'Tỉnh/TP thường trú': safe(employee.TinhDcThuongTru),
          'Quận/Huyện thường trú': safe(employee.QuanDcThuongTru),
          'Phường/Xã thường trú': safe(employee.PhuongDcThuongTru),
          'Đường thường trú': safe(employee.DuongDcThuongTru),
          'Số nhà thường trú': safe(employee.SoNhaDcThuongTru),
          'Địa chỉ tạm trú': safe(employee.DcTamTru),
          'Tỉnh/TP tạm trú': safe(employee.TinhDcTamTru),
          'Quận/Huyện tạm trú': safe(employee.QuanDcTamTru),
          'Phường/Xã tạm trú': safe(employee.PhuongDcTamTru),
          'Đường tạm trú': safe(employee.DuongDcTamTru),
          'Số nhà tạm trú': safe(employee.SoNhaDcTamTru),
          'Số sổ BHXH': safe(employee.SoSoBHXH),
          'Người giữ sổ BHXH': safe(employee.NguoiGiuSoBHXHText),
          'Ngày bắt đầu đóng BHXH': formatDate(employee.NgayBatDauBHXHCty),
          'Mức đóng BHXH hiện tại': safe(employee.MucDongBHXHHienTai),
          'Giảm trừ bản thân': safe(employee.GiamTruBanThan),
          'Số người phụ thuộc': safe(employee.SoNguoiPT),
          'Tổng tiền giảm trừ': safe(employee.TongTien),
          'MST cá nhân': safe(employee.MST),
          'STK chuyển lương': safe(employee.STKChuyenLuong),
          'Lương thử việc': safe(employee.LuongThuViec),
          'Lương cơ bản': safe(employee.LuongCoBan),
          'Phụ cấp ăn ca': safe(employee.AnCa),
          'Phụ cấp xăng xe': safe(employee.XangXe),
          'Phụ cấp điện thoại': safe(employee.DienThoai),
          'Phụ cấp nhà ở': safe(employee.NhaO),
          'Phụ cấp trang phục': safe(employee.TrangPhuc),
          'Phụ cấp chuyên cần': safe(employee.ChuyenCan),
          'Phụ cấp khác': safe(employee.Khac),
          'Tổng phụ cấp': safe(employee.TongPhuCap),
          'Tổng lương': safe(employee.TongLuong),
          'Tình trạng': safe(employee.Status === 0 ? 'Đang làm việc' : 'Nghỉ việc'),
          // Checklist hồ sơ
          'SYLL': formatChecklist(employee.SYLL),
          'Giấy KS': formatChecklist(employee.GiayKS),
          'CMND/CCCD (Checklist)': formatChecklist(employee.CMNDorCCCD),
          'Sổ HK': formatChecklist(employee.SoHK),
          'Giấy KSK': formatChecklist(employee.GiayKSK),
          'XNNS': formatChecklist(employee.XNNS),
          'Bằng cấp': formatChecklist(employee.BangCap),
          'CV': formatChecklist(employee.CV),
          'ĐXV': formatChecklist(employee.DXV),
          'Cam kết tài sản': formatChecklist(employee.CamKetTs),
          'Tờ trình tuyển dụng': formatChecklist(employee.ToTrinhTD),
          'Thư mời nhận việc': formatChecklist(employee.ThuMoiNhanViec),
          'Quyết định tuyển dụng': formatChecklist(employee.QDTD),
          'Hợp đồng thử việc': formatChecklist(employee.HDTV),
          'Đánh giá thử việc': formatChecklist(employee.DGTV),
          'HDLD KXDTH(12T-36T)': formatChecklist(employee.HDLDXDTHYear),
          'Đánh giá chuyển hợp đồng': formatChecklist(employee.DGChuyenHD),
          'HDLDKXDTH': formatChecklist(employee.HDLDKXDTH)
        };
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NhanVien');

    // Thêm header
    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
      { header: 'ID Chấm công', key: 'ID Chấm công', width: 15 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 30 },
      { header: 'Phòng ban', key: 'Phòng ban', width: 25 },
      { header: 'Chức vụ (HĐLĐ)', key: 'Chức vụ (HĐLĐ)', width: 25 },
      { header: 'Chức vụ (Nội bộ)', key: 'Chức vụ (Nội bộ)', width: 25 },
      { header: 'Đơn vị BHXH', key: 'Đơn vị BHXH', width: 25 },
      { header: 'Ngày bắt đầu làm việc', key: 'Ngày bắt đầu làm việc', width: 20 },
      { header: 'Ngày sinh', key: 'Ngày sinh', width: 15 },
      { header: 'Nơi sinh', key: 'Nơi sinh', width: 20 },
      { header: 'Giới tính', key: 'Giới tính', width: 10 },
      { header: 'Dân tộc', key: 'Dân tộc', width: 15 },
      { header: 'Tôn giáo', key: 'Tôn giáo', width: 15 },
      { header: 'Quốc tịch', key: 'Quốc tịch', width: 15 },
      { header: 'Tình trạng hôn nhân', key: 'Tình trạng hôn nhân', width: 20 },
      { header: 'Địa điểm làm việc', key: 'Địa điểm làm việc', width: 25 },
      { header: 'SĐT cá nhân', key: 'SĐT cá nhân', width: 15 },
      { header: 'Email cá nhân', key: 'Email cá nhân', width: 30 },
      { header: 'SĐT công ty', key: 'SĐT công ty', width: 15 },
      { header: 'Email công ty', key: 'Email công ty', width: 30 },
      { header: 'CMND/CCCD', key: 'CMND/CCCD', width: 20 },
      { header: 'Ngày cấp', key: 'Ngày cấp', width: 15 },
      { header: 'Nơi cấp', key: 'Nơi cấp', width: 20 },
      { header: 'Địa chỉ thường trú', key: 'Địa chỉ thường trú', width: 40 },
      { header: 'Tỉnh/TP thường trú', key: 'Tỉnh/TP thường trú', width: 20 },
      { header: 'Quận/Huyện thường trú', key: 'Quận/Huyện thường trú', width: 20 },
      { header: 'Phường/Xã thường trú', key: 'Phường/Xã thường trú', width: 20 },
      { header: 'Đường thường trú', key: 'Đường thường trú', width: 20 },
      { header: 'Số nhà thường trú', key: 'Số nhà thường trú', width: 15 },
      { header: 'Địa chỉ tạm trú', key: 'Địa chỉ tạm trú', width: 40 },
      { header: 'Tỉnh/TP tạm trú', key: 'Tỉnh/TP tạm trú', width: 20 },
      { header: 'Quận/Huyện tạm trú', key: 'Quận/Huyện tạm trú', width: 20 },
      { header: 'Phường/Xã tạm trú', key: 'Phường/Xã tạm trú', width: 20 },
      { header: 'Đường tạm trú', key: 'Đường tạm trú', width: 20 },
      { header: 'Số nhà tạm trú', key: 'Số nhà tạm trú', width: 15 },
      { header: 'Số sổ BHXH', key: 'Số sổ BHXH', width: 20 },
      { header: 'Người giữ sổ BHXH', key: 'Người giữ sổ BHXH', width: 25 },
      { header: 'Ngày bắt đầu đóng BHXH', key: 'Ngày bắt đầu đóng BHXH', width: 20 },
      { header: 'Mức đóng BHXH hiện tại', key: 'Mức đóng BHXH hiện tại', width: 20 },
      { header: 'Giảm trừ bản thân', key: 'Giảm trừ bản thân', width: 20 },
      { header: 'Số người phụ thuộc', key: 'Số người phụ thuộc', width: 20 },
      { header: 'Tổng tiền giảm trừ', key: 'Tổng tiền giảm trừ', width: 20 },
      { header: 'MST cá nhân', key: 'MST cá nhân', width: 20 },
      { header: 'STK chuyển lương', key: 'STK chuyển lương', width: 20 },
      { header: 'Lương thử việc', key: 'Lương thử việc', width: 20 },
      { header: 'Lương cơ bản', key: 'Lương cơ bản', width: 20 },
      { header: 'Phụ cấp ăn ca', key: 'Phụ cấp ăn ca', width: 20 },
      { header: 'Phụ cấp xăng xe', key: 'Phụ cấp xăng xe', width: 20 },
      { header: 'Phụ cấp điện thoại', key: 'Phụ cấp điện thoại', width: 20 },
      { header: 'Phụ cấp nhà ở', key: 'Phụ cấp nhà ở', width: 20 },
      { header: 'Phụ cấp trang phục', key: 'Phụ cấp trang phục', width: 20 },
      { header: 'Phụ cấp chuyên cần', key: 'Phụ cấp chuyên cần', width: 20 },
      { header: 'Phụ cấp khác', key: 'Phụ cấp khác', width: 20 },
      { header: 'Tổng phụ cấp', key: 'Tổng phụ cấp', width: 20 },
      { header: 'Tổng lương', key: 'Tổng lương', width: 20 },
      { header: 'Tình trạng', key: 'Tình trạng', width: 15 },
      // Checklist hồ sơ
      { header: 'SYLL', key: 'SYLL', width: 10 },
      { header: 'Giấy KS', key: 'Giấy KS', width: 10 },
      { header: 'CMND/CCCD (Checklist)', key: 'CMND/CCCD (Checklist)', width: 15 },
      { header: 'Sổ HK', key: 'Sổ HK', width: 10 },
      { header: 'Giấy KSK', key: 'Giấy KSK', width: 10 },
      { header: 'XNNS', key: 'XNNS', width: 10 },
      { header: 'Bằng cấp', key: 'Bằng cấp', width: 10 },
      { header: 'CV', key: 'CV', width: 10 },
      { header: 'ĐXV', key: 'ĐXV', width: 10 },
      { header: 'Cam kết tài sản', key: 'Cam kết tài sản', width: 15 },
      { header: 'Tờ trình tuyển dụng', key: 'Tờ trình tuyển dụng', width: 15 },
      { header: 'Thư mời nhận việc', key: 'Thư mời nhận việc', width: 15 },
      { header: 'Quyết định tuyển dụng', key: 'Quyết định tuyển dụng', width: 15 },
      { header: 'Hợp đồng thử việc', key: 'Hợp đồng thử việc', width: 15 },
      { header: 'Đánh giá thử việc', key: 'Đánh giá thử việc', width: 15 },
      { header: 'HDLD KXDTH(12T-36T)', key: 'HDLD KXDTH(12T-36T)', width: 15 },
      { header: 'Đánh giá chuyển hợp đồng', key: 'Đánh giá chuyển hợp đồng', width: 15 },
      { header: 'HDLDKXDTH', key: 'HDLDKXDTH', width: 15 }
    ];

    // Thêm dữ liệu
    exportData.forEach(row => worksheet.addRow(row));

    // Định dạng header
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    worksheet.getRow(1).height = 30;

    // Định dạng các dòng dữ liệu
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber !== 1) {
        row.height = 40;
        row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle' };
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          if (colNumber !== 1) {
            cell.font = { name: 'Tahoma', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          }
        });
      }
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, `DanhSachNhanVien_${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}.xlsx`);
  }
  //#endregion

  onSearch() {
    const searchData = this.searchForm.value;
    this.employeeService.filterEmployee(
      searchData.status || 0,
      searchData.department || 0,
      searchData.keyword || ''
    ).subscribe({
      next: (data: any) => {
        this.employees = Array.isArray(data.data) ? data.data : [data.data];   
        this.tabulatorEmployee.setData(this.employees);
      },
      error: (error) => {
        console.error('Error searching customers:', error);
        this.notification.error('Lỗi', 'Không thể tìm kiếm khách hàng');
      }
    });
  }

  resetSearch() {
    this.initSearchForm();
    this.loadEmployees();
  }

}

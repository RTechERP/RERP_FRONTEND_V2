import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
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
import { CommonModule, NgIf } from '@angular/common';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { PositionServiceService } from '../positions/position-service/position-service.service';
import { PositionContractComponent } from '../positions/position-contract/position-contract.component';
import { PositionInternalComponent } from '../positions/position-internal/position-internal.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { EmployeeApproveComponent } from './employee-approve/employee-approve.component';
import { EmployeeLoginManagerComponent } from './employee-login-manager/employee-login-manager.component';
import { EmployeeContractComponent } from './employee-contract/employee-contract.component';
import { EmployeeImportExcelComponent } from './employee-import-excel/employee-import-excel.component';
import { EmployeeTeamComponent } from './employee-team/employee-team.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ProjectService } from '../../project/project-service/project.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TeamComponent } from '../team/team.component';

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
    EmployeeLoginManagerComponent,
    EmployeeImportExcelComponent,
    EmployeeContractComponent,
    NgIf,
    NzSpinModule,
    EmployeeTeamComponent,
    HasPermissionDirective,
  ],
  providers: [NzModalService, NzNotificationService, NzConfigService],
  standalone: true,
})
export class EmployeeComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_employee', { static: false }) tableElement!: ElementRef;
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

  isSearchVisible: boolean = false;
  sizeTbDetail: any = '0';
  selectedEmployee: any = null;
  deleteForm!: FormGroup;
  searchForm!: FormGroup;
  endContractControl = new FormControl(false);
  positionForm!: FormGroup;
  isLoading = false;
  employeeTeam: any[] = [];

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private positionService: PositionServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private modalService: NgbModal,
  ) {
    // Subscribe to EndContract changes
    this.endContractControl.valueChanges.subscribe((checked) => {
      if (checked) {
        // Filter employees with expiring contracts
        const filteredEmployees = this.employees.filter(
          (emp) => emp.IsExpireContract === 0.5
        );
        this.tabulatorEmployee.setData(filteredEmployees);
      } else {
        // Reset to normal search
        this.tabulatorEmployee.setData(this.employees);
      }
    });
  }

  private initFormPosition() {
    this.positionForm = this.fb.group({
      ID: [0],
      PriorityOrder: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      IsBusinessCost: [false]
    });
  }

  private initSearchForm() {
    this.searchForm = this.fb.group({
      status: [0],
      department: [0],
      keyword: [''],
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
      ChucVuHDID: [null, [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      ChuVuID: [null, [Validators.required]],
      DvBHXH: ['', [Validators.required]],
      DiaDiemLamViec: ['', [Validators.required]],
      StartWorking: ['', [Validators.required]],
      RoleID: [2],
      EmployeeTeamID: [0],
      // Thông tin cá nhân
      BirthOfDate: ['', [Validators.required]],
      NoiSinh: ['', [Validators.required]],
      GioiTinh: [null, [Validators.required]],
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
      DuongDcThuongTru: [''],
      SoNhaDcThuongTru: [''],
      DcThuongTru: [''],

      // Địa chỉ tạm trú
      TinhDcTamTru: ['', [Validators.required]],
      QuanDcTamTru: ['', [Validators.required]],
      PhuongDcTamTru: ['', [Validators.required]],
      DuongDcTamTru: [''],
      SoNhaDcTamTru: [''],
      DcTamTru: [''],

      // Thông tin liên hệ
      SDTCaNhan: ['', [Validators.required]],
      EmailCaNhan: ['', [Validators.required]],
      SDTCongTy: [''],
      EmailCongTy: [''],
      NguoiLienHeKhiCan: ['', [Validators.required]],
      MoiQuanHe: ['', [Validators.required]],
      SDTNguoiThan: ['', [Validators.required]],

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
      allChecked: [false],
    });

    this.deleteForm = this.fb.group({
      EndWorking: [new Date()],
      ReasonDeleted: [''],
      SoSoBHXH: [''],
      NguoiGiuSoBHXHText: [''],
    });
  }

  ngOnInit() {
    this.initForm();
    this.initSearchForm();
    this.initFormPosition();
    this.loadDepartments();
    this.loadPositionContract();
    this.loadPositionInternal();
    this.loadEmployeeTeam();
    this.setupAutoFillAddress();
    this.employeeForm.get('allChecked')?.valueChanges.subscribe((checked) => {
      const checklistControls = [
        'SYLL',
        'GiayKS',
        'CMNDorCCCD',
        'SoHK',
        'GiayKSK',
        'XNNS',
        'BangCap',
        'CV',
        'DXV',
        'CamKetTs',
        'ToTrinhTD',
        'ThuMoiNhanViec',
        'QDTD',
        'HDTV',
        'DGTV',
        'HDLDXDTHYear',
        'DGChuyenHD',
        'HDLDKXDTH',
      ];

      checklistControls.forEach((controlName) => {
        this.employeeForm
          .get(controlName)
          ?.setValue(checked, { emitEvent: false });
      });
    });

    // Subscribe to individual checkbox changes
    const checklistControls = [
      'SYLL',
      'GiayKS',
      'CMNDorCCCD',
      'SoHK',
      'GiayKSK',
      'XNNS',
      'BangCap',
      'CV',
      'DXV',
      'CamKetTs',
      'ToTrinhTD',
      'ThuMoiNhanViec',
      'QDTD',
      'HDTV',
      'DGTV',
      'HDLDXDTHYear',
      'DGChuyenHD',
      'HDLDKXDTH',
    ];

    checklistControls.forEach((controlName) => {
      this.employeeForm.get(controlName)?.valueChanges.subscribe(() => {
        const allChecked = checklistControls.every(
          (control) => this.employeeForm.get(control)?.value === true
        );
        this.employeeForm
          .get('allChecked')
          ?.setValue(allChecked, { emitEvent: false });
      });
    });
  }

  private setupAutoFillAddress() {
    // Permanent Address
    const addressFields = ['TinhDcThuongTru', 'QuanDcThuongTru', 'PhuongDcThuongTru'];
    addressFields.forEach(field => {
      this.employeeForm.get(field)?.valueChanges.subscribe(() => {
        const tinh = this.employeeForm.get('TinhDcThuongTru')?.value || '';
        const quan = this.employeeForm.get('QuanDcThuongTru')?.value || '';
        const phuong = this.employeeForm.get('PhuongDcThuongTru')?.value || '';

        const parts = [phuong, quan, tinh].filter(val => val && val.trim().length > 0);
        const fullAddress = parts.join(', ');

        this.employeeForm.patchValue({ DcThuongTru: fullAddress }, { emitEvent: false });
      });
    });

    // Temporary Address
    const tempAddressFields = ['TinhDcTamTru', 'QuanDcTamTru', 'PhuongDcTamTru'];
    tempAddressFields.forEach(field => {
      this.employeeForm.get(field)?.valueChanges.subscribe(() => {
        const tinh = this.employeeForm.get('TinhDcTamTru')?.value || '';
        const quan = this.employeeForm.get('QuanDcTamTru')?.value || '';
        const phuong = this.employeeForm.get('PhuongDcTamTru')?.value || '';

        const parts = [phuong, quan, tinh].filter(val => val && val.trim().length > 0);
        const fullAddress = parts.join(', ');

        this.employeeForm.patchValue({ DcTamTru: fullAddress }, { emitEvent: false });
      });
    });
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTableEmployee();
    }, 0);
  }

  // toggleSearchPanel(): void {
  //   this.isSearchVisible = !this.isSearchVisible;
  // }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onTabChange(index: number) {
    if (index === 4) {
      // Index của tab Trình độ học vấn
      setTimeout(() => {
        this.initializeTableEducation();
      }, 100);
    }
  }

  //#region Hàm load dữ liệu từ API
  loadEmployees(): void {
    if (!this.tabulatorEmployee) {
      console.warn('Tabulator chưa được khởi tạo');
      return;
    }

    this.isLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data.data || [];
        this.tabulatorEmployee.setData(this.employees).then(() => {
          this.isLoading = false;
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Không thể tải danh sách nhân viên');
      }
    });
  }
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error?.message || 'Lỗi khi tải danh sách phòng ban'
        );
      },
    });
  }
  loadPositionContract() {
    this.positionService.getPositionContract().subscribe({
      next: (data: any) => {
        this.positionContractList = data;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error?.message || 'Lỗi khi tải danh sách chức vụ theo hợp đồng'
        );
      },
    });
  }
  loadPositionInternal() {
    this.positionService.getPositionInternal().subscribe({
      next: (data: any) => {
        this.positionInternalList = data;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error?.message || 'Lỗi khi tải danh sách chức vụ theo nội bộ'
        );
      },
    });
  }
  //#endregion
  //#region Hàm khởi tạo bảng nhân viên
  private initializeTableEmployee(): void {
    if (!document.getElementById('tb_employee') || this.tabulatorEmployee) {
      return; // Đã khởi tạo hoặc chưa có DOM
    }
    this.tabulatorEmployee = new Tabulator('#tb_employee', {
      ...DEFAULT_TABLE_CONFIG,
      data: this.employees,
      layout: 'fitDataFill',
      columnCalcs: false,
      paginationMode: "local",
      selectableRows: 1,
      groupBy: 'DepartmentName',
      columnDefaults: {
        headerWordWrap: false,
        resizable: false,
      },
      rowHeader: false,
      groupHeader: function (value, count, data, group) {
        return (
          value ?? 'Không có thông tin' +
          "<span style='color:#d00; margin-left:10px;'>(" +
          count +
          ' thành viên)</span>'
        );
      },
      columns: [
        {
          title: `
                  <div style="display: flex; gap: 12px;">
                      <button style="font-size: 0.75rem; border: 1px solid grey; color:black !important; width: 6rem;">Đang làm việc</button>
                      <button style="font-size: 0.75rem; border: 1px solid grey; color:black !important; background-color: wheat; width: 6rem;">Nghỉ việc</button>
                      <button style="font-size: 0.75rem; border: 1px solid grey;  color:black !important;background-color: yellow; width: 7rem;">Sắp hết HĐ (1T)</button>
                      <button style="font-size: 0.75rem; border: 1px solid grey; background-color: red; color: white; width: 7rem;">Sắp hết HĐ (15N)</button>
                    </div>
                  `,
          frozen: true,
          columns: [
            {
              title: "STT",
              field: "STT",
              hozAlign: "center",
              headerHozAlign: "center",
              frozen: true,
              formatter: function (cell) {
                const row = cell.getRow();
                const group = row.getGroup();

                if (group) {
                  const rowsInGroup = group.getRows();
                  const indexInGroup = rowsInGroup.indexOf(row);
                  return String(indexInGroup + 1);
                } else {
                  return String(row.getTable().getRows().indexOf(row) + 1);
                }
              },
            },
            {
              title: 'Mã nhân viên',
              field: 'Code',
              hozAlign: 'left',
              headerHozAlign: 'center',
              frozen: true,
            },
            {
              title: 'ID Chấm công',
              field: 'IDChamCongMoi',
              hozAlign: 'left',
              headerHozAlign: 'center',
              frozen: true,
            },
            {
              title: 'Họ tên',
              field: 'FullName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              frozen: true,
              minWidth: 200
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Chức vụ (Theo HĐLĐ)',
              field: 'ChucVuHD',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Phòng / Bộ phận',
              field: 'DepartmentName',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Chức vụ (Theo nội vụ)',
              field: 'ChucVu',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Nhóm',
              field: 'Department',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Đơn vị tham gia BHXH',
              field: 'DvBHXH',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Địa điểm làm việc',
              field: 'DiaDiemLamViec',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày sinh',
              field: 'BirthOfDate',
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
              title: 'Nơi sinh',
              field: 'NoiSinh',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Giới tính',
              field: 'GioiTinhText',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Dân tộc',
              field: 'DanToc',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Tôn giáo',
              field: 'TonGiao',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Quốc tịch',
              field: 'QuocTich',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Tình trạng hôn nhân',
              field: 'TinhTrangHonNhan',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'CMND/CCCD',
          columns: [
            {
              title: 'Số',
              field: 'CMTND',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày cấp',
              field: 'NgayCap',
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
              title: 'Nơi cấp',
              field: 'NoiCap',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'ĐỊA CHỈ',
          columns: [
            {
              title: 'Đ/c thường trú (Theo sổ HK)',
              field: 'DcThuongTru',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Đ/c tạm trú (Đ/c hiện tại sinh sống)',
              field: 'DcTamTru',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'THÔNG TIN LIÊN HỆ',
          columns: [
            {
              title: 'SĐT cá nhân',
              field: 'SDTCaNhan',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Email cá nhân',
              field: 'EmailCaNhan',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'SĐT công ty cấp',
              field: 'SDTCongTy',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Email công ty cấp',
              field: 'EmailCongTy',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Họ tên người thân liên hệ khi cần',
              field: 'NguoiLienHeKhiCan',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Mối quan hệ',
              field: 'MoiQuanHe',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'SĐT của người thân',
              field: 'SDTNguoiThan',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'TRÌNH ĐỘ',
          columns: [
            {
              title: 'Trường',
              field: 'SchoolName',
              editor: 'input',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Cấp bậc',
              field: 'RankType',
              editor: 'list' as any,
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (value == 1) {
                  return 'Đại học';
                } else if (value == 2) {
                  return 'Cao đẳng';
                } else if (value == 3) {
                  return 'Trung cấp';
                }
                return value;
              },
            },
            {
              title: 'Loại hình đào tạo',
              field: 'TrainType',
              editor: 'list' as any,
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (value == 1) {
                  return 'Đào tạo chính quy';
                } else if (value == 2) {
                  return 'Đào tạo nghề';
                } else if (value == 3) {
                  return 'Đào tạo từ xa';
                } else if (value == 4) {
                  return 'Đào tạo liên kết quốc tế';
                } else if (value == 5) {
                  return 'Đào tạo thường xuyên';
                } else if (value == 6) {
                  return 'Đào tạo theo nhu cầu doanh nghiệp';
                }
                return value;
              },
            },
            {
              title: 'Chuyên ngành',
              field: 'Major',
              editor: 'input',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Năm tốt nghiệp',
              field: 'YearGraduate',
              editor: 'input',
              hozAlign: 'right',
              headerHozAlign: 'center',
            },
            {
              title: 'Xếp loại',
              field: 'Classification',
              editor: 'list' as any,
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (value == 1) {
                  return 'Xuất sắc';
                } else if (value == 2) {
                  return 'Giỏi';
                } else if (value == 3) {
                  return 'Khá';
                } else if (value == 4) {
                  return 'Trung bình';
                } else if (value == 5) {
                  return 'Yếu';
                }
                return value;
              },
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Loại hợp đồng hiện tại',
              field: 'LoaiHDLD',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Tình trạng kí hợp đồng',
              field: 'TinhTrangKyHD',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày vào',
              field: 'DateStartContractTV',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();
                return value
                  ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                  : '';
              },
            },
          ],
        },
        {
          title: 'NGÀY VÀO/ THỬ VIỆC',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'DateStartContractTV',
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
              title: 'Ngày kết thúc',
              field: 'DateEndContractTV',
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
              title: 'Số HĐ',
              field: 'ContractNumberTV',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'HĐLĐ XĐTH 12T',
          columns: [
            {
              title: 'Ngày hiệu lực',
              field: 'DateStartContractOneYear',
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
              title: 'Ngày kết thúc',
              field: 'DateEndContractOneYear',
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
              title: 'Số HĐ',
              field: 'ContractNumberOneYear',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'HĐLĐ XĐTH 36T',
          columns: [
            {
              title: 'Ngày hiệu lực',
              field: 'DateStartContractThreeYear',
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
              title: 'Ngày kết thúc',
              field: 'DateEndContractThreeYear',
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
              title: 'Số HĐ',
              field: 'ContractNumberThreeYear',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'HĐLĐ KXĐTH',
          columns: [
            {
              title: 'Ngày hiệu lực',
              field: 'DateStartContract',
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
              title: 'Số HĐ',
              field: 'ContractNumber',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Ngày nghỉ việc',
              field: 'STT',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();
                return '';
              },
            },
          ],
        },
        {
          title: 'BHXH',
          columns: [
            {
              title: '',
              columns: [
                {
                  title: 'Số sổ',
                  field: 'SoSoBHXH',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                },
                {
                  title: 'Người giữ sổ',
                  field: 'NguoiGiuSoBHXHText',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                },
                {
                  title: 'Ngày bắt đầu đóng tại công ty',
                  field: 'NgayBatDauBHXHCty',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter: (cell) => {
                    const value = cell.getValue();
                    return value
                      ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                      : '';
                  },
                },
              ],
            },
            {
              title: 'Hợp đồng lao động (dùng đóng BHXH)',
              columns: [
                {
                  title: 'Ngày bắt đầu',
                  field: 'NgayBatDauBHXH',
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
                  title: 'Ngày kết thúc',
                  field: 'NgayKetThucBHXH',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter: (cell) => {
                    const value = cell.getValue();
                    return value
                      ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                      : '';
                  },
                },
              ],
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Mức đóng hiện tại',
              field: 'MucDongBHXHHienTai',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'LƯƠNG',
          columns: [
            {
              title: '',
              columns: [
                {
                  title: 'Lương thử việc',
                  field: 'LuongThuViec',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Lương CB',
                  field: 'LuongCoBan',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
              ],
            },
            {
              title: 'Phụ cấp',
              columns: [
                {
                  title: 'Ăn ca',
                  field: 'AnCa',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Xăng xe',
                  field: 'XangXe',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Điện thoại',
                  field: 'DienThoai',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Nhà ở',
                  field: 'NhaO',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Trang phục',
                  field: 'TrangPhuc',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Chuyên cần',
                  field: 'ChuyenCan',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Khác',
                  field: 'Khac',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
                {
                  title: 'Tổng phụ cấp',
                  field: 'TongPhuCap',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
              ],
            },
            {
              title: '',
              columns: [
                {
                  title: 'Tổng lương',
                  field: 'TongLuong',
                  hozAlign: 'left',
                  headerHozAlign: 'center',
                  formatter(cell) {
                    const value = cell.getValue();
                    if (value === null || value === undefined) return 'đ0';
                    return (
                      'đ' +
                      value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    );
                  },
                },
              ],
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Giảm trừ bản thân',
              field: 'GiamTruBanThan',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                if (value === null || value === undefined) return 'đ0';
                return (
                  'đ' +
                  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                );
              },
            },
          ],
        },
        {
          title: 'GIẢM TRỪ GIA CẢNH',
          columns: [
            {
              title: 'Số người PT',
              field: 'SoNguoiPT',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                if (value === null || value === undefined) return 'đ0';
                return (
                  'đ' +
                  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                );
              },
            },
            {
              title: 'Tổng tiền',
              field: 'TongTien',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter(cell) {
                const value = cell.getValue();
                if (value === null || value === undefined) return 'đ0';
                return (
                  'đ' +
                  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                );
              },
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'MST cá nhân',
              field: 'MST',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'STK chuyển lương',
              field: 'STKChuyenLuong',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'CHECK LIST HỒ SƠ',
          columns: [
            {
              title: 'SYLL',
              field: 'SYLL',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Giấy KS',
              field: 'GiayKS',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'CMND/CCCD',
              field: 'CMNDorCCCD',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Số HK',
              field: 'SoHK',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Giấy KSK',
              field: 'GiayKSK',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'XNNS',
              field: 'XNNS',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Bằng cấp (photo công chứng)',
              field: 'BangCap',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'CV',
              field: 'CV',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'ĐXV',
              field: 'DXV',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Cam kết TS (AD đ/v nữ)',
              field: 'CamKetTs',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Tờ trình TD',
              field: 'ToTrinhTD',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'Thư mời nhận việc',
              field: 'ThuMoiNhanViec',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'QĐTD',
              field: 'QDTD',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'HĐTV',
              field: 'HDTV',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'ĐG TV',
              field: 'DGTV',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'HĐLĐ XĐTH (12T)',
              field: 'HDLDXDTHYear',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'ĐG chuyển HĐ 12T',
              field: 'DGChuyenHDYear',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'HĐLĐ XĐTH (36T)',
              field: 'HDLDXDTH',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'ĐG chuyển HĐ 36T',
              field: 'DGChuyenHD',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
            {
              title: 'HĐLĐ KXĐTH',
              field: 'HDLDKXDTH',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Tình trạng cấp phát đồng phục',
              field: 'TinhTrangCapDongPhuc',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: 'tickCross',
              formatterParams: {
                allowEmpty: true,
                allowTruthy: true,
                tickElement: '<i class="fas fa-check"></i>',
                crossElement: '',
              },
            },
          ],
        },
        {
          title: 'BỔ NHIỆM',
          columns: [
            {
              title: 'Số QĐ',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày HL',
              field: '',
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
              title: 'Lý do bổ nhiệm',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'MIỄN NHIỆM',
          columns: [
            {
              title: 'Số QĐ',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày HL',
              field: '',
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
              title: 'Lý do miễn nhiệm',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'THUYÊN CHUYỂN',
          columns: [
            {
              title: 'Số QĐ',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày HL',
              field: '',
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
              title: 'Lý do thuyên chuyển',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: 'NGHỈ VIỆC',
          columns: [
            {
              title: 'Số QĐ',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày HL',
              field: '',
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
              title: 'Lý do nghỉ',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Ghi chú',
              field: '',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do nghỉ',
              field: 'ReasonDeleted',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ],
        },
      ],
      rowFormatter: function (row) {
        //row - row component

        var data = row.getData();

        if (data['Status'] == 1) {
          row.getElement().style.backgroundColor = 'wheat';
          row.getElement().style.color = 'black';
        } else if (data['IsExpireContract'] == 1) {
          row.getElement().style.backgroundColor = 'yellow';
          row.getElement().style.color = 'black';
        } else if (data['IsExpireContract'] == 0.5) {
          row.getElement().style.backgroundColor = 'red';
          row.getElement().style.color = 'white';
        }
      },
    });
    this.loadEmployees();
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
            headerFormatter: function () {
              return "<i class='fas fa-plus' style='cursor:pointer;font-size:1.2rem;color:blue;' title='Thêm dòng'></i>";
            },
            headerClick: (e: any, column: any) => {
              this.addEducationRow();
            },
            cellClick: (e: any, cell: any) => {
              cell.getRow().delete();
            },
          } as any,
          {
            title: 'Trường',
            field: 'SchoolName',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Cấp bậc',
            field: 'RankType',
            editor: 'list' as any,
            editorParams: {
              values: {
                '1': 'Đại học',
                '2': 'Cao đẳng',
                '3': 'Trung cấp',
              },
            },
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value == 1) {
                return 'Đại học';
              } else if (value == 2) {
                return 'Cao đẳng';
              } else if (value == 3) {
                return 'Trung cấp';
              }
              return value;
            },
          },
          {
            title: 'Loại hình đào tạo',
            field: 'TrainType',
            editor: 'list' as any,
            editorParams: {
              values: {
                '1': 'Đào tạo chính quy',
                '2': 'Đào tạo nghề',
                '3': 'Đào tạo từ xa',
                '4': 'Đào tạo liên kết quốc tế',
                '5': 'Đào tạo thường xuyên',
                '6': 'Đào tạo theo nhu cầu doanh nghiệp',
              },
            },
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value == 1) {
                return 'Đào tạo chính quy';
              } else if (value == 2) {
                return 'Đào tạo nghề';
              } else if (value == 3) {
                return 'Đào tạo từ xa';
              } else if (value == 4) {
                return 'Đào tạo liên kết quốc tế';
              } else if (value == 5) {
                return 'Đào tạo thường xuyên';
              } else if (value == 6) {
                return 'Đào tạo theo nhu cầu doanh nghiệp';
              }
              return value;
            },
          },
          {
            title: 'Chuyên ngành',
            field: 'Major',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Năm tốt nghiệp',
            field: 'YearGraduate',
            editor: 'input',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Xếp loại',
            field: 'Classification',
            editor: 'list' as any,
            editorParams: {
              values: {
                '1': 'Xuất sắc',
                '2': 'Giỏi',
                '3': 'Khá',
                '4': 'Trung bình',
                '5': 'Yếu',
              },
            },
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value == 1) {
                return 'Xuất sắc';
              } else if (value == 2) {
                return 'Giỏi';
              } else if (value == 3) {
                return 'Khá';
              } else if (value == 4) {
                return 'Trung bình';
              } else if (value == 5) {
                return 'Yếu';
              }
              return value;
            },
          },
        ],
      });

      if (this.tabulatorEducation) {
        this.tabulatorEducation.on('tableBuilt', () => {
          // Load data after table is fully built
          this.employeeService
            .getEmployeeEducationLevelByEmployeeID(this.selectedEmployee.ID)
            .subscribe((data) => {
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
      GioiTinh: null,
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
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addEmployeeModal')
    );
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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên cần chỉnh sửa'
      );
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
      DvBHXH: this.selectedEmployee.DvBHXH||"",
      DiaDiemLamViec: this.selectedEmployee.DiaDiemLamViec,
      StartWorking: this.selectedEmployee.StartWorking,
      EmployeeTeamID: this.selectedEmployee.EmployeeTeamID,

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
      SoNguoiPT: this.selectedEmployee.SoNguoiPT || 0,
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

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addEmployeeModal')
    );
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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên muốn xóa!'
      );
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    // Reset form với ngày nghỉ việc mặc định là ngày hiện tại
    this.deleteForm.patchValue({
      EndWorking: new Date(),
      ReasonDeleted: '',
    });

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('deleteModal')
    );
    modal.show();
  }

  async deleteEmployee() {
    if (!this.deleteForm.get('EndWorking')?.value) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập ngày nghỉ việc!');
      return;
    }

    if (!this.deleteForm.get('ReasonDeleted')?.value) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do nghỉ việc!');
      return;
    }

    try {
      const updateData = {
        ...this.selectedEmployee,
        Status: 1,
        EndWorking: this.deleteForm.get('EndWorking')?.value,
        ReasonDeleted: this.deleteForm.get('ReasonDeleted')?.value,
      };

      this.employeeService.saveEmployee(updateData).subscribe({
        next: (response) => {
          this.notification.success(
            'Thành công',
            'Cập nhật trạng thái nhân viên thành công!'
          );
          this.closeDeleteModal();
          this.loadEmployees();
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            error.error.message || 'Có lỗi xảy ra khi cập nhật trạng thái nhân viên!'
          );
        },
      });
    } catch (error) {
      this.notification.error(
        'Lỗi',
        'Có lỗi xảy ra khi cập nhật trạng thái nhân viên!'
      );
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
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('positionContractModal')
    );
    modal.show();
  }

  openPositionInternalForm() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('positionInternalModal')
    );
    modal.show();
  }

  @ViewChild(EmployeeApproveComponent) employeeApprove!: EmployeeApproveComponent;
  openEmployeeApproveForm() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('employeeApprove')
    );
    modal.show();
    this.employeeApprove.ngOnInit();
  }
  @ViewChild(EmployeeImportExcelComponent) employeeImportExcelComponent!: EmployeeImportExcelComponent;
  openImportExcelForm() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('importExcelForm')
    );
    modal.show();
    this.employeeImportExcelComponent.ngOnInit();
  }

  @ViewChild(EmployeeTeamComponent) employeeTeamComponent!: EmployeeTeamComponent;
  openEmployeeTeamForm() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('employeeTeamForm'),
      {
        backdrop: false,
        keyboard: true
      }
    );
    modal.show();
    this.employeeTeamComponent.ngOnInit();
  }

  @ViewChild(EmployeeLoginManagerComponent) employeeLoginManagerComponent!: EmployeeLoginManagerComponent;
  openLoginManagerForm() {
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên cần quản lý đăng nhập!'
      );
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('loginManagerForm')
    );
    modal.show();
    this.employeeLoginManagerComponent.ngOnInit();
  }

  @ViewChild(EmployeeContractComponent) employeeContractComponent!: EmployeeContractComponent;
  openEmployeeContract() {
    const selectedRows = this.tabulatorEmployee.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên muốn xem hợp đồng lao động!'
      );
      return;
    }

    const selectedEmployee = selectedRows[0].getData();
    this.selectedEmployee = selectedEmployee;

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('employeeContractForm')
    );
    modal.show();
    this.employeeContractComponent.ngOnInit();
  }

  //#region Upload ảnh
  beforeUpload = (file: NzUploadFile): boolean => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Chỉ hỗ trợ file JPG/PNG!');
      return false;
    }
    const isLt2M = file.size! / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Kích thước ảnh phải nhỏ hơn 2MB!');
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
            AnhCBNV: img,
          });
        });
        break;
      case 'error':
        this.notification.error(NOTIFICATION_TITLE.error, 'Upload ảnh thất bại!');
        break;
    }
  }
  //#endregion

  //#region Hàm lưu dữ liệu
  onSubmit() {
    if (this.employeeForm.invalid) {
      Object.keys(this.employeeForm.controls).forEach((key) => {
        const control = this.employeeForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formData = this.employeeForm.getRawValue();
    const currentEducation = this.tabulatorEducation?.getData() || [];
    const toDateString = (date: any) =>
      date ? DateTime.fromJSDate(new Date(date)).toFormat("yyyy-MM-dd'T'00:00:00") : null;
    const employeeData = {
      ...formData,
      BirthOfDate: toDateString(formData.BirthOfDate),
      NgayCap: toDateString(formData.NgayCap),
      StartWorking: toDateString(formData.StartWorking),
      DateEndContractOneYear: toDateString(formData.DateEndContractOneYear),
      DateEndContractTV: toDateString(formData.DateEndContractTV),
      DateEndContractThreeYear: toDateString(formData.DateEndContractThreeYear),
      DateStartContract: toDateString(formData.DateStartContract),
      DateStartContractOneYear: toDateString(formData.DateStartContractOneYear),
      DateStartContractTV: toDateString(formData.DateStartContractTV),
      DateStartContractThreeYear: toDateString(formData.DateStartContractThreeYear),
      NgayBatDauBHXHCty: toDateString(formData.NgayBatDauBHXHCty),
      ContractNumberOneYear: formData.ContractNumberOneYear ?? '',
      ContractNumberTV: formData.ContractNumberTV ?? '',
      ContractNumberThreeYear: formData.ContractNumberThreeYear ?? '',
      EmployeeTeamID: formData.EmployeeTeamID ?? 0,
      EmployeeEducationLevels: currentEducation.map((education) => ({
        ID: education.ID || 0,
        EmployeeID: education.EmployeeID,
        SchoolName: education.SchoolName,
        RankType: education.RankType,
        TrainType: education.TrainType,
        Major: education.Major,
        YearGraduate: education.YearGraduate,
        Classification: education.Classification,
      })),
    };

    console.log("hihi", employeeData)
    // Lấy dữ liệu từ bảng education
    if (this.tabulatorEducation) {
      formData.educations = this.tabulatorEducation.getData();
    }

    if (this.isEditMode) {
      // Cập nhật nhân viên
      this.employeeService.saveEmployee(employeeData).subscribe({
        next: (response) => {
          this.notification.success(
            'Thành công',
            'Cập nhật nhân viên thành công'
          );
          this.closeModal();
          this.loadEmployees();
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            error.error?.message || 'Cập nhật nhân viên thất bại'
          );
        },
      });
    } else {
      // Thêm nhân viên mới
      this.employeeService.saveEmployee(employeeData).subscribe({
        next: (response) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm nhân viên thành công');
          this.loadEmployees();
          this.closeModal();
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            error.error?.message || 'Thêm nhân viên thất bại'
          );
        },
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
    let data = this.tabulatorEmployee.getData();
    if (data == null) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất excel'
      );
      return;
    }
    let date = DateTime.local().toFormat('ddMMyy');
    this.projectService.exportExcelGroup(this.tabulatorEmployee, data, 'DanhSachNhanSu', `DanhSachNhanSu_${date}`, 'DepartmentName');
  }
  //#endregion

  onSearch() {
    const searchData = this.searchForm.value;
    this.employeeService
      .filterEmployee(
        searchData.status || 0,
        searchData.department || 0,
        searchData.keyword || ''
      )
      .subscribe({
        next: (data: any) => {
          const result = Array.isArray(data.data) ? data.data : [data.data];
          this.tabulatorEmployee.setData(result);
        },
      });
  }

  resetSearch() {
    this.initSearchForm();
    this.loadEmployees();
  }

  //#region Sự kiện chức vụ hợp đồng / nội bộ
  closeModalPosition(status: number) {
    const modal = document.getElementById(status == 2 ? 'positionContractModal' : 'positionInternalModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.positionForm.reset({
      ID: 0,
      Code: '',
      Name: ''
    });
  }

  onSubmitPosition(status: number) {
    if (this.positionForm.invalid) {
      Object.values(this.positionForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }
    const formData = this.positionForm.value;
    if (status == 2) {
      this.positionService.savePositionContract(formData).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới chức vụ theo hợp đồng thành công');
          this.closeModalPosition(status);
          this.loadPositionContract();
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Thêm mới chức vụ theo hợp đồng thất bại');
        },
        complete: () => {
        }
      });
    } else {
      this.positionService.savePositionInternal(formData).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới chức vụ theo nội bộ thành công');
          this.closeModalPosition(status);
          this.loadPositionInternal();
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Thêm mới chức vụ theo nội bộ thất bại');
        },
        complete: () => {
        }
      });
    }

  }
  // 2 hợp đồng 1 thường
  savePosition(status: number) {
    this.onSubmitPosition(status);
  }
  //#endregion

  //#region Load team
  loadEmployeeTeam() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (data: any) => {
        this.employeeTeam = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Không thể tải danh sách team phòng ban');
      }
    })
  }

  addTeam() {
    const modalRef = this.modalService.open(TeamComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: true,
    });


    modalRef.result.catch((reason) => {
      this.loadEmployeeTeam();
    });
  }
  //#endregion

  trackByEmployeeId(index: number, item: any): any {
    return item.ID || index;
  }

  trackByTeamId(index: number, item: any): any {
    return item.ID || index;
  }
}

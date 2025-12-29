import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, Form } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { AuthService } from '../../../../../auth/auth.service';
import { EmployeeService } from '../../../employee/employee-service/employee.service';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { OnChangeType } from 'ng-zorro-antd/core/types';
import { VehiceDetailComponent } from '../vehice-detail/vehice-detail.component';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../../../services/app-user.service';
import { WFHService } from '../../employee-wfh/WFH-service/WFH.service';
@Component({
  selector: 'app-employee-bussiness-detail',
  templateUrl: './employee-bussiness-detail.component.html',
  styleUrls: ['./employee-bussiness-detail.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    FormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
    NzSplitterModule,
    NgIf,
    NzSpinModule,
    NzUploadModule,
    NzMessageModule,
  ]
})
export class EmployeeBussinessDetailComponent implements OnInit, AfterViewInit, OnChanges {

  @Output() employeeBussinessData = new EventEmitter<void>();
  @Input() detailData: any[] = [];
  @ViewChild('tbEmployeeBussinessDetail', { static: false }) tabContainer!: ElementRef;
  private tabulator!: Tabulator;
  private initRetryCount = 0;
  private readonly MAX_INIT_RETRIES = 10;
  isLoading = false;
  isSaving = false; // Flag để track trạng thái đang lưu
  employeeList: any[] = [];
  employeeGroups: { label: string; options: any[] }[] = [];
  approverList: any[] = [];
  approverGroups: { label: string; options: any[] }[] = [];
  searchForm!: FormGroup;
  employeeBussinessDetail: any[] = [];
  employeeTypeBussinessList: any[] = [];
  vehicleList: any[] = []; // Danh sách phương tiện
  listId: number[] = []; // Danh sách ID cần xóa
  hasDataChanges = false; // Flag để kiểm tra có thay đổi không
  
  // Đăng ký bổ sung và upload file
  isProblem = false;
  selectedFile: File | null = null;
  uploadedFileData: any = null;
  tempFileRecord: any = null;
  existingFileRecord: any = null;
  fileList: any[] = [];
  existingFiles: any[] = [];
  deletedFileIds: number[] = [];
  deletedFiles: any[] = [];
  attachFileName: string = '';
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService,
    private employeeBussinessService: EmployeeBussinessService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private appUserService: AppUserService,
    private wfhService: WFHService,
    private message: NzMessageService,
    private authService: AuthService,
  ) { }

  overNightTypeList = [
    { value: 0, label: 'Không có' },
    { value: 1, label: 'Từ sau 20h' },
    { value: 2, label: 'Theo loại CT' },
  ];

  ngOnInit() {
    this.initRetryCount = 0; // Reset retry count
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    this.getCurrentUser();
    // Load vehicleList trước để có dữ liệu khi map VehicleID
    this.loadVehicleList(() => {
      // Sau khi vehicleList load xong, mới load detailData
      this.loadDetailData();
    });
    this.loadEmployeeBussinessType();
  }

  ngAfterViewInit(): void {
    // Đợi modal render xong và element sẵn sàng
    setTimeout(() => {
      this.initializeTabulator();
      // Đảm bảo vehicleList đã được load trước khi loadDetailData
      if (this.vehicleList.length > 0) {
        this.loadDetailData();
      } else {
        // Nếu vehicleList chưa load, đợi load xong rồi mới loadDetailData
        this.loadVehicleList(() => {
          this.loadDetailData();
        });
      }
    }, 300);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initRetryCount = 0; // Reset retry count
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    // Load vehicleList trước để có dữ liệu khi map VehicleID
    this.loadVehicleList(() => {
      // Sau khi vehicleList load xong, mới load detailData
      this.loadDetailData();
      // Khởi tạo lại tabulator nếu chưa có hoặc đã bị destroy
      if (!this.tabulator) {
        setTimeout(() => {
          this.initializeTabulator();
        }, 200);
      }
    });
    this.loadEmployeeBussinessType();
  }

  loadDetailData() {
    this.listId = []; // Reset list ID cần xóa
    this.hasDataChanges = false; // Reset flag thay đổi
    
    // Reset file data
    this.existingFiles = [];
    this.existingFileRecord = null;
    this.attachFileName = '';
    this.selectedFile = null;
    this.tempFileRecord = null;
    this.fileList = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];

    // Set form values from the first item in detail data
    const firstItem = this.detailData[0];
    if (firstItem != null) {
      // Set IsProblem từ dữ liệu
      this.isProblem = firstItem['IsProblem'] || false;
      
      this.searchForm.patchValue({
        employeeId: firstItem['EmployeeID'] ?? 0,
        approverId: firstItem['ApprovedID'] ?? 0,
        dateRegister: new Date(firstItem['DayBussiness']),
        isProblem: this.isProblem
      });

      // Disable employee và approver khi có dữ liệu
      this.searchForm.get('employeeId')?.disable();
      this.searchForm.get('approverId')?.disable();
      
      // Load file đính kèm nếu có ID
      if (firstItem['ID'] && firstItem['ID'] > 0) {
        this.loadFilesByBussinessID(firstItem['ID']);
      }
    } else {
      // Enable khi không có dữ liệu
      this.searchForm.get('employeeId')?.enable();
      this.searchForm.get('approverId')?.enable();
      this.isProblem = false;
      this.searchForm.patchValue({
        employeeId: null,
        approverId: null,
        dateRegister: new Date(),
        isProblem: false
      });
    }

    // Map VehicleID và tính toán chi phí
    this.mapVehicleIDAndCalculateCost();

    // Load data into tabulator
    if (this.tabulator && this.detailData.length > 0) {
      this.tabulator.setData(this.detailData);
    } else {
      // Nếu chưa có Tabulator → lưu dữ liệu tạm
      this.employeeBussinessDetail = this.detailData;
    }
  }

  // Hàm riêng để map VehicleID và tính toán chi phí
  mapVehicleIDAndCalculateCost() {
    if (this.detailData && this.detailData.length > 0 && this.vehicleList.length > 0) {
      this.detailData.forEach((item, idx) => {
        item.STT = idx + 1;

        let vehicle: any = null;

        // Ưu tiên tìm theo VehicleID nếu có
        if (item.VehicleID && item.VehicleID > 0) {
          vehicle = this.vehicleList.find((v: any) => v.value === item.VehicleID || v.value === parseInt(item.VehicleID));
        }

        // Nếu không tìm thấy theo VehicleID, tìm theo VehicleName
        if (!vehicle && item.VehicleName && item.VehicleName.trim() !== '') {
          vehicle = this.vehicleList.find((v: any) => {
            if (v.vehicleData && v.vehicleData.VehicleName) {
              const vehicleName = v.vehicleData.VehicleName.trim();
              const itemVehicleName = item.VehicleName.trim();
              return vehicleName === itemVehicleName ||
                vehicleName.toLowerCase() === itemVehicleName.toLowerCase();
            }
            return false;
          });
        }

        // Cập nhật VehicleID, VehicleName và TotalCostVehicle
        if (vehicle && vehicle.value) {
          item.VehicleID = vehicle.value;
          if (vehicle.vehicleData) {
            // Cập nhật VehicleName từ vehicleData
            if (vehicle.vehicleData.VehicleName) {
              item.VehicleName = vehicle.vehicleData.VehicleName;
            }
            // Cập nhật TotalCostVehicle từ Cost
            if (vehicle.vehicleData.Cost != null && vehicle.vehicleData.Cost !== undefined) {
              item.TotalCostVehicle = parseFloat(vehicle.vehicleData.Cost) || 0;
            }
          }
        } else {
          // Nếu không tìm thấy, reset về 0
          if (!item.VehicleID || item.VehicleID === 0) {
            item.VehicleID = 0;
            item.VehicleName = '';
            item.TotalCostVehicle = 0;
          }
        }

        // Tính toán TotalCost cho mỗi dòng
        this.calculateTotalCostForRow(item);
      });
    } else if (this.detailData && this.detailData.length > 0) {
      // Nếu vehicleList chưa có, chỉ tính STT và TotalCost
      this.detailData.forEach((item, idx) => {
        item.STT = idx + 1;
        this.calculateTotalCostForRow(item);
      });
    }
  }

  private initSearchForm() {
    this.searchForm = this.fb.group({
      approverId: null,
      employeeId: null,
      dateRegister: new Date(),
      isProblem: [false]
    });
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;
          this.currentUser = Array.isArray(data) ? data[0] : data;
        }
      },
      error: () => {}
    });
  }

  onIsProblemChange(checked: boolean) {
    this.isProblem = checked;
    this.searchForm.patchValue({ isProblem: checked });
    
    if (!checked) {
      // Khi bỏ chọn đăng ký bổ sung, xóa file đã chọn
      this.selectedFile = null;
      this.uploadedFileData = null;
      this.tempFileRecord = null;
      this.fileList = [];
      if (!this.existingFileRecord) {
        this.attachFileName = '';
      }
    }
  }

  // Xử lý khi chọn file với nz-upload
  beforeUpload = (file: any): boolean => {
    if (this.existingFiles.length > 0) {
      this.existingFiles.forEach(existingFile => {
        if (existingFile.ID && existingFile.ID > 0 && !this.deletedFileIds.includes(existingFile.ID)) {
          this.deletedFileIds.push(existingFile.ID);
          this.deletedFiles.push({
            ...existingFile,
            IsDeleted: true
          });
        }
      });
      this.existingFiles = [];
      this.existingFileRecord = null;
    }
    
    this.selectedFile = null;
    this.tempFileRecord = null;
    this.uploadedFileData = null;
    this.fileList = [file];
    this.selectedFile = file;
    this.attachFileName = file.name;
    return false;
  };

  removeFile() {
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.attachFileName = '';
    this.tempFileRecord = null;
    this.fileList = [];
  }

  // Xóa file đính kèm đã có
  deleteExistingFile(fileId: number) {
    const fileToDelete = this.existingFiles.find(f => f.ID === fileId);
    if (!fileToDelete) {
      return;
    }

    if (fileId > 0 && !this.deletedFileIds.includes(fileId)) {
      this.deletedFileIds.push(fileId);
      this.deletedFiles.push({
        ...fileToDelete,
        IsDeleted: true
      });
    }
    
    this.existingFiles = this.existingFiles.filter(f => f.ID !== fileId);
    
    const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));
    
    if (remainingFiles.length === 0) {
      this.existingFileRecord = null;
      this.attachFileName = '';
    } else {
      const firstFile = remainingFiles[0];
      this.existingFileRecord = {
        ID: firstFile.ID || 0,
        EmployeeBussinessID: firstFile.EmployeeBussinessID || 0,
        FileName: firstFile.FileName || '',
        OriginPath: firstFile.OriginPath || '',
        ServerPath: firstFile.ServerPath || ''
      };
      this.attachFileName = firstFile.FileName || firstFile.OriginPath || '';
    }
  }

  // Load danh sách file đính kèm
  loadFilesByBussinessID(bussinessID: number) {
    if (!bussinessID || bussinessID <= 0) {
      this.existingFiles = [];
      return;
    }

    this.employeeBussinessService.getFileByID(bussinessID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.existingFiles = Array.isArray(response.data) ? response.data : [response.data];
          
          if (this.existingFiles.length > 0) {
            const firstFile = this.existingFiles[0];
            this.existingFileRecord = {
              ID: firstFile.ID || 0,
              EmployeeBussinessID: firstFile.EmployeeBussinessID || 0,
              FileName: firstFile.FileName || '',
              OriginPath: firstFile.OriginPath || '',
              ServerPath: firstFile.ServerPath || ''
            };
            this.attachFileName = firstFile.FileName || firstFile.OriginPath || '';
          }
        } else {
          this.existingFiles = [];
        }
      },
      error: () => {
        this.existingFiles = [];
      }
    });
  }

  // Tạo subpath dựa trên ngày công tác và code nhân viên
  private generateSubPath(dayBussiness: Date, employeeCode: string): string {
    const date = new Date(dayBussiness);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const monthName = `Tháng ${month}`;
    const dayFormatted = `Ngày ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
    return `Năm ${year}\\${monthName}\\${dayFormatted}\\${employeeCode}\\`;
  }

  loadEmployee() {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res) => {
        if (res && res.status === 1 && res.data) {
          // Lưu danh sách employee gốc (để tương thích với code cũ nếu cần)
          this.employeeList = res.data.employees || [];
          const empGroups: { [key: string]: any[] } = {};
          (res.data.employees || []).forEach((emp: any) => {
            const dept = emp.DepartmentName || 'Không xác định';
            if (!empGroups[dept]) empGroups[dept] = [];
            empGroups[dept].push({
              ID: emp.EmployeeID || emp.ID,
              FullName: emp.FullName,
              DepartmentName: emp.DepartmentName,
              Code: emp.Code,
            });
          });

          // Sort employees within each group by Code
          Object.keys(empGroups).forEach((dept) => {
            empGroups[dept].sort((a, b) => (a.Code || '').localeCompare(b.Code || ''));
          });

          // Sort groups by department name
          this.employeeGroups = Object.keys(empGroups)
            .sort((a, b) => a.localeCompare(b))
            .map((dept) => ({
              label: `Phòng ban: ${dept}`,
              options: empGroups[dept],
            }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không thể tải dữ liệu nhân viên');
          this.employeeList = [];
          this.employeeGroups = [];
        }
      },
      error: (error: any) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách nhân viên");
        this.employeeList = [];
        this.employeeGroups = [];
      }
    });
  }

  loadApprover() {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res) => {
        if (res && res.status === 1 && res.data) {
          // Lưu danh sách approver gốc (để tương thích với code cũ nếu cần)
          this.approverList = res.data.approvers || [];

          // Group approvers by DepartmentName
          const apprGroups: { [key: string]: any[] } = {};
          (res.data.approvers || []).forEach((appr: any) => {
            const dept = appr.DepartmentName || 'Không xác định';
            if (!apprGroups[dept]) apprGroups[dept] = [];
            apprGroups[dept].push({
              ID: appr.EmployeeID,
              FullName: appr.FullName,
              DepartmentName: appr.DepartmentName,
              Code: appr.Code,
            });
          });

          // Sort approvers within each group by Code
          Object.keys(apprGroups).forEach((dept) => {
            apprGroups[dept].sort((a, b) => (a.Code || '').localeCompare(b.Code || ''));
          });

          // Sort groups by department name
          this.approverGroups = Object.keys(apprGroups)
            .sort((a, b) => a.localeCompare(b))
            .map((dept) => ({
              label: `Phòng ban: ${dept}`,
              options: apprGroups[dept],
            }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không thể tải dữ liệu người duyệt');
          this.approverList = [];
          this.approverGroups = [];
        }
      },
      error: (error: any) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách người duyệt");
        this.approverList = [];
        this.approverGroups = [];
      }
    });
  }

  // Filter function for employee select
  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const optionValue = option.nzValue;
    const employee = this.employeeGroups
      .flatMap(g => g.options)
      .find(e => e.ID === optionValue);
    
    if (!employee) return false;
    
    return (
      (employee.Code || '').toLowerCase().includes(searchText) ||
      (employee.FullName || '').toLowerCase().includes(searchText) ||
      (employee.DepartmentName || '').toLowerCase().includes(searchText)
    );
  };

  // Filter function for approver select
  filterApproverOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const optionValue = option.nzValue;
    const approver = this.approverGroups
      .flatMap(g => g.options)
      .find(a => a.ID === optionValue);
    
    if (!approver) return false;
    
    return (
      (approver.Code || '').toLowerCase().includes(searchText) ||
      (approver.FullName || '').toLowerCase().includes(searchText) ||
      (approver.DepartmentName || '').toLowerCase().includes(searchText)
    );
  };

  loadEmployeeBussinessType() {
    this.employeeBussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data) => {
        if (data.data && Array.isArray(data.data)) {
          this.employeeTypeBussinessList = data.data.map((type: any) => ({
            value: type.ID,
            label: `${type.TypeCode} - ${type.TypeName} - ${type.Cost}`,
            typeData: type
          }));
          console.log('employeeTypeBussinessList', this.employeeTypeBussinessList);
          if (this.tabulator) {
            this.destroyTabulator();
            this.initializeTabulator();
          }
        } else {
          this.employeeTypeBussinessList = [];
        }
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách loại công tác")
      }
    })
  }

  loadVehicleList(callback?: () => void) {
    this.employeeBussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (data: any) => {
        if (data.data && Array.isArray(data.data)) {
          // Thêm option "Không chọn" hoặc "Phương tiện khác"
          this.vehicleList = [
            { value: 0, label: '--Chọn phương tiện--', vehicleData: { ID: 0, VehicleName: '', Cost: 0 } },
            ...data.data
              .filter((item: any) => !item.IsDeleted)
              .map((item: any) => ({
                value: item.ID,
                label: `${item.VehicleName} - ${item.Cost?.toLocaleString('vi-VN')} ₫`,
                vehicleData: item
              }))
          ];

          // Map lại VehicleID sau khi vehicleList đã được load
          if (this.detailData && this.detailData.length > 0) {
            this.mapVehicleIDAndCalculateCost();
            // Reload data vào tabulator nếu đã khởi tạo
            if (this.tabulator) {
              this.tabulator.setData(this.detailData);
            }
          }

          // Cập nhật tabulator nếu đã khởi tạo
          if (this.tabulator) {
            const vehicleColumn = this.tabulator.getColumn('VehicleID');
            if (vehicleColumn) {
              const currentDef = vehicleColumn.getDefinition();
              vehicleColumn.updateDefinition({
                ...currentDef,
                editorParams: {
                  values: this.vehicleList
                }
              } as any);
            }
          }

          // Gọi callback nếu có
          if (callback) {
            callback();
          }
        } else {
          this.vehicleList = [{ value: 0, label: '--Chọn phương tiện--', vehicleData: { ID: 0, VehicleName: '', Cost: 0 } }];
          if (callback) {
            callback();
          }
        }
      },
      error: (error: any) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách phương tiện");
        this.vehicleList = [{ value: 0, label: '--Chọn phương tiện--', vehicleData: { ID: 0, VehicleName: '', Cost: 0 } }];
        if (callback) {
          callback();
        }
      }
    });
  }

  private destroyTabulator() {
    if (this.tabulator) {
      this.tabulator.destroy();
      this.tabulator = null as any;
    }
  }

  resetSTT() {
    const rows = this.tabulator.getRows();
    rows.forEach((row, index) => {
      row.update({ STT: index + 1 });
    });
  }


  private initializeTabulator(): void {
    // Kiểm tra element tồn tại trước khi khởi tạo
    const element = document.getElementById('tb_employee_bussiness_detail');
    if (!element) {
      this.initRetryCount++;
      if (this.initRetryCount < this.MAX_INIT_RETRIES) {
        console.warn(`Element #tb_employee_bussiness_detail not found, retrying... (${this.initRetryCount}/${this.MAX_INIT_RETRIES})`);
        // Thử lại sau một khoảng thời gian ngắn
        setTimeout(() => {
          this.initializeTabulator();
        }, 200);
      } else {
        console.error('Element #tb_employee_bussiness_detail not found after multiple retries');
      }
      return;
    }

    // Reset retry count khi tìm thấy element
    this.initRetryCount = 0;

    // Nếu đã có tabulator, destroy trước
    if (this.tabulator) {
      try {
        this.tabulator.destroy();
      } catch (e) {
        console.warn('Error destroying existing tabulator:', e);
      }
    }

    try {
      this.tabulator = new Tabulator('#tb_employee_bussiness_detail', {
      data: this.employeeBussinessDetail, // Initialize with empty array
      layout: 'fitDataStretch',
      height: '82vh',
      columns: [
        {
          title: '',
          field: 'addRow',
          headerSort: false,
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            let id = data['ID'];
            return id <= 0 || id == null
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },

          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            const id = rowData.ID || 0;
            if (id > 0) {
              // Thêm vào listId để xóa sau
              if (!this.listId.includes(id)) {
                this.listId.push(id);
              }
            }
            cell.getRow().delete();
            this.resetSTT();
            this.hasDataChanges = true;
          }
        } as any,
        { title: 'STT', field: 'STT', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
        {
          title: 'Địa điểm',
          field: 'Location',
          editor: 'input',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200, headerSort: false,

        },
        {
          title: 'Loại',
          field: 'TypeBusiness',
          editor: 'list',
          headerSort: false,
          editorParams: {
            values: this.employeeTypeBussinessList
          },
          formatter: (cell: any) => {

            const value = parseInt(cell.getValue());
            const type = this.employeeTypeBussinessList.find((emp: any) => emp.value === value);
            return type ? type.label : '--Chọn loại--';
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            // Sử dụng setTimeout để đảm bảo giá trị đã được cập nhật vào row data
            setTimeout(() => {
              this.setTotalCost(row);
            }, 10);
          },
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 350
        },
        {
          title: 'Xuất phát trước 7h15',
          field: 'WorkEarly',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            // Add event listener to update cell value when checkbox changes
            input.addEventListener('change', () => {
              cell.setValue(input.checked); 
              const row = cell.getRow();
              this.setTotalCost(row);
            });

            return input;
          },
          // Ensure the cell's value is always a boolean
          mutator: function (value) {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },
        {
          title: 'Phụ cấp ăn tối',
          field: 'OvernightType',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 300,
          editor: 'list',
          editorParams: {
            values: this.overNightTypeList
          },
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const type = this.overNightTypeList.find((ov: any) => ov.value === value);
            return type ? type.label : value;
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            // Sử dụng setTimeout để đảm bảo giá trị đã được cập nhật vào row data
            setTimeout(() => {
              this.setTotalCost(row);
            }, 10);
          }
        },
        {
          title: 'Không chấm công tại VP',
          field: 'NotChekIn',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 180,
          headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            input.addEventListener('change', () => {
              cell.setValue(input.checked);
            });

            return input;
          },
          headerWordWrap: true,
          // Ensure the cell's value is always a boolean
          mutator: function (value) {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },

        {
          title: 'Phương tiện',
          field: 'VehicleID',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          editor: 'list',
          editorParams: {
            values: this.vehicleList
          },
          formatter: (cell: any) => {
            const value = parseInt(cell.getValue()) || 0;
            const vehicle = this.vehicleList.find((v: any) => v.value === value);
            return vehicle ? vehicle.vehicleData?.VehicleName || vehicle.label : '--Chọn phương tiện--';
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            const vehicleID = parseInt(cell.getValue()) || 0;
            const vehicle = this.vehicleList.find((v: any) => v.value === vehicleID);

            if (vehicle && vehicle.vehicleData) {
              const vehicleName = vehicle.vehicleData.VehicleName || '';
              const vehicleCost = parseFloat(vehicle.vehicleData.Cost) || 0;

              row.update({
                VehicleID: vehicleID,
                VehicleName: vehicleName,
                TotalCostVehicle: vehicleCost
              });

              // Tính lại tổng chi phí
              this.setTotalCost(row);
            } else {
              // Nếu không chọn hoặc chọn "Không chọn"
              row.update({
                VehicleID: 0,
                VehicleName: '',
                TotalCostVehicle: 0
              });
              this.setTotalCost(row);
            }
          }
        },
          { title: 'Lý do công tác', field: 'Reason', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false,formatter:'textarea' },
        {
          title: 'Tổng chi phí phương tiện',
          field: 'TotalCostVehicle',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          editor: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return '0 ₫';
          }
        },
        {
          title: 'Tổng chi phí',
          field: 'TotalCost',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          editor: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return '0 ₫';
          }
        },
        // {
        //   title: 'Thêm phương tiện',
        //   field: 'openModal',
        //   hozAlign: 'center',
        //   headerHozAlign: 'center',
        //   headerWordWrap: true,
        //   headerSort: false,
        //   width: 60,
        //   formatter: (cell: any) => {
        //     return `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        //     <i class="fas fa-plus text-success cursor-pointer" title="Thêm phương tiện"></i></div>`;
        //   },

        //   cellClick: (e: any, cell: any) => {
        //     const rowData = cell.getRow().getData();
        //     this.editVehiceDetail(rowData);
        //   }
        // },
        { title: 'Lý do sửa', field: 'ReasonHREdit', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },
        { title: 'Ghi chú', field: 'Note', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },

      ]
      });
    } catch (error) {
      console.error('Error initializing Tabulator:', error);
      return;
    }

    // Chỉ đăng ký events nếu tabulator được khởi tạo thành công
    if (this.tabulator) {
      this.tabulator.on('cellEdited', (cell: any) => {
        const field = cell.getField();
        const row = cell.getRow();
        const rowData = row.getData();
        
        // Nếu là dòng đã tồn tại (ID > 0) và không phải đang edit field ReasonHREdit
        // thì kiểm tra lý do sửa
        if (rowData.ID > 0 && field !== 'ReasonHREdit') {
          const isAdmin = this.appUserService.isAdmin;
          if (!isAdmin) {
            const reasonHREdit = rowData.ReasonHREdit || '';
            if (!reasonHREdit || reasonHREdit.trim() === '') {
              const stt = rowData.STT || row.getPosition() + 1;
              this.notification.warning(
                NOTIFICATION_TITLE.error, 
                `Vui lòng nhập Lý do sửa cho dòng [STT: ${stt}]!`
              );
              // Focus vào cell ReasonHREdit
              setTimeout(() => {
                const reasonCell = row.getCell('ReasonHREdit');
                if (reasonCell) {
                  reasonCell.edit();
                }
              }, 100);
            }
          }
        }
        
        this.hasDataChanges = true;
        this.employeeBussinessDetail = this.tabulator!.getData();
      });

      this.tabulator.on('dataChanged', () => {
        this.hasDataChanges = true;
        this.employeeBussinessDetail = this.tabulator!.getData();
        
        // Kiểm tra các dòng đã tồn tại (ID > 0) có lý do sửa chưa
        const allData = this.tabulator.getData();
        allData.forEach((rowData: any, index: number) => {
          if (rowData.ID > 0) {
            const reasonHREdit = rowData.ReasonHREdit || '';
            if (!reasonHREdit || reasonHREdit.trim() === '') {
              const stt = rowData.STT || (index + 1);
              // Chỉ hiển thị warning một lần, không spam
              setTimeout(() => {
                this.notification.warning(
                  NOTIFICATION_TITLE.error, 
                  `Vui lòng nhập Lý do sửa cho dòng [STT: ${stt}]!`
                );
              }, 100);
            }
          }
        });
      });

      this.tabulator.on('rowDeleted', () => {
        this.hasDataChanges = true;
        this.resetSTT();
      });
    }
  }

  editVehiceDetail(rowData: any) {
    const id = rowData?.ID || 0;

    // Cho phép mở modal ngay cả khi tạo mới (ID <= 0)
    // Nếu là tạo mới, sẽ dùng ID tạm thời hoặc 0
    const tempId = id > 0 ? id : 0;

    const modalRef = this.modalService.open(VehiceDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.employeeBussinessId = tempId;
    modalRef.componentInstance.bussinessInfo = {
      ID: tempId,
      FullName: this.employeeList.find(e => e.ID === this.searchForm.getRawValue().employeeId)?.FullName || '',
      TypeBussiness: this.employeeTypeBussinessList.find(t => t.value === rowData.TypeBusiness)?.label || '',
      Location: rowData.Location || '',
      DayBussiness: this.searchForm.getRawValue().dateRegister
    };

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          // Cập nhật VehicleName và TotalCostVehicle từ kết quả
          const vehicleInfo = result.vehicleInfo;
          if (vehicleInfo) {
            const row = this.tabulator.getRows().find(r => r.getData()['ID'] === id);
            if (row) {
              const vehicleName = vehicleInfo.VehicleName || '';
              const totalCost = vehicleInfo.TotalCost || 0;
              row.update({
                VehicleName: vehicleName,
                TotalCostVehicle: totalCost
              });
              this.setTotalCost(row);
              this.hasDataChanges = true;
            }
          }
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  addRow() {
    if (this.tabulator) {
      const data = this.tabulator.getData();
      // Tìm STT lớn nhất hiện tại, nếu chưa có thì là 0
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tabulator.addRow({
        STT: maxSTT + 1,
        TypeBusiness: -1,
        VehicleID: 0,
        VehicleName: '',
        TotalCostVehicle: 0,
        TotalCost: 0
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('employeeBussinessModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

  checkValidate(): boolean {
    const formValue = this.searchForm.getRawValue(); // getRawValue để lấy cả disabled fields

    if (!formValue.employeeId || formValue.employeeId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên');
      return false;
    }

    if (!formValue.approverId || formValue.approverId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn người duyệt');
      return false;
    }

    if (!formValue.dateRegister) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn ngày đăng ký');
      return false;
    }

    // Validate từng dòng trong bảng
    const rows = this.tabulator.getRows();
    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i].getData();
      const stt = rowData['STT'] || (i + 1);

      // Validate Location
      if (!rowData['Location'] || rowData['Location'].trim() === '') {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Địa điểm [STT: ${stt}]!`);
        return false;
      }

      // Validate TypeBusiness
      if (!rowData['TypeBusiness'] || rowData['TypeBusiness'] <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng chọn Loại [STT: ${stt}]!`);
        return false;
      }

      // Validate VehicleName nếu ID > 0 và có VehicleID được chọn
      if (rowData['ID'] > 0 && rowData['VehicleID'] > 0) {
        if (!rowData['VehicleName'] || rowData['VehicleName'].trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng chọn Phương tiện [STT: ${stt}]!`);
          return false;
        }
      }

      // Validate ReasonHREdit khi sửa (ID > 0) - bắt buộc cho tất cả user (không chỉ admin)
      if (rowData['ID'] > 0) {
        if (!rowData['ReasonHREdit'] || rowData['ReasonHREdit'].trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Lý do sửa [STT: ${stt}]!`);
          return false;
        }
      }
    }

    return true;
  }

  onSubmit() {
    if (!this.checkValidate()) {
      return;
    }

    // Set trạng thái đang lưu
    this.isSaving = true;

    const employeeBussiness = this.tabulator.getData() || [];
    const formValue = this.searchForm.getRawValue(); // getRawValue để lấy cả disabled fields
    const isProblemValue = this.isProblem;

    // Tính toán các chi phí cho từng dòng
    const formData = {
      EmployeeBussinesses: employeeBussiness.map(item => {
        // Lấy thông tin loại công tác
        const typeBussiness = this.employeeTypeBussinessList.find(t => t.value === item.TypeBusiness);
        const costBussiness = typeBussiness?.typeData?.Cost || 0;

        // Tính các chi phí
        const costWorkEarly = (item.WorkEarly === true || item.WorkEarly === 1 || item.WorkEarly === 'true') ? 50000 : 0;
        const costOvernight = (item.OvernightType > 0 && item.OvernightType !== 0) ? 35000 : 0;
        const costVehicle = item.TotalCostVehicle || 0;
        const totalMoney = costBussiness + costOvernight + costWorkEarly + costVehicle;

        return {
          ID: item.ID || 0,
          EmployeeID: formValue.employeeId ?? 0,
          ApprovedID: formValue.approverId ?? 0,
          DayBussiness: DateTime.fromJSDate(formValue.dateRegister).toFormat("yyyy-MM-dd'T'00:00:00") ?? DateTime.fromJSDate(new Date()).toFormat("yyyy-MM-dd'T'00:00:00"),
          TypeBusiness: item.TypeBusiness ?? 0,
          Location: item.Location ?? '',
          WorkEarly: item.WorkEarly ?? false,
          OvernightType: item.OvernightType ?? 0,
          NotChekIn: item.NotChekIn ?? false,
          VehicleID: item.VehicleID ?? 0,
          VehicleName: item.VehicleName ?? '',
          CostVehicle: item.TotalCostVehicle ?? 0,
          ReasonHREdit: item.ReasonHREdit ?? '',
          Note: item.Note ?? '',
          Reason: item.Reason ?? '',
          IsProblem: isProblemValue,
          CostBussiness: costBussiness,
          CostOvernight: costOvernight,
          CostWorkEarly: costWorkEarly,
          TotalMoney: totalMoney,
          Overnight: item.OvernightType > 0,
          DecilineApprove: item.ID > 0 ? undefined : 1, // Chỉ set khi insert mới
          IsApproved: item.ID > 0 ? false : undefined, // Reset khi update
          IsApprovedHR: item.ID > 0 ? false : undefined // Reset khi update
        };
      })
    };

    // Nếu có file mới, upload trước rồi save
    if (this.selectedFile) {
      this.uploadFileAndSave(formData.EmployeeBussinesses);
    } else {
      this.saveDataWithFile(formData.EmployeeBussinesses);
    }
  }

  // Upload file và sau đó save
  uploadFileAndSave(data: any[]): void {
    if (!this.selectedFile) {
      this.saveDataWithFile(data);
      return;
    }

    const formValue = this.searchForm.getRawValue();
    const employeeID = formValue.employeeId;
    const employee = this.employeeList.find(emp => emp.ID === employeeID);
    const employeeCode = employee?.Code || 'UNKNOWN';
    const dayBussiness = formValue.dateRegister ? new Date(formValue.dateRegister) : new Date();
    const subPath = this.generateSubPath(dayBussiness, employeeCode);

    const loadingMsg = this.message.loading(`Đang tải lên ${this.selectedFile.name}...`, {
      nzDuration: 0,
    }).messageId;

    this.employeeBussinessService.uploadMultipleFiles([this.selectedFile], subPath).subscribe({
      next: (res: any) => {
        this.message.remove(loadingMsg);

        if (res?.status === 1 && res?.data?.length > 0) {
          const uploadedFile = res.data[0];
          this.uploadedFileData = uploadedFile;
          
          const fileRecord: any = {
            ID: this.existingFileRecord?.ID || 0,
            EmployeeBussinessID: 0,
            FileName: uploadedFile.SavedFileName || uploadedFile.FileName || '',
            OriginPath: uploadedFile.OriginPath || uploadedFile.OriginalFileName || uploadedFile.OriginName || (this.selectedFile ? this.selectedFile.name : '') || '',
            ServerPath: uploadedFile.ServerPath || uploadedFile.FilePath || '',
          };

          this.tempFileRecord = fileRecord;
          this.saveDataWithFile(data);
        } else {
          this.message.remove(loadingMsg);
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Upload file thất bại!');
          this.isSaving = false;
        }
      },
      error: (err: any) => {
        this.message.remove(loadingMsg);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Upload file thất bại!');
        this.isSaving = false;
      },
    });
  }

  // Save employee bussiness và file
  saveDataWithFile(data: any[]): void {
    // Lưu dữ liệu
    this.employeeBussinessService.saveEmployeeBussiness(data).subscribe({
      next: (response: any) => {
        const savedIds = response?.data || [];
        
        // Nếu có file mới hoặc file đã tồn tại, lưu file cho từng bản ghi
        if (this.tempFileRecord || this.existingFileRecord) {
          this.saveFilesForRecords(savedIds, data);
        } else {
          this.processAfterSave();
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật đăng ký công tác thất bại');
      }
    });
  }

  // Lưu file cho các bản ghi
  saveFilesForRecords(savedIds: any[], data: any[]): void {
    // Nếu không có file record, bỏ qua
    if (!this.tempFileRecord && !this.existingFileRecord) {
      this.processAfterSave();
      return;
    }

    const fileRecord = this.tempFileRecord || this.existingFileRecord;
    
    // Lưu file cho bản ghi đầu tiên (hoặc tất cả nếu cần)
    if (savedIds && savedIds.length > 0) {
      const firstSavedId = savedIds[0]?.ID || savedIds[0] || data[0]?.ID || 0;
      if (firstSavedId > 0) {
        const filePayload = {
          ...fileRecord,
          EmployeeBussinessID: firstSavedId
        };
        
        this.employeeBussinessService.saveEmployeeBussinessFile(filePayload).subscribe({
          next: () => {
            this.processDeletedFiles();
          },
          error: () => {
            this.processDeletedFiles();
          }
        });
      } else {
        this.processDeletedFiles();
      }
    } else {
      this.processDeletedFiles();
    }
  }

  // Xử lý xóa các file đã đánh dấu
  processDeletedFiles(): void {
    if (this.deletedFiles.length > 0) {
      let completedCount = 0;
      const totalFiles = this.deletedFiles.length;
      
      this.deletedFiles.forEach((deletedFile) => {
        const filePayload = {
          ...deletedFile,
          IsDeleted: true,
          UpdatedBy: this.currentUser?.UserName || 'admin'
        };
        
        this.employeeBussinessService.saveEmployeeBussinessFile(filePayload).subscribe({
          next: () => {
            completedCount++;
            if (completedCount === totalFiles) {
              this.processAfterSave();
            }
          },
          error: () => {
            completedCount++;
            if (completedCount === totalFiles) {
              this.processAfterSave();
            }
          }
        });
      });
    } else {
      this.processAfterSave();
    }
  }

  // Xử lý sau khi save xong
  processAfterSave(): void {
    // Xóa các dòng đã đánh dấu xóa
    if (this.listId.length > 0) {
      this.employeeBussinessService.deletedEmployeeBussiness(this.listId).subscribe({
        next: () => {
          this.listId = [];
          this.hasDataChanges = false;
          this.isSaving = false;
          this.activeModal.close({ success: true });
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký công tác thành công');
        },
        error: () => {
          this.isSaving = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Xóa công tác thất bại');
        }
      });
    } else {
      this.hasDataChanges = false;
      this.isSaving = false;
      this.activeModal.close({ success: true });
      this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký công tác thành công');
    }
  }

  // Tính tổng chi phí cho một dòng
  setTotalCost(row: any) {
    const rowData = row.getData();

    
    const typeBussinessID = parseInt(rowData.TypeBusiness) || 0;

    // Tìm loại công tác với so sánh chính xác cả number và string
    const typeBussiness = this.employeeTypeBussinessList.find((t: any) => {
      const tValue = parseInt(t.value) || 0;
      return tValue === typeBussinessID;
    });


    // Lấy Cost từ typeData
    let costBussiness = 0;
    if (typeBussiness && typeBussiness.typeData) {
      const typeData = typeBussiness.typeData;

      // Kiểm tra typeData.Cost (chữ hoa) - ưu tiên nhất
      if (typeData.Cost != null && typeData.Cost !== undefined && typeData.Cost !== '') {
        costBussiness = parseFloat(typeData.Cost) || 0;
      }
      // Kiểm tra typeData.cost (chữ thường)
      else if (typeData.cost != null && typeData.cost !== undefined && typeData.cost !== '') {
        costBussiness = parseFloat(typeData.cost) || 0;
      }
      // Kiểm tra các trường khác có thể chứa Cost
      else if (typeData.COST != null && typeData.COST !== undefined && typeData.COST !== '') {
        costBussiness = parseFloat(typeData.COST) || 0;
      }
    }


    if (costBussiness === 0 && typeBussiness) {
      if (typeBussiness.Cost != null && typeBussiness.Cost !== undefined && typeBussiness.Cost !== '') {
        costBussiness = parseFloat(typeBussiness.Cost) || 0;
      }
      else if (typeBussiness.cost != null && typeBussiness.cost !== undefined && typeBussiness.cost !== '') {
        costBussiness = parseFloat(typeBussiness.cost) || 0;
      }
    }

    const costWorkEarly = (rowData.WorkEarly === true || rowData.WorkEarly === 1 || rowData.WorkEarly === 'true' || rowData.WorkEarly === '1') ? 50000 : 0;
    const costOvernight = (rowData.OvernightType > 0 && rowData.OvernightType != null && rowData.OvernightType !== 0) ? 35000 : 0;
    const costVehicle = parseFloat(rowData.TotalCostVehicle) || 0;

    const totalCost = costBussiness + costWorkEarly + costOvernight + costVehicle;

    console.log('setTotalCost - Final values:', {
      costBussiness,
      costWorkEarly,
      costOvernight,
      costVehicle,
      totalCost
    });

    // Cập nhật tất cả các chi phí vào row
    row.update({
      CostBussiness: costBussiness,
      CostWorkEarly: costWorkEarly,
      CostOvernight: costOvernight,
      TotalCost: totalCost
    });
  }

  // Tính tổng chi phí cho một object (dùng khi load data)
  calculateTotalCostForRow(item: any) {
    console.log('calculateTotalCostForRow - item:', item);
    const typeBussinessID = parseInt(item.TypeBusiness) || 0;
    console.log('calculateTotalCostForRow - typeBussinessID:', typeBussinessID);

    // Tìm loại công tác với so sánh chính xác cả number và string
    const typeBussiness = this.employeeTypeBussinessList.find((t: any) => {
      const tValue = parseInt(t.value) || 0;
      return tValue === typeBussinessID;
    });

    console.log('calculateTotalCostForRow - typeBussiness found:', typeBussiness);

    // Lấy Cost từ typeData với nhiều cách kiểm tra
    let costBussiness = 0;
    if (typeBussiness && typeBussiness.typeData) {
      const typeData = typeBussiness.typeData;
      console.log('calculateTotalCostForRow - typeData:', typeData);

      // Kiểm tra typeData.Cost (chữ hoa) - ưu tiên nhất
      if (typeData.Cost != null && typeData.Cost !== undefined && typeData.Cost !== '') {
        costBussiness = parseFloat(typeData.Cost) || 0;
        console.log('calculateTotalCostForRow - costBussiness from typeData.Cost:', costBussiness);
      }
      // Kiểm tra typeData.cost (chữ thường)
      else if (typeData.cost != null && typeData.cost !== undefined && typeData.cost !== '') {
        costBussiness = parseFloat(typeData.cost) || 0;
        console.log('calculateTotalCostForRow - costBussiness from typeData.cost:', costBussiness);
      }
      // Kiểm tra các trường khác có thể chứa Cost
      else if (typeData.COST != null && typeData.COST !== undefined && typeData.COST !== '') {
        costBussiness = parseFloat(typeData.COST) || 0;
        console.log('calculateTotalCostForRow - costBussiness from typeData.COST:', costBussiness);
      }
    }

    // Nếu vẫn không tìm thấy, kiểm tra trực tiếp từ typeBussiness
    if (costBussiness === 0 && typeBussiness) {
      if (typeBussiness.Cost != null && typeBussiness.Cost !== undefined && typeBussiness.Cost !== '') {
        costBussiness = parseFloat(typeBussiness.Cost) || 0;
        console.log('calculateTotalCostForRow - costBussiness from typeBussiness.Cost:', costBussiness);
      }
      else if (typeBussiness.cost != null && typeBussiness.cost !== undefined && typeBussiness.cost !== '') {
        costBussiness = parseFloat(typeBussiness.cost) || 0;
        console.log('calculateTotalCostForRow - costBussiness from typeBussiness.cost:', costBussiness);
      }
    }

    const costWorkEarly = (item.WorkEarly === true || item.WorkEarly === 1 || item.WorkEarly === 'true' || item.WorkEarly === '1') ? 50000 : 0;
    const costOvernight = (item.OvernightType > 0 && item.OvernightType != null) ? 35000 : 0;
    const costVehicle = parseFloat(item.TotalCostVehicle) || 0;

    console.log('calculateTotalCostForRow - Final values:', {
      costBussiness,
      costWorkEarly,
      costOvernight,
      costVehicle,
      total: costBussiness + costWorkEarly + costOvernight + costVehicle
    });

    // Cập nhật tất cả các chi phí vào item
    item.CostBussiness = costBussiness;
    item.CostWorkEarly = costWorkEarly;
    item.CostOvernight = costOvernight;
    item.TotalCost = costBussiness + costWorkEarly + costOvernight + costVehicle;
  }
}

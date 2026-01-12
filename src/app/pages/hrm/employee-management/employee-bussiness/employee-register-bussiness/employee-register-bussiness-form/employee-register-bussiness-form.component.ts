import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeBussinessService } from '../../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { WFHService } from '../../../employee-wfh/WFH-service/WFH.service';
import { AuthService } from '../../../../../../auth/auth.service';
import { EmployeeService } from '../../../../employee/employee-service/employee.service';
import { VehicleSelectModalComponent } from './vehicle-select-modal/vehicle-select-modal.component';
import { HomeLayoutService } from '../../../../../../layouts/home-layout/home-layout-service/home-layout.service';

@Component({
  selector: 'app-employee-register-bussiness-form',
  templateUrl: './employee-register-bussiness-form.component.html',
  styleUrls: ['./employee-register-bussiness-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzSpinModule,
    NzCheckboxModule,
    NzGridModule,
    NzUploadModule,
    NzMessageModule,
  ]
})
export class EmployeeRegisterBussinessFormComponent implements OnInit {
  @Input() data: any = null;
  @Input() isEditMode: boolean = false;
  @Input() id: number = 0; // ID để load dữ liệu khi edit

  bussinessForm!: FormGroup;
  isLoading = false;
  typeList: any[] = [];
  vehicleList: any[] = [];
  approverList: any[] = [];
  approverGroups: any[] = []; // Danh sách người duyệt đã group theo phòng ban
  employeeList: any[] = [];
  minDate: Date | null = null;
  attachFileName: string = '';
  datePickerKey: number = 0;
  isProblemValue: boolean = false;
  currentUser: any = null;
  selectedFile: File | null = null;
  uploadedFileData: any = null;
  tempFileRecord: any = null;
  existingFileRecord: any = null; // File đã có sẵn khi edit mode
  fileList: any[] = []; // File list cho nz-upload
  existingFiles: any[] = []; // Danh sách file đính kèm khi edit mode
  deletedFileIds: number[] = []; // Danh sách ID file đã xóa
  deletedFiles: any[] = []; // Danh sách thông tin đầy đủ của file đã xóa (để gửi về API với IsDeleted = true)
  selectedVehicles: any[] = []; // Danh sách phương tiện đã chọn
  vehicleDisplayText: string = ''; // Text hiển thị trong input phương tiện
  isSupplementaryRegistrationOpen: boolean = false; // Trạng thái mở đăng ký bổ sung

  constructor(
    private fb: FormBuilder,
    private bussinessService: EmployeeBussinessService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private wfhService: WFHService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private message: NzMessageService,
    private modalService: NgbModal,
    private homeLayoutService: HomeLayoutService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadTypes();
    this.loadVehicles();
    this.loadApprovers();
    this.loadEmployees();
    this.getCurrentUser();
    this.loadConfigSystem();

    if (this.isEditMode && this.id > 0) {
      this.loadDataById();
    } else if (this.data) {
      this.patchFormData(this.data);
      if (this.data.ID && this.data.ID > 0) {
        this.loadFilesByBussinessID(this.data.ID);
      }
    } else {
      this.resetForm();
    }
  }

  loadDataById() {
    this.isLoading = true;
    this.bussinessService.getEmployeeBussinessByID(this.id).subscribe({
      next: (response: any) => {
        const result = response?.data || response?.employee || response;
        if (result) {
          const employeeBussinessID = result.Id || result.ID || 0;

          if (employeeBussinessID > 0) {
            this.loadFilesByBussinessID(employeeBussinessID);
          }

          setTimeout(() => {
            this.patchFormData({
              ID: result.Id || result.ID || 0,
              EmployeeID: result.EmployeeID || result.EmployeeId || 0,
              DayBussiness: result.DayBussiness,
              ApprovedId: result.ApprovedID || result.ApprovedId || result.ApproverID || null,
              Location: result.Location || '',
              NotCheckIn: result.NotChekIn || result.NotCheckIn || 0,
              Type: result.TypeBusiness || result.Type || result.TypeID || null,
              CostBussiness: result.CostBussiness || result.CostType || 0,
              VehicleID: result.VehicleID || result.VehicleId || null,
              CostVehicle: result.CostVehicle || 0,
              WorkEarly: this.convertToBoolean(result.WorkEarly),
              CostWorkEarly: result.CostWorkEarly || 0,
              Overnight: result.OvernightType !== undefined ? result.OvernightType : (result.Overnight === true ? 1 : 0),
              CostOvernight: result.CostOvernight || 0,
              TotalMoney: result.TotalMoney || 0,
              Note: result.Note || '',
              Reason: result.Reason || '',
              IsProblem: result.IsProblem || false,
              AttachFileName: result.AttachFileName || ''
            });

            this.onVehicleChange(result.VehicleID || result.VehicleId);
            this.cdr.detectChanges();
          }, 100);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.isLoading = false;
      }
    });
  }

  // Load danh sách file đính kèm
  loadFilesByBussinessID(bussinessID: number) {
    if (!bussinessID || bussinessID <= 0) {
      this.existingFiles = [];
      return;
    }

    this.bussinessService.getFileByID(bussinessID).subscribe({
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
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.existingFiles = [];
      }
    });
  }

  // Xóa file đính kèm - chỉ đánh dấu, sẽ xóa khi save
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

    this.cdr.detectChanges();
  }

  private convertToBoolean(value: any): boolean {
    if (value === true || value === 1 || value === 'true' || value === '1' || value === 'True') {
      return true;
    }
    return false;
  }

  patchFormData(data: any) {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const employeeID = (data.EmployeeID && data.EmployeeID > 0) ? data.EmployeeID : defaultEmployeeID;
    const typeValue = data.Type || data.TypeID || data.TypeBusiness || null;
    const approvedId = data.ApprovedID || data.ApprovedId || data.ApproverID || null;
    const workEarlyValue = this.convertToBoolean(data.WorkEarly);

    this.bussinessForm.patchValue({
      ID: data.ID !== null && data.ID !== undefined ? data.ID : 0,
      EmployeeID: employeeID,
      DayBussiness: data.DayBussiness ? new Date(data.DayBussiness) : new Date(),
      ApprovedId: approvedId,
      Location: data.Location || '',
      Type: typeValue,
      CostBussiness: data.CostBussiness || data.CostType || 0,
      VehicleID: data.VehicleID || data.VehicleId || null,
      CostVehicle: data.CostVehicle || 0,
      NotCheckIn: data.NotCheckIn || data.NotChekIn || 0,
      WorkEarly: workEarlyValue,
      CostWorkEarly: data.CostWorkEarly || 0,
      Overnight: data.OvernightType !== undefined ? data.OvernightType : (data.Overnight === true ? 1 : 0),
      CostOvernight: data.CostOvernight || 0,
      TotalMoney: data.TotalMoney || 0,
      Note: data.Note || '',
      Reason: data.Reason || '',
      IsProblem: data.IsProblem || false
    }, { emitEvent: false });

    // Force update WorkEarly checkbox to ensure binding
    this.bussinessForm.get('WorkEarly')?.setValue(workEarlyValue, { emitEvent: false });

    this.isProblemValue = data.IsProblem || false;
    this.attachFileName = data.AttachFileName || '';
    this.calculateTotal();
    this.cdr.detectChanges();
  }

  resetForm() {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    this.bussinessForm.patchValue({
      ID: 0,
      EmployeeID: defaultEmployeeID,
      DayBussiness: new Date(),
      ApprovedId: null,
      Location: '',
      Type: null,
      CostBussiness: 0,
      VehicleID: null,
      CostVehicle: 0,
      NotCheckIn: 0,
      WorkEarly: false,
      CostWorkEarly: 0,
      Overnight: 0,
      CostOvernight: 0,
      TotalMoney: 0,
      Note: '',
      Reason: '',
      IsProblem: false
    }, { emitEvent: false });
    this.isProblemValue = false;
    this.attachFileName = '';
    this.minDate = null;
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.tempFileRecord = null;
    this.existingFileRecord = null;
    this.fileList = [];
    this.existingFiles = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];
    this.selectedVehicles = [];
    this.vehicleDisplayText = '';
  }

  private initializeForm(): void {
    this.bussinessForm = this.fb.group({
      ID: [0],
      EmployeeID: [0],
      DayBussiness: [new Date(), Validators.required],
      ApprovedId: [null, Validators.required],
      Location: ['', Validators.required],
      Type: [null, Validators.required],
      CostBussiness: [0],
      VehicleID: [null],
      CostVehicle: [{ value: 0, disabled: true }],
      NotCheckIn: [0],
      WorkEarly: [false],
      CostWorkEarly: [0],
      Overnight: [0],
      CostOvernight: [0],
      TotalMoney: [0],
      Note: [''],
      Reason: ['', Validators.required],
      IsProblem: [false]
    });

    this.bussinessForm.get('CostBussiness')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostVehicle')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostWorkEarly')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostOvernight')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('VehicleID')?.valueChanges.subscribe((value) => this.onVehicleChange(value));
    this.bussinessForm.get('Type')?.valueChanges.subscribe((value) => this.onTypeChange(value));
    this.bussinessForm.get('WorkEarly')?.valueChanges.subscribe((value) => this.onWorkEarlyChange(value));
    this.bussinessForm.get('Overnight')?.valueChanges.subscribe((value) => this.onOvernightTypeChange(value));
    this.bussinessForm.get('IsProblem')?.valueChanges.subscribe((value) => {
      // Kiểm tra nếu đang bật checkbox nhưng chưa mở đăng ký bổ sung
      if (value && !this.isSupplementaryRegistrationOpen) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Nhân sự chưa mở đăng ký bổ sung');
        // Reset lại checkbox về false
        this.bussinessForm.patchValue({ IsProblem: false }, { emitEvent: false });
        this.isProblemValue = false;
        this.cdr.detectChanges();
        return;
      }

      this.isProblemValue = value || false;

      if (!value) {
        const dayBussiness = this.bussinessForm.get('DayBussiness')?.value;

        if (dayBussiness) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const bussinessDate = new Date(dayBussiness);
          bussinessDate.setHours(0, 0, 0, 0);

          const isToday = bussinessDate.getTime() === today.getTime();
          const isYesterday = bussinessDate.getTime() === yesterday.getTime();

          if (!isToday && !isYesterday) {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            this.bussinessForm.patchValue({
              DayBussiness: todayDate
            }, { emitEvent: false });
          }
        }

        this.selectedFile = null;
        this.uploadedFileData = null;
        this.tempFileRecord = null;
        this.fileList = [];
        if (!this.existingFileRecord) {
          this.attachFileName = '';
        }
      }

      this.datePickerKey++;
      this.cdr.detectChanges();
    });
  }

  // Load config hệ thống để kiểm tra có mở đăng ký bổ sung không
  loadConfigSystem() {
    this.homeLayoutService.getConfigSystemHR().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data && response.data.data) {
          const configs = response.data.data;
          const bussinessConfig = configs.find((c: any) => c.KeyName === 'EmployeeBussiness');
          if (bussinessConfig && bussinessConfig.KeyValue2 === '1') {
            this.isSupplementaryRegistrationOpen = true;
          } else {
            this.isSupplementaryRegistrationOpen = false;
          }
        }
      },
      error: () => {
        this.isSupplementaryRegistrationOpen = false;
      }
    });
  }

  loadTypes() {
    this.bussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại công tác: ' + error.message);
      }
    });
  }

  loadVehicles() {
    this.bussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (data: any) => {
        this.vehicleList = data.data || [];
        // Nếu không phải edit mode và chưa có phương tiện nào, set mặc định
        if (!this.isEditMode && this.selectedVehicles.length === 0) {
          this.setDefaultVehicle();
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }

  loadApprovers() {
    this.employeeService.getEmployeeApproved().subscribe({
      next: (res: any) => {
        this.approverList = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }

  // Group người duyệt theo phòng ban
  private buildApproverGroups(): void {
    const grouped = this.approverList.reduce((acc: any, approver: any) => {
      const deptName = approver.DepartmentName || 'Không xác định';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(approver);
      return acc;
    }, {});

    this.approverGroups = Object.keys(grouped).map((deptName) => ({
      label: deptName,
      options: grouped[deptName]
    }));
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data || [];
        // Sau khi load xong danh sách nhân viên, set EmployeeID mặc định
        this.setDefaultEmployeeID();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    });
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;
          this.currentUser = Array.isArray(data) ? data[0] : data;
          this.setDefaultEmployeeID();
        }
      },
      error: (error) => {
      }
    });
  }

  setDefaultEmployeeID() {
    if (!this.isEditMode && !this.data && this.currentUser && this.currentUser.EmployeeID && this.employeeList.length > 0) {
      const employeeExists = this.employeeList.some(emp => emp.ID === this.currentUser.EmployeeID);
      if (employeeExists) {
        this.bussinessForm.patchValue({
          EmployeeID: this.currentUser.EmployeeID
        }, { emitEvent: false });
      }
    }
  }

  onTypeChange(typeId: any) {
    if (typeId) {
      const type = this.typeList.find(t => t.ID === typeId);
      if (type && type.Cost) {
        this.bussinessForm.patchValue({ CostBussiness: type.Cost }, { emitEvent: false });
        this.calculateTotal();
      }
    }
  }

  onVehicleChange(vehicleId: any) {
  }

  openVehicleModal() {
    // Nếu chưa có phương tiện nào và không phải edit mode, tự động thêm phương tiện mặc định
    if (this.selectedVehicles.length === 0 && !this.isEditMode) {
      this.setDefaultVehicle();
    }

    const modal = this.modalService.open(VehicleSelectModalComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    const componentInstance = modal.componentInstance;
    if (componentInstance) {
      componentInstance.vehicleList = this.vehicleList;
      componentInstance.selectedVehicles = this.selectedVehicles;
    }

    modal.result.then((result: any) => {
      if (result && result.vehicles && Array.isArray(result.vehicles)) {
        this.selectedVehicles = result.vehicles;
        this.updateVehicleDisplay();
        this.updateVehicleCost();
      } else if (result && Array.isArray(result)) {
        this.selectedVehicles = result;
        this.updateVehicleDisplay();
        this.updateVehicleCost();
      }
    }).catch(() => {
    });
  }

  // Set phương tiện mặc định là "Ô tô công ty" (VehicleID = 2)
  private setDefaultVehicle() {
    const defaultVehicle = {
      id: 'vehicle_detail_1',
      vehicleId: 2,
      vehicleName: 'Ô tô công ty',
      cost: 0,
      note: '',
      customName: ''
    };
    this.selectedVehicles = [defaultVehicle];
    this.updateVehicleDisplay();
    this.updateVehicleCost();
  }

  updateVehicleDisplay() {
    if (this.selectedVehicles && this.selectedVehicles.length > 0) {
      const vehicleNames = this.selectedVehicles.map(v => {
        if (v.vehicleId === 0) {
          return v.customName || v.vehicleName || 'Phương tiện khác';
        }
        return v.vehicleName || this.getVehicleNameById(v.vehicleId);
      });
      this.vehicleDisplayText = vehicleNames.join('; ');
    } else {
      this.vehicleDisplayText = '';
    }
    this.cdr.detectChanges();
  }

  updateVehicleCost() {
    let totalCost = 0;
    if (this.selectedVehicles && this.selectedVehicles.length > 0) {
      totalCost = this.selectedVehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
    }

    const costVehicleControl = this.bussinessForm.get('CostVehicle');
    if (costVehicleControl) {
      costVehicleControl.setValue(totalCost);
      this.calculateTotal();
    }
  }

  getVehicleNameById(vehicleId: number): string {
    const vehicle = this.vehicleList.find(v => v.ID === vehicleId);
    return vehicle ? vehicle.VehicleName : '';
  }

  onWorkEarlyChange(workEarly: boolean) {
    const costWorkEarlyControl = this.bussinessForm.get('CostWorkEarly');
    if (costWorkEarlyControl) {
      if (workEarly) {
        costWorkEarlyControl.setValue(50000);
        this.calculateTotal();
      } else {
        costWorkEarlyControl.setValue(0);
        this.calculateTotal();
      }
    }
  }

  onNotCheckInChange(event: any) {
    const notCheckInControl = this.bussinessForm.get('NotCheckIn');
    if (notCheckInControl) {
      const value = event.target.checked ? 1 : 0;
      notCheckInControl.setValue(value);
    }
  }

  onOvernightTypeChange(overnightType: number) {
    const costOvernightControl = this.bussinessForm.get('CostOvernight');
    if (costOvernightControl) {
      if (overnightType === 1 || overnightType === 2) {
        costOvernightControl.setValue(35000);
        this.calculateTotal();
      } else {
        costOvernightControl.setValue(0);
        this.calculateTotal();
      }
    }
  }

  formatter = (value: number): string => {
    return value ? value.toLocaleString('vi-VN') : '0';
  };

  parser = (value: string): number => {
    return Number(value.replace(/\D/g, '')) || 0;
  };

  disabledDate = (current: Date): boolean => {
    if (!current) {
      return true;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      const isProblem = this.isProblemValue !== undefined ? this.isProblemValue : (this.bussinessForm?.get('IsProblem')?.value || false);
      const selectedDateValue = this.bussinessForm?.get('DayBussiness')?.value;
      let allowSelectedDate = false;
      if (selectedDateValue) {
        const selected = new Date(selectedDateValue);
        selected.setHours(0, 0, 0, 0);
        allowSelectedDate = selected.getTime() === currentDate.getTime();
      }

      if (isProblem) {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        if (allowSelectedDate) {
          return false;
        }

        const isBeforeFirstDay = currentDate.getTime() < firstDayOfMonth.getTime();
        const isAfterToday = currentDate.getTime() > today.getTime();
        return isBeforeFirstDay || isAfterToday;
      } else {
        if (allowSelectedDate) {
          return false;
        }
        const isYesterday = currentDate.getTime() === yesterday.getTime();
        const isToday = currentDate.getTime() === today.getTime();
        return !isYesterday && !isToday;
      }
    } catch (error) {
      return false;
    }
  };

  calculateTotal() {
    const costBussiness = this.bussinessForm.get('CostBussiness')?.value || 0;
    const costVehicle = this.bussinessForm.get('CostVehicle')?.value || 0;
    const costWorkEarly = this.bussinessForm.get('CostWorkEarly')?.value || 0;
    const costOvernight = this.bussinessForm.get('CostOvernight')?.value || 0;

    const total = Number(costBussiness) + Number(costVehicle) + Number(costWorkEarly) + Number(costOvernight);
    this.bussinessForm.patchValue({ TotalMoney: total }, { emitEvent: false });
  }

  onSubmit() {
    Object.keys(this.bussinessForm.controls).forEach(key => {
      const control = this.bussinessForm.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });

    if (this.bussinessForm.invalid) {
      return;
    }

    const formValue = this.bussinessForm.getRawValue();

    if (!formValue.Type || formValue.Type === null) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại công tác');
      return;
    }

    const dayBussiness = formValue.DayBussiness ? new Date(formValue.DayBussiness).toISOString() : null;
    const vehicleID = formValue.VehicleID !== null && formValue.VehicleID !== undefined ? formValue.VehicleID : 0;
    const approvedId = formValue.ApprovedId !== null && formValue.ApprovedId !== undefined ? formValue.ApprovedId : 0;

    const data = [{
      ID: formValue.ID !== null && formValue.ID !== undefined ? formValue.ID : 0,
      EmployeeID: formValue.EmployeeID || 0,
      DayBussiness: dayBussiness,
      ApprovedID: approvedId,
      Location: formValue.Location || '',
      TypeBusiness: formValue.Type,
      CostBussiness: Number(formValue.CostBussiness) || 0,
      VehicleID: Number(vehicleID),
      CostVehicle: Number(formValue.CostVehicle) || 0,
      NotChekIn: formValue.NotCheckIn === 1 ? true : false,
      WorkEarly: formValue.WorkEarly || false,
      CostWorkEarly: Number(formValue.CostWorkEarly) || 0,
      Overnight: (formValue.Overnight === 1 || formValue.Overnight === 2) ? true : false,
      OvernightType: formValue.Overnight || 0,
      CostOvernight: Number(formValue.CostOvernight) || 0,
      TotalMoney: Number(formValue.TotalMoney) || 0,
      Note: formValue.Note || '',
      Reason: formValue.Reason || '',
      IsProblem: formValue.IsProblem || false
    }];

    if (!data[0].TypeBusiness || data[0].TypeBusiness === null || data[0].TypeBusiness === undefined) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại công tác');
      return;
    }

    if (!data[0].EmployeeID || data[0].EmployeeID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên');
      return;
    }

    // Kiểm tra file khi IsProblem = true
    if (data[0].IsProblem) {
      const hasNewFile = !!(this.selectedFile || this.tempFileRecord || this.uploadedFileData);
      const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));
      const hasExistingFile = remainingFiles.length > 0 || (this.existingFileRecord && this.existingFileRecord.ID > 0 && !this.deletedFileIds.includes(this.existingFileRecord.ID));

      if (!hasNewFile && !hasExistingFile) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file đính kèm khi đăng ký bổ sung');
        return;
      }
    }

    if (this.selectedFile) {
      this.uploadFileAndSave(data);
    } else {
      this.saveDataEmployeeWithFile(data);
    }
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

  // Upload file và sau đó save
  uploadFileAndSave(data: any[]): void {
    if (!this.selectedFile) {
      this.saveDataEmployeeWithFile(data);
      return;
    }

    const employeeID = data[0].EmployeeID;
    const employee = this.employeeList.find(emp => emp.ID === employeeID);
    const employeeCode = employee?.Code || 'UNKNOWN';
    const dayBussiness = data[0].DayBussiness ? new Date(data[0].DayBussiness) : new Date();
    const subPath = this.generateSubPath(dayBussiness, employeeCode);

    const loadingMsg = this.message.loading(`Đang tải lên ${this.selectedFile.name}...`, {
      nzDuration: 0,
    }).messageId;

    this.bussinessService.uploadMultipleFiles([this.selectedFile], subPath).subscribe({
      next: (res) => {
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
          this.saveDataEmployeeWithFile(data);
        } else {
          this.message.remove(loadingMsg);
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Upload file thất bại!');
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Upload file thất bại!');
        this.isLoading = false;
      },
    });
  }

  // Save employee bussiness và file cùng lúc qua API mới
  saveDataEmployeeWithFile(data: any[]): void {
    // Validate file khi IsProblem = true trước khi save
    if (data[0].IsProblem) {
      const hasNewFile = !!(this.selectedFile || this.tempFileRecord || this.uploadedFileData);
      const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));
      const hasExistingFile = remainingFiles.length > 0 || (this.existingFileRecord && this.existingFileRecord.ID > 0 && !this.deletedFileIds.includes(this.existingFileRecord.ID));

      if (!hasNewFile && !hasExistingFile) {
        this.isLoading = false;
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file đính kèm khi đăng ký bổ sung');
        return;
      }
    }

    this.isLoading = true;

    const dto: any = {
      employeeBussiness: data[0] || null,
      employeeBussinessFiles: null,
      employeeBussinessVehicle: null
    };

    if (this.tempFileRecord) {
      dto.employeeBussinessFiles = this.tempFileRecord;
    } else if (this.existingFileRecord && this.existingFileRecord.ID > 0 && !this.deletedFileIds.includes(this.existingFileRecord.ID)) {
      // Sử dụng existingFileRecord nếu có và chưa bị xóa
      dto.employeeBussinessFiles = {
        ID: this.existingFileRecord.ID || 0,
        EmployeeBussinessID: this.existingFileRecord.EmployeeBussinessID || 0,
        FileName: this.existingFileRecord.FileName || '',
        OriginPath: this.existingFileRecord.OriginPath || '',
        ServerPath: this.existingFileRecord.ServerPath || ''
      };
    } else if (this.existingFiles.length > 0) {
      const remainingFile = this.existingFiles.find(f => f.ID && !this.deletedFileIds.includes(f.ID));
      if (remainingFile) {
        dto.employeeBussinessFiles = {
          ID: remainingFile.ID || 0,
          EmployeeBussinessID: remainingFile.EmployeeBussinessID || 0,
          FileName: remainingFile.FileName || '',
          OriginPath: remainingFile.OriginPath || '',
          ServerPath: remainingFile.ServerPath || ''
        };
      }
    }

    // Nếu IsProblem = true nhưng không có file hợp lệ, không cho phép lưu
    if (data[0].IsProblem && !dto.employeeBussinessFiles) {
      this.isLoading = false;
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file đính kèm khi đăng ký bổ sung');
      return;
    }

    if (this.selectedVehicles && this.selectedVehicles.length > 0) {
      const firstVehicle = this.selectedVehicles[0];
      dto.employeeBussinessVehicle = {
        ID: 0,
        EmployeeBussinesID: data[0].ID || 0,
        EmployeeVehicleBussinessID: firstVehicle.vehicleId || 0,
        Cost: firstVehicle.cost || 0,
        BillImage: '',
        Note: firstVehicle.note || '',
        VehicleName: firstVehicle.vehicleName || firstVehicle.customName || ''
      };
    }

    this.bussinessService.saveDataEmployee(dto).subscribe({
      next: (response: any) => {
        const savedBussinessID = response?.data?.ID || response?.ID || data[0].ID || 0;

        if (dto.employeeBussinessVehicle && savedBussinessID > 0 && dto.employeeBussinessVehicle.EmployeeBussinesID !== savedBussinessID) {
          dto.employeeBussinessVehicle.EmployeeBussinesID = savedBussinessID;
          this.bussinessService.saveDataEmployee({
            employeeBussiness: null,
            employeeBussinessFiles: null,
            employeeBussinessVehicle: dto.employeeBussinessVehicle
          }).subscribe({
            next: () => {
              if (this.selectedVehicles && this.selectedVehicles.length > 1) {
                this.saveRemainingVehicles(savedBussinessID);
              } else {
                this.processDeletedFiles(savedBussinessID);
              }
            },
            error: (error) => {
              if (this.selectedVehicles && this.selectedVehicles.length > 1) {
                this.saveRemainingVehicles(savedBussinessID);
              } else {
                this.processDeletedFiles(savedBussinessID);
              }
            }
          });
        } else {
          if (this.selectedVehicles && this.selectedVehicles.length > 1) {
            this.saveRemainingVehicles(savedBussinessID);
          } else {
            this.processDeletedFiles(savedBussinessID);
          }
        }
      },
      error: (error) => {
        const message = this.isEditMode ? 'Cập nhật bản ghi thất bại' : 'Thêm bản ghi thất bại';
        let errorMessage = error.message || 'Có lỗi xảy ra';

        if (error.error && error.error.errors) {
          const validationErrors = error.error.errors;
          const errorDetails = Object.keys(validationErrors).map(key => {
            return `${key}: ${Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key]}`;
          }).join('; ');
          errorMessage = errorDetails || errorMessage;
        }

        this.notification.error(NOTIFICATION_TITLE.error, message + ': ' + errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Lưu các phương tiện còn lại
  private saveRemainingVehicles(bussinessID: number): void {
    const remainingVehicles = this.selectedVehicles.slice(1);
    let completedCount = 0;
    const totalVehicles = remainingVehicles.length;

    if (totalVehicles === 0) {
      this.processDeletedFiles(bussinessID);
      return;
    }

    remainingVehicles.forEach((vehicle) => {
      const vehicleDto: any = {
        employeeBussiness: null,
        employeeBussinessFiles: null,
        employeeBussinessVehicle: {
          ID: 0,
          EmployeeBussinesID: bussinessID,
          EmployeeVehicleBussinessID: vehicle.vehicleId || 0,
          Cost: vehicle.cost || 0,
          BillImage: '',
          Note: vehicle.note || '',
          VehicleName: vehicle.vehicleName || vehicle.customName || ''
        }
      };

      this.bussinessService.saveDataEmployee(vehicleDto).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === totalVehicles) {
            this.processDeletedFiles(bussinessID);
          }
        },
        error: (error) => {
          completedCount++;
          if (completedCount === totalVehicles) {
            this.processDeletedFiles(bussinessID);
          }
        }
      });
    });
  }

  // Xử lý xóa các file đã đánh dấu
  private processDeletedFiles(bussinessID: number): void {
    if (this.deletedFiles.length > 0) {
      let completedCount = 0;
      const totalFiles = this.deletedFiles.length;

      this.deletedFiles.forEach((deletedFile, index) => {
        const filePayload = {
          ...deletedFile,
          IsDeleted: true,
          UpdatedBy: this.currentUser?.UserName || 'admin'
        };

        this.bussinessService.saveEmployeeBussinessFile(filePayload).subscribe({
          next: () => {
            completedCount++;
            if (completedCount === totalFiles) {
              const message = this.isEditMode ? 'Cập nhật bản ghi thành công' : 'Thêm thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.activeModal.close({ success: true });
              this.isLoading = false;
            }
          },
          error: (error) => {
            completedCount++;
            if (completedCount === totalFiles) {
              const message = this.isEditMode ? 'Cập nhật bản ghi thành công' : 'Thêm thành công';
              this.notification.success(NOTIFICATION_TITLE.success, message);
              this.activeModal.close({ success: true });
              this.isLoading = false;
            }
          }
        });
      });
    } else {
      const message = this.isEditMode ? 'Cập nhật bản ghi thành công' : 'Thêm thành công';
      this.notification.success(NOTIFICATION_TITLE.success, message);
      this.activeModal.close({ success: true });
      this.isLoading = false;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.attachFileName = '';
    this.tempFileRecord = null;
    this.fileList = [];
  }

  // Download file đính kèm
  downloadFile(file: any) {
    if (!file.ServerPath && !file.FilePath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có đường dẫn file để tải xuống');
      return;
    }

    const filePath = file.ServerPath || file.FilePath;
    const fileName = file.FileName || file.OriginPath || 'file';

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.bussinessService.downloadFile(filePath, fileName).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success(NOTIFICATION_TITLE.success, 'Tải xuống thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file: ' + (err?.error?.message || err.message));
      }
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}


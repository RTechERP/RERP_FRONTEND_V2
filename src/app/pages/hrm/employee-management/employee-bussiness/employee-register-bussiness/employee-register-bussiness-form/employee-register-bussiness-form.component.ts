import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
import { DateTime } from 'luxon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeBussinessService } from '../../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { WFHService } from '../../../employee-wfh/WFH-service/WFH.service';
import { AuthService } from '../../../../../../auth/auth.service';
import { EmployeeService } from '../../../../employee/employee-service/employee.service';

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

  constructor(
    private fb: FormBuilder,
    private bussinessService: EmployeeBussinessService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private wfhService: WFHService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private message: NzMessageService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadTypes();
    this.loadVehicles();
    this.loadApprovers();
    this.loadEmployees();
    this.getCurrentUser();
    
    if (this.isEditMode && this.id > 0) {
      this.loadDataById();
    } else if (this.data) {
      this.patchFormData(this.data);
      // Nếu có ID và là edit mode, load danh sách file
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
        if (response && response.employee) {
          const result = response.employee;
          const employeeBussinessID = result.Id || result.ID || 0;
          
          // Load danh sách file đính kèm
          this.loadFilesByBussinessID(employeeBussinessID);
          
          // Đợi một chút để đảm bảo các list đã load xong trước khi patchValue
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
              WorkEarly: result.WorkEarly || false,
              CostWorkEarly: result.CostWorkEarly || 0,
              Overnight: result.OvernightType !== undefined ? result.OvernightType : (result.Overnight === true ? 1 : 0),
              CostOvernight: result.CostOvernight || 0,
              TotalMoney: result.TotalMoney || 0,
              Note: result.Note || '',
              Reason: result.Reason || '',
              IsProblem: result.IsProblem || false
            });
            
            // Disable CostVehicle nếu VehicleID = 0 hoặc 3
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
          
          // Nếu có file, lấy file đầu tiên làm existingFileRecord (để tương thích với code cũ)
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
        console.error('Error loading files:', error);
        this.existingFiles = [];
      }
    });
  }

  // Xóa file đính kèm - chỉ đánh dấu, sẽ xóa khi save
  deleteExistingFile(fileId: number) {
    // Tìm file cần xóa
    const fileToDelete = this.existingFiles.find(f => f.ID === fileId);
    if (!fileToDelete) {
      return;
    }

    // Lưu thông tin đầy đủ của file đã xóa (để gửi về API với IsDeleted = true khi save)
    if (fileId > 0 && !this.deletedFileIds.includes(fileId)) {
      this.deletedFileIds.push(fileId);
      this.deletedFiles.push({
        ...fileToDelete,
        IsDeleted: true
      });
    }
    
    // Xóa file khỏi danh sách hiển thị
    this.existingFiles = this.existingFiles.filter(f => f.ID !== fileId);
    
    // Kiểm tra file còn lại (chưa bị xóa)
    const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));
    
    // Nếu xóa hết file, reset existingFileRecord
    if (remainingFiles.length === 0) {
      this.existingFileRecord = null;
      this.attachFileName = '';
    } else {
      // Cập nhật existingFileRecord với file đầu tiên còn lại
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

  patchFormData(data: any) {
    // Nếu không có EmployeeID hoặc EmployeeID = 0, set mặc định là người đăng nhập
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const employeeID = (data.EmployeeID && data.EmployeeID > 0) ? data.EmployeeID : defaultEmployeeID;
    
    // Map Type từ nhiều field có thể có
    const typeValue = data.Type || data.TypeID || data.TypeBusiness || null;
    
    // Map ApprovedId từ nhiều field có thể có
    const approvedId = data.ApprovedID || data.ApprovedId || data.ApproverID || null;
    
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
      WorkEarly: data.WorkEarly || false,
      CostWorkEarly: data.CostWorkEarly || 0,
      Overnight: data.OvernightType !== undefined ? data.OvernightType : (data.Overnight === true ? 1 : 0),
      CostOvernight: data.CostOvernight || 0,
      TotalMoney: data.TotalMoney || 0,
      Note: data.Note || '',
      Reason: data.Reason || '',
      IsProblem: data.IsProblem || false
    }, { emitEvent: false });
    
    this.isProblemValue = data.IsProblem || false;
    this.attachFileName = data.AttachFileName || '';
    this.calculateTotal();
    
    // Force change detection để đảm bảo UI cập nhật
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
      Overnight: [0], // 0: Không có, 1: Về VP từ sau 20h, 2: Theo loại công tác
      CostOvernight: [0],
      TotalMoney: [0],
      Note: [''],
      Reason: ['', Validators.required],
      IsProblem: [false]
    });

    // Subscribe to changes để tính tổng
    this.bussinessForm.get('CostBussiness')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostVehicle')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostWorkEarly')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('CostOvernight')?.valueChanges.subscribe(() => this.calculateTotal());
    this.bussinessForm.get('VehicleID')?.valueChanges.subscribe((value) => this.onVehicleChange(value));
    this.bussinessForm.get('Type')?.valueChanges.subscribe((value) => this.onTypeChange(value));
    this.bussinessForm.get('WorkEarly')?.valueChanges.subscribe((value) => this.onWorkEarlyChange(value));
    this.bussinessForm.get('Overnight')?.valueChanges.subscribe((value) => this.onOvernightTypeChange(value));
    this.bussinessForm.get('IsProblem')?.valueChanges.subscribe((value) => {
      // Force update date picker khi IsProblem thay đổi
      this.isProblemValue = value || false;
      this.datePickerKey++;
      
      // Nếu bỏ tích "Bổ sung", reset file mới (giữ file cũ nếu edit mode)
      if (!value) {
        this.selectedFile = null;
        this.uploadedFileData = null;
        this.tempFileRecord = null;
        this.fileList = [];
        // Chỉ xóa attachFileName nếu không phải file cũ
        if (!this.existingFileRecord) {
          this.attachFileName = '';
        }
      }
      
      this.cdr.detectChanges();
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
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }

  loadApprovers() {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.approverList = res.data.approvers || [];
          // Group approvers theo phòng ban
          this.buildApproverGroups();
        }
      },
      error: (error) => {
        // Silent fail
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
          // Set EmployeeID mặc định sau khi có thông tin user
          this.setDefaultEmployeeID();
        }
      },
      error: (error) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  setDefaultEmployeeID() {
    // Chỉ set khi không phải edit mode, chưa có data, đã có currentUser và employeeList
    if (!this.isEditMode && !this.data && this.currentUser && this.currentUser.EmployeeID && this.employeeList.length > 0) {
      // Kiểm tra xem EmployeeID có trong danh sách không
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
    const costVehicleControl = this.bussinessForm.get('CostVehicle');
    if (costVehicleControl) {
      if (vehicleId == 0 || vehicleId == 3 || vehicleId == null) {
        costVehicleControl.enable();
      } else {
        costVehicleControl.disable();
        // Lấy cost từ vehicle list
        const vehicle = this.vehicleList.find(v => v.ID === vehicleId);
        if (vehicle && vehicle.Cost) {
          costVehicleControl.setValue(vehicle.Cost);
          this.calculateTotal();
        }
      }
    }
  }

  onWorkEarlyChange(workEarly: boolean) {
    const costWorkEarlyControl = this.bussinessForm.get('CostWorkEarly');
    if (costWorkEarlyControl) {
      if (workEarly) {
        // Khi tích checkbox, tự động set 50,000
        costWorkEarlyControl.setValue(50000);
        this.calculateTotal();
      } else {
        // Khi bỏ tích, reset về 0
        costWorkEarlyControl.setValue(0);
        this.calculateTotal();
      }
    }
  }

  onOvernightTypeChange(overnightType: number) {
    const costOvernightControl = this.bussinessForm.get('CostOvernight');
    if (costOvernightControl) {
      // 0: Không có, 1: Về VP từ sau 20h, 2: Theo loại công tác
      // Nếu chọn 1 hoặc 2 thì tự động set 35,000
      if (overnightType === 1 || overnightType === 2) {
        costOvernightControl.setValue(35000);
        this.calculateTotal();
      } else {
        // Khi chọn "Không có" (0), reset về 0
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

      // Lấy giá trị IsProblem từ form (dùng biến để đảm bảo cập nhật)
      const isProblem = this.isProblemValue !== undefined ? this.isProblemValue : (this.bussinessForm?.get('IsProblem')?.value || false);
      
      // Lấy ngày đã chọn hiện tại (nếu có) - để cho phép giữ nguyên khi edit
      const selectedDateValue = this.bussinessForm?.get('DayBussiness')?.value;
      let allowSelectedDate = false;
      if (selectedDateValue) {
        const selected = new Date(selectedDateValue);
        selected.setHours(0, 0, 0, 0);
        allowSelectedDate = selected.getTime() === currentDate.getTime();
      }

      if (isProblem) {
        // Nếu tích "Bổ sung": enable từ ngày 1 đầu tháng đến hôm nay
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        // Cho phép ngày đã chọn hoặc ngày trong khoảng từ đầu tháng đến hôm nay
        if (allowSelectedDate) {
          return false;
        }
        
        // Disable nếu ngày < ngày 1 đầu tháng hoặc > hôm nay
        const isBeforeFirstDay = currentDate.getTime() < firstDayOfMonth.getTime();
        const isAfterToday = currentDate.getTime() > today.getTime();
        return isBeforeFirstDay || isAfterToday;
      } else {
        // Mặc định: chỉ enable hôm qua và hôm nay (hoặc ngày đã chọn nếu đang edit)
        if (allowSelectedDate) {
          return false;
        }
        const isYesterday = currentDate.getTime() === yesterday.getTime();
        const isToday = currentDate.getTime() === today.getTime();
        return !isYesterday && !isToday;
      }
    } catch (error) {
      console.error('Error in disabledDate:', error);
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
    // Mark all controls as touched để hiển thị error
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

    // Dùng getRawValue() để lấy cả giá trị từ disabled controls
    const formValue = this.bussinessForm.getRawValue();
    
    // Validate Type is required
    if (!formValue.Type || formValue.Type === null) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại công tác');
      return;
    }

    const dayBussiness = formValue.DayBussiness ? new Date(formValue.DayBussiness).toISOString() : null;

    // Đảm bảo các field số không phải null
    const vehicleID = formValue.VehicleID !== null && formValue.VehicleID !== undefined ? formValue.VehicleID : 0;
    const approvedId = formValue.ApprovedId !== null && formValue.ApprovedId !== undefined ? formValue.ApprovedId : 0;

    const data = [{
      ID: formValue.ID !== null && formValue.ID !== undefined ? formValue.ID : 0,
      EmployeeID: formValue.EmployeeID || 0,
      DayBussiness: dayBussiness,
      ApprovedID: approvedId, // Theo model: ApprovedID
      Location: formValue.Location || '',
      TypeBusiness: formValue.Type, // Theo model: TypeBusiness
      CostBussiness: Number(formValue.CostBussiness) || 0,
      VehicleID: Number(vehicleID),
      CostVehicle: Number(formValue.CostVehicle) || 0,
      NotChekIn: formValue.NotCheckIn === 1 ? true : false, // Theo model: NotChekIn (boolean, true = Không chấm công)
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

    // Validate TypeBusiness trước khi submit
    if (!data[0].TypeBusiness || data[0].TypeBusiness === null || data[0].TypeBusiness === undefined) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại công tác');
      return;
    }

    // Validate EmployeeID
    if (!data[0].EmployeeID || data[0].EmployeeID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên');
      return;
    }

    // Validate: Nếu chọn "Bổ sung" thì bắt buộc phải có file (file mới hoặc file cũ còn lại)
    // File mới: có thể là selectedFile (đã chọn, sẽ upload) hoặc tempFileRecord (đã upload xong)
    const hasNewFile = !!(this.selectedFile || this.tempFileRecord || this.uploadedFileData);
    // File cũ còn lại: file chưa bị xóa (không có trong deletedFileIds)
    const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));
    const hasExistingFile = remainingFiles.length > 0;
    
    // Nếu IsProblem = true, phải có ít nhất 1 file (mới hoặc cũ)
    if (data[0].IsProblem && !hasNewFile && !hasExistingFile) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file đính kèm khi đăng ký bổ sung');
      return;
    }

    console.log('Submitting data:', data);
    console.log('Form Value ID:', formValue.ID);
    console.log('Data ID:', data[0].ID);
    console.log('Is Edit Mode:', this.isEditMode);

    // Nếu có file mới được chọn, upload file trước
    if (this.selectedFile) {
      this.uploadFileAndSave(data);
    } else {
      // Nếu không có file mới, gửi trực tiếp (có thể đã có file sẵn trong edit mode)
      this.saveDataEmployeeWithFile(data);
    }
  }

  // Tạo subpath dựa trên ngày công tác và code nhân viên
  private generateSubPath(dayBussiness: Date, employeeCode: string): string {
    const date = new Date(dayBussiness);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Format: Năm 2025\Tháng 7\Ngày 10.07.2025\NV073\
    const monthName = `Tháng ${month}`;
    const dayFormatted = `Ngày ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
    
    return `Năm ${year}\\${monthName}\\${dayFormatted}\\${employeeCode}\\`;
  }

  // Xử lý khi chọn file với nz-upload
  beforeUpload = (file: any): boolean => {
    // Nếu có file cũ, đánh dấu xóa tất cả file cũ (sẽ xóa khi save)
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
      // Xóa khỏi danh sách hiển thị
      this.existingFiles = [];
      this.existingFileRecord = null;
    }
    
    // Reset file cũ đã chọn (nếu có)
    this.selectedFile = null;
    this.tempFileRecord = null;
    this.uploadedFileData = null;
    
    // Chỉ cho phép 1 file
    this.fileList = [file];
    this.selectedFile = file;
    this.attachFileName = file.name;
    return false; // Prevent auto upload
  };

  // Upload file và sau đó save
  uploadFileAndSave(data: any[]): void {
    if (!this.selectedFile) {
      // Không có file mới, gửi trực tiếp với file cũ (nếu có)
      this.saveDataEmployeeWithFile(data);
      return;
    }

    // Lấy thông tin nhân viên để lấy Code
    const employeeID = data[0].EmployeeID;
    const employee = this.employeeList.find(emp => emp.ID === employeeID);
    const employeeCode = employee?.Code || 'UNKNOWN';
    
    // Tạo subpath
    const dayBussiness = data[0].DayBussiness ? new Date(data[0].DayBussiness) : new Date();
    const subPath = this.generateSubPath(dayBussiness, employeeCode);

    // Hiển thị loading
    const loadingMsg = this.message.loading(`Đang tải lên ${this.selectedFile.name}...`, {
      nzDuration: 0,
    }).messageId;

    this.bussinessService.uploadMultipleFiles([this.selectedFile], subPath).subscribe({
      next: (res) => {
        this.message.remove(loadingMsg);

        if (res?.status === 1 && res?.data?.length > 0) {
          const uploadedFile = res.data[0];
          this.uploadedFileData = uploadedFile;
          
          // Lưu thông tin file vào database theo model EmployeeBussinessFile
          const fileRecord: any = {
            ID: this.existingFileRecord?.ID || 0,
            EmployeeBussinessID: 0, // Sẽ được set bởi backend
            FileName: uploadedFile.SavedFileName || uploadedFile.FileName || '',
            OriginPath: uploadedFile.OriginPath || uploadedFile.OriginalFileName || uploadedFile.OriginName || (this.selectedFile ? this.selectedFile.name : '') || '',
            ServerPath: uploadedFile.ServerPath || uploadedFile.FilePath || '',
          };

          // Lưu file record tạm thời
          this.tempFileRecord = fileRecord;
          
          // Gửi cả employee bussiness và file cùng lúc
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
    this.isLoading = true;
    
    // Chuẩn bị DTO theo format backend mong đợi
    const dto: any = {
      employeeBussiness: data[0] || null, // Gửi object, không phải array
      employeeBussinessFiles: null
    };

    // Nếu có file (file mới hoặc file cũ còn lại)
    if (this.tempFileRecord) {
      // File mới đã upload
      dto.employeeBussinessFiles = this.tempFileRecord;
    } else if (this.existingFiles.length > 0 && data[0].IsProblem) {
      // File cũ còn lại (chưa bị xóa) khi edit mode và vẫn chọn "Bổ sung"
      const remainingFile = this.existingFiles.find(f => !this.deletedFileIds.includes(f.ID));
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

    // Lưu employee bussiness trước
    this.bussinessService.saveDataEmployee(dto).subscribe({
      next: (response: any) => {
        // Sau khi lưu thành công, xóa các file đã đánh dấu xóa
        if (this.deletedFiles.length > 0) {
          // Gửi từng file đã xóa về API save-file với IsDeleted = true
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
                // Khi đã xóa hết tất cả file
                if (completedCount === totalFiles) {
                  const message = this.isEditMode ? 'Cập nhật bản ghi thành công' : 'Thêm thành công';
                  this.notification.success(NOTIFICATION_TITLE.success, message);
                  this.activeModal.close({ success: true });
                  this.isLoading = false;
                }
              },
              error: (error) => {
                console.error('Error deleting file:', error);
                completedCount++;
                // Vẫn tiếp tục xóa các file khác
                if (completedCount === totalFiles) {
                  // Vẫn hiển thị thành công vì đã lưu được employee bussiness
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
      },
      error: (error) => {
        const message = this.isEditMode ? 'Cập nhật bản ghi thất bại' : 'Thêm bản ghi thất bại';
        let errorMessage = error.message || 'Có lỗi xảy ra';
        
        // Hiển thị chi tiết lỗi validation nếu có
        if (error.error && error.error.errors) {
          const validationErrors = error.error.errors;
          const errorDetails = Object.keys(validationErrors).map(key => {
            return `${key}: ${Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key]}`;
          }).join('; ');
          errorMessage = errorDetails || errorMessage;
        }
        
        console.error('Error submitting form:', error);
        this.notification.error(NOTIFICATION_TITLE.error, message + ': ' + errorMessage);
        this.isLoading = false;
      }
    });
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.attachFileName = '';
    this.tempFileRecord = null;
    this.fileList = [];
    // Không xóa existingFileRecord khi remove file mới (giữ file cũ)
  }

  // Download file đính kèm
  downloadFile(file: any) {
    if (!file.ServerPath && !file.FilePath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có đường dẫn file để tải xuống');
      return;
    }

    const filePath = file.ServerPath || file.FilePath;
    const fileName = file.FileName || file.OriginPath || 'file';

    // Hiển thị loading
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


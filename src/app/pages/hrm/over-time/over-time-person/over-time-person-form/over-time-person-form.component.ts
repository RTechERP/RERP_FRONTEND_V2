import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { DateTime } from 'luxon';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OverTimeService } from '../../over-time-service/over-time.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AuthService } from '../../../../../auth/auth.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { WFHService } from '../../../employee-management/employee-wfh/WFH-service/WFH.service';
import { ProjectItemSelectModalComponent } from './project-item-select-modal/project-item-select-modal.component';

@Component({
  selector: 'app-over-time-person-form',
  templateUrl: './over-time-person-form.component.html',
  styleUrls: ['./over-time-person-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
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
    NzModalModule,
  ]
})
export class OverTimePersonFormComponent implements OnInit {
  @Input() data: any = null;
  @Input() isEditMode: boolean = false;

  overTimeForm!: FormGroup;
  commonForm!: FormGroup;
  formTabs: Array<{ 
    id: number; 
    title: string; 
    form: FormGroup; 
    data: any;
    selectedFile: File | null;
    uploadedFileData: any;
    tempFileRecord: any;
    existingFileRecord: any;
    fileList: any[];
    existingFiles: any[];
    deletedFileIds: number[];
    deletedFiles: any[];
    attachFileName: string;
  }> = [];
  activeTabIndex = 0;
  isLoading = false;
  typeList: any[] = [];
  approverList: any[] = [];
  approverGroups: any[] = [];
  currentUser: any = null;
  projectList: any[] = [];
  showProjectField = false;
  departmentId: number = 0;

  selectedFile: File | null = null;
  uploadedFileData: any = null;
  tempFileRecord: any = null;
  existingFileRecord: any = null;
  fileList: any[] = [];
  existingFiles: any[] = [];
  deletedFileIds: number[] = [];
  deletedFiles: any[] = [];
  attachFileName: string = '';
  isProblemValue: boolean = false;
  datePickerKey: number = 0;

  locationList = [
    { value: 0, label: '--Chọn địa điểm--' },
    { value: 1, label: 'Văn phòng' },
    { value: 2, label: 'Địa điểm công tác' },
    { value: 3, label: 'Tại nhà' },
  ];

  constructor(
    private fb: FormBuilder,
    private overTimeService: OverTimeService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private projectService: ProjectService,
    private wfhService: WFHService,
    private message: NzMessageService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {
    this.initializeForm();
    this.formTabs.push({
      id: 1,
      title: '1',
      form: this.overTimeForm,
      data: null,
      selectedFile: null,
      uploadedFileData: null,
      tempFileRecord: null,
      existingFileRecord: null,
      fileList: [],
      existingFiles: [],
      deletedFileIds: [],
      deletedFiles: [],
      attachFileName: ''
    });
  }

  ngOnInit() {
    this.loadTypes();
    this.loadApprovers();
    this.loadProjects();
    this.getCurrentUser();  
    if (this.isEditMode && this.data && this.data.ID && this.data.ID > 0) {
      this.loadDataByID(this.data.ID);
    } else if (this.data) {
      this.patchFormData(this.data);
    } else {
      this.resetForm();
      this.resetCommonForm();
    }
    
    if (this.formTabs.length > 0) {
      this.formTabs[0].form = this.overTimeForm;
      this.loadTabState(0);
    }

    this.commonForm.get('IsProblem')?.valueChanges.subscribe((value) => {
      this.isProblemValue = value || false;
      this.datePickerKey++;
      this.cdr.detectChanges();
    });

    this.overTimeForm.get('Overnight')?.valueChanges.subscribe((value) => {
      if (value) {
        if (!this.checkOvernightAllowedForCurrentTab()) {
          this.overTimeForm.patchValue({ Overnight: false }, { emitEvent: false });
          return;
        }
        this.validateOvernight();
      }
    });

    this.overTimeForm.get('DateRegister')?.valueChanges.subscribe((dateValue) => {
      if (dateValue) {
        const selectedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();
        const selectedDay = selectedDate.getDate();
        
        const currentTimeStart = this.overTimeForm.get('TimeStart')?.value;
        if (currentTimeStart) {
          const timeStartDate = currentTimeStart instanceof Date ? currentTimeStart : new Date(currentTimeStart);
          const newTimeStart = new Date(selectedYear, selectedMonth, selectedDay, timeStartDate.getHours(), timeStartDate.getMinutes(), 0, 0);
          this.overTimeForm.patchValue({
            TimeStart: newTimeStart
          }, { emitEvent: false });
        } else if (!this.isEditMode) {
          const defaultTimeStart = new Date(selectedYear, selectedMonth, selectedDay, 18, 0, 0, 0);
          this.overTimeForm.patchValue({
            TimeStart: defaultTimeStart
          }, { emitEvent: false });
        }
        
        const currentEndTime = this.overTimeForm.get('EndTime')?.value;
        if (currentEndTime) {
          const endTimeDate = currentEndTime instanceof Date ? currentEndTime : new Date(currentEndTime);
          const newEndTime = new Date(selectedYear, selectedMonth, selectedDay, endTimeDate.getHours(), endTimeDate.getMinutes(), 0, 0);
          this.overTimeForm.patchValue({
            EndTime: newEndTime
          }, { emitEvent: false });
        }
      }
      
      if (this.overTimeForm.get('Overnight')?.value) {
        this.validateOvernight();
      }
    });
    
    this.overTimeForm.get('TimeStart')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
      
      if (this.overTimeForm.get('Overnight')?.value) {
        this.validateOvernight();
      }
    });
    
    this.overTimeForm.get('EndTime')?.valueChanges.subscribe((endTimeValue) => {
      this.validateTimeRange();
      
      if (endTimeValue) {
        const endTime = new Date(endTimeValue);
        const timeStart = this.overTimeForm.get('TimeStart')?.value;
        const dateRegister = this.commonForm.get('DateRegister')?.value;
        
        if (dateRegister && timeStart) {
          const dateRegisterDate = new Date(dateRegister);
          const dateCheck = new Date(dateRegisterDate.getFullYear(), dateRegisterDate.getMonth(), dateRegisterDate.getDate(), 20, 0, 0);
          
          if (endTime.getTime() >= dateCheck.getTime()) {
            const currentOvernight = this.overTimeForm.get('Overnight')?.value;
            if (!currentOvernight) {
              this.overTimeForm.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        } else {
          const hours = endTime.getHours();
          if (hours >= 20) {
            const currentOvernight = this.overTimeForm.get('Overnight')?.value;
            if (!currentOvernight) {
              this.overTimeForm.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        }
      }
      
      if (this.overTimeForm.get('Overnight')?.value) {
        const dateRegister = this.commonForm.get('DateRegister')?.value;
        const timeStart = this.overTimeForm.get('TimeStart')?.value;
        const endTime = this.overTimeForm.get('EndTime')?.value;
        if (dateRegister && timeStart && endTime) {
          this.validateOvernight();
        }
      }
    });
  }

  loadDataByID(id: number) {
    this.isLoading = true;
    this.overTimeService.getEmployeeOverTimeByID(id).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          const employeeOverTime = data.employeeOverTime || data;
          const overTimeFile = data.overTimeFile || null;
          
          this.patchFormData(employeeOverTime);
          
          if (overTimeFile) {
            this.existingFiles = [overTimeFile];
            this.existingFileRecord = {
              ID: overTimeFile.ID || 0,
              EmployeeOvertimeID: overTimeFile.EmployeeOvertimeID || employeeOverTime.ID || 0,
              FileName: overTimeFile.FileName || '',
              OriginPath: overTimeFile.OriginPath || '',
              ServerPath: overTimeFile.ServerPath || ''
            };
            this.attachFileName = overTimeFile.FileName || overTimeFile.OriginPath || '';
          } else if (data.EmployeeOvertimeFile || data.FileName) {
            const fileData = data.EmployeeOvertimeFile || {
              ID: data.FileID || 0,
              EmployeeOvertimeID: data.ID || 0,
              FileName: data.FileName || '',
              OriginPath: data.FileOriginPath || data.FileName || '',
              ServerPath: data.FileServerPath || data.FilePath || ''
            };
            
            if (fileData.FileName || fileData.ServerPath) {
              this.existingFiles = [fileData];
              this.existingFileRecord = {
                ID: fileData.ID || 0,
                EmployeeOvertimeID: fileData.EmployeeOvertimeID || data.ID || 0,
                FileName: fileData.FileName || '',
                OriginPath: fileData.OriginPath || '',
                ServerPath: fileData.ServerPath || ''
              };
              this.attachFileName = fileData.FileName || fileData.OriginPath || '';
            }
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu');
          this.resetForm();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.resetForm();
        this.isLoading = false;
      }
    });
  }

  patchFormData(data: any) {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const employeeID = (data.EmployeeID && data.EmployeeID > 0) ? data.EmployeeID : defaultEmployeeID;
    
    const approvedId = data.ApprovedID || data.ApprovedId || null;
    const typeID = data.TypeID || data.Type || null;
    const location = (data.Location || data.LocationID) && (data.Location || data.LocationID) > 0 ? (data.Location || data.LocationID) : null;
    const projectId = (data.ProjectID || data.ProjectId) && (data.ProjectID || data.ProjectId) > 0 ? (data.ProjectID || data.ProjectId) : null;

    const timeStartValue = data.TimeStart ? (data.TimeStart instanceof Date ? data.TimeStart : new Date(data.TimeStart)) : null;
    const endTimeValue = data.EndTime ? (data.EndTime instanceof Date ? data.EndTime : new Date(data.EndTime)) : null;

    this.commonForm.patchValue({
      EmployeeID: employeeID,
      DateRegister: data.DateRegister ? new Date(data.DateRegister) : new Date(),
      ApprovedID: approvedId,
      IsProblem: data.IsProblem || false
    }, { emitEvent: false });

    this.overTimeForm.patchValue({
      ID: data.ID !== null && data.ID !== undefined ? data.ID : 0,
      TimeStart: timeStartValue,
      EndTime: endTimeValue,
      Location: location,
      TypeID: typeID,
      ProjectID: projectId,
      Overnight: data.Overnight || false,
      Reason: data.Reason || ''
    }, { emitEvent: false });
    
    if (endTimeValue) {
      const endTime = new Date(endTimeValue);
      const hours = endTime.getHours();
      if (hours >= 20 && !data.Overnight) {
        this.overTimeForm.patchValue({
          Overnight: true
        }, { emitEvent: false });
      }
    }
    
    this.isProblemValue = data.IsProblem || false;
    this.attachFileName = data.FileName || '';
    
    this.resizeAllTextareas();
    
    this.cdr.detectChanges();
  }

  formatDateTimeLocal(date: any): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  toLocalISOString(date: Date | string | null): string | null {
    if (!date) return null;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      
      const dt = DateTime.fromJSDate(dateObj);
      return dt.toISO({ includeOffset: true });
    } catch {
      return null;
    }
  }

  formatDateDMY(date: Date | string | null): string {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }

  resetForm() {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const today = new Date();
    const defaultTimeStart = new Date(today);
    defaultTimeStart.setHours(18, 0, 0, 0);
    
    this.overTimeForm.patchValue({
      ID: 0,
      EmployeeID: defaultEmployeeID,
      DateRegister: today,
      ApprovedID: null,
      TimeStart: defaultTimeStart,
      EndTime: null,
      Location: null,
      TypeID: null,
      ProjectID: null,
      Overnight: false,
      Reason: '',
      IsProblem: false
    }, { emitEvent: false });
    this.isProblemValue = false;
    this.attachFileName = '';
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.tempFileRecord = null;
    this.existingFileRecord = null;
    this.fileList = [];
    this.existingFiles = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];
    this.datePickerKey = 0;
  }

  private initializeForm(): void {
    this.commonForm = this.fb.group({
      EmployeeID: [null],
      DateRegister: [null, Validators.required],
      ApprovedID: [null, Validators.required],
      IsProblem: [false]
    });

    this.overTimeForm = this.fb.group({
      ID: [0],
      TimeStart: [null, Validators.required],
      EndTime: [null, Validators.required],
      Location: [null, [
        Validators.required,
        (control: any) => {
          const value = control.value;
          if (!value || value === 0 || value === null) {
            return { required: true };
          }
          return null;
        }
      ]],
      TypeID: [null, Validators.required],
      ProjectID: [null],
      Overnight: [false],
      Reason: ['', Validators.required]
    });
  }

  loadTypes() {
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại làm thêm: ' + error.message);
      }
    });
  }

  loadApprovers() {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.approverList = res.data.approvers || [];
          this.buildApproverGroups();
        }
      },
      error: (error: any) => {
      }
    });
  }

  private buildApproverGroups(): void {
    const grouped = this.approverList.reduce((acc: any, approver: any) => {
      const deptName = approver.DepartmentName || 'Không xác định';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push({
        ID: approver.EmployeeID || approver.ID,
        EmployeeID: approver.EmployeeID || approver.ID,
        Code: approver.Code,
        FullName: approver.FullName,
        DepartmentName: approver.DepartmentName
      });
      return acc;
    }, {});

    Object.keys(grouped).forEach((dept) => {
      grouped[dept].sort((a: any, b: any) => (a.Code || '').localeCompare(b.Code || ''));
    });

    this.approverGroups = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((deptName) => ({
        label: deptName,
        options: grouped[deptName]
      }));
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;
          this.currentUser = Array.isArray(data) ? data[0] : data;
          this.departmentId = this.currentUser?.DepartmentID || 0;
          this.showProjectField = this.departmentId === 2;
          
          const employeeID = this.currentUser.EmployeeID || 0;
          if (employeeID > 0) {
            this.commonForm.patchValue({
              EmployeeID: employeeID
            }, { emitEvent: false });
          }
          
          const projectControl = this.overTimeForm.get('ProjectID');
          if (projectControl) {
            if (this.showProjectField) {
              projectControl.setValidators([
                Validators.required,
                (control) => {
                  const value = control.value;
                  if (this.showProjectField && (!value || value === 0 || value === null)) {
                    return { required: true };
                  }
                  return null;
                }
              ]);
            } else {
              projectControl.clearValidators();
            }
            projectControl.updateValueAndValidity();
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  loadProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        console.log('getProjectModal response:', res);
        
        if (res && res.status === 0) {
          console.error('Backend error:', res.message || res.error);
          this.projectList = [];
          return;
        }
        
        if (res && res.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [res.data];
          
          this.projectList = dataArray.map((item: any) => {
            if (item.id !== undefined && item.text !== undefined) {
              return item;
            }
            if (item.ID !== undefined) {
              const projectText = item.ProjectCode 
                ? `${item.ProjectCode} - ${item.ProjectName || ''}` 
                : (item.ProjectName || '');
              
              return {
                id: item.ID,
                text: projectText
              };
            }
            return item;
          });
          
          console.log('Mapped projectList:', this.projectList);
        } else {
          console.warn('No data in response:', res);
          this.projectList = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        if (error.status !== 200) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách dự án. Vui lòng liên hệ quản trị viên.');
        }
        this.projectList = [];
      }
    });
  }

  onSubmit() {
    if (this.commonForm.invalid) {
      Object.keys(this.commonForm.controls).forEach(key => {
        const control = this.commonForm.get(key);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin chung');
      return;
    }

    const commonFormValue = this.commonForm.value;
    if (!commonFormValue.DateRegister) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký');
      return;
    }
    if (!commonFormValue.ApprovedID || commonFormValue.ApprovedID === null) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn người duyệt');
      return;
    }

    this.saveCurrentTabState();
    
    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      this.activeTabIndex = i;
      this.loadTabState(i);
      
      const formValue = this.overTimeForm.value;
      
      if (this.showProjectField && (!formValue.ProjectID || formValue.ProjectID === 0 || formValue.ProjectID === null)) {
        const projectControl = tab.form.get('ProjectID');
        if (projectControl) {
          projectControl.markAsTouched();
          projectControl.markAsDirty();
          projectControl.setErrors({ required: true });
          projectControl.updateValueAndValidity();
        }
      }
      
      if (!formValue.Location || formValue.Location === 0 || formValue.Location === null) {
        const locationControl = tab.form.get('Location');
        if (locationControl) {
          locationControl.markAsTouched();
          locationControl.markAsDirty();
          locationControl.setErrors({ required: true });
          locationControl.updateValueAndValidity();
        }
      }

      Object.keys(tab.form.controls).forEach(key => {
        const control = tab.form.get(key);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });

      if (tab.form.invalid) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng điền đầy đủ thông tin cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }
      
      if (!formValue.TypeID || formValue.TypeID === null) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn loại làm thêm cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      const currentFormValue = this.overTimeForm.value;
      
      const timeStartValue = currentFormValue.TimeStart;
      const endTimeValue = currentFormValue.EndTime;
      
      if (!timeStartValue) {
        const timeStartControl = this.overTimeForm.get('TimeStart');
        if (timeStartControl) {
          timeStartControl.markAsTouched();
          timeStartControl.markAsDirty();
        }
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn thời gian bắt đầu cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }
      
      if (!endTimeValue) {
        const endTimeControl = this.overTimeForm.get('EndTime');
        if (endTimeControl) {
          endTimeControl.markAsTouched();
          endTimeControl.markAsDirty();
        }
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn thời gian kết thúc cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      const dateRegister = commonFormValue.DateRegister ? this.toLocalISOString(new Date(commonFormValue.DateRegister)) : null;
      const timeStart = this.toLocalISOString(new Date(timeStartValue));
      const endTime = this.toLocalISOString(new Date(endTimeValue));

      if (!timeStart || !endTime) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Thời gian không hợp lệ cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (new Date(timeStart) >= new Date(endTime)) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Thời gian kết thúc phải sau thời gian bắt đầu cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (commonFormValue.DateRegister) {
        const dateRegisterDate = new Date(commonFormValue.DateRegister);
        dateRegisterDate.setHours(0, 0, 0, 0);
        
        const minDateDetail = new Date(dateRegisterDate);
        const maxDateDetail = new Date(dateRegisterDate);
        maxDateDetail.setDate(maxDateDetail.getDate() + 1);
        
        const timeStartDate = new Date(timeStartValue);
        const timeStartDateOnly = new Date(timeStartDate.getFullYear(), timeStartDate.getMonth(), timeStartDate.getDate());
        
        const endTimeDate = new Date(endTimeValue);
        const endTimeDateOnly = new Date(endTimeDate.getFullYear(), endTimeDate.getMonth(), endTimeDate.getDate());
        
        if (timeStartDateOnly.getTime() < minDateDetail.getTime() || timeStartDateOnly.getTime() > maxDateDetail.getTime()) {
          const formattedMinDate = this.formatDateDMY(minDateDetail);
          const formattedMaxDate = this.formatDateDMY(maxDateDetail);
          this.notification.warning(NOTIFICATION_TITLE.warning, 
            `Ngày đăng ký là: ${this.formatDateDMY(dateRegisterDate)}. ` +
            `Nên Thời gian bắt đầu và thời gian kết thúc phải trong khoảng ` +
            `Từ: ${formattedMinDate} 00:00. Đến: ${this.formatDateDMY(maxDateDetail)} 00:00`);
          this.cdr.detectChanges();
          return;
        }
        
        if (endTimeDateOnly.getTime() < minDateDetail.getTime() || endTimeDateOnly.getTime() > maxDateDetail.getTime()) {
          const formattedMinDate = this.formatDateDMY(minDateDetail);
          const formattedMaxDate = this.formatDateDMY(maxDateDetail);
          this.notification.warning(NOTIFICATION_TITLE.warning, 
            `Ngày đăng ký là: ${this.formatDateDMY(dateRegisterDate)}. ` +
            `Nên Thời gian bắt đầu và thời gian kết thúc phải trong khoảng ` +
            `Từ: ${formattedMinDate} 00:00. Đến: ${this.formatDateDMY(maxDateDetail)} 00:00`);
          this.cdr.detectChanges();
          return;
        }
      }
    }
    
    const overtimeEntries: Array<{ timeStart: Date; endTime: Date; tabIndex: number }> = [];
    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      this.activeTabIndex = i;
      this.loadTabState(i);
      const formValue = this.overTimeForm.value;
      
      if (formValue.TimeStart && formValue.EndTime) {
        overtimeEntries.push({
          timeStart: new Date(formValue.TimeStart),
          endTime: new Date(formValue.EndTime),
          tabIndex: i
        });
      }
    }
    
    for (let i = 0; i < overtimeEntries.length; i++) {
      for (let j = i + 1; j < overtimeEntries.length; j++) {
        const entry1 = overtimeEntries[i];
        const entry2 = overtimeEntries[j];
        
        if ((entry1.timeStart.getTime() <= entry2.timeStart.getTime() && entry1.endTime.getTime() >= entry2.timeStart.getTime()) ||
            (entry1.timeStart.getTime() <= entry2.endTime.getTime() && entry1.endTime.getTime() >= entry2.endTime.getTime()) ||
            (entry1.timeStart.getTime() >= entry2.timeStart.getTime() && entry1.endTime.getTime() <= entry2.endTime.getTime()) ||
            (entry2.timeStart.getTime() >= entry1.timeStart.getTime() && entry2.endTime.getTime() <= entry1.endTime.getTime())) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 
            '2 khoảng thời gian làm thêm không được trùng nhau. Vui lòng kiểm tra lại!');
          this.cdr.detectChanges();
          return;
        }
      }
    }
    
    let overnightCount = 0;
    let overnightTabIndex = -1;
    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      const formValue = tab.form.value;
      if (formValue.Overnight === true) {
        overnightCount++;
        overnightTabIndex = i;
      }
    }

    if (overnightCount === 1 && overnightTabIndex >= 0) {
      for (let i = 0; i < this.formTabs.length; i++) {
        if (i !== overnightTabIndex) {
          const tab = this.formTabs[i];
          const tabFormValue = tab.form.value;
          if (tabFormValue.Overnight === true) {
            tab.form.patchValue({
              Overnight: false
            }, { emitEvent: false });
          }
        }
      }
    }
    
    this.submitAllTabs();
  }

  submitAllTabs() {
    this.isLoading = true;
    let completedCount = 0;
    let errorCount = 0;
    const totalTabs = this.formTabs.length;
    const commonFormValue = this.commonForm.value;

    this.formTabs.forEach((tab, index) => {
      const formValue = tab.form.value;
      
      const dateRegister = commonFormValue.DateRegister ? this.toLocalISOString(new Date(commonFormValue.DateRegister)) : null;
      const timeStart = formValue.TimeStart ? this.toLocalISOString(new Date(formValue.TimeStart)) : null;
      const endTime = formValue.EndTime ? this.toLocalISOString(new Date(formValue.EndTime)) : null;

      // Calculate total hours (TimeReality)
      const startDate = new Date(timeStart!);
      const endDate = new Date(endTime!);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const timeReality = Math.round(diffHours * 100) / 100;

      const employeeOvertime = {
        ID: formValue.ID !== null && formValue.ID !== undefined ? formValue.ID : 0,
        EmployeeID: commonFormValue.EmployeeID || 0,
        ApprovedID: commonFormValue.ApprovedID || null,
        DateRegister: dateRegister,
        TimeStart: timeStart,
        EndTime: endTime,
        TimeReality: timeReality,
        Location: formValue.Location || 0,
        ProjectID: formValue.ProjectID || 0,
        Overnight: formValue.Overnight || false,
        TypeID: formValue.TypeID || null,
        Reason: formValue.Reason || '',
        IsProblem: commonFormValue.IsProblem || false,
        IsApproved: false,
        IsApprovedHR: false,
        IsDeleted: false
      };

      let tabSelectedFile: File | null = null;
      let tabTempFileRecord: any = null;
      let tabExistingFileRecord: any = null;
      
      if (commonFormValue.IsProblem) {
        tabSelectedFile = this.selectedFile;
        tabTempFileRecord = this.tempFileRecord;
        tabExistingFileRecord = this.existingFileRecord;
      } else {
        tabSelectedFile = tab.selectedFile;
        tabTempFileRecord = tab.tempFileRecord;
        tabExistingFileRecord = tab.existingFileRecord;
      }

      if (tabSelectedFile || tabTempFileRecord || tabExistingFileRecord) {
        const originalSelectedFile = this.selectedFile;
        const originalTempFileRecord = this.tempFileRecord;
        const originalExistingFileRecord = this.existingFileRecord;
        
        this.selectedFile = tabSelectedFile;
        this.tempFileRecord = tabTempFileRecord;
        this.existingFileRecord = tabExistingFileRecord;
        
        this.uploadFileAndSaveForTab(employeeOvertime, tab, () => {
          completedCount++;
          if (completedCount === totalTabs) {
            this.handleAllTabsSubmitted(errorCount);
          }
        }, () => {
          errorCount++;
          completedCount++;
          if (completedCount === totalTabs) {
            this.handleAllTabsSubmitted(errorCount);
          }
        });
        
        this.selectedFile = originalSelectedFile;
        this.tempFileRecord = originalTempFileRecord;
        this.existingFileRecord = originalExistingFileRecord;
      } else {
        this.saveDataEmployeeForTab(employeeOvertime, null, tab, () => {
          completedCount++;
          if (completedCount === totalTabs) {
            this.handleAllTabsSubmitted(errorCount);
          }
        }, () => {
          errorCount++;
          completedCount++;
          if (completedCount === totalTabs) {
            this.handleAllTabsSubmitted(errorCount);
          }
        });
      }
    });
  }

  handleAllTabsSubmitted(errorCount: number) {
    this.isLoading = false;
    if (errorCount === 0) {
      const message = this.isEditMode ? 'Lưu thành công' : 'Thêm thành công';
      this.notification.success(NOTIFICATION_TITLE.success, message);
      this.activeModal.close({ success: true });
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu ${this.formTabs.length - errorCount}/${this.formTabs.length} bản ghi. Có ${errorCount} bản ghi lỗi.`);
    }
  }

  uploadFileAndSaveForTab(employeeOvertime: any, tab: any, onSuccess: () => void, onError: () => void): void {
    if (tab.selectedFile && !tab.tempFileRecord) {
      const employeeCode = this.currentUser?.Code || 'UNKNOWN';
      const dateRegister = tab.form.get('DateRegister')?.value;
      const dateRegisterDate = dateRegister ? new Date(dateRegister) : new Date();
      const subPath = this.generateSubPath(dateRegisterDate, employeeCode);
      const uploadKey = 'EmployeeOvertime';

      const loadingMsg = this.message.loading(`Đang tải lên ${tab.selectedFile.name}...`, {
        nzDuration: 0,
      }).messageId;

      this.overTimeService.uploadMultipleFiles([tab.selectedFile], uploadKey, subPath).subscribe({
        next: (res) => {
          this.message.remove(loadingMsg);
          if (res?.status === 1 && res?.data?.length > 0) {
            const uploadedFile = res.data[0];
            const serverPathWithFile = uploadedFile.ServerPath || uploadedFile.FilePath || '';
            const serverPathDirectory = this.getDirectoryPath(serverPathWithFile);
            
            const fileRecord: any = {
              ID: tab.existingFileRecord?.ID || 0,
              EmployeeOvertimeID: 0,
              FileName: uploadedFile.SavedFileName || uploadedFile.FileName || '',
              OriginPath: uploadedFile.OriginPath || uploadedFile.OriginalFileName || uploadedFile.OriginName || (tab.selectedFile ? tab.selectedFile.name : '') || '',
              ServerPath: serverPathDirectory,
            };

            tab.tempFileRecord = fileRecord;
            this.saveDataEmployeeForTab(employeeOvertime, fileRecord, tab, onSuccess, onError);
          } else {
            this.message.remove(loadingMsg);
            onError();
          }
        },
        error: (err) => {
          this.message.remove(loadingMsg);
          onError();
        },
      });
    } else {
      const fileRecord = tab.tempFileRecord || (tab.existingFileRecord ? {
        ID: tab.existingFileRecord.ID || 0,
        EmployeeOvertimeID: tab.existingFileRecord.EmployeeOvertimeID || 0,
        FileName: tab.existingFileRecord.FileName || '',
        OriginPath: tab.existingFileRecord.OriginPath || '',
        ServerPath: tab.existingFileRecord.ServerPath || ''
      } : null);
      
      this.saveDataEmployeeForTab(employeeOvertime, fileRecord, tab, onSuccess, onError);
    }
  }

  saveDataEmployeeForTab(employeeOvertime: any, employeeOvertimeFile: any, tab: any, onSuccess: () => void, onError: () => void): void {
    const hasNewFile = employeeOvertimeFile && (employeeOvertimeFile.FileName || employeeOvertimeFile.ServerPath || employeeOvertimeFile.OriginPath);
    const hasDeletedFile = tab.deletedFiles.length > 0 && tab.deletedFiles[0].ID > 0;
    
    if (hasDeletedFile && hasNewFile) {
      this.deleteFileAndThenSaveForTab(employeeOvertime, employeeOvertimeFile, tab, onSuccess, onError);
      return;
    }
    
    const dto: any = {
      EmployeeOvertimes: [employeeOvertime]
    };
    
    if (hasNewFile) {
      if (employeeOvertime.ID <= 0) {
        employeeOvertimeFile.EmployeeOvertimeID = 0;
      } else {
        if (!employeeOvertimeFile.EmployeeOvertimeID || employeeOvertimeFile.EmployeeOvertimeID === 0) {
          employeeOvertimeFile.EmployeeOvertimeID = employeeOvertime.ID;
        }
      }
      dto.employeeOvertimeFile = employeeOvertimeFile;
    } else if (hasDeletedFile) {
      const deletedFile = tab.deletedFiles[0];
      dto.employeeOvertimeFile = {
        ID: deletedFile.ID || 0,
        EmployeeOvertimeID: deletedFile.EmployeeOvertimeID || employeeOvertime.ID || 0,
        FileName: deletedFile.FileName || '',
        OriginPath: deletedFile.OriginPath || '',
        ServerPath: deletedFile.ServerPath || '',
        IsDeleted: true
      };
    } else {
      dto.employeeOvertimeFile = {
        ID: 0,
        EmployeeOvertimeID: 0,
        FileName: null,
        OriginPath: null,
        ServerPath: null
      };
    }
    
    this.overTimeService.saveDataEmployee(dto).subscribe({
      next: () => {
        onSuccess();
      },
      error: () => {
        onError();
      }
    });
  }

  deleteFileAndThenSaveForTab(employeeOvertime: any, employeeOvertimeFile: any, tab: any, onSuccess: () => void, onError: () => void): void {
    const deletedFile = tab.deletedFiles[0];
    const deleteDto: any = {
      EmployeeOvertimes: [employeeOvertime],
      employeeOvertimeFile: {
        ID: deletedFile.ID || 0,
        EmployeeOvertimeID: deletedFile.EmployeeOvertimeID || employeeOvertime.ID || 0,
        FileName: deletedFile.FileName || '',
        OriginPath: deletedFile.OriginPath || '',
        ServerPath: deletedFile.ServerPath || '',
        IsDeleted: true
      }
    };
    
    this.overTimeService.saveDataEmployee(deleteDto).subscribe({
      next: () => {
        if (employeeOvertime.ID <= 0) {
          employeeOvertimeFile.EmployeeOvertimeID = 0;
        } else {
          if (!employeeOvertimeFile.EmployeeOvertimeID || employeeOvertimeFile.EmployeeOvertimeID === 0) {
            employeeOvertimeFile.EmployeeOvertimeID = employeeOvertime.ID;
          }
        }
        
        const saveDto: any = {
          EmployeeOvertimes: [employeeOvertime],
          employeeOvertimeFile: employeeOvertimeFile
        };
        
        this.overTimeService.saveDataEmployee(saveDto).subscribe({
          next: () => {
            onSuccess();
          },
          error: () => {
            onError();
          }
        });
      },
      error: () => {
        onError();
      }
    });
  }

  checkOvernightAllowedForCurrentTab(): boolean {
    const commonFormValue = this.commonForm.value;
    const dateRegister = commonFormValue.DateRegister;
    
    if (!dateRegister) {
      return true;
    }
    
    const registerDate = new Date(dateRegister);
    const registerDateStr = `${registerDate.getFullYear()}-${String(registerDate.getMonth() + 1).padStart(2, '0')}-${String(registerDate.getDate()).padStart(2, '0')}`;
    
    for (let i = 0; i < this.formTabs.length; i++) {
      if (i === this.activeTabIndex) {
        continue;
      }
      
      const tab = this.formTabs[i];
      const tabFormValue = tab.form.value;
      
      if (tabFormValue.Overnight === true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Trong cùng một ngày chỉ được tích "Ăn tối" một lần');
        return false;
      }
    }
    
    return true;
  }

  validateOvernight(): void {
    const formValue = this.overTimeForm.value;
    const overnight = formValue.Overnight;
    
    if (!overnight) {
      return;
    }

    const dateRegister = this.commonForm.get('DateRegister')?.value;
    const timeStart = formValue.TimeStart;
    const endTime = formValue.EndTime;

    if (!dateRegister || !timeStart || !endTime) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đầy đủ ngày đăng ký và thời gian bắt đầu/kết thúc');
      this.overTimeForm.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }

    let dateRegisterStr = '';
    if (dateRegister instanceof Date) {
      dateRegisterStr = DateTime.fromJSDate(dateRegister).toFormat('yyyy-MM-dd');
    } else {
      dateRegisterStr = dateRegister;
    }

    const dateCheck = new Date(dateRegisterStr + 'T20:00');
    const endTimeDate = new Date(endTime);

    if (endTimeDate.getTime() < dateCheck.getTime()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không thể chọn phụ cấp ăn tối trước 20h. Vui lòng kiểm tra lại!');
      this.overTimeForm.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }

    if (new Date(timeStart) >= new Date(endTime)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thời gian làm thêm không đúng. Vui lòng kiểm tra lại!');
      this.overTimeForm.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }
  }

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

      const isProblem = this.isProblemValue !== undefined ? this.isProblemValue : (this.overTimeForm?.get('IsProblem')?.value || false);
      
      const selectedDateValue = this.overTimeForm?.get('DateRegister')?.value;
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
      console.error('Error in disabledDate:', error);
      return false;
    }
  };

  disabledDateForEndTime = (current: Date): boolean => {
    if (!current) {
      return true;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      const isProblem = this.isProblemValue !== undefined ? this.isProblemValue : (this.overTimeForm?.get('IsProblem')?.value || false);
      
      const selectedDateValue = this.overTimeForm?.get('DateRegister')?.value;
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
        const isAfterTomorrow = currentDate.getTime() > tomorrow.getTime();
        return isBeforeFirstDay || isAfterTomorrow;
      } else {
        if (allowSelectedDate) {
          return false;
        }
        const isYesterday = currentDate.getTime() === yesterday.getTime();
        const isToday = currentDate.getTime() === today.getTime();
        const isTomorrow = currentDate.getTime() === tomorrow.getTime();
        return !isYesterday && !isToday && !isTomorrow;
      }
    } catch (error) {
      console.error('Error in disabledDateForEndTime:', error);
      return false;
    }
  };

  validateTimeRange(): void {
    const timeStart = this.overTimeForm.get('TimeStart')?.value;
    const endTime = this.overTimeForm.get('EndTime')?.value;

    if (timeStart && endTime) {
      const startDate = timeStart instanceof Date ? timeStart : new Date(timeStart);
      const endDate = endTime instanceof Date ? endTime : new Date(endTime);

      if (startDate >= endDate) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Thời gian kết thúc phải sau thời gian bắt đầu');
        this.overTimeForm.patchValue({
          EndTime: null
        }, { emitEvent: false });
      }
    }
  }

  private generateSubPath(dateRegister: Date, employeeCode: string): string {
    const date = new Date(dateRegister);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const monthName = `Tháng ${month}`;
    const dayFormatted = `Ngày ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
    
    return `Năm ${year}\\${monthName}\\${dayFormatted}\\${employeeCode}`;
  }

  private getDirectoryPath(filePath: string): string {
    if (!filePath) return '';
    
    const lastSlash = filePath.lastIndexOf('\\');
    const lastForwardSlash = filePath.lastIndexOf('/');
    const lastSeparator = Math.max(lastSlash, lastForwardSlash);
    
    if (lastSeparator > 0) {
      return filePath.substring(0, lastSeparator);
    }
    
    return filePath.replace(/[\\/]+$/, '');
  }

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
        EmployeeOvertimeID: firstFile.EmployeeOvertimeID || 0,
        FileName: firstFile.FileName || '',
        OriginPath: firstFile.OriginPath || '',
        ServerPath: firstFile.ServerPath || ''
      };
      this.attachFileName = firstFile.FileName || firstFile.OriginPath || '';
    }
    
    this.cdr.detectChanges();
  }

  openProjectItemSelectModal() {
    if (!this.currentUser || !this.currentUser.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể lấy thông tin người dùng');
      return;
    }

    const modalRef = this.modalService.open(ProjectItemSelectModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.projectID = 0;
    modalRef.componentInstance.userID = this.currentUser.ID;

    modalRef.result.then(
      (missions: string) => {
        if (missions && missions.trim() !== '') {
          const currentReason = this.overTimeForm.get('Reason')?.value || '';
          
          const newReason = currentReason 
            ? `${currentReason}; ${missions}` 
            : missions;
          
          this.overTimeForm.patchValue({
            Reason: newReason
          });
          
        }
      },
      () => {
      }
    );
  }

  addNewTab() {
    this.saveCurrentTabState();
    
    const newTabId = this.formTabs.length + 1;
    const newForm = this.createNewForm();
    this.formTabs.push({
      id: newTabId,
      title: ` ${newTabId}`,
      form: newForm,
      data: null,
      selectedFile: null,
      uploadedFileData: null,
      tempFileRecord: null,
      existingFileRecord: null,
      fileList: [],
      existingFiles: [],
      deletedFileIds: [],
      deletedFiles: [],
      attachFileName: ''
    });
    this.activeTabIndex = this.formTabs.length - 1;
    this.overTimeForm = newForm;
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.tempFileRecord = null;
    this.existingFileRecord = null;
    this.fileList = [];
    this.existingFiles = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];
    this.attachFileName = '';
    this.cdr.detectChanges();
  }

  removeTab(event: { index: number }) {
    this.removeTabByIndex(event.index);
  }

  removeTabByIndex(index: number) {
    if (this.formTabs.length <= 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phải có ít nhất một hạng mục');
      return;
    }
    
    const tab = this.formTabs[index];
    const timeStart = tab.form.get('TimeStart')?.value;
    const endTime = tab.form.get('EndTime')?.value;
    
    let content = 'Bạn có chắc muốn xóa khai báo làm thêm';
    if (timeStart || endTime) {
      content += '\n';
      if (timeStart) {
        const startStr = timeStart instanceof Date ? this.formatDateTimeLocal(timeStart) : timeStart;
        content += `Từ: ${startStr}`;
      }
      if (endTime) {
        const endStr = endTime instanceof Date ? this.formatDateTimeLocal(endTime) : endTime;
        if (timeStart) {
          content += '\n';
        }
        content += `Đến: ${endStr}`;
      }
    }
    content += ' không?';
    
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.formTabs.splice(index, 1);
        if (this.activeTabIndex >= this.formTabs.length) {
          this.activeTabIndex = this.formTabs.length - 1;
        }
        if (this.formTabs.length > 0) {
          this.loadTabState(0);
        }
        this.cdr.detectChanges();
      }
    });
  }

  saveCurrentTabState() {
    if (this.formTabs.length > 0 && this.formTabs[this.activeTabIndex]) {
      const currentTab = this.formTabs[this.activeTabIndex];
      currentTab.form = this.overTimeForm;
      currentTab.selectedFile = this.selectedFile;
      currentTab.uploadedFileData = this.uploadedFileData;
      currentTab.tempFileRecord = this.tempFileRecord;
      currentTab.existingFileRecord = this.existingFileRecord;
      currentTab.fileList = [...this.fileList];
      currentTab.existingFiles = [...this.existingFiles];
      currentTab.deletedFileIds = [...this.deletedFileIds];
      currentTab.deletedFiles = [...this.deletedFiles];
      currentTab.attachFileName = this.attachFileName;
    }
  }

  loadTabState(index: number, skipAutoOvernight: boolean = false) {
    if (this.formTabs.length > 0 && this.formTabs[index]) {
      const tab = this.formTabs[index];
      this.overTimeForm = tab.form;
      this.selectedFile = tab.selectedFile;
      this.uploadedFileData = tab.uploadedFileData;
      this.tempFileRecord = tab.tempFileRecord;
      this.existingFileRecord = tab.existingFileRecord;
      this.fileList = [...tab.fileList];
      this.existingFiles = [...tab.existingFiles];
      this.deletedFileIds = [...tab.deletedFileIds];
      this.deletedFiles = [...tab.deletedFiles];
      this.attachFileName = tab.attachFileName;
      
      if (!skipAutoOvernight) {
        const endTime = this.overTimeForm.get('EndTime')?.value;
        if (endTime) {
          const endTimeDate = new Date(endTime);
          const dateRegister = this.commonForm.get('DateRegister')?.value;
          
          let hasOtherOvernight = false;
          for (let i = 0; i < this.formTabs.length; i++) {
            if (i !== index) {
              const otherTab = this.formTabs[i];
              const otherFormValue = otherTab.form.value;
              if (otherFormValue.Overnight === true) {
                hasOtherOvernight = true;
                break;
              }
            }
          }
          
          if (!hasOtherOvernight) {
            if (dateRegister) {
              const dateRegisterDate = new Date(dateRegister);
              const dateCheck = new Date(dateRegisterDate.getFullYear(), dateRegisterDate.getMonth(), dateRegisterDate.getDate(), 20, 0, 0);
              const currentOvernight = this.overTimeForm.get('Overnight')?.value;
              
              if (endTimeDate.getTime() >= dateCheck.getTime() && !currentOvernight) {
                this.overTimeForm.patchValue({
                  Overnight: true
                }, { emitEvent: false });
              }
            } else {
              const hours = endTimeDate.getHours();
              const currentOvernight = this.overTimeForm.get('Overnight')?.value;
              if (hours >= 20 && !currentOvernight) {
                this.overTimeForm.patchValue({
                  Overnight: true
                }, { emitEvent: false });
              }
            }
          }
        }
      }
      
      this.resizeAllTextareas();
    }
  }

  createNewForm(): FormGroup {
    const today = new Date();
    const defaultTimeStart = new Date(today);
    defaultTimeStart.setHours(18, 0, 0, 0);
    
    const newForm = this.fb.group({
      ID: [0],
      TimeStart: [defaultTimeStart, Validators.required],
      EndTime: [null, Validators.required],
      Location: [null, [
        Validators.required,
        (control: any) => {
          const value = control.value;
          if (!value || value === 0 || value === null) {
            return { required: true };
          }
          return null;
        }
      ]],
      TypeID: [null, Validators.required],
      ProjectID: [null],
      Overnight: [false],
      Reason: ['', Validators.required]
    });
    
    newForm.get('EndTime')?.valueChanges.subscribe((endTimeValue) => {
      if (endTimeValue) {
        const endTime = new Date(endTimeValue);
        const timeStart = newForm.get('TimeStart')?.value;
        const dateRegister = this.commonForm.get('DateRegister')?.value;
        
        if (dateRegister && timeStart) {
          const dateRegisterDate = new Date(dateRegister);
          const dateCheck = new Date(dateRegisterDate.getFullYear(), dateRegisterDate.getMonth(), dateRegisterDate.getDate(), 20, 0, 0);
          
          if (endTime.getTime() >= dateCheck.getTime()) {
            const currentOvernight = newForm.get('Overnight')?.value;
            if (!currentOvernight) {
              newForm.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        } else {
          const hours = endTime.getHours();
          if (hours >= 20) {
            const currentOvernight = newForm.get('Overnight')?.value;
            if (!currentOvernight) {
              newForm.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        }
      }
    });
    
    return newForm;
  }

  resetCommonForm() {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : null;
    const today = new Date();
    
    this.commonForm.patchValue({
      EmployeeID: defaultEmployeeID,
      DateRegister: today,
      ApprovedID: null,
      IsProblem: false
    }, { emitEvent: false });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  autoResizeTextarea(event: any) {
    const textarea = event.target;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  resizeAllTextareas() {
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea[formcontrolname="Reason"]');
      textareas.forEach((textarea: any) => {
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    }, 100);
  }
}


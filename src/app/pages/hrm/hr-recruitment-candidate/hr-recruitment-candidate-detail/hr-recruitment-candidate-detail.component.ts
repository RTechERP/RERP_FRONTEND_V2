import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  IterableDiffers,
  TemplateRef,
  input,
  Input,
  inject,
  OnChanges,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  NonNullableFormBuilder,
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';;
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { CommonModule } from '@angular/common';
import { toArray } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { HasPermissionDirective } from "../../../../directives/has-permission.directive";
import { PermissionService } from '../../../../services/permission.service';
import { NzUploadComponent } from "ng-zorro-antd/upload";
import { AngularGridInstance, AngularSlickgridModule, Column, Editors, Filters, Formatters, GridOption, Aggregator, OnCellChangeEventArgs, OnEventArgs, GridService } from 'angular-slickgrid';
import { HRRecruitmentCandidateService } from '../hr-recruitment-candidate.service';

@Component({
  selector: 'app-hr-recruitment-candidate-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    CommonModule,
    HasPermissionDirective,
    NzUploadComponent,
    AngularSlickgridModule
  ],
  templateUrl: './hr-recruitment-candidate-detail.component.html',
  styleUrl: './hr-recruitment-candidate-detail.component.css'
})
export class HrRecruitmentCandidateDetailComponent implements OnInit, OnChanges {

  @Input() stt!: any;
  @Input() hrRecruitmentCandidate!: any;
  @ViewChild('noteLogTpl') noteLogTpl!: TemplateRef<any>;
  tempNoteLog: string = '';
  private fb = inject(NonNullableFormBuilder);
  hrHiringRequestList: any[] = [];
  hrHiringRequestRaw: any[] = [];  // raw data để tra cứu
  employeeChucVuHDList: any[] = [];
  employees: any[] = [];
  groupedEmployees: any[] = [];
  fileList: any[] = [];
  dataFiles: any[] = [];

  angularGridFile!: AngularGridInstance;
  grdFile: any;
  gridFileOptions: GridOption = {};
  columnFileDefinitions: Column[] = [];

  fileUploads: any[] = [];
  fileDeletes: any[] = [];
  showPassword = true;
  isSaving = false;
  genderList: any[] = [
    { ID: 0, GenderName: 'Chọn giới tính' },
    { ID: 1, GenderName: 'Nam' },
    { ID: 2, GenderName: 'Nữ' },
  ];

  statusList: any[] = [
    { value: 0, label: '1. Ứng tuyển' },
    { value: 1, label: '2. Gửi thư mời PV' },
    { value: 2, label: '3. Xác nhận phỏng vấn' },
    { value: 3, label: '4. Đã phỏng vấn' },
    { value: 4, label: '5. Kết quả không đạt' },
    { value: 5, label: '6. Kết quả đạt' },
    { value: 6, label: '7. Trình phê duyệt' },
    { value: 7, label: '8. Gửi thư mời nhận việc' },
    { value: 8, label: '9. Xác nhận thư mời' },
    { value: 9, label: '10. Nhận việc' }
  ];

  timeHours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  timeMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];



  validateForm = this.fb.group({
    ID: this.fb.control(0),
    STT: this.fb.control({ value: '', disabled: true }),
    DateApply: this.fb.control<string | null>(new Date().toISOString().slice(0, 10), [Validators.required]),
    Gender: this.fb.control(0),
    FullName: this.fb.control('', [Validators.required]),
    DateOfBirth: this.fb.control<string | null>(new Date().toISOString().slice(0, 10)),
    UserName: this.fb.control('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z0-9._]+$/),
    ]),
    Password: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^[^\s\u00C0-\u024F\u1E00-\u1EFF]+$/),
    ]),
    HrHiringRequestID: this.fb.control<number | null>(null, [Validators.required]),
    PositionName: this.fb.control({ value: '', disabled: true }, [Validators.required]),
    Status: this.fb.control(0, [Validators.required]),
    Note: this.fb.control(''),
    IsDeleted: this.fb.control(false),
    ServerPath: this.fb.control(''),
    FileCVName: this.fb.control(''),
    NoteLog: this.fb.control(''),
    PhoneNumber: this.fb.control('', [
      Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/),
    ]),
    Address: this.fb.control(''),
    Email: this.fb.control('', [
      Validators.required,
      Validators.email,
    ]),
    DateInterview: this.fb.control<string | null>(null),
    DateInterviewHour: this.fb.control('08'),
    DateInterviewMinute: this.fb.control('00'),
    DeadlineFeedbackMail: this.fb.control<string | null>(null),
    DeadlineFeedbackHour: this.fb.control('17'),
    DeadlineFeedbackMinute: this.fb.control('00'),
    InterviewerID: this.fb.control<number | null>(null),
  });

  private defaultDateInterview(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  }

  private defaultDateDeadline(): Date {
    return new Date();
  }

  private toLocalISOString(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  private formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private permissionService: PermissionService,
    private hrRecruitmentCandidateService: HRRecruitmentCandidateService
  ) { }

  ngOnInit(): void {
    this.initAngularGrid();
    this.getPositionContract();
    this.getHrHiringRequest();
    this.getEmployees();
    this.loadForm();
    if (!this.hrRecruitmentCandidate?.ID) {
      this.getNextUserName();
    }
  }

  getNextUserName() {
    this.hrRecruitmentCandidateService.getUsernameCandidate().subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.validateForm.patchValue({ UserName: res.data });
        }
      }
    });
  }

  ngOnChanges(): void {
    if (this.validateForm) {
      this.loadForm();
    }
  }

  getPositionContract() {
    this.hrRecruitmentCandidateService.getPositionContract().subscribe({
      next: (response: any) => {
        this.employeeChucVuHDList = response.data ?? [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }

  getHrHiringRequest() {
    this.hrRecruitmentCandidateService.getHrHiringRequest().subscribe({
      next: (response: any) => {
        this.hrHiringRequestRaw = response.data ?? [];
        this.hrHiringRequestList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } });
      },
    });
  }
  
  getEmployees() {
    this.hrRecruitmentCandidateService.getEmployees().subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.employees = response.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } });
      },
    });
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }

  onHiringRequestChange(selectedId: number | null) {
    if (!selectedId) {
      return;
    }
    const found = this.hrHiringRequestRaw.find((item: any) => item.ID === selectedId);
    if (found) {
      const position = found.PositionName || found.EmployeeChucVuHDName || '';
      this.validateForm.patchValue({ PositionName: position });
      this.validateForm.get('PositionName')?.disable();
    }
  }

  loadForm() {
    let data = this.hrRecruitmentCandidate ?? {};

    this.validateForm.patchValue({
      ID: data.ID ?? 0,
      STT: data.STT ?? this.stt ?? 1,
      DateApply: this.formatDateForInput(data.DateApply ?? new Date()),

      Gender: data.Gender ?? 0,
      FullName: data.FullName ?? '',
      DateOfBirth: this.formatDateForInput(data.DateOfBirth ?? new Date()),

      UserName: data.UserName ?? '',
      Password: data.Password ?? (data.ID ? '' : '1'),
      HrHiringRequestID: data.HrHiringRequestID ?? null,
      PositionName: data.PositionName || '',
      Status: data.Status ?? 0,
      Note: data.Note ?? '',
      IsDeleted: false,
      ServerPath: data.ServerPath ?? '',
      FileCVName: data.FileCVName ?? '',
      NoteLog: data.NoteLog ?? '',
      PhoneNumber: data.PhoneNumber ?? '',
      Address: data.Address ?? '',
      Email: data.Email ?? '',
      DateInterview: this.formatDateForInput(data.DateInterview ? new Date(data.DateInterview) : this.defaultDateInterview()),
      DateInterviewHour: data.DateInterview ? String(new Date(data.DateInterview).getHours()).padStart(2, '0') : '08',
      DateInterviewMinute: data.DateInterview ? String(new Date(data.DateInterview).getMinutes()).padStart(2, '0') : '00',
      DeadlineFeedbackMail: this.formatDateForInput(data.DeadlineFeedbackMail ? new Date(data.DeadlineFeedbackMail) : this.defaultDateDeadline()),
      DeadlineFeedbackHour: data.DeadlineFeedbackMail ? String(new Date(data.DeadlineFeedbackMail).getHours()).padStart(2, '0') : '08',
      DeadlineFeedbackMinute: data.DeadlineFeedbackMail ? String(new Date(data.DeadlineFeedbackMail).getMinutes()).padStart(2, '0') : '00',
      InterviewerID: data.InterviewerID ?? null,
    });

    this.validateForm.get('PositionName')?.disable();

    // Load file CV từ DB vào bảng file (khi sửa)
    if (data.FileCVName) {
      this.dataFiles = [{
        id: data.ID,   // dùng ID của record làm id row
        ID: data.ID,
        FileName: data.FileCVName,
      }];
    } else {
      this.dataFiles = [];
    }
    this.fileUploads = [];
  }

  onSubmit() {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const newStatus = this.validateForm.getRawValue().Status;
    const oldStatus = this.hrRecruitmentCandidate?.Status ?? newStatus;

    if (newStatus > oldStatus) {
      // Popup nhập ghi chú chuyển trạng thái
      this.tempNoteLog = '';
      this.modal.create({
        nzTitle: 'Ghi chú chuyển trạng thái',
        nzContent: this.noteLogTpl,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Bỏ qua',
        nzOnOk: () => {
          this.validateForm.patchValue({ NoteLog: this.tempNoteLog });
          this.doSave();
        },
        nzOnCancel: () => this.doSave()
      });
    } else {
      this.doSave();
    }
  }

  doSave() {
    this.isSaving = true;
    const formData = this.validateForm.getRawValue();

    // Gộp ngày + giờ + phút thành datetime, format local ISO tránh UTC offset
    let interviewDateTime: Date | null = null;
    let deadlineDateTime: Date | null = null;

    if (formData.DateInterview) {
      const d = new Date(formData.DateInterview);
      d.setHours(+formData.DateInterviewHour, +formData.DateInterviewMinute, 0, 0);
      interviewDateTime = d;
      (formData as any).DateInterview = this.toLocalISOString(d);
    }
    if (formData.DeadlineFeedbackMail) {
      const d = new Date(formData.DeadlineFeedbackMail);
      d.setHours(+formData.DeadlineFeedbackHour, +formData.DeadlineFeedbackMinute, 0, 0);
      deadlineDateTime = d;
      (formData as any).DeadlineFeedbackMail = this.toLocalISOString(d);
    }

    const now = new Date();

    if (deadlineDateTime && deadlineDateTime <= now) {
      this.isSaving = false;
      this.notification.error('Dữ liệu không hợp lệ', 'Deadline phản hồi mail phải sau thời điểm hiện tại!');
      return;
    }

    if (deadlineDateTime && interviewDateTime && deadlineDateTime >= interviewDateTime) {
      this.isSaving = false;
      this.notification.error('Dữ liệu không hợp lệ', 'Deadline phản hồi mail phải trước ngày giờ phỏng vấn!');
      return;
    }

    const file = this.fileUploads.length > 0 ? this.fileUploads[0].file : undefined;
    this.hrRecruitmentCandidateService.saveData(formData, file).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thông tin ứng viên thành công');
        this.activeModal.close(res);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error('Lỗi', err?.error?.message || `${err.error}\n${err.message}`, {
          nzStyle: { whiteSpace: 'pre-line' }
        });
      }
    });
  }

  angularGridReadyFile(angularGrid: AngularGridInstance) {
    this.angularGridFile = angularGrid;
    this.grdFile = this.angularGridFile?.slickGrid || {};
  }

  initAngularGrid() {
    this.columnFileDefinitions = [
      {
        id: 'delete',
        name: '',
        field: 'ID',
        type: 'number',
        width: 50, maxWidth: 50,
        sortable: false, filterable: false,
        formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer text-danger' },
        onCellClick: (e: Event, args: OnEventArgs) => {
          this.deleteFile(e, args)
        },
        cssClass: 'text-center'
      },
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        type: 'string',
      },
    ]
    this.gridFileOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-file-hr',
      },
      gridWidth: '100%',
      frozenColumn: 0,
      autoFitColumnsOnFirstLoad: false,
    }
  }

  handleChangeFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        this.notification.error(
          'File không hợp lệ',
          `Chỉ chấp nhận: ${allowedExtensions.join(', ')}`
        );
        input.value = '';
        return;
      }

      // Reset, chỉ giữ 1 file duy nhất
      this.dataFiles = [{ id: 1, ID: 0, FileName: file.name }];
      this.fileUploads = [{ id: 1, file: file }];

      // Reset input để có thể chọn lại cùng file nếu cần
      input.value = '';
    }
  }

  deleteFile(e: Event, args: OnEventArgs) {
    const metadata = this.angularGridFile.gridService.getColumnFromEventArguments(args);
    const id = metadata.dataContext.id;
    const fileName = metadata.dataContext.FileName ?? 'file này';

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <b>${fileName}</b> không?`,
      nzOkText: 'Đồng ý',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.angularGridFile.gridService.deleteItemById(id);

        const fileRemove = this.fileUploads.findIndex(x => x.id === id);
        if (fileRemove >= 0) {
          this.fileUploads.splice(fileRemove, 1);
        }

        // Nếu file đã lưu DB (ID > 0) → clear FileName và ServerPath
        if (metadata.dataContext.ID > 0) {
          this.validateForm.patchValue({ ServerPath: '', FileCVName: '' });
        }
      }
    });
  }
}



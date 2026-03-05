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
  employeeChucVuHDList: any[] = [];
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
    { ID: 0, GenderName: 'Nam' },
    { ID: 1, GenderName: 'Nữ' },
    { ID: 2, GenderName: 'Khác' },
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



  validateForm = this.fb.group({
    ID: this.fb.control(0),
    STT: this.fb.control({ value: '', disabled: true }),
    DateApply: this.fb.control<Date | null>(new Date(), [Validators.required]),
    Gender: this.fb.control(2, [Validators.required]),
    FullName: this.fb.control('', [Validators.required]),
    DateOfBirth: this.fb.control<Date | null>(new Date(), [Validators.required]),
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
    EmployeeChucVuHDID: this.fb.control(null, [Validators.required]),
    Status: this.fb.control(0, [Validators.required]),
    Note: this.fb.control(''),
    IsDeleted: this.fb.control(false),
    ServerPath: this.fb.control(''),
    FileCVName: this.fb.control(''),
    NoteLog: this.fb.control(''),
    PhoneNumber: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/),
    ]),
    Address: this.fb.control(''),
    Email: this.fb.control('', [
      Validators.required,
      Validators.email,
    ]),
  });

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
    this.loadForm();
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

  loadForm() {
    let data = this.hrRecruitmentCandidate ?? {};

    this.validateForm.patchValue({
      ID: data.ID ?? 0,
      STT: data.STT ?? this.stt ?? 1,
      DateApply: data.DateApply ? new Date(data.DateApply) : new Date(),

      Gender: data.Gender ?? 2,
      FullName: data.FullName ?? '',
      DateOfBirth: data.DateOfBirth ? new Date(data.DateOfBirth) : new Date(),

      UserName: data.UserName ?? '',
      Password: data.Password ?? '',
      HrHiringRequestID: data.HrHiringRequestID ?? null,
      EmployeeChucVuHDID: data.EmployeeChucVuHDID ?? null,
      Status: data.Status ?? 0,
      Note: data.Note ?? '',
      IsDeleted: false,
      ServerPath: data.ServerPath ?? '',
      FileCVName: data.FileCVName ?? '',
      NoteLog: data.NoteLog ?? '',
      PhoneNumber: data.PhoneNumber ?? '',
      Address: data.Address ?? '',
      Email: data.Email ?? '',
    });

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
    const file = this.fileUploads.length > 0 ? this.fileUploads[0].file : undefined;
    this.hrRecruitmentCandidateService.saveData(formData, file).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.notification.success('Thành công', 'Lưu thông tin ứng viên thành công');
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

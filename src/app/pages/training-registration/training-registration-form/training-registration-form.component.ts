import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
  inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, NonNullableFormBuilder } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule, NzRangePickerComponent } from 'ng-zorro-antd/date-picker';
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
import { NSelectComponent } from '../../n-select/n-select.component';
import 'tabulator-tables/dist/css/tabulator_simple.min.css'; // Import Tabulator stylesheet
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { APP_LOGIN_NAME } from '../../../app.config';
import { EMPLOYEE_ID } from '../../../app.config';
import { ISADMIN } from '../../../app.config';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TrainingRegistrationService } from '../service/training-registration.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SERVER_PATH } from '../../../app.config';

@Component({
  selector: 'app-training-registration-form',
  templateUrl: './training-registration-form.component.html',
  styleUrls: ['./training-registration-form.component.css'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzRangePickerComponent,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
    NzUploadModule,
    NzCheckboxModule,
    NzInputNumberModule,
  ],
})
export class TrainingRegistrationFormComponent implements OnInit, AfterViewInit {
  @ViewChild('detailTable', { static: false }) tbDetailElement!: ElementRef;
  @ViewChild('fileTable', { static: false }) tbFileElement!: ElementRef;
  @Input() dataInput: any;
  table: any;
  fileTable: any;

  // Reactive form
  private fb = inject(NonNullableFormBuilder);
  validateForm = this.fb.group({
    formLayout: this.fb.control<'horizontal' | 'vertical' | 'inline'>('vertical'),
    EmployeeID: this.fb.control(null, [Validators.required]),
    Purpose: this.fb.control('', [Validators.required]),
    TrainingType: this.fb.control(null, [Validators.required]),
    IsCertification: this.fb.control(false),
    SessionsPerCourse: this.fb.control(null, [Validators.required, Validators.min(1)]),
    SessionDuration: this.fb.control(null, [Validators.required, Validators.min(15)]),
    TrainingRange: this.fb.control<any[]>([], [Validators.required]),
    CompletionAssessment: this.fb.control(''),
  });

  // For backward compatibility
  get formData(): any {
    return {
      ID: this.dataInput?.ID,
      EmployeeID: this.validateForm.get('EmployeeID')?.value,
      Purpose: this.validateForm.get('Purpose')?.value,
      TrainingType: this.validateForm.get('TrainingType')?.value,
      IsCertification: this.validateForm.get('IsCertification')?.value,
      SessionsPerCourse: this.validateForm.get('SessionsPerCourse')?.value,
      SessionDuration: this.validateForm.get('SessionDuration')?.value,
      DateStart: this.validateForm.get('TrainingRange')?.value?.[0],
      DateEnd: this.validateForm.get('TrainingRange')?.value?.[1],
      TrainingRange: this.validateForm.get('TrainingRange')?.value,
      CompletionAssessment: this.validateForm.get('CompletionAssessment')?.value,
    };
  }

  set formData(value: any) {
    if (value) {
      this.validateForm.patchValue({
        EmployeeID: value.EmployeeID,
        Purpose: value.Purpose,
        TrainingType: value.TrainingType,
        IsCertification: value.IsCertification,
        SessionsPerCourse: value.SessionsPerCourse,
        SessionDuration: value.SessionDuration,
        TrainingRange: value.TrainingRange || [value.DateStart, value.DateEnd],
        CompletionAssessment: value.CompletionAssessment,
      });
    }
  }

  lstEmployees: any[] = [];

  // Danh sách loại đào tạo
  trainingTypes: any[] = [
    { ID: 1, Name: 'Đào tạo nội bộ' },
    { ID: 2, Name: 'Đào tạo ngoài' },
  ];

  // Upload file config
  uploadUrl = ''; // Để trống vì sẽ xử lý upload thủ công
  fileList: any[] = [];
  deletedFileIds: any[] = []; // Danh sách ID file đã xóa

  constructor(
    private trainingRegistrationService: TrainingRegistrationService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {}

  ngAfterViewInit(): void {
    this.loadDetail();
    this.loadFileTable();
    if (this.dataInput) {
      setTimeout(() => {
        this.loadTrainingRegistration();
      }, 0);
    }
  }

  ngOnInit() {
    this.loadEmployees();
  }

  // Phương thức xử lý trước khi upload
  beforeUpload = (file: any): boolean => {
    const newFile = {
      uid: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'new',
      originFile: file,
      FileName: '',
      ServerPath: '',
      OriginName: file.name
    };
    this.fileList = [...this.fileList, newFile];
    this.updateFileTable();
    return false;
  };

  // Load danh sách nhân viên
  loadEmployees() {
    this.trainingRegistrationService.getEmployee().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.lstEmployees = response.data;
        }
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Lấy danh sách nhân viên thất bại: ' + error.message
        );
      },
    });
  }

  loadTrainingRegistration() {
    if (!this.dataInput) return;

    this.validateForm.patchValue({
      EmployeeID: this.dataInput.EmployeeID,
      Purpose: this.dataInput.Purpose,
      TrainingType: this.dataInput.TrainingType,
      IsCertification: this.dataInput.IsCertification,
      SessionsPerCourse: this.dataInput.SessionsPerCourse,
      SessionDuration: this.dataInput.SessionDuration,
      TrainingRange: [
        new Date(this.dataInput.DateStart ?? new Date()),
        new Date(this.dataInput.DateEnd ?? new Date())
      ],
      CompletionAssessment: this.dataInput.CompletionAssessment || '',
    });

    // Xử lý file đính kèm nếu có
    if (this.dataInput.LstFile && this.dataInput.LstFile.length > 0) {
      this.fileList = this.dataInput.LstFile.map((file: any, index: number) => ({
        uid: `existing-${index}`,
        name: file.OriginName || file.FileName,
        size: file.Size || 0,
        type: file.Type || 'unknown',
        status: 'done',
        url: file.ServerPath,
        FileName: file.FileName,
        ServerPath: file.ServerPath,
        OriginName: file.OriginName || file.FileName,
        ID: file.ID,
        response: {
          FileName: file.FileName,
          ServerPath: file.ServerPath
        }
      }));
      this.updateFileTable();
    }

    if (this.table) {
      this.table.setData(this.dataInput.LstDetail || []);
      console.log('Đã gán dữ liệu cho table:', this.table.getData());
    } else {
      console.warn('Table chưa khởi tạo');
    }
  }

  // Phương thức xử lý upload file và lưu dữ liệu
  uploadFilesAndSaveData() {
    // Validate form trước khi lưu
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    // Lọc ra các file mới cần upload
    const newFiles = this.fileList.filter(file => file.status === 'new' && !file.isDeleted && !file.IsDeleted);

    // Nếu không có file mới cần upload
    if (newFiles.length === 0) {
      this.saveDataToServer();
      return;
    }

    // Đếm số file đã upload
    let uploadedCount = 0;

    // Xử lý từng file mới
    newFiles.forEach((file: any) => {
      this.trainingRegistrationService.uploadFile(file.originFile).subscribe({
        next: (response) => {
          uploadedCount++;

          if (response.status === 1) {
            // Cập nhật thông tin file trong fileList
            const fileIndex = this.fileList.findIndex(f => f.uid === file.uid);
            if (fileIndex !== -1) {
              this.fileList[fileIndex] = {
                ...this.fileList[fileIndex],
                status: 'done',
                FileName: response.FileName,
                ServerPath: SERVER_PATH + response.FileName,
                OriginName: file.name,
                ID: 0
              };
            }
            this.updateFileTable();
          } else {
            this.notification.error('Thông báo', response.Message || 'Upload file thất bại');
          }

          // Kiểm tra nếu đã upload hết các file
          if (uploadedCount === newFiles.length) {
            this.saveDataToServer();
          }
        },
        error: (error) => {
          uploadedCount++;
          this.notification.error('Thông báo', 'Upload file thất bại: ' + error.message);

          if (uploadedCount === newFiles.length) {
            this.saveDataToServer();
          }
        },
      });
    });
  }

  // Phương thức lưu dữ liệu sau khi upload file
  saveDataToServer() {
    const formatDate = (date: any) => {
      return date
        ? DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd')
        : null;
    };

    const formValues = this.validateForm.value;
    const trainingRange = formValues.TrainingRange || [];

    // Chuẩn bị dữ liệu chi tiết
    const detailData = this.table.getData().map((item: any) => ({
      ID: item.ID || 0,
      TrainingRegistrationID: this.dataInput?.ID || 0,
      TrainingRegistrationCategoryID: item.CategoryID,
      DescriptionDetail: item.Explaination || '',
      Note: item.Note || '',
      IsDeleted: false
    }));

    // Chuẩn bị danh sách file
    const fileData = this.fileList.map(file => ({
      ID: file.ID || 0,
      FileName: file.FileName || file.name,
      OriginName: file.OriginName || file.name,
      ServerPath: file.ServerPath || '',
      IsDeleted: file.isDeleted || file.IsDeleted || false
    }));

    // Chuẩn bị dữ liệu để gửi lên server
    const trainingData = {
      ID: this.dataInput?.ID || 0,
      EmployeeID: formValues.EmployeeID,
      Purpose: formValues.Purpose,
      TrainingType: formValues.TrainingType,
      IsCertification: formValues.IsCertification,
      SessionsPerCourse: formValues.SessionsPerCourse,
      SessionDuration: formValues.SessionDuration,
      DateRegister: formatDate(new Date()),
      DateStart: formatDate(trainingRange[0]),
      DateEnd: formatDate(trainingRange[1]),
      CompletionAssessment: formValues.CompletionAssessment || '',
      LstFile: fileData,
      LstDetail: detailData
    };

    this.trainingRegistrationService.saveData(trainingData).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            'Đã lưu thông tin đăng ký đào tạo'
          );
          this.resetForm();
          this.activeModal.close('success');
        } else {
          this.notification.error(
            'Thông báo',
            response.Message || 'Lưu thông tin đăng ký đào tạo thất bại'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(
          'Thông báo',
          'Lưu thông tin đăng ký đào tạo thất bại: ' + (error.error?.message || error.message)
        );
      },
    });
  }

  // Submit form
  submitForm(): void {
    if (this.validateForm.valid) {
      this.uploadFilesAndSaveData();
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  // Reset form
  resetForm() {
    this.validateForm.reset({
      formLayout: 'vertical',
      EmployeeID: null,
      Purpose: '',
      TrainingType: null,
      IsCertification: false,
      SessionsPerCourse: null,
      SessionDuration: null,
      TrainingRange: [],
      CompletionAssessment: '',
    });
    this.fileList = [];
    this.updateFileTable();
  }

  // Thêm phương thức đóng modal
  closeModal() {
    this.activeModal.dismiss('Cross click');
  }

  loadDetail(){
    this.table = new Tabulator(this.tbDetailElement.nativeElement, {
      height: '40vh',
      layout: 'fitDataStretch',
      columns: [
        { title: 'STT', field: 'STT', width: 70, hozAlign: 'center',headerHozAlign:'center' },
        { title: 'ID', field: 'ID', width: 70, hozAlign: 'center', visible:false },
        { title: 'Mã hạng mục', field: 'CategoryCode', width: 150, hozAlign: 'left',headerHozAlign:'center' },
        { title: 'CategoryID', field: 'CategoryID', width: 150, hozAlign: 'left', visible: false,headerHozAlign:'center' },
        {
          title: 'Hạng mục',
          field: 'CategoryName',
          width: 150,
          hozAlign: 'left',
          headerHozAlign:'center'
        },
        {
          title: 'Diễn giải',
          field: 'Explaination',
          width: 200,
          hozAlign: 'left',
          editor:'input',
          headerHozAlign:'center'
        },
        { title: 'Ghi chú', field: 'Note', width: 200,editor:'input', hozAlign: 'left',headerHozAlign:'center' },
      ],
    });
  }

  loadFileTable() {
    this.fileTable = new Tabulator(this.tbFileElement.nativeElement, {
      height: '40vh',
      layout: 'fitDataStretch',
      columns: [
        {
          title: '',
          field: 'actions',
          width: 80,
          hozAlign: 'center',
          formatter: () => {
            return '<i class="fas fa-trash-alt" style="color: #ff4d4f; cursor: pointer; font-size: 16px;"></i>';
          },
          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            this.removeFile(rowData);
          },
          headerHozAlign:'center'
        },
        {
          title: 'ID',
          field: 'ID',
          width: 70,
          hozAlign: 'center',
          visible: false,
          headerHozAlign:'center'
        },
        {
          title: 'Tên file',
          field: 'FileName',
          width: 200,
          hozAlign: 'left',
          headerHozAlign:'center'
        },
        {
          title: 'Đường dẫn Server',
          field: 'ServerPath',
          width: 300,
          hozAlign: 'left',
          headerHozAlign:'center',
          formatter: function (cell: any) {
            const url = cell.getValue();
            if (url) {
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            }
            return '';
          },
        },
        {
          title: 'Tên file gốc',
          field: 'OriginName',
          width: 200,
          headerHozAlign:'center',
          hozAlign: 'left',
        },
      ],
    });
  }

  updateFileTable() {
    if (this.fileTable) {
      // Lọc ra những file chưa bị xóa
      const activeFiles = this.fileList.filter((file: any) => !file.isDeleted && !file.IsDeleted);

      const fileData = activeFiles.map((file: any, index: number) => ({
        ID: file.ID || index + 1,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || SERVER_PATH,
        OriginName: file.name || file.OriginName,
        file: file
      }));
      this.fileTable.setData(fileData);
    }
  }

  removeFile(rowData: any) {
    // Tìm file trong fileList dựa trên uid của file gốc
    const fileIndex = this.fileList.findIndex((file: any) => file === rowData.file);

    if (fileIndex !== -1) {
      const file = this.fileList[fileIndex];

      // Nếu file có ID (file đã tồn tại trên server), thêm vào danh sách xóa
      if (file.ID) {
        this.deletedFileIds.push({
          ID: file.ID,
          IsDeleted: true
        });
      }
      this.fileList[fileIndex].IsDeleted = true;

      // Cập nhật bảng file để ẩn file đã xóa
      this.updateFileTable();
    }
  }

  get isHorizontal(): boolean {
    return this.validateForm.controls.formLayout.value === 'horizontal';
  }
}

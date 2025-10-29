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
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
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
import {
  NzDatePickerModule,
  NzRangePickerComponent,
} from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
// import { NSelectComponent } from '../../n-select/n-select.component';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TrainingRegistrationService } from '../service/training-registration.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SERVER_PATH } from '../../../app.config';
import { AppUserService } from '../../../services/app-user.service';

@Component({
  selector: 'app-training-registration-form',
  templateUrl: './training-registration-form.component.html',
  styleUrls: ['./training-registration-form.component.css'],
  standalone: true,
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
export class TrainingRegistrationFormComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('detailTable', { static: false }) tbDetailElement!: ElementRef;
  @ViewChild('fileTable', { static: false }) tbFileElement!: ElementRef;
  @Input() dataInput: any;
  table: any;
  fileTable: any;
  private appUserService = inject(AppUserService);
  // Reactive form
  private fb = inject(NonNullableFormBuilder);
  validateForm = this.fb.group({
    formLayout: this.fb.control<'horizontal' | 'vertical' | 'inline'>(
      'vertical'
    ),
    EmployeeID: this.fb.control(null, [Validators.required]),
    Purpose: this.fb.control('', [Validators.required]),
    TrainingType: this.fb.control(null, [Validators.required]),
    IsCertification: this.fb.control(false),
    SessionsPerCourse: this.fb.control(null, [
      Validators.required,
      Validators.min(1),
    ]),
    SessionDuration: this.fb.control(null, [
      Validators.required,
      Validators.min(15),
    ]),
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
      CompletionAssessment: this.validateForm.get('CompletionAssessment')
        ?.value,
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
    // Khởi tạo bảng trước
    this.loadDetail();
    this.loadFileTable();
    
    // Đợi bảng khởi tạo xong rồi mới load dữ liệu
    if (this.dataInput) {
      setTimeout(() => {
        this.loadTrainingRegistration();
      }, 300); // Tăng thời gian chờ để đảm bảo bảng đã khởi tạo hoàn toàn
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
      OriginName: file.name,
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
      IsCertification: this.dataInput.IsCertification || false,
      SessionsPerCourse: this.dataInput.SessionsPerCourse || null,
      SessionDuration: this.dataInput.SessionDuration || null,
      TrainingRange: [
        new Date(this.dataInput.DateStart ?? new Date()),
        new Date(this.dataInput.DateEnd ?? new Date()),
      ],
      CompletionAssessment: this.dataInput.CompletionAssessment || '',
    });

    // Xử lý file đính kèm nếu có
    if (this.dataInput.LstFile && this.dataInput.LstFile.length > 0) {
      this.fileList = this.dataInput.LstFile.map(
        (file: any, index: number) => ({
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
            ServerPath: file.ServerPath,
          },
        })
      );
      this.updateFileTable();
    }

    // Đảm bảo bảng đã được khởi tạo trước khi gán dữ liệu
    setTimeout(() => {
      if (this.table) {
        const detailData = this.dataInput.LstDetail || [];
        console.log('Dữ liệu detail sẽ được gán:', detailData);
        
        // Gán dữ liệu và thêm STT
        const dataWithSTT = detailData.map((item: any, index: number) => ({
          ...item,
          STT: index + 1
        }));
        
        this.table.setData(dataWithSTT);
        
        // Force redraw để đảm bảo bảng hiển thị
        setTimeout(() => {
          this.table.redraw(true);
          console.log('Đã gán dữ liệu cho table:', this.table.getData());
        }, 100);
      } else {
        console.warn('Table chưa khởi tạo, thử lại sau 500ms');
        // Thử lại sau 500ms nếu table chưa khởi tạo
        setTimeout(() => {
          if (this.table && this.dataInput.LstDetail) {
            const detailData = this.dataInput.LstDetail || [];
            const dataWithSTT = detailData.map((item: any, index: number) => ({
              ...item,
              STT: index + 1
            }));
            this.table.setData(dataWithSTT);
            this.table.redraw(true);
            console.log('Đã gán dữ liệu cho table (lần 2):', this.table.getData());
          }
        }, 500);
      }
    }, 200);
  }

  // Phương thức xử lý upload file và lưu dữ liệu
  uploadFilesAndSaveData() {
    // Validate form trước khi lưu
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Thông báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc!'
      );
      return;
    }

    // Bước 1: Lưu master trước (không kèm file) để lấy ID/Code
    const formatDate = (date: any) => {
      return date
        ? DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd')
        : null;
    };
    const formValues = this.validateForm.value;
    const trainingRange = formValues.TrainingRange || [];

    // Chuẩn bị dữ liệu chi tiết cho lần lưu master
    const detailData = this.table.getData().map((item: any) => ({
      ID: item.ID || 0,
      TrainingRegistrationID: this.dataInput?.ID || 0,
      TrainingRegistrationCategoryID: item.CategoryID,
      DescriptionDetail: item.Explaination || '',
      Note: item.Note || '',
      IsDeleted: false,
    }));

    const trainingDataMaster = {
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
      LstFile: [], // Lưu master trước, KHÔNG kèm file
      LstDetail: detailData, // Lưu chi tiết ngay trong lần đầu
    };

    this.trainingRegistrationService.saveData(trainingDataMaster).subscribe({
      next: (res) => {
        if (res.status === 1 && res.data) {
          // Cập nhật lại dataInput với ID/Code trả về
          this.dataInput = { ...(this.dataInput || {}), ID: res.data.ID, Code: res.data.Code };

          // Bước 2: Upload file (nếu có)
          const newFiles = this.fileList.filter(
            (file) =>
              file.status === 'new' && !file.isDeleted && !file.IsDeleted
          );

          if (newFiles.length === 0) {
            // Không có file mới => hoàn tất sau khi lưu master
            this.notification.success(
              'Thông báo',
              'Đã lưu thông tin đăng ký đào tạo'
            );
            this.resetForm();
            this.activeModal.close('success');
            return;
          }

          const filesToUpload = newFiles.map((file) => file.originFile);

          // Tạo subPath: Đăng ký đào tạo/year/department/Code
          const employeeId = formValues.EmployeeID;
          const emp = this.lstEmployees.find((e) => e.ID === employeeId);
          const year = new Date().getFullYear().toString();
          const departmentName = (emp?.DepartmentName || 'Khác').toString();
          const code = (res.data.Code || '').toString();

          const sanitize = (s: string) => s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
          const subPath = [
            sanitize(year),
            sanitize(departmentName),
            sanitize(code),
          ].join('/');

          this.trainingRegistrationService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
            next: (uploadRes) => {
              if (uploadRes.status === 1 && uploadRes.data) {
                // Cập nhật fileList với kết quả upload
                uploadRes.data.forEach((uploadedFile: any, index: number) => {
                  const fileIndex = this.fileList.findIndex((f) => f.uid === newFiles[index].uid);
                  if (fileIndex !== -1) {
                    this.fileList[fileIndex] = {
                      ...this.fileList[fileIndex],
                      status: 'done',
                      FileName: uploadedFile.fileName,
                      ServerPath: uploadedFile.filePath,
                      OriginName: uploadedFile.originalName,
                      ID: 0,
                    };
                  }
                });
                this.updateFileTable();
                this.notification.success(
                  'Thông báo',
                  `Đã upload thành công ${uploadRes.data.length} file`
                );

                // Bước 3: Cập nhật lại master chỉ với danh sách file (tránh lưu chi tiết lần 2)
                this.saveDataToServer(true);
              } else {
                this.notification.error(
                  'Thông báo',
                  uploadRes.message || 'Upload file thất bại'
                );
              }
            },
            error: (err) => {
              console.error('Lỗi upload:', err);
              this.notification.error(
                'Thông báo',
                'Upload file thất bại: ' + (err.error?.message || err.message)
              );
            }
          });
        } else {
          this.notification.error(
            'Thông báo',
            res.message || 'Lưu thông tin đăng ký đào tạo thất bại'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu master:', error);
        this.notification.error(
          'Thông báo',
          'Lưu thông tin đăng ký đào tạo thất bại: ' +
            (error.error?.message || error.message)
        );
      },
    });
  }

  // Phương thức lưu dữ liệu sau khi upload file
  // Trong class TrainingRegistrationFormComponent
  saveDataToServer(skipDetails: boolean = false) {
    const formatDate = (date: any) => {
      return date
        ? DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd')
        : null;
    };

    const formValues = this.validateForm.value;
    const trainingRange = formValues.TrainingRange || [];

    // Chuẩn bị dữ liệu chi tiết (có thể bỏ qua ở lần 2)
    const detailData = skipDetails
      ? []
      : this.table.getData().map((item: any) => ({
          ID: item.ID || 0,
          TrainingRegistrationID: this.dataInput?.ID || 0,
          TrainingRegistrationCategoryID: item.CategoryID,
          DescriptionDetail: item.Explaination || '',
          Note: item.Note || '',
          IsDeleted: false,
        }));

    // Chuẩn bị danh sách file (lần 2 sau khi upload)
    const fileData = this.fileList.map((file) => ({
      ID: file.ID || 0,
      FileName: file.FileName || file.name,
      OriginName: file.OriginName || file.name,
      ServerPath: file.ServerPath || '',
      IsDeleted: file.isDeleted || file.IsDeleted || false,
    }));

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
      LstDetail: detailData,
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
          'Lưu thông tin đăng ký đào tạo thất bại: ' +
            (error.error?.message || error.message)
        );
      },
    });
  }

  // Submit form
  submitForm(): void {
    if (this.validateForm.valid) {
      this.uploadFilesAndSaveData();
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
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

  loadDetail() {
    this.table = new Tabulator(this.tbDetailElement.nativeElement, {
      height: '40vh',
      layout: 'fitDataStretch',
      columns: [
        { title: 'STT', field: 'STT', width: 50, hozAlign: 'center' },
        {
          title: 'ID',
          field: 'ID',
          width: 70,
          hozAlign: 'center',
          visible: false,
        },
        {
          title: 'Mã hạng mục',
          field: 'CategoryCode',
          width: 150,
          visible: false,
        },
        {
          title: 'CategoryID',
          field: 'CategoryID',
          width: 150,
          hozAlign: 'left',
          visible: false,
        },
        {
          title: 'Hạng mục',
          field: 'CategoryName',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Diễn giải',
          field: 'Explaination',
          width: 200,
          editor: 'textarea',
        },
        { title: 'Ghi chú', field: 'Note', width: 200, editor: 'textarea' },
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
          width: 50,
          hozAlign: 'center',
          formatter: () => {
            return '<i class="fas fa-trash-alt" style="color: #ff4d4f; cursor: pointer; font-size: 16px;"></i>';
          },
          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            this.removeFile(rowData);
          },
          headerHozAlign: 'center',
        },
        {
          title: 'ID',
          field: 'ID',
          width: 70,
          hozAlign: 'center',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Đường dẫn Server',
          field: 'ServerPath',
          width: 300,
          hozAlign: 'left',
          headerHozAlign: 'center',
          visible: false,
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
          visible: false,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
      ],
    });
  }

  updateFileTable() {
    if (this.fileTable) {
      // Lọc ra những file chưa bị xóa
      const activeFiles = this.fileList.filter(
        (file: any) => !file.isDeleted && !file.IsDeleted
      );

      const fileData = activeFiles.map((file: any, index: number) => ({
        ID: file.ID || index + 1,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || SERVER_PATH,
        OriginName: file.name || file.OriginName,
        file: file,
      }));
      this.fileTable.setData(fileData);
    }
  }

  removeFile(rowData: any) {
    // Tìm file trong fileList dựa trên uid của file gốc
    const fileIndex = this.fileList.findIndex(
      (file: any) => file === rowData.file
    );

    if (fileIndex !== -1) {
      const file = this.fileList[fileIndex];

      // Nếu file có ID (file đã tồn tại trên server), thêm vào danh sách xóa
      if (file.ID) {
        this.deletedFileIds.push({
          ID: file.ID,
          IsDeleted: true,
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

  // Phương thức để refresh dữ liệu bảng
  refreshTableData() {
    if (this.table && this.dataInput && this.dataInput.LstDetail) {
      const detailData = this.dataInput.LstDetail || [];
      const dataWithSTT = detailData.map((item: any, index: number) => ({
        ...item,
        STT: index + 1
      }));
      
      console.log('Refreshing table data:', dataWithSTT);
      this.table.setData(dataWithSTT);
      
      // Force redraw
      setTimeout(() => {
        this.table.redraw(true);
        console.log('Table data  after refresh:', this.table.getData());
      }, 100);
    }
  }
}

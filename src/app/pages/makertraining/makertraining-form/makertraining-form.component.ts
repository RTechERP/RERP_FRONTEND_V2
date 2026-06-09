import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzProgressModule } from 'ng-zorro-antd/progress';
// import { SelectControlComponent } from '../../select-control/select-control.component';
import { ProjectRequestServiceService } from '../../project/project-request/project-request-service/project-request-service.service';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { MakertrainingComponent } from '../makertraining.component';
import { MakertrainingService } from '../makertraining-service/makertraining.service';
import dayjs from 'dayjs';
import { forkJoin, Subscription } from 'rxjs';
import { MakertrainingTypeFormComponent } from '../makertraining-type-form/makertraining-type-form.component';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { VideoUploadStateService, UploadState } from '../../Course/course_management-form/video-upload-state.service';
import { environment } from '../../../../environments/environment';

interface PendingVideoUpload {
  file: File;
  generatedFileName: string;
  generatedUrl: string;
  progress: number;
  speed: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  uploadSubscription?: Subscription;
}

interface MakerTraining {
  STT: number;
  DepartmentID: number;
  MakerTrainingTypeID: number;
  FirmID: number;
  TrainerName: string;
  TrainingContent: string;
  IsTest: boolean;
  DateStart: Date | null;
  DateEnd: Date | null;
  Location: string;
  Note: string;
}

interface MakerTrainingEmployee {
  STT: number;
  EmployeeID: number;
  FullName: string;
  IsPass: boolean;
  Note: string;
}

interface MakerTrainingDocument {
  STT: number;
  FileName: string;
  FilePath: string;
}

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

@Component({
  selector: 'app-makertraining-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzSplitterModule,
    NzButtonModule,
    NzModalModule,
    NzCheckboxModule,
    NzUploadModule,
    NzFormModule,
    NzSpinModule,
    NzProgressModule,
    NzAutocompleteModule,
  ],
  templateUrl: './makertraining-form.component.html',
  styleUrl: './makertraining-form.component.css',
})
export class MakertrainingFormComponent implements OnInit, AfterViewInit {
  @Input() newMakerTraining: MakerTraining = {
    STT: 0,
    DepartmentID: 0,
    MakerTrainingTypeID: 0,
    FirmID: 0,
    TrainerName: '',
    TrainingContent: '',
    IsTest: false,
    DateStart: null,
    DateEnd: null,
    Location: '',
    Note: '',
  };

  @Input() newMakerTrainingEmployee: MakerTrainingEmployee = {
    STT: 0,
    EmployeeID: 0,
    FullName: '',
    IsPass: false,
    Note: '',
  };

  @Input() newMakerTrainingDocument: MakerTrainingDocument = {
    STT: 0,
    FileName: '',
    FilePath: '',
  };

  deletedFileIds: any[] = [];
  deletedEmployees: any[] = [];
  deletedDepartments: any[] = [];

  makerTrainingEmployeeDataDetail: any[] = [];
  makerTrainingEmployeeDetailTable: Tabulator | null = null;

  makerTrainingFileDataDetail: any[] = [];
  makerTrainingFileDetailTable: Tabulator | null = null;

  existingVideos: any[] = [];
  deletedVideoIds: any[] = [];
  pendingVideos: PendingVideoUpload[] = [];
  pathServer: string = '';

  dataDepartment: any[] = [];
  dataFirm: any[] = [];
  dataTrainingType: any[] = [];

  dataDocument: any[] = [];
  dateFormat = 'dd-MM-YYYY HH:mm:ss';

  isCheckmode: boolean = false;
  MakerTrainingID: number = 0;

  employeeOptions: any[] = [];
  filteredEmployeeOptions: any[] = [];

  locationOptions: string[] = ['Phòng họp 1', 'Phòng họp 2', 'Phòng họp 3', 'Online'];
  filteredLocationOptions: string[] = [];

  documentFileData: any[] = [];

  form!: FormGroup;
  isLoading: boolean = false;
  isSaveAndAddNew: boolean = false;
  hasSavedData: boolean = false;

  constructor(
    private notification: NzNotificationService,
    private makerTrainingService: MakertrainingService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private message: NzMessageService,
    private projectRequestService: ProjectRequestServiceService,
    private appUserService: AppUserService,
    private videoUploadService: VideoUploadStateService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      ID: [this.newMakerTraining?.STT === 0 ? 0 : 0], // Master ID logic might be different, but keeping it simple
      STT: [this.newMakerTraining?.STT || 0],
      DepartmentID: [this.newMakerTraining?.DepartmentID ? [this.newMakerTraining.DepartmentID] : [], [Validators.required]],
      MakerTrainingTypeID: [this.newMakerTraining?.MakerTrainingTypeID || null, [Validators.required]],
      FirmID: [this.newMakerTraining?.FirmID || null, [Validators.required]],
      TrainerName: [this.newMakerTraining?.TrainerName || '', [Validators.required, Validators.maxLength(255)]],
      TrainingContent: [this.newMakerTraining?.TrainingContent || '', [Validators.required, Validators.maxLength(2000)]],
      IsTest: [this.newMakerTraining?.IsTest || false],
      DateStart: [this.newMakerTraining?.DateStart || null, [Validators.required]],
      DateEnd: [this.newMakerTraining?.DateEnd || null, [Validators.required]],
      Location: [this.newMakerTraining?.Location || '', [Validators.maxLength(500)]],
      Note: [this.newMakerTraining?.Note || '', [Validators.maxLength(500)]],
    });

    this.getdataDepartment();
    this.getdataFirm();
    this.getDataTrainingType();
    this.loadOptionEmployee();
    this.filteredLocationOptions = [...this.locationOptions];

    this.form.get('DepartmentID')?.valueChanges.subscribe(val => {
      this.filterEmployees(val);
    });
  }

  filterEmployees(deptIds: any[]) {
    if (!deptIds || deptIds.length === 0) {
      this.filteredEmployeeOptions = [];
    } else {
      this.filteredEmployeeOptions = this.employeeOptions.filter(emp => deptIds.includes(emp.DepartmentID));
    }
    
    // Nếu bảng đã được vẽ, ép Tabulator cập nhật lại danh sách của dropdown
    if (this.makerTrainingEmployeeDetailTable) {
      const col = this.makerTrainingEmployeeDetailTable.getColumn('EmployeeID');
      if (col) {
        const def = col.getDefinition();
        if (def && def.editorParams) {
           (def.editorParams as any).values = this.filteredEmployeeOptions;
        }
      }

      // Xóa các dòng nhân viên đang có trong bảng nhưng phòng ban của họ đã bị bỏ chọn
      const currentRows = this.makerTrainingEmployeeDetailTable.getRows();
      currentRows.forEach(row => {
        const rowData = row.getData();
        if (rowData['EmployeeID']) {
          const empInfo = this.employeeOptions.find((e: any) => e.value === rowData['EmployeeID']);
          if (empInfo) {
            // Nếu phòng ban của nhân viên này không còn trong danh sách được chọn
            if (!deptIds || !deptIds.includes(empInfo.DepartmentID)) {
              if (rowData['ID']) {
                this.deletedEmployees.push(rowData['ID']);
              }
              row.delete();
              this.makerTrainingEmployeeDataDetail = this.makerTrainingEmployeeDataDetail.filter(x => x !== rowData);
            }
          }
        }
      });
    }
  }

  onLocationInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      this.filteredLocationOptions = [...this.locationOptions];
    } else {
      this.filteredLocationOptions = this.locationOptions.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  getGroupedEmployees() {
    const grouped: any = {};
    this.employeeOptions.forEach((emp: any) => {
      const groupName = emp.DepartmentName || 'Không thuộc phòng ban';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(emp);
    });
    return grouped;
  }


  ngAfterViewInit(): void {
    this.draw_makerTrainingEmployeeTable();
    this.draw_makerTrainingFileTable();

    if (this.isCheckmode) {
      this.loadMakerTrainingData();
    }
  }

  loadMakerTrainingData() {
    if (!this.MakerTrainingID) {
      this.notification.warning('Thông báo', 'Thiếu ID training !');
      return;
    }

    forkJoin({
      master: this.makerTrainingService.getMakerTrainingID(
        this.MakerTrainingID,
      ),
      details: this.makerTrainingService.getMakerTrainingData(
        this.MakerTrainingID,
      ),
    }).subscribe({
      next: ({ master, details }) => {
        if (!master?.data) {
          this.notification.warning(
            'Thông báo',
            master?.message || 'Không thể lấy thông tin đào tạo!',
          );
          return;
        }

        const makerTraining = master.data;
        const documentDetails = details?.data?.MakerTrainingDocument || [];
        const employeeDetails = details?.data?.MakerTrainingEmployeeLink || [];
        const departmentDetails = details?.data?.MakerTrainingDepartmentLink || [];
        const videoDetails = details?.data?.MakerTrainingVideoLink || [];
        console.log('test test:', details?.data?.MakerTrainingEmployeeLink);

        // --------- Master data ----------
        this.form.patchValue({
          ID: makerTraining.ID,
          STT: makerTraining.STT,
          DepartmentID: departmentDetails.map((d: any) => d.DepartmentID),
          MakerTrainingTypeID: makerTraining.MakerTrainingTypeID,
          FirmID: makerTraining.FirmID,
          TrainerName: makerTraining.TrainerName,
          TrainingContent: makerTraining.TrainingContent,
          DateStart: makerTraining.DateStart,
          DateEnd: makerTraining.DateEnd,
          IsTest: makerTraining.IsTest,
          Location: makerTraining.Location,
          Note: makerTraining.Note,
        });

        // --------- Video Training ----------
        this.existingVideos = videoDetails.map((v: any) => ({
            ID: v.ID,
            STT: v.STT,
            UrlVideo: v.UrlVideo
        }));

        // --------- Employee Training ----------
        this.makerTrainingEmployeeDataDetail = employeeDetails.map(
          (item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || '',
            IsPass: item.IsPass || false,
            Note: item.Note || '',
          }),
        );

        this.makerTrainingEmployeeDetailTable?.setData(
          this.makerTrainingEmployeeDataDetail,
        );

        // --------- Document file training----------
        this.makerTrainingFileDataDetail = documentDetails.map((item: any) => ({
          ID: item.ID || 0,
          STT: item.STT || 0,
          FileName: item.FileName || '',
          FilePath: item.FilePath || '',
        }));

        this.makerTrainingFileDetailTable?.setData(
          this.makerTrainingFileDataDetail,
        );
      },
      error: (err) => {
        console.error('Lỗi load data:', err);
        this.notification.error('Thông báo', 'Lỗi khi load dữ liệu training!');
      },
    });
  }
  //search phòng ban
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  getdataDepartment() {
    this.makerTrainingService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  getdataFirm() {
    this.makerTrainingService.getDataFirm().subscribe((response: any) => {
      this.dataFirm = response.data || [];
    });
  }

  getDataTrainingType() {
    this.makerTrainingService
      .getDataTrainingType()
      .subscribe((response: any) => {
        this.dataTrainingType = response.data || [];
      });
  }

  getMakerTrainingDocument(id: number) {
    this.makerTrainingService
      .getMakerTrainingDocumentByID(id)
      .subscribe((response: any) => {
        this.dataDocument = response.data || [];
        if (this.makerTrainingFileDetailTable) {
          this.makerTrainingFileDetailTable.setData(
            this.makerTrainingFileDataDetail,
          );
        } else {
          this.draw_makerTrainingFileTable();
        }
      });
  }

  toLocalISOString(date: Date | string): string {
    // Chuyển đổi chuỗi thành Date nếu cần
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Kiểm tra xem dateObj có hợp lệ không
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error('Invalid date input');
    }

    const tzOffset = 7 * 60; // GMT+7, tính bằng phút
    const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000); // Điều chỉnh sang GMT+7
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    return (
      adjustedDate.getUTCFullYear() +
      '-' +
      pad(adjustedDate.getUTCMonth() + 1) +
      '-' +
      pad(adjustedDate.getUTCDate()) +
      'T' +
      pad(adjustedDate.getUTCHours()) +
      ':' +
      pad(adjustedDate.getUTCMinutes()) +
      ':' +
      pad(adjustedDate.getUTCSeconds())
    ); 
  }

  closeModal(result: any = false) {
    this.activeModal.close(result || this.hasSavedData);
  }

  // loadOptionEmployee() {
  //   this.makerTrainingService.getEmployee(0).subscribe({
  //     next: (res: any) => {
  //       console.log('employeeData', res.data);
  //       const employeeData = res.data.asset;
  //       if (Array.isArray(employeeData)) {
  //         this.employeeOptions = employeeData
  //           .filter(
  //             (employee) =>
  //               employee.ID !== null &&
  //               employee.ID !== undefined &&
  //               employee.ID !== 0,
  //           )
  //           .map((employee) => ({
  //             label: employee.Code + '-' + employee.FullName,
  //             value: employee.ID,
  //             FullName: employee.FullName,
  //             Code: employee.Code,
  //           }));
  //       } else {
  //         this.employeeOptions = [];
  //       }
  //     },
  //     error: (err: any) => {
  //       console.error(err);
  //       this.notification.error(
  //         'Thông báo',
  //         'Có lỗi xảy ra khi lấy danh sách nhân viên',
  //       );
  //       this.employeeOptions = [];
  //     },
  //   });
  // }

  loadOptionEmployee() {
    this.makerTrainingService.getEmployee(0).subscribe({
      next: (res: any) => {
        const employeeData = res.data.asset;
        if (Array.isArray(employeeData)) {
          const mappedEmployees = employeeData
            .filter(
              (employee) =>
                employee.ID !== null &&
                employee.ID !== undefined &&
                employee.ID !== 0,
            )
            .map((employee) => ({
              label: employee.FullName, // Label gốc
              value: employee.ID,
              Code: employee.Code || '',
              FullName: employee.FullName,
              DepartmentID: employee.DepartmentID,
              DepartmentName:
                employee.DepartmentName || 'Không thuộc phòng ban',
              ChucVuHD: employee.ChucVuHD,
            }))
            .sort((a: any, b: any) => {
              // Sắp xếp theo phòng ban, rồi tên
              if (a.DepartmentName !== b.DepartmentName) {
                return a.DepartmentName.localeCompare(b.DepartmentName);
              }
              return a.FullName.localeCompare(b.FullName);
            })
            .map((employee: any) => {
              // Thêm prefix để rõ nhóm (Sửa thành Mã - Tên theo yêu cầu)
              employee.label = `${employee.Code} - ${employee.FullName}`;
              employee.group = employee.DepartmentName;
              return employee;
            });
            this.employeeOptions.splice(
              0,
              this.employeeOptions.length,
              ...mappedEmployees,
            );
            
            // Khởi tạo lọc lần đầu nếu form có dữ liệu
            const deptIds = this.form.get('DepartmentID')?.value;
            this.filterEmployees(deptIds);

            if (this.makerTrainingEmployeeDetailTable) {
              this.makerTrainingEmployeeDetailTable.redraw(true);
            }
          } else {
            this.employeeOptions.splice(0, this.employeeOptions.length);
            this.filteredEmployeeOptions = [];
          }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy danh sách nhân viên',
        );
        this.employeeOptions.splice(0, this.employeeOptions.length);
      },
    });
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    },
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  getDocumentFileByID(id: number) {
    this.makerTrainingService
      .getDocumentFileByID(id)
      .subscribe((response: any) => {
        this.documentFileData = response.data || [];
        if (this.makerTrainingFileDetailTable) {
          // this.newDocumentFile.FileName = this.documentData[0].ID
          this.makerTrainingFileDetailTable.setData(
            this.makerTrainingFileDataDetail,
          );
          console.log('docfile', this.documentFileData);
        } else {
          this.draw_makerTrainingFileTable();
        }
      });
  }

  downloadFile(file: any): void {
    console.log('Bắt đầu tải file:', file);
    const filePath = file.FilePath || file.FileName;
    if (!filePath) {
      console.warn('Không tìm thấy đường dẫn file:', file);
      this.notification.error(
        'Thông báo',
        'Không có đường dẫn file để tải xuống!',
      );
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    console.log('Gọi service download với path:', filePath);
    this.projectRequestService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        console.log('Nhận được blob:', blob);
        this.message.remove(loadingMsg);

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileName || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          console.error('Blob không hợp lệ hoặc rỗng');
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        this.message.remove(loadingMsg);
        console.error('Lỗi khi tải file:', res);

        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error(
                'Thông báo',
                errorText.message || 'Tải xuống thất bại!',
              );
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg =
            res?.error?.message ||
            res?.message ||
            'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        }
      },
    });
  }

  handleChange(info: any): void {
    if (info.file.status === 'uploading') {
      console.log('Đang upload...', info.file);
    }
    if (info.file.status === 'done') {
      this.notification.success('Thông báo', 'Upload file thành công!');

      const res = info.file.response; // API trả về JSON

      const uploadedFile = {
        FileName: res.FileName, // tên unique trên server
        FilePath: res.FilePath, // đường dẫn public
        MakerTrainingID: res.MakerTrainingID,
      };

      // this.newMakerTrainingDocument.push(uploadedFile);
      // 👉 thêm vào Tabulator
      this.makerTrainingFileDetailTable?.addRow(uploadedFile);
    }
    if (info.file.status === 'error') {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi upload!');
    }
  }

  save(isAddNew: boolean = false): void {
    this.isSaveAndAddNew = isAddNew;
    this.saveData();
  }

  // Video Upload Methods
  beforeUploadVideo = (file: any): boolean => {
      const totalVideos = this.existingVideos.length - this.deletedVideoIds.length + this.pendingVideos.length + 1;
      if (totalVideos > 5) {
          this.notification.error(
              NOTIFICATION_TITLE.error,
              'Chỉ được tải lên tối đa 5 video!'
          );
          return false;
      }

      const fileName = file.name.toLowerCase();
      const isValidVideo =
          file.type === 'video/mp4' ||
          file.type === 'video/webm' ||
          fileName.endsWith('.mp4') ||
          fileName.endsWith('.webm');

      if (!isValidVideo) {
          this.notification.error(
              NOTIFICATION_TITLE.error,
              'Chỉ cho phép upload video định dạng .mp4 hoặc .webm!'
          );
          return false;
      }
      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      if (file.size > maxSize) {
          this.notification.error(
              NOTIFICATION_TITLE.error,
              'Kích thước file không được vượt quá 10GB!',
          );
          return false;
      }

      const originalName = file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName =
          lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
      const extension =
          lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

      const now = new Date();
      const randStr = Math.random().toString(36).substring(2, 6);
      const timestamp =
          now.getFullYear().toString() +
          (now.getMonth() + 1).toString().padStart(2, '0') +
          now.getDate().toString().padStart(2, '0') +
          now.getHours().toString().padStart(2, '0') +
          now.getMinutes().toString().padStart(2, '0') +
          now.getSeconds().toString().padStart(2, '0') + '_' + randStr;

      const generatedFileName = `${baseName}_${timestamp}${extension}`;

      const newPendingVideo: PendingVideoUpload = {
          file: file as File,
          generatedFileName: generatedFileName,
          generatedUrl: '',
          progress: 0,
          speed: '0 KB/s',
          status: 'pending'
      };

      this.pendingVideos.push(newPendingVideo);

      if (!this.pathServer) {
          this.makerTrainingService.getVideoPathServer('MakerTraining').subscribe({
              next: (response: any) => {
                  this.pathServer = response?.data || response;
                  if (this.pathServer) {
                      newPendingVideo.generatedUrl = this.pathServer + generatedFileName;
                  } else {
                      this.notification.error(
                          NOTIFICATION_TITLE.error,
                          'Không thể lấy đường dẫn server!'
                      );
                  }
              },
              error: (error) => {
                  console.error('Error getting path server:', error);
                  this.notification.error(
                      NOTIFICATION_TITLE.error,
                      'Không thể lấy đường dẫn server!'
                  );
              }
          });
      } else {
          newPendingVideo.generatedUrl = this.pathServer + generatedFileName;
      }

      return false;
  };

  removePendingVideo(index: number): void {
      const video = this.pendingVideos[index];
      if (video && video.uploadSubscription) {
          video.uploadSubscription.unsubscribe();
      }
      this.pendingVideos.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  deleteExistingVideo(video: any) {
    if (!video.ID) return;
    const index = this.deletedVideoIds.indexOf(video.ID);
    if (index > -1) {
      this.deletedVideoIds.splice(index, 1);
    } else {
      this.deletedVideoIds.push(video.ID);
    }
  }

  private startBackgroundVideoUploads(lessonId: number): Promise<string[]> {
      const uploadPromises = this.pendingVideos.map(pendingVideo => {
          return new Promise<string>((resolve, reject) => {
              if (!pendingVideo.generatedFileName || !pendingVideo.generatedUrl) {
                  reject('Video URL chưa được tạo. Vui lòng thử lại.');
                  return;
              }

              const endpoint = environment.host + 'api/tus/upload-video';

              const uploadState$ = this.videoUploadService.startUpload(
                  lessonId,
                  pendingVideo.file,
                  endpoint,
                  pendingVideo.generatedFileName,
                  this.pathServer,
              );

              pendingVideo.status = 'uploading';
              pendingVideo.uploadSubscription = uploadState$.subscribe(state => {
                  pendingVideo.progress = state.progress;
                  pendingVideo.speed = state.speed;
                  pendingVideo.status = state.status;
                  this.cdr.detectChanges();
              });

              resolve(pendingVideo.generatedUrl);
          });
      });

      return Promise.all(uploadPromises).then(urls => {
          // Do not clear pendingVideos yet so user can see progress bar
          // Instead, clear it on form reset
          return urls;
      });
  }

  async saveData(): Promise<void> {
    this.form.patchValue({
      TrainerName: (this.form.value.TrainerName || '').trim(),
      TrainingContent: (this.form.value.TrainingContent || '').trim(),
      Location: (this.form.value.Location || '').trim(),
      Note: (this.form.value.Note || '').trim(),
    });

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Thông báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc!',
      );
      return;
    }

    const subPath = this.getSubPath(this.form.value.DateStart);
    
    // Upload videos first if selected
    let uploadedVideoUrls: string[] = [];
    if (this.pendingVideos.length > 0) {
        try {
            const lessonId = this.isCheckmode ? this.MakerTrainingID : 0;
            uploadedVideoUrls = await this.startBackgroundVideoUploads(lessonId);
        } catch (error: any) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                `Lỗi upload video: ${error}`,
            );
            return;
        }
    }

    if (this.isCheckmode == true) {
      // Update mode
      const filesToUpload: File[] = (
        this.makerTrainingFileDetailTable?.getData() || []
      )
        .filter((f: any) => f?.File && !f?.FilePath)
        .map((f: any) => f.File as File);

      if (filesToUpload.length > 0) {
        this.message.loading('Đang upload file...', { nzDuration: 0 });
        this.makerTrainingService
          .uploadMultipleFiles(filesToUpload, subPath)
          .subscribe({
            next: (res: any) => {
              this.message.remove();
              if (res?.status === 1 && Array.isArray(res?.data)) {
                const rows = this.makerTrainingFileDetailTable?.getRows() || [];
                let fileIndex = 0;
                rows.forEach((row: any) => {
                  const f = row.getData();
                  if (f?.File && !f?.FilePath && res.data[fileIndex]) {
                    row.update({
                      FilePath: res.data[fileIndex].FilePath || '',
                    });
                    fileIndex++;
                  }
                });
              }
              this.executeSaveData(uploadedVideoUrls);
            },
            error: (err: any) => {
              this.message.remove();
              this.notification.error('Thông báo', 'Upload file thất bại!');
            },
          });
      } else {
        this.executeSaveData(uploadedVideoUrls);
      }
    } else {
      // Insert mode
      const filesToUpload: File[] = (
        this.makerTrainingFileDetailTable?.getData() || []
      )
        .filter((f: any) => f?.File && !f?.FilePath)
        .map((f: any) => f.File as File);

      if (filesToUpload.length > 0) {
        this.message.loading('Đang upload file...', { nzDuration: 0 });
        this.makerTrainingService
          .uploadMultipleFiles(filesToUpload, subPath)
          .subscribe({
            next: (res: any) => {
              this.message.remove();
              if (res?.status === 1 && Array.isArray(res?.data)) {
                const rows = this.makerTrainingFileDetailTable?.getRows() || [];
                let fileIndex = 0;
                rows.forEach((row: any) => {
                  const f = row.getData();
                  if (f?.File && !f?.FilePath && res.data[fileIndex]) {
                    row.update({
                      FilePath: res.data[fileIndex].FilePath || '',
                    });
                    fileIndex++;
                  }
                });
              }
              this.executeSaveData(uploadedVideoUrls);
            },
            error: (err: any) => {
              this.message.remove();
              this.notification.error('Thông báo', 'Upload file thất bại!');
            },
          });
      } else {
        this.executeSaveData(uploadedVideoUrls);
      }
    }
  }

  executeSaveData(uploadedVideoUrls: string[] = []): void {
    const formValue = this.form.value;
    if (this.isCheckmode == true) {
      const payload = {
        MakerTraining: {
          ID: this.MakerTrainingID, // ID cho update
          MakerTrainingTypeID: formValue.MakerTrainingTypeID,
          FirmID: formValue.FirmID,
          TrainerName: formValue.TrainerName,
          TrainingContent: formValue.TrainingContent,
          IsTest: formValue.IsTest,
          DateStart: formValue.DateStart
            ? this.toLocalISOString(formValue.DateStart)
            : '',
          DateEnd: formValue.DateEnd
            ? this.toLocalISOString(formValue.DateEnd)
            : '',
          Location: formValue.Location,
          Note: formValue.Note,
          IsDeleted: false,
        },
        MakerTrainingEmployeeLink: [
          ...(this.makerTrainingEmployeeDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              STT: item.STT || 0,
              EmployeeID: item.EmployeeID || 0,
              FullName: item.FullName || '',
              IsPass: item.IsPass || false,
              Note: item.Note || '',
              IsDeleted: false,
            })) || []),
        ],
        MakerTrainingDepartmentLink: formValue.DepartmentID ? formValue.DepartmentID.map((deptId: any) => ({
          ID: 0,
          STT: 0,
          DepartmentID: deptId,
          IsDeleted: false
        })) : [],
        MakerTrainingDocument: [
          ...(this.makerTrainingFileDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              STT: item.STT || 0,
              FileName: item.FileName || '',
              FilePath: item.FilePath || '',
              IsDeleted: false,
            })) || []),
        ],
        MakerTrainingVideoLink: [
          ...this.existingVideos.map((v) => ({
              ID: v.ID,
              STT: v.STT,
              UrlVideo: v.UrlVideo,
              IsDeleted: this.deletedVideoIds.includes(v.ID)
          })),
          ...uploadedVideoUrls.map(url => ({
              ID: 0,
              STT: 0,
              UrlVideo: url,
              IsDeleted: false
          }))
        ],
        DeletedFileIds: this.deletedFileIds,
        DeletedEmployees: this.deletedEmployees,
        DeletedDepartments: this.deletedDepartments,
        DeletedVideoIds: this.deletedVideoIds,
      };

      this.makerTrainingService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.hasSavedData = true;
            if (this.isSaveAndAddNew) {
              this.resetForm();
            } else {
              this.closeModal(true);
            }
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể cập nhật !',
            );
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error('Lỗi khi cập nhật:', err);
        },
      });
    } else {
      // Insert mode
      const payload = {
        MakerTraining: {
          ID: 0,
          STT: formValue.STT,
          MakerTrainingTypeID: formValue.MakerTrainingTypeID,
          FirmID: formValue.FirmID,
          TrainerName: formValue.TrainerName,
          TrainingContent: formValue.TrainingContent,
          IsTest: formValue.IsTest,
          DateStart: formValue.DateStart
            ? this.toLocalISOString(formValue.DateStart)
            : '',

          DateEnd: formValue.DateEnd
            ? this.toLocalISOString(formValue.DateEnd)
            : '',
          Location: formValue.Location,
          Note: formValue.Note,
          IsDeleted: false,
        },
        MakerTrainingEmployeeLink: [
          ...(this.makerTrainingEmployeeDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              STT: item.STT || 0,
              EmployeeID: item.EmployeeID || 0,
              FullName: item.FullName || '',
              IsPass: item.IsPass || false,
              Note: item.Note || '',
              IsDeleted: false,
            })) || []),
        ],
        MakerTrainingDepartmentLink: formValue.DepartmentID ? formValue.DepartmentID.map((deptId: any) => ({
          ID: 0,
          STT: 0,
          DepartmentID: deptId,
          IsDeleted: false
        })) : [],
        MakerTrainingDocument: [
          ...(this.makerTrainingFileDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              STT: item.STT || 0,
              FileName: item.FileName || '',
              FilePath: item.FilePath || '',
              IsDeleted: false,
            })) || []),
        ],
        MakerTrainingVideoLink: [
          ...this.existingVideos.map((v) => ({
              ID: v.ID,
              STT: v.STT,
              UrlVideo: v.UrlVideo,
              IsDeleted: this.deletedVideoIds.includes(v.ID)
          })),
          ...uploadedVideoUrls.map(url => ({
              ID: 0,
              STT: 0,
              UrlVideo: url,
              IsDeleted: false
          }))
        ],
        DeletedFileIds: this.deletedFileIds,
        DeletedEmployees: this.deletedEmployees,
        DeletedDepartments: this.deletedDepartments,
        DeletedVideoIds: this.deletedVideoIds,
      };
      console.log('payload save: ', payload);

      this.makerTrainingService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.hasSavedData = true;
            if (this.isSaveAndAddNew) {
              this.resetForm();
            } else {
              this.closeModal(true);
            }
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể thêm mới biên bản họp!',
            );
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
          console.error('Lỗi khi thêm mới:', err);
        },
      });
    }
  }

  resetForm() {
    this.form.reset({
      ID: 0,
      STT: 0,
      DepartmentID: [],
      MakerTrainingTypeID: null,
      FirmID: null,
      TrainerName: '',
      TrainingContent: '',
      IsTest: false,
      DateStart: null,
      DateEnd: null,
      Location: '',
      Note: '',
    });
    this.makerTrainingEmployeeDataDetail = [];
    this.makerTrainingFileDataDetail = [];
    if (this.makerTrainingEmployeeDetailTable) {
      this.makerTrainingEmployeeDetailTable.setData([]);
    }
    if (this.makerTrainingFileDetailTable) {
      this.makerTrainingFileDetailTable.setData([]);
    }
    this.deletedEmployees = [];
    this.deletedFileIds = [];
    this.deletedDepartments = [];
    this.existingVideos = [];
    this.deletedVideoIds = [];
    this.pendingVideos.forEach(v => v.uploadSubscription?.unsubscribe());
    this.pendingVideos = [];
  }

  onAddMakerTrainingType() {
    const modalRef = this.modalService.open(MakertrainingTypeFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result
      .then((result) => {
        if (result) {
          this.getDataTrainingType();
        }
      })
      .catch(() => {});
  }

  draw_makerTrainingEmployeeTable() {
    if (this.makerTrainingEmployeeDetailTable) {
      this.makerTrainingEmployeeDetailTable.replaceData(
        this.makerTrainingEmployeeDataDetail,
      );
    } else {
      this.makerTrainingEmployeeDetailTable = new Tabulator(
        '#makerTrainingEmployeeDetail',
        {
          data: this.makerTrainingEmployeeDataDetail,
          layout: 'fitColumns',
          height: '100%',
          movableColumns: true,
          // movableRows: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 1,
          columns: [
            {
              title: '',
              field: 'addRow',
              hozAlign: 'center',
              width: 40,
              headerSort: false,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%; cursor: pointer;"><i class="fas fa-plus text-success" title="Thêm dòng"></i> </div>`,
              headerClick: () => {
                this.addRow();
              },
              formatter: () =>
                `<i style="cursor: pointer;" class="fas fa-times text-danger delete-btn" title="Xóa dòng"></i>`,
              cellClick: (e, cell) => {
                if ((e.target as HTMLElement).classList.contains('fas')) {
                  this.modal.confirm({
                    nzTitle: 'Xác nhận xóa',
                    nzContent: 'Bạn có chắc chắn muốn xóa không?',
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                      const row = cell.getRow();
                      const rowData = row.getData();
                      const rowIndex =
                        this.makerTrainingEmployeeDataDetail.indexOf(rowData);
                      if (rowData['ID']) {
                        this.deletedEmployees.push(rowData['ID']);
                      }
                      row.delete();
                      this.makerTrainingEmployeeDataDetail =
                        this.makerTrainingEmployeeDataDetail.filter(
                          (x) => x !== rowData,
                        );
                      // this.saveData();
                    },
                  });
                }
              },
            },
            {
              title: 'STT',
              hozAlign: 'center',
              formatter: 'rownum',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'Mã nhân viên',
              field: 'EmployeeID',
              headerHozAlign: 'center',
              editor: 'list',
              editorParams: {
                values: this.filteredEmployeeOptions,
                listOnEmpty: true,
                autocomplete: true,
                groupValues: true,
                itemFormatter: (label: string, value: any, item: any) => {
                  return `
                    <div style="display: flex; flex-direction: column; padding: 4px 0;">
                      <div style="font-weight: 600; color: #333; margin-bottom: 2px;">${label}</div>
                      <div style="font-size: 11px; color: #666; display: flex; align-items: center; gap: 8px;">
                        <span><i class="fas fa-user-tag" style="font-size: 10px; color: #aaa;"></i> ${item.ChucVuHD || 'N/A'}</span>
                        <span style="color: #ccc;">|</span>
                        <span style="color: #2f54eb;"><i class="fas fa-building" style="font-size: 10px; color: #adc6ff;"></i> ${item.DepartmentName || ''}</span>
                      </div>
                    </div>
                  `;
                },
              } as any,
              formatter: (cell) => {
                const val = cell.getValue();
                const employee = this.employeeOptions.find(
                  (p: any) => String(p.value) == String(val),
                );
                return employee ? employee.Code : val || '';
              },
              cellEdited: (cell) => {
                const newValue = cell.getValue();
                const selectedEmployee = this.employeeOptions.find(
                  (p: any) => String(p.value) == String(newValue),
                );
                if (selectedEmployee) {
                  cell.getRow().update({
                    FullName: selectedEmployee.FullName,
                  });
                }
              },
            },
            {
              title: 'Tên nhân viên',
              field: 'FullName',
              headerHozAlign: 'center',
            },
            {
              title: 'Đánh giá',
              field: 'IsPass',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                const isPass = value === true || value === 1;
                const bg = isPass
                  ? 'rgba(82, 196, 26, 0.1)'
                  : 'rgba(245, 34, 45, 0.1)';
                const border = isPass ? '#52c41a' : '#f5222d';
                const color = isPass ? '#52c41a' : '#f5222d';
                const text = isPass ? 'ĐẠT' : 'CHƯA ĐẠT';

                return `<div style="background: ${bg}; border: 1px solid ${border}; color: ${color}; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; text-align: center; width: 80px; margin: 0 auto;">${text}</div>`;
              },
              editor: 'tickCross',
            },

            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              editor: 'textarea',
              formatter: 'textarea',
            },
          ],
        },
      );
    }
  }
  addRow() {
    if (this.makerTrainingEmployeeDetailTable) {
      this.makerTrainingEmployeeDetailTable.addRow({
        STT: 0,
        Code: '',
        FullName: '',
        IsPass: false,
        Note: '',
      });
    }
  }

  draw_makerTrainingFileTable() {
    if (this.makerTrainingFileDetailTable) {
      this.makerTrainingFileDetailTable.replaceData(
        this.makerTrainingFileDataDetail,
      );
    } else {
      this.makerTrainingFileDetailTable = new Tabulator(
        '#makerTrainingFileDetail',
        {
          data: this.makerTrainingFileDataDetail,
          layout: 'fitColumns',
          height: '100%',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 1,
          columns: [
            {
              title: '',
              field: 'addRow',
              hozAlign: 'center',
              width: 40,
              headerSort: false,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%; cursor: pointer;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
              headerClick: () => {
                this.openFileSelector_MakerTrainingFile();
              },
              formatter: () =>
                `<i style="cursor: pointer;" class="fas fa-times text-danger delete-btn" title="Xóa dòng"></i>`,
              cellClick: (e, cell) => {
                if ((e.target as HTMLElement).classList.contains('fas')) {
                  this.modal.confirm({
                    nzTitle: 'Xác nhận xóa',
                    nzContent: 'Bạn có chắc chắn muốn xóa không?',
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                      const row = cell.getRow();
                      const rowData = row.getData();
                      if (rowData['ID']) {
                        this.deletedFileIds.push(rowData['ID']);
                      }
                      row.delete();
                      this.makerTrainingFileDataDetail =
                        this.makerTrainingFileDataDetail.filter(
                          (x) => x !== rowData,
                        );
                    },
                  });
                }
              },
            },
            {
              title: 'ID',
              field: 'ID',
              headerHozAlign: 'center',
              visible: false,
            },
            {
              title: 'STT',
              hozAlign: 'center',
              formatter: 'rownum',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'Tên file',
              field: 'FileName',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const fileName = cell.getValue();
                const data = cell.getRow().getData();
                if (fileName && (data['FilePath'] || data['File'])) {
                  return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${fileName}</span>`;
                }
                return fileName || 'Chưa có file';
              },
              cellClick: (e, cell) => {
                console.log('FileName column click!', cell.getData());
                const data = cell.getRow().getData();
                if (data['FilePath']) {
                  this.downloadFile(data);
                } else {
                  console.warn('FilePath empty, cannot download');
                }
              },
              width: 200,
            },
            {
              title: 'Đường dẫn',
              field: 'FilePath',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const url = cell.getValue();
                if (url) {
                  return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${url}</span>`;
                }
                return url || '';
              },
              cellClick: (e, cell) => {
                console.log('FilePath column click!', cell.getData());
                const data = cell.getRow().getData();
                if (data['FilePath']) {
                  this.downloadFile(data);
                } else {
                  console.warn('FilePath empty, cannot download');
                }
              },
            },
          ],
        },
      );
    }

    // Luôn gắn lại sự kiện dblclick cho chắc chắn
    if (this.makerTrainingFileDetailTable) {
      this.makerTrainingFileDetailTable.off('rowDblClick');
      this.makerTrainingFileDetailTable.on('rowDblClick', (e, row) => {
        console.log('Row double clicked!', row.getData());
        const data = row.getData();
        if (data['FilePath']) {
          this.downloadFile(data);
        }
      });
    }
  }

  private getSubPath(dateReport: any): string {
    const dt = dateReport
      ? DateTime.fromJSDate(new Date(dateReport))
      : DateTime.local();
    const year = dt.isValid
      ? dt.toFormat('yyyy')
      : DateTime.local().toFormat('yyyy');
    const month = dt.isValid
      ? dt.toFormat('MM')
      : DateTime.local().toFormat('MM');
    const userId =
      this.appUserService.id || this.appUserService.employeeID || 0;
    return `MakerTraining/${year}/${month}/${userId}`;
  }

  addRow_MakerTrainingFile() {
    if (this.makerTrainingFileDetailTable) {
      this.makerTrainingFileDetailTable.addRow({
        STT: 0,
        FileName: '',
        FilePath: '',
      });
    }
  }

  openFileSelector_MakerTrainingFile(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        const newFile = {
          FileName: file.name,
          File: file,
          FilePath: '',
          ID: 0,
        };

        if (this.makerTrainingFileDetailTable) {
          this.makerTrainingFileDetailTable.addRow(newFile);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }
}

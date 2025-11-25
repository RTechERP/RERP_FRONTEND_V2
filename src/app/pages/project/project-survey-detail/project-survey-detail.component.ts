import { ProjectPriorityDetailComponent } from './../project-priority-detail/project-priority-detail.component';
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../project-service/project.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ViewContainerRef } from '@angular/core';
import { SelectLeaderComponent } from '../project-control/select-leader.component';

import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { ProjectStatusDetailComponent } from '../project-status-detail/project-status-detail.component';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { NzFormLayoutType, NzFormModule } from 'ng-zorro-antd/form';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
@Component({
  selector: 'app-project-survey-detail',
  imports: [
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTabsModule,
    NzModalModule,
    CommonModule,
    NzCheckboxModule,
    NzFormModule,
    ReactiveFormsModule,
    NzUploadModule,
  ],
  standalone: true,
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './project-survey-detail.component.html',
  styleUrl: './project-survey-detail.component.css',
})
export class ProjectSurveyDetailComponent implements OnInit, AfterViewInit {
  //#region validate form
  private fb = inject(NonNullableFormBuilder);

  // Custom validator để kiểm tra string không chỉ có khoảng trắng
  trimRequiredValidator = (control: any) => {
    if (!control.value || typeof control.value !== 'string') {
      return { required: true };
    }
    if (control.value.trim().length === 0) {
      return { required: true };
    }
    return null;
  };

  // Custom validator cho số điện thoại (cho phép khoảng trắng, dấu gạch ngang)
  phoneNumberValidator = (control: any) => {
    const value = control?.value;
    if (!value || value.trim().length === 0) {
      return { required: true };
    }
    
    // Loại bỏ khoảng trắng, dấu gạch ngang, dấu ngoặc để validate
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    // Pattern: 0[0-9]{9} hoặc (+84|84)[0-9]{9,10}
    const phonePattern = /^(0[0-9]{9}|(\+84|84)[0-9]{9,10})$/;
    
    if (!phonePattern.test(cleanPhone)) {
      return { phoneInvalid: true };
    }
    
    return null;
  };

  validateForm = this.fb.group({
    formLayout: this.fb.control<NzFormLayoutType>('vertical'),
    projectId: this.fb.control('', [Validators.required]),
    leaderId: this.fb.control(''),
    reasonUrgent: this.fb.control(''),
    address: this.fb.control('', [Validators.required, this.trimRequiredValidator]),
    customerName: this.fb.control('', [Validators.required, this.trimRequiredValidator]),
    customerPhoneNum: this.fb.control('', [this.phoneNumberValidator]),
    descripsion: this.fb.control('', [Validators.required, this.trimRequiredValidator]),
    dateStart: this.fb.control(DateTime.local().plus({ day: 1 }).toISO()),
    dateEnd: this.fb.control(DateTime.local().plus({ day: 1 }).toISO()),
    note: this.fb.control(''),
    isUrgent: this.fb.control(false),
  });

  //#endregion
  //#region Khai báo biến
  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    private authService: AuthService
  ) {}

  @Input() projectSurveyId: any = 0;
  @Input() projectId: any = 0;
  @Input() isEdit: any = 0;
  @Input() canEdit: boolean = true; // Quyền sửa, mặc định là true

  @ViewChild('tb_projectSurveyFile', { static: false })
  tb_projectSurveyFileContainer!: ElementRef;
  @ViewChild('tb_projectSurveyDetail', { static: false })
  tb_projectSurveyDetailContainer!: ElementRef;

  tb_projectSurveyFile: any;
  tb_projectSurveyDetail: any;

  isAdmin: boolean = false;
  projects: any;
  customers: any;
  employees: any;
  statuses: any;

  customerId: any;
  endUserId: any;
  saleId: any;
  technicalId: any;
  pmId: any;
  userRequestId: any;
  statusId: any;

  fileList: any[] = [];
  fileDeletedIds: any[] = [];

  dictLeader: { [key: number]: string } = {};
  projectUserTeams: any[] = [];

  isLoad: any = true;
  isDisSave: any = false;

  currentUser: any;
  //#endregion

  //#region Chạy khi mở trương trình
  ngOnInit(): void {
    // this.isAdmin = !this.projectService.ISADMIN;
    // this.userRequestId =this.currentUser.ID ;
   
  }

  ngAfterViewInit(): void {
    this.drawTbProjectSurveyFile(
      this.tb_projectSurveyFileContainer.nativeElement
    );
    this.drawTbProjectSurveyDetail(
      this.tb_projectSurveyDetailContainer.nativeElement
    );
    this.getProjects();
    this.getCustomers();
    this.getStatuses();
    this.getEmployees();
    this.getUserTeams();
    this.getFileDetail();
    this.getCurrentUser();
    this.getDetail();
    this.onUrgentChange(this.validateForm.get('isUrgent')?.value || false);

    // Subscribe to projectId changes
    this.validateForm.get('projectId')?.valueChanges.subscribe((value) => {
      this.projectId = value || 0;
      this.getDataByProjectId();
    });

    // Subscribe to isUrgent changes
    this.validateForm.get('isUrgent')?.valueChanges.subscribe((value) => {
      this.onUrgentChange(value || false);
    });
  }
  getCurrentUser(){
    this.authService.getCurrentUser().subscribe({
    next: (response: any) => {
      this.currentUser = response.data;
    },
    error: (error: any) => {
      const msg = error.message || 'Lỗi không xác định';
      this.notification.error(NOTIFICATION_TITLE.error, msg);
      console.error('Lỗi:', error.error);
    },
  })
  }
  

  getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
        this.getDataByProjectId();
      },
      error: (response: any) => {
        console.error('Lỗi:', response.error);
      },
    });
  }

  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getStatuses() {
    this.projectService.getStatusProjectEmployee().subscribe({
      next: (response: any) => {
        this.statuses = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
        console.log(response.data);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getTbDetail() {
    let data = {
      projectSurveyId: this.projectSurveyId ? this.projectSurveyId : 0,
      projectId: this.projectId ? this.projectId : 0,
    };
    this.projectService.getTbDetail(data).subscribe({
      next: (response: any) => {
        console.log('detail', response.data);
        let data = this.projectService.setDataTree(
          response.data,
          'ProjectTypeID'
        );
        this.tb_projectSurveyDetail.setData(data);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion

  //#region Xử lý bảng file
  drawTbProjectSurveyFile(container: HTMLElement) {
    this.tb_projectSurveyFile = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '30vh',
      layout: 'fitColumns',
      locale: 'vi',
      rowHeader: false,
      pagination: false,
      data: this.fileList.map((file: any) => ({
        ID: file.ID || 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        File: file.originFile || file.File,
        file: file,
      })),
      columns: [
        {
          title: '',
          field: 'actions',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm file"></i></div>`,
          headerClick: () => {
            this.openFileSelector();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              const row = cell.getRow();
              const rowData = row.getData();
              const id = rowData['ID'];
              const fileName = rowData['FileName'];

              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: `Bạn có chắc chắn muốn xóa file "${fileName}"?`,
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.fileDeletedIds.includes(id)) {
                      this.fileDeletedIds.push(id);
                    }
                  }
                  
                  // Xóa khỏi fileList
                  const index = this.fileList.findIndex(
                    (f) => f.name === fileName || f.FileName === fileName
                  );
                  if (index > -1) {
                    this.fileList.splice(index, 1);
                  }
                  
                  row.delete();
                },
              });
            }
          },
        },
        {
          title: 'Tên file',
          field: 'FileName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          widthGrow: 1,
          formatter: 'textarea',
        },
      ],
    });
  }
  //#endregion
  //#region Xử lý bảng khảo sát dự án
  drawTbProjectSurveyDetail(container: HTMLElement) {
    const contextMenu = [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fa-regular fa-eye"></i> Xem file đính kèm</span>',
        action: (e: any, row: any) => {
          this.viewFiles();
        },
      },
    ];
    this.tb_projectSurveyDetail = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination:false,
      rowHeader:false,
      height: '50vh',
      layout: 'fitDataStretch',
      locale: 'vi',
      dataTree: true,
      dataTreeStartExpanded: true,
      rowContextMenu: contextMenu,
      rowFormatter: function (row) {
        let data = row.getData();

        let select = data['Selected'];

        if (select) {
          row.getElement().style.backgroundColor = 'LightYellow';
        } else {
          row.getElement().style.pointerEvents = 'none';
        }
      },
      columns: [
        {
          title: 'Chọn',
          field: 'selectRow',
          formatter: function (cell, formatterParams, onRendered) {
            const checked = cell.getValue() ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          cellClick: (e, cell) => {
            const newValue = !cell.getValue();
            const row = cell.getRow();

            if (row.getTreeChildren && row.getTreeChildren().length > 0) {
              const children = row.getTreeChildren();

              children.forEach((childRow) => {
                const childData = childRow.getData();
                childRow.update({ selectRow: newValue });
              });
            }
            cell.setValue(newValue);
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: '30px',
          frozen: true,
        },
        {
          title: 'Kiểu dự án',
          field: 'Selected',
          formatter: function (cell, formatterParams, onRendered) {
            const checked = cell.getValue() ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          cellClick: function (e, cell) {
            const newValue = !cell.getValue();
            const row = cell.getRow();
            if (row.getTreeChildren && row.getTreeChildren().length > 0) {
              const children = row.getTreeChildren();

              children.forEach((childRow) => {
                const childData = childRow.getData();
                childRow.update({ Selected: newValue });
              });
            }
            cell.setValue(newValue);
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Kiểu Khảo sát',
          field: 'IsSelectedSurvey',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            const checked = cell.getValue() ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          hozAlign: 'center',
          width: 120,
        },
        {
          title: 'Tên kiểu',
          field: 'ProjectTypeName',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Leader (*)',
          field: 'LeaderID',
          headerHozAlign: 'center',
          editor: this.createdControl(
            SelectLeaderComponent,
            this.injector,
            this.appRef,
            this.projectUserTeams
          ),
          formatter: (cell) => {
            const val = cell.getValue();
            console.log(this.dictLeader);
            return val
              ? `<div class="d-flex justify-content-between align-items-center" style="width: 100%; min-width: 100%; box-sizing: border-box;"><p class="m-0" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.dictLeader[val]}</p> <i class="fas fa-angle-down" style="flex-shrink: 0; margin-left: 8px;"></i></div>`
              : '<div class="d-flex justify-content-between align-items-center" style="width: 100%; min-width: 100%; box-sizing: border-box;"><p class="m-0" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Chọn leader</p> <i class="fas fa-angle-down" style="flex-shrink: 0; margin-left: 8px;"></i></div>';
          },
          width: 250,
        },
        {
          title: 'Trạng thái',
          headerHozAlign: 'center',
          field: 'StatusText',
          width: 120,
        },
        {
          title: 'Người phụ trách',
          headerHozAlign: 'center',
          field: 'FullNameTechnical',
          width: 150,
        },
        {
          title: 'Kết quả',
          headerHozAlign: 'center',
          field: 'Result',
          width: 150,
        },
        {
          title: 'Lý do hủy',
          headerHozAlign: 'center',
          field: 'ReasonCancel',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Ghi chú',
          headerHozAlign: 'center',
          field: 'Note',
          width: 150,
          formatter: 'textarea',
          editable: true,
          editor: 'textarea',
        },
      ],
    });
  }
  //#endregion
  //#region Trạng thái duyệt gấp
  onUrgentChange(value: boolean) {
    const leaderCtrl = this.validateForm.get('leaderId');
    const reasonUrgentCtrl = this.validateForm.get('reasonUrgent');

    if (value) {
      leaderCtrl?.setValidators([Validators.required]);
      reasonUrgentCtrl?.setValidators([Validators.required, this.trimRequiredValidator]);
    } else {
      leaderCtrl?.clearValidators();
      reasonUrgentCtrl?.clearValidators();
    }
    leaderCtrl?.updateValueAndValidity();
    reasonUrgentCtrl?.updateValueAndValidity();
  }
  //#endregion

  //#region Upload file
  beforeUpload = (file: any): boolean => {
    console.log('file', file);
    
    // Check duplicate
    const isDuplicate = this.fileList.some(f => 
      f.name === file.name && f.size === file.size
    );
    
    if (isDuplicate) {
      console.warn('File đã tồn tại:', file.name);
      return false;
    }
    
    const newFile = {
      uid: Math.random().toString(36).substring(2) + Date.now(),
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
    
    return false; // Prevent auto upload
  };

  updateFileTable() {
    if (this.tb_projectSurveyFile) {
      // Clear table trước
      this.tb_projectSurveyFile.clearData();
      
      const activeFiles = this.fileList.filter(
        (file: any) => !file.isDeleted && !file.IsDeleted
      );
  
      const fileData = activeFiles.map((file: any, index: number) => ({
        ID: file.ID || 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        File: file.originFile || file.File,
        file: file,
      }));
      
      this.tb_projectSurveyFile.addData(fileData);
    }
  }

  openFileSelector() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        // Check duplicate
        const isDuplicate = this.fileList.some(f => 
          f.name === file.name && f.size === file.size
        );
        
        if (isDuplicate) {
          console.warn('File đã tồn tại:', file.name);
          return;
        }

        const newFile = {
          uid: Math.random().toString(36).substring(2) + Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'new',
          originFile: file,
          FileName: file.name,
          ServerPath: '',
          OriginName: file.name,
          File: file,
        };

        this.fileList = [...this.fileList, newFile];
        this.updateFileTable();
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  getSubPath(): string {
    if (this.projects != null && this.projects.length > 0) {
      const project = this.projects.find((p: any) => p.ID === this.projectId);
      if (project && project.CreatedDate && project.ProjectCode) {
        const year = new Date(project.CreatedDate).getFullYear();
        return `${year}\\${project.ProjectCode}\\TaiLieuChung\\ThongTinKhaoSat`;
      }
    }
    return '';
  }

  prepareFileData(): any[] {
    const fileData: any[] = [];
    
    // Xử lý file đã có (có ID) - file đã tồn tại trên server
    this.fileList.forEach((file: any) => {
      if (!file) return;
      
      if (file.ID && file.ID > 0) {
        // File đã tồn tại, cần update
        fileData.push({
          ID: file.ID,
          FileName: file.FileName || file.name || file.OriginName || '',
          OriginPath: file.OriginName || file.name || file.FileName || '',
          ServerPath: file.ServerPath || '',
          ProjectSurveyID: this.projectSurveyId || 0,
        });
      } else if (file.ServerPath) {
        // File mới đã upload, có ServerPath, cần create
        fileData.push({
          ID: 0,
          FileName: file.FileName || file.name || file.OriginName || '',
          OriginPath: file.OriginName || file.name || file.FileName || '',
          ServerPath: file.ServerPath,
          ProjectSurveyID: this.projectSurveyId || 0,
        });
      }
      // File mới chưa upload (không có ServerPath) sẽ không được thêm vào
      // Vì đã được upload ở bước trước
    });

    // Xử lý file đã bị xóa - API sẽ set IsDeleted = true
    // Không cần thêm vào fileData, chỉ cần có trong deletedFiles

    return fileData;
  }
  //#endregion
  //#region Xử lý select leader
  getUserTeams() {
    this.projectService.getUserTeams().subscribe({
      next: (response: any) => {
        this.projectUserTeams = response.data;
        this.getTbDetail();
        this.createLabelsFromData();
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  createLabelsFromData() {
    this.dictLeader = {};

    this.projectUserTeams.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.dictLeader[item.EmployeeID]) {
        this.dictLeader[item.EmployeeID] = item.FullName;
      }
    });
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.minWidth = '100%';
      container.style.boxSizing = 'border-box';
      
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      console.log(this.projectUserTeams);
      componentRef.instance.leaderId = cell.getValue();
      componentRef.instance.leaders = this.projectUserTeams;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
        // Set width cho dropdown sau khi render
        setTimeout(() => {
          const cellElement = cell.getElement();
          if (cellElement) {
            const cellWidth = cellElement.offsetWidth;
            const dropdown = document.querySelector('.leader-select-dropdown') as HTMLElement;
            if (dropdown) {
              dropdown.style.minWidth = cellWidth + 'px';
            }
          }
        }, 100);
      });

      return container;
    };
  }
  //#endregion
  //#region Lấy dữ liệu chi tiết các trường
  getDetail() {
    if (this.projectSurveyId > 0) {
      let data = {
        projectSurveyId: this.projectSurveyId,
      };
      this.projectService.getDetail(data).subscribe({
        next: (response: any) => {
          let data = response.data;
          if (data) {
            const dateStart = data.DateStart
              ? DateTime.fromISO(data.DateStart)
                  .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                  .toUTC()
                  .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
              : DateTime.local().plus({ day: 1 }).toISO();
            const dateEnd = data.DateEnd
              ? DateTime.fromISO(data.DateEnd)
                  .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                  .toUTC()
                  .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
              : DateTime.local().plus({ day: 1 }).toISO();

            this.validateForm.patchValue({
              projectId: this.projectId || '',
              leaderId: data.ApprovedUrgentID || '',
              reasonUrgent: data.ReasonUrgent || '',
              address: data.Address || '',
              customerName: data.PIC || '',
              customerPhoneNum: data.PhoneNumber || '',
              descripsion: data.Description || '',
              dateStart: dateStart,
              dateEnd: dateEnd,
              note: data.Note || '',
              isUrgent: data.IsUrgent == 0 ? false : true,
            });

            // Giữ các biến riêng cho các trường không có trong form
            this.userRequestId = data.EmployeeID;
            this.isDisSave =
              data.EmployeeID == this.currentUser.ID ||
              this.projectSurveyId <= 0 ||
              !this.currentUser.isAdmin;

            // Trigger validation cho isUrgent
            this.onUrgentChange(this.validateForm.get('isUrgent')?.value || false);
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }
  //#endregion
  //#region Lấy dữ liệu bảng file
  getFileDetail() {
    if (this.projectSurveyId > 0) {
      let data = {
        projectSurveyId: this.projectSurveyId,
      };
      this.projectService.getFileDetail(data).subscribe({
        next: (response: any) => {
          if (response.data && Array.isArray(response.data)) {
            // Map dữ liệu từ server vào fileList
            this.fileList = response.data.map((file: any) => ({
              uid: Math.random().toString(36).substring(2) + Date.now(),
              name: file.FileName || file.FileNameOrigin || '',
              size: 0,
              type: '',
              status: 'done',
              originFile: null,
              FileName: file.FileName || file.FileNameOrigin || '',
              ServerPath: file.ServerPath || '',
              OriginName: file.FileNameOrigin || file.FileName || '',
              ID: file.ID || 0,
            }));
            
            // Cập nhật bảng
            if (this.tb_projectSurveyFile) {
              this.updateFileTable();
            }
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }
  //#endregion

  //#region Lấy các trường thông tin khảo sát ứng với dự án
  getDataByProjectId() {
    const projectIdValue = this.validateForm.get('projectId')?.value || this.projectId || 0;
    if (projectIdValue > 0) {
      let data = this.projects.find((p: any) => p.ID === projectIdValue);
      if (data) {
        this.saleId = data.UserID;
        this.technicalId = data.UserTechnicalID;
        this.statusId = data.ProjectStatus;
        this.pmId = data.ProjectManager;
        this.customerId = data.CustomerID;
        this.endUserId = data.EndUser;
      }
    } else {
      // Clear các trường khi bỏ chọn dự án
      this.saleId = null;
      this.technicalId = null;
      this.statusId = null;
      this.pmId = null;
      this.customerId = null;
      this.endUserId = null;
    }
    this.getTbDetail();
  }
  //#endregion

  //#region Validation methods
  // Tự động trim tất cả string controls trước khi validate
  private trimAllStringControls() {
    Object.keys(this.validateForm.controls).forEach(k => {
      const c = this.validateForm.get(k);
      const v = c?.value;
      if (typeof v === 'string') {
        c!.setValue(v.trim(), { emitEvent: false });
      }
    });
  }
  //#endregion

  //#region Lưu thông tin khảo sát dự án
  save(): void {
    // Trim tất cả string controls trước khi validate
    this.trimAllStringControls();
    
    if (this.validateForm.valid) {
      const formValue = this.validateForm.getRawValue();
      if(this.isEdit == 0){
      let dateNow = DateTime.local();
      let ds = DateTime.fromJSDate(new Date(formValue.dateStart));
      let de = DateTime.fromJSDate(new Date(formValue.dateEnd));

      if (ds > de) {
        this.notification.error(NOTIFICATION_TITLE.error,
          `Ngày bắt đầu phải nhỏ hơn bằng ngày kết thúc!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }

      let timeSpan = ds
        .startOf('day')
        .diff(dateNow.startOf('day'), 'days').days;

      if (timeSpan < 1) {
        this.notification.error(NOTIFICATION_TITLE.error,
          `Bạn không thể đăng ký trước ngày hiện tại!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }
    

      if (formValue.isUrgent == false) {
        if (timeSpan > 1) {
        } else if (timeSpan == 1) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          if (currentHour > 17 || (currentHour === 17 && currentMinute > 0)) {
            this.notification.error(
              'Thông báo',
              `Bạn phải đăng ký trước 17h!`,
            );
            return;
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            `Bạn phải đăng ký trước ít nhất 1 ngày!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        }
      }
    }

      let prjTypeLinks = this.projectService
        .getSelectedRowsRecursive(this.tb_projectSurveyDetail.getData())
        .filter((row) => row.Selected === true);

      if (prjTypeLinks.length == 0) {
        this.notification.error(NOTIFICATION_TITLE.error,
          `Bạn phải chọn ít nhất 1 kiểu dự án đi khảo sát!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      } else {
        for (let row of prjTypeLinks) {
          if (!row.LeaderID) {
            this.notification.error(
              'Thông báo',
              `Vui lòng chọn leader cho kiểu dự án \n "${row.ProjectTypeName}"!`,
              {
                nzStyle: { fontSize: '0.75rem' },
              }
            );
            return;
          }
        }
      }

      // Dữ liệu lưu master
      let projectSurvey = {
        ID: this.projectSurveyId ?? 0,
        ProjectID: this.projectId,
        EmployeeID: this.userRequestId ?? 0,
        ApprovedUrgentID: formValue.leaderId ?? 0,
        IsUrgent: formValue.isUrgent,
        ReasonUrgent: formValue.reasonUrgent ?? '',
        Address: formValue.address ?? '',
        PIC: formValue.customerName ?? '',
        DateStart: formValue.dateStart
          ? DateTime.fromJSDate(new Date(formValue.dateStart)).toISO()
          : null,
        DateEnd: formValue.dateEnd
          ? DateTime.fromJSDate(new Date(formValue.dateEnd)).toISO()
          : null,
        Description: formValue.descripsion ?? '',
        Note: formValue.note ?? '',
        PhoneNumber: formValue.customerPhoneNum ? formValue.customerPhoneNum.replace(/[\s\-\(\)]/g, '') : '',
      };

      // Dữ liệu lưu leader detail
      let prjSurveyDetail = [];
      for (let row of prjTypeLinks) {
        let item = {
          ID: row.ID ?? 0,
          ProjectSurveyID: this.projectSurveyId ?? 0,
          ProjectTypeID: row.ProjectTypeID ?? 0,
          Note: row.Note ?? '',
          LeaderID: row.LeaderID ?? 0,
        };
        prjSurveyDetail.push(item);
      }

      // Upload file mới trước (nếu có) để lấy ServerPath
      const filesToUpload: File[] = this.fileList
        .filter((f) => (f.originFile || f.File) && !f.ServerPath)
        .map((f) => (f.originFile || f.File)!);
      
      const subPath = this.getSubPath();
      
      // Nếu có file mới cần upload
      if (filesToUpload.length > 0 && subPath) {
        this.notification.info('Đang upload', 'Đang tải file lên...');
        this.projectService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
          next: (res: any) => {
            if (res?.data?.length > 0) {
              // Cập nhật ServerPath vào fileList sau khi upload thành công
              let fileIndex = 0;
              this.fileList.forEach((f) => {
                if ((f.originFile || f.File) && !f.ServerPath && res.data[fileIndex]) {
                  f.ServerPath = res.data[fileIndex].FilePath;
                  fileIndex++;
                }
              });
            }
            
            // Sau khi upload xong, chuẩn bị dữ liệu và save
            this.saveProjectSurveyData(projectSurvey, prjSurveyDetail);
          },
          error: (error: any) => {
            console.error('Lỗi upload file:', error);
            this.notification.error(
              'Thông báo',
              'Upload file thất bại. Vui lòng thử lại!',
              {
                nzStyle: { fontSize: '0.75rem' },
              }
            );
          }
        });
      } else {
        // Không có file mới, save trực tiếp
        this.saveProjectSurveyData(projectSurvey, prjSurveyDetail);
      }
    } else {
      // Form invalid - mark all as touched để hiển thị lỗi
      this.validateForm.markAllAsTouched();
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
  //#endregion

  //#region Save project survey data (sau khi upload file)
  saveProjectSurveyData(projectSurvey: any, prjSurveyDetail: any[]): void {
    // Chuẩn bị dữ liệu file với ServerPath đã có
    const fileData = this.prepareFileData();
    
    let dataSave = {
      projectSurvey: projectSurvey,
      projectSurveyDetails: prjSurveyDetail,
      projectSurveyFiles: fileData,
      deletedFiles: this.fileDeletedIds.length > 0 ? this.fileDeletedIds : [],
    };

    this.projectService.saveProjectSurvey(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.notification.success(
            '',
            this.projectSurveyId > 0
              ? 'Đã cập nhật khảo sát dự án!'
              : 'Đã thêm mới khảo sát dự án!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          this.activeModal.dismiss(true);
        } else {
          this.notification.error(
            'Thông báo',
            response.message || 'Không thể lưu dữ liệu',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion

  //#endregion
  //#region xem file đính kèm
  viewFiles(): void {
    // let files = this.tb_projectSurveyFile
    //   .getData()
    //   .filter((row: any) => row.ID > 0);

    // if (files.length <= 0) {
    //   this.notification.error(NOTIFICATION_TITLE.error, `Dự án chưa có file đính kèm!`, {
    //     nzStyle: { fontSize: '0.75rem' },
    //   });

    //   return;
    // }

    let prjTypeLinks = this.projectService
      .getSelectedRowsRecursive(this.tb_projectSurveyDetail.getData())
      .filter((row) => row.selectRow === true);
    if (prjTypeLinks.length != 1) {
      this.notification.error(NOTIFICATION_TITLE.error, `Vui lòng chọn một kiểu khảo sát!`, {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    let data = this.projects.find((p: any) => p.ID === this.projectId);
    if (data.CreatedDate) {
      let year = new Date(data.CreatedDate).getFullYear();
      let dt = {
        year: year,
        projectTypeID: prjTypeLinks[0]['ProjectTypeID'],
        projectCode: data.ProjectCode,
      };
      this.projectService.viewFile(dt).subscribe({
        next: (response: any) => {
          if (response.status == 1) {
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }
  //#endregion
}

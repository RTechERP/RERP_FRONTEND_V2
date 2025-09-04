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
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-survey-detail.component.html',
  styleUrl: './project-survey-detail.component.css',
})
export class ProjectSurveyDetailComponent implements OnInit, AfterViewInit {
  //#region validate form
  private fb = inject(NonNullableFormBuilder);
  validateForm = this.fb.group({
    formLayout: this.fb.control<NzFormLayoutType>('vertical'),
    projectId: this.fb.control('', [Validators.required]),
    leaderId: this.fb.control(''),
    reasonUrgent: this.fb.control(''),
    address: this.fb.control('', [Validators.required]),
    customerName: this.fb.control('', [Validators.required]),
    customerPhoneNum: this.fb.control('', [Validators.required]),
    descripsion: this.fb.control('', [Validators.required]),
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
    private modalService: NgbModal
  ) {}

  @Input() projectSurveyId: any = 0;
  @Input() projectId: any = 0;

  @ViewChild('tb_projectSurveyFile', { static: false })
  tb_projectSurveyFileContainer!: ElementRef;
  @ViewChild('tb_projectSurveyDetail', { static: false })
  tb_projectSurveyDetailContainer!: ElementRef;

  tb_projectSurveyFile: any;
  tb_projectSurveyDetail: any;

  dateStart: any = DateTime.local().plus({ day: 1 }).toISO();
  dateEnd: any = DateTime.local().plus({ day: 1 }).toISO();

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
  leaderId: any;
  userRequestId: any;
  statusId: any;

  isUrgent: boolean = false;
  reasonUrgent: any;
  address: any;
  customerName: any;
  customerPhoneNum: any;
  note: any;
  descripsion: any;

  fileList: any[] = [];
  fileDeletedIds: any[] = [];

  dictLeader: { [key: number]: string } = {};
  projectUserTeams: any[] = [];

  isLoad: any = true;
  isDisSave: any = false;
  //#endregion

  //#region Chạy khi mở trương trình
  ngOnInit(): void {
    this.isAdmin = !this.projectService.ISADMIN;
    this.userRequestId = this.projectService.GlobalEmployeeId;
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
    this.getDetail();
    this.onUrgentChange(this.isUrgent);
  }

  getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
        this.getDataByProjectId();
      },
      error: (response:any) => {
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
        this.notification.error('Thông báo', msg);
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
        this.notification.error('Thông báo', msg);
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
        this.notification.error('Thông báo', msg);
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
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion

  //#region Xử lý bảng file
  drawTbProjectSurveyFile(container: HTMLElement) {
    this.tb_projectSurveyFile = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      columns: [
        {
          title: '',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fileName = data['FileName'];
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa file`,
              nzContent: `${fileName}?`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.fileDeletedIds.includes(id))
                    this.fileDeletedIds.push(id);
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                } else {
                  this.fileList = this.fileList.filter(
                    (f) => f.name !== fileName
                  );
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                }
              },
            });
          },
          width: '5px',
          hozAlign: 'center',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          headerHozAlign: 'center',
          width: '18px',
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
      height: '100%',
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
          width: '5px',
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
              ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictLeader[val]}</p> <i class="fas fa-angle-down"></i> <div>`
              : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn leader</p> <i class="fas fa-angle-down"></i> <div>';
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
      reasonUrgentCtrl?.setValidators([Validators.required]);
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

  updateFileTable() {
    if (this.tb_projectSurveyFile) {
      // Lọc ra những file chưa bị xóa
      const activeFiles = this.fileList.filter(
        (file: any) => !file.isDeleted && !file.IsDeleted
      );

      const fileData = activeFiles.map((file: any, index: number) => ({
        ID: 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        file: file,
      }));
      this.tb_projectSurveyFile.addData(fileData);
    }
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
        this.notification.error('Thông báo', msg);
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
          debugger;
          let data = response.data;
          if (data) {
            this.leaderId = data.ApprovedUrgentID;
            this.isUrgent = data.IsUrgent == 0 ? false : true;
            this.reasonUrgent = data.ReasonUrgent;
            this.address = data.Address;
            this.customerName = data.PIC;

            this.dateStart = data.DateStart
              ? DateTime.fromISO(data.DateStart)
                  .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                  .toUTC()
                  .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
              : DateTime.local().plus({ day: 1 }).toISO();
            this.dateEnd = data.DateEnd
              ? DateTime.fromISO(data.DateEnd)
                  .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                  .toUTC()
                  .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
              : DateTime.local().plus({ day: 1 }).toISO();

            this.descripsion = data.Description;
            this.note = data.Note;
            this.customerPhoneNum = data.PhoneNumber;

            this.userRequestId = data.EmployeeID;
            this.isDisSave =
              data.EmployeeID == this.projectService.GlobalEmployeeId ||
              this.projectSurveyId <= 0 ||
              !this.projectService.ISADMIN;
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
          this.tb_projectSurveyFile.setData(response.data);
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
    if (this.projectId > 0) {
      let data = this.projects.find((p: any) => p.ID === this.projectId);
      this.saleId = data.UserID;
      this.technicalId = data.UserTechnicalID;
      this.statusId = data.ProjectStatus;
      this.pmId = data.ProjectManager;
      this.customerId = data.CustomerID;
      this.endUserId = data.EndUser;
    }
    this.getTbDetail();
  }
  //#endregion

  //#region Lưu thông tin khảo sát dự án
  save(): void {
    debugger;
    if (this.validateForm.valid) {
      let dateNow = DateTime.local();
      let ds = DateTime.fromJSDate(new Date(this.dateStart));
      let de = DateTime.fromJSDate(new Date(this.dateEnd));

      if (ds > de) {
        this.notification.error(
          'Thông báo',
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
        this.notification.error(
          'Thông báo',
          `Bạn không thể đăng ký trước ngày hiện tại!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }

      if (this.isUrgent == false) {
        if (timeSpan > 1) {
        } else if (timeSpan == 1) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          if (currentHour > 17 || (currentHour === 17 && currentMinute > 0)) {
            this.notification.error(
              'Thông báo',
              `Bạn phải đăng ký trước 17h!`,
              {
                nzStyle: { fontSize: '0.75rem' },
              }
            );
            return;
          }
        } else {
          this.notification.error(
            'Thông báo',
            `Bạn phải đăng ký trước ít nhất 1 ngày!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        }
      }

      let prjTypeLinks = this.projectService
        .getSelectedRowsRecursive(this.tb_projectSurveyDetail.getData())
        .filter((row) => row.Selected === true);

      if (prjTypeLinks.length == 0) {
        this.notification.error(
          'Thông báo',
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
        ApprovedUrgentID: this.leaderId ?? 0,
        IsUrgent: this.isUrgent,
        ReasonUrgent: this.reasonUrgent ?? '',
        Address: this.address ?? '',
        PIC: this.customerName ?? '',
        DateStart: this.dateStart
          ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
          : null,
        DateEnd: this.dateEnd
          ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
          : null,
        Description: this.descripsion ?? '',
        Note: this.note ?? '',
        PhoneNumber: this.customerPhoneNum ?? '',
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

      let dataSave = {
        projectSurvey: projectSurvey,
        projectSurveyDetails: prjSurveyDetail,
        deletedFiles: this.fileDeletedIds.length > 0 ? this.fileDeletedIds : [],
      };

      this.projectService.saveProjectSurvey(dataSave).subscribe({
        next: (response: any) => {
          if (response.status == 1) {
            let data = this.projects.find((p: any) => p.ID === this.projectId);
            if (
              this.fileList.length > 0 &&
              data.CreatedDate &&
              data.ProjectCode
            ) {
              let year = new Date(data.CreatedDate).getFullYear();
              this.saveProjectSurveyFile(response.data, year, data.ProjectCode);
            } else {
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
            }
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
  //#endregion

  //#region Lưu file đính kèm
  saveProjectSurveyFile(
    projectSurveyId: number,
    year: number,
    projectCode: string
  ): void {
    const formData = new FormData();

    this.fileList.forEach((f) => {
      formData.append('files', f.originFile as File, f.name);
    });

    formData.append('projectSurveyID', `${projectSurveyId}`);
    formData.append('year', `${year}`);
    formData.append('projectCode', projectCode);
    this.projectService.saveProjectSurveyFiles(formData).subscribe({
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
        }
      },
        error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion
  //#region xem file đính kèm
  viewFiles(): void {
    // let files = this.tb_projectSurveyFile
    //   .getData()
    //   .filter((row: any) => row.ID > 0);

    // if (files.length <= 0) {
    //   this.notification.error('Thông báo', `Dự án chưa có file đính kèm!`, {
    //     nzStyle: { fontSize: '0.75rem' },
    //   });

    //   return;
    // }
    debugger;
    let prjTypeLinks = this.projectService
      .getSelectedRowsRecursive(this.tb_projectSurveyDetail.getData())
      .filter((row) => row.selectRow === true);
    if (prjTypeLinks.length != 1) {
      this.notification.error('Thông báo', `Vui lòng chọn một kiểu khảo sát!`, {
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

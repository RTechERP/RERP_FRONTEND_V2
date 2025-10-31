import { ProjectPriorityDetailComponent } from './../project-priority-detail/project-priority-detail.component';
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  TemplateRef,
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ViewContainerRef } from '@angular/core';
import { SelectLeaderComponent } from '../project-control/select-leader.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { ProjectStatusDetailComponent } from '../project-status-detail/project-status-detail.component';
import { SelectProjectEmployeeGroupComponent } from '../project-control/select-project-employee-group';
import { CustomerDetailComponent } from '../../VisionBase/customer-detail/customer-detail.component';
import { FirmBaseDetailComponent } from '../firmbase-detail/firm-base-detail.component';
// THÊM DÒNG NÀY:
import { combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  imports: [
    NzTabsModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  //#region Khai báo các biến
  @Input() projectId: any;
  @ViewChild('tb_projectTypeLinks', { static: false })
  tb_projectTypeLinksContainer!: ElementRef;
  @ViewChild('tb_projectTypeLinksDetail', { static: false })
  tb_projectTypeLinksDetailContainer!: ElementRef;
  @ViewChild('dateChangeStatus', { static: false })
  dateChangeStatusContainer!: TemplateRef<any>;

  projectIdleader: any = 0;
  tb_projectTypeLinks: any;
  tb_projectTypeLinksDetail: any;

  customers: any[] = [];
  users: any[] = [];
  statuses: any[] = [];
  pms: any[] = [];
  firmBases: any[] = [];
  projectTypeBases: any[] = [];

  listPriorities: any;
  projectCode: any;
  customerId: any;
  userSaleId: any;
  userTechId: any;
  oldStatusId: any = 0;
  pmId: any;
  firmBaseId: any;
  projectTypeBaseId: any;
  endUserId: any;
  prjTypeBaseId: any;
  priority: any;
  projectTypeId: any = 1;
  projectName: any;
  note: any;
  currentState: any;
  createDate: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  // Ngày dự kiến
  expectedPlanDate: any;
  expectedQuotationDate: any;
  expectedPODate: any;
  expectedProjectEndDate: any;

  // Ngày thực tế
  realityPlanDate: any;
  realityQuotationDate: any;
  realityPODate: any;
  realityProjectEndDate: any;

  // Ngày thay đổi trạng thái
  dateChangeStatus: any;
  projectUserTeams: any[] = [];
  projectStatus: any;
  projectStatusIdDetail: any;
  projects: any;

  projectStatusId: any;
  projectContactName: any;

  situlator: any;
  situlatorDetail: any;
  currentTab: any = 0;

  dictLeader: { [key: number]: string } = {};
  
  // Form validation
  formGroup: FormGroup;
  //#endregion

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      customerId: [null, [Validators.required]],
      projectCode: [{value: '', disabled: true}, [Validators.required]],
      createdDate: [DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toISO()],
      projectName: ['', [Validators.required]],
      userSaleId: [null, [Validators.required]],
      userTechId: [null, [Validators.required]],
      projectStatusId: [null],
      pmId: [null, [Validators.required]],
      endUserId: [null, [Validators.required]],
      firmBaseId: [null],
      prjTypeBaseId: [null],
      expectedPlanDate: [null, [Validators.required]],
      expectedQuotationDate: [null, [Validators.required]],
      expectedPODate: [null],
      expectedProjectEndDate: [null],
      realityPlanDate: [null],
      realityQuotationDate: [null],
      realityPODate: [null],
      realityProjectEndDate: [null],
      projectContactName: [''],
      priority: [{value: '', disabled: true}, [Validators.required]],
      projectTypeId: [1, [Validators.required]],
      note: [''],
      currentState: [''],
      projectIdleader: [null, [Validators.required]],
      projectStatusIdDetail: [null, [Validators.required]],
      situlatorDetail: [''],
      dateChangeStatus: [null]
    });
  }

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    // Đồng bộ dữ liệu từ form controls với các biến
    this.formGroup.get('customerId')?.valueChanges.subscribe(value => {
      this.customerId = value;
    });
    this.formGroup.get('projectName')?.valueChanges.subscribe(value => {
      this.projectName = value;
    });
    this.formGroup.get('userSaleId')?.valueChanges.subscribe(value => {
      this.userSaleId = value;
    });
    this.formGroup.get('userTechId')?.valueChanges.subscribe(value => {
      this.userTechId = value;
    });
    this.formGroup.get('pmId')?.valueChanges.subscribe(value => {
      this.pmId = value;
    });
    this.formGroup.get('endUserId')?.valueChanges.subscribe(value => {
      this.endUserId = value;
    });
    this.formGroup.get('expectedPlanDate')?.valueChanges.subscribe(value => {
      this.expectedPlanDate = value;
    });
    this.formGroup.get('expectedQuotationDate')?.valueChanges.subscribe(value => {
      this.expectedQuotationDate = value;
    });
    this.formGroup.get('priority')?.valueChanges.subscribe(value => {
      this.priority = value;
    });
    this.formGroup.get('projectTypeId')?.valueChanges.subscribe(value => {
      this.projectTypeId = value;
    });
    // Theo dõi customerId và projectTypeId
  // combineLatest([
  //   this.formGroup.get('customerId')!.valueChanges,
  //   this.formGroup.get('projectTypeId')!.valueChanges,
  //   this.formGroup.get('endUserId')!.valueChanges,
  // ]).pipe(
  //   debounceTime(200),
  //   filter(([cid, tid]) => !!cid && this.customers.length > 0),
  //   distinctUntilChanged()
  // ).subscribe(() => {
  //   debugger
  //   this.getProjectCode();
  // });
  }

  ngAfterViewInit(): void {
    this.drawTbProjectTypeLinks(
      this.tb_projectTypeLinksContainer.nativeElement
    );

    this.drawTbProjectTypeLinksDetail(
      this.tb_projectTypeLinksDetailContainer.nativeElement
    );

    this.getProjectTypeLinks();
    this.getProjectTypeLinksDetail();

    this.getCustomers();
    this.getFollowProjectBase();
    this.getUsers();
    this.getStatuses();
    this.getPms();
    this.getFirmBase();
    this.getProjectTypeBase();
    this.getProjectLeader();

    this.getProjectStatus();
    this.getUserTeams();
    this.loadProject(this.projectId);
    this.getProject();
    this.getProjectCurrentSituation();
    this.projectIdleader = this.projectId;
  }
  //#endregion

  //#region load dữ liệu từ API
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

  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
        console.log(this.users);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  
  //hàm gọi modal firm
  openModalFirmBase(){
    const modalRef = this.modalService.open(FirmBaseDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
        this.getFirmBase()
        }
      },
    );
  }
  //end
  getStatuses() {
    this.projectService.getProjectStatus().subscribe({
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

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getFirmBase() {
    this.projectService.getFirmBases().subscribe({
      next: (response: any) => {
        this.firmBases = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectTypeBase() {
    this.projectService.getProjectTypeBases().subscribe({
      next: (response: any) => {
        this.projectTypeBases = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProject() {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          console.log('binh log',response.data);
          this.projectCode = response.data.ProjectCode;
          this.projectName = response.data.ProjectName;
          this.note = response.data.Note;
          this.customerId = response.data.CustomerID;
          this.userSaleId = response.data.UserID;
          this.userTechId = response.data.UserTechnicalID;
          
          // Cập nhật form values
          this.formGroup.patchValue({
            customerId: response.data.CustomerID,
            projectName: response.data.ProjectName,
            userSaleId: response.data.UserID,
            userTechId: response.data.UserTechnicalID,
            projectCode: response.data.ProjectCode
          });
          this.createDate = DateTime.fromISO(response.data.CreatedDate)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toUTC()
            .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");

          this.projectStatusId = response.data.ProjectStatus;
          this.oldStatusId = response.data.ProjectStatus;
          this.pmId = response.data.ProjectManager;
          this.currentState = response.data.CurrentState;
          this.endUserId = response.data.EndUser;
          this.priority = response.data.Priotity;
          this.projectTypeId =
            response.data.TypeProject <= 0 ? 1 : response.data.TypeProject;
            
          // Cập nhật thêm form values
          this.formGroup.patchValue({
            pmId: response.data.ProjectManager,
            endUserId: response.data.EndUser,
            priority: response.data.Priotity,
            projectTypeId: response.data.TypeProject <= 0 ? 1 : response.data.TypeProject,
            projectIdleader:response.data.ID,
            projectStatusIdDetail:response.data.ProjectStatus,
          });
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error('Thông báo', msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  getFollowProjectBase() {
    if (this.projectId > 0) {
      this.projectService.getFollowProjectBases(this.projectId).subscribe({
        next: (res: any) => {
          this.firmBaseId = res.data.FirmBaseID;
          this.prjTypeBaseId = res.data.ProjectTypeBaseID;
          this.projectContactName = res.data.ProjectContactName;

          this.expectedPlanDate = res.data.ExpectedPlanDate
            ? DateTime.fromISO(res.data.ExpectedPlanDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
          this.expectedQuotationDate = res.data.ExpectedQuotationDate
            ? DateTime.fromISO(res.data.ExpectedQuotationDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
            
          // Cập nhật form values cho ngày
          this.formGroup.patchValue({
            expectedPlanDate: this.expectedPlanDate,
            expectedQuotationDate: this.expectedQuotationDate
          });
          this.expectedPODate = res.data.ExpectedPODate
            ? DateTime.fromISO(res.data.ExpectedPODate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
          this.expectedProjectEndDate = res.data.ExpectedProjectEndDate
            ? DateTime.fromISO(res.data.ExpectedProjectEndDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;

          this.realityPlanDate = res.data.RealityPlanDate
            ? DateTime.fromISO(res.data.RealityPlanDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
          this.realityQuotationDate = res.data.RealityQuotationDate
            ? DateTime.fromISO(res.data.RealityQuotationDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
          this.realityPODate = res.data.RealityPODate
            ? DateTime.fromISO(res.data.RealityPODate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
          this.realityProjectEndDate = res.data.RealityProjectEndDate
            ? DateTime.fromISO(res.data.RealityProjectEndDate)
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toUTC()
                .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            : null;
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error('Thông báo', msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  getProjectCode() {
    debugger
    if (this.customers.length <= 0) return;
    
    // Lấy giá trị từ form controls
    
    const customerId = this.formGroup.get('customerId')?.value;
    const projectTypeId = this.formGroup.get('projectTypeId')?.value;
    
    if (!customerId) return;
    
    const customer = (this.customers as any[]).find(
      (x) => x.ID === customerId
    );

    if (!customer || customer.CustomerShortName == '') {
      this.notification.error(
        '',
        'Khách hàng đang không có tên kí hiệu. Xin vui lòng thêm thông tin tên kí hiệu!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      this.projectCode = '';
      this.formGroup.patchValue({ projectCode: '' });
      return;
    }

    if (this.customers.length > 0) {
      this.projectService
        .getProjectCodeModal(
          this.projectId,
          customer.CustomerShortName,
          projectTypeId || 1
        )
        .subscribe({
          next: (response: any) => {
            this.projectCode = response.data;
            console.log("hshs", this.projectCode)
            this.formGroup.patchValue({ projectCode: response.data });
            const endUserId = this.formGroup.get('endUserId')?.value;
            if (!endUserId) {
              this.formGroup.patchValue({ endUserId: customerId });
            }
          },
          error: (error: any) => {
            const msg = error.message || 'Lỗi không xác định';
            this.notification.error('Thông báo', msg);
            console.error('Lỗi:', error.error);
          },
        });
    }
  }

  getDayChange() {
    const projectStatusId = this.formGroup.get('projectStatusId')?.value;
    if (projectStatusId == this.oldStatusId || this.projectId <= 0) return;

    const modalRef = this.modal.create({
      nzContent: this.dateChangeStatusContainer,
      nzFooter: [
        {
          label: 'Hủy',
          type: 'default',
          nzDanger: true,
          onClick: () => {
            this.formGroup.patchValue({ projectStatusId: this.oldStatusId });
            this.dateChangeStatus = null;
            modalRef.close();
          },
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => {
            if (!this.dateChangeStatus) {
              this.notification.error(
                '',
                'Vui lòng chọn ngày thay đổi trạng thái!',
                {
                  nzStyle: { fontSize: '0.75rem' },
                }
              );
            } else {
              this.notification.success('', 'Đã lưu thay đổi!', {
                nzStyle: { fontSize: '0.75rem' },
              });
              modalRef.close();
            }
          },
        },
      ],
    });
  }

  getProjectLeader() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projectStatus = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectCurrentSituation() {
    this.projectService
      .getProjectCurrentSituation(
        this.projectIdleader,
        this.projectService.GlobalEmployeeId
      )
      .subscribe({
        next: (response: any) => {
          this.situlator = response.data;
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error('Thông báo', msg);
          console.error('Lỗi:', error.error);
        },
      });
  }

  getUserTeams() {
    this.projectService.getUserTeams().subscribe({
      next: (response: any) => {
        this.projectUserTeams = response.data;
        this.getProjectTypeLinksDetail();
        this.createLabelsFromData();
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  loadProject(projectId: number) {
    if (projectId > 0) {
      this.projectService.getProject(projectId).subscribe({
        next: (response: any) => {
          if (response.data) {
           
            if (this.projectId == this.projectIdleader) {
              this.projectStatusId = response.data.ProjectStatus;
            
            } else {
              this.projectStatusIdDetail = response.data.ProjectStatus;
              
            }
          }
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error('Thông báo', msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  onDateChange(date: any) {
    this.dateChangeStatus = date;
    console.log(this.dateChangeStatus);
  }

  saveDataProject() {
    // Kiểm tra mã dự án nếu đang edit
    if (this.projectId > 0) {
      this.projectService
        .checkProjectCode(this.projectId, this.projectCode)
        .subscribe({
          next: (response: any) => {
            if (response.data == 0) {
              this.notification.error(
                '',
                'Mã dự án đã tồn tại. Vui lòng kiểm tra lại!',
                {
                  nzStyle: { fontSize: '0.75rem' },
                }
              );
              return;
            } else {
              this.save();
            }
          },
          error: (error: any) => {
            const msg = error.message || 'Lỗi không xác định';
            this.notification.error('Thông báo', msg);
            console.error('Lỗi:', error.error);
          },
        });
    } else {
      this.save();
    }
  }

  save() {
   
   
    const allData = this.tb_projectTypeLinks.getData();
    const projectTypeLinks =
      this.projectService.getSelectedRowsRecursive(allData);
    
    // Kiểm tra mã dự án
    if (!this.projectCode) {
      this.notification.error('', 'Vui lòng nhập mã dự án', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    console.log('prjtypelink', projectTypeLinks);

    // Kiểm tra kiểu dự án
    if (projectTypeLinks.length == 0 && this.projectTypeId <= 1) {
      this.notification.error('', 'Vui lòng chọn kiểu dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (
      !this.dateChangeStatus &&
      this.oldStatusId != this.projectStatusId &&
      this.projectId > 0
    ) {
      const modalRef = this.modal.create({
        nzContent: this.dateChangeStatusContainer,
        nzFooter: [
          {
            label: 'Hủy',
            type: 'default',
            nzDanger: true,
            onClick: () => {
              modalRef.close(), (this.dateChangeStatus = null);
            },
          },
          {
            label: 'Lưu',
            type: 'primary',
            onClick: () => {
              if (!this.dateChangeStatus) {
                this.notification.error(
                  '',
                  'Vui lòng chọn ngày thay đổi trạng thái!',
                  {
                    nzStyle: { fontSize: '0.75rem' },
                  }
                );
              } else {
                this.notification.success('', 'Đã lưu thay đổi!', {
                  nzStyle: { fontSize: '0.75rem' },
                });
                modalRef.close();
              }
            },
          },
        ],
      });
    }

    console.log(
      DateTime.fromJSDate(new Date(this.dateChangeStatus)).isValid
        ? DateTime.fromJSDate(new Date(this.dateChangeStatus)).toISO()
        : null
    );

    const dataSave: any = {
      projectStatusOld: this.oldStatusId ?? 0,
      project: {
        ID: this.projectId ?? 0,
        ProjectCode: this.projectCode ?? '',
        ProjectName: this.projectName ?? '',
        ProjectStatus: this.projectStatusId ?? 0,
        Note: this.note ?? '',
        CustomerID: this.customerId ?? 0,
        UserID: this.userSaleId ?? 0,
        UserTechnicalID: this.userTechId ?? 0,
        CreatedDate: this.createDate
          ? DateTime.fromJSDate(new Date(this.createDate)).toISO()
          : null,
        ProjectManager: this.pmId ?? 0,
        CurrentState: this.currentState ?? '',
        EndUser: this.endUserId ?? 0,
        Priotity: this.priority ?? 0,
        TypeProject: this.projectTypeId ?? 0,
      },
      projectStatusLog: {
        EmployeeID: this.projectService.GlobalEmployeeId ?? 0, // ID người đăng nhập
        DateLog: this.dateChangeStatus
          ? DateTime.fromJSDate(new Date(this.dateChangeStatus)).toISO()
          : undefined,
        CreatedBy: '',
        UpdatedBy: '',
      },
      followProjectBase: {
        ExpectedPlanDate: this.expectedPlanDate
          ? DateTime.fromJSDate(new Date(this.expectedPlanDate)).toISO()
          : null,
        ExpectedQuotationDate: this.expectedQuotationDate
          ? DateTime.fromJSDate(new Date(this.expectedQuotationDate)).toISO()
          : null,
        ExpectedPODate: this.expectedPODate
          ? DateTime.fromJSDate(new Date(this.expectedPODate)).toISO()
          : null,
        ExpectedProjectEndDate: this.expectedProjectEndDate
          ? DateTime.fromJSDate(new Date(this.expectedProjectEndDate)).toISO()
          : null,

        RealityPlanDate: this.realityPlanDate
          ? DateTime.fromJSDate(new Date(this.realityPlanDate)).toISO()
          : null,
        RealityQuotationDate: this.realityQuotationDate
          ? DateTime.fromJSDate(new Date(this.realityQuotationDate)).toISO()
          : null,
        RealityPODate: this.realityPODate
          ? DateTime.fromJSDate(new Date(this.realityPODate)).toISO()
          : null,
        RealityProjectEndDate: this.realityProjectEndDate
          ? DateTime.fromJSDate(new Date(this.realityProjectEndDate)).toISO()
          : null,

        FirmBaseID: this.firmBaseId ?? 0,
        ProjectTypeBaseID: this.prjTypeBaseId ?? 0,
        ProjectContactName: this.projectContactName ?? '',
      },
      projectTypeLinks: projectTypeLinks ?? [], //
      projectUsers: [], //
      listPriorities: this.listPriorities ?? [], //
    };
    console.log(dataSave);
    this.projectService.saveProject(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
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

  loadAll() {
    const projectIdleader = this.formGroup.get('projectIdleader')?.value;
    this.loadProject(projectIdleader);
    this.getProjectTypeLinksDetail();
    this.getProjectCurrentSituation();
  }

  saveData() {
    if (this.currentTab == 0) {
      // Validate form trước khi lưu
      if (!this.validateForm()) {
        return;
      }
      this.saveDataProject();
    } else if (this.currentTab == 1) {
      console.log(2);
      this.saveProjectTypeLink();
    }
  }

  saveProjectTypeLink() {
    // Validate form trước khi lưu
    if (!this.validateLeaderForm()) {
      return;
    }

    const prjTypeLinks = this.projectService.getSelectedRowsRecursive(
      this.tb_projectTypeLinksDetail.getData()
    );

    // Lấy giá trị từ form controls
    const projectIdleader = this.formGroup.get('projectIdleader')?.value;
    const projectStatusIdDetail = this.formGroup.get('projectStatusIdDetail')?.value;
    const situlatorDetail = this.formGroup.get('situlatorDetail')?.value;

    const dataSave = {
      ProjectID: projectIdleader,
      ProjectStatus: projectStatusIdDetail,
      GlobalEmployeeId: this.projectService.GlobalEmployeeId,
      prjTypeLinks: prjTypeLinks,
      Situlator: situlatorDetail ?? '',
    };
    console.log("datasv: ", dataSave)
    this.projectService.saveProjectTypeLink(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.notification.success('', 'Đã cập nhật leader!', {
            nzStyle: { fontSize: '0.75rem' },
          });
          this.getProjectTypeLinks();
          this.getProjectTypeLinksDetail();
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

  //#region Xử lý bẳng chi tiết dự án
  drawTbProjectTypeLinks(container: HTMLElement) {
    this.tb_projectTypeLinks = new Tabulator(container, {
      height: '24.5vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      layout: 'fitDataStretch',
      locale: 'vi',
       
      columns: [
        {
          title: 'Chọn',
          field: 'Selected',
          headerHozAlign: 'center',
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
          width: '20px',
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          headerHozAlign: 'center',
        },
        { title: 'Leader', field: 'FullName', headerHozAlign: 'center' },
      ],
    });
  }


  getProjectTypeLinks() {
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        this.tb_projectTypeLinks.setData(
          this.projectService.setDataTree(response.data, 'ID')
        );
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  //#endregion

  //#region xử lý kiểu dự án cập nhật leader
  drawTbProjectTypeLinksDetail(container: HTMLElement) {
    this.tb_projectTypeLinksDetail = new Tabulator(container, {
      height: '30vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      layout: 'fitDataStretch',
      locale: 'vi',
      columns: [
        {
          title: 'Chọn',
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
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          headerHozAlign: 'center',
        },
        {
          title: 'Leader',
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
        },
      ],
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

  getProjectTypeLinksDetail() {
    this.projectService.getProjectTypeLinks(this.projectIdleader).subscribe({
      next: (response: any) => {
        this.tb_projectTypeLinksDetail.setData(
          this.projectService.setDataTree(response.data, 'ID')
        );
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
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

  getdt() {
    console.log(this.tb_projectTypeLinksDetail.getData());
  }
  //#endregion

  //#region sự kiện chuyển tab
  onChangeIndexTab(index: number) {
    if (index == 1) {
      this.projectIdleader = this.projectId;
      this.projectStatusIdDetail = this.projectTypeId;
      this.loadAll();
      this.currentTab = 1;
    } else {
      this.currentTab = 0;
    }
  }
  //#endregion

  //#region Mức ưu tiên
  openProjectPriorityDetail() {
    const modalRef = this.modalService.open(ProjectPriorityDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result.catch((reason: any) => {
      if (reason !== undefined) {
        this.formGroup.get('priority')?.setValue(reason.priority);
        
        this.listPriorities = reason.listPriorities;
      }
    });
  }
  //#endregion

  //#region Thêm trạng thái dự án
  openAddProjectStatusModal() {
    const modalRef = this.modalService.open(ProjectStatusDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.getProjectStatus();
          this.getStatuses();
        }
      },
    );
  }
  //#endregion

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.formGroup.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'customerId':
            return 'Vui lòng chọn khách hàng!';
          case 'projectName':
            return 'Vui lòng nhập tên dự án!';
          case 'userSaleId':
            return 'Vui lòng chọn người phụ trách (Sale)!';
          case 'userTechId':
            return 'Vui lòng chọn người phụ trách (Technical)!';
          case 'pmId':
            return 'Vui lòng chọn PM!';
          case 'endUserId':
            return 'Vui lòng chọn End User!';
          case 'expectedPlanDate':
            return 'Vui lòng chọn ngày gửi phương án!';
          case 'expectedQuotationDate':
            return 'Vui lòng chọn ngày gửi báo giá!';
          case 'priority':
            return 'Vui lòng nhập mức ưu tiên!';
          case 'projectTypeId':
            return 'Vui lòng chọn kiểu dự án!';
          case 'projectIdleader':
            return 'Vui lòng chọn dự án!';
          case 'projectStatusIdDetail':
            return 'Vui lòng chọn trạng thái dự án!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
     this.trimAllStringControls();
     const requiredFields = [
      'customerId',
      'projectName',
      'projectCode',
      'pmId',
      'userSaleId',
      'priority',
      'userTechId',
      'endUserId',
      'expectedPlanDate',
      'expectedQuotationDate',
      'projectTypeId',
    ];
    const invalidFields = requiredFields.filter(key => {
      const control = this.formGroup.get(key);
      return !control || control.invalid || control.value === '' || control.value == null;
    });
    if (invalidFields.length > 0) 
      {
      this.formGroup.markAllAsTouched();
      return false;
      }  
     return true ; 
  }

 
  validateLeaderForm(): boolean {
    this.trimAllStringControls();
    const projectIdleader = this.formGroup.get('projectIdleader');
    const projectStatusIdDetail = this.formGroup.get('projectStatusIdDetail'); 
    let isValid = true;
    if (!projectIdleader?.value || projectIdleader?.value <= 0) {
      projectIdleader?.markAsTouched();
      isValid = false;
    }
    if (!projectStatusIdDetail?.value || projectStatusIdDetail?.value <= 0) {
      projectStatusIdDetail?.markAsTouched();
      isValid = false;
    }
    if (!isValid) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án và trạng thái!');
    }
    
    return isValid;
  }
  openAddCustomer(){
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = false;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.getProjectStatus();
          this.getStatuses();
        }
      },
    );
  } 
}

import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder, AbstractControl } from '@angular/forms';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { KhoBaseService } from '../../kho-base-service/kho-base.service';
import { FirmBaseDetailComponent } from '../firm-base-detail/firm-base-detail.component';
import { ProjectTypeBaseDetailComponent } from '../project-type-base-detail/project-type-base-detail.component';

@Component({
  selector: 'app-follow-project-base-detail',
  templateUrl: './follow-project-base-detail.component.html',
  styleUrls: ['./follow-project-base-detail.component.css'],
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
  ]
})
export class FollowProjectBaseDetailComponent implements OnInit {
  @Input() warehouseID: number = 0;
  expectedPODate: any;
  realityPODate: any;


  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private khoBaseService: KhoBaseService,
    private modalService: NgbModal,
  ) { }
  @Input() FollowProject: any;
  @ViewChild('tb_followProjectForSale', { static: false })
  tb_followProjectForSaleContainer!: ElementRef;
  tb_followProjectForSaleBody: any;

  @ViewChild('tb_followProjectForPM', { static: false })
  tb_followProjectForPMContainer!: ElementRef;
  tb_followProjectForPMBody: any;


  // array select option
  projects: any[] = [];
  pms: any[] = [];
  customers: any[] = [];
  projectStatus: any[] = [];
  firmBase: any[] = [];
  projectTypeBase: any[] = [];
  users: any[] = [];

  // validateForm!: FormGroup;
  private fb = inject(NonNullableFormBuilder);
  requiredNotZero = (control: AbstractControl) => {
    return control.value !== null && control.value !== undefined && control.value !== 0
      ? null
      : { required: true };
  };

  validateForm = this.fb.group({
    projectID: this.fb.control(0, [this.requiredNotZero]),
    pmID: this.fb.control(0),
    customerID: this.fb.control(0, [this.requiredNotZero]),
    projectStatusID: this.fb.control(0, [this.requiredNotZero]),
    firmBaseID: this.fb.control(0, [this.requiredNotZero]),
    projectTypeID: this.fb.control(0, [this.requiredNotZero]),
    userID: this.fb.control(0),
    endUserID: this.fb.control(0, [this.requiredNotZero]),

    projectStartDate: this.fb.control(null, [Validators.required]),
    workDone: this.fb.control(''),
    workWillDo: this.fb.control(''),
    possibilityPO: this.fb.control('', [Validators.required]),

    expectedPlanDate: this.fb.control(null),
    expectedQuotationDate: this.fb.control(null),
    expectedProjectEndDate: this.fb.control(null),
    expectedPODate: this.fb.control(null),

    realityPlanDate: this.fb.control(null),
    realityQuotationDate: this.fb.control(null),
    realityProjectEndDate: this.fb.control(null),
    realityPODate: this.fb.control(null),

    totalWithoutVAT: this.fb.control(0),
    projectContactName: this.fb.control(''),
    note: this.fb.control(''),

    dateDonePM: this.fb.control(null),
    dateWillDoPM: this.fb.control(null),
    dateDoneSale: this.fb.control(null),
    dateWillDoSale: this.fb.control(null)

  });

  ngOnInit() {
    this.getProjects();
    this.getPM();
    this.getCustomers();
    this.getProjectStatus();
    this.getFirmBase();
    this.getProjectTypeBase();
    this.getUsers();
    if (this.FollowProject) {
      this.loadData();
    }

    this.validateForm.get('projectID')?.valueChanges.subscribe(() => this.onProjectChange());

  }
  ngAfterViewInit(): void {
    this.drawTbFollowProjectForSale(this.tb_followProjectForSaleContainer.nativeElement);
    this.drawTbFollowProjectForPM(this.tb_followProjectForPMContainer.nativeElement);

    if (this.FollowProject) {
      this.getFollowProjectBaseDetail(this.FollowProject.ID ?? 0, this.FollowProject.ProjectID ?? 0);
    }


  }
  drawTbFollowProjectForSale(container: HTMLElement) {
    this.tb_followProjectForSaleBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: 1,
      columns: [
        {
          title: 'UserID', field: 'UserID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
        },
        { title: "Họ tên", field: "FullName", headerHozAlign: "center", hozAlign: "left" },
        {
          title: "Ngày thực hiện gần nhất", field: "ImplementationDate", width: 120, headerHozAlign: "center", hozAlign: "center",
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return "";
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          }
        },
        {
          title: "Ngày dự kiến thực hiện", field: "ExpectedDate", width: 120, headerHozAlign: "center", hozAlign: "center",
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return "";
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          }
        },
        { title: "Việc đã làm", field: "WorkDone", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kết quả mong đợi", field: "Results", headerHozAlign: "center", hozAlign: "left" },
        { title: "Vấn đề tồn đọng", field: "ProblemBacklog", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kế hoạch tiếp theo", field: "WorkWillDo", headerHozAlign: "center", hozAlign: "left" },
      ],
    });
  }
  drawTbFollowProjectForPM(container: HTMLElement) {
    this.tb_followProjectForPMBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: 1,
      columns: [
        {
          title: 'UserID', field: 'UserID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
        },
        { title: "Họ tên", field: "FullName", headerHozAlign: "center", hozAlign: "left" },
        {
          title: "Ngày thực hiện gần nhất", field: "ImplementationDate", width: 120, headerHozAlign: "center", hozAlign: "center",
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return "";
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          }
        },
        {
          title: "Ngày dự kiến thực hiện", field: "ExpectedDate", width: 120, headerHozAlign: "center", hozAlign: "center",
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return "";
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          }
        },
        { title: "Việc đã làm", field: "WorkDone", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kết quả mong đợi", field: "Results", headerHozAlign: "center", hozAlign: "left" },
        { title: "Vấn đề tồn đọng", field: "ProblemBacklog", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kế hoạch tiếp theo", field: "WorkWillDo", headerHozAlign: "center", hozAlign: "left" },
      ],
    });
  }

  onProjectChange() {
    let id = this.validateForm.get('projectID')?.value ?? 0;
    this.khoBaseService.getProjectByID(id).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          let project = response.data;
          this.validateForm.patchValue({
            customerID: project.CustomerID,
            pmID: project.ProjectManager,
            userID: project.UserID,
            projectStatusID: project.ProjectStatus,
            endUserID: project.EndUser,
            projectStartDate: project.CreatedDate,
          });
        }
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getFollowProjectBaseDetail!'
        );
      }
    });
  }

  loadData() {

    this.validateForm.patchValue({
      projectID: this.FollowProject.ProjectID,
      customerID: this.FollowProject.CustomerBaseID,
      projectStatusID: this.FollowProject.ProjectStatusBaseID,
      firmBaseID: this.FollowProject.FirmBaseID,
      projectTypeID: this.FollowProject.ProjectTypeBaseID,
      userID: this.FollowProject.UserID,
      endUserID: this.FollowProject.EndUserID,
      projectStartDate: this.FollowProject.ProjectStartDate,
      workDone: this.FollowProject.WorkDone,
      workWillDo: this.FollowProject.WorkWillDo,
      possibilityPO: this.FollowProject.PossibilityPO,
      // dự kiến
      expectedPlanDate: this.FollowProject.ExpectedPlanDate,
      expectedQuotationDate: this.FollowProject.ExpectedQuotationDate,
      expectedProjectEndDate: this.FollowProject.ExpectedProjectEndDate,
      expectedPODate: this.FollowProject.ExpectedPODate,
      // thực tế
      realityPlanDate: this.FollowProject.RealityPlanDate,
      realityQuotationDate: this.FollowProject.RealityQuotationDate,
      realityProjectEndDate: this.FollowProject.RealityProjectEndDate,
      realityPODate: this.FollowProject.RealityPODate,
      //follow
      totalWithoutVAT: this.FollowProject.TotalWithoutVAT,
      projectContactName: this.FollowProject.ProjectContactName,
      note: this.FollowProject.Note,
      // pm
      dateDonePM: this.FollowProject.DateDonePM,
      dateWillDoPM: this.FollowProject.DateWillDoPM,
      // sale
      dateDoneSale: this.FollowProject.DateDoneSale,
      dateWillDoSale: this.FollowProject.DateWillDoSale
    }, { emitEvent: true });
    // this.onProjectChange();

  }
  getFollowProjectBaseDetail(followProjectBaseID: number, projectID: number) {
    this.khoBaseService.getFollowProjectBaseDetail(followProjectBaseID, projectID).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.tb_followProjectForSaleBody.setData(response.dataSale);
          this.tb_followProjectForPMBody.setData(response.dataPM);
        }
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getFollowProjectBaseDetail!'
        );
      }
    });
  }

  getProjects() {
    this.khoBaseService.getProjects().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getPM() {
    this.khoBaseService.getPM().subscribe({
      next: (response: any) => {
        this.pms = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getCustomers() {
    this.khoBaseService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getProjectStatus() {
    this.khoBaseService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projectStatus = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getFirmBase() {
    this.khoBaseService.getFirmBase().subscribe({
      next: (response: any) => {
        this.firmBase = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getProjectTypeBase() {
    this.khoBaseService.getProjectTypeBase().subscribe({
      next: (response: any) => {
        this.projectTypeBase = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }
  getUsers() {
    this.khoBaseService.getUsers().subscribe({
      next: (response: any) => {
        this.users = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getProjects!'
        );
      }
    });
  }

  onSubmit() {
    function formatDateTime(value: any): string | null {
      if (!value) return null;
      const d = new Date(value);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    console.log(this.validateForm.get('projectTypeID')?.value);
    if (this.validateForm.valid) {
      let projectStatusOld = this.FollowProject === undefined ? 0 : this.FollowProject?.ProjectStatusBaseID;
      let followProject = {
        ID: this.FollowProject ? this.FollowProject.ID : 0,
        ProjectID: this.validateForm.get('projectID')?.value ?? 0,
        CustomerBaseID: this.validateForm.get('customerID')?.value ?? 0,
        ProjectStatusBaseID: this.validateForm.get('projectStatusID')?.value ?? 0,
        FirmBaseID: this.validateForm.get('firmBaseID')?.value ?? 0,
        ProjectTypeBaseID: this.validateForm.get('projectTypeID')?.value ?? 0,
        UserID: this.validateForm.get('userID')?.value ?? 0,
        EndUserID: this.validateForm.get('endUserID')?.value ?? 0,
        ProjectStartDate: formatDateTime(this.validateForm.get('projectStartDate')?.value),
        WorkDone: this.validateForm.get('workDone')?.value ?? '',
        WorkWillDo: this.validateForm.get('workWillDo')?.value ?? '',
        PossibilityPO: this.validateForm.get('possibilityPO')?.value ?? '',
        // dự kiến
        ExpectedPlanDate: formatDateTime(this.validateForm.get('expectedPlanDate')?.value),
        ExpectedQuotationDate: formatDateTime(this.validateForm.get('expectedQuotationDate')?.value),
        ExpectedProjectEndDate: formatDateTime(this.validateForm.get('expectedProjectEndDate')?.value),
        ExpectedPODate: formatDateTime(this.validateForm.get('expectedPODate')?.value),
        // thực tế
        RealityPlanDate: formatDateTime(this.validateForm.get('realityPlanDate')?.value),
        RealityQuotationDate: formatDateTime(this.validateForm.get('realityQuotationDate')?.value),
        RealityProjectEndDate: formatDateTime(this.validateForm.get('realityProjectEndDate')?.value),
        RealityPODate: formatDateTime(this.validateForm.get('realityPODate')?.value),
        //follow
        TotalWithoutVAT: this.validateForm.get('totalWithoutVAT')?.value ?? 0,
        ProjectContactName: this.validateForm.get('projectContactName')?.value ?? '',
        Note: this.validateForm.get('note')?.value ?? '',
        // pm
        DateDonePM: this.validateForm.get('dateDonePM')?.value ?? null,
        DateWillDoPM: this.validateForm.get('dateWillDoPM')?.value ?? null,
        // sale
        DateDoneSale: this.validateForm.get('dateDoneSale')?.value ?? null,
        DateWillDoSale: this.validateForm.get('dateWillDoSale')?.value ?? null,

        WarehouseID: this.warehouseID
      };
      this.khoBaseService.postSaveFollowProjectBase(followProject).subscribe({
        next: (response: any) => {
          if (response.status == 1) {
            // update project
            this.khoBaseService.getUpdateProject(followProject.ProjectStatusBaseID, followProject.ProjectID, this.khoBaseService.LoginName).subscribe();
            // lưu log nếu thay đổi trạng thái
            let projectStatusNew = followProject.ProjectStatusBaseID;
            if (projectStatusOld != projectStatusNew) {
              let projectStatusLog = {
                ProjectID: followProject.ProjectID,
                ProjectStatusID: projectStatusOld,
                EmployeeID: this.khoBaseService.GlobalEmployeeId,
                DateLog: formatDateTime(new Date()),
                CreatedBy: this.khoBaseService.LoginName,
                UpdatedBy: this.khoBaseService.LoginName,
                CreatedDate: formatDateTime(new Date()),
                UpdatedDate: formatDateTime(new Date())
              }
              this.khoBaseService.postSaveProjectStatusLog(projectStatusLog).subscribe();
            }
            this.notification.create(
              'success',
              'Thông báo',
              'Lưu dữ liệu thành công!'
            );
            this.activeModal.close(true);
          } else {
            this.notification.create(
              'error',
              'Thông báo',
              'Lưu dữ liệu thất bại!'
            );
          }
        },
        error: (err: any) => { }
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
  openProjectTypeBaseDetail() {
     const modalRef = this.modalService.open(ProjectTypeBaseDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        size: 'lg'
      });
      modalRef.result.finally(() => {
        this.getProjectTypeBase();
      });
  }
  openFirmBaseDetail() {
        const modalRef = this.modalService.open(FirmBaseDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        size: 'lg'
      });
      modalRef.result.finally(() => {
        this.getFirmBase();
      });
  }
}

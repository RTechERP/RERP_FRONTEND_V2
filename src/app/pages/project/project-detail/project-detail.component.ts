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
import { SelectProjectEmployeeGroupComponent } from '../project-control/select-project-employee-group';

@Component({
  selector: 'app-project-detail',
  imports: [
    NzTabsModule,
    NzSelectModule,
    FormsModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
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
  //#endregion

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal
  ) {}

  //#region Chạy khi mở chương trình
  ngOnInit(): void {}

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
      error: (error) => {
        console.error('Lỗi:', error);
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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getStatuses() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.statuses = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getFirmBase() {
    this.projectService.getFirmBases().subscribe({
      next: (response: any) => {
        this.firmBases = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectTypeBase() {
    this.projectService.getProjectTypeBases().subscribe({
      next: (response: any) => {
        this.projectTypeBases = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProject() {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          console.log(response.data);
          this.projectCode = response.data.ProjectCode;
          this.projectName = response.data.ProjectName;
          this.note = response.data.Note;
          this.customerId = response.data.CustomerID;
          this.userSaleId = response.data.UserID;
          this.userTechId = response.data.UserTechnicalID;
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
        },
        error: (error) => {
          console.error('Lỗi:', error);
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
        error: (error) => {
          console.log('Lỗi', error);
        },
      });
    }
  }

  getProjectCode() {
    if (this.customers.length < 0) return;
    const customer = (this.customers as any[]).find(
      (x) => x.ID === this.customerId
    );

    if (customer.CustomerShortName == '') {
      this.notification.error(
        '',
        'Khách hàng đang không có tên kí hiệu. Xin vui lòng thêm thông tin tên kí hiệu!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      this.projectCode = '';
      return;
    }

    if (this.customers.length > 0) {
      this.projectService
        .getProjectCodeModal(
          this.projectId,
          customer.CustomerShortName,
          this.projectTypeId
        )
        .subscribe({
          next: (response: any) => {
            this.projectCode = response.data;
            if (!this.endUserId) {
              this.endUserId = this.customerId;
            }
          },
          error: (error) => {
            console.error('Lỗi:', error);
          },
        });
    }
  }

  getDayChange() {
    if (this.projectStatusId == this.oldStatusId || this.projectId <= 0) return;

    const modalRef = this.modal.create({
      nzContent: this.dateChangeStatusContainer,
      nzFooter: [
        {
          label: 'Hủy',
          type: 'default',
          nzDanger: true,
          onClick: () => {
            this.projectStatusId = this.oldStatusId;
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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projectStatus = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
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
        error: (error) => {
          console.error('Lỗi:', error);
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
      error: (error) => {
        console.error('Lỗi:', error);
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
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }

  onDateChange(date: any) {
    this.dateChangeStatus = date;
    console.log(this.dateChangeStatus);
  }

  saveDataProject() {
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
          error: (error) => {
            console.error('Lỗi:', error);
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
    if (!this.projectCode) {
      this.notification.error('', 'Vui lòng nhập mã dự án', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    console.log('prjtypelink', projectTypeLinks);

    if (!this.projectName) {
      this.notification.error('', 'Vui lòng nhập tên dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.customerId) {
      this.notification.error('', 'Vui lòng khách hàng!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.userSaleId) {
      this.notification.error('', 'Vui lòng chọn Người phụ trách(Sale)!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.userTechId) {
      this.notification.error(
        '',
        'Vui lòng chọn Người phụ trách (Technical)!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    if (!this.pmId) {
      this.notification.error('', 'Vui lòng chọn PM!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.endUserId) {
      this.notification.error('', 'Vui lòng chọn End User!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.expectedPlanDate) {
      this.notification.error('', 'Vui lòng nhập Ngày gửi phương án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.expectedQuotationDate) {
      this.notification.error('', 'Vui lòng nhập Ngày gửi báo giá!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (projectTypeLinks.length == 0 && this.projectTypeId <= 1) {
      this.notification.error('', 'Vui lòng chọn kiểu dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.priority) {
      this.notification.error('', 'Vui lòng nhập Mức ưu tiên!', {
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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  loadAll() {
    this.loadProject(this.projectIdleader);
    this.getProjectTypeLinksDetail();
    this.getProjectCurrentSituation();
  }

  saveData() {
    if (this.currentTab == 0) {
      console.log(1);
      this.saveDataProject();
    } else if (this.currentTab == 1) {
      console.log(2);
      this.saveProjectTypeLink();
    }
  }

  saveProjectTypeLink() {
    if (this.projectIdleader <= 0) {
      this.notification.error('', 'Vui lòng chọn dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    if (this.projectStatusIdDetail <= 0) {
      this.notification.error('', 'Vui lòng chọn trạng thái dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const prjTypeLinks = this.projectService.getSelectedRowsRecursive(
      this.tb_projectTypeLinksDetail.getData()
    );

    const dataSave = {
      ProjectID: this.projectIdleader,
      ProjectStatus: this.projectStatusIdDetail,
      GlobalEmployeeId: this.projectService.GlobalEmployeeId,
      prjTypeLinks: prjTypeLinks,
      Situlator: this.situlator ?? '',
    };

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
      error: (error) => {
        console.error('Lỗi:', error);
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
          this.projectService.setDataTree(response.data)
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
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
          this.projectService.setDataTree(response.data)
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
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
        this.priority = reason.priority;
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

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getProjectStatus();
        }
      },
      (reason) => {}
    );
  }
  //#endregion
}

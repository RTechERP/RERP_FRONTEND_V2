import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, Optional, Inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
} from 'angular-slickgrid';
import { KpiPositionEmployeeService, DeleteEmployeeRequest } from './kpi-position-employee-service/kpi-position-employee.service';
import { KpiPositionDetailComponent } from './kpi-position-detail/kpi-position-detail.component';
import { KpiPositionEmployeeDetailComponent } from './kpi-position-employee-detail/kpi-position-employee-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-kpi-position-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzButtonModule,
    NzSplitterModule,
    NzModalModule,
    NzFormModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './kpi-position-employee.component.html',
  styleUrl: './kpi-position-employee.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiPositionEmployeeComponent implements OnInit, OnDestroy {
  // ViewChild for copy modal template
  @ViewChild('copyModalContent') copyModalContent!: TemplateRef<any>;

  // Master grid (Positions)
  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  datasetMaster: any[] = [];

  // Detail grid (Employees)
  angularGridDetail!: AngularGridInstance;
  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  datasetDetail: any[] = [];

  // Menu bars
  masterMenuBars: any[] = [];
  detailMenuBars: any[] = [];

  // Filter data
  departments: any[] = [];
  kpiSessions: any[] = [];
  selectedDepartmentId: number = 0;
  selectedKPISessionId: number = 0;

  // Selected items
  selectedPositionId: number = 0;
  selectedPositionRow: any = null;
  selectedEmployeeRows: any[] = [];

  // Copy modal
  copyFromSessionId: number = 0;
  copyToSessionId: number = 0;

  // Route params
  private queryParamsSubscription?: Subscription;

  constructor(
    private service: KpiPositionEmployeeService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    // Subscribe to queryParams in constructor like approve-tp pattern
    this.route.queryParams.subscribe(params => {
      this.selectedDepartmentId =
        params['departmentId']
        ?? this.tabData?.departmentId
        ?? 0;
    });
  }

  ngOnInit(): void {
    console.log(this.selectedDepartmentId);
    this.initMasterMenuBar();
    this.initDetailMenuBar();
    this.initGridMaster();
    this.initGridDetail();
    this.loadDepartments();

    // Load initial data with param = 0 (wait for grid to be ready)
    setTimeout(() => {
      this.loadInitialData();
    }, 300);
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  initMasterMenuBar(): void {
    this.masterMenuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAddPosition(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEditPosition(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeletePosition(),
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => this.onCopyPosition(),
      },
    ];
  }

  initDetailMenuBar(): void {
    this.detailMenuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAddEmployee(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteEmployee(),
      },
    ];
  }

  //#region Master Grid Setup
  initGridMaster(): void {
    this.columnDefinitionsMaster = [
      {
        id: 'PositionCode',
        name: 'Mã vị trí',
        field: 'PositionCode',
        width: 120,
        minWidth: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'PositionName',
        name: 'Tên vị trí',
        field: 'PositionName',
        width: 300,
        minWidth: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TypePositionText',
        name: 'Chức vụ',
        field: 'TypePositionText',
        width: 150,
        minWidth: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'KPISessionName',
        name: 'Kỳ đánh giá',
        field: 'KPISessionName',
        width: 200,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'YearEvaluation',
        name: 'Năm',
        field: 'YearEvaluation',
        width: 100,
        minWidth: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
      },
    ];

    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-master',
        calculateAvailableSizeBy: 'container',
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableCheckboxSelector: false,
      multiColumnSort: true,
      enableGrouping: true,
    };
  }

  angularGridReadyMaster(angularGrid: AngularGridInstance): void {
    this.angularGridMaster = angularGrid;
  }

  onMasterRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedPositionId = item.ID;
      this.selectedPositionRow = item;
      this.loadEmployeeDetails(this.selectedPositionId);
    }
  }

  onMasterRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedPositionId = item.ID;
      this.onEditPosition();
    }
  }
  //#endregion

  //#region Detail Grid Setup
  initGridDetail(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        width: 120,
        minWidth: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'FullName',
        name: 'Tên nhân viên',
        field: 'FullName',
        width: 200,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        width: 200,
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: false,
      },
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      multiSelect: true,
      enableGrouping: true,
    };
  }

  angularGridReadyDetail(angularGrid: AngularGridInstance): void {
    this.angularGridDetail = angularGrid;

    // Listen to row selection changes
    this.angularGridDetail.slickGrid?.onSelectedRowsChanged.subscribe((e, args) => {
      const selectedRows = args.rows;
      this.selectedEmployeeRows = selectedRows.map(row =>
        this.angularGridDetail.dataView?.getItem(row)
      ).filter(item => item);
    });
  }

  onDetailRowDblClick(e: any, args: any): void {
    // Double click on detail grid opens add employee modal
    this.onAddEmployee();
  }
  //#endregion

  //#region Data Loading
  loadDepartments(): void {
    this.service.getDepartment().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.departments = response.data;
          if (this.departments.length > 0) {
            // Chỉ auto-select department đầu tiên nếu chưa có giá trị từ queryParams/tabData
            if (!this.selectedDepartmentId) {
              this.selectedDepartmentId = this.departments[0].ID;
            }
            this.onDepartmentChange();
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách phòng ban'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải phòng ban: ' + error
        );
      },
    });
  }

  onDepartmentChange(): void {
    if (this.selectedDepartmentId) {
      this.service.getKPISession(this.selectedDepartmentId).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.kpiSessions = response.data;
            this.selectedKPISessionId = 0;
            this.datasetMaster = [];
            this.datasetDetail = [];
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi tải kỳ đánh giá'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi kết nối khi tải kỳ đánh giá: ' + error
          );
        },
      });
    }
  }

  onKPISessionChange(): void {
    if (this.selectedKPISessionId) {
      this.onSearch();
    }
  }

  loadInitialData(): void {
    // Load all data with kpiSessionId = 0
    this.service.getData(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetMaster = response.data.map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          }));

          // Apply grouping
          setTimeout(() => {
            this.applyMasterGrouping();
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
      },
    });
  }

  onSearch(): void {
    if (!this.selectedKPISessionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn kỳ đánh giá'
      );
      return;
    }

    this.service.getData(this.selectedKPISessionId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetMaster = response.data.map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          }));

          // Update selectedPositionRow với data mới từ dataset
          if (this.selectedPositionId) {
            const updatedRow = this.datasetMaster.find((item: any) => item.ID === this.selectedPositionId);
            if (updatedRow) {
              this.selectedPositionRow = updatedRow;
            }
          }

          // Apply grouping
          setTimeout(() => {
            this.applyMasterGrouping();
          }, 100);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu vị trí'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải dữ liệu: ' + error
        );
      },
    });
  }

  loadEmployeeDetails(positionId: number): void {
    this.service.getDetail(positionId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetDetail = response.data.map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          }));

          // Apply grouping
          setTimeout(() => {
            this.applyDetailGrouping();
          }, 100);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách nhân viên'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải nhân viên: ' + error
        );
      },
    });
  }

  applyMasterGrouping(): void {
    if (!this.angularGridMaster?.slickGrid) return;

    this.angularGridMaster.dataView?.setGrouping([
      {
        getter: 'KPISessionName',
        formatter: (g: any) => `Kỳ đánh giá: ${g.value} (${g.count} vị trí)`,
        aggregateCollapsed: false,
        collapsed: false,
      },
      {
        getter: 'TypePositionText',
        formatter: (g: any) => `Chức vụ: ${g.value} (${g.count} vị trí)`,
        aggregateCollapsed: false,
        collapsed: false,
      },
    ]);
  }

  applyDetailGrouping(): void {
    if (!this.angularGridDetail?.slickGrid) return;

    this.angularGridDetail.dataView?.setGrouping([
      {
        getter: 'DepartmentName',
        formatter: (g: any) => `Phòng ban: ${g.value} (${g.count} nhân viên)`,
        aggregateCollapsed: false,
        collapsed: false,
      },
    ]);
  }
  //#endregion

  //#region CRUD Operations
  onAddPosition(): void {
    const modalRef = this.modalService.open(KpiPositionDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedKPISessionId;
    modalRef.componentInstance.kpiPosition = {};
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.onSearch();
        }
      },
      () => { }
    );
  }

  onEditPosition(): void {
    if (!this.selectedPositionId || !this.selectedPositionRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí cần sửa'
      );
      return;
    }

    const modalRef = this.modalService.open(KpiPositionDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedKPISessionId;
    modalRef.componentInstance.kpiPosition = this.selectedPositionRow;
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.id = this.selectedPositionId;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.onSearch();
        }
      },
      () => { }
    );
  }

  onDeletePosition(): void {
    if (!this.selectedPositionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí cần xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa vị trí này?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.service.deletePosition(this.selectedPositionId).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa vị trí thành công'
              );
              this.onSearch();
              this.selectedPositionId = 0;
              this.datasetDetail = [];
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi xóa vị trí'
              );
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi kết nối khi xóa vị trí: ' + error
            );
          },
        });
      },
    });
  }

  onCopyPosition(): void {
    // Reset copy session IDs
    this.copyFromSessionId = 0;
    this.copyToSessionId = 0;

    this.modal.create({
      nzTitle: 'Copy vị trí nhân viên',
      nzContent: this.copyModalContent,
      nzOkText: 'Copy',
      nzCancelText: 'Hủy',
      nzWidth: 450,
      nzOnOk: () => {
        // Validate
        if (!this.copyFromSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng chọn kỳ đánh giá nguồn'
          );
          return false;
        }
        if (!this.copyToSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng chọn kỳ đánh giá đích'
          );
          return false;
        }
        if (this.copyFromSessionId === this.copyToSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Kỳ đánh giá nguồn và đích không được trùng nhau'
          );
          return false;
        }

        // Call API
        this.service.copyPositionEmployee(this.copyFromSessionId, this.copyToSessionId).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Copy thành công'
              );
              this.onSearch();
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi copy'
              );
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi kết nối khi copy: ' + error
            );
          },
        });
        return true;
      },
    });
  }

  onAddEmployee(): void {
    if (!this.selectedPositionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí trước khi thêm nhân viên'
      );
      return;
    }

    const modalRef = this.modalService.open(KpiPositionEmployeeDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedPositionRow?.KPISessionID || this.selectedKPISessionId;
    modalRef.componentInstance.kpiPositionId = this.selectedPositionId;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadEmployeeDetails(this.selectedPositionId);
        }
      },
      () => { }
    );
  }

  onDeleteEmployee(): void {
    if (!this.selectedEmployeeRows || this.selectedEmployeeRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên cần xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedEmployeeRows.length} nhân viên đã chọn?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const deleteRequests: DeleteEmployeeRequest[] = this.selectedEmployeeRows.map(
          (emp) => ({
            DepartmentID: emp.DepartmentID,
            KPIPositionEmployeeID: emp.KPIPositionEmployeeID,
          })
        );

        this.service.deleteEmployee(deleteRequests).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa nhân viên thành công'
              );
              this.loadEmployeeDetails(this.selectedPositionId);
              this.selectedEmployeeRows = [];
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi xóa nhân viên'
              );
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi kết nối khi xóa nhân viên: ' + error
            );
          },
        });
      },
    });
  }
  //#endregion
}

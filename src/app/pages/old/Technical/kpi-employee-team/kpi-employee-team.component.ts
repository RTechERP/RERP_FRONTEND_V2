import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
} from 'angular-slickgrid';
import { Menubar } from 'primeng/menubar';
import { KpiEmployeeTeamService } from './kpi-employee-team-service/kpi-employee-team.service';
import { KpiEmployeeTeamDetailComponent } from './kpi-employee-team-detail/kpi-employee-team-detail.component';
import { ChooseEmployeeComponent } from './choose-employee/choose-employee.component';
import { CopyTeamComponent } from './copy-team/copy-team.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-kpi-employee-team',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    NzSpinModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './kpi-employee-team.component.html',
  styleUrl: './kpi-employee-team.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiEmployeeTeamComponent implements OnInit {
  // Menu bar items
  menuBars: any[] = [];

  // SlickGrid - Team Tree
  angularGridTeam!: AngularGridInstance;
  columnDefinitionsTeam: Column[] = [];
  gridOptionsTeam: GridOption = {};
  datasetTeam: any[] = [];

  // SlickGrid - Employee
  angularGridEmployee!: AngularGridInstance;
  columnDefinitionsEmployee: Column[] = [];
  gridOptionsEmployee: GridOption = {};
  datasetEmployee: any[] = [];

  // Filter values
  filters: any = {
    yearValue: new Date().getFullYear(),
    quarterValue: Math.ceil((new Date().getMonth() + 1) / 3),
    departmentID: 0,
  };

  // Data
  departments: any[] = [];
  selectedTeamId: number = 0;
  selectedTeamRow: any = null;

  // Loading states
  isLoadingTeam: boolean = false;
  isLoadingEmployee: boolean = false;

  constructor(
    private kpiEmployeeTeamService: KpiEmployeeTeamService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGridTeam();
    this.initGridEmployee();
    this.loadDepartments();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAdd()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEdit()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDelete()
      },
      {
        label: 'Sao chép',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => this.onCopy()
      }
    ];
  }

  //#region Grid Initialization
  initGridTeam(): void {
    this.columnDefinitionsTeam = [
      {
        id: 'Name', name: 'Tên nhóm', field: 'Name',
        width: 300, minWidth: 250, sortable: true, filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: Formatters.tree,
      },
      {
        id: 'LeaderName', name: 'Trưởng nhóm', field: 'LeaderName',
        width: 200, minWidth: 150, sortable: true, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
    ];

    this.gridOptionsTeam = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-team',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
      multiColumnSort: false,
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'Name',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      showPreHeaderPanel: false,
    };
  }

  initGridEmployee(): void {
    this.columnDefinitionsEmployee = [
      {
        id: 'Code', name: 'Mã nhân viên', field: 'Code',
        width: 150, minWidth: 120, sortable: true, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'FullName', name: 'Tên nhân viên', field: 'FullName',
        width: 250, minWidth: 200, sortable: true, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Team', name: 'Team', field: 'Team',
        width: 200, minWidth: 150, sortable: true, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
    ];

    this.gridOptionsEmployee = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-employee',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      multiColumnSort: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false
      },
    };
  }

  angularGridReadyTeam(angularGrid: AngularGridInstance): void {
    this.angularGridTeam = angularGrid;
    this.loadTeamData();
  }

  angularGridReadyEmployee(angularGrid: AngularGridInstance): void {
    this.angularGridEmployee = angularGrid;
  }
  //#endregion

  //#region Data Loading
  loadDepartments(): void {
    this.kpiEmployeeTeamService.getDepartments().subscribe({
      next: (response) => {
        if (response.status === 1) {
          // Sort by STT like WinForm
          this.departments = (response.data || []).sort((a: any, b: any) => (a.STT || 0) - (b.STT || 0));
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Không thể tải danh sách phòng ban');
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
      }
    });
  }

  loadTeamData(): void {
    this.isLoadingTeam = true;
    const { yearValue, quarterValue, departmentID } = this.filters;

    this.kpiEmployeeTeamService.getAll(yearValue, quarterValue, departmentID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const rawData = response.data || [];
          // Transform data for tree structure
          this.datasetTeam = rawData.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
            parentId: item.ParentID === 0 || item.ParentID === null ? null : item.ParentID,
            treeLevel: item.ParentID === 0 || item.ParentID === null ? 0 : 1,
          }));
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Không có dữ liệu');
        }
        this.isLoadingTeam = false;
      },
      error: (error) => {
        this.isLoadingTeam = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu team');
      }
    });
  }

  loadEmployeeData(): void {
    if (!this.selectedTeamId || this.selectedTeamId <= 0) {
      this.datasetEmployee = [];
      return;
    }

    this.isLoadingEmployee = true;
    const { yearValue, quarterValue, departmentID } = this.filters;
    this.kpiEmployeeTeamService.getEmployeeInTeam(this.selectedTeamId, departmentID, yearValue, quarterValue).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetEmployee = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
          }));
        } else {
          this.datasetEmployee = [];
        }
        this.isLoadingEmployee = false;
      },
      error: (error) => {
        this.isLoadingEmployee = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu nhân viên');
      }
    });
  }

  onSearch(): void {
    this.loadTeamData();
  }

  // Tree formatter for the Name column
  treeFormatter: Formatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const level = dataContext.__treeLevel || 0;
    const indent = level * 15;
    const hasChildren = this.datasetTeam.some(item => item.parentId === dataContext.id);
    const icon = hasChildren ? '▾' : '•';
    return `<span style="padding-left: ${indent}px;">${icon} ${value || ''}</span>`;
  };
  //#endregion

  //#region Grid Events
  onTeamRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedTeamId = item.ID;
      this.selectedTeamRow = item;
      this.loadEmployeeData();
    }
  }

  onTeamRowDblClick(e: any, args: any): void {
    this.onEdit();
  }
  //#endregion

  //#region CRUD Operations
  onAdd(): void {
    const modalRef = this.modalService.open(KpiEmployeeTeamDetailComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.yearValue = this.filters.yearValue;
    modalRef.componentInstance.quarterValue = this.filters.quarterValue;
    modalRef.componentInstance.departmentId = this.filters.departmentID;
    modalRef.componentInstance.detail = null;

    modalRef.result.then(
      () => {
        this.loadTeamData();
      },
      () => { }
    );
  }

  onEdit(): void {
    if (!this.selectedTeamId || this.selectedTeamId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một team để sửa');
      return;
    }

    const modalRef = this.modalService.open(KpiEmployeeTeamDetailComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = this.selectedTeamId;
    modalRef.componentInstance.yearValue = this.filters.yearValue;
    modalRef.componentInstance.quarterValue = this.filters.quarterValue;
    modalRef.componentInstance.departmentId = this.filters.departmentID;
    modalRef.componentInstance.detail = this.selectedTeamRow;

    modalRef.result.then(
      () => {
        this.loadTeamData();
      },
      () => { }
    );
  }

  onDelete(): void {
    if (!this.selectedTeamId || this.selectedTeamId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một team để xóa');
      return;
    }

    const teamName = this.selectedTeamRow?.Name || '';

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn xóa team "${teamName}" không?`,
      nzOkText: 'Đồng ý',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Get team by ID first, then set IsDeleted = true and save
        this.kpiEmployeeTeamService.getById(this.selectedTeamId).subscribe({
          next: (response) => {
            if (response?.status === 1 && response.data) {
              const team = response.data;
              team.IsDeleted = true;

              // Call saveData to delete (soft delete)
              this.kpiEmployeeTeamService.saveData(team).subscribe({
                next: (saveResponse) => {
                  if (saveResponse?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công!');
                    this.selectedTeamId = 0;
                    this.selectedTeamRow = null;
                    this.loadTeamData();
                    this.datasetEmployee = [];
                  } else {
                    this.notification.error(NOTIFICATION_TITLE.error, saveResponse?.message || 'Xóa thất bại');
                  }
                },
                error: (error) => {
                  this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || 'Có lỗi xảy ra khi xóa');
                }
              });
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Không tìm thấy team');
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || 'Có lỗi xảy ra');
          }
        });
      }
    });
  }

  onCopy(): void {
    const modalRef = this.modalService.open(CopyTeamComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });

    modalRef.result.then(
      () => {
        this.loadTeamData();
      },
      () => { }
    );
  }

  onAddEmployee(): void {
    if (!this.selectedTeamId || this.selectedTeamId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một team trước');
      return;
    }

    const modalRef = this.modalService.open(ChooseEmployeeComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.kpiEmployeeTeamId = this.selectedTeamId;

    modalRef.result.then(
      () => {
        this.loadEmployeeData();
      },
      () => { }
    );
  }

  onDeleteEmployee(): void {
    const selectedRows = this.angularGridEmployee?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên để xóa');
      return;
    }

    // Get selected employee IDs from the grid
    const grid = this.angularGridEmployee?.slickGrid;
    const selectedEmployeeIds: number[] = selectedRows
      .map(rowIndex => grid?.getDataItem(rowIndex))
      .filter(item => item && item.ID)
      .map(item => item.ID);

    if (selectedEmployeeIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy nhân viên để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn xóa ${selectedEmployeeIds.length} nhân viên khỏi team không?`,
      nzOkText: 'Đồng ý',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Build payload like WinForm - set IsDeleted = true for each selected employee
        const payload = selectedEmployeeIds.map(id => ({
          ID: id,
          IsDeleted: true,
          UpdatedDate: new Date().toISOString(),
          UpdatedBy: ''
        }));

        this.kpiEmployeeTeamService.saveEmployeeTeamLinks(payload).subscribe({
          next: (response) => {
            if (response?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa nhân viên thành công');
              this.loadEmployeeData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Xóa thất bại');
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || 'Có lỗi xảy ra khi xóa');
          }
        });
      }
    });
  }
  //#endregion
}

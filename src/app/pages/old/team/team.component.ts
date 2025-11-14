import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TeamServiceService } from './team-service/team-service.service';
// import { EmployeeService } from '../employees/employee-service/employee.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    FormsModule,
    NgIf,
    NzSpinModule,HasPermissionDirective
  ],
  standalone: true
})
export class TeamComponent implements OnInit, AfterViewInit {
  private teamTabulator!: Tabulator;
  private employeeTabulator!: Tabulator;
  private employeeTeamTabulator!: Tabulator;
  teamList: any[] = [];
  employeeList: any[] = [];
  employeeCombo: any[] = [];
  employeeTeamList: any[] = [];
  departmentList: any[] = [];
  departmentEmployeeList: any[] = [];
  projectTypeList: any[] = [];
  isEditMode: boolean = false;
  selectedTeamId: number = 0;
  selectedTeam: any = null;
  department: any = null;
  departmentEmployee: any = null;
  isVisible = false;
  isEmployeeModalVisible = false;
  isSubmitting = false;
  teamForm!: FormGroup;
  flattenedTeamList: any[] = [];

  isLoading = false;
  isLoad = false;

  constructor(
    private teamService: TeamServiceService,
    // private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    this.initForm();
  }

  private initForm() {
    this.teamForm = this.fb.group({
      ID: [0],
      DepartmentID: [null, Validators.required],
      ParentID: [null],
      Code: ['', Validators.required],
      Name: ['', Validators.required],
      Leader: [''],
      TypeName: [''],
      LeaderID: [null, Validators.required],
      ProjectTypeID: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadDepartments();
    this.loadTeams();
    this.loadEmployee();
    this.loadProjectType();
    this.loadDepartmentEmployee();
  }

  ngAfterViewInit() {
    // Initialize tables after view is ready
    setTimeout(() => {
      this.initializeTeamTable();
      this.initializeEmployeeTable();
      this.initializeEmployeeTeamTable();
    });
  }

  //#region load dữ liệu phòng ban lên select
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
        console.log(this.departmentList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }
  //#endregion

  loadDepartmentEmployee() {
    this.departmentService.getDepartments().subscribe((data: any) => {
      this.departmentEmployeeList = data.data;
    });
  }

  //#region load dữ liệu team
  private loadTeamData(departmentId: number | null) {
    const id = departmentId || 0;
    this.teamService.getTeams(id).subscribe({
      next: (data: any) => {
        const flatData = data.data;
        const treeData = this.buildTreeTeam(flatData);
        this.teamList = treeData;
        this.flattenedTeamList = this.flattenTeamTree(treeData);
        this.teamTabulator.setData(this.teamList);

        // Load employees for the first team if available
        if (this.teamList.length > 0) {
          this.loadUserTeam(this.teamList[0].ID, id);
        } else {
          this.employeeList = [];
          this.employeeTabulator.setData([]);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.message);
        this.teamList = [];
        this.flattenedTeamList = [];
        this.teamTabulator.setData([]);
        this.employeeList = [];
        this.employeeTabulator.setData([]);
      }
    });
  }
  //#endregion

  //#region lọc dữ liệu theo phong ban
  onDepartmentChange() {
    this.loadTeamData(this.department);
  }
  //#endregion

  onDepartmentEmployeeChange() {
    if (this.departmentEmployee) {
      this.loadEmployeeTeam(this.departmentEmployee.ID, this.selectedTeam?.ID);
    } else {
      // When department is cleared, load all employees
      this.loadEmployeeTeam(0, this.selectedTeam?.ID);
    }
  }

  loadTeams() {
    this.isLoading = true;
    if (this.department) {
      this.teamService.getTeams(this.department).subscribe({
        next: (data: any) => {
          const flatData = data.data;
          const treeData = this.buildTreeTeam(flatData);
          this.teamList = treeData;
          this.flattenedTeamList = this.flattenTeamTree(treeData);
          this.teamTabulator.setData(this.teamList);
          this.isLoading = false;
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.message);
          this.teamList = [];
          this.flattenedTeamList = [];
          this.teamTabulator.setData([]);
          this.isLoading = false;
        }
      });
    } else {
      this.teamService.getTeams(0).subscribe({
        next: (data: any) => {
          const flatData = data.data;
          const treeData = this.buildTreeTeam(flatData);
          this.teamList = treeData;
          this.flattenedTeamList = this.flattenTeamTree(treeData);
          this.teamTabulator.setData(this.teamList);
          this.isLoading = false;
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.message);
          this.teamList = [];
          this.flattenedTeamList = [];
          this.teamTabulator.setData([]);
          this.isLoading = false;
        }
      });
    }
  }

  loadUserTeam(teamId: number, departmentId: number) {
    this.isLoad = true;
    this.teamService.getUserTeam(teamId, departmentId).subscribe({
      next: (data: any) => {
        this.employeeList = data.data;
        this.employeeTabulator.setData(this.employeeList);
        this.isLoad = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
        this.isLoad = false;
      }
    });
  }

  loadEmployee() {
    this.teamService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeCombo = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    });
  }

  loadEmployeeTeam(departmentID: number, userTeamID: number) {
    this.teamService.getEmployeeByDepartmentID(departmentID, userTeamID).subscribe({
      next: (data: any) => {
        this.employeeTeamList = data.data;
        if (this.employeeTeamTabulator) {
          this.employeeTeamTabulator.replaceData(this.employeeTeamList);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
        this.employeeTeamList = [];
        if (this.employeeTeamTabulator) {
          this.employeeTeamTabulator.replaceData([]);
        }
      }
    });
  }

  loadProjectType() {
    this.teamService.getProjectTypes().subscribe({
      next: (data: any) => {
        this.projectTypeList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại dự án: ' + error.message);
      }
    });
  }

  private buildTreeTeam(items: any[]): any[] {
    const itemMap: { [key: number]: any } = {};
    const tree: any[] = [];

    items.forEach(item => {
      itemMap[item.ID] = { ...item, children: [] };
    });

    items.forEach(item => {
      const mappedItem = itemMap[item.ID];
      if (item.ParentID === 0) {
        tree.push(mappedItem);
      } else {
        const parent = itemMap[item.ParentID];
        if (parent) {
          parent.children.push(mappedItem);
        }
      }
    });

    return tree;
  }

  private flattenTeamTree(items: any[], level: number = 0, parent: any = null): any[] {
    let result: any[] = [];
    items.forEach(item => {
      const flatItem = {
        ...item,
        level: level,
        parent: parent ? parent.Name : null,
        expanded: false
      };
      result.push(flatItem);
      if (item.children && item.children.length > 0) {
        result = result.concat(this.flattenTeamTree(item.children, level + 1, item));
      }
    });
    return result;
  }

  private initializeTeamTable(): void {
    this.teamTabulator = new Tabulator('#team-table', {
      data: this.teamList,
      layout: 'fitColumns',
      selectableRows: 1,
      height: '85vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: "children",
      columns: [
        {
          title: 'Tên nhóm',
          field: 'Name',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: "tree" as any
        },
        {
          title: 'Trưởng nhóm',
          field: 'Leader',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: function(cell) {
            const value = cell.getValue();
            return value || '';
          }
        },
        {
          title: 'Loại',
          field: 'TypeName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: function(cell) {
            const value = cell.getValue();
            return value || '';
          }
        },
      ],
    });

    this.teamTabulator.on("rowSelectionChanged", (data: any) => {
      const teamId = data[0].ID;
      let departmentId = 0;
      if(data[0].ParentID === 0) {
        departmentId = data[0].DepartmentID;
      }
      this.loadUserTeam(teamId, departmentId);
    });
  }

  private initializeEmployeeTable(): void {
    this.employeeTabulator = new Tabulator('#employee-table', {
      data: this.employeeList,
      layout: 'fitColumns',
      selectableRows: true,
      height: '85vh',
      responsiveLayout: true,
      rowContextMenu: [
        {
          label: "Thêm NV",
          action: () => {
            this.openAddEmployeeModal();
          }
        }

      ],
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 70,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      groupBy: "Team",
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center'
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center'
        }
      ],
    });
  }

  private initializeEmployeeTeamTable(): void {
    if (document.getElementById('employee-team-table')) {
      this.employeeTeamTabulator = new Tabulator('#employee-team-table', {
        data: this.employeeTeamList,
        layout:"fitColumns",
        responsiveLayout:true,
        selectableRows: true,
        rowHeader: {
          formatter: "rowSelection",
          titleFormatter: "rowSelection",
          headerSort: false,
          width: 70,
          frozen: true,
          headerHozAlign: "center",
          hozAlign: "center"
        },
        groupBy: "DepartmentName",
        height: '65vh',
        columns: [
          {
            title: 'Mã nhân viên',
            field: 'Code',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: '20vw'
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: '70vw'
          }
        ],
      });
    }
  }

  resetDepartment() {
    this.department = null;
    this.loadTeams();
    this.employeeList = [];
    this.employeeTabulator.setData([]);
  }

  resetDepartmentEmployee() {
    this.departmentEmployee = null;
    this.loadEmployeeTeam(0, 0);
    this.employeeTeamList = [];
    this.employeeTeamTabulator.setData([]);
  }

  openAddModal() {
    const selectedRows = this.teamTabulator.getSelectedRows();

    if(selectedRows.length === 0) {
      this.teamForm.reset({
        ID: 0,
        DepartmentID: null,
        ParentID: null,
        Code: '',
        Name: '',
        Leader: '',
        TypeName: '',
        LeaderID: null,
        ProjectTypeID: null
      });
    } else {
      this.selectedTeam = selectedRows[0].getData();
      this.teamForm.reset({
        ID: 0,
        DepartmentID: this.selectedTeam.DepartmentID,
        ParentID: this.selectedTeam.ID,
        Code: '',
        Name: '',
        Leader: '',
        TypeName: '',
        LeaderID: null,
        ProjectTypeID: null
      });
    }
    this.isEditMode = false;
    this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.teamTabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn team cần sửa');
      return;
    }
    this.selectedTeam = selectedRows[0].getData();
    this.isEditMode = true;
    this.teamForm.patchValue(this.selectedTeam);
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.teamTabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn team cần xóa');
      return;
    }
    this.selectedTeamId = selectedRows[0].getData()['ID'];

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa team này không?',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteTeam(),
      nzCancelText: 'Hủy'
    });
  }

  deleteTeam() {
    this.teamService.deleteTeam(this.selectedTeamId).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa team thành công');
        this.loadTeamData(this.department);
        this.loadTeams();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Xóa team thất bại: ' + error.message);
      }
    });
  }

  onSubmit() {
    if (this.teamForm.invalid) {
      Object.values(this.teamForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSubmitting = true;
    const formData = this.teamForm.value;

    this.teamService.saveTeam(formData).subscribe({
      next: () => {
        this.notification.success('Thành công', this.isEditMode ? 'Cập nhật team thành công' : 'Thêm team thành công');
        this.closeModal();
        this.loadTeamData(this.department);
        this.loadTeams();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, (this.isEditMode ? 'Cập nhật' : 'Thêm') + ' team thất bại: ' + error.message);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  closeModal() {
    this.isVisible = false;
    this.teamForm.reset();
    this.isSubmitting = false;
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }

  openAddEmployeeModal() {
    const selectedRows = this.teamTabulator.getSelectedRows();

    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn team cần thêm nhân viên');
      return;
    }

    this.selectedTeam = selectedRows[0].getData();
    if(this.selectedTeam.ParentID === 0) {
      this.notification.warning('Cảnh báo', 'Không thể thêm nhân viên vào team cha');
      return;
    }

    this.isEmployeeModalVisible = true;
    this.departmentEmployee = null;
    // Initialize table and load data after modal is visible
    setTimeout(() => {
      this.initializeEmployeeTeamTable();
      this.loadEmployeeTeam(0, this.selectedTeam.ID);
    }, 100);
  }

  addEmployeesToTeam() {
    const selectedRows = this.employeeTeamTabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên cần thêm');
      return;
    }

    const employeeIds = selectedRows.map(row => row.getData()['ID']);
    const request = {
      TeamID: this.selectedTeam['ID'],
      ListEmployeeID: employeeIds
    };

    this.teamService.addEmployeesToTeam(request).subscribe({
      next: () => {
        this.closeEmployeeModal();
        this.loadUserTeam(this.selectedTeam['ID'], this.department || 0);
        this.loadTeamData(this.department);
        this.notification.success('Thành công', 'Thêm nhân viên vào team thành công');
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Thêm nhân viên vào team thất bại: ' + error.message);
      }
    });
  }

  closeEmployeeModal() {
    this.isEmployeeModalVisible = false;
  }

  removeEmployeeFromTeam() {
    const selectedTeamRows = this.teamTabulator.getSelectedRows();
    const selectedRows = this.employeeTabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên cần xóa');
      return;
    }
    const employeeIds = selectedRows.map(row => row.getData()['ID']);

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa nhân viên khỏi team này không?',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        employeeIds.forEach(id => {
          this.teamService.removeEmployeeFromTeam(id).subscribe({
            next: () => {
              this.loadUserTeam(selectedTeamRows[0].getData()['ID'], 0);
              this.notification.success('Thành công', 'Xóa nhân viên khỏi team thành công');
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa nhân viên khỏi team thất bại: ' + error.message);
            }
          });
        });
      },
      nzCancelText: 'Hủy'
    });
  }
}

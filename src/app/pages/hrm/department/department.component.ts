import { Component, OnInit } from '@angular/core';
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
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DepartmentServiceService } from './department-service/department-service.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from "../../../directives/has-permission.directive";
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../project/project-service/project.service';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DepartmentEmployeeSelectTableComponent } from './department-employee-select-table/department-employee-select-table.component';
import { DepartmentFormComponent } from './department-form/department-form.component';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css'],
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
    NgIf,
    NzSpinModule,
    HasPermissionDirective,
    NzGridModule,
    NgbModalModule,
    NzTreeSelectModule,
    DepartmentEmployeeSelectTableComponent,
  ],
})
export class DepartmentComponent implements OnInit {
  private tabulator!: Tabulator;
  departments: any[] = [];
  isEditMode: boolean = false;
  selectedDepartmentId: number = 0;
  selectedDepartment: any = null;
  employeeList: any[] = [];
  departmentNodes: any[] = [];
  searchText: string = '';
  isLoading = false;

  private tabulatorEmployee!: Tabulator;
  employeeListByDept: any[] = [];
  selectedEmployee: any = null;
  isLoadingEmployee = false;
  allEmployees: any[] = [];

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private ngbModal: NgbModal
  ) {
  }

  ngOnInit(): void {
    this.initializeTable();
    this.initializeEmployeeTable();
    this.loadDepartments();
    this.loadEmployees();
    this.loadAllEmployees();
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_department', {
      data: this.departments,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      selectableRows: 1,
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: "_children",
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Mã phòng ban',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 300,
        },
        {
          title: 'Tên phòng ban',
          field: 'Name',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 900,
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value === 1
              ? '<span>Hoạt động</span>'
              : '<span>Ngừng hoạt động</span>';
          },
        },
      ],
    });

    this.tabulator.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        //this.tabulator.deselectRow();
        row.select();
      }
    });

    this.tabulator.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedDepartment = row.getData();
      this.loadEmployeeByDepartment();
    });

    this.tabulator.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.selectedDepartment = row.getData();
      this.loadEmployeeByDepartment();
      this.openEditModal();
    });
  }

  private initializeEmployeeTable(): void {
    this.tabulatorEmployee = new Tabulator('#tb_employee', {
      data: this.employeeListByDept,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      selectableRows: 1,
      columns: [
        {
          title: 'Mã NV',
          field: 'Code',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Họ tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 250,
          bottomCalc: 'count'
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value === 1
              ? '<span class="badge bg-danger">Đã nghỉ việc</span>'
              : '<span class="badge bg-success">Đang làm việc</span>';
          },
        },
      ],
    });

    this.tabulatorEmployee.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedEmployee = row.getData();
    });

    this.tabulatorEmployee.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.selectedEmployee = row.getData();
    });
  }

  loadDepartments() {
    this.isLoading = true;
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data.data;
        
        // Build tree for tabulator
        const treeData = this.buildTree([...this.departments]);
        this.tabulator.setData(treeData);

        // Build tree for TreeSelect
        this.departmentNodes = this.buildTreeNodes([...this.departments]);
        
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
        this.isLoading = false;
      },
    });
  }

  private buildTree(data: any[]): any[] {
    const tree: any[] = [];
    const lookup: any = {};

    data.forEach(item => {
      lookup[item.ID] = { ...item, _children: [] };
    });

    data.forEach(item => {
      if (item.ParentID && item.ParentID > 0 && lookup[item.ParentID]) {
        lookup[item.ParentID]._children.push(lookup[item.ID]);
      } else {
        tree.push(lookup[item.ID]);
      }
    });

    const cleanEmptyChildren = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node._children && node._children.length === 0) {
          delete node._children;
        } else if (node._children) {
          cleanEmptyChildren(node._children);
        }
      });
    };
    cleanEmptyChildren(tree);

    return tree;
  }

  private buildTreeNodes(data: any[]): any[] {
    const tree: any[] = [];
    const lookup: any = {};

    data.forEach(item => {
      lookup[item.ID] = { title: `${item.Code} - ${item.Name}`, key: item.ID, value: item.ID, children: [], isLeaf: true, ...item };
    });

    data.forEach(item => {
      if (item.ParentID && item.ParentID > 0 && lookup[item.ParentID]) {
        lookup[item.ParentID].children.push(lookup[item.ID]);
        lookup[item.ParentID].isLeaf = false;
      } else {
        tree.push(lookup[item.ID]);
      }
    });

    return tree;
  }

  loadAllEmployees(callback?: () => void) {
    this.employeeService.getAllEmployee().subscribe({
      next: (res: any) => {
        this.allEmployees = res.data || [];
        if (callback) callback();
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + err.message);
      }
    });
  }

  loadEmployeeByDepartment() {
    if (!this.selectedDepartment) {
      this.employeeListByDept = [];
      this.tabulatorEmployee.setData(this.employeeListByDept);
      this.selectedEmployee = null;
      return;
    }
    this.isLoadingEmployee = true;
    const deptId = this.selectedDepartment.ID;
    this.employeeListByDept = this.allEmployees.filter(emp => emp.DepartmentID === deptId);
    this.tabulatorEmployee.setData(this.employeeListByDept);
    this.selectedEmployee = null;
    this.isLoadingEmployee = false;
  }

  // loadEmployees() {
  //   this.employeeService.getEmployees().subscribe({
  //     next: (data) => {
  //       this.employeeList = data.data.map((employee: any) => ({
  //         value: Number(employee.ID),
  //         label: `${employee.Code} - ${employee.FullName}`,
  //         ...employee,
  //       }));
  //       console.log('Employee list:', this.employeeList); // Debug log
  //     },
  //     error: (error) => {
  //       this.notification.error(NOTIFICATION_TITLE.error, error.message);
  //     },
  //   });
  // }

  loadEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
      },
    });
  }

  onSearch(event: any) {
    const value = event.target.value.toLowerCase();
    this.searchText = value;
    this.tabulator.setFilter([
      { field: 'Code', type: 'like', value: value },
      { field: 'Name', type: 'like', value: value },
      { field: 'Email', type: 'like', value: value },
    ]);
  }

  openAddModal() {
    const nextSTT =
      this.departments.length > 0
        ? Math.max(...this.departments.map((item) => item.STT)) + 1
        : 1;

    const modalRef = this.ngbModal.open(DepartmentFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.departmentData = null;
    modalRef.componentInstance.employeeList = this.employeeList;
    modalRef.componentInstance.departmentNodes = this.departmentNodes;
    modalRef.componentInstance.nextSTT = nextSTT;

    modalRef.result.then((result: any) => {
      if (result?.action === 'save') {
        this.notification.success(NOTIFICATION_TITLE.success, 'Thêm phòng ban thành công');
        this.loadDepartments();
      }
    }).catch(() => { });
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length != 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn 1 phòng ban cần sửa!");
      return;
    }
    this.selectedDepartment = selectedRows[0].getData();

    const modalRef = this.ngbModal.open(DepartmentFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.departmentData = { ...this.selectedDepartment };
    modalRef.componentInstance.employeeList = this.employeeList;
    modalRef.componentInstance.departmentNodes = this.departmentNodes;

    modalRef.result.then((result: any) => {
      if (result?.action === 'save') {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật phòng ban thành công');
        this.loadDepartments();
      }
    }).catch(() => { });
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phòng ban cần xóa');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phòng ban đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteDepartment();
      },
      nzCancelText: 'Hủy',
    });
  }

  deleteDepartment() {
    const selectedRows = this.tabulator.getSelectedRows();

    const deleteRequests = selectedRows
      .map((row: any) => row.getData())
      .filter((data: any) => data.ID > 0)
      .map((data: any) => this.departmentService.deleteDepartment(data.ID));

    if (deleteRequests.length === 0) return;

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa phòng ban thành công');
        this.loadDepartments();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || error.message);
      },
    });
  }

  addMember() {
    if (!this.selectedDepartment) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một phòng ban để thêm nhân viên');
      return;
    }

    const deptId = this.selectedDepartment.ID;
    const deptName = this.selectedDepartment.Name;

    // Lọc danh sách nhân viên chưa thuộc phòng ban này
    const employeesNotInDept = this.allEmployees.filter(emp => emp.DepartmentID !== deptId);

    const modalRef = this.ngbModal.open(DepartmentEmployeeSelectTableComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.employeeList = employeesNotInDept;
    modalRef.componentInstance.selectedEmployeeIds = [];

    modalRef.result.then((selectedEmployees: any[]) => {
      if (selectedEmployees && selectedEmployees.length > 0) {
        this.isLoadingEmployee = true;
        // Cập nhật từng nhân viên
        const requests = selectedEmployees.map(emp =>
          this.employeeService.updateEmployeeDepartment(emp.ID, deptId).toPromise()
        );

        Promise.all(requests).then(() => {
          this.notification.success(NOTIFICATION_TITLE.success, `Đã thêm ${selectedEmployees.length} nhân viên vào phòng ban ${deptName}`);
          this.loadAllEmployees(() => {
            this.loadEmployeeByDepartment();
          });
        }).catch(err => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi thêm nhân viên: ' + err.message);
          this.isLoadingEmployee = false;
        });
      }
    }, () => { });
  }

  removeMember() {
    if (!this.selectedEmployee) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa nhân viên <b>${this.selectedEmployee.FullName}</b> khỏi phòng ban này không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.isLoadingEmployee = true;
        this.employeeService.updateEmployeeDepartment(this.selectedEmployee.ID, 0).subscribe({
          next: (res) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa nhân viên khỏi phòng ban thành công');
            this.loadAllEmployees(() => {
              this.loadEmployeeByDepartment();
            });
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa nhân viên: ' + err.message);
            this.isLoadingEmployee = false;
          }
        });
      }
    });
  }
}


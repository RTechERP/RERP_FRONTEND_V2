import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { FormGroupDirective } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EmployeeService } from '../employee-service/employee.service';
import { NzOptionComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeTeamFormComponent } from './employee-team-form/employee-team-form.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TableModule } from 'primeng/table';
import { Menubar } from 'primeng/menubar';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { ChooseEmployeeComponent } from '../../phase-allocation-person/choose-employee/choose-employee.component';
import { EmployeeSelectTableComponent } from './employee-select-table/employee-select-table.component';

@Component({
  selector: 'app-employee-team',
  templateUrl: './employee-team.component.html',
  styleUrls: ['./employee-team.component.css'],
  imports: [
    CommonModule,
    NzIconModule,
    NzButtonModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSplitterModule,
    NzGridModule,
    NzTagModule,
    TreeTableModule,
    TableModule,
    NgbModalModule,
    Menubar,
    EmployeeSelectTableComponent
  ],
  providers: [NzNotificationService, NzModalService],
  standalone: true
})
export class EmployeeTeamComponent implements OnInit {
  employeeTeam: any[] = [];
  employeeTeamTree: TreeNode[] = [];
  departmentList: any[] = [];
  selectedNode: TreeNode | null = null;
  department: any = null;
  sizeSearch: string = '0';
  groupCounts: { [key: string]: number } = {};

  allEmployees: any[] = [];
  memberList: any[] = [];
  selectedMember: any = null;
  menuBars: MenuItem[] = [];
  menuBarsEmployee: MenuItem[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private ngbModal: NgbModal
  ) {
  }

  ngOnInit() {
    this.initMenuBar();
    this.loadEmployeeTeam();
    this.loadDepartments();
    this.loadAllEmployees();
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm team',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => {
          this.openAddModal();
        },
      },
      {
        label: 'Sửa team',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => {
          this.openEditModal();
        }
      },
      {
        label: 'Xóa team',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.openDeleteModal();
        }
      }
    ];

    this.menuBarsEmployee = [
      {
        label: 'Thêm thành viên',
        icon: 'fa-solid fa-user-plus fa-lg text-success',
        disabled: true,
        command: () => {
          this.addMember();
        }
      },
      {
        label: 'Xóa thành viên',
        icon: 'fa-solid fa-user-minus fa-lg text-danger',
        disabled: true,
        command: () => {
          this.deleteMember();
        }
      }
    ];
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

  onNodeSelect(event: any) {
    if (event.node && !event.node.data.isDepartment) {
      const teamId = event.node.data.ID;
      this.memberList = this.allEmployees.filter(emp => emp.EmployeeTeamID === teamId);
      this.selectedMember = null;
      this.menuBars[1].disabled = false;
      this.menuBars[2].disabled = false;
      this.menuBarsEmployee[0].disabled = false;
      this.menuBarsEmployee[1].disabled = true; // Disabled until a member is selected
    } else {
      this.memberList = [];
      this.selectedMember = null;
      this.menuBars[1].disabled = true;
      this.menuBars[2].disabled = true;
      this.menuBarsEmployee[0].disabled = true;
      this.menuBarsEmployee[1].disabled = true;
    }
    // Refresh menus to update disabled state in UI
    this.menuBars = [...this.menuBars];
    this.menuBarsEmployee = [...this.menuBarsEmployee];
  }

  onNodeUnselect() {
    this.memberList = [];
    this.selectedMember = null;
    this.menuBars[1].disabled = true;
    this.menuBars[2].disabled = true;
    this.menuBarsEmployee[0].disabled = true;
    this.menuBarsEmployee[1].disabled = true;

    this.menuBars = [...this.menuBars];
    this.menuBarsEmployee = [...this.menuBarsEmployee];
  }



  loadEmployeeTeam() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (data: any) => {
        let employeeTeamList = data.data || [];
        employeeTeamList.sort((a: any, b: any) => {
          let deptA = a.DepartmentName || '';
          let deptB = b.DepartmentName || '';
          return deptA.localeCompare(deptB);
        });

        let treeData: TreeNode[] = [];
        const departments = new Map<number, any>();

        employeeTeamList.forEach((emp: any) => {
          if (!departments.has(emp.DepartmentID)) {
            departments.set(emp.DepartmentID, {
              DepartmentID: emp.DepartmentID,
              DepartmentName: emp.DepartmentName,
              DepartmentSTT: emp.DepartmentSTT
            });
          }
        });

        // Sắp xếp phòng ban theo STT
        const sortedDepts = Array.from(departments.values()).sort((a, b) => (a.DepartmentSTT || 0) - (b.DepartmentSTT || 0));

        sortedDepts.forEach(dept => {
          const teamsInDept = employeeTeamList.filter((emp: any) => emp.DepartmentID === dept.DepartmentID);
          const teamNodesMap = new Map<number, TreeNode>();

          teamsInDept.forEach((team: any) => {
            teamNodesMap.set(team.ID, {
              data: { ...team, isDepartment: false },
              children: [],
              expanded: true
            });
          });

          const rootTeams: TreeNode[] = [];
          teamsInDept.forEach((team: any) => {
            const node = teamNodesMap.get(team.ID)!;
            if (team.ParentID && teamNodesMap.has(team.ParentID)) {
              teamNodesMap.get(team.ParentID)!.children!.push(node);
            } else {
              rootTeams.push(node);
            }
          });

          if (rootTeams.length > 0) {
            treeData.push({
              data: {
                isDepartment: true,
                Name: dept.DepartmentName,
                Code: '',
                LeaderName: '',
                count: teamsInDept.length
              },
              children: rootTeams,
              expanded: true,
              selectable: false
            });
          }
        });

        this.employeeTeamTree = treeData;
        this.employeeTeam = employeeTeamList;
        this.selectedNode = null;
        this.memberList = [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách team phòng ban: ' + error.message);
      }
    })
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data.map((department: any) => ({
          value: Number(department.ID),
          label: `${department.Name}`
        }));
        console.log(this.departmentList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  openAddModal() {
    const nextSTT = this.employeeTeam.length > 0
      ? Math.max(...this.employeeTeam.map(item => item.STT)) + 1
      : 1;

    const modalRef = this.ngbModal.open(EmployeeTeamFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.nextSTT = nextSTT;

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadEmployeeTeam();
        }
      },
      (dismissed) => { }
    );
  }

  openEditModal() {
    if (!this.selectedNode || this.selectedNode.data.isDepartment) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn team phòng ban cần sửa');
      return;
    }

    const modalRef = this.ngbModal.open(EmployeeTeamFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.selectedNode.data;

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadEmployeeTeam();
        }
      },
      (dismissed) => { }
    );
  }

  openDeleteModal() {
    if (!this.selectedNode || this.selectedNode.data.isDepartment) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn team phòng ban cần xóa');
      return;
    }

    const selectedEmployeeTeam = this.selectedNode.data;

    // Kiểm tra nếu team có team con (team cha)
    if (this.selectedNode.children && this.selectedNode.children.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể xóa team cha. Vui lòng xóa các team con thuộc team này trước.');
      return;
    }
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa team phòng ban này không?`,
      nzOkText: "Xóa",
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeService.saveEmployeeTeam({
          ...selectedEmployeeTeam,
          IsDeleted: 1
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa team phòng ban thành công');
            this.loadEmployeeTeam();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa team phòng ban thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
  }

  getGroupCount(departmentName: string): number {
    return this.groupCounts[departmentName] || 0;
  }

  onMemberSelect(event: any) {
    this.selectedMember = event.data;
    this.menuBarsEmployee[1].disabled = false;
    this.menuBarsEmployee = [...this.menuBarsEmployee];
  }

  onMemberUnselect() {
    this.selectedMember = null;
    this.menuBarsEmployee[1].disabled = true;
    this.menuBarsEmployee = [...this.menuBarsEmployee];
  }

  addMember() {
    if (!this.selectedNode || this.selectedNode.data.isDepartment) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một team để thêm thành viên');
      return;
    }

    const teamId = this.selectedNode.data.ID;
    const teamName = this.selectedNode.data.Name;

    // Lọc danh sách nhân viên chưa thuộc team này
    const employeesNotInTeam = this.allEmployees.filter(emp => emp.EmployeeTeamID !== teamId);

    const modalRef = this.ngbModal.open(EmployeeSelectTableComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.employeeList = employeesNotInTeam;
    modalRef.componentInstance.selectedEmployeeIds = [];

    modalRef.result.then((selectedEmployees: any[]) => {
      if (selectedEmployees && selectedEmployees.length > 0) {
        // Cập nhật từng nhân viên
        const requests = selectedEmployees.map(emp =>
          this.employeeService.updateEmployeeTeam(emp.ID, teamId).toPromise()
        );

        Promise.all(requests).then(() => {
          this.notification.success(NOTIFICATION_TITLE.success, `Đã thêm ${selectedEmployees.length} nhân viên vào team ${teamName}`);
          this.loadAllEmployees(() => {
            this.memberList = this.allEmployees.filter(emp => emp.EmployeeTeamID === teamId);
            this.selectedMember = null;
            this.menuBarsEmployee[1].disabled = true;
          });
        }).catch(err => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi thêm nhân viên vào team: ' + err.message);
        });
      }
    }, () => { });
  }

  deleteMember() {
    if (!this.selectedMember) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa nhân viên <b>${this.selectedMember.FullName}</b> khỏi team này không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeService.updateEmployeeTeam(this.selectedMember.ID, 0).subscribe({
          next: (res) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa nhân viên khỏi team thành công');
            const teamId = this.selectedNode?.data.ID;
            this.loadAllEmployees(() => {
              this.memberList = this.allEmployees.filter(emp => emp.EmployeeTeamID === teamId);
              this.selectedMember = null;
              this.menuBarsEmployee[1].disabled = true;
            });
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa nhân viên: ' + err.message);
          }
        });
      }
    });
  }
}

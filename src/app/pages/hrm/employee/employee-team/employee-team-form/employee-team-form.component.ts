import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { EmployeeService } from '../../employee-service/employee.service';
import { DepartmentServiceService } from '../../../department/department-service/department-service.service';

@Component({
  selector: 'app-employee-team-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzTreeSelectModule,
    NzButtonModule,
  ],
  templateUrl: './employee-team-form.component.html',
  styleUrls: ['./employee-team-form.component.css']
})
export class EmployeeTeamFormComponent implements OnInit {
  @Input() dataInput: any = null;
  @Input() nextSTT: number = 1;

  form!: FormGroup;
  isEdit = false;
  departmentList: any[] = [];
  employeeList: any[] = [];
  allEmployeeTeams: any[] = [];
  parentTeamTree: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private notification: NzNotificationService
  ) {}

  ngOnInit() {
    this.isEdit = !!this.dataInput;
    this.initForm();
    this.loadDepartments();
    this.loadEmployees();
    
    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        STT: this.dataInput.STT,
        DepartmentID: this.dataInput.DepartmentID,
        Code: this.dataInput.Code,
        Name: this.dataInput.Name,
        LeaderID: this.dataInput.LeaderID || null,
        ParentID: this.dataInput.ParentID != null ? this.dataInput.ParentID.toString() : '0',
        IsDeleted: this.dataInput.IsDeleted || 0
      });
    }

    this.form.get('DepartmentID')?.valueChanges.subscribe(deptId => {
      this.buildParentTeamTree(deptId);
      this.form.get('ParentID')?.setValue('0');
    });

    this.loadParentTeams();
  }

  initForm() {
    this.form = this.fb.group({
      ID: [0],
      STT: [this.nextSTT],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      LeaderID: [null, [Validators.required]],
      ParentID: ['0', [Validators.required]],
      IsDeleted: [0]
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data.map((department: any) => ({
          value: Number(department.ID),
          label: `${department.Name}`
        }));
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data.map((emp: any) => ({
          value: Number(emp.ID),
          label: `${emp.Code} - ${emp.FullName}`
        }));
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    });
  }

  loadParentTeams() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (data: any) => {
        let parentTeams = data.data || [];
        if (this.isEdit) {
          parentTeams = parentTeams.filter((t: any) => t.ID !== this.dataInput.ID);
        }
        this.allEmployeeTeams = parentTeams;
        this.buildParentTeamTree(this.form.get('DepartmentID')?.value);
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.message);
      }
    });
  }

  buildParentTeamTree(departmentID: number) {
    if (!departmentID || !this.allEmployeeTeams) {
      this.parentTeamTree = [{ title: '- Không có -', key: '0', value: '0', isLeaf: true }];
      return;
    }

    const deptTeams = this.allEmployeeTeams.filter(t => t.DepartmentID === departmentID);
    
    const treeMap = new Map<number, any>();
    deptTeams.forEach(team => {
      treeMap.set(team.ID, {
        title: `${team.Code} - ${team.Name}`,
        key: `${team.ID}`,
        value: `${team.ID}`,
        isLeaf: true,
        children: [],
        expanded: true
      });
    });

    const rootNodes: any[] = [];

    deptTeams.forEach(team => {
      const node = treeMap.get(team.ID)!;
      if (team.ParentID && treeMap.has(team.ParentID)) {
        const parent = treeMap.get(team.ParentID)!;
        parent.children.push(node);
        parent.isLeaf = false;
      } else {
        rootNodes.push(node);
      }
    });

    this.parentTeamTree = [
      { title: '- Không có -', key: '0', value: '0', isLeaf: true },
      ...rootNodes
    ];
  }

  onSubmit() {
    if (this.form.valid) {
      const payload = {
        ...this.form.value,
        ParentID: Number(this.form.value.ParentID)
      };
      this.employeeService.saveEmployeeTeam(payload).subscribe({
        next: (response: any) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật team phòng ban thành công');
          this.activeModal.close('save');
        },
        error: (error: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật team phòng ban thất bại: ' + error.message);
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  onCancel() {
    this.activeModal.dismiss('cancel');
  }
}

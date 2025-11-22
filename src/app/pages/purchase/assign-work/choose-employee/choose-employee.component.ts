import { AfterViewInit, Component, ElementRef, Input, input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignWorkService } from '../assign-work.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProjectService } from '../../../project/project-service/project.service';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { DepartmentServiceService } from '../../../hrm/department/department-service/department-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-choose-employee',
  imports: [
    CommonModule,
    NzButtonModule,
    NzFormModule,
    NzSelectModule,
    FormsModule
  ],
  templateUrl: './choose-employee.component.html',
  styleUrl: './choose-employee.component.css'
})
export class ChooseEmployeeComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private assignWorkService: AssignWorkService,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private departmentService: DepartmentServiceService
  ) { }

  @Input() projectTypeId: any;
  @ViewChild('tb_employee', { static: false })
  tb_employeeContainer!: ElementRef;
  tb_employee: any;
  employees: any[] = [];
  departments: any[] = [];
  departmentId: any = 0;
  keyword: any = "";

  ngOnInit(): void {
    this.getDepartments();
  }

  ngAfterViewInit(): void {
    this.drawTbEmployee(this.tb_employeeContainer.nativeElement);
    this.getEmployee();
  }

  onSubmit() {
    const selectRows = this.tb_employee.getSelectedRows();

    if (!selectRows || selectRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất một nhân viên cần thêm'
      );
      return;
    }

    const selectedIds = selectRows.map((x: any) => x.getData().ID);

    this.assignWorkService.addEmployees(selectedIds, this.projectTypeId).subscribe({
      next: (response: any) => {
        this.activeModal.dismiss();
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error.message
        );
      },
    });

  }

  getEmployee() {
    this.assignWorkService.getEmployee(this.departmentId ?? 0).subscribe({
      next: (response: any) => {
        debugger
        this.employees = response.data
        this.tb_employee.setData(response.data);
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách phòng ban: ' + error.error.message
        );
      },
    });
  }

  getDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data.data;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách phòng ban: ' + error.error.message
        );
      },
    });
  }

  drawTbEmployee(container: HTMLElement) {
    this.tb_employee = new Tabulator(container, {
      height: '64vh',
      layout: 'fitDataStretch',
      selectableRows: true,
      locale: 'vi',
      groupBy: (data) => `Phòng ban: ${data.DepartmentName ?? ""}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      columns: [
        {
          title: '',
          field: '',
          headerHozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 50,
          cellClick: function (e, cell) {
            e.stopPropagation();
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width: 100,
          headerSort: false
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          width: 250,
          headerSort: false
        },
        {
          title: 'Chức vụ',
          field: 'ChucVuHD',
          width: 100,
          headerSort: false
        },
      ],
    });
  }

  onSearchEmployee(event: any) {
    const keyword = event.target.value.toLowerCase();
    if (keyword != "") {
      this.tb_employee.setFilter([
        [
          { field: 'Code', type: 'like', value: keyword },
          { field: 'FullName', type: 'like', value: keyword },
          { field: 'ChucVuHD', type: 'like', value: keyword },
        ]
      ], 'or'); // 'or' để tìm ở bất kỳ cột nào
    } else {
      this.drawTbEmployee(this.tb_employeeContainer.nativeElement);
      this.getEmployee();
    }
  }


}

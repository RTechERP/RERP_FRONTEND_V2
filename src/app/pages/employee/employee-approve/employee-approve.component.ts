import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
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
import { EmployeeService } from '../employee-service/employee.service';
import { EmployeeApproveModalComponent } from '../employee-approve-modal/employee-approve-modal.component';

@Component({
  selector: 'app-employee-approve',
  templateUrl: './employee-approve.component.html',
  styleUrls: ['./employee-approve.component.css'],
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
    EmployeeApproveModalComponent
  ],
  standalone: true
})
export class EmployeeApproveComponent implements OnInit, AfterViewInit {
  private employeeApproveTabulator!: Tabulator;

  employeeApproveList: any[] = [];
  employeeList: any[] = [];

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.loadEmployeeApprove();
    this.initializeEmployeeApproveTable();
  }

  ngAfterViewInit() {
    setTimeout(() => {
    });
  }

  loadEmployeeApprove() {
    this.employeeService.getEmployeeApprove(1, 0).subscribe({
      next: (data: any) => {
        this.employeeApproveList = data.data;
        this.employeeApproveTabulator.setData(this.employeeApproveList);
      }, 
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách người duyệt: ' + error.message);
      }
    });
  }

  initializeEmployeeApproveTable() {
    this.employeeApproveTabulator = new Tabulator("#tb-employee-approve", {
      data: this.employeeApproveList,
      layout: "fitColumns",
      responsiveLayout: true,
      groupBy: "DepartmentName",
      groupHeader: function(value, count, data, group){
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " thành viên)</span>";
      },
      height: '80vh',
      rowHeader: {
        formatter: "rowSelection", 
        titleFormatter: "rowSelection", 
        headerSort: false, 
        width: 70, 
        frozen: true, 
        headerHozAlign: "center", 
        hozAlign: "center"
      },
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        }
      ]
    });
  }

  openAddModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeApproveModal'));
    modal.show();
  }

  deleteEmployeeApprove() {
    const selectedRows = this.employeeApproveTabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn người duyệt cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa những người duyệt đã chọn?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const deletePromises = selectedRows.map(row => {
          const id = row.getData()['ID'];
          return this.employeeService.deleteEmployeeApprove(id).toPromise();
        });

        Promise.all(deletePromises)
          .then(() => {
            this.notification.success('Thành công', 'Xóa người duyệt thành công');
            this.loadEmployeeApprove();
          })
          .catch(error => {
            this.notification.error('Lỗi', 'Xóa người duyệt thất bại: ' + error.message);
          });
      },
      nzCancelText: 'Hủy'
    });
  }

  onEmployeeAdded() {
    this.loadEmployeeApprove();
  }
}

import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
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
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-employee-approve-modal',
  templateUrl: './employee-approve-modal.component.html',
  styleUrls: ['./employee-approve-modal.component.css'],
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
    FormsModule
  ],
  standalone: true
})
export class EmployeeApproveModalComponent implements OnInit {
  @Output() employeeAdded = new EventEmitter<void>();
  private employeeTabulator!: Tabulator;
  employeeList: any[] = [];
  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.loadEmployee();
    this.initializeEmployeeTable();
  }

  loadEmployee() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data;
        this.employeeTabulator.setData(this.employeeList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    });
  }

  initializeEmployeeTable() {
    this.employeeTabulator = new Tabulator("#tb-employee", {
      data: this.employeeList,
      layout: "fitColumns",
      responsiveLayout: true,
      height: '65vh',
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

  onSearchEmployee(event: any) {
    const keyword = event.target.value.toLowerCase().trim();

    if (keyword) {
      this.employeeTabulator.setFilter([
        [
          { field: 'Code', type: 'like', value: keyword },
          { field: 'FullName', type: 'like', value: keyword },
        ]
      ]);
    } else {
      this.loadEmployee();
      this.initializeEmployeeTable();
    }
  }


  addEmployeeApprove() {
    const selectedRows = this.employeeTabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.initializeEmployeeTable();
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn người duyệt cần thêm');
      return;
    }

    const employeeIds = selectedRows.map(row => parseInt(row.getData()['ID']));
    const request: { ListEmployeeID: number[] } = {
      ListEmployeeID: employeeIds
    };

    this.employeeService.addEmployeeApprove(request).subscribe({
      next: (response: any) => {
        this.closeEmployeeModal();
        this.employeeAdded.emit();

        // Hiển thị message từ response của backend
        const message = response?.message || 'Thêm người duyệt thành công';
        this.notification.success(NOTIFICATION_TITLE.success, message);
      },
      error: (error) => {
        // Xử lý error response từ backend
        let errorMessage = 'Thêm người duyệt thất bại';

        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  closeEmployeeModal() {
    const modal = document.getElementById('employeeApproveModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }


  deleteEmployeeApprove() {
    const selectedRows = this.employeeTabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning("Cảnh báo", "Vui lòng chọn người duyệt muốn xóa");
      return;
    }
    const employeeIds = selectedRows.map(row => row.getData()['ID']);
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa người duyệt này không?',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        employeeIds.forEach(id => {
          this.employeeService.deleteEmployeeApprove(id).subscribe({
            next: () => {
              // this.closeEmployeeModal();
              this.employeeAdded.emit();
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa người duyệt thành công');
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa người duyệt thất bại: ' + error.message);
            }
          });
        });
      },
      nzCancelText: 'Hủy'
    })
  }
}

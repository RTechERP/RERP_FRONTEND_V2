import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChange,
  AfterViewInit,
  ViewChild,
  ViewEncapsulation,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { Router } from '@angular/router';
import { ProjectService } from '../project-service/project.service';
import { ActivatedRoute } from '@angular/router';
import { ProjectChangeComponent } from '../project-change/project-change.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ElementRef } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ViewContainerRef } from '@angular/core';
import { SelectProjectEmployeeGroupComponent } from '../project-control/select-project-employee-group';
import { SelectLeaderComponent } from '../project-control/select-leader.component';
import { SelectProjectTypeComponent } from '../project-control/select-project-type.component';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { filter } from 'rxjs';
@Component({
  selector: 'app-project-employee',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzSplitterModule,
    NzModalModule,
    NzButtonModule,
    NzGridModule,
    NzSelectModule,
    NzIconModule,
    NzLayoutModule,
    NzFormModule,
    NzPopconfirmModule,
  ],
  templateUrl: './project-employee.component.html',
  styleUrl: './project-employee.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectEmployeeComponent implements OnInit, AfterViewInit {
  // Chưa gán hàm loadPermission

  //#endregion Khai báo các biến
  @ViewChild('tb_employeeMain', { static: false })
  tb_employeeMainContainer!: ElementRef;
  @ViewChild('tb_employeeSuggest', { static: false })
  tb_employeeSuggestContainer!: ElementRef;

  dataChange: any = false;
  projectIdNew: any;
  projectIdOld: any;
  projects: any[] = [];
  projectId: any = 0;
  employees: any[] = [];
  projectTypes: any[] = [];
  listIds: any[] = [];

  dictEmployee: { [key: number]: string } = {};
  dictProjectType: { [key: number]: string } = {};
  statuses = [
    { statusText: 'Tất cả', ID: -1 },
    { statusText: 'Chưa xóa', ID: 0 },
    { statusText: 'Đã xóa', ID: 1 },
  ];
  statusId = 0;

  tb_employeeMain: any;
  tb_employeeSuggest: any;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private viewContainerRef: ViewContainerRef
  ) {}
  //#endregion

  //#region hàm chạy khi mở chường trình
  ngOnInit(): void {
    this.getProjectType();
  }

  ngAfterViewInit(): void {
    this.drawtbEmployeeSuggest(this.tb_employeeSuggestContainer.nativeElement);
    this.drawTbEmployeeMain(this.tb_employeeMainContainer.nativeElement);
    this.getProject();
    this.getProjectEmployee();
    // this.getEmployeeMain();
    // this.getEmployeeSuggest();
  }
  //#endregion

  //#region Hàm load dữ liệu
  getProject() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getEmployeeMain() {
    this.projectService
      .getEmployeeMain(this.projectId, this.statusId)
      .subscribe({
        next: (response: any) => {
          this.tb_employeeMain.setData(response.data);
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
  }

  getEmployeeSuggest() {
    this.projectService.getEmployeeSuggest(this.projectId).subscribe({
      next: (response: any) => {
        this.tb_employeeSuggest.setData(response.data);
        console.log(response.data);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectEmployee() {
    this.projectService.getProjectEmployee(-1).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );

        response.data.forEach((item: any) => {
          // Nếu chưa có key, thêm vào labels
          if (!this.dictEmployee[item.ID]) {
            this.dictEmployee[item.ID] = item.FullName;
          }
        });

        this.search();
        console.log('emmm1', this.employees);
        console.log('emmm2', this.dictEmployee);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  getProjectType() {
    this.projectService.getProjectType().subscribe({
      next: (response: any) => {
        this.projectTypes = this.projectService.createdDataTree(
          response.data,
          'ParentID',
          'ID',
          'ProjectTypeName'
        );
        console.log(this.projectTypes);
        response.data.forEach((item: any) => {
          if (!this.dictProjectType[item.ID]) {
            this.dictProjectType[item.ID] = item.ProjectTypeName;
          }
        });
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }
  //#endregion

  //#region Tìm kiếm
  search() {
    if (this.dataChange) {
      this.projectIdNew = this.projectId;
      this.projectId = this.projectIdOld;
      this.modal.confirm({
        nzTitle: `Thông báo`,
        nzContent: `Bạn có muốn lưu các thay đổi không?`,
        nzOkText: 'Lưu',
        nzOkType: 'primary',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.saveProjectUser();
        },
      });
    } else {
      this.getEmployeeMain();
      this.getEmployeeSuggest();
      this.listIds = [];
      this.dataChange = false;
      this.projectIdOld = this.projectId;
    }
  }
  //#endregion

  //#region Xử lý bảng nhân viên gợi ý
  drawtbEmployeeSuggest(container: HTMLElement) {
    this.tb_employeeSuggest = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      groupBy: 'ProjectTypeID',
      groupHeader: (value, count, data, group) => {
        return value > 0 ? `Kiểu dự án: ${this.dictProjectType[value]}` : '';
      },

      columns: [
        {
          title: 'Gợi ý người tham gia',
          columns: [
            {
              title: 'Chọn',
              titleFormatter: () => `<input type="checkbox" />`,
              field: 'Selected',
              formatter: function (cell, formatterParams, onRendered) {
                const checked = cell.getValue() ? 'checked' : '';
                return `<input type='checkbox' ${checked} />`;
              },
              headerClick: (e, column) => {
                // Toggle trạng thái (nếu cần)
                const isChecked = (e.target as HTMLInputElement).checked;

                // Cập nhật toàn bộ giá trị cột 'Selected'
                column
                  .getTable()
                  .getRows()
                  .forEach((row) => {
                    row.update({ Selected: isChecked });
                  });
              },
              cellClick: (e, cell) => {
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
              headerSort: false,
              width: '5px',
            },
            {
              title: 'STT',
              headerHozAlign: 'center',
              formatter: function (cell) {
                const index = cell.getRow().getPosition() as number;
                return index.toString();
              },
              hozAlign: 'center',
              width: '18px',
            },
            {
              title: 'Họ Tên',
              field: 'EmployeeID',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const val = cell.getValue();
                console.log(val);
                return val > 0
                  ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictEmployee[val]}</p> <div>`
                  : '';
              },
              width: '48px',
            },
            {
              title: 'Leader',
              field: 'IsLeader',
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                const checked = cell.getValue()
                  ? `<input class="form-check-input" type='checkbox' checked disabled/>`
                  : `<input class="form-check-input" style="border: 1px solid;" type='checkbox' disabled/>`;
                return checked;
              },
              cellClick: (e, cell) => {
                return;
              },
              hozAlign: 'center',

              // editor: this.createdControl(() => this.employees),
            },
          ],
        },
      ],
    });
  }
  //#endregion

  //#region Xử lý bảng nhân viên tham gia chính
  drawTbEmployeeMain(container: HTMLElement) {
    this.tb_employeeMain = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      rowFormatter: function (row) {
        if (row.getGroup()) return;
        let data = row.getData();
        let isDeleted = data['IsDeleted'];

        if (isDeleted) {
          row.getElement().style.backgroundColor = 'red';
          row.getElement().style.color = 'white';
        }
      },
      columns: [
        {
          title: 'Người tham gia chính',
          columns: [
            {
              title: '',
              headerHozAlign: 'center',
              headerSort: false,
              titleFormatter: (row) => {
                return `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem; "><i class="fas fa-trash"></i></button>`;
              },
              formatter: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted
                  ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                  : '';
              },
              cellClick: (e, cell) => {
                let data = cell.getRow().getData();
                let id = data['ID'];
                let emId = data['EmployeeID'];
                let isDeleted = data['IsDeleted'];
                if (isDeleted) {
                  return;
                }
                this.modal.confirm({
                  nzTitle: `Bạn có chắc chắn muốn xóa nhân viên`,
                  nzContent: `${this.dictEmployee[emId]}?`,
                  nzOkText: 'Xóa',
                  nzOkType: 'primary',
                  nzCancelText: 'Hủy',
                  nzOkDanger: true,
                  nzOnOk: () => {
                    if (id > 0) {
                      if (!this.listIds.includes(id)) this.listIds.push(id);
                      this.tb_employeeMain.deleteRow(cell.getRow());
                    } else {
                      this.tb_employeeMain.deleteRow(cell.getRow());
                    }
                  },
                });

                this.updateSTTColumn();
              },
              width: '5px',
              hozAlign: 'center',
            },
            {
              title: 'STT',
              field: 'Rownumber',
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                return value;
              },
              headerSort: false,
              titleFormatter: function () {
                return `<button id="btn-header-click" class="btn text-success p-0 border-0" style="font-size: 0.75rem; "><i class="fas fa-plus"></button>`;
              },
              headerClick: (e, column) => {
                this.addRowTbEmployeeMain();
              },
              width: '5px',
              hozAlign: 'center',
            },
            {
              title: 'Họ Tên',
              field: 'EmployeeID',
              headerHozAlign: 'center',
              editor: this.createdControl(
                SelectProjectEmployeeGroupComponent,
                this.injector,
                this.appRef,
                () => this.employees
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                console.log(this.dictEmployee);
                return val
                  ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictEmployee[val]}</p> <i class="fas fa-angle-down"></i> <div>`
                  : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn nhân viên</p> <i class="fas fa-angle-down"></i> <div>';
              },
              editable: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted ? true : false;
              },
              width: '20px',
            },
            {
              title: 'Kiểu dự án',
              field: 'ProjectTypeID',
              headerHozAlign: 'center',
              editor: this.createdControl(
                SelectProjectTypeComponent,
                this.injector,
                this.appRef,
                () => this.projectTypes
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                return val
                  ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictProjectType[val]}</p> <i class="fas fa-angle-down"></i> <div>`
                  : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn kiểu</p> <i class="fas fa-angle-down"></i> <div>';
              },
              editable: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted ? true : false;
              },
              width: '14px',
            },
            {
              title: 'Bàn giao',
              field: 'ReceiverID',
              headerHozAlign: 'center',
              editor: this.createdControl(
                SelectProjectEmployeeGroupComponent,
                this.injector,
                this.appRef,
                () => this.employees
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                console.log(this.dictEmployee);
                return val
                  ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictEmployee[val]}</p> <i class="fas fa-angle-down"></i> <div>`
                  : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn nhân viên</p> <i class="fas fa-angle-down"></i> <div>';
              },
              editable: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted ? true : false;
              },
              width: '20px',
            },
            {
              title: 'Leader',
              field: 'IsLeader',
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                let checked = cell.getValue() ? 'checked' : '';
                let style = isDeleted
                  ? ' class="form-check-input" disabled'
                  : '';
                return `<input type='checkbox' ${style} ${checked} />`;
              },
              cellClick: (e, cell) => {
                let data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                if (isDeleted) return;

                const newValue = !cell.getValue();
                cell.setValue(newValue);
              },
              hozAlign: 'center',
              width: '10px',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                return value;
              },
              editable: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted ? true : false;
              },
              editor: 'textarea',
            },
          ],
        },
      ],
    });
    this.tb_employeeMain.on('dataChanged', (data: any) => {
      this.dataChange = true;
    });
  }

  addRowTbEmployeeMain() {
    let data = this.tb_employeeMain.getData();
    let stt = data.length + 1;
    console.log('Chỉ số lớn nhất:', stt);
    this.tb_employeeMain.addRow({ Rownumber: stt });
  }

  updateSTTColumn() {
    const rows = this.tb_employeeMain.getRows();
    rows.forEach((row: any, index: any) => {
      row.update({ Rownumber: index + 1 });
    });
  }
  //#endregion

  //#region Hàm tạo select

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[]
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

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
  //#endregion

  //#region Chuyển nhân viên
  changeEmployee() {
    let selectedRowSuggest = this.tb_employeeSuggest
      .getData()
      .filter((row: any) => row['Selected'] == true);
    let dataMain = this.tb_employeeMain
      .getData()
      .filter((row: any) => row['IsDeleted'] != true);

    let empolyeeSuggestIds = selectedRowSuggest.map(
      (row: any) => row.EmployeeID
    );
    let employeeMainIds = dataMain.map((row: any) => row.EmployeeID);
    console.log(employeeMainIds);
    if (empolyeeSuggestIds.length <= 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn nhân viên gợi ý!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    for (let item of selectedRowSuggest) {
      let employeeId = item.EmployeeID;

      if (!employeeMainIds.includes(employeeId)) {
        item.IsDeleted = false;
        this.tb_employeeMain.addRow(item);
      }
    }

    this.updateSTTColumn();
  }
  //#endregion

  //#region Lưu thông tin người tham gia
  saveProjectUser() {
    let dataEmployeeMain = this.tb_employeeMain
      .getData()
      .filter((row: any) => row['IsDeleted'] != true);

    let employeeMainIds = dataEmployeeMain.map((row: any) => row.EmployeeID);
    if (dataEmployeeMain.length > 0) {
      for (let item of dataEmployeeMain) {
        let employeeId = item.EmployeeID;
        let projectTypeId = item.ProjectTypeID;
        let stt = item.Rownumber;

        let count = employeeMainIds.filter(
          (id: any) => id === employeeId
        ).length;

        if (count > 1) {
          this.notification.error(
            'Thông báo',
            `Nhân viên dòng ${stt} đã tồn tại vui lòng kiểm tra lại!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        }

        if (!employeeId || employeeId <= 0) {
          this.notification.error(
            'Thông báo',
            `Vui lòng chọn nhân viên dòng ${stt}!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        }

        if (!projectTypeId || projectTypeId <= 0) {
          this.notification.error(
            'Thông báo',
            `Vui lòng chọn kiểu dự án dòng ${stt}!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        }
      }
    }

    let dataSave = {
      ProjectID: this.projectId,
      deletedIds: this.listIds,
      prjEms: dataEmployeeMain,
    };

    this.projectService.saveProjectEmployee(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.dataChange = false;
          this.notification.success('', 'Đã cập nhật người tham gia dự án!', {
            nzStyle: { fontSize: '0.75rem' },
          });
          this.projectId = this.projectIdNew;
          this.search();
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion
}

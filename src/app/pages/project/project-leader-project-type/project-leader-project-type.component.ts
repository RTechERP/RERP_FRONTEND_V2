import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  IterableDiffers,
  TemplateRef,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project-service/project.service';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ProjectLeaderProjectTypeDetailComponent } from './project-leader-project-type-detail/project-leader-project-type-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-project-leader-project-type',
  templateUrl: './project-leader-project-type.component.html',
  styleUrls: ['./project-leader-project-type.component.css'],
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    HasPermissionDirective,
  ],
})
export class ProjectLeaderProjectTypeComponent implements OnInit {
  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}
  @ViewChild('tb_projectTypeLink', { static: false })
  tb_projectTypeLinkContainer!: ElementRef;
  @ViewChild('tb_projectLeaderProjectTypeLink', { static: false })
  tb_projectLeaderProjectTypeLinkContainer!: ElementRef;
  @ViewChild('tb_projectEmployeeLink', { static: false })
  tb_projectEmployeeLinkContainer!: ElementRef;

  @ViewChild('modalTemplate', { static: true })
  modalTemplate!: TemplateRef<any>;

  tb_projectTypeLinks: any;
  tb_projectLeaderProjectTypeLinks: any;
  tb_projectEmployeeLinks: any;

  projectTypeId: any = 0;
  selectedLeaderProjectType: Set<number> = new Set();
  selectedEmployee: Set<number> = new Set();
  departments: any[] = [];
  selectedDepartment: number = 0;
  searchKeyword: string = '';

  ngAfterViewInit(): void {
    this.drawTbProjectTypeLinks(this.tb_projectTypeLinkContainer.nativeElement);
    this.drawTbProjectLeaderProjectTypeLinks(
      this.tb_projectLeaderProjectTypeLinkContainer.nativeElement
    );
    this.getProjectTypeLinks();
    this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
    this.getDepartment();
  }

  drawTbProjectLeaderProjectTypeLinks(container: HTMLElement) {
    this.tb_projectLeaderProjectTypeLinks = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      locale: 'vi',
      rowHeader: false,
      pagination: false,
      selectableRows: true, //make rows selectable
      groupBy: (data) => `Kiểu dự án: ${data.ProjectTypeName}`,
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
        },
        {
          title: 'Mã leader',
          field: 'Code',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Leader dự án',
          field: 'FullName',
          headerHozAlign: 'left',
        },
      ],
    });
  }
  drawTbProjectEmployeeLinks(container: HTMLElement) {
    this.tb_projectEmployeeLinks = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      locale: 'vi',
      pagination: true,
      paginationMode: 'local',
      rowContextMenu: [
        {
          label: 'Chọn tất cả',
          action: (e, row) => {
            this.tb_projectEmployeeLinks.selectRow();
          },
        },
        {
          label: 'Bỏ chọn tất cả',
          action: (e, row) => {
            this.tb_projectEmployeeLinks.deselectRow();
          },
        },
      ],

      selectableRows: true, //make rows selectable
      groupBy: function (data) {
        return `Phòng ban: ${data.DepartmentName}`;
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
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          headerHozAlign: 'center',
        },
      ],
    });
  }

  refresh() {
    // Làm mới bảng leader
    this.projectService.getEmployeeProjectType(0).subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.tb_projectLeaderProjectTypeLinks.replaceData(data).then(() => {
          this.tb_projectLeaderProjectTypeLinks.deselectRow();
        });
      },
      error: (error) => console.error('Lỗi:', error),
    });

    // Làm mới bảng kiểu dự án (Tree)
    this.projectService.getProjectTypes().subscribe({
      next: (response: any) => {
        const data = this.projectService.setDataTree(response.data, 'ID');

        // === Hàm đệ quy bỏ chọn tất cả node trong tree ===
        const deselectAllTreeRows = (rows: any[]) => {
          rows.forEach((row: any) => {
            row.deselect();
            const children = row.getTreeChildren();
            if (children?.length) deselectAllTreeRows(children);
          });
        };

        // === Cập nhật lại dữ liệu ===
        this.tb_projectTypeLinks.replaceData(data).then(() => {
          // Chờ Tabulator render xong để bỏ chọn
          setTimeout(() => {
            const rootRows = this.tb_projectTypeLinks.getRows();
            deselectAllTreeRows(rootRows);
            this.projectTypeId = 0;
            this.tb_projectTypeLinks.redraw(true);
          }, 100);
        });
      },
      error: (error) => console.error('Lỗi:', error),
    });
  }

  getProjectLeaderProjectTypeLinks(projectTypeId: number) {
    this.projectService.getEmployeeProjectType(projectTypeId).subscribe({
      next: (response: any) => {
        let data = response.data;
        this.tb_projectLeaderProjectTypeLinks.replaceData(data);
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });

    // Khi click vào row thì toggle chọn/bỏ chọn
    this.tb_projectLeaderProjectTypeLinks.on('rowClick', (e: any, row: any) => {
      row.toggleSelect();
    });

    // Đồng bộ Set bằng các sự kiện chọn / bỏ chọn riêng biệt
    this.tb_projectLeaderProjectTypeLinks.on('rowSelected', (row: any) => {
      const id = row.getData().ID;
      this.selectedLeaderProjectType.add(id);
    });

    this.tb_projectLeaderProjectTypeLinks.on('rowDeselected', (row: any) => {
      const id = row.getData().ID;
      this.selectedLeaderProjectType.delete(id);
    });
  }
  getProjectTypeLinks() {
    this.projectService.getProjectTypes().subscribe({
      next: (response: any) => {
        let data = this.projectService.setDataTree(response.data, 'ID');
        this.tb_projectTypeLinks.setData(data);
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  drawTbProjectTypeLinks(container: HTMLElement) {
    if (!this.tb_projectTypeLinks) {
      // Khởi tạo bảng chỉ 1 lần
      this.tb_projectTypeLinks = new Tabulator(container, {
        dataTree: true,
        dataTreeStartExpanded: true,
        layout: 'fitDataStretch',
        locale: 'vi',
        selectableRows: 1,
        reactiveData: false, // Giúp kiểm soát thay đổi dữ liệu rõ ràng hơn

        columns: [
          {
            title: 'Chọn',
            field: 'Selected',
            headerHozAlign: 'center',
            hozAlign: 'center',
            width: 70,
          },
          {
            title: 'Kiểu dự án',
            field: 'ProjectTypeName',
            headerHozAlign: 'left',
          },
        ],
      });

      // Gắn event click chọn kiểu dự án
      this.tb_projectTypeLinks.on('rowClick', (e: any, row: any) => {
        // Bỏ chọn các dòng khác trước
        this.tb_projectTypeLinks.deselectRow();
        // Chọn dòng hiện tại
        row.select();
        const rowData = row.getData();
        this.projectTypeId = rowData.ID;
        this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
      });
    }
  }

  getSelectedProjectType() {
    const selectedRows = this.tb_projectTypeLinks.getSelectedData();
    if (selectedRows.length > 0) {
      return selectedRows[0].ID;
    }
    return null;
  }
  onDeleteLeader() {
    // Lấy danh sách các dòng được chọn trong bảng Tabulator
    const selectedRows =
      this.tb_projectLeaderProjectTypeLinks.getSelectedData();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn leader để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedRows.length} leader đã chọn?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Chuẩn bị payload gửi sang API
        const payload = selectedRows.map((row: any) => ({
          ID: row.ID,
          IsDeleted: true,
        }));

        // Gọi API 1 lần, truyền list object
        this.projectService.saveemployeeprojecttype(payload).subscribe({
          next: (res) => {
            this.notification.success(
              'Thành công',
              `Đã xóa ${selectedRows.length} leader thành công!`
            );
            this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
          },
          error: (error) => {
            console.error('Lỗi khi xóa leader:', error);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Không thể xóa leader, vui lòng thử lại!'
            );
          },
        });
      },
    });
  }

  openModalAddLeaders() {
    if (this.projectTypeId === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn kiểu dự án để thêm leader!'
      );
      return;
    }
    this.selectedDepartment = 0;
    this.searchKeyword = '';

    const modalRef = this.modalService.open(
      ProjectLeaderProjectTypeDetailComponent,
      {
        size: 'xl',
      }
    );
    modalRef.componentInstance.projectTypeId = this.projectTypeId;
    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
        } else {
          this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
        }
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
        // Xử lý khi modal bị dismiss (click ra ngoài, ESC, hoặc gọi dismiss(...))
      }
    );
  }

  onDepartmentChange() {
    this.getProjectEmployeefilter();
    // Xử lý tiếp theo
  }
  onSearchKeywordChange() {
    this.getProjectEmployeefilter();
  }
  // Lấy danh sách nhân viên theo departmentID
  getProjectEmployeefilter() {
    this.projectService
      .getProjectEmployeefilter(this.selectedDepartment)
      .subscribe({
        next: (response: any) => {
          let data = response.data;
          if (this.searchKeyword) {
            data = data.filter(
              (item: any) =>
                item.FullName.toLowerCase().includes(
                  this.searchKeyword.toLowerCase()
                ) ||
                item.Code.toLowerCase().includes(
                  this.searchKeyword.toLowerCase()
                )
            );
          }
          this.tb_projectEmployeeLinks.setData(data);
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    // Khi click vào row thì toggle chọn/bỏ chọn
    this.tb_projectEmployeeLinks.on('rowClick', (e: any, row: any) => {
      row.toggleSelect();
    });

    // Đồng bộ Set bằng các sự kiện chọn / bỏ chọn riêng biệt
    this.tb_projectEmployeeLinks.on('rowSelected', (row: any) => {
      const id = row.getData().ID;
      this.selectedEmployee.add(id);
    });

    this.tb_projectEmployeeLinks.on('rowDeselected', (row: any) => {
      const id = row.getData().ID;
      this.selectedEmployee.delete(id);
    });
  }
  // Lấy danh sách phòng ban
  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        let data = response.data;
        this.departments = data.map((item: any) => ({
          title: item.Name,
          value: item.ID,
        }));
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  onAddLeaders() {
    const selected = this.selectedEmployee.size;
    if (!selected || selected === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn nhân viên để thêm!'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận thêm',
      nzContent: `Bạn có chắc chắn muốn thêm ${selected} nhân viên đã chọn vào kiểu dự án này?`,
      nzOkText: 'Thêm',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        // Lấy danh sách nhân viên đã tồn tại
        this.projectService
          .getEmployeeProjectType(this.projectTypeId)
          .subscribe({
            next: (response: any) => {
              const existingEmployeeIDs = response.data.map(
                (item: any) => item.EmployeeID
              );
              const newEmployeeIDs: number[] = [];
              const duplicateEmployeeIDs: number[] = [];

              this.selectedEmployee.forEach((id) => {
                if (existingEmployeeIDs.includes(id)) {
                  duplicateEmployeeIDs.push(id);
                } else {
                  newEmployeeIDs.push(id);
                }
              });

              // Thông báo nhân viên đã tồn tại
              if (duplicateEmployeeIDs.length > 0) {
                this.notification.warning(
                  'Thông báo',
                  `Các nhân viên sau đã tồn tại: ${duplicateEmployeeIDs.join(
                    ', '
                  )}`
                );
              }

              if (newEmployeeIDs.length === 0) {
                return;
              }

              // Gọi API để thêm từng nhân viên mới
              const addRequests = newEmployeeIDs.map((id) => {
                const data = {
                  ProjectTypeID: this.projectTypeId,
                  EmployeeID: id,
                };
                return this.projectService
                  .saveemployeeprojecttype(data)
                  .toPromise()
                  .then(() => ({
                    id,
                    success: true,
                  }))
                  .catch((error) => {
                    console.error(`Lỗi khi thêm nhân viên ${id}:`, error);
                    return {
                      id,
                      success: false,
                    };
                  });
              });

              Promise.all(addRequests).then((results) => {
                const successCount = results.filter((r) => r.success).length;
                const failed = results
                  .filter((r) => !r.success)
                  .map((r) => r.id);

                if (successCount > 0) {
                  this.notification.success(
                    'Thành công',
                    `Đã thêm ${successCount} nhân viên thành công!`
                  );
                  this.getProjectLeaderProjectTypeLinks(this.projectTypeId);
                }

                if (failed.length > 0) {
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    `Không thể thêm các nhân viên: ${failed.join(', ')}`
                  );
                }

                this.selectedEmployee.clear();
                this.modal.closeAll();
              });
            },
            error: (error) => {
              console.error('Lỗi khi kiểm tra nhân viên:', error);
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Không thể kiểm tra nhân viên, vui lòng thử lại sau!'
              );
            },
          });
      },
    });
  }

  ngOnInit() {}
}

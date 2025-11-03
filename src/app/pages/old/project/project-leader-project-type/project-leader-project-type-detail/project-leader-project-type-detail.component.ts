import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, Input } from '@angular/core';
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../../project-service/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-project-leader-project-type-detail',
  templateUrl: './project-leader-project-type-detail.component.html',
  styleUrls: ['./project-leader-project-type-detail.component.css'],
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
  ],
})
export class ProjectLeaderProjectTypeDetailComponent implements OnInit {
  @Input() projectTypeId: number = 0;

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal
    

  ) { }
  
  @ViewChild('tb_projectEmployeeLink', { static: false })
  tb_projectEmployeeLinkContainer!: ElementRef;
  tb_projectEmployeeLinks: any;
  selectedEmployee: Set<number> = new Set();
  departments: any[] = [];
  selectedDepartment: number = 0;
  searchKeyword: string = '';

  ngOnInit() {
    this.getDepartment();
    this.getProjectEmployeefilter();
  }

  ngAfterViewInit() {
    // Ensure the table is drawn after the view is initialized
    this.drawTbProjectEmployeeLinks(this.tb_projectEmployeeLinkContainer.nativeElement);
    this.getProjectEmployeefilter();
  }
  drawTbProjectEmployeeLinks(container: HTMLElement) {
    this.tb_projectEmployeeLinks = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination:false,
      layout: 'fitColumns',
      locale: 'vi',
      index: 'ID',
      rowHeader:false,
      rowContextMenu: [
        {
          label: 'Chọn tất cả',
          action: (e, row) => {
            this.tb_projectEmployeeLinks.selectRow();
          }
        },
        {
          label: "Bỏ chọn tất cả",
          action: (e, row) => {
            this.tb_projectEmployeeLinks.deselectRow();
          }
        }
      ],

      selectableRows: true,
      groupBy: (data) => `Phòng ban: ${data.DepartmentName??"Chưa xác định"}`,
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
          width:80,
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          headerHozAlign: 'center',
          width: 120,
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          headerHozAlign: 'center',

        },
      ],

    });
    // Toggle chọn/bỏ chọn bằng click, Set sẽ được đồng bộ qua sự kiện rowSelected/rowDeselected
    this.tb_projectEmployeeLinks.on("rowClick", (e: any, row: any) => {
      if (row.isSelected && row.isSelected()) {
        row.deselect && row.deselect();
      } else {
        row.select && row.select();
      }
    });

    // Đồng bộ Set bằng các sự kiện chọn / bỏ chọn (gắn một lần)
    this.tb_projectEmployeeLinks.on("rowSelected", (row: any) => {
      const id = row.getData().ID;
      this.selectedEmployee.add(id);
    });
    this.tb_projectEmployeeLinks.on("rowDeselected", (row: any) => {
      const id = row.getData().ID;
      this.selectedEmployee.delete(id);
    });
  }

  onDepartmentChange() {
    this.getProjectEmployeefilter();
  }
  onSearchKeywordChange() {
    this.getProjectEmployeefilter();
  }
  // Lấy danh sách nhân viên theo departmentID
  getProjectEmployeefilter() {
    // Lưu lại danh sách ID đã chọn trước khi load lại dữ liệu
    const previouslySelected = new Set(this.selectedEmployee);
  
    this.projectService.getProjectEmployeefilter(this.selectedDepartment).subscribe({
      next: (response: any) => {
        let data = response.data || [];
  
        // Lọc theo từ khóa (nếu có)
        if (this.searchKeyword) {
          const keyword = this.searchKeyword.toLowerCase();
          data = data.filter((item: any) =>
            item.FullName.toLowerCase().includes(keyword) ||
            item.Code.toLowerCase().includes(keyword)
          );
        }
  
        // Gán dữ liệu mới cho bảng
        this.tb_projectEmployeeLinks.setData(data).then(() => {
          // Chọn lại các dòng theo ID (chỉ những ID còn tồn tại trong data sẽ được chọn)
          const idsToReselect = data
            .filter((item: any) => previouslySelected.has(item.ID))
            .map((item: any) => item.ID);
          if (idsToReselect.length) {
            // Đợi render xong để đảm bảo selectRow hoạt động ổn định
            setTimeout(() => this.tb_projectEmployeeLinks.selectRow(idsToReselect), 0);
          }
        });
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  
    // Không re-bind events tại đây để tránh nhân bản listener
  }
  
  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        let data = response.data;
        this.departments = data.map((item: any) => ({
          title: item.Name,
          value: item.ID
        }));

      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

onClose() {
  this.activeModal.close(true); // đóng modal và trả dữ liệu về
}
onAddLeaders() {
  const selected = this.selectedEmployee.size;
  if (!selected || selected === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên để thêm!');
    return;
  }

  this.modal.confirm({
    nzTitle: 'Xác nhận thêm',
    nzContent: `Bạn có chắc chắn muốn thêm ${selected} nhân viên đã chọn vào kiểu dự án này?`,
    nzOkText: 'Thêm',
    nzCancelText: 'Hủy',
    nzOkType: 'primary',
    nzOnOk: () => {
      // 1️⃣ Lấy danh sách nhân viên đã tồn tại
      this.projectService.getEmployeeProjectType(this.projectTypeId).subscribe({
        next: (response: any) => {
          const existingEmployeeIDs = response.data.map((item: any) => item.EmployeeID);
          const newEmployeeIDs: number[] = [];
          const duplicateEmployeeIDs: number[] = [];

          this.selectedEmployee.forEach(id => {
            if (existingEmployeeIDs.includes(id)) {
              duplicateEmployeeIDs.push(id);
            } else {
              newEmployeeIDs.push(id);
            }
          });

          // 2️⃣ Cảnh báo nhân viên trùng (hiển thị kèm mã nhân viên)
          if (duplicateEmployeeIDs.length > 0) {
            const currentRows = this.tb_projectEmployeeLinks?.getData?.() || [];
            const idToCode = new Map(currentRows.map((r: any) => [r.ID, r.Code]));
            const duplicateCodes = duplicateEmployeeIDs.map(id => idToCode.get(id) || `ID:${id}`);
            this.notification.warning(
              'Thông báo',
              `Các nhân viên đã tồn tại: ${duplicateCodes.join(', ')}`
            );
          }

          if (newEmployeeIDs.length === 0) {
            return;
          }

          // 3️⃣ Tạo payload list
          const payload = newEmployeeIDs.map(id => ({
            ProjectTypeID: this.projectTypeId,
            EmployeeID: id
          }));

          // 4️⃣ Gọi API 1 lần, truyền list object
          this.projectService.saveemployeeprojecttype(payload).subscribe({
            next: (res) => {
              this.notification.success('Thành công', `Đã thêm ${payload.length} nhân viên thành công!`);
              this.selectedEmployee.clear();
              this.onClose();
            },
            error: (error) => {
              console.error('Lỗi khi thêm nhân viên:', error);
              this.notification.error('Lỗi', 'Không thể thêm nhân viên, vui lòng thử lại!');
            }
          });
        },
        error: (error) => {
          console.error('Lỗi khi kiểm tra nhân viên:', error);
          this.notification.error('Lỗi', 'Không thể kiểm tra nhân viên, vui lòng thử lại sau!');
        }
      });
    }
  });
}

}


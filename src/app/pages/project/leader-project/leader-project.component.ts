import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import { ProjectService } from '../project-service/project.service';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { LeaderProjectDetailComponent } from './leader-project-form/leader-project-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
@Component({
  selector: 'app-price-history-partlist',
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
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './leader-project.component.html',
  styleUrl: './leader-project.component.css'
})
export class LeaderProjectComponent implements OnInit, AfterViewInit{
//#region Khai báo biến 
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  @ViewChild('tb_leaderProject', { static: false })
  tb_leaderProjectContainer!: ElementRef;
  tb_leaderProject: any;

  isLoadTable: any = false;
  sizeSearch: string = '0';

  employeeRequests: any[] = [];
  projects: any[] = [];
  suppliers: any[] = [];


  employeeRequestId: any;
  projectId: any;
  supplierId: any;
  keyword: string = '';
  //#endregion

  //#region Load dữ liệu
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.drawTbLeaderProject(
      this.tb_leaderProjectContainer.nativeElement
    );
      this.getLeaderProject();
  }
  //#endregion

  //#region Sự kiện khác
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  resetSearch() {
    this.employeeRequestId = 0;
    this.projectId = 0;
    this.supplierId = 0;
    this.keyword = '';
  }

  openModalAddLeaders() {
    const modalRef = this.modalService.open(LeaderProjectDetailComponent, {

      size: 'xl',
    });
    modalRef.result.then(
      (result) => {

        if (result === true) {
          this.getLeaderProject();
        } else {
          this.getLeaderProject();
        }
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
        // Xử lý khi modal bị dismiss (click ra ngoài, ESC, hoặc gọi dismiss(...))
      }
    );
  }
  async getLeaderProject() {
    this.isLoadTable = true;

    this.projectService.getLeaderProject(this.keyword).subscribe({
      next: (response: any) => {
        this.tb_leaderProject.setData(response.data);
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  onDeleteLeaders() {
    const selectedRows = this.tb_leaderProject.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên để xóa!');
      return;
    }

    // Chỉ cho phép xóa 1 nhân viên
    if (selectedRows.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ được phép xóa 1 nhân viên tại một thời điểm!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa nhân viên đã chọn?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Lấy dữ liệu đầy đủ của nhân viên đã chọn
        const row = selectedRows[0];
        const rowData = row.getData();
        
        // Tạo payload với đầy đủ thông tin theo format API yêu cầu
        const payload = [{
          Code: rowData.Code || '',
          FullName: rowData.FullName || '',
          EmployeeID: rowData.EmployeeID ,
          Type: 2,
          IsDeleted: true
        }];

        // Gọi API với payload xóa (IsDeleted = true)
        this.projectService.saveProjectLeader(payload).subscribe({
          next: (res) => {
            this.notification.success('Thành công', 'Đã xóa nhân viên thành công!');
            // Reload lại dữ liệu bảng
            this.getLeaderProject();
            // Bỏ chọn dòng đã xóa
            this.tb_leaderProject.deselectRow();
          },
          error: (error) => {
            console.error('Lỗi khi xóa nhân viên:', error);
            const errorMessage = error?.error?.message || error?.message || 'Không thể xóa nhân viên, vui lòng thử lại!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }

  exportExcel() {
    let table = this.tb_leaderProject;
    if (!table) return;

    let datatable = this.tb_leaderProject.getData();
    if (!datatable || datatable.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để xuất excel!');
      return;
    }

    this.projectService.exportExcelGroup(
      table,
      datatable,
      'Lịch sử giá',
      'LichSuGia',
      'TableType'
    );
  }

  drawTbLeaderProject(container: HTMLElement) {
    this.tb_leaderProject = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: true,
      layout: 'fitDataStretch',
      paginationMode:'local',
      rowHeader: false,
      groupBy: "DepartmentName",
     groupHeader: function(value, count, data) {
        return "Phòng ban: " + value;
      },
      //groupToggleElement: "header",
      selectableRows:1,
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width:300,
          headerHozAlign: 'center',
        },
        {
          title: 'Họ tên',
          field: 'FullName',
          headerHozAlign: 'center',
          formatter: 'textarea',
          resizable:false,
        },
      ],
    });
    this.tb_leaderProject.on("pageLoaded", () => {
      this.tb_leaderProject.redraw();
    });
    
  }

  //#endregion
}
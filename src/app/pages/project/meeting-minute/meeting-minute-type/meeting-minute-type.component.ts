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
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { MeetingMinuteService } from '../meeting-minute-service/meeting-minute.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { MeetingTypeFormComponent } from '../meeting-type-form/meeting-type-form.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ProjectService } from '../../project-service/project.service';
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
  templateUrl: './meeting-minute-type.component.html',
  styleUrl: './meeting-minute-type.component.css'
})
export class MeetingMinuteTypeComponent implements OnInit, AfterViewInit{
//#region Khai báo biến 
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private meetingMinuteService: MeetingMinuteService,
  ) { }

  @ViewChild('tb_meetingMinuteType', { static: false })
  tb_meetingMinuteTypeContainer!: ElementRef;
  tb_meetingMinuteType: any;

  isLoadTable: any = false;
  sizeSearch: string = '0';

  keyword: string = '';
  //#endregion

  //#region Load dữ liệu
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.drawTbMeetingType(
      this.tb_meetingMinuteTypeContainer.nativeElement
    );
      this.getAllMeetingType();
  }
  //#endregion

  openModalAddMeetingType(isEdit: boolean) {
    let selectedData;
    if(isEdit == true){
      selectedData = this.tb_meetingMinuteType?.getSelectedData();
      if (!selectedData && selectedData.length < 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 loại biên bản cuộc họp để sửa!')
        return;
      }
    }
    const modalRef = this.modalService.open(MeetingTypeFormComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.meetingtype = selectedData[0];
    modalRef.result.then(
      (result) => {

        if (result === true) {
          this.getAllMeetingType();
        } 
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
        // Xử lý khi modal bị dismiss (click ra ngoài, ESC, hoặc gọi dismiss(...))
      }
    );
  }
  async getAllMeetingType() {
    this.isLoadTable = true;

    this.meetingMinuteService.getAllMeetingType().subscribe({
      next: (response: any) => {
        this.tb_meetingMinuteType.setData(response.data);
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }

  onsearch() {
    if (!this.tb_meetingMinuteType) {
      return;
    }

    // Nếu keyword rỗng, xóa filter
    if (!this.keyword || this.keyword.trim() === '') {
      this.tb_meetingMinuteType.clearFilter();
      return;
    }

    // Áp dụng filter
    this.applyFilter();
  }

  private applyFilter() {
    if (!this.tb_meetingMinuteType) {
      return;
    }

    const keyword = this.keyword.trim().toLowerCase();

    // Sử dụng custom filter function để tìm kiếm trong nhiều field
    this.tb_meetingMinuteType.setFilter((data: any) => {
      // Kiểm tra trong các field: TypeCode, TypeName, TypeContent
      const typeCode = (data.TypeCode || '').toString().toLowerCase();
      const typeName = (data.TypeName || '').toString().toLowerCase();
      const typeContent = (data.TypeContent || '').toString().toLowerCase();

      // Tìm kiếm trong bất kỳ field nào
      return (
        typeCode.includes(keyword) ||
        typeName.includes(keyword) ||
        typeContent.includes(keyword)
      );
    });
  }
  onDeleteLeaders() {
    const selectedRows = this.tb_meetingMinuteType.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn loại biên bản để xóa!');
      return;
    }
    console.log("selectedRows", selectedRows);
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa loại biên bản đã chọn?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const meetingtypeDeleted = selectedRows.map((row: any) => {
          const data = row.getData(); 
          return {
            ID: data.ID,
            IsDeleted: true
          };
        });
        // Gọi API với payload xóa (IsDeleted = true)
        this.meetingMinuteService.saveDataMeetingType(meetingtypeDeleted).subscribe({
          next: (res) => {
            this.notification.success('Thành công', 'Đã xóa các loại biên bản cuộc họp thành công!');
            this.getAllMeetingType();
            // Bỏ chọn dòng đã xóa
            this.tb_meetingMinuteType.deselectRow();
          },
          error: (error) => {
            console.error('Lỗi khi xóa:', error);
            const errorMessage = error?.error?.message || error?.message || 'Không thể xóa nhân viên, vui lòng thử lại!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }

  exportExcel() {
    let table = this.tb_meetingMinuteType;
    if (!table) return;

    let datatable = this.tb_meetingMinuteType.getData();
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

  drawTbMeetingType(container: HTMLElement) {
    this.tb_meetingMinuteType = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: true,
      layout: 'fitDataStretch',
      paginationMode:'local',
      groupBy: "GroupID",
     groupHeader: function(value, count, data) {
        return "Thành phần tham gia: " + (value==1 ? 'Nội bộ' : value==2 ? 'Khách hàng' : 'Khác');
      },
      groupToggleElement: "header",
      selectableRows:true,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          width:70,
          headerHozAlign: 'center',
          formatter: 'rownum',
        },
        {
          title: 'ID',
          field: 'ID',
          width:70,
          headerHozAlign: 'center',
          visible:false,
        },
        {
          title: 'Mã loại cuộc họp',
          field: 'TypeCode',
          width:300,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Tên loại cuộc họp',
          field: 'TypeName',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Nội dung',
          field: 'TypeContent',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
      ],
    });
    this.tb_meetingMinuteType.on("pageLoaded", () => {
      this.tb_meetingMinuteType.redraw();
    });
    
  }

  //#endregion
}
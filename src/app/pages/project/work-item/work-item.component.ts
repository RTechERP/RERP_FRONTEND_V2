import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
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
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AuthService } from '../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { WorkItemServiceService } from './work-item-service/work-item-service.service';
@Component({
  selector: 'app-work-item',
  imports: [
    CommonModule,
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
  templateUrl: './work-item.component.html',
  styleUrl: './work-item.component.css'
})
export class WorkItemComponent implements OnInit, AfterViewInit {
@Input() projectId: number = 0;
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private workItemService: WorkItemServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}
  sizeSearch: string = '0';
  keyword: string = '';
  isLoadTable: boolean = false;
  dataTableWorkItem: any[] = [];
  @ViewChild('tb_workItem', { static: false })
  tb_workItemElement!: ElementRef;
  tb_workItem: any;
  ngOnInit(): void {
    this.loadData();
  }
  ngAfterViewInit(): void {
    this.drawTbWorkItem(this.tb_workItemElement!.nativeElement);
  }
  
  toggleSearchPanel(){
    this.sizeSearch = this.sizeSearch === '0' ? '250px' : '0';
  }
  resetSearch(){
    this.keyword = '';
  }
  loadData(): void {
    this.isLoadTable = true;
    this.workItemService.getWorkItems(this.projectId).subscribe((response: any) => {
      if(response.status === 1){
        this.dataTableWorkItem = response.data || [];
        console.log('dataTableWorkItem', this.dataTableWorkItem);
        this.tb_workItem.setData(this.dataTableWorkItem);
      }else{
        this.notification.error('Lỗi', response.message);
      }
      this.isLoadTable = false; 
    });
  }
  drawTbWorkItem(container: HTMLElement) {
    this.tb_workItem = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTableWorkItem,
      paginationMode: 'local',
      layout: "fitDataStretch",
      selectableRows: 1,
      history: true,
      columns: [
        { title: "Tình trạng", field: "IsApprovedText", hozAlign: "center",  },
        { title: "Mã", field: "Code", hozAlign: "center",  },
        { title: "Kiểu", field: "ProjectTypeName", hozAlign: "center",  },
        { title: "Trạng thái", field: "StatusText", hozAlign: "center",  },
        { title: "Người phụ trách", field: "FullName", hozAlign: "left",  },
        { title: "Người giao việc", field: "ProjectEmployeeName", hozAlign: "left",  },
        { title: "Mã người yêu cầu", field: "EmployeeRequestID", hozAlign: "center",  },
        { title: "Tên người yêu cầu", field: "EmployeeRequest", hozAlign: "left",  },
        { title: "%", field: "PercentageActual", hozAlign: "right", formatter: "progress", formatterParams: { color: "green" } },
        { title: "Công việc", field: "Mission", hozAlign: "left",  },
  
        // --- KẾ HOẠCH ---
        {
          title: "KẾ HOẠCH",
          columns: [
            { title: "Ngày bắt đầu", field: "PlanStartDate", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy" } },
            { title: "Số ngày", field: "TotalDayPlan", hozAlign: "center" },
            { title: "Ngày kết thúc", field: "PlanEndDate", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy" } },
          ],
        },
  
        // --- THỰC TẾ ---
        {
          title: "THỰC TẾ",
          columns: [
            { title: "Ngày bắt đầu", field: "ActualStartDate", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy" } },
            { title: "Ngày kết thúc", field: "ActualEndDate", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy" } },
            { title: "%", field: "PercentItem", hozAlign: "right", formatter: "progress", formatterParams: { color: "blue" } },
          ],
        },
  
        { title: "Lý do phát sinh", field: "ReasonLate", hozAlign: "left",  },
        { title: "Ghi chú", field: "Note", hozAlign: "left",  },
        { title: "Ngày cập nhật", field: "UpdatedDate", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
        { title: "Người tạo", field: "CreatedName", hozAlign: "left",  },
      ],
    });
  }
  
  
  exportExcel(): void {
  }
  onsearchData(){

  }
  onCloseModal(): void {
    this.modalService.dismissAll();
  }
}

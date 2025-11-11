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
import { SelectControlComponent } from '../../old/Sale/BillExport/Modal/select-control/select-control.component';
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
    SelectControlComponent,
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

  dataStatus: any[] = []; // trạng thái duyệt 
  dataStatusApproved: any[] = []; // trạng thái duyệt kế hoạch
  cbbEmployeeRequest: any[] = []; // người giao việc
  cbbTypeProject: any[] = []; // loại dự án
  cbbUser: any[] = []; // mã người yêu cầu
  cbbEmployee: any[] = []; // người phụ trách

  ngOnInit(): void {
    this.dataStatus = [
      { id: 0, name: "Chưa làm" },
      { id: 1, name: "Đang làm" },
      { id: 2, name: "Hoàn thành" },
      { id: 3, name: "Pending" },
    ];
    this.dataStatusApproved = [
      { id: 0, name: "Chờ duyệt kế hoạch" },
      { id: 1, name: "Duyệt thực tế" },
      { id: 2, name: "Chờ duyệt thực tế" },
      { id: 3, name: "Duyệt thực tế" },
    ];
    this.loadData();
    this.loadCbbEmployeeRequest();
    this.loadCbbTypeProject();
    this.loadCbbEmployee();
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

  // Method để tạo dropdown control trong tabulator
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => { });

      return container;
    };
  }
  loadCbbEmployeeRequest(): void {
    this.workItemService.cbbEmployeeRequest().subscribe((response: any) => {
      if(response.status === 1){
        console.log('cbbEmployeeRequest', response.data);
        this.cbbEmployeeRequest = response.data.map((item: any) => ({
          id: item.ID,
          name: item.FullName,
        }));
      }
    });
  }
  loadCbbTypeProject(): void {
    this.workItemService.cbbTypeProject().subscribe((response: any) => {
      if(response.status === 1){
        console.log('cbbTypeProject response.data', response.data);
        this.cbbTypeProject = response.data.map((item: any) => ({
          id: item.ID,
          name: item.ProjectTypeName,
        }));
        console.log('cbbTypeProject mapped', this.cbbTypeProject);
      }
    });
  }
  loadCbbEmployee(): void {
    this.workItemService.cbbUser().subscribe((response: any) => {
      if(response.status === 1){
        console.log('cbbUser response.data', response.data);
        // Map cả ID và UserID để hỗ trợ cả hai trường hợp
        this.cbbEmployee = response.data.map((item: any) => ({
          id: item.UserID || item.ID, // Ưu tiên UserID, nếu không có thì dùng ID
          name: item.FullName,
        }));
        this.cbbUser = response.data.map((item: any) => ({
          id: item.UserID,
          name: item.FullName,
        }));
        console.log('cbbEmployee', this.cbbEmployee);
      }
    });
  }
  loadData(): void {
    this.isLoadTable = true;
    this.workItemService.getWorkItems(this.projectId).subscribe((response: any) => {
      if(response.status === 1){
        this.dataTableWorkItem = response.data || [];
        console.log('dataTableWorkItem', this.dataTableWorkItem);
        // Log một vài record để kiểm tra field names
        if (this.dataTableWorkItem.length > 0) {
          console.log('Sample work item:', this.dataTableWorkItem[0]);
          console.log('UserID value:', this.dataTableWorkItem[0]?.UserID);
          console.log('TypeProjectItem value:', this.dataTableWorkItem[0]?.TypeProjectItem);
        }
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
      rowFormatter: (row: any) => {
        const data = row.getData();
        
        const itemLate = parseInt(data['ItemLateActual'] || '0');
        const totalDayExpridSoon = parseInt(data['TotalDayExpridSoon'] || '0');
        const dateEndActual = DateTime.fromISO(data['ActualEndDate']).isValid
          ? DateTime.fromISO(data['ActualEndDate']).toFormat('dd/MM/yyyy')
          : null;

        // Reset màu mặc định
        row.getElement().style.backgroundColor = '';
        row.getElement().style.color = '';

        if (itemLate == 1) {
          row.getElement().style.backgroundColor = 'Orange';
          row.getElement().style.color = 'white';
        } else if (itemLate == 2) {
          row.getElement().style.backgroundColor = 'Red';
          row.getElement().style.color = 'white';
        } else if (totalDayExpridSoon <= 3 && !dateEndActual) {
          row.getElement().style.backgroundColor = 'LightYellow';
        }
      },
      columns: [
        { title: "Tình trạng", field: "IsApprovedText", hozAlign: "center",  },
        { title: "Mã", field: "Code", hozAlign: "center",  },
        { 
          title: "Kiểu", 
          field: "TypeProjectItem", 
          hozAlign: "center",
          editor: this.createdControl(
            SelectControlComponent, 
            this.injector, 
            this.appRef, 
            () => this.cbbTypeProject, 
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn kiểu dự án'
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val && val !== 0) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn kiểu dự án</p> <i class="fas fa-angle-down"></i></div>';
            }
            // So sánh với cả number và string
            const valNum = Number(val);
            const valStr = String(val);
            const typeProject = this.cbbTypeProject.find((t: any) => {
              const tIdNum = Number(t.id);
              const tIdStr = String(t.id);
              return t.id == val || t.id === val || tIdNum === valNum || tIdStr === valStr;
            });
            if (!typeProject) {
              console.log('Không tìm thấy typeProject với val:', val, 'cbbTypeProject:', this.cbbTypeProject);
            }
            const typeProjectName = typeProject ? typeProject.name : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${typeProjectName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        { 
          title: "Trạng thái", 
          field: "Status", 
          hozAlign: "center",
          editor: this.createdControl(
            SelectControlComponent, 
            this.injector, 
            this.appRef, 
            () => this.dataStatus, 
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn trạng thái'
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (val === null || val === undefined) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn trạng thái</p> <i class="fas fa-angle-down"></i></div>';
            }
            const status = this.dataStatus.find((s: any) => s.id === val);
            const statusName = status ? status.name : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${statusName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        { 
          title: "Người phụ trách", 
          field: "UserID", 
          hozAlign: "left",
          editor: this.createdControl(
            SelectControlComponent, 
            this.injector, 
            this.appRef, 
            () => this.cbbEmployee, 
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn người phụ trách'
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val && val !== 0) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người phụ trách</p> <i class="fas fa-angle-down"></i></div>';
            }
            // So sánh với cả number và string, và cả ID và UserID
            const valNum = Number(val);
            const valStr = String(val);
            const employee = this.cbbEmployee.find((e: any) => {
              const eIdNum = Number(e.id);
              const eIdStr = String(e.id);
              return e.id == val || e.id === val || eIdNum === valNum || eIdStr === valStr;
            });
            if (!employee) {
              console.log('Không tìm thấy employee với val:', val, 'cbbEmployee:', this.cbbEmployee);
            }
            const employeeName = employee ? employee.name : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        { 
          title: "Người giao việc", 
          field: "EmployeeIDRequest", 
          hozAlign: "right",
          editor: this.createdControl(
            SelectControlComponent, 
            this.injector, 
            this.appRef, 
            () => this.cbbEmployeeRequest, 
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn người giao việc'
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người giao việc</p> <i class="fas fa-angle-down"></i></div>';
            }
            const employee = this.cbbEmployeeRequest.find((e: any) => e.id === val);
            const employeeName = employee ? employee.name : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            const newValue = cell.getValue();
            const selectedEmployee = this.cbbEmployeeRequest.find((e: any) => e.id === newValue);
            if (selectedEmployee) {
              row.update({
                EmployeeRequestID: newValue,
                EmployeeRequestName: selectedEmployee.name,
              });
            }
          },
        },
        { 
          title: "Mã người yêu cầu", 
          field: "EmployeeRequestID", 
          hozAlign: "center",
          editor: this.createdControl(
            SelectControlComponent, 
            this.injector, 
            this.appRef, 
            () => this.cbbUser, 
            {
              valueField: 'id',
              labelField: 'name',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const user = this.cbbUser.find((u: any) => u.id === val);
            const userName = user ? user.name : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${userName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            const newValue = cell.getValue();
            const selectedUser = this.cbbUser.find((u: any) => u.id === newValue);
            if (selectedUser) {
              row.update({
                EmployeeRequestName: selectedUser.name,
              });
            }
          },
        },
        { title: "Tên người yêu cầu", field: "EmployeeRequestName", hozAlign: "left",  },
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
        { title: "Ngày cập nhật", field: "UpdatedDateActual", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
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

  // Mở modal lọc trạng thái chậm/fail
  // openFilterStatusModal(): void {
  //   let selectedStatus: string = 'fail'; // Mặc định chọn fail
  //   let filterTable: any;

  //   // Tạo HTML content cho modal
  //   const modalContent = `
  //     <div style="padding: 20px; height: 80vh; display: flex; flex-direction: column;">
  //       <div style="margin-bottom: 20px; display: flex; gap: 20px; align-items: center;">
  //         <label style="cursor: pointer;">
  //           <input type="radio" name="statusFilter" value="all" id="filter-all" style="margin-right: 5px;">
  //           Tất cả
  //         </label>
  //         <label style="cursor: pointer;">
  //           <input type="radio" name="statusFilter" value="slow" id="filter-slow" style="margin-right: 5px;">
  //           Chậm
  //         </label>
  //         <label style="cursor: pointer;">
  //           <input type="radio" name="statusFilter" value="fail" id="filter-fail" checked style="margin-right: 5px;">
  //           Fail
  //         </label>
  //       </div>
  //       <div id="filter-status-table" style="flex: 1; overflow: hidden;"></div>
  //     </div>
  //   `;

  //   const modalRef = this.modal.create({
  //     nzTitle: 'Lọc theo trạng thái',
  //     nzWidth: '90%',
  //     nzStyle: { top: '20px' },
  //     nzContent: modalContent,
  //     nzFooter: [
  //       {
  //         label: 'Đóng',
  //         onClick: () => {
  //           if (filterTable) {
  //             filterTable.destroy();
  //           }
  //           modalRef.destroy();
  //         }
  //       }
  //     ]
  //   });

  //   // Khởi tạo bảng sau khi modal đã render
  //   setTimeout(() => {
  //       // Hàm lọc và sắp xếp dữ liệu
  //       const filterAndSortData = (status: string) => {
  //         let data = [...this.dataTableWorkItem];
          
  //         if (status === 'fail') {
  //           // Chỉ lấy các dòng fail (ItemLateActual == 2)
  //           data = data.filter((item: any) => parseInt(item['ItemLateActual'] || '0') === 2);
  //           // Sắp xếp: fail trước
  //           data.sort((a: any, b: any) => {
  //             const aLate = parseInt(a['ItemLateActual'] || '0');
  //             const bLate = parseInt(b['ItemLateActual'] || '0');
  //             return bLate - aLate;
  //           });
  //         } else if (status === 'slow') {
  //           // Chỉ lấy các dòng chậm (ItemLateActual == 1)
  //           data = data.filter((item: any) => parseInt(item['ItemLateActual'] || '0') === 1);
  //         } else {
  //           // Tất cả, nhưng sắp xếp fail trước
  //           data.sort((a: any, b: any) => {
  //             const aLate = parseInt(a['ItemLateActual'] || '0');
  //             const bLate = parseInt(b['ItemLateActual'] || '0');
  //             return bLate - aLate;
  //           });
  //         }
          
  //         return data;
  //       };

  //       // Tạo bảng Tabulator
  //       const createTable = () => {
  //         const filteredData = filterAndSortData(selectedStatus);
  //         const tableContainer = document.getElementById('filter-status-table');
          
  //         if (!tableContainer) return;
          
  //         if (filterTable) {
  //           filterTable.destroy();
  //         }

  //         filterTable = new Tabulator(tableContainer, {
  //           ...DEFAULT_TABLE_CONFIG,
  //           data: filteredData,
  //           paginationMode: 'local',
  //           layout: "fitDataStretch",
  //           selectableRows: 1,
  //           height: '100%',
  //           rowFormatter: (row: any) => {
  //             const data = row.getData();
  //             const itemLate = parseInt(data['ItemLateActual'] || '0');
  //             const totalDayExpridSoon = parseInt(data['TotalDayExpridSoon'] || '0');
  //             const dateEndActual = DateTime.fromISO(data['ActualEndDate']).isValid
  //               ? DateTime.fromISO(data['ActualEndDate']).toFormat('dd/MM/yyyy')
  //               : null;

  //             row.getElement().style.backgroundColor = '';
  //             row.getElement().style.color = '';

  //             if (itemLate == 1) {
  //               row.getElement().style.backgroundColor = 'Orange';
  //               row.getElement().style.color = 'white';
  //             } else if (itemLate == 2) {
  //               row.getElement().style.backgroundColor = 'Red';
  //               row.getElement().style.color = 'white';
  //             } else if (totalDayExpridSoon <= 3 && !dateEndActual) {
  //               row.getElement().style.backgroundColor = 'LightYellow';
  //             }
  //           },
  //           columns: [
  //             { title: "Tình trạng", field: "IsApprovedText", hozAlign: "center" },
  //             { title: "Mã", field: "Code", hozAlign: "center" },
  //             { title: "Kiểu", field: "TypeProjectItem", hozAlign: "center" },
  //             { title: "Trạng thái", field: "Status", hozAlign: "center" },
  //             { title: "Người phụ trách", field: "UserID", hozAlign: "left" },
  //             { title: "Người giao việc", field: "EmployeeIDRequest", hozAlign: "left" },
  //             { title: "Công việc", field: "Mission", hozAlign: "left" },
  //             { 
  //               title: "Ngày bắt đầu (KH)", 
  //               field: "PlanStartDate", 
  //               hozAlign: "center", 
  //               formatter: "datetime", 
  //               formatterParams: { outputFormat: "dd/MM/yyyy" } 
  //             },
  //             { 
  //               title: "Ngày kết thúc (KH)", 
  //               field: "PlanEndDate", 
  //               hozAlign: "center", 
  //               formatter: "datetime", 
  //               formatterParams: { outputFormat: "dd/MM/yyyy" } 
  //             },
  //             { 
  //               title: "Ngày bắt đầu (TT)", 
  //               field: "ActualStartDate", 
  //               hozAlign: "center", 
  //               formatter: "datetime", 
  //               formatterParams: { outputFormat: "dd/MM/yyyy" } 
  //             },
  //             { 
  //               title: "Ngày kết thúc (TT)", 
  //               field: "ActualEndDate", 
  //               hozAlign: "center", 
  //               formatter: "datetime", 
  //               formatterParams: { outputFormat: "dd/MM/yyyy" } 
  //             },
  //             { title: "Ghi chú", field: "Note", hozAlign: "left" },
  //           ],
  //         });
  //       };

  //       // Event listeners cho radio buttons
  //       const radioAll = document.getElementById('filter-all') as HTMLInputElement;
  //       const radioSlow = document.getElementById('filter-slow') as HTMLInputElement;
  //       const radioFail = document.getElementById('filter-fail') as HTMLInputElement;

  //       if (radioAll) {
  //         radioAll.addEventListener('change', () => {
  //           if (radioAll.checked) {
  //             selectedStatus = 'all';
  //             createTable();
  //           }
  //         });
  //       }

  //       if (radioSlow) {
  //         radioSlow.addEventListener('change', () => {
  //           if (radioSlow.checked) {
  //             selectedStatus = 'slow';
  //             createTable();
  //           }
  //         });
  //       }

  //       if (radioFail) {
  //         radioFail.addEventListener('change', () => {
  //           if (radioFail.checked) {
  //             selectedStatus = 'fail';
  //             createTable();
  //           }
  //         });
  //       }

  //     // Tạo bảng ban đầu với fail được chọn
  //     createTable();
  //   }, 300);
  // }
}

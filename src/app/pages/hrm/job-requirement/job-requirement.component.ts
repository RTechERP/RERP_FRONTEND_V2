import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgModule } from '@angular/core';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { JobRequirementService } from './job-requirement-service/job-requirement.service';
// import { HandoverFormComponent } from './handover-form/handover-form.component';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HrPurchaseProposalComponent } from '../hr-purchase-proposal/hr-purchase-proposal.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { RecommendSupplierFormComponent } from './recommend-supplier-form/recommend-supplier-form.component';
import { JobRequirementFormComponent } from './job-requirement-form/job-requirement-form.component';

@Component({
  selector: 'app-job-requirement',
  standalone: true,
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
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    NzDropDownModule,
    NzMenuModule,
    HasPermissionDirective,
  ],
  templateUrl: './job-requirement.component.html',
  styleUrl: './job-requirement.component.css'
})
export class JobRequirementComponent implements OnInit, AfterViewInit {

   @ViewChild('JobrequirementTable') tableRef1!: ElementRef;
    @ViewChild('JobrequirementDetailTable') tableRef2!: ElementRef;
    @ViewChild('JobrequirementFileTable') tableRef3!: ElementRef;
    @ViewChild('JobrequirementApprovedTable') tableRef4!: ElementRef;
  
    searchParams = {
      DepartmentID: 0,
      EmployeeID: 0,
      ApprovedTBPID: 0,
      Step: 0,
      Request: '',
      DateStart: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      DateEnd: new Date(),
    };
  
    JobrequirementData: any[] = [];
    JobrequirementTable: Tabulator | null = null;
  
    JobrequirementID: number = 0;
    DepartmentRequiredID: number = 0;
    data: any[] = [];
    dataDepartment: any[] = [];
    cbbEmployee: any[] = [];
  
    JobrequirementDetailData: any[] = [];
    JobrequirementDetailTable: Tabulator | null = null;
  
    JobrequirementFileData: any[] = [];
    JobrequirementFileTable: Tabulator | null = null;
  
    JobrequirementApprovedData: any[] = [];
    JobrequirementApprovedTable: Tabulator | null = null;
  
    HCNSApprovalData: any[] = [];
    isHCNSApproved: boolean = false; // Trạng thái đã duyệt HCNS hay chưa
  
    sizeSearch: string = '0';
    isCheckmode: boolean = false;
    dateFormat = 'dd/MM/yyyy';
  
    dataInput: any = {};
  
    ngOnInit(): void {
      this.getJobrequirement();
      this.getdataEmployee();
      this.getdataDepartment();
      
    }
    ngAfterViewInit(): void {
      this.draw_JobrequirementTable();
      this.draw_JobrequirementDetailTable();
      this.draw_JobrequirementFileTable();
      this.draw_JobrequirementApprovedTable();
    }
  
    constructor(
      private notification: NzNotificationService,
      private JobRequirementService: JobRequirementService,
      private modalService: NgbModal,
      private modal: NzModalService,
      private cdr: ChangeDetectorRef,
      private message: NzMessageService,
      private menuEventService: MenuEventService
    ) {}
  
    //search
    filterOption = (input: string, option: any): boolean => {
      const label = option.nzLabel?.toLowerCase() || '';
      const value = option.nzValue?.toString().toLowerCase() || '';
      return (
        label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
      );
    };
  
    private formatApprovalBadge(status: number): string {
      // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
      const numStatus =
        status === null || status === undefined ? 0 : Number(status);
  
      switch (numStatus) {
        case 0:
          return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
        case 1:
          return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
        case 2:
          return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Không duyệt</span>';
        default:
          return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
      }
    }
  
    getJobrequirement(): void {
      this.JobRequirementService.getJobrequirement(
        this.searchParams.DepartmentID,
        this.searchParams.EmployeeID,
        this.searchParams.ApprovedTBPID,
        this.searchParams.Step,
        this.searchParams.Request,
        this.searchParams.DateStart,
        this.searchParams.DateEnd
      ).subscribe((response: any) => {
        this.JobrequirementData = response.data || [];
        if (this.JobrequirementTable) {
          this.JobrequirementTable.setData(this.JobrequirementData || []);
          this.JobrequirementID =
            this.JobrequirementData.length > 0
              ? this.JobrequirementData[0].ID
              : 0;
          if (this.JobrequirementID) {
            this.getJobrequirementbyID(this.JobrequirementID);
            this.getJobrequirementFilebyID(this.JobrequirementID);
            this.getJobrequirementApprovedbyID(this.JobrequirementID);
          }
        } else {
          this.draw_JobrequirementTable();
        }
      });
    }
  
    getJobrequirementbyID(id: number) {
      this.JobRequirementService.getJobrequirementbyID(id).subscribe(
        (response: any) => {
          this.JobrequirementDetailData = response.data.details || [];
          if (this.JobrequirementDetailTable) {
            this.JobrequirementDetailTable.setData(this.JobrequirementDetailData);
          } else {
            this.draw_JobrequirementDetailTable();
          }
        }
      );
    }
  
    getJobrequirementFilebyID(id: number) {
      this.JobRequirementService.getJobrequirementbyID(id).subscribe(
        (response: any) => {
          this.JobrequirementFileData = response.data.files || [];
          if (this.JobrequirementFileTable) {
            this.JobrequirementFileTable.setData(this.JobrequirementFileData);
          } else {
            this.draw_JobrequirementFileTable();
          }
        }
      );
    }
  
    getJobrequirementApprovedbyID(id: number) {
      this.JobRequirementService.getJobrequirementbyID(id).subscribe(
        (response: any) => {
          this.JobrequirementApprovedData = response.data.approves || [];
          if (this.JobrequirementApprovedTable) {
            this.JobrequirementApprovedTable.setData(
              this.JobrequirementApprovedData
            );
          } else {
            this.draw_JobrequirementApprovedTable();
          }
        }
      );
    }
  
       getdataDepartment() {
      this.JobRequirementService.getDataDepartment().subscribe((response: any) => {
        this.dataDepartment = response.data || [];
      });
    }
    getdataEmployee() {
      this.JobRequirementService.getAllEmployee().subscribe((response: any) => {
        this.cbbEmployee = response.data || [];
      });
    }
  
      getHCNSData(JobrequirementID: number): void {
      if (!JobrequirementID || JobrequirementID === 0) {
        this.HCNSApprovalData = [];
        this.isHCNSApproved = false;
        return;
      }
  
      this.JobRequirementService
        .getHCNSProposals(
          JobrequirementID,
          this.DepartmentRequiredID,
          this.searchParams.DateStart,
          this.searchParams.DateEnd
        )
        .subscribe({
          next: (response: any) => {
            this.HCNSApprovalData = response.data?.HCNSProPosalData || [];
            
            // Chỉ chặn khi có bản ghi đã được duyệt (IsApproved = 1)
            // 0: Chưa duyệt, 1: Đã duyệt, 2: Hủy duyệt
            this.isHCNSApproved = this.HCNSApprovalData.some((item: any) => {
              const isApproved = item.IsApproved;
              // Chỉ chặn khi IsApproved = 1 (Đã duyệt)
              return isApproved === 1 || isApproved === '1';
            });
          },
          error: (err) => {
            this.HCNSApprovalData = [];
            this.isHCNSApproved = false;
          },
        });
    }
  
    /**
     * Kiểm tra xem có thể thêm mới hoặc sửa không
     */
    canAddOrEdit(): boolean {
      return !this.isHCNSApproved;
    }
  
    onAddSupplier(isEditmode: boolean) {
      this.isCheckmode = isEditmode;
      if (this.isCheckmode == true && this.JobrequirementID === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn 1 bản ghi để sửa!'
        );
        return;
      }
  
      // Kiểm tra nếu đã duyệt thì không cho phép thêm mới hoặc sửa
      if (this.isHCNSApproved) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không thể thêm mới hoặc chỉnh sửa bản ghi đã được duyệt!'
        );
        return;
      }
  
      const selected = this.JobrequirementTable?.getSelectedData() || [];
      const rowData = { ...selected[0] };
      const modalRef = this.modalService.open(RecommendSupplierFormComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });
      modalRef.componentInstance.isCheckmode = this.isCheckmode;
      modalRef.componentInstance.JobrequirementID = this.JobrequirementID;
      modalRef.componentInstance.dataInput = rowData;
  
      modalRef.result
        .then((result) => {
          if (result == true) {
            this.getJobrequirement();
            this.draw_JobrequirementTable();
            // Reload HCNS data để cập nhật trạng thái
            if (this.JobrequirementID) {
              this.getHCNSData(this.JobrequirementID);
            }
          }
        })
        .catch(() => {});
    }

     onAddJobRequirement(isEditmode: boolean) {
      this.isCheckmode = isEditmode;
      if (this.isCheckmode == true && this.JobrequirementID === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn 1 bản ghi để sửa!'
        );
        return;
      }
  
      // Kiểm tra nếu đã duyệt thì không cho phép thêm mới hoặc sửa
      if (this.isHCNSApproved) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không thể thêm mới hoặc chỉnh sửa bản ghi đã được duyệt!'
        );
        return;
      }
  
      const selected = this.JobrequirementTable?.getSelectedData() || [];
      const rowData = { ...selected[0] };
      const modalRef = this.modalService.open(JobRequirementFormComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });
      modalRef.componentInstance.isCheckmode = this.isCheckmode;
      modalRef.componentInstance.JobrequirementID = this.JobrequirementID;
      modalRef.componentInstance.dataInput = rowData;
  
      modalRef.result
        .then((result) => {
          if (result == true) {
            this.getJobrequirement();
            this.draw_JobrequirementTable();
    
          }
        })
        .catch(() => {});
    }
    onDeleteJobRequirement() {

    }
  
    onOpenDepartmentRequired() {
      const selected = this.JobrequirementTable?.getSelectedData() || [];
      const rowData = { ...selected[0] };
      
      // Lấy JobrequirementID từ row đã chọn hoặc từ biến
      const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;
      
      const title = 'Đề xuất mua hàng';
      const data = {
        JobrequirementID: jobRequirementID,
        isCheckmode: this.isCheckmode,
        dataInput: rowData
      };
      
      this.menuEventService.openNewTab(
        HrPurchaseProposalComponent,
        title,
        data
      );
    }
  
    onDeleteJobrequirement() {}
  
    toggleSearchPanel() {
      this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }
    searchData() {
      this.getJobrequirement();
    }
  
    private draw_JobrequirementTable(): void {
      if (this.JobrequirementTable) {
        this.JobrequirementTable.setData(this.JobrequirementData || []);
      } else {
        this.JobrequirementTable = new Tabulator(this.tableRef1.nativeElement, {
          data: this.JobrequirementData || [],
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          paginationMode: 'local',
          height: '100%',
          columns: [
            {
              title: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'RowIndex',
            },
            {
              title: 'Yêu cầu BGĐ duyệt',
              field: 'IsRequestBGDApproved',
              hozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
                let numValue = 0;
                if (value === null || value === undefined) {
                  numValue = 0;
                } else if (typeof value === 'number') {
                  numValue = value;
                } else if (typeof value === 'string') {
                  // Map string sang number
                  if (value === 'Đã duyệt') numValue = 1;
                  else if (value === 'Từ chối' || value === 'Không duyệt')
                    numValue = 2;
                  else numValue = 0; // Chưa duyệt hoặc giá trị khác
                }
                return this.formatApprovalBadge(numValue);
              },
              frozen: true,
            },
            {
              title: 'Yêu cầu mua',
              field: 'IsRequestBuy',
              headerHozAlign: 'center',
              hozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
                let numValue = 0;
                if (value === null || value === undefined) {
                  numValue = 0;
                } else if (typeof value === 'number') {
                  numValue = value;
                } else if (typeof value === 'string') {
                  // Map string sang number
                  if (value === 'Đã duyệt') numValue = 1;
                  else if (value === 'Từ chối' || value === 'Không duyệt')
                    numValue = 2;
                  else numValue = 0; // Chưa duyệt hoặc giá trị khác
                }
                return this.formatApprovalBadge(numValue);
              },
              frozen: true,
            },
            {
              title: 'Yêu cầu báo giá',
              field: 'IsRequestPriceQuote',
              headerHozAlign: 'center',
              hozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
                let numValue = 0;
                if (value === null || value === undefined) {
                  numValue = 0;
                } else if (typeof value === 'number') {
                  numValue = value;
                } else if (typeof value === 'string') {
                  // Map string sang number
                  if (value === 'Đã duyệt') numValue = 1;
                  else if (value === 'Từ chối' || value === 'Không duyệt')
                    numValue = 2;
                  else numValue = 0; // Chưa duyệt hoặc giá trị khác
                }
                return this.formatApprovalBadge(numValue);
              },
              frozen: true,
            },
            {
              title: 'Trạng thái',
              field: 'StatusText',
              headerHozAlign: 'center',
            },
            {
              title: 'Mã yêu cầu',
              field: 'NumberRequest',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày yêu cầu',
              field: 'DateRequest',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 200,
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value
                  ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                  : '';
              },
            },
            {
              title: 'Tên nhân viên',
              field: 'EmployeeName',
              headerHozAlign: 'center',
            },
            {
              title: 'Bộ phận yêu cầu',
              field: 'EmployeeDepartment',
              headerHozAlign: 'center',
            },
            {
              title: 'TBP duyệt',
              field: 'FullNameApprovedTBP',
              headerHozAlign: 'center',
            },
            {
              title: 'Bộ phận được yêu cầu',
              field: 'RequiredDepartment',
              headerHozAlign: 'center',
            },
            {
              title: 'Bộ phận phối hợp',
              field: 'CoordinationDepartment',
              headerHozAlign: 'center',
            },
            {
              title: 'Trạng thái duyệt',
              field: 'IsApprovedText',
              headerHozAlign: 'center',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
            },
          ],
        });
        this.JobrequirementTable.on(
          'rowClick',
          (e: UIEvent, row: RowComponent) => {
            const rowData = row.getData();
            const mouseEvent = e as MouseEvent;
            const jobRequirementID = rowData['ID'];
            this.getJobrequirementbyID(jobRequirementID);
            this.getJobrequirementFilebyID(jobRequirementID);
            this.getJobrequirementApprovedbyID(jobRequirementID);
            
            // Kiểm tra trạng thái duyệt HCNS khi click row
            if (jobRequirementID) {
              this.getHCNSData(jobRequirementID);
            }
          }
        );
  
        // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
        this.JobrequirementTable.on('rowSelected', (row: RowComponent) => {
          const rowData = row.getData();
          this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
          this.JobrequirementID = this.data[0].ID;
          
          // Kiểm tra trạng thái duyệt HCNS khi chọn row
          if (this.JobrequirementID) {
            this.getHCNSData(this.JobrequirementID);
          }
        });
        this.JobrequirementTable.on('rowDeselected', (row: RowComponent) => {
          const selectedRows = this.JobrequirementTable!.getSelectedRows();
          this.JobrequirementID = 0;
          if (selectedRows.length === 0) {
            this.data = []; // Reset data
          }
        });
      }
    }
  
    private draw_JobrequirementDetailTable(): void {
      if (this.JobrequirementDetailTable) {
        this.JobrequirementDetailTable.setData(
          this.JobrequirementDetailData || []
        );
      } else {
        this.JobrequirementDetailTable = new Tabulator(
          this.tableRef2.nativeElement,
          {
            data: this.JobrequirementDetailData || [],
            ...DEFAULT_TABLE_CONFIG,
            selectableRows: 1,
            layout: 'fitDataStretch',
            height: '100%',
            paginationMode: 'local',
            columns: [
              {
                title: 'STT',
                hozAlign: 'center',
                headerHozAlign: 'center',
                field: 'STT',
              },
              {
                title: 'Đề mục',
                field: 'Category',
                headerHozAlign: 'center',
              },
              {
                title: 'Diễn giản',
                field: 'Description',
                headerHozAlign: 'center',
              },
              {
                title: 'Mục tiêu cần đạt',
                field: 'Target',
                headerHozAlign: 'center',
              },
              {
                title: 'Ghi chú',
                field: 'Note',
                headerHozAlign: 'center',
              },
            ],
          }
        );
      }
    }
  
    private draw_JobrequirementFileTable(): void {
      if (this.JobrequirementFileTable) {
        this.JobrequirementFileTable.setData(this.JobrequirementFileData || []);
      } else {
        this.JobrequirementFileTable = new Tabulator(
          this.tableRef3.nativeElement,
          {
            data: this.JobrequirementFileData || [],
            ...DEFAULT_TABLE_CONFIG,
            selectableRows: 1,
            height: '100%',
            layout: 'fitDataStretch',
            paginationMode: 'local',
            columns: [
              {
                title: 'STT',
                hozAlign: 'center',
                headerHozAlign: 'center',
                field: 'STT',
              },
              {
                title: 'File đính kèm',
                field: 'FileName',
                headerHozAlign: 'center',
              },
            ],
          }
        );
      }
    }
  
    private draw_JobrequirementApprovedTable(): void {
      if (this.JobrequirementApprovedTable) {
        this.JobrequirementApprovedTable.setData(
          this.JobrequirementApprovedData || []
        );
      } else {
        this.JobrequirementApprovedTable = new Tabulator(
          this.tableRef4.nativeElement,
          {
            data: this.JobrequirementApprovedData || [],
            ...DEFAULT_TABLE_CONFIG,
            selectableRows: 1,
            height: '100%',
            layout: 'fitDataStretch',
            paginationMode: 'local',
            columns: [
              {
                title: 'STT',
                hozAlign: 'center',
                headerHozAlign: 'center',
                field: 'STT',
              },
              {
                title: 'Bước',
                field: 'Step',
                headerHozAlign: 'center',
              },
              {
                title: 'Tên bước',
                field: 'StepName',
                headerHozAlign: 'center',
              },
              {
                title: 'Ngày duyệt',
                field: 'DateApproved',
                hozAlign: 'left',
                headerHozAlign: 'center',
                width: 200,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value
                    ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                    : '';
                },
              },
              {
                title: 'Trạng thái',
                field: 'ApprovedText',
                headerHozAlign: 'center',
              },
              {
                title: 'Người thức hiện',
                field: 'EmployeeName',
                headerHozAlign: 'center',
              },
              {
                title: 'Người duyệt',
                field: 'EmployeeActualName',
                headerHozAlign: 'center',
              },
              {
                title: 'Lý do hủy duyệt',
                field: 'ReasonCancel',
                headerHozAlign: 'center',
              },
            ],
          }
        );
      }
    }
}

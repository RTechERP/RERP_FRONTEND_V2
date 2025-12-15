import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
  HostListener,
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
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SummaryEmployeeService } from './summary-employee-service/summary-employee.service';

import { DEFAULT_TABLE_CONFIG } from '../../.././../tabulator-default.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { PermissionService } from '../../../../services/permission.service';
import { HandoverService } from '../../../hrm/handover/handover-service/handover.service';

export interface SummaryEmployeeParams {
  DepartmentID: number;
  EmployeeID: number;
  IsApproved: number;
  Type: number;
  Keyword: string;
  DateStart: Date;
  DateEnd: Date;
}

@Component({
  selector: 'app-summary-employee',
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
    HasPermissionDirective,
  ],
  templateUrl: './summary-employee.component.html',
  styleUrl: './summary-employee.component.css',
})
export class SummaryEmployeeComponent implements OnInit, AfterViewInit {
  @ViewChild('listSummaryOnLeaveTable') tableRef!: ElementRef;

  listParams: SummaryEmployeeParams = {
    DepartmentID: 0,
    EmployeeID: 0,
    IsApproved: 0,
    Type: 0,
    Keyword: '',
    DateStart: new Date(),
    DateEnd: new Date(),
  };

  listSummaryOnLeaveData: any[] = [];
  listSummaryOnLeaveTable: Tabulator | null = null;

  dateFormat = 'dd/MM/yyyy';
  dataDepartment: any[] = [];

  ngOnInit(): void {
    this.getdataDepartment();
    this.getSummaryEmployeeOnLeave();
  }

  ngAfterViewInit(): void {
    this.draw_listSummaryOnLeaveTable();
  }

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private summaryEmployeeService: SummaryEmployeeService,
    private handoverService: HandoverService
  ) {}

  getSummaryEmployeeOnLeave(): void {
    this.summaryEmployeeService
      .getEmployeeOnLeaveSummary(
        this.listParams.DepartmentID,
        this.listParams.EmployeeID,
        this.listParams.IsApproved,
        this.listParams.Type,
        this.listParams.Keyword,
        this.listParams.DateStart,
        this.listParams.DateEnd
      )
      .subscribe((response: any) => {
        this.listSummaryOnLeaveData = response.data?.data || [];
        console.log('hihi222', this.listSummaryOnLeaveData);
        if (this.listSummaryOnLeaveTable) {
          this.listSummaryOnLeaveTable.setData(
            this.listSummaryOnLeaveData || []
          );
        } else {
          this.draw_listSummaryOnLeaveTable();
        }
      });
  }

  searchData() {
    this.getSummaryEmployeeOnLeave();
  }

  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  getdataDepartment() {
    this.handoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  private draw_listSummaryOnLeaveTable(): void {
    if (this.listSummaryOnLeaveTable) {
      this.listSummaryOnLeaveTable.setData(this.listSummaryOnLeaveData || []);
    } else {
      this.listSummaryOnLeaveTable = new Tabulator(
        this.tableRef.nativeElement,
        {
          data: this.listSummaryOnLeaveData || [],
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          layout: 'fitDataStretch',
          paginationMode: 'local',
          height: '100%',
          columns: [
            {
              title: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'TBP duyệt',
              field: 'StatusTBPText',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();

                let color = '';
                switch (value) {
                  case 'Chờ duyệt':
                    color = '#faad14'; // vàng
                    break;
                  case 'Không đồng ý duyệt':
                    color = '#ff4d4f'; // đỏ
                    break;
                  case 'Đã duyệt':
                    color = '#52c41a'; // xanh
                    break;
                  default:
                    color = '#000';
                }

                return `<span style="color:${color}; font-weight:600">${value}</span>`;
              },
            },
            {
              title: 'HR duyệt',
              field: 'StatusHRText',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();

                let color = '';
                switch (value) {
                  case 'Chờ duyệt':
                    color = '#faad14'; // vàng
                    break;
                  case 'Không đồng ý duyệt':
                    color = '#ff4d4f'; // đỏ
                    break;
                  case 'Đã duyệt':
                    color = '#52c41a'; // xanh
                    break;
                  default:
                    color = '#000';
                }

                return `<span style="color:${color}; font-weight:600">${value}</span>`;
              },
            },
            {
              title: 'Người xin nghỉ',
              field: 'EmployeeLeave',
              headerHozAlign: 'center',
            },
            {
              title: 'Trưởng bộ phận',
              field: 'EmployeeTP',
              headerHozAlign: 'center',
            },
            {
              title: 'Nhân sự',
              field: 'EmployeeHR',
              headerHozAlign: 'center',
            },
            {
              title: 'Thời gian nghỉ',
              field: 'TimeOnLeaveText',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày bắt đầu',
              field: 'StartDate',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày kết thúc',
              field: 'EndDate',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do nghỉ',
              field: 'Reason',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do hủy',
              field: 'ReasonCancel',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày hủy',
              field: 'DateCancel',
              headerHozAlign: 'center',
            },
            {
              title: 'Loại nghỉ',
              field: 'TypeText',
              headerHozAlign: 'center',
            },
          ],
        }
      );
    }
  }
}

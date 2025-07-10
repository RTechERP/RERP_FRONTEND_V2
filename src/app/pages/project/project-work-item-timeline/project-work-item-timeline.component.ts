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

@Component({
  selector: 'app-project-work-item-timeline',
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
  ],
  templateUrl: './project-work-item-timeline.component.html',
  styleUrl: './project-work-item-timeline.component.css',
})
export class ProjectWorkItemTimelineComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  @ViewChild('tb_projectWorkItemTimeline', { static: false })
  tb_projectWorkItemTimelineContainer!: ElementRef;
  tb_projectWorkItemTimeline: any;

  sizeSearch: string = '0';
  isLoadTable: any = false;

  departments: any[] = [];
  teams: any[] = [];
  employees: any[] = [];

  statuses: any[] = [
    { ID: 0, Name: 'Tất cả' },
    { ID: 1, Name: 'Chưa hoàn thành' },
    { ID: 2, Name: 'Hoàn thành' },
  ];

  dateStart: any = DateTime.local().plus({ day: -7 }).toFormat('yyyy-MM-dd');
  dateEnd: any = DateTime.local().plus({ day: 7 }).toFormat('yyyy-MM-dd');

  departmentId: any;
  teamId: any;
  employeeId: any;
  statusId: any = 1;

  //#endregion
  //#region Chạy khi mở chương trình
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.getEmployees();
    this.getDepartment();
    this.getUserTeam();
    this.getProjectWorkItemTimeline();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  resetSearch() {
    this.dateStart = DateTime.local().plus({ day: -7 }).toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local().plus({ day: 7 }).toFormat('yyyy-MM-dd');

    this.departmentId = 0;
    this.teamId = 0;
    this.employeeId = 0;
    this.statusId = 1;
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getUserTeam() {
    this.teams = [];
    if (this.departmentId > 0) {
      this.projectService.getUserTeam(this.departmentId).subscribe({
        next: (response: any) => {
          this.teams = response.data;
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }

  async getProjectWorkItemTimeline() {
    this.isLoadTable = true;
    this.drawTbProjectWorkItemTimeline(
      this.tb_projectWorkItemTimelineContainer.nativeElement
    );

    let data = {
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      departmentId: this.departmentId ? this.departmentId : 0,
      userTeamId: this.teamId ? this.teamId : 0,
      userId: this.employeeId ? this.employeeId : 0,
      status: this.statusId,
    };

    const response: any = await firstValueFrom(
      this.projectService.getProjectWorkItemTimeline(data)
    );
    debugger;
    await this.addColunmTable(response.data.dtAllDate, response.data.dtMonth);
    await this.tb_projectWorkItemTimeline.setData(response.data.dt);

    this.isLoadTable = false;
  }
  //#endregion

  //#region Xử lý bảng tiến độ hạng mục công việc
  drawTbProjectWorkItemTimeline(container: HTMLElement) {
    this.tb_projectWorkItemTimeline = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      groupHeader: function (value, count, data, group) {
        return value;
      },
      locale: 'vi',
      columns: [
        {
          title: 'THÔNG TIN HẠNG MỤC CÔNG VIỆC',
          headerHozAlign: 'center',
          columns: [
            {
              title: '',
              columns: [
                {
                  title: 'Dự án',
                  field: 'ProjectFullName',
                  width: 150,
                  headerHozAlign: 'center',
                },
                {
                  title: 'Mã hạng mục',
                  field: 'Code',
                  width: 200,
                  headerHozAlign: 'center',
                  formatter: 'textarea',
                },
                {
                  title: 'Nội dung',
                  field: 'Mission',
                  width: 150,
                  headerHozAlign: 'center',
                },
                {
                  title: 'Người phụ trách',
                  field: 'FullName',
                  width: 150,
                  headerHozAlign: 'center',
                },
                {
                  title: 'Thời gian bắt đầu',
                  field: 'StartDate',
                  width: 150,
                  headerHozAlign: 'center',
                  formatter: function (cell, formatterParams, onRendered) {
                    let value = cell.getValue() || '';
                    const dateTime = DateTime.fromISO(value);
                    value = dateTime.isValid
                      ? dateTime.toFormat('dd/MM/yyyy')
                      : '';
                    return value;
                  },
                },
                {
                  title: 'Số ngày',
                  field: 'TotalDay',
                  width: 150,
                  headerHozAlign: 'center',
                },
                {
                  title: 'Ngày kết thúc',
                  field: 'EndDate',
                  width: 150,
                  headerHozAlign: 'center',
                  formatter: function (cell, formatterParams, onRendered) {
                    let value = cell.getValue() || '';
                    const dateTime = DateTime.fromISO(value);
                    value = dateTime.isValid
                      ? dateTime.toFormat('dd/MM/yyyy')
                      : '';
                    return value;
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  addColunmTable(dataMisson: any, dataMonth: any) {
    debugger;
    let column: any[] = [];
    let colunmChild: any[] = [];
    this.tb_projectWorkItemTimeline.addColumn({
      title: '',
      columns: [
        {
          title: ``,
          headerHozAlign: 'center',
          width: 10,
          headerSort: false,
        },
      ],
    });
    debugger
    for (let i = 0; i < dataMonth.length; i++) {
      let month = dataMonth[i]['monthDate'];
      let year = dataMonth[i]['yearDate'];
      if (!month || !year) {
        break;
      }

      for (let j = 0; j < dataMisson.length; j++) {
        if (dataMisson[j]['AllDates']) {
          let date = DateTime.fromISO(dataMisson[j]['AllDates']);

          let col = {
            title: `${date.day}`,
            field: `${date.toFormat('dd/MM/yyyy')}`,
            width: 10,
            headerSort: false,
            headerHozAlign: 'center',
            formatter: function (cell: any, row: any) {
              let data = cell.getRow().getData();
              const el = cell.getElement();
              if (date.weekday == 7) {
                el.style.backgroundColor = '#ccc';
              }

              let ds = DateTime.fromISO(data['StartDate']);
              let de = DateTime.fromISO(data['EndDate']);
              let actualDateStart = DateTime.fromISO(data['ActualDateStart']);
              let actualDateEnd = DateTime.fromISO(data['ActualDateEnd']);

              if (date >= ds && date <= de) {
                el.style.background = 'lightblue';
                if (date.weekday == 7) {
                  el.style.background =
                    'linear-gradient(to right, rgba(224,224,224,1), rgba(153,206,250,0.7))';
                }
              }

              if (actualDateStart && date == actualDateStart) {
                el.style.background = '#32CD32';
                if (date.weekday == 7) {
                  el.style.background =
                    'linear-gradient(to right, rgba(224,224,224,1), rgba(50,205,50,0.7))';
                }
              }

              if (actualDateEnd && date == actualDateEnd) {
                if (actualDateEnd <= de) {
                  el.style.background = '#FFC0CB';
                  if (date.weekday == 7) {
                    el.style.background =
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(255, 192, 203, 0.7))';
                  }
                } else {
                  el.style.background = '#8B0000';
                  if (date.weekday == 7) {
                    el.style.background =
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(139, 0, 0, 0.7))';
                  }
                }
              }

              if (!actualDateStart && !actualDateEnd) {
                if (DateTime.now() >= de && date == de) {
                  el.style.background = '#8B0000';
                  if (date.weekday == 7) {
                    el.style.background =
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(139, 0, 0, 0.7))';
                  }
                }
              }
            },
          };
          if (date.month == month) colunmChild.push(col);
        }
      }

      column.push({
        title: `Tháng ${month}/${year}`,
        columns: colunmChild,
        headerHozAlign: 'center',
      });
    }

    let colunmParend = {
      title: 'THỜI GIAN',
      columns: column,
    };
    this.tb_projectWorkItemTimeline.addColumn(colunmParend);
  }
  //#endregion
}

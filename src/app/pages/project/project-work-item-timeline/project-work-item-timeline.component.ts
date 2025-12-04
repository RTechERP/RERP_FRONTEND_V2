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
import {
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
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
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

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
    // HasPermissionDirective
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
    private router: Router,
    private cdr: ChangeDetectorRef
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
    { ID: -1, Name: 'Tất cả' },
    { ID: 0, Name: 'Chưa hoàn thành' },
    { ID: 1, Name: 'Hoàn thành' },
  ];

  dateStart: any = DateTime.local().plus({ day: -7 }).toFormat('yyyy-MM-dd');
  dateEnd: any = DateTime.local().plus({ day: 7 }).toFormat('yyyy-MM-dd');

  departmentId: any;
  teamId: any;
  employeeId: any;
  statusId: any = 0;

  dataMonth: any[] = [];
  dataMission: any[] = [];

  isExport: any = false;
  //#endregion
  //#region Chạy khi mở chương trình
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.getEmployees();
      this.getDepartment();
      this.getUserTeam();
      this.getProjectWorkItemTimeline();
    }, 0);
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
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getUserTeam() {
    this.teams = [];
    if (this.departmentId > 0) {
      this.projectService.getUserTeam(this.departmentId).subscribe({
        next: (response: any) => {
          this.teams = response.data;
          console.log('jhaa', this.teams);
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }

  async getProjectWorkItemTimeline() {
    this.isLoadTable = true;
    this.cdr.detectChanges();

    // Chỉ tạo Tabulator mới nếu chưa tồn tại
    if (!this.tb_projectWorkItemTimeline) {
      this.drawTbProjectWorkItemTimeline(
        this.tb_projectWorkItemTimelineContainer.nativeElement
      );
    } else {
      // Nếu đã tồn tại, destroy và tạo lại để tránh lỗi khi xóa cột động
      try {
        this.tb_projectWorkItemTimeline.destroy();
      } catch (error) {
        console.error('Lỗi khi destroy Tabulator:', error);
      } finally {
        // Clear container để đảm bảo không còn element cũ
        this.tb_projectWorkItemTimelineContainer.nativeElement.innerHTML = '';
        this.tb_projectWorkItemTimeline = null;
      }
      // Tạo lại Tabulator
      this.drawTbProjectWorkItemTimeline(
        this.tb_projectWorkItemTimelineContainer.nativeElement
      );
    }

    let data = {
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      departmentId: this.departmentId ? this.departmentId : 0,
      userTeamId: this.teamId ? this.teamId : 9,
      employeeId: this.employeeId ? this.employeeId : 0,
      status: this.statusId,
    };

    try {
      const response: any = await firstValueFrom(
        this.projectService.getProjectWorkItemTimeline(data)
      );

      this.dataMonth = response.data.dtMonth;
      this.dataMission = response.data.dtAllDate;

      // Thêm cột mới
      await this.addColunmTable(this.dataMission, this.dataMonth);

      // Set data
      await this.tb_projectWorkItemTimeline.setData(response.data.dt);

      // Redraw table để đảm bảo render đúng
      setTimeout(() => {
        this.tb_projectWorkItemTimeline.redraw(true);
      }, 100);

      this.isLoadTable = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Lỗi khi load dữ liệu:', error);
      this.isLoadTable = false;
      this.cdr.detectChanges();
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải dữ liệu');
    }
  }
  //#endregion

  //#region Xử lý bảng tiến độ hạng mục công việc
  drawTbProjectWorkItemTimeline(container: HTMLElement) {
    this.tb_projectWorkItemTimeline = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,

      layout: 'fitColumns',
      pagination: true,
      paginationMode: 'local',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      // columnMinWidth: 35,          // Cột ngày nhỏ nhất 35px
      maxHeight: '100%', // Tùy chọn: giới hạn chiều cao
      renderHorizontal: 'virtual', // Tối ưu hiệu năng khi nhiều cột
      rowHeader: false,
      groupHeader: function (value, count, data, group) {
        return value;
      },
      //   locale: 'vi',
      columns: [
        {
          title: 'THÔNG TIN HẠNG MỤC CÔNG VIỆC',
          headerHozAlign: 'center',
          frozen: true,
          columns: [
            {
              title: '',
              columns: [
                {
                  title: 'Dự án',
                  field: 'ProjectFullName',
                  width: 150,
                  headerHozAlign: 'center',
                  formatter: 'textarea',
                },
                {
                  title: 'Mã hạng mục',
                  field: 'Code',
                  width: 120,
                  headerHozAlign: 'center',
                  formatter: this.hideDuplicateFormatter('Code'),
                },
                {
                  title: 'Nội dung',
                  field: 'Mission',
                  width: 150,
                  headerHozAlign: 'center',
                  formatter: 'textarea',
                },
                {
                  title: 'Người phụ trách',
                  field: 'FullName',
                  width: 100,
                  headerHozAlign: 'center',
                  formatter: 'textarea',
                },
                {
                  title: 'Thời gian bắt đầu',
                  field: 'StartDate',
                  width: 110,
                  headerHozAlign: 'center',
                  hozAlign: 'center',
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
                  width: 50,
                  headerHozAlign: 'center',
                  hozAlign: 'right',
                },
                {
                  title: 'Ngày kết thúc',
                  field: 'EndDate',
                  width: 110,
                  headerHozAlign: 'center',
                  hozAlign: 'center',
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
    this.tb_projectWorkItemTimeline.on('pageLoaded', () => {
      this.tb_projectWorkItemTimeline.redraw();
    });
  }

  addColunmTable(dataMisson: any, dataMonth: any) {
    let column: any[] = [];
    let colunmChild: any[] = [];
    // this.tb_projectWorkItemTimeline.addColumn({
    //   title: '',
    //   columns: [
    //     {
    //       title: ``,
    //       headerHozAlign: 'center',
    //       minWidth: 10,
    //       headerSort: false,
    //     },
    //   ],
    // });
    for (let i = 0; i < dataMonth.length; i++) {
      colunmChild = [];
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
            minWidth: 35,
            //maxWidth: 50,
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

              if (
                actualDateStart.isValid &&
                date.hasSame(actualDateStart, 'day')
              ) {
                el.style.background = '#32CD32';
                if (date.weekday == 7) {
                  el.style.background =
                    'linear-gradient(to right, rgba(224,224,224,1), rgba(50,205,50,0.7))';
                }
              }

              if (actualDateEnd.isValid && date.hasSame(actualDateEnd, 'day')) {
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
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(255, 0, 0, 0.7))';
                  }
                }
              }

              if (!actualDateStart.isValid && !actualDateEnd.isValid) {
                if (DateTime.now() >= de && date.hasSame(de, 'day')) {
                  el.style.background = '#8B0000';
                  if (date.weekday == 7) {
                    el.style.background =
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(255, 0, 0, 0.7))';
                  }
                }
              }
            },
          };
          if (date.month == month && date.year == year) colunmChild.push(col);
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

  //#region ẩn giá trị giống nhau
  hideDuplicateFormatter(fieldName: string) {
    return function (cell: any) {
      let value = cell.getValue();
      let row = cell.getRow();
      let table = row.getTable();
      let index = row.getPosition();

      if (index > 0) {
        let prevRow = table.getRowFromPosition(index - 1);
        if (prevRow && prevRow.getData()[fieldName] === value) {
          return '';
        }
      }
      return value;
    };
  }
  //#endregion

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_projectWorkItemTimeline;
    if (!table) return;

    if (!this.dataMonth || !this.dataMission) return;

    const data = table.getData();
    const columns = table.getColumns();
    console.log(columns);
    if (!data || data.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất!'
      );
      return;
    }
    this.isExport = true;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timeline');
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 12,
        };
      });
    });
    worksheet.mergeCells('A1:G2');
    worksheet.getCell('A1').value = 'THÔNG TIN HẠNG MỤC CÔNG VIỆC';
    worksheet.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('A1').font = {
      bold: true,
    };

    worksheet.getCell('A3').value = 'Dự án';
    worksheet.getCell('A3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };

    worksheet.getCell('B3').value = 'Mã hạng mục';
    worksheet.getCell('B3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('C3').value = 'Nội dung';
    worksheet.getCell('C3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };

    worksheet.getCell('D3').value = 'Người phụ trách';
    worksheet.getCell('D3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('E3').value = 'Ngày bắt đầu';
    worksheet.getCell('E3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('F3').value = 'Số ngày';
    worksheet.getCell('F3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('G3').value = 'Ngày kết thúc';
    worksheet.getCell('G3').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    let dtMonth = this.dataMonth;
    let dtMisson = this.dataMission;
    let startCol = 9;
    let endCol = 0;
    for (let i = 0; i < dtMonth.length; i++) {
      let month = dtMonth[i]['monthDate'];
      let year = dtMonth[i]['yearDate'];
      if (!month) {
        break;
      }

      let stt = -1;
      for (let j = 0; j < dtMisson.length; j++) {
        if (dtMisson[j]['AllDates']) {
          let date = DateTime.fromISO(dtMisson[j]['AllDates']);
          if (date.month == month) {
            stt++;
            worksheet.getCell(
              `${this.getColumnLetter(9 + j)}3`
            ).value = `${date.day}`;
            worksheet.getCell(`${this.getColumnLetter(9 + j)}3`).alignment = {
              vertical: 'middle',
              horizontal: 'center',
            };
          }
        }
      }
      endCol = startCol + stt;
      worksheet.mergeCells(
        `${this.getColumnLetter(startCol)}2:${this.getColumnLetter(endCol)}2`
      );

      worksheet.getCell(
        `${this.getColumnLetter(startCol + 1)}2`
      ).value = `Tháng ${month}/${year}`;
      worksheet.getCell(`${this.getColumnLetter(startCol + 1)}2`).font = {
        bold: true,
      };
      worksheet.getCell(`${this.getColumnLetter(startCol + 1)}2`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      startCol = endCol + 1;
    }

    worksheet.mergeCells(`I1:${this.getColumnLetter(endCol)}1`);
    worksheet.getCell('I1').value = 'THỜI GIAN';
    worksheet.getCell('I1').font = {
      bold: true,
    };

    // worksheet.spliceColumns(8, 0, []);

    const allDateStringsSet = new Set<string>();
    await data.forEach((row: any) => {
      const ds = DateTime.fromISO(row.StartDate);
      const de = DateTime.fromISO(row.EndDate);
      for (let d = ds; d <= de; d = d.plus({ days: 1 })) {
        allDateStringsSet.add(d.toFormat('dd/MM/yyyy'));
      }
    });
    const sortedDateStrings = Array.from(allDateStringsSet).sort();
    const dateColumns = sortedDateStrings.map((dateStr) => ({
      title: dateStr,
      getField: () => dateStr,
    }));

    const fullColumns = [...columns, ...dateColumns];

    // ====== MÀU ===== //
    const colorMap: Record<string, string> = {
      gray: 'FFE0E0E0',
      lightblue: 'FF87CEFA',
      red: 'FFFF0000',
      pink: 'FFFFC0CB',
      green: 'FF00FF00',
      argbgrayblue: 'FFD0E7F8',
      argbgrayred: 'FFF2B6B6',
      argbgraypink: 'FFF8F5C4',
      argbgraygreen: 'FFD8F2C4',
    };

    const isColorCode = (val: string): boolean =>
      Object.keys(colorMap).includes(val);

    const getColorArgb = (colorName: string): { argb: string } => {
      return { argb: colorMap[colorName] || 'FFFFFFFF' };
    };

    // ===== GÁN GIÁ TRỊ MÀU VÀO DÒNG ===== //
    const lastDateAllowed = sortedDateStrings[endCol];
    await data.forEach((row: any) => {
      const ds = DateTime.fromISO(row.StartDate);
      const de = DateTime.fromISO(row.EndDate);
      const actualDateStart = DateTime.fromISO(row.ActualDateStart);
      const actualDateEnd = DateTime.fromISO(row.ActualDateEnd);

      sortedDateStrings.forEach((dateStr, i) => {
        const keyDate = DateTime.fromFormat(dateStr, 'dd/MM/yyyy');

        // Chủ nhật
        if (keyDate.weekday === 7) {
          row[dateStr] = 'gray';
        }

        // Trong khoảng kế hoạch
        if (keyDate >= ds && keyDate <= de) {
          row[dateStr] = 'lightblue';
          if (keyDate.weekday === 7) row[dateStr] = 'argbgrayblue';
        }

        // Ngày bắt đầu thực tế
        if (
          actualDateStart.isValid &&
          keyDate.hasSame(actualDateStart, 'day')
        ) {
          row[dateStr] = 'green';
          if (keyDate.weekday === 7) row[dateStr] = 'argbgraygreen';
        }

        // Ngày kết thúc thực tế
        if (actualDateEnd.isValid && keyDate.hasSame(actualDateEnd, 'day')) {
          if (actualDateEnd <= de) {
            row[dateStr] = 'pink';
            if (keyDate.weekday === 7) row[dateStr] = 'argbgraypink';
          } else {
            row[dateStr] = 'red';
            if (keyDate.weekday === 7) row[dateStr] = 'argbgrayred';
          }
        }

        // Quá hạn không có thực tế
        if (!actualDateStart.isValid && !actualDateEnd.isValid) {
          if (DateTime.now() >= de && keyDate.hasSame(de, 'day')) {
            row[dateStr] = 'red';
            if (keyDate.weekday === 7) row[dateStr] = 'argbgrayred';
          }
        }
      });
    });

    await data.forEach((row: any) => {
      const rowData = fullColumns.map((col: any) => {
        const field = col.getField?.();
        let value = row[field];
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        return value;
      });

      const excelRow = worksheet.addRow(rowData);

      fullColumns.forEach((col: any, colIndex: number) => {
        if (colIndex > endCol) return;

        const field = col.getField?.();
        const rawValue = row[field];

        if (typeof rawValue === 'string' && isColorCode(rawValue)) {
          const cell = excelRow.getCell(colIndex + 1);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: getColorArgb(rawValue),
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
          cell.value = '';
        }
      });
    });

    await worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (Number(cell.col) > endCol) {
          cell.value = '';
          cell.fill = {
            type: 'pattern',
            pattern: 'none',
            fgColor: { argb: 'FFFFFFFF' },
          };
        }

        if (!cell.alignment) {
          cell.alignment = {};
        }
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle',
        };
      });
    });

    await worksheet.columns.forEach((column: any, colIndex: number) => {
      if (colIndex === 0) {
        column.width = 20;
        return;
      }

      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let cellValue = '';

        if (cell.value != null) {
          if (typeof cell.value === 'object') {
            if (cell.value.richText) {
              cellValue = cell.value.richText.map((t: any) => t.text).join('');
            } else if (cell.value.text) {
              cellValue = cell.value.text;
            } else if (cell.value.result) {
              cellValue = cell.value.result.toString();
            } else {
              cellValue = cell.value.toString();
            }
          } else {
            cellValue = cell.value.toString();
          }
        }

        const length = cellValue.length;
        maxLength = Math.max(maxLength, length + 1);
      });

      column.width = Math.min(maxLength, 20);
    });

    worksheet.autoFilter = {
      from: {
        row: 3,
        column: 1,
      },
      to: {
        row: 3,
        column: 7,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    let ds = DateTime.fromJSDate(new Date(this.dateStart)).toFormat('ddMMyy');
    let de = DateTime.fromJSDate(new Date(this.dateEnd)).toFormat('ddMMyy');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `TimlineCongViec_${ds}_${de}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await window.URL.revokeObjectURL(link.href);
    this.isExport = false;
  }

  getColumnLetter(colIndex: number): string {
    let letter = '';
    while (colIndex > 0) {
      let mod = (colIndex - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      colIndex = Math.floor((colIndex - mod) / 26);
    }
    console.log(letter);
    return letter;
  }
  //#endregion
}

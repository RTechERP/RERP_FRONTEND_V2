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
import { OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
@Component({
  selector: 'app-project-work-timeline',
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
    HasPermissionDirective
  ],
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './project-work-timeline.component.html',
  styleUrl: './project-work-timeline.component.css',
})
export class ProjectWorkTimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  //#region Khai báo các biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  @ViewChild('tb_projectWorkTimeline', { static: false })
  tb_projectWorkTimelineContainer!: ElementRef;
  tb_projectWorkTimeline: any;

  sizeSearch: string = '0';
  isLoadTable: any = false;

  departments: any[] = [];
  teams: any[] = [];
  employees: any[] = [];
  types: any[] = [
    { ID: 1, TypeName: 'Kế hoạch công việc' },
    { ID: 2, TypeName: 'Hạng mục công việc' },
    { ID: 3, TypeName: 'Báo cáo công việc' },
  ];

  departmentId: any;
  teamId: any;
  employeeId: any;
  typeIds: any[] = [1, 2, 3];

  dateStart = DateTime.local().startOf('month').toFormat('yyyy-MM-dd');
  dateEnd = DateTime.local().endOf('month').toFormat('yyyy-MM-dd');

  dataCell: any;
  dataTitle: any;
  dataField: any;
  dataName: any;
  cellValue: any = '';
  workContent: any = '';
  private resizeListener?: () => void;
  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {
    this.isLoadTable = true;
  }
  ngAfterViewInit(): void {
    this.getEmployees();
    this.getDepartment();
    this.getUserTeam();

    this.getDataWorkTimeline();
    
    // Thêm event listener cho window resize
    this.resizeListener = () => {
      if (this.tb_projectWorkTimeline) {
        setTimeout(() => {
          this.tb_projectWorkTimeline.redraw(true);
        }, 100);
      }
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    // Xóa event listener khi component bị destroy
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    // Redraw bảng sau khi thay đổi kích thước panel
    if (this.tb_projectWorkTimeline) {
      setTimeout(() => {
        this.tb_projectWorkTimeline.redraw(true);
      }, 200);
    }
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
        this.notification.error('Thông báo', msg);
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
        this.notification.error('Thông báo', msg);
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
          console.log("skss", this.teams)
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }

  getDataWorkTimeline() {
    this.isLoadTable = true;
    setTimeout(() => {
      this.drawTbProjectWorkTimeline(
        this.tb_projectWorkTimelineContainer.nativeElement
      );
    }, 100);

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
      typeNumber: this.typeIds,
    };

    this.projectService.getDataWorkTimeline(data).subscribe({
      next: (response: any) => {
        if (this.tb_projectWorkTimeline) {
          this.tb_projectWorkTimeline.setData(response.data);
          // Redraw sau khi set data để đảm bảo hiển thị đúng
          setTimeout(() => {
            this.tb_projectWorkTimeline.redraw(true);
          }, 100);
        }
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  async drawTbProjectWorkTimeline(container: HTMLElement) {
    let col: any[] = [
      {
        title: 'Họ tên',
        field: 'FullName',
        headerHozAlign: 'center',
        width: 150,
        frozen: true,
        formatter: this.hideDuplicateFormatter('FullName'),
      },
      {
        title: 'Loại',
        field: 'TypeText',
        headerHozAlign: 'center',
        width: 150,
        frozen: true,
      },
    ];

    let ds = DateTime.fromJSDate(new Date(this.dateStart));
    let de = DateTime.fromJSDate(new Date(this.dateEnd));

    while (ds <= de) {
      let item = {
        title: `${ds.toFormat('dd/MM/yyyy')}`,
        field: `${ds.toFormat('yyyy-MM-dd')}`,
        headerHozAlign: 'center',
        headerSort: false,
        // width: 150,
        minWidth: 100,
        cssClass: 'date-column', // ← Thêm class
        formatter: 'textarea',
        cellClick: async (e: MouseEvent, cell: any) => {
          const oldPopup = document.getElementById('cell-popup');
          if (oldPopup) oldPopup.remove();

          // Lấy dữ liệu và vị trí chuột
          const rowData = cell.getRow().getData();

          const column = cell.getColumn();
          this.dataField = column.getField();
          this.dataTitle = column.getDefinition().title;
          this.dataCell = cell.getData();
          this.dataName = rowData['FullName'];
          this.cellValue = cell.getValue();

          const field = cell.getColumn().getField();
          const value = cell.getValue();

          this.workContent = '';
          let dataDetail = {
            userId: this.dataCell.UserID ?? 0,
            type: this.dataCell.TypeNumber ?? 0,
            date: this.dataTitle
              ? DateTime.fromFormat(this.dataTitle, 'dd/MM/yyyy')
                  .set({ hour: 7 })
                  .toISO()
              : null,
            typeText: this.dataCell.TypeText ?? '',
            code: this.cellValue ?? '',
          };

          if (this.cellValue) {
            this.projectService
              .getDataWorkTimelineDetail(dataDetail)
              .subscribe({
                next: (response: any) => {
                  response.data.forEach((item: any) => {
                    this.workContent += item.WorkContent + '\r\n\n';
                  });

                  // Tạo nội dung popup
                  const popup = document.createElement('div');
                  popup.id = 'cell-popup';
                  popup.style.position = 'absolute';
                  popup.style.top = `${e.clientY + 10}px`;
                  popup.style.left = `${e.clientX + 10}px`;
                  popup.style.background = '#fff';
                  popup.style.border = '1px solid #ccc';
                  popup.style.padding = '10px';
                  popup.style.zIndex = '1000';
                  popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                  popup.style.borderRadius = '6px';
                  popup.style.fontSize = '14px';
                  popup.innerHTML = `
    <strong>HẠNG MỤC CÔNG VIỆC - ${this.dataTitle}</strong><br/>
    <strong>${this.dataName}</strong>
    <div style="margin-top:5px;"><textarea readonly style="width:250px; height:10rem; max-height:10rem;">${this.workContent}</textarea></div>
    <div style="text-align:right;"><button style="border: none;background-color: red;
    color: white;" onclick="document.getElementById('cell-popup')?.remove()">Đóng</button></div>
  `;

                  document.body.appendChild(popup);
                },
                error: (error) => {
                  console.error('Lỗi:', error);
                },
              });
          }
        },
      };
      col.push(item);
      ds = ds.plus({ days: 1 });
    }

    this.tb_projectWorkTimeline = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      rowHeader:false,
      pagination: true,
      paginationMode:'local',
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      columns: col,

      // BẬT LẠI BORDER CHO CỘT CUỐI
  columnDefaults: {
    resizable: true,
  },

  // QUAN TRỌNG: Bật virtual DOM và thêm border
  renderHorizontal: "virtual",
  ajaxFiltering: false,

    });
    this.tb_projectWorkTimeline.on("pageLoaded", () => {
      this.tb_projectWorkTimeline.redraw(true);
    });
    
    // Redraw khi bảng được render xong
    this.tb_projectWorkTimeline.on("tableBuilt", () => {
      setTimeout(() => {
        this.tb_projectWorkTimeline.redraw(true);
      }, 100);
    });
  }
  //#endregion

  //#region ẩn dòng trùng dữ liệu
  hideDuplicateFormatter(fieldName: string) {
    return function (cell: any) {
      let value = cell.getValue();
      let row = cell.getRow();
      let table = row.getTable();
      let index = row.getPosition();

      if (index > 0) {
        let behindRow = table.getRowFromPosition(index - 2);
        let prevRow = table.getRowFromPosition(index - 1);
        if (prevRow && prevRow.getData()[fieldName] === value) {
          return '';
        }

        if (behindRow && behindRow.getData()[fieldName] === value) {
          return '';
        }
      }
      return value;
    };
  }
  //#endregion

  //#region popup chi tiết

  rowPopupFormatter: any = (e: any, row: any, onRendered: any) => {};

  async setcontent() {}
  //#endregion

  //#region Xuất excel
  async exportToExcel() {
    let table = this.tb_projectWorkTimeline;
    if (!table) return;

    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timeline công việc');

    const columns = table.getColumns();
    const headers = columns.map((col: any) => col.getDefinition().title);

    // Thêm dòng header và lưu lại dòng đó để thao tác
    const headerRow = worksheet.addRow(headers);

    // Gán style màu xám cho từng ô trong dòng header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    const startRow = 2;
    const column = 'A';

    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount - 2; i += 3) {
      const cell1 = worksheet.getCell(`${column}${i}`);
      const cell2 = worksheet.getCell(`${column}${i + 1}`);
      const cell3 = worksheet.getCell(`${column}${i + 2}`);

      if (cell1.value === cell2.value && cell1.value === cell3.value) {
        worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
        // Căn giữa nếu cần
        cell1.alignment = { vertical: 'middle' };
      }
    }

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle', // tùy chọn: căn giữa theo chiều dọc
        };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Timelinecongviec.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
}

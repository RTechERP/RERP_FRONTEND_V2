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
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-project-work-propress',
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
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-work-propress.component.html',
  styleUrl: './project-work-propress.component.css',
})
export class ProjectWorkPropressComponent implements OnInit, AfterViewInit {
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

  @ViewChild('tb_projectWorkPropress', { static: false })
  tb_projectWorkPropressContainer!: ElementRef;
  tb_projectWorkPropress: any;
  sizeSearch: string = '0';
  isLoadTable: any = false;
  dataMission: any;
  dataMonth: any;
  projects: any[] = [];
  projectId: any = 0;
  year: any = DateTime.now().toJSDate();

  projectName: any = '';
  projectCode: any = '';
  custumerCode: any = '';
  timeLine: any = '';

  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {
    this.getProject();
  }
  ngAfterViewInit(): void {
    this.drawTbProjectWorkPropress(
      this.tb_projectWorkPropressContainer.nativeElement
    );
    this.getWorkPropress();
  }

  getProject() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        let selectedYear = DateTime.fromJSDate(this.year).year;
        this.projects = response.data.filter((project: any) => {
          let createdDate = DateTime.fromISO(project.CreatedDate);
          return (
            createdDate.isValid &&
            Number(createdDate.year) === Number(selectedYear)
          );
        });
        console.log(this.projects);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  async getWorkPropress() {
    this.isLoadTable = true;
    this.drawTbProjectWorkPropress(
      this.tb_projectWorkPropressContainer.nativeElement
    );
    if (this.projectId > 0) {
      try {
        // Bước 1: Gọi API và chờ dữ liệu
        const response: any = await firstValueFrom(
          this.projectService.getWorkPropress(this.projectId)
        );

        // Bước 2: Gán thông tin project
        this.projectName = this.projects.find(
          (x: any) => x.ID == this.projectId
        )?.ProjectName;
        this.projectCode = this.projects.find(
          (x: any) => x.ID == this.projectId
        )?.ProjectCode;
        // Bước 3: Lấy customer code
        this.custumerCode = response.data3;

        // Bước 4: Tính timeline
        const firstDateStr = response.data1[0]?.AllDates;
        const lastDateStr = response.data1[response.data1.length - 1]?.AllDates;

        this.timeLine = `${
          firstDateStr ? DateTime.fromISO(firstDateStr).toFormat('dd/MM') : ''
        } - ${
          lastDateStr ? DateTime.fromISO(lastDateStr).toFormat('dd/MM') : ''
        }`;

        const columns = this.tb_projectWorkPropress.getColumnDefinitions();

        columns[1].columns[1].title = this.projectName; // projectName
        columns[1].columns[1].columns[0].title = this.custumerCode; // custumerCode
        columns[1].columns[1].columns[0].columns[0].title = this.timeLine; // timeLine

        this.tb_projectWorkPropress.setColumns(columns); // Áp lại cột

        // Bước 5: Gán dữ liệu nhiệm vụ
        this.dataMission = response.data1;
        this.dataMonth = response.data2;
        // Bước 6: Vẽ bảng, đợi vẽ xong
        await this.tb_projectWorkPropress.setData(response.data);

        await this.addColunmTable(this.dataMission, this.dataMonth);
      } catch (error) {
        console.error('Lỗi khi load dữ liệu tiến độ công việc:', error);
      }
    }
    this.isLoadTable = false;
  }

  // Ẩn dữ liệu bị trùng
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

  addColunmTable(dataMisson: any, dataMonth: any) {
    this.tb_projectWorkPropress.addColumn({
      title: '',
      columns: [
        {
          title: '',
          columns: [
            {
              title: '',
              columns: [
                {
                  title: ``,
                  headerHozAlign: 'center',
                  width: 10,
                  headerSort: false,
                },
              ],
            },
          ],
        },
      ],
    });
    for (let i = 0; i < dataMonth.length; i++) {
      let colunmChild: any[] = [];
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
              let itemLate = data['ItemLate'];
              let typeText = data['TypeText'];
              if (date.weekday == 7) {
                el.style.backgroundColor = '#ccc';
              }

              let ds = DateTime.fromISO(data['StartDate']);
              let de = DateTime.fromISO(data['EndDate']);
              if (date >= ds && date <= de) {
                if (date.weekday == 7) {
                  if (typeText == 'Plan') {
                    el.style.background =
                      'linear-gradient(to right, rgba(224,224,224,1), rgba(153,206,250,0.7))';
                  } else {
                    if (itemLate != 0) {
                      el.style.background =
                        'linear-gradient(to right, rgba(224,224,224,1), rgba(255,0,0,0.7))';
                    } else {
                      el.style.background =
                        'linear-gradient(to right, rgba(224,224,224,1), rgba(255,255,0,0.7))';
                    }
                  }
                } else {
                  if (typeText == 'Plan') {
                    el.style.background = 'lightblue';
                  } else {
                    if (itemLate != 0) {
                      el.style.background = 'red';
                    } else {
                      el.style.background = 'yellow';
                    }
                  }
                }
              }
            },
          };
          if (date.month == month) colunmChild.push(col);
        }
      }
      let colunmParend = {
        title: '',
        columns: [
          {
            title: '',
            columns: [
              {
                title: '',
                columns: [
                  {
                    title: `Tháng ${month}/${year}`,
                    columns: colunmChild,
                    headerHozAlign: 'center',
                  },
                ],
              },
            ],
          },
        ],
      };
      this.tb_projectWorkPropress.addColumn(colunmParend);
    }
  }
  //#endregion

  //#region Tìm kiếm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  search() {}
  resetSearch() {
    this.projectId = 0;
    this.year = null;
  }
  //#endregion

  //#region Xử lý bảng tiến độ công việc
  drawTbProjectWorkPropress(container: HTMLElement) {
    this.tb_projectWorkPropress = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: false,
      //   height: '100%',
      //   layout: 'fitColumns',
      // ajaxURL: this.projectService.getProjectItems(),
      // ajaxParams: { id: this.projectId },
      // ajaxResponse: (url, params, res) => {
      //   return res.data;
      // },
      // rowFormatter: function (row) {

      // },
      groupBy: 'ProjectTypeName',
      groupHeader: function (value, count, data, group) {
        return value;
      },
      locale: 'vi',
      columns: [
        {
          title: 'KẾ HOẠCH TRIỂN KHAI DỰ ÁN',
          headerHozAlign: 'center',
          frozen: true,
          columns: [
            {
              title: 'TÊN DỰ ÁN / PROJECT',
              columns: [
                {
                  title: 'KHÁCH HÀNG / CUSTOMER',
                  columns: [
                    {
                      title: 'KẾ HOẠCH TRIỂN KHAI',
                      columns: [
                        {
                          title: 'Stt',
                          field: 'STT',
                          width: 80,
                          hozAlign: 'center',
                          formatter: this.hideDuplicateFormatter('STT'),
                        },
                        {
                          title: 'Nội dung',
                          field: 'Mission',
                          width: 200,
                          //   headerHozAlign: 'center',
                          formatter: 'textarea',
                        },
                        {
                          title: 'Người phụ trách',
                          field: 'FullName',
                          width: 150,
                          //   headerHozAlign: 'center',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              title: '',
              field: 'projectName',
              columns: [
                {
                  title: '',
                  field: 'custumerCode',
                  columns: [
                    {
                      title: '',
                      field: 'timeLine',
                      columns: [
                        {
                          title: 'Ngày bắt đầu',
                          field: 'StartDate',
                          width: 120,
                          headerHozAlign: 'center',
                          formatter: function (
                            cell,
                            formatterParams,
                            onRendered
                          ) {
                            let value = cell.getValue() || '';
                            const dateTime = DateTime.fromISO(value);
                            value = dateTime.isValid
                              ? dateTime.toFormat('dd/MM/yyyy')
                              : '';
                            return value;
                          },
                          hozAlign: 'center',
                        },
                        {
                          title: 'Số ngày',
                          field: 'TotalDay',
                          width: 80,
                          headerHozAlign: 'center',
                          hozAlign: 'right',
                        },
                        {
                          title: 'Ngày kết thúc',
                          field: 'EndDate',
                          width: 120,
                          headerHozAlign: 'center',
                          formatter: function (
                            cell,
                            formatterParams,
                            onRendered
                          ) {
                            let value = cell.getValue() || '';
                            const dateTime = DateTime.fromISO(value);
                            value = dateTime.isValid
                              ? dateTime.toFormat('dd/MM/yyyy')
                              : '';
                            return value;
                          },
                          hozAlign: 'center',
                        },
                        {
                          title: 'Tiến độ',
                          field: 'TypeText',
                          width: 80,
                          headerHozAlign: 'center',
                          formatter: function (cell) {
                            const value = cell.getValue();
                            const el = cell.getElement();

                            if (value == 'Plan') {
                              el.style.backgroundColor = 'lightblue';
                            } else {
                              el.style.backgroundColor = 'yellow';
                            }

                            return value;
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  }
  //#endregion

  //#region Xuất excel
  async exportExcel() {
    const table = this.tb_projectWorkPropress;
    if (!table) return;

    const data = table.getData();
    const columns = table.getColumns();
    console.log(columns);
    if (!data || data.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kế hoạch');
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 12,
        };
      });
    });
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'KẾ HOẠCH TRIỂN KHAI DỰ ÁN';
    worksheet.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('A1').font = {
      bold: true,
    };

    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = 'TÊN DỰ ÁN/ PROJECT';
    worksheet.getCell('A2').font = {
      bold: true,
    };

    worksheet.mergeCells('D2:G2');
    worksheet.getCell('D2').value = `${this.projectName}`;
    worksheet.getCell('D2').font = {
      bold: true,
    };

    worksheet.mergeCells('A3:C3');
    worksheet.getCell('A3').value = 'KHÁCH HÀNG/ CUSTOMER';
    worksheet.getCell('A3').font = {
      bold: true,
    };

    worksheet.mergeCells('D3:G3');
    worksheet.getCell('D3').value = `${this.custumerCode}`;
    worksheet.getCell('D3').font = {
      bold: true,
    };

    worksheet.mergeCells('A4:C4');
    worksheet.getCell('A4').value = 'KẾ HOẠCH TRIỂN KHAI';
    worksheet.getCell('A4').font = {
      bold: true,
    };

    worksheet.mergeCells('D4:G4');
    worksheet.getCell('D4').value = `${this.timeLine}`;
    worksheet.getCell('D4').font = {
      bold: true,
    };

    worksheet.getCell('A5').value = `STT`;
    worksheet.getCell('A5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('B5').value = `Nội dung`;
    worksheet.getCell('B5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    worksheet.getCell('C5').value = `Người phụ trách`;
    worksheet.getCell('C5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('D5').value = `Ngày bắt đầu`;
    worksheet.getCell('D5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('E5').value = `Số ngày`;
    worksheet.getCell('E5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('F5').value = `Ngày kết thúc`;
    worksheet.getCell('F5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getCell('G5').value = `Tiến độ`;
    worksheet.getCell('G5').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    let dtMonth = this.dataMonth;
    let dtMisson = this.dataMission;
    let startCol = 8;
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
              `${this.getColumnLetter(8 + j)}5`
            ).value = `${date.day}`;
            worksheet.getCell(`${this.getColumnLetter(8 + j)}5`).alignment = {
              vertical: 'middle',
              horizontal: 'center',
            };
          }
        }
      }
      endCol = startCol + stt;
      worksheet.mergeCells(
        `${this.getColumnLetter(startCol + 1)}4:${this.getColumnLetter(
          endCol + 1
        )}4`
      );

      worksheet.getCell(
        `${this.getColumnLetter(startCol)}4`
      ).value = `Tháng ${month}/${year}`;
      worksheet.getCell(`${this.getColumnLetter(startCol)}4`).font = {
        bold: true,
      };
      worksheet.getCell(`${this.getColumnLetter(startCol)}4`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      startCol = endCol + 1;
    }

    let nums: number[] = [];

    const groupedData = new Map<string, any[]>();

    data.forEach((row: any) => {
      const type = row.ProjectTypeName || 'Không xác định';
      if (!groupedData.has(type)) {
        groupedData.set(type, []);
      }
      groupedData.get(type)?.push(row);
    });

    worksheet.spliceColumns(8, 0, []);
    groupedData.forEach((rows, projectType) => {
      const groupRow = worksheet.addRow([`Loại dự án: ${projectType}`]);
      const groupRowIndex = groupRow.number;
      worksheet.mergeCells(`A${groupRowIndex}:D${groupRowIndex}`);
      nums.push(groupRowIndex);

      groupRow.font = { bold: true };
      groupRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      const colorMap: Record<string, string> = {
        gray: 'FFE0E0E0',
        lightblue: '87cefa',
        red: 'ff0000',
        yellow: 'ffff00',
        argbgrayblue: 'FFD0E7F8',
        argbgrayred: 'FFF2B6B6',
        argbgrayyellow: 'FFF8F5C4',
      };

      const isColorCode = (val: string): boolean =>
        Object.keys(colorMap).includes(val);

      const getColorArgb = (colorName: string): { argb: string } => {
        return { argb: colorMap[colorName] || 'FFFFFFFF' }; // mặc định trắng
      };

      rows.forEach((row: any) => {
        const ds = DateTime.fromISO(row.StartDate);
        const de = DateTime.fromISO(row.EndDate);
        const typeText = String(row.TypeText || '').toLowerCase();
        const itemLate = Number(row.ItemLate || 0);

        // Gán màu theo từng cột ngày
        for (const key in row) {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(key)) {
            const keyDate = DateTime.fromFormat(key, 'dd/MM/yyyy');

            if (keyDate.weekday === 7) {
              row[key] = 'gray'; // Chủ nhật không nằm trong khoảng
            }

            if (keyDate >= ds && keyDate <= de) {
              if (keyDate.weekday === 7) {
                if (typeText === 'plan') {
                  row[key] = 'argbgrayblue';
                } else {
                  row[key] = itemLate !== 0 ? 'argbgrayred' : 'argbgrayyellow';
                }
              } else {
                if (typeText === 'plan') {
                  row[key] = 'lightblue';
                } else if (typeText === 'actual') {
                  row[key] = itemLate !== 0 ? 'red' : 'yellow';
                }
              }
            }
          }
        }

        // Xuất dòng ra Excel
        const rowData = columns.map((col: any) => {
          const field = col.getField?.();
          let value = row[field];
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          return value;
        });
        const excelRow = worksheet.addRow(rowData);

        // Tô màu các ô tương ứng
        columns.forEach((col: any, colIndex: number) => {
          const field = col.getField?.();
          const rawValue = row[field];

          if (typeof rawValue === 'string' && isColorCode(rawValue)) {
            const cell = excelRow.getCell(colIndex + 1);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: getColorArgb(rawValue),
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.value = '';
          }
        });
      });
    });

    const startRow = 6;
    const endRow = worksheet.rowCount;
    const columnsToMerge = [1, 2, 3, 4, 5, 6, 7];

    for (let row = startRow; row < endRow; row++) {
      const nextRow = row + 1;
      if (nextRow <= endRow && !nums.includes(row) && !nums.includes(nextRow)) {
        columnsToMerge.forEach((colIndex) => {
          const colLetter = worksheet.getColumn(colIndex).letter;
          if (colIndex <= 3) {
            worksheet.mergeCells(`${colLetter}${row}:${colLetter}${nextRow}`);
          }
          for (let r = row; r <= nextRow; r++) {
            worksheet.getCell(`${colLetter}${r}`).alignment =
              colIndex === 2 || colIndex === 3 || colIndex === 7
                ? { vertical: 'middle', wrapText: true }
                : { vertical: 'middle', horizontal: 'center' };
          }
        });
        row++;
      }
    }

    // Set màu
    worksheet.eachRow((row, rowNumber) => {
      const cellG = row.getCell(7);
      const cellValue = (cellG.value || '').toString().trim().toLowerCase();

      if (cellValue === 'plan') {
        cellG.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '87cefa' }, // Xanh nhạt
        };
      } else if (cellValue === 'actual') {
        cellG.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ffff00' }, // Vàng nhạt
        };
      }
    });

    worksheet.columns.forEach((column: any, colIndex: number) => {
      if (colIndex === 0) {
        column.width = 6;
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
        row: 5,
        column: 1,
      },
      to: {
        row: 5,
        column: 7,
      },
    };

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
    link.download = `KeHoachDuAn_${this.projectCode}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
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

import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../project-service/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectChangeComponent } from '../project-change/project-change.component';
import * as ExcelJS from 'exceljs';


@Component({
  selector: 'app-project-list-work-report',
  templateUrl: './project-list-work-report.component.html',
  styleUrls: ['./project-list-work-report.component.css'],
  standalone: true,
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
    NzFormModule,
  ],
})
export class ProjectListWorkReportComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  sizeSearch: string = '0';

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) { }

  @ViewChild('tb_projectlistworkreport', { static: false })
  tb_projectListWorkReportContainer!: ElementRef;
  tb_projectListWorkReport: any;
  dataProject: any[] = [];
  projects: any[] = [];
  keyword: string = '';
  totalTime: number = 0;
  projectCode: string = '';

  // Biến lưu tổng từ tất cả dữ liệu (không phân trang)
  totalAllData: {
    count: number;
    sumTimeReality: number;
    sumTotalHours: number;
    totalDays: number;
  } = {
      count: 0,
      sumTimeReality: 0,
      sumTotalHours: 0,
      totalDays: 0,
    };

  ngOnInit() {
    this.getProject();
  }

  //#region Chuyển đổi URLs thành clickable links
  /**
   * Chuyển đổi URLs trong text thành clickable links
   * @param text - Text có thể chứa URLs
   * @returns HTML string với URLs được chuyển thành <a> tags
   */
  private linkifyText(text: string): string {
    // Regex pattern để match URLs (http, https, ftp, www)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    // Escape HTML để tránh XSS
    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Split text thành các phần (text và URLs)
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex
    urlPattern.lastIndex = 0;

    while ((match = urlPattern.exec(text)) !== null) {
      // Thêm text trước URL
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }

      // Xử lý URL
      let url = match[0];
      let href = url;

      // Thêm protocol nếu chưa có
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }

      // Tạo link với target="_blank" để mở tab mới
      parts.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline; cursor: pointer;">${escapeHtml(url)}</a>`);

      lastIndex = match.index + match[0].length;
    }

    // Thêm phần text còn lại
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }

    return parts.join('');
  }
  //#endregion
  //#region Formatter cho các cell
  private textWithTooltipFormatter = (cell: any): HTMLElement => {
    const value = cell.getValue();
    const div = document.createElement('div');

    if (!value || value.trim() === '') {
      return div;
    }

    div.style.cssText = `
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.4em;
      cursor: text;
    `;

    div.innerHTML = this.linkifyText(value);
    div.title = value;

    div.addEventListener('click', (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'A') {
        e.stopPropagation();
      }
    });

    return div;
  };

  //#endregion
  ngAfterViewInit() {
    // Sử dụng setTimeout để đảm bảo container đã render xong (đặc biệt với modal và splitter)
    setTimeout(() => {
      if (this.tb_projectListWorkReportContainer) {
        this.drawTbProjectListWorkReport(this.tb_projectListWorkReportContainer.nativeElement);
        // Trigger load data sau khi khởi tạo bảng
        setTimeout(() => {
          if (this.tb_projectListWorkReport) {
            this.tb_projectListWorkReport.setPage(1);
            // Load tổng từ tất cả dữ liệu sau khi bảng đã được khởi tạo
            this.loadTotalAllData();
          }
        }, 100);
      }
    }, 100);
  }

  drawTbProjectListWorkReport(container: HTMLElement) {
    if (!container) {
      console.error('Container element not found');
      return;
    }

    try {
      this.tb_projectListWorkReport = new Tabulator(container, {
        ...DEFAULT_TABLE_CONFIG,
        height: '100%',
        pagination: true,
        layout: 'fitDataStretch',
        index: 'ID',
        rowHeader: false,
        paginationMode: 'remote',
        paginationSize: 50,
        paginationSizeSelector: [10, 30, 50, 100, 300, 500, 10000],
        selectableRows: false,
        ajaxURL: 'get-project-list-work-report', // Placeholder URL - ajaxRequestFunc sẽ override
        ajaxConfig: 'GET',
        ajaxRequestFunc: (url, config, params) => {
          const request = {
            projectId: this.projectId || 0,
            keyword: this.keyword || '',
            page: params.page || 1,
            size: params.size || 50,
          };

          console.log('Loading project list work report data:', request);

          // Nếu là trang đầu tiên, lấy tổng từ tất cả dữ liệu
          if (request.page === 1) {
            this.loadTotalAllData();
          }

          return this.projectService.getProjectListWorkReport(
            request.projectId,
            request.keyword,
            request.page,
            request.size
          ).toPromise().catch((error) => {
            console.error('Error loading project list work report data:', error);
            this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách báo cáo công việc!');
            throw error;
          });
        },
        ajaxResponse: (url, params, res) => {
          console.log('API Response:', res);
          // API trả về { status: 1, data: [...] } hoặc { status: 1, data: { dt: [...], totalpage: [...] } }
          if (res && res.status === 1 && res.data) {
            // Kiểm tra xem data có phải là array trực tiếp không
            const data = Array.isArray(res.data) ? res.data : (res.data.dt || []);

            // Tính tổng số giờ từ tất cả dữ liệu hiện tại (chỉ trang hiện tại)
            const ttime = data.reduce((sum: number, row: any) => {
              const hours = parseFloat(row.TotalHours) || 0;
              return sum + (isNaN(hours) ? 0 : hours);
            }, 0);
            this.totalTime = ttime / 8;

            // Xử lý totalpage - có thể là array hoặc number
            let totalPage = 1;
            if (res.data && res.data.totalpage) {
              if (Array.isArray(res.data.totalpage)) {
                // Nếu là array, lấy phần tử đầu tiên (có thể là object với property TotalPage hoặc là number)
                totalPage = res.data.totalpage[0]?.TotalPage || res.data.totalpage[0] || 1;
              } else if (typeof res.data.totalpage === 'number') {
                totalPage = res.data.totalpage;
              }
            } else {
              // Nếu API không trả về totalpage, tính dựa trên data length
              // Giả sử nếu data.length < size thì đây là trang cuối
              const pageSize = params.size || 50;
              totalPage = data.length < pageSize ? (params.page || 1) : (params.page || 1) + 1;
            }

            console.log('Processed data:', data.length, 'Total pages:', totalPage);
            return {
              data: data,
              last_page: totalPage,
            };
          }

          // Trường hợp lỗi hoặc response không đúng format
          console.warn('Unexpected response format:', res);
          return {
            data: [],
            last_page: 1,
          };
        },
        columns: [
          {
            title: 'Mã nhân viên',
            field: 'EmployeeCode',
            headerHozAlign: 'center',
            hozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Họ tên',
            field: 'FullName',
            headerHozAlign: 'center',
            frozen: true,
            formatter: function (cell, formatterParams, onRendered) {
              let value = cell.getValue() || '';
              return value;
            },
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            headerHozAlign: 'center',
            frozen: true,
            formatter: function (cell, formatterParams, onRendered) {
              let value = cell.getValue() || '';
              return value;
            },
          },
          {
            title: 'Team',
            field: 'TeamName',
            headerHozAlign: 'center',
            frozen: true,
            formatter: function (cell, formatterParams, onRendered) {
              let value = cell.getValue() || '';
              return value;
            },
          },
          {
            title: 'Ngày',
            field: 'DateReport',
            headerHozAlign: 'center',
            formatter: function (cell, formatterParams, onRendered) {
              let value = cell.getValue() || '';
              value = DateTime.fromISO(value).isValid
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
              return value;
            },
            hozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Nội dung',
            field: 'Content',
            headerHozAlign: 'center',
            formatter: this.textWithTooltipFormatter,
            bottomCalc: () => {
              // Sử dụng tổng từ tất cả dữ liệu
              return this.totalAllData.count;
            },
            bottomCalcFormatter: (cell) => {
              const count = cell.getValue();
              return count > 0 ? `Số báo cáo = ${count}` : '';
            },
          },
          {
            title: 'Số giờ',
            field: 'TimeReality',
            headerHozAlign: 'center',
            hozAlign: 'right',

            formatter: function (cell) {
              const value = cell.getValue();

              // null hoặc undefined → rỗng
              if (value === null || value === undefined) return '';

              const num = Number(value);

              // Không phải số → rỗng
              if (isNaN(num)) return '';

              // Luôn hiển thị 2 chữ số thập phân
              return num.toFixed(2);
            },

            bottomCalc: () => {
              // Sử dụng tổng từ tất cả dữ liệu
              return this.totalAllData.sumTimeReality;
            },

            bottomCalcFormatter: function (cell) {
              const value = cell.getValue();

              if (value === null || value === undefined) return '';

              const num = Number(value);
              if (isNaN(num)) return '';

              return num.toFixed(2);
            },
          },
          {
            title: 'Hệ số',
            field: 'Ratio',
            headerHozAlign: 'center',
            hozAlign: 'right',

            formatter: function (cell) {
              const value = cell.getValue();

              // null / undefined / rỗng → 0.00
              if (value === null || value === undefined || value === '') {
                return '0.00';
              }

              const num = Number(value);

              // Không phải số → 0.00
              if (isNaN(num)) {
                return '0.00';
              }

              return num.toFixed(2);
            },
          },
          {
            title: 'Tổng số giờ',
            field: 'TotalHours',
            headerHozAlign: 'center',
            hozAlign: 'right',

            formatter: function (cell) {
              const value = cell.getValue();

              // null / undefined / rỗng → 0.00
              if (value === null || value === undefined || value === '') {
                return '0.00';
              }

              const num = Number(value);

              // Không phải số → 0.00
              if (isNaN(num)) {
                return '0.00';
              }

              return num.toFixed(2);
            },

            bottomCalc: () => {
              // Sử dụng tổng từ tất cả dữ liệu
              return this.totalAllData.sumTotalHours;
            },

            bottomCalcFormatter: function (cell) {
              const value = cell.getValue();

              if (value === null || value === undefined) {
                return '0.00';
              }

              const num = Number(value);

              if (isNaN(num)) {
                return '0.00';
              }

              return num.toFixed(2);
            },
          },
          {
            title: 'Kết quả',
            field: 'Results',
            headerHozAlign: 'center',
            width: 300,
            formatter: this.textWithTooltipFormatter,
            bottomCalc: () => {
              // Sử dụng tổng số ngày từ tất cả dữ liệu
              return this.totalAllData.totalDays;
            },
            bottomCalcFormatter: (cell: any) => {
              const totalDays = cell.getValue();
              if (totalDays && totalDays > 0) {
                return `Tổng số ngày = ${totalDays.toFixed(1)}`;
              }
              return '';
            },
            hozAlign: 'left',
          },
          {
            title: 'Vấn đề phát sinh',
            field: 'Problem',
            headerHozAlign: 'center',
            formatter: function (cell, formatterParams, onRendered) {
              let value = cell.getValue() || '';
              return value;
            },
          },
          {
            title: 'Giải pháp',
            field: 'ProblemSolve',
            headerHozAlign: 'center',
            formatter: this.textWithTooltipFormatter,
          },
          {
            title: 'Tồn đọng',
            field: 'Backlog',
            headerHozAlign: 'center',
            formatter: this.textWithTooltipFormatter,
          },
          {
            title: 'Kế hoạch ngày tiếp theo',
            field: 'PlanNextDay',
            headerHozAlign: 'left',
            formatter: this.textWithTooltipFormatter,
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            formatter: this.textWithTooltipFormatter,
          },
        ],
      });

      // Thêm event listener cho cellRendered để cho phép text tự động xuống dòng
      this.tb_projectListWorkReport.on('cellRendered', (cell: any) => {
        const cellElement = cell.getElement();
        if (cellElement) {
          cellElement.style.whiteSpace = 'pre-wrap';
          cellElement.style.wordWrap = 'break-word';
          cellElement.style.wordBreak = 'break-word';
          cellElement.style.overflowWrap = 'break-word';
        }
      });

      // Thêm event listener cho column resize để tự động wrap text khi resize
      this.tb_projectListWorkReport.on('columnResized', (column: any) => {
        // Khi resize cột, đảm bảo tất cả các cell trong cột đó có thể wrap text
        const cells = column.getCells();
        cells.forEach((cell: any) => {
          const cellElement = cell.getElement();
          if (cellElement) {
            cellElement.style.whiteSpace = 'pre-wrap';
            cellElement.style.wordWrap = 'break-word';
            cellElement.style.wordBreak = 'break-word';
            cellElement.style.overflowWrap = 'break-word';
          }
        });
      });
    } catch (error) {
      console.error('Error initializing Tabulator:', error);
      this.notification.error('Lỗi', 'Không thể khởi tạo bảng dữ liệu!');
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.projectCode = '';
    this.refreshTable();
  }

  onProjectChange() {
    this.updateProjectCode();
    this.onSearch();
  }

  updateProjectCode() {
    if (this.projectId > 0) {
      const selectedProject = this.projects.find(p => p.ID === this.projectId);
      this.projectCode = selectedProject ? selectedProject.ProjectCode : '';
    } else {
      this.projectCode = '';
    }
  }
  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          this.projects = response.data;
          console.log('dataProject', this.dataProject);
          // Cập nhật projectCode nếu đã có projectId từ @Input
          if (this.projectId > 0) {
            this.updateProjectCode();
          }
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }

  getProjectListWorkReport() {
    this.refreshTable();
  }

  refreshTable() {
    if (this.tb_projectListWorkReport) {
      // Reload data từ trang đầu tiên
      this.tb_projectListWorkReport.setPage(1);
      // Load tổng từ tất cả dữ liệu
      this.loadTotalAllData();
    }
  }
  async exportExcel() {
    const table = this.tb_projectListWorkReport;
    if (!table) return;


    try {
      // Lấy TẤT CẢ dữ liệu (không phân trang) với size rất lớn
      const allDataResponse = await this.projectService.getProjectListWorkReport(
        this.projectId || 0,
        this.keyword || '',
        1, // page = 1
        999999 // size rất lớn để lấy tất cả
      ).toPromise();

      if (!allDataResponse || allDataResponse.status !== 1 || !allDataResponse.data) {
        this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
        return;
      }

      // Xử lý dữ liệu - có thể là array trực tiếp hoặc object với dt
      let allData: any[] = [];
      if (Array.isArray(allDataResponse.data)) {
        allData = allDataResponse.data;
      } else if (allDataResponse.data.dt && Array.isArray(allDataResponse.data.dt)) {
        allData = allDataResponse.data.dt;
      }

      if (allData.length === 0) {
        this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
        return;
      }

      // Tính toán các giá trị bottom từ TẤT CẢ dữ liệu
      const bottomRow: any = {};
      const columns = table.getColumns();

      columns.forEach((col: any) => {
        const colDef = col.getDefinition();
        const field = col.getField();

        if (colDef.bottomCalc) {
          let calcValue: any = null;

          if (colDef.bottomCalc === 'count') {
            calcValue = allData.length;
          } else if (colDef.bottomCalc === 'sum') {
            calcValue = allData.reduce((total: number, row: any) => {
              const value = parseFloat(row[field]) || 0;
              return total + (isNaN(value) ? 0 : value);
            }, 0);
          } else if (typeof colDef.bottomCalc === 'function') {
            // Custom bottomCalc function - tính tổng số ngày từ TotalHours
            if (field === 'Results') {
              const totalHours = allData.reduce((sum: number, row: any) => {
                const hours = parseFloat(row.TotalHours) || 0;
                return sum + (isNaN(hours) ? 0 : hours);
              }, 0);
              calcValue = totalHours / 8.0;
            } else {
              const values = allData.map((row: any) => row[field]);
              calcValue = colDef.bottomCalc(values, allData);
            }
          }

          // Áp dụng bottomCalcFormatter nếu có
          if (colDef.bottomCalcFormatter && calcValue !== null && calcValue !== undefined) {
            const cell = { getValue: () => calcValue };
            bottomRow[field] = colDef.bottomCalcFormatter(cell);
          } else if (calcValue !== null && calcValue !== undefined) {
            // Nếu không có formatter, format số nếu là số
            if (typeof calcValue === 'number') {
              bottomRow[field] = calcValue.toFixed(2);
            } else {
              bottomRow[field] = calcValue;
            }
          } else {
            bottomRow[field] = '';
          }
        } else {
          bottomRow[field] = '';
        }
      });

      // Thêm dòng bottom vào data
      const dataWithBottom = [...allData, bottomRow];

      // Tạo tên file với format: projectCode_ddmmyyyy
      const today = DateTime.now();
      const dateStr = today.toFormat('ddMMyyyy');
      const projectCode = this.projectCode || 'ALL';
      const fileName = `${projectCode}_${dateStr}`;

      // Xuất Excel với tất cả dữ liệu
      // ================= EXPORT EXCEL LOCAL =================
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo cáo công việc');
      /* ===== HEADER ===== */
      const headers = columns.map((col: any) => col.getDefinition().title);
      worksheet.addRow(headers);

      /* ===== DATA + BOTTOM ===== */
      dataWithBottom.forEach((row: any, index: number) => {
        const rowData = columns.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          return value;
        });

        const excelRow = worksheet.addRow(rowData);

        // Style bottom row
        if (index === dataWithBottom.length - 1) {
          excelRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD3D3D3' },
            };
            cell.alignment = {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            };
          });
        }
      });

      /* ===== FORMAT DATE ===== */
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell) => {
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      });

      /* ===== AUTO WIDTH ===== */
      worksheet.columns.forEach((column: any) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length + 2);
        });
        column.width = maxLength;
      });

      /* ===== FIX WIDTH + WRAP TEXT ===== */
      const fixedWidths: { [field: string]: number } = {
        Content: 50,
        Results:50,
        DateReport: 15,
        Note: 50,
        Backlog:40,
        Problem:40,
        ProblemSolve:40,
        PlanNextDay:40,
      };

      columns.forEach((col: any, index: number) => {
        const field = col.getField();
        if (fixedWidths[field]) {
          const excelCol = worksheet.getColumn(index + 1);
          excelCol.width = fixedWidths[field];
          excelCol.alignment = {
            wrapText: true,
            vertical: 'top',
          };
        }
      });

      /* ===== WRAP ALL ===== */
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = {
            ...(cell.alignment || {}),
            wrapText: true,
            vertical: 'middle',
          };
        });
      });

      /* ===== FILTER ===== */
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };

      /* ===== EXPORT FILE ===== */
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${fileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      // =====================================================
      this.notification.success('Thông báo', `Đã xuất Excel thành công với ${allData.length} bản ghi!`);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel! ' + (error?.message || ''));
    }
  }
  // async exportExcel() {
  //   const table = this.tb_projectListWorkReport;
  //   if (!table) return;

  //   const data = table.getData();
  //   if (!data || data.length === 0) {
  //     this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
  //     return;
  //   }

  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Danh sách báo cáo công việc');

  //   const columns = table.getColumns();

  //   /* ================= HEADER ================= */
  //   const headers = columns.map((col: any) => col.getDefinition().title);
  //   worksheet.addRow(headers);

  //   /* ================= DATA + BOTTOM ================= */
  //   data.forEach((row: any) => {
  //     const rowData = columns.map((col: any) => {
  //       const field = col.getField();
  //       let value = row[field];

  //       if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
  //         value = new Date(value);
  //       }

  //       return value;
  //     });

  //     worksheet.addRow(rowData);
  //   });

  //   /* ================= FORMAT DATE ================= */
  //   worksheet.eachRow((row, rowNumber) => {
  //     if (rowNumber === 1) return;
  //     row.eachCell((cell) => {
  //       if (cell.value instanceof Date) {
  //         cell.numFmt = 'dd/mm/yyyy';
  //       }
  //     });
  //   });

  //   /* ================= AUTO WIDTH ================= */
  //   worksheet.columns.forEach((column: any) => {
  //     let maxLength = 10;
  //     column.eachCell({ includeEmpty: true }, (cell: any) => {
  //       const cellValue = cell.value ? cell.value.toString() : '';
  //       maxLength = Math.max(maxLength, cellValue.length + 2);
  //     });
  //     column.width = maxLength;
  //   });

  //   /* ================= FIX WIDTH + WRAP ================= */
  //   const fixedWidths: { [field: string]: number } = {
  //     Results: 40,
  //   };

  //   columns.forEach((col: any, index: number) => {
  //     const field = col.getField();
  //     if (fixedWidths[field]) {
  //       const excelCol = worksheet.getColumn(index + 1);
  //       excelCol.width = fixedWidths[field];
  //       excelCol.alignment = {
  //         wrapText: true,
  //         vertical: 'top',
  //       };
  //     }
  //   });

  //   /* ================= WRAP ALL (OPTIONAL) ================= */
  //   worksheet.eachRow((row) => {
  //     row.eachCell((cell) => {
  //       cell.alignment = {
  //         ...(cell.alignment || {}),
  //         wrapText: true,
  //         vertical: 'middle',
  //       };
  //     });
  //   });

  //   /* ================= FILTER ================= */
  //   worksheet.autoFilter = {
  //     from: { row: 1, column: 1 },
  //     to: { row: 1, column: columns.length },
  //   };

  //   /* ================= EXPORT FILE ================= */
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   const blob = new Blob([buffer], {
  //     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   });

  //   const today = new Date();
  //   const dateStr = today
  //     .toISOString()
  //     .slice(2, 10)
  //     .split('-')
  //     .reverse()
  //     .join('');

  //   const fileName = `${this.projectCode || 'ALL'}_${dateStr}.xlsx`;

  //   const link = document.createElement('a');
  //   link.href = window.URL.createObjectURL(blob);
  //   link.download = fileName;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   window.URL.revokeObjectURL(link.href);
  // }
  onClose() {
    this.activeModal.close(true); // đóng modal và trả dữ liệu về
  }
  changeProject() {
    let selectedRows = this.tb_projectListWorkReport.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (this.projectId <= 0) {
      this.notification.error('', 'Vui lòng chọn dự án!');
      return;
    }

    if (selectedIDs.length <= 0) {
      this.notification.error('', 'Vui lòng chọn báo cáo cần chuyển dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectIdOld = this.projectId;
    modalRef.componentInstance.reportIds = selectedIDs;
    modalRef.componentInstance.disable = true;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getProjectListWorkReport();
      }
    });
  }
  onSearch() {
    this.getProjectListWorkReport();
  }

  //#region Load tổng từ tất cả dữ liệu
  loadTotalAllData() {
    // Gọi API với size rất lớn để lấy tất cả dữ liệu
    this.projectService.getProjectListWorkReport(
      this.projectId || 0,
      this.keyword || '',
      1, // page = 1
      999999 // size rất lớn để lấy tất cả
    ).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          // Xử lý dữ liệu - có thể là array trực tiếp hoặc object với dt
          let allData: any[] = [];
          if (Array.isArray(response.data)) {
            allData = response.data;
          } else if (response.data.dt && Array.isArray(response.data.dt)) {
            allData = response.data.dt;
          }

          // Tính tổng từ tất cả dữ liệu
          this.totalAllData = {
            count: allData.length,
            sumTimeReality: allData.reduce((sum: number, row: any) => {
              const value = parseFloat(row.TimeReality) || 0;
              return sum + (isNaN(value) ? 0 : value);
            }, 0),
            sumTotalHours: allData.reduce((sum: number, row: any) => {
              const value = parseFloat(row.TotalHours) || 0;
              return sum + (isNaN(value) ? 0 : value);
            }, 0),
            totalDays: 0, // Sẽ tính sau
          };

          // Tính tổng số ngày = tổng giờ / 8
          this.totalAllData.totalDays = this.totalAllData.sumTotalHours / 8.0;

          // Cập nhật bottom của bảng
          if (this.tb_projectListWorkReport) {
            this.tb_projectListWorkReport.recalc();
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading total all data:', error);
        // Reset về 0 nếu có lỗi
        this.totalAllData = {
          count: 0,
          sumTimeReality: 0,
          sumTotalHours: 0,
          totalDays: 0,
        };
      },
    });
  }
  //#endregion
}

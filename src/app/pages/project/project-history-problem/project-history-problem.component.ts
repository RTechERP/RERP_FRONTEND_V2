import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectHistoryProblemService } from './project-history-problem-service/project-history-problem.service';
import { ProjectWorkerService } from '../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectService } from '../project-service/project.service';

@Component({
  selector: 'app-project-history-problem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzSpinModule,
    NzSplitterModule,
  ],
  templateUrl: './project-history-problem.component.html',
  styleUrl: './project-history-problem.component.css'
})
export class ProjectHistoryProblemComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCode: string = '';

  // Bảng 1: Lịch sử phát sinh
  @ViewChild('tb_history', { static: false }) tb_historyElement!: ElementRef;
  tb_history: any;
  dataHistory: any[] = [];
  nextRowIdHistory: number = 0;
  deletedIdsHistory: number[] = [];
  isLoadHistory: boolean = false;
  originalHistoryData: Map<number, any> = new Map(); // Track original data để so sánh
  changedHistoryRows: Set<number> = new Set(); // Track các dòng đã thay đổi

  // Bảng 2: Chi tiết phát sinh
  @ViewChild('tb_detail', { static: false }) tb_detailElement!: ElementRef;
  tb_detail: any;
  dataDetail: any[] = [];
  nextRowIdDetail: number = 0;
  deletedIdsDetail: number[] = [];
  isLoadDetail: boolean = false;
  selectedHistoryRow: any = null; // Row được chọn từ bảng 1
  originalDetailData: Map<number, any> = new Map(); // Track original data để so sánh
  changedDetailRows: Set<number> = new Set(); // Track các dòng đã thay đổi
  deletedDetailHistoryIdMap: Map<number, number> = new Map(); // Map detailId -> historyId khi xóa

  // Dropdown data
  cbbStatus: any[] = [
    { id: 1, name: "Phát sinh lỗi" },
    { id: 2, name: "Không phát sinh lỗi" },
    { id: 3, name: "Đang xử lý" },
    { id: 4, name: "Đã xử lý" },
    { id: 5, name: "Phát sinh mới" },
  ];

  cbbEmployee: any[] = [];

  projectInfo: any = null; // Lưu thông tin project để lấy projectCode và CreatedDate

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private projectHistoryProblemService: ProjectHistoryProblemService,
    private projectWorkerService: ProjectWorkerService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadProjectInfo();
    this.loadData();
  }

  // Load thông tin project để lấy projectCode và CreatedDate
  loadProjectInfo(): void {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          if (response.status === 1 && response.data) {
            this.projectInfo = response.data;
            this.projectCode = this.projectInfo.ProjectCode || this.projectCode;
          }
        },
        error: (error: any) => {
          console.error('Error loading project info:', error);
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.drawTbHistory(this.tb_historyElement!.nativeElement);
    this.drawTbDetail(this.tb_detailElement!.nativeElement);
  }

  loadData(): void {
    if (this.projectId <= 0) {
      this.dataHistory = [];
      this.dataDetail = [];
      return;
    }

    this.isLoadHistory = true;
    this.projectHistoryProblemService.getDataHistoryProblem(this.projectId).subscribe({
      next: (response: any) => {
        this.isLoadHistory = false;
        if (response.status === 1) {
          // API trả về { dtMaster: [], dtDetail: [] }
          let responseData = response.data;
          
          // Xử lý dtMaster (bảng lịch sử phát sinh)
          let dtMaster = responseData?.dtMaster;
          if (!dtMaster) {
            this.dataHistory = [];
          } else if (Array.isArray(dtMaster)) {
            // Map dữ liệu từ API vào format của bảng
            this.dataHistory = dtMaster.map((item: any) => this.mapMasterDataToTable(item));
          } else {
            this.dataHistory = [];
          }
          
          // Xử lý dtDetail (bảng chi tiết phát sinh) - lưu tạm để dùng sau
          let dtDetail = responseData?.dtDetail;
          // dtDetail sẽ được load khi chọn row từ bảng master hoặc gọi API get-data-detail
          
          // Cập nhật dữ liệu vào bảng
          if (this.tb_history) {
            this.tb_history.setData(this.dataHistory);
            // Lưu original data để track thay đổi
            this.originalHistoryData.clear();
            this.changedHistoryRows.clear();
            this.dataHistory.forEach((item: any) => {
              if (item.ID > 0) {
                this.originalHistoryData.set(item.ID, JSON.parse(JSON.stringify(item)));
              }
            });
          }
          
          // Nếu có dữ liệu và chưa chọn row nào, tự động chọn row đầu tiên
          if (this.dataHistory && this.dataHistory.length > 0 && !this.selectedHistoryRow) {
            setTimeout(() => {
              const firstRow = this.tb_history.getRowFromPosition(1);
              if (firstRow) {
                firstRow.select();
                const data = firstRow.getData();
                this.selectedHistoryRow = firstRow;
                this.loadDetailByHistoryId(data.ID || 0);
              }
            }, 100);
          }
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu lịch sử phát sinh!');
          this.dataHistory = [];
          if (this.tb_history) {
            this.tb_history.setData([]);
          }
        }
      },
      error: (error) => {
        this.isLoadHistory = false;
        console.error('Error loading history problem:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu lịch sử phát sinh!');
        this.dataHistory = [];
        if (this.tb_history) {
          this.tb_history.setData([]);
        }
      },
    });
  }

  // Map dữ liệu từ API (dtMaster) vào format của bảng
  mapMasterDataToTable(item: any): any {
    return {
      ID: item.ID || 0,
      STT: item.STT || 1,
      ProblemType: item.TypeProblem || '', // TypeProblem -> ProblemType (string text)
      ErrorContent: item.ContentError || '', // ContentError -> ErrorContent
      Reason: item.Reason || '',
      Solution: item.Remedies || '', // Remedies -> Solution
      Method: item.TestMethod || '', // TestMethod -> Method
      Image: item.Image || '',
      ProblemDate: item.DateProblem || null, // DateProblem -> ProblemDate
      ExecuteDate: item.DateImplementation || null, // DateImplementation -> ExecuteDate
      PIC: item.PIC || '',
      ProjectID: item.ProjectID || this.projectId,
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
      CreatedBy: item.CreatedBy || '',
      CreatedDate: item.CreatedDate || null,
      UpdatedBy: item.UpdatedBy || '',
      UpdatedDate: item.UpdatedDate || null,
    };
  }

  // ========== BẢNG 1: LỊCH SỬ PHÁT SINH ==========
  drawTbHistory(container: HTMLElement): void {
    this.tb_history = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      layout: 'fitData',
      selectableRows: 1,
      height: '100%',
      rowHeader:false,
      data: this.dataHistory,
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-white cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addHistoryRow();
          },
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return '';
            }
            return `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`;
          },
          cellClick: (e: any, cell: any) => {
            const row = cell.getRow();
            const data = row.getData();
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            
            this.modal.confirm({
              nzTitle: 'Xác nhận xóa',
              nzContent: `Bạn có chắc chắn muốn xóa dòng này?`,
              nzOkText: 'Xóa',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                const id = data.ID;
                if (id > 0) {
                  this.deletedIdsHistory.push(id);
                  // Track dòng bị xóa
                  this.changedHistoryRows.add(id);
                } else {
                  // Dòng mới chưa lưu - chỉ cần xóa khỏi bảng
                  this.changedHistoryRows.delete(id);
                }
                row.delete();
                // Cập nhật lại STT
                setTimeout(() => {
                  this.updateSTT(this.tb_history);
                }, 100);
              }
            });
          }
        },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          width: 80,
          editor: 'input',
          formatter: (cell: any) => {
            return cell.getValue() || '';
          }
        },
        {
          title: 'Loại',
          field: 'ProblemType',
          hozAlign: 'left',
          width: 150,
          editor: 'input',
          formatter: (cell: any) => {
            return cell.getValue() || '';
          }
        },
        {
          title: 'Nội dung lỗi',
          field: 'ErrorContent',
          hozAlign: 'left',
          width: 300,
          editor: 'input',
          formatter: 'textarea'
        },
        {
          title: 'Nguyên nhân',
          field: 'Reason',
          hozAlign: 'left',
          width: 300,
          editor: 'input',
          formatter: 'textarea'
        },
        {
          title: 'Biện pháp khắc phục',
          field: 'Solution',
          hozAlign: 'left',
          width: 300,
          editor: 'input',
          formatter: 'textarea'
        },
        {
          title: 'Phương pháp kiểm tra',
          field: 'Method',
          hozAlign: 'left',
          width: 300,
          editor: 'input',
          formatter: 'textarea'
        },
        {
          title: 'Hình ảnh',
          field: 'Image',
          hozAlign: 'left',
          width: 200,
          formatter: (cell: any) => {
            const row = cell.getRow();
            const fileName = cell.getValue() || '';
            const filePath = fileName;
            const isLink = filePath && filePath.trim() !== '';
            return `
              <div style="display: flex; align-items: flex-start; gap: 5px; width: 100%; position: relative;">
                <span 
                  class="${isLink ? 'file-link' : ''}" 
                  style="flex: 1; word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word; min-width: 0; padding-right: 25px; ${isLink ? 'color: #1890ff; text-decoration: underline; cursor: pointer;' : ''}"
                  title="${isLink ? 'Click để tải xuống' : ''}"
                >${fileName}</span>
                <button class="btn btn-sm btn-link p-0" style="font-size: 0.75rem; color:color:rgb(213, 210, 19); flex-shrink: 0; position: absolute; right: 0; top: 0;" title="Chọn file">
                  <i class="fas fa-folder-open"></i>
                </button>
              </div>
            `;
          },
          cellClick: (e: any, cell: any) => {
            const target = e.target as HTMLElement;
            const row = cell.getRow();
            const rowData = row.getData();
            const filePath = rowData.Image || '';
            
            // Nếu click vào icon folder hoặc button, mở file selector
            if (target.classList.contains('fa-folder-open') || target.closest('.fa-folder-open') || target.closest('button')) {
              e.stopPropagation();
              this.openFileSelectorForImage(row);
              return;
            }
            
            // Nếu click vào tên file (span có class file-link) và có đường dẫn, tải xuống
            const clickedSpan = target.closest('.file-link');
            if (filePath && filePath.trim() !== '' && clickedSpan && !target.closest('button')) {
              e.stopPropagation();
              this.downloadImage(filePath);
            }
          }
        },
        {
          title: 'Ngày phát sinh',
          field: 'ProblemDate',
          hozAlign: 'center',
          width: 150,
          editor: this.dateEditor.bind(this),
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
          }
        },
        {
          title: 'Ngày thực hiện',
          field: 'ExecuteDate',
          hozAlign: 'center',
          width: 150,
          editor: this.dateEditor.bind(this),
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
          }
        },
        {
          title: 'PIC',
          field: 'PIC',
          hozAlign: 'center',
          width: 200,
          editor: 'input',
          formatter: (cell: any) => {
            return cell.getValue() || '';
          }
        }
      ]
    });

    // Lưu row được chọn
    this.tb_history.on('rowClick', (e: any, row: any) => {
      this.selectedHistoryRow = row;
      const data = row.getData();
      // Load chi tiết phát sinh cho row được chọn
      this.loadDetailByHistoryId(data.ID || 0);
    });

    // Update dataHistory when cell is edited
    this.tb_history.on('cellEdited', (cell: any) => {
      const row = cell.getRow();
      const rowData = row.getData();
      const rowId = rowData.ID || 0;
      
      // Track dòng đã thay đổi
      if (rowId > 0) {
        // Dòng đã tồn tại - so sánh với original
        const original = this.originalHistoryData.get(rowId);
        if (original) {
          // Có thay đổi so với original
          this.changedHistoryRows.add(rowId);
        }
      } else {
        // Dòng mới - luôn track
        this.changedHistoryRows.add(rowId);
      }
      
      this.dataHistory = this.tb_history.getData();
    });
  }

  // ========== BẢNG 2: CHI TIẾT PHÁT SINH ==========
  drawTbDetail(container: HTMLElement): void {
    this.tb_detail = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      layout: 'fitDataStretch',
      height: '100%',
      data: this.dataDetail,
      rowHeader:false,
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-white cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addDetailRow();
          },
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return '';
            }
            return `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`;
          },
          cellClick: (e: any, cell: any) => {
            const row = cell.getRow();
            const data = row.getData();
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            
            this.modal.confirm({
              nzTitle: 'Xác nhận xóa',
              nzContent: `Bạn có chắc chắn muốn xóa dòng này?`,
              nzOkText: 'Xóa',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                const id = data.ID;
                const historyId = data.HistoryID || data.ProjectHistoryProblemID || 0;
                if (id > 0) {
                  this.deletedIdsDetail.push(id);
                  // Lưu mapping detailId -> historyId để xử lý sau
                  this.deletedDetailHistoryIdMap.set(id, historyId);
                  // Track dòng bị xóa
                  this.changedDetailRows.add(id);
                } else {
                  // Dòng mới chưa lưu - chỉ cần xóa khỏi bảng
                  this.changedDetailRows.delete(id);
                }
                row.delete();
                // Cập nhật lại STT
                setTimeout(() => {
                  this.updateSTT(this.tb_detail);
                }, 100);
              }
            });
          }
        },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          width: 80,
          editor: 'input',
          formatter: (cell: any) => {
            return cell.getValue() || '';
          }
        },
        {
          title: 'Mô tả',
          field: 'Description',
          hozAlign: 'left',
          width: 400,
          editor: 'input',
          formatter: 'textarea'
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'center',
          width: 150,
          editor: this.statusEditor.bind(this),
          formatter: (cell: any) => {
            const val = cell.getValue();
            const status = this.cbbStatus.find((s: any) => s.id === val);
            return status ? status.name : '';
          }
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          width: 300,
          editor: 'input',
          formatter: 'textarea'
        }
      ]
    });

    // Update dataDetail when cell is edited
    this.tb_detail.on('cellEdited', (cell: any) => {
      const row = cell.getRow();
      const rowData = row.getData();
      const rowId = rowData.ID || 0;
      
      // Track dòng đã thay đổi
      if (rowId > 0) {
        // Dòng đã tồn tại - so sánh với original
        const original = this.originalDetailData.get(rowId);
        if (original) {
          // Có thay đổi so với original
          this.changedDetailRows.add(rowId);
        }
      } else {
        // Dòng mới - luôn track
        this.changedDetailRows.add(rowId);
      }
      
      this.dataDetail = this.tb_detail.getData();
    });
  }

  // ========== CÁC CHỨC NĂNG CHUNG ==========
  problemTypeEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.height = '100%';
    select.style.border = '1px solid #ccc';
    select.style.outline = 'none';
    select.style.padding = '4px';

    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Chọn...';
    select.appendChild(emptyOption);

    // Add data options
    

    onRendered(() => {
      select.focus();
      select.style.height = '100%';
    });

    select.addEventListener('change', () => {
      success(select.value ? parseInt(select.value) : null);
    });

    select.addEventListener('blur', () => {
      success(select.value ? parseInt(select.value) : null);
    });

    select.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        success(select.value ? parseInt(select.value) : null);
      }
      if (e.key === 'Escape') {
        cancel();
      }
    });

    return select;
  }

  statusEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.height = '100%';
    select.style.border = '1px solid #ccc';
    select.style.outline = 'none';
    select.style.padding = '4px';

    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Chọn...';
    select.appendChild(emptyOption);

    // Add data options
    this.cbbStatus.forEach((item: any) => {
      const option = document.createElement('option');
      option.value = item.id.toString();
      option.textContent = item.name;
      const cellValue = cell.getValue();
      if (cellValue === item.id || cellValue === item.id.toString()) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    onRendered(() => {
      select.focus();
      select.style.height = '100%';
    });

    select.addEventListener('change', () => {
      success(select.value ? parseInt(select.value) : null);
    });

    select.addEventListener('blur', () => {
      success(select.value ? parseInt(select.value) : null);
    });

    select.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        success(select.value ? parseInt(select.value) : null);
      }
      if (e.key === 'Escape') {
        cancel();
      }
    });

    return select;
  }

  dateEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'date';
    
    const currentValue = cell.getValue();
    if (currentValue) {
      let dateValue = '';
      if (currentValue instanceof Date) {
        dateValue = DateTime.fromJSDate(currentValue).toFormat('yyyy-MM-dd');
      } else if (typeof currentValue === 'string') {
        const dt = DateTime.fromISO(currentValue);
        if (dt.isValid) {
          dateValue = dt.toFormat('yyyy-MM-dd');
        }
      }
      input.value = dateValue;
    }

    onRendered(() => input.focus());

    input.addEventListener('change', () => {
      if (input.value) {
        const dt = DateTime.fromFormat(input.value, 'yyyy-MM-dd');
        if (dt.isValid) {
          success(dt.toISO());
        } else {
          success(input.value);
        }
      } else {
        success(null);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (input.value) {
          const dt = DateTime.fromFormat(input.value, 'yyyy-MM-dd');
          if (dt.isValid) {
            success(dt.toISO());
          } else {
            success(input.value);
          }
        } else {
          success(null);
        }
      }
      if (e.key === 'Escape') {
        cancel();
      }
    });

    return input;
  }

  // Thêm dòng vào bảng 1
  addHistoryRow(): void {
    this.nextRowIdHistory = this.nextRowIdHistory - 1;
    const currentData = this.tb_history ? this.tb_history.getData() : this.dataHistory;
    const maxSTT = this.getMaxSTT(currentData);
    
    const newRow = {
      ID: this.nextRowIdHistory,
      STT: maxSTT + 1,
      ProblemType: '',
      ErrorContent: '',
      Reason: '',
      Solution: '',
      Method: '',
      Image: '',
      ProblemDate: null,
      ExecuteDate: null,
      PIC: '',
      IsDeleted: false
    };

    if (this.tb_history) {
      this.tb_history.addRow(newRow).then(() => {
        const row = this.tb_history.getRow(this.nextRowIdHistory);
        if (row) {
          row.select();
          row.scrollTo();
          // Track dòng mới
          this.changedHistoryRows.add(this.nextRowIdHistory);
          // Update dataHistory array
          this.dataHistory = this.tb_history.getData();
        }
      });
    } else {
      this.dataHistory.push(newRow);
      this.changedHistoryRows.add(this.nextRowIdHistory);
    }
  }

  // Thêm dòng vào bảng 2
  addDetailRow(): void {
    if (!this.selectedHistoryRow) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng từ bảng lịch sử phát sinh trước!');
      return;
    }

    const historyData = this.selectedHistoryRow.getData();
    
    // Validate: Master phải đã lưu (ID > 0)
    // Nếu ID <= 0 (dòng mới chưa lưu), báo lỗi
    if (!historyData.ID || historyData.ID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng lưu lịch sử phát sinh trước!');
      return;
    }

    this.nextRowIdDetail = this.nextRowIdDetail - 1;
    const currentData = this.tb_detail ? this.tb_detail.getData() : this.dataDetail;
    const maxSTT = this.getMaxSTT(currentData);
    
    const newRow = {
      ID: this.nextRowIdDetail,
      HistoryID: historyData.ID || 0,
      ProjectHistoryProblemID: historyData.ID || 0, // Field cho API
      STT: maxSTT + 1,
      Description: '',
      Status: null,
      Note: '',
      IsDeleted: false
    };

    if (this.tb_detail) {
      this.tb_detail.addRow(newRow).then(() => {
        const row = this.tb_detail.getRow(this.nextRowIdDetail);
        if (row) {
          row.scrollTo();
          // Track dòng mới
          this.changedDetailRows.add(this.nextRowIdDetail);
          // Update dataDetail array
          this.dataDetail = this.tb_detail.getData();
        }
      });
    } else {
      this.dataDetail.push(newRow);
      this.changedDetailRows.add(this.nextRowIdDetail);
    }
  }

  // Lấy STT lớn nhất
  getMaxSTT(data: any[]): number {
    if (!data || data.length === 0) return 0;
    const sttValues = data
      .map((item: any) => parseInt(item.STT, 10))
      .filter((stt: number) => !isNaN(stt) && stt > 0);
    return sttValues.length > 0 ? Math.max(...sttValues) : 0;
  }

  // Cập nhật lại STT
  updateSTT(table: any): void {
    if (!table) return;
    const rows = table.getRows();
    rows.forEach((row: any, index: number) => {
      row.update({ STT: index + 1 });
    });
  }

  // Load chi tiết theo HistoryID
  loadDetailByHistoryId(historyId: number): void {
    if (!historyId || historyId <= 0) {
      this.dataDetail = [];
      if (this.tb_detail) {
        this.tb_detail.setData([]);
      }
      return;
    }

    this.isLoadDetail = true;
    this.projectHistoryProblemService.getDataHistoryProblemDetail(historyId).subscribe({
      next: (response: any) => {
        this.isLoadDetail = false;
        if (response.status === 1) {
          let detailData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!detailData) {
            this.dataDetail = [];
          } else if (Array.isArray(detailData)) {
            this.dataDetail = detailData;
          } else if (typeof detailData === 'object') {
            if (detailData.constructor === Object && Object.keys(detailData).length > 0) {
              this.dataDetail = [detailData];
            } else {
              this.dataDetail = [];
            }
          } else {
            this.dataDetail = [];
          }
          
          // Cập nhật dữ liệu vào bảng
          if (this.tb_detail) {
            this.tb_detail.setData(this.dataDetail);
            // Lưu original data để track thay đổi
            this.originalDetailData.clear();
            this.changedDetailRows.clear();
            this.dataDetail.forEach((item: any) => {
              if (item.ID > 0) {
                this.originalDetailData.set(item.ID, JSON.parse(JSON.stringify(item)));
              }
            });
          }
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu chi tiết phát sinh!');
          this.dataDetail = [];
          if (this.tb_detail) {
            this.tb_detail.setData([]);
          }
        }
      },
      error: (error) => {
        this.isLoadDetail = false;
        console.error('Error loading detail:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu chi tiết phát sinh!');
        this.dataDetail = [];
        if (this.tb_detail) {
          this.tb_detail.setData([]);
        }
      },
    });
  }

  // Xuất Excel
  exportExcel(): void {
    if (!this.tb_history || !this.tb_detail) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }

    const historyData = this.tb_history.getData();
    const detailData = this.tb_detail.getData();

    if ((!historyData || historyData.length === 0) && (!detailData || detailData.length === 0)) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Lịch sử phát sinh
    if (historyData && historyData.length > 0) {
      const wsHistory = workbook.addWorksheet('Lịch sử phát sinh');
      
      const historyColumns = [
        { header: 'STT', key: 'STT', width: 10 },
        { header: 'Loại', key: 'ProblemType', width: 20 },
        { header: 'Nội dung lỗi', key: 'ErrorContent', width: 40 },
        { header: 'Nguyên nhân', key: 'Reason', width: 40 },
        { header: 'Biện pháp khắc phục', key: 'Solution', width: 40 },
        { header: 'Phương pháp khắc phục', key: 'Method', width: 40 },
        { header: 'Hình ảnh', key: 'Image', width: 30 },
        { header: 'Ngày phát sinh', key: 'ProblemDate', width: 15 },
        { header: 'Ngày thực hiện', key: 'ExecuteDate', width: 15 },
        { header: 'PIC', key: 'PIC', width: 20 }
      ];

      wsHistory.columns = historyColumns;

      // Header style
      wsHistory.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      wsHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      wsHistory.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Data
      historyData.forEach((row: any, index: number) => {
        const wsRow = wsHistory.addRow({
          STT: row.STT || index + 1,
          ProblemType: row.ProblemType || '',
          ErrorContent: row.ErrorContent || '',
          Reason: row.Reason || '',
          Solution: row.Solution || '',
          Method: row.Method || '',
          Image: row.Image || '',
          ProblemDate: row.ProblemDate ? this.formatDateForExcel(row.ProblemDate) : '',
          ExecuteDate: row.ExecuteDate ? this.formatDateForExcel(row.ExecuteDate) : '',
          PIC: row.PIC || ''
        });

        // Format date columns
        if (row.ProblemDate) {
          wsRow.getCell('ProblemDate').numFmt = 'dd/mm/yyyy';
        }
        if (row.ExecuteDate) {
          wsRow.getCell('ExecuteDate').numFmt = 'dd/mm/yyyy';
        }
      });

      // Thêm dòng bottom calculation nếu có
      const historyBottomRow = this.calculateBottomRow(this.tb_history, historyData);
      if (historyBottomRow && Object.keys(historyBottomRow).length > 0) {
        const bottomRow = wsHistory.addRow({
          STT: historyBottomRow.STT || '',
          ProblemType: historyBottomRow.ProblemType || '',
          ErrorContent: historyBottomRow.ErrorContent || '',
          Reason: historyBottomRow.Reason || '',
          Solution: historyBottomRow.Solution || '',
          Method: historyBottomRow.Method || '',
          Image: historyBottomRow.Image || '',
          ProblemDate: historyBottomRow.ProblemDate || '',
          ExecuteDate: historyBottomRow.ExecuteDate || '',
          PIC: historyBottomRow.PIC || ''
        });

        // Style cho dòng bottom
        bottomRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }, // Light grey background
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      }
    }

    // Sheet 2: Chi tiết phát sinh
    if (detailData && detailData.length > 0) {
      const wsDetail = workbook.addWorksheet('Chi tiết phát sinh');
      
      const detailColumns = [
        { header: 'STT', key: 'STT', width: 10 },
        { header: 'Mô tả', key: 'Description', width: 50 },
        { header: 'Trạng thái', key: 'Status', width: 20 },
        { header: 'Ghi chú', key: 'Note', width: 40 }
      ];

      wsDetail.columns = detailColumns;

      // Header style
      wsDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      wsDetail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      wsDetail.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Data
      detailData.forEach((row: any, index: number) => {
        wsDetail.addRow({
          STT: row.STT || index + 1,
          Description: row.Description || '',
          Status: this.getStatusName(row.Status),
          Note: row.Note || ''
        });
      });

      // Thêm dòng bottom calculation nếu có
      const detailBottomRow = this.calculateBottomRow(this.tb_detail, detailData);
      if (detailBottomRow && Object.keys(detailBottomRow).length > 0) {
        const bottomRow = wsDetail.addRow({
          STT: detailBottomRow.STT || '',
          Description: detailBottomRow.Description || '',
          Status: detailBottomRow.Status || '',
          Note: detailBottomRow.Note || ''
        });

        // Style cho dòng bottom
        bottomRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }, // Light grey background
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      }
    }

    // Xuất file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LichSuPhatSinh_${this.projectCode || 'DuAn'}_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.notification.success('Thành công', 'Xuất Excel thành công!');
    }).catch((error) => {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel!');
    });
  }

  // Tính toán các giá trị bottom calculation
  calculateBottomRow(table: any, data: any[]): any {
    if (!table || !data || data.length === 0) {
      return {};
    }

    const bottomRow: any = {};
    const columns = table.getColumns();

    columns.forEach((col: any) => {
      const colDef = col.getDefinition();
      const field = col.getField();

      if (!field || field === 'addRow') {
        bottomRow[field] = '';
        return;
      }

      if (colDef.bottomCalc) {
        let calcValue: any = null;

        if (colDef.bottomCalc === 'count') {
          calcValue = data.length;
        } else if (colDef.bottomCalc === 'sum') {
          calcValue = data.reduce((total: number, row: any) => {
            const value = parseFloat(row[field]) || 0;
            return total + (isNaN(value) ? 0 : value);
          }, 0);
        } else if (typeof colDef.bottomCalc === 'function') {
          const values = data.map((row: any) => row[field]);
          calcValue = colDef.bottomCalc(values, data);
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

    return bottomRow;
  }

  getStatusName(id: number | null): string {
    if (!id) return '';
    const status = this.cbbStatus.find((s: any) => s.id === id);
    return status ? status.name : '';
  }

  formatDateForExcel(date: string | Date): Date | null {
    if (!date) return null;
    try {
      const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date as Date);
      if (dt.isValid) {
        return dt.toJSDate();
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    return null;
  }

  // Validate dữ liệu theo backend
  validateData(historyData: any[]): { isValid: boolean; message: string } {
    for (let i = 0; i < historyData.length; i++) {
      const item = historyData[i];
      const rowNumber = i + 1;

      // Validate TypeProblem (ProblemType -> TypeProblem)
      if (!item.ProblemType || item.ProblemType === null || item.ProblemType === '') {
        return { 
          isValid: false, 
          message: `Vui lòng nhập Loại cho dòng thứ [${rowNumber}]` 
        };
      }

      // Validate ContentError (ErrorContent -> ContentError)
      if (!item.ErrorContent || item.ErrorContent.trim() === '') {
        return { 
          isValid: false, 
          message: `Vui lòng nhập Nội dung cho dòng thứ [${rowNumber}]` 
        };
      }

      // Validate Reason
      if (!item.Reason || item.Reason.trim() === '') {
        return { 
          isValid: false, 
          message: `Vui lòng nhập Nguyên nhân cho dòng thứ [${rowNumber}]` 
        };
      }
    }
    return { isValid: true, message: '' };
  }

  // Map dữ liệu từ bảng về format API - gửi tất cả dữ liệu hiện tại
  mapTableDataToApiFormat(historyData: any[], detailData: any[]): any[] {
    const result: any[] = [];

    // Tách master thành 2 nhóm: chưa xóa và đã xóa
    const activeMasters = historyData.filter((h: any) => !h.IsDeleted);
    const deletedMasters = historyData.filter((h: any) => h.IsDeleted && h.ID > 0);

    // Group detail theo HistoryID
    const detailByHistoryId = new Map<number, any[]>();
    const deletedDetailIdsByHistoryId = new Map<number, number[]>();
    
    // Xử lý tất cả detail hiện tại
    detailData.forEach((detail: any) => {
      const historyId = detail.HistoryID || detail.ProjectHistoryProblemID || 0;
      
      if (detail.IsDeleted && detail.ID > 0) {
        // Detail bị xóa
        if (!deletedDetailIdsByHistoryId.has(historyId)) {
          deletedDetailIdsByHistoryId.set(historyId, []);
        }
        deletedDetailIdsByHistoryId.get(historyId)!.push(detail.ID);
      } else if (!detail.IsDeleted) {
        // Detail chưa bị xóa
        if (!detailByHistoryId.has(historyId)) {
          detailByHistoryId.set(historyId, []);
        }
        detailByHistoryId.get(historyId)!.push(this.mapDetailDataToApi(detail));
      }
    });

    // Xử lý các detail bị xóa (đã bị xóa khỏi bảng, track trong deletedIdsDetail)
    this.deletedIdsDetail.forEach((deletedDetailId: number) => {
      const historyId = this.deletedDetailHistoryIdMap.get(deletedDetailId) || 0;
      if (historyId > 0) {
        if (!deletedDetailIdsByHistoryId.has(historyId)) {
          deletedDetailIdsByHistoryId.set(historyId, []);
        }
        deletedDetailIdsByHistoryId.get(historyId)!.push(deletedDetailId);
      }
    });

    // Map các master chưa xóa
    activeMasters.forEach((history: any) => {
      const historyId = history.ID || 0;
      const details = detailByHistoryId.get(historyId) || [];
      const deletedIdsDetail = deletedDetailIdsByHistoryId.get(historyId) || [];

      result.push({
        projectHistoryProblem: this.mapMasterDataToApi(history),
        detail: details.length > 0 ? details : [],
        deleteIdsMaster: [],
        deletedIdsDetail: deletedIdsDetail.length > 0 ? deletedIdsDetail : []
      });
    });

    // Xử lý các master bị xóa (đã bị xóa khỏi bảng, track trong deletedIdsHistory)
    // Khi xóa master, chỉ gửi ID trong deleteIdsMaster, các mảng khác rỗng
    this.deletedIdsHistory.forEach((deletedId: number) => {
      // Tạo object master tối thiểu cho delete
     

      result.push({
        projectHistoryProblem: null,
        detail: [],
        deleteIdsMaster: [deletedId],
        deletedIdsDetail: []
      });
    });

    return result;
  }

  // Map master data từ bảng về format API
  mapMasterDataToApi(item: any): any {
    return {
      ID: item.ID && item.ID > 0 ? item.ID : 0,
      ProjectID: item.ProjectID || this.projectId,
      STT: item.STT || 1,
      TypeProblem: item.ProblemType || '', // ProblemType -> TypeProblem (string text)
      ContentError: item.ErrorContent || '', // ErrorContent -> ContentError
      Reason: item.Reason || '',
      Remedies: item.Solution || '', // Solution -> Remedies
      TestMethod: item.Method || '', // Method -> TestMethod
      Image: item.Image || '',
      DateProblem: item.ProblemDate || null, // ProblemDate -> DateProblem
      DateImplementation: item.ExecuteDate || null, // ExecuteDate -> DateImplementation
      PIC: item.PIC || '',
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
    };
  }

  // Map detail data từ bảng về format API
  mapDetailDataToApi(item: any): any {
    return {
      ID: item.ID && item.ID > 0 ? item.ID : 0,
      ProjectHistoryProblemID: item.ProjectHistoryProblemID || item.HistoryID || null,
      STT: item.STT || 1,
      Description: item.Description || '',
      Status: item.Status || null,
      Note: item.Note || '',
      IsDeleted: item.IsDeleted || false,
    };
  }

  // Lưu dữ liệu
  saveData(): void {
    if (!this.tb_history || !this.tb_detail) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }

    // Lấy tất cả dữ liệu từ cả 2 bảng
    const allHistoryData = this.tb_history.getData();
    const allDetailData = this.tb_detail.getData();
    
    // Lọc các master chưa bị xóa để validate
    const historyData = allHistoryData.filter((item: any) => !item.IsDeleted);

    // Validate dữ liệu
    const validation = this.validateData(historyData);
    if (!validation.isValid) {
      this.notification.error('Lỗi', validation.message);
      return;
    }

    // Validate: Chi tiết chỉ được thêm cho master đã lưu
    for (const detail of allDetailData) {
      if (detail.IsDeleted) continue;
      
      const historyId = detail.HistoryID || detail.ProjectHistoryProblemID;
      if (historyId === 0) {
        this.notification.warning('Thông báo', 'Vui lòng lưu lịch sử phát sinh trước khi thêm chi tiết!');
        return;
      }
      
      // Kiểm tra master có tồn tại không
      const master = allHistoryData.find((h: any) => h.ID === historyId && !h.IsDeleted);
      if (!master && historyId > 0) {
        // Master đã bị xóa hoặc không tồn tại
        this.notification.warning('Thông báo', 'Không tìm thấy lịch sử phát sinh tương ứng cho chi tiết!');
        return;
      }
    }

    // Upload file mới trước (nếu có) để lấy ServerPath
    const filesToUpload: File[] = allHistoryData
      .filter((row: any) => row.ImageFile && !row.IsDeleted)
      .map((row: any) => row.ImageFile);

    const subPath = this.getSubPath();

    // Kiểm tra nếu có file mới nhưng không có subPath
    if (filesToUpload.length > 0 && !subPath) {
      this.notification.error(
        'Thông báo',
        'Không thể xác định đường dẫn lưu file. Vui lòng kiểm tra thông tin dự án!'
      );
      return;
    }

    // Nếu có file mới cần upload
    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && res?.data?.length > 0) {
            // Cập nhật Image field với đường dẫn file sau khi upload thành công
            let fileIndex = 0;
            allHistoryData.forEach((row: any) => {
              if (row.ImageFile && !row.IsDeleted && res.data[fileIndex]) {
                const filePath = res.data[fileIndex].FilePath || res.data[fileIndex].ServerPath || '';
                row.Image = filePath; // Cập nhật Image với đường dẫn file
                delete row.ImageFile; // Xóa ImageFile sau khi upload
                fileIndex++;
              }
            });
            
            // Cập nhật lại dữ liệu trong bảng
            if (this.tb_history) {
              this.tb_history.setData(allHistoryData);
            }
          }
          
          // Sau khi upload xong, gọi save
          this.callSaveData(allHistoryData, allDetailData);
        },
        error: (error: any) => {
          console.error('Lỗi upload file:', error);
          this.notification.error(
            'Thông báo',
            'Upload file thất bại. Vui lòng thử lại!'
          );
        }
      });
    } else {
      // Không có file mới, save trực tiếp
      this.callSaveData(allHistoryData, allDetailData);
    }
  }

  // Method riêng để gọi API save
  callSaveData(allHistoryData: any[], allDetailData: any[]): void {
    // Map dữ liệu về format API - gửi tất cả dữ liệu hiện tại
    const payload = this.mapTableDataToApiFormat(allHistoryData, allDetailData);

    // Gọi API để lưu
    this.projectHistoryProblemService.saveData(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu dữ liệu thành công!');
          // Clear deleted IDs và changed rows
          this.deletedIdsHistory = [];
          this.deletedIdsDetail = [];
          this.changedHistoryRows.clear();
          this.changedDetailRows.clear();
          this.deletedDetailHistoryIdMap.clear();
          // Reload data
          this.loadData();
        } else {
          this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
        }
      },
      error: (error: any) => {
        console.error('Error saving data:', error);
        const errorMessage = error.error?.message || error.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  // Mở file dialog để chọn file cho cột hình ảnh
  openFileSelectorForImage(row: any): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = false; // Chỉ chọn 1 file
    fileInput.accept = 'image/*'; // Chỉ chọn file ảnh (tùy chọn)
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) {
        document.body.removeChild(fileInput);
        return;
      }

      const file = files[0];
      const rowData = row.getData();
      
      // Lưu File object vào row data để upload sau
      row.update({
        Image: file.name, // Tên file tạm thời
        ImageFile: file, // File object để upload
      });

      document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    }, 100);
  }

  // Tạo đường dẫn upload file
  getSubPath(): string {
    if (!this.projectInfo) {
      return '';
    }
    
    const year = this.projectInfo.CreatedDate 
      ? new Date(this.projectInfo.CreatedDate).getFullYear() 
      : new Date().getFullYear();
    
    const projectCode = this.projectInfo.ProjectCode || this.projectCode || '';
    
    if (!projectCode) {
      return '';
    }
    
    return `${year}\\${projectCode}\\TaiLieuChung\\TongHopPhatSinh\\Image`;
  }

  // Tải xuống file từ cột hình ảnh
  downloadImage(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
      this.notification.warning('Thông báo', 'Không có đường dẫn file để tải xuống!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.projectHistoryProblemService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Lấy tên file từ đường dẫn
          const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || 'downloaded_file';
          link.download = fileName;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        this.message.remove(loadingMsg);
        console.error('Lỗi khi tải file:', res);

        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.error.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error('Thông báo', res.error.message || 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        }
      },
    });
  }

  onCloseModal(): void {
    this.modalService.dismissAll();
  }
}

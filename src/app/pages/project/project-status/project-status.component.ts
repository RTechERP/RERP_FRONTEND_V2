import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ProjectFormPriorityDetailComponent } from '../project-form-priority-detail/project-form-priority-detail.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
@Component({
  selector: 'app-project-status',
  imports: [FormsModule, NzButtonModule, NzModalModule],
  templateUrl: './project-status.component.html',
  styleUrl: './project-status.component.css',
})
export class ProjectStatusComponent implements OnInit {
  @Input() projectId: any = 0;
  tb_projectStatus: any;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) {}
  ngOnInit(): void {
    this.onLoadTableProjectStatus();
    this.loadData();
  }

  onLoadTableProjectStatus() {
    if (this.tb_projectStatus) this.tb_projectStatus.destroy();
    this.tb_projectStatus = new Tabulator(`#tb_projectStatus`, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      locale: 'vi',
      height: 'calc(80vh - 120px)', // Trừ đi header và footer
      rowHeader: false,
      paginationMode: 'local',
      columns: [
        {
          title: 'Chọn',
          field: 'Selected',
          formatter: function (cell, formatterParams, onRendered) {
            const value = cell.getValue();
            const checked = value === true ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          cellClick: (e, cell) => {
            const newValue = !cell.getValue();
            const table = cell.getTable();
            const allRows = table.getRows();

            allRows.forEach((r) => {
              if (r !== cell.getRow()) {
                r.update({ Selected: false });
              }
            });

            cell.setValue(newValue);
          },
          hozAlign: 'center',
          width: '8vh',
          headerHozAlign: 'center',
          headerSort: false,
        },
        {
          title: 'STT',
          field: 'StatusID',
          width: '8px',
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusName',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Ngày bắt đầu dự kiến',
          field: 'EstimatedStartDate',
          headerHozAlign: 'center',
          editor: 'date',
          editorParams: {
            format: 'yyyy-MM-dd',
          },
          cellEdited: (cell: any) => {
            const value = cell.getValue();
            let dt: DateTime | null = null;
            
            if (value instanceof Date) {
              dt = DateTime.fromJSDate(value);
            } else if (value && typeof value === 'string') {
              dt = DateTime.fromISO(value);
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
              }
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'dd/MM/yyyy');
              }
            }
            
            if (dt && dt.isValid) {
              cell.setValue(dt.toFormat('yyyy-MM-dd'));
            }
          },
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, chuỗi rỗng => trả về ''
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              return '';
            }

            // Nếu là Date object => convert sang ISO string
            if (value instanceof Date) {
              const dt = DateTime.fromJSDate(value);
              return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
            }

            // Nếu là chuỗi ngày hợp lệ => format
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc dự kiến',
          field: 'EstimatedEndDate',
          headerHozAlign: 'center',
          editor: 'date',
          editorParams: {
            format: 'yyyy-MM-dd',
          },
          cellEdited: (cell: any) => {
            const value = cell.getValue();
            let dt: DateTime | null = null;
            
            if (value instanceof Date) {
              dt = DateTime.fromJSDate(value);
            } else if (value && typeof value === 'string') {
              dt = DateTime.fromISO(value);
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
              }
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'dd/MM/yyyy');
              }
            }
            
            if (dt && dt.isValid) {
              const formattedValue = dt.toFormat('yyyy-MM-dd');
              cell.setValue(formattedValue);
            }
          },
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, chuỗi rỗng => trả về ''
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              return '';
            }

            // Nếu là Date object => convert sang ISO string
            if (value instanceof Date) {
              const dt = DateTime.fromJSDate(value);
              return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
            }

            // Nếu là chuỗi ngày hợp lệ => format
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày bắt đầu thực tế',
          field: 'ActualStartDate',
          headerHozAlign: 'center',
          editor: 'date',
          editorParams: {
            format: 'yyyy-MM-dd',
          },
          cellEdited: (cell: any) => {
            const value = cell.getValue();
            let dt: DateTime | null = null;
            
            if (value instanceof Date) {
              dt = DateTime.fromJSDate(value);
            } else if (value && typeof value === 'string') {
              dt = DateTime.fromISO(value);
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
              }
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'dd/MM/yyyy');
              }
            }
            
            if (dt && dt.isValid) {
              const formattedValue = dt.toFormat('yyyy-MM-dd');
              cell.setValue(formattedValue);
            }
          },
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, chuỗi rỗng => trả về ''
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              return '';
            }

            // Nếu là Date object => convert sang ISO string
            if (value instanceof Date) {
              const dt = DateTime.fromJSDate(value);
              return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
            }

            // Nếu là chuỗi ngày hợp lệ => format
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc thực tế',
          field: 'ActualEndDate',
          headerHozAlign: 'center',
          editor: 'date',
          editorParams: {
            format: 'yyyy-MM-dd',
          },
          cellEdited: (cell: any) => {
            const value = cell.getValue();
            let dt: DateTime | null = null;
            
            if (value instanceof Date) {
              dt = DateTime.fromJSDate(value);
            } else if (value && typeof value === 'string') {
              dt = DateTime.fromISO(value);
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
              }
              if (!dt.isValid) {
                dt = DateTime.fromFormat(value, 'dd/MM/yyyy');
              }
            }
            
            if (dt && dt.isValid) {
              const formattedValue = dt.toFormat('yyyy-MM-dd');
              cell.setValue(formattedValue);
            }
          },
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, chuỗi rỗng => trả về ''
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              return '';
            }

            // Nếu là Date object => convert sang ISO string
            if (value instanceof Date) {
              const dt = DateTime.fromJSDate(value);
              return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
            }

            // Nếu là chuỗi ngày hợp lệ => format
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
          },
          hozAlign: 'center',
        },
      ],
    });
  }

  getProjectStatusParam() {
    return { projectId: this.projectId };
  }

  loadData() {
    this.projectService.getProjectStatusById(this.projectId).subscribe({
      next: (response: any) => {
        response.data = response.data.map((item: any) => ({
          ...item,
          Selected: item.Selected === true,
        }));
        this.tb_projectStatus.setData(response.data);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  saveData() {
    const data: any[] = [];
    // Lấy trực tiếp từ getData() - bảng này không có children, chỉ dữ liệu phẳng
    const allData = this.tb_projectStatus.getData();

    const parseNumber = (value: any): number => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Hàm helper để convert date value sang format yyyy-MM-dd
    const formatDateForSave = (dateValue: any): string | null => {
      if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
      }
      
      let dt: DateTime | null = null;
      
      // Nếu là Date object
      if (dateValue instanceof Date) {
        dt = DateTime.fromJSDate(dateValue);
      }
      // Nếu là string
      else if (typeof dateValue === 'string' && dateValue.trim()) {
        dt = DateTime.fromISO(dateValue);
        if (!dt.isValid) {
          dt = DateTime.fromFormat(dateValue, 'yyyy-MM-dd');
        }
        if (!dt.isValid) {
          dt = DateTime.fromFormat(dateValue, 'dd/MM/yyyy');
        }
      }
      
      return dt && dt.isValid ? dt.toFormat('yyyy-MM-dd') : null;
    };

    // Xử lý dữ liệu phẳng (không có children)
    allData.forEach((row: any) => {
      if (row['Selected'] == true || row['StatusID'] > 0) {
        const newRow = {
          ID: parseNumber(row['ID']),
          ProjectID: this.projectId,
          ProjectStatusID: parseNumber(row['StatusID']),
          EstimatedStartDate: formatDateForSave(row['EstimatedStartDate']),
          EstimatedEndDate: formatDateForSave(row['EstimatedEndDate']),
          ActualStartDate: formatDateForSave(row['ActualStartDate']),
          ActualEndDate: formatDateForSave(row['ActualEndDate']),
          Selected: !!row['Selected'],
          STT: parseNumber(row['StatusID']),
        };
        data.push(newRow);
      }
    });

    const hasSelectedRow = data.some((row) => row.Selected === true);

    if (!hasSelectedRow) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 trạng thái!');
      return;
    }
    
    // Validation ngày thực tế
    const selectedRow = data.find(row => row.Selected === true);
    if (selectedRow && selectedRow.ActualStartDate && selectedRow.ActualEndDate) {
      const startDate = DateTime.fromISO(selectedRow.ActualStartDate);
      const endDate = DateTime.fromISO(selectedRow.ActualEndDate);
      
      if (startDate.isValid && endDate.isValid && startDate > endDate) {
        this.notification.error('Thông báo', 'Ngày kết thúc thực tế phải lớn hơn ngày bắt đầu thực tế!');
        return;
      }
    }

    this.projectService.saveProjectStatuses(data).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success('Thông báo', 'Lưu trạng thái thành công!');
          this.activeModal.dismiss(true);
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
}

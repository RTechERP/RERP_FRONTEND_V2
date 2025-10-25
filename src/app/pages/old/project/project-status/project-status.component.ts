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
      height: 'auto',
      layout: 'fitDataStretch',
      locale: 'vi',
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
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, object rỗng, chuỗi rỗng => trả về ''
            if (
              !value ||
              typeof value === 'object' ||
              (typeof value === 'string' && value.trim() === '')
            ) {
              return '';
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
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, object rỗng, chuỗi rỗng => trả về ''
            if (
              !value ||
              typeof value === 'object' ||
              (typeof value === 'string' && value.trim() === '')
            ) {
              return '';
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
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, object rỗng, chuỗi rỗng => trả về ''
            if (
              !value ||
              typeof value === 'object' ||
              (typeof value === 'string' && value.trim() === '')
            ) {
              return '';
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
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue();

            // Nếu là null, undefined, object rỗng, chuỗi rỗng => trả về ''
            if (
              !value ||
              typeof value === 'object' ||
              (typeof value === 'string' && value.trim() === '')
            ) {
              return '';
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
    const allData = this.projectService.getSelectedRowsRecursive(
      this.tb_projectStatus.getData()
    );

    const parseNumber = (value: any): number => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    allData.forEach((row: any) => {
      if (row['Selected'] == true || row['ID'] > 0) {
        const newRow = {
          ID: parseNumber(row['ID']),
          ProjectID: this.projectId,
          ProjectStatusID: parseNumber(row['ProjectStatusID']),

          EstimatedStartDate: DateTime.fromISO(row['EstimatedStartDate'])
            .isValid
            ? DateTime.fromISO(row['EstimatedStartDate']).toFormat('yyyy-MM-dd')
            : null,

          EstimatedEndDate: DateTime.fromISO(row['EstimatedEndDate']).isValid
            ? DateTime.fromISO(row['EstimatedEndDate']).toFormat('YYYY-MM-DD')
            : null,

          ActualStartDate: DateTime.fromISO(row['ActualStartDate']).isValid
            ? DateTime.fromISO(row['ActualStartDate']).toFormat('YYYY-MM-DD')
            : null,

          ActualEndDate: DateTime.fromISO(row['ActualEndDate']).isValid
            ? DateTime.fromISO(row['ActualEndDate']).toFormat('YYYY-MM-DD')
            : null,

          Selected: !!row['Selected'],
          STT: parseNumber(row['StatusID']),
        };
        data.push(newRow);
      }
    });

    const hasSelectedRow = data.some((row) => row.Selected === true);

    if (!hasSelectedRow) {
      this.notification.error('', 'Vui lòng chọn 1 trạng thái!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    this.projectService.saveProjectStatuses(data).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success('', 'Lưu trạng thái thành công!', {
            nzStyle: { fontSize: '0.75rem' },
          });
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

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';

import { CustomTable } from '../../../shared/components/custom-table/custom-table';
import { ColumnDef } from '../../../shared/components/custom-table/column-def.model';

import { EslConfigService } from './esl-config.service';
import { EslConfigFormComponent } from './esl-config-form/esl-config-form.component';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-esl-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModalModule,
    NzModalModule,
    NzSpinModule,
    MenubarModule,
    CustomTable
  ],
  templateUrl: './esl-config.component.html',
  styleUrls: ['./esl-config.component.css']
})
export class EslConfigComponent implements OnInit, AfterViewInit {
  menuBars: MenuItem[] = [];
  tableData: any[] = [];
  isLoading: boolean = false;
  selectedRow: any = null;
  columns: ColumnDef[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private service: EslConfigService
  ) { }

  ngOnInit() {
    this.columns = this.getTableColumns();
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAdd()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEdit()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDelete()
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-rotate-right fa-lg text-info',
        command: () => this.loadData()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExport()
      }
    ];
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadData();
    }, 100);
  }

  private getTableColumns(): ColumnDef[] {
    return [
      {
        field: 'STT',
        header: 'STT',
        width: '60px',
        sortable: false,
        cssClass: 'text-center'
      },
      {
        field: 'ConfigKey',
        header: 'Mã cấu hình',
        width: '200px',
        sortable: true
      },
      {
        field: 'ConfigValue',
        header: 'Giá trị cấu hình',
        width: '250px',
        sortable: true
      },
      {
        field: 'Description',
        header: 'Mô tả',
        width: '200px',
        sortable: true
      },
      {
        field: 'UpdatedBy',
        header: 'Người cập nhật',
        width: '150px',
        sortable: true
      },
      {
        field: 'UpdatedDate',
        header: 'Ngày cập nhật',
        width: '150px',
        sortable: true,
        cssClass: 'text-center',
        format: (val) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm') : ''
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const data = response.data || [];
        this.tableData = data.map((item: any, index: number) => ({
          ...item,
          STT: index + 1
        }));
        this.selectedRow = null;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi tải danh sách cấu hình');
      }
    });
  }

  onAdd(): void {
    const modalRef = this.modalService.open(EslConfigFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
      }
    }, () => {});
  }

  onEdit(): void {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn cấu hình cần sửa');
      return;
    }

    const modalRef = this.modalService.open(EslConfigFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = this.selectedRow;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
      }
    }, () => {});
  }

  onDelete(): void {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn cấu hình cần xóa');
      return;
    }

    const confirmMessage = `Bạn có chắc chắn muốn xóa bản ghi "${this.selectedRow.ConfigKey}"?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOkType: 'primary',
      nzOnOk: () => {
        this.service.delete(this.selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi xóa bản ghi');
            }
          },
          error: (err: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi xóa bản ghi');
          }
        });
      }
    });
  }

  async onExport(): Promise<void> {
    const data = this.tableData;
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Cấu Hình');

    // Header
    const headers = this.columns.map(col => col.header);
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E4FA' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 22;

    // Data rows
    data.forEach((row) => {
      const rowData = this.columns.map(col => {
        let value = row[col.field];
        if (col.format) {
          value = col.format(value, row); 
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        if (typeof value === 'string') {
          value = value.replace(/<[^>]*>?/gm, '');
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = 10;
      const colDef = this.columns[index];
      const isCenter = colDef?.cssClass?.includes('text-center');
      const isRight = colDef?.cssClass?.includes('text-right');
      const hAlign = isCenter ? 'center' : (isRight ? 'right' : 'left');

      column.eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        
        if (rowNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: hAlign, wrapText: true };
        }
      });
      column.width = Math.min(maxLength, 30);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSachCauHinhESL_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

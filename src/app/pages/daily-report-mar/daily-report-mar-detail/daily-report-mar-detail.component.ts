import { Component, AfterViewInit, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { Tabulator, RowComponent } from 'tabulator-tables';
import { DateTime } from 'luxon';
import { DailyReportTechService } from '../../DailyReportTech/DailyReportTechService/daily-report-tech.service';
import { ProjectRequestServiceService } from '../../project-request/project-request-service/project-request-service.service';

@Component({
  selector: 'app-daily-report-mar-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './daily-report-mar-detail.component.html',
  styleUrl: './daily-report-mar-detail.component.css'
})
export class DailyReportMarDetailComponent implements OnInit, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataInput: any;
  @Input() currentUser: any;

  formGroup: FormGroup;
  saving: boolean = false;
  sendingEmail: boolean = false;

  @ViewChild('tb_FileMar', { static: false })
  tb_FileMarElement!: ElementRef;
  private tb_FileMar!: Tabulator;

  fileData: any[] = [];
  deletedFileIds: number[] = [];
  selectedFile: any = null;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private dailyReportTechService: DailyReportTechService,
    private projectRequestService: ProjectRequestServiceService
  ) {
    this.formGroup = this.fb.group({
      DateReport: [null, [Validators.required]],
      Content: ['', [Validators.required]],
      Results: ['', [Validators.required]],
      PlanNextDay: ['', [Validators.required]],
      Note: [''],
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.dataInput) {
      const dailyID =
        typeof this.dataInput === 'number'
          ? this.dataInput
          : (this.dataInput?.ID || this.dataInput?.dailyID);
      if (dailyID) {
        this.loadDataForEdit(dailyID);
      }
    } else {
      // mặc định ngày báo cáo = hôm nay
      this.formGroup.patchValue({
        DateReport: DateTime.local().toJSDate(),
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_FileMarElement?.nativeElement) {
        this.drawTbFile(this.tb_FileMarElement.nativeElement);
      }
    }, 0);
  }

  disabledDate = (current: Date): boolean => {
    const today = DateTime.local().startOf('day');
    const oneDayAgo = today.minus({ days: 1 });
    const currentDate = DateTime.fromJSDate(current).startOf('day');
    return currentDate < oneDayAgo;
  };

  private loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDataByIDHR(dailyID).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response?.data) {
          // API trả về { dailyData, dailyFileData }
          const dailyData = response.data.dailyData;
          const dailyFileData = response.data.dailyFileData;
          this.populateForm(dailyData, dailyFileData);
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tải dữ liệu báo cáo!');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error?.error?.message || error?.message || 'Đã xảy ra lỗi khi tải dữ liệu!');
      },
    });
  }

  private populateForm(data: any, fileData?: any[]): void {
    const dateReport = data?.DateReport ? DateTime.fromISO(data.DateReport).toJSDate() : null;
    this.formGroup.patchValue({
      DateReport: dateReport,
      Content: data?.Content || '',
      Results: data?.Results || '',
      PlanNextDay: data?.PlanNextDay || '',
      Note: data?.Note || '',
    });

    // Ưu tiên sử dụng fileData từ API get-by-id-hr
    // Nếu không có thì fallback về data cũ
    const files = fileData || data?.dailyReportMarketingFiles || data?.DailyReportMarketingFiles || [];
    if (Array.isArray(files)) {
      this.fileData = files.map((f: any) => ({
        ...f,
        FileNameOrigin: f?.FileNameOrigin || f?.OriginName || f?.FileName || '',
        ServerPath: f?.ServerPath || f?.PathServer || f?.FilePath || '',
        ID: f?.ID || 0,
        IsDeleted: false,
      }));
    } else {
      this.fileData = [];
    }

    if (this.tb_FileMar) {
      this.tb_FileMar.setData(this.fileData);
    }
  }

  closeModal(): void {
    this.activeModal.close(true);
  }

  private escapeHtml(text: string): string {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toHtmlPreserveLines(text: string): string {
    const escaped = this.escapeHtml(text || '');
    return escaped.replace(/\r\n|\r|\n/g, '<br>');
  }

  private buildFileLinks(): any[] {
    const activeFiles = this.fileData.filter((f: any) => !f?.IsDeleted);
    return activeFiles
      .map((f: any) => {
        const fileName = f?.FileNameOrigin || f?.FileName || '';
        const path = f?.ServerPath || f?.PathServer || f?.FilePath || '';
        if (!fileName || !path) return null;
        return {
          FileName: fileName,
          Url: `/api/home/download?path=${encodeURIComponent(path)}`,
          PathServer: path,
        };
      })
      .filter((x: any) => !!x);
  }

  private buildEmailBodyHtml(dateReport: Date, content: string, results: string, planNextDay: string, note: string, fileLinks: any[]): string {
    const dateStr = dateReport ? DateTime.fromJSDate(dateReport).toFormat('dd/MM/yyyy') : '';

    const fileLinksHtml = (Array.isArray(fileLinks) && fileLinks.length > 0)
      ? fileLinks
          .map((f: any) => {
            const name = this.escapeHtml(f?.FileName || '');
            const url = this.escapeHtml(f?.Url || '');
            if (!name || !url) return '';
            return `<a href="${url}" target="_blank">${name}</a><br>`;
          })
          .join('')
      : '<i>- Không có</i>';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BÁO CÁO CÔNG VIỆC NGÀY ${dateStr}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#333;margin:0;padding:20px;background:#f9f9f9}
    .container{max-width:720px;margin:auto;background:#fff;padding:25px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h3{color:#2c3e50;margin-top:0}
    hr{border:none;border-top:1px solid #ddd;margin:20px 0}
    .label{font-weight:bold;color:#555}
    .file-links a{color:#0066cc;text-decoration:none}
    .file-links a:hover{text-decoration:underline}
    .footer{margin-top:30px;font-size:.9em;color:#777}
  </style>
</head>
<body>
  <div class="container">
    <h3>BÁO CÁO CÔNG VIỆC NGÀY ${dateStr}</h3>
    <hr>
    <p><span class="label">* Nội dung công việc:</span><br>${this.toHtmlPreserveLines(content)}</p>
    <p><span class="label">* Kết quả công việc:</span><br>${this.toHtmlPreserveLines(results)}</p>
    <p><span class="label">* Kế hoạch ngày tiếp theo:</span><br>${this.toHtmlPreserveLines(planNextDay)}</p>
    <p><span class="label">* Đề xuất cải tiến:</span><br>${this.toHtmlPreserveLines(note || '- Không có')}</p>
    <p class="label">* File đính kèm:</p>
    <div class="file-links">${fileLinksHtml}</div>
    <hr>
    <div class="footer">
      <p>Người gửi: <strong>${this.escapeHtml(this.currentUser?.FullName || '')}</strong></p>
      <p>Ngày gửi: ${DateTime.local().toFormat('dd/MM/yyyy HH:mm')}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private sendEmailAfterSave(valueRaw: any): void {
    if (this.sendingEmail) return;

    const dateReport: Date | null = valueRaw?.DateReport ? new Date(valueRaw.DateReport) : null;
    if (!dateReport || isNaN(dateReport.getTime())) {
      this.notification.warning('Thông báo', 'Không xác định được ngày báo cáo để gửi email!');
      return;
    }

    const fileLinks = this.buildFileLinks();
    const bodyHtml = this.buildEmailBodyHtml(
      dateReport,
      valueRaw?.Content || '',
      valueRaw?.Results || '',
      valueRaw?.PlanNextDay || '',
      valueRaw?.Note || '',
      fileLinks
    );

    this.sendingEmail = true;
    this.dailyReportTechService.sendEmailMarketingReport(bodyHtml, dateReport, fileLinks).subscribe({
      next: (response: any) => {
        this.sendingEmail = false;
      },
      error: (error: any) => {
        this.sendingEmail = false;
      }
    });
  }

  sendEmailMarketing(): void {
    if (this.sendingEmail) return;

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.notification.warning('Thông báo', 'Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    const valueRaw = this.formGroup.getRawValue();
    const dateReport: Date | null = valueRaw.DateReport ? new Date(valueRaw.DateReport) : null;
    if (!dateReport) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày báo cáo!');
      return;
    }

    const doSend = () => {
      const fileLinks = this.buildFileLinks();
      const bodyHtml = this.buildEmailBodyHtml(
        dateReport,
        valueRaw.Content || '',
        valueRaw.Results || '',
        valueRaw.PlanNextDay || '',
        valueRaw.Note || '',
        fileLinks
      );

      this.sendingEmail = true;
      this.dailyReportTechService.sendEmailMarketingReport(bodyHtml, dateReport, fileLinks).subscribe({
        next: (response: any) => {
          this.sendingEmail = false;
          if (response?.status === 1) {
            this.notification.success('Thông báo', response?.message || 'Gửi email báo cáo thành công!');
          } else {
            this.notification.error('Thông báo', response?.message || 'Gửi email báo cáo thất bại!');
          }
        },
        error: (error: any) => {
          this.sendingEmail = false;
          this.notification.error('Thông báo', error?.error?.message || error?.message || 'Gửi email báo cáo thất bại!');
        }
      });
    };

    const filesToUpload: File[] = this.fileData
      .filter((f) => f?.File && !f?.ServerPath)
      .map((f) => f.File as File);

    if (filesToUpload.length > 0) {
      const subPath = this.getSubPath(dateReport);
      this.notification.info('Thông báo', 'Đang upload file trước khi gửi email...');
      this.dailyReportTechService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && Array.isArray(res?.data)) {
            let fileIndex = 0;
            this.fileData.forEach((f) => {
              if (f?.File && !f?.ServerPath && res.data[fileIndex]) {
                f.ServerPath = res.data[fileIndex].FilePath || res.data[fileIndex].filePath || res.data[fileIndex].ServerPath || '';
                fileIndex++;
              }
            });
          }
          doSend();
        },
        error: (error: any) => {
          this.notification.error('Thông báo', error?.error?.message || error?.message || 'Upload file thất bại!');
        },
      });
    } else {
      doSend();
    }
  }

  saveData(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.notification.warning('Thông báo', 'Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    const valueRaw = this.formGroup.getRawValue();

    const filesToUpload: File[] = this.fileData
      .filter((f) => f?.File && !f?.ServerPath)
      .map((f) => f.File as File);

    if (filesToUpload.length > 0) {
      const subPath = this.getSubPath(valueRaw.DateReport);
      this.notification.info('Thông báo', 'Đang upload file...');

      this.dailyReportTechService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && Array.isArray(res?.data)) {
            let fileIndex = 0;
            this.fileData.forEach((f) => {
              if (f?.File && !f?.ServerPath && res.data[fileIndex]) {
                f.ServerPath = res.data[fileIndex].FilePath || res.data[fileIndex].filePath || res.data[fileIndex].ServerPath || '';
                fileIndex++;
              }
            });
          }
          this.callSaveApi(valueRaw);
        },
        error: (error: any) => {
          this.notification.error('Thông báo', error?.error?.message || error?.message || 'Upload file thất bại!');
        },
      });
    } else {
      this.callSaveApi(valueRaw);
    }
  }

  private callSaveApi(valueRaw: any): void {
    const dailyId =
      this.mode === 'edit'
        ? (typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || 0))
        : 0;

    const dateReport = valueRaw.DateReport
      ? DateTime.fromJSDate(new Date(valueRaw.DateReport)).toFormat('yyyy-MM-dd')
      : null;

    const userReport = this.currentUser?.ID || 0;

    const payload: any = {
      ID: dailyId || 0,
      UserReport: userReport,
      DateReport: dateReport,
      Content: typeof valueRaw.Content === 'string' ? valueRaw.Content.trim() : valueRaw.Content,
      Results: typeof valueRaw.Results === 'string' ? valueRaw.Results.trim() : valueRaw.Results,
      PlanNextDay: typeof valueRaw.PlanNextDay === 'string' ? valueRaw.PlanNextDay.trim() : valueRaw.PlanNextDay,
      Note: typeof valueRaw.Note === 'string' ? valueRaw.Note.trim() : valueRaw.Note,
      dailyReportMarketingFiles: this.prepareFileData(dailyId || 0),
      deletedFileID: this.mode === 'edit' ? this.deletedFileIds : [],
    };

    this.saving = true;
    this.dailyReportTechService.saveReportMar(payload).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response?.status === 1) {
          this.notification.success('Thông báo', response?.message || 'Lưu dữ liệu thành công');
          this.sendEmailAfterSave(valueRaw);
          this.closeModal();
        } else {
          this.notification.error('Thông báo', response?.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        this.saving = false;
        this.notification.error('Thông báo', error?.error?.message || error?.message || 'Lưu dữ liệu thất bại');
      },
    });
  }

  private prepareFileData(dailyId: number): any[] {
    const fileData: any[] = [];
    const activeFiles = this.fileData.filter((f: any) => !f?.IsDeleted);
  
    activeFiles.forEach((file: any) => {
      if (!file) return;
  
      let extension = '';
      const fileName = file.FileNameOrigin || file.FileName || file.OriginName || '';
      if (fileName) {
        const parts = fileName.split('.');
        if (parts.length > 1) {
          extension = '.' + parts.pop();
        }
      }
  
      if (file.ID && file.ID > 0) {
        fileData.push({
          ID: file.ID,
          FileName: file.FileNameOrigin || file.FileName || '', // ✅ THÊM DÒNG NÀY
          FileNameOrigin: file.FileNameOrigin || file.FileName || '',
          OriginPath: file.OriginPath || file.FileNameOrigin || file.FileName || '',
          Extension: extension,
          PathServer: file.ServerPath || '',
          DailyReportID: dailyId,
        });
      } else if (file.File && file.ServerPath) {
        fileData.push({
          ID: 0,
          FileName: file.FileNameOrigin || (file.File?.name || ''), // ✅ THÊM DÒNG NÀY
          FileNameOrigin: file.FileNameOrigin || (file.File?.name || ''),
          OriginPath: file.OriginPath || (file.File?.name || ''),
          Extension: extension,
          PathServer: file.ServerPath || '',
          DailyReportID: dailyId,
        });
      }
    });
  
    return fileData;
  }

  private drawTbFile(container: HTMLElement): void {
    // Context menu cho bảng file
    const contextMenuItems: any[] = [
      {
        label: 'Tải xuống',
        action: () => {
          this.downloadFile();
        }
      }
    ];

    this.tb_FileMar = new Tabulator(container, {
      data: this.fileData,
      layout: 'fitColumns',
      pagination: false,
      height: '100%',
      selectableRows: 1,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: '',
          field: 'actions',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display:flex;justify-content:center;align-items:center;height:100%;"><i class="fas fa-plus text-white cursor-pointer" title="Thêm file"></i></div>`,
          headerClick: () => {
            this.openFileSelector();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            const isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button class="btn text-danger p-0 border-0" style="font-size:0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa file này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();
                  const id = rowData['ID'];

                  const index = this.fileData.findIndex(
                    (f) => f?.FileNameOrigin === rowData['FileNameOrigin'] && f?.ServerPath === rowData['ServerPath'] && f?.ID === rowData['ID']
                  );
                  if (index > -1) {
                    const deleted = this.fileData[index];
                    if (deleted?.ID && !this.deletedFileIds.includes(deleted.ID)) {
                      this.deletedFileIds.push(deleted.ID);
                    }
                    this.fileData.splice(index, 1);
                  }

                  row.delete();
                },
              });
            }
          },
        },
        {
          title: 'Tên file',
          field: 'FileNameOrigin',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: false as any,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const rowData = cell.getRow().getData();
            // Chỉ hiển thị link nếu file đã có trên server (có ServerPath và ID > 0)
            if (value && (rowData.ServerPath || rowData.ID > 0)) {
              return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
            }
            return value || '';
          },
        },
      ],
    });

    // Thêm sự kiện rowSelected
    this.tb_FileMar.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      this.selectedFile = rowData;
    });

    // Thêm sự kiện rowDeselected
    this.tb_FileMar.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.tb_FileMar.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedFile = null;
      }
    });

    // Double click vào tên file để tải xuống
    this.tb_FileMar.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedFile = rowData;
      this.downloadFile();
    });
  }

  private openFileSelector(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        const newFile = {
          FileNameOrigin: file.name,
          OriginPath: file.name,
          File: file,
          ServerPath: '',
          ID: 0,
          IsDeleted: false,
        };

        this.fileData.push(newFile);
        if (this.tb_FileMar) {
          this.tb_FileMar.addRow(newFile);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  private getSubPath(dateReport: any): string {
    const dt = dateReport ? DateTime.fromJSDate(new Date(dateReport)) : DateTime.local();
    const year = dt.isValid ? dt.toFormat('yyyy') : DateTime.local().toFormat('yyyy');
    const month = dt.isValid ? dt.toFormat('MM') : DateTime.local().toFormat('MM');
    const userId = this.currentUser?.ID || this.currentUser?.EmployeeID || 0;
    return `DailyReportMarketing/${year}/${month}/${userId}`;
  }

  //#region Download File
  downloadFile(): void {
    const file = this.selectedFile || (this.fileData && this.fileData.length > 0 ? this.fileData[0] : null);

    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    // Kiểm tra nếu file chưa được upload lên server (file mới thêm)
    if (!file.ServerPath && !file.PathServer && file.ID <= 0) {
      this.notification.warning('Thông báo', 'File này chưa được lưu trên server. Vui lòng lưu báo cáo trước!');
      return;
    }

    const filePath = file.ServerPath || file.PathServer || file.FilePath || file.FileName;
    if (!filePath) {
      this.notification.error('Thông báo', 'Không có đường dẫn file để tải xuống!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.projectRequestService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileNameOrigin || file.FileName || 'downloaded_file';
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
              this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
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
  //#endregion
}

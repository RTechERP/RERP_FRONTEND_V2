import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Component, OnInit } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MakertrainingService } from './makertraining-service/makertraining.service';
import { MakertrainingFormComponent } from './makertraining-form/makertraining-form.component';
import { ProjectRequestServiceService } from '../project/project-request/project-request-service/project-request-service.service';
import { CustomTable } from '../../shared/custom-table';
import { ColumnDef } from '../../shared/custom-table/column-def.model';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { NOTIFICATION_TITLE } from '../../app.config';
import { PermissionService } from '../../services/permission.service';

interface MakerTraining {
  ID: number;
  STT: number;
  Name: string;
  TypeName: string;
  FirmName: string;
  TrainerName: string;
  TrainingContent: string;
  DateStart: Date;
  DateEnd: Date;
  Location: string;
  Note: string;
}

interface MakerTrainingEmployee {
  STT: number;
  Code: string;
  FullName: string;
  IsPass: boolean;
  Note: string;
}

interface MakerTrainingType {
  STT: number;
  FileName: string;
  FilePath: string;
}

@Component({
  selector: 'app-makertraining',
  imports: [
    CommonModule,
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
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    Menubar,
    CustomTable,
  ],
  standalone: true,
  templateUrl: './makertraining.component.html',
  styleUrl: './makertraining.component.css',
})
export class MakertrainingComponent implements OnInit {
  newMakerTraining: MakerTraining = {
    ID: 0,
    STT: 0,
    Name: '',
    TypeName: '',
    FirmName: '',
    TrainerName: '',
    TrainingContent: '',
    DateStart: new Date(),
    DateEnd: new Date(),
    Location: '',
    Note: '',
  };

  newMakerTrainingEmployee: MakerTrainingEmployee = {
    STT: 0,
    Code: '',
    FullName: '',
    IsPass: false,
    Note: '',
  };

  newMakerTrainingType: MakerTrainingType = {
    STT: 0,
    FileName: '',
    FilePath: '',
  };

  makerTrainingData: any[] = [];
  selectedMakerTraining: any[] = [];
  MakerTrainingID: number = 0;

  makerTrainingEmployeeData: any[] = [];

  makerTrainingFileData: any[] = [];

  pageSize: number = 20;
  pageSizeOptions: number[] = [20, 50, 100];

  // Column definitions for MakerTraining table
  makerTrainingColumns: ColumnDef[] = [
    {
      field: 'STT',
      header: 'STT',
      sortable: true,
      filterType: 'text',
      width: '80px',
    },
    {
      field: 'Name',
      header: 'Phòng Ban',
      sortable: true,
      filterType: 'text',
      filterMode: 'multiselect',
    },
    {
      field: 'TypeName',
      header: 'Hạng mục',
      sortable: true,
      filterType: 'text',
      filterMode: 'multiselect',
    },
    {
      field: 'FirmName',
      header: 'Hãng',
      sortable: true,
      filterType: 'text',
      filterMode: 'multiselect',
    },
    {
      field: 'TrainerName',
      header: 'Người đào tạo',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'TrainingContent',
      header: 'Nội dung chính',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'DateStart',
      header: 'Thời gian bắt đầu',
      sortable: true,
      filterType: 'date',
      filterMode: 'datetime',
      width: '180px',
      format: (value: any) =>
        value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm:ss') : '',
    },
    {
      field: 'DateEnd',
      header: 'Thời gian kết thúc',
      sortable: true,
      filterType: 'date',
      filterMode: 'datetime',
      width: '180px',
      format: (value: any) =>
        value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm:ss') : '',
    },
    {
      field: 'IsTest',
      header: 'Bài kiểm tra',
      sortable: true,
      filterMode: 'multiselect',
      filterOptions: [
        { label: 'Có', value: true },
        { label: 'Không', value: false },
      ],
      width: '120px',
      format: (value: any) => (value ? '✓' : '✗'),
    },
    {
      field: 'Location',
      header: 'Địa điểm',
      sortable: true,
      filterType: 'text',
    },
    { field: 'Note', header: 'Ghi chú', sortable: true, filterType: 'text' },
  ];

  // Column definitions for Employee table
  employeeColumns: ColumnDef[] = [
    {
      field: 'STT',
      header: 'STT',
      sortable: true,
      filterType: 'text',
      width: '80px',
    },
    {
      field: 'Code',
      header: 'Mã nhân viên',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'FullName',
      header: 'Tên nhân viên',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'IsPass',
      header: 'Đánh giá',
      sortable: true,
      filterType: 'text',
      format: (value: any) =>
        value === true || value === 1 ? 'Đạt' : 'Chưa đạt',
    },
    { field: 'Note', header: 'Ghi chú', sortable: true, filterType: 'text' },
  ];

  // Column definitions for File table
  fileColumns: ColumnDef[] = [
    {
      field: 'STT',
      header: 'STT',
      sortable: true,
      filterType: 'text',
      width: '80px',
    },
    {
      field: 'FileName',
      header: 'Tên file',
      sortable: true,
      filterType: 'text',
      clickable: true,
      cellClass: () => 'text-primary cursor-pointer hover-underline',
    },
    {
      field: 'FilePath',
      header: 'Đường dẫn',
      sortable: true,
      filterType: 'text',
      clickable: true,
      cellClass: () => 'text-primary cursor-pointer hover-underline',
      format: (value: any) => value || '',
    },
  ];

  sizeSearch: string = '0';
  isCheckmode: boolean = false;
  menuBars: MenuItem[] = [];

  dateFormat = 'dd/MM/yyyy';
  searchParams = {
    DepartmentID: 0,
    MakerTrainingTypeID: 0,
    FirmID: 0,
    DateStart: new Date(),
    DateEnd: new Date(),
    Keyword: '',
  };
  dataDepartment: any[] = [];
  dataFirm: any[] = [];

  documentFileData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private MakerTrainingService: MakertrainingService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private message: NzMessageService,
    private projectRequestService: ProjectRequestServiceService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.getdataDepartment();
    this.getdataFirm();
    this.initMenuBars();
    const startDate = this.searchParams.DateStart;
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = this.searchParams.DateEnd;
    endDate.setDate(endDate.getDate() + 7);
    const startDateConverted = this.toLocalISOString(startDate);
    const endDateConverted = this.toLocalISOString(endDate);
    this.getMakerTraining();
  }

  initMenuBars() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N85, N32'),
        command: () => {
          this.onAddMakerTraining(false);
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N85, N32'),
        command: () => {
          this.onAddMakerTraining(true);
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N85, N32'),
        command: () => {
          this.onDeleteMakerTraining();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: this.permissionService.hasPermission('N85, N32'),
        command: () => {
          this.ExportExcel();
        },
      },
    ];
  }

  toggleSearchPanel() {
    const isMobile = window.innerWidth <= 960;
    if (this.sizeSearch === '0') {
      this.sizeSearch = isMobile ? '100%' : '22%';
    } else {
      this.sizeSearch = '0';
    }
  }
  searchData() {
    this.getMakerTraining();
    if (window.innerWidth <= 960) {
      this.toggleSearchPanel();
    }
  }
  //search
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  toLocalISOString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error('Invalid date input');
    }

    // Format theo GIỜ LOCAL thực của trình duyệt để tránh lệch timezone.
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    return (
      dateObj.getFullYear() +
      '-' +
      pad(dateObj.getMonth() + 1) +
      '-' +
      pad(dateObj.getDate()) +
      'T' +
      pad(dateObj.getHours()) +
      ':' +
      pad(dateObj.getMinutes()) +
      ':' +
      pad(dateObj.getSeconds())
    ); // YYYY-MM-DDTHH:mm:ss (không có "Z")
  }

  getMakerTraining() {
    const DateStart = DateTime.fromJSDate(
      new Date(this.searchParams.DateStart),
    );
    const DateEnd = DateTime.fromJSDate(new Date(this.searchParams.DateEnd));
    this.MakerTrainingService.getMakerTraining(
      this.searchParams.DepartmentID,
      this.searchParams.MakerTrainingTypeID,
      this.searchParams.FirmID,
      this.searchParams.Keyword,
      this.toLocalISOString(this.searchParams.DateStart),
      this.toLocalISOString(this.searchParams.DateEnd),
    ).subscribe((response: any) => {
      this.makerTrainingData = response.data || [];
    });
  }

  getMakerTrainingDataByID(ID: number) {
    this.MakerTrainingService.getMakerTrainingData(ID).subscribe(
      (response: any) => {
        console.log('Response từ server:', response);

        // Dữ liệu nhân viên
        this.makerTrainingEmployeeData =
          response.data?.MakerTrainingEmployeeLink || [];

        // Dữ liệu nội dung tài liệu
        this.makerTrainingFileData = response.data?.MakerTrainingDocument || [];
      },
    );
  }

  getdataDepartment() {
    this.MakerTrainingService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  getdataFirm() {
    this.MakerTrainingService.getDataFirm().subscribe((response: any) => {
      this.dataFirm = response.data || [];
    });
  }

  onAddMakerTraining(isEditmode: boolean) {
    this.isCheckmode = isEditmode;

    if (this.isCheckmode) {
      if (
        !this.selectedMakerTraining ||
        this.selectedMakerTraining.length === 0
      ) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn 1 bản ghi để sửa!',
        );
        return;
      }
      if (this.selectedMakerTraining.length > 1) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Chỉ được chọn 1 bản ghi để sửa. Vui lòng chọn lại!',
        );
        return;
      }
      this.MakerTrainingID = this.selectedMakerTraining[0].ID;
    } else {
      this.MakerTrainingID = 0;
    }
    const modalRef = this.modalService.open(MakertrainingFormComponent, {
      fullscreen: true,
      size: 'fullscreen',
      scrollable: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newMakerTraining = this.newMakerTraining;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.MakerTrainingID = this.MakerTrainingID;

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.selectedMakerTraining = [];
          this.MakerTrainingID = 0;
          this.makerTrainingEmployeeData = [];
          this.makerTrainingFileData = [];
          this.getMakerTraining();
        }
      })
      .catch(() => {});
  }

  onSelectionChange(selection: any[]) {
    this.selectedMakerTraining = selection;
    if (selection && selection.length > 0) {
      // Lấy bản ghi cuối cùng vừa được chọn
      const lastSelected = selection[selection.length - 1];
      this.MakerTrainingID = lastSelected.ID;
      this.getMakerTrainingDataByID(this.MakerTrainingID);
    } else {
      this.MakerTrainingID = 0;
      this.makerTrainingEmployeeData = [];
      this.makerTrainingFileData = [];
    }
  }

  onDeleteMakerTraining() {
    if (
      !this.selectedMakerTraining ||
      this.selectedMakerTraining.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 bản ghi để xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedMakerTraining.length} bản ghi đã chọn?`,
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const ids = this.selectedMakerTraining.map((x: any) => x.ID);
        this.MakerTrainingService.deleteMakerTraining(ids).subscribe({
          next: (res: any) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Xóa thành công!',
            );
            this.selectedMakerTraining = [];
            this.getMakerTraining();
          },
          error: (err: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err?.error?.message || err?.message || 'Có lỗi xảy ra!',
            );
            console.error(err);
          },
        });
      },
    });
  }

  getDocumentFileByID(id: number) {
    this.MakerTrainingService.getDocumentFileByID(id).subscribe(
      (response: any) => {
        this.documentFileData = response.data || [];
        this.makerTrainingFileData = this.documentFileData;
        console.log('docfile', this.documentFileData);
      },
    );
  }

  handleChange(info: any): void {
    if (info.file.status === 'uploading') {
      console.log('Đang upload...', info.file);
    }
    if (info.file.status === 'done') {
      this.notification.success('Thông báo', 'Upload file thành công!');
      const uploadedFile = {
        FileName: info.file.response.FileName,
        FileNameOrigin: info.file.name, // Tên gốc của file
        DocumentID: info.file.response.IdDocument,
      };
      // this.onFileChange(uploadedFile, this.selectedDocumentId);
      this.getDocumentFileByID(this.MakerTrainingID);
    }
    if (info.file.status === 'error') {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi upload!');
    }
  }

  async ExportExcel() {
    if (this.makerTrainingData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!',
      );
      return;
    }

    const mainData =
      this.selectedMakerTraining.length > 0 ? this.selectedMakerTraining : [];

    // Nếu không chọn dòng nào, chỉ xuất danh sách tổng quát
    if (mainData.length === 0) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách training');
      this.drawSimpleExcel(worksheet, this.makerTrainingData);
      this.saveWorkbook(workbook, 'Danh_sach_dao_tao');
      return;
    }

    // Nếu có chọn dòng, xuất chi tiết cho từng dòng
    this.message.loading('Đang khởi tạo dữ liệu xuất Excel...', {
      nzDuration: 0,
    });

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo chi tiết đào tạo');

      // Styles
      const styles = this.getExcelStyles();

      // Tiêu đề chính
      worksheet.mergeCells('A1:I1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'BÁO CÁO CHI TIẾT ĐÀO TẠO HÃNG';
      titleCell.style = styles.mainTitle;

      let currentRow = 3;

      // Lấy chi tiết cho tất cả các bản ghi đã chọn
      const detailRequests = mainData.map((item) =>
        this.MakerTrainingService.getMakerTrainingData(item.ID),
      );

      forkJoin(detailRequests).subscribe({
        next: (results: any[]) => {
          this.message.remove();

          results.forEach((res, idx) => {
            const masterItem = mainData[idx];
            const employees = res.data?.MakerTrainingEmployeeLink || [];
            const documents = res.data?.MakerTrainingDocument || [];

            // 1. Header cho khối dữ liệu của bản ghi này
            worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
            const blockHeader = worksheet.getCell(`A${currentRow}`);
            blockHeader.value = `${idx + 1}. THÔNG TIN ĐÀO TẠO: ${masterItem.TrainerName} - ${masterItem.FirmName}`;
            blockHeader.font = {
              bold: true,
              size: 14,
              color: { argb: 'FF1F4E78' },
            };
            currentRow += 2;

            // 2. Bảng thông tin Master (ngang)
            this.appendTable(
              worksheet,
              `Thông tin chung`,
              this.makerTrainingColumns,
              [masterItem],
              currentRow,
              styles,
            );
            currentRow = worksheet.lastRow!.number + 2;

            // 3. Bảng Nhân viên
            if (employees.length > 0) {
              this.appendTable(
                worksheet,
                `Danh sách nhân viên tham gia`,
                this.employeeColumns,
                employees,
                currentRow,
                styles,
              );
              currentRow = worksheet.lastRow!.number + 2;
            }

            // 4. Bảng Tài liệu
            if (documents.length > 0) {
              this.appendTable(
                worksheet,
                `Danh sách tài liệu đính kèm`,
                this.fileColumns,
                documents,
                currentRow,
                styles,
              );
              currentRow = worksheet.lastRow!.number + 3;
            }

            // Đường kẻ phân cách giữa các bản ghi
            worksheet.addRow([]);
            const separatorRow = worksheet.addRow([
              '----------------------------------------------------------------------------------------------------',
            ]);
            separatorRow.getCell(1).font = {
              italic: true,
              color: { argb: 'FFA9A9A9' },
            };
            currentRow = worksheet.lastRow!.number + 2;
          });

          // Auto-fit và Save
          this.autoFitColumns(worksheet);
          this.saveWorkbook(
            workbook,
            `Bao_cao_chi_tiet_dao_tao_${format(new Date(), 'yyyyMMdd')}`,
          );
        },
        error: (err) => {
          this.message.remove();
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu chi tiết!',
          );
          console.error(err);
        },
      });
    } catch (error) {
      this.message.remove();
      console.error('Export Error:', error);
    }
  }

  private getExcelStyles() {
    return {
      mainTitle: {
        font: { bold: true, size: 18, color: { argb: 'FF2C3E50' } },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
      },
      header: {
        font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FF4472C4' },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
          wrapText: true,
        },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const },
        },
      },
      cell: {
        font: { size: 10 },
        alignment: { vertical: 'middle' as const, wrapText: true },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const },
        },
      },
    };
  }

  private appendTable(
    worksheet: ExcelJS.Worksheet,
    title: string,
    columns: ColumnDef[],
    data: any[],
    startRow: number,
    styles: any,
  ) {
    // Title
    const titleRow = worksheet.getRow(startRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = {
      bold: true,
      size: 11,
      color: { argb: 'FF1F4E78' },
    };

    // Headers
    const validCols = columns.filter(
      (c) => c.field && c.field !== 'STT' && c.field !== 'addRow',
    );
    const headers = ['STT', ...validCols.map((c) => c.header)];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => (cell.style = styles.header));

    // Data
    data.forEach((item, idx) => {
      const values = [
        idx + 1,
        ...validCols.map((col) => {
          let val = item[col.field];
          if (
            val &&
            (col.field.toLowerCase().includes('date') ||
              col.field.toLowerCase().includes('time'))
          ) {
            const d = parseISO(val);
            return isValid(d) ? format(d, 'dd/MM/yyyy') : val;
          }
          if (typeof val === 'boolean') return val ? 'Đạt' : 'Chưa đạt';
          return val ?? '';
        }),
      ];
      const dataRow = worksheet.addRow(values);
      dataRow.eachCell((cell, colIdx) => {
        cell.style = styles.cell;
        if (colIdx === 1 || headers[colIdx - 1]?.includes('Đánh giá')) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns.forEach((column) => {
      let maxLen = 10;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      column.width = Math.min(maxLen + 5, 50);
    });
  }

  private drawSimpleExcel(worksheet: ExcelJS.Worksheet, data: any[]) {
    const styles = this.getExcelStyles();
    worksheet.mergeCells('A1:I1');
    const title = worksheet.getCell('A1');
    title.value = 'DANH SÁCH ĐÀO TẠO HÃNG (TỔNG QUÁT)';
    title.style = styles.mainTitle;
    this.appendTable(worksheet, '', this.makerTrainingColumns, data, 3, styles);
    this.autoFitColumns(worksheet);
  }

  private async saveWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onCellAction(event: any) {
    if (event.field === 'FileName' || event.field === 'FilePath') {
      this.downloadFile(event.rowData);
    }
  }

  downloadFile(file: any) {
    const filePath = file.FilePath;
    const fileName = file.FileName;

    if (!filePath) {
      this.notification.warning(
        'Thông báo',
        'File chưa có đường dẫn trên server!',
      );
      return;
    }

    this.message.loading('Đang tải file...', { nzDuration: 0 });
    this.projectRequestService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.message.remove();
        this.notification.error(
          'Thông báo',
          'Không thể tải file. Vui lòng thử lại sau!',
        );
        console.error('Download error:', err);
      },
    });
  }
}

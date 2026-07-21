import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SalaryIncreaseService, SalaryIncreaseDetail } from '../salary-increase.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

interface SalaryIncreaseExcelRow {
  STT: number;
  EmployeeCode: string;
  EmployeeName: string;
  EmailTBP: string;
  PreviousBaseSalary: number;
  CurrentBaseSalary: number;
  EmployeeID: number;
  DepartmentName: string;
}

@Component({
  standalone: true,
  selector: 'app-salary-increase-import-excel',
  imports: [CommonModule, FormsModule, NzButtonModule, NzIconModule, NzInputModule, NzProgressModule],
  templateUrl: './salary-increase-import-excel.component.html',
  styleUrls: ['./salary-increase-import-excel.component.css']
})
export class SalaryIncreaseImportExcelComponent implements OnInit {
  private notification = inject(NzNotificationService);
  private activeModal = inject(NgbActiveModal);
  private service = inject(SalaryIncreaseService);

  @Input() salaryIncreaseId: number = 0;
  /** Danh sách EmployeeID đã có sẵn trong đợt tăng lương này - dòng Excel trùng sẽ tự bỏ qua. */
  @Input() existingEmployeeIds: number[] = [];

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: Tabulator | null = null;
  dataTableExcel: SalaryIncreaseExcelRow[] = [];
  displayProgress: number = 0;
  displayText: string = '0/0';
  totalRowsAfterFileRead: number = 0;
  saving: boolean = false;

  private employees: any[] = [];
  private departments: any[] = [];

  ngOnInit(): void {
    forkJoin({
      employees: this.service.getEmployees(),
      departments: this.service.getDepartments()
    }).subscribe({
      next: ({ employees, departments }: any) => {
        this.employees = employees?.status === 1 ? (employees.data || []) : [];
        this.departments = departments?.status === 1 ? (departments.data || []) : [];
      }
    });
  }

  /** DepartmentID -> Department.HeadofDepartment (EmployeeID trưởng bộ phận) -> Employee.EmailCongTy */
  private getLeaderEmail(departmentId: number | null | undefined): string {
    if (!departmentId) return '';
    const dept = this.departments.find(d => d.ID === departmentId);
    if (!dept || !dept.HeadofDepartment) return '';
    const leader = this.employees.find(x => x.ID === dept.HeadofDepartment);
    return leader?.EmailCongTy || '';
  }

  formatProgressText = (percent: number): string => this.displayText;

  openFileExplorer() {
    const fileInput = document.getElementById('fileInputSalaryIncrease') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = '';
        this.resetExcelImportState();
        return;
      }
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';

      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          this.excelSheets = workbook.worksheets.map(s => s.name);
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            await this.readExcelData(workbook, this.selectedSheet);
            this.displayProgress = 0;
            this.displayText = this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu hợp lệ trong sheet.' : `0/${this.totalRowsAfterFileRead} bản ghi`;
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (err) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc tệp Excel.');
          this.resetExcelImportState();
        }
        input.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  }

  onSheetChange() {
    const fileInput = document.getElementById('fileInputSalaryIncrease') as HTMLInputElement;
    if (!this.filePath || !fileInput.files || fileInput.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = e.target.result;
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        await this.readExcelData(workbook, this.selectedSheet);
        this.displayProgress = 0;
      } catch (err) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet đã chọn!');
        this.resetExcelImportState();
      }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
  }

  private normalizeHeader(h: any): string {
    const s = (typeof h === 'string' ? h : h?.toString() || '').trim().toLowerCase();
    const withD = s.replace(/đ/g, 'd');
    const noAccents = withD.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return noAccents.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }

  private headerSynonyms: Record<string, string> = {
    'stt': 'STT',
    'ma nv': 'EmployeeCode',
    'ma nhan vien': 'EmployeeCode',
    'ma nhan su': 'EmployeeCode',
    'ho ten': 'EmployeeName',
    'ho va ten': 'EmployeeName',
    'ten nhan vien': 'EmployeeName',
    'email tbp': 'EmailTBP',
    'email truong bo phan': 'EmailTBP',
    'luong cu': 'PreviousBaseSalary',
    'lcb cu': 'PreviousBaseSalary',
    'luong moi': 'CurrentBaseSalary',
    'lcb moi': 'CurrentBaseSalary'
  };

  private findEmployeeByCode(code: string): any | null {
    if (!code) return null;
    const norm = code.trim().toLowerCase();
    return this.employees.find(e => (e.Code || '').trim().toLowerCase() === norm) || null;
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) return;
    const headerRow = worksheet.getRow(1);
    const fieldToCol: Record<string, number> = {};
    const headerCellCount = (headerRow as any).actualCellCount || headerRow.cellCount;
    for (let c = 1; c <= headerCellCount; c++) {
      const rawCell = headerRow.getCell(c);
      const raw = (rawCell?.text ?? rawCell?.value ?? '').toString();
      const norm = this.normalizeHeader(raw);
      const field = this.headerSynonyms[norm] || norm;
      if (field) fieldToCol[field] = c;
    }

    const data: SalaryIncreaseExcelRow[] = [];
    let validRecords = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const hasKey = fieldToCol['EmployeeCode'] && row.getCell(fieldToCol['EmployeeCode']).value;
      if (!hasKey) return;

      const getText = (field: string) => {
        const col = fieldToCol[field];
        if (!col) return '';
        const v = row.getCell(col).value;
        return v?.toString()?.trim() || '';
      };
      const getNumber = (field: string) => {
        const n = parseFloat(getText(field).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
      };

      const employeeCode = getText('EmployeeCode');
      const emp = this.findEmployeeByCode(employeeCode);

      data.push({
        STT: getNumber('STT') || (rowNumber - 1),
        EmployeeCode: employeeCode,
        EmployeeName: emp?.FullName || getText('EmployeeName') || '',
        EmailTBP: getText('EmailTBP') || this.getLeaderEmail(emp?.DepartmentID),
        PreviousBaseSalary: getNumber('PreviousBaseSalary'),
        CurrentBaseSalary: getNumber('CurrentBaseSalary'),
        EmployeeID: emp?.ID || 0,
        DepartmentName: emp?.DepartmentName || ''
      });
      validRecords++;
    });

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = validRecords;
    this.drawTable();
  }

  addRow(): void {
    const nextStt = (this.dataTableExcel?.length || 0) + 1;
    const newRow: SalaryIncreaseExcelRow = {
      STT: nextStt, EmployeeCode: '', EmployeeName: '', EmailTBP: '',
      PreviousBaseSalary: 0, CurrentBaseSalary: 0, EmployeeID: 0, DepartmentName: ''
    };
    if (this.tableExcel) {
      this.tableExcel.addRow(newRow);
    }
    this.dataTableExcel = [...(this.dataTableExcel || []), newRow];
  }

  private onEmployeeCodeEdited(cell: any): void {
    const rowData: SalaryIncreaseExcelRow = cell.getRow().getData();
    const emp = this.findEmployeeByCode(rowData.EmployeeCode);
    cell.getRow().update({
      EmployeeID: emp?.ID || 0,
      EmployeeName: emp?.FullName || '',
      DepartmentName: emp?.DepartmentName || '',
      EmailTBP: rowData.EmailTBP || this.getLeaderEmail(emp?.DepartmentID)
    });
  }

  drawTable() {
    const deleteCol: ColumnDefinition = {
      title: '',
      field: '_delete',
      width: 40,
      hozAlign: 'center',
      headerSort: false,
      titleFormatter: (_cell: any, _params: any, onRendered: any) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-link p-0 text-success';
        btn.title = 'Thêm dòng';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        onRendered(() => btn.addEventListener('click', () => this.addRow()));
        return btn;
      },
      formatter: () => `<button class="btn btn-link p-0 text-danger" title="Xóa"><i class="fas fa-times"></i></button>`,
      cellClick: (_e: any, cell: any) => {
        const row = cell.getRow();
        const data = row.getData();
        this.dataTableExcel = this.dataTableExcel.filter((r: any) => r !== data);
        row.delete();
      }
    };

    const cols: ColumnDefinition[] = [
      deleteCol,
      { title: 'STT', field: 'STT', width: 60, hozAlign: 'center' },
      {
        title: 'Mã NV', field: 'EmployeeCode', width: 110, editor: 'input', validator: ['required'],
        cellEdited: (cell: any) => this.onEmployeeCodeEdited(cell)
      },
      {
        title: 'Họ tên', field: 'EmployeeName', width: 180,
        formatter: (cell: any) => {
          const row: SalaryIncreaseExcelRow = cell.getRow().getData();
          if (row.EmployeeCode && !row.EmployeeID) {
            return `<span class="text-danger">Không tìm thấy mã NV</span>`;
          }
          if (row.EmployeeID && (this.existingEmployeeIds || []).includes(row.EmployeeID)) {
            return `${cell.getValue() || ''} <span class="text-warning">(đã có trong đợt - sẽ bỏ qua)</span>`;
          }
          return cell.getValue() || '';
        }
      },
      { title: 'Phòng ban', field: 'DepartmentName', width: 150 },
      { title: 'Email TBP', field: 'EmailTBP', width: 200, editor: 'input' },
      { title: 'Lương cũ', field: 'PreviousBaseSalary', width: 130, hozAlign: 'right', editor: 'number' },
      { title: 'Lương mới', field: 'CurrentBaseSalary', width: 130, hozAlign: 'right', editor: 'number', validator: ['required'] }
    ];

    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcelSalaryIncrease', {
        data: this.dataTableExcel || [],
        layout: 'fitDataFill',
        height: '60vh',
        reactiveData: true,
        columns: cols
      });
    } else {
      this.tableExcel.replaceData(this.dataTableExcel || []);
    }
  }

  validateRows(): boolean {
    const rows = this.dataTableExcel || [];
    const tabulatorRows = this.tableExcel?.getRows() || [];
    tabulatorRows.forEach(r => r.getElement().classList.remove('row-error'));

    if (rows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu.');
      return false;
    }

    const errors: string[] = [];
    rows.forEach((r, i) => {
      const stt = Number(r.STT || i + 1);
      const msgs: string[] = [];
      if (!String(r.EmployeeCode || '').trim()) msgs.push(`Vui lòng nhập Mã NV! (Dòng stt: ${stt})`);
      else if (!r.EmployeeID) msgs.push(`Mã NV "${r.EmployeeCode}" không tồn tại! (Dòng stt: ${stt})`);
      if (Number(r.CurrentBaseSalary || 0) <= 0) msgs.push(`Vui lòng nhập Lương mới! (Dòng stt: ${stt})`);
      if (msgs.length > 0) {
        errors.push(...msgs);
        if (tabulatorRows[i]) tabulatorRows[i].getElement().classList.add('row-error');
      }
    });

    if (errors.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, errors[0]);
      return false;
    }
    return true;
  }

  resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    if (this.tableExcel) this.tableExcel.replaceData([]);
  }

  closeExcelModal() { this.activeModal.dismiss(); }

  async downloadTemplate(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Template');
    ws.columns = [
      { header: 'STT', key: 'STT', width: 8 },
      { header: 'Mã NV', key: 'EmployeeCode', width: 15 },
      { header: 'Họ tên', key: 'EmployeeName', width: 25 },
      { header: 'Email TBP', key: 'EmailTBP', width: 28 },
      { header: 'Lương cũ', key: 'PreviousBaseSalary', width: 15 },
      { header: 'Lương mới', key: 'CurrentBaseSalary', width: 15 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.addRow([1, 'NV001', '(hệ thống tự dò theo Mã NV)', '', 10000000, 12000000]);
    const noteRow = ws.addRow(['Ghi chú: Họ tên/Phòng ban sẽ tự động dò theo Mã NV, không cần nhập. Email TBP để trống sẽ tự lấy email của nhân viên.']);
    ws.mergeCells(`B${noteRow.number}:F${noteRow.number}`);
    noteRow.font = { italic: true, color: { argb: 'FF888888' }, size: 10 };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_NhapExcel_DieuChinhLuong.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  saveExcelData() {
    if (!this.validateRows()) return;
    if (!this.salaryIncreaseId) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Chưa xác định đợt tăng lương.');
      return;
    }

    // Bỏ qua nhân viên đã có sẵn trong đợt hoặc trùng lặp ngay trong file Excel (chỉ giữ dòng đầu tiên).
    const seen = new Set<number>(this.existingEmployeeIds || []);
    const skippedCodes: string[] = [];
    const rowsToSave = this.dataTableExcel.filter(r => {
      if (seen.has(r.EmployeeID)) {
        skippedCodes.push(r.EmployeeCode);
        return false;
      }
      seen.add(r.EmployeeID);
      return true;
    });

    if (rowsToSave.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Tất cả nhân viên trong file đều đã có trong đợt tăng lương này.');
      return;
    }

    this.saving = true;
    const payload: SalaryIncreaseDetail[] = rowsToSave.map(r => ({
      ID: 0,
      SalaryIncreaseID: this.salaryIncreaseId,
      EmployeeID: r.EmployeeID,
      EmailTBP: r.EmailTBP || '',
      PreviousBaseSalary: Number(r.PreviousBaseSalary || 0),
      CurrentBaseSalary: Number(r.CurrentBaseSalary || 0),
      IsSend: false,
      IsDeleted: false
    }));

    this.service.saveDataDetail(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Nhập Excel thành công');
          if (skippedCodes.length > 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, `Đã bỏ qua ${skippedCodes.length} nhân viên đã có trong đợt: ${skippedCodes.join(', ')}`);
          }
          this.activeModal.close('save');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Nhập Excel thất bại');
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }
}

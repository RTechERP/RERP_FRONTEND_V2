import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { EconomicContractService } from '../economic-contract-service/economic-contract.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { environment } from '../../../../../environments/environment';

export interface EconomicContractRow {
    STT: number | string;
    TypeCode: string;           // Cột 2: Mã loại HĐ
    TypeName: string;           // Cột 3: Tên loại HĐ
    ContractNumber: string;     // Cột 4: Số HĐ
    ContractContent: string;    // Cột 5: Nội dung
    TypeNCCText: string;        // Cột 6: Loại NCC/KH
    NameNcc: string;            // Cột 7
    MSTNcc: string;             // Cột 8
    AddressNcc: string;         // Cột 9
    SDTNcc: string;             // Cột 10
    EmailNcc: string;           // Cột 11
    SignedAmount: number | string; // Cột 12
    MoneyType: string;          // Cột 13
    TimeUnit: string;           // Cột 14
    Adjustment: string;         // Cột 15
    Note: string;               // Cột 16
    SignDate: string;           // Cột 17
    EffectDateFrom: string;     // Cột 18
    EffectDateTo: string;       // Cột 20
    TermCode: string;           // Cột 21
    TermName: string;           // Cột 22
    StatusContractText: string; // Cột 23
}

/* ================ Helpers ================ */
function getCellText(cell: ExcelJS.Cell): string {
    return normalizeCellValue(cell.value as any);
}

function normalizeCellValue(v: any): string {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v instanceof Date) return DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') ?? '';
    if (Array.isArray((v as any)?.richText)) return (v as any).richText.map((rt: any) => rt.text ?? '').join('');
    if ((v as any)?.text) return String((v as any).text);
    if ((v as any)?.hyperlink && (v as any)?.text) return String((v as any).text);
    if ((v as any)?.result != null) return normalizeCellValue((v as any).result);
    return String(v);
}

function parseNumberSmart(raw: string | number | null | undefined): number | null {
    if (raw == null) return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    let s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/[^\d,.\\-]/g, '');
    const hasComma = s.includes(','), hasDot = s.includes('.');
    if (hasComma && hasDot) {
        const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
        s = lastComma > lastDot ? s.replace(/\\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (hasComma && !hasDot) {
        const parts = s.split(',');
        s = parts.length === 2 && parts[1].length <= 2
            ? parts[0].replace(/\\./g, '') + '.' + parts[1]
            : s.replace(/,/g, '');
    } else if (hasDot) {
        const parts = s.split('.');
        if (parts.length > 2) { const dec = parts.pop(); s = parts.join('') + '.' + dec; }
    }
    const val = Number(s);
    if (!Number.isFinite(val)) return null;
    return val;
}

function parseDate(raw: string | Date | null | undefined): Date | null {
    if (!raw) return null;
    if (raw instanceof Date) return raw;
    const s = String(raw).trim();
    // Try dd/MM/yyyy format
    const parts = s.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    // Try ISO format
    const date = new Date(s);
    return isNaN(date.getTime()) ? null : date;
}

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'app-economic-contract-import-excel',
    imports: [
        CommonModule, FormsModule,
        NzButtonModule, NzIconModule, NzProgressModule, NzInputModule
    ],
    templateUrl: './economic-contract-import-excel.component.html',
    styleUrl: './economic-contract-import-excel.component.css'
})
export class EconomicContractImportExcelComponent implements OnInit, AfterViewInit {
    filePath = '';
    excelSheets: string[] = [];
    selectedSheet = '';
    tableExcel: Tabulator | null = null;
    dataTableExcel: EconomicContractRow[] = [];

    displayProgress = 0;
    displayText = '0/0';
    totalRowsAfterFileRead = 0;
    isLoading = false;

    // Dropdown data
    contractTypes: any[] = [];
    contractTerms: any[] = [];

    constructor(
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private economicContractService: EconomicContractService
    ) { }

    ngOnInit() {
        this.loadDropdownData();
    }

    ngAfterViewInit(): void {
        this.drawtable();
    }

    private loadDropdownData() {
        this.economicContractService.getEconomicContractTypes().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.contractTypes = res.data?.data || [];
                }
            }
        });
        this.economicContractService.getEconomicContractTerms().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.contractTerms = res.data?.data || [];
                }
            }
        });
    }

    /* ===== Progress ===== */
    private setReadingProgress(pct: number, text: string) {
        this.displayProgress = Math.max(0, Math.min(100, pct | 0));
        this.displayText = text;
    }

    formatProgressText() { return this.displayText; }

    /* ===== Table ===== */
    private columns(): ColumnDefinition[] {
        return [
            { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 60 },
            { title: 'Mã loại HĐ', field: 'TypeCode', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Tên loại HĐ', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
            { title: 'Số HĐ', field: 'ContractNumber', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
            { title: 'Nội dung HĐ', field: 'ContractContent', hozAlign: 'left', headerHozAlign: 'center', minWidth: 200 },
            { title: 'Loại NCC/KH', field: 'TypeNCCText', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
            { title: 'Tên NCC/KH', field: 'NameNcc', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
            { title: 'MST', field: 'MSTNcc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Địa chỉ', field: 'AddressNcc', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
            { title: 'SĐT', field: 'SDTNcc', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Email', field: 'EmailNcc', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
            {
                title: 'Giá trị ký', field: 'SignedAmount', hozAlign: 'right', headerHozAlign: 'center', width: 120,
                formatter: (cell) => {
                    const v = cell.getValue();
                    if (v == null || v === '') return '';
                    const num = Number(v);
                    return Number.isFinite(num) ? num.toLocaleString('vi-VN') : String(v);
                }
            },
            { title: 'Loại tiền', field: 'MoneyType', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
            { title: 'Thời hạn', field: 'TimeUnit', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Điều chỉnh', field: 'Adjustment', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
            { title: 'Ngày ký', field: 'SignDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
            { title: 'Hiệu lực từ', field: 'EffectDateFrom', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
            { title: 'Hiệu lực đến', field: 'EffectDateTo', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
            { title: 'Mã điều khoản', field: 'TermCode', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Tên điều khoản', field: 'TermName', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
            { title: 'Trạng thái', field: 'StatusContractText', hozAlign: 'center', headerHozAlign: 'center', width: 100 }
        ];
    }

    drawtable() {
        if (!this.tableExcel) {
            this.tableExcel = new Tabulator('#datatableExcelContract', {
                data: this.dataTableExcel,
                layout: 'fitDataFill',
                ...DEFAULT_TABLE_CONFIG,
                height: '40vh',
                paginationMode: 'local',
                columns: this.columns()
            });
        } else {
            this.tableExcel.setColumns(this.columns());
            this.tableExcel.replaceData(this.dataTableExcel as any);
        }
    }

    /* ===== File handling ===== */
    openFileExplorer() {
        (document.getElementById('fileInputContract') as HTMLInputElement)?.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls'].includes(ext || '')) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Chọn tệp Excel (.xlsx hoặc .xls)');
            input.value = '';
            this.resetExcelImportState();
            return;
        }
        this.filePath = file.name;
        this.excelSheets = [];
        this.selectedSheet = '';
        this.dataTableExcel = [];
        this.totalRowsAfterFileRead = 0;
        this.setReadingProgress(0, 'Đang đọc file...');

        const reader = new FileReader();
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                this.setReadingProgress(pct, `Đang tải file: ${pct}%`);
            }
        };
        reader.onload = async (e: any) => {
            const data = e.target.result;
            try {
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(data);
                this.excelSheets = wb.worksheets.map(s => s.name);
                if (this.excelSheets.length === 0) {
                    this.resetExcelImportState();
                    input.value = '';
                    return;
                }
                this.selectedSheet = this.excelSheets[0];
                await this.readExcelData(wb, this.selectedSheet);
                this.setReadingProgress(0, this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu' : `0/${this.totalRowsAfterFileRead} bản ghi`);
            } catch {
                this.resetExcelImportState();
            }
            input.value = '';
        };
        reader.readAsArrayBuffer(file);
    }

    onSheetChange() {
        if (!this.filePath) return;
        const fileInput = document.getElementById('fileInputContract') as HTMLInputElement;
        if (!fileInput.files || fileInput.files.length === 0) return;
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            try {
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(e.target.result);
                await this.readExcelData(wb, this.selectedSheet);
                this.setReadingProgress(0, this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu' : `0/${this.totalRowsAfterFileRead} bản ghi`);
            } catch {
                this.resetExcelImportState();
            }
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
    }

    /* ===== Parse Excel ===== */
    async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
        const ws = workbook.getWorksheet(sheetName);
        if (!ws) {
            this.resetExcelImportState();
            return;
        }

        // Skip header rows (row 1-3 based on template), data starts from row 4
        const headerRowIndex = 3;
        const data: EconomicContractRow[] = [];
        let total = 0;

        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowIndex) return;

            // Check if row has any data (check important columns)
            const hasData = [2, 3, 4, 5, 6, 7].some(col => {
                const val = row.getCell(col).value;
                return val != null && val !== '';
            });
            if (!hasData) return;

            // Đọc các cell ngày tháng
            const signDateCell = row.getCell(17).value;
            const effectFromCell = row.getCell(18).value;
            const effectToCell = row.getCell(20).value;

            // Thứ tự cột theo export mới:
            // 1-STT, 2-TypeCode, 3-TypeName, 4-ContractNumber, 5-ContractContent, 6-TypeNCCText
            // 7-NameNcc, 8-MSTNcc, 9-AddressNcc, 10-SDTNcc, 11-EmailNcc
            // 12-SignedAmount, 13-MoneyType, 14-TimeUnit, 15-Adjustment, 16-Note
            // 17-SignDate, 18-EffectDateFrom, 19-EffectDateFrom(dup), 20-EffectDateTo
            // 21-TermCode, 22-TermName, 23-StatusContractText
            data.push({
                STT: total + 1,
                TypeCode: getCellText(row.getCell(2)),
                TypeName: getCellText(row.getCell(3)),
                ContractNumber: getCellText(row.getCell(4)),
                ContractContent: getCellText(row.getCell(5)),
                TypeNCCText: getCellText(row.getCell(6)),
                NameNcc: getCellText(row.getCell(7)),
                MSTNcc: getCellText(row.getCell(8)),
                AddressNcc: getCellText(row.getCell(9)),
                SDTNcc: getCellText(row.getCell(10)),
                EmailNcc: getCellText(row.getCell(11)),
                SignedAmount: parseNumberSmart(getCellText(row.getCell(12))) ?? 0,
                MoneyType: getCellText(row.getCell(13)) || 'VND',
                TimeUnit: getCellText(row.getCell(14)),
                Adjustment: getCellText(row.getCell(15)),
                Note: getCellText(row.getCell(16)),
                SignDate: signDateCell instanceof Date ? DateTime.fromJSDate(signDateCell).toFormat('dd/MM/yyyy') : getCellText(row.getCell(17)),
                EffectDateFrom: effectFromCell instanceof Date ? DateTime.fromJSDate(effectFromCell).toFormat('dd/MM/yyyy') : getCellText(row.getCell(18)),
                EffectDateTo: effectToCell instanceof Date ? DateTime.fromJSDate(effectToCell).toFormat('dd/MM/yyyy') : getCellText(row.getCell(20)),
                TermCode: getCellText(row.getCell(21)),
                TermName: getCellText(row.getCell(22)),
                StatusContractText: getCellText(row.getCell(23))
            });
            total++;
        });

        this.dataTableExcel = data;
        this.totalRowsAfterFileRead = total;
        this.setReadingProgress(0, total === 0 ? 'Không có dữ liệu' : `0/${total} bản ghi`);
        if (this.tableExcel) this.tableExcel.replaceData(this.dataTableExcel as any);
        else this.drawtable();
    }

    /* ===== Reset / Close ===== */
    private resetExcelImportState(): void {
        this.filePath = '';
        this.excelSheets = [];
        this.selectedSheet = '';
        this.dataTableExcel = [];
        this.displayProgress = 0;
        this.displayText = '0/0';
        this.totalRowsAfterFileRead = 0;
        if (this.tableExcel) this.tableExcel.replaceData([]);
    }

    closeExcelModal() {
        this.modalService.dismissAll(true);
    }

    /* ===== Download Template ===== */
    async downloadTemplate() {
        try {
            const templateUrl = environment.host + 'api/share/Software/Template/ExportExcel/TemplateExportExcelEconomicContract.xlsx';
            const response = await fetch(templateUrl);
            if (!response.ok) {
                throw new Error('Không thể tải template');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'TemplateImportEconomicContract.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.notification.success(NOTIFICATION_TITLE.success, 'Tải file mẫu thành công!');
        } catch (err) {
            console.error('Lỗi khi tải file mẫu:', err);
            this.notification.error(NOTIFICATION_TITLE.error, 'Tải file mẫu thất bại!');
        }
    }

    /* ===== Helper functions ===== */
    // Tìm ID loại HĐ theo Code hoặc Name
    private findContractTypeIdByCode(code: string, name?: string): number | null {
        if (!this.contractTypes.length) return null;
        // Ưu tiên tìm theo Code
        if (code) {
            const hitByCode = this.contractTypes.find((t: any) =>
                t.TypeCode?.toLowerCase().trim() === code.toLowerCase().trim()
            );
            if (hitByCode) return hitByCode.ID;
        }
        // Tìm theo Name nếu không có Code
        if (name) {
            const hitByName = this.contractTypes.find((t: any) =>
                t.TypeName?.toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (hitByName) return hitByName.ID;
        }
        return null;
    }

    // Tìm ID điều khoản theo Code hoặc Name
    private findContractTermIdByCode(code: string, name?: string): number | null {
        if (!this.contractTerms.length) return null;
        // Ưu tiên tìm theo Code
        if (code) {
            const hitByCode = this.contractTerms.find((t: any) =>
                t.TermCode?.toLowerCase().trim() === code.toLowerCase().trim()
            );
            if (hitByCode) return hitByCode.ID;
        }
        // Tìm theo Name nếu không có Code
        if (name) {
            const hitByName = this.contractTerms.find((t: any) =>
                t.TermName?.toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (hitByName) return hitByName.ID;
        }
        return null;
    }

    // Parse loại NCC/KH
    private parseTypeNCC(text: string): number {
        const s = text?.toLowerCase().trim() || '';
        if (s === 'ncc') return 1;
        if (s === 'kh') return 2;
        return 1; // default NCC
    }

    // Parse trạng thái hợp đồng
    private parseStatusContract(text: string): number {
        const s = text?.toLowerCase().trim() || '';
        if (s.includes('còn hiệu lực') || s === '1') return 1;
        if (s.includes('thanh lý') || s.includes('đã thanh lý') || s === '2') return 2;
        return 1; // default: Còn hiệu lực
    }

    /* ===== Save Data ===== */
    async saveExcelData(): Promise<void> {
        if (!this.dataTableExcel.length) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu.');
            return;
        }

        this.isLoading = true;
        const total = this.dataTableExcel.length;
        let successCount = 0;
        let errorCount = 0;

        // Close modal immediately
        this.closeExcelModal();

        this.notification.info(NOTIFICATION_TITLE.success, `Đang lưu ${total} hợp đồng...`);

        for (let i = 0; i < this.dataTableExcel.length; i++) {
            const row = this.dataTableExcel[i];
            try {
                const payload = {
                    ID: 0,
                    ContractNumber: row.ContractNumber,
                    TypeNCC: this.parseTypeNCC(row.TypeNCCText),
                    EconomicContractTypeID: this.findContractTypeIdByCode(row.TypeCode, row.TypeName),
                    EconomicContractTermID: this.findContractTermIdByCode(row.TermCode, row.TermName),
                    ContractContent: row.ContractContent,
                    NameNcc: row.NameNcc,
                    MSTNcc: row.MSTNcc,
                    AddressNcc: row.AddressNcc,
                    SDTNcc: row.SDTNcc,
                    EmailNcc: row.EmailNcc,
                    SignedAmount: typeof row.SignedAmount === 'number' ? row.SignedAmount : parseNumberSmart(row.SignedAmount) ?? 0,
                    MoneyType: row.MoneyType || 'VND',
                    SignDate: parseDate(row.SignDate)?.toISOString() || null,
                    EffectDateFrom: parseDate(row.EffectDateFrom)?.toISOString() || null,
                    EffectDateTo: parseDate(row.EffectDateTo)?.toISOString() || null,
                    TimeUnit: row.TimeUnit,
                    Adjustment: row.Adjustment,
                    Note: row.Note,
                    StatusContract: this.parseStatusContract(row.StatusContractText),
                    IsDeleted: false
                };

                const res = await firstValueFrom(this.economicContractService.saveEconomicContract(payload));
                if (res?.status === 1) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                errorCount++;
                console.error('Error saving contract:', err);
            }
        }

        this.isLoading = false;

        if (successCount > 0 && errorCount === 0) {
            this.notification.success(NOTIFICATION_TITLE.success, `Đã lưu thành công ${successCount}/${total} hợp đồng.`);
        } else if (successCount > 0 && errorCount > 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu ${successCount}/${total} hợp đồng. ${errorCount} hợp đồng lỗi.`);
        } else {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lưu dữ liệu thất bại. Vui lòng thử lại.');
        }
    }
}

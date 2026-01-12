import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import * as XLSX from 'xlsx';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KpiErrorEmployeeService } from '../kpi-error-employee-service/kpi-error-employee.service';

@Component({
    selector: 'app-import-excel-kpi-error-employee',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzModalModule,
        NzSelectModule,
        NzIconModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
    ],
    templateUrl: './import-excel.component.html',
    styleUrl: './import-excel.component.css'
})
export class ImportExcelKpiErrorEmployeeComponent implements OnInit {
    sheetNames: string[] = [];
    selectedSheet: string | null = null;
    workbook: XLSX.WorkBook | null = null;

    tableData: any[] = [];
    tableHeaders: string[] = [];

    @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
    tabulator!: Tabulator;

    constructor(
        private notification: NzNotificationService,
        private modal: NzModalService,
        private kpiErrorEmployeeService: KpiErrorEmployeeService,
        public activeModal: NgbActiveModal
    ) { }

    ngOnInit(): void {
    }

    onFileChange(evt: any) {
        const target: DataTransfer = <DataTransfer>evt.target;
        if (!target.files || target.files.length === 0) {
            if (this.selectedSheet && this.sheetNames.length > 0) {
                return;
            }
            return;
        }
        this.resetPreview();
        if (target.files.length !== 1) return;

        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: string = e.target.result;
            this.workbook = XLSX.read(bstr, { type: 'binary' });
            this.sheetNames = this.workbook.SheetNames;

            // Tự động chọn sheet đầu tiên và load bảng
            if (this.sheetNames.length > 0) {
                this.selectedSheet = this.sheetNames[0];
                this.onSheetChange();
            }
        };
        reader.readAsBinaryString(target.files[0]);
    }

    private resetPreview() {
        this.selectedSheet = null;
        this.sheetNames = [];
        this.tableHeaders = [];
        this.tableData = [];

        if (this.tabulator) {
            this.tabulator.clearData();
            this.tabulator.setColumns([]);
        }
    }

    onSheetChange() {
        if (this.workbook && this.selectedSheet) {
            const ws = this.workbook.Sheets[this.selectedSheet];
            // header: 1 để đọc raw data theo thứ tự cột (A, B, C...)
            const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            if (rawData.length <= 3) {
                this.tableData = [];
                this.tableHeaders = [];
                return;
            }

            // Dòng 1 là title (bỏ qua), dòng 2 là header (index 1), dòng 3 là header row 2 (bỏ qua)
            const headers = rawData[1] as string[];
            this.tableHeaders = headers.map((h: any) => String(h).trim());

            // Dòng 4 trở đi là data (index 3 trở đi)
            this.tableData = rawData.slice(3)
                // Lọc bỏ các dòng rỗng (tất cả cell đều rỗng hoặc chỉ có khoảng trắng)
                .filter((row: any[]) => row.some(cell => cell !== '' && cell !== null && cell !== undefined && String(cell).trim() !== ''))
                .map((row: any[]) => {
                    const newRow: any = {};
                    headers.forEach((header: string, idx: number) => {
                        let value = row[idx];

                        const headerLower = String(header).toLowerCase();
                        const isDateColumn = headerLower.includes('date') || headerLower.includes('ngày');
                        if (typeof value === 'number' && isDateColumn) {
                            const parsed = XLSX.SSF.parse_date_code(value);
                            if (parsed) {
                                value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`;
                            }
                        }

                        newRow[String(header).trim()] = value;
                    });
                    return newRow;
                });

            this.renderTable();
        }
    }

    renderTable() {
        const dataColumns: any[] = this.tableHeaders.map(col => {
            let align: "left" | "center" | "right" = "left";
            if (col.toLowerCase().includes("date") || col.toLowerCase().includes("ngày")) align = "center";
            else if (col.toLowerCase() === "stt") align = "center";
            else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
            return {
                title: col,
                field: col,
                width: col.toLowerCase() === "stt" ? 60 : 150,
                headerHozAlign: 'center',
                hozAlign: align,
                frozen: col.toLowerCase() === "stt"
            };
        });

        if (this.tabulator) {
            this.tabulator.setColumns(dataColumns);
            this.tabulator.replaceData(this.tableData);
            return;
        }

        this.tabulator = new Tabulator(this.excelTable.nativeElement, {
            data: this.tableData,
            layout: 'fitDataStretch',
            reactiveData: true,
            height: '40vh',
            selectableRows: 1,
            responsiveLayout: false,
            pagination: false,
            paginationMode: 'local',
            columns: dataColumns,
        });
    }

    importData() {
        if (!this.tableData || this.tableData.length === 0) {
            this.notification.warning('Thông báo', 'Không có dữ liệu để nhập!');
            return;
        }

        const mappedData = this.tableData.map(row => {
            const newRow: any = {};
            this.tableHeaders.forEach((header, idx) => {
                let value = row[header];

                const headerLower = String(header).toLowerCase();
                const isDateColumn = headerLower.includes('date') || headerLower.includes('ngày');
                if (isDateColumn && value && typeof value === 'string' && value.includes('/')) {
                }

                newRow[`F${idx + 1}`] = value;
            });
            return newRow;
        });

        this.kpiErrorEmployeeService.importExcel(mappedData).subscribe({
            next: (res: any) => {
                if (res.status === 1) {
                    const created = res?.data?.created ?? res?.created ?? 0;
                    const skipped = res?.data?.skipped ?? res?.skipped ?? 0;
                    const errors = res?.data?.errors ?? res?.errors ?? [];

                    this.notification.success('Thành công', `Tạo mới: ${created} • Bỏ qua: ${skipped}`);

                    let errorContent = '';
                    if (errors && errors.length > 0) {
                        const errorList = errors.slice(0, 10).join('<br>');
                        const moreErrors = errors.length > 10 ? `<br>... và ${errors.length - 10} lỗi khác` : '';
                        errorContent = `<br><div class="text-danger mt-2">Lỗi:<br>${errorList}${moreErrors}</div>`;
                    }

                    this.modal.success({
                        nzTitle: 'Hoàn tất nhập dữ liệu',
                        nzContent: `<div>Tạo mới: <b>${created}</b> • Bỏ qua: <b>${skipped}</b>${errorContent}</div>`,
                        nzOkText: 'Đóng',
                        nzOnOk: () => this.activeModal.close({ success: true, reloadData: true }),
                        nzWidth: 500
                    });
                } else {
                    this.notification.error('Lỗi', res.message || 'Nhập dữ liệu thất bại!');
                }
            },
            error: (err) => {
                console.error('Import error:', err);
                this.notification.error('Lỗi', 'Có lỗi xảy ra khi nhập dữ liệu!');
            }
        });
    }

    downloadTemplate() {
        const fileName = 'Mau_Nhan_Vien_Vi_Pham.xlsx';
        this.kpiErrorEmployeeService.downloadTemplate(fileName).subscribe({
            next: (blob: Blob) => {
                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải file mẫu thành công!');
                } else {
                    this.notification.error('Thông báo', 'File tải về không hợp lệ!');
                }
            },
            error: (res: any) => {
                console.error('Lỗi khi tải file mẫu:', res);
                if (res.error instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorText = JSON.parse(reader.result as string);
                            this.notification.error('Thông báo', errorText.message || 'Tải file mẫu thất bại!');
                        } catch {
                            this.notification.error('Thông báo', 'Tải file mẫu thất bại!');
                        }
                    };
                    reader.readAsText(res.error);
                } else {
                    const errorMsg = res?.error?.message || res?.message || 'Tải file mẫu thất bại. Vui lòng thử lại!';
                    this.notification.error('Thông báo', errorMsg);
                }
            }
        });
    }
}

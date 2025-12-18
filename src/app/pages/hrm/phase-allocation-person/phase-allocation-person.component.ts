import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PhaseAllocationPersonService } from './phase-allocation-person-service/phase-allocation-person.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { forkJoin } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PhaseAllocationPersonFormComponent } from './phase-allocation-person-form/phase-allocation-person-form.component';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzSplitterModule,
        NzGridModule,
        NzInputModule,
        NzSelectModule,
        NzTabsModule,
        NgbModalModule,
        NzModalModule,
        HasPermissionDirective
    ],
    selector: 'app-phase-allocation-person',
    templateUrl: './phase-allocation-person.component.html',
    styleUrls: ['./phase-allocation-person.component.css']
})
export class PhaseAllocationPersonComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('masterTableRef', { static: true }) masterTableRef!: ElementRef<HTMLDivElement>;
    @ViewChild('detailTableRef', { static: true }) detailTableRef!: ElementRef<HTMLDivElement>;

    private ngbModal = inject(NgbModal);
    selectedRow: any = "";
    sizeTbDetail: any = '0';
    masterTable: Tabulator | null = null;
    detailTable: Tabulator | null = null;
    masterData: any[] = [];
    detailData: any[] = [];
    filterText: string = "";
    detailTabTitle: string = "Chi tiết phân bổ";

    // Filter năm và tháng
    currentYear: number = new Date().getFullYear();
    currentMonth: number = new Date().getMonth() + 1;
    yearOptions: number[] = [];
    monthOptions: { value: number; label: string }[] = [
        { value: 1, label: 'Tháng 1' },
        { value: 2, label: 'Tháng 2' },
        { value: 3, label: 'Tháng 3' },
        { value: 4, label: 'Tháng 4' },
        { value: 5, label: 'Tháng 5' },
        { value: 6, label: 'Tháng 6' },
        { value: 7, label: 'Tháng 7' },
        { value: 8, label: 'Tháng 8' },
        { value: 9, label: 'Tháng 9' },
        { value: 10, label: 'Tháng 10' },
        { value: 11, label: 'Tháng 11' },
        { value: 12, label: 'Tháng 12' }
    ];

    exportingExcel = false;
    allMasterData: any[] = []; // Lưu tất cả dữ liệu để filter local

    constructor(
        private notification: NzNotificationService,
        private phaseAllocationService: PhaseAllocationPersonService,
        private modal: NzModalService
    ) {
        // Tạo danh sách năm (từ năm hiện tại - 5 đến năm hiện tại + 5)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            this.yearOptions.push(i);
        }
    }

    ngAfterViewInit(): void {
        this.drawTable();
        this.loadData();
    }

    ngOnInit() {
        // Không cần debounce nữa vì chỉ tìm kiếm khi nhấn Enter
    }

    loadData() {
        this.phaseAllocationService.getPhasedAllocationPerson(this.currentYear, this.currentMonth).subscribe({
            next: (response) => {
                if (response && response.status === 1 && response.data) {
                    this.allMasterData = Array.isArray(response.data) ? response.data : [];
                    this.filterData();
                } else {
                    this.allMasterData = [];
                    if (this.masterTable) {
                        this.masterTable.setData([]);
                    }
                }
            },
            error: (error: any) => {
                console.error('Lỗi khi tải dữ liệu:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu');
                this.allMasterData = [];
                if (this.masterTable) {
                    this.masterTable.setData([]);
                }
            }
        });
    }

    filterData() {
        if (!this.masterTable) return;

        let filteredData = [...this.allMasterData];

        // Filter theo từ khóa tìm kiếm
        if (this.filterText && this.filterText.trim() !== '') {
            const keyword = this.filterText.toLowerCase().trim();
            filteredData = filteredData.filter((item: any) => {
                const code = (item.Code || '').toLowerCase();
                const name = (item.ContentAllocation || '').toLowerCase();
                const type = (item.TypeAllocationText || '').toLowerCase();
                const status = (item.StatusAllocationText || '').toLowerCase();
                return code.includes(keyword) ||
                    name.includes(keyword) ||
                    type.includes(keyword) ||
                    status.includes(keyword);
            });
        }

        // Set dữ liệu đã filter vào table
        this.masterTable.setData(filteredData);
    }

    ngOnDestroy() {
        // Cleanup nếu cần
    }

    drawTable() {
        this.masterTable = new Tabulator(this.masterTableRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitColumns',
            selectableRows: true,
            data: [],
            paginationMode: "local",

            columns: [
                { title: "ID", field: "ID", visible: false },
                {
                    title: "STT",
                    field: "STT",
                    hozAlign: "right",
                    headerHozAlign: "center",
                    width: 70,
                    sorter: "number",
                    bottomCalc: "count"
                },
                {
                    title: "Mã phân bổ",
                    field: "Code",
                    hozAlign: "left",
                    headerHozAlign: "center",
                    formatter: 'textarea'
                },
                {
                    title: "Tên phân bổ",
                    field: "ContentAllocation",
                    hozAlign: "left",
                    headerHozAlign: "center",
                    formatter: 'textarea'
                },
                {
                    title: "Loại",
                    field: "TypeAllocationText",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    formatter: 'textarea'

                },
                {
                    title: "Năm",
                    field: "YearValue",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    formatter: 'textarea'

                },
                {
                    title: "Tháng",
                    field: "MontValue",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    formatter: 'textarea'

                },

                {
                    title: "Trạng thái",
                    field: "StatusAllocationText",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    formatter: 'textarea'
                },

            ]
        });

        this.masterTable.on('rowClick', (evt, row: RowComponent) => {
            const rowData = row.getData();
            const ID = rowData['ID'];
            const code = rowData['Code'] || '';

            // Cập nhật tiêu đề tab với mã phân bổ
            this.detailTabTitle = `Chi tiết phân bổ: ${code}`;

            this.phaseAllocationService.getPhasedAllocationPersonDetail(ID).subscribe({
                next: (response) => {
                    if (response && response.status === 1 && response.data) {
                        this.detailData = Array.isArray(response.data) ? response.data : [];
                        this.drawDetailTable();
                    } else {
                        this.detailData = [];
                        this.drawDetailTable();
                    }
                },
                error: (error) => {
                    console.error('Lỗi khi lấy chi tiết:', error);
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết phân bổ');
                    this.detailData = [];
                    this.drawDetailTable();
                }
            });
        });

        this.masterTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
            this.selectedRow = row.getData();
            this.sizeTbDetail = null;
        });
    }

    private drawDetailTable(): void {
        if (this.detailTable) {
            this.detailTable.setData(this.detailData);
            return;
        }

        this.detailTable = new Tabulator(this.detailTableRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            height: '85vh',
            data: this.detailData,
            paginationMode: "local",
            layout: "fitDataStretch",
            columns: [
                {
                    title: "STT",
                    formatter: "rownum",
                    hozAlign: "right",
                    headerHozAlign: "center",
                    width: 70
                },
                {
                    title: 'Mã nhân viên',
                    field: 'EmployeeCode',
                    headerHozAlign: 'center',
                    hozAlign: 'left',
                    formatter: 'textarea'
                },
                {
                    title: 'Tên nhân viên',
                    field: 'EmployeeFuleName',
                    headerHozAlign: 'center',
                    hozAlign: 'left', formatter: 'textarea'

                },
                {
                    title: 'Phòng ban',
                    field: 'DepartmentName',
                    headerHozAlign: 'center',
                    hozAlign: 'left', formatter: 'textarea'
                },
                {
                    title: 'Ngày nhận',
                    field: 'DateReceive',
                    headerHozAlign: 'center',
                    hozAlign: 'center',

                    formatter: (cell) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        try {
                            return DateTime.fromISO(value).toFormat('dd/MM/yyyy ');
                        } catch {
                            const date = new Date(value);
                            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy ');
                        }
                    }
                },
                {
                    title: 'Trạng thái nhận',
                    field: 'StatusReceive',

                    headerHozAlign: 'center',
                    hozAlign: 'center',

                    formatter: (cell) => {
                        const value = cell.getValue();
                        const checked = value === true || value === 'true' || value === 1 || value === '1';
                        return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
                    }
                }
            ]
        });
    }

    onAddPhaseAllocation() {
        const modalRef = this.ngbModal.open(PhaseAllocationPersonFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = {
            ID: 0,
            Year: this.currentYear,
            Month: this.currentMonth
        };
        modalRef.result.then(
            (result) => {
                this.loadData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    getSelectedIds(): number[] {
        if (this.masterTable) {
            const selectedRows = this.masterTable.getSelectedData();
            return selectedRows.map((row: any) => row.ID);
        }
        return [];
    }

    onDeletePhaseAllocation() {
        const selectedRows = this.masterTable?.getSelectedData?.() || [];
        if (!selectedRows.length) {
            this.notification.warning('Thông báo', 'Vui lòng chọn bản ghi cần xóa');
            return;
        }

        const count = selectedRows.length;
        const content = `Bạn có muốn xóa ${count} phân bổ đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const deleteRequests = selectedRows.map((row: any) => {
                    const payload = {
                        ID: row.ID,
                        IsDeleted: true
                    };
                    return this.phaseAllocationService.saveData(payload);
                });

                forkJoin(deleteRequests).subscribe({
                    next: (responses: any[]) => {
                        const success = responses.filter(r => r?.status === 1).length;
                        const failed = responses.length - success;

                        if (failed === 0) {
                            this.notification.success('Thành công', `Đã xóa ${success} phân bổ.`);
                        } else if (success === 0) {
                            this.notification.error('Lỗi', 'Không xóa được phân bổ nào.');
                        } else {
                            this.notification.warning('Kết quả', `Xóa thành công ${success}, lỗi ${failed}.`);
                        }

                        this.masterTable?.deselectRow?.(this.masterTable.getSelectedRows());
                        this.loadData();
                        this.detailData = [];
                        this.detailTable?.setData?.([]);
                    },
                    error: (res: any) => {
                        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Lỗi khi xóa');
                    }
                });
            }
        });
    }

    onEditPhaseAllocation() {
        const selectedData = this.masterTable?.getSelectedData?.();
        if (!selectedData || selectedData.length === 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn phân bổ cần sửa!');
            return;
        }
        const selectedRow = selectedData[0];
        const phasedID = selectedRow['ID'];

        // Gọi lại API để lấy detail mới nhất
        this.phaseAllocationService.getPhasedAllocationPersonDetail(phasedID).subscribe({
            next: (response) => {
                const detailData = response?.data || [];

                const modalRef = this.ngbModal.open(PhaseAllocationPersonFormComponent, {
                    size: 'xl',
                    backdrop: 'static',
                    keyboard: false,
                    centered: true,
                });
                modalRef.componentInstance.dataInput = {
                    master: selectedRow,
                    details: detailData,
                };
                modalRef.result.then(
                    (result) => {
                        this.loadData();
                        // Reload lại detail nếu đang mở
                        if (this.detailData.length > 0) {
                            this.phaseAllocationService.getPhasedAllocationPersonDetail(phasedID).subscribe(res => {
                                if (res && res.status === 1 && res.data) {
                                    this.detailData = Array.isArray(res.data) ? res.data : [];
                                    this.detailTable?.setData?.(this.detailData);
                                }
                            });
                        }
                    },
                    (dismissed) => {
                        console.log('Modal dismissed');
                    }
                );
            },
            error: (err) => {
                this.notification.error('Lỗi', 'Không thể lấy dữ liệu chi tiết phân bổ');
                console.error(err);
            }
        });
    }

    closePanel() {
        this.sizeTbDetail = '0';
        this.detailData = [];
        this.detailTabTitle = "Chi tiết phân bổ";
        if (this.detailTable) {
            this.detailTable.setData([]);
        }
    }

    searchPhaseAllocation() {
        // Đóng panel chi tiết khi tìm kiếm
        this.closePanel();
        this.filterData();
    }

    onYearChange() {
        // Đóng panel chi tiết khi thay đổi năm
        this.closePanel();
        this.loadData();
    }

    onMonthChange() {
        // Đóng panel chi tiết khi thay đổi tháng
        this.closePanel();
        this.loadData();
    }

    async exportToExcel() {
        if (!this.masterTable) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
            return;
        }

        this.exportingExcel = true;

        try {
            // Lấy tất cả dữ liệu master
            const response = await this.phaseAllocationService.getPhasedAllocationPerson(this.currentYear, this.currentMonth).toPromise();

            if (!response || response.status !== 1 || !response.data) {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
                this.exportingExcel = false;
                return;
            }

            const allMasterData = Array.isArray(response.data) ? response.data : [];

            if (allMasterData.length === 0) {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
                this.exportingExcel = false;
                return;
            }

            // Lấy chi tiết cho tất cả master
            const detailRequests = allMasterData.map((master: any) =>
                this.phaseAllocationService.getPhasedAllocationPersonDetail(master.ID).toPromise()
            );

            const detailResponses = await Promise.all(detailRequests);

            // Chuẩn bị dữ liệu xuất
            const exportData = allMasterData.map((master: any, idx: number) => {
                const detailResponse = detailResponses[idx];
                const details = (detailResponse?.data && Array.isArray(detailResponse.data)) ? detailResponse.data : [];

                const formatDate = (val: any) => {
                    if (!val) return '';
                    try {
                        return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
                    } catch {
                        const date = new Date(val);
                        return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
                    }
                };

                return {
                    'STT': idx + 1,
                    'Mã phân bổ': master.Code || '',
                    'Tên phân bổ': master.Name || '',
                    'Năm': master.Year || '',
                    'Tháng': master.Month || '',
                    'Ngày tạo': formatDate(master.CreatedDate),
                    'Số lượng nhân viên': details.length,
                    'Danh sách nhân viên': details.map((d: any) => `${d.EmployeeCode} - ${d.EmployeeName}`).join('; ')
                };
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('PhanBoNhanVien');

            // Thêm header
            worksheet.columns = [
                { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
                { header: 'Mã phân bổ', key: 'Mã phân bổ', width: 20 },
                { header: 'Tên phân bổ', key: 'Tên phân bổ', width: 30 },
                { header: 'Năm', key: 'Năm', width: 10 },
                { header: 'Tháng', key: 'Tháng', width: 10 },
                { header: 'Ngày tạo', key: 'Ngày tạo', width: 18 },
                { header: 'Số lượng nhân viên', key: 'Số lượng nhân viên', width: 20 },
                { header: 'Danh sách nhân viên', key: 'Danh sách nhân viên', width: 50 },
            ];

            // Thêm dữ liệu
            exportData.forEach((row: any) => worksheet.addRow(row));

            // Định dạng header
            worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
                cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1677FF' }
                };
            });
            worksheet.getRow(1).height = 30;

            // Định dạng các dòng dữ liệu
            worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
                if (rowNumber !== 1) {
                    row.height = 30;
                    row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    row.getCell('STT').font = { name: 'Times New Roman', size: 10 };

                    ['Năm', 'Tháng', 'Ngày tạo', 'Số lượng nhân viên'].forEach((colName: string) => {
                        const cell = row.getCell(colName);
                        if (cell) {
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            cell.font = { name: 'Times New Roman', size: 10 };
                        }
                    });

                    row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
                        const headerValue = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
                        if (colNumber !== 1 &&
                            !['Năm', 'Tháng', 'Ngày tạo', 'Số lượng nhân viên'].includes(headerValue)) {
                            cell.font = { name: 'Times New Roman', size: 10 };
                            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                        }
                    });
                }
            });

            // Xuất file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `PhanBoNhanVien_${this.currentYear}_${String(this.currentMonth).padStart(2, '0')}.xlsx`;
            saveAs(blob, fileName);

            this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
        } catch (error: any) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
        } finally {
            this.exportingExcel = false;
        }
    }
}


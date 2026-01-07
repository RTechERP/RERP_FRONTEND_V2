import { Component, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PayrollService } from '../payroll.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { PayrollDetailComponent } from '../payroll-detail/payroll-detail.component';
import { MainLayoutComponent } from '../../../../layouts/main-layout/main-layout.component';
import { PayrollReportComponent } from '../payroll-report/payroll-report.component';
import { BonusDeductionComponent } from '../bonus-deduction/bonus-deduction.component';
import { HasPermissionDirective } from "../../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { from, EMPTY, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

@Component({
    selector: 'app-payroll',
    imports: [
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
        NzSpinModule,
        NzTreeSelectModule,
        NzModalModule,
        CommonModule,
        HasPermissionDirective
    ],
    templateUrl: './payroll.component.html',
    styleUrl: './payroll.component.css'
})
export class PayrollComponent implements OnInit, AfterViewInit {
    //#region  Khai báo biến
    @ViewChild('tb_Payroll', { static: false })
    tb_payrollContainer!: ElementRef;
    tb_Payroll: any;

    sizeSearch: string = '0';
    keyWord: string = '';
    year: any = new Date();

    selectedArrEmployeePayroll: Set<any> = new Set();

    constructor(
        private injector: EnvironmentInjector,
        private appRef: ApplicationRef,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private router: Router,
        private payrollService: PayrollService,
        private mainLayout: MainLayoutComponent
    ) { }
    //#endregion

    //#region Các hàm chạy
    ngOnInit() {
    }

    ngAfterViewInit(): void {
        this.drawTbPayroll(this.tb_payrollContainer.nativeElement);
    }

    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }

    refresh() {
        this.year = new Date();
        this.keyWord = '';
        this.selectedArrEmployeePayroll.clear();
        this.drawTbPayroll(this.tb_payrollContainer.nativeElement);
    }

    filter() {
        this.selectedArrEmployeePayroll.clear();
        this.drawTbPayroll(this.tb_payrollContainer.nativeElement);
    }

    drawTbPayroll(container: HTMLElement) {
        let rowContextmenu = [
            {
                label: "Xem báo cáo",
                action: (e: any, row: any) => {
                    this.handlePayrollAction('payrollReport');
                }
            },
            {
                label: "Sửa",
                action: (e: any, row: any) => {
                    this.handlePayrollAction('update');
                }
            },
            {
                label: "Xóa",
                action: (e: any, row: any) => {
                    this.handlePayrollAction('delete');
                }
            },
        ];

        this.tb_Payroll = new Tabulator(container, {
            ...DEFAULT_TABLE_CONFIG,
            height: '100%',
            layout: 'fitDataStretch',
            rowContextMenu: rowContextmenu,
            ajaxURL: this.payrollService.getEmployeePayroll(),
            ajaxParams: {
                keyWord: this.keyWord ?? '',
                year: this.year.getFullYear() ?? new Date().getFullYear(),
            },
            ajaxResponse: (url, params, res) => {
                return {
                    data: res.data.data,
                    last_page: res.data.totalPage ?? 1,
                };
            },
            ajaxConfig: {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    "Content-Type": "application/json",
                }
            },
            columns: [
                {
                    title: "Duyệt",
                    field: "isApproved",
                    hozAlign: "center",
                    formatter: function (cell) {
                        let value = cell.getValue();
                        return value
                            ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
                            : "<input type='checkbox' readonly style='pointer-events:none'>";
                    },
                    width: 200,
                },
                { title: 'Năm', field: '_Year', headerHozAlign: 'center', hozAlign: 'right', width: 100, },
                { title: 'Tháng', field: '_Month', headerHozAlign: 'center', hozAlign: 'right', width: 100, },
                { title: 'Tên bảng chấm công', field: 'Name', headerHozAlign: 'center', hozAlign: 'left', width: 300, },
                { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center', hozAlign: 'left', width: 500, },

            ],
        });

        this.tb_Payroll.on('dataLoading', () => {
            this.tb_Payroll.deselectRow();
        });

        this.tb_Payroll.on('rowDblClick', (e: any, row: any) => {
            this.handlePayrollAction('update');
        })
        // Lắng nghe sự kiện chọn
        this.tb_Payroll.on('rowSelected', (row: any) => {
            const id = row.getData().ID;
            this.selectedArrEmployeePayroll.add(row.getData());
        });

        // Click vào row (không phải checkbox) → chỉ chọn 1 row
        this.tb_Payroll.on('rowClick', (e: any, row: any) => {
            const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
            if (clickedField !== 'select') {
                // Bỏ chọn hết và chọn row hiện tại
                this.tb_Payroll.deselectRow();
                row.select();
            }
        });
        // Lắng nghe sự kiện bỏ chọn
        this.tb_Payroll.on('rowDeselected', (row: any) => {
            const id = row.getData().ID;
            this.selectedArrEmployeePayroll.delete(row.getData());
        });
    }

    handlePayrollAction(type: string) {
        let selected = this.tb_Payroll.getSelectedData();
        console.log('selected:', selected);
        if (type === 'create') {
            const modalRef = this.modalService.open(PayrollDetailComponent, {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                scrollable: true,
                size: 'xl'
            });
            modalRef.result.finally(() => {
                this.resetMain();
            });
            return;
        }

        if (this.selectedArrEmployeePayroll.size <= 0) {
            this.notification.create(
                'warning',
                'Thông báo',
                `Vui lòng chọn bảng lương cần ${type === 'update' ? 'cập nhật' : type === 'delete' ? 'xóa' : type === 'approve' ? 'duyệt' : type === 'payrollReport' ? 'xem báo cáo' : type === 'bonusPenaltyDetails' ? 'xem chi tiết thưởng phạt' : 'hủy duyệt'}.`
            );
            return;
        }

        const last: any = Array.from(this.selectedArrEmployeePayroll).at(-1);

        switch (type) {
            case 'update': {
                if (selected.length != 1) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Vui lòng chỉ chọn 1 bảng lương để sửa!`
                    );
                }

                if (last?.isApproved === true) {
                    this.notification.create(
                        'warning',
                        'Thông báo',
                        `${last.Name} đã được duyệt, vui lòng hủy duyệt trước khi sửa!`
                    );
                    return;
                }
                const modalRef = this.modalService.open(PayrollDetailComponent, {
                    backdrop: 'static',
                    keyboard: false,
                    centered: true,
                    scrollable: true,
                    size: 'xl'
                });
                modalRef.componentInstance.employeePayrollID = last.ID ?? 0;
                modalRef.result.finally(() => {
                    this.resetMain();
                });
                break;
            }

            case 'delete': {
                if (selected.length <= 0) {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        `Vui lòng chọn bảng lương cần xóa!`
                    );
                    return;
                }

                this.modal.confirm({
                    nzTitle: 'Xác nhận xóa',
                    nzContent: `Bạn có chắc chắn muốn xóa "${selected.length}" bảng lương không?
                      Những bảng lương đã duyệt sẽ được bỏ qua!`,
                    nzOkText: 'Xóa',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                        from(selected)
                            .pipe(
                                concatMap((row: any) => {
                                    if (row.isApproved === true) {
                                        return EMPTY;
                                    }
                                    return this.payrollService.deleteEmployeePayroll(row.ID).pipe(
                                        catchError(err => {
                                            this.notification.error(
                                                NOTIFICATION_TITLE.error,
                                                `Lỗi xóa bảng lương "${row.Name}".`
                                            );
                                            return of(null);
                                        })
                                    );
                                })
                            )
                            .subscribe({
                                next: (res: any) => {

                                },
                                complete: () => {
                                    this.notification.success(
                                        NOTIFICATION_TITLE.success,
                                        'Xóa dữ liệu hoàn tất!'
                                    );
                                    this.resetMain();
                                }
                            });

                    }
                });

                break;
            }

            case 'approve': {
                if (selected.length <= 0) {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        `Vui lòng chọn bảng lương cần duyệt!`
                    );
                    return;
                }

                this.modal.confirm({
                    nzTitle: 'Xác nhận duyệt',
                    nzContent: `Bạn có chắc chắn muốn duyệt "${selected.length}" bảng lương không? Những bảng lương đã duyệt sẽ bị bỏ qua.`,
                    nzOkText: 'Duyệt',
                    nzOkType: 'primary',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                        from(selected)
                            .pipe(
                                concatMap((row: any) => {
                                    if (row.isApproved !== false) {
                                        return EMPTY;
                                    }

                                    return this.payrollService.approvedEmployeePayroll(row.ID, true).pipe(
                                        catchError(err => {
                                            this.notification.error(
                                                NOTIFICATION_TITLE.error,
                                                `Lỗi duyệt bảng lương "${row.Name}".`
                                            );
                                            return of(null);
                                        })
                                    );
                                })
                            )
                            .subscribe({
                                next: (res: any) => {
                                },
                                complete: () => {
                                    this.notification.success(
                                        NOTIFICATION_TITLE.success,
                                        'Hoàn tất duyệt bảng lương!'
                                    );
                                    this.resetMain();
                                }
                            });
                    }
                });

                break;
            }

            case 'unapprove': {
                if (selected.length <= 0) {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        `Vui lòng chọn bảng lương cần hủy duyệt!`
                    );
                    return;
                }

                this.modal.confirm({
                    nzTitle: 'Xác nhận hủy duyệt',
                    nzContent: `Bạn có chắc chắn muốn hủy duyệt "${selected.length}" bảng lương không? Những bảng lương chưa được duyệt sẽ bị bỏ qua.`,
                    nzOkText: 'Hủy duyệt',
                    nzOkType: 'primary',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                        from(selected)
                            .pipe(
                                concatMap((row: any) => {
                                    if (row.isApproved !== true) {
                                        return EMPTY;
                                    }

                                    return this.payrollService.approvedEmployeePayroll(row.ID, false).pipe(
                                        catchError(err => {
                                            this.notification.error(
                                                NOTIFICATION_TITLE.error,
                                                `Lỗi hủy duyệt bảng lương "${row.Name}".`
                                            );
                                            return of(null);
                                        })
                                    );
                                })
                            )
                            .subscribe({
                                next: (res: any) => {
                                },
                                complete: () => {
                                    this.notification.success(
                                        NOTIFICATION_TITLE.success,
                                        'Hoàn tất hủy duyệt bảng lương!'
                                    );
                                    this.resetMain();
                                }
                            });
                    }
                });

                break;
            }
            // báo cáo bảng lương
            case 'payrollReport': {
                this.payrollReport(selected[0].ID);
                return;
            }
            // chi tiết thưởng phạt
            case 'bonusPenaltyDetails': {
                this.bonusPenaltyDetails(last.ID, last._Month);
                return;
            }
        }

    }

    resetMain() {
        this.selectedArrEmployeePayroll.clear();
        this.drawTbPayroll(this.tb_payrollContainer.nativeElement);
    }

    bonusPenaltyDetails(payrollId: number, month: number) {
        const modalRef = this.modalService.open(BonusDeductionComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });
        modalRef.componentInstance.payrollId = payrollId;
        modalRef.componentInstance.year = this.year;
        modalRef.componentInstance.month = month;

        modalRef.result.catch((reason) => {
            if (reason == true) {
                this.resetMain();
            }
        });
    }

    payrollReport(payrollId: number) {
        const modalRef = this.modalService.open(PayrollReportComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });

        console.log('payrollId:', payrollId);
        modalRef.componentInstance.payrollId = payrollId;

        modalRef.result.catch((reason) => {
            if (reason == true) {
                this.resetMain();
            }
        });
    }

    private notifyResult(action: string, successCount: number, errorCount: number, total: number) {
        if (successCount > 0 && errorCount === 0) {
            this.notification.create('success', 'Thành công', `Đã ${action} ${total} bảng lương.`);
        } else if (successCount > 0 && errorCount > 0) {
            this.notification.create('warning', 'Kết quả', `${action.charAt(0).toUpperCase()
                + action.slice(1)} thành công ${successCount} bảng lương, lỗi ${errorCount} bảng lương.`);
        } else {
            this.notification.create('error', 'Lỗi', `Không thể ${action} bất kỳ bảng lương nào.`);
        }
        this.selectedArrEmployeePayroll.clear();
        this.drawTbPayroll(this.tb_Payroll.nativeElement);
    }

    async exportExcel() {
        const table = this.tb_Payroll;
        if (!table) return;

        const data = table.getData?.() ?? [];
        if (!data.length) {
            this.notification?.error?.('', 'Không có dữ liệu để xuất Excel!', {
                nzStyle: { fontSize: '0.75rem' }
            });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bảng lương');

        const columns: any[] = table.getColumns?.() ?? [];
        const filteredColumns = columns.filter(c => {
            const def = c.getDefinition?.();
            return def && def.visible !== false && def.formatter !== 'rowSelection';
        });

        const headers = filteredColumns.map(c => c.getDefinition().title ?? '');
        const headerRow = worksheet.addRow(headers);

        headerRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
            cell.border = { bottom: { style: 'thin' } };
        });

        data.forEach((row: any) => {
            const rowData = filteredColumns.map((col: any) => {
                const def = col.getDefinition?.() ?? {};
                const field = col.getField?.();
                let value = field ? row[field] : '';

                // isApproved → ✓ / ✗
                if (field === 'isApproved') {
                    value = row.isApproved ? '✓' : '✗';
                }

                if (typeof value === 'string') {
                    value = value.replace(/(\r\n|\n\r|\r)/g, '\n');
                }

                return value ?? '';
            });

            const r = worksheet.addRow(rowData);

            filteredColumns.forEach((col: any, idx: number) => {
                const align = (col.getDefinition?.().hozAlign || 'left') as string;
                r.getCell(idx + 1).alignment = {
                    horizontal: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
                    vertical: 'middle',
                    wrapText: true
                };
            });
        });

        worksheet.columns.forEach((column: any) => {
            if (!column) return;
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const v = cell.value;
                const s = v instanceof Date ? 'dd/mm/yyyy' : (v ?? '').toString();
                maxLength = Math.max(maxLength, s.length + 2);
            });
            column.width = Math.max(8, Math.min(maxLength, 50));
        });

        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: headers.length }
        };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const formattedDate = new Date().toISOString().slice(2, 10).split('-').reverse().join('');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BangLuong-${formattedDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    //#endregion


}

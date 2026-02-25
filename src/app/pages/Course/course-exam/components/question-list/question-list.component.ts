import { Component, OnInit, OnChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { QuestionData } from '../../course-exam.types';
import { environment } from '../../../../../../environments/environment';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzImageService, NzImageModule } from 'ng-zorro-antd/image';

@Component({
    selector: 'app-question-list',
    standalone: true,
    imports: [CommonModule, MenubarModule, NzSpinModule, NzImageModule],
    templateUrl: './question-list.component.html',
    styleUrls: ['./question-list.component.css'],
    providers: [NzImageService]
})
export class QuestionListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: QuestionData[] = [];
    @Input() examType: number = 0;
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() questionSelected = new EventEmitter<QuestionData[]>();
    @Output() questionFocused = new EventEmitter<QuestionData>();
    @Output() menuAction = new EventEmitter<string>();

    @ViewChild('QuestionTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;
    private boundResizeHandler: any;

    menuItems: MenuItem[] = [
        {
            label: 'Thêm',
            icon: 'fa-solid fa-circle-plus fa-lg text-success',
            command: () => this.menuAction.emit('add'),
        },
        {
            label: 'Sửa',
            icon: 'fa-solid fa-file-pen fa-lg text-primary',
            command: () => this.menuAction.emit('edit'),
        },
        {
            label: 'Xóa',
            icon: 'fa-solid fa-trash fa-lg text-danger',
            command: () => this.menuAction.emit('delete'),
        },
        // {
        //     label: 'Copy',
        //     icon: 'fa-solid fa-copy fa-lg text-warning',
        //     command: () => this.menuAction.emit('copy'),
        // },
        {
            label: 'Refresh',
            icon: 'fa-solid fa-sync fa-lg text-danger',
            command: () => this.menuAction.emit('refresh'),
        },
        {
            label: 'Xuất excel',
            icon: 'fa-solid fa-file-excel fa-lg text-success',
            command: () => this.menuAction.emit('export-excel'),
        },
        {
            label: 'Nhập excel',
            icon: 'fa-solid fa-file-import fa-lg text-info',
            command: () => this.menuAction.emit('import-excel'),
        },
        { separator: true },
    ];

    constructor(
        private notification: NzNotificationService,
        private nzImageService: NzImageService
    ) { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('QuestionList: ngOnChanges', changes);
        // Retry initialization if table doesn't exist yet but view is ready
        if (!this.table && this.tableRef && this.tableRef.nativeElement) {
            console.log('QuestionList: Retrying initialization in ngOnChanges');
            this.drawTable();
        }

        if (this.table && this.isTableBuilt) {
            const el = this.table.element;
            if (!el || !document.body.contains(el)) {
                console.warn('QuestionList: Table element detached');
                return;
            }

            if (changes['data']) {
                console.log(`QuestionList: Replacing data with ${this.data.length} items`);
                this.table.replaceData(this.data).then(() => {
                    console.log('QuestionList: replaceData success');
                    if (this.autoSelectFirst) {
                        this.selectFirstRow();
                    }
                }).catch((err: any) => {
                    console.warn('QuestionList: replaceData failed', err);
                });
            }
            if (changes['examType']) {
                this.updateColumnVisibility();
            }
        }
    }

    ngAfterViewInit(): void {
        this.drawTable();
    }

    ngOnDestroy(): void {
        if (this.boundResizeHandler) {
            window.removeEventListener('resize', this.boundResizeHandler);
        }
        if (this.table) {
            this.table.destroy();
            this.table = null;
            this.isTableBuilt = false;
        }
    }

    private updateColumnVisibility(): void {
        if (!this.table) return;
        const columns = ['1', '2', '3', '4'];
        if (this.examType === 1) {
            columns.forEach(col => this.table?.showColumn(col));
        } else {
            columns.forEach(col => this.table?.hideColumn(col));
        }
    }

    private drawTable(): void {
        if (!this.tableRef || !this.tableRef.nativeElement) return;

        // Check visibility to avoid malformed table initialization
        if (this.tableRef.nativeElement.offsetParent === null) return;

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            reactiveData: false, // Disable reactiveData to avoid conflict with replaceData
            index: 'ID', // Ensure rows are indexed by ID
            layout: 'fitColumns', // Use fitColumns for better layout control on desktop/tablet
            height: '100%',
            pagination: false,
            selectableRows: true, // Enable multiple selection (provides pointer cursor and native highlighting)
            columns: [
                {
                    title: 'STT',
                    field: 'STT',
                    width: 50,
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Nội dung câu hỏi',
                    field: 'QuestionText',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    minWidth: 250, // Increase min-width for better reading
                    widthGrow: 3, // Give more weight to question text
                },
                {
                    title: 'Ảnh',
                    field: 'Image',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 60, // Narrower for icon only
                    resizable: false,
                    formatter: (cell: any) => {
                        const val = cell.getValue();
                        if (val && typeof val === 'string' && val.trim() !== '' && val !== 'null') {
                            // Added padding and larger size for easier touch on mobile
                            return `<i class="fa-solid fa-eye text-primary cursor-pointer" style="font-size: 1.3rem; padding: 10px;" title="Xem ảnh"></i>`;
                        }
                        return "";
                    },
                    cellClick: (e: any, cell: any) => {
                        const val = cell.getValue();
                        if (val && typeof val === 'string' && val.trim() !== '' && val !== 'null') {
                            console.log('QuestionList: Image cellClick', val);
                            e.preventDefault();
                            e.stopPropagation();
                            this.viewImage(val);
                        }
                    },
                    cellTap: (e: any, cell: any) => {
                        const val = cell.getValue();
                        if (val && typeof val === 'string' && val.trim() !== '' && val !== 'null') {
                            console.log('QuestionList: Image cellTap (mobile)', val);
                            e.preventDefault();
                            e.stopPropagation();
                            this.viewImage(val);
                        }
                    },
                    vertAlign: 'middle',
                },
                {
                    title: 'Đáp án A',
                    field: '1',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    visible: this.examType === 1,
                    minWidth: 100,
                    widthGrow: 1,
                },
                {
                    title: 'Đáp án B',
                    field: '2',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    visible: this.examType === 1,
                    minWidth: 100,
                    widthGrow: 1,
                },
                {
                    title: 'Đáp án C',
                    field: '3',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    visible: this.examType === 1,
                    minWidth: 100,
                    widthGrow: 1,
                },
                {
                    title: 'Đáp án D',
                    field: '4',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    visible: this.examType === 1,
                    minWidth: 100,
                    widthGrow: 1,
                }
            ],
        });

        // Event for checkbox selection (Delete multiple)
        this.table.on('rowSelectionChanged', (data: any, rows: any) => {
            // Emitting array implies selection list for Delete
            const selectedData = data as QuestionData[];
            this.questionSelected.emit(selectedData);
        });

        // Event for row click (Edit focus)
        this.table.on('rowClick', (e: any, row: RowComponent) => {
            if (e.target && e.target.closest('.fa-eye')) return; // Ignore eye icon
            console.log('QuestionList: rowClick triggered', row.getData()['ID']);
            // Native selection handles highlighting now
            this.questionFocused.emit(row.getData() as QuestionData);
        });

        this.table.on('rowTap', (e: any, row: RowComponent) => {
            if (e.target && e.target.closest('.fa-eye')) return; // Ignore eye icon
            console.log('QuestionList: rowTap triggered', row.getData()['ID']);
            this.questionFocused.emit(row.getData() as QuestionData);
        });

        // Event for row double click (Edit action)
        this.table.on('rowDblClick', (e: any, row: RowComponent) => {
            if (e.target && e.target.closest('.fa-eye')) return; // Ignore eye icon
            // Ensure the row is focused/selected logic ran (it usually does via click)
            // But explicitly emitting focus here might be safer if click didn't fire (unlikely)
            this.questionFocused.emit(row.getData() as QuestionData);
            this.menuAction.emit('edit');
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
            if (this.autoSelectFirst && this.data.length > 0) {
                this.selectFirstRow();
            }
        });

        // Add window resize listener to handle flexbox adjustments
        this.boundResizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.boundResizeHandler);
    }

    private onResize(): void {
        if (this.table && this.isTableBuilt) {
            this.table.redraw();
        }
    }

    getImageUrl(imagePath: string): string {
        if (!imagePath) return '';

        const host = environment.host + 'api/share/';
        let urlImage = imagePath.replace("\\\\192.168.1.190\\", "");
        urlImage = urlImage.replace(/\\/g, '/'); // Convert all backslashes to forward slashes

        return host + urlImage;
    }

    viewImage(imagePath: string): void {
        const imageUrl = this.getImageUrl(imagePath);
        if (!imageUrl) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có hình ảnh để xem');
            return;
        }

        const images = [
            {
                src: imageUrl,
                alt: 'Image Preview'
            }
        ];
        this.nzImageService.preview(images, { nzZoom: 1.5, nzRotate: 0 });
    }

    selectFirstRow() {
        if (!this.table) return;
        const rows = this.table.getRows("active");
        const firstRow = this.findFirstRowRecursive(rows);

        if (firstRow) {
            firstRow.select();
            firstRow.scrollTo();
            const rowData = firstRow.getData() as QuestionData;
            this.questionFocused.emit(rowData);
        }
    }

    private findFirstRowRecursive(rows: any[]): RowComponent | null {
        if (!rows) return null;
        for (const row of rows) {
            // Check if it's a group by checking for the tabulator-group class
            const el = row.getElement();
            if (el && el.classList.contains('tabulator-group')) {
                // It is a group
                if (typeof row.getRows === 'function') {
                    const subRows = row.getRows();
                    const found = this.findFirstRowRecursive(subRows);
                    if (found) return found;
                }
            } else {
                // It is a row
                return row;
            }
        }
        return null;
    }
}

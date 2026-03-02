import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DateTime } from 'luxon';
import { DocumentService } from '../document-service/document.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { environment } from '../../../../../environments/environment';
import { saveAs } from 'file-saver';
import { ActivatedRoute } from '@angular/router';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
    selector: 'app-document-common',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzButtonModule,
        NzInputModule,
        NzIconModule,
        NzSplitterModule,
        NzSelectModule,
    ],
    templateUrl: './document-common.component.html',
    styleUrl: './document-common.component.css'
})
export class DocumentCommonComponent implements OnInit, AfterViewInit {
    @ViewChild('tb_document_common', { static: false }) tbDocumentCommonRef!: ElementRef<HTMLDivElement>;

    private tabulator!: Tabulator;

    keyword: string = '';
    departmentId: number = -1;
    groupType: number = 2;
    departments: any[] = [];
    documentData: any[] = [];
    totalDocuments: number = 0;


    constructor(
        private documentService: DocumentService,
        private notification: NzNotificationService,
        private message: NzMessageService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.loadDepartments();

        // Check route to set groupType
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        // Check if the path ends with 'document-common' (not 'document-common-kt', etc.)
        // Use regex to ensure exact match at the end, with optional trailing slash
        const isDocumentCommonRoute = /\/document-common\/?$/.test(currentPath);
        console.log('Is document-common route:', isDocumentCommonRoute);
        if (isDocumentCommonRoute) {
            this.groupType = 1;
        } else {
            this.groupType = 2;
        }
        console.log('Group type set to:', this.groupType);

        // Subscribe to query params và set departmentId
        this.route.queryParams.subscribe(params => {
            const deptId =
                params['departmentID']
                ?? this.tabData?.departmentID
                ?? 0;

            if (deptId) {
                const parsedId = parseInt(deptId, 10);
                if (!isNaN(parsedId)) {
                    this.departmentId = parsedId;
                }
            }

            // Nếu tabulator đã được khởi tạo, load data ngay
            if (this.tabulator) {
                this.loadDocumentData();
            }
        });
    }

    ngAfterViewInit(): void {
        this.initializeTable();

        // Load data sau khi table được khởi tạo
        // Lúc này departmentId đã được set từ query params
        setTimeout(() => {
            this.loadDocumentData();
        }, 0);
    }

    loadDocumentData(): void {
        const deptId = this.departmentId === -1 ? 0 : this.departmentId;
        this.documentService.getDocumentCommon(this.keyword, deptId, this.groupType ?? 1).subscribe({
            next: (response: any) => {
                this.documentData = response?.data || [];
                this.totalDocuments = this.documentData.length;

                const data = this.documentData.map((item, index) => ({
                    ...item,
                    id: item.ID || index + 1,
                    STT: index + 1
                }));

                if (this.tabulator) {
                    this.tabulator.setData(data);
                }
            },
            error: (err: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
                );
            }
        });
    }

    onSearch(): void {
        this.loadDocumentData();
    }

    loadDepartments(): void {
        this.documentService.getDataDepartment().subscribe({
            next: (res: any) => {
                this.departments = res?.data || [];
                this.departments.push({
                    ID: 0,
                    Name: 'Văn bản chung',
                });
            },
            error: (err: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách phòng ban: ' + (err?.error?.message || err?.message)
                );
            }
        });
    }

    onDepartmentChange(): void {
        this.loadDocumentData();
    }

    private initializeTable(): void {
        if (!this.tbDocumentCommonRef?.nativeElement) {
            return;
        }

        const self = this;

        this.tabulator = new Tabulator(this.tbDocumentCommonRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataStretch',
            height: '87vh',
            paginationMode: 'local',
            rowHeader: false,
            paginationSize: 100,
            pagination: false,
            groupBy: ["DepartmentName", "NameDocumentType"],
            columns: [
                { title: 'STT', field: 'STT', width: 60, hozAlign: 'center', headerHozAlign: 'center', headerSort: false, visible: false },
                { title: 'Loại văn bản', field: 'NameDocumentType', width: 300, headerSort: true },
                {
                    title: 'Mã văn bản', field: 'Code', width: 250, headerSort: true,
                    formatter: (cell: any) => {
                        const rowData = cell.getRow().getData();
                        if (!rowData.FileName) {
                            return cell.getValue() || '';
                        }
                        return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${cell.getValue()}</span>`;
                    },
                    cellClick: (e: any, cell: any) => {
                        const rowData = cell.getRow().getData();
                        if (rowData.FileName) {
                            this.downloadFile(rowData);
                        }
                    }
                },
                { title: 'Tên văn bản', field: 'NameDocument', width: 350, headerSort: true, formatter: 'textarea' },
                {
                    title: 'Ngày ban hành', field: 'DatePromulgate', width: 180, hozAlign: 'center', headerHozAlign: 'center', headerSort: true,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        try {
                            const dateValue = DateTime.fromISO(value);
                            return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
                        } catch (e) {
                            return value;
                        }
                    }
                },
                {
                    title: 'Ngày hiệu lực', field: 'DateEffective', width: 120, hozAlign: 'center', headerHozAlign: 'center', headerSort: true,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        try {
                            const dateValue = DateTime.fromISO(value);
                            return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
                        } catch (e) {
                            return value;
                        }
                    }
                },
            ],
        });
    }

    downloadFile(file: any): void {
        if (!file?.FileName) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy file để tải!');
            return;
        }

        const fileName = file.FileName;
        const typeCode = file.CodeDocumentType || '';

        this.documentService.downloadFileByKey(fileName, typeCode).subscribe({
            next: (blob: Blob) => {
                const a = document.createElement('a');
                const objectUrl = URL.createObjectURL(blob);

                a.href = objectUrl;
                a.download = file.FileNameOrigin || fileName;
                a.click();

                URL.revokeObjectURL(objectUrl);
                this.notification.success(NOTIFICATION_TITLE.success, `Đã tải file: ${file.FileNameOrigin || fileName}`);
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file: ' + (err?.error?.message || err?.message || 'Không xác định'));
            }
        });
    }

    viewFile(file: any): void {
        if (!file?.FileName) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy file để xem!');
            return;
        }

        const fileName = file.FileName;
        const typeCode = file.CodeDocumentType || '';

        this.documentService.downloadFileByKey(fileName, typeCode).subscribe({
            next: (blob: Blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const newWindow = window.open(objectUrl, '_blank');

                if (newWindow) {
                    newWindow.onload = () => {
                        newWindow.document.title = file.FileNameOrigin || fileName;
                    };
                }
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xem file: ' + (err?.error?.message || err?.message || 'Không xác định'));
            }
        });
    }
}

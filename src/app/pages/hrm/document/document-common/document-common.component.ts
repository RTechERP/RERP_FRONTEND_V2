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

    private downloadBasePath = '\\\\113.190.234.64\\ftp\\Upload\\RTCDocument\\';

    constructor(
        private documentService: DocumentService,
        private notification: NzNotificationService,
        private message: NzMessageService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.loadDepartments();

        // Subscribe to query params và set departmentId
        this.route.queryParams.subscribe(params => {
            // const deptId = params['departmentID'];
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
            height: '89vh',
            paginationMode: 'local',
            rowHeader: false,
            paginationSize: 100,
            groupBy: ["DepartmentName", "NameDocumentType"],
            columns: [
                { title: 'STT', field: 'STT', width: 60, hozAlign: 'center', headerHozAlign: 'center', headerSort: false, visible: false },
                { title: 'Loại văn bản', field: 'NameDocumentType', width: 300, headerSort: true },
                {
                    title: 'Mã văn bản', field: 'Code', width: 250, headerSort: true,
                    formatter: (cell: any) => {
                        const rowData = cell.getRow().getData();
                        const value = cell.getValue();
                        if (!rowData.FileName) {
                            return value || '';
                        }
                        return `<a href="javascript:void(0)" class="download-link" style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value || rowData.FileName}</a>`;
                    },
                    cellClick: (e: any, cell: any) => {
                        const rowData = cell.getRow().getData();
                        if (rowData.FileName || rowData.Code) {
                            self.downloadFile(rowData);
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
        const fileName = (file.FileName || file.Code || '').toString();
        if (!fileName) {
            this.notification.warning('Thông báo', 'Không có file để tải xuống!');
            return;
        }

        // Nếu không có FilePath thì dùng URL trực tiếp để tải (giống DocumentComponent)
        if (!file.FilePath) {
            const directUrl = `http://14.232.152.154:8083/api/Upload/RTCDocument/${encodeURIComponent(fileName)}`;

            const link = document.createElement('a');
            link.href = directUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.notification.success('Thông báo', 'Đang tải xuống file...');
            return;
        }

        const filePath = file.FilePath.startsWith('\\\\') ? file.FilePath : `${this.downloadBasePath}${fileName}`;

        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.documentService.downloadFile(filePath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải xuống thành công!');
                } else {
                    // Nếu tải qua API thất bại (blob rỗng), thử tải trực tiếp
                    this.downloadDirectly(fileName);
                }
            },
            error: (res: any) => {
                this.message.remove(loadingMsg);
                // Nếu có lỗi khi tải qua API, thử tải trực tiếp
                this.downloadDirectly(fileName);
            },
        });
    }

    private downloadDirectly(fileName: string): void {
        const directUrl = `http://14.232.152.154:8083/api/Upload/RTCDocument/${encodeURIComponent(fileName)}`;
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.notification.success('Thông báo', 'Đang thử tải xuống trực tiếp...');
    }
}

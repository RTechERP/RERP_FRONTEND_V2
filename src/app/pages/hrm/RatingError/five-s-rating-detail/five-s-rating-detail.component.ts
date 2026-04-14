import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { forkJoin, lastValueFrom } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { FiveSRatingDetailService } from './five-s-rating-detail.service';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
    standalone: true,
    selector: 'app-five-s-rating-detail',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzNotificationModule,
        NzModalModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzSelectModule,
        NzInputModule,
        NzGridModule,
        NzFormModule,
        NzTabsModule,
        MenubarModule,
        TableModule,
        TooltipModule,
        NzAutocompleteModule,
        NzInputNumberModule,
        NzTagModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-rating-detail.component.html',
    styleUrl: './five-s-rating-detail.component.css'
})
export class FiveSRatingDetailComponent implements OnInit {
    // Services
    private detailService = inject(FiveSRatingDetailService);
    private ratingService = inject(RatingErrorService);
    private employeeService = inject(EmployeeService);
    private notification = inject(NzNotificationService);
    private nzModal = inject(NzModalService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    // State
    isLoading = false;
    currentTab = 0; // 0: List, 1: Matrix Form
    ticketId: number | null = null;
    ticketInfo: any = null;

    // Master Data
    sessions: any[] = [];
    selectedSession: any = null;
    employees: any[] = [];
    departments: any[] = [];

    // Matrix State
    matrixData: any[] = [];
    selectedDepts: any[] = [];
    rating1: number | null = null;
    rating2: number | null = null;

    // Menu
    menuBars: MenuItem[] = [];
    isFirstLoadMatrix = false;

    constructor() { }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: any) => {
            if (params['ticketId']) {
                this.ticketId = +params['ticketId'];
                this.currentTab = 1;
                this.isFirstLoadMatrix = true;
                this.selectedDepts = [];
                this.matrixData = [];
            }
        });

        this.initMenuBar();
        this.loadSessions();
        this.loadInitData();

        if (this.ticketId) {
            // Deleted redundant call
        }
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm mới/Chấm điểm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                visible: this.currentTab === 0,
                command: () => this.prepareNewMatrix(),
            },
            {
                label: 'Lưu dữ liệu',
                icon: 'fa-solid fa-save fa-lg text-primary',
                visible: this.currentTab === 1,
                command: () => this.onSaveMatrix(),
            },
            {
                label: 'Quay lại',
                icon: 'fa-solid fa-arrow-left fa-lg text-secondary',
                visible: this.currentTab === 1,
                command: () => {
                    if (this.ticketId) {
                        this.router.navigate(['/five-s-rating']);
                    } else {
                        this.currentTab = 0;
                        this.initMenuBar();
                    }
                },
            },
            {
                label: 'Refresh',
                icon: 'fa-solid fa-rotate fa-lg text-primary',
                command: () => this.loadSessions(),
            }
        ];
    }

    compareFn = (o1: any, o2: any): boolean => (o1 && o2 ? o1.ID == o2.ID : o1 === o2);

    loadInitData() {
        this.isLoading = true;
        forkJoin({
            employees: this.employeeService.getEmployees(),
            depts: this.ratingService.getFiveSDepartments()
        }).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                // Handle Employees
                const empRes = res.employees;
                if (empRes?.status === 1) this.employees = empRes.data || [];
                else this.employees = empRes;

                // Handle Departments
                const deptRes = res.depts;
                if (deptRes?.status === 1) this.departments = deptRes.data || [];

                // Trigger matrix if we have a ticketId
                if (this.ticketId) {
                    this.generateMatrixTemplate();
                }
            },
            error: () => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải dữ liệu khởi tạo');
            }
        });
    }


    loadSessions() {
        this.isLoading = true;
        this.ratingService.getFiveSRatings().subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) this.sessions = res.data || [];
            },
            error: () => this.isLoading = false
        });
    }

    prepareNewMatrix() {
        if (!this.selectedSession) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đợt chấm điểm từ danh sách');
            return;
        }
        this.currentTab = 1;
        this.initMenuBar(); // Update visibility
        this.isFirstLoadMatrix = true; // Đánh dấu lần đầu load để tự chọn phòng ban
        this.generateMatrixTemplate();
    }

    // Khi chọn một bản ghi từ danh sách đợt đánh giá
    onRowSelect(event: any) {
        this.selectedSession = event.data;
    }

    // Metadata cho rowspan
    rowGroupMetadata: any = {};

    generateMatrixTemplate() {
        if (!this.selectedSession && !this.ticketId) return;
        if (!this.departments || this.departments.length === 0) return; // Wait for departments

        this.isLoading = true;
        this.detailService.getMatrix(this.ticketId || this.selectedSession.ID).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    const rawErrors = res.data.Errors || [];
                    const existingDetails = res.data.Details || [];
                    const ticketHead = res.data.Ticket ? res.data.Ticket[0] : null;

                    if (ticketHead) {
                        this.ticketId = ticketHead.ID;
                        this.rating1 = ticketHead.EmployeeRating1ID;
                        this.rating2 = ticketHead.EmployeeRating2ID;
                        // Use session info from ticket if possible
                        if (!this.selectedSession) {
                            this.selectedSession = {
                                ID: ticketHead.Rating5SID,
                                Code: ticketHead.RatingCode
                            };
                        }
                    }

                    // 1. Pivot: Gộp các Rule vào cùng 1 Error
                    const errorsMap = new Map();
                    rawErrors.forEach((err: any) => {
                        if (!errorsMap.has(err.ErrorID)) {
                            errorsMap.set(err.ErrorID, {
                                ...err,
                                rules: {} // Chứa criteria theo RatingLevels
                            });
                        }
                        const item = errorsMap.get(err.ErrorID);
                        if (err.RatingLevels) {
                            item.rules[err.RatingLevels] = {
                                RuleID: err.RuleID,
                                RuleName: err.RuleName,
                                Description: err.Description,
                                Point: (err.BonusPoint || 0) - (err.MinusPoint || 0)
                            };
                        }
                    });

                    // 2. Discover departments for this ticket
                    if (this.isFirstLoadMatrix && ticketHead && this.departments.length > 0) {
                        let discoveredDeptIds: any[] = [];

                        if (existingDetails.length > 0) {
                            discoveredDeptIds = existingDetails
                                .filter((d: any) => d.FiveSRatingTicketID === ticketHead.ID)
                                .map((d: any) => d.FiveSDepartmentID);
                        }

                        const uniqueIds = [...new Set(discoveredDeptIds)];
                        this.selectedDepts = this.departments.filter(d => uniqueIds.includes(d.ID));

                        this.isFirstLoadMatrix = false;
                    }

                    // 3. Chuyển đổi sang Array và Map dữ liệu đã chấm
                    this.matrixData = Array.from(errorsMap.values()).map((row: any) => {
                        // Nạp ghi chú chung (lấy từ SP đã gộp sẵn cho dòng lỗi này)
                        row.GeneralNote = row.GeneralNote || '';

                        // Tìm dữ liệu đã chấm cho mỗi phòng ban trong row này
                        this.selectedDepts.forEach(dept => {
                            // Locate the detail row belonging strictly to this ticket for saving/updating
                            const myDet = existingDetails.find((d: any) =>
                                d.FiveSErrorID === row.ErrorID &&
                                d.FiveSDepartmentID === dept.ID &&
                                d.FiveSRatingTicketID === this.ticketId
                            );

                            // Locate any detail row across the entire session to prefill the score (shared department data)
                            const anyDet = existingDetails.find((d: any) =>
                                d.FiveSErrorID === row.ErrorID &&
                                d.FiveSDepartmentID === dept.ID &&
                                d.RatingValue !== null && d.RatingValue !== undefined
                            );

                            if (myDet) {
                                row[`id_${dept.ID}`] = myDet.ID;
                            }

                            if (anyDet) {
                                row[`dept_${dept.ID}`] = anyDet.RatingValue;
                            }
                        });
                        return row;
                    });
                    this.updateRowGroupMetadata();
                }
            },
            error: () => this.isLoading = false
        });
    }

    updateRowGroupMetadata() {
        this.rowGroupMetadata = {};
        if (this.matrixData) {
            for (let i = 0; i < this.matrixData.length; i++) {
                const rowData = this.matrixData[i];
                const typeError = rowData.TypeError;
                if (i === 0) {
                    this.rowGroupMetadata[typeError] = { index: 0, size: 1 };
                } else {
                    const previousRowData = this.matrixData[i - 1];
                    const previousTypeError = previousRowData.TypeError;
                    if (typeError === previousTypeError) {
                        this.rowGroupMetadata[typeError].size++;
                    } else {
                        this.rowGroupMetadata[typeError] = { index: i, size: 1 };
                    }
                }
            }
        }
    }

    /**
     * Lưu dữ liệu từ ma trận về dạng phẳng
     */
    onSaveMatrix() {
        if (!this.rating1) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn người chấm điểm 1');
            return;
        }

        const detailsToSave: any[] = [];

        this.matrixData.forEach(row => {
            this.selectedDepts.forEach(dept => {
                const val = row[`dept_${dept.ID}`];
                const detailId = row[`id_${dept.ID}`] || 0;

                if (val !== undefined && val !== null) {
                    // Logic quan trọng: Tìm RuleID dựa trên Điểm (Point) người dùng nhập
                    // So khớp với Bonus/Minus point của 3 mức độ
                    let foundRuleId = row.RuleID; // Mặc định dùng Rule đầu tiên nếu không khớp

                    for (const level in row.rules) {
                        if (row.rules[level].Point == val) {
                            foundRuleId = row.rules[level].RuleID;
                            break;
                        }
                    }

                    detailsToSave.push({
                        ID: detailId,
                        FiveSErrorID: row.ErrorID,
                        FiveSRatingDetailID: foundRuleId, // <--- Correctly map to FiveSRatingDetailID
                        Rating5SID: this.selectedSession.ID,
                        FiveSRatingTicketID: this.ticketId, // <--- New field
                        FiveSDepartmentID: dept.ID,
                        EmployeeRating1ID: this.rating1,
                        EmployeeRating2ID: this.rating2,
                        Note: row.GeneralNote,
                        IsDeleted: false
                    });
                }
            });
        });

        if (detailsToSave.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có thay đổi nào để lưu');
            return;
        }

        this.isLoading = true;
        this.detailService.saveMatrix(detailsToSave).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu kết quả chấm điểm thành công');
                    // Keep user on current tab and refresh data to update IDs
                    this.generateMatrixTemplate();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống khi lưu');
            }
        });
    }
    getTypeErrorName(type: number): string {
        const map: any = {
            1: `S1 - Seiri (Sàng lọc)
Loại bỏ những vật dụng không cần thiết`,
            2: `S2 - Seiton (Sắp xếp)
Để mọi thứ đúng chỗ, dễ thấy, dễ lấy`,
            3: `S3 - Seiso (Sạch sẽ)
Vệ sinh nơi làm việc sạch sẽ`,
            4: `S4 - Seiketsu (Săn sóc)
Duy trì tiêu chuẩn 3S ở mọi nơi`,
            5: `S5 - Shitsuke (Sẵn sàng)
Tự giác thực hiện 5S hàng ngày`
        };
        return map[type] || 'Khác';
    }

    getUniqueTypeError(data: any[]): any[] {
        return [...new Set(data.map(item => item.TypeError))];
    }

    validateRating(row: any, deptId: number) {
        const key = `dept_${deptId}`;
        const val = row[key];

        if (val === undefined || val === null || val === '') return;

        // Chỉ cho phép -1, 0, 2 (Có thể dùng row.rules để lấy động nếu cần)
        const allowedValues = [-1, 0, 2];

        if (!allowedValues.includes(Number(val))) {
            row[key] = null; // Clear nếu sai giá trị
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Giá trị nhập vào không hợp lệ. Chỉ chấp nhận các mức điểm: -1, 0, 2');
        } else {
            row[key] = Number(val); // Đảm bảo lưu đúng kiểu số
        }
    }

    formatDate(date: any) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    }

    getDeptTotal(deptId: any): number {
        if (!this.matrixData || this.matrixData.length === 0) return 0;
        let total = 0;
        this.matrixData.forEach(row => {
            const val = row[`dept_${deptId}`];
            if (val !== undefined && val !== null && val !== '') {
                total += Number(val);
            }
        });
        return total;
    }
}


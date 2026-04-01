import { Component, Input, OnInit, inject, ChangeDetectorRef, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { AppUserService } from '../../../../services/app-user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalModule, NzModalRef, NZ_MODAL_DATA, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { KanbanService } from '../kanban.service';
import { environment } from '../../../../../environments/environment';

import { IProjectTask, IProjectTaskChecklist, IProjectTaskAdditional, IProjectSubtask, IProjectTaskGroup, IProjectTaskAttachment, IProject } from '../../../../models/kanban.interface';
import { AddRelatedPeopleComponent } from '../add-related-people/add-related-people.component';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        NzUploadModule,
        NzModalModule,
        NzTabsModule,
        NzTimePickerModule,
        NzPopoverModule,
        NzProgressModule,
        NzAvatarModule,
        NzToolTipModule,
        NzSliderModule,
        NzInputNumberModule,
        NzListModule,
        NzEmptyModule,
        NzTableModule
    ],
    templateUrl: './task-detail.component.html',
    styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
    readonly nzModalData = inject<{ task: IProjectTask }>(NZ_MODAL_DATA, { optional: true });
    private message = inject(NzMessageService);

    @Input() task: any;


    // Task Status
    taskStatus: number = 1;
    statusList = [
        { value: 1, label: 'Chưa làm', color: '#8c8c8c', icon: 'minus-circle' },
        { value: 2, label: 'Đang làm', color: '#1890ff', icon: 'sync' },
        { value: 3, label: 'Hoàn thành', color: '#52c41a', icon: 'check-circle' },
        { value: 4, label: 'Pending', color: '#faad14', icon: 'clock-circle' }
    ];

    // Task Type
    selectedTaskTypeId?: number;
    taskTypeList: { ID: number; TypeName: string }[] = [];

    isPersonalProject: boolean = false;
    taskComplexity: number = 1;
    isAdditional: boolean = false;
    additionals: IProjectTaskAdditional[] = [];
    newAdditionalItem: string = '';
    isAddingAdditional = false;
    editingAdditionalId: number | null = null;
    editingAdditionalDescription: string = '';
    pendingAdditionalOps: Array<{ type: 'add' | 'edit' | 'delete', item: Partial<IProjectTaskAdditional> }> = [];
    private _tempAdditionalIdCounter: number = -1;
    title: string = '';
    description: string = '';

    // Thuộc tính cho ngày giờ bắt đầu/kết thúc
    startDate?: Date;
    endDate?: Date;
    startTime?: Date;
    endTime?: Date;
    planStartDate?: Date;
    planEndDate?: Date;
    selectedTabIndex: number = 0;

    estimatedTime: string = '';
    dateValidationError: string = '';  // loi validate ngay

    // ===== String bridge cho input[type=date] (khong sua logic) =====
    private toDateInputString(d: Date): string {
        if (!d || isNaN(d.getTime())) return '';
        const y = String(d.getFullYear()).padStart(4, '0');
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private parseInputDate(val: string): Date | undefined {
        if (!val) return undefined;
        const d = new Date(val + 'T00:00:00');
        return isNaN(d.getTime()) ? undefined : d;
    }

    validateDates(): void {
        this.dateValidationError = '';
        if (this.planStartDate && this.planEndDate) {
            const s = new Date(this.planStartDate).setHours(0, 0, 0, 0);
            const e = new Date(this.planEndDate).setHours(0, 0, 0, 0);
            if (s > e) {
                this.dateValidationError = 'Ngày KT dự kiến phải sau Ngày BĐ dự kiến';
                return;
            }
        }
        if (this.startDate && this.endDate) {
            const s = new Date(this.startDate).setHours(0, 0, 0, 0);
            const e = new Date(this.endDate).setHours(0, 0, 0, 0);
            if (s > e) {
                this.dateValidationError = 'Ngày KT thực tế phải sau Ngày BĐ thực tế';
                return;
            }
        }

        // Ràng buộc mới: Ngày kết thúc thực tế >= (hôm nay - 1)
        if (this.endDate && this.isUpdateMode) {
            const yesterday = new Date();
            yesterday.setHours(0, 0, 0, 0);
            yesterday.setDate(yesterday.getDate() - 1);

            const selectedEndDate = new Date(this.endDate);
            selectedEndDate.setHours(0, 0, 0, 0);

            if (selectedEndDate < yesterday) {
                this.dateValidationError = 'Ngày KT thực tế phải từ ngày hôm qua trở đi';
            }
        }
    }

    onPersonalProjectChange(checked: boolean): void {
        // Không reset selectedProjectId nữa, cho phép người dùng giữ dự án đã chọn
        // hoặc tự chọn mới kể cả khi là việc cá nhân.
        this.loadParentTasks();
    }

    get planStartDateStr(): string {
        return this.planStartDate ? this.toDateInputString(this.planStartDate) : '';
    }
    set planStartDateStr(val: string) {
        const d = this.parseInputDate(val);
        this.planStartDate = d;
        this.validateDates();
        this.onPlanStartDateChange(d!);
    }

    get planEndDateStr(): string {
        return this.planEndDate ? this.toDateInputString(this.planEndDate) : '';
    }
    set planEndDateStr(val: string) {
        const d = this.parseInputDate(val);
        this.planEndDate = d;
        this.validateDates();
        this.onPlanEndDateChange(d!);
    }

    get startDateStr(): string {
        return this.startDate ? this.toDateInputString(this.startDate) : '';
    }
    set startDateStr(val: string) {
        const d = this.parseInputDate(val);
        this.startDate = d;
        this.validateDates();
        this.onStartDateChange(d!);
    }

    get endDateStr(): string {
        return this.endDate ? this.toDateInputString(this.endDate) : '';
    }
    set endDateStr(val: string) {
        const d = this.parseInputDate(val);
        this.endDate = d;
        this.validateDates();
        this.onEndDateChange(d!);
    }

    get minActualEndDate(): string {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    checklists: IProjectTaskChecklist[] = [];
    newChecklistItem: string = '';

    // Checklist inline add state
    isAddingChecklist = false;
    editingChecklistId: number | null = null; // ID of checklist being edited
    editingChecklistTitle: string = ''; // Temporary title during edit
    orphanChecklistIds: number[] = []; // Checklist IDs created before task (CREATE mode)

    // Deferred checklist operations — flushed only when "Lưu" is pressed
    pendingChecklistOps: Array<{
        type: 'add' | 'toggle' | 'edit' | 'delete';
        item: Partial<IProjectTaskChecklist>;
    }> = [];
    // Temp ID counter for new items in CREATE mode (negative to avoid clash with real IDs)
    private _tempChecklistIdCounter: number = -1;

    // Mode detection
    isCreateMode: boolean = false;  // true if task doesn't have ID
    isUpdateMode: boolean = false;  // true if task has ID
    isSaving: boolean = false;      // Loading state for save
    // Task Log state
    taskLogs: any[] = [];
    isLoadingLogs: boolean = false;
    reviewStatus?: number;
    previousStatus: number = 1;

    getStatusInfo(status: number) {
        return this.statusList.find(s => s.value === status) || this.statusList[0];
    }

    onStatusChange(status: number): void {
        const oldStatus = this.previousStatus;
        if (status === 4 && this.isUpdateMode) {
            this.showPendingReasonModal(oldStatus);
            return;
        }

        this.taskStatus = status;
        this.previousStatus = status;
        if (status === 3) {
            // Hoàn thành → set ngày KT thực tế = hôm nay
            this.endDate = new Date();
            this.endTime = new Date();
        } else {
            // Trạng thái khác → xóa ngày KT thực tế
            this.endDate = undefined;
            this.endTime = undefined;
        }
    }

    @ViewChild('pendingReasonTpl') pendingReasonTpl!: TemplateRef<any>;
    pendingReasonText: string = '';

    showPendingReasonModal(oldStatus: number): void {
        this.pendingReasonText = '';
        const modal = this.modalService.create({
            nzTitle: 'Nhập lý do Tạm dừng (Pending)',
            nzContent: this.pendingReasonTpl,
            nzFooter: [
                {
                    label: 'Hủy',
                    onClick: () => {
                        this.taskStatus = oldStatus;
                        this.previousStatus = oldStatus;
                        modal.destroy();
                    }
                },
                {
                    label: 'Xác nhận',
                    type: 'primary',
                    disabled: (content) => !this.pendingReasonText.trim(),
                    onClick: () => {
                        const reason = this.pendingReasonText.trim();
                        if (reason) {
                            const tempId = this._tempAdditionalIdCounter--;
                            const newItem: IProjectTaskAdditional = {
                                ID: tempId,
                                Description: `[Lý do Pending]: ${reason}`,
                                CreatedDate: new Date(),
                                CreatedBy: this.appUserService.fullName || 'User'
                            };

                            this.additionals = [...this.additionals, newItem];
                            this.pendingAdditionalOps.push({ type: 'add', item: newItem });
                            this.isAdditional = true;

                            this.taskStatus = 4;
                            this.previousStatus = 4;
                            modal.destroy();
                            this.cdr.detectChanges();
                        }
                    }
                }
            ],
            nzMaskClosable: false,
            nzClosable: false
        });
    }

    // Project properties
    selectedProjectId?: number;
    selectedGroupId?: number;
    projects: IProject[] = [];

    // Parent Task properties
    parentTaskList: any[] = [];
    parentTaskId?: number;

    // Employee properties
    assigneeIds: number[] = []; // Array of assignee IDs
    relatedPeopleIds: number[] = []; // Array of related people IDs
    // Snapshot khi load task - dùng để diff khi Lưu (UPDATE mode)
    originalAssigneeIds: number[] = [];
    originalRelatedPeopleIds: number[] = [];
    employees: any[] = [];
    assigneeSearchText: string = '';
    relatedSearchText: string = '';
    mainSearchText: string = '';

    // Popover visibility flags
    isEmployeePopoverVisible: boolean = false;
    isAssignerPopoverVisible: boolean = false;

    // Filter properties for Assignee/Related tabs
    showOnlySelectedAssignees: boolean = false;
    showOnlySelectedRelated: boolean = false;

    // Cached filtered lists - updated by updateFilteredLists()
    _filteredEmployees: any[] = [];
    _filteredAssigneeEmployees: any[] = [];
    _filteredRelatedEmployees: any[] = [];

    // Người giao việc (Assigner)
    assignerId?: number;

    // Check if current user can edit plan dates (default start/end)
    get canEditPlanDates(): boolean {
        if (this.isCreateMode) return true;
        return this.appUserService.employeeID === this.assignerId;
    }

    get isReadOnly(): boolean {
        if (this.isCreateMode) return false;

        // Nếu đã duyệt hoặc từ chối (ReviewStatus >= 2), thì chỉ xem
        if (this.reviewStatus !== undefined && this.reviewStatus >= 2) return true;

        const currentUserId = this.appUserService.employeeID;
        if (currentUserId === undefined || currentUserId === null) return true;

        const isAssigner = this.assignerId === currentUserId;
        const isAssignee = this.assigneeIds.includes(currentUserId);

        // Nếu không phải người giao, cũng không phải người thực hiện -> Chỉ xem
        return !isAssigner && !isAssignee;
    }

    // Computed property for assigner (for display)
    get selectedAssigner(): any {
        const activeTask = this.nzModalData?.task || this.task;
        const id = this.assignerId ?? activeTask?.EmployeeIDRequest;
        if (id === undefined || id === null) return null;
        return this.employees.find(emp => emp.ID === id);
    }

    // Main tabs for task detail
    activeMainTabIndex: number = 0;

    // Computed property for assignee display
    get assignee(): string {
        if (this.assigneeIds.length === 0) return '';
        const assignees = this.employees.filter(emp => this.assigneeIds.includes(emp.ID));
        return assignees.map(emp => emp.FullName).join(', ');
    }

    // Computed property for related people
    get relatedPeople(): any[] {
        return this.employees.filter(emp => this.relatedPeopleIds.includes(emp.ID));
    }

    // Computed property for first assignee (for display)
    get firstAssignee(): any {
        if (this.assigneeIds.length === 0) return null;
        return this.employees.find(emp => emp.ID === this.assigneeIds[0]);
    }

    // Computed property for first related person (for display)
    get firstRelatedPerson(): any {
        if (this.relatedPeopleIds.length === 0) return null;
        return this.employees.find(emp => emp.ID === this.relatedPeopleIds[0]);
    }

    // Danh sách object người thực hiện đã chọn (dùng cho tab card view)
    get selectedAssignees(): any[] {
        return this.employees.filter(emp => this.assigneeIds.includes(emp.ID));
    }

    // Danh sách object người liên quan đã chọn (dùng cho tab card view)
    get selectedRelatedPeople(): any[] {
        return this.employees.filter(emp => this.relatedPeopleIds.includes(emp.ID));
    }

    // Bỏ chọn một người thực hiện
    removeAssignee(employee: any): void {
        this.assigneeIds = this.assigneeIds.filter(id => id !== employee.ID);
        this.loadProjectTaskTypes();
    }

    // Bỏ chọn một người liên quan
    removeRelatedPerson(employee: any): void {
        this.relatedPeopleIds = this.relatedPeopleIds.filter(id => id !== employee.ID);
    }

    // Refresh task types based on selected assignees
    loadProjectTaskTypes(): void {
        this.kanbanService.getProjectTaskTypes(this.assigneeIds).subscribe({
            next: (res) => {
                if (res.status === 200 || res.status === 1) {
                    this.taskTypeList = res.data || [];
                    
                    // Optional: If current selection is invalid, reset it
                    if (this.selectedTaskTypeId && !this.taskTypeList.some(t => t.ID === this.selectedTaskTypeId)) {
                        // Keep current if it is default (1) or just let the user re-select
                        // this.selectedTaskTypeId = undefined;
                    }
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Error loading task types:', err)
        });
    }

    // Progress properties
    progressPercent: number = 0;
    Math = Math; // Reference for template use

    // Attachment properties
    attachments: IProjectTaskAttachment[] = []; // All attachments (for backward compatibility)
    selectedFiles: File[] = []; // New files to upload (CREATE mode only)
    fileAttachmentIds: number[] = []; // IDs for Files
    linkAttachmentIds: number[] = []; // IDs for Links
    newLinkUrl: string = '';
    newLinkName: string = '';
    isAddingLink: boolean = false;
    uploadError: string = '';

    // Deferred attachment operations (UPDATE mode) — flushed only when "Lưu" is pressed
    pendingFileAdds: File[] = [];                    // Files mới chờ upload
    pendingFileDeletes: number[] = [];               // Attachment IDs cần xóa khi Lưu
    pendingLinkAdds: { url: string; name: string }[] = [];  // Links mới chờ lưu
    pendingLinkDeletes: number[] = [];               // Link Attachment IDs cần xóa khi Lưu
    private _tempAttachId: number = -1;              // Counter cho ID tạm (âm)

    // File validation constants
    readonly MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
    readonly MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
    readonly IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    readonly VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];

    // Update all filtered lists - call this whenever source data changes
    updateFilteredLists(): void {
        // Main content popover list
        if (this.mainSearchText) {
            const s = this.mainSearchText.toLowerCase();
            this._filteredEmployees = this.employees.filter(emp =>
                emp.FullName?.toLowerCase().includes(s) ||
                emp.DepartmentName?.toLowerCase().includes(s) ||
                emp.Code?.toLowerCase().includes(s)
            );
        } else {
            this._filteredEmployees = this.employees;
        }

        // Assignee tab list
        let assigneeResult = this.employees;
        if (this.assigneeSearchText) {
            const s = this.assigneeSearchText.toLowerCase();
            assigneeResult = assigneeResult.filter(emp =>
                emp.FullName?.toLowerCase().includes(s) ||
                emp.DepartmentName?.toLowerCase().includes(s) ||
                emp.Code?.toLowerCase().includes(s)
            );
        }
        if (this.showOnlySelectedAssignees) {
            assigneeResult = assigneeResult.filter(emp => this.assigneeIds.includes(emp.ID));
        }
        this._filteredAssigneeEmployees = assigneeResult;

        // Related people tab list
        let relatedResult = this.employees;
        if (this.relatedSearchText) {
            const s = this.relatedSearchText.toLowerCase();
            relatedResult = relatedResult.filter(emp =>
                emp.FullName?.toLowerCase().includes(s) ||
                emp.DepartmentName?.toLowerCase().includes(s) ||
                emp.Code?.toLowerCase().includes(s)
            );
        }
        if (this.showOnlySelectedRelated) {
            relatedResult = relatedResult.filter(emp => this.relatedPeopleIds.includes(emp.ID));
        }
        this._filteredRelatedEmployees = relatedResult;
    }

    // Toggle show only selected for assignees
    toggleShowOnlySelectedAssignees(): void {
        this.showOnlySelectedAssignees = !this.showOnlySelectedAssignees;
        this.updateFilteredLists();
    }

    // Toggle show only selected for related people
    toggleShowOnlySelectedRelated(): void {
        this.showOnlySelectedRelated = !this.showOnlySelectedRelated;
        this.updateFilteredLists();
    }

    // Clear selection for assignees
    public onClearAssigneeSelection(): void {
        this.assigneeIds = [];
        this.updateFilteredLists();
    }

    // Clear selection for related people
    public onClearRelatedSelection(): void {
        this.relatedPeopleIds = [];
        this.updateFilteredLists();
    }

    // Filter function for project select
    filterProjectOption = (input: string, option: any): boolean => {
        const projectName = option.nzLabel?.toLowerCase() || '';
        return projectName.includes(input.toLowerCase());
    };

    // Filter function for parent task select
    filterParentTaskOption = (input: string, option: any): boolean => {
        const label = option.nzLabel?.toLowerCase() || '';
        return label.includes(input.toLowerCase());
    };

    loadParentTasks(): void {
        const activeTask = this.nzModalData?.task || this.task;
        const currentTaskId = activeTask?.ID || 0;

        this.kanbanService.getProjectTasksList(this.selectedProjectId || 0, this.isPersonalProject).subscribe({
            next: (res) => {
                if (res.status === 200 || res.status === 1) {
                    // Loại trừ bản thân bản ghi hiện tại
                    this.parentTaskList = (res.data || []).filter((t: any) => t.ID !== currentTaskId);
                } else {
                    this.parentTaskList = [];
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading parent tasks', err);
                this.parentTaskList = [];
            }
        });
    }

    //       searchEmployees(): void {
    //     if (!this.searchText.trim()) {
    //       this.filteredEmployees = this.employees.filter(
    //         e => !this.selectedMembers.some(m => m.ID === e.ID)
    //       );
    //       return;
    //     }

    //     const search = this.searchText.toLowerCase();
    //     this.filteredEmployees = this.employees.filter(e =>
    //       ((e.FullName?.toLowerCase() ?? '').includes(search) 
    //         &&
    //       !this.selectedMembers.some(m => m.ID === e.ID))
    //     );
    //   }

    // Computed properties for checklist
    get completedChecklists(): number {
        return this.checklists.filter(c => c.IsDone).length;
    }

    get checklistProgress(): number {
        if (this.checklists.length === 0) return 0;
        return Math.round((this.completedChecklists / this.checklists.length) * 100);
    }


    // Helper: Convert hex color to rgba
    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Helper: Darken a hex color by percentage
    private darkenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    // Helper: Get avatar color based on employee ID
    getAvatarColor(employeeId: number): string {
        const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
        return colors[employeeId % colors.length];
    }

    // Helper: Combine date and time into a single datetime
    private combineDateTime(date?: Date, time?: Date): Date | undefined {
        if (!date) return undefined;

        const result = new Date(date);
        if (time) {
            result.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
        } else {
            result.setHours(0, 0, 0, 0);
        }
        return result;
    }

    // Helper: Format date to local ISO string (yyyy-MM-ddTHH:mm:ss) to avoid UTC timezone shift
    private formatDateForApi(date?: Date): string | undefined {
        if (!date) return undefined;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    // ========== TASK LOG METHODS ==========

    loadTaskLogs(taskId: number): void {
        this.isLoadingLogs = true;
        this.kanbanService.getTaskLogs(taskId).subscribe({
            next: (res: any) => {
                if (res.status === 200 || res.status === 1) {
                    this.taskLogs = (res.data || []).map((log: any) => ({
                        ...log,
                        ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
                    })).sort((a: any, b: any) =>
                        new Date(b.CreatedDate).getTime() - new Date(a.CreatedDate).getTime()
                    );
                } else {
                    this.taskLogs = [];
                }
                this.isLoadingLogs = false;
            },
            error: (err: any) => {
                console.error('Error fetching task logs', err);
                this.taskLogs = [];
                this.isLoadingLogs = false;
            }
        });
    }

    getLogIcon(typeLog: string): string {
        if (!typeLog) return 'info-circle';
        const lower = typeLog.toLowerCase();
        if (lower.includes('ngày') || lower.includes('date')) return 'calendar';
        if (lower.includes('người') || lower.includes('nhân viên') || lower.includes('employee')) return 'user';
        if (lower.includes('mô tả') || lower.includes('description')) return 'edit';
        if (lower.includes('trạng thái') || lower.includes('status')) return 'swap';
        if (lower.includes('tên') || lower.includes('title')) return 'font-colors';
        if (lower.includes('duyệt') || lower.includes('approve')) return 'audit';
        if (lower.includes('checklist')) return 'check-square';
        if (lower.includes('file') || lower.includes('tệp')) return 'paper-clip';
        if (lower.includes('tiến độ') || lower.includes('progress')) return 'dashboard';
        return 'info-circle';
    }

    formatLogDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Select employee from popover (single selection for assignee)
    selectEmployee(employee: any): void {
        const employeeId = employee.ID;
        if (!employeeId) {
            console.error('Employee ID not found');
            return;
        }

        // Just update local state - will save when user clicks "Lưu"
        this.assigneeIds = [employeeId];
        this.loadProjectTaskTypes();
        // Reset search and force UI update
        this.mainSearchText = '';
        this.isEmployeePopoverVisible = false; // Auto-close popover
        this.cdr.detectChanges();
    }

    // Select assigner (người giao việc)
    selectAssigner(employee: any): void {
        this.assignerId = employee.ID;
        this.mainSearchText = '';
        this.isAssignerPopoverVisible = false; // Auto-close popover
        this.cdr.detectChanges();
        // Will save when user clicks "Lưu"
    }

    // Toggle assignee in Tab 3 (multiple selection)
    toggleAssignee(employee: any, checked: boolean): void {
        if (checked) {
            if (!this.assigneeIds.includes(employee.ID)) {
                this.assigneeIds = [...this.assigneeIds, employee.ID];
            }
        } else {
            this.assigneeIds = this.assigneeIds.filter(id => id !== employee.ID);
        }
        this.loadProjectTaskTypes();
        if (this.showOnlySelectedAssignees) this.updateFilteredLists();
    }

    // Toggle related person in Tab 4 (multiple selection)
    toggleRelatedPerson(employee: any, checked: boolean): void {
        if (checked) {
            if (!this.relatedPeopleIds.includes(employee.ID)) {
                this.relatedPeopleIds = [...this.relatedPeopleIds, employee.ID];
            }
        } else {
            this.relatedPeopleIds = this.relatedPeopleIds.filter(id => id !== employee.ID);
        }
        if (this.showOnlySelectedRelated) this.updateFilteredLists();
    }

    constructor(
        private kanbanService: KanbanService,
        private modalRef: NzModalRef,
        private modalService: NzModalService,
        private cdr: ChangeDetectorRef,
        private appUserService: AppUserService
    ) { }


    // Không cho chọn ngày kết thúc trong quá khứ
    // Không cho chọn ngày bắt đầu thực tế sau ngày kết thúc thực tế
    disabledStartDate = (startValue: Date): boolean => {
        if (!startValue || !this.endDate) {
            return false;
        }
        const s = new Date(startValue).setHours(0, 0, 0, 0);
        const e = new Date(this.endDate).setHours(0, 0, 0, 0);
        return s > e;
    };

    // Không cho chọn ngày kết thúc thực tế trước hôm nay và trước ngày bắt đầu thực tế
    disabledEndDate = (endValue: Date): boolean => {
        if (!endValue) {
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const e = new Date(endValue).setHours(0, 0, 0, 0);

        if (e < today.getTime()) {
            return true;
        }

        if (this.startDate) {
            const s = new Date(this.startDate).setHours(0, 0, 0, 0);
            return e < s;
        }
        return false;
    };

    // Không cho chọn ngày bắt đầu dự kiến sau ngày kết thúc dự kiến
    disabledPlanStartDate = (startValue: Date): boolean => {
        if (!startValue || !this.planEndDate) {
            return false;
        }
        const s = new Date(startValue).setHours(0, 0, 0, 0);
        const e = new Date(this.planEndDate).setHours(0, 0, 0, 0);
        return s > e;
    };

    // Không cho chọn ngày kết thúc dự kiến trước ngày bắt đầu dự kiến
    disabledPlanEndDate = (endValue: Date): boolean => {
        if (!endValue || !this.planStartDate) {
            return false;
        }
        const e = new Date(endValue).setHours(0, 0, 0, 0);
        const s = new Date(this.planStartDate).setHours(0, 0, 0, 0);
        return e < s;
    };

    // Khi chọn ngày kết thúc mà chưa có ngày bắt đầu, mặc định là hôm nay
    // Nếu chọn ngày KT thực tế → tự động chuyển status thành "Hoàn thành"
    onEndDateChange(date: Date): void {
        if (date && !this.startDate) {
            this.startDate = new Date();
        }
        if (date) {
            this.taskStatus = 3; // Hoàn thành
        } else {
            this.taskStatus = 2; // Đang làm (nếu xóa ngày KT)
        }
    }

    onPlanStartDateChange(date: Date): void {
        this.updateEstimatedTime();
    }

    onPlanEndDateChange(date: Date): void {
        if (date && !this.planStartDate) {
            this.planStartDate = new Date();
        }
        this.updateEstimatedTime();
    }

    // Tính toán tổng thời gian (chỉ tính ngày, dựa trên PlanStartDate/PlanEndDate)
    updateEstimatedTime(): void {
        if (this.planStartDate && this.planEndDate) {
            const start = new Date(this.planStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(this.planEndDate);
            end.setHours(0, 0, 0, 0);

            const diff = end.getTime() - start.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
            this.estimatedTime = `${days} ngày`;
        } else {
            this.estimatedTime = '';
        }
    }

    onStartDateChange(date: Date): void {
        // Local state only - will save when user clicks "Lưu"
    }

    onStartTimeChange(time: Date): void {
        if (time && this.startDate) {
            this.updateEstimatedTime();
            this.autoSaveTask({
                ActualStartDate: this.formatDateForApi(this.startDate),
                ActualEndDate: this.formatDateForApi(this.endDate)
            });
        }
    }

    onEndTimeChange(time: Date): void {
        if (time && this.endDate) {
            this.updateEstimatedTime();
            this.autoSaveTask({
                ActualStartDate: this.formatDateForApi(this.startDate),
                ActualEndDate: this.formatDateForApi(this.endDate)
            });
        }
    }

    // File Upload Methods
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            // Luôn dùng addFilesToSelection — không gọi API ngay
            this.addFilesToSelection(files);
            input.value = '';
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.addFilesToSelection(Array.from(event.dataTransfer.files));
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    @HostListener('window:paste', ['$event'])
    handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const fileName = `pasted-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
                    files.push(new File([blob], fileName, { type: blob.type }));
                }
            }
        }
        if (files.length > 0) {
            // Luôn dùng addFilesToSelection — không gọi API ngay
            this.addFilesToSelection(files);
        }
    }

    addFilesToSelection(files: File[]): void {
        this.uploadError = '';

        // Validate all files first
        for (const file of files) {
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.uploadError = validation.error || 'File không hợp lệ';
                return;
            }
        }

        for (const file of files) {
            const tempId = this._tempAttachId--;
            const previewUrl = URL.createObjectURL(file);

            if (this.isUpdateMode) {
                // UPDATE mode: thêm vào pending queue + preview tạm
                this.pendingFileAdds.push(file);
                (this.attachments as any[]).push({
                    ID: tempId,
                    FileName: file.name,
                    FilePath: previewUrl,
                    Type: 1,
                    _isPending: true,
                    _previewUrl: previewUrl
                });
            } else {
                // CREATE mode: thêm vào selectedFiles + preview tạm
                this.selectedFiles.push(file);
                (this.attachments as any[]).push({
                    ID: tempId,
                    FileName: file.name,
                    FilePath: previewUrl,
                    Type: 1,
                    _isPending: true,
                    _previewUrl: previewUrl
                });
            }
        }
    }

    validateFile(file: File): { valid: boolean; error?: string } {
        const isImage = this.IMAGE_TYPES.includes(file.type);
        const isVideo = this.VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            return {
                valid: false,
                error: `File "${file.name}" không đúng định dạng. Chỉ chấp nhận ảnh (JPG, PNG, GIF, WebP) hoặc video (MP4, AVI, MOV, MKV, WebM).`
            };
        }

        if (isImage && file.size > this.MAX_IMAGE_SIZE) {
            return {
                valid: false,
                error: `Ảnh "${file.name}" vượt quá 1MB (${this.formatFileSize(file.size)}).`
            };
        }

        if (isVideo && file.size > this.MAX_VIDEO_SIZE) {
            return {
                valid: false,
                error: `Video "${file.name}" vượt quá 5MB (${this.formatFileSize(file.size)}).`
            };
        }

        return { valid: true };
    }

    uploadFiles(files: File[]): void {
        this.uploadError = '';
        const validFiles: File[] = [];

        // Validate all files first
        for (const file of files) {
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.uploadError = validation.error || 'File không hợp lệ';
                return;
            }
            validFiles.push(file);
        }

        const activeTask = this.nzModalData?.task || this.task;

        // Upload valid files
        if (validFiles.length > 0) {
            this.isSaving = true;
            this.kanbanService.uploadMultipleFiles(validFiles, 'ProjectTask').subscribe({
                next: (uploadRes) => {
                    if (uploadRes.status === 200 || uploadRes.status === 1) {
                        const uploadedFiles = uploadRes.data || [];

                        // Save each file to attachment
                        const savePromises = uploadedFiles.map((fileInfo: any) => {
                            return new Promise((resolve, reject) => {
                                this.kanbanService.saveFileAttachment({
                                    ID: 0,
                                    ProjectTaskID: activeTask?.ID || undefined,
                                    FileName: fileInfo.OriginalFileName,
                                    FilePath: fileInfo.FilePath,
                                    Type: 1
                                }).subscribe({
                                    next: (attachRes: any) => {
                                        if (attachRes.status === 200 || attachRes.status === 1) {
                                            const newAttachment = attachRes.data;
                                            this.attachments.push(newAttachment);
                                            this.fileAttachmentIds.push(newAttachment.ID);
                                            resolve(true);
                                        } else {
                                            reject(attachRes.message);
                                        }
                                    },
                                    error: (err: any) => reject(err)
                                });
                            });
                        });

                        Promise.all(savePromises).then(() => {
                            this.isSaving = false;
                            this.cdr.detectChanges();
                        }).catch((err) => {
                            this.isSaving = false;
                            this.uploadError = 'Lỗi khi lưu thông tin file';
                            console.error('Error saving file attachment metadata', err);
                            this.cdr.detectChanges();
                        });
                    } else {
                        this.isSaving = false;
                        this.uploadError = uploadRes.message || 'Lỗi khi upload file';
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => {
                    this.isSaving = false;
                    this.uploadError = 'Lỗi khi upload file';
                    console.error('Error uploading files', err);
                    this.cdr.detectChanges();
                }
            });
        }
    }

    // Link Management Methods
    showAddLink(): void {
        this.isAddingLink = true;
        this.newLinkUrl = '';
        this.newLinkName = '';
        this.uploadError = '';
    }

    cancelAddLink(): void {
        this.isAddingLink = false;
        this.newLinkUrl = '';
        this.newLinkName = '';
        this.uploadError = '';
    }

    addLink(): void {
        this.uploadError = '';

        if (!this.newLinkUrl.trim()) {
            this.uploadError = 'Vui lòng nhập URL';
            return;
        }

        // Validate URL format
        try {
            new URL(this.newLinkUrl);
        } catch {
            this.uploadError = 'URL không hợp lệ';
            return;
        }

        const linkName = this.newLinkName.trim() || this.extractDomainFromUrl(this.newLinkUrl);
        const tempId = this._tempAttachId--;

        if (this.isUpdateMode) {
            // UPDATE mode: chỉ lưu vào pending, KHÔNG gọi API
            this.pendingLinkAdds.push({ url: this.newLinkUrl, name: linkName });
        }
        // Thêm preview tạm vào UI (cả CREATE lẫn UPDATE)
        (this.attachments as any[]).push({
            ID: tempId,
            FileName: linkName,
            FilePath: this.newLinkUrl,
            Type: 2,
            _isPending: true
        });
        this.cancelAddLink();
    }

    deleteAttachment(attachment: IProjectTaskAttachment): void {
        this.modalService.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc muốn xóa "${attachment.FileName}"?`,
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const isPending = (attachment as any)._isPending === true || attachment.ID < 0;

                if (isPending) {
                    // File/link chưa lưu → chỉ xóa khỏi local state, không gọi API
                    if (attachment.Type === 1) {
                        // Xóa file tạm khỏi pendingFileAdds (theo định danh bằng FileName)
                        this.pendingFileAdds = this.pendingFileAdds.filter(
                            f => f.name !== attachment.FileName
                        );
                        this.selectedFiles = this.selectedFiles.filter(
                            f => f.name !== attachment.FileName
                        );
                    } else {
                        // Link tạm → xóa khỏi pendingLinkAdds theo URL
                        this.pendingLinkAdds = this.pendingLinkAdds.filter(
                            l => l.url !== attachment.FilePath
                        );
                    }
                } else {
                    // Attachment đã lưu → queue vào pending delete, KHÔNG gọi API ngay
                    if (attachment.Type === 1) {
                        this.pendingFileDeletes.push(attachment.ID);
                        this.fileAttachmentIds = this.fileAttachmentIds.filter(id => id !== attachment.ID);
                    } else {
                        this.pendingLinkDeletes.push(attachment.ID);
                        this.linkAttachmentIds = this.linkAttachmentIds.filter(id => id !== attachment.ID);
                    }
                }

                // Xóa khỏi UI ngay lập tức (local only, không cần chờ API)
                this.attachments = this.attachments.filter(a => a.ID !== attachment.ID);
                this.cdr.detectChanges();
            }
        });
    }

    // Helper Methods
    extractDomainFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Link';
        }
    }

    getFileIcon(attachment: IProjectTaskAttachment): string {
        if (attachment.Type === 2) return 'link'; // Link

        const fileName = attachment.FileName?.toLowerCase() || '';
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'file-image';
        if (fileName.match(/\.(mp4|avi|mov|mkv|webm)$/)) return 'video-camera';
        return 'file';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    isImageFile(attachment: IProjectTaskAttachment): boolean {
        const fileName = attachment.FileName?.toLowerCase() || '';
        return fileName.match(/\.(jpg|jpeg|png|gif|webp)$/) !== null;
    }

    isVideoFile(attachment: IProjectTaskAttachment): boolean {
        const fileName = attachment.FileName?.toLowerCase() || '';
        return fileName.match(/\.(mp4|avi|mov|mkv|webm)$/) !== null;
    }

    openLink(url: string): void {
        window.open(url, '_blank');
    }

    // New File Management Methods
    removeNewFile(index: number): void {
        this.selectedFiles.splice(index, 1);
    }

    editAttachmentName(attachment: IProjectTaskAttachment): void {
        this.modalService.create({
            nzTitle: 'Đổi tên',
            nzContent: `
                <div>
                    <label>Tên mới:</label>
                    <input id="newFileName" type="text" value="${attachment.FileName}" 
                           class="ant-input" style="width: 100%; margin-top: 8px;" />
                </div>
            `,
            nzOnOk: () => {
                const input = document.getElementById('newFileName') as HTMLInputElement;
                const newName = input?.value.trim();

                if (newName && newName !== attachment.FileName) {
                    const updatedAttachment: Partial<IProjectTaskAttachment> = {
                        ID: attachment.ID,
                        FileName: newName,
                        IsDeleted: false
                    };

                    const saveObservable = attachment.Type === 1
                        ? this.kanbanService.saveFileAttachment(updatedAttachment)
                        : this.kanbanService.saveLinkAttachment(updatedAttachment);

                    saveObservable.subscribe({
                        next: (res: any) => {
                            if (res.status === 200 || res.status === 1) {
                                attachment.FileName = newName;
                            }
                        },
                        error: (err: any) => console.error('Error updating attachment name', err)
                    });
                }
            }
        });
    }

    viewFileAttachment(attachment: IProjectTaskAttachment): void {
        if (!attachment.FilePath) {
            this.message.error('Đường dẫn file không hợp lệ');
            return;
        }

        const host = environment.host + 'api/share/';
        let urlFile = attachment.FilePath.replace("\\\\192.168.1.190\\", "");
        urlFile = urlFile.replace(/\\/g, '/');
        urlFile = host + urlFile;

        const newWindow = window.open(urlFile, '_blank', 'width=1000,height=700');
        if (newWindow) {
            newWindow.onload = () => {
                newWindow.document.title = attachment.FileName || 'File';
            };
        } else {
            this.message.warning('Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.');
        }
    }



    private uploadPendingFiles(taskId?: number): Observable<number[]> {
        if (this.selectedFiles.length === 0) return of([] as number[]);

        return this.kanbanService.uploadMultipleFiles(this.selectedFiles, 'ProjectTask').pipe(
            switchMap((uploadRes: any): Observable<number[]> => {
                if (uploadRes.status === 200 || uploadRes.status === 1) {
                    const uploadedFiles = uploadRes.data || [];
                    if (uploadedFiles.length === 0) return of([] as number[]);

                    const saveRequests = uploadedFiles.map((fileInfo: any) =>
                        this.kanbanService.saveFileAttachment({
                            ID: 0,
                            ProjectTaskID: taskId,
                            FileName: fileInfo.OriginalFileName,
                            FilePath: fileInfo.FilePath,
                            Type: 1
                        }).pipe(map((res: any) => res.data.ID as number))
                    );
                    return forkJoin(saveRequests) as Observable<number[]>;
                }
                return of([] as number[]);
            }),
            catchError(err => {
                console.error('Error uploading pending files', err);
                return of([] as number[]);
            })
        );
    }

    ngOnInit(): void {
        const activeTask = this.nzModalData?.task || this.task;

        // Detect mode based on task ID
        this.isCreateMode = !activeTask?.ID;
        this.isUpdateMode = !!activeTask?.ID;

        if (activeTask) {
            this.title = activeTask.Mission || '';
            this.description = activeTask.Description || '';
            this.isPersonalProject = activeTask.IsPersonalProject || false;
            this.reviewStatus = activeTask.IsApproved;

            if (activeTask.ActualStartDate) {
                this.startDate = new Date(activeTask.ActualStartDate);
                this.startTime = new Date(activeTask.ActualStartDate);
            }
            if (activeTask.ActualEndDate) {
                this.endDate = new Date(activeTask.ActualEndDate);
                this.endTime = new Date(activeTask.ActualEndDate);
            }
            if (this.isUpdateMode) {
                if (activeTask.PlanStartDate) this.planStartDate = new Date(activeTask.PlanStartDate);
                if (activeTask.PlanEndDate) this.planEndDate = new Date(activeTask.PlanEndDate);
            }

            this.selectedProjectId = activeTask.ProjectID;
            this.taskStatus = activeTask.Status || 1;
            this.previousStatus = this.taskStatus;
            this.assignerId = activeTask.EmployeeIDRequest;
            this.selectedTaskTypeId = activeTask.TypeProjectItem ?? undefined;
            this.taskComplexity = activeTask.TaskComplexity ?? 1;

            if (activeTask.AssignedToEmployeeID) {
                this.assigneeIds = [activeTask.AssignedToEmployeeID];
            }
            if (this.planStartDate && this.planEndDate) {
                this.updateEstimatedTime();
            }

            this.loadAllProjects();

            if (this.isUpdateMode) {
                // ── Fix #1: forkJoin để đảm bảo employees luôn có trước khi updateFilteredLists ──
                forkJoin({
                    employees: this.kanbanService.getEmployees(),
                    assignees: this.kanbanService.getTaskEmployees(activeTask.ID, 1),
                    related: this.kanbanService.getTaskEmployees(activeTask.ID, 2),
                }).subscribe({
                    next: ({ employees, assignees, related }) => {
                        // 1. Set employees list
                        if (employees.status === 200 || employees.status === 1) {
                            this.employees = employees.data || [];
                        }

                        // 2. Set assignees
                        if (assignees.status === 200 || assignees.status === 1) {
                            const ids = (assignees.data || []).map((emp: any) => emp.EmployeeID);
                            this.assigneeIds = [...ids];
                            this.originalAssigneeIds = [...ids];
                        }

                        // 3. Set related people
                        if (related.status === 200 || related.status === 1) {
                            const ids = (related.data || []).map((emp: any) => emp.EmployeeID);
                            this.relatedPeopleIds = [...ids];
                            this.originalRelatedPeopleIds = [...ids];
                        }

                        // 4. Chỉ gọi updateFilteredLists() 1 lần duy nhất sau khi TẤT CẢ data về
                        this.loadProjectTaskTypes();
                        this.updateFilteredLists();
                    },
                    error: (err) => console.error('Error loading task employees data', err)
                });

                // Các request không ảnh hưởng đến danh sách nhân viên – vẫn load độc lập
                this.kanbanService.getChecklists(activeTask.ID).subscribe({
                    next: (res) => {
                        if (res.status === 200 || res.status === 1) {
                            this.checklists = (res.data || []).sort((a, b) => (a.OrderIndex || 0) - (b.OrderIndex || 0));
                        }
                    },
                    error: (err) => console.error('Error fetching checklists', err)
                });

                this.kanbanService.getAttachments(activeTask.ID).subscribe({
                    next: (res) => {
                        if (res.status === 200 || res.status === 1) {
                            this.attachments = res.data || [];
                            this.fileAttachmentIds = this.attachments.filter(a => a.Type === 1).map(a => a.ID);
                            this.linkAttachmentIds = this.attachments.filter(a => a.Type === 2).map(a => a.ID);
                        }
                    },
                    error: (err) => console.error('Error fetching attachments', err)
                });

                this.loadTaskLogs(activeTask.ID);

                this.isAdditional = activeTask.IsAdditional || false;
                this.kanbanService.getAdditional(activeTask.ID).subscribe({
                    next: (res) => {
                        if (res.status === 200 || res.status === 1) {
                            this.additionals = res.data || [];
                            this.updateAdditionalFlag();
                        }
                    },
                    error: (err) => console.error('Error fetching additional issues', err)
                });

            } else {
                // COPY mode (CREATE with pre-filled data)
                const copySource = activeTask as any;
                if (copySource.EmployeeIDRequest) this.assignerId = copySource.EmployeeIDRequest;
                if (copySource._copyAssigneeIds?.length) this.assigneeIds = [...copySource._copyAssigneeIds];
                if (copySource._copyRelatedPeopleIds?.length) this.relatedPeopleIds = [...copySource._copyRelatedPeopleIds];

                this.updateEstimatedTime();
                this.loadProjectTaskTypes();

                // Load employees cho COPY mode (chỉ cần getEmployees)
                this.kanbanService.getEmployees().subscribe({
                    next: (res) => {
                        if (res.status === 200 || res.status === 1) {
                            this.employees = res.data || [];
                        }
                        this.updateFilteredLists();
                    },
                    error: (err) => console.error('Error fetching employees', err)
                });
            }
        } else {
            // Pure CREATE mode (no copy data)
            this.loadAllProjects();
            this.selectedTaskTypeId = 1; // Mặc định loại công việc là 1
            const currentEmployeeId = this.appUserService.employeeID;
            this.assignerId = currentEmployeeId;
            if (currentEmployeeId) {
                this.assigneeIds = [currentEmployeeId]; // Mặc định người thực hiện là chính mình
            }
            this.loadProjectTaskTypes();

            // Load employees cho CREATE mode
            this.kanbanService.getEmployees().subscribe({
                next: (res) => {
                    if (res.status === 200 || res.status === 1) {
                        this.employees = res.data || [];
                    }
                    this.updateFilteredLists();
                },
                error: (err) => console.error('Error fetching employees', err)
            });
        }

        // Tải danh sách công việc cha
        this.parentTaskId = activeTask?.ParentID;
        this.loadParentTasks();
    }

    // Save progress percentage
    saveProgress(): void {
        const activeTask = this.nzModalData?.task || this.task;
        if (activeTask) {
            this.kanbanService.updateTask(activeTask.ID, {}).subscribe({
                next: (res) => {
                    if (res.status === 200 || res.status === 1) {
                    }
                },
                error: (err) => console.error('Error saving progress', err)
            });
        }
    }

    addChecklistItem() {
        if (!this.newChecklistItem.trim()) return;

        // Build a local item with a temp ID — actual API call is deferred to Save
        const tempItem: IProjectTaskChecklist = {
            ID: this._tempChecklistIdCounter--,
            ProjectTaskID: 0,
            ChecklistTitle: this.newChecklistItem.trim(),
            IsDone: false,
            OrderIndex: this.checklists.length
        } as IProjectTaskChecklist;

        this.checklists = [...this.checklists, tempItem];
        this.pendingChecklistOps.push({ type: 'add', item: { ...tempItem } });
        this.newChecklistItem = '';
        this.reorderChecklists();
    }

    toggleChecklist(item: IProjectTaskChecklist) {
        // Update in memory only — deferred to Save
        // (ngModel already updated item.IsDone before this is called)
        this.pendingChecklistOps.push({ type: 'toggle', item: { ...item } });
    }

    // Checklist inline add methods
    startAddChecklist(): void {
        this.isAddingChecklist = true;
    }

    cancelAddChecklist(): void {
        if (!this.newChecklistItem.trim()) {
            this.isAddingChecklist = false;
        }
    }

    saveNewChecklist(): void {
        if (this.newChecklistItem.trim()) {
            this.addChecklistItem();
            // Tiếp tục hiển thị ô nhập liệu để nhập mục mới
            this.isAddingChecklist = true;

            // Auto-focus lại ô nhập liệu và cuộn vào tầm nhìn sau khi thêm
            setTimeout(() => {
                const input = document.querySelector('.add-checklist-inline input') as HTMLInputElement;
                if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 0);
        } else {
            this.isAddingChecklist = false;
        }
    }

    deleteChecklistItemAction(item: IProjectTaskChecklist): void {
        // Remove from local list immediately for instant UI feedback
        this.checklists = this.checklists.filter(c => c.ID !== item.ID);
        // If it was a temp item (never saved to API), cancel any pending add for it
        if (item.ID < 0) {
            this.pendingChecklistOps = this.pendingChecklistOps.filter(
                op => !(op.type === 'add' && op.item.ID === item.ID)
            );
        } else {
            // Real item — queue a delete
            this.pendingChecklistOps.push({ type: 'delete', item: { ...item } });
        }
        this.reorderChecklists();
    }

    // Start editing a checklist item
    startEditChecklist(item: IProjectTaskChecklist): void {
        this.editingChecklistId = item.ID;
        this.editingChecklistTitle = item.ChecklistTitle || '';
    }

    // Save edited checklist item
    saveEditChecklist(item: IProjectTaskChecklist): void {
        if (!this.editingChecklistTitle.trim()) {
            this.cancelEditChecklist();
            return;
        }

        // Update in memory only — deferred to Save
        item.ChecklistTitle = this.editingChecklistTitle.trim();
        this.pendingChecklistOps.push({ type: 'edit', item: { ...item } });
        this.editingChecklistId = null;
        this.editingChecklistTitle = '';
    }

    // Cancel editing checklist item
    cancelEditChecklist(): void {
        this.editingChecklistId = null;
        this.editingChecklistTitle = '';
    }

    private reorderChecklists(): void {
        this.checklists.forEach((item, index) => {
            const oldOrder = item.OrderIndex;
            item.OrderIndex = index;

            if (item.ID > 0) {
                // For existing items, update OrderIndex in pending ops if they exist
                const existingOp = this.pendingChecklistOps.find(op => 
                    op.item.ID === item.ID && (op.type === 'edit' || op.type === 'toggle')
                );
                if (existingOp) {
                    existingOp.item.OrderIndex = index;
                } else if (oldOrder !== index) {
                    // Item moved but no other change -> queue an edit for OrderIndex sync
                    this.pendingChecklistOps.push({ type: 'edit', item: { ...item } });
                }
            } else {
                // For new items, update their pending 'add' operation
                const addOp = this.pendingChecklistOps.find(op => 
                    op.item.ID === item.ID && op.type === 'add'
                );
                if (addOp) {
                    addOp.item.OrderIndex = index;
                }
            }
        });
    }

    // ========== ADDITIONAL ISSUES METHODS (Phát sinh) ==========

    addAdditionalItem() {
        if (!this.newAdditionalItem.trim()) return;

        const tempItem: IProjectTaskAdditional = {
            ID: this._tempAdditionalIdCounter--,
            ProjectTaskID: 0,
            Description: this.newAdditionalItem.trim(),
            CreatedBy: this.appUserService.fullName,
            CreatedDate: new Date(),
            IsDeleted: false
        } as IProjectTaskAdditional;

        this.additionals = [...this.additionals, tempItem];
        this.pendingAdditionalOps.push({ type: 'add', item: { ...tempItem } });
        this.newAdditionalItem = '';
        this.updateAdditionalFlag();
    }

    startAddAdditional(): void {
        this.isAddingAdditional = true;
    }

    cancelAddAdditional(): void {
        if (!this.newAdditionalItem.trim()) {
            this.isAddingAdditional = false;
        }
    }

    saveNewAdditional(): void {
        if (this.newAdditionalItem.trim()) {
            this.addAdditionalItem();
            this.isAddingAdditional = true;
            setTimeout(() => {
                const input = document.querySelector('.add-additional-inline input') as HTMLInputElement;
                if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 0);
        } else {
            this.isAddingAdditional = false;
        }
    }

    deleteAdditionalAction(item: IProjectTaskAdditional): void {
        if (this.taskStatus === 4) {
            this.message.warning('Không thể xóa nội dung phát sinh khi đang ở trạng thái Pending');
            return;
        }
        this.additionals = this.additionals.filter(a => a.ID !== item.ID);
        if (item.ID < 0) {
            this.pendingAdditionalOps = this.pendingAdditionalOps.filter(
                op => !(op.type === 'add' && op.item.ID === item.ID)
            );
        } else {
            this.pendingAdditionalOps.push({ type: 'delete', item: { ...item, IsDeleted: true } });
        }
        this.updateAdditionalFlag();
    }

    private updateAdditionalFlag(): void {
        if (this.additionals && this.additionals.length > 0) {
            this.isAdditional = true;
        }
    }

    startEditAdditional(item: IProjectTaskAdditional): void {
        this.editingAdditionalId = item.ID;
        this.editingAdditionalDescription = item.Description || '';
    }

    saveEditAdditional(item: IProjectTaskAdditional): void {
        if (!this.editingAdditionalDescription.trim()) {
            this.cancelEditAdditional();
            return;
        }
        item.Description = this.editingAdditionalDescription.trim();
        this.pendingAdditionalOps.push({ type: 'edit', item: { ...item } });
        this.editingAdditionalId = null;
        this.editingAdditionalDescription = '';
    }

    cancelEditAdditional(): void {
        this.editingAdditionalId = null;
        this.editingAdditionalDescription = '';
    }

    onAdditionalEnter(event: any): void {
        if (!event.shiftKey) {
            event.preventDefault();
            this.addAdditionalItem();
        }
    }


    // So s\u00e1nh current vs original, g\u1ecdi updateTaskEmployee cho t\u1eebng thay \u0111\u1ed5i
    private syncEmployeesToApi(taskId: number): Observable<any> {
        const calls: Observable<any>[] = [];

        // Assignees (type = 1)
        const toAddAssignees = this.assigneeIds.filter(id => !this.originalAssigneeIds.includes(id));
        const toRemoveAssignees = this.originalAssigneeIds.filter(id => !this.assigneeIds.includes(id));
        toAddAssignees.forEach(id => calls.push(
            this.kanbanService.updateTaskEmployee(taskId, 1, false, id)
        ));
        toRemoveAssignees.forEach(id => calls.push(
            this.kanbanService.updateTaskEmployee(taskId, 1, true, id)
        ));

        // Related People (type = 2)
        const toAddRelated = this.relatedPeopleIds.filter(id => !this.originalRelatedPeopleIds.includes(id));
        const toRemoveRelated = this.originalRelatedPeopleIds.filter(id => !this.relatedPeopleIds.includes(id));
        toAddRelated.forEach(id => calls.push(
            this.kanbanService.updateTaskEmployee(taskId, 2, false, id)
        ));
        toRemoveRelated.forEach(id => calls.push(
            this.kanbanService.updateTaskEmployee(taskId, 2, true, id)
        ));

        // N\u1ebfu kh\u00f4ng c\u00f3 thay \u0111\u1ed5i \u2192 tr\u1ea3 v\u1ec1 ngay
        return calls.length > 0 ? forkJoin(calls) : of(null);
    }

    // Flush all deferred checklist operations to API (called only when "Lưu" is pressed)
    private syncChecklistsToApi(taskId: number): Observable<any> {
        if (this.pendingChecklistOps.length === 0) return of(null);

        // Build sequential API calls in order of operations
        const calls: Observable<any>[] = this.pendingChecklistOps.map(op => {
            switch (op.type) {
                case 'add':
                    return this.kanbanService.addChecklistItem({
                        ProjectTaskID: taskId,
                        ChecklistTitle: op.item.ChecklistTitle,
                        IsDone: op.item.IsDone ?? false,
                        OrderIndex: op.item.OrderIndex ?? 0
                    });
                case 'toggle':
                case 'edit':
                    return op.item.ID && op.item.ID > 0
                        ? this.kanbanService.updateChecklistItem(op.item.ID, op.item)
                        : of(null);
                case 'delete':
                    return op.item.ID && op.item.ID > 0
                        ? this.kanbanService.deleteChecklistItem(op.item.ID)
                        : of(null);
                default:
                    return of(null);
            }
        });

        return forkJoin(calls).pipe(
            catchError(err => {
                console.error('Error syncing checklists', err);
                return of(null);
            })
        );
    }

    // Flush deferred attachment operations to API (called only when "Lưu" is pressed)
    private syncAttachmentsToApi(taskId: number): Observable<any> {
        const calls: Observable<any>[] = [];

        // 1. Upload pending file adds
        if (this.pendingFileAdds.length > 0) {
            const uploadObs = this.kanbanService.uploadMultipleFiles(this.pendingFileAdds, 'ProjectTask').pipe(
                switchMap((uploadRes: any) => {
                    if (uploadRes.status === 200 || uploadRes.status === 1) {
                        const uploaded = uploadRes.data || [];
                        if (uploaded.length === 0) return of([]);
                        const saveRequests = uploaded.map((fileInfo: any) =>
                            this.kanbanService.saveFileAttachment({
                                ID: 0,
                                ProjectTaskID: taskId,
                                FileName: fileInfo.OriginalFileName,
                                FilePath: fileInfo.FilePath,
                                Type: 1
                            }).pipe(
                                map((res: any) => {
                                    if (res.status === 200 || res.status === 1) {
                                        this.fileAttachmentIds.push(res.data.ID);
                                    }
                                    return res;
                                })
                            )
                        );
                        return forkJoin(saveRequests);
                    }
                    return of([]);
                }),
                catchError(err => { console.error('Error uploading pending files', err); return of(null); })
            );
            calls.push(uploadObs);
        }

        // 2. Save pending link adds
        this.pendingLinkAdds.forEach(link => {
            calls.push(
                this.kanbanService.saveLinkAttachment({
                    ID: 0,
                    ProjectTaskID: taskId,
                    FileName: link.name,
                    FilePath: link.url,
                    Type: 2
                }).pipe(
                    map((res: any) => {
                        if (res.status === 200 || res.status === 1) {
                            this.linkAttachmentIds.push(res.data.ID);
                        }
                        return res;
                    }),
                    catchError(err => { console.error('Error saving link', err); return of(null); })
                )
            );
        });

        // 3. Delete pending file deletes
        this.pendingFileDeletes.forEach(id => {
            calls.push(
                this.kanbanService.saveFileAttachment({ ID: id, IsDeleted: true }).pipe(
                    catchError(err => { console.error('Error deleting file', err); return of(null); })
                )
            );
        });

        // 4. Delete pending link deletes
        this.pendingLinkDeletes.forEach(id => {
            calls.push(
                this.kanbanService.saveLinkAttachment({ ID: id, IsDeleted: true }).pipe(
                    catchError(err => { console.error('Error deleting link', err); return of(null); })
                )
            );
        });

        if (calls.length === 0) return of(null);
        return forkJoin(calls).pipe(
            catchError(err => { console.error('Error syncing attachments', err); return of(null); })
        );
    }

    // Flush deferred additional issue operations to API (called only when "Lưu" is pressed)
    private syncAdditionalsToApi(taskId: number): Observable<any> {
        if (this.pendingAdditionalOps.length === 0) return of(null);

        const calls: Observable<any>[] = this.pendingAdditionalOps.map(op => {
            return this.kanbanService.saveAdditional({
                ...op.item,
                ProjectTaskID: taskId
            });
        });

        return forkJoin(calls).pipe(
            catchError(err => {
                console.error('Error syncing additional issues', err);
                return of(null);
            })
        );
    }

    save() {
        const activeTask = this.nzModalData?.task || this.task;
        if (!activeTask) return;

        if (!this.title || !this.title.trim()) {
            this.message.error('Vui l\u00f2ng nh\u1eadp t\u00ean c\u00f4ng vi\u1ec7c');
            return;
        }
        if (this.title.length > 150) {
            this.message.error('T\u00ean c\u00f4ng vi\u1ec7c kh\u00f4ng \u0111\u01b0\u1ee3c qu\u00e1 150 k\u00fd t\u1ef1');
            return;
        }
        if (!this.assignerId) {
            this.message.error('Vui l\u00f2ng ch\u1ecdn ng\u01b0\u1eddi giao vi\u1ec7c');
            return;
        }
        if (!this.planStartDate) {
            this.planStartDate = new Date();
        }
        if (this.selectedProjectId && !this.planEndDate) {
            this.message.error('Vui l\u00f2ng ch\u1ecdn ng\u00e0y k\u1ebft th\u00fac d\u1ef1 ki\u1ebfn');
            return;
        }
        if ((this.taskStatus === 2 || this.taskStatus === 3) && !this.startDate) {
            this.message.error('Vui lòng chọn ngày bắt đầu thực tế');
            return;
        }
        if (this.assigneeIds.length === 0) {
            this.message.error('Vui l\u00f2ng ch\u1ecdn ng\u01b0\u1eddi th\u1ef1c hi\u1ec7n');
            return;
        }
        if (this.dateValidationError) {
            this.message.error(this.dateValidationError);
            return;
        }

        this.isSaving = true;

        // Pipeline: upload files → sync attachments → sync employees → sync checklists → save task
        this.uploadPendingFiles(activeTask.ID).pipe(
            switchMap((newFileIds) => {
                this.fileAttachmentIds = [...this.fileAttachmentIds, ...(newFileIds || [])];
                // Sync deferred attachment ops (pendingFileAdds, pendingFileDeletes, pendingLinkAdds, pendingLinkDeletes)
                return this.syncAttachmentsToApi(activeTask.ID);
            }),
            switchMap(() => {
                return this.syncEmployeesToApi(activeTask.ID);
            }),
            switchMap(() => {
                return this.syncChecklistsToApi(activeTask.ID);
            }),
            switchMap(() => {
                return this.syncAdditionalsToApi(activeTask.ID);
            }),
            switchMap(() => {
                const saveData: any = {
                    ID: activeTask.ID,
                    Mission: this.title.trim(),
                    Description: this.description,
                    ActualStartDate: this.formatDateForApi(this.startDate),
                    ActualEndDate: this.formatDateForApi(this.endDate),
                    PlanStartDate: this.formatDateForApi(this.planStartDate),
                    PlanEndDate: this.formatDateForApi(this.planEndDate),
                    ProjectID: this.selectedProjectId,
                    EmployeeIDRequest: this.assignerId,
                    Priority: activeTask.Priority || 1,
                    Status: this.taskStatus,
                    IsPersonalProject: this.isPersonalProject,
                    IsAdditional: this.isAdditional,
                    TypeProjectItem: this.selectedTaskTypeId,
                    TaskComplexity: this.taskComplexity,
                    AssignedToEmployeeID: this.assigneeIds.length > 0 ? this.assigneeIds[0] : undefined,
                    OrderIndex: activeTask.OrderIndex,
                    ParentID: this.parentTaskId,
                    Employee: this.assigneeIds,
                    EmployeeRelate: this.relatedPeopleIds,
                    Files: this.fileAttachmentIds,
                    Links: this.linkAttachmentIds
                };
                return this.kanbanService.saveTask(saveData);
            })
        ).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.status === 200 || res.status === 1) {
                    this.message.success('Lưu thành công');
                    this.modalRef.close(true);
                } else {
                    this.message.error(res.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isSaving = false;
                this.message.error('Lưu thất bại. Vui lòng thử lại.');
                console.error('Error saving task', err);
            }
        });
    }

    close(): void {
        this.modalRef.close();
    }

    // ==================== CREATE & UPDATE MODE METHODS ====================

    // CREATE MODE - Save new task with all data
    saveAndAddNew(): void {
        this.saveNewTask(true);
    }

    saveNewTask(stayOpen: boolean = false): void {
        // Validation
        if (!this.title || !this.title.trim()) {
            this.message.error('Vui lòng nhập tên công việc');
            return;
        }
        if (this.title.length > 150) {
            this.message.error('Tên công việc không được quá 150 ký tự');
            return;
        }
        if (!this.assignerId) {
            this.message.error('Vui lòng chọn người giao việc');
            return;
        }
        if (!this.planStartDate) {
            this.planStartDate = new Date();
        }
        if (this.selectedProjectId && !this.planEndDate) {
            this.message.error('Vui lòng chọn ngày kết thúc dự kiến');
            return;
        }
        if (this.assigneeIds.length === 0) {
            this.message.error('Vui lòng chọn người thực hiện');
            return;
        }
        if (this.dateValidationError) {
            this.message.error(this.dateValidationError);
            return;
        }

        // Bắt buộc chọn ngày bắt đầu nếu là Đang làm/Hoàn thành
        if ((this.taskStatus === 2 || this.taskStatus === 3) && !this.startDate) {
            this.message.error('Vui lòng chọn ngày bắt đầu thực tế');
            return;
        }

        if (!this.planStartDate) {
            this.planStartDate = new Date();
        }

        this.isSaving = true;

        // Pipeline: upload files → save task → sync checklists with new task ID
        this.uploadPendingFiles().pipe(
            switchMap((newFileIds) => {
                if (this.assigneeIds.length === 0) {
                    this.message.warning('Vui lòng chọn ít nhất một người thực hiện');
                    this.isSaving = false;
                    return of(null);
                }

                const taskData: any = {
                    ID: 0,
                    Mission: this.title.trim(),
                    Description: this.description,
                    ActualStartDate: this.formatDateForApi(this.startDate),
                    ActualEndDate: this.formatDateForApi(this.endDate),
                    PlanStartDate: this.formatDateForApi(this.planStartDate),
                    PlanEndDate: this.formatDateForApi(this.planEndDate),
                    ProjectID: this.selectedProjectId,
                    IsPersonalProject: this.isPersonalProject,
                    Priority: 1,
                    Status: this.taskStatus,
                    TypeProjectItem: this.selectedTaskTypeId,
                    IsAdditional: this.isAdditional,
                    TaskComplexity: this.taskComplexity,
                    EmployeeIDRequest: this.assignerId,
                    Employee: this.assigneeIds,
                    EmployeeRelate: this.relatedPeopleIds,
                    Files: [...this.fileAttachmentIds, ...(newFileIds || [])],
                    Links: this.linkAttachmentIds,
                    ParentID: this.parentTaskId
                };

                return this.kanbanService.saveTask(taskData);
            }),
                    switchMap((res: any) => {
                        if (!res) return of(null);
                        if (res.status === 200 || res.status === 1) {
                            const newTaskId = res.data?.ID || res.data;
                            // Sync checklist and additional operations with the newly created task ID
                            return forkJoin({
                                checklists: this.syncChecklistsToApi(newTaskId),
                                additionals: this.syncAdditionalsToApi(newTaskId)
                            }).pipe(map(() => res));
                        }
                        return of(res);
                    })
        ).subscribe({
            next: (res: any) => {
                this.isSaving = false;
                if (!res) return;
                if (res.status === 200 || res.status === 1) {
                    if (stayOpen) {
                        this.message.success('Đã lưu và sẵn sàng thêm công việc mới');
                        this.resetFormAfterSave();
                    } else {
                        this.modalRef.close(true);
                    }
                } else {
                    this.message.error(res.message || 'Lỗi khi tạo công việc');
                }
            },
            error: (err: any) => {
                this.isSaving = false;
                this.message.error('Lỗi khi tạo công việc');
                console.error('Error creating task', err);
            }
        });
    }

    private resetFormAfterSave(): void {
        this.title = '';
        this.description = '';
        this.checklists = [];
        this.pendingChecklistOps = [];
        this.attachments = [];
        this.fileAttachmentIds = [];
        this.linkAttachmentIds = [];
        this.pendingFileAdds = [];
        this.pendingFileDeletes = [];
        this.pendingLinkAdds = [];
        this.pendingLinkDeletes = [];
        this.parentTaskId = undefined;
        this.loadParentTasks();
        // Giữ lại: selectedProjectId, assigneeIds, dates... để tạo các task tương tự nhanh hơn
    }

    // UPDATE MODE - These blur handlers no longer auto-save
    // All saving is done via the "Lưu" button
    onTitleBlur(): void {
        // Local state only
    }

    onDescriptionBlur(): void {
        // Local state only
    }

    onProjectChange(projectId: number): void {
        // Local state only - will save when user clicks "Lưu"
        // (selectedProjectId is already updated by [(ngModel)])
        this.loadParentTasks();
    }

    autoSaveTask(data: any): void {
        const activeTask = this.nzModalData?.task || this.task;
        if (!activeTask?.ID) return;

        // Đảm bảo không gửi null cho ActualStartDate và PlanStartDate
        const startDateValue = this.startDate || new Date();
        const planStartDateValue = this.planStartDate || new Date();
        const planEndDateValue = this.planEndDate || new Date();

        // Build complete task data with all fields
        const completeTaskData = {
            ID: activeTask.ID,
            Mission: this.title,
            Description: this.description,
            ActualStartDate: this.formatDateForApi(startDateValue),
            ActualEndDate: this.formatDateForApi(this.endDate),
            PlanStartDate: this.formatDateForApi(planStartDateValue),
            PlanEndDate: this.formatDateForApi(planEndDateValue),
            ProjectID: this.selectedProjectId,
            Priority: activeTask.Priority || 1,
            Status: activeTask.Status || 1,
            EmployeeIDRequest: this.assignerId || activeTask.EmployeeIDRequest,
            AssignedToEmployeeID: activeTask.AssignedToEmployeeID,
            OrderIndex: activeTask.OrderIndex,
            ParentID: activeTask.ParentID,
            IsApproved: activeTask.IsApproved,
            TaskComplexity: this.taskComplexity,
            IsAdditional: this.isAdditional,
            // Merge with any additional data passed in
            ...data
        };

        this.isSaving = true;

        this.kanbanService.saveTask(completeTaskData).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.status === 200 || res.status === 1) {
                    // Success - no toast to avoid spam
                } else {
                    this.message.error('Lưu thất bại');
                }
            },
            error: (err) => {
                this.isSaving = false;
                this.message.error('Lưu thất bại. Vui lòng thử lại.');
                console.error('Auto-save failed', err);
            }
        });
    }


    // Override addChecklistItem to handle both modes
    override_addChecklistItem(): void {
        if (this.isCreateMode) {
            this.addChecklistItemCreate();
        } else {
            this.addChecklistItemUpdate();
        }
    }

    // CREATE mode - Add orphan checklist
    addChecklistItemCreate(): void {
        if (!this.newChecklistItem.trim()) return;

        const newItem: Partial<IProjectTaskChecklist> = {
            ChecklistTitle: this.newChecklistItem.trim(),
            IsDone: false,
            OrderIndex: this.checklists.length
        };

        this.kanbanService.addChecklistItem(newItem).subscribe({
            next: (res) => {
                if (res.status === 200 || res.status === 1) {
                    this.checklists.push(res.data);
                    this.orphanChecklistIds.push(res.data.ID);
                    this.newChecklistItem = '';
                }
            },
            error: (err) => console.error('Error adding checklist', err)
        });
    }

    // UPDATE mode - Add checklist with ProjectTaskID
    addChecklistItemUpdate(): void {
        const activeTask = this.nzModalData?.task || this.task;
        if (!this.newChecklistItem.trim() || !activeTask?.ID) return;

        const newItem: Partial<IProjectTaskChecklist> = {
            ProjectTaskID: activeTask.ID,
            ChecklistTitle: this.newChecklistItem.trim(),
            IsDone: false,
            OrderIndex: this.checklists.length
        };

        this.kanbanService.addChecklistItem(newItem).subscribe({
            next: (res) => {
                if (res.status === 200 || res.status === 1) {
                    this.checklists.push(res.data);
                    this.newChecklistItem = '';
                }
            },
            error: (err) => console.error('Error adding checklist', err)
        });
    }

    // Load all projects from API
    loadAllProjects(): void {
        this.kanbanService.getAllProjects().subscribe({
            next: (res) => {
                if (res.status === 200 || res.status === 1) {
                    this.projects = res.data || [];
                } else {
                    console.error('API Error:', res.message || res.error);
                }
            },
            error: (err) => console.error('Error fetching projects', err)
        });
    }

    // Open add related people modal
    openAddRelatedPeopleModal(mode: 'assignee' | 'related'): void {
        const existingIds = mode === 'related' ? this.relatedPeopleIds : this.assigneeIds;
        const activeTask = this.nzModalData?.task || this.task;

        const modal = this.modalService.create({
            nzTitle: undefined,
            nzContent: AddRelatedPeopleComponent,
            nzWidth: '900px',
            nzCentered: true,
            nzData: {
                mode: mode,
                employees: this.employees.map(emp => ({ ...emp })),
                existingRelatedPeople: existingIds,
                taskId: this.isUpdateMode ? activeTask?.ID : undefined
            },
            nzFooter: null,
            nzClosable: false
        });

        modal.afterClose.subscribe((result: any) => {
            if (result) {
                if (result.selectedIds !== undefined) {
                    if (mode === 'assignee') {
                        this.assigneeIds = result.selectedIds;
                    } else {
                        this.relatedPeopleIds = result.selectedIds;
                    }
                } else if (Array.isArray(result)) {
                    if (mode === 'assignee') {
                        this.assigneeIds = result;
                    } else {
                        this.relatedPeopleIds = result;
                    }
                }

                if (mode === 'assignee') {
                    this.loadProjectTaskTypes();
                }
                this.updateFilteredLists();
                this.cdr.detectChanges();
            }
        });
    }
}

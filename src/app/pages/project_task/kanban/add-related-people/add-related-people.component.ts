import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

interface Employee {
    ID: number; // Changed from EmployeeID
    FullName: string;
    Code?: string;
    Email?: string;
    DepartmentName?: string;
    DepartmentID?: number;
    PositionName?: string;
    PositionID?: number;
    checked?: boolean;
}

interface Department {
    ID: number;
    Name: string;
}

interface Position {
    ID: number;
    Name: string;
}

@Component({
    selector: 'app-add-related-people',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzSelectModule,
        NzTableModule,
        NzCheckboxModule,
        NzButtonModule,
        NzIconModule,
        NzAvatarModule,
        NzEmptyModule
    ],
    templateUrl: './add-related-people.component.html',
    styleUrls: ['./add-related-people.component.css']
})
export class AddRelatedPeopleComponent implements OnInit {
    readonly nzModalData = inject<{
        mode?: 'assignee' | 'related',
        employees: Employee[],
        existingRelatedPeople?: number[],
        taskId?: number
    }>(NZ_MODAL_DATA, { optional: true });

    mode: 'assignee' | 'related' = 'related'; // Default to related
    employees: Employee[] = [];
    filteredEmployees: Employee[] = [];

    searchText: string = '';
    selectedDepartment?: number;
    selectedPosition?: number;
    selectAll: boolean = false;

    departments: Department[] = [];
    positions: Position[] = [];

    // Filter & API properties
    showOnlySelected: boolean = false;
    taskId?: number;
    originalSelectedIds: number[] = [];

    // Computed property for selected employees
    get selectedEmployees(): Employee[] {
        return this.employees.filter(emp => emp.checked);
    }

    // Computed property for modal title
    get modalTitle(): string {
        return this.mode === 'assignee' ? 'Chọn người thực hiện' : 'Thêm người liên quan';
    }

    // Computed property for submit button text
    get submitButtonText(): string {
        return this.mode === 'assignee' ? 'Chọn' : 'Thêm';
    }

    constructor(private modalRef: NzModalRef) { }

    ngOnInit(): void {
        // Get mode from modal data
        if (this.nzModalData?.mode) {
            this.mode = this.nzModalData.mode;
        }

        // Get employees from modal data
        if (this.nzModalData?.employees) {
            // Get existing employee IDs for pre-selection
            const existingIds = this.nzModalData.existingRelatedPeople || [];

            console.log('🔍 Modal Data:', {
                mode: this.mode,
                existingRelatedPeople: this.nzModalData.existingRelatedPeople,
                existingIds: existingIds,
                isArray: Array.isArray(existingIds),
                length: existingIds.length
            });

            this.employees = this.nzModalData.employees.map(emp => {
                const isChecked = Array.isArray(existingIds) && existingIds.includes(emp.ID);
                return {
                    ...emp,
                    checked: isChecked
                };
            });

            // Extract unique departments and positions
            this.extractDepartmentsAndPositions();

            // Initialize filtered list
            this.filteredEmployees = [...this.employees];

            // Store original selected IDs for comparison later
            this.originalSelectedIds = [...existingIds];

            // Get taskId from modal data
            if (this.nzModalData?.taskId) {
                this.taskId = this.nzModalData.taskId;
            }
        }
    }

    extractDepartmentsAndPositions(): void {
        // Extract unique departments
        const deptMap = new Map<number, string>();
        const posMap = new Map<number, string>();

        this.employees.forEach(emp => {
            if (emp.DepartmentID && emp.DepartmentName) {
                deptMap.set(emp.DepartmentID, emp.DepartmentName);
            }
            if (emp.PositionID && emp.PositionName) {
                posMap.set(emp.PositionID, emp.PositionName);
            }
        });

        this.departments = Array.from(deptMap.entries()).map(([id, name]) => ({ ID: id, Name: name }));
        this.positions = Array.from(posMap.entries()).map(([id, name]) => ({ ID: id, Name: name }));
    }

    onSearch(): void {
        let result = [...this.employees];

        // Filter by search text
        if (this.searchText.trim()) {
            const search = this.searchText.toLowerCase();
            result = result.filter(emp =>
                emp.FullName?.toLowerCase().includes(search) ||
                emp.Code?.toLowerCase().includes(search)
            );
        }

        // Filter by department
        if (this.selectedDepartment) {
            result = result.filter(emp => emp.DepartmentID === this.selectedDepartment);
        }

        // Filter by position
        if (this.selectedPosition) {
            result = result.filter(emp => emp.PositionID === this.selectedPosition);
        }

        // Filter to show only selected
        if (this.showOnlySelected) {
            result = result.filter(emp => emp.checked);
        }

        this.filteredEmployees = result;
        this.updateSelectAllState();
    }

    toggleShowOnlySelected(): void {
        this.showOnlySelected = !this.showOnlySelected;
        this.onSearch();
    }

    onEmployeeCheckChange(employee: Employee): void {
        // The checked property is already updated by ngModel
        // Just update the select all state
        this.updateSelectAllState();
    }

    onSelectAllChange(): void {
        // Update checked state for all filtered employees
        this.filteredEmployees.forEach(emp => {
            emp.checked = this.selectAll;
        });
    }

    updateSelectAllState(): void {
        const visibleChecked = this.filteredEmployees.filter(e => e.checked).length;
        this.selectAll = visibleChecked > 0 && visibleChecked === this.filteredEmployees.length;
    }

    isSelected(employee: Employee): boolean {
        return employee.checked || false;
    }

    clearSelection(): void {
        this.employees.forEach(emp => emp.checked = false);
        this.selectAll = false;
    }

    getAvatarColor(employeeId: number): string {
        const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
        return colors[employeeId % colors.length];
    }

    addSelectedEmployees(): void {
        const selectedIds = this.selectedEmployees.map(emp => emp.ID);

        // Nếu ở UPDATE mode (có taskId)
        if (this.taskId && this.taskId > 0) {
            // Tìm người bị bỏ chọn (có trong original nhưng không có trong selected)
            const removedIds = this.originalSelectedIds.filter(id => !selectedIds.includes(id));
            // Tìm người mới được chọn
            const addedIds = selectedIds.filter(id => !this.originalSelectedIds.includes(id));

            // Trả về object để task-detail xử lý
            this.modalRef.close({ selectedIds, removedIds, addedIds });
        } else {
            // CREATE mode - chỉ trả về danh sách được chọn
            this.modalRef.close(selectedIds);
        }
    }

    close(): void {
        this.modalRef.close();
    }
}

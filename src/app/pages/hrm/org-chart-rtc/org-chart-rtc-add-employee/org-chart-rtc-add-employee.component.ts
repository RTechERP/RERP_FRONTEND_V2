import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { OrgChartManagementService } from '../service/org-chart-management.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';


@Component({
    selector: 'app-org-chart-rtc-add-employee',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzSelectModule,
        NzButtonModule,
        NzInputModule,
        NzCheckboxModule,
        NzTableModule,
        NzGridModule
    ],
    providers: [NzNotificationService],
    templateUrl: './org-chart-rtc-add-employee.component.html',
    styleUrls: ['./org-chart-rtc-add-employee.component.css']
})
export class OrgChartRtcAddEmployeeComponent implements OnInit {
    @Input() organizationalChartID: number = 0;
    @Input() teamName: string = '';
    @Input() existingEmployees: any[] = [];

    departmentList: any[] = [];
    employeeList: any[] = [];
    filteredEmployees: any[] = [];

    selectedDepartmentId: number | null = null;
    searchText: string = '';
    selectAll: boolean = false;
    selectedEmployees: Set<number> = new Set();

    constructor(
        private activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private orgChartService: OrgChartManagementService,
        private employeeService: EmployeeService
    ) { }

    ngOnInit(): void {
        this.loadDepartments();
        this.loadEmployees();
    }

    loadDepartments(): void {
        this.orgChartService.getDepartments().subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.departmentList = response.data || [];
                }
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    loadEmployees(): void {
        this.employeeService.getAllEmployee().subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.employeeList = response.data || [];
                    this.filterEmployees();
                }
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    filterEmployees(): void {
        let filtered = [...this.employeeList];

        // Filter by department
        if (this.selectedDepartmentId) {
            filtered = filtered.filter(e => e.DepartmentID === this.selectedDepartmentId);
        }

        // Filter by search text
        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            filtered = filtered.filter(e => 
                (e.FullName && e.FullName.toLowerCase().includes(search)) ||
                (e.EmployeeCode && e.EmployeeCode.toLowerCase().includes(search))
            );
        }

        // Filter out existing employees
        const existingIds = new Set(this.existingEmployees.map(e => e.EmployeeID));
        filtered = filtered.filter(e => !existingIds.has(e.ID));

        // Group by department
        this.filteredEmployees = this.groupByDepartment(filtered);
    }

    groupByDepartment(employees: any[]): any[] {
        const grouped = employees.reduce((acc, emp) => {
            const deptName = emp.DepartmentName || 'Khác';
            if (!acc[deptName]) {
                acc[deptName] = [];
            }
            acc[deptName].push(emp);
            return acc;
        }, {});

        // Convert to array with department headers
        const result: any[] = [];
        Object.keys(grouped).forEach(deptName => {
            // Add department header
            result.push({
                isDepartmentHeader: true,
                DepartmentName: deptName,
                Count: grouped[deptName].length
            });
            // Add employees in this department
            result.push(...grouped[deptName]);
        });

        return result;
    }

    onDepartmentChange(): void {
        this.filterEmployees();
    }

    onSearchChange(): void {
        this.filterEmployees();
    }

    onSelectAll(checked: boolean): void {
        this.selectAll = checked;
        if (checked) {
            this.filteredEmployees.forEach(e => this.selectedEmployees.add(e.ID));
        } else {
            this.selectedEmployees.clear();
        }
    }

    onSelectEmployee(employeeId: number, checked: boolean): void {
        if (checked) {
            this.selectedEmployees.add(employeeId);
        } else {
            this.selectedEmployees.delete(employeeId);
        }
        this.selectAll = this.filteredEmployees.length > 0 && 
            this.filteredEmployees.every(e => this.selectedEmployees.has(e.ID));
    }

    isSelected(employeeId: number): boolean {
        return this.selectedEmployees.has(employeeId);
    }

    onSave(): void {
        if (this.selectedEmployees.size === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một nhân viên');
            return;
        }

        const details = Array.from(this.selectedEmployees).map(employeeId => ({
            ID: 0,
            OrganizationalChartID: this.organizationalChartID,
            EmployeeID: employeeId,
            IsDeleted: 0
        }));

        const dto = {
            organizationalChartDetails: details
        };

        this.orgChartService.saveData(dto).subscribe({
            next: () => {
                this.notification.success(NOTIFICATION_TITLE.success, `Đã thêm ${details.length} nhân viên vào team`);
                this.activeModal.close(true);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    onClose(): void {
        this.activeModal.dismiss();
    }
}

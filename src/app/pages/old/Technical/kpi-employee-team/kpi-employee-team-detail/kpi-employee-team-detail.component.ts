import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { KpiEmployeeTeamService } from '../kpi-employee-team-service/kpi-employee-team.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

export interface KPIEmployeeTeamModel {
    ID: number;
    Name: string;
    DepartmentID: number;
    LeaderID: number;
    ParentID: number;
    YearValue: number;
    QuarterValue: number;
    IsDeleted: boolean;
}

@Component({
    selector: 'app-kpi-employee-team-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzInputNumberModule,
        NzButtonModule,
        NzSelectModule,
        NzFormModule,
        NzTreeSelectModule,
    ],
    templateUrl: './kpi-employee-team-detail.component.html',
    styleUrl: './kpi-employee-team-detail.component.css'
})
export class KpiEmployeeTeamDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() detail: any = null;
    @Input() yearValue: number = new Date().getFullYear();
    @Input() quarterValue: number = Math.ceil((new Date().getMonth() + 1) / 3);
    @Input() departmentId: number = 0;
    @Output() onSaved = new EventEmitter<any>();

    // Form model
    model: KPIEmployeeTeamModel = {
        ID: 0,
        Name: '',
        DepartmentID: 0,
        LeaderID: 0,
        ParentID: 0,
        YearValue: new Date().getFullYear(),
        QuarterValue: Math.ceil((new Date().getMonth() + 1) / 3),
        IsDeleted: false
    };

    // Dropdown data
    departments: any[] = [];
    employees: any[] = [];
    employeeGroups: { departmentName: string; employees: any[] }[] = [];
    parentTeamNodes: NzTreeNodeOptions[] = [];

    // Tree select binding (nz-tree-select uses string keys)
    selectedParentKey: string | null = null;

    // Errors
    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiEmployeeTeamService: KpiEmployeeTeamService
    ) { }

    ngOnInit(): void {
        this.model.YearValue = this.yearValue;
        this.model.QuarterValue = this.quarterValue;
        this.model.DepartmentID = this.departmentId;

        this.loadDepartments();
        this.loadEmployees();
        this.loadParentTeams();

        if (this.mode === 'edit' && this.detail) {
            this.loadDetail();
        }
    }

    loadDetail(): void {
        if (this.detail) {
            this.model = {
                ID: this.detail.ID || 0,
                Name: this.detail.Name || '',
                DepartmentID: this.detail.DepartmentID || 0,
                LeaderID: this.detail.LeaderID || 0,
                ParentID: this.detail.ParentID || 0,
                YearValue: this.detail.YearValue || this.yearValue,
                QuarterValue: this.detail.QuarterValue || this.quarterValue,
                IsDeleted: false
            };
            // Set tree-select key from ParentID (handle negative values)
            this.selectedParentKey = this.model.ParentID !== 0 ? this.model.ParentID.toString() : null;
        }
    }

    loadDepartments(): void {
        this.kpiEmployeeTeamService.getDepartments().subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    this.departments = (response.data || []).sort((a: any, b: any) => (a.STT || 0) - (b.STT || 0));
                }
            },
            error: (error) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    loadEmployees(): void {
        this.kpiEmployeeTeamService.getEmployees(0, 0).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    this.employees = response.data || [];
                    this.buildEmployeeGroups();
                }
            },
            error: (error) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    buildEmployeeGroups(): void {
        // Group employees by DepartmentName
        const groupMap = new Map<string, any[]>();

        this.employees.forEach(emp => {
            const deptName = emp.DepartmentName || 'Khác';
            if (!groupMap.has(deptName)) {
                groupMap.set(deptName, []);
            }
            groupMap.get(deptName)!.push(emp);
        });

        // Convert to array and sort by department name
        this.employeeGroups = Array.from(groupMap.entries())
            .map(([departmentName, employees]) => ({ departmentName, employees }))
            .sort((a, b) => a.departmentName.localeCompare(b.departmentName));
    }

    loadParentTeams(): void {
        const yearValue = this.model.YearValue || this.yearValue;
        const quarterValue = this.model.QuarterValue || this.quarterValue;
        const departmentID = this.model.DepartmentID || 0;

        this.kpiEmployeeTeamService.getAll(yearValue, quarterValue, departmentID).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    let teams = response.data || [];
                    // Filter out current item if in edit mode to prevent selecting itself as parent
                    if (this.mode === 'edit' && this.id > 0) {
                        teams = teams.filter((t: any) => t.ID !== this.id);
                    }
                    // Build tree nodes for nz-tree-select
                    this.parentTeamNodes = this.buildTreeNodes(teams);
                }
            },
            error: (error) => {
                console.error('Error loading parent teams:', error);
            }
        });
    }

    buildTreeNodes(teams: any[]): NzTreeNodeOptions[] {
        // Create a map for quick lookup
        const map = new Map<number, NzTreeNodeOptions>();
        const roots: NzTreeNodeOptions[] = [];

        // First pass: create all nodes
        teams.forEach(team => {
            // Format title to include LeaderName if available
            let title = team.Name || '';
            if (team.LeaderName) {
                title += ` - Leader: ${team.LeaderName}`;
            }

            const node: NzTreeNodeOptions = {
                key: team.ID?.toString() || '',
                title: title,
                isLeaf: true,
                expanded: true,
                children: []
            };
            map.set(team.ID, node);
        });

        // Second pass: build tree structure
        teams.forEach(team => {
            const node = map.get(team.ID);
            if (!node) return;

            const parentId = team.ParentID;
            // Check if has valid parent (not null, not 0, and exists in map)
            if (parentId && parentId !== 0 && parentId !== null && map.has(parentId)) {
                const parent = map.get(parentId)!;
                parent.isLeaf = false;
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            } else {
                // Root node: ParentID is 0, null, or not found
                roots.push(node);
            }
        });

        console.log('Built tree nodes:', roots); // Debug log
        return roots;
    }

    onDepartmentChange(): void {
        // Reload employees when department changes (optional filter by department)
        this.loadEmployees();
    }

    onParentChange(key: string | null): void {
        // Convert string key from tree-select to number for model
        this.model.ParentID = key ? parseInt(key, 10) : 0;
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.model.Name || this.model.Name.trim() === '') {
            this.errors.name = 'Vui lòng nhập Tên Team!';
            isValid = false;
        }

        if (!this.model.DepartmentID || this.model.DepartmentID <= 0) {
            this.errors.department = 'Vui lòng chọn Phòng ban!';
            isValid = false;
        }

        if (!this.model.LeaderID || this.model.LeaderID <= 0) {
            this.errors.leader = 'Vui lòng chọn Leader!';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        const saveData = {
            ID: this.mode === 'edit' ? this.id : 0,
            Name: this.model.Name.trim(),
            DepartmentID: this.model.DepartmentID,
            LeaderID: this.model.LeaderID,
            ParentID: this.model.ParentID || 0,
            YearValue: this.model.YearValue,
            QuarterValue: this.model.QuarterValue,
            IsDeleted: false
        };

        this.kpiEmployeeTeamService.saveData(saveData).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error) => {
                console.error('Error saving KPI employee team:', error);
                const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}

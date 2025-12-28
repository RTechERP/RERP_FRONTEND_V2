import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { OrgChartManagementService } from '../service/org-chart-management.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
    selector: 'app-org-chart-rtc-management-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzTreeSelectModule,
        NzButtonModule,
        NzGridModule
    ],
    providers: [NzNotificationService],
    templateUrl: './org-chart-rtc-management-form.component.html',
    styleUrls: ['./org-chart-rtc-management-form.component.css']
})
export class OrgChartRtcManagementFormComponent implements OnInit {
    @Input() team: any = {};
    @Input() isEdit: boolean = false;
    @Input() masterData: any[] = [];

    form!: FormGroup;

    taxCompanyList: any[] = [];
    departmentList: any[] = [];
    employeeList: any[] = [];
    parentTeamList: any[] = [];
    parentTeamNodes: any[] = [];

    constructor(
        private fb: NonNullableFormBuilder,
        private activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private orgChartService: OrgChartManagementService,
        private employeeService: EmployeeService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadTaxCompanies();
        this.loadDepartments();
        this.loadEmployees();
        this.loadParentTeams();

        if (this.isEdit && this.team) {
            this.patchForm();
        }
    }

    initForm(): void {
        this.form = this.fb.group({
            ID: [0],
            TaxCompanyID: [null, [Validators.required]],
            DepartmentID: [null, [Validators.required]],
            Code: [''],
            ParentID: [0],
            Name: [''],
            EmployeeID: [null]
        });

        // Listen for company/department changes to reload parent teams
        this.form.get('TaxCompanyID')?.valueChanges.subscribe(() => this.loadParentTeams());
        this.form.get('DepartmentID')?.valueChanges.subscribe(() => this.loadParentTeams());
    }

    patchForm(): void {
        this.form.patchValue({
            ID: this.team.ID,
            TaxCompanyID: this.team.TaxCompanyID,
            DepartmentID: this.team.DepartmentID,
            Code: this.team.Code || this.team.TeamCode,
            ParentID: this.team.ParentID || 0,
            Name: this.team.Name || this.team.TeamName,
            EmployeeID: this.team.EmployeeID || null
        });
    }

    loadTaxCompanies(): void {
        this.orgChartService.getTaxCompanies().subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.taxCompanyList = response.data || [];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
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
                }
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    loadParentTeams(): void {
        const taxCompanyID = this.form.get('TaxCompanyID')?.value;
        const departmentID = this.form.get('DepartmentID')?.value;

        // Filter parent teams from master data
        this.parentTeamList = this.masterData.filter((item: any) => {
            // Exclude current item when editing
            if (this.isEdit && item.ID === this.team.ID) return false;
            return true;
        });

        // Build tree structure
        this.buildParentTeamTree();
    }

    buildParentTeamTree(): void {
        const map = new Map<number, any>();
        this.parentTeamNodes = [];

        // Create map first
        this.parentTeamList.forEach((item: any) => {
            map.set(item.ID, {
                title: item.TeamName || item.Name,
                key: item.ID,
                value: item.ID,
                isLeaf: true,
                children: []
            });
        });

        // Build parent-child relationship
        this.parentTeamList.forEach((item: any) => {
            const node = map.get(item.ID);
            const parentID = item.ParentID || 0;

            if (parentID && parentID !== 0 && map.has(parentID)) {
                const parent = map.get(parentID);
                parent.children.push(node);
                parent.isLeaf = false;
            } else {
                this.parentTeamNodes.push(node);
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            return;
        }

        const formValue = this.form.getRawValue();
        const dto = {
            organizationalCharts: [{
                ID: formValue.ID || 0,
                TaxCompanyID: formValue.TaxCompanyID,
                DepartmentID: formValue.DepartmentID,
                Code: formValue.Code,
                ParentID: formValue.ParentID || 0,
                Name: formValue.Name,
                EmployeeID: formValue.EmployeeID || 0,
                IsDeleted: 0
            }]
        };

        this.orgChartService.saveData(dto).subscribe({
            next: () => {
                this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                this.activeModal.close(true);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    onSaveAndNew(): void {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            return;
        }

        const formValue = this.form.getRawValue();
        const dto = {
            organizationalCharts: [{
                ID: formValue.ID || 0,
                TaxCompanyID: formValue.TaxCompanyID,
                DepartmentID: formValue.DepartmentID,
                Code: formValue.Code,
                ParentID: formValue.ParentID || 0,
                Name: formValue.Name,
                EmployeeID: formValue.EmployeeID || 0,
                IsDeleted: 0
            }]
        };

        this.orgChartService.saveData(dto).subscribe({
            next: () => {
                this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công');
                // Reset form for new entry
                this.form.reset({
                    ID: 0,
                    TaxCompanyID: formValue.TaxCompanyID,
                    DepartmentID: formValue.DepartmentID,
                    Code: '',
                    ParentID: 0,
                    Name: '',
                    EmployeeID: null
                });
                this.loadParentTeams();
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

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    GridOption,
} from 'angular-slickgrid';
import { KpiEmployeeTeamService } from '../kpi-employee-team-service/kpi-employee-team.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-choose-employee',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzSelectModule,
        NzFormModule,
        NzSpinModule,
        AngularSlickgridModule,
    ],
    templateUrl: './choose-employee.component.html',
    styleUrl: './choose-employee.component.css'
})
export class ChooseEmployeeComponent implements OnInit {
    @Input() kpiEmployeeTeamId: number = 0;
    @Output() onSaved = new EventEmitter<any>();

    // Dropdown data
    departments: any[] = [];
    selectedDepartmentId: number = 0;

    // Grid
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // Selected employee IDs
    selectedEmployeeIds: number[] = [];

    // Loading state
    isLoading: boolean = false;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiEmployeeTeamService: KpiEmployeeTeamService
    ) { }

    ngOnInit(): void {
        this.initGrid();
        this.loadDepartments();
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'IsSelect',
                name: 'Chọn',
                field: 'IsSelect',
                sortable: false,
                filterable: false,
                minWidth: 50,
                maxWidth: 50,
                cssClass: 'text-center',
                formatter: (_row, _cell, value) => {
                    const checked = value ? 'checked' : '';
                    return `<input type="checkbox" class="employee-checkbox" ${checked} />`;
                },
            },
            {
                id: 'ID',
                name: 'ID',
                field: 'ID',
                hidden: true,
            },
            {
                id: 'Code',
                name: 'Mã nhân viên',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 120,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'FullName',
                name: 'Tên nhân viên',
                field: 'FullName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                sortable: true,
                filterable: true,
                minWidth: 150,
                filter: { model: Filters['compoundInputText'] },
            },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.employee-grid-container',
                calculateAvailableSizeBy: 'container',
            },
            enableCellNavigation: true,
            enableFiltering: true,
            enableSorting: true,
            rowHeight: 35,
            headerRowHeight: 40,
            autoEdit: false,
            autoCommitEdit: false,
        };
    }

    loadDepartments(): void {
        this.kpiEmployeeTeamService.getDepartments().subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    // Add "All departments" option
                    this.departments = [
                        { ID: 0, Name: '--Tất cả các phòng--' },
                        ...(response.data || []).sort((a: any, b: any) => (a.STT || 0) - (b.STT || 0))
                    ];
                    this.loadEmployees();
                }
            },
            error: (error) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    loadEmployees(): void {
        if (!this.kpiEmployeeTeamId || this.kpiEmployeeTeamId <= 0) {
            this.dataset = [];
            return;
        }

        this.isLoading = true;
        this.kpiEmployeeTeamService.getEmployeesForTeam(this.selectedDepartmentId, this.kpiEmployeeTeamId).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    this.dataset = (response.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index,
                        IsSelect: false,
                    }));
                } else {
                    this.dataset = [];
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.isLoading = false;
            }
        });
    }

    onDepartmentChange(): void {
        this.selectedEmployeeIds = [];
        this.loadEmployees();
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    onGridClick(e: any, args: any): void {
        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        const cell = grid.getCellFromEvent(e);
        if (!cell) return;

        const column = this.columnDefinitions[cell.cell];
        if (column?.id !== 'IsSelect') return;

        const dataItem = grid.getDataItem(cell.row);
        if (!dataItem) return;

        const employeeId = dataItem.ID;
        const currentChecked = dataItem.IsSelect === true;

        // Toggle check state
        dataItem.IsSelect = !currentChecked;

        if (dataItem.IsSelect) {
            if (!this.selectedEmployeeIds.includes(employeeId)) {
                this.selectedEmployeeIds.push(employeeId);
            }
        } else {
            const index = this.selectedEmployeeIds.indexOf(employeeId);
            if (index > -1) {
                this.selectedEmployeeIds.splice(index, 1);
            }
        }

        grid.invalidateRow(cell.row);
        grid.render();
    }

    selectAll(): void {
        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        this.selectedEmployeeIds = [];
        this.dataset.forEach((item, index) => {
            item.IsSelect = true;
            if (item.ID && !this.selectedEmployeeIds.includes(item.ID)) {
                this.selectedEmployeeIds.push(item.ID);
            }
            grid.invalidateRow(index);
        });
        grid.render();
    }

    deselectAll(): void {
        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        this.selectedEmployeeIds = [];
        this.dataset.forEach((item, index) => {
            item.IsSelect = false;
            grid.invalidateRow(index);
        });
        grid.render();
    }

    save(): void {
        if (this.selectedEmployeeIds.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một nhân viên');
            return;
        }

        // Build payload like WinForm
        const payload = this.selectedEmployeeIds.map(id => ({
            ID: 0,
            KPIEmployeeTeamID: this.kpiEmployeeTeamId,
            EmployeeID: id,
            IsDeleted: false,
            CreatedDate: new Date().toISOString(),
            CreatedBy: '' // Will be set by backend
        }));

        this.kpiEmployeeTeamService.saveEmployeeTeamLinks(payload).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Đã thêm nhân viên thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Thêm thất bại');
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}

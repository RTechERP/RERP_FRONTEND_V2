import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption } from 'angular-slickgrid';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { OrgChartManagementService } from '../service/org-chart-management.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';


@Component({
    selector: 'app-org-chart-rtc-management',
    standalone: true,
    imports: [
        CommonModule,
        AngularSlickgridModule,
        Menubar,
        NzGridModule,
        NzModalModule
    ],
    templateUrl: './org-chart-rtc-management.component.html',
    styleUrls: ['./org-chart-rtc-management.component.css']
})
export class OrgChartRtcManagementComponent implements OnInit {

    // Master grid menu
    masterMenuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: PrimeIcons.PLUS,
            command: () => this.onCreateTeam()
        },
        {
            label: 'Sửa',
            icon: PrimeIcons.PENCIL,
            command: () => this.onEditTeam()
        },
        {
            label: 'Xóa',
            icon: PrimeIcons.TRASH,
            command: () => this.onDeleteTeam()
        }
    ];

    // Detail grid menu
    detailMenuBars: MenuItem[] = [
        {
            label: 'Thêm nhân viên',
            icon: PrimeIcons.PLUS,
            command: () => this.onAddEmployee()
        },
        {
            label: 'Xóa nhân viên',
            icon: PrimeIcons.TRASH,
            command: () => this.onDeleteEmployee()
        }
    ];

    // Master grid
    masterAngularGrid!: AngularGridInstance;
    masterColumnDefinitions: Column[] = [];
    masterGridOptions: GridOption = {};
    masterDataset: any[] = [];

    // Detail grid
    detailAngularGrid!: AngularGridInstance;
    detailColumnDefinitions: Column[] = [];
    detailGridOptions: GridOption = {};
    detailDataset: any[] = [];

    // Selected master row
    selectedMasterRow: any = null;

    constructor(
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private orgChartService: OrgChartManagementService,
        private employeeService: EmployeeService
    ) { }

    ngOnInit(): void {
        this.initMasterGrid();
        this.initDetailGrid();
        this.loadMasterData();
    }

    // ============ MASTER GRID ============
    initMasterGrid(): void {
        this.masterColumnDefinitions = [
            {
                id: 'TaxCompanyName',
                name: 'Tên công ty',
                field: 'TaxCompanyName',
                type: 'string',
                sortable: true,
                
                filterable: true,
                formatter: Formatters.tree,
                filter: { model: Filters['compoundInputText'] },
                width: 200
            },
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 150
            },
            {
                id: 'TeamCode',
                name: 'Mã',
                field: 'TeamCode',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 120
            },
            {
                id: 'TeamName',
                name: 'Tên',
                field: 'TeamName',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 200
            },
            {
                id: 'FullName',
                name: 'Leader',
                field: 'FullName',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 150
            }
        ];

        this.masterGridOptions = {
            enableSorting: false,
            enableAutoResize: true,
            autoResize: {
                container: '.master-grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container'
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true
            },
            enableTreeData: true,
            treeDataOptions: {
                columnId: 'TaxCompanyName',
                parentPropName: 'parentId',
                levelPropName: 'treeLevel',
                indentMarginLeft: 25
            },
            
            multiColumnSort: false
        };
    }

    masterGridReady(angularGrid: AngularGridInstance): void {
        this.masterAngularGrid = angularGrid;
        
        // Listen for row click
        angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
            const item = angularGrid.dataView.getItem(args.row);
            this.onMasterRowClick(item);
        });
    }

    onMasterRowClick(item: any): void {
        this.selectedMasterRow = item;
        this.loadDetailData(item.ID);
    }

    loadMasterData(): void {
        this.orgChartService.getOrganizationChart().subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.masterDataset = response.data.map((x: any) => ({
                        ...x,
                        id: x.ID,
                        parentId: x.ParentID === 0 ? null : x.ParentID
                    }));
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    // ============ DETAIL GRID ============
    initDetailGrid(): void {
        this.detailColumnDefinitions = [
            {
                id: 'EmployeeCode',
                name: 'Mã nhân viên',
                field: 'EmployeeCode',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 150
            },
            {
                id: 'FullName',
                name: 'Tên nhân viên',
                field: 'FullName',
                type: 'string',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                width: 250
            }
        ];

        this.detailGridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.detail-grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container'
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false
            },
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true
            },
            multiColumnSort: false
        };
    }

    detailGridReady(angularGrid: AngularGridInstance): void {
        this.detailAngularGrid = angularGrid;
    }

    loadDetailData(masterID: number): void {
        this.orgChartService.getOrganizationChartDetail(masterID).subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.detailDataset = response.data.map((x: any, index: number) => ({
                        ...x,
                        id: x.ID
                    }));
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            }
        });
    }

    // ============ MASTER ACTIONS ============
    async onCreateTeam(): Promise<void> {
        const { OrgChartRtcManagementFormComponent } = await import('../org-chart-rtc-management-form/org-chart-rtc-management-form.component');
        
        const modalRef = this.modalService.open(OrgChartRtcManagementFormComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false
        });

        modalRef.componentInstance.masterData = this.masterDataset;
        modalRef.componentInstance.isEdit = false;

        modalRef.result.then(() => {
            this.loadMasterData();
        }).catch(() => { });
    }

    async onEditTeam(): Promise<void> {
        const activeCell = this.masterAngularGrid?.slickGrid?.getActiveCell();
        if (!activeCell) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa');
            return;
        }

        const { OrgChartRtcManagementFormComponent } = await import('../org-chart-rtc-management-form/org-chart-rtc-management-form.component');
        const item = this.masterAngularGrid.dataView.getItem(activeCell.row);
        
        const modalRef = this.modalService.open(OrgChartRtcManagementFormComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false
        });

        modalRef.componentInstance.masterData = this.masterDataset;
        modalRef.componentInstance.team = { ...item };
        modalRef.componentInstance.isEdit = true;

        modalRef.result.then(() => {
            this.loadMasterData();
        }).catch(() => { });
    }

    onDeleteTeam(): void {
        const selectedRows = this.masterAngularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng để xóa');
            return;
        }

        const items = selectedRows.map((row: number) => this.masterAngularGrid.dataView.getItem(row));
        const content = `Bạn có muốn xóa ${items.length} team đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const deleteItems = items.map((item: any) => ({
                    ID: item.ID,
                    IsDeleted: 1
                }));

                this.orgChartService.saveData({ organizationalCharts: deleteItems }).subscribe({
                    next: () => {
                        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                        this.loadMasterData();
                        this.detailDataset = [];
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                    }
                });
            }
        });
    }

    // ============ DETAIL ACTIONS ============
    async onAddEmployee(): Promise<void> {
        if (!this.selectedMasterRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một team trước');
            return;
        }

        const { OrgChartRtcAddEmployeeComponent } = await import('../org-chart-rtc-add-employee/org-chart-rtc-add-employee.component');
        
        const modalRef = this.modalService.open(OrgChartRtcAddEmployeeComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false
        });

        modalRef.componentInstance.organizationalChartID = this.selectedMasterRow.ID;
        modalRef.componentInstance.teamName = this.selectedMasterRow.TeamName;
        modalRef.componentInstance.existingEmployees = this.detailDataset;

        modalRef.result.then(() => {
            this.loadDetailData(this.selectedMasterRow.ID);
        }).catch(() => { });
    }

    onDeleteEmployee(): void {
        const selectedRows = this.detailAngularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một nhân viên để xóa');
            return;
        }

        const items = selectedRows.map((row: number) => this.detailAngularGrid.dataView.getItem(row));
        const content = `Bạn có muốn xóa ${items.length} nhân viên đã chọn khỏi team không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const deleteItems = items.map((item: any) => ({
                    ID: item.ID,
                    IsDeleted: 1
                }));

                this.orgChartService.saveData({ organizationalChartDetails: deleteItems }).subscribe({
                    next: () => {
                        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa nhân viên thành công');
                        this.loadDetailData(this.selectedMasterRow.ID);
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                    }
                });
            }
        });
    }
}

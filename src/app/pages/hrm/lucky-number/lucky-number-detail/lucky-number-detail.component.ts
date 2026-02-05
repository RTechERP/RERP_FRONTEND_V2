import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AppUserService } from '../../../../services/app-user.service';
import { HttpClient } from '@angular/common/http';
import { LuckyNumberService } from '../lucky-number.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { EmployeeLuckyNumber } from '../employee-lucky-number';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-lucky-number-detail',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzGridModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzRadioModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        NzUploadModule,
        FormsModule,
        AngularSlickgridModule,
        NzIconModule,
        NzInputNumberModule,

    ],
    templateUrl: './lucky-number-detail.component.html',
    styleUrl: './lucky-number-detail.component.css'
})
export class LuckyNumberDetailComponent implements OnInit {

    // @Input() employeeLucky: any = null;
    @Input() employeeLucky = new EmployeeLuckyNumber();
    private destroy$ = new Subject<void>();
    validateForm !: FormGroup;

    employees: any[] = [];

    angularGrid!: AngularGridInstance;
    grdData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    // userGroups: any[] = [];

    constructor(
        private luckynumberService: LuckyNumberService,
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }


    ngOnInit(): void {
        this.getEmployees();
        this.initForm();
        this.initGrid();
    }

    initForm() {

        let yearValue = this.employeeLucky.YearValue ?? 2026
        this.validateForm = this.fb.group({
            EmployeeID: this.fb.control(this.employeeLucky.EmployeeID, [Validators.required]),
            // EmployeeCode: this.fb.control(this.employeeLucky.EmployeeCode, [Validators.required]),
            // EmployeeName: this.fb.control(this.employeeLucky.EmployeeName, [Validators.required]),
            PhoneNumber: this.fb.control(this.employeeLucky.PhoneNumber, [Validators.required]),
            YearValue: this.fb.control(yearValue, [Validators.required]),
        });

        //Sự kiện chọn Nhân viên
        this.validateForm
            .get('EmployeeID')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: number) => {

                const data = this.employees.find(x => x.ID === value);
                console.log('data em:', data);

                this.employeeLucky.EmployeeCode = data?.Code || '';
                this.employeeLucky.EmployeeName = data?.FullName || '';
                this.validateForm.get('PhoneNumber')?.setValue(data?.SDTCaNhan || '');
            });
    }


    initGrid() {
        this.columnDefinitions = [
            {
                id: 'Code',
                name: 'Mã NV',
                field: 'Code',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            {
                id: 'FullName',
                name: 'Tên NV',
                field: 'FullName',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: 'ChucVu',
                name: 'Chức vụ',
                field: 'ChucVu',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: 'SDTCaNhan',
                name: 'SDT Cá nhân',
                field: 'SDTCaNhan',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }
            },


        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,

            enableFiltering: true,

            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false// True (Single Selection), False (Multiple Selections)
            },
            checkboxSelector: {
                // you can toggle these 2 properties to show the "select all" checkbox in different location
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
                applySelectOnAllPages: true, // when clicking "Select All", should we apply it to all pages (defaults to true)
            },
            enableCheckboxSelector: true,
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.grdData = angularGrid?.slickGrid || {};
    }


    getEmployees() {
        this.luckynumberService.getEmployees().subscribe({
            next: (response) => {
                // console.log(response);
                this.employees = response.data.map((x: any, i: number) => ({
                    ...x,
                    id: i + 1
                }));
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    });
            }
        })
    }

    submitForm() {

        const selectedData = this.angularGrid.gridService.getSelectedRows();
        if (!this.validateForm.valid && selectedData.length <= 0) {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {
            const employeeLucky = {
                ...this.employeeLucky,
                ...this.validateForm.getRawValue(),
            };

            console.log('selectedData:', selectedData);
            let employeeLuckys = selectedData.map((idx: number) => {
                const item = this.grdData.getDataItem(idx);

                const obj = {
                    ID: 0,
                    EmployeeID: item.ID,
                    EmployeeCode: item.Code,
                    EmployeeName: item.FullName,
                    PhoneNumber: item.SDTCaNhan,
                    YearValue: 2026,
                }
                return obj;
            });

            if (this.validateForm.valid) {
                employeeLuckys.push(employeeLucky);
            }
            console.log('submit data', employeeLuckys);
            this.luckynumberService.savedata(employeeLuckys).subscribe({
                next: (response) => {
                    // console.log(response);
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                    this.activeModal.close();

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                },
            });
        }
    }



}

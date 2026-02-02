import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { ApproveTpService, ApproveByApproveTPRequestParam, ApproveRequestParam, ApproveItemParam } from '../approve-tp-service/approve-tp.service';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectService } from '../../../project/project-service/project.service';

import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { environment } from '../../../../../environments/environment';
import { ReasonDeclineModalComponent } from '../reason-decline-modal/reason-decline-modal.component';
import { SeniorUnapprovedModalComponent } from '../senior-unapproved-modal/senior-unapproved-modal.component';
import { WfhApproveModalComponent } from '../wfh-approve-modal/wfh-approve-modal.component';
import { ActivatedRoute } from '@angular/router';
import { PrimeIcons } from 'primeng/api';
import { PermissionService } from '../../../../services/permission.service';
import { Menubar } from 'primeng/menubar';
import { style } from '@angular/animations';
import { AppUserService } from '../../../../services/app-user.service';
@Component({
    selector: 'app-approve-tp',
    templateUrl: './approve-tp.component.html',
    styleUrls: ['./approve-tp.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzNotificationModule,
        ReactiveFormsModule,
        NzSplitterModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzGridModule,
        NzSpinModule,
        NzModalModule,
        NzDropDownModule,
        NzMenuModule,

        Menubar,
        NzTreeSelectModule
    ]
})
export class ApproveTpComponent implements OnInit, AfterViewInit {
    @ViewChild('tb_approve_tp', { static: false }) tbApproveTpRef!: ElementRef<HTMLDivElement>;

    private tabulator!: Tabulator;
    searchForm!: FormGroup;
    employeeList: any[] = [];
    teamList: any[] = [];
    teamTreeNodes: any[] = [];
    userTeamLinkList: any[] = [];
    loadingData = false;
    currentUser: any = null;
    isSenior: boolean = false;
    isBGD: boolean = false;
    isSeniorMode: boolean = false;
    showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

    get shouldShowSearchBar(): boolean {
        return this.showSearchBar;
    }

    isMobile(): boolean {
        return typeof window !== 'undefined' && window.innerWidth <= 768;
    }

    private isInitializing = true;

    ToggleSearchPanelNew(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showSearchBar = !this.showSearchBar;
    } // true: Senior duyệt làm thêm, false: Duyệt công


    menuBars: any[] = [];

    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private approveTpService: ApproveTpService,
        private authService: AuthService,
        private projectService: ProjectService,
        private modal: NzModalService,
        private route: ActivatedRoute,
        private permissionService: PermissionService,
        private appUserService: AppUserService,
        @Optional() @Inject('tabData') private tabData: any
    ) {
        // if (this.tabData) {
        //     this.isSeniorMode = this.tabData.isSeniorMode || false;
        // }

        this.route.queryParams.subscribe(params => {
            // this.isSeniorMode = params['isSeniorMode'];

            console.log('params:', params);
            console.log('this.tabData:', this.tabData);

            this.isSeniorMode =
                params['isSeniorMode']
                ?? this.tabData?.isSeniorMode
                ?? false;

        });
    }

    ngOnInit() {
        this.initMenuBar();
        this.initializeForm();
        this.getCurrentUser();
        this.loadTeams();
        this.loadEmployees();
        this.loadUserTeamLink();

        // Subscribe to teamId changes to reload employees
        if (this.searchForm) {
            this.searchForm.get('teamId')?.valueChanges.subscribe(() => {
                this.loadEmployees();
            });
        }
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Senior xác nhận',
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                // styleClass: 'bg-success',
                visible: this.permissionService.hasPermission("N85"),
                items: [
                    {
                        label: 'Duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',

                        command: () => {
                            this.approvedSenior()
                        }
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        command: () => {
                            this.cancelApprovedSenior();
                        }
                    }
                ]
            },

            // {
            //     label: 'TBP xác nhận',
            //     icon: 'fa-solid fa-calendar-check fa-lg text-primary',
            //     visible: this.permissionService.hasPermission("N32"),
            //     items: [
            //         {
            //             label: 'Duyệt',
            //             icon: 'fa-solid fa-circle-check fa-lg text-success',
            //             visible: this.permissionService.hasPermission("N32"),
            //             command: () => {
            //                 this.approvedTBP();
            //             }
            //         },
            //         {
            //             label: 'Hủy duyệt',
            //             icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            //             visible: this.permissionService.hasPermission("N32"),
            //             command: () => {
            //                 this.cancelApprovedTBP();
            //             }
            //         }
            //     ]
            // },
            {
                label: ' TBP Duyệt',
                icon: 'fa-solid fa-circle-check fa-lg text-success',
                visible: this.permissionService.hasPermission("N32"),
                command: () => {
                    this.approvedTBP();
                }
            },
            {
                label: ' TBP Hủy duyệt',
                icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                visible: this.permissionService.hasPermission("N32"),
                command: () => {
                    this.cancelApprovedTBP();
                }
            },

            {
                label: 'TBP không duyệt',
                visible: this.permissionService.hasPermission("N32"),
                icon: 'fa-solid fa-ban fa-lg text-warning',
                command: () => {
                    this.declineApprove();
                }
            },

            {
                label: 'TBP duyệt hủy đăng ký',
                visible: this.permissionService.hasPermission("N32"),
                icon: 'fa-solid fa-circle-check fa-lg text-success',
                command: () => {
                    this.approvedCancelRegister();
                }
            },

            {
                label: 'BGĐ xác nhận',
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                visible: (this.permissionService.hasPermission("N32") && this.appUserService.currentUser?.DepartmentID === 1) || this.appUserService.currentUser?.IsAdmin,
                items: [
                    {
                        label: 'Duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N32"),
                        command: () => {
                            this.approvedBGD();
                        }
                    },
                    {
                        label: 'Hủy duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N32"),
                        command: () => {
                            this.cancelApprovedBGD();
                        }
                    },
                ]
            },
        ]
    }

    getCurrentUser() {
        this.authService.getCurrentUser().subscribe((res: any) => {
            if (res && res.status === 1 && res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                this.currentUser = data;
                this.isBGD = (data?.DepartmentID == 1 && data?.EmployeeID != 54) || data?.IsAdmin;
                this.isSenior = false;
                const idApprovedTP = this.isSeniorMode ? 0 : (data?.EmployeeID || 0);
                const isRealBGD = data?.DepartmentID == 1 && data?.EmployeeID != 54;

                if (this.searchForm) {
                    this.searchForm.patchValue({
                        IDApprovedTP: idApprovedTP,
                        type: isRealBGD ? 5 : null
                    }, { emitEvent: false });
                }
                // Auto bind team nếu teamList đã được load
                this.bindDefaultTeam();


                if (this.tabulator) {

                    this.isInitializing = false; // Kết thúc khởi tạo
                    this.loadData();
                } else {
                    this.isInitializing = false;
                }
            }
        });
    }

    loadTeams() {
        this.approveTpService.getUserTeam().subscribe({
            next: (response: any) => {
                this.teamList = response.data || [];
                this.teamTreeNodes = this.buildTeamTree(this.teamList);
                // Auto bind team nếu currentUser đã được load
                this.bindDefaultTeam();
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.error.message);
            }
        });
    }

    private bindDefaultTeam(): void {
        if (!this.currentUser || !this.teamList || this.teamList.length === 0) {
            return;
        }

        const employeeId = this.currentUser.EmployeeID;
        if (!employeeId) {
            return;
        }

        // Tìm team mà currentUser là LeaderID
        const myTeam = this.teamList.find(team => team.LeaderID === employeeId);
        if (myTeam && this.searchForm) {
            this.searchForm.patchValue({
                teamId: myTeam.ID
            }, { emitEvent: false });
        }
    }

    private buildTeamTree(data: any[]): any[] {
        if (!data || data.length === 0) return [];

        // Separate root nodes (Level = -1) and child nodes
        const rootNodes = data.filter(item => item.Level === -1);
        const childNodes = data.filter(item => item.Level >= 0);

        const buildNode = (item: any): any => {
            const label = item.LeaderName
                ? `${item.Name} - ${item.LeaderName}`
                : item.Name;

            // Find children where ParentID matches this node's ID
            const children = childNodes
                .filter(child => child.ParentID === item.ID)
                .map(child => buildNode(child));

            return {
                title: label,
                key: String(item.ID),
                value: item.ID,
                children: children.length > 0 ? children : undefined,
                isLeaf: children.length === 0
            };
        };

        return rootNodes.map(root => buildNode(root));
    }

    loadEmployees() {
        const request = { status: 0, departmentid: 0, keyword: '' };

        this.approveTpService.getEmployee(request).subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    const activeEmployees = res.data.filter((emp: any) => emp.Status === 0);
                    this.employeeList = this.projectService.createdDataGroup(
                        activeEmployees,
                        'DepartmentName'
                    );
                } else {
                    this.employeeList = [];
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
                this.employeeList = [];
            }
        });
    }

    loadUserTeamLink() {
        this.approveTpService.getUserTeamLinkByLeaderID().subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    this.userTeamLinkList = Array.isArray(response.data) ? response.data : [];
                } else {
                    this.userTeamLinkList = [];
                }
            },
            error: (error: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách user team link: ' + (error?.error?.message || error?.message || '')
                );
                this.userTeamLinkList = [];
            }
        });
    }

    private getSeniorIdForEmployee(employeeId: number): number | null {
        if (!this.userTeamLinkList || this.userTeamLinkList.length === 0) {
            return null;
        }

        const candidate = this.userTeamLinkList.find((item: any) => {
            const eid = Number(item?.EmployeeID ?? item?.EmployeeId ?? item?.employeeId ?? 0);
            return eid === employeeId;
        });

        if (!candidate) {
            return null;
        }

        const seniorId = Number(
            candidate?.LeaderID ??
            candidate?.LeaderId ??
            candidate?.SeniorID ??
            candidate?.SeniorId ??
            candidate?.seniorId ??
            0
        );

        return seniorId > 0 ? seniorId : null;
    }

    hasSenior(employeeId: number): boolean {
        return this.getSeniorIdForEmployee(employeeId) !== null;
    }

    private hasSeniorByRow(row: any): boolean {
        const seniorId = Number(row?.SeniorID ?? row?.SeniorId ?? row?.seniorId ?? 0);
        if (seniorId > 0) {
            return true;
        }

        const employeeId = Number(row?.EmployeeID ?? row?.EmployeeId ?? row?.employeeId ?? 0);
        if (employeeId > 0) {
            return this.hasSenior(employeeId);
        }

        return false;
    }

    private isSeniorApprovedByRow(row: any): boolean {
        if (row?.IsSeniorApproved === undefined || row?.IsSeniorApproved === null) {
            return false;
        }
        return Boolean(row.IsSeniorApproved);
    }

    private requiresSeniorApprovalByRow(row: any): boolean {
        const seniorId = Number(row?.SeniorID ?? row?.SeniorId ?? row?.seniorId ?? 0);
        const hasSeniorAssigned = seniorId > 0;
        if (!hasSeniorAssigned) {
            return false;
        }

        const ttype = Number(row?.TType ?? 0);
        return ttype !== 7 && ttype !== 9;
    }

    resetSearch() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Convert Date to yyyy-MM-dd string format for input type="date"
        const formatDateForInput = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const idApprovedTP = this.isSeniorMode ? 0 : (this.currentUser?.EmployeeID || 0);
        const startDate = DateTime.now().minus({ days: 7 }).toJSDate();

        this.searchForm.reset({
            startDate: formatDateForInput(startDate),
            endDate: formatDateForInput(lastDay),
            employeeId: null,
            teamId: 0,
            status: -1, // null = tất cả
            deleteFlag: 0,
            type: 0,
            statusSenior: -1, // null = tất cả
            statusHR: -1,
            statusBGD: -1,
            keyWord: '',
            IDApprovedTP: idApprovedTP
        });
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.initializeTable();
    }

    private initializeForm(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Convert Date to yyyy-MM-dd string format for input type="date"
        const formatDateForInput = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const defaultType = 0;

        this.searchForm = this.fb.group({
            startDate: [formatDateForInput(firstDay)],
            endDate: [formatDateForInput(lastDay)],
            employeeId: [null],
            teamId: [null],
            status: [this.isSeniorMode ? -1 : 0],
            deleteFlag: [null],
            statusSenior: [this.isSeniorMode ? 0 : -1],
            type: [null],
            statusHR: [null],
            statusBGD: [null],
            keyWord: [null],
            IDApprovedTP: [null]
        });
    }

    loadData() {

        // Skip nếu đang trong quá trình khởi tạo
        if (this.isInitializing) {
            console.log('loadData: Skipping because component is initializing');
            return;
        }

        if (!this.tabulator) {
            console.log('loadData: tabulator not ready, skipping');
            return;
        }

        this.loadingData = true;

        const formValue = this.searchForm.value;
        const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined;
        const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined;

        const ttype = formValue.type ?? 0;

        const request: ApproveByApproveTPRequestParam = {
            FilterText: formValue.keyWord || '',
            DateStart: startDate,
            DateEnd: endDate,
            IDApprovedTP: this.isSeniorMode ? 0 : (formValue.IDApprovedTP || 0),
            Status: formValue.status ?? -1, // null = -1 (tất cả)
            DeleteFlag: formValue.deleteFlag ?? 0,
            EmployeeID: formValue.employeeId || 0,
            TType: ttype,
            StatusSenior: formValue.statusSenior ?? -1, // null = -1 (tất cả)
            StatusHR: formValue.statusHR ?? -1, // null = -1 (tất cả)
            StatusBGD: formValue.statusBGD ?? -1, // null = -1 (tất cả)
            UserTeamID: formValue.teamId || 0,
            SeniorID: this.isSeniorMode ? (this.currentUser?.EmployeeID || 0) : 0
        };
        this.approveTpService.getApproveByApproveTP(request).subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    const data = Array.isArray(response.data) ? response.data : [];
                    this.tabulator.setData(data);
                } else {
                    this.tabulator.setData([]);
                }
                this.loadingData = false;
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
                this.tabulator.setData([]);
                this.loadingData = false;
            }
        });
    }

    private initializeTable(): void {
        if (!this.tbApproveTpRef?.nativeElement) {
            return;
        }
        this.tabulator = new Tabulator(this.tbApproveTpRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataStretch',
            height: '80vh',
            paginationMode: 'local',
            paginationSize: 200,
            groupBy: 'TypeText',
            groupHeader: function (value, count, data, group) {
                return "Hạng mục : " + value + "(" + count + " )";
            },
            columns: [
                {
                    title: 'Trạng thái duyệt', columns: [
                        {
                            title: 'Senior ', field: 'IsSeniorApprovedText', hozAlign: 'center', headerHozAlign: 'center', width: 70, headerWordWrap: true, headerSort: false,
                            formatter: (cell: any) => {
                                const rowData = cell.getRow().getData();
                                const textValue = cell.getValue();
                                const isSeniorApproved = rowData.IsSeniorApproved;

                                let numValue = 0;
                                if (isSeniorApproved !== undefined && isSeniorApproved !== null) {
                                    if (typeof isSeniorApproved === 'boolean') {
                                        numValue = isSeniorApproved ? 1 : 0;
                                    } else if (typeof isSeniorApproved === 'number') {
                                        numValue = isSeniorApproved === 0 ? 0 : (isSeniorApproved === 1 ? 1 : (isSeniorApproved === 2 ? 2 : 0));
                                    }
                                } else if (textValue !== null && textValue !== undefined && typeof textValue === 'string') {
                                    // Nếu không có IsSeniorApproved, kiểm tra text value
                                    if (textValue === 'Chờ duyệt' || textValue === 'Chưa duyệt') {
                                        numValue = 0;
                                    } else if (textValue === 'Đã duyệt') {
                                        numValue = 1;
                                    } else if (textValue === 'Từ chối' || textValue === 'Không duyệt' || textValue === 'Không đồng ý duyệt') {
                                        numValue = 2;
                                    } else {
                                        numValue = 0;
                                    }
                                } else {
                                    numValue = 0;
                                }

                                // Nếu SeniorID = 0 hoặc EmployeeID = SeniorID thì mặc định là đã duyệt
                                const seniorId = Number(rowData?.SeniorID ?? rowData?.SeniorId ?? rowData?.seniorId ?? 0);
                                const employeeId = Number(rowData?.EmployeeID ?? rowData?.EmployeeId ?? rowData?.employeeId ?? 0);
                                if (seniorId === 0 || (employeeId > 0 && employeeId === seniorId)) {
                                    numValue = 1;
                                }

                                return this.formatApprovalBadge(numValue);
                            },
                        },
                        {
                            title: 'TBP ', field: 'StatusText', hozAlign: 'center', headerHozAlign: 'center', width: 70, headerWordWrap: true, headerSort: false,
                            formatter: (cell: any) => {
                                const value = cell.getValue();
                                let numValue = 0;
                                if (value === null || value === undefined) {
                                    numValue = 0;
                                } else if (typeof value === 'number') {
                                    numValue = value;
                                } else if (typeof value === 'string') {
                                    if (value === 'Chờ duyệt' || value === 'Chưa duyệt') numValue = 0;
                                    else if (value === 'Đã duyệt') numValue = 1;
                                    else if (value === 'Không đồng ý duyệt' || value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
                                    else if (value === 'Chờ duyệt hủy đăng ký') numValue = 3;
                                    else if (value === 'Đã duyệt hủy đăng ký') numValue = 4;
                                    else numValue = 0;
                                }
                                return this.formatApprovalBadge(numValue);
                            },

                        },
                        {
                            title: 'HR ', field: 'StatusHRText', hozAlign: 'center', headerHozAlign: 'center', width: 70, headerWordWrap: true, headerSort: false,
                            formatter: (cell: any) => {
                                const rowData = cell.getRow().getData();
                                const value = cell.getValue();
                                let numValue = 0;

                                // Ưu tiên lấy từ StatusHRNumber hoặc IsApprovedHR nếu StatusHRText rỗng
                                if (value === null || value === undefined || value === '') {
                                    // Nếu StatusHRText rỗng, lấy từ StatusHRNumber hoặc IsApprovedHR
                                    if (rowData.StatusHRNumber !== undefined && rowData.StatusHRNumber !== null) {
                                        numValue = Number(rowData.StatusHRNumber);
                                    } else if (rowData.IsApprovedHR !== undefined && rowData.IsApprovedHR !== null) {
                                        const hrValue = Number(rowData.IsApprovedHR);
                                        // Convert: 0 = chờ duyệt, 1 = đã duyệt, 2 = không đồng ý duyệt
                                        if (hrValue === 0) numValue = 0;
                                        else if (hrValue === 1) numValue = 1;
                                        else if (hrValue === 2) numValue = 2;
                                        else numValue = 0;
                                    } else {
                                        numValue = 0;
                                    }
                                } else if (typeof value === 'number') {
                                    numValue = value;
                                } else if (typeof value === 'string') {
                                    if (value === 'Chờ duyệt' || value === 'Chưa duyệt') numValue = 0;
                                    else if (value === 'Đã duyệt') numValue = 1;
                                    else if (value === 'Không đồng ý duyệt' || value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
                                    else if (value === 'Chờ duyệt hủy đăng ký') numValue = 3;
                                    else if (value === 'Đã duyệt hủy đăng ký') numValue = 4;
                                    else numValue = 0;
                                }
                                return this.formatApprovalBadge(numValue);
                            },

                        },
                        {
                            title: 'BGĐ ', field: 'StatusBGDText', hozAlign: 'center', headerHozAlign: 'center', width: 70, headerWordWrap: true, headerSort: false,
                            formatter: (cell: any) => {
                                const value = cell.getValue();
                                let numValue = 0;
                                if (value === null || value === undefined) {
                                    numValue = 0;
                                } else if (typeof value === 'number') {
                                    numValue = value;
                                } else if (typeof value === 'string') {
                                    if (value === 'Chờ duyệt' || value === 'Chưa duyệt') numValue = 0;
                                    else if (value === 'Đã duyệt') numValue = 1;
                                    else if (value === 'Không đồng ý duyệt' || value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
                                    else if (value === 'Chờ duyệt hủy đăng ký') numValue = 3;
                                    else if (value === 'Đã duyệt hủy đăng ký') numValue = 4;
                                    else numValue = 0;
                                }
                                return this.formatApprovalBadge(numValue);
                            },

                        },
                    ]
                },

                {
                    title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 55, headerWordWrap: true, headerSort: false,
                },
                {
                    title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, formatter: 'textarea', headerSort: false, bottomCalc: 'count',
                },
                {
                    title: 'Ngày', field: 'NgayDangKy', hozAlign: 'center', headerHozAlign: 'center', width: 90, headerSort: false,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    }
                },


                {
                    title: 'Nội dung',
                    field: 'NoiDung',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 350,
                    headerSort: false,
                    formatter: (cell: any) => {
                        const rowData = cell.getRow().getData();
                        const value = cell.getValue() || '';

                        // Set background color trực tiếp trên cell element
                        if (rowData.IsNotValid === 1 || rowData.IsNotValid === true) {
                            setTimeout(() => {
                                cell.getElement().style.backgroundColor = '#ede4baff';
                            }, 0);
                        }

                        // Return HTML string - Tabulator sẽ tự động render nó
                        return `<div style="white-space: normal;">${value}</div>`;
                    }
                },
                {
                    title: 'Lí do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
                },
                {
                    title: 'Chấm công',
                    columns: [
                        {
                            title: 'CheckIn', field: 'CheckIn', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,

                        },
                        {
                            title: 'CheckOut', field: 'CheckOut', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,
                            //   formatter: (cell) => {
                            //     const value = cell.getValue();
                            //     const row = cell.getRow().getData();
                            //     if (row['IsNotValid'] === 1) {
                            //       return `<span style="color: red; font-weight: bold;">${value || ''}</span>`;
                            //     }
                            //     return value || '';
                            //   }
                        }
                    ]
                },
                {
                    title: 'File bổ sung', field: 'FileName', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
                    formatter: (cell) => {
                        const fileName = cell.getValue();
                        if (fileName) {
                            return `<a href="javascript:void(0)" style="color: #1677ff; text-decoration: underline;">${fileName}</a>`;
                        }
                        return '';
                    },
                    cellClick: (e: any, cell: any) => {
                        if (cell.getValue()) {
                            this.downloadFile(cell.getRow().getData());
                        }
                    }
                },
                {
                    title: 'Người duyệt', columns: [
                        {
                            title: 'Tên Senior ', field: 'ApprovedSeniorName', hozAlign: 'left', headerHozAlign: 'center', width: 120, formatter: 'textarea', headerSort: false,
                        },
                        {
                            title: 'Tên TBP ', field: 'NguoiDuyet', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
                        },
                        {
                            title: 'Tên BGĐ ', field: 'FullNameBGD', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
                        },

                    ]
                },
                {
                    title: 'Đánh giá công việc', field: 'EvaluateResults', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
                },

                {
                    title: 'Lý do HR sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
                },
                {
                    title: 'Lý do không duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
                },
                {
                    title: 'Ngày đăng ký', field: 'CreatedDate', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
                    }
                },
            ],
        });

        // Chỉ load data nếu đã có currentUser, nếu không sẽ được gọi trong getCurrentUser()
        // if (this.currentUser) {
        //     this.loadData();
        // }
    }

    getSelectedRows(): any[] {
        const selectedRows = this.tabulator.getSelectedRows();
        return selectedRows.map(row => row.getData());
    }

    approvedTBP() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.approveTBPWithValidation(true);
    }

    cancelApprovedTBP() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.approveTBPWithValidation(false);
    }

    private approveTBPWithValidation(isApproved: boolean) {
        const selectedRows = this.getSelectedRows();
        const actionText = isApproved ? 'duyệt' : 'hủy duyệt';
        const validRows: any[] = [];
        const seniorUnapprovedRows: any[] = [];
        const skippedMessages: string[] = [];

        const isAdmin = this.currentUser?.IsAdmin || false;
        const currentEmployeeID = this.currentUser?.EmployeeID || 0;

        for (const row of selectedRows) {
            const id = row.ID ? Number(row.ID) : 0;
            if (id <= 0) {
                continue;
            }

            const fullname = row.FullName ? String(row.FullName) : '';
            const table = row.TypeText ? String(row.TypeText) : '';
            const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;
            const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
            const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : 0;
            const isApprovedTP = row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : false;
            const bgdValue = row.IsApprovedBGD !== undefined && row.IsApprovedBGD !== null
                ? (typeof row.IsApprovedBGD === 'boolean' ? (row.IsApprovedBGD ? 1 : 0) : Number(row.IsApprovedBGD))
                : -1;
            const isApprovedBGD = bgdValue === 1;
            const employeeId = row.EmployeeID ? Number(row.EmployeeID) : 0;

            // Validation checks
            if (deleteFlag) {
                skippedMessages.push(`${fullname}: đã tự xoá khai báo [${table}]`);
                continue;
            }

            if (!isApproved && isApprovedHR) {
                skippedMessages.push(`${fullname}: đã được HR duyệt`);
                continue;
            }

            if (isCancelRegister > 0) {
                skippedMessages.push(`${fullname}: đã đăng ký hủy`);
                continue;
            }

            if (isApproved && isApprovedTP) {
                skippedMessages.push(`${fullname}: đã được TBP duyệt`);
                continue;
            }

            if (!isApproved && !isApprovedTP) {
                skippedMessages.push(`${fullname}: chưa được TBP duyệt`);
                continue;
            }

            if (!isApproved && isApprovedBGD) {
                skippedMessages.push(`${fullname}: đã được BGĐ duyệt`);
                continue;
            }

            // Check senior approval status for approval action
            if (isApproved && employeeId > 0) {
                const requiresSeniorApproval = this.requiresSeniorApprovalByRow(row);
                const isSeniorApproved = this.isSeniorApprovedByRow(row);

                if (requiresSeniorApproval && !isSeniorApproved) {
                    // This record needs senior approval but hasn't been approved yet
                    seniorUnapprovedRows.push(row);
                    continue;
                }
            }

            validRows.push(row);
        }

        // If approving and there are senior unapproved rows
        if (isApproved && seniorUnapprovedRows.length > 0) {
            // Show warning modal if there are senior unapproved records
            const seniorApprovedCount = validRows.length;
            const seniorUnapprovedCount = seniorUnapprovedRows.length;

            // Show confirmation dialog first
            this.modal.confirm({
                nzTitle: 'Cảnh báo',
                nzContent: `Có ${seniorUnapprovedCount} bản ghi chưa được Senior duyệt.<br/>
                            Có ${seniorApprovedCount} bản ghi đã được Senior duyệt.<br/><br/>
                            Bạn có muốn tiếp tục duyệt không?`,
                nzOkText: 'Tiếp tục',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                    // If only senior-approved records exist, approve them directly
                    if (seniorApprovedCount > 0) {
                        this.processApproveTBP(validRows, isApproved, actionText, false);
                    }

                    // Then show the modal for senior unapproved records
                    if (seniorUnapprovedCount > 0) {
                        this.showSeniorUnapprovedModal(seniorUnapprovedRows, isApproved, actionText);
                    }
                }
            });
            return;
        }

        // Show skipped messages if any
        if (validRows.length === 0) {
            const preview = skippedMessages.slice(0, 5).join('; ');
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Không có bản ghi hợp lệ để ${actionText}. ${preview}${skippedMessages.length > 5 ? '...' : ''}`
            );
            return;
        }

        if (skippedMessages.length > 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Có ${skippedMessages.length} bản ghi không hợp lệ nên không được ${actionText}: ${skippedMessages.slice(0, 5).join('; ')}${skippedMessages.length > 5 ? '...' : ''}`
            );
        }

        // Standard confirmation for approve/unapprove
        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: `Bạn có chắc muốn ${actionText} ${validRows.length} bản ghi đã chọn không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.processApproveTBP(validRows, isApproved, actionText, false);
            }
        });
    }

    private showSeniorUnapprovedModal(unapprovedRows: any[], isApproved: boolean, actionText: string) {
        const modalRef = this.modal.create({
            nzContent: SeniorUnapprovedModalComponent,
            nzWidth: 900,
            nzFooter: null,
            nzMaskClosable: false,
            nzClosable: false,
            nzCentered: true,
            nzBodyStyle: { padding: '0' }
        });

        const instance = modalRef.getContentComponent();
        instance.unapprovedRows = unapprovedRows;
        instance.modalTitle = 'Danh sách chưa được Senior duyệt';

        modalRef.afterClose.subscribe((result: any) => {
            if (result && result.confirmed) {
                if (result.approveSenior && result.selectedRows && result.selectedRows.length > 0) {
                    // Force approve selected rows including senior override
                    this.processApproveTBP(result.selectedRows, isApproved, actionText, true);
                }
                // If approveSenior is false or no selectedRows, do nothing (already approved the senior-approved ones)
            }
        });
    }

    private processApproveTBP(selectedRows: any[], isApproved: boolean, actionText: string, forceApproveSenior: boolean, skipWfhCheck: boolean = false) {
        // WFH Check Logic: Nếu đang duyệt (isApproved=true) và chưa check WFH
        if (isApproved && !skipWfhCheck) {
            const wfhRows = selectedRows.filter(row => {
                const ttype = row.TType !== undefined ? Number(row.TType) : 0;
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0 && ttype === 5;
            });

            if (wfhRows.length > 0) {
                // Open WFH Modal
                const modalRef = this.modal.create({
                    nzContent: WfhApproveModalComponent,
                    nzWidth: 1000,
                    nzFooter: null,
                    nzMaskClosable: false,
                    nzClosable: false, // Sử dụng custom header
                    nzTitle: undefined,
                    nzCentered: true,
                    nzBodyStyle: { padding: '0' }
                });

                const instance = modalRef.getContentComponent();
                // Clone rows to avoid reference issues
                instance.wfhRows = JSON.parse(JSON.stringify(wfhRows));

                modalRef.afterClose.subscribe((result: any) => {
                    if (result && result.confirmed) {
                        const updatedWfhRows = result.data || [];

                        // Merge updated rows back to selectedRows
                        // Update EvaluateResults field
                        const newSelectedRows = selectedRows.map(row => {
                            const rowId = row.ID ? Number(row.ID) : 0;
                            const update = updatedWfhRows.find((u: any) => {
                                const uId = u.ID ? Number(u.ID) : 0;
                                return uId === rowId;
                            });

                            if (update) {
                                // Update EvaluateResults
                                return { ...row, EvaluateResults: update.EvaluateResults };
                            }
                            return row;
                        });

                        // Call recursively with skipWfhCheck = true to proceed with approval
                        this.processApproveTBP(newSelectedRows, isApproved, actionText, forceApproveSenior, true);
                    }
                    // If cancelled, do nothing (abort approval)
                });
                return; // Stop current execution, wait for modal result
            }
        }

        // If forcing senior approval, approve senior first, then TBP
        if (forceApproveSenior && isApproved) {
            this.approveSeniorThenTBP(selectedRows, actionText);
            return;
        }

        // Nếu đang duyệt TBP, kiểm tra những nhân viên không có Senior để gọi API approve Senior trước
        if (isApproved) {
            const noSeniorRows = selectedRows.filter(row => {
                const seniorId = Number(row?.SeniorID ?? row?.SeniorId ?? row?.seniorId ?? 0);
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0 && seniorId <= 0;
            });

            if (noSeniorRows.length > 0) {
                // Gọi API approve Senior cho những nhân viên không có Senior trước
                this.approveSeniorForNoSeniorEmployees(noSeniorRows, selectedRows, actionText);
                return;
            }
        }

        // Normal TBP approval
        const items: ApproveItemParam[] = selectedRows
            .filter(row => {
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0;
            })
            .map(row => {
                const ttype = row.TType !== undefined ? Number(row.TType) : 0;
                const evaluateResults = row.EvaluateResults ? String(row.EvaluateResults) : '';

                // Khi hủy duyệt TBP, giữ nguyên trạng thái Senior (không thay đổi)
                // Chỉ khi duyệt TBP mới có thể thay đổi (nếu force approve)
                let seniorApprovedValue = row.IsSeniorApproved !== undefined
                    ? Boolean(row.IsSeniorApproved)
                    : null;

                // Nếu không có Senior (SeniorID = 0) thì khi TBP duyệt sẽ auto update IsSeniorApproved = true
                const seniorId = Number(row?.SeniorID ?? row?.SeniorId ?? row?.seniorId ?? 0);
                if (seniorId <= 0 && isApproved) {
                    seniorApprovedValue = true;
                }

                return {
                    Id: row.ID ? Number(row.ID) : null,
                    TableName: row.TableName ? String(row.TableName) : '',
                    FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
                    FullName: row.FullName ? String(row.FullName) : '',
                    DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                    IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                    IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                    IsApprovedTP: isApproved,
                    IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                    IsSeniorApproved: seniorApprovedValue, // Giữ nguyên giá trị hiện tại
                    ValueUpdatedDate: new Date().toISOString(),
                    ValueDecilineApprove: isApproved ? '1' : '',
                    EvaluateResults: evaluateResults,
                    EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                    TType: row.TType !== undefined ? Number(row.TType) : null
                };
            });

        const request: ApproveRequestParam = {
            Items: items,
            IsApproved: isApproved
        };

        this.approveTpService.approveTBP(request).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công!`);
                    this.loadData();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || `Lỗi khi ${actionText}`);
            }
        });
    }

    private approveSeniorThenTBP(selectedRows: any[], actionText: string) {
        // Step 1: Approve Senior first
        const seniorItems: ApproveItemParam[] = selectedRows
            .filter(row => {
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0;
            })
            .map(row => ({
                Id: row.ID ? Number(row.ID) : null,
                TableName: row.TableName ? String(row.TableName) : '',
                FieldName: 'IsSeniorApproved',
                FullName: row.FullName ? String(row.FullName) : '',
                DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
                // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                IsSeniorApproved: true,
                ValueUpdatedDate: new Date().toISOString(),
                ValueDecilineApprove: '',
                EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                TType: row.TType !== undefined ? Number(row.TType) : null,
                ApprovedSeniorID: this.currentUser?.EmployeeID || null
            }));

        const seniorRequest: ApproveRequestParam = {
            Items: seniorItems,
            IsApproved: true
        };

        // Call Senior approve first
        this.approveTpService.approveSenior(seniorRequest).subscribe({
            next: (seniorResponse: any) => {
                if (seniorResponse && seniorResponse.status === 1) {
                    // Step 2: Now approve TBP
                    const tbpItems: ApproveItemParam[] = selectedRows
                        .filter(row => {
                            const id = row.ID ? Number(row.ID) : 0;
                            return id > 0;
                        })
                        .map(row => {
                            const evaluateResults = row.EvaluateResults ? String(row.EvaluateResults) : '';
                            return {
                                Id: row.ID ? Number(row.ID) : null,
                                TableName: row.TableName ? String(row.TableName) : '',
                                FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
                                FullName: row.FullName ? String(row.FullName) : '',
                                DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                                IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                                IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                                IsApprovedTP: true,
                                // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                                IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                                IsSeniorApproved: true, // Just approved in previous step
                                ValueUpdatedDate: new Date().toISOString(),
                                ValueDecilineApprove: '1',
                                EvaluateResults: evaluateResults,
                                EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                                TType: row.TType !== undefined ? Number(row.TType) : null
                            };
                        });

                    const tbpRequest: ApproveRequestParam = {
                        Items: tbpItems,
                        IsApproved: true
                    };

                    this.approveTpService.approveTBP(tbpRequest).subscribe({
                        next: (tbpResponse: any) => {
                            if (tbpResponse && tbpResponse.status === 1) {
                                this.notification.success(
                                    NOTIFICATION_TITLE.success,
                                    `Đã ${actionText} thành công (bao gồm duyệt Senior)!`
                                );
                                this.loadData();
                            } else {
                                this.notification.error(
                                    NOTIFICATION_TITLE.error,
                                    tbpResponse?.message || `Lỗi khi ${actionText} TBP!`
                                );
                            }
                        },
                        error: (error) => {
                            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                            this.notification.error(NOTIFICATION_TITLE.error, errorMessage || `Lỗi khi ${actionText} TBP`);
                        }
                    });
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        seniorResponse?.message || 'Lỗi khi duyệt Senior!'
                    );
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi duyệt Senior');
            }
        });
    }

    /**
     * Duyệt Senior cho những nhân viên không có Senior, sau đó duyệt TBP cho tất cả
     */
    private approveSeniorForNoSeniorEmployees(noSeniorRows: any[], allSelectedRows: any[], actionText: string) {
        // Step 1: Approve Senior for employees who don't have a Senior
        const seniorItems: ApproveItemParam[] = noSeniorRows
            .filter(row => {
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0;
            })
            .map(row => ({
                Id: row.ID ? Number(row.ID) : null,
                TableName: row.TableName ? String(row.TableName) : '',
                FieldName: 'IsSeniorApproved',
                FullName: row.FullName ? String(row.FullName) : '',
                DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
                IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                IsSeniorApproved: true,
                ValueUpdatedDate: new Date().toISOString(),
                ValueDecilineApprove: '',
                EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                TType: row.TType !== undefined ? Number(row.TType) : null,
                ApprovedSeniorID: this.currentUser?.EmployeeID || null
            }));

        const seniorRequest: ApproveRequestParam = {
            Items: seniorItems,
            IsApproved: true
        };
        this.approveTpService.approveSenior(seniorRequest).subscribe({
            next: (seniorResponse: any) => {
                if (seniorResponse && seniorResponse.status === 1) {
                    this.executeTBPApproval(allSelectedRows, true, actionText);
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        seniorResponse?.message
                    );
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi duyệt Senior');
            }
        });
    }
    /**
     * Thực hiện duyệt TBP (không kiểm tra Senior nữa)
     */
    private executeTBPApproval(selectedRows: any[], isApproved: boolean, actionText: string) {
        const items: ApproveItemParam[] = selectedRows
            .filter(row => {
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0;
            })
            .map(row => {
                const evaluateResults = row.EvaluateResults ? String(row.EvaluateResults) : '';

                // Đã approve Senior rồi nên set IsSeniorApproved = true
                let seniorApprovedValue = row.IsSeniorApproved !== undefined
                    ? Boolean(row.IsSeniorApproved)
                    : null;

                // Nếu không có Senior (SeniorID = 0) thì khi TBP duyệt đã auto update IsSeniorApproved = true
                const seniorId = Number(row?.SeniorID ?? row?.SeniorId ?? row?.seniorId ?? 0);
                if (seniorId <= 0 && isApproved) {
                    seniorApprovedValue = true;
                }

                return {
                    Id: row.ID ? Number(row.ID) : null,
                    TableName: row.TableName ? String(row.TableName) : '',
                    FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
                    FullName: row.FullName ? String(row.FullName) : '',
                    DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                    IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                    IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                    IsApprovedTP: isApproved,
                    IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                    IsSeniorApproved: seniorApprovedValue,
                    ValueUpdatedDate: new Date().toISOString(),
                    ValueDecilineApprove: isApproved ? '1' : '',
                    EvaluateResults: evaluateResults,
                    EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                    TType: row.TType !== undefined ? Number(row.TType) : null
                };
            });

        const request: ApproveRequestParam = {
            Items: items,
            IsApproved: isApproved
        };

        this.approveTpService.approveTBP(request).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công!`);
                    this.loadData();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || `Lỗi khi ${actionText}`);
            }
        });
    }

    private unApproveTBPWithValidation() {
        const selectedRows = this.getSelectedRows();
        const actionText = 'hủy duyệt';
        const isAdmin = this.currentUser?.IsAdmin || false;

        if (!isAdmin) {
            for (const row of selectedRows) {
                const id = row.ID ? Number(row.ID) : 0;
                if (id <= 0) {
                    continue;
                }

                const fullname = row.FullName ? String(row.FullName) : '';
                const table = row.TypeText ? String(row.TypeText) : '';
                const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;
                const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
                const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : 0;
                const isApprovedTP = row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : false;
                const bgdValue = row.IsApprovedBGD !== undefined && row.IsApprovedBGD !== null
                    ? (typeof row.IsApprovedBGD === 'boolean' ? (row.IsApprovedBGD ? 1 : 0) : Number(row.IsApprovedBGD))
                    : -1;
                const isApprovedBGD = bgdValue === 1;

                if (deleteFlag) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Bạn không thể ${actionText} vì nhân viên ${fullname} đã tự xoá khai báo [${table}]!`
                    );
                    return;
                }

                if (isApprovedHR) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Bạn không thể ${actionText} vì nhân viên ${fullname} đã được HR duyệt!`
                    );
                    return;
                }

                if (isCancelRegister > 0) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Bạn không thể ${actionText} vì nhân viên ${fullname} đã đăng ký hủy!`
                    );
                    return;
                }

                if (!isApprovedTP) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Bạn không thể ${actionText} vì nhân viên ${fullname} chưa được TBP duyệt!`
                    );
                    return;
                }

                if (isApprovedBGD) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Bạn không thể ${actionText} vì nhân viên ${fullname} đã được BGĐ duyệt!`
                    );
                    return;
                }
            }
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: `Bạn có chắc muốn ${actionText} danh sách nhân viên đã chọn không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const items: ApproveItemParam[] = selectedRows
                    .filter(row => {
                        const id = row.ID ? Number(row.ID) : 0;
                        return id > 0;
                    })
                    .map(row => {
                        const ttype = row.TType !== undefined ? Number(row.TType) : 0;
                        const evaluateResults = row.EvaluateResults ? String(row.EvaluateResults) : '';

                        return {
                            Id: row.ID ? Number(row.ID) : null,
                            TableName: row.TableName ? String(row.TableName) : '',
                            FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
                            FullName: row.FullName ? String(row.FullName) : '',
                            DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                            IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                            IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                            IsApprovedTP: null,
                            // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                            IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                            IsSeniorApproved: row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null,
                            ValueUpdatedDate: new Date().toISOString(),
                            ValueDecilineApprove: '',
                            EvaluateResults: evaluateResults,
                            EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                            TType: row.TType !== undefined ? Number(row.TType) : null,
                            ReasonDeciline: '' // Backend sử dụng ReasonDeciline làm @Value trong stored procedure
                        };
                    });

                const request: ApproveRequestParam = {
                    Items: items,
                    IsApproved: false
                };

                this.approveTpService.unApproveTBP(request).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            const notProcessed = response.data || [];
                            if (notProcessed.length > 0) {
                                const reasons = notProcessed.map((item: any) =>
                                    `${item.Item?.FullName || 'N/A'}: ${item.Reason || 'Không xác định'}`
                                ).join('\n');

                                this.notification.warning(
                                    NOTIFICATION_TITLE.warning,
                                    `Đã ${actionText} thành công, nhưng có ${notProcessed.length} bản ghi không được xử lý:\n${reasons}`
                                );
                            } else {
                                this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công!`);
                            }
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                        }
                    },
                    error: (error) => {
                        this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi ${actionText}: ${error.message}`);
                    }
                });
            }
        });
    }

    approvedBGD() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.approveAction(true, 'BGD');
    }

    cancelApprovedBGD() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.approveAction(false, 'BGD');
    }

    approvedSenior() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.approveSeniorWithValidation();
    }

    cancelApprovedSenior() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        this.unApproveSeniorWithValidation();
    }

    private approveSeniorWithValidation() {
        const selectedRows = this.getSelectedRows();
        const actionText = 'duyệt';

        this.approveTpService.getUserTeamLinkByLeaderID().subscribe({
            next: (response: any) => {
                let seniorList: any[] = [];
                if (response && response.status === 1 && response.data) {
                    seniorList = Array.isArray(response.data) ? response.data : [response.data];
                }

                // Bỏ validation ở frontend, để filter trong modal và backend xử lý
                this.modal.confirm({
                    nzTitle: 'Xác nhận',
                    nzContent: `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`,
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                        // Chỉ filter những bản ghi nhân viên thuộc team của senior
                        // Các validation khác để API xử lý
                        const items: ApproveItemParam[] = selectedRows
                            .filter(row => {
                                const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
                                const isSenior = seniorList.some((senior: any) =>
                                    senior.EmployeeID === employeeID
                                );
                                return isSenior;
                            })
                            .map(row => {
                                const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
                                return {
                                    Id: row.ID ? Number(row.ID) : null,
                                    TableName: row.TableName ? String(row.TableName) : '',
                                    FieldName: 'IsSeniorApproved',
                                    FullName: row.FullName ? String(row.FullName) : '',
                                    DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                                    IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                                    IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                                    IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
                                    // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                                    IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                                    IsSeniorApproved: true,
                                    ValueUpdatedDate: new Date().toISOString(),
                                    ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
                                    EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                                    EmployeeID: employeeID,
                                    TType: row.TType !== undefined ? Number(row.TType) : null,
                                    ApprovedSeniorID: this.currentUser?.EmployeeID || null
                                };
                            });

                        if (items.length === 0) {
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                'Không có bản ghi nào phù hợp để xử lý! Vui lòng kiểm tra:\n- Bạn phải là Senior của nhân viên đó'
                            );
                            return;
                        }

                        const request: ApproveRequestParam = {
                            Items: items,
                            IsApproved: true
                        };

                        this.approveTpService.approveSenior(request).subscribe({
                            next: (response: any) => {
                                if (response && response.status === 1) {
                                    const notProcessed = response.data || [];
                                    const totalItems = items.length;
                                    const successCount = totalItems - notProcessed.length;

                                    if (notProcessed.length > 0) {
                                        const reasons = notProcessed.map((item: any) =>
                                            `${item.Item?.FullName || 'N/A'}: ${item.Reason || 'Không xác định'}`
                                        ).join('\n');

                                        this.notification.warning(
                                            NOTIFICATION_TITLE.warning,
                                            `Đã ${actionText} thành công ${successCount}/${totalItems} bản ghi. Có ${notProcessed.length} bản ghi không được xử lý:\n${reasons}`
                                        );
                                    } else {
                                        this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công ${totalItems} bản ghi!`);
                                    }
                                    this.loadData();
                                } else {
                                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                                }
                            },
                            error: (error) => {
                                this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi ${actionText}: ${error.message}`);
                            }
                        });
                    }
                });
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi lấy danh sách Senior');
            }
        });
    }

    private unApproveSeniorWithValidation() {
        const selectedRows = this.getSelectedRows();
        const actionText = 'hủy duyệt';

        this.approveTpService.getUserTeamLinkByLeaderID().subscribe({
            next: (response: any) => {
                let seniorList: any[] = [];
                if (response && response.status === 1 && response.data) {
                    seniorList = Array.isArray(response.data) ? response.data : [response.data];
                }

                // Bỏ validation ở frontend, để filter trong modal và backend xử lý
                this.modal.confirm({
                    nzTitle: 'Xác nhận',
                    nzContent: `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`,
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                        // Chỉ filter những bản ghi nhân viên thuộc team của senior
                        // Bỏ filter theo TableName để xử lý tất cả các bảng
                        const items: ApproveItemParam[] = selectedRows
                            .filter(row => {
                                const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
                                const isSenior = seniorList.some((senior: any) =>
                                    senior.EmployeeID === employeeID
                                );
                                return isSenior;
                            })
                            .map(row => {
                                const tableName = row.TableName ? String(row.TableName) : '';

                                return {
                                    EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : 0,
                                    Id: row.ID ? Number(row.ID) : null,
                                    TableName: tableName,
                                    FieldName: 'IsSeniorApproved',
                                    FullName: row.FullName ? String(row.FullName) : '',
                                    DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                                    IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                                    IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                                    IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
                                    // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                                    IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                                    IsSeniorApproved: false,
                                    ValueUpdatedDate: new Date().toISOString(),
                                    ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
                                    EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                                    TType: row.TType !== undefined ? Number(row.TType) : null,
                                    ApprovedSeniorID: this.currentUser?.EmployeeID || null
                                };
                            });

                        if (items.length === 0) {
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                'Không có bản ghi nào phù hợp để xử lý!'
                            );
                            return;
                        }

                        const request: ApproveRequestParam = {
                            Items: items,
                            IsApproved: false
                        };

                        this.approveTpService.approveSenior(request).subscribe({
                            next: (response: any) => {
                                if (response && response.status === 1) {
                                    const notProcessed = response.data || [];
                                    const totalItems = items.length;
                                    const successCount = totalItems - notProcessed.length;

                                    if (notProcessed.length > 0) {
                                        const reasons = notProcessed.map((item: any) =>
                                            `${item.Item?.FullName || 'N/A'}: ${item.Reason || 'Không xác định'}`
                                        ).join('\n');

                                        this.notification.warning(
                                            NOTIFICATION_TITLE.warning,
                                            `Đã ${actionText} thành công ${successCount}/${totalItems} bản ghi. Có ${notProcessed.length} bản ghi không được xử lý:\n${reasons}`
                                        );
                                    } else {
                                        this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công ${totalItems} bản ghi!`);
                                    }
                                    this.loadData();
                                } else {
                                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                                }
                            },
                            error: (error) => {
                                this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi ${actionText}: ${error.message}`);
                            }
                        });
                    }
                });
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi lấy danh sách Senior');
            }
        });
    }

    private approveAction(isApproved: boolean, type: 'TBP' | 'BGD' | 'Senior') {
        const selectedRows = this.getSelectedRows();
        const actionText = isApproved ? 'duyệt' : 'hủy duyệt';

        // if (type === 'BGD') {
        //     for (const row of selectedRows) {
        //         const id = row.ID ? Number(row.ID) : 0;
        //         if (id <= 0) {
        //             continue;
        //         }

        //         const fullName = row.FullName ? String(row.FullName) : '';
        //         const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
        //         // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
        //         const convertedBGD = this.convertIsApprovedBGD(row.IsApprovedBGD);
        //         const isApprovedBGD = convertedBGD === true;

        //         if (!isApprovedHR) {
        //             this.notification.warning(
        //                 NOTIFICATION_TITLE.warning,
        //                 `Nhân viên [${fullName}] chưa được HR duyệt, BGD không thể duyệt / hủy duyệt.`
        //             );
        //             return;
        //         }

        //         if (!isApproved && !isApprovedBGD) {
        //             this.notification.warning(
        //                 NOTIFICATION_TITLE.warning,
        //                 `Nhân viên [${fullName}] chưa được BGĐ duyệt, không thể hủy duyệt.`
        //             );
        //             return;
        //         }
        //     }

        // }

        const confirmMessage = `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: confirmMessage,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const items: ApproveItemParam[] = selectedRows
                    .filter(row => {
                        // if (type === 'BGD') {
                        //     const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
                        //     // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                        //     const convertedBGD = this.convertIsApprovedBGD(row.IsApprovedBGD);
                        //     const isApprovedBGD = convertedBGD === true;

                        //     if (!isApprovedHR) {
                        //         return false;
                        //     }

                        //     if (!isApproved && !isApprovedBGD) {
                        //         return false;
                        //     }
                        // }
                        return true;
                    })
                    .map(row => {
                        return {
                            Id: row.ID ? Number(row.ID) : null,
                            TableName: row.TableName ? String(row.TableName) : '',
                            FieldName: type === 'BGD' ? 'IsApprovedBGD' : (row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : ''),
                            FullName: row.FullName ? String(row.FullName) : '',
                            DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                            IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                            IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                            IsApprovedTP: type === 'TBP' ? isApproved : (row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null),
                            IsApprovedBGD: type === 'BGD' ? isApproved : this.convertIsApprovedBGD(row.IsApprovedBGD),
                            IsSeniorApproved: type === 'Senior' ? isApproved : (row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null),
                            ValueUpdatedDate: new Date().toISOString(),
                            ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
                            EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                            EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                            TType: row.TType !== undefined ? Number(row.TType) : null,
                            ApprovedSeniorID: type === 'Senior' ? (this.currentUser?.EmployeeID || null) : null
                        };
                    });

                const request: ApproveRequestParam = {
                    Items: items,
                    IsApproved: isApproved
                };

                let apiCall;
                if (type === 'TBP') {
                    apiCall = this.approveTpService.approveTBP(request);
                } else if (type === 'BGD') {
                    apiCall = this.approveTpService.approveBGD(request);
                } else {
                    apiCall = this.approveTpService.approveSenior(request);
                }

                apiCall.subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, response?.message || `Đã ${actionText} thành công!`);
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
                        }
                    },
                    error: (error) => {
                        this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi ${actionText}: ${error.message}`);
                    }
                });
            }
        });
    }

    declineApprove() {
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        // Validate selected rows
        for (const row of selectedRows) {
            const id = row.ID ? Number(row.ID) : 0;
            if (id <= 0) {
                continue;
            }

            const fullName = row.FullName ? String(row.FullName) : '';
            const table = row.TypeText ? String(row.TypeText) : '';
            const isApprovedTP = row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : false;
            const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : 0;
            const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;

            if (isApprovedTP) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Nhân viên [${fullName}] đã được duyệt.\nVui lòng huỷ duyệt trước!`
                );
                return;
            }

            if (isCancelRegister > 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Nhân viên [${fullName}] đã đăng ký huỷ!`
                );
                return;
            }

            if (deleteFlag) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Nhân viên [${fullName}] đã xoá đăng ký [${table}]!`
                );
                return;
            }
        }

        // Show modal to enter decline reason
        this.showDeclineReasonModal(selectedRows);
    }

    private showDeclineReasonModal(selectedRows: any[]) {
        const modalRef = this.modal.create({
            nzContent: ReasonDeclineModalComponent,
            nzWidth: 600,
            nzFooter: null,
            nzMaskClosable: false,
            nzClosable: false,
            nzCentered: true,
            nzBodyStyle: { padding: '0' }
        });

        // Pass data to modal
        const instance = modalRef.getContentComponent();
        instance.selectedRows = selectedRows;
        instance.modalTitle = 'Lý do không duyệt';
        instance.labelText = 'Lý do không duyệt';
        instance.placeholderText = 'Nhập lý do không duyệt...';

        // Handle modal result
        modalRef.afterClose.subscribe((result: any) => {
            if (result && result.confirmed && result.reason) {
                this.processDeclineApprove(selectedRows, result.reason);
            }
        });
    }

    private processDeclineApprove(selectedRows: any[], declineReason: string) {
        const items: ApproveItemParam[] = selectedRows
            .filter(row => {
                const id = row.ID ? Number(row.ID) : 0;
                return id > 0;
            })
            .map(row => {
                const tableName = row.TableName ? String(row.TableName) : '';
                // FieldName là IsApprovedTP để backend set @Value = false
                const fieldName = tableName === 'EmployeeNighShift' ? 'IsApprovedTBP' : 'IsApprovedTP';

                const item: ApproveItemParam = {
                    Id: row.ID ? Number(row.ID) : null,
                    TableName: tableName,
                    FieldName: fieldName,
                    FullName: row.FullName ? String(row.FullName) : '',
                    DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                    IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                    IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                    IsApprovedTP: false, // Decline = false
                    // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                    IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                    IsSeniorApproved: row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null,
                    ValueUpdatedDate: new Date().toISOString(),
                    ValueDecilineApprove: '2', // 2 = Không đồng ý duyệt (set vào DecilineApprove column - int)
                    DecilineApprove: 2, // Thêm field này theo yêu cầu
                    EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                    EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                    TType: row.TType !== undefined ? Number(row.TType) : null,
                    ReasonDeciline: declineReason // Lý do không duyệt (set vào ReasonDeciline column - text)
                };
                return item;
            });

        const request: ApproveRequestParam = {
            Items: items,
            IsApproved: false
        };

        this.approveTpService.unApproveTBP(request).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    const notProcessed = response.data || [];
                    if (notProcessed.length > 0) {
                        const reasons = notProcessed.map((item: any) =>
                            `${item.Item?.FullName || 'N/A'}: ${item.Reason || 'Không xác định'}`
                        ).join('\n');

                        this.notification.warning(
                            NOTIFICATION_TITLE.warning,
                            `Đã không duyệt thành công, nhưng có ${notProcessed.length} bản ghi không được xử lý:\n${reasons}`
                        );
                    } else {
                        this.notification.success(NOTIFICATION_TITLE.success, response?.message || 'Đã không duyệt thành công!');
                    }
                    this.loadData();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi không duyệt!');
                }
            },
            error: (error) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi không duyệt');
            }
        });
    }

    approvedCancelRegister() {
        const selectedRows = this.getSelectedRows();

        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
            return;
        }

        for (const row of selectedRows) {
            const id = row.ID ? Number(row.ID) : 0;
            if (id <= 0) {
                continue;
            }

            const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;
            if (deleteFlag) {
                const fullname = row.FullName ? String(row.FullName) : '';
                const table = row.TypeText ? String(row.TypeText) : '';
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Bạn không thể Duyệt huỷ đăng ký vì nhân viên ${fullname} đã tự xoá khai báo [${table}]!`
                );
                return;
            }

            const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : -1;
            if (isCancelRegister < 0) {
                const fullname = row.FullName ? String(row.FullName) : '';
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Bạn không thể duyệt đăng ký hủy vì nhân viên ${fullname} chưa đăng ký hủy!`
                );
                return;
            }
        }

        let confirmContent = '';
        if (selectedRows.length === 1) {
            const name = selectedRows[0].FullName ? String(selectedRows[0].FullName) : '';
            confirmContent = `Bạn có chắc muốn không duyệt cho nhân viên [${name}] hay không!`;
        } else {
            confirmContent = `Bạn có chắc muốn không duyệt cho những nhân viên này hay không!`;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: confirmContent,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const items: ApproveItemParam[] = selectedRows
                    .filter(row => {
                        const id = row.ID ? Number(row.ID) : 0;
                        return id > 0;
                    })
                    .map(row => ({
                        Id: row.ID ? Number(row.ID) : null,
                        TableName: row.TableName ? String(row.TableName) : '',
                        FieldName: 'IsCancelTP',
                        FullName: row.FullName ? String(row.FullName) : '',
                        DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                        IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                        IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                        IsApprovedTP: true,
                        // Fix: Use convertIsApprovedBGD to correctly handle -1, 0, 1 values
                        IsApprovedBGD: this.convertIsApprovedBGD(row.IsApprovedBGD),
                        IsSeniorApproved: row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null,
                        ValueUpdatedDate: new Date().toISOString(),
                        ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
                        EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                        EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
                        TType: row.TType !== undefined ? Number(row.TType) : null
                    }));

                const request: ApproveRequestParam = {
                    Items: items,
                    IsApproved: true
                };

                this.approveTpService.approveTBP(request).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, response?.message || 'Đã duyệt hủy đăng ký thành công!');
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi duyệt hủy đăng ký!');
                        }
                    },
                    error: (error) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || '';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage || 'Lỗi khi duyệt hủy đăng ký');
                    }
                });
            }
        });
    }

    downloadFile(rowData: any) {
        const filePath = rowData?.FilePath || '';
        const fileName = rowData?.FileName || 'file';

        if (!filePath) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy đường dẫn file!'
            );
            return;
        }

        if (!fileName) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có file để tải!');
            return;
        }

        try {
            const cleanFileName = fileName.split(';')[0].trim();

            const softwareIndex = filePath.toLowerCase().indexOf('software');
            let pathToUse = filePath;

            if (softwareIndex !== -1) {
                pathToUse = filePath.substring(softwareIndex);
            } else {
                const cleanPath = filePath.replace(/^\\+/, '');
                const lowerClean = cleanPath.toLowerCase();

                if (lowerClean.startsWith('lamthem')) {
                    pathToUse = `software\\Test\\${cleanPath}`;
                } else {
                    pathToUse = `software\\${cleanPath}`;
                }
            }

            let normalizedPath = pathToUse.replace(/\\/g, '/');
            normalizedPath = normalizedPath.replace(/\+(?=\w)/g, '/');
            if (normalizedPath.startsWith('/')) {
                normalizedPath = normalizedPath.substring(1);
            }

            const lowerPath = normalizedPath.toLowerCase();
            if (!lowerPath.startsWith('software/')) {
                normalizedPath = 'software/' + normalizedPath;
            } else {
                normalizedPath = normalizedPath.replace(/^software\//i, 'software/');
            }

            const withSoftwareLower = normalizedPath.toLowerCase();
            const needsTestPrefix =
                withSoftwareLower.startsWith('software/lamthem/') || withSoftwareLower === 'software/lamthem';
            const hasTestPrefix =
                withSoftwareLower.startsWith('software/test/') || withSoftwareLower.startsWith('software\\test\\');
            if (needsTestPrefix && !hasTestPrefix) {
                normalizedPath = normalizedPath.replace(/^software\//i, 'software/Test/');
            }

            normalizedPath = normalizedPath.replace(/\/+$/, '');

            const pathLower = normalizedPath.toLowerCase();
            const fileNameLower = cleanFileName.toLowerCase();
            const pathEndsWithFileName = pathLower.endsWith('/' + fileNameLower) || pathLower.endsWith(fileNameLower);

            if (!pathEndsWithFileName) {
                normalizedPath = normalizedPath + '/' + cleanFileName;
            }

            normalizedPath = normalizedPath.replace(/\/+/g, '/').replace(/^\/+/, '');

            const pathParts = normalizedPath.split('/');
            const encodedParts = pathParts.map((part: string) => {
                try {
                    const decoded = decodeURIComponent(part);
                    return encodeURIComponent(decoded);
                } catch {
                    return encodeURIComponent(part);
                }
            });
            const encodedPath = encodedParts.join('/');

            const url = `${environment.host}api/share/${encodedPath}`;

            window.open(url, '_blank');
            this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đang tải file: ${cleanFileName}`
            );
        } catch (error: any) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Lỗi khi tải file: ' + (error?.message || '')
            );
        }
    }


    /**
     * Convert IsApprovedBGD value to boolean | null for backend API
     * -1 (chưa duyệt) -> null
     * 0, false -> false
     * 1, true -> true
     * undefined, null -> null
     */
    private convertIsApprovedBGD(value: any): boolean | null {
        if (value === undefined || value === null) {
            return null;
        }

        // Nếu là boolean, trả về trực tiếp
        if (typeof value === 'boolean') {
            return value;
        }

        // Convert sang number để kiểm tra
        const numValue = Number(value);

        // Nếu là -1 (chưa duyệt), trả về null
        if (numValue === -1) {
            return null;
        }

        // 0 -> false, 1 -> true, các giá trị khác -> true
        if (numValue === 0) {
            return false;
        }

        return numValue === 1 ? true : Boolean(value);
    }

    private formatApprovalBadge(status: number): string {
        const numStatus = status === null || status === undefined ? 0 : Number(status);

        switch (numStatus) {
            case -1:
                return '';
            case 0:
                return '<span class="fw-semibold text-warning">Chờ duyệt</span>';
            case 1:
                return '<span class="fw-semibold text-success">Đã duyệt</span>';
            case 2:
                return '<span class="fw-semibold text-danger">Không đồng ý duyệt</span>';
            case 3:
                return '<span class="fw-semibold text-warning">Chờ duyệt hủy đăng ký</span>';
            case 4:
                return '<span class="fw-semibold text-success">Đã duyệt hủy đăng ký</span>';
            default:
                return '<span class="fw-semibold text-secondary">Không xác định</span>';
        }
    }
}

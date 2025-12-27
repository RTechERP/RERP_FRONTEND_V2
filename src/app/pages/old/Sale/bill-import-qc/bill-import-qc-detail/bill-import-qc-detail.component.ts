import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  input,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
} from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  OnEventArgs,
  OperatorType,
  SortDirectionNumber,
} from '@slickgrid-universal/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { AppUserService } from '../../../../../services/app-user.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportQcService } from '../bill-import-qc-service/bill-import-qc-service.service';
import { BillImportQcFileComponent } from '../bill-import-qc-file/bill-import-qc-file.component';
import { NzSpinComponent } from 'ng-zorro-antd/spin';

class GroupSelectEditor {
  private args: any;
  private wrapperElm!: HTMLDivElement;
  private inputElm!: HTMLInputElement;
  private dropdownElm!: HTMLDivElement;
  private defaultValue: string = '';
  private selectedValue: string = '';
  private collection: Array<any> = [];
  private flatCollection: Array<{
    group?: string;
    value: string;
    label: string;
  }> = [];
  private visibleOptions: Array<{
    value: string;
    label: string;
    group?: string;
  }> = [];
  private activeIndex = -1;

  private inputDebounceTimer: any;
  private readonly maxOptionsWithoutSearch = 200;
  private readonly maxOptionsWithSearch = 500;

  private handleOutsideMouseDown!: (e: Event) => void;
  private handleReposition!: () => void;

  constructor(args: any) {
    this.args = args;
    this.init();
  }

  init() {
    const editor = this.args?.column?.editor ?? {};
    this.collection = editor.collection ?? [];
    this.flatCollection = this.getFlattenedCollection();

    this.wrapperElm = document.createElement('div');
    this.wrapperElm.style.width = '100%';
    this.wrapperElm.style.height = '100%';

    this.inputElm = document.createElement('input');
    this.inputElm.type = 'text';
    this.inputElm.placeholder = 'Tìm...';
    this.inputElm.style.width = '100%';
    this.inputElm.style.height = '100%';
    this.inputElm.style.boxSizing = 'border-box';
    this.inputElm.style.padding = '2px 6px';
    this.inputElm.style.fontSize = '12px';

    this.wrapperElm.appendChild(this.inputElm);
    this.args.container.appendChild(this.wrapperElm);

    this.dropdownElm = document.createElement('div');
    this.dropdownElm.style.position = 'fixed';
    this.dropdownElm.style.zIndex = '99999';
    this.dropdownElm.style.background = '#fff';
    this.dropdownElm.style.border = '1px solid #d9d9d9';
    this.dropdownElm.style.borderRadius = '4px';
    this.dropdownElm.style.boxShadow = '0 6px 16px rgba(0,0,0,.08)';
    this.dropdownElm.style.maxHeight = '260px';
    this.dropdownElm.style.overflow = 'auto';
    this.dropdownElm.style.display = 'none';
    document.body.appendChild(this.dropdownElm);

    this.inputElm.addEventListener('input', () => {
      if (this.inputDebounceTimer) {
        clearTimeout(this.inputDebounceTimer);
      }
      this.inputDebounceTimer = setTimeout(() => {
        this.activeIndex = -1;
        this.buildDropdown(this.inputElm.value);
        this.openDropdown();
      }, 120);
    });

    this.inputElm.addEventListener('focus', () => {
      this.activeIndex = -1;
      this.buildDropdown(this.inputElm.value);
      this.openDropdown();
    });

    this.inputElm.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        this.moveActive(1);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp') {
        this.moveActive(-1);
        e.preventDefault();
        return;
      }

      if (e.key === 'Enter') {
        this.selectActiveOrCommit();
        e.preventDefault();
      }
    });

    this.dropdownElm.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    this.handleOutsideMouseDown = (e: Event) => {
      const target = e.target as Node;
      if (
        this.wrapperElm?.contains(target) ||
        this.dropdownElm?.contains(target)
      )
        return;
      this.closeDropdown();
    };

    this.handleReposition = () => {
      if (this.dropdownElm?.style.display !== 'none') {
        this.repositionDropdown();
      }
    };

    document.addEventListener('mousedown', this.handleOutsideMouseDown, true);
    window.addEventListener('scroll', this.handleReposition, true);
    window.addEventListener('resize', this.handleReposition, true);

    this.buildDropdown('');
    this.openDropdown();
    this.inputElm.focus();
  }

  private openDropdown() {
    this.repositionDropdown();
    this.dropdownElm.style.display = 'block';
  }

  private closeDropdown() {
    if (this.dropdownElm) {
      this.dropdownElm.style.display = 'none';
    }
  }

  private repositionDropdown() {
    const rect = this.wrapperElm.getBoundingClientRect();
    this.dropdownElm.style.left = `${rect.left}px`;
    this.dropdownElm.style.top = `${rect.bottom}px`;
    this.dropdownElm.style.width = `${rect.width}px`;
  }

  private commit() {
    const grid = this.args?.grid;
    const lock = grid?.getEditorLock?.();
    lock?.commitCurrentEdit?.();
  }

  private getFlattenedCollection(): Array<{
    group?: string;
    value: string;
    label: string;
  }> {
    const out: Array<{ group?: string; value: string; label: string }> = [];
    const editor = this.args?.column?.editor ?? {};
    const addBlankEntry = editor?.collectionOptions?.addBlankEntry !== false;

    if (addBlankEntry) {
      out.push({ value: '', label: '' });
    }

    for (const item of this.collection) {
      if (item?.options?.length) {
        for (const opt of item.options) {
          out.push({
            group: item.label ?? '',
            value: String(opt.value ?? ''),
            label: String(opt.label ?? ''),
          });
        }
      } else {
        out.push({
          value: String(item.value ?? ''),
          label: String(item.label ?? ''),
        });
      }
    }
    return out;
  }

  private buildDropdown(searchTerm: string) {
    const term = (searchTerm ?? '').trim().toLowerCase();
    const currentValue = String(this.selectedValue ?? '');
    const all = this.flatCollection?.length
      ? this.flatCollection
      : this.getFlattenedCollection();

    let filtered: Array<{ group?: string; value: string; label: string }> = [];
    if (!term) {
      const current = all.find((x) => String(x.value ?? '') === currentValue);
      const first = all
        .filter((x) => String(x.value ?? '') !== currentValue)
        .slice(0, this.maxOptionsWithoutSearch);
      filtered = [...(current ? [current] : []), ...first];
    } else {
      filtered = all
        .filter((x) => {
          if (String(x.value ?? '') === currentValue) return true;
          const label = String(x.label ?? '').toLowerCase();
          const value = String(x.value ?? '').toLowerCase();
          return label.includes(term) || value.includes(term);
        })
        .slice(0, this.maxOptionsWithSearch);
    }

    this.visibleOptions = filtered;

    const root = document.createElement('div');
    root.style.padding = '4px 0';

    const grouped = new Map<string, Array<{ value: string; label: string }>>();
    const noGroup: Array<{ value: string; label: string }> = [];
    const hasGroup = filtered.some((x) => !!x.group);

    for (const x of filtered) {
      const item = { value: x.value, label: x.label };
      if (hasGroup && x.group) {
        if (!grouped.has(x.group)) grouped.set(x.group, []);
        grouped.get(x.group)!.push(item);
      } else {
        noGroup.push(item);
      }
    }

    const appendOption = (
      opt: { value: string; label: string },
      optIndex: number
    ) => {
      const row = document.createElement('div');
      row.setAttribute('data-idx', String(optIndex));
      row.style.padding = '6px 10px';
      row.style.cursor = 'pointer';
      row.style.userSelect = 'none';
      row.style.whiteSpace = 'nowrap';
      row.style.overflow = 'hidden';
      row.style.textOverflow = 'ellipsis';
      row.textContent = opt.label;

      if (opt.value === currentValue) {
        row.style.background = '#e6f4ff';
      }
      if (optIndex === this.activeIndex) {
        row.style.background = '#f5f5f5';
      }

      row.addEventListener('click', () => {
        this.selectValue(opt.value);
      });

      root.appendChild(row);
    };

    let optIndex = 0;
    for (const opt of noGroup) {
      appendOption(opt, optIndex);
      optIndex++;
    }

    if (hasGroup) {
      for (const [groupLabel, items] of grouped.entries()) {
        const header = document.createElement('div');
        header.style.padding = '6px 10px';
        header.style.fontWeight = '600';
        header.style.color = '#000';
        header.style.fontSize = '14px';
        header.textContent = groupLabel;
        root.appendChild(header);

        for (const opt of items) {
          appendOption(opt, optIndex);
          optIndex++;
        }
      }
    }

    this.dropdownElm.innerHTML = '';
    this.dropdownElm.appendChild(root);
  }

  private moveActive(delta: number) {
    const count = this.visibleOptions?.length ?? 0;
    if (count <= 0) return;
    const next = Math.max(0, Math.min(count - 1, this.activeIndex + delta));
    this.activeIndex = next;
    this.buildDropdown(this.inputElm.value);

    const active = this.dropdownElm.querySelector(
      `[data-idx="${this.activeIndex}"]`
    ) as HTMLDivElement | null;
    active?.scrollIntoView({ block: 'nearest' });
  }

  private selectActiveOrCommit() {
    if (
      this.activeIndex >= 0 &&
      this.activeIndex < (this.visibleOptions?.length ?? 0)
    ) {
      this.selectValue(this.visibleOptions[this.activeIndex].value);
      return;
    }
    this.commit();
  }

  private selectValue(val: string) {
    this.selectedValue = String(val ?? '');
    const flat = this.flatCollection?.length
      ? this.flatCollection
      : this.getFlattenedCollection();
    const found = flat.find(
      (x) => String(x.value ?? '') === this.selectedValue
    );
    this.inputElm.value = found?.label ?? '';
    this.closeDropdown();
    this.commit();
  }

  destroy() {
    document.removeEventListener(
      'mousedown',
      this.handleOutsideMouseDown,
      true
    );
    window.removeEventListener('scroll', this.handleReposition, true);
    window.removeEventListener('resize', this.handleReposition, true);
    this.dropdownElm?.remove();
    this.wrapperElm?.remove();
  }

  focus() {
    this.inputElm?.focus();
  }

  loadValue(item: any) {
    this.defaultValue = String(item?.[this.args.column.field] ?? '');
    this.selectedValue = this.defaultValue;
    const flat = this.flatCollection?.length
      ? this.flatCollection
      : this.getFlattenedCollection();
    const found = flat.find(
      (x) => String(x.value ?? '') === this.selectedValue
    );
    this.inputElm.value = found?.label ?? '';
    this.buildDropdown('');
    this.openDropdown();
  }

  serializeValue() {
    return this.selectedValue ?? '';
  }

  applyValue(item: any, state: any) {
    item[this.args.column.field] = state;
  }

  isValueChanged() {
    return String(this.selectedValue ?? '') !== String(this.defaultValue ?? '');
  }

  validate() {
    return { valid: true, msg: null };
  }
}

@Component({
  selector: 'app-bill-import-qc-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzCheckboxModule,
    NzTabsModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    HasPermissionDirective,
    NzSplitterModule,
    AngularSlickgridModule,
    NzSpinComponent,
  ],
  templateUrl: './bill-import-qc-detail.component.html',
  styleUrl: './bill-import-qc-detail.component.css',
})
export class BillImportQcDetailComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  //#region Khai báo
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private billImportQcService: BillImportQcService
  ) {}

  dateRequest: Date = new Date();
  deadline: Date = new Date();
  requestCode: string = '';
  @Input() billImportQCMaster: any = [];
  @Input() isCheckBillQC: boolean = false;
  @Input() isAddNewToBillImport: boolean = false;
  isDisabledEmployeeRequest: boolean = false;
  isDisabledDateRequest: boolean = false;
  isDisabledDeadline: boolean = false;
  isDisabledSaveButton: boolean = false;
  employeeRequestId: any = 0;
  employeeRequests: any = [];
  employeeRequestsGrid: any = [];
  leadersGrid: any = [];
  projectsGrid: any = [];
  productSaleGrid: any = [];

  isLoading: boolean = false;

  ddosGroupCollection: Array<{
    label: string;
    options: Array<{ value: string; label: string }>;
  }> = [
    {
      label: 'Nhóm 1',
      options: [
        { value: 'ddos_1', label: 'DDOS 1' },
        { value: 'ddos_2', label: 'DDOS 2' },
      ],
    },
    {
      label: 'Nhóm 2',
      options: [
        { value: 'ddos_3', label: 'DDOS 3' },
        { value: 'ddos_4', label: 'DDOS 4' },
      ],
    },
  ];

  angularGridMaster!: AngularGridInstance;
  angularGridFileCheck!: AngularGridInstance;
  angularGridFileReport!: AngularGridInstance;

  columnDefinitionsMaster: Column[] = [];
  columnDefinitionsFileCheck: Column[] = [];
  columnDefinitionsFileReport: Column[] = [];

  gridOptionsMaster: GridOption = {};
  gridOptionsFileCheck: GridOption = {};
  gridOptionsFileReport: GridOption = {};

  dataMaster: any[] = [];
  // dataset gốc để áp lọc DDOS (dataMaster là view đang hiển thị)
  dataMasterAll: any[] = [];

  dataFileCheck: any[] = [];
  fileCheckDelete: any[] = [];

  dataFileReport: any[] = [];
  fileReportDelete: any[] = [];

  // Cache file theo ID để tránh bị ghi đè khi gọi API
  fileCheckCache: Record<number, any[]> = {};
  fileCheckDeleteCache: Record<number, any[]> = {};
  fileReportCache: Record<number, any[]> = {};
  fileReportDeleteCache: Record<number, any[]> = {};
  currentRowId: number = 0;
  masterDeleteIds: number[] = [];

  private headerFilterAppliedMap: Record<string, string[]> = {};
  private masterAllInitialized = false;

  //#endregion

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    this.isDisabledEmployeeRequest = !this.appUserService.isAdmin;
    this.loadLookupData();
    this.initGridColumns();
    this.initGridOptions();
    this.applyCheckBillQCLogic();
  }

  applyCheckBillQCLogic(): void {
    if (this.isCheckBillQC) {
      // Disable các controls
      this.isDisabledDateRequest = true;
      this.isDisabledDeadline = true;
      this.isDisabledSaveButton = true;

      // Set grid readonly
      if (this.gridOptionsMaster) {
        this.gridOptionsMaster.editable = false;
        this.gridOptionsMaster.autoEdit = false;
      }
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  loadLookupData() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeRequestsGrid = this.buildEmployeeGroupCollection(
          response.data
        );

        console.log(this.employeeRequestsGrid);
        this.employeeRequests = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );

        this.initGridColumns();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + (error.message || error)
        );
      },
    });

    this.billImportQcService.getLeaders().subscribe({
      next: (response: any) => {
        this.leadersGrid = this.buildLeaderGroupCollection(response.data);
        this.initGridColumns();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách lãnh đạo: ' + (error.message || error)
        );
      },
    });

    this.billImportQcService.getProjects().subscribe({
      next: (response: any) => {
        this.projectsGrid = this.buildProjectCollection(response.data);
        this.initGridColumns();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách dự án: ' + (error.message || error)
        );
      },
    });

    this.billImportQcService.getProductSale().subscribe({
      next: (response: any) => {
        this.productSaleGrid = this.buildProductCollection(response.data);
        this.initGridColumns();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách sản phẩm: ' + (error.message || error)
        );
      },
    });

    if (this.billImportQCMaster && this.billImportQCMaster.ID > 0) {
      this.requestCode = this.billImportQCMaster.RequestImportCode;
      this.employeeRequestId = this.billImportQCMaster.EmployeeRequestID;
      this.dateRequest = this.billImportQCMaster.RequestDateQC;
      this.deadline = this.billImportQCMaster.Dealine;

      this.billImportQcService
        .getDataDetail(this.billImportQCMaster.ID)
        .subscribe({
          next: (response: any) => {
            const rows = (response?.data || []).map((x: any, i: number) => ({
              ...x,
              STT: x?.STT ?? i + 1,
            }));

            this.dataMasterAll = rows;
            this.masterAllInitialized = true;
            this.applyHeaderFiltersToView();

            setTimeout(() => {
              if (this.angularGridMaster?.dataView) {
                this.angularGridMaster.dataView.setItems(this.dataMaster);
                this.angularGridMaster.slickGrid?.invalidate();
                this.angularGridMaster.slickGrid?.render();
                setTimeout(() => {
                  this.updateMasterFooter();
                }, 1000);
              }
            }, 0);
          },
          error: (error: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi tải danh sách phiếu nhập: ' + (error.message || error)
            );
          },
        });
    } else {
      this.employeeRequestId = this.appUserService.employeeID;
      this.dateRequest = new Date();
      this.deadline = new Date();

      this.billImportQcService.getBillNumber().subscribe({
        next: (response: any) => {
          this.requestCode = response.data;
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải số phiếu: ' + (error.message || error)
          );
        },
      });
    }
  }

  buildEmployeeGroupCollection(employeeRequests: any[]) {
    const map = new Map<string, Array<{ value: string; label: string }>>();

    employeeRequests.forEach((e) => {
      const dept = e.DepartmentName ?? 'Khác';

      if (!map.has(dept)) {
        map.set(dept, []);
      }

      map.get(dept)!.push({
        value: e.EmployeeID,
        label: `${e.Code} - ${e.FullName}`,
      });
    });

    return Array.from(map.entries()).map(([label, options]) => ({
      label,
      options,
    }));
  }

  buildLeaderGroupCollection(leaders: any[]) {
    const map = new Map<string, Array<{ value: string; label: string }>>();

    leaders.forEach((l) => {
      const dept = l.DepartmentName ?? 'Khác';

      if (!map.has(dept)) {
        map.set(dept, []);
      }

      map.get(dept)!.push({
        value: l.EmployeeID,
        label: `${l.Code} - ${l.FullName}`,
      });
    });

    return Array.from(map.entries()).map(([label, options]) => ({
      label,
      options,
    }));
  }

  buildProjectCollection(projects: any[]) {
    return projects.map((p) => ({
      value: p.ID,
      label: `${p.ProjectCode}`,
      projectName: p.ProjectName,
    }));
  }

  buildProductCollection(products: any[]) {
    return products.map((p) => ({
      value: p.ID,
      label: `${p.ProductCode}`,
      productName: p.ProductName,
    }));
  }

  //#endregion

  //#region Hàm xử lý bảng
  LoadFileDataDetail(deptID: number) {
    this.billImportQcService.getFiles(deptID).subscribe({
      next: (response: any) => {
        const checkFiles = (response?.data.FileCheckSheets || []).map(
          (x: any, i: number) => ({
            ...x,
            STT: x?.STT ?? i + 1,
          })
        );

        const reportFiles = (response?.data.FileTestReports || []).map(
          (x: any, i: number) => ({
            ...x,
            STT: x?.STT ?? i + 1,
          })
        );

        // Chỉ cập nhật cache cho cột chưa có cache
        if (
          !this.fileCheckCache[deptID] ||
          this.fileCheckCache[deptID].length === 0
        ) {
          this.fileCheckCache[deptID] = checkFiles;
          this.fileCheckDeleteCache[deptID] = [];
          this.dataFileCheck = checkFiles;
          this.fileCheckDelete = [];
        }

        if (
          !this.fileReportCache[deptID] ||
          this.fileReportCache[deptID].length === 0
        ) {
          this.fileReportCache[deptID] = reportFiles;
          this.fileReportDeleteCache[deptID] = [];
          this.dataFileReport = reportFiles;
          this.fileReportDelete = [];
        }

        // Force refresh grid (tránh trường hợp dataset có nhưng view không render)
        setTimeout(() => {
          if (this.angularGridFileCheck?.dataView) {
            this.angularGridFileCheck.dataView.setItems(this.dataFileCheck);
            this.angularGridFileCheck.slickGrid?.invalidate();
            this.angularGridFileCheck.slickGrid?.render();
          }

          if (this.angularGridFileReport?.dataView) {
            this.angularGridFileReport.dataView.setItems(this.dataFileReport);
            this.angularGridFileReport.slickGrid?.invalidate();
            this.angularGridFileReport.slickGrid?.render();
          }
        }, 0);
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (error.message || error)
        );
      },
    });
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    // Subscribe vào event onBeforeEditCell để kiểm tra quyền
    angularGrid.slickGrid.onBeforeEditCell.subscribe((_e: any, args: any) => {
      const columnDef = angularGrid.slickGrid.getColumns()[args.cell];
      const item = args.item;
      const fieldName = columnDef.field;

      // Admin không có employeeID thì cho phép
      if (
        this.appUserService.isAdmin &&
        Number(this.appUserService.employeeID) <= 0
      ) {
        return true;
      }

      const currentEmployeeID = Number(this.appUserService.employeeID);
      const emRequestID = Number(this.employeeRequestId);

      // Nếu đang edit bản ghi đã có (ID > 0)
      if (this.billImportQCMaster?.ID > 0) {
        // Cột LeaderTechID: chỉ người yêu cầu mới được sửa
        if (fieldName === 'LeaderTechID') {
          if (emRequestID === currentEmployeeID && emRequestID > 0) {
            return true;
          }
          return false;
        }
      }

      // Cột EmployeeTechID: chỉ Leader được sửa
      if (fieldName === 'EmployeeTechID') {
        const leaderID = Number(item.LeaderTechID);
        if (leaderID === currentEmployeeID && leaderID > 0) {
          return true;
        }
        return false;
      }

      // Cột Status: chỉ nhân viên kỹ thuật được sửa
      if (fieldName === 'Status') {
        const emTechID = Number(item.EmployeeTechID);
        if (emTechID === currentEmployeeID && emTechID > 0) {
          return true;
        }
        return false;
      }

      // Cột ProductSaleID hoặc action: người yêu cầu + status phù hợp
      if (fieldName === 'ProductSaleID' || columnDef.id === 'action') {
        const status = Number(item.Status);
        const validStatuses = [0, 3]; // Status = 0 hoặc 3

        if (
          validStatuses.includes(status) &&
          emRequestID === currentEmployeeID &&
          emRequestID > 0
        ) {
          return true;
        }
        return false;
      }

      // Nếu isAddNewToBillImport = true: không cho edit ProductSaleID, action, STT
      if (
        this.isAddNewToBillImport &&
        (fieldName === 'ProductSaleID' ||
          columnDef.id === 'action' ||
          fieldName === 'STT')
      ) {
        return false;
      }

      // Các cột khác: cho phép edit
      return true;
    });

    // Subscribe vào event onCellChange
    angularGrid.slickGrid.onCellChange.subscribe((_e: any, args: any) => {
      const columnDef = angularGrid.slickGrid.getColumns()[args.cell];

      if (columnDef.field === 'ProductSaleID') {
        const selectedProduct = this.productSaleGrid.find(
          (p: any) => p.value === Number(args.item.ProductSaleID)
        );

        if (selectedProduct) {
          args.item.ProductName = selectedProduct.productName || '';
        } else {
          args.item.ProductName = '';
        }

        // Update lại row
        angularGrid.gridService.updateItem(args.item);
      }

      if (
        columnDef.field === 'ProductSaleID' ||
        columnDef.field === 'Quantity'
      ) {
        this.updateMasterFooter();
      }
    });

    angularGrid.slickGrid.onDblClick.subscribe((_e: any, args: any) => {
      const columnDef = angularGrid.slickGrid.getColumns()[args.cell];
      const item = args.grid.getDataItem(args.row);
      if (item?.ID !== undefined && item?.ID !== null) {
        this.currentRowId = item.ID;
      }

      if (columnDef.field === 'CheckSheet') {
        const modalRef = this.modalService.open(BillImportQcFileComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          size: 'lg',
        });
        modalRef.componentInstance.fileName = 'Check Sheet';
        this.fileCheckCache[this.currentRowId] =
          this.fileCheckCache[this.currentRowId] || [];
        this.fileCheckDeleteCache[this.currentRowId] =
          this.fileCheckDeleteCache[this.currentRowId] || [];
        modalRef.componentInstance.fileData = [
          ...this.fileCheckCache[this.currentRowId],
        ];
        modalRef.componentInstance.fileType = 1;

        modalRef.result.then(
          (result) => {
            if (result && result.fileType === 1) {
              this.dataFileCheck = result.fileData;
              this.fileCheckDelete = result.fileDelete;

              // Lưu vào cache theo currentRowId
              this.fileCheckCache[this.currentRowId] = result.fileData;
              this.fileCheckDeleteCache[this.currentRowId] = result.fileDelete;

              // Cập nhật cell value với tên file join lại
              const fileNames = result.fileData
                .map((f: any) => f.FileName)
                .join(', ');
              const rowIndex = this.dataMasterAll.findIndex(
                (x: any) => x.ID === this.currentRowId
              );
              if (rowIndex !== -1) {
                this.dataMasterAll[rowIndex].CheckSheet = fileNames;
                this.angularGridMaster?.gridService?.updateItem(
                  this.dataMasterAll[rowIndex]
                );
              }
            }
          },
          () => {
            // Modal dismissed
          }
        );
      }

      if (columnDef.field === 'Report') {
        const modalRef = this.modalService.open(BillImportQcFileComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          size: 'lg',
        });
        modalRef.componentInstance.fileName = 'Report';
        this.fileReportCache[this.currentRowId] =
          this.fileReportCache[this.currentRowId] || [];
        this.fileReportDeleteCache[this.currentRowId] =
          this.fileReportDeleteCache[this.currentRowId] || [];
        modalRef.componentInstance.fileData = [
          ...this.fileReportCache[this.currentRowId],
        ];
        modalRef.componentInstance.fileType = 2;

        modalRef.result.then(
          (result) => {
            if (result && result.fileType === 2) {
              this.dataFileReport = result.fileData;
              this.fileReportDelete = result.fileDelete;

              // Lưu vào cache theo currentRowId
              this.fileReportCache[this.currentRowId] = result.fileData;
              this.fileReportDeleteCache[this.currentRowId] = result.fileDelete;

              // Cập nhật cell value với tên file join lại
              const fileNames = result.fileData
                .map((f: any) => f.FileName)
                .join(', ');
              const rowIndex = this.dataMasterAll.findIndex(
                (x: any) => x.ID === this.currentRowId
              );
              if (rowIndex !== -1) {
                this.dataMasterAll[rowIndex].Report = fileNames;
                this.angularGridMaster?.gridService?.updateItem(
                  this.dataMasterAll[rowIndex]
                );
              }
            }
          },
          () => {
            // Modal dismissed
          }
        );
      }
    });

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooter();
    }, 100);
  }

  private updateMasterFooter(): void {
    const grid = this.angularGridMaster?.slickGrid;
    if (!grid) return;

    const rows = this.dataMaster || this.dataMasterAll;
    const countProduct = rows.filter(
      (x: any) => Number(x?.ProductSaleID || 0) > 0
    ).length;

    const sumQty = rows.reduce(
      (acc: number, x: any) => acc + (Number(x?.Quantity) || 0),
      0
    );

    const formattedQty = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(sumQty);

    const footerData: any = {
      ProductSaleID: `<div style="text-align:right; font-weight:600;">${countProduct}</div>`,
      Quantity: `<div style="text-align:right; font-weight:600;">${formattedQty}</div>`,
    };

    const columns = grid.getColumns();
    columns.forEach((col: any) => {
      if (footerData[col.id] !== undefined) {
        const footerElm = grid.getFooterRowColumn(col.id);
        if (footerElm) {
          footerElm.innerHTML = footerData[col.id];
        }
      }
    });
  }

  onGridMasterHeaderClick(e: Event, args: any) {
    if (this.isCheckBillQC) return;

    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-plus')) {
        this.addNewRow();
      }
    }
  }

  onGridMasterClick(e: Event, args: OnClickEventArgs) {
    if (this.isCheckBillQC) return;
    if (
      this.appUserService.isAdmin &&
      Number(this.appUserService.employeeID) <= 0
    )
      return;

    const column = args.grid.getColumns()[args.cell];

    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-trash')) {
        const item = args.grid.getDataItem(args.row);

        this.modal.confirm({
          nzTitle: 'Xác nhận xóa',
          nzContent: `Bạn có chắc chắn muốn xóa sản phẩm ${item.STT} không?`,
          nzOnOk: () => {
            this.deleteRow(item);
          },
        });
      }
    }

    if (args.cell !== 0) {
      const item = args.grid.getDataItem(args.row);
      if (item?.ID === undefined || item?.ID === null) return;

      this.currentRowId = item.ID;

      const hasCheckCache = !!this.fileCheckCache[this.currentRowId];
      const hasReportCache = !!this.fileReportCache[this.currentRowId];

      // Load từ cache nếu có
      if (hasCheckCache) {
        this.dataFileCheck = this.fileCheckCache[this.currentRowId];
        this.fileCheckDelete =
          this.fileCheckDeleteCache[this.currentRowId] || [];
      } else {
        this.dataFileCheck = [];
        this.fileCheckDelete = [];
        this.fileCheckCache[this.currentRowId] = [];
        this.fileCheckDeleteCache[this.currentRowId] = [];
      }

      if (hasReportCache) {
        this.dataFileReport = this.fileReportCache[this.currentRowId];
        this.fileReportDelete =
          this.fileReportDeleteCache[this.currentRowId] || [];
      } else {
        this.dataFileReport = [];
        this.fileReportDelete = [];
        this.fileReportCache[this.currentRowId] = [];
        this.fileReportDeleteCache[this.currentRowId] = [];
      }

      // Chỉ gọi API nếu dòng đã có ID DB
      if (this.currentRowId > 0 && (!hasCheckCache || !hasReportCache)) {
        this.LoadFileDataDetail(this.currentRowId);
      }
    }
  }

  addNewRow() {
    const newId =
      this.dataMasterAll.length > 0
        ? Math.max(...this.dataMasterAll.map((x) => x.id || 0)) + 1
        : 1;

    const newRow = {
      id: newId,
      ID: -newId,
      STT: this.dataMasterAll.length + 1,
      ProductCode: '',
      ProductName: '',
      ProductSaleID: 0,
      Quantity: 0,
      LeaderTechID: 0,
      LeaderFullName: '',
      EmTechFullName: '',
      StatusText: '',
      ProjectCode: '',
      ProjectName: '',
      POKHCode: '',
      BillCode: '',
      Note: '',
      CheckSheet: '',
      Report: '',
    };

    this.dataMasterAll = [...this.dataMasterAll, newRow];
    this.applyHeaderFiltersToView();

    setTimeout(() => {
      this.updateMasterFooter();
    }, 0);
  }

  deleteRow(item: any) {
    const rowId = item?.ID;

    if (rowId !== undefined && rowId !== null) {
      if (rowId > 0) {
        const checkFiles = this.fileCheckCache[rowId] || [];
        const reportFiles = this.fileReportCache[rowId] || [];

        const checkDeleteIds = this.fileCheckDeleteCache[rowId] || [];
        checkFiles.forEach((f: any) => {
          if (f?.ID > 0 && !checkDeleteIds.includes(f.ID)) {
            checkDeleteIds.push(f.ID);
          }
        });
        this.fileCheckDeleteCache[rowId] = checkDeleteIds;

        const reportDeleteIds = this.fileReportDeleteCache[rowId] || [];
        reportFiles.forEach((f: any) => {
          if (f?.ID > 0 && !reportDeleteIds.includes(f.ID)) {
            reportDeleteIds.push(f.ID);
          }
        });
        this.fileReportDeleteCache[rowId] = reportDeleteIds;

        // Không upload file cho dòng đã bị xóa
        this.fileCheckCache[rowId] = [];
        this.fileReportCache[rowId] = [];
      } else {
        // Dòng mới chưa lưu DB: bỏ toàn bộ file cache để không upload
        delete this.fileCheckCache[rowId];
        delete this.fileCheckDeleteCache[rowId];
        delete this.fileReportCache[rowId];
        delete this.fileReportDeleteCache[rowId];
      }

      // Nếu đang đứng ở dòng này thì clear panel file
      if (this.currentRowId === rowId) {
        this.currentRowId = 0;
        this.dataFileCheck = [];
        this.fileCheckDelete = [];
        this.dataFileReport = [];
        this.fileReportDelete = [];
      }
    }

    // Nếu ID > 0 và chưa có trong list thì thêm vào
    if (item.ID > 0 && !this.masterDeleteIds.includes(item.ID)) {
      this.masterDeleteIds.push(item.ID);
    }

    this.dataMasterAll = this.dataMasterAll.filter((x) => x.id !== item.id);
    // Cập nhật lại STT
    this.dataMasterAll = this.dataMasterAll.map((x, index) => ({
      ...x,
      STT: index + 1,
    }));

    this.applyHeaderFiltersToView();

    setTimeout(() => {
      this.updateMasterFooter();
    }, 0);
  }

  private syncMasterAllIfNeeded() {
    if (this.masterAllInitialized) return;
    if (this.dataMaster?.length) {
      this.dataMasterAll = [...this.dataMaster];
      this.masterAllInitialized = true;
    }
  }

  private applyHeaderFiltersToView() {
    this.syncMasterAllIfNeeded();

    if (!this.dataMasterAll?.length) {
      this.dataMaster = [];
      return;
    }

    const entries = Object.entries(this.headerFilterAppliedMap);
    if (entries.length === 0) {
      this.dataMaster = [...this.dataMasterAll];
      return;
    }
  }

  angularGridFileCheckReady(angularGrid: AngularGridInstance) {
    this.angularGridFileCheck = angularGrid;

    // Subscribe vào event double click để download file
    angularGrid.slickGrid.onDblClick.subscribe((_e: any, args: any) => {
      const item = args.grid.getDataItem(args.row);
      if (item?.ServerPath) {
        this.downloadFile(item.ServerPath, item.FileName);
      }
    });

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridFileReportReady(angularGrid: AngularGridInstance) {
    this.angularGridFileReport = angularGrid;

    // Subscribe vào event double click để download file
    angularGrid.slickGrid.onDblClick.subscribe((_e: any, args: any) => {
      const item = args.grid.getDataItem(args.row);
      if (item?.ServerPath) {
        this.downloadFile(item.ServerPath, item.FileName);
      }
    });

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableGridMenu: true,
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-master',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      frozenColumn: 4,
      forceFitColumns: true,
      enableColumnReorder: true,
    };

    this.gridOptionsFileCheck = {
      enableAutoResize: false,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      enableColumnReorder: true,
    };

    this.gridOptionsFileReport = {
      enableAutoResize: false,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      enableColumnReorder: true,
    };
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'action',
        name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm dòng mới"></i>',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: (_row, _cell, _value, _column, _dataContext) => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa dòng"></i></div>`;
        },
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 70,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductSaleID',
        name: 'Mã sản phẩm',
        field: 'ProductSaleID',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value) => {
          if (value == null) return '';

          const found = this.productSaleGrid.find(
            (x: any) => x.value === Number(value)
          );

          return found?.label ?? '';
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.productSaleGrid,
          collectionOptions: {
            addBlankEntry: false,
          },
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (value === null || value === undefined) return '';

          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);

          return `
              <span
                title="${dataContext.StatusText ?? ''}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${formatted}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
        },

        editor: { model: Editors['float'], decimal: 2 },
      },
      {
        id: 'LeaderTechID',
        name: 'Leader kỹ thuật',
        field: 'LeaderTechID',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value) => {
          if (value == null) return '';

          const flatOptions = this.leadersGrid.flatMap((g: any) => g.options);

          const found = flatOptions.find((x: any) => x.value === Number(value));

          return found?.label ?? '';
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.leadersGrid,
          collectionOptions: {
            addBlankEntry: false,
          },
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'EmployeeTechID',
        name: 'Kỹ thuật thực hiện',
        field: 'EmployeeTechID',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value) => {
          if (value == null) return '';

          const flatOptions = this.employeeRequestsGrid.flatMap(
            (g: any) => g.options
          );

          const found = flatOptions.find((x: any) => x.value === Number(value));

          return found?.label ?? '';
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.employeeRequestsGrid,
          collectionOptions: {
            addBlankEntry: false,
          },
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectID',
        name: 'Mã dự án',
        field: 'ProjectID',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value) => {
          if (value == null) return '';

          const found = this.projectsGrid.find(
            (x: any) => x.value === Number(value)
          );

          return found?.label ?? '';
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.projectsGrid,
          collectionOptions: {
            addBlankEntry: false,
          },
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'POKHCode',
        name: 'Số POKH',
        field: 'POKHCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
          useRegularTooltipFromCellTextOnly: true,
        },

        editor: {
          model: Editors['text'],
        },
        exportWithFormatter: false,
      },
      {
        id: 'BillCode',
        name: 'Đơn mua hàng',
        field: 'BillCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
          useRegularTooltipFromCellTextOnly: true,
        },
        editor: {
          model: Editors['text'],
        },
        exportWithFormatter: false,
      },
      {
        id: 'Status',
        name: 'Trạng thái',
        field: 'Status', // NÊN lưu value (1|2|3), không lưu text
        width: 140,
        sortable: true,
        filterable: true,

        formatter: (_row, _cell, value) => {
          const map: any = {
            null: '',
            1: 'OK',
            2: 'NG',
            3: 'Đã yêu cầu QC',
          };

          if (!value) return '';
          return `
              <span
                title="${map[value]}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${map[value]}
              </span>
            `;
        },

        editor: {
          model: Editors['singleSelect'],
          collection: [
            { value: null, label: '' },
            { value: 1, label: 'OK' },
            { value: 2, label: 'NG' },
            { value: 3, label: 'Đã yêu cầu QC' },
          ],
        },

        filter: {
          model: Filters['singleSelect'],
          collection: [
            { value: null, label: '' },
            { value: 1, label: 'OK' },
            { value: 2, label: 'NG' },
            { value: 3, label: 'Đã yêu cầu QC' },
          ],
          operator: OperatorType['equal'],
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'CheckSheet',
        name: 'Check sheet',
        field: 'CheckSheet',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Report',
        name: 'Report',
        field: 'Report',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                  ${value}
                </span>
              `;
        },

        customTooltip: {
          useRegularTooltip: true,
          useRegularTooltipFromCellTextOnly: true,
        },

        editor: {
          model: Editors['longText'],
          alwaysSaveOnEnterKey: true,
          maxLength: 255,
        },
        exportWithFormatter: false,
      },
    ];

    this.columnDefinitionsFileCheck = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },
      },
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        width: 825,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.columnDefinitionsFileReport = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },
      },
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        width: 830,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }
  //#endregion

  //#region Save data
  checkValidate(): boolean {
    // Kiểm tra người yêu cầu
    if (!this.employeeRequestId || this.employeeRequestId === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn người yêu cầu!'
      );
      return false;
    }

    // Kiểm tra ngày yêu cầu
    if (!this.dateRequest) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ngày yêu cầu!'
      );
      return false;
    }

    // Kiểm tra deadline
    if (!this.deadline) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn deadline!'
      );
      return false;
    }

    // Kiểm tra deadline >= ngày yêu cầu
    const dateRequestDate = new Date(this.dateRequest);
    const deadlineDate = new Date(this.deadline);
    dateRequestDate.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    if (deadlineDate < dateRequestDate) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Deadline không được nhỏ hơn ngày yêu cầu!'
      );
      return false;
    }

    // Kiểm tra có sản phẩm
    if (this.dataMasterAll.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn sản phẩm cần QC!'
      );
      return false;
    }

    // Kiểm tra từng dòng detail
    const productIds: number[] = [];
    for (let i = 0; i < this.dataMasterAll.length; i++) {
      const item = this.dataMasterAll[i];
      const stt = item.STT;

      // Kiểm tra ProductCode
      if (!item.ProductSaleID || item.ProductSaleID <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Vui lòng chọn sản phẩm dòng ${stt}!`
        );
        return false;
      }

      if (!item.LeaderTechID || item.LeaderTechID <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Vui lòng chọn Leader dòng ${stt}!`
        );
        return false;
      }

      const productId = item.ProductSaleID;
      if (productId && productIds.includes(productId)) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Sản phẩm dòng ${stt} đã tồn tại!`
        );
        return false;
      }
      if (productId) {
        productIds.push(productId);
      }
    }

    return true;
  }

  onSaveData() {
    // Validate trước khi lưu
    if (!this.checkValidate()) {
      return;
    }
    this.isLoading = true;
    // Chuẩn bị data header
    const headerData = {
      ...this.billImportQCMaster,
      RequestImportCode: this.requestCode,
      RequestDateQC: this.dateRequest,
      EmployeeRequestID: this.employeeRequestId,
      Dealine: this.deadline,
    };

    // Chuẩn bị data detail (master grid)
    const detailData = this.dataMasterAll.map((item) => ({
      ID: item.ID,
      BillImportQCID: item.BillImportQCID ?? 0,
      ProductSaleID: item.ProductSaleID ?? 0,
      LeaderTechID: item.LeaderTechID ?? 0,
      Status: item.Status ?? 0,
      EmployeeTechID: item.EmployeeTechID ?? 0,
      Note: item.Note ?? '',
      BillImportDetailID: item.BillImportDetailID ?? 0,
      IsDeleted: item.IsDeleted ?? false,
      ProjectID: item.ProjectID ?? 0,
      POKHCode: item.POKHCode ?? '',
      Quantity: item.Quantity ?? 0,
    }));

    // Chỉ lấy file mới (có FileObject) để upload
    const newCheckSheetFiles: any[] = [];
    Object.keys(this.fileCheckCache).forEach((key) => {
      const files = this.fileCheckCache[+key];
      files.forEach((file) => {
        if (file.FileObject) {
          newCheckSheetFiles.push({
            file: file.FileObject,
            billImportQCDetailId: +key,
            fileType: 1,
            fileName: file.FileName,
          });
        }
      });
    });

    const newReportFiles: any[] = [];
    Object.keys(this.fileReportCache).forEach((key) => {
      const files = this.fileReportCache[+key];
      files.forEach((file) => {
        if (file.FileObject) {
          newReportFiles.push({
            file: file.FileObject,
            billImportQCDetailId: +key,
            fileType: 2,
            fileName: file.FileName,
          });
        }
      });
    });

    // Chuẩn bị danh sách ID file bị xóa
    const deletedFileCheckIds: number[] = [];
    Object.keys(this.fileCheckDeleteCache).forEach((key) => {
      const ids = this.fileCheckDeleteCache[+key];
      deletedFileCheckIds.push(...ids);
    });

    const deletedFileReportIds: number[] = [];
    Object.keys(this.fileReportDeleteCache).forEach((key) => {
      const ids = this.fileReportDeleteCache[+key];
      deletedFileReportIds.push(...ids);
    });

    //#region Upload file
    const formData = new FormData();

    formData.append('billImportQC', JSON.stringify(headerData));
    formData.append('billImportQCDetails', JSON.stringify(detailData));
    formData.append('DeletedDetailIds', JSON.stringify(this.masterDeleteIds));
    formData.append(
      'DeletedCheckSheetFileIds',
      JSON.stringify(deletedFileCheckIds)
    );
    formData.append(
      'DeletedReportFileIds',
      JSON.stringify(deletedFileReportIds)
    );

    // Thêm file mới (FileObject)
    newCheckSheetFiles.forEach((item, index) => {
      formData.append('CheckSheetFiles', item.file, item.fileName);

      formData.append(
        `CheckSheetFiles_meta_${index}`,
        JSON.stringify({
          billImportQCDetailId: item.billImportQCDetailId,
          fileType: 1,
        })
      );
    });

    newReportFiles.forEach((item, index) => {
      formData.append('ReportFiles', item.file, item.fileName);

      formData.append(
        `ReportFiles_meta_${index}`,
        JSON.stringify({
          billImportQCDetailId: item.billImportQCDetailId,
          fileType: 2,
        })
      );
    });
    //#endregion

    this.billImportQcService.saveBillImportQC(formData).subscribe({
      next: (res) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu dữ liệu thành công'
        );
        this.isLoading = false;
        this.activeModal.close();
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || err?.message
        );
        this.isLoading = false;
      },
    });
  }
  //#endregion

  downloadFile(filePath: string, fileName: string) {
    if (!filePath) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy đường dẫn file!'
      );
      return;
    }
    this.isLoading = true;
    const normalizedPath = filePath.replace(/[\\/]+$/, '');
    const fullPath = `${normalizedPath}\\${fileName}`;

    this.billImportQcService.downloadFile(fullPath).subscribe({
      next: (blob: Blob) => {
        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Tải xuống thành công!'
          );
          this.isLoading = false;
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'File tải về không hợp lệ!'
          );
          this.isLoading = false;
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi tải file:', res);
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errorText.message || 'Tải xuống thất bại!'
              );
              this.isLoading = false;
            } catch {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Tải xuống thất bại!'
              );
              this.isLoading = false;
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg =
            res?.error?.message ||
            res?.message ||
            'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
          this.isLoading = false;
        }
      },
    });
  }
}

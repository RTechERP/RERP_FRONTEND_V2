import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
  Injector,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  ViewEncapsulation,
  createComponent,
  TemplateRef,
  ViewChild,
  Optional,
  Inject,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import { ProjectPartlistPriceRequestService } from '../../old/project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';
import { ProjectPartlistPriceRequestFormComponent } from '../../old/project-partlist-price-request/project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ImportExcelProjectPartlistPriceRequestComponent } from '../../old/project-partlist-price-request/import-excel-project-partlist-price-request/import-excel-project-partlist-price-request.component';
import { AngularSlickgridModule, AngularGridInstance, Column, GridOption, Filters, Formatters, Editors, OnClickEventArgs, OnCellChangeEventArgs, OnSelectedRowsChangedEventArgs, Aggregators, GroupTotalFormatters, SortComparers } from 'angular-slickgrid';
import { MultipleSelectOption, SortDirectionNumber } from '@slickgrid-universal/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../services/app-user.service';
import { bottom } from '@popperjs/core';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { SupplierSaleDetailComponent } from '../../purchase/supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { HorizontalScrollDirective } from '../../../directives/horizontalScroll.directive';
import { Subscription } from 'rxjs';
import { TabulatorPopupService } from '../../../shared/components/tabulator-popup/tabulator-popup.service';

/**
 * Custom editor for single select with searchable dropdown and grouped options support
 */
class GroupSelectEditor {
  private args: any;
  private wrapperElm!: HTMLDivElement;
  private inputElm!: HTMLInputElement;
  private dropdownElm!: HTMLDivElement;
  private defaultValue: string = '';
  private selectedValue: string = '';
  private collection: Array<any> = [];
  private visibleOptions: Array<{
    value: string;
    label: string;
    group?: string;
  }> = [];
  private activeIndex = -1;

  private handleOutsideMouseDown!: (e: Event) => void;
  private handleReposition!: () => void;

  constructor(args: any) {
    this.args = args;
    this.init();
  }

  init() {
    const editor = this.args?.column?.editor ?? {};
    this.collection = editor.collection ?? [];

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
      this.activeIndex = -1;
      this.buildDropdown(this.inputElm.value);
      this.openDropdown();
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
    const all = this.getFlattenedCollection();

    const filtered = all.filter((x) => {
      if (!term) return true;
      if (String(x.value ?? '') === currentValue) return true;
      const label = String(x.label ?? '').toLowerCase();
      const value = String(x.value ?? '').toLowerCase();
      return label.includes(term) || value.includes(term);
    });

    this.visibleOptions = filtered;

    const root = document.createElement('div');
    root.style.padding = '4px 0';

    const grouped = new Map<string, Array<{ value: string; label: string }>>();
    const noGroup: Array<{ value: string; label: string }> = [];

    for (const x of filtered) {
      const item = { value: x.value, label: x.label };
      if (x.group) {
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

    for (const [groupLabel, items] of grouped.entries()) {
      const header = document.createElement('div');
      header.style.padding = '6px 10px';
      header.style.fontWeight = '600';
      header.style.color = '#666';
      header.textContent = groupLabel;
      root.appendChild(header);

      for (const opt of items) {
        appendOption(opt, optIndex);
        optIndex++;
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
    const flat = this.getFlattenedCollection();
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
    const flat = this.getFlattenedCollection();
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
  selector: 'app-project-partlist-price-request-new',
  standalone: true,
  //encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ProjectPartlistPriceRequestFormComponent,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
    // NSelectComponent,
    NgbModalModule,
    ImportExcelProjectPartlistPriceRequestComponent,
    HasPermissionDirective,
    HorizontalScrollDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './project-partlist-price-request-new.component.html',
  styleUrls: ['./project-partlist-price-request-new.component.css']
})
export class ProjectPartlistPriceRequestNewComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() openModal = new EventEmitter<any>();
  @Input() poKHID: number = 0;
  @Input() jobRequirementID: number = 0;
  @Input() isVPP: boolean = false;
  @Input() projectPartlistPriceRequestTypeID: number = 0;
  @Input() initialTabId: number = 0;
  @Input() isFromPOKH: boolean = false;
  // Active tab tracking
  sizeSearch: string = '0';
  activeTabId = 2;
  dtproject: any[] = [];
  dtPOKH: any[] = [];
  loading = false;
  dtprojectPartlistPriceRequest: any[] = [];
  projectTypes: any[] = [];
  // Angular SlickGrid instances
  angularGrids: Map<number, AngularGridInstance> = new Map();
  // Column definitions for each tab
  columnDefinitionsMap: Map<number, Column[]> = new Map();
  // Grid options for each tab
  gridOptionsMap: Map<number, GridOption> = new Map();
  // Datasets for each tab
  datasetsMap: Map<number, any[]> = new Map();
  modalData: any[] = [];
  dtcurrency: any[] = [];
  showDetailModal = false;
  // Filters
  filters: any;
  dtSupplierSale: any[] = [];
  dtProductSale: any[] = [];
  // Map để lưu dữ liệu theo từng type (cho local pagination)
  allDataByType: Map<number, any[]> = new Map();
  // Store original data for each tab (before filters)
  datasetsAllMap: Map<number, any[]> = new Map();
  // Quản lý subscriptions để có thể hủy khi cần
  private dataLoadingSubscriptions: Subscription[] = [];
  // Request ID để đảm bảo chỉ xử lý response từ request hiện tại
  private currentRequestId: number = 0;
  // Flag để track khi tab đã render
  isTabReady: boolean = false;
  PriceRequetsService = inject(ProjectPartlistPriceRequestService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  appUserService = inject(AppUserService);
  private ngbModal = inject(NgbModal);
  private tabulatorPopupService = inject(TabulatorPopupService);

  // Removed popup-related properties - will use single select editors instead

  @ViewChild('rejectReasonTpl', { static: false })
  rejectReasonTpl!: TemplateRef<any>;
  rejectReason: string = '';
  lastSelectedRowsForReject: any[] = [];

  @ViewChild('requestBuyTpl', { static: false })
  requestBuyTpl!: TemplateRef<any>;

  requestBuyDeadline: Date | null = null;
  requestBuyIsVPP: boolean = false;
  requestBuyJobRequirementID: number = 0;
  lastSelectedRowsForBuy: any[] = [];
  labels: { [key: number]: string } = {};
  labeln: { [key: number]: string } = {};
  showSearchBar: boolean = false;
  showHeader: boolean = false;
  headerText: string = 'DANH SÁCH YÊU CẦU BÁO GIÁ';

  showCloseButton: boolean = false;

  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private ngZone: NgZone = inject(NgZone);

  constructor(
    @Optional() @Inject('tabData') private tabData: any,
    @Optional() public activeModal?: NgbActiveModal
  ) {
    // Khi mở từ new tab, data được truyền qua injector
    if (this.tabData) {
      // Nếu có initialTabId trong tabData, set activeTabId trực tiếp
      if (
        this.tabData.initialTabId !== null &&
        this.tabData.initialTabId !== undefined
      ) {
        this.activeTabId = this.tabData.initialTabId;
      }
      // Nếu có projectPartlistPriceRequestTypeID trong tabData, set và map sang activeTabId
      if (
        this.tabData.projectPartlistPriceRequestTypeID !== null &&
        this.tabData.projectPartlistPriceRequestTypeID !== undefined
      ) {
        this.projectPartlistPriceRequestTypeID =
          this.tabData.projectPartlistPriceRequestTypeID;
        if (this.projectPartlistPriceRequestTypeID === 3) {
          this.activeTabId = -2; // HCNS tab
        } else if (this.projectPartlistPriceRequestTypeID === 4) {
          this.activeTabId = -3; // Tab tương ứng với type 4
        }
      }
      // Nếu có isVPP trong tabData, set nó
      if (this.tabData.isVPP !== undefined) {
        this.isVPP = this.tabData.isVPP;
      }
    }
  }

  ngOnInit() {
    // Nếu có projectPartlistPriceRequestTypeID được truyền vào, set activeTabId tương ứng
    if (this.projectPartlistPriceRequestTypeID === 3) {
      this.activeTabId = -2; // HCNS tab
    } else if (this.projectPartlistPriceRequestTypeID === 4) {
      this.activeTabId = -3; // Tab tương ứng với type 4
    }
    if (this.isFromPOKH) {
      this.activeTabId = 5;
    }

    this.filters = {
      dateStart: DateTime.local().startOf('month').toJSDate(), // Ngày đầu tháng hiện tại
      dateEnd: DateTime.local().endOf('month').toJSDate(), // Ngày cuối cùng của tháng hiện tại
      statusRequest: 1, // Mặc định: Yêu cầu báo giá
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: this.poKHID,
      isCommercialProduct: -1,
      isJobRequirement: -1,
    };

    // Hiển thị search bar mặc định cho nhân viên mua (có permission) hoặc không phải HR
    const hasPurchasePermission = this.appUserService.hasPermission('N27,N34,N69,N80');
    if (hasPurchasePermission || !this.isHRDept) {
      this.showSearchBar = true;
    }

    this.GetCurrency();
    this.GetSupplierSale();
    this.GetProductSale(); //NXL Update 29/11/25
    this.LoadProjectTypes();
    this.GetallProject();
    this.GetAllPOKH();
  }

  get restrictedView(): boolean {
    return (
      this.jobRequirementID > 0 ||
      this.isVPP ||
      this.projectPartlistPriceRequestTypeID === 4
    );
  }
  get isHRDept(): boolean {
    const d = this.appUserService.departmentID ?? 0;
    return d === 4 && !this.appUserService.isAdmin;
  }
  get shouldShowSearchBar(): boolean {
    // Hiển thị search bar khi showSearchBar = true và:
    // - Không phải HR, HOẶC
    // - Có permission của nhân viên mua (N27, N34, N69, N80)
    if (!this.showSearchBar) return false;

    // Nếu có permission của nhân viên mua, luôn hiển thị
    const hasPurchasePermission = this.appUserService.hasPermission('N27,N34,N69,N80');
    if (hasPurchasePermission) return true;

    // Nếu không phải HR, hiển thị
    return true;
  }
  shouldShowProjectType(id: number): boolean {
    if (this.poKHID > 0 && id !== -1) return false;
    if (this.projectPartlistPriceRequestTypeID === 3) return id === -2;
    if (this.projectPartlistPriceRequestTypeID === 4) return id === -3;
    return true;
  }
  getVisibleProjectTypes(): any[] {
    return (this.projectTypes || []).filter((t: any) =>
      this.shouldShowProjectType(t.ProjectTypeID)
    );
  }

  OnFormSubmit(): void {
    this.LoadPriceRequests();
    this.showDetailModal = false;
  }
  OnAddClick() {
    this.modalData = [];

    // Map projectTypeID (activeTabId) sang projectPartlistPriceRequestTypeID
    const projectPartlistPriceRequestTypeID =
      this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID =
      projectPartlistPriceRequestTypeID;

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.OnFormSubmit();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  // Map projectTypeID sang projectPartlistPriceRequestTypeID theo logic WinForm
  private getProjectPartlistPriceRequestTypeID(projectTypeID: number): number {
    //NXL Update 29/11/25
    const mapping: { [key: number]: number } = {
      0: 5,
      '-1': 2,
      '-2': 3,
      '-3': 4,
    };

    const key = String(projectTypeID);
    if (mapping.hasOwnProperty(key)) {
      return mapping[key as any];
    }

    // Nếu projectTypeID > 0 thì trả về 1
    return projectTypeID > 0 ? 1 : 0;
  }

  OnEditClick() {
    const lstTypeAccept = [-1, -2];
    const angularGrid = this.angularGrids.get(this.activeTabId);

    if (!lstTypeAccept.includes(this.activeTabId)) {
      this.notification.info(
        'Thông báo',
        'Chỉ được sửa những sản phẩm thương mại hoặc của yêu cầu công việc!'
      );
      return;
    }

    if (!angularGrid) return;

    const selectedRows = angularGrid.slickGrid.getSelectedRows().map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để chỉnh sửa.'
      );
      return;
    }

    // Kiểm tra cùng EmployeeID
    const empID = selectedRows[0].EmployeeID;
    const allSameEmp = selectedRows.every((row) => row.EmployeeID === empID);

    if (!allSameEmp) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn các yêu cầu báo giá có cùng Người yêu cầu!'
      );
      return;
    }

    // Gán STT và map các field cần thiết cho từng dòng được chọn
    const processedRows = selectedRows.map((row, index) => {
      // Tìm ProductNewCode từ ProductCode trong danh sách sản phẩm
      let productNewCode = row.ProductNewCode;
      if (!productNewCode && row.ProductCode) {
        const product = this.dtProductSale.find(
          (p: any) => p.ProductCode === row.ProductCode
        );
        productNewCode = product ? product.ProductNewCode : null;
      }

      return {
        ...row,
        STT: index + 1,
        ProductNewCode: productNewCode || row.ProductNewCode || null,
        Maker: row.Maker || row.Manufacturer || '',
        Unit: row.Unit || row.UnitCount || '',
        ProjectPartlistPriceRequestTypeID:
          row.ProjectPartlistPriceRequestTypeID ?? null,
      };
    });

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = processedRows;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID =
      this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.OnFormSubmit();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  private GetProductSale() {
    //NXL Update 29/11/25
    this.PriceRequetsService.getProductSale().subscribe((response) => {
      this.dtProductSale = response.data || [];
      console.log('ProductSale:', this.dtProductSale);
    });
  }
  OnDeleteClick() {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes.map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để xóa.'
      );
      // Swal.fire({
      //   title: 'Thông báo',
      //   text: 'Vui lòng chọn ít nhất một dòng để xóa.',
      //   icon: 'warning',
      //   confirmButtonText: 'OK',
      // });
      return;
    }
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: 'Bạn có chắc muốn xóa các dòng đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updateData = selectedRows.map((rowData) => {
          return {
            ID: rowData['ID'],
            IsDeleted: true,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: new Date().toISOString(),
          };
        });

        // Gửi về server qua hàm save chung
        this.SaveDataCommon(updateData, 'Xóa dữ liệu thành công');
      },
    });
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.value = cell.getValue();
      componentRef.instance.dataSource = this.dtcurrency;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  createdControl2(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.value = cell.getValue();
      componentRef.instance.dataSource = this.dtSupplierSale;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  private GetSupplierSale() {
    this.PriceRequetsService.getSuplierSale()
      // .pipe(take(50))
      .subscribe((response) => {
        this.dtSupplierSale = response.data;
        console.log('dtsuppliersale: ', this.dtSupplierSale);
      });
  }
  private LoadProjectTypes(): void {
    const employeeID = this.appUserService.employeeID ?? 0;
    let projectTypeIdHR = 0;
    if (this.jobRequirementID > 0 || this.isVPP) projectTypeIdHR = -2;

    // Lấy danh sách types
    this.PriceRequetsService.getTypes(employeeID, projectTypeIdHR).subscribe(
      (response) => {
        this.projectTypes = response.data.dtType;

        // Initialize grids for each project type
        setTimeout(() => {
          this.projectTypes.forEach((type) => {
            const projectTypeID = type.ProjectTypeID;
            if (!this.columnDefinitionsMap.has(projectTypeID)) {
              // Initialize columns and grid options
              this.columnDefinitionsMap.set(projectTypeID, this.initGridColumns(projectTypeID));
              this.gridOptionsMap.set(projectTypeID, this.initGridOptions(projectTypeID));
              this.datasetsMap.set(projectTypeID, []);
            }
          });

          // Set tab ready flag
          this.isTabReady = true;
          this.cdr.detectChanges();

          // Sau khi init xong grids, load dữ liệu
          setTimeout(() => {
            this.LoadAllDataOnce();
          }, 300);
        }, 100);
      }
    );
  }

  /**
   * Hủy tất cả các subscription đang chờ load dữ liệu
   */
  private cancelAllDataLoading(): void {
    if (this.dataLoadingSubscriptions.length > 0) {
      console.log(`Cancelling ${this.dataLoadingSubscriptions.length} pending subscriptions...`);
      this.dataLoadingSubscriptions.forEach(sub => {
        if (sub && !sub.closed) {
          sub.unsubscribe();
        }
      });
      this.dataLoadingSubscriptions = [];
    }
  }

  /**
   * Load tất cả dữ liệu cho từng type từ API (gọi nhiều lần, mỗi type một lần)
   * Sau đó set vào từng table với local pagination
   */
  private LoadAllDataOnce(): void {
    // Đảm bảo filters tồn tại
    if (!this.filters) {
      console.error('Filters is not initialized');
      return;
    }

    // Hủy tất cả subscriptions cũ trước khi bắt đầu request mới
    this.cancelAllDataLoading();

    // Tăng request ID để đánh dấu request mới
    this.currentRequestId++;
    const currentRequestId = this.currentRequestId;

    // Bắt đầu loading
    this.loading = true;

    const dateStart =
      typeof this.filters.dateStart === 'string'
        ? this.filters.dateStart
        : DateTime.fromJSDate(this.filters.dateStart).toFormat('yyyy/MM/dd');

    const dateEnd =
      typeof this.filters.dateEnd === 'string'
        ? this.filters.dateEnd
        : DateTime.fromJSDate(this.filters.dateEnd).toFormat('yyyy/MM/dd');

    const statusRequest = this.filters.statusRequest ;
    const projectId = this.filters.projectId || 0;
    const keyword = (this.filters.keyword || '').trim();
    const isDeleted = this.filters.isDeleted || 0;
    const employeeID = this.appUserService.employeeID ?? 0;

    console.log(`[Request ${currentRequestId}] LoadAllDataOnce - Filters:`, {
      dateStart,
      dateEnd,
      statusRequest,
      projectId,
      keyword,
      isDeleted,
      employeeID,
      poKHID: this.filters.poKHID
    });

    // Clear Map
    this.allDataByType.clear();

    // Gọi API cho từng type với logic mapping giống WinForm
    let loadedCount = 0;
    const totalTypes = this.projectTypes.length;

    // Nếu không có types, tắt loading ngay
    if (totalTypes === 0) {
      this.loading = false;
      console.log('No project types to load');
      return;
    }

    console.log(`[Request ${currentRequestId}] Starting to load data for ${totalTypes} types...`);

    // Timeout để đảm bảo loading không bị kẹt mãi (10 phút = 600 giây)
    // Tăng timeout lên 10 phút để đảm bảo spinner tiếp tục quay cho đến khi API thực sự hoàn thành
    let loadingTimeout: any = setTimeout(() => {
      // Chỉ force tắt loading nếu đây vẫn là request hiện tại
      if (this.loading && currentRequestId === this.currentRequestId) {
        console.warn(`[Request ${currentRequestId}] Loading timeout after 10 minutes - forcing loading to false`);
        console.warn(`[Request ${currentRequestId}] Loaded count: ${loadedCount}/${totalTypes}`);
        this.loading = false;
      }
    }, 600000); // 10 phút = 600000ms

    // Helper function để clear timeout và set loading = false
    const finishLoading = () => {
      // Chỉ finish loading nếu đây vẫn là request hiện tại
      if (currentRequestId !== this.currentRequestId) {
        console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request (${this.currentRequestId}) is active`);
        return;
      }

      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      if (this.loading) {
        this.loading = false;
        console.log(`[Request ${currentRequestId}] Loading finished. Loaded: ${loadedCount}/${totalTypes}`);
      }
    };

          this.projectTypes.forEach((type, index) => {
      const projectTypeID = type.ProjectTypeID;

      // Map projectTypeID sang các tham số API theo logic WinForm
      let mappedProjectTypeID = projectTypeID;
      let isCommercialProduct = -1;
      let poKHID = 0;
      let isJobRequirement = -1;
      let projectPartlistPriceRequestTypeID = -1;

      if (projectTypeID === -1) {
        mappedProjectTypeID = -1;
        isCommercialProduct = 1;
        poKHID = this.filters.poKHID || 0;
      } else if (projectTypeID === -2) {
        mappedProjectTypeID = -1;
        isJobRequirement = 1;
        isCommercialProduct = -1;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else if (projectTypeID === -3) {
        projectPartlistPriceRequestTypeID = 4;
        isCommercialProduct = 0;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else if (projectTypeID === 0) {
        isCommercialProduct = 0;
        isJobRequirement = 0;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else {
        // projectTypeID > 0
        poKHID = 0; // poKHID = 0 cho các type khác
      }

      if (this.jobRequirementID > 0 || this.isVPP) {
        isJobRequirement = 1;
      }

      // Gọi API cho type này
      const subscription = this.PriceRequetsService.getAllPartlistLocal(
        dateStart,
        dateEnd,
        statusRequest,
        projectId,
        keyword,
        employeeID,
        isDeleted,
        mappedProjectTypeID,
        poKHID,
        isJobRequirement,
        projectPartlistPriceRequestTypeID,
        isCommercialProduct
      ).subscribe({
        next: (response: any) => {
          // Kiểm tra xem đây có phải response từ request hiện tại không
          if (currentRequestId !== this.currentRequestId) {
            console.log(`[Request ${currentRequestId}] Ignored response for type ${projectTypeID} - newer request (${this.currentRequestId}) is active`);
            return;
          }

          const data = response?.data || [];

          // Format các trường ngày tháng
          const formattedData = this.formatDateFields(data);

          // Log dữ liệu của từng tab
          console.log(`[Request ${currentRequestId}] === Tab ${type.ProjectTypeName} (ID: ${projectTypeID}) ===`);
          console.log(`[Request ${currentRequestId}] Số lượng bản ghi:`, formattedData.length);
          console.log(`[Request ${currentRequestId}] Dữ liệu:`, formattedData);
          console.log(`[Request ${currentRequestId}] Tham số API:`, {
            mappedProjectTypeID,
            poKHID,
            isJobRequirement,
            projectPartlistPriceRequestTypeID,
            isCommercialProduct,
            dateStart,
            dateEnd,
            statusRequest,
            projectId,
            keyword,
            isDeleted
          });
          console.log(`[Request ${currentRequestId}] ==========================================`);

          // Lưu dữ liệu vào Map (kể cả khi data rỗng)
          this.allDataByType.set(projectTypeID, formattedData);

          loadedCount++;
          console.log(`[Request ${currentRequestId}] [${projectTypeID}] Data loaded. Progress: ${loadedCount}/${totalTypes}`);

          // Set dữ liệu vào grid - đảm bảo grid đã sẵn sàng (kể cả khi data rỗng)
          try {
            // Kiểm tra xem grid đã được khởi tạo chưa
            const angularGrid = this.angularGrids.get(projectTypeID);
            if (angularGrid && angularGrid.slickGrid && angularGrid.dataView) {
              // Grid đã sẵn sàng, set data ngay (kể cả data rỗng)
              this.setGridData(projectTypeID, formattedData);
            } else {
              // Grid chưa sẵn sàng, đợi một chút rồi thử lại
              // Retry nhiều lần để đảm bảo grid được tạo và set data
              let retryCount = 0;
              const maxRetries = 10;
              const retryInterval = 200;

              const retrySetData = () => {
                retryCount++;
                const grid = this.angularGrids.get(projectTypeID);
                if (grid && grid.slickGrid && grid.dataView) {
                  // Grid đã sẵn sàng, set data (kể cả data rỗng)
                  this.setGridData(projectTypeID, formattedData);
                } else if (retryCount < maxRetries) {
                  // Chưa sẵn sàng, thử lại
                  setTimeout(retrySetData, retryInterval);
                } else {
                  // Đã retry quá nhiều lần, vẫn cố set data để đảm bảo grid có data rỗng
                  console.warn(`[Request ${currentRequestId}] Grid for type ${projectTypeID} not ready after ${maxRetries} retries, attempting to set data anyway`);
                  this.setGridData(projectTypeID, formattedData);
                }
              };

              setTimeout(retrySetData, retryInterval);
            }
            } catch (e) {
              console.warn(`[Request ${currentRequestId}] Error setting data for type ${projectTypeID}:`, e);
              // Vẫn cố set data rỗng để đảm bảo grid được tạo
              try {
                this.setGridData(projectTypeID, []);
              } catch (e2) {
                console.error(`[Request ${currentRequestId}] Failed to set empty data for type ${projectTypeID}:`, e2);
              }
          }

          // Sau khi load xong tất cả types
          if (loadedCount >= totalTypes) {
            // Kiểm tra lại request ID trước khi finish
            if (currentRequestId !== this.currentRequestId) {
              console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request is active`);
              return;
            }

            console.log(`[Request ${currentRequestId}] [FINAL] All types processed. Count: ${loadedCount}, Total: ${totalTypes}`);

            // Log tổng hợp tất cả các tab
            console.log(`[Request ${currentRequestId}] === TỔNG HỢP DỮ LIỆU TẤT CẢ CÁC TAB ===`);
            this.allDataByType.forEach((data, typeId) => {
              const type = this.projectTypes.find(t => t.ProjectTypeID === typeId);
              console.log(`[Request ${currentRequestId}] Tab ${type?.ProjectTypeName || typeId}: ${data.length} bản ghi`);
            });
            console.log(`[Request ${currentRequestId}] Tổng số tab:`, this.allDataByType.size);
            console.log(`[Request ${currentRequestId}] ==========================================`);

            // Đợi tất cả tables render xong rồi mới tắt spinner
            // Sử dụng requestAnimationFrame để đảm bảo UI đã render
            requestAnimationFrame(() => {
              setTimeout(() => {
                // Kiểm tra lại request ID trước khi finish
                if (currentRequestId !== this.currentRequestId) {
                  return;
                }

                // Tắt spinner SAU KHI tables đã render
                finishLoading();
                console.log(`[Request ${currentRequestId}] All ${totalTypes} types loaded and rendered successfully.`);

                // Apply distinct filters after data is loaded
                setTimeout(() => {
                  this.applyDistinctFilters();
                }, 100);

                // Force change detection
                this.cdr.detectChanges();

                // Nếu có initialTabId từ tabData, chọn tab đó sau khi load xong
                if (
                  this.tabData &&
                  this.tabData.initialTabId !== null &&
                  this.tabData.initialTabId !== undefined
                ) {
                  setTimeout(() => {
                    this.SelectProjectType(this.tabData.initialTabId);
                  }, 100);
                }
                // Nếu có projectPartlistPriceRequestTypeID, chọn tab tương ứng sau khi load xong
                else if (this.projectPartlistPriceRequestTypeID === 3) {
                  setTimeout(() => {
                    this.SelectProjectType(-2); // HCNS tab
                  }, 100);
                } else if (this.projectPartlistPriceRequestTypeID === 4) {
                  setTimeout(() => {
                    this.SelectProjectType(-3); // Tab tương ứng với type 4
                  }, 100);
                }

                // Focus vào job requirement nếu có
                if (this.jobRequirementID > 0) {
                  setTimeout(() => {
                    this.LoadViewToJobRequirement();
                  }, 200);
                }
              }, 50); // Đợi 50ms sau requestAnimationFrame
            });
          }
        },
        error: (err) => {
          // Kiểm tra xem đây có phải response từ request hiện tại không
          if (currentRequestId !== this.currentRequestId) {
            console.log(`[Request ${currentRequestId}] Ignored error for type ${projectTypeID} - newer request (${this.currentRequestId}) is active`);
            return;
          }

          console.error(`[Request ${currentRequestId}] [ERROR] Loading data for type ${projectTypeID}:`, err);
          loadedCount++;
          console.log(`[Request ${currentRequestId}] [${projectTypeID}] Error occurred. Progress: ${loadedCount}/${totalTypes}`);

          // Lưu mảng rỗng vào Map để tránh lỗi
          this.allDataByType.set(projectTypeID, []);

          // Set data rỗng vào grid để đảm bảo grid được tạo
          try {
            const angularGrid = this.angularGrids.get(projectTypeID);
            if (angularGrid && angularGrid.slickGrid && angularGrid.dataView) {
              // Grid đã sẵn sàng, set data rỗng
              this.setGridData(projectTypeID, []);
            } else {
              // Grid chưa sẵn sàng, đợi một chút rồi thử lại
              setTimeout(() => {
                this.setGridData(projectTypeID, []);
              }, 200);
            }
          } catch (e) {
            console.warn(`[Request ${currentRequestId}] Error setting empty data for type ${projectTypeID}:`, e);
          }

          // Nếu tất cả đã load xong (kể cả lỗi)
          if (loadedCount >= totalTypes) {
            // Kiểm tra lại request ID trước khi finish
            if (currentRequestId !== this.currentRequestId) {
              console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request is active`);
              return;
            }

            console.log(`[Request ${currentRequestId}] [FINAL ERROR] All types processed. Count: ${loadedCount}, Total: ${totalTypes}`);
            finishLoading();
            console.log(`[Request ${currentRequestId}] All ${totalTypes} types processed (including errors).`);
            
            // Apply distinct filters after data is loaded (even if there were errors)
            setTimeout(() => {
              this.applyDistinctFilters();
            }, 100);
            
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Một số dữ liệu không thể tải. Vui lòng thử lại sau.'
            );
          }
        }
      });

      // Lưu subscription để có thể hủy sau này
      this.dataLoadingSubscriptions.push(subscription);
    });
  }

  private LoadAllTablesData(): void {
    // Reload tất cả dữ liệu và filter lại
    this.LoadAllDataOnce();
  }

  /**
   * Load view theo Job Requirement - ẩn/hiện các nút và focus vào row tương ứng
   * Logic này được xử lý trong HTML thông qua restrictedView và isHRDept
   * Hàm này chỉ focus vào row có jobRequirementID tương ứng
   */
  private LoadViewToJobRequirement(): void {
    // Focus vào row có jobRequirementID tương ứng
    if (this.jobRequirementID > 0) {
      const angularGrid = this.angularGrids.get(this.activeTabId);
      if (angularGrid) {
        // Đợi grid render xong
        setTimeout(() => {
          // Tìm row có JobRequirementID tương ứng
          const data = angularGrid.dataView.getItems();
          const targetRowIndex = data.findIndex((row: any) => {
            return Number(row['JobRequirementID'] || 0) === this.jobRequirementID;
          });

          if (targetRowIndex >= 0) {
            // Scroll đến row và select nó
            angularGrid.slickGrid.scrollRowIntoView(targetRowIndex, true);
            angularGrid.slickGrid.setSelectedRows([targetRowIndex]);
            // Focus vào row
            setTimeout(() => {
              angularGrid.slickGrid.setActiveCell(targetRowIndex, 0);
            }, 100);
          }
        }, 300);
      }
    }
  }
  ToggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  private GetallProject() {
    this.PriceRequetsService.getProject().subscribe((response) => {
      this.dtproject = response.data;
      console.log('PriceRequests:', this.dtproject);
    });
  }
  private GetCurrency() {
    this.PriceRequetsService.getCurrency().subscribe((response) => {
      this.dtcurrency = response.data;
      this.createLabelsFromData();
      console.log('dtcurrentcy: ', this.dtcurrency);
    });
  }
  private GetAllPOKH() {
    this.PriceRequetsService.getPOKH().subscribe((response) => {
      this.dtPOKH = response.data;
      console.log('POKH:', this.dtPOKH);
    });
  }

  /**
   * Refresh toàn bộ dữ liệu: combobox, bảng, projecttype
   */
  RefreshAll(): void {
    // Clear all grids
    this.angularGrids.clear();
    this.columnDefinitionsMap.clear();
    this.gridOptionsMap.clear();
    this.datasetsMap.clear();

    // Clear editedRowsMap
    this.editedRowsMap.clear();

    // Load lại tất cả các combobox
    this.GetCurrency();
    this.GetSupplierSale();
    this.GetProductSale();
    this.GetallProject();
    this.GetAllPOKH();

    // Load lại ProjectTypes (sẽ tự động tạo lại tables và load data)
    this.LoadProjectTypes();

    // Hiển thị thông báo
    this.notification.success('Thông báo', 'Đang làm mới dữ liệu...');
  }

  private LoadPriceRequests(): void {
    // Reload tất cả dữ liệu
    this.LoadAllDataOnce();
  }

  public ApplyFilters(): void {
    console.log('ApplyFilters - Filters:', this.filters);

    // Đảm bảo filters được cập nhật trước khi load dữ liệu
    // Sử dụng setTimeout để đảm bảo ngModel đã cập nhật
    setTimeout(() => {
      // Reload tất cả dữ liệu với filter mới
      this.loading = true;
      this.LoadAllDataOnce();

    // Tự động ẩn filter bar trên mobile sau khi tìm kiếm
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.showSearchBar) {
      // Khôi phục body scroll trước khi đóng modal
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';

      // Đóng modal với animation
      setTimeout(() => {
        this.showSearchBar = false;
      }, 100);
    }
    }, 0);
  }

  public ResetFilters(): void {
    this.filters = {
      dateStart: DateTime.local().startOf('month').toJSDate(), // Ngày đầu tháng hiện tại
      dateEnd: DateTime.local().endOf('month').toJSDate(), // Ngày cuối cùng của tháng hiện tại
      statusRequest: 2, // Mặc định: Yêu cầu báo giá
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: 0,
      isCommercialProduct: -1,
      isJobRequirement: -1,
    };

    // Reload tất cả dữ liệu
    this.LoadAllDataOnce();
  }

  public SelectProjectType(typeId: number, event?: Event): void {
    // Ngăn chặn hành vi mặc định của link
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Nếu đang ở cùng tab, không làm gì
    if (this.activeTabId === typeId) {
      return;
    }

    // Lưu tab hiện tại để có thể khôi phục nếu chọn Hủy
    const currentTabId = this.activeTabId;

    // Kiểm tra xem có dữ liệu thay đổi trong tab hiện tại không
    const hasChanges = this.hasUnsavedChanges();

    if (hasChanges) {
      // Hiển thị modal xác nhận với 3 nút
      const modalRef = this.modal.create({
        nzTitle: 'Thông báo',
        nzContent: 'Bạn vừa thay đổi dữ liệu.\nBạn có muốn lưu dữ liệu đã thay đổi trước không?',
        nzFooter: [
          {
            label: 'Có',
            type: 'primary',
            onClick: () => {
              modalRef.close();
              // Lưu dữ liệu trước khi chuyển tab
              this.saveAndSwitchTab(typeId);
            }
          },
          {
            label: 'Không',
            onClick: () => {
              modalRef.close();
              // Không lưu, chuyển tab luôn
              this.switchTab(typeId);
            }
          },
          {
            label: 'Hủy',
            onClick: () => {
              modalRef.close();
              // Không làm gì cả, giữ nguyên tab
              // Đảm bảo activeTabId vẫn là tab hiện tại (khôi phục về tab ban đầu)
              this.activeTabId = currentTabId;
              this.filters.projectTypeID = currentTabId;
              // Force change detection để UI cập nhật lại
              setTimeout(() => {
                // Đảm bảo tab hiện tại vẫn được active
                const currentTabElement = document.querySelector(`#tab-${currentTabId}`);
                const clickedTabElement = document.querySelector(`#tab-${typeId}`);
                if (currentTabElement) {
                  currentTabElement.classList.add('active');
                  currentTabElement.setAttribute('aria-selected', 'true');
                }
                if (clickedTabElement && clickedTabElement !== currentTabElement) {
                  clickedTabElement.classList.remove('active');
                  clickedTabElement.setAttribute('aria-selected', 'false');
                }
              }, 0);
            }
          }
        ]
      });
    } else {
      // Không có thay đổi, chuyển tab trực tiếp
      this.switchTab(typeId);
    }
  }

  private hasUnsavedChanges(): boolean {
    // Angular SlickGrid tracks changes automatically through dataView
    // We can check if there are any changes by comparing with original data
    // For now, return false as we'll handle this differently
    return false; // TODO: Implement change tracking for Angular SlickGrid
  }

  private saveAndSwitchTab(typeId: number): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) {
      this.switchTab(typeId);
      return;
    }

    // Get all data from grid
    const allGridData = this.getGridData(this.activeTabId);

    // Get changed rows from editedRowsMap
    const changedRowsMap = new Map<number, any>();
    const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
    if (tabEditedRows) {
      tabEditedRows.forEach((rowData: any, rowId: number) => {
        const latestRowData = allGridData.find((row: any) => Number(row['ID']) === rowId);
        if (latestRowData) {
          changedRowsMap.set(rowId, latestRowData);
        }
      });
    }

    const changedData = Array.from(changedRowsMap.values());

    // Xóa editedRowsMap sau khi đã lấy dữ liệu
    if (tabEditedRows) {
      tabEditedRows.clear();
    }

    if (changedData.length === 0) {
      this.switchTab(typeId);
      return;
    }

    // Lọc những dòng hợp lệ
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const allGridDataForValidation = this.getGridData(this.activeTabId);

    const validData: any[] = [];
    for (const changedItem of changedData) {
      const id = Number(changedItem['ID']);
      if (id <= 0) continue;

      const originalData = allGridData.find((row: any) => Number(row['ID']) === id);
      if (!originalData) continue;

      const quoteEmployeeID = Number(originalData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID <= 0) continue;

      const isCheckPrice = originalData['IsCheckPrice'] === true || originalData['IsCheckPrice'] === 1 || originalData['IsCheckPrice'] === 'true';
      if (isCheckPrice) {
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          continue;
        }
      }

      validData.push(changedItem);
    }

    if (validData.length === 0) {
      this.switchTab(typeId);
      return;
    }

    // Lưu dữ liệu
    this.processSaveData(validData, () => {
      // Sau khi lưu thành công, chuyển tab
      this.switchTab(typeId);
    });
  }

  private switchTab(typeId: number): void {
    this.activeTabId = typeId;
    this.filters.projectTypeID = typeId;

    // Kiểm tra nếu grid chưa được init
    if (!this.columnDefinitionsMap.has(typeId)) {
      this.columnDefinitionsMap.set(typeId, this.initGridColumns(typeId));
      this.gridOptionsMap.set(typeId, this.initGridOptions(typeId));
      this.datasetsMap.set(typeId, []);
    }

    // Set dữ liệu nếu đã có trong Map (kể cả khi data rỗng)
    const data = this.allDataByType.get(typeId);
    if (data !== undefined) {
      // Set data vào grid (kể cả khi data rỗng để đảm bảo grid được tạo)
      this.setGridData(typeId, data);
    } else {
      // Nếu chưa có data trong Map, set data rỗng để đảm bảo grid được tạo
      this.setGridData(typeId, []);
    }

    // Resize grid khi chuyển tab
    const angularGrid = this.angularGrids.get(typeId);
    if (angularGrid) {
    setTimeout(() => {
        angularGrid.resizerService.resizeGrid();
      }, 150);
    }
  }
  // Initialize grid columns for Angular SlickGrid
  // Helper methods để tạo collection cho single select
  private getCurrencyCollection(): Array<{ value: number; label: string; currencyRate: number }> {
    const currencies = (this.dtcurrency || []).map((c: any) => ({
      value: c.ID,
      label: `${c.Code || ''} - ${this.formatNumberEnUS(c.CurrencyRate || 0, 2)}`,
      currencyRate: c.CurrencyRate || 0
    }));
    // Thêm dòng mặc định ở đầu với ID=0
    return [
      { value: 0, label: '', currencyRate: 0 },
      ...currencies
    ];
  }

  private getSupplierCollection(): Array<{ value: number; label: string }> {
    const suppliers = (this.dtSupplierSale || []).map((s: any) => ({
      value: s.ID,
      label: `${s.CodeNCC || ''} - ${s.NameNCC || ''}`.replace(/^ - |^ -$| - $/g, '').trim() || s.NameNCC || ''
    }));
    // Thêm dòng mặc định ở đầu với ID=0
    return [
      { value: 0, label: '' },
      ...suppliers
    ];
  }

  /**
   * Tính toán số cột được freeze dựa trên vị trí của cột target trong mảng columns
   * Trong Angular SlickGrid, checkbox selector được thêm như cột đầu tiên (index 0)
   * Các columns trong mảng bắt đầu từ index 1 trong grid thực tế
   * 
   * Ví dụ: Nếu Unit có index 7 trong mảng columns:
   * - Grid thực tế: checkbox(0) + columns[0..7] = các cột từ index 0 đến 8
   * - frozenColumn = 9 (để freeze từ index 0 đến 8, tức là bao gồm cả Unit)
   * 
   * Công thức: targetIndex (trong mảng columns) + 2
   * - +1: để bao gồm chính cột target (vì index bắt đầu từ 0)
   * - +1: để bao gồm checkbox selector (luôn ở index 0)
   */
  private calculateFrozenColumnCount(columns: Column[], targetField: string = 'Unit'): number {
    // Tìm index của cột target trong mảng columns (không tính checkbox selector)
    const targetIndex = columns.findIndex(col => col.field === targetField);
    
    if (targetIndex === -1) {
      console.warn(`Column with field '${targetField}' not found, defaulting to 0`);
      return 0;
    }

    // Checkbox selector luôn được bật và là cột đầu tiên trong grid (index 0)
    // Vậy frozenColumn = targetIndex + 2 (targetIndex + 1 cho chính nó + 1 cho checkbox)
    return targetIndex + 2;
  }

  private initGridColumns(typeId: number): Column[] {
    const isJobRequirement = typeId === -2 || this.jobRequirementID > 0 || this.isVPP;

    const columns: Column[] = [
      {
        id: 'ID',
        field: 'ID',
        name: 'ID',
        width: 0,
        hidden: true,
        excludeFromHeaderMenu: true,
        excludeFromGridMenu: true,
        excludeFromColumnPicker: true,
        excludeFromQuery: true,
      },
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 50,
        sortable: false,
        filterable: false,
      },
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: isJobRequirement ? 'Mã YCCV' : 'Mã dự án',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'Manufacturer',
        field: 'Manufacturer',
        name: 'Hãng',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Manufacturer}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'], decimal: 2,
        },
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Quantity}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Unit}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'StatusRequestText',
        field: 'StatusRequestText',
        name: 'Trạng thái',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.StatusRequestText}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người yêu cầu',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullNameSale',
        field: 'FullNameSale',
        name: 'Sale phụ trách',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameSale}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'QuoteEmployee',
        field: 'QuoteEmployee',
        name: 'NV báo giá',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.QuoteEmployee}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'DateRequest',
        field: 'DateRequest',
        name: 'Ngày yêu cầu',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Deadline',
        field: 'Deadline',
        name: 'Deadline',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'DatePriceQuote',
        field: 'DatePriceQuote',
        name: 'Ngày báo giá',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getCurrencyCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const currency = this.dtcurrency.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        },
      },
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'UnitPrice',
        field: 'UnitPrice',
        name: 'Đơn giá',
        width: 120,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 0,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'HistoryPrice',
        field: 'HistoryPrice',
        name: 'Giá lịch sử',
        width: 120,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 0,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'DateHistoryPrice',
        field: 'DateHistoryPrice',
        name: 'Ngày báo giá lịch sử',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'TotalPrice',
        field: 'TotalPrice',
        name: 'Thành tiền chưa VAT',
        width: 150,
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalPriceExchange',
        field: 'TotalPriceExchange',
        name: 'Thành tiền quy đổi (VNĐ)',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'VAT',
        field: 'VAT',
        name: '% VAT',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TotaMoneyVAT',
        field: 'TotaMoneyVAT',
        name: 'Thành tiền có VAT',
        width: 150,
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'CodeNCC',
        field: 'CodeNCC',
        name: 'Mã NCC',
        width: 100,
        sortable: true,
        filterable: true,
        hidden: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getSupplierCollection(),
          collectionOptions: {
            addBlankEntry: false
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const supplier = this.dtSupplierSale.find((s: any) => s.ID === value);
          return supplier ? supplier.NameNCC : '';
        },
      },
      {
        id: 'TotalDayLeadTime',
        field: 'TotalDayLeadTime',
        name: 'Lead Time (Ngày làm việc)',
        width: 150,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['integer'],
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'DateExpected',
        field: 'DateExpected',
        name: 'Ngày dự kiến hàng về',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú Pur',
        width: 150,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['longText'],
        },
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Note}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'NotePartlist',
        field: 'NotePartlist',
        name: 'Ghi chú (Người Y/C)',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NotePartlist}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'Model',
        field: 'Model',
        name: 'Thông số kỹ thuật',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Model}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'SpecialCode',
        field: 'SpecialCode',
        name: 'Mã đặc biệt',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.SpecialCode}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'IsImport',
        field: 'IsImport',
        name: 'Hàng nhập khẩu',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        editor: {
          model: Editors['checkbox'],
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'UnitFactoryExportPrice',
        field: 'UnitFactoryExportPrice',
        name: 'Đơn giá xuất xưởng',
        width: 150,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 0,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'UnitImportPrice',
        field: 'UnitImportPrice',
        name: 'Đơn giá nhập khẩu',
        width: 150,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 0,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TotalImportPrice',
        field: 'TotalImportPrice',
        name: 'Thành tiền nhập khẩu',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'LeadTime',
        field: 'LeadTime',
        name: 'Lead Time',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'ReasonDeleted',
        field: 'ReasonDeleted',
        name: 'Lý do xoá',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ReasonDeleted}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
    ];

    return columns;
  }

  // Initialize grid options for Angular SlickGrid
  private initGridOptions(typeId: number): GridOption {
    // Lấy columns để tính toán frozenColumn
    const columns = this.columnDefinitionsMap.get(typeId) || this.initGridColumns(typeId);
    const frozenColumnCount = this.calculateFrozenColumnCount(columns, 'Unit');

    return {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-${typeId}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false, // True (Single Selection), False (Multiple Selections)
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
        columnIndexPosition: 0, // Position of checkbox column (0 = first column)
        width: 35, // Width of checkbox column
      },
      editable: true,

      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: frozenColumnCount, // Calculated dynamically to freeze up to Unit (DVT) column
      enablePagination: false,
      enableHeaderMenu: false, // Disable default header dropdown menu
    };
  }

  // Helper method to ensure checkbox selector is always enabled
  private ensureCheckboxSelector(angularGrid: AngularGridInstance | undefined, delay: number = 0): void {
    if (!angularGrid || !angularGrid.slickGrid) return;

    const enableCheckbox = () => {
      // Luôn enable checkbox selector với config cố định
      angularGrid!.slickGrid!.setOptions({
        enableCheckboxSelector: true,
        enableRowSelection: true,
        rowSelectionOptions: {
          selectActiveRow: false,
        },
        checkboxSelector: {
          hideInFilterHeaderRow: false,
          hideInColumnTitleRow: true,
          applySelectOnAllPages: true,
          columnIndexPosition: 0,
          width: 35,
        },
      });
      // Force render để đảm bảo checkbox selector được hiển thị
      angularGrid!.slickGrid!.render();
    };

    if (delay > 0) {
      setTimeout(enableCheckbox, delay);
    } else {
      enableCheckbox();
    }
  }

  // Handle Angular Grid Ready event
  angularGridReady(typeId: number, angularGrid: AngularGridInstance): void {
    // Store the angular grid instance
    this.angularGrids.set(typeId, angularGrid);

    // Đảm bảo config luôn có sẵn - nếu chưa có thì init ngay
    if (!this.gridOptionsMap.has(typeId)) {
      this.columnDefinitionsMap.set(typeId, this.initGridColumns(typeId));
      this.gridOptionsMap.set(typeId, this.initGridOptions(typeId));
      this.datasetsMap.set(typeId, []);
    }

    // Đảm bảo checkbox selector được enable ngay sau khi grid ready
    this.ensureCheckboxSelector(angularGrid);

    // Set data rỗng nếu chưa có data trong Map để đảm bảo grid được tạo
    if (!this.allDataByType.has(typeId)) {
      this.allDataByType.set(typeId, []);
    }

    // Set data vào grid (kể cả khi data rỗng) - đợi một chút để đảm bảo grid đã sẵn sàng
    setTimeout(() => {
      const data = this.allDataByType.get(typeId) || [];
      this.setGridData(typeId, data);
    }, 50);

    // Setup grouping by ProjectFullName with Aggregators
    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.setGrouping({
        getter: 'ProjectFullName',
        formatter: (g: any) => {
          const projectName = g.value || 'Chưa có tên dự án';
          return `Dự án: ${projectName} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
        },
        comparer: (a: any, b: any) => {
          // Sort groups by ProjectFullName
          return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
        },
        aggregators: [
          new Aggregators['Sum']('Quantity'),
          new Aggregators['Sum']('TotalPrice'),
          new Aggregators['Sum']('TotalPriceExchange'),
          new Aggregators['Sum']('TotaMoneyVAT'),
          new Aggregators['Sum']('TotalImportPrice'),
          new Aggregators['Sum']('TotalDayLeadTime'),
        ],
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false, // Groups expanded by default
      });

      // Refresh the grid to show grouping
      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();

      // Đảm bảo checkbox selector vẫn được enable sau khi refresh/render (với delay nhỏ)
      this.ensureCheckboxSelector(angularGrid, 50);
    }


      // Resize grid after initialization và đảm bảo checkbox selector vẫn hiển thị
      setTimeout(() => {
        angularGrid.resizerService.resizeGrid();
        // Đảm bảo checkbox selector vẫn được enable sau khi resize
        this.ensureCheckboxSelector(angularGrid);
        if (angularGrid.slickGrid) {
          angularGrid.slickGrid.render();
        }
      }, 100);
  }

  // Handler khi cell được click
  onCellClicked(typeId: number, e: Event, args: OnClickEventArgs): void {
    // Lưu cell đang được click để có thể copy khi nhấn Ctrl+C
    // CurrencyID và SupplierSaleID giờ dùng single select editor nên không cần xử lý click riêng
      const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return;

    // Lấy column từ cell index
    const columns = angularGrid.slickGrid.getColumns();
    const column = columns[args.cell];

    console.log('Cell clicked:', column?.field, 'row:', args.row);
  }

  // Handler khi cell được thay đổi
  onCellChange(typeId: number, e: Event, args: OnCellChangeEventArgs): void {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return;

    const rowIndex = args.row;
    const item = angularGrid.dataView.getItem(rowIndex);
    const column = args.column;
    const field = column?.field || '';
    const newValue = args.item?.[field];

    if (!item) return;

    // Cập nhật giá trị mới vào item
    if (field && newValue !== undefined) {
      item[field] = newValue;
    }

    // Xử lý thay đổi cell
    if (field === 'CurrencyID') {
      this.OnCurrencyChangedSlickGrid(item);
    } else if (field === 'SupplierSaleID') {
      this.OnSupplierSaleChangedSlickGrid(item);
    } else if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'TotalDayLeadTime'].includes(field)) {
      // Tính toán lại các giá trị phụ thuộc
      this.recalculateRowForSlickGrid(item);
    }

    // Cập nhật lại item trong dataView
    angularGrid.dataView.updateItem(item['id'], item);

    // Track edited row
    const rowId = item['ID'];
    if (rowId) {
      const tabEditedRows = this.editedRowsMap.get(typeId);
      if (!tabEditedRows) {
        this.editedRowsMap.set(typeId, new Map());
      }
      const editedRows = this.editedRowsMap.get(typeId);
      if (editedRows) {
        editedRows.set(rowId, item);
      }
    }

    // Refresh grid
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
        // Đảm bảo checkbox selector vẫn được enable sau khi render
        this.ensureCheckboxSelector(angularGrid);
      }

  // Handler khi row selection thay đổi
  handleRowSelection(typeId: number, e: Event, args: OnSelectedRowsChangedEventArgs): void {
    // Có thể thêm logic xử lý khi selection thay đổi
        const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return;

    const selectedRows = args.rows || [];
    // Có thể thêm logic xử lý selected rows nếu cần
  }

  // Helper method to format numbers
  private formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }

  // Custom group totals formatter for sum with number formatting
  private sumTotalsFormatterWithFormat(totals: any, columnDef: any, grid?: any): string {
    const field = columnDef.field;
    const val = totals.sum?.[field];
    const prefix = columnDef.params?.groupFormatterPrefix || '';

    if (val != null) {
      return `<strong>${prefix}${this.formatNumberEnUS(val, 0)}</strong>`;
    }
    return '';
  }

  // Helper methods to work with Angular SlickGrid (replacing Tabulator methods)
  private getGridData(typeId: number): any[] {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return [];
    const items: any[] = [];
    for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
      items.push(angularGrid.dataView.getItem(i));
    }
    return items;
  }

  private getSelectedGridData(typeId: number): any[] {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return [];
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);
  }

  private setGridData(typeId: number, data: any[]): void {
    // Đảm bảo data là mảng (kể cả khi rỗng)
    const safeData = Array.isArray(data) ? data : [];

    // Sync to datasetsAllMap if needed (for header filters)
    // Store original unfiltered data from allDataByType
    if (!this.datasetsAllMap.has(typeId) || this.datasetsAllMap.get(typeId)?.length === 0) {
      const originalData = this.allDataByType.get(typeId) || [];
      if (originalData.length > 0) {
        this.datasetsAllMap.set(typeId, [...originalData]);
      }
    }

    // Map data với id unique
    const usedIds = new Set<string>();
    const timestamp = Date.now();
    const mappedData = safeData.map((item: any, index: number) => {
      let uniqueId: string;
      if (item.ID && Number(item.ID) > 0) {
        uniqueId = `tab_${typeId}_id_${item.ID}`;
      } else {
        uniqueId = `tab_${typeId}_idx_${index}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      }

      let finalId = uniqueId;
      let counter = 0;
      while (usedIds.has(finalId)) {
        counter++;
        finalId = `${uniqueId}_${counter}`;
      }
      usedIds.add(finalId);

      return {
        ...item,
        id: finalId,
      };
    });

    // Lưu data vào Map (kể cả khi rỗng)
    this.datasetsMap.set(typeId, mappedData);

    const angularGrid = this.angularGrids.get(typeId);
    if (angularGrid) {
      // Đảm bảo grid đã được khởi tạo hoàn toàn trước khi set data
      if (!angularGrid.slickGrid || !angularGrid.dataView) {
        // Nếu grid chưa sẵn sàng, đợi một chút rồi thử lại (kể cả khi data rỗng)
        setTimeout(() => {
          this.setGridData(typeId, safeData);
        }, 100);
        return;
      }

      // Set data vào grid (kể cả khi data rỗng)
      angularGrid.dataView.setItems(mappedData);

      // Ensure grouping is applied after setting items
      if (angularGrid.dataView.getGrouping().length === 0) {
        angularGrid.dataView.setGrouping({
          getter: 'ProjectFullName',
          formatter: (g: any) => {
            const projectName = g.value || 'Chưa có tên dự án';
            return `Dự án: ${projectName} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
          },
          comparer: (a: any, b: any) => {
            // Sort groups by ProjectFullName
            return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
          },
          aggregators: [
            new Aggregators['Sum']('Quantity'),
            new Aggregators['Sum']('TotalPrice'),
            new Aggregators['Sum']('TotalPriceExchange'),
            new Aggregators['Sum']('TotaMoneyVAT'),
            new Aggregators['Sum']('TotalImportPrice'),
            new Aggregators['Sum']('TotalDayLeadTime'),
          ],
          aggregateCollapsed: false,
          lazyTotalsCalculation: true,
          collapsed: false, // Groups expanded by default
        });
      }

      angularGrid.dataView.refresh();
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đảm bảo checkbox selector vẫn được enable sau khi refresh/render (với delay nhỏ)
      this.ensureCheckboxSelector(angularGrid, 50);

      // Resize grid và đảm bảo checkbox selector vẫn hiển thị
      setTimeout(() => {
        angularGrid.resizerService.resizeGrid();
        // Đảm bảo checkbox selector vẫn được enable sau khi resize
        this.ensureCheckboxSelector(angularGrid);
        if (angularGrid.slickGrid) {
          angularGrid.slickGrid.render();
        }
      }, 100);
    }
  }

  private getGridColumns(typeId: number): Column[] {
    return this.columnDefinitionsMap.get(typeId) || [];
  }

  private UpdateActiveTable(): void {
    const tableId = this.activeTabId;
    const angularGrid = this.angularGrids.get(tableId);
    if (angularGrid) {
      // Format các trường ngày tháng trước khi set vào bảng
      const formattedData = this.formatDateFields(this.dtprojectPartlistPriceRequest);
      angularGrid.dataView.setItems(formattedData);
    }
  }
  CalculateTotalPriceExchange(rowData: any, currencyRate: number): number {
    const totalMoney = Number(rowData.TotalPrice) || 0;
    return totalMoney * currencyRate;
  }
  GetDataChanged() {
    const tableId = this.activeTabId;
    const angularGrid = this.angularGrids.get(tableId);
    if (!angularGrid) return;
    // Angular SlickGrid handles data changes automatically through DataView
    // No need for manual event listener
  }
  private SaveDataCommon(
    data: any[],
    successMessage: string = 'Dữ liệu đã được lưu.',
    onSuccessCallback?: () => void
  ): void {
    // Đảm bảo data là array
    if (!Array.isArray(data)) {
      console.error('SaveDataCommon: data không phải là array', data);
      this.notification.error('Thông báo', 'Dữ liệu không hợp lệ.');
      return;
    }

    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    console.log('SaveDataCommon: Gửi dữ liệu', { projectPartlistPriceRequest: data });

    this.PriceRequetsService.saveChangedData(data).subscribe({
      next: (response) => {
        if ((response as any).status === 1) {
          // Xóa editedRowsMap sau khi save thành công
          const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
          if (tabEditedRows) {
            tabEditedRows.clear();
          }

          this.LoadPriceRequests();
          this.notification.success(
            'Thông báo',
            (response as any).message || successMessage
          );
          // Gọi callback nếu có
          if (onSuccessCallback) {
            onSuccessCallback();
          }
        } else {
          this.notification.success(
            'Thông báo',
            (response as any).message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || 'Lỗi khi lưu dữ liệu.');
        // Swal.fire('Thông báo', 'Không thể lưu dữ liệu.', 'error');
      },
    });
  }

  OnSaveData(): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;

    // Get all data from grid
    const allGridData = this.getGridData(this.activeTabId);

    // Get changed rows from editedRowsMap
    const changedRowsMap = new Map<number, any>();
    const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
    if (tabEditedRows) {
      tabEditedRows.forEach((rowData: any, rowId: number) => {
        const latestRowData = allGridData.find((row: any) => Number(row['ID']) === rowId);
        if (latestRowData) {
          changedRowsMap.set(rowId, latestRowData);
        }
      });
    }

    const changedData = Array.from(changedRowsMap.values());

    // Xóa editedRowsMap sau khi đã lấy dữ liệu
    if (tabEditedRows) {
      tabEditedRows.clear();
    }

    if (changedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    // Lọc những dòng hợp lệ: chỉ cho phép sửa nếu là người check giá hoặc Admin
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const allGridDataForValidation = this.getGridData(this.activeTabId);

    const validData: any[] = [];
    let skippedCount = 0;

    for (const changedItem of changedData) {
      const id = Number(changedItem['ID']);
      if (id <= 0) continue;

      // Tìm dữ liệu gốc từ grid
      const originalData = allGridData.find((row: any) => Number(row['ID']) === id);
      if (!originalData) continue;

      // Kiểm tra nếu dòng không có nhân viên báo giá (QuoteEmployeeID = 0 hoặc null)
      const quoteEmployeeID = Number(originalData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID <= 0) {
        skippedCount++;
        continue; // Bỏ qua dòng không có nhân viên báo giá
      }

      // Kiểm tra nếu dòng đã được check giá
      const isCheckPrice = originalData['IsCheckPrice'] === true || originalData['IsCheckPrice'] === 1 || originalData['IsCheckPrice'] === 'true';
      if (isCheckPrice) {
        // Kiểm tra quyền: chỉ cho phép sửa nếu là người check giá hoặc Admin
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          skippedCount++;
          continue; // Bỏ qua dòng không có quyền
        }
      }

      // Dòng hợp lệ, thêm vào danh sách
      validData.push(changedItem);
    }

    // Kiểm tra nếu không có dòng nào hợp lệ
    if (validData.length === 0) {
      if (skippedCount > 0) {
        this.notification.warning(
          'Thông báo',
          'Không có dữ liệu hợp lệ để lưu. Những dòng không có nhân viên báo giá hoặc NV báo giá không phải bạn sẽ bị bỏ qua!'
        );
      } else {
        this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      }
      return;
    }

    // Hiển thị cảnh báo nếu có dòng bị bỏ qua
    if (skippedCount > 0) {
      this.modal.confirm({
        nzTitle: 'Thông báo',
        nzContent: `Các sản phẩm không có nhân viên báo giá hoặc không phải NV check giá sẽ bị bỏ qua. Bạn có muốn tiếp tục lưu dữ liệu không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processSaveData(validData);
        },
      });
      return;
    }

    // Nếu không có dòng nào bị bỏ qua, lưu trực tiếp
    this.processSaveData(validData);

  }

  private processSaveData(changedData: any[], onSuccess?: () => void): void {
    // Đảm bảo changedData là array
    if (!Array.isArray(changedData)) {
      console.error('processSaveData: changedData không phải là array', changedData);
      this.notification.error('Thông báo', 'Dữ liệu không hợp lệ.');
      return;
    }

    // Chỉ giữ lại các trường hợp lệ
    // Bao gồm tất cả các cột có editor để có thể lưu được
    const validFields = [
      'ID',
      'EmployeeID',
      'Deadline',
      'Note', // textarea editor
      'Unit',
      'Quantity',
      'TotalPrice',
      'UnitPrice', // moneyEditor
      'UnitFactoryExportPrice', // moneyEditor
      'UnitImportPrice', // moneyEditor
      'VAT', // input editor
      'TotaMoneyVAT',
      'CurrencyID', // custom editor (popup)
      'CurrencyRate',
      'IsCheckPrice',
      'IsImport', // checkbox editor
      'SupplierSaleID', // supplierEditor (popup)
      'DateExpected',
      'DateRequest',
      'DatePriceQuote',
      'LeadTime',
      'TotalDayLeadTime', // number editor
      'TotalPriceExchange',
      'HistoryPrice', // moneyEditor
      'TotalImportPrice'
    ];
    if (!this.appUserService.isAdmin) {
      validFields.push('QuoteEmployeeID');
      validFields.push('UpdatedBy');
    }

    // Danh sách các trường ngày tháng cần xử lý đặc biệt
    const dateFields = [
      'Deadline',
      'DateExpected',
      'DateRequest',
      'DatePriceQuote',
      'LeadTime',
    ];

    // Danh sách các trường số cần chuyển đổi từ string sang number
    const numericFields = [
      'ID',
      'EmployeeID',
      'ProjectPartListID',
      'Quantity',
      'UnitPrice',
      'TotalPrice',
      'UnitFactoryExportPrice',
      'UnitImportPrice',
      'TotalImportPrice',
      'VAT',
      'TotaMoneyVAT',
      'CurrencyID',
      'CurrencyRate',
      'TotalPriceExchange',
      'HistoryPrice',
      'SupplierSaleID',
      'TotalDayLeadTime',
      'QuoteEmployeeID',
      'StatusRequest',
      'POKHDetailID',
      'JobRequirementID',
      'ProjectPartlistPriceRequestTypeID',
      'EmployeeIDUnPrice'
    ];

    const filteredData = changedData.map((item) => {
      const filteredItem: any = {};
      validFields.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          // Xử lý đặc biệt cho các trường ngày tháng
          if (dateFields.includes(key)) {
            // Kiểm tra và chuyển đổi tất cả các loại dữ liệu ngày tháng
            if (item[key] instanceof Date) {
              // Nếu là đối tượng Date, chuyển đổi sang định dạng ISO
              filteredItem[key] = DateTime.fromJSDate(item[key]).toISO();
            } else if (item[key] && typeof item[key] === 'string') {
              // Nếu là chuỗi, thử chuyển đổi sang DateTime
              try {
                // Thử phân tích chuỗi như một ISO date
                const dt = DateTime.fromISO(item[key]);
                if (dt.isValid) {
                  filteredItem[key] = dt.toISO();
                } else {
                  // Thử các định dạng khác
                  const formats = [
                    'DD/MM/YYYY',
                    'yyyy/MM/dd',
                    'dd/MM/yyyy',
                    'yyyy-MM-dd',
                  ];
                  for (const format of formats) {
                    const dt = DateTime.fromFormat(item[key], format);
                    if (dt.isValid) {
                      filteredItem[key] = dt.toISO();
                      break;
                    }
                  }
                }
              } catch (e) {
                console.error(
                  `Không thể chuyển đổi ngày tháng: ${item[key]}`,
                  e
                );
                // Giữ nguyên giá trị nếu không thể chuyển đổi
                filteredItem[key] = item[key];
              }
            } else {
              filteredItem[key] = item[key];
            }
          } else if (numericFields.includes(key)) {
            // Xử lý đặc biệt cho các trường số: chuyển đổi từ string sang number
            const value = item[key];
            if (value === null || value === undefined || value === '') {
              // Giữ nguyên null/undefined/empty string
              filteredItem[key] = value;
            } else if (typeof value === 'string') {
              // Chuyển đổi string sang number
              const numValue = Number(value);
              filteredItem[key] = isNaN(numValue) ? value : numValue;
            } else {
              // Đã là number hoặc boolean, giữ nguyên
              filteredItem[key] = value;
            }
          } else {
            filteredItem[key] = item[key];
          }
        }
      });

      // Sử dụng định dạng ISO chuẩn cho UpdatedDate
      filteredItem.UpdatedDate = DateTime.local().toISO();
      filteredItem.UpdatedBy = !this.appUserService.isAdmin
        ? this.appUserService.loginName
        : '';

      // Loại bỏ các trường có giá trị null, undefined, hoặc empty string
      const cleanedItem: any = {};
      const requiredFields = ['ID', 'UpdatedDate', 'UpdatedBy']; // Các trường bắt buộc luôn giữ lại

      Object.keys(filteredItem).forEach((key) => {
        const value = filteredItem[key];

        // Luôn giữ lại các trường bắt buộc
        if (requiredFields.includes(key)) {
          cleanedItem[key] = value;
          return;
        }

        // Kiểm tra giá trị hợp lệ
        if (value === null || value === undefined) {
          // Bỏ qua null và undefined
          return;
        }

        // Xử lý chuỗi: loại bỏ empty string và chuỗi chỉ có khoảng trắng
        if (typeof value === 'string') {
          if (value.trim() === '') {
            return; // Bỏ qua empty string
          }
          // Nếu là trường số nhưng vẫn là string, chuyển đổi lại
          if (numericFields.includes(key)) {
            const numValue = Number(value);
            cleanedItem[key] = isNaN(numValue) ? value : numValue;
          } else {
            cleanedItem[key] = value;
          }
          return;
        }

        // Giữ lại số (kể cả 0), boolean (kể cả false), và các object/array hợp lệ
        if (
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          (typeof value === 'object' && value !== null) ||
          Array.isArray(value)
        ) {
          cleanedItem[key] = value;
        }
      });

      return cleanedItem;
    });

    console.log('Dữ liệu đã lọc:', filteredData);

    this.SaveDataCommon(filteredData, 'Dữ liệu đã được lưu.', onSuccess);
  }

  AddWeekdays(date: Date, days: number): Date {
    if (!days || isNaN(days)) {
      return date; // Trả về ngày gốc nếu days không hợp lệ
    }

    let count = 0;
    let result = new Date(date.getTime());

    while (count < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        // Skip Sunday (0) and Saturday (6)
        count++;
      }
    }

    return result; // Vẫn trả về đối tượng Date JavaScript
  }

  /**
   * Chuẩn hóa các trường ngày tháng về ISO format để Tabulator formatter xử lý
   * Không format thành dd/MM/yyyy vì formatter của Tabulator sẽ xử lý việc này
   */
  private formatDateFields(data: any[]): any[] {
    if (!data || !Array.isArray(data)) {
      return data;
    }

    const dateFields = ['DateRequest', 'DateExpected', 'DateHistoryPrice', 'LeadTime', 'DatePriceQuote'];

    return data.map((row: any) => {
      const formattedRow = { ...row };
      dateFields.forEach((field) => {
        if (formattedRow[field]) {
          try {
            let dateValue: DateTime | null = null;

            // Nếu là string, thử parse
            if (typeof formattedRow[field] === 'string') {
              // Nếu đã là ISO format hoặc empty string, giữ nguyên
              if (formattedRow[field].trim() === '') {
                formattedRow[field] = '';
                return;
              }

              // Thử ISO format trước
              dateValue = DateTime.fromISO(formattedRow[field]);
              if (!dateValue.isValid) {
                // Thử các format khác và chuyển về ISO
                const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                for (const format of formats) {
                  dateValue = DateTime.fromFormat(formattedRow[field], format);
                  if (dateValue.isValid) break;
                }
              }
            } else if (formattedRow[field] instanceof Date) {
              // Nếu là Date object, chuyển về ISO
              dateValue = DateTime.fromJSDate(formattedRow[field]);
            }

            // Chuyển về ISO format để formatter của Tabulator xử lý
            if (dateValue && dateValue.isValid) {
              formattedRow[field] = dateValue.toISO();
            }
            // Nếu không parse được, giữ nguyên giá trị
          } catch (e) {
            // Nếu có lỗi, giữ nguyên giá trị
            console.warn(`Không thể chuẩn hóa ${field}:`, formattedRow[field], e);
          }
        }
      });
      return formattedRow;
    });
  }
  UpdateValue(rowData: any): void {
    const quantity = Number(rowData.Quantity) || 0;
    const unitPrice = Number(rowData.UnitPrice) || 0;
    const unitImportPrice = Number(rowData.UnitImportPrice) || 0;
    const vat = Number(rowData.VAT) || 0;
    const leadTime = Number(rowData.TotalDayLeadTime) || 0;
    const currencyRate = Number(rowData.CurrencyRate) || 1;

    // Thành tiền
    const totalPrice = quantity * unitPrice;
    rowData.TotalPrice = totalPrice;

    // Thành tiền quy đổi (VNĐ)
    rowData.TotalPriceExchange = this.CalculateTotalPriceExchange(
      rowData,
      currencyRate
    );

    // Thành tiền nhập khẩu
    const totalPriceImport = quantity * unitImportPrice;
    rowData.TotalImportPrice = totalPriceImport;

    // Thành tiền có VAT
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;
    rowData.TotaMoneyVAT = totalMoneyVAT;

    // Tính ngày về dự kiến
    if (rowData.TotalDayLeadTime !== undefined) {
      const dateExpected = this.AddWeekdays(
        DateTime.local().toJSDate(),
        leadTime
      );
      // Chuyển đổi Date thành ISO string để Tabulator hiển thị đúng
      rowData.DateExpected = DateTime.fromJSDate(dateExpected).toISO();
    }
  }

  // Map để track các row đã được cập nhật thông qua update() (không được Tabulator tự động đánh dấu là edited)
  private editedRowsMap: Map<number, Map<number, any>> = new Map(); // Map<tabId, Map<rowId, rowData>>

  // Handle cell edited for Angular SlickGrid
  HandleCellEditedSlickGrid(item: any): void {
    this.recalculateRowForSlickGrid(item);

    // Track edited row
    const rowId = Number(item['ID']);
    if (rowId > 0) {
      if (!this.editedRowsMap.has(this.activeTabId)) {
        this.editedRowsMap.set(this.activeTabId, new Map());
      }
      this.editedRowsMap.get(this.activeTabId)!.set(rowId, item);
    }
  }

  // Legacy Tabulator method - kept for compatibility but will be replaced
  // This method is no longer used with Angular SlickGrid - use HandleCellEditedSlickGrid instead
  HandleCellEdited(cell: any) {
    // This method is for Tabulator - deprecated, use HandleCellEditedSlickGrid instead
    return;
  }

  // Recalculate row for Angular SlickGrid
  private recalculateRowForSlickGrid(item: any): void {
    const data = item;

    // Lấy các giá trị cần thiết từ dòng
    const unitPrice = Number(data.UnitPrice) || 0;
    const importPrice = Number(data.UnitImportPrice) || 0;
    const quantity = Number(data.Quantity) || 0;
    const vat = Number(data.VAT) || 0;
    const currencyRate = Number(data.CurrencyRate) || 1;

    // Tính toán lại
    const totalPrice = unitPrice * quantity;
    const totalPriceImport = quantity * importPrice;
    const totalVAT = totalPrice + (totalPrice * vat) / 100;
    const totalPriceExchange = totalPrice * currencyRate;

    const leadtime = Number(data.TotalDayLeadTime);
    // Sử dụng DateTime để tạo ngày dự kiến
    const dateexpect = this.AddWeekdays(DateTime.local().toJSDate(), leadtime);
    // Chuyển đổi Date thành ISO string
    const dateExpectedISO = DateTime.fromJSDate(dateexpect).toISO();

    // Cập nhật lại các cột liên quan trong item
    item.DateExpected = dateExpectedISO;
    item.TotalImportPrice = totalPriceImport;
    item.TotalPrice = totalPrice;
    item.TotaMoneyVAT = totalVAT;
    item.TotalPriceExchange = totalPriceExchange;

    // Update in grid
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (angularGrid && item.id) {
      angularGrid.dataView.updateItem(item.id, item);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
      // Đảm bảo checkbox selector vẫn được enable sau khi render
      this.ensureCheckboxSelector(angularGrid);
    }
  }



  // Handle currency changed for Angular SlickGrid
  OnCurrencyChangedSlickGrid(item: any): void {
    const currencyId = Number(item.CurrencyID);
    const currency = this.dtcurrency.find((p: { ID: number }) => p.ID === currencyId);
    if (currency) {
      const rate = currency.CurrencyRate;
      const totalPrice = this.CalculateTotalPriceExchange(item, rate);

      item.CurrencyRate = rate;
      item.TotalPriceExchange = totalPrice;

      // Update in grid
      const angularGrid = this.angularGrids.get(this.activeTabId);
      if (angularGrid && item.id) {
        angularGrid.dataView.updateItem(item.id, item);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
        // Đảm bảo checkbox selector vẫn được enable sau khi render
        this.ensureCheckboxSelector(angularGrid);
      }

      // Track edited row
      const rowId = Number(item['ID']);
      if (rowId > 0) {
        if (!this.editedRowsMap.has(this.activeTabId)) {
          this.editedRowsMap.set(this.activeTabId, new Map());
        }
        this.editedRowsMap.get(this.activeTabId)!.set(rowId, item);
      }
    }
  }

  // Legacy Tabulator method
  private recalculateRow(row: any) {
    const data = row.getData();

    // Lấy các giá trị cần thiết từ dòng
    const unitPrice = Number(data.UnitPrice) || 0;
    const importPrice = Number(data.UnitImportPrice) || 0;
    const quantity = Number(data.Quantity) || 0;
    const vat = Number(data.VAT) || 0;
    const currencyRate = Number(data.CurrencyRate) || 1;

    // Tính toán lại
    const totalPrice = unitPrice * quantity;
    const totalPriceImport = quantity * importPrice;
    const totalVAT = totalPrice + (totalPrice * vat) / 100;
    const totalPriceExchange = totalPrice * currencyRate;

    const leadtime = Number(data.TotalDayLeadTime);
    // Sử dụng DateTime để tạo ngày dự kiến
    const dateexpect = this.AddWeekdays(DateTime.local().toJSDate(), leadtime);
    // Chuyển đổi Date thành ISO string để Tabulator hiển thị đúng
    const dateExpectedISO = DateTime.fromJSDate(dateexpect).toISO();

    // Cập nhật lại các cột liên quan
    row.update({
      DateExpected: dateExpectedISO, // Chuyển đổi sang ISO string
      TotalImportPrice: totalPriceImport,
      TotalPrice: totalPrice,
      TotaMoneyVAT: totalVAT,
      TotalPriceExchange: totalPriceExchange,
    });
  }

  // Legacy Tabulator method - deprecated, use OnCurrencyChangedSlickGrid instead
  OnCurrencyChanged(cell: any) {
    // This method is for Tabulator - deprecated, use OnCurrencyChangedSlickGrid instead
    return;
  }
  // Handle supplier changed for Angular SlickGrid
  OnSupplierSaleChangedSlickGrid(item: any): void {
    const supplierId = Number(item.SupplierSaleID);
    const supplier = this.dtSupplierSale.find(
      (p: { ID: number }) => p.ID === supplierId
    );

    if (supplier) {
      item.CodeNCC = supplier.CodeNCC || '';

      // Update in grid
      const angularGrid = this.angularGrids.get(this.activeTabId);
      if (angularGrid && item.id) {
        angularGrid.dataView.updateItem(item.id, item);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
        // Đảm bảo checkbox selector vẫn được enable sau khi render
        this.ensureCheckboxSelector(angularGrid);
      }

      // Track edited row
      const rowId = Number(item['ID']);
      if (rowId > 0) {
            if (!this.editedRowsMap.has(this.activeTabId)) {
              this.editedRowsMap.set(this.activeTabId, new Map());
            }
        this.editedRowsMap.get(this.activeTabId)!.set(rowId, item);
      }
    }
  }

  // Legacy Tabulator method - deprecated, use OnSupplierSaleChangedSlickGrid instead
  OnSupplierSaleChanged(cell: any) {
    // This method is for Tabulator - deprecated, use OnSupplierSaleChangedSlickGrid instead
    return;
  }
  QuotePrice(status: number = 2): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;

    // Map trạng thái
    const STATUS_TEXT: { [key: number]: string } = {
      0: 'Hủy hoàn thành',
      1: 'Hủy báo giá',
      2: 'Báo giá',
      3: 'Hoàn thành',
    };

    const statusText = STATUS_TEXT[status] || '';
    const selectedRows = this.getSelectedGridData(this.activeTabId);

    // Validate chọn dòng
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${statusText}!`
      );
      return;
    }

    // Validate dữ liệu trước (chỉ validate khi status = 0 hoặc 2, không validate khi status = 1 hoặc 3)
    const shouldValidate = status !== 1 && status !== 3; // Chỉ validate khi Báo giá (2) hoặc Hủy hoàn thành (0)

    if (shouldValidate) {
      const isAdmin = this.appUserService.isAdmin || false;
      const currentEmployeeID = this.appUserService.employeeID || 0;

      for (const rowData of selectedRows) {
        const id = Number(rowData['ID']);
        if (id <= 0) continue;

        // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
        const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          continue; // Bỏ qua sản phẩm không phải của mình khi validate
        }

        const productCode = rowData['ProductCode'] || '';
        const currencyId = Number(rowData['CurrencyID'] || 0);
        const currencyRate = Number(rowData['CurrencyRate'] || 0);
        const unitPrice = Number(rowData['UnitPrice'] || 0);
        const supplierSaleId = Number(rowData['SupplierSaleID'] || 0);

        // Lấy currency code để hiển thị trong thông báo lỗi
        let currencyCode = '';
        if (currencyId > 0 && this.dtcurrency) {
          const currency = this.dtcurrency.find((c: any) => c.ID === currencyId);
          currencyCode = currency ? currency.Code : '';
        }

        if (currencyId <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Loại tiền mã sản phẩm [${productCode}]!`
          );
          return;
        }

        if (currencyRate <= 0) {
          this.notification.warning(
            'Thông báo',
            `Tỷ giá của [${currencyCode}] phải > 0.\nVui lòng kiểm tra lại Ngày hết hạn!`
          );
          return;
        }

        if (unitPrice <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Đơn giá mã sản phẩm [${productCode}]!`
          );
          return;
        }

        if (supplierSaleId <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Nhà cung cấp mã sản phẩm [${productCode}]!`
          );
          return;
        }
      }
    }

    // Xử lý dữ liệu update (chỉ update những dòng của mình hoặc admin)
    const updateData: any[] = [];
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;

    // Helper function để chuyển đổi date sang ISO string hoặc null
    const formatDate = (value: any): string | null => {
      if (!value) return null;
      if (value instanceof Date) {
        return DateTime.fromJSDate(value).toISO();
      }
      if (typeof value === 'string') {
        const dt = DateTime.fromISO(value);
        if (dt.isValid) return dt.toISO();
        // Thử các format khác
        const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
        for (const format of formats) {
          const dt2 = DateTime.fromFormat(value, format);
          if (dt2.isValid) return dt2.toISO();
        }
      }
      return null;
    };

    // Helper function để chuyển đổi số
    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Helper function để chuyển đổi boolean
    const toBoolean = (value: any): boolean | null => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') return value;
      if (value === 1 || value === '1' || value === 'true' || value === true) return true;
      if (value === 0 || value === '0' || value === 'false' || value === false) return false;
      return null;
    };

    // Helper function để chuyển đổi string
    const toString = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str === '' ? null : str;
    };

    for (const rowData of selectedRows) {
      // selectedRows từ getSelectedGridData đã là dữ liệu items, không phải row objects
      const id = Number(rowData['ID']);

      if (id <= 0) continue;

      // Lọc theo QuoteEmployeeID (chỉ update những sản phẩm của mình hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình
      }

      // Tạo object với toàn bộ model ProjectPartlistPriceRequest
      const quoteData: any = {
        ID: id,
        ProjectPartListID: toNumber(rowData['ProjectPartListID']),
        EmployeeID: toNumber(rowData['EmployeeID']),
        ProductCode: toString(rowData['ProductCode']),
        ProductName: toString(rowData['ProductName']),
        StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
        DateRequest: formatDate(rowData['DateRequest']),
        Deadline: formatDate(rowData['Deadline']),
        Quantity: toNumber(rowData['Quantity']),
        UnitPrice: toNumber(rowData['UnitPrice']),
        TotalPrice: toNumber(rowData['TotalPrice']),
        Unit: toString(rowData['Unit'] || rowData['UnitName'] || rowData['UnitCount']),
        SupplierSaleID: toNumber(rowData['SupplierSaleID']),
        Note: toString(rowData['Note']),
        CreatedBy: toString(rowData['CreatedBy']),
        CreatedDate: formatDate(rowData['CreatedDate']),
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: DateTime.local().toISO(),
        // Xử lý DatePriceQuote theo logic WinForm
        DatePriceQuote: status === 1 ? null : (status === 2 ? DateTime.local().toISO() : formatDate(rowData['DatePriceQuote'])),
        TotalPriceExchange: toNumber(rowData['TotalPriceExchange']),
        CurrencyRate: toNumber(rowData['CurrencyRate']),
        CurrencyID: toNumber(rowData['CurrencyID']),
        HistoryPrice: toNumber(rowData['HistoryPrice']),
        LeadTime: toString(rowData['LeadTime']),
        UnitFactoryExportPrice: toNumber(rowData['UnitFactoryExportPrice']),
        UnitImportPrice: toNumber(rowData['UnitImportPrice']),
        TotalImportPrice: toNumber(rowData['TotalImportPrice']),
        IsImport: toBoolean(rowData['IsImport']),
        IsDeleted: toBoolean(rowData['IsDeleted']),
        QuoteEmployeeID: !isAdmin ? currentEmployeeID : toNumber(rowData['QuoteEmployeeID']),
        IsCheckPrice: toBoolean(rowData['IsCheckPrice']),
        VAT: toNumber(rowData['VAT']),
        TotaMoneyVAT: toNumber(rowData['TotaMoneyVAT']),
        TotalDayLeadTime: toNumber(rowData['TotalDayLeadTime']),
        DateExpected: formatDate(rowData['DateExpected']),
        POKHDetailID: toNumber(rowData['POKHDetailID']),
        IsCommercialProduct: toBoolean(rowData['IsCommercialProduct']),
        Maker: toString(rowData['Maker'] || rowData['Manufacturer']),
        IsJobRequirement: toBoolean(rowData['IsJobRequirement']),
        NoteHR: toString(rowData['NoteHR']),
        JobRequirementID: toNumber(rowData['JobRequirementID']),
        IsRequestBuy: toBoolean(rowData['IsRequestBuy']),
        ProjectPartlistPriceRequestTypeID: toNumber(rowData['ProjectPartlistPriceRequestTypeID']),
        ReasonUnPrice: toString(rowData['ReasonUnPrice']),
        EmployeeIDUnPrice: toNumber(rowData['EmployeeIDUnPrice']),
      };

      // Chỉ set QuoteEmployeeID khi KHÔNG phải admin (giống WinForm)
      if (!isAdmin) {
        quoteData.QuoteEmployeeID = currentEmployeeID;
      }

      // Xử lý DatePriceQuote theo logic WinForm
      if (status === 1) {
        // Hủy báo giá
        quoteData.DatePriceQuote = null;
      } else if (status === 2) {
        // Báo giá
        quoteData.DatePriceQuote = new Date();
      }
      // Nếu status khác (0, 3) thì không set DatePriceQuote, backend sẽ giữ nguyên

      updateData.push(quoteData);
    }

    // Kiểm tra nếu không có dòng nào hợp lệ
    if (updateData.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu thay đổi để cập nhật!'
      );
      return;
    }

    // Confirm trước khi update
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Gọi API quote-price
        this.PriceRequetsService.quotePrice(updateData).subscribe({
          next: (response: any) => {
            if (response?.status === 1) {
              this.notification.success('Thông báo', response?.message || `${statusText} thành công!`);

              // Nếu là báo giá (status = 2), gọi API send-mail với data của các dòng đã chọn
              if (status === 2) {
                // Lấy data đầy đủ từ các dòng đã chọn và map sang format MailItemPriceRequestDTO
                // selectedRows từ getSelectedGridData() đã là dữ liệu items trực tiếp
                const mailData = selectedRows.map((rowData) => {

                  // Map data sang format MailItemPriceRequestDTO
                  return {
                    EmployeeID: Number(rowData['EmployeeID'] || 0),
                    QuoteEmployee: String(rowData['QuoteEmployee'] || rowData['FullNameQuote'] || ''),
                    ProjectCode: String(rowData['ProjectCode'] || ''),
                    ProductCode: String(rowData['ProductCode'] || ''),
                    ProductName: String(rowData['ProductName'] || ''),
                    Manufacturer: String(rowData['Manufacturer'] || rowData['Maker'] || ''),
                    Quantity: Number(rowData['Quantity'] || 0),
                    Unit: String(rowData['Unit'] || rowData['UnitName'] || rowData['UnitCount'] || ''),
                    DateRequest: rowData['DateRequest'] ? (() => {
                      const date = rowData['DateRequest'];
                      if (date instanceof Date) return date.toISOString();
                      if (typeof date === 'string') {
                        const dt = DateTime.fromISO(date);
                        return dt.isValid ? dt.toISO() : null;
                      }
                      return null;
                    })() : null,
                    Deadline: rowData['Deadline'] ? (() => {
                      const date = rowData['Deadline'];
                      if (date instanceof Date) return date.toISOString();
                      if (typeof date === 'string') {
                        const dt = DateTime.fromISO(date);
                        return dt.isValid ? dt.toISO() : null;
                      }
                      return null;
                    })() : null,
                    DatePriceQuote: rowData['DatePriceQuote'] ? (() => {
                      const date = rowData['DatePriceQuote'];
                      if (date instanceof Date) return date.toISOString();
                      if (typeof date === 'string') {
                        const dt = DateTime.fromISO(date);
                        return dt.isValid ? dt.toISO() : null;
                      }
                      return null;
                    })() : null,
                    CurrencyID: Number(rowData['CurrencyID'] || 0),
                    UnitPrice: Number(rowData['UnitPrice'] || 0),
                    TotalPrice: Number(rowData['TotalPrice'] || 0),
                    TotalPriceExchange: Number(rowData['TotalPriceExchange'] || 0),
                  };
                });

                // Gọi API send-mail
                this.PriceRequetsService.sendMail(mailData).subscribe({
                  next: (mailResponse: any) => {
                    // Không cần hiển thị thông báo riêng cho send-mail, chỉ log nếu cần
                    if (mailResponse?.status !== 1) {
                      console.warn('Send mail response:', mailResponse);
                    }
                  },
                  error: (mailError) => {
                    // Log lỗi nhưng không hiển thị thông báo lỗi để không làm gián đoạn flow
                    console.error('Error sending mail:', mailError);
                  },
                });
              }

              this.LoadPriceRequests(); // Reload data
            } else {
              this.notification.warning('Thông báo', response?.message || `${statusText} thất bại!`);
            }
          },
          error: (error) => {
            console.error('Error quoting price:', error);
            this.notification.error('Lỗi', error?.error?.message || `Có lỗi xảy ra khi ${statusText}!`);
          },
        });
      },
    });
  }

  // Cập nhật phương thức CheckPrice để sử dụng hàm chung
  CheckPrice(isCheckPrice: boolean): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;

    const isCheckText = isCheckPrice ? 'Check giá' : 'Huỷ check giá';
    const selectedRows = this.getSelectedGridData(this.activeTabId);

    if (selectedRows.length <= 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${isCheckText}!`
      );
      return;
    }

    // Message xác nhận với thông báo đặc biệt khi check giá
    const message = isCheckPrice
      ? '\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!'
      : '';

    // Xác nhận thao tác
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isCheckText} danh sách sản phẩm đã chọn không?${message}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lọc các dòng hợp lệ ở frontend (validate trước khi gửi lên backend)
        const updateData: any[] = [];

        selectedRows.forEach((rowData) => {
          const id = Number(rowData['ID']);

          if (id <= 0) return; // Bỏ qua ID không hợp lệ

          // Validate ở frontend: Khi check giá, chỉ cho phép check nếu chưa có QuoteEmployeeID hoặc QuoteEmployeeID là của mình
          if (isCheckPrice) {
            const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
            const currentEmployeeID = this.appUserService.employeeID || 0;

            // Nếu đã có người khác check rồi thì bỏ qua (giống WinForm và backend logic)
            if (quoteEmployeeID > 0 && quoteEmployeeID !== currentEmployeeID) {
              return;
            }
          } else {
            const statusRequest = Number(rowData['StatusRequest'] || 0);

            if (statusRequest === 2) {
              return;
            }

            if (statusRequest !== 1) {
              return;
            }
          }
          updateData.push({
            ID: id,
            IsCheckPrice: isCheckPrice,
            QuoteEmployeeID: this.appUserService.employeeID,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toJSDate(),
          });
        });
        console.log(updateData);
        if (updateData.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Không có dữ liệu thay đổi để cập nhật!'
          );
          return;
        }

        this.PriceRequetsService.checkPrice(updateData).subscribe({
          next: (response: any) => {
            if (response?.status === 1 || response?.success) {
              this.notification.success('Thông báo', `${isCheckText} thành công!`);
              this.LoadPriceRequests(); // Reload data
            } else {
              this.notification.warning('Thông báo', `${isCheckText} thất bại!`);
            }
          },
          error: (error) => {
            console.error('Error checking price:', error);
            this.notification.error(
              'Lỗi',
              error?.error?.message || `Có lỗi xảy ra khi ${isCheckText}!`
            );
          },
        });
      },
    });
  }

  RejectPriceRequest(status: number = 5): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;
    const selectedRowIndices = angularGrid.slickGrid.getSelectedRows();
    if (selectedRowIndices.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn sản phẩm muốn từ chối!'
      );
      return;
    }

    const selectedRows = selectedRowIndices.map((rowIndex: number) => {
      return angularGrid.dataView.getItem(rowIndex);
    }).filter((item: any) => item != null);

    const invalids: string[] = [];
    // selectedRows từ dataView.getItem() đã là dữ liệu items trực tiếp
    selectedRows.forEach((rowData: any) => {
      const cur = Number(rowData['StatusRequest'] || 0);
      // Không thể từ chối nếu đã từ chối (status = 5)
      if (cur === 5) {
        invalids.push(`[${rowData['ProductCode']}] đã bị từ chối trước đó`);
      }
      // Không thể từ chối nếu đã báo giá (status = 2)
      if (cur === 2) {
        invalids.push(`[${rowData['ProductCode']}] đã ở trạng thái Đã báo giá, không thể từ chối`);
      }
      // Không thể từ chối nếu đã hoàn thành (status = 3)
      if (cur === 3) {
        invalids.push(`[${rowData['ProductCode']}] đã hoàn thành, không thể từ chối`);
      }
    });
    if (invalids.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, invalids[0]);
      return;
    }

    this.lastSelectedRowsForReject = selectedRows;
    this.rejectReason = '';

    this.modal.create({
      nzTitle: 'Từ chối báo giá',
      nzContent: this.rejectReasonTpl,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const reason = (this.rejectReason || '').trim();
        if (!reason) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng nhập lý do từ chối!'
          );
          return false;
        }
        this.performUpdateRejectStatus(status, reason);
        return true;
      },
    });
  }

  CancelRejectPriceRequest(): void {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;
    const selectedRowIndices = angularGrid.slickGrid.getSelectedRows();
    if (selectedRowIndices.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn sản phẩm muốn hủy từ chối!'
      );
      return;
    }
    const selectedRows = selectedRowIndices.map((rowIndex: number) => {
      return angularGrid.dataView.getItem(rowIndex);
    }).filter((item: any) => item != null);
    const invalids: string[] = [];
    const listModel = selectedRows.map((row: any) => {
      const data = row;
      const cur = Number(data['StatusRequest'] || 0);
      // Chỉ có thể hủy từ chối nếu status hiện tại = 5 (đã từ chối)
      if (cur !== 5) {
        invalids.push(`[${data['ProductCode']}] chưa bị từ chối`);
      }
      return {
        ID: Number(data['ID']),
        StatusRequest: 1,
        UpdatedBy: this.appUserService.loginName,
        EmployeeIDUnPrice: this.appUserService.employeeID,
        ReasonUnPrice: ''
      };
    }).filter(x => x.ID > 0);

    if (invalids.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, invalids[0]);
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent:
        'Bạn có chắc muốn Hủy từ chối danh sách sản phẩm đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = { ListModel: listModel, ListDataMail: [] };
        this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              let message = res?.message || 'Hủy từ chối thành công';
              // Hiển thị thông tin về sản phẩm không hợp lệ nếu có
              if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
                const invalidList = res.invalidProducts.join('\n');
                message += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
              }
              this.notification.success('Thông báo', message);
              this.LoadPriceRequests();
            } else {
              let errorMessage = res?.message || 'Có lỗi xảy ra';
              // Hiển thị danh sách sản phẩm không hợp lệ nếu có
              if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
                const invalidList = res.invalidProducts.join('\n');
                errorMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
              }
              this.notification.warning(NOTIFICATION_TITLE.warning, errorMessage);
            }
          },
          error: (err: any) => {
            const errorMsg = err?.error?.message || 'Có lỗi xảy ra';
            const invalidProducts = err?.error?.invalidProducts;
            let fullMessage = errorMsg;
            if (invalidProducts && Array.isArray(invalidProducts) && invalidProducts.length > 0) {
              const invalidList = invalidProducts.join('\n');
              fullMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
            }
            this.notification.error(NOTIFICATION_TITLE.error, fullMessage);
          }
        });
      },
    });
  }

  private performUpdateRejectStatus(status: number, reason: string): void {
    const listModel = (this.lastSelectedRowsForReject || [])
      .map((data: any) => ({
        ID: Number(data['ID']),
        StatusRequest: status,
        UpdatedBy: this.appUserService.loginName,
        EmployeeIDUnPrice: this.appUserService.employeeID,
        ReasonUnPrice: reason,
      }))
      .filter((x) => x.ID > 0);

    const listDataMail = (this.lastSelectedRowsForReject || [])
      .map((data: any) => ({
        EmployeeID: Number(data['EmployeeID'] || 0),
        ProjectCode: String(data['ProjectCode'] || '').trim(),
        ProductCode: String(data['ProductCode'] || '').trim(),
        ProductName: String(data['ProductName'] || '').trim(),
        Manufacturer: String(
          data['Manufacturer'] || data['Maker'] || ''
        ).trim(),
        UnitCount: String(
          data['Unit'] || data['UnitName'] || data['UnitCount'] || ''
        ).trim(),
        Quantity: Number(data['Quantity'] || 0),
        DateRequest: (() => {
          const v = data['DateRequest'];
          if (!v) return '';
          const d =
            typeof v === 'string'
              ? DateTime.fromISO(v)
              : DateTime.fromJSDate(new Date(v));
          return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
        })(),
        Deadline: (() => {
          const v = data['Deadline'];
          if (!v) return '';
          const d =
            typeof v === 'string'
              ? DateTime.fromISO(v)
              : DateTime.fromJSDate(new Date(v));
          return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
        })(),
      }))
      .filter((x: any) => x.ProductCode);

    const payload = { ListModel: listModel, ListDataMail: listDataMail };
    this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          let message = res?.message || 'Từ chối báo giá thành công';
          // Hiển thị thông tin về sản phẩm không hợp lệ nếu có
          if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
            const invalidList = res.invalidProducts.join('\n');
            message += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
          }
          this.notification.success('Thông báo', message);
          this.LoadPriceRequests();
        } else {
          let errorMessage = res?.message || 'Có lỗi xảy ra';
          // Hiển thị danh sách sản phẩm không hợp lệ nếu có
          if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
            const invalidList = res.invalidProducts.join('\n');
            errorMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
          }
          this.notification.warning(NOTIFICATION_TITLE.warning, errorMessage);
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra';
        const invalidProducts = err?.error?.invalidProducts;
        let fullMessage = errorMsg;
        if (invalidProducts && Array.isArray(invalidProducts) && invalidProducts.length > 0) {
          const invalidList = invalidProducts.join('\n');
          fullMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
        }
        this.notification.error(NOTIFICATION_TITLE.error, fullMessage);
      }
    });
  }

  OpenRequestBuyModal(): void {
    const selectedRows = this.getSelectedGridData(this.activeTabId);
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để yêu cầu mua.'
      );
      return;
    }
    this.lastSelectedRowsForBuy = selectedRows;
    this.requestBuyDeadline = new Date();
    this.requestBuyIsVPP = this.isVPP;
    this.requestBuyJobRequirementID = Number(this.jobRequirementID || 0);

    this.modal.create({
      nzTitle: 'Yêu cầu mua',
      nzContent: this.requestBuyTpl,
      nzOkText: 'Gửi yêu cầu',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        return this.PerformRequestBuy();
      },
    });
  }

  OpenImportExcel(): void {
    const modalRef = this.ngbModal.open(
      ImportExcelProjectPartlistPriceRequestComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
  }

  OpenAddSupplierModal(): void {
    const modalRef = this.ngbModal.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0; // 0 = thêm mới
    modalRef.result.finally(() => {
      // Reload danh sách supplier sau khi đóng modal
      this.GetSupplierSale();
    });
  }

  private validateRequestBuyDeadline(deadline: Date): string | null {
    const now = new Date();
    const d = new Date(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate()
    );
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeSpan =
      Math.floor((d.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;

    if (now.getHours() < 15 && timeSpan < 2) {
      return 'Deadline tối thiểu là 2 ngày từ ngày hiện tại!';
    }
    if (now.getHours() >= 15 && timeSpan < 3) {
      return 'Yêu cầu từ sau 15h nên ngày Deadline tối thiểu là 2 ngày tính từ ngày hôm sau!';
    }
    const dow = d.getDay();
    if (dow === 6 || dow === 0) {
      return 'Deadline phải là ngày làm việc (T2 - T6)!';
    }
    return null;
  }

  private PerformRequestBuy(): boolean {
    const deadline = this.requestBuyDeadline as Date | null;
    if (!deadline) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn Deadline!'
      );
      return false;
    }
    const deadlineMsg = this.validateRequestBuyDeadline(deadline as Date);
    if (deadlineMsg) {
      this.notification.warning(NOTIFICATION_TITLE.warning, deadlineMsg);
      return false;
    }

    const products = (this.lastSelectedRowsForBuy || []).map((data: any) => ({
      ProductCode: String(data['ProductCode'] || '').trim(),
      ProductName: String(data['ProductName'] || '').trim(),
      Quantity: Number(data['Quantity'] || 0),
      UnitName: String(
        data['Unit'] || data['UnitName'] || data['UnitCount'] || ''
      ).trim(),
      NoteHR: String(
        data['NoteHR'] || data['HRNote'] || data['Note'] || ''
      ).trim(),
    }));

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stt = i + 1;
      if (!p.ProductCode) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Mã sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }
      if (!p.ProductName) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Tên sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }
      if (!p.UnitName) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập ĐVT tại dòng [${stt}]!`
        );
        return false;
      }
      if (p.Quantity <= 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Số lượng > 0 tại dòng [${stt}]!`
        );
        return false;
      }
    }

    const payload: any = {
      JobRequirementID: this.isVPP
        ? 999999
        : Number(this.jobRequirementID || 0),
      IsVPP: this.isVPP,
      Deadline: deadline,
      EmployeeID: this.appUserService.employeeID,
      ProjectPartlistPriceRequestTypeID:
        this.projectPartlistPriceRequestTypeID > 0
          ? this.projectPartlistPriceRequestTypeID
          : 7,
      Products: products,
    };

    this.PriceRequetsService.requestBuy(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            'Thông báo',
            res?.message || 'Yêu cầu mua đã xử lý xong.'
          );
          this.LoadPriceRequests();
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res?.message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Có lỗi xảy ra'
        );
      },
    });

    return true;
  }

  async ExportToExcelAdvanced() {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) return;

    const workbook = new ExcelJS.Workbook();
    const type = this.projectTypes.find(
      (t) => t.ProjectTypeID === this.activeTabId
    );
    const projectTypeName = type?.ProjectTypeName || 'Danh sách báo giá';
    const sanitizedName = projectTypeName
      .replace(/[\\/?*[\]:]/g, '')
      .substring(0, 31);
    const worksheet = workbook.addWorksheet(sanitizedName);

    // Lấy dữ liệu đã chọn
    const selectedData = this.getSelectedGridData(this.activeTabId);

    if (selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    // Lấy tất cả dữ liệu từ grid để có thể nhóm theo ProjectFullName
    const allData = this.allDataByType.get(this.activeTabId) || this.getGridData(this.activeTabId) || [];

    let columns = this.columnDefinitionsMap.get(this.activeTabId) || [];
    columns = columns.filter((col: Column) => !col.hidden);

    // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
    const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
    const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
    if (supplierIndex >= 0 && !codeNCCExists) {
      const codeNCCColumn = {
        title: 'Mã NCC',
        field: 'CodeNCC',
        hozAlign: 'left',
        headerHozAlign: 'center',
        headerSort: false,
        width: 100,
      } as any;
      columns.splice(supplierIndex, 0, codeNCCColumn);
    }

    // Thêm headers
    const headerRow = worksheet.addRow(columns.map((col: Column) => col.name || col.field));
    headerRow.font = { bold: true, name: 'Tahoma' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Nhóm dữ liệu đã chọn theo ProjectFullName
    const grouped = selectedData.reduce((acc: any, item: any) => {
      const groupKey = item.ProjectFullName || 'Không rõ dự án';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    // Lặp qua từng group và xuất group header + dữ liệu
    for (const groupName of Object.keys(grouped)) {
      const groupRows = grouped[groupName];

      // Thêm dòng Group Header
      const groupHeaderRow = worksheet.addRow([
        `${groupName} (${groupRows.length})`,
      ]);
      groupHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFd9edf7' },
      };
      groupHeaderRow.font = { bold: true, name: 'Tahoma' };
      groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

      // Merge cells từ cột A đến cột cuối cùng
      const lastColumnLetter = this.getColumnLetter(columns.length);
      worksheet.mergeCells(
        `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
      );

      // Thêm các dòng dữ liệu trong nhóm
      groupRows.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];

        // Xử lý null/undefined thành khoảng trống
        if (value === null || value === undefined) {
          return '';
        }

        // Xử lý object rỗng
        if (
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length === 0
        ) {
          return '';
        }

        // Xử lý checkbox: true -> "X", false -> ""
        const fieldName = col.field || '';
        if (fieldName === 'IsCheckPrice') {
          return value ? 'X' : '';
        }

        // Format tiền cho các cột số tiền
        if (
          ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
            col.field
          )
        ) {
          const numValue = Number(value) || 0;
          return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(numValue);
        }

        // Format date columns thành dd/MM/yyyy
        if (
          ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(fieldName)
        ) {
          if (!value) return '';
          // Xử lý nhiều kiểu dữ liệu date
          let dateValue: DateTime | null = null;
          if (value instanceof Date) {
            dateValue = DateTime.fromJSDate(value);
          } else if (typeof value === 'string') {
            dateValue = DateTime.fromISO(value);
            if (!dateValue.isValid) {
              // Thử các format khác
              const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateValue = DateTime.fromFormat(value, format);
                if (dateValue.isValid) break;
              }
            }
          }
          return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
        }

        // Format VAT và TotalDayLeadTime theo en-US
        if (fieldName === 'VAT' || fieldName === 'TotalDayLeadTime') {
          if (value === null || value === undefined || value === '') return '';
          const numValue = Number(value) || 0;
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
          }).format(numValue);
        }

        // Xử lý trường select với lookup
        if (col.field === 'CurrencyID') {
          const currency = this.dtcurrency?.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        }

        if (col.field === 'SupplierSaleID') {
          const supplier = this.dtSupplierSale?.find(
            (s: any) => s.ID === value
          );
          return supplier ? supplier.NameNCC : '';
        }

        if (col.field === 'CodeNCC') {
          // Lấy CodeNCC từ SupplierSaleID
          const supplierId = row['SupplierSaleID'];
          const supplier = this.dtSupplierSale?.find(
            (s: any) => s.ID === supplierId
          );
          return supplier ? (supplier.CodeNCC || '') : '';
        }

        // Xử lý chuỗi rỗng
        if (value === '') {
          return '';
        }

        // Return giá trị bình thường
        return value;
      });
      worksheet.addRow(rowData);
      });

      // Thêm dòng trống giữa các group
      worksheet.addRow([]);
    }

    // Footer tổng cho toàn bảng
    const totalFooterRowData = columns.map((col: Column) => {
      // Kiểm tra xem cột có cần tính tổng không
      if (!this.shouldCalculateSum(col)) return '';

      const values = selectedData.map((r: any) => Number(r[col.field]) || 0);
      const result = values.reduce((a: number, b: number) => a + b, 0);

      // Format tiền cho các cột tiền
      if (
        ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
          col.field || ''
        ) && typeof result === 'number'
      ) {
        return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(result);
      }

      // Format số cho các cột số khác
      if (col.field === 'Quantity' || col.field === 'TotalDayLeadTime') {
        return this.formatNumberEnUS(result, col.field === 'Quantity' ? 2 : 0);
      }

      return result;
    });

    // Thêm label "Tổng cộng" vào cột đầu tiên
    if (totalFooterRowData.some((val: any) => val !== '')) {
      totalFooterRowData[0] = 'Tổng cộng';
      const totalFooterRow = worksheet.addRow(totalFooterRowData);
      totalFooterRow.font = { bold: true, name: 'Tahoma' };
      totalFooterRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }

    // Set column width từ Angular SlickGrid columns
    const activeAngularGrid = this.angularGrids.get(this.activeTabId);
    const slickGridColumns = activeAngularGrid?.slickGrid.getColumns() || [];
    worksheet.columns = columns.map((colDef: any, index: number) => {
      let width = 15; // default width

      // Lấy width từ Angular SlickGrid column object (width thực tế đang hiển thị)
      const slickGridCol = slickGridColumns[index];
      if (slickGridCol && slickGridCol.width) {
        const actualWidth = slickGridCol.width;
        if (actualWidth && actualWidth > 0) {
          // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
          width = Math.max(actualWidth / 7, 8); // Minimum width 8
          width = Math.min(width, 50); // Maximum width 50
        }
      }

      // Nếu không lấy được từ Tabulator, thử lấy từ column definition
      if (width === 15 && colDef?.width) {
        let colWidth = colDef.width;
        if (typeof colWidth === 'string') {
          if (colWidth.includes('vh')) {
            colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
          } else {
            colWidth = parseFloat(colWidth) || 15;
          }
        }
        // Chuyển đổi từ pixels sang Excel width
        width = Math.max(colWidth / 7, 8);
        width = Math.min(width, 50);
      }

      return { width };
    });

    // Thêm border cho tất cả cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Đặt font Tahoma cho tất cả các cell
        if (!cell.font) {
          cell.font = { name: 'Tahoma' };
        } else {
          cell.font = { ...cell.font, name: 'Tahoma' };
        }

        // Căn giữa cho header và wrapText cho tất cả các cell
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          if (!cell.alignment) {
            cell.alignment = { wrapText: true };
          } else {
            cell.alignment = { ...cell.alignment, wrapText: true };
          }
        }
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `price-request-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  async ExportToExcelTab() {
    const angularGrid = this.angularGrids.get(this.activeTabId);
    if (!angularGrid) {
      this.notification.warning('Thông báo', 'Không tìm thấy bảng dữ liệu.');
      return;
    }

    // Lấy dữ liệu từ Map (local pagination) thay vì gọi API
    const rawData = this.allDataByType.get(this.activeTabId) || [];

      if (rawData.length === 0) {
        this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
        return;
      }

    try {
      let columns = this.columnDefinitionsMap.get(this.activeTabId) || [];
      columns = columns.filter((col: any) => col.hidden !== true);

      // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
      const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
      const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
      if (supplierIndex >= 0 && !codeNCCExists) {
        const codeNCCColumn = {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
        } as any;
        columns.splice(supplierIndex, 0, codeNCCColumn);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo giá');

      // Thêm header
      const headerRow = worksheet.addRow(columns.map((col: Column) => col.name || col.field));
      headerRow.font = { bold: true, name: 'Tahoma' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Nhóm dữ liệu theo ProjectFullName
      const grouped = rawData.reduce((acc: any, item: any) => {
        const groupKey = item.ProjectFullName || 'Không rõ dự án';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {});

      // Lặp qua từng group
      for (const groupName of Object.keys(grouped)) {
        const groupRows = grouped[groupName];

        // Thêm dòng Group Header
        const groupHeaderRow = worksheet.addRow([
          `${groupName} (${groupRows.length})`,
        ]);
        groupHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFd9edf7' },
        };

        groupHeaderRow.font = { bold: true, name: 'Tahoma' };
        groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

        // Merge cells từ cột A đến cột cuối cùng (dựa trên số cột thực tế)
        const lastColumnLetter = this.getColumnLetter(columns.length);
        worksheet.mergeCells(
          `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
        );

        // Thêm các dòng dữ liệu trong nhóm
        groupRows.forEach((row: any) => {
          const rowData = columns.map((col: Column) => {
            const value = row[col.field || ''];

            if (value === null || value === undefined) return '';
            if (typeof value === 'object' && Object.keys(value).length === 0)
              return '';

            // Xử lý checkbox: true -> "X", false -> ""
            const fieldName = col.field || '';
            if (fieldName === 'IsCheckPrice') return value ? 'X' : '';

            // Format tiền cho các cột số tiền
            if (
              ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                fieldName
              )
            ) {
              const numValue = Number(value) || 0;
              return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(numValue);
            }

            // Format date columns thành dd/MM/yyyy
            if (
              ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(fieldName)
            ) {
              if (!value) return '';
              // Xử lý nhiều kiểu dữ liệu date
              let dateValue: DateTime | null = null;
              if (value instanceof Date) {
                dateValue = DateTime.fromJSDate(value);
              } else if (typeof value === 'string') {
                dateValue = DateTime.fromISO(value);
                if (!dateValue.isValid) {
                  // Thử các format khác
                  const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                  for (const format of formats) {
                    dateValue = DateTime.fromFormat(value, format);
                    if (dateValue.isValid) break;
                  }
                }
              }
              return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
            }

            // Format VAT và TotalDayLeadTime theo en-US
            if (col.field === 'VAT' || col.field === 'TotalDayLeadTime') {
              if (value === null || value === undefined || value === '') return '';
              const numValue = Number(value) || 0;
              return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
              }).format(numValue);
            }

            if (col.field === 'CurrencyID') {
              const currency = this.dtcurrency?.find(
                (c: any) => c.ID === value
              );
              return currency ? currency.Code : '';
            }

            if (col.field === 'SupplierSaleID') {
              const supplier = this.dtSupplierSale?.find(
                (s: any) => s.ID === value
              );
              return supplier ? supplier.NameNCC : '';
            }

            if (col.field === 'CodeNCC') {
              // Lấy CodeNCC từ SupplierSaleID
              const supplierId = row['SupplierSaleID'];
              const supplier = this.dtSupplierSale?.find(
                (s: any) => s.ID === supplierId
              );
              return supplier ? (supplier.CodeNCC || '') : '';
            }

            return value;
          });

          worksheet.addRow(rowData);
        });
      }

      // Footer tổng cho toàn bảng
      const totalFooterRowData = columns.map((col: Column) => {
        // Kiểm tra xem cột có cần tính tổng không
        if (!this.shouldCalculateSum(col)) return '';

        const values = rawData.map((r: any) => Number(r[col.field]) || 0);
        const result = values.reduce((a: number, b: number) => a + b, 0);

        // Format tiền cho các cột tiền
        if (
          ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
            col.field || ''
          ) && typeof result === 'number'
        ) {
          return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(result);
        }

        // Format số cho các cột số khác
        if (col.field === 'Quantity' || col.field === 'TotalDayLeadTime') {
          return this.formatNumberEnUS(result, col.field === 'Quantity' ? 2 : 0);
        }

        return result;
      });

      // Thêm label "Tổng cộng" vào cột đầu tiên
      if (totalFooterRowData.some((val: any) => val !== '')) {
        totalFooterRowData[0] = 'Tổng cộng';
        const totalFooterRow = worksheet.addRow(totalFooterRowData);
        totalFooterRow.font = { bold: true, name: 'Tahoma' };
        totalFooterRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // Set column width từ Angular SlickGrid columns
      const slickGridColumns = angularGrid?.slickGrid.getColumns() || [];
      worksheet.columns = columns.map((colDef: any, index: number) => {
        let width = 15; // default width

        // Lấy width từ Angular SlickGrid column object (width thực tế đang hiển thị)
        const slickGridCol = slickGridColumns[index];
        if (slickGridCol && slickGridCol.width) {
          const actualWidth = slickGridCol.width;
          if (actualWidth && actualWidth > 0) {
            // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
            width = Math.max(actualWidth / 7, 8); // Minimum width 8
            width = Math.min(width, 50); // Maximum width 50
          }
        }

        // Nếu không lấy được từ Tabulator, thử lấy từ column definition
        if (width === 15 && colDef?.width) {
          let colWidth = colDef.width;
          if (typeof colWidth === 'string') {
            if (colWidth.includes('vh')) {
              colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
            } else {
              colWidth = parseFloat(colWidth) || 15;
            }
          }
          // Chuyển đổi từ pixels sang Excel width
          width = Math.max(colWidth / 7, 8);
          width = Math.min(width, 50);
        }

        return { width };
      });

      // Viền ô
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Đặt font Tahoma cho tất cả các cell
          if (!cell.font) {
            cell.font = { name: 'Tahoma' };
          } else {
            cell.font = { ...cell.font, name: 'Tahoma' };
          }

          // WrapText cho tất cả các cell
          if (rowNumber === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
          }
        });
      });

      // Tạo & tải file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `price-request-full-${new Date().toISOString().split('T')[0]
        }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error(error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Đã xảy ra lỗi khi xuất Excel. Vui lòng thử lại sau.'
      );
    }
  }
  async ExportAllTabsToExcel() {
    const workbook = new ExcelJS.Workbook();

    // Lấy các tab đang hiển thị
    const visibleTypes = this.getVisibleProjectTypes();

    for (const type of visibleTypes) {
      const projectTypeID = type.ProjectTypeID;
      const angularGrid = this.angularGrids.get(projectTypeID);

      // Vẫn tạo sheet cho tab dù không có grid hoặc không có dữ liệu
      let columns: any[] = [];
      if (angularGrid) {
        columns = this.columnDefinitionsMap.get(projectTypeID) || [];
        columns = columns.filter((col: any) => col.hidden !== true);
      }

      try {
        // Lấy dữ liệu từ Map (local pagination) thay vì từ grid
        const rawData = this.allDataByType.get(projectTypeID) || [];

        // Nếu không có columns (không có grid), lấy từ grid đầu tiên có columns
        if (columns.length === 0 && this.angularGrids.size > 0) {
          const firstGridId = Array.from(this.angularGrids.keys())[0];
          const firstGrid = this.angularGrids.get(firstGridId);
          if (firstGrid) {
            columns = this.columnDefinitionsMap.get(firstGridId) || [];
            columns = columns.filter((col: any) => col.hidden !== true);
          }
        }

        // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
        const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
        const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
        if (supplierIndex >= 0 && !codeNCCExists) {
          const codeNCCColumn: any = {
            title: 'Mã NCC',
            field: 'CodeNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerSort: false,
            width: 100,
          };
          columns.splice(supplierIndex, 0, codeNCCColumn);
        }

        const sheetName = (
          type.ProjectTypeName || `Sheet-${projectTypeID}`
        ).replace(/[\\/?*[\]]/g, '');

        // Giới hạn tên sheet tối đa 31 ký tự (Excel limit)
        const finalSheetName = sheetName.substring(0, 31);
        const sheet = workbook.addWorksheet(finalSheetName);

        // Add header row
        if (columns.length > 0) {
        const headerRow = sheet.addRow(columns.map((col: Column) => col.name || col.field || ''));
        headerRow.font = { bold: true, name: 'Tahoma' };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }

        // Nếu không có dữ liệu, thêm dòng thông báo
        if (!rawData || rawData.length === 0) {
          const noDataRow = sheet.addRow(['Không có dữ liệu']);
          noDataRow.font = { italic: true, name: 'Tahoma' };
          noDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
          // Merge cells nếu có nhiều cột
          if (columns.length > 1) {
            const lastColumnLetter = this.getColumnLetter(columns.length);
            sheet.mergeCells(`A${noDataRow.number}:${lastColumnLetter}${noDataRow.number}`);
          }
        } else {
        // Group dữ liệu theo ProjectFullName
        const grouped = rawData.reduce((acc: any, item: any) => {
          const groupKey = item.ProjectFullName || 'Không rõ dự án';
          if (!acc[groupKey]) acc[groupKey] = [];
          acc[groupKey].push(item);
          return acc;
        }, {});

        for (const groupName of Object.keys(grouped)) {
          const groupRows = grouped[groupName];

          // Group header
          const groupHeader = sheet.addRow([
            `${groupName} (${groupRows.length})`,
          ]);
          groupHeader.font = { bold: true, name: 'Tahoma' };
          groupHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFd9edf7' },
          };
          groupHeader.alignment = { wrapText: true };
          // Merge cells từ cột A đến cột cuối cùng
          const lastColumnLetter = this.getColumnLetter(columns.length);
          sheet.mergeCells(
            `A${groupHeader.number}:${lastColumnLetter}${groupHeader.number}`
          );

          // Dữ liệu trong group
          groupRows.forEach((row: any) => {
            const rowData = columns.map((col: any) => {
              const value = row[col.field];

              if (
                value == null ||
                (typeof value === 'object' && Object.keys(value).length === 0)
              )
                return '';

              // Xử lý checkbox: true -> "X", false -> ""
              if (col.field === 'IsCheckPrice' || col.field === 'IsImport') return value ? 'X' : '';

              // Format tiền cho các cột số tiền
              if (
                ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                  col.field
                )
              ) {
                const numValue = Number(value) || 0;
                return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(numValue);
              }

              // Format date columns thành dd/MM/yyyy
              if (
                ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(
                  col.field
                )
              ) {
                if (!value) return '';
                // Xử lý nhiều kiểu dữ liệu date
                let dateValue: DateTime | null = null;
                if (value instanceof Date) {
                  dateValue = DateTime.fromJSDate(value);
                } else if (typeof value === 'string') {
                  dateValue = DateTime.fromISO(value);
                  if (!dateValue.isValid) {
                    // Thử các format khác
                    const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                    for (const format of formats) {
                      dateValue = DateTime.fromFormat(value, format);
                      if (dateValue.isValid) break;
                    }
                  }
                }
                return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
              }

              // Format VAT và TotalDayLeadTime theo en-US
              if (col.field === 'VAT' || col.field === 'TotalDayLeadTime') {
                if (value === null || value === undefined || value === '') return '';
                const numValue = Number(value) || 0;
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
                }).format(numValue);
              }

              if (col.field === 'CurrencyID') {
                const cur = this.dtcurrency?.find((c) => c.ID === value);
                return cur ? cur.Code : '';
              }
              if (col.field === 'SupplierSaleID') {
                const sup = this.dtSupplierSale?.find((s) => s.ID === value);
                return sup ? sup.NameNCC : '';
              }
              return value;
            });

            sheet.addRow(rowData);
          });

          // Footer bottomCalc
          const footerRowData = columns.map((col: Column) => {
            // Kiểm tra xem cột có cần tính tổng không
            if (!this.shouldCalculateSum(col)) return '';

            const values = groupRows.map((r: any) => Number(r[col.field]) || 0);
            const result = values.reduce((a: number, b: number) => a + b, 0);

            // Format tiền cho các cột tiền
            if (
              ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                col.field || ''
              ) && typeof result === 'number'
            ) {
              return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(result);
            }

            // Format số cho các cột số khác
            if (col.field === 'Quantity' || col.field === 'TotalDayLeadTime') {
              return this.formatNumberEnUS(result, col.field === 'Quantity' ? 2 : 0);
            }

            return result;
          });

          const footerRow = sheet.addRow(footerRowData);
          footerRow.font = { bold: true, name: 'Tahoma' };
          footerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' },
          };
          footerRow.alignment = { wrapText: true };
          sheet.addRow([]); // dòng trống giữa nhóm
        }

        // Footer tổng cho toàn bảng
        const totalFooterRowData = columns.map((col: Column) => {
          // Kiểm tra xem cột có cần tính tổng không
          if (!this.shouldCalculateSum(col)) return '';

          const values = rawData.map((r: any) => Number(r[col.field]) || 0);
          const result = values.reduce((a: number, b: number) => a + b, 0);

          // Format tiền cho các cột tiền
          if (
            ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
              col.field || ''
            ) && typeof result === 'number'
          ) {
            return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(result);
          }

          // Format số cho các cột số khác
          if (col.field === 'Quantity' || col.field === 'TotalDayLeadTime') {
            return this.formatNumberEnUS(result, col.field === 'Quantity' ? 2 : 0);
          }

          return result;
        });

        // Thêm label "Tổng cộng" vào cột đầu tiên
        if (totalFooterRowData.some((val: any) => val !== '')) {
          totalFooterRowData[0] = 'Tổng cộng';
          const totalFooterRow = sheet.addRow(totalFooterRowData);
          totalFooterRow.font = { bold: true, name: 'Tahoma' };
          totalFooterRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' },
          };
          totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        }

        // Set column width từ Angular SlickGrid columns - áp dụng cho cả trường hợp có và không có dữ liệu
        let slickGridColumns: any[] = [];
        if (angularGrid) {
          slickGridColumns = angularGrid.slickGrid.getColumns() || [];
        }
        sheet.columns = columns.map((colDef: any, index: number) => {
          let width = 15; // default width

          // Lấy width từ Angular SlickGrid column object (width thực tế đang hiển thị)
          const slickGridCol = slickGridColumns[index];
          if (slickGridCol && slickGridCol.width) {
            const actualWidth = slickGridCol.width;
            if (actualWidth && actualWidth > 0) {
              // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
              width = Math.max(actualWidth / 7, 8); // Minimum width 8
              width = Math.min(width, 50); // Maximum width 50
            }
          }

          // Nếu không lấy được từ Tabulator, thử lấy từ column definition
          if (width === 15 && colDef?.width) {
            let colWidth = colDef.width;
            if (typeof colWidth === 'string') {
              if (colWidth.includes('vh')) {
                colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
              } else {
                colWidth = parseFloat(colWidth) || 15;
              }
            }
            // Chuyển đổi từ pixels sang Excel width
            width = Math.max(colWidth / 7, 8);
            width = Math.min(width, 50);
          }

          return { width };
        });

        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            // Đặt font Tahoma cho tất cả các cell
            if (!cell.font) {
              cell.font = { name: 'Tahoma' };
            } else {
              cell.font = { ...cell.font, name: 'Tahoma' };
            }
            // WrapText cho tất cả các cell
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
          });
        });
      } catch (error) {
        console.error(`Lỗi khi export sheet ${type.ProjectTypeName}:`, error);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `price-request-all-tabs-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    // Helper function to get unique values for a field
    const getUniqueValues = (data: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      data.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // Iterate through all project types (tabs)
    this.projectTypes.forEach(projectType => {
      const typeId = projectType.ProjectTypeID;
      const angularGrid = this.angularGrids.get(typeId);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const dataView = angularGrid.dataView;
      if (!dataView) return;

      const data = dataView.getItems();
      if (!data || data.length === 0) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      // Update collections for each filterable column with multipleSelect
      columns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;

          // Handle CurrencyID - use collection from editor
          if (field === 'CurrencyID') {
            const currencyCollection = this.getCurrencyCollection();
            const filteredCollection = currencyCollection.filter(x => x.value > 0);
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle SupplierSaleID - use collection from editor
          else if (field === 'SupplierSaleID') {
            const supplierCollection = this.getSupplierCollection();
            const filteredCollection = supplierCollection.filter(x => x.value > 0);
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle text columns - get unique values from data
          else if (['ProductCode', 'ProjectCode', 'ProductName', 'Manufacturer', 'StatusRequestText', 'FullName'].includes(field)) {
            const collection = getUniqueValues(data, field);
            if (column.filter) {
              column.filter.collection = collection;
            }
          }
        }
      });

      // Update column definitions in the map
      const columnDefs = this.columnDefinitionsMap.get(typeId);
      if (columnDefs) {
        columnDefs.forEach((colDef: any) => {
          if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
            const field = colDef.field;
            if (!field) return;

            // Handle CurrencyID - use collection from editor
            if (field === 'CurrencyID') {
              const currencyCollection = this.getCurrencyCollection();
              const filteredCollection = currencyCollection.filter(x => x.value > 0);
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle SupplierSaleID - use collection from editor
            else if (field === 'SupplierSaleID') {
              const supplierCollection = this.getSupplierCollection();
              const filteredCollection = supplierCollection.filter(x => x.value > 0);
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle text columns - get unique values from data
            else if (['ProductCode', 'ProjectCode', 'ProductName', 'Manufacturer', 'StatusRequestText', 'FullName'].includes(field)) {
              const collection = getUniqueValues(data, field);
              if (colDef.filter) {
                colDef.filter.collection = collection;
              }
            }
          }
        });
      }

      // Force refresh columns
      const updatedColumns = angularGrid.slickGrid.getColumns();
      angularGrid.slickGrid.setColumns(updatedColumns);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
    });
  }
  DownloadFile() {
    const selectedRows = this.getSelectedGridData(this.activeTabId);
    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn 1 sản phẩm muốn tải!'
      );
      return;
    }

    selectedRows.forEach((rowData: any) => {
      const projectId = rowData['ProjectID'];
      const partListId = rowData['ProjectPartListID'];
      const productCode = rowData['ProductCode'];
      if (!productCode) return;

      const requestPayload = {
        projectId,
        partListId,
        productCode,
      };

      this.PriceRequetsService.downloadFile(requestPayload).subscribe({
        next: (response: any) => {
          if (response?.status === 0) {
            this.notification.warning(
              'Thông báo',
              response.message || 'Không thể tải file!'
            );
            return;
          }

          const fileUrl = response?.data || response;
          if (!fileUrl || typeof fileUrl !== 'string') {
            this.notification.warning(
              'Thông báo',
              'Không tìm thấy đường dẫn file!'
            );
            return;
          }

          // Mở URL trong tab mới
          window.open(fileUrl, '_blank');
        },
        error: (error) => {
          const errMsg =
            error?.error?.message || error?.message || 'Đã xảy ra lỗi!';
          this.notification.warning(NOTIFICATION_TITLE.warning, errMsg);
        },
      });
    });
  }

  // Removed popup editor methods - using single select editor instead
  // onSupplierSelected, onSupplierPopupClosed, supplierEditor, dummyEditor, moneyEditor are no longer needed
  // Angular SlickGrid handles editors internally

  // Sửa lại hàm ToggleSearchPanel - responsive và đảm bảo hoạt động trên mọi thiết bị
  ToggleSearchPanelNew(event?: Event) {
    // Ngăn chặn event bubbling và default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    // Chạy trong NgZone để đảm bảo change detection hoạt động
    this.ngZone.run(() => {
      const isMobile = window.innerWidth <= 768;
      const wasOpen = this.showSearchBar;

      // Toggle state một cách rõ ràng và đảm bảo không bị conflict
      // Sử dụng giá trị boolean rõ ràng thay vì toggle trực tiếp
      const newState = !wasOpen;
      this.showSearchBar = newState;

      // Log để debug (có thể xóa sau)
      console.log('ToggleSearchPanelNew:', {
        wasOpen,
        newState,
        showSearchBar: this.showSearchBar,
        isHRDept: this.isHRDept,
        willShow: this.showSearchBar && !this.isHRDept
      });

      // Force change detection ngay lập tức bằng nhiều cách
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick(); // Force application-wide change detection

      // Đảm bảo change detection được trigger bằng nhiều cách
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            this.appRef.tick();
            // Force một lần nữa sau khi DOM cập nhật
            setTimeout(() => {
              this.cdr.detectChanges();
              this.appRef.tick();
            }, 10);
          });
        }, 0);
      });

      // Xử lý body scroll trên mobile
      if (isMobile) {
        if (this.showSearchBar) {
          // Ngăn body scroll khi modal mở
          document.body.style.overflow = 'hidden';
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
        } else {
          // Khôi phục body scroll khi modal đóng
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
        }
      }

      // Resize tất cả các bảng sau khi toggle filter bar
      // Đợi một chút để DOM cập nhật xong
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            // Angular SlickGrid handles auto-resize automatically
            // No need for manual resize
            // Force change detection lại sau khi resize
            this.cdr.detectChanges();
          });
        }, 150);
      });

      // Force change detection để đảm bảo UI cập nhật ngay lập tức
      // Sử dụng requestAnimationFrame để đảm bảo render đúng trên mọi thiết bị
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          this.ngZone.run(() => {
            // Scroll về đầu trang nếu cần (trên mobile khi mở)
            if (isMobile && this.showSearchBar && !wasOpen) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // Force change detection một lần nữa sau khi animation
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          });
        });
      });
    });
  }

  // Removed resizeTableForType and resizeAllTables - Angular SlickGrid handles auto-resize automatically
  createLables(
    data: any[],
    keyField: string = 'ID',
    valueField: string = 'Code'
  ) {
    this.labeln = {};

    data.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.labeln[item[keyField]]) {
        this.labeln[item[keyField]] = item[valueField];
      }
    });
  }
  createLabelsFromData() {
    this.labels = {};

    this.dtcurrency.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.labels[item.ID]) {
        this.labels[item.ID] = item.Code;
      }
    });
  }
  // Removed GetTableConfig - no longer needed with Angular SlickGrid
  // Grid configuration is now handled by initGridOptions()
  // Column definitions are now handled by initGridColumns()

  // Removed old Tabulator column definitions - now using Angular SlickGrid columns defined in initGridColumns()


  /**
   * Helper function để chuyển số cột thành chữ cái (A, B, C, ..., Z, AA, AB, ...)
   */
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }

  /**
   * Helper function để xác định cột có cần tính tổng không
   * Dựa trên groupTotalsFormatter hoặc field name
   */
  private shouldCalculateSum(column: Column): boolean {
    // Các cột có groupTotalsFormatter cần tính tổng
    if (column.groupTotalsFormatter) {
      return true;
    }

    // Các cột số cần tính tổng dựa trên field name
    const sumFields = [
      'Quantity',
      'TotalPrice',
      'TotalPriceExchange',
      'TotaMoneyVAT',
      'TotalImportPrice',
      'TotalDayLeadTime'
    ];

    return sumFields.includes(column.field || '');
  }

  /**
   * Đóng modal khi mở dưới dạng modal
   */
  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  /**
   * Cleanup khi component bị destroy
   */
  ngAfterViewInit(): void {
    // Đợi tab render xong rồi mới load data
    setTimeout(() => {
      this.isTabReady = true;
      this.cdr.detectChanges();
    }, 200);
  }

  ngOnDestroy(): void {
    // Hủy tất cả subscriptions đang chờ
    this.cancelAllDataLoading();

    // Clear all grids
    this.angularGrids.clear();
    this.columnDefinitionsMap.clear();
    this.gridOptionsMap.clear();
    this.datasetsMap.clear();

    // Khôi phục body styles nếu modal đang mở
    if (this.showSearchBar && window.innerWidth <= 768) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}

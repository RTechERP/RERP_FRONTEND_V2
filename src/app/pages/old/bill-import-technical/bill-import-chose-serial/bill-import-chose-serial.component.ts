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
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportChoseSerialService } from './bill-import-chose-serial.service';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { BillImportAddSerialComponent } from './bill-import-add-serial/bill-import-add-serial.component';

//#region Customselect
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
//#endregion

@Component({
  selector: 'app-bill-import-chose-serial',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularSlickgridModule,
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
    NzSplitterModule,
    FormsModule,
  ],
  templateUrl: './bill-import-chose-serial.component.html',
  styleUrls: ['./bill-import-chose-serial.component.css'],
})
export class BillImportChoseSerialComponent implements OnInit, AfterViewInit {
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private billImportChoseSerialService: BillImportChoseSerialService,
    private billImportTechnicalService: BillImportTechnicalService
  ) { }

  @Input() type: any = 0; // 1 phiếu nhập, 2 phiếu xuất
  @Input() dataBillDetail: any = 0; // data thay đổi theo loại phiếu
  @Input() isTechBill: boolean = false; // true phiếu nhập, false phiếu xuất
  @Input() warehouseId: any = null; // true phiếu nhập, false phiếu xuất
  @Input() isBillImport: boolean = false; // true phiếu nhập, false phiếu xuất
  modularGrid: any = [];
  isAddSerial: boolean = true;
  serialData: any = [];
  deletedIds: number[] = [];
  name: string = '';
  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};

  ngOnInit(): void {
    console.log('ngOnInit - isTechBill:', this.isTechBill);
    if (this.type == 1) {
      this.isAddSerial = true;
      this.name = 'phiếu nhập';
    } else {
      this.isAddSerial = false;
      this.name = 'phiếu xuất';
    }
    this.loadLookUpData();
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void { }

  loadLookUpData() {
    if (this.isTechBill) {
      this.billImportChoseSerialService.getLocationModula().subscribe({
        next: (response: any) => {
          this.modularGrid = this.buildModulaCollection(response.data);
          this.initGridColumns();
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách vị trí Modula: ' + (error.message || error)
          );
        },
      });

      this.billImportChoseSerialService
        .getSerialTechByBillDetailID(
          this.dataBillDetail.ID ?? 0,
          this.type,
          this.warehouseId
        )
        .subscribe((res: any) => {
          this.serialData = res.data.map((x: any, index: number) => ({
            ...x,
            STT: index + 1,
          }));

          const currentCount = this.serialData.length;
          const requiredQty = this.dataBillDetail.Quantity || 0;

          if (currentCount < requiredQty) {
            for (let i = currentCount; i < requiredQty; i++) {
              this.serialData.push({
                ID: -(i + 1),
                STT: i + 1,
                SerialNumber: '',
                ModularLocationDetailID: 0,
              });
            }
          }
        });
    } else {
      this.billImportChoseSerialService
        .getSerialByBillDetailID(this.dataBillDetail.ID ?? 0, this.type)
        .subscribe((res: any) => {
          this.serialData = res.data.map((x: any, index: number) => ({
            ...x,
            STT: index + 1,
          }));

          const currentCount = this.serialData.length;
          const requiredQty = this.dataBillDetail.Qty || 0;

          if (currentCount < requiredQty) {
            for (let i = currentCount; i < requiredQty; i++) {
              this.serialData.push({
                ID: -(i + 1),
                STT: i + 1,
                SerialNumber: '',
                SerialNumberRTC: '',
              });
            }
          }
        });
    }
  }

  buildModulaCollection(modulars: any[]) {
    return modulars.map((m) => ({
      value: m.ModulaLocationDetailID,
      label: `${m.LocationName}`,
    }));
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  onGridMasterHeaderClick(e: Event, args: any) {
    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-plus')) {
        let requiredQty = this.isTechBill
          ? this.dataBillDetail.Quantity
          : this.dataBillDetail.Qty;
        if (this.serialData.length == requiredQty) {
          return;
        }
        const newId =
          this.serialData.length > 0
            ? Math.min(...this.serialData.map((x: any) => x.ID)) - 1
            : -1;

        const newRow = {
          ID: newId,
          STT: this.serialData.length + 1,
          ModulaLocationDetailID: 0,
          SerialNumber: '',
          SerialNumberRTC: '',
        };

        this.serialData = [...this.serialData, newRow];
      }
    }
  }

  onGridMasterClick(e: Event, args: OnClickEventArgs) {
    const column = args.grid.getColumns()[args.cell];

    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-trash')) {
        const item = args.grid.getDataItem(args.row);

        this.modal.confirm({
          nzTitle: 'Xác nhận xóa',
          nzContent: `Bạn có chắc chắn muốn xóa serial [${item.STT}] không?`,
          nzOkText: 'Xóa',
          nzCancelText: 'Hủy',
          nzOkDanger: true,
          nzOnOk: () => {
            this.deleteRow(item);
          },
        });
      }
    }
  }

  deleteRow(item: any) {
    // Nếu ID > 0 thì thêm vào list xóa
    if (item.ID > 0 && !this.deletedIds.includes(item.ID)) {
      this.deletedIds.push(item.ID);
    }

    this.serialData = this.serialData.filter((x: any) => x.ID !== item.ID);
    this.serialData = this.serialData.map((x: any, index: number) => ({
      ...x,
      STT: index + 1,
    }));
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail-file',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'Danh sách serial',
        exportWithFormatter: true,
      },
      editable: true,
      autoEdit: true,
    };
  }

  initGridColumns() {
    const baseColumns: Column[] = [
      {
        id: 'action',
        name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm"></i>',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: (_row, _cell, _value, _column, _dataContext) => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa file"></i></div>`;
        },
      },
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
                  title="${dataContext.StatusText ?? ''}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },
      },
      {
        id: 'SerialNumber',
        name: 'Serial',
        field: 'SerialNumber',
        width: 765,
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
    ];

    // Thêm cột ModulaLocationDetailID nếu isTechBill = true
    if (this.isTechBill) {
      baseColumns.push({
        id: 'ModulaLocationDetailID',
        name: 'Vị trí Modula',
        field: 'ModulaLocationDetailID',
        width: 765,
        sortable: true,
        filterable: true,

        formatter: (_row, _cell, value) => {
          if (value == null) return '';

          const found = this.modularGrid.find(
            (x: any) => x.value === Number(value)
          );

          return found?.label ?? '';
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.modularGrid,
          collectionOptions: {
            addBlankEntry: false,
          },
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      });
    }

    // Thêm cột SerialNumberRTC nếu isTechBill = false
    if (!this.isTechBill) {
      baseColumns.push({
        id: 'SerialNumberRTC',
        name: 'Serial Number RTC',
        field: 'SerialNumberRTC',
        width: 765,
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
      });
    }

    this.columnDefinitionsMaster = baseColumns;
  }

  async saveData() {
    // Force commit cell đang edit để lưu giá trị
    if (this.angularGridMaster?.slickGrid) {
      const editController = this.angularGridMaster.slickGrid.getEditorLock();
      if (editController.isActive()) {
        editController.commitCurrentEdit();
      }
    }

    const data = this.serialData;

    // // Validate: kiểm tra SerialNumber không được rỗng
    // const isValid = data.every(
    //   (row: any) => row.SerialNumber && row.SerialNumber.trim() !== ''
    // );
    // if (!isValid) {
    //   this.notification.error(
    //     NOTIFICATION_TITLE.error,
    //     'Vui lòng nhập đầy đủ Serial cho tất cả dòng!'
    //   );
    //   return;
    // }

    // Lấy danh sách serial hợp lệ
    const serialList = data
      .map((r: any) => (r.SerialNumberRTC || '').trim())
      .filter((s: string) => s !== '');

    // Check trùng
    const duplicateSerials = serialList.filter(
      (s: string, i: number) => serialList.indexOf(s) !== i
    );

    if (duplicateSerials.length > 0) {
      const uniqueDup = [...new Set(duplicateSerials)];
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Serial RTC bị trùng: ${uniqueDup.join(', ')}`
      );
      return;
    }

    if (this.isBillImport) {
      this.billImportChoseSerialService
        .getSerialProduct(this.dataBillDetail.ProductID ?? 0)
        .subscribe((res: any) => {
          if (res.data?.length > 0) {
            const duplicateWithDB = data.filter((fe: any) => {
              const feSerial = (fe.SerialNumberRTC || '').trim();
              if (!feSerial) return false;

              return res.data.some(
                (db: any) =>
                  feSerial === (db.SerialNumberRTC || '').trim() &&
                  fe.ID !== db.ID // 🔥 điều kiện quan trọng
              );
            });

            if (duplicateWithDB.length > 0) {
              const uniqueDup = [
                ...new Set(
                  duplicateWithDB.map((x: any) => x.SerialNumberRTC.trim())
                ),
              ];

              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Serial RTC đã tồn tại: ${uniqueDup.join(', ')}`
              );
              return;
            }
          }

          this.SaveDataBill(data);
        });
    } else {
      this.SaveDataBill(data);
    }
  }

  async SaveDataBill(data: any[]) {
    // Chuẩn bị data để save
    const serials = data
      .filter((row: any) => {
        const serial = row.SerialNumber?.trim() || '';
        const serialRTC = row.SerialNumberRTC?.trim() || '';
        const locationId = row.ModulaLocationDetailID ?? 0;
        if (row.ID > 0) return true;
        return serial !== '' || serialRTC !== '' || locationId > 0;
      })
      .map((row: any, index: number) => ({
        BillImportDetailID: this.dataBillDetail.ID ?? 0,
        BillExportDetailID: this.dataBillDetail.ID ?? 0,
        BillExportTechDetailID: this.dataBillDetail.ID ?? 0,
        BillImportTechDetailID: this.dataBillDetail.ID ?? 0,
        ID: row.ID > 0 ? row.ID : 0,
        STT: index + 1,
        SerialNumber: row.SerialNumber?.trim() || '',
        SerialNumberRTC: row.SerialNumberRTC?.trim() || '',
        ModulaLocationDetailID: row.ModulaLocationDetailID,
        WarehouseID: this.warehouseId ?? 1,
      }));

    if (serials.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu serial để lưu!'
      );
      return;
    }

    let payload = {};

    if (this.type == 1) {
      payload = {
        billImportDetailSerialNumbers: serials,
        billExportDetailSerialNumbers: [],
        billImportTechDetailSerials: serials,
        billExportTechDetailSerials: [],
        type: this.type,
        lsDeleted: this.deletedIds,
      };
    } else if (this.type == 2) {
      payload = {
        billImportDetailSerialNumbers: [],
        billExportDetailSerialNumbers: serials,
        billImportTechDetailSerials: [],
        billExportTechDetailSerials: serials,
        type: this.type,
        lsDeleted: this.deletedIds,
      };
    }

    try {
      if (!this.isTechBill) {
        this.billImportChoseSerialService.saveData(payload).subscribe({
          next: (res) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Lưu serial thành công!'
            );
            this.activeModal.close();
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lưu serial thất bại!'
            );
          },
        });
      } else {
        this.billImportChoseSerialService.saveDataTech(payload).subscribe({
          next: (res) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Lưu serial thành công!'
            );
            this.activeModal.close();
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err?.error?.message || err?.message
            );
          },
        });
      }
    } catch (error) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu serial!');
    }
  }

  addSerial() {
    const modalRef = this.modalService.open(BillImportAddSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.quantity = this.dataBillDetail.Qty;
    modalRef.componentInstance.type = this.type;
    modalRef.componentInstance.dataBillDetail = this.dataBillDetail;

    modalRef.result.then(
      (listSerials: any[]) => {
        if (!listSerials || listSerials.length === 0) {
          return;
        }

        // Clone listSerials để xử lý
        const serialsToAssign = [...listSerials];

        // Duyệt qua serialData và gán serial vào các dòng trống
        for (let i = 0; i < this.serialData.length; i++) {
          const serial = this.serialData[i].SerialNumber?.trim() || '';

          // Nếu dòng đã có serial thì bỏ qua
          if (serial) {
            continue;
          }

          // Nếu hết serial để gán thì dừng
          if (serialsToAssign.length === 0) {
            break;
          }

          // Gán serial đầu tiên trong list vào dòng hiện tại
          this.serialData[i].SerialNumber = serialsToAssign[0].SerialNumber;
          this.serialData[i].SerialNumberRTC =
            serialsToAssign[0].SerialNumberRTC;

          // Xóa serial đã gán khỏi list
          serialsToAssign.shift();
        }

        // Trigger update grid
        this.serialData = [...this.serialData];

        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Đã gán ${listSerials.length - serialsToAssign.length
          } serial vào bảng!`
        );
      },
      () => {
        // Modal dismissed
      }
    );
  }
}

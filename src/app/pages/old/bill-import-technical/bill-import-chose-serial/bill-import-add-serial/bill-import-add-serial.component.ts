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
import { AppUserService } from '../../../../../services/app-user.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportChoseSerialService } from '../bill-import-chose-serial.service';
@Component({
  selector: 'app-bill-import-add-serial',
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
  templateUrl: './bill-import-add-serial.component.html',
  styleUrl: './bill-import-add-serial.component.css',
})
export class BillImportAddSerialComponent implements OnInit, AfterViewInit {
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private billImportChoseSerialService: BillImportChoseSerialService
  ) {}

  @Input() type: any = 0; // 1 phiếu nhập, 2 phiếu xuất
  @Input() dataBillDetail: any = 0; // data thay đổi theo loại phiếu
  
  isAddSerial: boolean = true;
  serialData: any = [];
  deletedIds: number[] = [];
  name: string = '';
  angularGridAddSerial!: AngularGridInstance;
  columnDefinitionsAddSerial: Column[] = [];
  gridOptionsAddSerial: GridOption = {};

  ngOnInit(): void {
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

  ngAfterViewInit(): void {}

  loadLookUpData() {
    this.billImportChoseSerialService
      .getSerialProduct(this.dataBillDetail.ProductID ?? 0)
      .subscribe((res: any) => {
        this.serialData = res.data.map((x: any, index: number) => ({
          ...x,
          STT: index + 1,
          ID: index--,
        }));

        // const currentCount = this.serialData.length;
        // const requiredQty = this.dataBillDetail.Qty || 0;

        // if (currentCount < requiredQty) {
        //   for (let i = currentCount; i < requiredQty; i++) {
        //     this.serialData.push({
        //       ID: -(i + 1),
        //       STT: i + 1,
        //       SerialNumber: '',
        //       SerialNumberRTC: '',
        //     });
        //   }
        // }
      });
  }

  angularGridAddSerialReady(angularGrid: AngularGridInstance) {
    this.angularGridAddSerial = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  onGridMasterHeaderClick(e: Event, args: any) {
    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-plus')) {
        if (this.serialData.length == this.dataBillDetail.Qty) {
          return;
        }
        const newId =
          this.serialData.length > 0
            ? Math.min(...this.serialData.map((x: any) => x.ID)) - 1
            : -1;

        const newRow = {
          ID: newId,
          STT: this.serialData.length + 1,
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
    this.gridOptionsAddSerial = {
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
      enableCheckboxSelector: true,
      enableRowSelection: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
    };
  }

  initGridColumns() {
    this.columnDefinitionsAddSerial = [
      // {
      //   id: 'action',
      //   name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm"></i>',
      //   field: 'action',
      //   width: 60,
      //   sortable: false,
      //   filterable: false,
      //   excludeFromHeaderMenu: true,
      //   formatter: (_row, _cell, _value, _column, _dataContext) => {
      //     return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa file"></i></div>`;
      //   },
      // },
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
      {
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
      },
    ];
  }

  async saveData() {
    // Force commit cell đang edit để lưu giá trị
    if (this.angularGridAddSerial?.slickGrid) {
      const editController =
        this.angularGridAddSerial.slickGrid.getEditorLock();
      if (editController.isActive()) {
        editController.commitCurrentEdit();
      }
    }

    // Lấy các dòng được chọn
    const selectedRows =
      this.angularGridAddSerial?.gridService?.getSelectedRows() || [];
    const selectedCount = selectedRows.length;

    if (selectedCount === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một dòng serial!'
      );
      return;
    }

    const quantity = this.dataBillDetail.Qty || 0;

    // Kiểm tra số lượng chọn không vượt quá Qty
    if (selectedCount > quantity) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Chọn quá số lượng hàng so với phiếu (${selectedCount}/${quantity})`
      );
      return;
    }

    // Lấy data từ các dòng được chọn
    const listSerials: any[] = [];

    selectedRows.forEach((rowIndex: number) => {
      const item = this.angularGridAddSerial.dataView.getItem(rowIndex);

      if (item) {
        const serialModel = {
          ID: item.ID > 0 ? item.ID : 0,
          STT: item.STT,
          SerialNumber: item.SerialNumber?.trim() || '',
          SerialNumberRTC: item.SerialNumberRTC?.trim() || '',
        };
        if (item.SerialNumber != '' || item.SerialNumberRTC != '') {
          listSerials.push(serialModel);
        }
      }
    });

    // Kiểm tra có lỗi trong quá trình validate không
    // if (listSerials.length !== selectedCount) {
    //   return;
    // }

    // const serialNumbers = listSerials.map((s) => s.SerialNumber);
    // const duplicates = serialNumbers.filter(
    //   (s: string, i: number) => serialNumbers.indexOf(s) !== i
    // );

    // if (duplicates.length > 0) {
    //   const uniqueDup = [...new Set(duplicates)];
    //   this.notification.error(
    //     NOTIFICATION_TITLE.error,
    //     `Serial bị trùng: ${uniqueDup.join(', ')}`
    //   );
    //   return;
    // }

    // Đóng modal và trả về data
    this.activeModal.close(listSerials);
  }
}

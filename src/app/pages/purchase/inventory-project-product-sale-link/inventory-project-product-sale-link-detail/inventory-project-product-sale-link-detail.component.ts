import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  input,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

// NG-ZORRO imports
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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../project/project-service/project.service';
import { AppUserService } from '../../../../services/app-user.service';
import { InventoryProjectProductSaleLinkService } from '../inventory-project-product-sale-link.service';

@Component({
  selector: 'app-inventory-project-product-sale-link-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    AngularSlickgridModule,
  ],
  templateUrl: './inventory-project-product-sale-link-detail.component.html',
  styleUrl: './inventory-project-product-sale-link-detail.component.css',
})
export class InventoryProjectProductSaleLinkDetailComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private nzModalService: NzModalService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private appUserService: AppUserService,
    private inventoryProjectProductSaleLinkService: InventoryProjectProductSaleLinkService
  ) {}

  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};

  employeeId: number = 0;
  employeeList: any[] = [];
  inventoryData: any[] = [];

  ngOnInit(): void {
    this.employeeId = this.appUserService.employeeID || 0;
    this.loadEmployeeList();
    this.initGridColumns();
    this.initGridOptions();
    this.loadInventoryData();
  }

  loadInventoryData() {
    this.inventoryProjectProductSaleLinkService.getDetail().subscribe({
      next: (response: any) => {
        this.inventoryData = response.data;
        this.inventoryData = this.inventoryData.map((x, i) => ({
          ...x,
          id: i++,
        }));
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhóm sản phẩm: ' + error.message
        );
      },
    });
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  loadEmployeeList() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
  }

  onSave() {
    const selectedIndexes = this.angularGridMaster.slickGrid.getSelectedRows();

    if (selectedIndexes.length <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất 1 sản phẩm!'
      );
      return;
    }

    const ids = this.angularGridMaster.slickGrid
      .getSelectedRows()
      .map((index: number) => this.angularGridMaster.dataView.getItem(index))
      .filter((item: any) => Number(item?.ID) > 0)
      .map((item: any) => Number(item.ID));

    if (ids.length <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Dữ liệu không hợp lệ!'
      );
      return;
    }

    this.inventoryProjectProductSaleLinkService.addInventory(ids).subscribe({
      next: (response: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Thêm vật tư thành công!'
        );
        this.activeModal.close();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi thêm vật tư: ' + (error?.message || error?.error?.message)
        );
      },
    });
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      // {
      //   id: 'ProductGroupName',
      //   name: 'Nhóm sản phẩm',
      //   field: 'ProductGroupName',
      //   width: 200,
      //   sortable: true,
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      //   grouping: {
      //     getter: 'ProductGroupName',
      //     formatter: (g: any) =>
      //       `Nhóm: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      //     aggregators: [new Aggregators['Sum']('Quantity')],
      //     aggregateCollapsed: false,
      //     collapsed: false,
      //   },
      // },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 333,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-inventory-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableColumnReorder: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: false,
      },
      enableCheckboxSelector: true,
      enableGrouping: true,
    };
  }
}

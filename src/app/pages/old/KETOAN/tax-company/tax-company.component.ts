import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  Type,
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  Output,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import {
  NgbModal,
  NgbModule,
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { RowComponent } from 'tabulator-tables';

import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { TaxCompanyService } from './tax-company-service/tax-company.service';
import { TaxCompanyDetailComponent } from './tax-company-detail/tax-company-detail.component';


@Component({
  selector: 'app-tax-company',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NgbModule,
    NzDividerModule,
    NzDatePickerModule,
    // ProductSaleDetailComponent,
    // SelectControlComponent,
    HasPermissionDirective,
    AngularSlickgridModule
  ],
  templateUrl: './tax-company.component.html',
  styleUrl: './tax-company.component.css'
})
export class TaxCompanyComponent implements OnInit, AfterViewInit {

  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  data: any[] = [];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private appRef: ApplicationRef,
    private modalServiceConfirm: NzModalService,
    private appUserService: AppUserService,
    private taxCompanyService: TaxCompanyService
  ) { }

  ngOnInit(): void {
    this.initGridMaster();
    this.loadData();
  }

  ngAfterViewInit(): void {
  }

  loadData(): void {
    this.taxCompanyService.getTaxCompanies().subscribe({
      next: (response) => {
        if (response && response.status === 1) {
          this.data = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi tải dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error loading tax companies:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
  }

  onAdd() {
    const modalRef = this.modalService.open(TaxCompanyDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.onSaved.subscribe(() => {
      this.loadData();
    });
  }

  onEdit() {
    const selectedRows = this.angularGridMaster?.slickGrid?.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa');
      return;
    }

    const selectedData = this.angularGridMaster.dataView.getItem(selectedRows[0]);
    
    const modalRef = this.modalService.open(TaxCompanyDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = selectedData.ID;
    modalRef.componentInstance.onSaved.subscribe(() => {
      this.loadData();
    });
  }

  onDelete() {
    const selectedRows = this.angularGridMaster?.slickGrid?.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để xóa');
      return;
    }

    this.modalServiceConfirm.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa công ty này?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const selectedData = this.angularGridMaster.dataView.getItem(selectedRows[0]);
        const deleteData = {
          ...selectedData,
          IsDeleted: true
        };
        
        this.taxCompanyService.saveTaxCompany(deleteData).subscribe({
          next: (response) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công');
              this.loadData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Xóa thất bại');
            }
          },
          error: (error) => {
            console.error('Error deleting tax company:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa dữ liệu');
          }
        });
      }
    });
  }

  initGridMaster() {
    //region Column Master
    this.columnDefinitionsMaster = [
      {
        id: 'Code',
        name: 'Mã công ty',
        field: 'Code',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Name',
        name: 'Tên công ty',
        field: 'Name',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'FullName',
        name: 'Tên đầy đủ',
        field: 'FullName',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'TaxCode',
        name: 'Mã số thuế',
        field: 'TaxCode',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'Address',
        name: 'Trụ sở chính',
        field: 'Address',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'PhoneNumber',
        name: 'Điện thoại',
        field: 'PhoneNumber',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'Director',
        name: 'Giám đốc',
        field: 'Director',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'Position',
        name: 'Chức vụ',
        field: 'Position',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true,
        columnGroup: 'Thông tin chung'
      },
      {
        id: 'BuyerEnglish',
        name: 'Buyer',
        field: 'BuyerEnglish',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'AddressBuyerEnglish',
        name: 'AddressBuyer',
        field: 'AddressBuyerEnglish',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'LegalRepresentativeEnglish',
        name: 'Legal Representative',
        field: 'LegalRepresentativeEnglish',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'BuyerVietnamese',
        name: 'Buyer',
        field: 'BuyerVietnamese',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'AddressBuyerVienamese',
        name: 'AddressBuyer',
        field: 'AddressBuyerVienamese',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
      {
        id: 'TaxVietnamese',
        name: 'Tax',
        field: 'TaxVietnamese',
        type: 'string',
        width: 150,
        sortable: true,
        filterable: true
      },
    ];
    //#endregion

    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-master',
        calculateAvailableSizeBy: 'container'
      },
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      frozenColumn: 2,
    };
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    setTimeout(() => {
      this.angularGridMaster.resizerService.resizeGrid();
    });
  }

  onCellClicked(e: any, args: OnClickEventArgs) {

  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {

  }

}

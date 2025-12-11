import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { PokhService } from '../../pokh/pokh-service/pokh.service';

import { EmployeeSaleManagerService } from './employee-sale-manager-service/employee-sale-manager.service';
import { EmployeeTeamSaleDetailComponent } from './employee-team-sale-detail/employee-team-sale-detail.component';

@Component({
  selector: 'app-employee-sale-manager',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    NzTreeSelectModule,
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './employee-sale-manager.component.html',
  styleUrl: './employee-sale-manager.component.css'
})
export class EmployeeSaleManagerComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailElement!: ElementRef;

  tb_Master!: Tabulator;
  tb_Detail!: Tabulator;

  dataGroupSale: any[] = [];
  dataEmployeeSale: any[] = [];
  selectedGroupSaleId: number = 0;
  selectedGroupSaleParentId: number = 0;
  // Modal form
  isModalVisible: boolean = false;
  groupSaleForm!: FormGroup;
  teamSaleOptions: any[] = [];
  currentEditId: number | null = null;

  constructor(
    private modalService: NgbModal,
    private POKHService: PokhService,
    private notification: NzNotificationService,
    private employeeSaleManagerService: EmployeeSaleManagerService,
    private fb: FormBuilder,
    private modal: NzModalService
  ) {
    this.initForm();
  }
  
  initForm() {
    this.groupSaleForm = this.fb.group({
      Code: [''],
      STT: [1],
      Name: [''],
      TeamSaleID: [null]
    });
  }
  ngOnInit(): void {
    this.loadGroupSale();
    this.loadEmployeeSale(1);
  }

  ngAfterViewInit(): void {
    this.initGroupSaleTable();
    this.initEmployeeSaleTable();
  }

  loadGroupSale() {
    this.employeeSaleManagerService.getGroupSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataGroupSale = response.data;
          this.dataGroupSale = this.convertToTreeData(this.dataGroupSale);
          this.tb_Master.replaceData(this.dataGroupSale);
        } else {
          this.notification.error('Lỗi khi tải Team:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Team:', error);
        return;
      }
    );
  }

  loadEmployeeSale(groupId: number) {
    this.employeeSaleManagerService.getEmployeeSale(groupId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataEmployeeSale = response.data;
          this.tb_Detail.replaceData(this.dataEmployeeSale);
        } else {
          this.notification.error('Lỗi khi tải Nhân viên:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Nhân viên:', error);
        return;
      }
    );
  }

  onAddGroupSale() {
    this.currentEditId = null;
    this.groupSaleForm.reset({
      Code: '',
      STT: 1,
      Name: '',
      TeamSaleID: null
    });
    //lấy stt từ api
    this.employeeSaleManagerService.getGroupStt().subscribe(
      (response) => {
        if (response.status === 1 && response.data !== null && response.data !== undefined) {
          const maxSTT = response.data || 0;
          this.groupSaleForm.patchValue({
            STT: maxSTT + 1
          });
        }
      },
      (error) => {
        console.error('Lỗi khi load STT:', error);
      }
    );
    
    this.loadTeamSaleOptions();
    this.isModalVisible = true;
  }

  onEditGroupSale() {
    const selectedRow = this.tb_Master.getSelectedData();
    if (!selectedRow || selectedRow.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
      return;
    }

    const rowData = selectedRow[0];
    this.currentEditId = rowData.ID;
    
    this.groupSaleForm.patchValue({
      Code: rowData.Code || '',
      STT: rowData.STT || 1,
      Name: rowData.Name || '',
      TeamSaleID: rowData.ParentID || 0
    });

    this.loadTeamSaleOptions();
    this.isModalVisible = true;
  }
  onDeleteGroupSale() {
    const selectedRow = this.tb_Master.getSelectedData();
    if (!selectedRow || selectedRow.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để xóa!');
      return;
    }

    const rowData = selectedRow[0];
    
    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa "${rowData.Name || rowData.Code}"?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const data = {
          ID: rowData.ID,
          Code: rowData.Code || '',
          STT: rowData.STT || 1,
          Name: rowData.Name || '',
          ParentID: rowData.ParentID || null,
          IsDeleted: 1
        };

        this.employeeSaleManagerService.saveEmployeeTeamSale(data).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Xóa thành công!');
              
              // Reload data
              this.loadGroupSale();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Xóa thất bại!');
            }
          },
          error: (err: any) => {
            console.error('Delete error:', err);
            this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi xóa dữ liệu!');
          }
        });
      }
    });
  }

  onAddEmployeeSale() {
    if(this.selectedGroupSaleParentId === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Hãy chọn một chức vụ để thêm nhân viên!');
      return;
    }
    const modalRef = this.modalService.open(EmployeeTeamSaleDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.selectedGroupSaleId = this.selectedGroupSaleId;

    modalRef.result.then(
      (result) => {
        if (result && result.success && result.reloadData) {
          if (this.selectedGroupSaleId > 0) {
            this.loadEmployeeSale(this.selectedGroupSaleId);
          }
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }
  
  onDeleteEmployeeSale() {

  }


  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }

  handleModalCancel() {
    this.isModalVisible = false;
    this.groupSaleForm.reset();
    this.currentEditId = null;
  }

  handleSave() {
    let isDeleted = 0;
    if (this.groupSaleForm.valid) {
      const formValue = this.groupSaleForm.value;
      const data = {
        ID: this.currentEditId || 0,
        Code: formValue.Code || '',
        STT: formValue.STT || 1,
        Name: formValue.Name || '',
        ParentID: formValue.TeamSaleID ? parseInt(formValue.TeamSaleID) : null,
        IsDeleted: isDeleted
      };

      this.employeeSaleManagerService.saveEmployeeTeamSale(data).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công!');
            
            // Reload data
            this.loadGroupSale();
            
            // Đóng modal
            this.handleModalCancel();
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lưu thất bại!');
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
        }
      });
    } else {
      Object.values(this.groupSaleForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  loadTeamSaleOptions() {
    // Load flat data từ API hoặc dùng dataGroupSale đã có
    this.employeeSaleManagerService.getGroupSale().subscribe(
      (response) => {
        if (response.status === 1 && Array.isArray(response.data)) {
          const treeData = this.buildTree(response.data);
          this.teamSaleOptions = treeData.map((node: any) => this.mapToNzTree(node));
        }
      },
      (error) => {
        console.error('Lỗi khi load team sale options:', error);
      }
    );
  }

  private buildTree(list: any[]): any[] {
    const map: { [key: number]: any } = {};
    const roots: any[] = [];

    // Bước 1: Gán mỗi phần tử vào map để truy cập nhanh
    list.forEach((item) => {
      map[item.ID] = { ...item, children: [] };
    });

    // Bước 2: Xác định cha-con
    list.forEach((item) => {
      if (item.ParentID && map[item.ParentID]) {
        map[item.ParentID].children.push(map[item.ID]);
      } else {
        roots.push(map[item.ID]);
      }
    });

    return roots;
  }

  private mapToNzTree(node: any): any {
    return {
      title: node.Name || node.Code,
      key: node.ID,
      value: String(node.ID),
      children: (node.children || []).map((child: any) => this.mapToNzTree(child)),
    };
  }

  initGroupSaleTable(): void {
    if (!this.tb_MasterElement) {
      console.error('tb_Master element not found');
      return;
    }
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      data: this.dataGroupSale,
      layout: 'fitColumns',
      pagination: true,
      dataTree: true,
      dataTreeChildField: '_children',
      dataTreeStartExpanded: true,
      selectableRows: 1,
      paginationSize: 50,
      height: '100%',
      movableColumns: true,
      resizableRows: true,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        {
          title: 'Mã team',
          field: 'Code',
          sorter: 'string',
        },
        {
          title: 'Team/ Chức vụ',
          field: 'Name',
          sorter: 'string',
        },
      ],
    });

    this.tb_Master.on('rowClick', (e: UIEvent, row: RowComponent) => {
      const data = row.getData();
      this.selectedGroupSaleId = data['ID'];
      this.selectedGroupSaleParentId = data['ParentID'];
      this.loadEmployeeSale(data['ID']);
    });
  }
  initEmployeeSaleTable(): void {
    if (!this.tb_DetailElement) {
      console.error('tb_Detail element not found');
      return;
    }
    this.tb_Detail = new Tabulator(this.tb_DetailElement.nativeElement, {
      data: this.dataEmployeeSale,
      layout: 'fitColumns',
      pagination: true,
      paginationSize: 50,
      height: '100%',
      movableColumns: true,
      resizableRows: true,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      groupBy: 'TeamName',
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'EmployeeCode',
          sorter: 'string',
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          sorter: 'string',
        },
        {
          title: 'Chức vụ',
          field: 'TeamName',
          sorter: 'string',
          visible: false,
        },
      ],
    });
  }
}

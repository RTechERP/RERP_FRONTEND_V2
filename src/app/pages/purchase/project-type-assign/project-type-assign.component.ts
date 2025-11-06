import { ProjectTypeAssignService } from './project-type-assign.service';
import { AppUserService } from '../../../services/app-user.service';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
  viewChild,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
// import { NSelectComponent } from '../n-select/n-select.component';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
@Component({
  selector: 'app-project-type-assign',
  imports: [
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    CommonModule,
    NzFormModule,
    NzNotificationService,
    NzDropDownModule,
    NzModalService,
    NzModalModule,
    HasPermissionDirective,
  ],
  templateUrl: './project-type-assign.component.html',
  styleUrl: './project-type-assign.component.css'
})
export class ProjectTypeAssignComponent  implements OnInit, AfterViewInit {
  @ViewChild('#tbDetail', { static: false }) tbDetail!: ElementRef;
  @ViewChild('#tbData', { static: false }) tbData!: ElementRef;

  showDetailPanel: boolean = false;
  keyword: string = '';
  // Bảng dữ liệu
  table: any;
  tabDetail: any;
  dataTable: any[] = [];
  listDataDetail: any[] = [];
 selectedRowData: any = null;

  constructor(
    private projectTypeAssignService: ProjectTypeAssignService,
    private appUserService: AppUserService
  ) { }
  ngOnInit(): void {
   
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }   
    drawDetailtable(){
      this.tabDetail = new Tabulator(this.tbDetail.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.listDataDetail,
        columns: [
          { title: 'Mã nhân viên', field: 'Code', width: 150 },
          { title: 'Tên nhân viên', field: 'FullName', width: 200 },
          { title: 'Danh mục', field: 'ProjectTypeName', width: 200 },
          { title: 'AssignID', field: 'AssignID', width: 150 ,visible: false},
        ],
    })}
  loadData() {
    this.projectTypeAssignService.getAll(this.keyword).subscribe((res) => {
      this.dataTable = this.setDataTree(res.data, 'ID');
      this.drawTable();
    });
  }



  drawTable() {
    this.table = new Tabulator(this.tbData.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTable,
      columns: [
        { title: 'Mã', field: 'Code', width: 150 },
        { title: 'Tên', field: 'Name', width: 200 },
        { title: 'Mô tả', field: 'Description', width: 200 },
        { title: 'Trạng thái', field: 'Status', width: 150 },
        { title: 'Ngày tạo', field: 'CreatedDate', width: 150 },
        { title: 'Người tạo', field: 'CreatedBy', width: 150 },
        { title: 'Ngày sửa', field: 'ModifiedDate', width: 150 },
        { title: 'Người sửa', field: 'ModifiedBy', width: 150 },
      ],
    });
    this.table.on('rowSelectionChanged', (data: any, rows: any) => {
      if (data.length > 0) {
        this.selectedRowData = data[0];
        this.showDetailPanel = true;

        // Đảm bảo panel đã mở, sau đó khởi tạo các bảng detail
        setTimeout(() => {
            
        }, 0);
      } else {
        this.showDetailPanel = false;
      }
    });
  }
  setDataTree(flatData: any[], valueField: string): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Map từng item theo ID
    flatData.forEach((item) => {
      map.set(item[valueField], { ...item, _children: [] });
    });

    // Bước 2: Gắn item vào parent hoặc top-level
    flatData.forEach((item) => {
      const current = map.get(item[valueField]);
      if (item.ParentID && item.ParentID != 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(current);
        } else {
          tree.push(current);
        }
      } else {
        tree.push(current);
      }
    });

    return tree;
  }

}

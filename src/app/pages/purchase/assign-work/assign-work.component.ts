import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AssignWorkService } from './assign-work.service';
import { ChooseEmployeeComponent } from './choose-employee/choose-employee.component';

@Component({
  selector: 'app-assign-work',
  imports: [
    FormsModule,
    NzButtonModule,
    NzSplitterModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzButtonModule,
    HasPermissionDirective,
  ],
  templateUrl: './assign-work.component.html',
  styleUrl: './assign-work.component.css',
})
export class AssignWorkComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private assignWorkService: AssignWorkService
  ) {}

  @ViewChild('tb_userTeamLink', { static: false })
  tb_userTeamLinkContainer!: ElementRef;
  @ViewChild('tb_userTeamLinkDetail', { static: false })
  tb_userTeamLinkDetailContainer!: ElementRef;

  tb_userTeamLink: any;
  tb_userTeamLinkDetail: any;

  projectTypeId: any = 0;
  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTbUserTeamLink(this.tb_userTeamLinkContainer.nativeElement);
    this.drawTbUserTeamLinkDetail(
      this.tb_userTeamLinkDetailContainer.nativeElement
    );
    this.getProjectType();
    this.getProjectTypeAssign(this.projectTypeId);
  }
  //#endregion

  //#region Tạo bảng
  drawTbUserTeamLink(container: HTMLElement) {
    this.tb_userTeamLink = new Tabulator(container, {
      height: '89vh',
      layout: 'fitDataStretch',
      dataTree: true,
      dataTreeStartExpanded: true,
      selectableRows: 1,
      locale: 'vi',
      dataTreeChildField: '_children',
      columns: [
        {
          title: 'Mã',
          field: 'ProjectTypeCode',
          width: 150,
          headerSort: false,
        },
        {
          title: 'Tên',
          field: 'ProjectTypeName',
          width: 150,
          headerSort: false,
        },
      ],
    });

    this.tb_userTeamLink.on('rowSelected', (row: any) => {
      const id = row.getData().ID;
      this.projectTypeId = id;
      this.getProjectTypeAssign(id);
    });
  }

  drawTbUserTeamLinkDetail(container: HTMLElement) {
    this.tb_userTeamLinkDetail = new Tabulator(container, {
      height: '89vh',
      layout: 'fitDataStretch',
      selectableRows: true,
      locale: 'vi',
      groupBy: (data) => `Danh mục: ${data.ProjectTypeName ?? ''}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      columns: [
        {
          title: '',
          field: '',
          headerHozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 50,
          cellClick: function (e, cell) {
            e.stopPropagation();
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width: 150,
          minWidth: 150,
          headerSort: false,
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          width: 150,
          minWidth: 150,
          headerSort: false,
        },
      ],
    });
  }

  //#endregion

  //#region Set data tree
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
      if (item.ID != 0) {
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
  //#endregion

  //#region Lấy dữ liệu master detail
  getProjectType() {
    this.tb_userTeamLink.clearData();
    this.assignWorkService.getProjectType().subscribe({
      next: (data) => {
        const newItem = {
          ID: 0,
          ParentID: 0,
          ProjectTypeName: '--Tất cả--',
        };
        const newData = [newItem, ...data.data];
        let tree = this.setDataTree(newData, 'ID');

        const root = tree.find((x) => x.ID === 0);

        root._children = root._children.filter((x: any) =>
          [1, 2, 3].includes(x.ID)
        );

        const result = [root];

        this.tb_userTeamLink.setData(result);
        this.tb_userTeamLink.selectRow(0);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  getProjectTypeAssign(projectTypeID: number) {
    this.tb_userTeamLinkDetail.clearData();
    this.assignWorkService.getProjectTypeAssign(projectTypeID).subscribe({
      next: (data) => {
        this.tb_userTeamLinkDetail.setData(data.data);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }
  //#endregion

  //#region Reset data
  loadData() {
    this.getProjectType();
    this.getProjectTypeAssign(0);
  }
  //#endregion

  //#region Thêm nhân viên
  onAddEmployee() {
    if (this.projectTypeId <= 0 || this.projectTypeId == null) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn nhóm cần thêm nhân viên!'
      );
      return;
    }
    const modalRef = this.modalService.open(ChooseEmployeeComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.projectTypeId = this.projectTypeId;
    modalRef.result.catch((reason) => {
      this.getProjectTypeAssign(this.projectTypeId);
    });
  }
  //#endregion

  deleteProjectTypeAssigns() {
    const selectRows = this.tb_userTeamLinkDetail.getSelectedRows();

    if (!selectRows || selectRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất một nhân viên cần xóa!'
      );
      return;
    }

    const selectedIds = selectRows.map((x: any) => x.getData().AssignID);

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn xóa ${selectedIds.length} nhân viên`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzClosable: false,
      nzOnOk: () => {
        this.assignWorkService.deleteProjectTypeAssigns(selectedIds).subscribe({
          next: (response: any) => {
            this.getProjectTypeAssign(this.projectTypeId);
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              error.error.message
            );
          },
        });
      },
    });
  }
}

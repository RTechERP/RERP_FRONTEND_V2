import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ISADMIN } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { IssueSolutionService } from './issue-solution/issue-solution.service';
import { IssueSolutionDetailComponent } from '../issue-solution-detail/issue-solution-detail.component';
@Component({
  selector: 'app-issue-solution',
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
    NzCheckboxModule,
    NgbModule,
  ],
  templateUrl: './issue-solution.component.html',
  styleUrl: './issue-solution.component.css'
})
export class IssueSolutionComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  private tb_Master!: Tabulator;

  mainData: any[] = [];
  selectedId: number = 0;
  filters: any = {
    keyword: '',
    issueSolutionType: 0
  };

  issueSolutionTypes: any[] = [];
  constructor(
    private issueSolutionService: IssueSolutionService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
  ) {
    this.issueSolutionTypes = [
      { value: 0, name: 'Chung' },
      { value: 1, name: 'Dự án' },
    ];
  }
  
  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    this.initMainTable();
    this.loadMainData();
  }

  loadMainData(): void {
    this.issueSolutionService.getAllIssueSolution(this.filters.keyword, this.filters.issueSolutionType).subscribe({
      next: (response) => {
        console.log(response);
        if (response.status == 1) {
          this.mainData = response.data;
          if (this.tb_Master) {
            this.tb_Master.setData(this.mainData);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });
  }

  onIssueSolutionTypeChange()
  {
    this.loadMainData();
  }

  onSearch(){
    this.loadMainData();
  }

  onDelete(){
    if(!this.selectedId) {
      this.notification.error('Lỗi',"Vui lòng chọn bản ghi cần xóa");
      return;
    }
    this.modal.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa?',
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const issueSolutionLogsDel= {
          ID: this.selectedId,
          IsDeleted: true,
        }
        const payload = {
          issueSolutionLogs: issueSolutionLogsDel
        }
        this.issueSolutionService.saveData(payload).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Xóa dữ liệu thành công!');
              this.loadMainData();
            } else {
              this.notification.error(
                'Lỗi',
                response.message || 'Xóa dữ liệu thất bại!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error('Lỗi', 'Không thể xóa dữ liệu!' + err);
          },
        });
      },
    });
    
  }

  onEdit(){
    if(!this.selectedId) {
      this.notification.error('Lỗi',"Vui lòng chọn bản ghi cần sửa");
      return;
    }
    this.issueSolutionService.getIssueSolutionDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const MAINDATA = response.data.mainData;
          const DOCDATA = response.data.docData;
          const groupedData = [
            {
              MainData: MAINDATA,
              ID: this.selectedId,
              DocData: DOCDATA,
            },
          ];
          const modalRef = this.modalService.open(
            IssueSolutionDetailComponent,
            {
              centered: true,
              size: 'xl',
              backdrop: 'static',
            }
          );
          modalRef.componentInstance.groupedData = groupedData;
          modalRef.componentInstance.isEditMode = true;
          modalRef.componentInstance.selectedId = this.selectedId;
          modalRef.result.then(
            (result) => {
              if (result.success && result.reloadData) {
                this.loadMainData();
              }
            },
            (reason) => {
              console.log('Modal closed');
            }
          );
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });
  }
  openModal() {
    const modalRef = this.modalService.open(IssueSolutionDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: "xl",
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadMainData();
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  initMainTable(): void {
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      data: this.mainData,
      ...DEFAULT_TABLE_CONFIG,
      height: '86vh',
      selectableRows: 1,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'string',
          visible: false,
        },
        {
          title: 'Ngày ghi nhận',
          field: 'DateIssue',
          sorter: 'date',
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            return date.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            });
          },
        },
        {
          title: 'Phòng ghi nhận',
          field: 'DepartmentName',
          sorter: 'string',
        },
        {
          title: 'Số chứng từ',
          field: 'DocumentNumbers',
          sorter: 'string',
          width: 400
        },
        {
          title: 'Phòng ban liên quan',
          field: 'RelatedDepartmentName',
          sorter: 'string',
        },
        {
          title: 'Mô tả lỗi sự việc',
          field: 'IssueDescription',
          sorter: 'string',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
        },
        {
          title: 'Nhà cung cấp/Hãng',
          field: 'SupplierName',
          sorter: 'string',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          sorter: 'string',
        },
        {
          title: 'Chi tiết ảnh hưởng/Hậu quả',
          field: 'ImpactDetail',
          sorter: 'string',
        },
        {
          title: 'Nguyên nhân',
          field: 'IssueCauseText',
          sorter: 'string',
        },
        {
          title: 'Nguyên nhân khác',
          field: 'OtherIssueCauseNote',
          sorter: 'string',
        },
        {
          title: 'Phương án khắc phục trước mắt',
          field: 'ImmediateAction',
          sorter: 'string',
        },
        {
          title: 'Phương án phòng ngừa lâu dài',
          field: 'PreventiveAction',
          sorter: 'string',
        },
        {
          title: 'Người chịu trách nhiệm xử lý',
          field: 'EmployeeName',
          sorter: 'string',
        },
        {
          title: 'Thời hạn khắc phục',
          field: 'Deadline',
          sorter: 'date',
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            return date.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            });
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusName',
          sorter: 'string',
        },
        {
          title: 'Lý do không đồng ý',
          field: 'ReasonIgnoreStatusText',
          sorter: 'string',
        },
        {
          title: 'Người xác nhận hoàn thành',
          field: 'VerifiedByName',
          sorter: 'string',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
        },
      ],
    });

    // this.tb_Master.on('rowClick', (e: any, row: RowComponent) => {
    //   const ID = row.getData()['ID'];
    //   this.selectedId = ID;
    //   console.log(this.selectedId)
    // });
    this.tb_Master.on('rowSelected', (row: any) => {
      this.selectedId = row.getData().ID;
      console.log(this.selectedId)
    });

    this.tb_Master.on('rowDeselected', (row: any) => {
      if (this.selectedId === row.getData().ID) {
        this.selectedId = 0;
      }
      console.log(this.selectedId)
    });
  }
}

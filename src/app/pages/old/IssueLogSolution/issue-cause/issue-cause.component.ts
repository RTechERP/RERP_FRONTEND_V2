import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
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
import { ISADMIN } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { IssueSolutionService } from '../issue-solution/issue-solution/issue-solution.service';
import { IssueCauseDetailComponent } from '../issue-cause-detail/issue-cause-detail.component';

@Component({
  selector: 'app-issue-cause',
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
  templateUrl: './issue-cause.component.html',
  styleUrl: './issue-cause.component.css'
})
export class IssueCauseComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  private tb_Master!: Tabulator;

  mainData: any[] = [];
  selectedId: number = 0;

  constructor(
    private issueSolutionService: IssueSolutionService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
  ){}

  ngOnInit(): void {
    this.loadMainData();
  }

  ngAfterViewInit(): void {
    this.initMainTable();
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }
  

  onEdit(): void {
    if(!this.selectedId) {
      this.notification.error(NOTIFICATION_TITLE.error,"Vui lòng chọn bản ghi cần sửa");
      return;
    }
    this.issueSolutionService.getIssueCauseDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const MAINDATA = response.data;

          const modalRef = this.modalService.open(
            IssueCauseDetailComponent,
            {
              centered: true,
              size: 'xl',
              backdrop: 'static',
            }
          );
          modalRef.componentInstance.MAINDATA = MAINDATA;
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
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  onDelete(): void {
    if(!this.selectedId) {
      this.notification.error(NOTIFICATION_TITLE.error,"Vui lòng chọn bản ghi cần xóa");
      return;
    }
    this.modal.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa?',
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = {
          ID: this.selectedId,
          IsDeleted: true,
        }
        this.issueSolutionService.saveIssueCause(payload).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Xóa dữ liệu thành công!');
              this.loadMainData();
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Xóa dữ liệu thất bại!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xóa dữ liệu!' + err);
          },
        });
      },
    });
  }

  openModalIssueCauseDetail(): void {
    const modalRef = this.modalService.open(IssueCauseDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: "xl",
      backdrop: 'static',
    });

    modalRef.result.then(
      (result: any) => {
        if (result.success && result.reloadData) {
          this.loadMainData()
        }
      },
      (reason : any) => {
        console.log('Modal closed');
      }
    );
  }

  loadMainData(): void {
    this.issueSolutionService.getAllIssueCauses().subscribe({
      next: (response) => {
        this.mainData = response.data;
        if (this.tb_Master) {
          this.tb_Master.setData(this.mainData);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  initMainTable(): void {
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      data: this.mainData,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
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
          title: 'Mã nguyên nhân',
          field: 'IssueCauseCode',
          sorter: 'string',
          width: 100
        },
        {
          title: 'Mô tả nguyên nhân',
          field: 'IssueCauseText',
          sorter: 'string',
        }
      ],
    });

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

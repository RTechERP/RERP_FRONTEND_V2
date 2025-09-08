import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ProjectFormPriorityDetailComponent } from '../project-form-priority-detail/project-form-priority-detail.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
@Component({
  selector: 'app-project-priority-detail',
  imports: [FormsModule, NzButtonModule, NzModalModule],
  templateUrl: './project-priority-detail.component.html',
  styleUrl: './project-priority-detail.component.css',
})
export class ProjectPriorityDetailComponent implements OnInit {
  //#region Khai báo biến
  @Input() projectId: any = 0;
  tb_projectPriority: any;
  priorityId: any;
  selectedRow: any;
  priority: any;
  listPriorities: any[] = [];
  //#endregion

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.drawTbProjectPriority();
    this.getProjectPriorityModal();
  }

  //#region Xử lý bẳng chi tiết ưu tiên
  drawTbProjectPriority() {
      
    if (this.tb_projectPriority) this.tb_projectPriority.destroy();
    this.tb_projectPriority = new Tabulator(`#tb_projectPriority`, {
      height: '66vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      layout: 'fitDataTable',
      locale: 'vi',
      columns: [
        {
          title: '',
          field: 'Selected',
          formatter: function (cell, formatterParams, onRendered) {
            const checked = cell.getValue() ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          cellClick: (e, cell) => {
            const newValue = !cell.getValue();
            const row = cell.getRow();

            if (row.getTreeChildren && row.getTreeChildren().length > 0) {
              const children = row.getTreeChildren();

              children.forEach((childRow) => {
                const childData = childRow.getData();
                childRow.update({ Selected: newValue });
              });
            }
            cell.setValue(newValue);

            this.caculatorPriority();
          },
          hozAlign: 'center',
          width: '8px',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã ưu tiên',
          field: 'Code',
          headerHozAlign: 'center',
          width: '10px',
        },
        {
          title: 'Checkpoint',
          field: 'ProjectCheckpoint',
          headerHozAlign: 'center',
          width: '52px',
        },
        {
          title: 'Trọng số',
          field: 'Rate',
          headerHozAlign: 'center',
          width: '10px',
          formatter: function (cell) {
            return (cell.getValue() * 100).toFixed(0) + ' %';
          },
          hozAlign: 'right',
        },
        {
          title: 'Điểm',
          field: 'Score',
          headerHozAlign: 'center',
          width: '8px',
          hozAlign: 'right',
        },
        {
          title: 'Độ ưu tiên',
          field: 'Priority',
          headerHozAlign: 'center',
          hozAlign: 'right',
          width: '10px',
        },
      ],
    });

    this.tb_projectPriority.on('rowClick', (e: any, row: any) => {
      this.tb_projectPriority.deselectRow();
      this.selectedRow = row;
      row.select();

      var r = row.getData();
      this.priorityId = r['ID'];
    });
  }

  getProjectPriorityModal() {
    this.projectService.getProjectPriorityModal(this.projectId).subscribe({
      next: (response: any) => {
          
        const test = response.data.prjPriority.map((item: any) => ({
          ...item,
          Selected: response.data.checks.includes(item.ID) ? true : false,
        }));

        let data = this.projectService.setDataTree(test, 'ID');
        this.tb_projectPriority.setData(data);
        this.caculatorPriority();
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  savePriority() {
    if (this.priority > 5) {
      this.notification.error(
        '',
        'Tổng số điểm ưu tiên không được vượt quá 5!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    const modalRef = this.modal.confirm({
      nzTitle: 'Bạn có chắc muốn lưu mức ưu tiên đã chọn?',
      nzOkText: 'Lưu',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const allData = this.projectService.getSelectedRowsRecursive(
          this.tb_projectPriority.getData()
        );

        allData.forEach((row: any) => {
          if (row['Selected']) {
            this.listPriorities.push(row);
          }
        });
        this.activeModal.dismiss({
          priority: this.priority,
          listPriorities: this.listPriorities,
        });

        modalRef.close();
      },
    });
  }

  caculatorPriority() {
    let totalPriority = 0;
      
    const allData = this.projectService.getSelectedRowsRecursive(
      this.tb_projectPriority.getData()
    );

    allData.forEach((row: any) => {
      if (row['Selected']) {
        totalPriority += row['Priority'];
      }
    });
    this.priority = parseFloat(totalPriority.toFixed(2));
  }

  openProjectPriorityDetailModal(num: any) {
    if ((!this.priorityId || this.priorityId <= 0) && num == 1) {
      this.notification.error('', 'Vui lòng chọn dòng cần sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(
      ProjectFormPriorityDetailComponent,
      {
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
      }
    );

    if (num == 1) {
      modalRef.componentInstance.priorityId = this.priorityId;
    }

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getProjectPriorityModal();
        this.priorityId = 0;
      }
    });
  }

  deletedProjectPriority() {
    const rowSelect: any[] = [];
    const allData = this.projectService.getSelectedRowsRecursive(
      this.tb_projectPriority.getData()
    );

    allData.forEach((row: any) => {
      if (row['Selected']) {
        rowSelect.push(row['ID']);
      }
    });

    if (rowSelect.length <= 0) {
      this.notification.error('', 'Vui lòng chọn ít nhất 1 dòng để xóa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modal.confirm({
      nzTitle: 'Bạn có chắc muốn xóa mã ưu tiên đã chọn?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectService.deletedProjectPriority(rowSelect).subscribe({
          next: (response: any) => {
            if (response.data == true) {
              this.getProjectPriorityModal();
            }
          },
          error: (error) => {
            console.error('Lỗi:', error);
          },
        });

        modalRef.close();
      },
    });
  }
  //#endregion
}

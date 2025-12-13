import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OverTimeService } from '../../../over-time-service/over-time.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { ProjectService } from '../../../../../project/project-service/project.service';

@Component({
  selector: 'app-project-item-select-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzCheckboxModule,
    NzSpinModule,
    NzNotificationModule
  ],
  template: `
     <div class="modal-header bg-primary align-items-center p-2">
      <h6 class="modal-title">Chọn hạng mục công việc</h6>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body p-3">
      <div class="mb-3">
        <div class="d-flex gap-2 align-items-end">
          <div class="flex-shrink-0" style="width: 300px;">
            <label class="form-label mb-1">Chọn dự án</label>
            <nz-select
              nzShowSearch
              nzAllowClear
              nzPlaceHolder="Chọn dự án"
              [(ngModel)]="selectedProjectID"
              (ngModelChange)="onProjectChange()"
              style="width: 100%;"
            >
              <nz-option [nzValue]="0" nzLabel="Tất cả"></nz-option>
              <nz-option *ngFor="let project of projectList" [nzValue]="project.id" [nzLabel]="project.text"></nz-option>
            </nz-select>
          </div>
          <div class="flex-grow-1">
            <label class="form-label mb-1">Tìm kiếm</label>
            <div class="d-flex gap-2">
              <input 
                nz-input
                type="text" 
                placeholder="Nhập từ khóa tìm kiếm..." 
                [(ngModel)]="keyword"
                (keyup.enter)="loadProjectItems()"
                style="flex: 1;"
              />
              <button nz-button nzType="default" (click)="loadProjectItems()" [nzLoading]="isLoading">
                <span nz-icon nzType="search"></span>
            
              </button>
            </div>
          </div>
        </div>
      </div>
      <div #tabulatorDiv class="tabulator-container"></div>
    </div>
    <div class="modal-footer bg-white p-3 d-flex justify-content-end gap-2">
      <button nz-button nzType="default" nzDanger (click)="activeModal.dismiss()">Đóng</button>
      <button nz-button nzType="primary" (click)="confirmSelection()" [nzLoading]="isLoading">
        Chọn
      </button>
    </div>
  `,
  styles: [`
    .tabulator-container {
      height: 400px;
      width: 100%;
    }
    .modal-body {
      min-height: 450px;
    }
  `]
})
export class ProjectItemSelectModalComponent implements OnInit, AfterViewInit {
  @ViewChild('tabulatorDiv', { static: false }) tabulatorDiv!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  projectItemList: any[] = [];
  selectedItems: any[] = [];
  keyword: string = '';
  isLoading = false;
  projectList: any[] = [];
  selectedProjectID: number = 0;

  // Input parameters
  projectID: number = 0;
  userID: number = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private overTimeService: OverTimeService,
    private notification: NzNotificationService,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [res.data];
          
          // Map dữ liệu để hỗ trợ cả format {id, text} và {ID, ProjectCode, ProjectName}
          this.projectList = dataArray.map((item: any) => {
            if (item.id !== undefined && item.text !== undefined) {
              return item;
            }
            if (item.ID !== undefined) {
              const projectText = item.ProjectCode 
                ? `${item.ProjectCode} - ${item.ProjectName || ''}` 
                : (item.ProjectName || '');
              
              return {
                id: item.ID,
                text: projectText
              };
            }
            return item;
          });
        } else {
          this.projectList = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.projectList = [];
      }
    });
  }

  onProjectChange() {
    this.loadProjectItems();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeTable();
      // Sau khi khởi tạo tabulator, mới load data
      this.loadProjectItems();
    }, 100);
  }

  initializeTable() {
    if (!this.tabulatorDiv?.nativeElement) {
      return;
    }

    this.tabulator = new Tabulator(this.tabulatorDiv.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '40vh',
      selectableRows: true,
      paginationMode: 'local',
      data: this.projectItemList,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          width: 60,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const row = cell.getRow();
            return row.getPosition() + 1;
          }
        },
        {
          title: 'Mã hạng mục',
          field: 'Code',
          width: 120,
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea'
        },
        {
          title: 'Hạng mục công việc',
          field: 'Mission',
          width: 300,
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea'
        },
       
      ]
    });

    // Handle row selection
    this.tabulator.on('rowSelectionChanged', (data: any, rows: any[]) => {
      this.selectedItems = rows.map(row => row.getData());
    });
  }

  loadProjectItems() {
    this.isLoading = true;

    const request = {
      ProjectID: this.selectedProjectID || 0,
      UserID: this.userID,
      Keyword: this.keyword || '',
      Status: '1;2'
    };

    this.overTimeService.getProjectItem(request).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            this.projectItemList = data;
          } else {
            this.projectItemList = [];
          }
          
          if (this.tabulator) {
            this.tabulator.setData(this.projectItemList);
          } else {
            setTimeout(() => {
              if (this.tabulator) {
                this.tabulator.setData(this.projectItemList);
              }
            }, 300);
          }
        } else {
          this.projectItemList = [];
          if (this.tabulator) {
            this.tabulator.setData([]);
          }
        }
        this.isLoading = false;
      },
      error: (error:any) => {
        this.notification.error(NOTIFICATION_TITLE.error,error.error?.message|| 'Lỗi khi tải danh sách hạng mục: ' + error.message);
        this.projectItemList = [];
        if (this.tabulator) {
          this.tabulator.setData([]);
        }
        this.isLoading = false;
      }
    });
  }

  confirmSelection() {
    if (this.selectedItems.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một hạng mục công việc');
      return;
    }

    // Lấy danh sách Mission từ các hạng mục đã chọn
    const missions = this.selectedItems
      .map(item => item.Mission)
      .filter(mission => mission && mission.trim() !== '')
      .join('; ');

    // Trả về danh sách Mission
    this.activeModal.close(missions);
  }
}


import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProjectGateStepService } from '../../project-gate/project-gate-step/project-gate-step.service';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-project-gate-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule
  ],
  templateUrl: './project-gate-task-detail.component.html',
  styleUrls: ['./project-gate-task-detail.component.css'],
  providers: [NzNotificationService]
})
export class ProjectGateTaskDetailComponent implements OnInit {
  projectId: number | null = null;
  projectCode: string = '';
  projectName: string = '';
  gateCode: string = '';
  gateName: string = '';
  stepContent: string = '';
  deptName: string = '';
  projectTaskId: number | null = null;

  isLoading: boolean = false;
  allTasks: any[] = [];
  filteredTasks: any[] = [];

  searchText: string = '';
  selectedStatus: number | null = null;

  constructor(
    @Optional() @Inject('tabData') public tabData: any,
    private tabService: TabServiceService,
    private projectGateStepService: ProjectGateStepService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    if (this.tabData) {
      this.projectId = this.tabData.projectId || null;
      this.projectCode = this.tabData.projectCode || '';
      this.projectName = this.tabData.projectName || '';
      this.gateCode = this.tabData.gateCode || (this.tabData.gateDetails?.gateCode || '');
      this.gateName = this.tabData.gateName || (this.tabData.gateDetails?.gateName || '');
      this.stepContent = this.tabData.stepContent || (this.tabData.stepDetail?.content || '');
      this.deptName = this.tabData.deptName || (this.tabData.deptDetail?.deptName || '');
      this.projectTaskId = this.tabData.projectTaskId || (this.tabData.stepDetail?.projectTaskID || null);

      if (this.tabData.detailTasks && Array.isArray(this.tabData.detailTasks) && this.tabData.detailTasks.length > 0) {
        this.allTasks = [...this.tabData.detailTasks];
        this.applyFilter();
      } else if (this.projectTaskId) {
        this.loadTasks();
      }
    }
  }

  loadTasks(): void {
    if (!this.projectTaskId) return;
    this.isLoading = true;
    this.projectGateStepService.getProjectItemParentChild(this.projectTaskId).subscribe({
      next: (res: any) => {
        this.allTasks = res?.data || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách công việc chi tiết!');
      }
    });
  }

  applyFilter(): void {
    let list = [...this.allTasks];

    if (this.selectedStatus !== null) {
      list = list.filter(t => t.Status === this.selectedStatus);
    }

    if (this.searchText && this.searchText.trim()) {
      const q = this.searchText.trim().toLowerCase();
      list = list.filter(t =>
        (t.Code && t.Code.toLowerCase().includes(q)) ||
        (t.Mission && t.Mission.toLowerCase().includes(q)) ||
        (t.AssigneeName && t.AssigneeName.toLowerCase().includes(q)) ||
        (t.AssignerName && t.AssignerName.toLowerCase().includes(q))
      );
    }

    this.filteredTasks = list;
  }

  getFormattedNames(names: string | null | undefined): string {
    if (!names) return '';
    return names.split(',').map(n => n.trim()).filter(n => n).join('\n');
  }

  get totalTaskCount(): number {
    return this.allTasks.length;
  }

  get completedTaskCount(): number {
    return this.allTasks.filter(t => t.Status === 2 || (t.PercentageActual || 0) === 100).length;
  }

  get inProgressTaskCount(): number {
    return this.allTasks.filter(t => t.Status === 1 && (t.PercentageActual || 0) < 100).length;
  }

  get pendingTaskCount(): number {
    return this.allTasks.filter(t => t.Status === 0 || t.Status === null || t.Status === undefined).length;
  }

  get totalEstimatedHours(): number {
    return this.allTasks.reduce((sum, t) => sum + (Number(t.EstimatedTime) || 0), 0);
  }

  closeTab(): void {
    if (this.tabData && this.tabData._tabKey) {
      this.tabService.closeTabByKey(this.tabData._tabKey);
    }
  }
}

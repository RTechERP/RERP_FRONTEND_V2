import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ProjectTaskService } from '../project-task/project-task.service';
import { IProjectTaskSetting } from '../../../models/kanban.interface';

@Component({
  selector: 'app-project-task-setting',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzSwitchModule, 
    NzCardModule, 
    NzIconModule, 
    NzSpinModule,
    NzButtonModule
  ],
  templateUrl: './project-task-setting.component.html',
  styleUrl: './project-task-setting.component.css'
})
export class ProjectTaskSettingComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  
  settings: IProjectTaskSetting = {
    ID: 0,
    SendMailCreateProjectTask: true,
    SendFinishProjectTask: true,
    SendApproveProjectTask: true
  };

  constructor(
    private projectTaskService: ProjectTaskService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.projectTaskService.getEmailBandData().subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          if (res.data) {
            this.settings = {
              ...this.settings,
              ...res.data
            };
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.message.error('Không thể tải cấu hình cài đặt');
        this.isLoading = false;
      }
    });
  }

  saveSettings(): void {
    if (this.isLoading) return; // Tránh lưu khi đang load
    this.isSaving = true;
    this.projectTaskService.saveEmailBandData(
      !!this.settings.SendMailCreateProjectTask,
      !!this.settings.SendFinishProjectTask,
      !!this.settings.SendApproveProjectTask
    ).subscribe({
      next: (res) => {
        if (res.status !== 200 && res.status !== 1) {
          this.message.error(res.message || 'Lỗi khi lưu cấu hình');
        }
        this.isSaving = false;
      },
      error: () => {
        this.message.error('Lỗi kết nối máy chủ khi lưu cấu hình');
        this.isSaving = false;
      }
    });
  }
}

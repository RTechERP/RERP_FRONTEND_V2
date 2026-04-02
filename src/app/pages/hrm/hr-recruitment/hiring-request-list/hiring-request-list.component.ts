import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { HRRecruitmentExamService } from '../HRRecruitmentExam/hr-recruitment-exam-service/hrrecruitment-exam.service';
import { AppUserService } from '../../../../services/app-user.service';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ExamScoreComponent } from '../../hr-recruitment-exam-score/exam-score/exam-score.component';

@Component({
  selector: 'app-hiring-request-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectButtonModule,
    TagModule,
    TooltipModule,
    NzSpinModule
  ],
  templateUrl: './hiring-request-list.component.html',
  styleUrls: ['./hiring-request-list.component.css']
})
export class HiringRequestListComponent implements OnInit {
  isLoading = false;
  isCompleted = false;
  listData: any[] = [];
  statusOptions = [
    { label: 'Đang thực hiện', value: false },
    { label: 'Đã hoàn thành', value: true }
  ];

  constructor(
    private hrExamService: HRRecruitmentExamService,
    private appUserService: AppUserService,
    private tabService: TabServiceService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const employeeID = this.appUserService.employeeID || 0;
    this.hrExamService.getDataHiringRequestByEmID(this.isCompleted, employeeID).subscribe({
      next: (res: any) => {
        this.listData = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách yêu cầu tuyển dụng');
        this.isLoading = false;
      }
    });
  }

  onStatusChange() {
    this.loadData();
  }

  evaluate(row: any) {
    // Chuyển sang trang đánh giá sử dụng TabService.openTabComp
    this.tabService.openTabComp({
      comp: ExamScoreComponent,
      title: 'Đánh giá: ' + (row.PositionName || row.ID),
      key: 'hr-recruitment-exam-score', // Dùng chung key route để đồng bộ
      data: {
        hiringRequestID: row.ID,
        departmentID: row.DepartmentID || 0,
        fromList: true
      }
    });
  }
}

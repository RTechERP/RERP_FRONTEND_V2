import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { DateTime } from 'luxon';
import { ProjectService } from '../../project/project-service/project.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DailyReportTechService } from '../../DailyReportTech/DailyReportTechService/daily-report-tech.service';
import { OverTimePersonFormComponent } from '../../hrm/over-time/over-time-person/over-time-person-form/over-time-person-form.component';
import { ProjectHistoryProblemComponent } from '../../project/project-history-problem/project-history-problem.component';
import { ProjectHistoryProblemService } from '../../project/project-history-problem/project-history-problem-service/project-history-problem.service';

interface Project {
  ID: number;
  ProjectID: number;
  ProjectCode: string;
  ProjectName: string;
  ProjectText: string;
  TotalHours: number;
  TotalHourOT: number;
  Content: string;
  Results: string;
  AdditionalInfo: {
    Problem: string;
    ProblemSolve: string;
    Backlog: string;
    Note: string;
  };
}

@Component({
  selector: 'app-daily-report-machine-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzCollapseModule,
    NzRadioModule,
  ],
  templateUrl: './daily-report-machine-detail.component.html',
  styleUrl: './daily-report-machine-detail.component.css'
})
export class DailyReportMachineDetailComponent implements OnInit, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataInput: any;
  @Input() currentUser: any;
  @Input() projects: any[] = [];

  formGroup: FormGroup;
  saving: boolean = false;

  // Danh sách dự án
  projectList: Project[] = [];
  activeProjectTab: number = 0; // 0-based index cho nzSelectedIndex

  // Kế hoạch ngày tiếp theo
  planNextDay: string = '';

  // Nơi làm việc (chung cho tất cả)
  workLocation: number = 1; // 1: VP RTC, 0: Địa điểm khác
  workLocationText: string = 'VP RTC'; // Mặc định "VP RTC"

  // Accordion state cho mỗi project (key: projectIndex)
  activeAccordion: { [key: number]: boolean } = {};

  // Template reference cho preview modal
  @ViewChild('previewModalContent', { static: false }) previewModalTemplate!: TemplateRef<any>;
  previewContent: string = '';

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modalService: NzModalService,
    private dailyReportTechService: DailyReportTechService,
    private ngbModal: NgbModal,
    private projectHistoryProblemService: ProjectHistoryProblemService,
  ) {
    this.formGroup = this.fb.group({
      DateReport: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);
      
      if (dailyID) {
        this.loadDataForEdit(dailyID);
      }
    } else {
      // Khởi tạo dự án đầu tiên cho chế độ add
      this.addProject();
      
      // Set ngày báo cáo mặc định theo quy tắc 9h sáng
      const now = DateTime.local();
      const currentHour = now.hour;
      
      if (currentHour >= 0 && currentHour <= 9) {
        this.formGroup.patchValue({
          DateReport: null
        });
      } else {
        this.formGroup.patchValue({
          DateReport: now.toJSDate()
        });
      }
    }
  }

  // Load dữ liệu để chỉnh sửa
  loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDataByID(dailyID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          // API có thể trả về 1 report hoặc nhiều reports
          const reports = Array.isArray(response.data) ? response.data : [response.data];
          
          // Reset projectList
          this.projectList = [];
          
          // Chuyển đổi dữ liệu từ flat sang nested structure
          reports.forEach((report: any) => {
            if (report && report.ProjectID) {
              const selectedProject = this.projects.find(p => p.ID === report.ProjectID);
              
          const project: Project = {
            ID: report.ID || 0,
            ProjectID: report.ProjectID || 0,
            ProjectCode: selectedProject?.ProjectCode || '',
            ProjectName: selectedProject?.ProjectName || '',
            ProjectText: selectedProject?.ProjectText || `${selectedProject?.ProjectCode || ''} - ${selectedProject?.ProjectName || ''}`,
            TotalHours: report.TotalHours || 0,
            TotalHourOT: report.TotalHourOT || 0,
            Content: report.Content || '',
            Results: report.Results || '',
            AdditionalInfo: {
              Problem: report.Problem || '',
              ProblemSolve: report.ProblemSolve || '',
              Backlog: report.Backlog || '',
              Note: report.Note || ''
            }
          };
              
              this.projectList.push(project);
            }
          });

          // Set DateReport từ report đầu tiên
          if (reports.length > 0 && reports[0].DateReport) {
            const dateReport = DateTime.fromISO(reports[0].DateReport).toJSDate();
            this.formGroup.patchValue({
              DateReport: dateReport
            });
          }

          // Set kế hoạch ngày tiếp theo (chung cho tất cả)
          if (reports.length > 0) {
            this.planNextDay = reports[0].PlanNextDay || '';
          }

          // Set workLocation (chung cho tất cả)
          if (reports.length > 0) {
            const locationText = reports[0].Location || reports[0].LocationText || '';
            if (locationText.trim().toUpperCase() === 'VP RTC') {
              this.workLocation = 1;
              this.workLocationText = 'VP RTC';
            } else {
              this.workLocation = 0;
              this.workLocationText = locationText;
            }
          }

          // Set active tab
          this.activeProjectTab = 0;
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tải dữ liệu báo cáo!');
        }
      },
      error: (error: any) => {
        console.error('Error loading daily report data:', error);
        this.notification.error('Lỗi', error?.error?.message || error?.message || 'Đã xảy ra lỗi khi tải dữ liệu!');
      }
    });
  }

  ngAfterViewInit(): void {
    
  }

  // Disable các ngày trước 1 ngày so với hôm nay
  disabledDate = (current: Date): boolean => {
    const today = DateTime.local().startOf('day');
    const oneDayAgo = today.minus({ days: 1 });
    const currentDate = DateTime.fromJSDate(current).startOf('day');
    return currentDate < oneDayAgo;
  };

  // Thêm dự án mới
  addProject(): void {
    const projectIndex = this.projectList.length; // 0-based index
    const newProject: Project = {
      ID: 0,
      ProjectID: 0,
      ProjectCode: '',
      ProjectName: '',
      ProjectText: '',
      TotalHours: 0,
      TotalHourOT: 0,
      Content: '',
      Results: '',
      AdditionalInfo: {
        Problem: '',
        ProblemSolve: '',
        Backlog: '',
        Note: ''
      }
    };
    this.projectList.push(newProject);
    this.activeProjectTab = projectIndex;
    // Khởi tạo accordion state cho project mới (mặc định đóng)
    this.activeAccordion[projectIndex] = false;
  }

  // Xóa dự án (từ nzClose event - nhận index 0-based)
  closeProjectTab({ index }: { index: number }): void {
    if (this.projectList.length > 1) {
      this.projectList.splice(index, 1);
      // Cập nhật lại active tab
      if (this.activeProjectTab >= this.projectList.length) {
        this.activeProjectTab = this.projectList.length - 1;
      }
      if (this.activeProjectTab < 0) {
        this.activeProjectTab = 0;
      }
    }
  }

  // Khi chọn dự án
  onProjectChange(projectIndex: number, projectId: number): void {
    const project = this.projectList[projectIndex];
    if (project && projectId > 0) {
      const selectedProject = this.projects.find(p => p.ID === projectId);
      if (selectedProject) {
        project.ProjectID = projectId;
        project.ProjectCode = selectedProject.ProjectCode || '';
        project.ProjectName = selectedProject.ProjectName || '';
        project.ProjectText = selectedProject.ProjectText || `${selectedProject.ProjectCode} - ${selectedProject.ProjectName}`;
        
        // Load vấn đề phát sinh và hướng giải quyết từ API
        this.loadProjectHistoryProblem(projectIndex, projectId);
      }
    } else if (project) {
      // Reset project khi không chọn project
      project.ProjectID = 0;
      project.ProjectCode = '';
      project.ProjectName = '';
      project.ProjectText = '';
      // Reset thông tin thêm
      if (project.AdditionalInfo) {
        project.AdditionalInfo.Problem = '';
        project.AdditionalInfo.ProblemSolve = '';
      }
    }
  }

  // Load vấn đề phát sinh và hướng giải quyết từ API
  loadProjectHistoryProblem(projectIndex: number, projectId: number): void {
    const project = this.projectList[projectIndex];
    if (!project) return;

    // Lấy ngày báo cáo từ form
    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      // Nếu chưa có ngày báo cáo, không load
      return;
    }

    // Gọi API để lấy vấn đề phát sinh
    this.projectHistoryProblemService.getProjectHistoryProblemByProject(projectId, dateReport).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          
          if (data.length > 0) {
            // Nối chuỗi các vấn đề phát sinh (contentError) và hướng giải quyết (remedies)
            const problems: string[] = [];
            const remedies: string[] = [];
            
            data.forEach((item: any) => {
              if (item.contentError && item.contentError.trim() !== '') {
                problems.push(item.contentError.trim());
              }
              if (item.remedies && item.remedies.trim() !== '') {
                remedies.push(item.remedies.trim());
              }
            });
            
            // Nối chuỗi với dấu 
            if (project.AdditionalInfo) {
              project.AdditionalInfo.Problem = problems
                .map((item, index) => `${index + 1}.${item}`)
                .join('\n');
            
              project.AdditionalInfo.ProblemSolve = remedies
                .map((item, index) => `${index + 1}.${item}`)
                .join('\n');
            }
          } else {
            // Nếu không có dữ liệu, reset về rỗng
            if (project.AdditionalInfo) {
              project.AdditionalInfo.Problem = '';
              project.AdditionalInfo.ProblemSolve = '';
            }
          }
        } else {
          // Nếu API trả về lỗi hoặc không có dữ liệu, reset về rỗng
          if (project.AdditionalInfo) {
            project.AdditionalInfo.Problem = '';
            project.AdditionalInfo.ProblemSolve = '';
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading project history problem:', error);
        // Nếu có lỗi, không làm gì (giữ nguyên giá trị hiện tại hoặc để rỗng)
        if (project.AdditionalInfo) {
          project.AdditionalInfo.Problem = '';
          project.AdditionalInfo.ProblemSolve = '';
        }
      }
    });
  }

  // Handle project tab change
  onProjectTabChange(event: any): void {
    let index: number;
    if (typeof event === 'number') {
      index = event;
    } else if (event && typeof event === 'object' && 'index' in event) {
      index = (event as any).index;
    } else {
      index = 0;
    }
    this.activeProjectTab = index; // 0-based index
  }

  // Thay đổi nơi làm việc (chung cho tất cả)
  onWorkLocationChange(location: number): void {
    this.workLocation = location;
    if (location === 1) {
      this.workLocationText = 'VP RTC'; // Tự động set "VP RTC" khi chọn VP RTC
    } else {
      this.workLocationText = ''; // Reset khi chọn Địa điểm khác
    }
  }

  // Khi thay đổi ngày báo cáo, reload vấn đề phát sinh cho tất cả các dự án đã chọn
  onDateReportChange(): void {
    // Reload vấn đề phát sinh cho tất cả các dự án đã chọn
    for (let i = 0; i < this.projectList.length; i++) {
      const project = this.projectList[i];
      if (project && project.ProjectID && project.ProjectID > 0) {
        this.loadProjectHistoryProblem(i, project.ProjectID);
      }
    }
  }

  // Toggle accordion cho project
  toggleAccordion(projectIndex: number): void {
    if (this.activeAccordion[projectIndex] === undefined) {
      this.activeAccordion[projectIndex] = false;
    }
    this.activeAccordion[projectIndex] = !this.activeAccordion[projectIndex];
  }

  // Validate dữ liệu
  validate(): boolean {
    return true;
  }

  // Tạo nội dung summary
  generateSummary(): string {
    const dateReport = this.formGroup.get('DateReport')?.value;
    const dateReportStr = dateReport ? DateTime.fromJSDate(dateReport).toFormat('dd/MM/yyyy') : '';

    let project = '';
    let projectItemContent = '';
    let resultReport = '';

    // Thu thập dữ liệu từ các dự án
    let problem = '';
    let problemSolve = '';
    let backlog = '';
    let note = '';

    for (let i = 0; i < this.projectList.length; i++) {
      const proj = this.projectList[i];
      if (!proj.ProjectID || proj.ProjectID === 0) continue;

      const selectedProject = this.projects.find(p => p.ID === proj.ProjectID);
      if (selectedProject) {
        const projectText = selectedProject.ProjectText || `${selectedProject.ProjectCode} - ${selectedProject.ProjectName}`;
        project += `${projectText}\n`;
      }

      const contentReport = proj.Content || '';
      const valueResultReport = proj.Results || '';

      projectItemContent += `${contentReport}\n`;
      resultReport += `${valueResultReport}\n`;

      // Thu thập thông tin thêm từ từng project
      if (proj.AdditionalInfo) {
        if (proj.AdditionalInfo.Problem) {
          problem += `${proj.ProjectCode || `Dự án ${i + 1}`}:\n${proj.AdditionalInfo.Problem}\n`;
        }
        if (proj.AdditionalInfo.ProblemSolve) {
          problemSolve += `${proj.ProjectCode || `Dự án ${i + 1}`}:\n${proj.AdditionalInfo.ProblemSolve}\n`;
        }
        if (proj.AdditionalInfo.Backlog) {
          backlog += `${proj.ProjectCode || `Dự án ${i + 1}`}:\n${proj.AdditionalInfo.Backlog}\n`;
        }
        if (proj.AdditionalInfo.Note) {
          note += `${proj.ProjectCode || `Dự án ${i + 1}`}:\n${proj.AdditionalInfo.Note}\n`;
        }
      }
    }

    // Tạo nội dung summary
    let contentSummary = `Báo cáo công việc ngày ${dateReportStr}\n`;
    contentSummary += `* Mã dự án - Tên dự án: \n${project.trim()}\n`;
    contentSummary += `\n* Nội dung công việc:\n${projectItemContent.trim()}\n`;
    contentSummary += `\n* Kết quả công việc:\n${resultReport.trim()}\n`;
    contentSummary += `\n* Tồn đọng:\n${backlog.trim() === '' ? '- Không có' : backlog.trim()}\n`;
    contentSummary += `\n* ${backlog.trim() === '' ? 'Ghi chú' : 'Lý do tồn đọng:'}\n${note.trim() === '' ? '- Không có' : note.trim()}\n`;
    contentSummary += `\n* Vấn đề phát sinh:\n${problem.trim() === '' ? '- Không có' : problem.trim()}\n`;
    contentSummary += `\n* Giải pháp cho vấn đề phát sinh:\n${problemSolve.trim() === '' ? '- Không có' : problemSolve.trim()}\n`;
    contentSummary += `\n* Kế hoạch ngày tiếp theo:\n${this.planNextDay.trim() === '' ? '- Không có' : this.planNextDay.trim()}\n`;

    return contentSummary;
  }

  // Copy vào clipboard
  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  }

  // Mở modal preview
  openPreviewModal(): void {
    const summaryContent = this.generateSummary();
   
    if (!summaryContent || summaryContent.trim() === '') {
      return;
    }
   
    // Set nội dung để bind vào template
    this.previewContent = summaryContent;
   
    const modal = this.modalService.create({
      nzTitle: 'Tổng hợp báo cáo',
      nzContent: this.previewModalTemplate,
      nzFooter: [
        {
          label: 'Huỷ',
          onClick: () => modal.destroy()
        },
        {
          label: 'Báo cáo',
          type: 'primary',
          onClick: async () => {
            const copySuccess = await this.copyToClipboard(summaryContent);
            if (copySuccess) {
              this.notification.success('Thông báo', 'Đã copy nội dung báo cáo vào clipboard!');
            } else {
              this.notification.warning('Thông báo', 'Không thể copy vào clipboard. Vui lòng copy thủ công.');
            }
            
            this.submitDailyReport();
            modal.destroy();
          }
        }
      ],
      nzWidth: '90%',
      nzStyle: { top: '20px', maxWidth: '1200px' },
      nzClosable: true,
      nzMaskClosable: false,
      nzBodyStyle: {
        padding: '0',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'hidden'
      }
    });
  }
  
  // Chuyển đổi dữ liệu sang format API (nhiều reports - 1 report cho mỗi dự án)
  private convertToFlatData(): any[] {
    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      return [];
    }
  
    const dateReportStr = DateTime.fromJSDate(dateReport).toFormat('yyyy-MM-dd');
    const userReport = this.currentUser?.ID || 0;
  
    const reports: any[] = [];
  
    // Duyệt qua từng dự án
    for (const project of this.projectList) {
      if (!project.ProjectID || project.ProjectID === 0) {
        continue;
      }
  
      // Tạo 1 báo cáo cho mỗi dự án
      const report: any = {
        ID: (this.mode === 'edit' && project.ID > 0) ? project.ID : 0,
        MasterID: 0,
        UserReport: userReport,
        DateReport: dateReportStr,
        ProjectID: project.ProjectID,
        ProjectItemID: 0, // Machine detail không có project item
        Content: project.Content || '',
        Results: project.Results || '',
        Problem: project.AdditionalInfo?.Problem || '',
        ProblemSolve: project.AdditionalInfo?.ProblemSolve || '',
        PlanNextDay: this.planNextDay || '',
        Note: project.AdditionalInfo?.Note || '',
        Backlog: project.AdditionalInfo?.Backlog || '',
        TotalHours: project.TotalHours || 0,
        TotalHourOT: project.TotalHourOT || 0,
        PercentComplete: 0, // Machine detail không có % hoàn thành
        Location: this.workLocationText || '',
        Type: 0,
        ReportLate: 0,
        StatusResult: 0,
        WorkPlanDetailID: 0,
        OldProjectID: 0,
        DeleteFlag: 0,
        Confirm: false
      };
  
      reports.push(report);
    }
  
    return reports;
  }

  // Validate dữ liệu
  private validateData(): { isValid: boolean; message: string } {
    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      return { isValid: false, message: 'Vui lòng nhập Ngày báo cáo!' };
    }

    // Validate PlanNextDay (chung cho tất cả)
    if (!this.planNextDay || this.planNextDay.trim() === '') {
      return { isValid: false, message: 'Vui lòng nhập Kế hoạch ngày tiếp theo!' };
    }

    // Validate workLocation (chung cho tất cả)
    if (this.workLocation === null || this.workLocation === undefined) {
      return { isValid: false, message: 'Vui lòng chọn Nơi làm việc!' };
    }

    // Validate workLocationText: nếu chọn "Địa điểm khác" (0) thì phải nhập LocationText
    if (this.workLocation === 0 && (!this.workLocationText || this.workLocationText.trim() === '')) {
      return { isValid: false, message: 'Vui lòng nhập Nơi làm việc khi chọn "Địa điểm khác"!' };
    }

    // Validate từng tab dự án
    for (let i = 0; i < this.projectList.length; i++) {
      const project = this.projectList[i];
      const projectIndex = i + 1;

      // Validate ProjectID
      if (!project.ProjectID || project.ProjectID <= 0) {
        return { isValid: false, message: `Vui lòng chọn Dự án cho tab "Dự án ${projectIndex}"!` };
      }

      // Validate TotalHours
      if (!project.TotalHours || project.TotalHours <= 0) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Tổng số giờ phải lớn hơn 0!` };
      }

      if (project.TotalHours > 24) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Tổng số giờ không được lớn hơn 24!` };
      }

      // Validate TotalHourOT
      const totalHourOT = project.TotalHourOT || 0;
      if (totalHourOT < 0) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Số giờ OT không được nhỏ hơn 0!` };
      }

      if (totalHourOT > project.TotalHours) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Số giờ OT không được lớn hơn Tổng số giờ!` };
      }

      // Validate: Nếu TotalHours > 8 thì phải có TotalHourOT > 0
      if (project.TotalHours > 8 && totalHourOT <= 0) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Tổng số giờ lớn hơn 8, vui lòng nhập Số giờ OT!` };
      }

      // Validate: Số giờ hành chính (TotalHours - TotalHourOT) không được > 8
      if (project.TotalHours - totalHourOT > 8) {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Số giờ hành chính (Tổng số giờ - Số giờ OT) không được lớn hơn 8 giờ!` };
      }

      // Validate Content
      if (!project.Content || project.Content.trim() === '') {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Vui lòng nhập Nội dung công việc!` };
      }

      // Validate Results
      if (!project.Results || project.Results.trim() === '') {
        const projectCode = project.ProjectCode || `Dự án ${projectIndex}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Vui lòng nhập Kết quả!` };
      }
    }

    // Validate tổng số giờ hành chính trong ngày <= 8
    const reports = this.convertToFlatData();
    if (reports.length > 0) {
      const groupedByDate = reports.reduce((acc: any, report: any) => {
        const date = report.DateReport;
        if (!acc[date]) {
          acc[date] = { totalHours: 0, totalHourOT: 0 };
        }
        acc[date].totalHours += report.TotalHours || 0;
        acc[date].totalHourOT += report.TotalHourOT || 0;
        return acc;
      }, {});

      for (const date in groupedByDate) {
        const totalWorkingHours = groupedByDate[date].totalHours - groupedByDate[date].totalHourOT;
        if (totalWorkingHours > 8) {
          return { isValid: false, message: 'Tổng [Số giờ] - Tổng [Số giờ OT] trong 1 ngày KHÔNG được lớn hơn 8h. Vui lòng kiểm tra lại!' };
        }
      }
    }

    return { isValid: true, message: '' };
  }

  // Submit báo cáo (gọi API)
  submitDailyReport(): void {
    if (this.saving) {
      return;
    }

    const reports = this.convertToFlatData();
    if (reports.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    const validation = this.validateData();
    if (!validation.isValid) {
      this.notification.warning('Thông báo', validation.message);
      return;
    }

    this.saving = true;

    // Gọi API (sử dụng service của tech, có thể cần tạo service riêng cho machine sau)
    this.dailyReportTechService.saveReportTechnical(reports).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.status === 1) {
          this.notification.success('Thông báo', response.message || 'Báo cáo đã được lưu thành công!');
          this.close(true);
        } else {
          this.notification.error('Thông báo', response?.message || 'Lưu báo cáo thất bại!');
        }
      },
      error: (error: any) => {
        this.saving = false;
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu báo cáo!';
        this.notification.error('Thông báo', errorMessage);
      }
    });
  }

  // Lưu dữ liệu
  saveDailyReport(): void {
    if (this.saving) {
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      
      const errors: string[] = [];
      
      if (this.formGroup.get('DateReport')?.hasError('required')) {
        errors.push('Ngày báo cáo');
      }
      
      if (errors.length > 0) {
        this.notification.warning('Thông báo', `Vui lòng điền đầy đủ các trường bắt buộc: ${errors.join(', ')}`);
      } else {
        this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      }
      return;
    }

    const validation = this.validateData();
    if (!validation.isValid) {
      this.notification.warning('Thông báo', validation.message);
      return;
    }

    if (!this.validate()) {
      return;
    }

    this.openPreviewModal();
  }

  close(success: boolean = false): void {
    this.activeModal.close(success);
  }

  openOverTimeModal(): void {
    try {
      const modalRef = this.ngbModal.open(OverTimePersonFormComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        windowClass: 'overtime-modal-custom'
      });
      
      if (!modalRef) {
        this.notification.error('Lỗi', 'Không thể mở modal làm thêm!');
        return;
      }
      
      if (modalRef.componentInstance) {
        modalRef.componentInstance.data = null;
        modalRef.componentInstance.isEditMode = false;
      }
      
      modalRef.result.then(
        (result) => {
          // Xử lý khi đóng modal
        },
        (reason) => {
          // Modal bị đóng mà không có kết quả
        }
      ).catch((error) => {
        console.error('Error in modal result:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi mở modal làm thêm!');
      });
    } catch (error) {
      console.error('Error in openOverTimeModal:', error);
      this.notification.error('Lỗi', 'Không thể mở modal làm thêm! Vui lòng thử lại.');
    }
  }

  // Mở lịch sử phát sinh
  openHistoryModal(): void {
    // Lấy dự án từ tab đang active
    if (this.projectList.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng thêm ít nhất một dự án!');
      return;
    }

    const activeProject = this.projectList[this.activeProjectTab];
    if (!activeProject || !activeProject.ProjectID || activeProject.ProjectID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án ở tab đang active!');
      return;
    }

    const projectId = activeProject.ProjectID;
    // Lấy projectCode từ activeProject hoặc tìm từ danh sách projects
    let projectCode = activeProject.ProjectCode || '';
    
    if (!projectCode) {
      const selectedProject = this.projects.find(p => p.ID === projectId);
      if (selectedProject) {
        projectCode = selectedProject.ProjectCode || '';
      }
    }

    if (!projectCode) {
      this.notification.error('Lỗi', 'Không tìm thấy mã dự án!');
      return;
    }

    try {
      const modalRef = this.ngbModal.open(ProjectHistoryProblemComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'full-screen-modal',
        size: 'xl'
      });

      if (!modalRef || !modalRef.componentInstance) {
        this.notification.error('Lỗi', 'Không thể mở modal lịch sử phát sinh!');
        return;
      }

      modalRef.componentInstance.projectId = projectId;
      modalRef.componentInstance.projectCode = projectCode;

      modalRef.result.then((result) => {
        // Xử lý khi modal đóng với kết quả (close)
        // Luôn load lại dữ liệu sau khi modal đóng
        this.loadProjectHistoryProblem(this.activeProjectTab, projectId);
      }).catch((reason) => {
        // Modal bị đóng bằng dismiss - vẫn load lại dữ liệu
        this.loadProjectHistoryProblem(this.activeProjectTab, projectId);
        console.log('Modal dismissed:', reason);
      });
    } catch (error) {
      console.error('Error in openHistoryModal:', error);
      this.notification.error('Lỗi', 'Không thể mở modal lịch sử phát sinh! Vui lòng thử lại.');
    }
  }
}

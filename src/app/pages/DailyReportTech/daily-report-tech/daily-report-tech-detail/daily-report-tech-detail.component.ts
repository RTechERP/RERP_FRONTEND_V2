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
import { ProjectService } from '../../../project/project-service/project.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DailyReportTechService } from '../../DailyReportTechService/daily-report-tech.service';
import { OverTimePersonFormComponent } from '../../../hrm/over-time/over-time-person/over-time-person-form/over-time-person-form.component';
import { WorkItemComponent } from '../../../project/work-item/work-item.component';
import { ProjectItemPersonDetailComponent } from '../../../project/project-item-person/project-item-person-detail/project-item-person-detail.component';
interface ProjectItem {
  ID: number;
  ProjectID: number;
  ProjectItemID: number;
  ProjectItemCode: string;
  ProjectItemName: string;
  TotalHours: number;
  TotalHourOT: number;
  PercentComplete: number;
  Location: number; // 1: VP RTC, 0: Địa điểm khác
  LocationText: string; // Text khi chọn địa điểm khác
  Content: string;
  Results: string;
  PlanNextDay: string;
  Problem: string;
  ProblemSolve: string;
  Backlog: string;
  Note: string;
}

interface Project {
  ID: number;
  ProjectID: number;
  ProjectCode: string;
  ProjectName: string;
  ProjectText: string;
  ProjectItems: ProjectItem[];
  activeItemTab?: number; // Active tab index cho hạng mục công việc (0-based)
}

@Component({
  selector: 'app-daily-report-tech-detail',
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
  templateUrl: './daily-report-tech-detail.component.html',
  styleUrl: './daily-report-tech-detail.component.css'
})
export class DailyReportTechDetailComponent implements OnInit, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataInput: any;
  @Input() currentUser: any;
  @Input() projects: any[] = [];
  @Input() projectItems: any[] = [];

  formGroup: FormGroup;
  saving: boolean = false;

  // Danh sách dự án với hạng mục
  projectList: Project[] = [];
  activeProjectTab: number = 0; // 0-based index cho nzSelectedIndex
  projectItemIndex: { [key: number]: number } = {}; // Lưu index hạng mục cho mỗi dự án

  // Lưu project items theo project ID (key có thể là number hoặc string)
  projectItemsMap: { [key: number | string]: any[] } = {};

  // Kế hoạch ngày tiếp theo (chung cho tất cả)
  planNextDay: string = '';

  // Nơi làm việc (chung cho tất cả)
  workLocation: number = 1; // 1: VP RTC, 0: Địa điểm khác
  workLocationText: string = 'VP RTC'; // Mặc định "VP RTC"

  // Thông tin thêm (chung cho tất cả)
  additionalInfo: {
    Problem: string;
    ProblemSolve: string;
    Backlog: string;
    Note: string;
  } = {
      Problem: '',
      ProblemSolve: '',
      Backlog: '',
      Note: ''
    };

  // Accordion state
  activeAccordion: { [key: string]: boolean } = {
    additional_info: false // Mặc định đóng
  };

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
  ) {
    this.formGroup = this.fb.group({
      DateReport: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      // dataInput có thể là ID (number) hoặc object có ID
      const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);

      if (dailyID) {
        this.loadDataForEdit(dailyID);
      }
    } else {
      // Khởi tạo dự án đầu tiên cho chế độ add
      this.addProject();

      // Set ngày báo cáo mặc định theo quy tắc 9h sáng (RTCWeb pattern)
      const now = DateTime.local();
      const currentHour = now.hour;

      // Nếu từ 0h-9h sáng: để trống (null) buộc user chọn ngày
      // Nếu sau 9h: mặc định là ngày hiện tại
      if (currentHour >= 0 && currentHour <= 9) {
        this.formGroup.patchValue({
          DateReport: null
        });
      } else {
        this.formGroup.patchValue({
          DateReport: now.toFormat('yyyy-MM-dd')
        });
      }
    }
  }

  // Load dữ liệu để chỉnh sửa
  loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDataByID(dailyID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          // Chuyển đổi dữ liệu từ flat sang nested structure
          this.convertFlatToNested(response.data);
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

  // Chuyển đổi dữ liệu từ flat (API response) sang nested structure (projectList)
  // API trả về 1 báo cáo duy nhất (1 dự án, 1 project item)
  private convertFlatToNested(data: any): void {
    // data có thể là một object hoặc một array với 1 phần tử
    const report = Array.isArray(data) ? data[0] : data;

    if (!report || !report.ProjectID || !report.ProjectItemID) {
      this.notification.warning('Thông báo', 'Dữ liệu báo cáo không hợp lệ!');
      return;
    }

    // Reset projectList
    this.projectList = [];
    this.projectItemIndex = {};

    const projectID = report.ProjectID;
    const projectItemID = report.ProjectItemID;

    // Load project items cho project này
    this.loadProjectItems(projectID, 1);

    // Đợi project items được load (có thể cần điều chỉnh timeout)
    setTimeout(() => {
      // Tìm project từ danh sách projects
      const selectedProject = this.projects.find(p => p.ID === projectID);

      // Tìm projectItem từ project items đã load
      const projectItems = this.projectItemsMap[projectID] || [];
      const selectedItem = projectItems.find(pi => pi.ID === projectItemID);

      // Tạo project với 1 projectItem
      const project: Project = {
        ID: 0,
        ProjectID: projectID,
        ProjectCode: selectedProject?.ProjectCode || '',
        ProjectName: selectedProject?.ProjectName || '',
        ProjectText: selectedProject?.ProjectText || `${selectedProject?.ProjectCode || ''} - ${selectedProject?.ProjectName || ''}`,
        ProjectItems: [],
        activeItemTab: 0
      };

      // Tạo projectItem từ report
      const projectItem: ProjectItem = {
        ID: report.ID || 0,
        ProjectID: projectID,
        ProjectItemID: projectItemID,
        ProjectItemCode: selectedItem?.Code || selectedItem?.ProjectItemCode || report.ProjectItemCode || '',
        ProjectItemName: selectedItem?.Mission || selectedItem?.ProjectItemName || report.ProjectItemName || '',
        TotalHours: report.TotalHours || 0,
        TotalHourOT: report.TotalHourOT || 0,
        PercentComplete: report.PercentComplete || 0,
        Location: report.Location || 0,
        LocationText: report.LocationText || '',
        Content: report.Content || '',
        Results: report.Results || '',
        PlanNextDay: report.PlanNextDay || '',
        Problem: report.Problem || '',
        ProblemSolve: report.ProblemSolve || '',
        Backlog: report.Backlog || '',
        Note: report.Note || ''
      };

      // Thêm projectItem vào project
      project.ProjectItems.push(projectItem);

      // Thêm project vào projectList
      this.projectList.push(project);

      if (report.DateReport) {
        const dateReport = DateTime.fromISO(report.DateReport).toFormat('yyyy-MM-dd');
        this.formGroup.patchValue({
          DateReport: dateReport
        });
      }

      // Set PlanNextDay (chung cho tất cả)
      if (report.PlanNextDay) {
        this.planNextDay = report.PlanNextDay;
      }

      // Set workLocation (chung cho tất cả)
      // Location giờ là string (workLocationText), nếu là "VP RTC" thì workLocation = 1, ngược lại = 0
      const locationText = report.Location || report.LocationText || '';
      if (locationText.trim().toUpperCase() === 'VP RTC') {
        this.workLocation = 1;
        this.workLocationText = 'VP RTC';
      } else {
        this.workLocation = 0;
        this.workLocationText = locationText;
      }

      // Set additionalInfo
      this.additionalInfo.Problem = report.Problem || '';
      this.additionalInfo.ProblemSolve = report.ProblemSolve || '';
      this.additionalInfo.Backlog = report.Backlog || '';
      this.additionalInfo.Note = report.Note || '';

      // Set active tab
      this.activeProjectTab = 0;
      if (project.ProjectItems.length > 0) {
        project.activeItemTab = 0;
      }
    }, 200); // Đợi 200ms để project items được load
  }

  ngAfterViewInit(): void {

  }

  // Disable các ngày trước 1 ngày so với hôm nay
  disabledDate = (current: Date): boolean => {
    const today = DateTime.local().startOf('day');
    const oneDayAgo = today.minus({ days: 1 });
    const currentDate = DateTime.fromJSDate(current).startOf('day');
    // Disable nếu ngày hiện tại < 1 ngày trước (tức là trước 1 ngày trước)
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
      ProjectItems: [],
      activeItemTab: 0 // 0-based index
    };
    this.projectList.push(newProject);
    this.activeProjectTab = projectIndex;
    this.projectItemIndex[projectIndex + 1] = 1; // 1-based cho logic cũ

    // Thêm hạng mục đầu tiên cho dự án mới
    this.addProjectItem(projectIndex + 1);
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

  // Xóa dự án (method cũ - giữ lại để tương thích)
  removeProject(projectIndex: number): void {
    if (this.projectList.length > 1) {
      this.projectList.splice(projectIndex - 1, 1);
      // Cập nhật lại index
      this.projectList.forEach((p, index) => {
        const newIndex = index + 1;
        if (this.projectItemIndex[projectIndex]) {
          delete this.projectItemIndex[projectIndex];
        }
      });
      if (this.activeProjectTab > this.projectList.length) {
        this.activeProjectTab = this.projectList.length;
      }
    }
  }

  // Thêm hạng mục cho dự án
  addProjectItem(projectIndex: number): void {
    const project = this.projectList[projectIndex - 1];
    if (!project) return;

    const itemIndex = (this.projectItemIndex[projectIndex] || 0) + 1;
    this.projectItemIndex[projectIndex] = itemIndex;

    const newItem: ProjectItem = {
      ID: 0,
      ProjectID: 0,
      ProjectItemID: 0,
      ProjectItemCode: '',
      ProjectItemName: '',
      TotalHours: 0,
      TotalHourOT: 0,
      PercentComplete: 0,
      Location: 1, // Mặc định VP RTC
      LocationText: '',
      Content: '',
      Results: '',
      PlanNextDay: '',
      Problem: '',
      ProblemSolve: '',
      Backlog: '',
      Note: ''
    };
    project.ProjectItems.push(newItem);
    // Set active tab to the newly added item (0-based)
    project.activeItemTab = project.ProjectItems.length - 1;
  }

  // Xóa hạng mục (từ nzClose event - nhận index 0-based)
  closeProjectItemTab(projectIndex: number, { index }: { index: number }): void {
    const project = this.projectList[projectIndex - 1];
    if (project && project.ProjectItems.length > 1) {
      project.ProjectItems.splice(index, 1);
      // Cập nhật lại active tab
      if (project.activeItemTab && project.activeItemTab >= project.ProjectItems.length) {
        project.activeItemTab = project.ProjectItems.length - 1;
      }
      if (project.activeItemTab && project.activeItemTab < 0) {
        project.activeItemTab = 0;
      }
    }
  }

  // Xóa hạng mục
  removeProjectItem(projectIndex: number, itemIndex: number): void {
    const project = this.projectList[projectIndex - 1];
    if (project && project.ProjectItems.length > 1) {
      project.ProjectItems.splice(itemIndex - 1, 1);
      // Cập nhật lại index
      this.projectItemIndex[projectIndex] = project.ProjectItems.length;
    }
  }

  // Khi chọn dự án
  onProjectChange(projectIndex: number, projectId: number): void {
    const project = this.projectList[projectIndex - 1];
    if (project && projectId > 0) {
      const selectedProject = this.projects.find(p => p.ID === projectId);
      if (selectedProject) {
        project.ProjectID = projectId;
        project.ProjectCode = selectedProject.ProjectCode || '';
        project.ProjectName = selectedProject.ProjectName || '';
        project.ProjectText = `${selectedProject.ProjectCode} - ${selectedProject.ProjectName}`;

        // Load project items cho project này
        this.loadProjectItems(projectId, projectIndex);
      }
    } else {
      // Reset project khi không chọn project
      project.ProjectID = 0;
      project.ProjectCode = '';
      project.ProjectName = '';
      project.ProjectText = '';
      project.ProjectItems = [];
      project.activeItemTab = 0;
      this.projectItemsMap[projectIndex] = [];
    }
  }

  // Load project items theo project ID (đơn giản hóa)
  loadProjectItems(projectId: number, projectIndex: number): void {
    if (!projectId || projectId === 0) {
      this.projectItemsMap[projectIndex] = [];
      return;
    }

    // Xác định status: -1 khi edit, 2 khi add
    const status = this.mode === 'edit' ? -1 : 2;

    // Gọi API với projectId và status
    this.dailyReportTechService.getProjectItemByUser(projectId, status).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const items = Array.isArray(response.data) ? response.data : [];
          // Lưu vào map theo projectId và projectIndex
          this.projectItemsMap[projectId] = items;
          this.projectItemsMap[projectIndex] = items;
        } else {
          this.projectItemsMap[projectId] = [];
          this.projectItemsMap[projectIndex] = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading project items:', error);
        this.projectItemsMap[projectId] = [];
        this.projectItemsMap[projectIndex] = [];
      }
    });
  }

  // Lấy project items cho một project (đơn giản hóa)
  getProjectItemsForProject(projectIndex: number): any[] {
    const project = this.projectList[projectIndex - 1];
    if (!project || !project.ProjectID) {
      return [];
    }
    // Ưu tiên lấy theo ProjectID, nếu không có thì lấy theo index
    return this.projectItemsMap[project.ProjectID] || this.projectItemsMap[projectIndex] || [];
  }

  // Khi chọn hạng mục
  onProjectItemChange(projectIndex: number, itemIndex: number, projectItemId: number): void {
    const project = this.projectList[projectIndex - 1];
    if (project) {
      const item = project.ProjectItems[itemIndex - 1];
      if (item) {
        if (projectItemId > 0) {
          // Tìm trong project items của project này
          const projectItems = this.getProjectItemsForProject(projectIndex);
          const selectedItem = projectItems.find(pi => pi.ID === projectItemId);

          if (selectedItem) {
            item.ProjectItemID = projectItemId;
            item.ProjectItemCode = selectedItem.Code || selectedItem.ProjectItemCode || '';
            item.ProjectItemName = selectedItem.Mission || selectedItem.ProjectItemName || '';
            // Tự động điền nội dung công việc từ Mission
            if (selectedItem.Mission && !item.Content) {
              item.Content = selectedItem.Mission;
            }
            // Tự động điền % hoàn thành
            if (selectedItem.PercentageActual !== undefined && selectedItem.PercentageActual !== null) {
              item.PercentComplete = selectedItem.PercentageActual;
            }
          }
        } else {
          // Reset khi không chọn project item
          item.ProjectItemID = 0;
          item.ProjectItemCode = '';
          item.ProjectItemName = '';
        }
      }
    }
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

  // Handle project item tab change
  onProjectItemTabChange(projectIndex: number, event: any): void {
    const project = this.projectList[projectIndex - 1];
    if (project) {
      // nzSelectChange có thể trả về number hoặc NzTabChangeEvent
      let index: number;
      if (typeof event === 'number') {
        index = event;
      } else if (event && typeof event === 'object' && 'index' in event) {
        index = (event as any).index;
      } else {
        index = 0;
      }
      project.activeItemTab = index;
    }
  }

  // Toggle accordion
  toggleAccordion(key: string): void {
    this.activeAccordion[key] = !this.activeAccordion[key];
  }

  // Handle project tab change (không cần thiết nữa vì dùng [(nzSelectedIndex)])
  onProjectTabChange(event: any): void {
    // nzSelectChange có thể trả về number hoặc NzTabChangeEvent
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

  // Validate dữ liệu
  validate(): boolean {
    // TODO: Implement validate logic
    // Hiện tại để rỗng, return true
    return true;
  }

  // Tạo nội dung summary
  generateSummary(): string {
    const dateReport = this.formGroup.get('DateReport')?.value;
    const dateReportStr = dateReport
      ? (typeof dateReport === 'string'
        ? DateTime.fromISO(dateReport).toFormat('dd/MM/yyyy')
        : DateTime.fromJSDate(dateReport).toFormat('dd/MM/yyyy'))
      : '';

    let project = '';
    let projectItemContent = '';
    let resultReport = '';
    let backlog = '';
    let problem = '';
    let problemSolve = '';
    let planNextDay = this.planNextDay || '';
    let note = '';

    // Kiểm tra trùng theo cặp (ProjectID + ProjectItemID)
    // Cho phép nhiều tab cùng dự án, nhưng không cho phép cùng dự án + cùng hạng mục
    const projectItemPairs: string[] = []; // Format: "ProjectID_ProjectItemID"

    // Thu thập dữ liệu từ các dự án
    for (let i = 0; i < this.projectList.length; i++) {
      const proj = this.projectList[i];
      if (!proj.ProjectID || proj.ProjectID === 0) continue;

      const selectedProject = this.projects.find(p => p.ID === proj.ProjectID);
      if (selectedProject) {
        const projectText = selectedProject.ProjectText || `${selectedProject.ProjectCode} - ${selectedProject.ProjectName}`;
        project += `${projectText}\n`;
      }

      // Thu thập dữ liệu từ các hạng mục công việc
      for (let j = 0; j < proj.ProjectItems.length; j++) {
        const item = proj.ProjectItems[j];
        if (!item.ProjectItemID || item.ProjectItemID === 0) continue;

        // Kiểm tra trùng cặp (ProjectID + ProjectItemID)
        const pairKey = `${proj.ProjectID}_${item.ProjectItemID}`;
        if (projectItemPairs.includes(pairKey)) {
          const projectItems = this.getProjectItemsForProject(i + 1);
          const selectedItem = projectItems.find(pi => pi.ID === item.ProjectItemID);
          const projectItemCode = selectedItem ? (selectedItem.Code || selectedItem.ProjectItemCode || '') : '';
          const projectCode = selectedProject ? (selectedProject.ProjectCode || '') : '';
          this.notification.warning('Thông báo', `Bạn đã báo cáo cho hạng mục công việc [${projectItemCode}] trong dự án [${projectCode}]!\nVui lòng kiểm tra lại!`);
          return '';
        }
        projectItemPairs.push(pairKey);

        // Lấy thông tin hạng mục công việc
        const projectItems = this.getProjectItemsForProject(i + 1);
        const selectedItem = projectItems.find(pi => pi.ID === item.ProjectItemID);
        const projectItemCode = selectedItem ? (selectedItem.Code || selectedItem.ProjectItemCode || '') : '';

        const contentReport = item.Content || '';
        const valueResultReport = item.Results || '';
        const valueProblem = item.Problem || '';
        const valueProblemSolve = item.ProblemSolve || '';
        const valueBacklog = item.Backlog || '';
        const valueNote = item.Note || '';

        // Format nội dung (theo code mẫu)
        if (projectItemCode && projectItemCode !== '--Chọn') {
          projectItemContent += `${projectItemCode}:\n${contentReport}\n`;
          resultReport += `${projectItemCode}:\n${valueResultReport}\n`;
          problem += valueProblem ? `${projectItemCode}:\n${valueProblem}\n` : '';
          problemSolve += valueProblemSolve ? `${projectItemCode}:\n${valueProblemSolve}\n` : '';
          backlog += valueBacklog ? `${projectItemCode}:\n${valueBacklog}\n` : '';
          note += valueNote ? `${projectItemCode}:\n${valueNote}\n` : '';
        } else {
          projectItemContent += `${contentReport}\n`;
          resultReport += `${valueResultReport}\n`;
          problem += valueProblem ? `${valueProblem}\n` : '';
          problemSolve += valueProblemSolve ? `${valueProblemSolve}\n` : '';
          backlog += valueBacklog ? `${valueBacklog}\n` : '';
          note += valueNote ? `${valueNote}\n` : '';
        }
      }
    }

    // Thu thập thông tin thêm (chung cho tất cả)
    if (this.additionalInfo.Problem) {
      problem += this.additionalInfo.Problem + '\n';
    }
    if (this.additionalInfo.ProblemSolve) {
      problemSolve += this.additionalInfo.ProblemSolve + '\n';
    }
    if (this.additionalInfo.Backlog) {
      backlog += this.additionalInfo.Backlog + '\n';
    }
    if (this.additionalInfo.Note) {
      note += this.additionalInfo.Note + '\n';
    }

    // Tạo nội dung summary (theo format của code mẫu)
    let contentSummary = `Báo cáo công việc ngày ${dateReportStr}\n`;
    contentSummary += `* Mã dự án - Tên dự án: \n${project.trim()}\n`;
    contentSummary += `\n* Nội dung công việc:\n${projectItemContent.trim()}\n`;
    contentSummary += `\n* Kết quả công việc:\n${resultReport.trim()}\n`;
    contentSummary += `\n* Tồn đọng:\n${backlog.trim() === '' ? '- Không có' : backlog.trim()}\n`;
    contentSummary += `\n* ${backlog.trim() === '' ? 'Ghi chú' : 'Lý do tồn đọng:'}\n${note.trim() === '' ? '- Không có' : note.trim()}\n`;
    contentSummary += `\n* Vấn đề phát sinh:\n${problem.trim() === '' ? '- Không có' : problem.trim()}\n`;
    contentSummary += `\n* Giải pháp cho vấn đề phát sinh:\n${problemSolve.trim() === '' ? '- Không có' : problemSolve.trim()}\n`;
    contentSummary += `\n* Kế hoạch ngày tiếp theo:\n${planNextDay.trim() === '' ? '- Không có' : planNextDay.trim()}\n`;

    return contentSummary;
  }

  // Copy vào clipboard
  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      // Sử dụng Clipboard API hiện đại (nếu trình duyệt hỗ trợ)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback cho trình duyệt cũ
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  }


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
            // Copy vào clipboard trước khi submit
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
      nzWidth: '85%',
      nzStyle: {
        top: '50px',
        maxWidth: '1200px'
      },
      nzClosable: true,
      nzMaskClosable: false,
      nzBodyStyle: {
        padding: '0',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'hidden'
      },
      nzClassName: 'custom-report-modal'
    });
  }

  // Chuyển đổi dữ liệu từ nested sang flat (1 project + 1 projectItem = 1 report)
  private convertToFlatData(): any[] {
    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      return [];
    }

    // Format date thành YYYY-MM-DD - dateReport có thể là string (từ input type="date") hoặc Date object (từ nz-date-picker)
    const dateReportStr = typeof dateReport === 'string'
      ? dateReport
      : DateTime.fromJSDate(dateReport).toFormat('yyyy-MM-dd');
    const userReport = this.currentUser?.ID || 0;

    const reports: any[] = [];

    // Duyệt qua từng dự án
    for (const project of this.projectList) {
      if (!project.ProjectID || project.ProjectID === 0) {
        continue;
      }

      // Duyệt qua từng hạng mục công việc trong dự án
      for (const item of project.ProjectItems) {
        if (!item.ProjectItemID || item.ProjectItemID === 0) {
          continue;
        }

        // Tạo 1 báo cáo cho mỗi cặp project + projectItem
        // Nếu ở chế độ edit và item có ID, giữ lại ID để update
        const report: any = {
          ID: (this.mode === 'edit' && item.ID > 0) ? item.ID : 0, // Giữ ID nếu edit, ngược lại = 0 (tạo mới)
          MasterID: 0,
          UserReport: userReport,
          DateReport: dateReportStr,
          ProjectID: project.ProjectID,
          ProjectItemID: item.ProjectItemID,
          Content: item.Content || '',
          Results: item.Results || '',
          Problem: item.Problem || this.additionalInfo.Problem || '',
          ProblemSolve: item.ProblemSolve || this.additionalInfo.ProblemSolve || '',
          PlanNextDay: this.planNextDay || '',
          Note: item.Note || this.additionalInfo.Note || '',
          Backlog: item.Backlog || this.additionalInfo.Backlog || '',
          TotalHours: item.TotalHours || 0,
          TotalHourOT: item.TotalHourOT || 0,
          PercentComplete: item.PercentComplete || 0,
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
    }

    return reports;
  }
  // Lấy prefix cho message lỗi (hạng mục hoặc công việc)
  private getMessagePrefix(projectID: number, projectItemID: number): string {
    // Tìm project
    const project = this.projects.find(p => p.ID === projectID);
    const projectCode = project?.ProjectCode || '';

    // Tìm projectItem từ projectItemsMap
    let projectItemCode = '';
    const projectItems = this.projectItemsMap[projectID] || [];
    const item = projectItems.find(pi => pi.ID === projectItemID);
    if (item) {
      projectItemCode = item.Code || item.ProjectItemCode || '';
    }

    // Nếu có projectItemCode thì dùng "Hạng mục [{projectItemCode}]"
    if (projectItemCode && projectItemCode.trim() !== '') {
      return `Hạng mục [${projectItemCode}]`;
    }

    // Nếu chưa có thì dùng "Công việc [{ProjectCode}]"
    if (projectCode && projectCode.trim() !== '') {
      return `Công việc [${projectCode}]`;
    }

    return '';
  }

  // Validate tất cả các tab (kể cả tab trống)
  private validateAllTabs(): { isValid: boolean; message: string } {
    // Validate DateReport
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

      // Validate từng tab hạng mục trong dự án
      if (!project.ProjectItems || project.ProjectItems.length === 0) {
        return { isValid: false, message: `Dự án ${projectIndex}: Vui lòng thêm ít nhất một hạng mục công việc!` };
      }

      for (let j = 0; j < project.ProjectItems.length; j++) {
        const item = project.ProjectItems[j];
        const itemIndex = j + 1;

        // Validate ProjectItemID
        if (!item.ProjectItemID || item.ProjectItemID <= 0) {
          const prefix = this.getMessagePrefix(project.ProjectID, 0);
          const prefixText = prefix ? `${prefix} - ` : '';
          return { isValid: false, message: `${prefixText}Vui lòng chọn Hạng mục công việc cho tab "CV-${itemIndex}"!` };
        }

        // Lấy prefix sau khi đã có ProjectID và ProjectItemID
        const prefix = this.getMessagePrefix(project.ProjectID, item.ProjectItemID);
        const prefixText = prefix ? `${prefix}: ` : '';

        // Validate TotalHours
        if (!item.TotalHours || item.TotalHours <= 0) {
          return { isValid: false, message: `${prefixText}Tổng số giờ phải lớn hơn 0!` };
        }

        if (item.TotalHours > 24) {
          return { isValid: false, message: `${prefixText}Tổng số giờ không được lớn hơn 24!` };
        }

        // Validate TotalHourOT
        const totalHourOT = item.TotalHourOT || 0;
        if (totalHourOT < 0) {
          return { isValid: false, message: `${prefixText}Số giờ OT không được nhỏ hơn 0!` };
        }

        if (totalHourOT > item.TotalHours) {
          return { isValid: false, message: `${prefixText}Số giờ OT không được lớn hơn Tổng số giờ!` };
        }

        // Validate: Nếu TotalHours > 8 thì phải có TotalHourOT > 0
        if (item.TotalHours > 8 && totalHourOT <= 0) {
          return { isValid: false, message: `${prefixText}Tổng số giờ lớn hơn 8, vui lòng nhập Số giờ OT!` };
        }

        // Validate: Số giờ hành chính (TotalHours - TotalHourOT) không được > 8
        if (item.TotalHours - totalHourOT > 8) {
          return { isValid: false, message: `${prefixText}Số giờ hành chính (Tổng số giờ - Số giờ OT) không được lớn hơn 8 giờ!` };
        }

        // Validate PercentComplete
        if (item.PercentComplete === null || item.PercentComplete === undefined) {
          return { isValid: false, message: `${prefixText}Vui lòng nhập % Hoàn thành!` };
        }

        if (item.PercentComplete < 0 || item.PercentComplete > 100) {
          return { isValid: false, message: `${prefixText}% Hoàn thành phải từ 0 đến 100!` };
        }

        // Validate Content
        if (!item.Content || item.Content.trim() === '') {
          return { isValid: false, message: `${prefixText}Vui lòng nhập Nội dung công việc!` };
        }

        // Validate Results
        if (!item.Results || item.Results.trim() === '') {
          return { isValid: false, message: `${prefixText}Vui lòng nhập Kết quả!` };
        }
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

      // Validate tổng số giờ hành chính theo dự án <= 8
      const groupedByProjectAndDate = reports.reduce((acc: any, report: any) => {
        const key = `${report.ProjectID}_${report.DateReport}`;
        if (!acc[key]) {
          acc[key] = { projectID: report.ProjectID, totalHours: 0, totalHourOT: 0 };
        }
        acc[key].totalHours += report.TotalHours || 0;
        acc[key].totalHourOT += report.TotalHourOT || 0;
        return acc;
      }, {});

      for (const key in groupedByProjectAndDate) {
        const group = groupedByProjectAndDate[key];
        const totalWorkingHours = group.totalHours - group.totalHourOT;
        if (totalWorkingHours > 8) {
          const project = this.projects.find(p => p.ID === group.projectID);
          const projectCode = project?.ProjectCode || `ID: ${group.projectID}`;
          return { isValid: false, message: `Dự án [${projectCode}]: Tổng [Số giờ] - Tổng [Số giờ OT] trong 1 ngày KHÔNG được lớn hơn 8h. Vui lòng kiểm tra lại!` };
        }
      }
    }

    return { isValid: true, message: '' };
  }

  // Validate dữ liệu theo business rules (cho flat data)
  // Hàm này validate cả các tab trống trước khi convert, sau đó validate flat data
  private validateFlatData(reports: any[]): { isValid: boolean; message: string } {
    // Bước 1: Validate các tab trống (chưa có trong reports vì chưa convert)
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

    // Validate từng tab dự án (kể cả tab trống)
    for (let i = 0; i < this.projectList.length; i++) {
      const project = this.projectList[i];
      const projectIndex = i + 1;

      // Validate ProjectID
      if (!project.ProjectID || project.ProjectID <= 0) {
        return { isValid: false, message: `Vui lòng chọn Dự án cho tab "Dự án ${projectIndex}"!` };
      }

      // Validate từng tab hạng mục trong dự án
      if (!project.ProjectItems || project.ProjectItems.length === 0) {
        return { isValid: false, message: `Dự án ${projectIndex}: Vui lòng thêm ít nhất một hạng mục công việc!` };
      }

      for (let j = 0; j < project.ProjectItems.length; j++) {
        const item = project.ProjectItems[j];
        const itemIndex = j + 1;

        // Validate ProjectItemID
        if (!item.ProjectItemID || item.ProjectItemID <= 0) {
          const prefix = this.getMessagePrefix(project.ProjectID, 0);
          const prefixText = prefix ? `${prefix} - ` : '';
          return { isValid: false, message: `${prefixText}Vui lòng chọn Hạng mục công việc cho tab "CV-${itemIndex}"!` };
        }

        // Lấy prefix sau khi đã có ProjectID và ProjectItemID
        const prefix = this.getMessagePrefix(project.ProjectID, item.ProjectItemID);
        const prefixText = prefix ? `${prefix}: ` : '';

        // Validate TotalHours
        if (!item.TotalHours || item.TotalHours <= 0) {
          return { isValid: false, message: `${prefixText}Tổng số giờ phải lớn hơn 0!` };
        }

        if (item.TotalHours > 24) {
          return { isValid: false, message: `${prefixText}Tổng số giờ không được lớn hơn 24!` };
        }

        // Validate TotalHourOT
        const totalHourOT = item.TotalHourOT || 0;
        if (totalHourOT < 0) {
          return { isValid: false, message: `${prefixText}Số giờ OT không được nhỏ hơn 0!` };
        }

        if (totalHourOT > item.TotalHours) {
          return { isValid: false, message: `${prefixText}Số giờ OT không được lớn hơn Tổng số giờ!` };
        }

        // Validate: Nếu TotalHours > 8 thì phải có TotalHourOT > 0
        if (item.TotalHours > 8 && totalHourOT <= 0) {
          return { isValid: false, message: `${prefixText}Tổng số giờ lớn hơn 8, vui lòng nhập Số giờ OT!` };
        }

        // Validate: Số giờ hành chính (TotalHours - TotalHourOT) không được > 8
        if (item.TotalHours - totalHourOT > 8) {
          return { isValid: false, message: `${prefixText}Số giờ hành chính (Tổng số giờ - Số giờ OT) không được lớn hơn 8 giờ!` };
        }

        // Validate PercentComplete
        if (item.PercentComplete === null || item.PercentComplete === undefined) {
          return { isValid: false, message: `${prefixText}Vui lòng nhập % Hoàn thành!` };
        }

        if (item.PercentComplete < 0 || item.PercentComplete > 100) {
          return { isValid: false, message: `${prefixText}% Hoàn thành phải từ 0 đến 100!` };
        }

        // Validate Content
        if (!item.Content || item.Content.trim() === '') {
          return { isValid: false, message: `${prefixText}Vui lòng nhập Nội dung công việc!` };
        }

        // Validate Results
        if (!item.Results || item.Results.trim() === '') {
          return { isValid: false, message: `${prefixText}Vui lòng nhập Kết quả!` };
        }
      }
    }

    // Bước 2: Validate flat data (nếu có reports)
    if (!reports || reports.length === 0) {
      return { isValid: false, message: 'Danh sách báo cáo không được rỗng!' };
    }

    // Validate từng report
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];

      // Validate DateReport (không cần prefix)
      if (!report.DateReport) {
        return { isValid: false, message: 'Vui lòng nhập Ngày báo cáo!' };
      }

      // Validate ProjectID (không cần prefix vì chưa có projectID)
      if (!report.ProjectID || report.ProjectID <= 0) {
        return { isValid: false, message: 'Vui lòng chọn Dự án!' };
      }

      // Validate ProjectItemID (không cần prefix vì chưa có projectItemID)
      if (!report.ProjectItemID || report.ProjectItemID <= 0) {
        return { isValid: false, message: 'Vui lòng chọn Hạng mục công việc!' };
      }

      // Lấy prefix sau khi đã validate ProjectID và ProjectItemID
      const prefix = this.getMessagePrefix(report.ProjectID, report.ProjectItemID);
      const prefixText = prefix ? `${prefix}: ` : '';

      // Validate TotalHours
      if (!report.TotalHours || report.TotalHours <= 0) {
        return { isValid: false, message: `${prefixText}Tổng số giờ phải lớn hơn 0!` };
      }

      if (report.TotalHours > 24) {
        return { isValid: false, message: `${prefixText}Tổng số giờ không được lớn hơn 24!` };
      }

      // Validate TotalHourOT
      const totalHourOT = report.TotalHourOT || 0;
      if (totalHourOT < 0) {
        return { isValid: false, message: `${prefixText}Số giờ OT không được nhỏ hơn 0!` };
      }

      if (totalHourOT > report.TotalHours) {
        return { isValid: false, message: `${prefixText}Số giờ OT không được lớn hơn Tổng số giờ!` };
      }

      // Validate: Nếu TotalHours > 8 thì phải có TotalHourOT > 0
      if (report.TotalHours > 8 && totalHourOT <= 0) {
        return { isValid: false, message: `${prefixText}Tổng số giờ lớn hơn 8, vui lòng nhập Số giờ OT!` };
      }

      // Validate: Số giờ hành chính (TotalHours - TotalHourOT) không được > 8
      if (report.TotalHours - totalHourOT > 8) {
        return { isValid: false, message: `${prefixText}Số giờ hành chính (Tổng số giờ - Số giờ OT) không được lớn hơn 8 giờ!` };
      }

      // Validate PercentComplete
      if (report.PercentComplete === null || report.PercentComplete === undefined) {
        return { isValid: false, message: `${prefixText}Vui lòng nhập % Hoàn thành!` };
      }

      if (report.PercentComplete < 0 || report.PercentComplete > 100) {
        return { isValid: false, message: `${prefixText}% Hoàn thành phải từ 0 đến 100!` };
      }

      // Validate Content
      if (!report.Content || report.Content.trim() === '') {
        return { isValid: false, message: `${prefixText}Vui lòng nhập Nội dung công việc!` };
      }

      // Validate Results
      if (!report.Results || report.Results.trim() === '') {
        return { isValid: false, message: `${prefixText}Vui lòng nhập Kết quả!` };
      }

      // Validate Location (giờ là string - workLocationText)
      if (!report.Location || report.Location.trim() === '') {
        return { isValid: false, message: `${prefixText}Vui lòng nhập Nơi làm việc!` };
      }

      // Validate PlanNextDay (không cần prefix vì là chung cho tất cả)
      if (!report.PlanNextDay || report.PlanNextDay.trim() === '') {
        return { isValid: false, message: 'Vui lòng nhập Kế hoạch ngày tiếp theo!' };
      }
    }

    // Validate tổng số giờ hành chính trong ngày <= 8
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

    // Validate tổng số giờ hành chính theo dự án <= 8
    const groupedByProjectAndDate = reports.reduce((acc: any, report: any) => {
      const key = `${report.ProjectID}_${report.DateReport}`;
      if (!acc[key]) {
        acc[key] = { projectID: report.ProjectID, totalHours: 0, totalHourOT: 0 };
      }
      acc[key].totalHours += report.TotalHours || 0;
      acc[key].totalHourOT += report.TotalHourOT || 0;
      return acc;
    }, {});

    for (const key in groupedByProjectAndDate) {
      const group = groupedByProjectAndDate[key];
      const totalWorkingHours = group.totalHours - group.totalHourOT;
      if (totalWorkingHours > 8) {
        const project = this.projects.find(p => p.ID === group.projectID);
        const projectCode = project?.ProjectCode || `ID: ${group.projectID}`;
        return { isValid: false, message: `Dự án [${projectCode}]: Tổng [Số giờ] - Tổng [Số giờ OT] trong 1 ngày KHÔNG được lớn hơn 8h. Vui lòng kiểm tra lại!` };
      }
    }

    return { isValid: true, message: '' };
  }

  // Submit báo cáo (gọi API)
  submitDailyReport(): void {
    if (this.saving) {
      return;
    }

    // Chuyển đổi dữ liệu từ nested sang flat
    const reports = this.convertToFlatData();

    if (reports.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Validate dữ liệu
    const validation = this.validateFlatData(reports);
    if (!validation.isValid) {
      this.notification.warning('Thông báo', validation.message);
      return;
    }

    this.saving = true;

    // Gọi API
    this.dailyReportTechService.saveReportTechnical(reports).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.status === 1) {
          this.notification.success('Thông báo', response.message || 'Báo cáo đã được lưu thành công!');

          // Gửi email sau khi lưu thành công
          this.sendEmailAfterSave();

          this.close(true); // Trả về true để reload data
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

  /**
   * Gửi email sau khi lưu báo cáo thành công
   */
  private sendEmailAfterSave(): void {
    try {
      // Tạo nội dung email từ summary
      const summaryContent = this.generateSummary();

      if (!summaryContent || summaryContent.trim() === '') {
        return;
      }

      // Lấy ngày báo cáo
      const dateReport = this.formGroup.get('DateReport')?.value;

      // Gọi API gửi email
      this.dailyReportTechService.sendEmailReport(summaryContent, dateReport).subscribe({
        next: (response: any) => {
          if (response && response.status === 1) {
            // Email đã được gửi thành công (không cần thông báo để tránh spam)
            // this.notification.success('Thông báo', 'Email đã được gửi thành công!');
          } else {
            // Không hiển thị lỗi nếu không gửi được email (có thể do không thuộc team được phép)
            // this.notification.warning('Thông báo', response?.message || 'Không thể gửi email.');
          }
        },
        error: (error: any) => {
          // Không hiển thị lỗi để tránh làm gián đoạn flow của user
          // Email sẽ được gửi tự động bởi background service nếu cần
          console.error('Error sending email:', error);
        }
      });
    } catch (error) {
      console.error('Error in sendEmailAfterSave:', error);
    }
  }

  // Lưu dữ liệu
  saveDailyReport(): void {
    if (this.saving) {
      return;
    }

    // Bước 1: Validate các trường bắt buộc (*) theo formGroup trước
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();

      // Hiển thị thông báo lỗi cụ thể cho từng trường
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

    // Bước 2: Chuyển đổi dữ liệu từ nested sang flat
    const reports = this.convertToFlatData();

    if (reports.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu! Vui lòng chọn ít nhất một dự án và hạng mục công việc.');
      return;
    }

    // Bước 3: Validate dữ liệu flat (validateFlatData)
    const flatValidation = this.validateFlatData(reports);
    if (!flatValidation.isValid) {
      this.notification.warning('Thông báo', flatValidation.message);
      return;
    }

    // Gọi validate() (nếu có logic validate bổ sung)
    if (!this.validate()) {
      return;
    }

    // Mở modal preview
    this.openPreviewModal();
  }

  close(success: boolean = false): void {
    this.activeModal.close(success);
  }
  onAddProjectItem(): void {
    // Lấy project từ tab đang active
    const activeProject = this.projectList[this.activeProjectTab];

    // // Kiểm tra xem có project nào được chọn chưa
    // if (!activeProject || !activeProject.ProjectID || activeProject.ProjectID === 0) {
    //   this.notification.warning('Thông báo', 'Vui lòng chọn dự án trước khi thêm hạng mục công việc!');
    //   return;
    // }

    // // Lấy thông tin project từ danh sách projects
    // const selectedProject = this.projects.find(p => p.ID === activeProject.ProjectID);
    // if (!selectedProject) {
    //   this.notification.error('Lỗi', 'Không tìm thấy thông tin dự án!');
    //   return;
    // }

    try {
      const modalRef = this.ngbModal.open(ProjectItemPersonDetailComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: true,
        centered: true,
      });

      if (!modalRef) {
        this.notification.error('Lỗi', 'Không thể mở modal!');
        return;
      }

      // Set properties cho component instance
      if (modalRef.componentInstance) {
        modalRef.componentInstance.dataInput = null;

        if (activeProject && activeProject.ProjectID > 0) {
          modalRef.componentInstance.defaultProjectID = activeProject.ProjectID;
        }
      }

      // Xử lý khi modal đóng
      modalRef.result.then(
        (result) => {
          if (result) {
            if (activeProject && activeProject.ProjectID > 0) {
              this.loadProjectItems(activeProject.ProjectID, this.activeProjectTab + 1);
            }
          }
        },
        (reason) => {
        }
      ).catch((error) => {
        console.error('Error in modal result:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi mở modal!');
      });
    } catch (error) {
      console.error('Error in onAddProjectItem:', error);
      this.notification.error('Lỗi', 'Không thể mở modal! Vui lòng thử lại.');
    }
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

      // Set properties cho component instance
      if (modalRef.componentInstance) {
        modalRef.componentInstance.data = null;
        modalRef.componentInstance.isEditMode = false;
      }

      // Xử lý khi modal đóng
      modalRef.result.then(
        (result) => {
          // if (result && result.success) {
          //   this.notification.success('Thông báo', 'Đăng ký làm thêm thành công!');
          // }
        },
        (reason) => {
          // Modal bị đóng mà không có kết quả - không cần xử lý gì
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
}


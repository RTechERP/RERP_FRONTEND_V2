import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { RegisterIdeaService } from '../register-idea-service/register-idea.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-register-idea-score',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzTableModule,
    NzIconModule,
    NzCheckboxModule,
    NzGridModule,
  ],
  templateUrl: './register-idea-score.component.html',
  styleUrl: './register-idea-score.component.css'
})
export class RegisterIdeaScoreComponent implements OnInit, AfterViewInit {
  @Input() ideaId: number = 0;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('tb_Score', { static: false }) tb_ScoreElement!: ElementRef;
  tb_Score!: Tabulator;

  form!: FormGroup;

  departments: any[] = [];
  selectedDepartmentIds: number[] = [];
  scoreOptions = [
    { value: 0, label: '--Chọn điểm--' },
    { value: 1, label: 'A' },
    { value: 2, label: 'B' },
    { value: 3, label: 'C' },
    { value: 4, label: 'D' },
  ];

  ideaName: string = '';
  isTBP: boolean = false;
  selectedScore: number = 0;
  scoreData: any[] = [];

  // Current user info
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentHeadofDepartment: number = 0;
  isAdmin: boolean = false;

  // Permission flags
  canSelectDepartment: boolean = false;
  ideaAuthorDepartmentHead: number = 0;

  constructor(
    private fb: FormBuilder,
    private registerIdeaService: RegisterIdeaService,
    private departmentService: DepartmentServiceService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {
    this.currentEmployeeId = this.appUserService.employeeID || 0;
    this.currentDepartmentId = this.appUserService.departmentID || 0;
    this.currentHeadofDepartment = Number(this.appUserService.currentUser?.HeadofDepartment) || 0;
    this.isAdmin = this.appUserService.isAdmin;
  }

  ngOnInit() {
    this.initForm();
    this.loadDepartments();

    if (this.ideaId > 0) {
      this.loadIdeaScoreDetail();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initScoreTable();
    }, 100);
  }

  initForm() {
    this.form = this.fb.group({
      ideaName: [{ value: '', disabled: true }],
      selectedDepartmentIds: [[]],
      selectedScore: [0],
      isTBP: [false],
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.departments = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
      }
    });
  }

  loadIdeaScoreDetail() {
    this.registerIdeaService.getIdeaDetail(this.ideaId, this.currentEmployeeId).subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          const idea = data.data.rgt;
          const details = data.data.rgtd || [];
          const employees = data.data.em || [];
          const departments = data.data.de || [];
          const scores = data.data.rgts || [];

          // Get idea name from first detail (STT = 1)
          const firstDetail = details.find((d: any) => d.STT === 1);
          this.ideaName = firstDetail?.Description || '';
          this.form.patchValue({ ideaName: this.ideaName });

          // Get idea author's department head
          const ideaAuthor = employees.find((e: any) => e.ID === idea.EmployeeID);
          if (ideaAuthor) {
            const authorDepartment = departments.find((d: any) => d.ID === ideaAuthor.DepartmentID);
            if (authorDepartment) {
              this.ideaAuthorDepartmentHead = authorDepartment.HeadofDepartment || 0;
            }
          }

          // Check if current user is department head of the idea author
          if (this.currentEmployeeId === this.ideaAuthorDepartmentHead) {
            this.isTBP = true;
            this.canSelectDepartment = true;
            this.form.patchValue({ isTBP: true });
          } else {
            this.canSelectDepartment = false;
          }

          // Load existing scores
          this.scoreData = scores.map((s: any) => ({
            DepartmentID: s.DepartmentID,
            DepartmentName: s.DepartmentName || '',
            TBPName: s.TBPName || '',
            ScoreNew: s.ScoreNew || '',
          }));

          // Get selected department IDs from scores
          this.selectedDepartmentIds = scores
            .filter((s: any) => s.DepartmentID)
            .map((s: any) => s.DepartmentID);
          this.form.patchValue({ selectedDepartmentIds: this.selectedDepartmentIds });

          // Update table
          if (this.tb_Score) {
            this.tb_Score.replaceData(this.scoreData);
          }
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải thông tin chấm điểm');
      }
    });
  }

  initScoreTable() {
    if (!this.tb_ScoreElement) {
      return;
    }

    this.tb_Score = new Tabulator(this.tb_ScoreElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      rowHeader: false,
      height: '250px',
      pagination: false,
      data: this.scoreData,
      columns: [
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          sorter: 'string',
          width: '40%',
        },
        {
          title: 'Trưởng bộ phận',
          field: 'TBPName',
          sorter: 'string',
          width: '35%',
        },
        {
          title: 'Điểm số',
          field: 'ScoreNew',
          sorter: 'string',
          width: '25%',
          hozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            let color = '#333';
            switch (value) {
              case 'A': color = '#52c41a'; break;
              case 'B': color = '#1890ff'; break;
              case 'C': color = '#faad14'; break;
              case 'D': color = '#ff4d4f'; break;
            }
            return `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
          },
        },
      ],
    });
  }

  onDepartmentChange(departmentIds: number[]) {
    this.selectedDepartmentIds = departmentIds;
  }

  saveScore() {
    const scoreValue = this.form.get('selectedScore')?.value || this.selectedScore;
    const isTBPValue = this.form.get('isTBP')?.value || this.isTBP;

    if (scoreValue === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn điểm');
      return;
    }

    const scoreLabel = this.scoreOptions.find(s => s.value === scoreValue)?.label || '';

    const model = {
      RegisterIdeaID: this.ideaId,
      ScoreNew: scoreLabel,
      Score: scoreValue,
      tbpCheck: isTBPValue,
      LsDepartmentID: this.selectedDepartmentIds,
    };

    this.registerIdeaService.saveScore(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Chấm điểm thành công');
          this.onSave.emit(res.data);
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Chấm điểm thất bại');
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi chấm điểm');
      }
    });
  }

  close() {
    this.activeModal.close(false);
  }
}


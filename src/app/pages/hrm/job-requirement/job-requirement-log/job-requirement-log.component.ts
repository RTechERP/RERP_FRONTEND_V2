import { Component, Input, OnInit } from '@angular/core';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-job-requirement-log',
  standalone: true,
  imports: [CommonModule, NzTableModule],
  templateUrl: './job-requirement-log.component.html',
  styleUrls: ['./job-requirement-log.component.less']
})
export class JobRequirementLogComponent implements OnInit {
  @Input() JobRequirementID!: number;

  logs: any[] = [];
  loading = false;

  constructor(private jobService: JobRequirementService, public activeModal: NgbActiveModal) { }

  closeModal(): void {
    this.activeModal.close();
  }

  ngOnInit(): void {
    if (this.JobRequirementID) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    this.loading = true;
    this.jobService.getJobLogs(this.JobRequirementID).subscribe({
      next: (res) => {
        if (res.status === 1 || res.Success) {
          this.logs = res.data || res.Data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

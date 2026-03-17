import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HRRecruitmentApplicationFormService } from '../home-layout-candidate/hr-recruitment-application-form.service';
import { CandidateTestComponent } from '../../candidate-test/candidate-test.component';

@Component({
    selector: 'app-main-layout-candidate',
    standalone: true,
    imports: [CommonModule, NzCardModule, NzIconModule, NzSpinModule, NzTagModule, NzToolTipModule, NzGridModule],
    templateUrl: './main-layout-candidate.component.html',
    styleUrls: ['./main-layout-candidate.component.css']
})
export class MainLayoutCandidateComponent implements OnInit {
    candidate: any;
    examList: any[] = [];
    loadingExam = false;

    constructor(
        private router: Router,
        private notification: NzNotificationService,
        private appFormService: HRRecruitmentApplicationFormService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        const candidateStr = localStorage.getItem('CurrentUserCandidate');
        this.candidate = JSON.parse(candidateStr ?? '{}');
        this.loadExamData();
    }

    loadExamData() {
        this.loadingExam = true;
        this.appFormService.getDataExamByEmployee().subscribe({
            next: (res: any) => {
                this.examList = res?.data ?? [];
                this.loadingExam = false;
            },
            error: () => {
                this.loadingExam = false;
            }
        });
    }

    getExamTypeLabel(type: number | string): string {
        const map: Record<string, string> = {
            '1': 'Trắc nghiệm',
            '2': 'Tự luận',
            '3': 'Trắc nghiệm & Tự luận',
        };
        return map[String(type)] ?? 'Khác';
    }

    getExamTypeColor(type: number | string): string {
        const map: Record<string, string> = {
            '1': 'blue',
            '2': 'green',
            '3': 'purple',
        };
        return map[String(type)] ?? 'default';
    }

    navigateToApplication() {
        this.router.navigateByUrl('/home-candidate');
    }

    /** Kiểm tra xem tất cả bài thi có bị khóa không */
    get allExamsDisabled(): boolean {
        return this.examList.length > 0 && this.examList.every(e => e.IsDisabled === 1);
    }

    /** Mở modal chọn bài thi fullscreen */
    navigateToIQTest(exam?: any) {
        if (this.allExamsDisabled) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn đã hoàn thành tất cả các bài thi hoặc chưa đủ điều kiện!');
            return;
        }

        if (!this.examList || this.examList.length === 0) {
            this.notification.info(NOTIFICATION_TITLE.warning, 'Không có bài thi nào khả dụng!');
            return;
        }

        const modalRef = this.modalService.open(CandidateTestComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'candidate-exam-modal',
        });

        // Truyền danh sách bài thi đầy đủ
        modalRef.componentInstance.examList = [...this.examList];

        // Truyền các đề thi đã hoàn thành vào Set để modal biết mà khóa
        modalRef.componentInstance.completedExamIds = new Set(
            this.examList.filter(e => e.StatusResult === 1 || e.StatusResult === 2).map(e => e.ID)
        );

        modalRef.result.then(
            (result: any) => {
                if (result?.success) {
                    this.loadExamData();
                }
            },
            () => { /* dismissed */ }
        );
    }

    logout() {
        localStorage.removeItem('CandidateToken');
        localStorage.removeItem('CurrentUserCandidate');
        localStorage.removeItem('candidate_token_expires');
        this.router.navigateByUrl('/login-candidate');
    }
}

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
        this.appFormService.getDataExamByEmployee(this.candidate.ID).subscribe({
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

    /** Kiểm tra trạng thái đã điền tờ khai hay chưa */
    get isFormComplete(): boolean {
        if (!this.examList || this.examList.length === 0) return true; // Tránh lỗi nếu chưa có list
        return this.examList[0].IsFormComplete === 1 || this.examList[0].IsFormComplete === true;
    }

    /** Kiểm tra xem tất cả bài thi có bị khóa không */
    get allExamsDisabled(): boolean {
        if (!this.isFormComplete) return true;
        return this.examList.length > 0 && this.examList.every(e => e.IsDisabled === 1);
    }

    /** Mở modal chọn bài thi fullscreen */
    navigateToIQTest(exam?: any) {
        if (!this.isFormComplete) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền tờ khai thông tin trước khi thi!');
            return;
        }

        if (this.allExamsDisabled) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn đã hoàn thành tất cả các bài thi hoặc bài thi đang bị khóa!');
            return;
        }

        if (!this.examList || this.examList.length === 0) {
            this.notification.info(NOTIFICATION_TITLE.warning, 'Không có bài thi nào khả dụng!');
            return;
        }

        console.log(this.candidate);
        console.log(this.candidate.HRHiringRequestID);
        const modalRef = this.modalService.open(CandidateTestComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'candidate-exam-modal',
        });

        // Truyền danh sách bài thi đầy đủ
        modalRef.componentInstance.examList = [...this.examList];
        //Truyền ID ứng viến 
        modalRef.componentInstance.hrRecruitmentCandidateID = this.candidate.ID;
        //Truyền ID đợt tuyển dụng
        modalRef.componentInstance.hrHiringRequestID = this.candidate.HrHiringRequestID;

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

    getStartButtonText(): string {
        if (!this.allExamsDisabled) return 'Bắt đầu thi';
        if (!this.isFormComplete) return 'Yêu cầu điền form';
        if (this.examList.length > 0 && this.examList.every(e => e.StatusResult === 1 || e.StatusResult === 2)) return 'Đã hoàn tất bài thi';
        if (this.examList.length > 0 && this.examList.every(e => e.IsExamActive === 0 || e.IsExamActive === false)) return 'Bài thi đang khóa';
        return 'Đã hoàn tất bài thi';
    }

    getStartButtonIcon(): string {
        if (!this.allExamsDisabled) return 'arrow-right';
        if (!this.isFormComplete) return 'lock';
        if (this.examList.length > 0 && this.examList.every(e => e.StatusResult === 1 || e.StatusResult === 2)) return 'check';
        if (this.examList.length > 0 && this.examList.every(e => e.IsExamActive === 0 || e.IsExamActive === false)) return 'lock';
        return 'check';
    }


    logout() {
        localStorage.removeItem('CandidateToken');
        localStorage.removeItem('CurrentUserCandidate');
        localStorage.removeItem('candidate_token_expires');
        this.router.navigateByUrl('/login-candidate');
    }
}

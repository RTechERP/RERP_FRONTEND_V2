import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-main-layout-candidate',
    standalone: true,
    imports: [CommonModule, NzCardModule, NzIconModule],
    templateUrl: './main-layout-candidate.component.html',
    styleUrls: ['./main-layout-candidate.component.css']
})
export class MainLayoutCandidateComponent {
    constructor(
        private router: Router,
        private notification: NzNotificationService
    ) { }

    navigateToApplication() {
        this.router.navigateByUrl('/home-candidate');
    }

    navigateToIQTest() {
        // Hiện tại chưa có trang test IQ nên thông báo
        this.notification.info(NOTIFICATION_TITLE.warning, 'Chức năng Test IQ đang được phát triển. Vui lòng quay lại sau!');
    }

    logout() {
        localStorage.removeItem('CandidateToken');
        localStorage.removeItem('CurrentUserCandidate');
        localStorage.removeItem('candidate_token_expires');
        this.router.navigateByUrl('/login-candidate');
    }
}

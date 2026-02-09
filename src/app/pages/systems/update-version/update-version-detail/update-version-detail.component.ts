import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-update-version-detail',
    standalone: true,
    imports: [
        CommonModule,
        NzModalModule,
        NzSpinModule,
        NzButtonModule,
        NzIconModule
    ],
    templateUrl: './update-version-detail.component.html',
    styleUrl: './update-version-detail.component.css'
})
export class UpdateVersionDetailComponent implements OnInit {
    @Input() versionData: any;

    sanitizedContent: SafeHtml = '';
    publicDateStr: string = '';

    constructor(
        private sanitizer: DomSanitizer,
        public activeModal: NgbActiveModal
    ) { }

    ngOnInit(): void {
        if (this.versionData) {
            if (this.versionData.Content) {
                this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.versionData.Content);
            }

            if (this.versionData.PublicDate) {
                this.publicDateStr = DateTime.fromISO(this.versionData.PublicDate).toFormat('dd/MM/yyyy HH:mm');
            }
        }
    }

    onClose(): void {
        this.activeModal.close('close');
    }

    onUpdateNow(): void {
        this.activeModal.close('update');
    }
}

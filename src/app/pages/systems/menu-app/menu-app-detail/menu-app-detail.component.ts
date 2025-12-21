import { Component, Input } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../../services/app-user.service';
import { MenuAppService } from '../menu-app.service';
import { MenuApp } from '../model/menu-app';
import { CommonModule } from '@angular/common';
import { AngularSlickgridModule } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
    selector: 'app-menu-app-detail',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzGridModule,
        NzInputNumberModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzRadioModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        NzUploadModule,
        NzTreeSelectModule,
        NzIconModule,
        FormsModule,
        AngularSlickgridModule,
    ],
    templateUrl: './menu-app-detail.component.html',
    styleUrl: './menu-app-detail.component.css'
})
export class MenuAppDetailComponent {
    validateForm !: FormGroup;
    @Input() menu = new MenuApp();

    nodes = [
        {
            title: 'parent 1',
            key: '100',
            children: [
                {
                    title: 'parent 1-0',
                    key: '1001',
                    children: [
                        { title: 'leaf 1-0-0', key: '10010', isLeaf: true },
                        { title: 'leaf 1-0-1', key: '10011', isLeaf: true }
                    ]
                },
                {
                    title: 'parent 1-1',
                    key: '1002',
                    children: [{ title: 'leaf 1-1-0', key: '10020', isLeaf: true }]
                }
            ]
        }
    ];

    inputValue: string | null = null;

    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private menuService: MenuAppService,
    ) { }


    ngOnInit(): void {
        this.initForm();
        this.getMenus();
    }

    initForm() {
        this.validateForm = this.fb.group({
            STT: this.fb.control(0, [Validators.required]),
            Code: this.fb.control(this.menu.Code, [Validators.required]),
            Title: this.fb.control(this.menu.Title, [Validators.required]),
            Router: this.fb.control(this.menu.Router, [Validators.required]),
            Icon: this.fb.control(this.menu.Icon, [Validators.required]),
            ParentID: this.fb.control(this.menu.ParentID, [Validators.required]),
        });
    }

    getMenus() {
        this.menuService.getAll().subscribe({
            next: (repsonse) => {
                console.log(repsonse);
            },
            error: (err) => {
                console.log('err:', err);

                const msg =
                    err?.error?.message ||
                    err?.message;
                this.notification.error(NOTIFICATION_TITLE.error, msg);
            },
        })
    }

    submitForm() {

    }
}

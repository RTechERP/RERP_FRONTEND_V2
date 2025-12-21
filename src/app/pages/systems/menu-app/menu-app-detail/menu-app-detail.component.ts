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

    nodes: any[] = [];
    inputValue: string | null = null;

    userGroups: any[] = [];


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
            Router: this.fb.control(this.menu.Router),
            Icon: this.fb.control(this.menu.Icon),
            ParentID: this.fb.control(this.menu.ParentID),
        });
    }

    getMenus() {
        this.menuService.getAll().subscribe({
            next: (repsonse) => {

                const menus = repsonse.data.menus;
                this.userGroups = repsonse.data.userGroups;

                const map = new Map<number, any>();
                this.nodes = [];
                // Tạo map trước
                menus.forEach((item: any) => {
                    map.set(item.ID, {
                        title: item.Title,
                        key: item.ID,
                        isLeaf: true,
                        children: []
                    });
                });

                // Gắn cha – con
                menus.forEach((item: any) => {
                    const node = map.get(item.ID);

                    if (item.ParentID && map.has(item.ParentID)) {
                        const parent = map.get(item.ParentID);
                        parent.children.push(node);
                        parent.isLeaf = false;
                    } else {
                        this.nodes.push(node);
                    }
                });
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        })
    }

    submitForm() {
        if (!this.validateForm.valid) {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {

            const menu = {
                ...this.validateForm.getRawValue(),
            };

            this.menuService.saveData(menu).subscribe({
                next: (response) => {
                    console.log(response);

                    this.getMenus();

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                }
            });


        }
    }
}

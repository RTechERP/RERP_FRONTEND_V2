import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-hrm',
    imports: [],
    templateUrl: './hrm.component.html',
    styleUrl: './hrm.component.css'
})
export class HrmComponent implements OnInit {
    ngOnInit(): void {
        document.title += ' | NHÂN SỰ';
    }
}

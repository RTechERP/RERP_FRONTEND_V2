import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-approve',
    imports: [],
    templateUrl: './approve.component.html',
    styleUrl: './approve.component.css'
})
export class ApproveComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | DUYỆT'
    }
}

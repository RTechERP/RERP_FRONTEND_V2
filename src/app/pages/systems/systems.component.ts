import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-systems',
    imports: [],
    templateUrl: './systems.component.html',
    styleUrl: './systems.component.css'
})
export class SystemsComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | HỆ THỐNG'
    }
}

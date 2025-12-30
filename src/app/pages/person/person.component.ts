import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-person',
    imports: [],
    templateUrl: './person.component.html',
    styleUrl: './person.component.css'
})
export class PersonComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | CÁ NHÂN'
    }
}

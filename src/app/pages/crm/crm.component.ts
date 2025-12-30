import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-crm',
    imports: [],
    templateUrl: './crm.component.html',
    styleUrl: './crm.component.css'
})
export class CrmComponent implements OnInit {

    ngOnInit(): void {
        document.title += " | CRM"
    }

}

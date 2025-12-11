import { Component } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormLayoutType, NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';

@Component({
    selector: 'app-payment-order-detail',
    imports: [
        ReactiveFormsModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzRadioModule
    ],
    templateUrl: './payment-order-detail.component.html',
    styleUrl: './payment-order-detail.component.css'
})
export class PaymentOrderDetailComponent {

    isHorizontal = true;
    validateForm !: FormGroup

    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder
    ) {
        this.validateForm = this.fb.group({
            fieldA: this.fb.control('', [Validators.required]),
            filedB: this.fb.control('', [Validators.required])
        })
    }


    submitForm() {
        console.log('submit', this.validateForm.value);
    }
}

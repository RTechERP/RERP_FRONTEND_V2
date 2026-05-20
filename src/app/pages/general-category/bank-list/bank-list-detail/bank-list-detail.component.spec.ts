/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BankListDetailComponent } from './bank-list-detail.component';

describe('BankListDetailComponent', () => {
    let component: BankListDetailComponent;
    let fixture: ComponentFixture<BankListDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BankListDetailComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BankListDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BorrowProductHistoryAddErrorPersonalComponent } from './borrow-product-history-add-error-personal.component';

describe('BorrowProductHistoryAddErrorPersonalComponent', () => {
  let component: BorrowProductHistoryAddErrorPersonalComponent;
  let fixture: ComponentFixture<BorrowProductHistoryAddErrorPersonalComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowProductHistoryAddErrorPersonalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowProductHistoryAddErrorPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

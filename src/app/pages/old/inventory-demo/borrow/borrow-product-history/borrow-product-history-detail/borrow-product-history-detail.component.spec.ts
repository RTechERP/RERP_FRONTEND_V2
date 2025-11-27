/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BorrowProductHistoryDetailComponent } from './borrow-product-history-detail.component';

describe('BorrowProductHistoryDetailComponent', () => {
  let component: BorrowProductHistoryDetailComponent;
  let fixture: ComponentFixture<BorrowProductHistoryDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowProductHistoryDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowProductHistoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

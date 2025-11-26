/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BorrowProductHistoryLogComponent } from './borrow-product-history-log.component';

describe('BorrowProductHistoryLogComponent', () => {
  let component: BorrowProductHistoryLogComponent;
  let fixture: ComponentFixture<BorrowProductHistoryLogComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowProductHistoryLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowProductHistoryLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

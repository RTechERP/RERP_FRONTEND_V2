/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BorrowProductHistoryBorrowDetailAdminComponent } from './borrow-product-history-borrow-detail-admin.component';

describe('BorrowProductHistoryBorrowDetailAdminComponent', () => {
  let component: BorrowProductHistoryBorrowDetailAdminComponent;
  let fixture: ComponentFixture<BorrowProductHistoryBorrowDetailAdminComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowProductHistoryBorrowDetailAdminComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowProductHistoryBorrowDetailAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BorrowProductHistoryPersonalHistoryErrorComponent } from './borrow-product-history-personal-history-error.component';

describe('BorrowProductHistoryPersonalHistoryErrorComponent', () => {
  let component: BorrowProductHistoryPersonalHistoryErrorComponent;
  let fixture: ComponentFixture<BorrowProductHistoryPersonalHistoryErrorComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowProductHistoryPersonalHistoryErrorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowProductHistoryPersonalHistoryErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

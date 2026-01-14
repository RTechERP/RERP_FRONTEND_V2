/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillImportTechnicalSummaryComponent } from './bill-import-technical-summary.component';

describe('BillImportTechnicalSummaryComponent', () => {
  let component: BillImportTechnicalSummaryComponent;
  let fixture: ComponentFixture<BillImportTechnicalSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BillImportTechnicalSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillImportTechnicalSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

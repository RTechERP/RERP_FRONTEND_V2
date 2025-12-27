/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillExportTechnicalNewComponent } from './bill-export-technical-new.component';

describe('BillExportTechnicalNewComponent', () => {
  let component: BillExportTechnicalNewComponent;
  let fixture: ComponentFixture<BillExportTechnicalNewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BillExportTechnicalNewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillExportTechnicalNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillImportTechnicalNewComponent } from './bill-import-technical-new.component';

describe('BillImportTechnicalNewComponent', () => {
  let component: BillImportTechnicalNewComponent;
  let fixture: ComponentFixture<BillImportTechnicalNewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BillImportTechnicalNewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillImportTechnicalNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

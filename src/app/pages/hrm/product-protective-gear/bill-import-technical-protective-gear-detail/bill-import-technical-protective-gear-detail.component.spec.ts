/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillImportTechnicalProtectiveGearDetailComponent } from './bill-import-technical-protective-gear-detail.component';

describe('BillImportTechnicalProtectiveGearDetailComponent', () => {
  let component: BillImportTechnicalProtectiveGearDetailComponent;
  let fixture: ComponentFixture<BillImportTechnicalProtectiveGearDetailComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [BillImportTechnicalProtectiveGearDetailComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillImportTechnicalProtectiveGearDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

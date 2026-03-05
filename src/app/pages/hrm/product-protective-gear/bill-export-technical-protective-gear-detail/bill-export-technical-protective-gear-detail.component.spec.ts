/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillExportTechnicalProtectiveGearDetailComponent } from './bill-export-technical-protective-gear-detail.component';

describe('BillExportTechnicalProtectiveGearDetailComponent', () => {
  let component: BillExportTechnicalProtectiveGearDetailComponent;
  let fixture: ComponentFixture<BillExportTechnicalProtectiveGearDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BillExportTechnicalProtectiveGearDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillExportTechnicalProtectiveGearDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

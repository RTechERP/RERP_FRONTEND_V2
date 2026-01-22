/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillExportTechnicalProtectiveGearComponent } from './bill-export-technical-protective-gear.component';

describe('BillExportTechnicalProtectiveGearComponent', () => {
  let component: BillExportTechnicalProtectiveGearComponent;
  let fixture: ComponentFixture<BillExportTechnicalProtectiveGearComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ BillExportTechnicalProtectiveGearComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillExportTechnicalProtectiveGearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

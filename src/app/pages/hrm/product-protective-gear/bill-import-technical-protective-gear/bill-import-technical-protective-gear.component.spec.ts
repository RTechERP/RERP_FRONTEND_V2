/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillImportTechnicalProtectiveGearComponent } from './bill-import-technical-protective-gear.component';

describe('BillImportTechnicalProtectiveGearComponent', () => {
  let component: BillImportTechnicalProtectiveGearComponent;
  let fixture: ComponentFixture<BillImportTechnicalProtectiveGearComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [BillImportTechnicalProtectiveGearComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      BillImportTechnicalProtectiveGearComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetManagementReportBorkenFormComponent } from './ts-asset-management-report-borken-form.component';

describe('TsAssetManagementReportBorkenFormComponent', () => {
  let component: TsAssetManagementReportBorkenFormComponent;
  let fixture: ComponentFixture<TsAssetManagementReportBorkenFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetManagementReportBorkenFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetManagementReportBorkenFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

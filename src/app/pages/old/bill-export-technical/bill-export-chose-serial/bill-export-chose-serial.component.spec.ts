/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BillExportChoseSerialComponent } from './bill-export-chose-serial.component';

describe('BillExportChoseSerialComponent', () => {
  let component: BillExportChoseSerialComponent;
  let fixture: ComponentFixture<BillExportChoseSerialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BillExportChoseSerialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillExportChoseSerialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

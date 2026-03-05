/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HistoryProductRtcProtectiveGearComponent } from './history-product-rtc-protective-gear.component';

describe('HistoryProductRtcProtectiveGearComponent', () => {
  let component: HistoryProductRtcProtectiveGearComponent;
  let fixture: ComponentFixture<HistoryProductRtcProtectiveGearComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [HistoryProductRtcProtectiveGearComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryProductRtcProtectiveGearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

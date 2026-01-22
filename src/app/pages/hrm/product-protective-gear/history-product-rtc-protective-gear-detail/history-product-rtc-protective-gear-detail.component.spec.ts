/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HistoryProductRtcProtectiveGearDetailComponent } from './history-product-rtc-protective-gear-detail.component';

describe('HistoryProductRtcProtectiveGearDetailComponent', () => {
  let component: HistoryProductRtcProtectiveGearDetailComponent;
  let fixture: ComponentFixture<HistoryProductRtcProtectiveGearDetailComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [HistoryProductRtcProtectiveGearDetailComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryProductRtcProtectiveGearDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

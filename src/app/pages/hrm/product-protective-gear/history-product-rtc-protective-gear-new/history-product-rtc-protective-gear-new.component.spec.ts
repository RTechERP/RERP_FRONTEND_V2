/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HistoryProductRtcProtectiveGearNewComponent } from './history-product-rtc-protective-gear-new.component';

describe('HistoryProductRtcProtectiveGearNewComponent', () => {
  let component: HistoryProductRtcProtectiveGearNewComponent;
  let fixture: ComponentFixture<HistoryProductRtcProtectiveGearNewComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [HistoryProductRtcProtectiveGearNewComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryProductRtcProtectiveGearNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

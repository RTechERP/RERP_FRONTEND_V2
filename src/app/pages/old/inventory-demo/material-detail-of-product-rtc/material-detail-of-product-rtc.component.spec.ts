/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MaterialDetailOfProductRtcComponent } from './material-detail-of-product-rtc.component';

describe('MaterialDetailOfProductRtcComponent', () => {
  let component: MaterialDetailOfProductRtcComponent;
  let fixture: ComponentFixture<MaterialDetailOfProductRtcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialDetailOfProductRtcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialDetailOfProductRtcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

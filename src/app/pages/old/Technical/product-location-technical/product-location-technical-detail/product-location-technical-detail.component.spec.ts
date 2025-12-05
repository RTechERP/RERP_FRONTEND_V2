/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductLocationTechnicalDetailComponent } from './product-location-technical-detail.component';

describe('ProductLocationTechnicalDetailComponent', () => {
  let component: ProductLocationTechnicalDetailComponent;
  let fixture: ComponentFixture<ProductLocationTechnicalDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductLocationTechnicalDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLocationTechnicalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductLocationTechDetailComponent } from './product-location-tech-detail.component';

describe('ProductLocationTechDetailComponent', () => {
  let component: ProductLocationTechDetailComponent;
  let fixture: ComponentFixture<ProductLocationTechDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ ProductLocationTechDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLocationTechDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

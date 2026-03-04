/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductLocationTechComponent } from './product-location-tech.component';

describe('ProductLocationTechComponent', () => {
  let component: ProductLocationTechComponent;
  let fixture: ComponentFixture<ProductLocationTechComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ProductLocationTechComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLocationTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

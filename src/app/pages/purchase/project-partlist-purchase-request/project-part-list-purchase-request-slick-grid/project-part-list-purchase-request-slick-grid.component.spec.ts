/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectPartListPurchaseRequestSlickGridComponent } from './project-part-list-purchase-request-slick-grid.component';

describe('ProjectPartListPurchaseRequestSlickGridComponent', () => {
  let component: ProjectPartListPurchaseRequestSlickGridComponent;
  let fixture: ComponentFixture<ProjectPartListPurchaseRequestSlickGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectPartListPurchaseRequestSlickGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPartListPurchaseRequestSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

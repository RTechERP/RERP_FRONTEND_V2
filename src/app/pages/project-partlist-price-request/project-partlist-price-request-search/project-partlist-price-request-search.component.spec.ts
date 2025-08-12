/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectPartlistPriceRequestSearchComponent } from './project-partlist-price-request-search.component';

describe('ProjectPartlistPriceRequestSearchComponent', () => {
  let component: ProjectPartlistPriceRequestSearchComponent;
  let fixture: ComponentFixture<ProjectPartlistPriceRequestSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectPartlistPriceRequestSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPartlistPriceRequestSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

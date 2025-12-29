/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectPartlistPriceRequestDemoComponent } from './project-partlist-price-request-demo.component';

describe('ProjectPartlistPriceRequestDemoComponent', () => {
  let component: ProjectPartlistPriceRequestDemoComponent;
  let fixture: ComponentFixture<ProjectPartlistPriceRequestDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectPartlistPriceRequestDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPartlistPriceRequestDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

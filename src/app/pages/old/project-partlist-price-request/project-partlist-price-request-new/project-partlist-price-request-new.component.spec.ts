/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectPartlistPriceRequestNewComponent } from './project-partlist-price-request-new.component';

describe('ProjectPartlistPriceRequestNewComponent', () => {
  let component: ProjectPartlistPriceRequestNewComponent;
  let fixture: ComponentFixture<ProjectPartlistPriceRequestNewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectPartlistPriceRequestNewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPartlistPriceRequestNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

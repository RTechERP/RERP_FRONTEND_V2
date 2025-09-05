/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetReuseFormComponent } from './ts-asset-reuse-form.component';

describe('TsAssetReuseFormComponent', () => {
  let component: TsAssetReuseFormComponent;
  let fixture: ComponentFixture<TsAssetReuseFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetReuseFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetReuseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

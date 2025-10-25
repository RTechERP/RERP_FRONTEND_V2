import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsAssetManagementPersonalTypeFormComponent } from './ts-asset-management-personal-type-form.component';

describe('TsAssetManagementPersonalTypeFormComponent', () => {
  let component: TsAssetManagementPersonalTypeFormComponent;
  let fixture: ComponentFixture<TsAssetManagementPersonalTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsAssetManagementPersonalTypeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsAssetManagementPersonalTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

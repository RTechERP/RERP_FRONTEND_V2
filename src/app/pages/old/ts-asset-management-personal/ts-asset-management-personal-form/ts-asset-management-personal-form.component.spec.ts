import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsAssetManagementPersonalFormComponent } from './ts-asset-management-personal-form.component';

describe('TsAssetManagementPersonalFormComponent', () => {
  let component: TsAssetManagementPersonalFormComponent;
  let fixture: ComponentFixture<TsAssetManagementPersonalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsAssetManagementPersonalFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsAssetManagementPersonalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

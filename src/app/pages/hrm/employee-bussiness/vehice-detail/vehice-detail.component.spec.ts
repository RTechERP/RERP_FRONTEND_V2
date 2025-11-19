import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiceDetailComponent } from './vehice-detail.component';

describe('VehiceDetailComponent', () => {
  let component: VehiceDetailComponent;
  let fixture: ComponentFixture<VehiceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiceDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

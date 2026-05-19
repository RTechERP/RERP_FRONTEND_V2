import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakertrainingTypeFormComponent } from './makertraining-type-form.component';

describe('MakertrainingTypeFormComponent', () => {
  let component: MakertrainingTypeFormComponent;
  let fixture: ComponentFixture<MakertrainingTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakertrainingTypeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakertrainingTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

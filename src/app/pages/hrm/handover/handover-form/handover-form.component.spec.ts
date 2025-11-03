import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoverFormComponent } from './handover-form.component';

describe('HandoverFormComponent', () => {
  let component: HandoverFormComponent;
  let fixture: ComponentFixture<HandoverFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandoverFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandoverFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistercontractdetailComponent } from './register-contract-detail.component';

describe('RegistercontractdetailComponent', () => {
  let component: RegistercontractdetailComponent;
  let fixture: ComponentFixture<RegistercontractdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistercontractdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistercontractdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

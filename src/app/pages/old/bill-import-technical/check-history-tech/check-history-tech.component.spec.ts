import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckHistoryTechComponent } from './check-history-tech.component';

describe('CheckHistoryTechComponent', () => {
  let component: CheckHistoryTechComponent;
  let fixture: ComponentFixture<CheckHistoryTechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckHistoryTechComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckHistoryTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

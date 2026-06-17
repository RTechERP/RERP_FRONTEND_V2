import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EslTestTableComponent } from './esl-test-table.component';

describe('EslTestTableComponent', () => {
  let component: EslTestTableComponent;
  let fixture: ComponentFixture<EslTestTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EslTestTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EslTestTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

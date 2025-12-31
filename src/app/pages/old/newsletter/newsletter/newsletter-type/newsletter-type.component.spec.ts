import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterTypeComponent } from './newsletter-type.component';

describe('NewsletterTypeComponent', () => {
  let component: NewsletterTypeComponent;
  let fixture: ComponentFixture<NewsletterTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsletterTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMediaCardComponent } from './app-media-card.component';

describe('AppMediaCardComponent', () => {
  let component: AppMediaCardComponent;
  let fixture: ComponentFixture<AppMediaCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppMediaCardComponent]
    });
    fixture = TestBed.createComponent(AppMediaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

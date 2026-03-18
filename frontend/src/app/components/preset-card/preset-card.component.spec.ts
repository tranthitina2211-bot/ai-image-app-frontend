import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetCardComponent } from './preset-card.component';

describe('PresetCardComponent', () => {
  let component: PresetCardComponent;
  let fixture: ComponentFixture<PresetCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PresetCardComponent]
    });
    fixture = TestBed.createComponent(PresetCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

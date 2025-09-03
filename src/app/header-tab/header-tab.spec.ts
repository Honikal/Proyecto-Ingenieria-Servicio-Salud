import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderTab } from './header-tab';

describe('HeaderTab', () => {
  let component: HeaderTab;
  let fixture: ComponentFixture<HeaderTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

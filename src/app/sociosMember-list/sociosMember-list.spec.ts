import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SociosMemberList } from './sociosMember-list';

describe('MemberList', () => {
  let component: SociosMemberList;
  let fixture: ComponentFixture<SociosMemberList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SociosMemberList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SociosMemberList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

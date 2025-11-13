import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCursos } from './lista-cursos';

describe('ListaCursos', () => {
  let component: ListaCursos;
  let fixture: ComponentFixture<ListaCursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCursos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaCursos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCursosSocio } from './lista-cursos-socio';

describe('ListaCursos', () => {
  let component: ListaCursosSocio;
  let fixture: ComponentFixture<ListaCursosSocio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCursosSocio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaCursosSocio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

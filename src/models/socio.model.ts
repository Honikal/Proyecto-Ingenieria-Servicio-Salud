export interface Socio {
  id?: string;
  nombre: string;
  cantidadAsociados: number;
  email: string;
  telefono: string;
  cursos?: { nombre: string }[];
}
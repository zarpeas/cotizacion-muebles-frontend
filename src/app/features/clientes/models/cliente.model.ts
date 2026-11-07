export interface Cliente {
  idCliente: number;
  razonSocial: string;
  rut: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  comuna: string | null;
  estado: boolean;
  fechaCreacion: string;
}
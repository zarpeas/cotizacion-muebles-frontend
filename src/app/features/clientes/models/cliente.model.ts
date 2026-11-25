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

/** Datos enviados al crear/actualizar; el backend genera id y fecha. */
export type ClientePayload = Pick<
  Cliente,
  'razonSocial' | 'rut' | 'telefono' | 'correo' | 'direccion' | 'ciudad' | 'comuna' | 'estado'
>;

export interface Usuario {
  idUsuario?: number;
  nombres: string;
  apellidos: string;
  username: string;
  password?: string;
  rol: 'ADMIN' | 'ASESOR';
  estado: boolean;
  correo: string;
  fechaCreacion?: string;
  fechaEntrada?: string;
}

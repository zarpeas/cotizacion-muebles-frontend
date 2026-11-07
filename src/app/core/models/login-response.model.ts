export interface LoginResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  username: string;
  rol: 'ADMIN' | 'USUARIO';
}
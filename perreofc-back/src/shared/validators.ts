/**
 * Provides shared backend infrastructure for validators.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */

/**
 * Validadores compartidos para toda la aplicación.
 *
 * Centralizar aquí las reglas de validación evita que cambiar la política
 * de contraseñas en un sitio deje otros inconsistentes.
 */

/**
 * Verifica que una contraseña cumple la política mínima de seguridad.
 * Devuelve el mensaje de error en inglés (para consistencia con el resto del
 * módulo de auth) o null si la contraseña es válida.
 *
 * Política actual:
 *  - Mínimo 8 caracteres
 *  - Al menos 1 mayúscula (A-Z)
 *  - Al menos 1 minúscula (a-z)
 *  - Al menos 1 dígito (0-9)
 *  - Al menos 1 carácter especial (!@#$%^&*)
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8)
    return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter (A-Z)';
  if (!/[a-z]/.test(password))
    return 'Password must contain at least one lowercase letter (a-z)';
  if (!/[0-9]/.test(password))
    return 'Password must contain at least one number (0-9)';
  if (!/[!@#$%^&*]/.test(password))
    return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
}

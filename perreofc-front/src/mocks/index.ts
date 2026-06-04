/**
 * Mock data used by the frontend for index scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

// src/mocks/index.ts — re-exporta todos los mocks para que api.ts los consuma
// Ningún componente debe importar de aquí directamente: usar src/services/api.ts

export { MOCK_USERS, mockLogin } from './users';
export { MOCK_EVENTS } from './events';
export { MOCK_MATCHES } from './matches';
export { MOCK_NEWS } from './news';
export { MOCK_IMAGES } from './images';
export { MOCK_PLAYERS, MOCK_TEAMS } from './players';
export { MOCK_LEADERBOARD, MOCK_LEADERBOARD_MENSUAL, MOCK_LEADERBOARD_SEMANAL } from './leaderboard';
export { MOCK_CLASSIFICATION } from './classification';

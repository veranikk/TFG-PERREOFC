-- SQL migration or seed script for the backend database: 009 mock data.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- 0. CREAR JUGADORES DE PRUEBA (Necesario para las FK)
INSERT INTO players (id, full_name, first_name, last_name)
VALUES 
(12345, 'Jugador Test 1', 'Jugador', 'Test 1'),
(12346, 'Jugador Test 2', 'Jugador', 'Test 2'),
(12347, 'Jugador Test 3', 'Jugador', 'Test 3'),
(24141910, 'Tu Jugador', 'Tu', 'Jugador')
ON CONFLICT (id) DO NOTHING;

-- 1. DATOS PARA TEST 21, 22 y 30 (Tarjetas y Estadísticas de Partido)
INSERT INTO match_cards (match_id, player_id, player_name, side, minute, card_type_code)
VALUES 
(5379425, 12345, 'Jugador Test 1', 'home', 25, 100),
(5379425, 12346, 'Jugador Test 2', 'home', 40, 100),
(5379425, 12347, 'Jugador Test 3', 'away', 60, 101)
ON CONFLICT DO NOTHING;

-- 2. DATOS PARA TEST 28, 29 y 58 (Alineaciones y MVP)
INSERT INTO match_lineup_entries (match_id, player_id, player_name, side, dorsal, is_starter)
VALUES 
(5379425, 12345, 'Jugador Test 1', 'home', 10, true),
(5379425, 12346, 'Jugador Test 2', 'home', 7, true),
(5379425, 24141910, 'Tu Jugador', 'home', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO match_goals (match_id, player_id, player_name, side, minute, goal_type_code)
VALUES (5379425, 12345, 'Jugador Test 1', 'home', 15, 1)
ON CONFLICT DO NOTHING;

-- 3. DATOS PARA TEST 44 (Leaderboard de Apuestas)
UPDATE user_bets 
SET result = 'win', points_won = 100 
WHERE id IN (
    SELECT id FROM user_bets 
    WHERE result = 'pending' 
    LIMIT 2
);

-- 4. DATOS PARA FASE 10 (Notificaciones)
DO $$
DECLARE
    target_user_id uuid := (SELECT id FROM users LIMIT 1);
BEGIN
    IF target_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, read)
        VALUES 
        (target_user_id, '¡Bienvenido!', 'Gracias por unirte a PerreoFC.', 'general', false),
        (target_user_id, 'Apuesta Ganada', 'Has ganado 100 puntos en tu última apuesta.', 'bet_settled', false),
        (target_user_id, 'Nueva Jornada', 'Ya están disponibles los horarios de la jornada 30.', 'match_reminder', true);
    END IF;
END $$;

-- SQL migration or seed script for the backend database: 006 migration bets.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

CREATE OR REPLACE FUNCTION public.settle_match_bets(p_match_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match        RECORD;
  v_real_result  TEXT;
  v_bet          RECORD;
  v_multiplier   INTEGER;
  v_points_won   INTEGER;
  v_winners      INTEGER := 0;
  v_total_pts    INTEGER := 0;
  v_settled      INTEGER := 0;
BEGIN
  SELECT id, home_score, away_score, status, is_closed
    INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  IF NOT v_match.is_closed THEN RAISE EXCEPTION 'MATCH_NOT_CLOSED'; END IF;
  IF v_match.status <> 'finished' THEN RAISE EXCEPTION 'MATCH_NOT_FINISHED'; END IF;

  -- Determinar resultado real
  IF v_match.home_score > v_match.away_score THEN
    v_real_result := 'home';
  ELSIF v_match.home_score = v_match.away_score THEN
    v_real_result := 'draw';
  ELSE
    v_real_result := 'away';
  END IF;

  FOR v_bet IN
    SELECT id, user_id, prediction, points_wagered
    FROM user_bets WHERE match_id = p_match_id AND result = 'pending'
  LOOP
    v_settled := v_settled + 1;

    IF v_bet.prediction = v_real_result THEN
      -- Ganada
      v_multiplier := CASE WHEN v_real_result = 'draw' THEN 3 ELSE 2 END;
      v_points_won := v_bet.points_wagered * v_multiplier;

      UPDATE user_bets
        SET result = 'win', points_won = v_points_won, settled_at = NOW()
        WHERE id = v_bet.id;

      UPDATE users SET points = points + v_points_won WHERE id = v_bet.user_id;

      INSERT INTO points_transactions (user_id, amount, action, reference_id, reference_type)
        VALUES (v_bet.user_id, v_points_won, 'win_bet', p_match_id::TEXT, 'match');

      v_winners := v_winners + 1;
      v_total_pts := v_total_pts + v_points_won;
    ELSE
      -- Perdida
      UPDATE user_bets
        SET result = 'loss', points_won = 0, settled_at = NOW()
        WHERE id = v_bet.id;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'matchId',           p_match_id,
    'betsSettled',       v_settled,
    'winnersCount',      v_winners,
    'totalPointsAwarded', v_total_pts
  );
END;
$$;

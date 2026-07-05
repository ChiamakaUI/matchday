/* @name GetEntryCount */
SELECT COUNT(*) AS count
FROM entries
WHERE contest_id = :contestId;

/* @name GetExistingEntry */
SELECT id
FROM entries
WHERE user_id = :userId AND contest_id = :contestId;

/* @name CreateEntry */
INSERT INTO entries (user_id, contest_id, entry_tx)
VALUES (:userId, :contestId, :entryTx)
RETURNING *;

/* @name GetEntriesByContest */
SELECT id, user_id, contest_id, total_points, rank, entry_tx, created_at
FROM entries
WHERE contest_id = :contestId;

/* @name GetEntriesByUser */
SELECT e.*, c.name AS contest_name, c.status AS contest_status,
  c.entry_fee, c.deadline
FROM entries e
JOIN contests c ON e.contest_id = c.id
WHERE e.user_id = :userId
ORDER BY e.created_at DESC;

/* @name GetEntryWithContest */
SELECT e.*, c.name AS contest_name, c.status AS contest_status
FROM entries e
JOIN contests c ON e.contest_id = c.id
WHERE e.id = :entryId;

/* @name UpdateEntryPoints */
UPDATE entries SET total_points = :totalPoints
WHERE id = :entryId;

/* @name RankEntries */
UPDATE entries SET rank = sub.rank
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) AS rank
  FROM entries WHERE contest_id = :contestId
) sub
WHERE entries.id = sub.id;

/* @name GetLeaderboard */
SELECT
  e.id AS entry_id, e.total_points, e.rank,
  u.wallet_address, u.display_name, u.avatar_url
FROM entries e
JOIN users u ON e.user_id = u.id
WHERE e.contest_id = :contestId
ORDER BY e.total_points DESC, e.created_at ASC;

/* @name GetRankedEntriesWithWallets */
SELECT e.*, u.wallet_address
FROM entries e
JOIN users u ON e.user_id = u.id
WHERE e.contest_id = :contestId
ORDER BY e.rank ASC;

/* @name CreatePrediction */
INSERT INTO predictions (entry_id, fixture_id, prediction_type, predicted_value, confidence)
VALUES (:entryId, :fixtureId, :predictionType, :predictedValue, :confidence);

/* @name GetPredictionsByEntry */
SELECT *
FROM predictions
WHERE entry_id = :entryId;

/* @name GetPredictionsWithFixtures */
SELECT p.*,
  ht.name AS home_team_name, at.name AS away_team_name,
  f.home_score, f.away_score, f.status AS fixture_status, f.kickoff
FROM predictions p
JOIN fixtures f ON p.fixture_id = f.id
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE p.entry_id = :entryId
ORDER BY f.kickoff ASC;

/* @name UpdatePredictionResult */
UPDATE predictions
SET points_awarded = :pointsAwarded, is_correct = :isCorrect
WHERE id = :predictionId;

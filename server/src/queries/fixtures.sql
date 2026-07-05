/* @name ListFixtures */
SELECT
  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
  f.kickoff, f.status, f.home_score, f.away_score,
  f.home_score_ht, f.away_score_ht,
  ht.id AS home_team_id, ht.name AS home_team_name,
  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
  at.id AS away_team_id, at.name AS away_team_name,
  at.short_name AS away_team_short, at.logo_url AS away_team_logo
FROM fixtures f
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE (:status::text IS NULL OR f.status = :status)
AND (:fixtureGroup::text IS NULL OR f.fixture_group = :fixtureGroup)
AND (:matchday::int IS NULL OR f.matchday = :matchday)
AND (:fromDate::timestamptz IS NULL OR f.kickoff >= :fromDate)
AND (:toDate::timestamptz IS NULL OR f.kickoff <= :toDate)
ORDER BY f.kickoff ASC;

/* @name GetFixtureById */
SELECT
  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
  f.kickoff, f.status, f.home_score, f.away_score,
  f.home_score_ht, f.away_score_ht, f.raw_response,
  ht.id AS home_team_id, ht.name AS home_team_name,
  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
  at.id AS away_team_id, at.name AS away_team_name,
  at.short_name AS away_team_short, at.logo_url AS away_team_logo
FROM fixtures f
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE f.id = :fixtureId;

/* @name GetFixturesByContest */
SELECT
  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
  f.kickoff, f.status, f.home_score, f.away_score,
  f.home_score_ht, f.away_score_ht,
  ht.id AS home_team_id, ht.name AS home_team_name,
  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
  at.id AS away_team_id, at.name AS away_team_name,
  at.short_name AS away_team_short, at.logo_url AS away_team_logo
FROM contest_fixtures cf
JOIN fixtures f ON cf.fixture_id = f.id
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE cf.contest_id = :contestId
ORDER BY f.kickoff ASC;

/* @name GetActiveFixtures */
SELECT id, txline_fixture_id, status
FROM fixtures
WHERE status NOT IN ('FT', 'FET', 'FPEN', 'CANC', 'PST')
AND kickoff <= now() + INTERVAL '15 minutes'
ORDER BY kickoff ASC;

/* @name UpdateFixtureScores */
UPDATE fixtures SET
  status = :status,
  home_score = :homeScore,
  away_score = :awayScore,
  home_score_ht = :homeScoreHt,
  away_score_ht = :awayScoreHt,
  raw_response = :rawResponse
WHERE id = :fixtureId;

/* @name UpsertTeam */
INSERT INTO teams (name)
VALUES (:name)
ON CONFLICT (name) DO UPDATE SET updated_at = now()
RETURNING id;

/* @name UpsertFixture */
INSERT INTO fixtures (
  txline_fixture_id, home_team_id, away_team_id,
  fixture_group, kickoff
) VALUES (:txlineFixtureId, :homeTeamId, :awayTeamId, :fixtureGroup, :kickoff)
ON CONFLICT (txline_fixture_id) DO UPDATE SET
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id,
  fixture_group = EXCLUDED.fixture_group,
  kickoff = EXCLUDED.kickoff,
  updated_at = now();

/* @name GetContestFixtureIds */
SELECT f.id, f.kickoff, f.status
FROM contest_fixtures cf
JOIN fixtures f ON cf.fixture_id = f.id
WHERE cf.contest_id = :contestId;

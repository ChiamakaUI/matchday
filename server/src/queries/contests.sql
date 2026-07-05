/* @name ListContests */
SELECT c.*,
  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count
FROM contests c
WHERE (:status::text IS NULL OR c.status = :status)
ORDER BY c.deadline ASC;

/* @name ListContestsWithFixtureCount */
SELECT c.*,
  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count,
  (SELECT COUNT(*) FROM contest_fixtures cf WHERE cf.contest_id = c.id) AS fixture_count
FROM contests c
WHERE c.status = :status
ORDER BY c.deadline ASC;

/* @name GetContestById */
SELECT c.*,
  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count
FROM contests c
WHERE c.id = :contestId;

/* @name GetPayoutStructure */
SELECT min_rank, max_rank, pct_of_pool
FROM payout_structures
WHERE contest_id = :contestId
ORDER BY min_rank ASC;

/* @name CreateContest */
INSERT INTO contests (name, description, entry_fee, rake_pct, max_entries, deadline)
VALUES (:name, :description, :entryFee, :rakePct, :maxEntries, :deadline)
RETURNING *;

/* @name AddContestFixture */
INSERT INTO contest_fixtures (contest_id, fixture_id)
VALUES (:contestId, :fixtureId);

/* @name AddPayoutStructure */
INSERT INTO payout_structures (contest_id, min_rank, max_rank, pct_of_pool)
VALUES (:contestId, :minRank, :maxRank, :pctOfPool);

/* @name UpdateContestStatus */
UPDATE contests SET status = :toStatus
WHERE id = :contestId
RETURNING *;

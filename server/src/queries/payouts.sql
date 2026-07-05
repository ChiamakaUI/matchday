/* @name CreatePayout */
INSERT INTO payouts (contest_id, user_id, entry_id, rank, amount, status)
VALUES (:contestId, :userId, :entryId, :rank, :amount, 'pending');

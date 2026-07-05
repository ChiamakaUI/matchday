/* @name StartSyncLog */
INSERT INTO sync_log (sync_type, status)
VALUES (:syncType, 'started')
RETURNING id;

/* @name CompleteSyncLog */
UPDATE sync_log
SET status = 'completed', records_processed = :recordsProcessed, completed_at = now()
WHERE id = :logId;

/* @name FailSyncLog */
UPDATE sync_log
SET status = 'failed', error_message = :errorMessage, completed_at = now()
WHERE id = :logId;

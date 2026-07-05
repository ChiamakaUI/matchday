/* @name CreateThread */
INSERT INTO assistant_threads (user_id, title)
VALUES (:userId, :title)
RETURNING id;

/* @name GetThreadsByUser */
SELECT *
FROM assistant_threads
WHERE user_id = :userId
ORDER BY updated_at DESC;

/* @name GetThreadMessages */
SELECT role, content, tool_calls
FROM assistant_messages
WHERE thread_id = :threadId
ORDER BY created_at ASC;

/* @name InsertMessage */
INSERT INTO assistant_messages (thread_id, role, content, tool_calls)
VALUES (:threadId, :role, :content, :toolCalls);

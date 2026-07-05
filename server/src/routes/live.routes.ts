import { Router } from 'express';
import { addListener, type LiveScoreEvent } from '../services/sse.service.js';

export const liveRoutes = Router();

/**
 * GET /live/scores
 *
 * SSE endpoint for frontend clients. Streams live score updates
 * as they come in from TxLINE. The frontend connects with EventSource:
 *
 *   const es = new EventSource('/live/scores');
 *   es.addEventListener('score', (e) => {
 *     const data = JSON.parse(e.data);
 *     // { fixtureId, status, homeScore, awayScore, ... }
 *   });
 */
liveRoutes.get('/scores', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial ping so the client knows the connection is alive
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  // Keep-alive every 30 seconds to prevent proxy timeouts
  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 30_000);

  // Subscribe to live updates
  const unsubscribe = addListener((event: LiveScoreEvent) => {
    res.write(`event: score\ndata: ${JSON.stringify(event)}\n\n`);
  });

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});
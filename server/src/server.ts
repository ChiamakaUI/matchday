import { loadEnv } from "./config/index.js";

// Load and validate env before any module accesses env()
const config = loadEnv();

// Dynamic imports so modules can safely call env() at import time
const [
  { default: express },
  { default: cors },
  { errorHandler },
  {
    fixtureRoutes,
    contestRoutes,
    entryRoutes,
    adminRoutes,
    assistantRoutes,
    agentRoutes,
    syncRoutes,
    userRoutes,
    liveRoutes,
    testRoutes
  },
] = await Promise.all([
  import("express"),
  import("cors"),
  import("./middleware/error-handler.js"),
  import("./routes/index.js"),
]);

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "matchday" });
});

// ── Routes (mounted at root, no /api prefix) ────────────────
app.use("/fixtures", fixtureRoutes);
app.use("/contests", contestRoutes);
app.use("/entries", entryRoutes);
app.use("/admin", adminRoutes);
app.use("/assistant", assistantRoutes);
app.use("/agent", agentRoutes);
app.use("/sync", syncRoutes);
app.use("/users", userRoutes);
app.use("/live", liveRoutes);
app.use('/test', testRoutes);

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`MatchDay server running on port ${config.PORT}`);
});

app.listen(config.PORT, () => {
  console.log(`MatchDay server running on port ${config.PORT}`);

  // Start TxLINE live scores listener
  if (process.env['ENABLE_SSE'] === 'true') {
  import("./services/sse.service.js").then(({ startSseListener }) => {
    startSseListener().catch((err) =>
      console.error("SSE listener failed to start:", err),
    );
  });
}
});
// Start agent cron
import("./lib/cron.js").then(({ startAgentCron }) => {
  startAgentCron();
});
export default app;

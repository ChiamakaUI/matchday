/**
 * MatchDay Seed Script
 *
 * Creates test contests from fixtures already in the DB.
 * Run syncFixtures first to populate fixtures from TxLINE.
 *
 * Usage:
 *   npx tsx src/scripts/seed.ts
 *
 * Options:
 *   --reset   Drop and recreate contest data (keeps fixtures and teams)
 */

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
});

async function main() {
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    console.log('🗑️  Resetting contest data...');
    await pool.query('DELETE FROM predictions');
    await pool.query('DELETE FROM payouts');
    await pool.query('DELETE FROM payout_structures');
    await pool.query('DELETE FROM entries');
    await pool.query('DELETE FROM contest_fixtures');
    await pool.query('DELETE FROM contests');
    await pool.query('DELETE FROM agent_actions');
    await pool.query('DELETE FROM agent_rules');
    await pool.query('DELETE FROM agent_budgets');
    await pool.query('DELETE FROM assistant_messages');
    await pool.query('DELETE FROM assistant_threads');
    console.log('   Done\n');
  }

  // 1. Check for fixtures
  const { rows: allFixtures } = await pool.query(
    `SELECT f.id, f.kickoff, f.fixture_group, f.status,
      ht.name AS home_team, at.name AS away_team
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    JOIN teams at ON f.away_team_id = at.id
    WHERE f.status = 'NS'
    ORDER BY f.kickoff ASC`,
  );

  if (allFixtures.length === 0) {
    console.error('❌ No fixtures found. Run POST /sync/fixtures first.');
    process.exit(1);
  }

  console.log(`📋 Found ${allFixtures.length} upcoming fixtures\n`);

  // 2. Group fixtures by date for natural contest boundaries
  const fixturesByDate = new Map<string, typeof allFixtures>();
  for (const f of allFixtures) {
    const dateKey = new Date(f.kickoff as string).toISOString().split('T')[0]!;
    const group = fixturesByDate.get(dateKey) ?? [];
    group.push(f);
    fixturesByDate.set(dateKey, group);
  }

  // 3. Create contests
  let contestCount = 0;

  for (const [dateStr, fixtures] of fixturesByDate) {
    if (fixtures.length === 0) continue;

    // Skip dates with only friendlies
    const worldCupFixtures = fixtures.filter((f) => f.fixture_group !== 'Friendly');
    if (worldCupFixtures.length === 0) continue;

    const fixtureNames = worldCupFixtures
      .map((f) => `${f.home_team} vs ${f.away_team}`)
      .join(', ');

    // Set deadline to 1 hour before the earliest kickoff
    const earliestKickoff = new Date(worldCupFixtures[0]!.kickoff as string);
    const deadline = new Date(earliestKickoff.getTime() - 60 * 60 * 1000);

    const displayDate = new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const contestName = `World Cup ${displayDate} — ${worldCupFixtures.length} Match${worldCupFixtures.length > 1 ? 'es' : ''}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create contest
      const { rows: contestRows } = await client.query(
        `INSERT INTO contests (name, description, entry_fee, rake_pct, max_entries, deadline)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          contestName,
          fixtureNames,
          5.00,   // 5 USDC entry
          10.00,  // 10% rake
          100,    // max 100 entries
          deadline.toISOString(),
        ],
      );
      const contestId = contestRows[0]!.id as string;

      // Link fixtures
      for (const fixture of worldCupFixtures) {
        await client.query(
          'INSERT INTO contest_fixtures (contest_id, fixture_id) VALUES ($1, $2)',
          [contestId, fixture.id],
        );
      }

      // Payout structure: 1st 60%, 2nd 25%, 3rd 15%
      const payoutTiers = [
        { minRank: 1, maxRank: 1, pct: 60 },
        { minRank: 2, maxRank: 2, pct: 25 },
        { minRank: 3, maxRank: 3, pct: 15 },
      ];

      for (const tier of payoutTiers) {
        await client.query(
          `INSERT INTO payout_structures (contest_id, min_rank, max_rank, pct_of_pool)
          VALUES ($1, $2, $3, $4)`,
          [contestId, tier.minRank, tier.maxRank, tier.pct],
        );
      }

      await client.query('COMMIT');

      contestCount++;
      console.log(`✅ ${contestName}`);
      console.log(`   ${worldCupFixtures.length} fixtures, deadline ${deadline.toISOString()}`);
      console.log(`   Entry: 5 USDC, max 100 entries`);
      console.log(`   ID: ${contestId}\n`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (contestCount === 0) {
    console.log('⚠️  No World Cup fixtures found to create contests from.');
    console.log('   All fixtures may be friendlies. Check fixture_group values.');
  } else {
    console.log(`\n🏆 Created ${contestCount} contest${contestCount > 1 ? 's' : ''}`);
  }

  // 4. Summary
  const { rows: summary } = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM teams) AS teams,
      (SELECT COUNT(*) FROM fixtures) AS fixtures,
      (SELECT COUNT(*) FROM contests) AS contests`,
  );

  const s = summary[0]!;
  console.log(`\n📊 Database summary:`);
  console.log(`   Teams: ${s.teams}`);
  console.log(`   Fixtures: ${s.fixtures}`);
  console.log(`   Contests: ${s.contests}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
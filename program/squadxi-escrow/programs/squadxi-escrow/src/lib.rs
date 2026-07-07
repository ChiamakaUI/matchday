pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;
pub use errors::*;

declare_id!("EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8");


#[program]
pub mod squadxi {
    use super::*;

    // --- Config ---

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::initialize_config::handler(ctx)
    }

    pub fn update_config(ctx: Context<UpdateConfig>) -> Result<()> {
        instructions::update_config::handler(ctx)
    }

    // --- Contest ---

    pub fn create_contest(
        ctx: Context<CreateContest>,
        contest_id: [u8; 16],
        entry_fee: u64,
        rake_bps: u16,
        max_entries: u32,
        deadline: i64,
    ) -> Result<()> {
        instructions::create_contest::handler(ctx, contest_id, entry_fee, rake_bps, max_entries, deadline)
    }

    pub fn enter_contest(ctx: Context<EnterContest>, contest_id: [u8; 16]) -> Result<()> {
        instructions::enter_contest::handler(ctx, contest_id)
    }

    pub fn lock_contest(ctx: Context<LockContest>, contest_id: [u8; 16]) -> Result<()> {
        instructions::lock_contest::handler(ctx, contest_id)
    }

    pub fn settle_contest<'a>(
        ctx: Context<'a, SettleContest<'a>>,
        contest_id: [u8; 16],
        winners: Vec<WinnerPayout>,
    ) -> Result<()> {
        instructions::settle_contest::handler(ctx, contest_id, winners)
    }

    pub fn cancel_contest(ctx: Context<CancelContest>, contest_id: [u8; 16]) -> Result<()> {
        instructions::cancel_contest::handler(ctx, contest_id)
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>, contest_id: [u8; 16]) -> Result<()> {
        instructions::claim_refund::handler(ctx, contest_id)
    }

    // --- Agent ---

    pub fn initialize_agent(
        ctx: Context<InitializeAgent>,
        max_spend_per_contest: u64,
        max_contests_per_week: u8,
    ) -> Result<()> {
        instructions::initialize_agent::handler(ctx, max_spend_per_contest, max_contests_per_week)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    pub fn agent_enter_contest(
        ctx: Context<AgentEnterContest>,
        contest_id: [u8; 16],
        amount: u64,
    ) -> Result<()> {
        instructions::agent_enter_contest::handler(ctx, contest_id, amount)
    }

    pub fn update_agent_config(
        ctx: Context<UpdateAgentConfig>,
        max_spend_per_contest: u64,
        max_contests_per_week: u8,
    ) -> Result<()> {
        instructions::update_agent_config::handler(ctx, max_spend_per_contest, max_contests_per_week)
    }

    pub fn deactivate_agent(ctx: Context<ToggleAgent>) -> Result<()> {
        instructions::toggle_agent::deactivate(ctx)
    }

    pub fn activate_agent(ctx: Context<ToggleAgent>) -> Result<()> {
        instructions::toggle_agent::activate(ctx)
    }
}
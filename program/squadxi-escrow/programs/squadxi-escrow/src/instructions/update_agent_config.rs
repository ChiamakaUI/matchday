use anchor_lang::prelude::*;

use crate::{errors::SquadXIError, state::AgentConfig};

#[derive(Accounts)]
pub struct UpdateAgentConfig<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent-config", user.key().as_ref()],
        bump = agent_config.bump,
        constraint = agent_config.user == user.key() @ SquadXIError::NotOwner,
    )]
    pub agent_config: Account<'info, AgentConfig>,
}

pub fn handler(
    ctx: Context<UpdateAgentConfig>,
    max_spend_per_contest: u64,
    max_contests_per_week: u8,
) -> Result<()> {
    let config = &mut ctx.accounts.agent_config;
    config.max_spend_per_contest = max_spend_per_contest;
    config.max_contests_per_week = max_contests_per_week;
    Ok(())
}
use anchor_lang::prelude::*;

use crate::{errors::SquadXIError, state::AgentConfig};

#[derive(Accounts)]
pub struct ToggleAgent<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent-config", user.key().as_ref()],
        bump = agent_config.bump,
        constraint = agent_config.user == user.key() @ SquadXIError::NotOwner,
    )]
    pub agent_config: Account<'info, AgentConfig>,
}

pub fn deactivate(ctx: Context<ToggleAgent>) -> Result<()> {
    ctx.accounts.agent_config.is_active = false;
    Ok(())
}

pub fn activate(ctx: Context<ToggleAgent>) -> Result<()> {
    ctx.accounts.agent_config.is_active = true;
    Ok(())
}
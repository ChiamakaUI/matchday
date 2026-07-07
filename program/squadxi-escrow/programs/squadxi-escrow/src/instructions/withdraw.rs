use anchor_lang::prelude::*;
use anchor_spl::token::{transfer as token_transfer, Token, TokenAccount, Transfer};

use crate::{errors::SquadXIError, state::AgentConfig};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent-config", user.key().as_ref()],
        bump = agent_config.bump,
        constraint = agent_config.user == user.key() @ SquadXIError::NotOwner,
    )]
    pub agent_config: Account<'info, AgentConfig>,

    #[account(
        mut,
        seeds = [b"agent-vault", user.key().as_ref()],
        bump = agent_config.vault_bump,
    )]
    pub agent_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ SquadXIError::NotOwner,
        constraint = user_token_account.mint == agent_vault.mint @ SquadXIError::InvalidMint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(
        ctx.accounts.agent_vault.amount >= amount,
        SquadXIError::InsufficientVaultBalance
    );

    let user_key = ctx.accounts.agent_config.user;
    let bump = ctx.accounts.agent_config.bump;

    let seeds: &[&[u8]] = &[b"agent-config", user_key.as_ref(), &[bump]];
    let signer = &[seeds];

    token_transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.agent_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.agent_config.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    Ok(())
}
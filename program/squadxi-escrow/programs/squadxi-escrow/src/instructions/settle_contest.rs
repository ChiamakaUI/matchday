use anchor_lang::prelude::*;
use anchor_spl::token::{transfer as token_transfer, Token, TokenAccount, Transfer};

use crate::{
    errors::SquadXIError,
    state::{Contest, ContestStatus, WinnerPayout},
};

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct SettleContest<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"contest", contest_id.as_ref()],
        bump = contest.bump,
        constraint = contest.authority == authority.key() @ SquadXIError::NotAuthority,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"vault", contest_id.as_ref()],
        bump = contest.vault_bump,
    )]
    pub contest_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury.mint == contest.usdc_mint @ SquadXIError::InvalidMint,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler<'a>(
    ctx: Context<'a, SettleContest<'a>>,
    _contest_id: [u8; 16],
    winners: Vec<WinnerPayout>,
) -> Result<()> {
    require!(
        ctx.accounts.contest.status == ContestStatus::Locked,
        SquadXIError::ContestNotLocked
    );
    require!(
        ctx.remaining_accounts.len() == winners.len(),
        SquadXIError::InvalidSettlement
    );

    let total_pool = ctx.accounts.contest.total_pool;
    let rake_bps = ctx.accounts.contest.rake_bps;
    let contest_id_bytes = ctx.accounts.contest.contest_id;
    let contest_bump = ctx.accounts.contest.bump;

    let rake_amount = (total_pool as u128)
        .checked_mul(rake_bps as u128)
        .ok_or(SquadXIError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SquadXIError::MathOverflow)? as u64;

    let winner_total: u64 = winners
        .iter()
        .try_fold(0u64, |acc, w| acc.checked_add(w.amount))
        .ok_or(SquadXIError::MathOverflow)?;

    require!(
        winner_total
            .checked_add(rake_amount)
            .ok_or(SquadXIError::MathOverflow)?
            == total_pool,
        SquadXIError::InvalidSettlement
    );

    let seeds: &[&[u8]] = &[b"contest", &contest_id_bytes, &[contest_bump]];
    let signer = &[seeds];
    let token_program_key = ctx.accounts.token_program.key();

    for (winner, account_info) in winners.iter().zip(ctx.remaining_accounts.iter()) {
        require!(
            account_info.key() == winner.token_account,
            SquadXIError::InvalidSettlement
        );

        token_transfer(
            CpiContext::new_with_signer(
                token_program_key,
                Transfer {
                    from: ctx.accounts.contest_vault.to_account_info(),
                    to: account_info.to_account_info(),
                    authority: ctx.accounts.contest.to_account_info(),
                },
                signer,
            ),
            winner.amount,
        )?;
    }

    if rake_amount > 0 {
        token_transfer(
            CpiContext::new_with_signer(
                token_program_key,
                Transfer {
                    from: ctx.accounts.contest_vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.contest.to_account_info(),
                },
                signer,
            ),
            rake_amount,
        )?;
    }

    ctx.accounts.contest.status = ContestStatus::Settled;

    Ok(())
}
use anchor_lang::prelude::*;

use crate::{
    errors::SquadXIError,
    state::{Contest, ContestStatus},
};

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct CancelContest<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"contest", contest_id.as_ref()],
        bump = contest.bump,
        constraint = contest.authority == authority.key() @ SquadXIError::NotAuthority,
    )]
    pub contest: Account<'info, Contest>,
}

pub fn handler(ctx: Context<CancelContest>, _contest_id: [u8; 16]) -> Result<()> {
    let contest = &mut ctx.accounts.contest;
    // DON'T UNDERSTAND
    require!(
        contest.status == ContestStatus::Open || contest.status == ContestStatus::Locked,
        SquadXIError::ContestNotOpen
    );
    // MIGHT USE SET INNER HERE
    contest.status = ContestStatus::Cancelled;
    Ok(())
}
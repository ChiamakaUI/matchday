/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/squadxi.json`.
 */
export type Squadxi = {
  "address": "EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8",
  "metadata": {
    "name": "squadxi",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "SquadXI — unified fantasy football on-chain program"
  },
  "instructions": [
    {
      "name": "activateAgent",
      "discriminator": [
        252,
        139,
        87,
        21,
        195,
        152,
        29,
        217
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "agentEnterContest",
      "discriminator": [
        170,
        52,
        247,
        75,
        50,
        75,
        42,
        56
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "signer": true
        },
        {
          "name": "user"
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "agentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "contestVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "entryReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelContest",
      "discriminator": [
        255,
        250,
        141,
        71,
        184,
        141,
        109,
        80
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "claimRefund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "contest",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "contestVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "entryReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "createContest",
      "discriminator": [
        129,
        189,
        164,
        27,
        152,
        242,
        123,
        93
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "contestVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "allowedMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "entryFee",
          "type": "u64"
        },
        {
          "name": "rakeBps",
          "type": "u16"
        },
        {
          "name": "maxEntries",
          "type": "u32"
        },
        {
          "name": "deadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "deactivateAgent",
      "discriminator": [
        205,
        171,
        239,
        225,
        82,
        126,
        96,
        166
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "agentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "enterContest",
      "discriminator": [
        124,
        21,
        89,
        144,
        102,
        156,
        149,
        232
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "contestVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "entryReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "initializeAgent",
      "discriminator": [
        212,
        81,
        156,
        211,
        212,
        110,
        21,
        28
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "agentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "allowedMint"
        },
        {
          "name": "agent"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxSpendPerContest",
          "type": "u64"
        },
        {
          "name": "maxContestsPerWeek",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "programConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "allowedMint"
        },
        {
          "name": "treasury"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "lockContest",
      "discriminator": [
        124,
        155,
        70,
        224,
        136,
        196,
        104,
        207
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "settleContest",
      "discriminator": [
        79,
        122,
        33,
        192,
        110,
        98,
        219,
        238
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "contestVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "winners",
          "type": {
            "vec": {
              "defined": {
                "name": "winnerPayout"
              }
            }
          }
        }
      ]
    },
    {
      "name": "updateAgentConfig",
      "discriminator": [
        232,
        239,
        83,
        133,
        24,
        49,
        84,
        76
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "maxSpendPerContest",
          "type": "u64"
        },
        {
          "name": "maxContestsPerWeek",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "programConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "allowedMint"
        },
        {
          "name": "treasury"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "agentConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "agentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agentConfig",
      "discriminator": [
        253,
        238,
        178,
        11,
        45,
        187,
        48,
        224
      ]
    },
    {
      "name": "contest",
      "discriminator": [
        216,
        26,
        88,
        18,
        251,
        80,
        201,
        96
      ]
    },
    {
      "name": "entryReceipt",
      "discriminator": [
        2,
        205,
        191,
        242,
        12,
        71,
        135,
        29
      ]
    },
    {
      "name": "programConfig",
      "discriminator": [
        196,
        210,
        90,
        231,
        144,
        149,
        140,
        63
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "contestNotOpen",
      "msg": "Contest is not open"
    },
    {
      "code": 6001,
      "name": "deadlinePassed",
      "msg": "Contest deadline has passed"
    },
    {
      "code": 6002,
      "name": "contestFull",
      "msg": "Contest is full"
    },
    {
      "code": 6003,
      "name": "alreadyEntered",
      "msg": "User has already entered this contest"
    },
    {
      "code": 6004,
      "name": "invalidSettlement",
      "msg": "Settlement amounts do not equal total pool"
    },
    {
      "code": 6005,
      "name": "notAuthority",
      "msg": "Caller is not the contest authority"
    },
    {
      "code": 6006,
      "name": "contestNotLocked",
      "msg": "Contest must be Locked before settlement"
    },
    {
      "code": 6007,
      "name": "contestNotCancelled",
      "msg": "Contest is not cancelled"
    },
    {
      "code": 6008,
      "name": "refundAlreadyClaimed",
      "msg": "Refund has already been claimed"
    },
    {
      "code": 6009,
      "name": "invalidMint",
      "msg": "Invalid USDC mint address"
    },
    {
      "code": 6010,
      "name": "notAuthorizedAgent",
      "msg": "Signer is not the authorized agent keypair"
    },
    {
      "code": 6011,
      "name": "agentNotActive",
      "msg": "Agent is not active"
    },
    {
      "code": 6012,
      "name": "exceedsPerContestLimit",
      "msg": "Amount exceeds per-contest spending limit"
    },
    {
      "code": 6013,
      "name": "entryFeeMismatch",
      "msg": "Amount does not match contest entry fee"
    },
    {
      "code": 6014,
      "name": "weeklyLimitReached",
      "msg": "Weekly contest entry limit reached"
    },
    {
      "code": 6015,
      "name": "insufficientVaultBalance",
      "msg": "Insufficient vault balance"
    },
    {
      "code": 6016,
      "name": "notOwner",
      "msg": "Caller is not the account owner"
    },
    {
      "code": 6017,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "agentConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "docs": [
              "The user who owns this agent configuration"
            ],
            "type": "pubkey"
          },
          {
            "name": "agent",
            "docs": [
              "The platform's server-side agent keypair authorized to spend"
            ],
            "type": "pubkey"
          },
          {
            "name": "maxSpendPerContest",
            "docs": [
              "Maximum USDC lamports the agent can spend per single contest entry"
            ],
            "type": "u64"
          },
          {
            "name": "maxContestsPerWeek",
            "type": "u8"
          },
          {
            "name": "contestsThisWeek",
            "type": "u8"
          },
          {
            "name": "weekStart",
            "docs": [
              "Unix timestamp of the start of the current weekly window"
            ],
            "type": "i64"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "totalSpent",
            "type": "u64"
          },
          {
            "name": "isActive",
            "docs": [
              "False by default — user must explicitly activate after depositing"
            ],
            "type": "bool"
          },
          {
            "name": "vaultBump",
            "docs": [
              "Bump of the AgentVault PDA"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "Bump of this AgentConfig PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Backend admin wallet that can lock / settle / cancel"
            ],
            "type": "pubkey"
          },
          {
            "name": "contestId",
            "docs": [
              "UUID bytes from the PostgreSQL contests table"
            ],
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "usdcMint",
            "docs": [
              "USDC mint stored so entry/refund instructions can validate it"
            ],
            "type": "pubkey"
          },
          {
            "name": "entryFee",
            "docs": [
              "Fixed entry fee in USDC lamports (6 decimals)"
            ],
            "type": "u64"
          },
          {
            "name": "rakeBps",
            "docs": [
              "Rake in basis points (1000 = 10 %)"
            ],
            "type": "u16"
          },
          {
            "name": "maxEntries",
            "type": "u32"
          },
          {
            "name": "entryCount",
            "type": "u32"
          },
          {
            "name": "totalPool",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "contestStatus"
              }
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "vaultBump",
            "docs": [
              "Bump of the ContestVault PDA — stored for signing outbound transfers"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "Bump of this Contest PDA — stored for signing as vault authority"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contestStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "locked"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "entryReceipt",
      "docs": [
        "PDA proving a user entered a specific contest.",
        "Seeds: [\"entry\", contest_id, user_wallet]",
        "Existence of this PDA is the AlreadyEntered guard — init will fail if it exists."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "contestId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "amountPaid",
            "type": "u64"
          },
          {
            "name": "refundClaimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "programConfig",
      "docs": [
        "Singleton PDA (seeds: [\"config\"]) — admin-controlled global settings.",
        "Stores the accepted payment mint so it can be changed without redeploying."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The admin wallet that can update config"
            ],
            "type": "pubkey"
          },
          {
            "name": "allowedMint",
            "docs": [
              "The currently accepted payment mint (USDC devnet, mainnet, USDT, USDG, etc.)"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Platform treasury USDC token account — receives rake from settled contests.",
              "Stored here so settle_contest can validate the treasury matches the config."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "winnerPayout",
      "docs": [
        "Passed as instruction data to settle_contest"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenAccount",
            "docs": [
              "The winner's USDC token account pubkey"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount to transfer in USDC lamports"
            ],
            "type": "u64"
          }
        ]
      }
    }
  ]
};

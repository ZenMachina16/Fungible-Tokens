// IDL factory matching src/token/token.did
// This is used to create the actor without relying on dfx-generated declarations
// (dfx generate will also work if you prefer that flow.)
import type { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

export const idlFactory = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) =>
  IDL.Service({
    token_metadata: IDL.Func([], [IDL.Record({ name: IDL.Text, symbol: IDL.Text })], ['query']),
    total_supply: IDL.Func([], [IDL.Nat], ['query']),
    balance_of: IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    my_balance: IDL.Func([], [IDL.Nat], ['query']),
    get_admin: IDL.Func([], [IDL.Principal], ['query']),
    whoami: IDL.Func([], [IDL.Principal], ['query']),
    holders: IDL.Func([], [IDL.Vec(IDL.Record({ owner: IDL.Principal, balance: IDL.Nat }))], ['query']),
    transfer: IDL.Func(
      [IDL.Principal, IDL.Nat],
      [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })],
      []
    ),
    mint: IDL.Func(
      [IDL.Principal, IDL.Nat],
      [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })],
      []
    ),
    set_admin: IDL.Func(
      [IDL.Principal],
      [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })],
      []
    ),
  });

export const init = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) => [
  IDL.Record({ name: IDL.Text, symbol: IDL.Text, initial_supply: IDL.Nat }),
];

export type TransferResult = { Ok: null } | { Err: string };
export type MintResult = { Ok: null } | { Err: string };



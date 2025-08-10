use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{api::caller, storage};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(Clone, CandidType, Deserialize)]
struct TokenMetadata {
    name: String,
    symbol: String,
}

#[derive(CandidType, Deserialize)]
struct InitArgs {
    name: String,
    symbol: String,
    initial_supply: u128,
}

#[derive(Clone, CandidType, Deserialize)]
struct State {
    name: String,
    symbol: String,
    total_supply: u128,
    balances: HashMap<Principal, u128>,
    admin: Principal,
}

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::new(None);
}

fn with_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| {
        let state_ref = cell
            .borrow()
            .as_ref()
            .expect("State not initialized. Call init first.");
        f(state_ref)
    })
}

fn with_state_mut<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| {
        let state_ref = cell
            .borrow_mut()
            .as_mut()
            .expect("State not initialized. Call init first.");
        f(state_ref)
    })
}

#[init]
fn init(args: InitArgs) {
    let creator = caller();
    let mut balances = HashMap::new();
    if args.initial_supply > 0 {
        balances.insert(creator, args.initial_supply);
    }
    let state = State {
        name: args.name,
        symbol: args.symbol,
        total_supply: args.initial_supply,
        balances,
        admin: creator,
    };
    STATE.with(|cell| {
        *cell.borrow_mut() = Some(state);
    });
}

#[query]
fn token_metadata() -> TokenMetadata {
    with_state(|s| TokenMetadata {
        name: s.name.clone(),
        symbol: s.symbol.clone(),
    })
}

#[query]
fn total_supply() -> u128 {
    with_state(|s| s.total_supply)
}

#[query]
fn balance_of(user: Principal) -> u128 {
    with_state(|s| *s.balances.get(&user).unwrap_or(&0))
}

#[query]
fn my_balance() -> u128 {
    let me = caller();
    balance_of(me)
}

#[query]
fn get_admin() -> Principal {
    with_state(|s| s.admin)
}

#[query]
fn whoami() -> Principal {
    caller()
}

#[update]
fn transfer(to: Principal, amount: u128) -> Result<(), String> {
    if amount == 0 {
        return Ok(());
    }
    let from = caller();
    with_state_mut(|s| {
        let from_balance = s.balances.get(&from).cloned().unwrap_or(0);
        if from_balance < amount {
            return Err("Not enough tokens".to_string());
        }
        s.balances.insert(from, from_balance - amount);

        let to_balance = s.balances.get(&to).cloned().unwrap_or(0);
        s.balances.insert(to, to_balance + amount);
        Ok(())
    })
}

#[update]
fn mint(to: Principal, amount: u128) -> Result<(), String> {
    if amount == 0 {
        return Ok(());
    }
    let caller_principal = caller();
    with_state_mut(|s| {
        if caller_principal != s.admin {
            return Err("Only the creator (admin) can mint tokens".to_string());
        }
        let current = s.balances.get(&to).cloned().unwrap_or(0);
        s.balances.insert(to, current + amount);
        s.total_supply = s.total_supply.saturating_add(amount);
        Ok(())
    })
}

#[update]
fn set_admin(new_admin: Principal) -> Result<(), String> {
    let caller_principal = caller();
    with_state_mut(|s| {
        if caller_principal != s.admin {
            return Err("Only admin can set admin".to_string());
        }
        s.admin = new_admin;
        Ok(())
    })
}

#[derive(CandidType, Deserialize, Clone)]
struct HolderEntry {
    owner: Principal,
    balance: u128,
}

#[query]
fn holders() -> Vec<HolderEntry> {
    with_state(|s| {
        s.balances
            .iter()
            .filter_map(|(p, b)| {
                if *b > 0 {
                    Some(HolderEntry { owner: *p, balance: *b })
                } else {
                    None
                }
            })
            .collect()
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    let state: State = with_state(|s| s.clone());
    storage::stable_save((state,)).expect("failed to save stable state");
}

#[post_upgrade]
fn post_upgrade() {
    let (state,): (State,) = storage::stable_restore().expect("failed to restore state");
    STATE.with(|cell| {
        *cell.borrow_mut() = Some(state);
    });
}

ic_cdk::export_candid!();



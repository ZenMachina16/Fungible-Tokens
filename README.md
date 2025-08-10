## ICP Fungible Token (Rust) with React UI

This repo contains:

- Rust canister `token` implementing a simple fungible token with metadata, balances, transfers, and admin-only minting.
- React (Vite) frontend `frontend` that connects via Internet Identity, shows balances, total supply, and provides Transfer/Mint forms.

### Features

- Total supply tracking and per-user balances
- Transfer between principals with balance checks
- Admin-only mint that increases total supply
- Token metadata: name and symbol
- Stable upgrades (pre/post upgrade state save/restore)

### Prerequisites (Ubuntu)

- Install DFX CLI: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
- Ensure Rust toolchain is present. If not: `curl https://sh.rustup.rs -sSf | sh` then `rustup target add wasm32-unknown-unknown`
- Node.js 18+ and npm: `sudo apt-get install -y nodejs npm` (or use nvm)

### Local Development - One-time setup

```bash
cd "BSB Mini Task 3"
dfx start --clean --background
```

### Deploy the token canister

Choose your token name/symbol/initial supply and deploy:

```bash
dfx deploy token --argument '(record { name = "EduCoin"; symbol = "EDU"; initial_supply = 1_000_000:nat })'
```

The deploying principal is the admin. You can later change admin with `set_admin` if needed.

### Build and deploy the frontend

```bash
dfx deploy frontend
```

This runs a build that writes `frontend/.env` with `VITE_TOKEN_CANISTER_ID` and `VITE_IC_HOST`. The `frontend` canister will serve the built app.

Get the frontend canister ID and open:

```bash
FRONTEND_ID=$(dfx canister id frontend)
echo "Open http://$FRONTEND_ID.localhost:4943"
```

### Using the UI

- Click “Log in with Internet Identity”.
- You’ll see:
  - Token name and symbol
  - Total supply
  - Your balance
- Transfer:
  - Enter recipient principal ID and amount, click Send.
- Mint (admin only):
  - Enter recipient principal and amount, click Mint Tokens.

### Optional: Run the React dev server

```bash
cd frontend
npm install
echo "VITE_IC_HOST=http://127.0.0.1:4943" > .env
echo "VITE_TOKEN_CANISTER_ID=$(dfx canister id token)" >> .env
npm run dev
```

Open the printed localhost URL.

### Canister API (Candid)

- `token_metadata() -> record { name: text; symbol: text }` query
- `total_supply() -> nat` query
- `balance_of(principal) -> nat` query
- `my_balance() -> nat` query
- `get_admin() -> principal` query
- `whoami() -> principal` query
- `transfer(principal, nat) -> variant { Ok; Err: text }`
- `mint(principal, nat) -> variant { Ok; Err: text }` (admin only)
- `set_admin(principal) -> variant { Ok; Err: text }` (admin only)

### Troubleshooting

- If agent complains about root key locally, ensure `VITE_IC_HOST=http://127.0.0.1:4943` and that `dfx start` is running.
- If the frontend cannot find canister ID, redeploy token first, then redeploy frontend.




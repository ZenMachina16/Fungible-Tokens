import React, { useEffect, useMemo, useState } from 'react';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { getActor, getAuthClient } from './ic/agent';

type TokenMetadata = { name: string; symbol: string };

function formatNat(n: bigint | number): string {
  try {
    const big = typeof n === 'bigint' ? n : BigInt(n);
    return big.toString();
  } catch {
    return String(n);
  }
}

export default function App() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [principalText, setPrincipalText] = useState<string>('');
  const [actor, setActor] = useState<any>(null);

  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [myBalance, setMyBalance] = useState<string>('0');
  const [admin, setAdmin] = useState<string>('');
  const [holders, setHolders] = useState<Array<{ owner: string; balance: string }>>([]);

  const isAdmin = useMemo(() => admin && principalText && admin === principalText, [admin, principalText]);

  // Forms state
  const [lookupPrincipal, setLookupPrincipal] = useState<string>('');
  const [lookupBalance, setLookupBalance] = useState<string>('');

  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferMsg, setTransferMsg] = useState<string>('');

  const [mintTo, setMintTo] = useState<string>('');
  const [mintAmount, setMintAmount] = useState<string>('');
  const [mintMsg, setMintMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      const client = await getAuthClient();
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        const id = client.getIdentity();
        setIdentity(id);
        setPrincipalText(id.getPrincipal().toText());
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const a = await getActor(identity ?? undefined);
        setActor(a);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [identity]);

  useEffect(() => {
    if (!actor) return;
    (async () => {
      try {
        const md: TokenMetadata = await actor.token_metadata();
        setMetadata(md);
        const ts = await actor.total_supply();
        setTotalSupply(formatNat(ts));
        const mb = await actor.my_balance();
        setMyBalance(formatNat(mb));
        const adm = await actor.get_admin();
        setAdmin(adm.toText());
        const hs = await actor.holders();
        setHolders(hs.map((h: any) => ({ owner: h.owner.toText(), balance: formatNat(h.balance) })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [actor]);

  async function login() {
    if (!authClient) return;
    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      onSuccess: async () => {
        const id = authClient.getIdentity();
        setIdentity(id);
        setPrincipalText(id.getPrincipal().toText());
      },
    });
  }

  async function logout() {
    if (!authClient) return;
    await authClient.logout();
    setIdentity(null);
    setPrincipalText('');
  }

  async function handleLookupBalance() {
    setLookupBalance('');
    if (!actor || !lookupPrincipal) return;
    try {
      const p = Principal.fromText(lookupPrincipal);
      const b = await actor.balance_of(p);
      setLookupBalance(formatNat(b));
    } catch (e: any) {
      setLookupBalance('Invalid principal or error.');
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setTransferMsg('');
    if (!actor || !transferTo || !transferAmount) return;
    try {
      const to = Principal.fromText(transferTo);
      const amount = BigInt(transferAmount);
      const res = await actor.transfer(to, amount);
      if ('Ok' in res) {
        setTransferMsg('✅ Transfer successful!');
        // refresh balances
        const mb = await actor.my_balance();
        setMyBalance(formatNat(mb));
        const ts = await actor.total_supply();
        setTotalSupply(formatNat(ts));
        const hs = await actor.holders();
        setHolders(hs.map((h: any) => ({ owner: h.owner.toText(), balance: formatNat(h.balance) })));
      } else {
        setTransferMsg(`❌ ${res.Err}`);
      }
    } catch (e: any) {
      setTransferMsg('❌ Error during transfer.');
    }
  }

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    setMintMsg('');
    if (!actor || !mintTo || !mintAmount) return;
    try {
      const to = Principal.fromText(mintTo);
      const amount = BigInt(mintAmount);
      const res = await actor.mint(to, amount);
      if ('Ok' in res) {
        setMintMsg(`✅ Minted ${amount} tokens to ${to.toText()}`);
        const ts = await actor.total_supply();
        setTotalSupply(formatNat(ts));
        const mb = await actor.my_balance();
        setMyBalance(formatNat(mb));
        const hs = await actor.holders();
        setHolders(hs.map((h: any) => ({ owner: h.owner.toText(), balance: formatNat(h.balance) })));
      } else {
        setMintMsg(`❌ ${res.Err}`);
      }
    } catch (e: any) {
      setMintMsg('❌ Error during mint.');
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, fontFamily: 'Inter, system-ui, Arial' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{metadata ? `${metadata.name} (${metadata.symbol})` : 'Loading token...'}</h2>
          <div style={{ color: '#666' }}>Total Supply: {totalSupply}</div>
        </div>
        <div>
          {principalText ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>Logged in as</div>
              <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{principalText}</div>
              <button onClick={logout} style={{ marginTop: 8 }}>Log out</button>
            </div>
          ) : (
            <button onClick={login}>Log in with Internet Identity</button>
          )}
        </div>
      </header>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Your Balance</h3>
        <div style={{ fontSize: 24 }}>{myBalance}</div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Check Balance</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Enter user Principal ID"
            value={lookupPrincipal}
            onChange={(e) => setLookupPrincipal(e.target.value)}
          />
          <button onClick={handleLookupBalance}>Check</button>
        </div>
        {lookupBalance && (
          <div style={{ marginTop: 8 }}>Balance: {lookupBalance}</div>
        )}
      </section>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Transfer Tokens</h3>
        <form onSubmit={handleTransfer} style={{ display: 'grid', gap: 8 }}>
          <input
            placeholder="Recipient Principal ID"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
          />
          <input
            placeholder="Amount"
            type="number"
            min="0"
            step="1"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
        {transferMsg && <div style={{ marginTop: 8 }}>{transferMsg}</div>}
      </section>

      {isAdmin && (
        <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          <h3>Mint Tokens (Admin only)</h3>
          <form onSubmit={handleMint} style={{ display: 'grid', gap: 8 }}>
            <input
              placeholder="Recipient Principal ID"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
            />
            <input
              placeholder="Amount"
              type="number"
              min="0"
              step="1"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
            />
            <button type="submit">Mint Tokens</button>
          </form>
          {mintMsg && <div style={{ marginTop: 8 }}>{mintMsg}</div>}
        </section>
      )}

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Creator</h3>
        <div style={{ fontSize: 12, color: '#666' }}>Admin Principal:</div>
        <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{admin || '...'}</div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Holders Explorer</h3>
        {holders.length === 0 ? (
          <div>No holders yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {holders.map((h) => (
              <div key={h.owner} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{h.owner}</div>
                <div>{h.balance}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from './token_idl';

const host = import.meta.env.VITE_IC_HOST || 'http://127.0.0.1:4943';
const tokenCanisterId: string | undefined = import.meta.env.VITE_TOKEN_CANISTER_ID;

export async function getAuthClient(): Promise<AuthClient> {
  return await AuthClient.create();
}

export async function getActor(identity?: any) {
  if (!tokenCanisterId) {
    throw new Error('VITE_TOKEN_CANISTER_ID is not set');
  }
  const agent = new HttpAgent({ host, identity });
  if (host.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  return Actor.createActor(idlFactory as any, {
    agent,
    canisterId: tokenCanisterId,
  }) as any;
}



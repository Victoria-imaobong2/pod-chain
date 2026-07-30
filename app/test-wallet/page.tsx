"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function TestWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div style={{ padding: 40 }}>
      <h2>Wallet Test</h2>

      <p>Connected: {String(isConnected)}</p>
      <p>Address: {address ?? "None"}</p>

      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          style={{ display: "block", margin: "10px 0" }}
        >
          Connect {connector.name}
        </button>
      ))}

      <button onClick={() => disconnect()}>
        Disconnect
      </button>

      {isPending && <p>Connecting...</p>}
    </div>
  );
}
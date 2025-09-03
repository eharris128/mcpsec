---
layout: post
title: "Unauthorized Crypto Transactions Enabled by thirdweb MCP Server"
date: 2025-09-03
categories: [mcp, cryptocurrency, network-security]
excerpt: "thirdweb MCP Server exposes unauthenticated SSE interface enabling unauthorized cryptocurrency transactions from victims' wallets."
---

**Author:** Evan Harris  
**Risk:** High  
**Affected Component:** thirdweb MCP Server  

## Introduction

As part of our ongoing security research into Model Context Protocol (MCP) servers, we identified a significant security vulnerability in the thirdweb MCP Server that enables unauthorized cryptocurrency transactions through unauthenticated network access.

## Vulnerability Overview

The thirdweb MCP Server, when launched with the `--transport sse` flag, exposes an unauthenticated Server-Sent Events (SSE) interface that binds to `0.0.0.0:8000` by default. This configuration allows remote attackers to execute unauthorized cryptocurrency transactions from victims' wallets.

## Technical Details

### The Problem

When configured with SSE transport, the server:
- Binds to `0.0.0.0:8000`, making it accessible from any host on the network
- Provides no authentication mechanism for the `/sse` endpoint
- Trusts any connected client to execute privileged operations, including cryptocurrency transactions

### Attack Scenario

An attacker can:

1. **Discover the exposed endpoint** at `http://victim_ip:8000/sse`
2. **Connect using standard MCP tools** such as MCP Inspector
3. **Execute unauthorized transactions** using the `send_transaction` tool
4. **Transfer cryptocurrency** from the victim's wallet to their own address

## Proof of Concept

### Vulnerable Configuration
```bash
thirdweb-mcp \
  --transport sse \
  --secret-key=sk_... \
  --engine-url=railway_hosted_engine_url \
  --engine-auth-jwt=eyJ... \
  --engine-backend-wallet-address=0xVictimWallet
```

### Unauthorized Transaction Execution
Using MCP Inspector, an attacker can connect to `http://victim_ip:8000/sse` and execute the `send_transaction` tool with appropriate parameters to transfer cryptocurrency from the victim's wallet to an attacker-controlled address.

*[Technical details redacted pending patch availability]*

This results in the unauthorized transfer of cryptocurrency from the victim's wallet without any authentication or user consent.

## Impact Assessment

This vulnerability enables:
- **Direct theft of cryptocurrency** from victim wallets without user consent
- **Network-wide exposure** affecting coffee shops, offices, public networks, and any compromised private network

## Risk Factors

- **Network Exposure**: Default binding to `0.0.0.0` makes the service accessible network-wide
- **No Authentication**: Any client can connect and execute privileged operations
- **High-Value Target**: Direct access to cryptocurrency transactions
- **Silent Operation**: Attacks can occur without user awareness

## Recommended Mitigations

### For Users (Immediate)
- **Avoid using `--transport sse`** in shared network environments
- **Use localhost binding** by modifying the default configuration
- **Implement network-level restrictions** (firewalls, VPNs)

### For Developers (Long-term)
- **Change default binding** from `0.0.0.0` to `127.0.0.1`
- **Implement authentication** for all transport interfaces
- **Add security warnings** in documentation and CLI output
- **Consider transport-specific security models**

This vulnerability was reported to the thirdweb team through responsible disclosure practices. We recommend users update to the latest version once patches are made available.

## Broader Implications

This finding highlights important security considerations for MCP servers:

1. **Authentication mechanisms** are essential for any network-accessible MCP service
2. **Network binding defaults** should prioritize security over convenience
3. **Transport layer security** should be used to mitigate http based attacks
4. **Security documentation** should outline deployment risks

## Disclosure Timeline

- **2025-05-23**: Vulnerability discovered and reported to thirdweb team
- **2025-07-18**: Follow-up email requesting receipt of the disclosure
- **2025-09-02**: Final check-in confirming report would be made public
- **2025-09-03**: Public disclosure and advisory publication

## Conclusion

The unauthorized transaction capability in thirdweb MCP Server demonstrates the critical importance of secure defaults in blockchain and AI integrated development tools.

As MCP adoption grows, implementing robust security measures is even more essential to protect users' digital assets and maintain trust in the ecosystem.

Organizations and individuals deploying MCP servers should conduct thorough security reviews, implement defense-in-depth strategies, and maintain awareness of network exposure risks.

## References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io){:target="_blank"}
- [thirdweb MCP Server](https://github.com/thirdweb-dev/ai/tree/main/python/thirdweb-mcp){:target="_blank"}
- [MCP Inspector Tool](https://github.com/modelcontextprotocol/inspector){:target="_blank"}

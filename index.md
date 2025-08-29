---
layout: home
---

# MCPSec Research

Security research focused on Model Context Protocol (MCP) implementations and AI-assisted development tools.

## Recent Advisories

{% for advisory in site.advisories reversed %}
- [{{ advisory.title }}]({{ advisory.url }}) - {{ advisory.date | date: "%B %Y" }}
{% endfor %}

## Email Updates

<!-- Buttondown signup form -->
<form
  action="https://buttondown.email/api/emails/embed-subscribe/MCPSec"
  method="post"
  target="popupwindow"
  onsubmit="window.open('https://buttondown.email/MCPSec', 'popupwindow')"
  class="embeddable-buttondown-form"
>
  <label for="bd-email">Get security research updates:</label>
  <input type="email" name="email" id="bd-email" placeholder="your@email.com" />
  <input type="submit" value="Subscribe" />
</form>
---
layout: home
---

Security Research on AI, Agents, and MCP Servers.

## Recent Advisories

{% for advisory in site.advisories reversed %}
- [{{ advisory.title }}]({{ advisory.url }}) - {{ advisory.date | date: "%B %Y" }}
{% endfor %}

## Security Newletter

<!-- Buttondown newsletter signup form -->
<form
  action="https://buttondown.email/api/emails/embed-subscribe/mcpsecurityresearch"
  method="post"
  target="popupwindow"
  onsubmit="window.open('https://buttondown.email/mcpsecurityresearch', 'popupwindow')"
  class="embeddable-buttondown-form"
  aria-label="Newsletter subscription form"
>
  <label for="bd-email">Stay ahead of AI Security threats:</label>
  <input 
    type="email" 
    name="email" 
    id="bd-email" 
    placeholder="your@email.com" 
    required 
    aria-describedby="email-help"
  />
  <div id="email-help" class="visually-hidden">Enter your email address to subscribe to security research updates</div>
  <input type="submit" value="Subscribe" />
</form>
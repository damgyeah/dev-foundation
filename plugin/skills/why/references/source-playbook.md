# Evidence sources

The why skill spawns one investigator per evidence category this session can reach. Source control has a playbook. For every other category, give the investigator the generic investigator prompt and tell it which MCP server it owns. It adapts the searches to that server's tools.

| Category | Playbook | Typical sources |
|---|---|---|
| Source control | [code-archaeology.md](sources/code-archaeology.md) | git, `gh`, GitHub pull requests, reviews, issues, discussions |
| Issue tracker | none | GitHub issues (covered by source control), Azure Boards, Jira, Linear |
| Long-form documents | none | wikis, design docs, SharePoint, Confluence, Notion |
| Team chat | none | Teams, Slack, Discord |
| Infrastructure observability | none | Azure Monitor, Application Insights, Datadog, Grafana |
| Error tracking | none | Application Insights exceptions, Sentry |
| Product analytics | none | Kusto, Databricks, Snowflake, BigQuery |

When the target looks defensive (null checks, retries, timeouts, rate limits, feature flags, egress guards, out-of-memory handlers), every investigator also searches its source for incidents and postmortems around the dates the code was added.

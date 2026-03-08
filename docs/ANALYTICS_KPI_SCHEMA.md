# Analytics KPI Schema

## Core KPI Map

| KPI | Event(s) | Primary Fields |
| --- | --- | --- |
| DAU proxy | `session_start` | `playerId`, `timestamp` |
| Sessions per player | `session_start` | `playerId`, `sessionId` |
| Avg session duration | `session_end` | `durationMs` |
| Active session trend | `session_heartbeat` | `durationMs`, `levelIndex` |
| Acquisition source quality | `acquisition_attributed`, `session_end`, `level_complete` | `source`, `medium`, `campaign`, `durationMs`, `levelIndex` |
| Level funnel | `level_start`, `level_complete` | `levelIndex`, `difficulty` |
| Restart/friction rate | `level_fail_or_restart` | `levelIndex`, `reason` |
| Ad mode distribution | `ad_mode_resolved` | `mode`, `source` |
| Rating distribution | `rating_submitted` | `rating`, `source`, `levelIndex` |
| Feedback volume | `feedback_submitted` | `messageLength`, `tags`, `rating` |

## Event Field Contract

- `playerId`: anonymous stable local identifier.
- `sessionId`: rotating per launch/session identifier.
- `sessionIndex`: lifetime local session count.
- `acquisition.source`: `utm_source` or `none`.
- `acquisition.medium`: `utm_medium` or `none`.
- `acquisition.campaign`: `utm_campaign` or `none`.
- `acquisition.content`: `utm_content` or `none`.
- `acquisition.referrer`: document referrer or `direct`.

## Privacy Rules

- No email, username, or explicit IP in client payloads.
- Feedback text limited to 500 chars and sanitized.
- Consent toggle controls whether ingestion send is active.

## Segments

- New vs returning: `sessionIndex === 1` or `> 1`.
- Paid/ad-free vs ads: `ad_mode_resolved.mode`.
- Source cohorts: `acquisition.source + acquisition.campaign`.

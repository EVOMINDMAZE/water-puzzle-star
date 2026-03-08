# Analytics Dashboard Queries

## Top acquisition sources by unique players

```sql
SELECT
  json_extract(acquisition_json, '$.source') AS source,
  COUNT(DISTINCT player_id) AS players
FROM analytics_events
WHERE event_type = 'session_start'
GROUP BY source
ORDER BY players DESC
LIMIT 20;
```

## Average playtime by campaign

```sql
SELECT
  json_extract(acquisition_json, '$.campaign') AS campaign,
  ROUND(AVG(CAST(json_extract(payload_json, '$.durationMs') AS REAL)) / 1000.0, 2) AS avg_seconds
FROM analytics_events
WHERE event_type = 'session_end'
GROUP BY campaign
ORDER BY avg_seconds DESC;
```

## Level funnel conversion

```sql
WITH starts AS (
  SELECT CAST(json_extract(payload_json, '$.levelIndex') AS INTEGER) AS level_index, COUNT(*) AS starts
  FROM analytics_events
  WHERE event_type = 'level_start'
  GROUP BY level_index
),
completes AS (
  SELECT CAST(json_extract(payload_json, '$.levelIndex') AS INTEGER) AS level_index, COUNT(*) AS completes
  FROM analytics_events
  WHERE event_type = 'level_complete'
  GROUP BY level_index
)
SELECT
  s.level_index,
  s.starts,
  COALESCE(c.completes, 0) AS completes,
  ROUND(COALESCE(c.completes, 0) * 100.0 / NULLIF(s.starts, 0), 2) AS completion_rate_pct
FROM starts s
LEFT JOIN completes c ON c.level_index = s.level_index
ORDER BY s.level_index;
```

## Restart pressure by level

```sql
SELECT
  CAST(json_extract(payload_json, '$.levelIndex') AS INTEGER) AS level_index,
  COUNT(*) AS restarts
FROM analytics_events
WHERE event_type = 'level_fail_or_restart'
GROUP BY level_index
ORDER BY restarts DESC
LIMIT 20;
```

## Rating trend by day

```sql
SELECT
  date(event_timestamp_ms / 1000, 'unixepoch') AS day,
  ROUND(AVG(CAST(json_extract(payload_json, '$.rating') AS REAL)), 2) AS avg_rating,
  COUNT(*) AS rating_count
FROM analytics_events
WHERE event_type = 'rating_submitted'
GROUP BY day
ORDER BY day DESC;
```

## Feedback volume and top tags

```sql
SELECT
  json_extract(payload_json, '$.tags') AS tags,
  COUNT(*) AS feedback_count
FROM analytics_events
WHERE event_type = 'feedback_submitted'
GROUP BY tags
ORDER BY feedback_count DESC
LIMIT 30;
```

## Weekly operator checklist

1. Inspect top acquisition sources and compare avg session duration.
2. Check top restart levels and completion drop-offs.
3. Review rating trend and top feedback tags.
4. Capture one gameplay change hypothesis.
5. Deploy change and compare next-week metrics.

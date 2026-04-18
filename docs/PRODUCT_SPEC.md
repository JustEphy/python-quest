# Product Spec: Python Quest MVP

## Goal
Ship a local-first MVP for gamified Python learning with secure code execution.

## Core User Journey
1. User signs up/logs in.
2. User reads ordered lessons.
3. User opens coding challenge starter code.
4. User runs code and reviews stdout/stderr.
5. User submits challenge to receive pass/fail.
6. User gains XP and levels up.
7. User streak updates daily.
8. User pet grows with activity.
9. Dashboard summarizes progression.

## MVP Scope
- Supabase auth + Postgres + RLS
- Lesson/challenge read flow
- Python runner service via Docker-in-Docker execution
- Progress, submissions, XP events, streak, pet model

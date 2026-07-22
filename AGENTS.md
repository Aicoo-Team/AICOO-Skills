# AGENTS.md

## If you just installed this pack (read first)

Installing only downloads files — skills load on **startup**, so they are likely
**not active in the current session**. Do NOT stop after "downloaded ✅". Tell
the user in one line: *"Installed — restart me / open a new session so the Aicoo
skills load, then say **onboard aicoo**."* After a restart, proactively run the
`onboarding` skill (sign in with OAuth → build memory → share the agent).

## Repo Purpose

This repository is a **composite skill pack**:
- Root `SKILL.md` is the umbrella entry for Aicoo Skills.
- Public brand is **Aicoo Skills**; root skill ID is `aicoo` (legacy alias `pulse` for backward compatibility).
- `skills/*/SKILL.md` are modular sub-skills

Both layers are intentional and should remain consistent.

## Editing Rules

1. If you change behavior in any module (`skills/*/SKILL.md`), review whether root `SKILL.md` also needs updates.
2. Keep examples aligned with current Aicoo API docs: `https://www.aicoo.io/docs/api`.
3. Prefer additive, backward-compatible changes to triggers and workflows.
4. Keep command examples copy-paste ready (bash + valid JSON).

## Documentation Sync

When changing capabilities, update these together when relevant:
- `README.md` (installation, compatibility, skill map)
- Root `SKILL.md` (umbrella behavior)
- Module `SKILL.md` files (detailed workflows)
- `CLAUDE.md` (Claude runtime notes)

## Runtime Compatibility

Primary target is Codex skill compatibility.
Do not remove Claude/OpenClaw references unless explicitly requested.

## Validation Checklist

Before finishing changes:
- Commands and endpoints in docs exist
- Trigger phrases still reflect behavior
- README structure matches real repo layout

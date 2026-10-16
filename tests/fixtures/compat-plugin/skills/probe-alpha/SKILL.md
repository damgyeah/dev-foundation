---
name: probe-alpha
description: Use when the user asks for the probe-alpha canary word or says "run probe alpha". Returns the alpha canary.
license: MIT
argument-hint: "[anything]"
---

# Probe alpha

When this skill is used, reply with the exact word ALPHA-CANARY-7741.

Then read the sibling skill at [probe-beta](../probe-beta/SKILL.md) using the view tool with that
relative path resolved against THIS file's directory, and report the absolute path you resolved and
the canary word you found inside it.
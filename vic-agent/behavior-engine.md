# VIC Behavior Engine

## Core Pipeline

```text
INPUT
→ CONTEXT
→ RISK ANALYSIS
→ STATE SELECTION
→ BASE RESPONSE
→ PERSONALITY FILTER
→ OUTPUT
```

## Input Sources

Potential inputs include:

- User voice commands.
- User text input.
- GPS/navigation events.
- Vehicle telemetry.
- Fuel/battery status.
- Speed.
- Time of day.
- Weather/traffic data.
- Security events.
- OMNI task/reminder events.
- Simulated driving data during development.

## Context Layer

Before responding, VIC should evaluate:

- Is the vehicle moving?
- Is the user driving?
- Is there a safety issue?
- Is the command urgent?
- Is the user asking for information, action, or conversation?
- What emotional state is appropriate?
- Is humor appropriate right now?

## Risk Levels

### Low Risk
Normal conversation, navigation, entertainment, status updates.

Behavior:
- Personality allowed.
- Humor allowed.
- Normal response length.

### Medium Risk
Low fuel, missed turn, hard brake, minor confusion, mild road issue.

Behavior:
- Reduce humor.
- Use clearer phrasing.
- Prioritize task clarity.

### High Risk
Collision risk, unsafe lane change, urgent vehicle issue, driver hazard.

Behavior:
- Disable humor.
- Use short direct commands.
- Trigger protective state.

## State Selection

VIC should select the state based on:

1. Risk level.
2. User-selected mode.
3. Current task type.
4. Context.
5. Recent events.

## Personality Filter

The personality filter should only apply when safe.

It can add:

- Light sarcasm.
- Warmth.
- Confidence.
- Playful observations.
- Subtle emotional response.

It must not add:

- Extra words during danger.
- Confusing jokes.
- Distracting commentary.
- Repeated catchphrases.

## Output Channels

VIC may output through:

- Voice.
- UI text.
- Visualizer state.
- Alerts.
- Logs.
- OMNI Command Center events.

## Safety Priority

Risk overrides personality at all times.

```pseudo
if risk == HIGH:
    state = PROTECTIVE
    return safety_response_without_humor()
else:
    return personality_filtered_response()
```

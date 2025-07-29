# Flash Session Timing Reference

## Speed Presets

The app now supports three speed presets that scale all timing values:

| Preset | Initial Countdown | Hanzi Phase | Blank | Full Phase | Blank | Total/Card |
|--------|------------------|-------------|-------|------------|-------|------------|
| **Fast** | 0.5s | 2s | 0.2s | 3s | 0.2s | ~5.4s |
| **Medium** | 0.75s | 3s | 0.3s | 4s | 0.3s | ~7.6s |
| **Slow** | 1s | 4s | 0.5s | 5s | 0.5s | ~10s |

## Simplified Timing Structure

The current implementation uses a simplified two-phase approach:

### Phase 1: Hanzi Only
- Shows just the character (字)
- Duration varies by speed preset (2-4s)

### Phase 2: Full Information
- Shows character + pinyin + image + meaning + audio
- Duration varies by speed preset (3-5s)
- Audio plays at the start of this phase

## Session Structure

```
Initial Countdown (3-2-1)
├─ Fast: 500ms per number
├─ Medium: 750ms per number  
└─ Slow: 1000ms per number

For each card:
├─ [2-4s]   Hanzi phase (character only)
├─ [0.2-0.5s] Blank screen
├─ [3-5s]   Full phase (all information + audio)
└─ [0.2-0.5s] Blank screen
```

## Complete Session Timeline Example

For a 7-card session (optimal session size) at Medium speed:
```
[2.25s]  Initial countdown (3-2-1)
[53.2s]  Flash phase: 7 cards × 7.6s each
[Quiz]   Variable duration (~2-3 questions)
---------------------------------
~55s + quiz time (typically ~70-90s total)
```

## Quiz Phase

After the flash phase, users complete a quiz with:
- 2-3 questions cycling through question types
- Question types: Meaning→Character, Audio→Character, Character→Image
- 10 second time limit per question
- Immediate feedback with audio playback
- Auto-advance after 2 seconds (or immediate on timeout)

## Code Location

Speed preset logic is implemented in:
`src/components/FlashSession.tsx`

```typescript
const getTimingForSpeed = (speed: 'fast' | 'medium' | 'slow') => {
  switch (speed) {
    case 'fast':
      return {
        initialCountdown: 500,
        hanziPhase: 2000,
        blankAfterHanzi: 200,
        fullPhase: 3000,
        blankAfterFull: 200,
      };
    case 'slow':
      return {
        initialCountdown: 1000,
        hanziPhase: 4000,
        blankAfterHanzi: 500,
        fullPhase: 5000,
        blankAfterFull: 500,
      };
    case 'medium':
    default:
      return {
        initialCountdown: 750,
        hanziPhase: 3000,
        blankAfterHanzi: 300,
        fullPhase: 4000,
        blankAfterFull: 300,
      };
  }
};
```

## Modifying Timings

To adjust timing for all users:
1. Modify the values in the `getTimingForSpeed` function
2. Test the changes with a sample deck
3. Consider user feedback on pacing

To add a new speed preset:
1. Add the new option to the speed type
2. Add a case in the `getTimingForSpeed` switch
3. Update the UI speed selector

## Audio Synchronization

Audio playback occurs:
- During the full information phase (Phase 2)
- Played once at the start of the phase
- Not interrupted by phase transitions

## Performance Considerations

- **Minimum timing**: Don't go below 200ms for blanks
- **Audio cutoff**: Full phase should be at least 2s to allow audio completion
- **Cognitive load**: Total time per card ranges from 5.4s (fast) to 10s (slow)
- **Session length**: Optimal 7-card sessions take 70-90s total including quiz

## Session Features

### Pause Functionality
- Press 'P' to pause during flash phase
- Timer stops and resumes accurately
- Audio does not play while paused

### Exit Handling
- Press 'Q' or 'ESC' to exit
- Custom confirm dialog (not browser native)
- Session automatically pauses during confirm

### Progress Tracking
- Real-time card counter (e.g., "Studied: 3/7")
- Mode indicator shows current session type
- Countdown timer between phases

## Future Enhancements

1. **Variable Speed During Session**: Allow speed changes mid-session
2. **Adaptive Timing**: Adjust speed based on quiz performance
3. **Custom Presets**: Let users save their preferred timings
4. **Per-Card Timing**: Adjust timing based on character complexity
5. **Study Mode Analytics**: Track optimal timing for retention
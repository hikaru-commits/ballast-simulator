# v0.7 validation notes

- `tsc --noEmit`: passed with no TypeScript errors.
- Initial WBT liquid surface is below the local sea surface, so opening a Sea Chest, V-GRAV and a tank FILL valve produces gravity filling with pumps stopped.
- Gravity filling flow decreases as the tank liquid surface rises and stops when the tank surface approaches the local external sea level.
- A tank whose liquid surface is above the local sea level can gravity-discharge through an open tank SUC path and Sea Chest with pumps stopped.
- Local sea level uses mean draft + trim contribution by tank LCG + heel contribution by TCG.
- Tank display now shows level height (m) and liquid-surface elevation above keel (EL m).
- Gravity filling does not require a running pump and does not create pump flow/current.
- V-GRAV open with a running ballast pump raises a caution alarm.

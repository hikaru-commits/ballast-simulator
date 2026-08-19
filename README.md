# Ballast Operation Simulator MVP v0.7

React + TypeScript + Vite ballast-operation training simulator.

## v0.7 additions

- Tank liquid level height in metres and liquid-surface elevation above keel (EL)
- Added tank physical height / bottom elevation data
- Gravity / pump-bypass crossover valve (`V-GRAV`) on the P&ID
- Pump-off gravity ballasting from Sea Chest to tank filling main
- Pump-off gravity deballasting from tank suction main to Sea Chest when tank head is higher than sea head
- Gravity-flow rate changes continuously with hydrostatic head and approaches zero near equilibrium
- Hydrostatic calculation uses current mean draft, fore/aft trim, heel, tank longitudinal/transverse position and tank liquid-surface height
- Dedicated Gravity Flow panel showing direction, flow rate and head difference
- Gravity flow animation direction is distinguished from water-present indication
- Alarm if the gravity bypass is left open while a ballast pump is running

## Training-model gravity logic

Gravity filling:

`Sea Chest -> Common Suction Header -> V-GRAV -> Common Discharge Header -> Fill Main -> Tank FILL valve`

Gravity discharge:

`Tank SUC valve -> Suction Main -> Common Suction Header -> Sea Chest`

The model uses a simplified hydraulic coefficient rather than a full Darcy-Weisbach network. The architecture keeps vessel hydrostatic and tank geometry constants isolated so actual vessel data can replace them later.

## Run

```powershell
npm install
npm run dev
```

## v0.8 — High / Low suction & Fore common valves
- Every ballast tank now has independent HIGH and LOW suction valves plus the filling valve.
- HIGH suction is treated as uncovered below 35% tank level; LOW suction remains usable down to about 2%.
- Opening HIGH suction below its pickup level raises a training alarm and does not provide a valid suction source.
- Opening HIGH and LOW simultaneously raises a caution.
- Fore Peak branches are isolated by dedicated FORE COMMON suction/filling valves, matching the forward common-valve concept in the supplied reference arrangement.
- Pumped and gravity deballast flow animation follows the suction actually available (HIGH or LOW), not a generic tank suction branch.

## v1.3 simplification
Each ballast tank now uses one reversible tank valve. Filling/suction direction is determined by the pump-room lineup rather than separate tank-side SUC/FILL or HIGH/LOW valves.

## v1.7 UI update
SHIP CONDITION now includes displacement and essential hydrostatic/stability values. Alarm and event log panels are embedded directly below the ship-attitude panel so critical information remains on the main simulation screen.

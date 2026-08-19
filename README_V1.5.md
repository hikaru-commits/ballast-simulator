# Ballast Simulator v1.5 — Pump Room P&ID Redesign

This version redraws the simulator to match the agreed simplified training P&ID.

- 4 PORT WBT + 4 STBD WBT, one reversible tank valve each.
- PORT and STBD ballast mains remain visually independent.
- HIGH SEA CHEST and LOW SEA CHEST each connect through one sea-chest valve directly to the COMMON SUCTION HEADER. No SEA HEADER.
- Three parallel ballast pumps.
- BP1 is VFD controlled (30–100% speed command); BP2/BP3 are fixed speed.
- Every pump has a suction isolation valve and a discharge isolation/control valve.
- One straight vertical bypass/crossover on each side, one valve per side (V-X-P / V-X-S).
- V-P-SUC / V-S-SUC are physically shown on the side-main branches into the common suction header.
- V-P-DIS / V-S-DIS are physically shown on the common-discharge-to-side-main branches.
- Overboard is an independent branch from the common discharge header.
- White junction dots mean a hydraulic connection. Visual crossings without a dot are not connected.
- Flow animation is only produced when an open Source → Sink route exists.

# v1.0 functional validation checklist

The code was syntax-parsed for all TS/TSX sources. Full Vite build was not possible in the generation environment because project npm dependencies were not installed there.

## Expected hydraulic route tests

1. **No route / pump deadhead**
   - Start BP1, open BP1 suction and discharge valves, leave all Main DIS selectors and overboards shut.
   - Expected: pump may rotate, actual flow = 0, DEADHEAD alarm, no dashed flow after pump discharge.

2. **Ballast via Main A**
   - Open Sea Chest P, BP1 suction, BP1 discharge, V-MA-DIS, required Main A section isolations, and a selected tank HIGH valve.
   - Expected: SEA → suction header → BP1 → discharge header → Main A → selected HIGH branch → tank.

3. **Deballast via Main B**
   - Open selected tank LOW valve, required Main B section isolations, V-MB-SUC, BP1 suction/discharge, and Overboard P.
   - Expected: tank → Main B → suction header → BP1 → discharge header → overboard.

4. **Fore Peak isolation**
   - Attempt FP operation with V-FP-A/V-FP-B shut.
   - Expected: no FP source/sink route even if FP tank valve is open.

5. **Section isolation**
   - Shut Main A aft isolation.
   - Expected: MID/FWD Main A tanks become unreachable from pump room, while AFT-zone tanks remain reachable.

6. **Conflicting routing**
   - Connect one main to both suction and discharge headers.
   - Expected: caution alarm. If source/sink categories conflict, actual pumped route is blocked or marked CONFLICT.

7. **Gravity filling**
   - Pumps stopped. Open a sea chest, V-GRAV, Main A/B DIS selector, required section isolation, and tank valve where external sea head exceeds tank liquid surface.
   - Expected: gravity fill rate varies with hydrostatic head and decreases as tank level rises.

8. **Gravity discharge**
   - Pumps stopped. Open a sea chest, V-GRAV, Main A/B SUC selector, required section isolation, and tank pickup where tank liquid surface exceeds local sea head.
   - Expected: tank → sea gravity flow.

9. **Ship condition coupling**
   - Change asymmetric port/starboard tank quantities.
   - Expected: heel changes.
   - Change fore/aft quantities.
   - Expected: draft F/A and trim change.
   - Create multiple slack tanks.
   - Expected: free-surface correction increases and effective GM decreases.

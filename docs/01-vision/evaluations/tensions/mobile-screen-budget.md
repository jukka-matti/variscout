# Mobile Screen Budget

> Filter chips, the variation bar, and four charts all compete for screen space on mobile.

## The Tension

VariScout's drill-down creates a growing UI state: each filter adds a chip, the variation bar updates, and the analyst needs to see both the filtering state and the chart content to make their next decision. On desktop, this is manageable --- chips sit above the charts with room to spare. On mobile, every pixel of filtering UI is a pixel taken from the charts that make filtering meaningful.

The current design handles this with responsive margins and collapsible sections, but there's an inherent tension between showing the analytical state (active filters, cumulative progress) and showing the analytical content (the charts themselves). A deep drill-down with 3--4 active filter chips, a variation bar, and the factor dropdown can consume a significant portion of the mobile viewport before the chart even appears.

This tension is compounded by VariScout's four-chart layout. On desktop, four linked charts provide simultaneous multi-lens analysis. On mobile, they stack vertically, requiring scrolling. The analyst can see one chart at a time while the filter state is either always visible (consuming space) or scrolled off-screen (losing context). Neither option fully serves the linked-filtering workflow that makes the drill-down powerful.

## Persona Impact

| Persona         | Impact | Why                                                                                                                                                            |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green Belt Gary | Medium | Gary primarily uses desktop at work but may check analyses on his phone. The degraded mobile experience is annoying but not deal-breaking.                     |
| Student Sara    | High   | Sara often uses her phone or a tablet. If the mobile experience is awkward, she may struggle to complete assignments or practice outside the classroom.        |
| OpEx Olivia     | Low    | Olivia's team uses the Azure App on desktop workstations. Mobile usage is not a primary deployment scenario for enterprise teams.                              |
| Trainer Tina    | Medium | Tina demos on projectors (desktop) but her students may follow along on phones or tablets. She needs the mobile experience to be functional for classroom use. |
| Evaluator Erik  | Low    | Erik evaluates on desktop. Mobile responsiveness is a checkbox item, not a critical evaluation factor.                                                         |
| Curious Carlos  | High   | Carlos first encounters VariScout on his phone via social media links. If the PWA demo doesn't work well on mobile, he bounces immediately.                    |

## Current Mitigation

- Responsive chart margins via `useResponsiveChartMargins` hook.
- Collapsible filter section on mobile.
- Mobile menu (`MobileMenu.tsx`) consolidates navigation.
- `useIsMobile` hook enables conditional rendering for screen-constrained layouts.

## Strategic Weight

**Medium** --- Mobile is important for student and social-discovery audiences (Sara, Carlos) but secondary for the primary paid product (Azure App on desktop). The current responsive design is functional but not optimized. Investment should be proportional to the mobile audience's contribution to conversion and retention.

## Related Patterns

- [Sidebar Filter Panel](../patterns/sidebar-filter-panel.md) --- Would make the screen budget problem worse on mobile by adding a persistent panel.
- [Small Multiples](../patterns/small-multiples.md) --- Grid layouts are inherently hostile to narrow screens.
- [Factor Map](../patterns/factor-map.md) --- A separate spatial view could decouple the filter state display from chart space, potentially improving mobile by opening filters in a dedicated screen.

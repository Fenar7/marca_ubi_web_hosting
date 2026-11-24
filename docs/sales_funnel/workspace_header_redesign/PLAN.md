# Workspace header redesign

The header should answer where the user is and give them fast access to workspace search. The sidebar already provides brand identity and primary navigation. Energy 1, Rhythm 2, Motion 1.

| Surface | Design |
| --- | --- |
| Overview and list pages | Show the current page as a single landmark label. Remove the repeated monogram, workspace label, and section links that duplicate the current route. |
| Record pages | Show real parent destinations and a stronger current label. Keep readable record references, and use a descriptive fallback when the reference is unavailable. Use a small chevron only between destinations. |
| Global controls | Keep one search control that opens the existing command palette. Remove the notification button because it opens search and has no unread state. |
| Mobile | Keep the navigation and search buttons 44px square. At narrow widths show the current label only, allowing it to truncate without pushing the controls off screen. |
| Styling | Use the existing Circular XX and code fonts, a paper-white surface, near-black type, a subtle lower border, and neutral 8px rounded controls. Use a visible focus ring and no animation. |

Verification covers route labels and aliases, readable record references, navigation and command palette wiring, mobile overflow, and keyboard focus. Production sign-in and workspace content are outside this change.

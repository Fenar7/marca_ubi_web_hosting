# Overview chart layout and data

The Overview spline used a fixed-height wrapper with its month buttons placed after a full-height SVG. The Cash Flow card stretched to match the neighboring column and centered a width-driven SVG inside the extra space. Both issues were visible on the Overview, where the chart wrappers are nested in grid and flex layouts.

## Design

- Set the spline plot and date controls in separate rows. Align the centers of the controls with the corresponding points and display the selected period and value in a bounded readout.
- Size Cash Flow to its contents and align the left and right columns at the top. Keep the dashboard period selector wired to the existing URL parameter and use it for the financial charts.
- Present Pipeline by service as a current snapshot. Remove the inactive period buttons, the default sample categories, and the invented Others value. Render deal counts for users without financial access.
- Use recorded period buckets for the earnings and Cash Flow plots. Distinguish unavailable data, a successful empty period, and a zero-valued period. Suppress restricted values in visual and accessible output.

## Verification

Check at narrow and wide widths that date controls fit inside the card, labels and amounts are readable, and a taller neighboring column leaves Cash Flow pacing intact. Verify the period selector with keyboard and pointer, coverage for signed or zero values, single and empty series, and financial permissions.

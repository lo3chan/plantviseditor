# Official Draw.io (diagrams.net) Complete Syntax & Specification Reference

Extracted directly from the official diagrams.net / JGraph specifications (drawio-mcp, mxfile.xsd, and style-reference.md).

---

Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/jgraph/drawio-mcp/main/shared/style-reference.md

---

# draw.io Style Reference for AI File Generation

This document is a companion to [`mxfile.xsd`](https://github.com/jgraph/drawio-mcp/blob/main/shared/mxfile.xsd) and provides all information
needed to programmatically generate valid draw.io (.drawio) files. All data
was extracted from the draw.io source code.

See also: [Generate and validate draw.io diagrams with AI](https://www.drawio.com/doc/faq/ai-drawio-generation)

---

## 1. File Structure Overview

A minimal valid draw.io file:

```xml
<mxfile>
  <diagram id="page-1" name="Page-1">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1"
                  page="1" pageScale="1" pageWidth="850" pageHeight="1100"
                  math="0" shadow="0">
      <root>
        <!-- Root container (always required, always id="0") -->
        <mxCell id="0" />
        <!-- Default layer (always required, always id="1", parent="0") -->
        <mxCell id="1" parent="0" />
        <!-- Diagram elements go here with parent="1" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Critical Rules

1. **The first two mxCell elements are mandatory structural cells:**
   - `id="0"` — root container, no parent attribute
   - `id="1"` with `parent="0"` — default layer
2. **All diagram elements must have `parent="1"`** (or the id of a group/layer).
3. **IDs must be unique** within the diagram. Use any string (e.g. "2", "node-1", "abc123").
4. **Vertices need `vertex="1"`**, edges need `edge="1"`** — these are mutually exclusive.
5. **Edges should reference source and target** via cell IDs. Edges without connections need explicit mxPoint sourcePoint/targetPoint.
6. **Always use uncompressed XML** (no `compressed="true"`). AI should not generate compressed content.
7. **Style strings end with semicolon.** Example: `"rounded=1;whiteSpace=wrap;html=1;"`
8. **Coordinates: origin (0,0) is top-left**, x increases rightward, y increases downward.

---

## 2. Style String Format

The `style` attribute on mxCell is a **semicolon-separated list of key=value pairs**:

```
key1=value1;key2=value2;key3=value3;
```

A **style class name** or **shape name** can appear as a bare token (without `=`):

```
ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;
```

Here `ellipse` sets the shape. Multiple bare tokens are possible for style class inheritance:

```
text;html=1;align=left;
```

### Rules
- Keys and values are **case-sensitive**
- **No spaces** around `=` or `;`
- Boolean values use `0` and `1` (not true/false)
- Colors use `#RRGGBB` hex format (with `#`), `none`, or `default`
- The trailing `;` is conventional but not strictly required
- Unknown keys are silently ignored

---

## 3. Shape Types

### 3.1 Core mxGraph Shapes

These shapes are defined in the mxGraph core library:

| shape= value | Description | Notes |
|---|---|---|
| `rectangle` | Rectangle (default) | Also the default if no shape specified |
| `ellipse` | Oval / ellipse | Use `aspect=fixed` for circle |
| `rhombus` | Diamond | Use `perimeter=rhombusPerimeter` |
| `triangle` | Triangle | Use `perimeter=trianglePerimeter` |
| `hexagon` | Hexagon | Use `perimeter=hexagonPerimeter2` |
| `cloud` | Cloud | |
| `cylinder` | 3D Cylinder | |
| `line` | Horizontal line | |
| `arrow` | Block arrow | |
| `arrowConnector` | Arrow-shaped connector | |
| `doubleEllipse` | Double-bordered ellipse | |
| `image` | Image container | Requires `image=<url>` |
| `label` | Rectangle with icon area | Default vertex shape |
| `swimlane` | Container with header bar | Use `startSize` for header height |
| `actor` | Actor (stick figure outline) | |
| `connector` | Edge connector | Default edge shape |

### 3.2 Extended Shapes (draw.io Shapes.js)

These are registered via `mxCellRenderer.registerShape()`:

| shape= value | Description |
|---|---|
| `cube` | 3D cube |
| `isoCube` | Isometric cube |
| `isoCube2` | Isometric cube (variant 2) |
| `isoRectangle` | Isometric rectangle |
| `cylinder2` | Cylinder (variant 2, configurable) |
| `cylinder3` | Cylinder (variant 3) |
| `datastore` | Cylindrical data store |
| `note` | Sticky note |
| `note2` | Note (variant 2) |
| `document` | Document page with curled bottom |
| `folder` | Folder icon |
| `card` | Card with cut corner |
| `tape` | Punched tape |
| `tapeData` | Tape data storage |
| `process` | Process box (double-sided borders) |
| `process2` | Same as process |
| `step` | Step/chevron arrow |
| `plus` | Plus sign |
| `ext` | Extended rectangle (supports `double=1`) |
| `callout` | Speech bubble |
| `parallelogram` | Parallelogram (use `perimeter=parallelogramPerimeter`) |
| `trapezoid` | Trapezoid (use `perimeter=trapezoidPerimeter`) |
| `curlyBracket` | Curly bracket |
| `switch` | Networking switch shape |
| `transparent` | Invisible shape |
| `message` | Envelope/message |
| `corner` | L-shaped corner |
| `crossbar` | Cross bar |
| `tee` | T-shaped connector |
| `singleArrow` | Single arrow |
| `doubleArrow` | Double-headed arrow |
| `flexArrow` | Flexible arrow |
| `wire` | Wire connector |
| `waypoint` | Waypoint marker |
| `manualInput` | Manual input (flowchart) |
| `internalStorage` | Internal storage (flowchart) |
| `dataStorage` | Data storage (flowchart) |
| `loopLimit` | Loop limit (flowchart) |
| `offPageConnector` | Off-page connector |
| `delay` | Delay shape |
| `display` | Display device |
| `or` | OR gate |
| `orEllipse` | OR ellipse |
| `xor` | XOR gate |
| `sumEllipse` | Sum/sigma ellipse |
| `sortShape` | Sort shape |
| `collate` | Collate shape |
| `cross` | Cross / X shape |
| `dimension` | Dimension line |
| `partialRectangle` | Rectangle with configurable borders |
| `lineEllipse` | Line with ellipse |
| `link` | Link / chain shape |
| `pipe` | Pipe connector |
| `zigzag` | Zigzag connector |
| `filledEdge` | Filled edge connector |
| `table` | Table container |
| `tableRow` | Table row |
| `tableLine` | Table line |
| `rect2` | Alternative rectangle |

### 3.3 UML Shapes

| shape= value | Description |
|---|---|
| `umlActor` | UML stick figure |
| `umlBoundary` | UML boundary |
| `umlEntity` | UML entity |
| `umlDestroy` | UML destruction mark |
| `umlControl` | UML control |
| `umlLifeline` | UML lifeline |
| `umlFrame` | UML frame |
| `umlState` | UML state (use `perimeter=mxPerimeter.StatePerimeter`) |
| `lollipop` | UML provided interface |
| `requires` | UML required interface |
| `requiredInterface` | UML required interface (arc) |
| `providedRequiredInterface` | UML assembly connector |
| `module` | UML module |
| `component` | UML component |
| `associativeEntity` | ER associative entity |
| `endState` | State diagram end state |
| `startState` | State diagram start state |

### 3.4 Stencil Libraries

Additional shapes are available via stencil libraries in the `stencils/` directory.
Use with: `shape=stencil(<library>.<shape>)` or `shape=mxgraph.<library>.<shape>`.

Major libraries:
- `mxgraph.flowchart.*` — Flowchart shapes
- `mxgraph.bpmn.*` — BPMN shapes
- `mxgraph.aws4.*` — AWS architecture icons
- `mxgraph.azure.*` — Azure architecture icons
- `mxgraph.gcp.*` / `mxgraph.gcp2.*` — Google Cloud icons
- `mxgraph.cisco.*` / `mxgraph.cisco19.*` — Cisco networking
- `mxgraph.kubernetes.*` — Kubernetes icons
- `mxgraph.uml.*` — UML shapes
- `mxgraph.er.*` — Entity-relationship shapes
- `mxgraph.electrical.*` — Electrical engineering symbols
- `mxgraph.pid.*` — Piping and instrumentation
- `mxgraph.mockup.*` — UI wireframe components
- `mxgraph.lean_mapping.*` — Lean mapping
- `mxgraph.eip.*` — Enterprise integration patterns

---

## 4. Style Properties Reference

### 4.1 Fill and Stroke

| Property | Values | Default | Description |
|---|---|---|---|
| `fillColor` | `#RRGGBB`, `none`, `default` | `default` | Shape fill color |
| `gradientColor` | `#RRGGBB`, `none` | none | Gradient end color (gradient from fillColor to gradientColor) |
| `gradientDirection` | `north`, `south`, `east`, `west` | `south` | Gradient direction |
| `strokeColor` | `#RRGGBB`, `none`, `default` | `default` | Border/stroke color |
| `strokeWidth` | number | `1` | Border width in pixels |
| `dashed` | `0`, `1` | `0` | Dashed stroke |
| `dashPattern` | string | — | Dash pattern, e.g. `"1 3"` (1px dash, 3px gap), `"8 8"` |
| `opacity` | `0`–`100` | `100` | Overall opacity (0=transparent, 100=opaque) |
| `fillOpacity` | `0`–`100` | `100` | Fill opacity only |
| `strokeOpacity` | `0`–`100` | `100` | Stroke opacity only |
| `glass` | `0`, `1` | `0` | Glass/shine overlay effect |
| `shadow` | `0`, `1` | `0` | Drop shadow (also controlled globally on mxGraphModel) |

### 4.2 Shape Geometry

| Property | Values | Default | Description |
|---|---|---|---|
| `shape` | see Shape Types above | `label` | Shape type |
| `perimeter` | see Perimeters below | `rectanglePerimeter` | Connection point calculation |
| `rounded` | `0`, `1` | `0` | Round rectangle corners |
| `arcSize` | number | — | Corner radius for rounded shapes (0–50, as percentage) |
| `aspect` | `variable`, `fixed` | `variable` | `fixed` preserves width/height ratio |
| `direction` | `north`, `south`, `east`, `west` | — | Rotate shape by 90° increments |
| `flipH` | `0`, `1` | `0` | Flip horizontally |
| `flipV` | `0`, `1` | `0` | Flip vertically |
| `rotation` | number (degrees) | `0` | Free rotation angle (0–360) |
| `fixedSize` | `0`, `1` | `0` | Shape keeps size independent of label |

### 4.3 Text and Labels

| Property | Values | Default | Description |
|---|---|---|---|
| `html` | `0`, `1` | `1` | Enable HTML label rendering |
| `whiteSpace` | `wrap`, `nowrap` | — | Text wrapping mode. Use `wrap` for most shapes |
| `fontSize` | number | `12` | Font size in pixels |
| `fontFamily` | string | `Helvetica` | Font family name |
| `fontColor` | `#RRGGBB`, `default` | `default` | Text color |
| `fontStyle` | bitmask | `0` | Font style: 0=normal, 1=bold, 2=italic, 4=underline (combine by adding: 3=bold+italic) |
| `align` | `left`, `center`, `right` | `center` | Horizontal text alignment |
| `verticalAlign` | `top`, `middle`, `bottom` | `middle` | Vertical text alignment |
| `labelPosition` | `left`, `center`, `right` | `center` | Horizontal label position relative to shape |
| `verticalLabelPosition` | `top`, `middle`, `bottom` | `middle` | Vertical label position relative to shape |
| `overflow` | `visible`, `hidden`, `fill`, `width` | — | Text overflow handling |
| `spacing` | number | `2` | General padding in pixels |
| `spacingTop` | number | `0` | Top padding |
| `spacingBottom` | number | `0` | Bottom padding |
| `spacingLeft` | number | `0` | Left padding |
| `spacingRight` | number | `0` | Right padding |
| `textOpacity` | `0`–`100` | `100` | Text opacity |
| `labelBackgroundColor` | `#RRGGBB`, `none`, `d



---

Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/jgraph/drawio-mcp/main/shared/xml-reference.md

---

# draw.io XML Reference

Detailed reference for styles, edge routing, containers, layers, tags, metadata, and dark mode. Consult this when generating draw.io XML diagrams.

## Reasoning budget (read this first)

Your job is to declare the **logical structure** of the diagram — what nodes exist, what edges connect them, what labels they carry, what lane/container groups them. draw.io's edge router and (when available) a post-layout pass handle routing and placement; you do **not** need to do layout math.

**Do NOT** in your reasoning:

- Do NOT debate the topic. The user asked for a flowchart / architecture / sequence / etc. — pick one concrete scenario on your first impulse and commit. Never write "Actually, let me think of something else…" or pitch alternatives.
- Do NOT debate flat-lanes vs nested-pools, horizontal vs vertical orientation, one vs multiple variations. Pick the first reasonable option (almost always: flat swimlanes, top-down or left-right based on what fits the content). Do not flip-flop.
- Do NOT compute x/y coordinates in prose. No "column spacings of 160px totaling 1840px width — that's too wide, let me tighten to 1700…" loops. Use the rigid grid below; do the arithmetic in your head and write the XML.
- Do NOT re-derive drawio mechanics (`horizontal=0`, `startSize=110`, nested-lane coordinates). Use the templates below as-is.
- Do NOT enumerate columns ("customer lane columns 0-10, web app 1-7"). Place a node, move on.
- Do NOT add `<Array as="points">` waypoints. Edges are routed automatically.
- Do NOT set `exitX` / `exitY` / `entryX` / `entryY` connection-point overrides unless you have specific geometric intent.
- Do NOT verify, re-check, or adjust coordinates after placing a node.
- Do NOT narrate "building the diagram / finalizing the XML / now let me…". Just emit XML.
- Do NOT write out lists of node positions as planning text. Emit them as `<mxCell>` elements directly.

**Do** in your reasoning:

- Identify the diagram type + actors/stages (1-2 short sentences).
- Identify any grouping (swimlanes? containers? none?).
- Go straight to XML.

**Rigid grid — use for every XML diagram:**

- Column x = `col_index * 180 + 40`  (col 0 = 40, col 1 = 220, col 2 = 400, …)
- Row y = `row_index * 120 + 40`     (row 0 = 40, row 1 = 160, row 2 = 280, …)
- Node size: rectangles `140×60`, diamonds `140×80`, circles `60×60`, documents `120×80`, cylinders `100×70`

Pick a `(col, row)` for each node. Don't think about centers, gaps, or overlap — ELK handles routing between rough positions. Slight misalignment is invisible in the result.

## General principles

- **Use proper draw.io shapes and connectors** — choose the semantically correct shape for each element (e.g., `shape=cylinder3` for databases and tanks, `rhombus` for decisions, `shape=mxgraph.pid2valves.*` for valves in P&IDs). draw.io has extensive shape libraries; prefer domain-appropriate shapes over generic rectangles.
- **Decide whether to search for shapes** — before generating a diagram, decide if it needs domain-specific shapes from draw.io's extended libraries. **Skip `search_shapes`** for standard diagram types that use basic geometric shapes: flowcharts, UML (class, sequence, state, activity), ERD, org charts, mind maps, Venn diagrams, timelines, wireframes, and any diagram using only rectangles, diamonds, circles, cylinders, and arrows. Also skip if the user explicitly asks to use basic/simple shapes or says not to search. **Use `search_shapes`** when the diagram requires industry-specific or branded icons: cloud architecture (AWS, Azure, GCP), network topology (Cisco, rack equipment), P&ID (valves, instruments, vessels), electrical/circuit diagrams, Kubernetes, BPMN with specific task types, or any domain where the user expects realistic/standardized symbols rather than labeled boxes. It also finds brand/product logos and general-purpose pictorial icons (e.g. `react`, `slack`, `shopping cart`, `solar panel`) — returned as ready-to-use `shape=image` styles — so use it too when the user asks for logos or everyday concept icons.
- **Match the language of labels to the user's language** — if the user writes in German, French, Japanese, etc., all diagram labels, titles, and annotations should be in that same language.
- **Group related nodes, and surface a hub when edges converge** — put nodes that belong together inside a container or swimlane, and keep external actors (users, files, third-party systems) outside implementation containers. When many edges converge on one area or cross several groups, route them through a single hub/gateway node (a registry, broker, event log, …) instead of drawing every low-level dependency across the canvas — fewer crossings, clearer contract.
- **Encode secondary detail in node text, not edges** — draw an edge only when the relationship itself carries meaning; push incidental detail into the node label so the connector layer stays readable.

## Common styles

**Rounded rectangle:**
```xml
<mxCell id="2" value="Label" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

**Diamond (decision):**
```xml
<mxCell id="3" value="Condition?" style="rhombus;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="200" width="120" height="80" as="geometry"/>
</mxCell>
```

**Arrow (edge):**
```xml
<mxCell id="4" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" source="2" target="3" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

**Labeled arrow:**
```xml
<mxCell id="5" value="Yes" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" source="3" target="6" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

## Style properties

| Property | Values | Use for |
|----------|--------|---------|
| `rounded=1` | 0 or 1 | Rounded corners |
| `whiteSpace=wrap` | wrap | Text wrapping |
| `fillColor=#dae8fc` | Hex color | Background color |
| `strokeColor=#6c8ebf` | Hex color | Border color |
| `fontColor=#333333` | Hex color | Text color |
| `shape=cylinder3` | shape name | Database cylinders |
| `shape=mxgraph.flowchart.document` | shape name | Document shapes |
| `ellipse` | style keyword | Circles/ovals |
| `rhombus` | style keyword | Diamonds |
| `edgeStyle=orthogonalEdgeStyle` | style keyword | Right-angle connectors |
| `edgeStyle=elbowEdgeStyle` | style keyword | Elbow connectors |
| `dashed=1` | 0 or 1 | Dashed lines |
| `swimlane` | style keyword | Swimlane containers |
| `group` | style keyword | Invisible container (pointerEvents=0) |
| `container=1` | 0 or 1 | Enable container behavior on any shape |
| `pointerEvents=0` | 0 or 1 | Prevent container from capturing child connections |
| `html=1` | 0 or 1 | Enable HTML rendering in labels (required for `<b>`, `<br>`, `<font>`, etc.) |
| `shape=umlLifeline;perimeter=lifelinePerimeter;size=16` | shape | UML sequence diagram lifeline (size = header height) |

## HTML labels

**Always include `html=1` in the style** when the `value` attribute contains any HTML tags (`<b>`, `<br>`, `<font>`, `<i>`, `<u>`, `<hr>`, `<p>`, `<table>`, etc.). Without `html=1`, HTML tags are displayed as literal text instead of being rendered.

HTML in attribute values must be **XML-escaped**: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, `"` → `&quot;`

```xml
<mxCell value="&lt;b&gt;Title&lt;/b&gt;&lt;br&gt;Description"
        style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

**Line breaks:** Use `&#xa;` (works with both `html=1` and `html=0`) or `&lt;br&gt;` (requires `html=1`) for line breaks — never use `\n`, which renders as literal backslash-n text instead of a newline.

**Best practice:** Always include `html=1` in every cell style. This ensures labels render correctly whether they contain HTML or plain text — plain text is unaffected by the flag.

**Bold/italic/underline:** Use `fontStyle` in the style string when the entire label should be bold (`fontStyle=1`), italic (`fontStyle=2`), or underline (`fontStyle=4`). Values can be combined via bitwise OR (e.g., `fontStyle=3` = bold+italic). Use HTML tags (`<b>`, `<i>`, `<u>`) only when formatting part of the label (e.g., bold title with normal description). Never combine `fontStyle` with HTML tags for the same effect — this is redundant and causes visible raw tags if `html=1` is missing.

## Edges

**CRITICAL: Every edge `mxCell` must contain a `<mxGeometry relative="1" as="geometry" />` child element.** Self-closing edge cells (e.g. `<mxCell ... edge="1" ... />`) are invalid and will not render correctly. Always use the expanded form:
```xml
<mxCell id="e1" edge="1" parent="1" source="a" target="b" style="...">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

**Don't hand-route edges.** Just declare `source` and `target`. You do **not** need to:
- Add `<mxPoint>` waypoints
- Set `exitX` / `exitY` / `entryX` / `entryY`
- Route around obstacles
- Worry about edge-vertex collisions or parallel edge spacing

draw.io's built-in router is **basic**: it draws each edge as a straight line or a simple right-angle path between `source` and `target`, with **no awareness of other shapes** — a wire will run straight across any box that sits between its endpoints. That's fine when connected nodes have open space between them. When edges would otherwise cross over shapes, or you want consistently clean orthogonal wires that route *around* the boxes, set **`routing: "libavoid"`** on `create_diagram`; for a full re-layout use **`postLayout: "elk"`** (see **Edge routing & layout passes** below). Both compute the waypoints for you — you never add them by hand either way.

**What you still choose: the edge style.** The style determines the overall look (orthogonal angles, curves, straight lines) — the router honors the style family.

| Style | Syntax | Best for |
|-------|--------|---------|
| **Orthogonal** | `edgeStyle=orthogonalEdgeStyle` | Flowcharts, architecture, network diagrams, BPMN — any diagram with right-angle connectors |
| **Straight** | no `edgeStyle` | UML class/sequence diagrams, direct point-to-point connections. For sequence diagram messages use `endSize=6;startSize=6;` to keep arrowheads small |
| **Entity Relation** | `edgeStyle=entityRelationEdgeStyle` | ER diagrams — creates perpendicular stubs at both ends |
| **Curved** | `curved=1` | Mind maps, informal diagrams |
| **Elbow** | `edgeStyle=elbowEdgeStyle;elbow=vertical;` | Rarely needed — `orthogonalEdgeStyle` handles almost all cases; use this only for simple 1-bend linear flows |

**Use a consistent edge style within each diagram.** Pick one based on diagram type and apply it to all edges: ER → `entityRelationEdgeStyle`; UML class → straight; mind maps → curved; flowcharts/architecture/network → `orthogonalEdgeStyle`.

**Useful edge style attributes** that apply regardless of routing:
- `rounded=1` — rounded corners at bend points (recommended for orthogonal)
- `endArrow=classic` / `endArrow=none` — arrow heads
- `dashed=1` — dashed line
- `strokeColor=#...`, `strokeWidth=2` — color/w



---

Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/jgraph/drawio-mcp/main/shared/mxfile.xsd

---

<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           elementFormDefault="unqualified">

  <!--
    draw.io mxFile XML Schema
    Version: 1.0

    This schema describes the structure of draw.io / .drawio files.
    It is intended for use by AI systems to validate generated diagram files.

    Notes:
    - Style strings (e.g. "rounded=1;whiteSpace=wrap;html=1;") are typed as
      xs:string. The style syntax is documented separately in
      style-reference.md.
    - mxCell is intentionally generic: vertex/edge/connectable determine the role.
    - The first two mxCell elements in root are structural: id="0" (root container)
      and id="1" (default layer). All diagram elements must reference these.
    - IDs must be unique within a diagram. Any string is valid, but typically
      short alphanumeric strings or numeric IDs are used.
    - For compressed diagrams, the diagram element contains Base64-encoded,
      deflate-compressed XML instead of an mxGraphModel child element.
    - mxGeometry child elements (mxPoint, Array, mxRectangle) may appear in
      any order. The schema uses xs:choice to reflect this flexibility.

    Companion document: style-reference.md
  -->

  <!-- ================================================================== -->
  <!-- Root: mxfile                                                        -->
  <!-- ================================================================== -->
  <xs:element name="mxfile" type="mxfileType" />

  <xs:complexType name="mxfileType">
    <xs:annotation>
      <xs:documentation>
        Root element of a draw.io file. Contains one or more diagram pages.
        A minimal valid file has one diagram with at least the two structural
        mxCell elements (id="0" and id="1").
      </xs:documentation>
    </xs:annotation>
    <xs:sequence>
      <xs:element name="diagram" type="diagramType" maxOccurs="unbounded" />
    </xs:sequence>
    <!-- Identifies the application that created/modified the file -->
    <xs:attribute name="host" type="xs:string">
      <xs:annotation>
        <xs:documentation>Host application identifier (e.g. "app.diagrams.net", "Electron").</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- ISO 8601 timestamp of last modification -->
    <xs:attribute name="modified" type="xs:string">
      <xs:annotation>
        <xs:documentation>ISO 8601 timestamp of last modification (e.g. "2024-01-15T10:30:00.000Z").</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- User agent string of the creating application -->
    <xs:attribute name="agent" type="xs:string">
      <xs:annotation>
        <xs:documentation>User agent or tool identifier that created the file.</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- draw.io application version -->
    <xs:attribute name="version" type="xs:string">
      <xs:annotation>
        <xs:documentation>draw.io application version (e.g. "24.7.6").</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- Entity tag for caching/sync -->
    <xs:attribute name="etag" type="xs:string">
      <xs:annotation>
        <xs:documentation>Entity tag for caching and synchronization.</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- Storage type: "device", "google", "dropbox", "onedrive", "github", "gitlab", "browser" -->
    <xs:attribute name="type" type="xs:string">
      <xs:annotation>
        <xs:documentation>Storage backend type. Common values: "device", "google", "dropbox", "onedrive", "github", "gitlab", "browser".</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- Whether diagram content is compressed -->
    <xs:attribute name="compressed" type="booleanString" default="false">
      <xs:annotation>
        <xs:documentation>If "true", diagram content is deflate-compressed and Base64-encoded. For AI generation, always use "false" (uncompressed XML).</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- Number of pages (informational, not enforced) -->
    <xs:attribute name="pages" type="xs:string">
      <xs:annotation>
        <xs:documentation>Number of diagram pages. Informational only; the actual count is determined by the number of diagram child elements.</xs:documentation>
      </xs:annotation>
    </xs:attribute>
  </xs:complexType>

  <!-- ================================================================== -->
  <!-- diagram: One page/tab in the diagram                               -->
  <!-- ================================================================== -->
  <xs:complexType name="diagramType">
    <xs:annotation>
      <xs:documentation>
        Represents a single page/tab in the diagram. Each diagram has a unique
        id and an optional display name. Contains either an mxGraphModel element
        (uncompressed) or Base64-encoded compressed text content.
      </xs:documentation>
    </xs:annotation>
    <xs:choice>
      <!-- Uncompressed: mxGraphModel as child element -->
      <xs:element name="mxGraphModel" type="mxGraphModelType" />
    </xs:choice>
    <!-- Unique identifier for this page (omitted in some older files) -->
    <xs:attribute name="id" type="xs:string">
      <xs:annotation>
        <xs:documentation>Unique identifier for this diagram page. Must be unique within the file.</xs:documentation>
      </xs:annotation>
    </xs:attribute>
    <!-- Display name shown in the page tab -->
    <xs:attribute name="name" type="xs:string">
      <xs:annotation>
        <xs:documentation>Display name shown in the page tab. Defaults to "Page-N" if omitted.</xs:documentation>
      </xs:annotation>
    </xs:attribute>
  </xs:complexType>

  <!-- ================================================================== -->
  <!-- mxGraphModel: Canvas configuration and cells                       -->
  <!-- ================================================================== -->
  <xs:complexType name="


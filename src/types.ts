export type StructuralCategory = 
  | 'code'
  | 'component'
  | 'infrastructure'
  | 'data-schema'
  | 'container'
  | 'actor-agent'
  | 'activity-state'
  | 'sequence'
  | 'c4'
  | 'archimate'
  | 'cloud'
  | 'aws'
  | 'domainstory'
  | 'adaml'
  | 'embedded'
  | 'wbs'
  | 'mindmap'
  | 'annotation';

export type PortPosition = 'top' | 'right' | 'bottom' | 'left';

export type EdgeStyle = 'solid' | 'dashed' | 'dotted' | 'thick';

export type EdgeArrowType = 
  | 'arrow'                  // -->
  | 'bi-arrow'               // <-->
  | 'none'                   // --
  | 'inheritance'            // <|-- or --|>
  | 'realization'            // ..|> or <|..
  | 'composition'            // *--
  | 'aggregation'            // o--
  | 'dependency'             // ..>
  | 'nesting'                // +--
  | 'cancellation'           // x--
  | 'socket-ball'            // -0)
  | 'lollipop'               // ()--
  | 'crows-foot-one'         // ||--||
  | 'crows-foot-many'        // ||--|{
  | 'crows-foot-zero-many'   // ||--o{
  | 'crows-foot-zero-one'    // ||--o|
  | 'crows-foot-many-many'   // }|--|{
  | 'crows-foot-zero-zero'   // }o--o{
  | 'crows-foot-opt-opt'     // |o--o|
  | 'crows-foot-many-zero-one' // }|--o|
  | 'crows-foot-many-one'    // }|--||
  | 'crows-foot-zero-many-one'; // }o--||

export interface ErColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  isUnique?: boolean;
}

export interface ObjectSlot {
  key: string;
  value: string;
}

export interface MapEntry {
  key: string;
  value: string;
}

export interface ClassifierSpot {
  character: string;  // e.g., 'C', 'I', 'A', 'E', 'S', 'T'
  colorHex: string;   // e.g., '#2e7d32', '#7b1fa2'
}

export type NodeShape = 'rectangle' | 'rounded' | 'cylinder' | 'horiz-cylinder' | 'cloud' | 'actor' | 'agent' | 'circle' | 'diamond' | 'component' | 'package' | 'node3d' | 'queue' | 'stack' | 'artifact' | 'file' | 'folder' | 'frame' | 'card' | 'hexagon' | 'collections' | 'boundary' | 'control' | 'entity-circle' | 'lollipop' | 'start' | 'stop' | 'sync-bar' | 'state' | 'history' | 'flow-final' | 'usecase' | 'note';

export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  sublabel?: string; // stereotype, subtitle or role
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; // theme key or hex
  shape?: NodeShape;
  category?: StructuralCategory;
  data?: {
    // Code & OO
    attributes?: string[];
    methods?: string[];
    generics?: string; // e.g. "<T>", "<K, V>"
    spot?: ClassifierSpot;
    isAbstract?: boolean;
    isStatic?: boolean;

    // Data & Schema
    columns?: ErColumn[];
    tableName?: string;
    slots?: ObjectSlot[];
    className?: string;
    mapEntries?: MapEntry[];
    treeFormat?: 'json' | 'yaml';
    treeContent?: string;

    // Component & Ports
    ports?: Array<{ id: string; name: string; position: PortPosition; type?: 'in' | 'out' | 'inout' }>;

    // C4 Architecture
    c4Type?: 'person' | 'person-ext' | 'system' | 'system-ext' | 'system-db' | 'system-db-ext' | 'system-queue' | 'system-queue-ext' | 'container' | 'container-ext' | 'container-db' | 'container-db-ext' | 'container-queue' | 'container-queue-ext' | 'component' | 'component-ext' | 'component-db' | 'component-db-ext' | 'component-queue' | 'component-queue-ext' | 'deployment-node' | 'node' | 'boundary' | 'enterprise-boundary' | 'system-boundary' | 'container-boundary';
    technology?: string;
    role?: string;
    description?: string;

    // ArchiMate Model (stdlib/archimate)
    archimateLayer?: 'business' | 'application' | 'technology' | 'strategy' | 'physical' | 'motivation' | 'implementation' | 'other';
    archimateElement?: string;

    // DomainStory (stdlib/DomainStory)
    domainStoryType?: 'person' | 'group' | 'system' | 'document' | 'folder' | 'call' | 'email' | 'conversation' | 'info' | 'boundary' | 'activity' | 'workobject';
    domainStoryStep?: number;
    domainStoryPredicate?: string;

    // AdaML (stdlib/adaml)
    adamlType?: 'package-spec' | 'subprogram' | 'package-body' | 'agent' | 'actor' | 'dependency';

    // Cloud Infrastructure & AWS / Azure / GCP / K8s / Cloudogu (stdlib)
    cloudProvider?: 'aws' | 'gcp' | 'azure' | 'k8s' | 'cloudogu';
    cloudService?: string;
    awsCategory?: 'compute' | 'database' | 'storage' | 'analytics' | 'security' | 'networking' | 'integration' | 'management';
    awsIcon?: string;
    region?: string;

    // Embedded Sub-Engines
    embeddedType?: 'salt' | 'ditaa' | 'math';
    embeddedContent?: string;
    saltContent?: string;
    mathFormula?: string;

    // State Machine
    isDeep?: boolean;

    // WBS & MindMap
    wbsLevel?: number;
    wbsCode?: string;
    wbsProgress?: number;

    // Containers & Boundaries
    isContainer?: boolean;
    containerType?: 'package' | 'namespace' | 'node' | 'folder' | 'frame' | 'rectangle' | 'cloud' | 'together' | 'boundary';
    enclosedNodeIds?: string[];
    parentId?: string;
    frameKind?: string;
    condition?: string;

    // Notes
    noteDirection?: 'top' | 'right' | 'bottom' | 'left' | 'floating';
    attachedToNodeId?: string;
    noteText?: string;

    // Generic shape
    shape?: NodeShape;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: PortPosition;
  targetHandle?: PortPosition;
  label?: string;
  cardinalitySource?: string; // e.g., "1", "0..*", "1..*"
  cardinalityTarget?: string; // e.g., "1", "0..*", "1..*"
  readingDirection?: '>' | '<';
  style: EdgeStyle;
  arrowType: EdgeArrowType;
  color?: string; // custom color e.g. "#c2652a", "#2563eb"
  directionHint?: 'up' | 'down' | 'left' | 'right';
  length?: 1 | 2 | 3 | 4; // short, normal, long, extra-long
  labelOffset?: { x: number; y: number }; // custom offset to prevent overlapping or obscuring
  sourceMarker?: string; // explicit SVG marker ID for source end
  targetMarker?: string; // explicit SVG marker ID for target end
}

export interface GlobalCanvasSettings {
  direction: 'TB' | 'LR';
  linetype: 'ortho' | 'polyline' | 'straight';
  monochrome: boolean;
  monochromeReverse?: boolean; // PlantUML dark mode / invert
  strictuml?: boolean; // Strict OMG UML 2.5 standards (skinparam style strictuml)
  handwritten: boolean; // Organic / Sketchy (skinparam handwritten true)
  shadowing: boolean; // 3D drop-shadows (skinparam shadowing false/true)
  theme?: string; // PlantUML !theme (e.g. plain, materia, sketchy, blueprint, cyborg, etc.)
  roundcorner?: number; // Rounded corners (skinparam roundCorner <px>)
  diagonalCorner?: number; // Chamfered / beveled box corners (skinparam diagonalCorner <px>)
  hideFootbox?: boolean; // Suppress sequence bottom participant boxes (hide footbox)
  responseMessageBelowArrow?: boolean; // Label under sequence arrow (skinparam responseMessageBelowArrow true)
  autonumberFormat?: 'standard' | 'bold-bracket' | 'parentheses' | 'increment5' | 'disabled';
  wrapWidth?: number; // Automatic label text wrapping for nodes (skinparam wrapWidth <px>)
  maxMessageSize?: number; // Automatic sequence arrow text wrapping (skinparam maxMessageSize <px>)
  nodesep?: number; // Horizontal distance between adjacent nodes (skinparam nodesep <px>)
  ranksep?: number; // Vertical distance between hierarchical layers (skinparam ranksep <px>)
  padding?: number; // Inner element padding (skinparam padding <px>)
  margin?: number; // Outer element margin (skinparam margin <px>)
  minClassWidth?: number; // Uniform minimum box width (skinparam minClassWidth <px>)
  participantPadding?: number; // Space between sequence lifelines (skinparam ParticipantPadding <px>)
  boxPadding?: number; // Space between sequence box containers (skinparam BoxPadding <px>)
  backgroundColor?: string;
  arrowColor?: string;
  arrowThickness?: number;
  defaultFontName?: string;
  defaultFontSize?: number;
  dpi?: number;
  scale?: number | string; // e.g. 1.5, 0.75, "1200 width", "800 height", "max 1920*1080"
}

export interface DiagramData {
  title: string;
  type?: DiagramType;
  description?: string;
  settings?: GlobalCanvasSettings;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  participants?: SequenceParticipant[];
  messages?: SequenceMessage[];
  blocks?: SequenceBlock[];
}

export interface AssetItem {
  id: string;
  label: string;
  nodeType: string;
  icon: string;
  category: StructuralCategory;
  categoryLabel: string;
  description: string;
  plantumlKeyword: string;
  defaultColor?: string;
  width?: number;
  height?: number;
  sublabel?: string;
  shape?: DiagramNode['data']['shape'];
  defaultData?: Record<string, any>;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type DiagramType = 
  | 'unified'
  | 'class' 
  | 'component' 
  | 'sequence' 
  | 'erd'
  | 'usecase'
  | 'state'
  | 'activity'
  | 'deployment'
  | 'archimate'
  | 'c4'
  | string;

export interface SequenceParticipant {
  id: string;
  name: string;
  type?: string;
  shape?: string;
  color?: string;
  sublabel?: string;
  stereotype?: string;
  x?: number;
  y?: number;
}

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  type?: 'sync' | 'reply' | 'async' | 'self' | string;
  arrowType?: string;
  number?: string | number;
  isReturn?: boolean;
  isDotted?: boolean;
  order: number;
  noteText?: string;
  y?: number;
  labelOffset?: { x: number; y: number };
}

export interface SequenceBlock {
  id: string;
  type: string;
  label: string;
  condition?: string;
  startOrder: number;
  endOrder: number;
  startMessageIndex?: number;
  endMessageIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface HistorySnapshot {
  id: string;
  diagram: DiagramData;
  action: string;
  timestamp: number;
}

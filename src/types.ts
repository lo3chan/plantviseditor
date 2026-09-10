export type StructuralCategory = 
  | 'code'
  | 'component'
  | 'infrastructure'
  | 'data-schema'
  | 'container'
  | 'actor-agent'
  | 'c4'
  | 'cloud'
  | 'embedded'
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
  | 'crows-foot-opt-opt';    // |o--o|

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
    c4Type?: 'person' | 'person-ext' | 'system' | 'system-ext' | 'container' | 'container-ext' | 'component' | 'component-ext' | 'boundary';
    technology?: string;
    role?: string;
    description?: string;

    // Cloud Infrastructure
    cloudProvider?: 'aws' | 'gcp' | 'azure' | 'k8s';
    cloudService?: string;
    region?: string;

    // Embedded Sub-Engines
    embeddedType?: 'salt' | 'ditaa' | 'math';
    embeddedContent?: string;

    // Containers & Boundaries
    isContainer?: boolean;
    containerType?: 'package' | 'namespace' | 'node' | 'folder' | 'frame' | 'rectangle' | 'cloud' | 'together';
    enclosedNodeIds?: string[];

    // Notes
    noteDirection?: 'top' | 'right' | 'bottom' | 'left' | 'floating';
    attachedToNodeId?: string;

    // Generic shape
    shape?: 'rectangle' | 'rounded' | 'cylinder' | 'horiz-cylinder' | 'cloud' | 'actor' | 'agent' | 'circle' | 'diamond' | 'component' | 'package' | 'node3d' | 'queue' | 'stack' | 'artifact' | 'file' | 'folder' | 'frame' | 'card' | 'hexagon' | 'collections' | 'boundary' | 'control' | 'entity-circle' | 'lollipop';
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
}

export interface GlobalCanvasSettings {
  direction: 'TB' | 'LR';
  linetype: 'ortho' | 'polyline' | 'straight';
  monochrome: boolean;
  handwritten: boolean;
  shadowing: boolean;
}

export interface DiagramData {
  title: string;
  description?: string;
  settings?: GlobalCanvasSettings;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
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

export type DiagramType = 'class' | 'component' | 'sequence' | 'unified' | string;

export interface SequenceParticipant {
  id: string;
  name: string;
  type?: string;
  color?: string;
}

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  type?: string;
  isDotted?: boolean;
  order?: number;
}

export interface SequenceBlock {
  id: string;
  type: string;
  label: string;
  startMessageIndex: number;
  endMessageIndex: number;
}

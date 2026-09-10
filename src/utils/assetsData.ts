import { AssetItem, StructuralCategory } from '../types';

export const STRUCTURAL_CATEGORIES: { id: StructuralCategory; label: string; icon: string; description: string }[] = [
  { id: 'code', label: 'Code & Object-Oriented', icon: 'Box', description: 'Classes, interfaces, structs, enums, protocols, maps' },
  { id: 'component', label: 'Component & Modular', icon: 'Cpu', description: 'Components, ports, lollipops, collections, robustness' },
  { id: 'infrastructure', label: 'Infrastructure & Hardware', icon: 'Server', description: 'Node 3D, database, storage, cloud, queue, stack, hexagon' },
  { id: 'data-schema', label: 'Data, Schema & Dictionary', icon: 'Database', description: 'Relational entity tables, JSON, YAML, dictionary maps' },
  { id: 'container', label: 'Boundary & Grouping', icon: 'Folder', description: 'Packages, namespaces, frames, folders, subnets' },
  { id: 'actor-agent', label: 'Actors, People & Agents', icon: 'Users', description: 'Actors, wire actors, bots, agents, boundary gateways' },
  { id: 'c4', label: 'C4 Architecture Model', icon: 'Layers', description: 'Person, System, Container, Component, Deployment' },
  { id: 'cloud', label: 'Cloud Infrastructure Libs', icon: 'Cloud', description: 'AWS, GCP, Azure, and Kubernetes standard nodes' },
  { id: 'embedded', label: 'Embedded Sub-Engines', icon: 'Code', description: 'Salt wireframes, Ditaa ASCII art, LaTeX formulas' },
  { id: 'annotation', label: 'Annotations & Notes', icon: 'FileText', description: 'Directional sticky notes, link annotations, legends' }
];

export const UNIFIED_ASSETS: AssetItem[] = [
  // ==================== 1. CODE & OBJECT-ORIENTED ====================
  {
    id: 'code-class',
    label: 'Class',
    nodeType: 'class',
    icon: 'Box',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'UML class with fields, methods and visibility indicators',
    plantumlKeyword: 'class',
    defaultColor: 'sienna',
    width: 220,
    height: 150,
    shape: 'rectangle',
    defaultData: {
      spot: { character: 'C', colorHex: '#2e7d32' },
      attributes: ['+id: Long', '-secretKey: String', '#state: State'],
      methods: ['+save(): boolean', '+find(id): Entity', '{static} +builder(): Builder']
    }
  },
  {
    id: 'code-abstract',
    label: 'Abstract Class',
    nodeType: 'abstract-class',
    icon: 'FileCode',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Base class with abstract methods',
    plantumlKeyword: 'abstract class',
    defaultColor: 'terracotta',
    width: 220,
    height: 130,
    sublabel: '<<abstract>>',
    shape: 'rectangle',
    defaultData: {
      spot: { character: 'A', colorHex: '#f59e0b' },
      isAbstract: true,
      attributes: ['#baseConfig: Config'],
      methods: ['{abstract} +execute(): void', '+logEvent(): void']
    }
  },
  {
    id: 'code-interface',
    label: 'Interface',
    nodeType: 'interface',
    icon: 'Radio',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Contract interface specification',
    plantumlKeyword: 'interface',
    defaultColor: 'sage',
    width: 210,
    height: 120,
    sublabel: '<<interface>>',
    shape: 'rectangle',
    defaultData: {
      spot: { character: 'I', colorHex: '#7c3aed' },
      generics: '<T>',
      methods: ['+process(item: T): Result', '+healthCheck(): boolean']
    }
  },
  {
    id: 'code-enum',
    label: 'Enum',
    nodeType: 'enum',
    icon: 'ListFilter',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Enumeration of constant values',
    plantumlKeyword: 'enum',
    defaultColor: 'sand',
    width: 170,
    height: 120,
    sublabel: '<<enum>>',
    shape: 'rectangle',
    defaultData: {
      spot: { character: 'E', colorHex: '#d97706' },
      attributes: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
    }
  },
  {
    id: 'code-struct',
    label: 'Struct',
    nodeType: 'struct',
    icon: 'Box',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'C/Go/Rust memory data structure',
    plantumlKeyword: 'struct',
    defaultColor: 'sienna',
    width: 190,
    height: 110,
    sublabel: '<<struct>>',
    shape: 'rectangle',
    defaultData: {
      attributes: ['+x: double', '+y: double', '+z: double']
    }
  },
  {
    id: 'code-protocol',
    label: 'Protocol',
    nodeType: 'protocol',
    icon: 'Radio',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Formal protocol contract (Swift, Python)',
    plantumlKeyword: 'protocol',
    defaultColor: 'sage',
    width: 200,
    height: 110,
    sublabel: '<<protocol>>',
    shape: 'rectangle',
    defaultData: {
      methods: ['+serialize(): bytes', '+deserialize(data): self']
    }
  },
  {
    id: 'code-exception',
    label: 'Exception',
    nodeType: 'exception',
    icon: 'FileCode',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Error and exception classifier',
    plantumlKeyword: 'exception',
    defaultColor: 'terracotta',
    width: 210,
    height: 110,
    sublabel: '<<exception>>',
    shape: 'rectangle',
    defaultData: {
      attributes: ['-errorCode: Integer', '+message: String']
    }
  },
  {
    id: 'code-object',
    label: 'Object Instance',
    nodeType: 'object',
    icon: 'FileText',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Concrete runtime object with fixed slot values',
    plantumlKeyword: 'object',
    defaultColor: 'ochre',
    width: 210,
    height: 120,
    shape: 'rectangle',
    defaultData: {
      className: 'UserSession',
      slots: [
        { key: 'userId', value: '"usr_9812"' },
        { key: 'token', value: '"eyJhbGci..."' },
        { key: 'role', value: '"ADMIN"' }
      ]
    }
  },
  {
    id: 'code-map',
    label: 'Map Dictionary',
    nodeType: 'map',
    icon: 'ListFilter',
    category: 'code',
    categoryLabel: 'Code & Object-Oriented',
    description: 'Associative key-value dictionary table',
    plantumlKeyword: 'map',
    defaultColor: 'sand',
    width: 210,
    height: 120,
    shape: 'rectangle',
    defaultData: {
      mapEntries: [
        { key: 'timeout', value: '30s' },
        { key: 'retries', value: '3' },
        { key: 'debug', value: 'true' }
      ]
    }
  },

  // ==================== 2. COMPONENT & MODULAR ====================
  {
    id: 'comp-standard',
    label: 'Component',
    nodeType: 'component',
    icon: 'Cpu',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Independent software module or microservice',
    plantumlKeyword: 'component',
    defaultColor: 'sienna',
    width: 180,
    height: 80,
    shape: 'component',
    defaultData: {
      ports: [
        { id: 'p1', name: 'http', position: 'left', type: 'in' },
        { id: 'p2', name: 'grpc', position: 'right', type: 'out' }
      ]
    }
  },
  {
    id: 'comp-lollipop',
    label: 'Lollipop Interface',
    nodeType: 'interface-lollipop',
    icon: 'CircleDot',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Circular lollipop contract socket',
    plantumlKeyword: '()',
    defaultColor: 'sand',
    width: 120,
    height: 60,
    shape: 'lollipop',
    defaultData: {}
  },
  {
    id: 'comp-collections',
    label: 'Worker Collections',
    nodeType: 'collections',
    icon: 'Layers',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Cascading offset boxes for worker replicas or pools',
    plantumlKeyword: 'collections',
    defaultColor: 'slate',
    width: 190,
    height: 90,
    shape: 'collections',
    defaultData: {}
  },
  {
    id: 'comp-boundary',
    label: 'Boundary Gateway',
    nodeType: 'boundary',
    icon: 'Radio',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Robustness analysis presentation gateway',
    plantumlKeyword: 'boundary',
    defaultColor: 'sand',
    width: 160,
    height: 80,
    shape: 'boundary',
    defaultData: {}
  },
  {
    id: 'comp-control',
    label: 'Control Logic',
    nodeType: 'control',
    icon: 'RotateCcw',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Robustness analysis process/workflow controller',
    plantumlKeyword: 'control',
    defaultColor: 'terracotta',
    width: 160,
    height: 80,
    shape: 'control',
    defaultData: {}
  },
  {
    id: 'comp-entity-circle',
    label: 'Domain Entity',
    nodeType: 'entity-circle',
    icon: 'CircleDot',
    category: 'component',
    categoryLabel: 'Component & Modular',
    description: 'Robustness persistent entity circle',
    plantumlKeyword: 'entity',
    defaultColor: 'ochre',
    width: 160,
    height: 80,
    shape: 'entity-circle',
    defaultData: {}
  },

  // ==================== 3. INFRASTRUCTURE & HARDWARE ====================
  {
    id: 'infra-node3d',
    label: 'Compute Node (3D Cube)',
    nodeType: 'node',
    icon: 'Server',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: '3D isometric cube bare-metal server / VM host',
    plantumlKeyword: 'node',
    defaultColor: 'slate',
    width: 190,
    height: 90,
    shape: 'node3d',
    defaultData: {}
  },
  {
    id: 'infra-database',
    label: 'Database Cylinder',
    nodeType: 'database',
    icon: 'Database',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: '3D vertical datastore cylinder',
    plantumlKeyword: 'database',
    defaultColor: 'ochre',
    width: 180,
    height: 90,
    shape: 'cylinder',
    defaultData: {}
  },
  {
    id: 'infra-storage',
    label: 'Storage Block',
    nodeType: 'storage',
    icon: 'HardDrive',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Horizontal storage cylinder / object store (S3, Ceph)',
    plantumlKeyword: 'storage',
    defaultColor: 'sand',
    width: 180,
    height: 80,
    shape: 'horiz-cylinder',
    defaultData: {}
  },
  {
    id: 'infra-cloud',
    label: 'Cloud Perimeter',
    nodeType: 'cloud',
    icon: 'Cloud',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Fluffy cloud outline for WAN / SaaS / VPC',
    plantumlKeyword: 'cloud',
    defaultColor: 'sage',
    width: 200,
    height: 100,
    shape: 'cloud',
    defaultData: {}
  },
  {
    id: 'infra-queue',
    label: 'Message Queue',
    nodeType: 'queue',
    icon: 'Radio',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Horizontal cylindrical message broker pipe (Kafka, SQS)',
    plantumlKeyword: 'queue',
    defaultColor: 'terracotta',
    width: 190,
    height: 70,
    shape: 'queue',
    defaultData: {}
  },
  {
    id: 'infra-stack',
    label: 'Stack Buffer',
    nodeType: 'stack',
    icon: 'Layers',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Call stack or layered middleware memory buffer',
    plantumlKeyword: 'stack',
    defaultColor: 'slate',
    width: 170,
    height: 90,
    shape: 'stack',
    defaultData: {}
  },
  {
    id: 'infra-artifact',
    label: 'Artifact Binary',
    nodeType: 'artifact',
    icon: 'FileCode',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Deployable binary (Docker image, JAR, executable)',
    plantumlKeyword: 'artifact',
    defaultColor: 'sand',
    width: 170,
    height: 80,
    shape: 'artifact',
    defaultData: {}
  },
  {
    id: 'infra-file',
    label: 'Config File',
    nodeType: 'file',
    icon: 'FileText',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Document page with folded corner (.yaml, .env)',
    plantumlKeyword: 'file',
    defaultColor: 'sand',
    width: 160,
    height: 80,
    shape: 'file',
    defaultData: {}
  },
  {
    id: 'infra-folder',
    label: 'Folder Directory',
    nodeType: 'folder',
    icon: 'Folder',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Tabbed filesystem directory',
    plantumlKeyword: 'folder',
    defaultColor: 'sand',
    width: 180,
    height: 90,
    shape: 'folder',
    defaultData: {}
  },
  {
    id: 'infra-frame',
    label: 'Window Frame',
    nodeType: 'frame',
    icon: 'Maximize2',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Application execution window frame',
    plantumlKeyword: 'frame',
    defaultColor: 'slate',
    width: 190,
    height: 100,
    shape: 'frame',
    defaultData: {}
  },
  {
    id: 'infra-card',
    label: 'Card Header',
    nodeType: 'card',
    icon: 'CreditCard',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: 'Flat border card with header',
    plantumlKeyword: 'card',
    defaultColor: 'sand',
    width: 180,
    height: 80,
    shape: 'card',
    defaultData: {}
  },
  {
    id: 'infra-hexagon',
    label: 'Hexagon Adapter',
    nodeType: 'hexagon',
    icon: 'Hexagon',
    category: 'infrastructure',
    categoryLabel: 'Infrastructure & Hardware',
    description: '6-sided hexagon for ports & adapters architecture',
    plantumlKeyword: 'hexagon',
    defaultColor: 'ochre',
    width: 180,
    height: 100,
    shape: 'hexagon',
    defaultData: {}
  },

  // ==================== 4. DATA, SCHEMA & DICTIONARY ====================
  {
    id: 'data-er',
    label: 'Relational Entity (ER)',
    nodeType: 'entity',
    icon: 'Database',
    category: 'data-schema',
    categoryLabel: 'Data, Schema & Dictionary',
    description: 'Database table with PK/FK columns and Crow\'s Foot cardinality',
    plantumlKeyword: 'entity',
    defaultColor: 'ochre',
    width: 230,
    height: 160,
    sublabel: '<<entity>>',
    shape: 'rectangle',
    defaultData: {
      tableName: 'orders',
      columns: [
        { name: 'id', type: 'bigint', isPk: true },
        { name: 'customer_id', type: 'bigint', isFk: true },
        { name: 'total_cents', type: 'integer' },
        { name: 'status', type: 'varchar(32)' }
      ]
    }
  },
  {
    id: 'data-json',
    label: 'Interactive JSON Tree',
    nodeType: 'data-json',
    icon: 'Code',
    category: 'data-schema',
    categoryLabel: 'Data, Schema & Dictionary',
    description: 'Live formatted JSON payload node',
    plantumlKeyword: 'json',
    defaultColor: 'sand',
    width: 230,
    height: 150,
    shape: 'rectangle',
    defaultData: {
      treeFormat: 'json',
      treeContent: '{\n  "service": "billing",\n  "port": 8080,\n  "enabled": true\n}'
    }
  },
  {
    id: 'data-yaml',
    label: 'YAML Configuration',
    nodeType: 'data-yaml',
    icon: 'FileText',
    category: 'data-schema',
    categoryLabel: 'Data, Schema & Dictionary',
    description: 'Hierarchical YAML deployment configuration',
    plantumlKeyword: 'yaml',
    defaultColor: 'sand',
    width: 230,
    height: 150,
    shape: 'rectangle',
    defaultData: {
      treeFormat: 'yaml',
      treeContent: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: auth-svc'
    }
  },

  // ==================== 5. BOUNDARY & GROUPING ====================
  {
    id: 'group-package',
    label: 'Package Namespace',
    nodeType: 'package',
    icon: 'Folder',
    category: 'container',
    categoryLabel: 'Boundary & Grouping',
    description: 'Standard UML folder-tab namespace perimeter',
    plantumlKeyword: 'package',
    defaultColor: 'sand',
    width: 260,
    height: 180,
    shape: 'package',
    defaultData: { isContainer: true, containerType: 'package' }
  },
  {
    id: 'group-rectangle',
    label: 'Subsystem Perimeter',
    nodeType: 'rectangle',
    icon: 'Maximize2',
    category: 'container',
    categoryLabel: 'Boundary & Grouping',
    description: 'Clean boundary perimeter enclosing microservices',
    plantumlKeyword: 'rectangle',
    defaultColor: 'slate',
    width: 260,
    height: 180,
    shape: 'rectangle',
    defaultData: { isContainer: true, containerType: 'rectangle' }
  },

  // ==================== 6. ACTORS, PEOPLE & AGENTS ====================
  {
    id: 'actor-human',
    label: 'Actor (Stick-man)',
    nodeType: 'actor',
    icon: 'User',
    category: 'actor-agent',
    categoryLabel: 'Actors, People & Agents',
    description: 'Human end-user or system administrator',
    plantumlKeyword: 'actor',
    defaultColor: 'sand',
    width: 140,
    height: 90,
    shape: 'actor',
    defaultData: {}
  },
  {
    id: 'actor-agent',
    label: 'Autonomous Agent / Bot',
    nodeType: 'agent',
    icon: 'Bot',
    category: 'actor-agent',
    categoryLabel: 'Actors, People & Agents',
    description: 'Automated background process, bot, or AI agent',
    plantumlKeyword: 'agent',
    defaultColor: 'sage',
    width: 170,
    height: 80,
    shape: 'agent',
    defaultData: {}
  },

  // ==================== 7. C4 ARCHITECTURE MODEL ====================
  {
    id: 'c4-person',
    label: 'Person (C4 Level 1)',
    nodeType: 'c4-person',
    icon: 'User',
    category: 'c4',
    categoryLabel: 'C4 Architecture Model',
    description: 'Person(alias, label, desc) C4 Context actor',
    plantumlKeyword: 'Person',
    defaultColor: 'sienna',
    width: 200,
    height: 110,
    sublabel: '<<Person>>',
    shape: 'rectangle',
    defaultData: { c4Type: 'person', role: 'Customer', description: 'Buys items online' }
  },
  {
    id: 'c4-system',
    label: 'Software System (C4)',
    nodeType: 'c4-system',
    icon: 'Layers',
    category: 'c4',
    categoryLabel: 'C4 Architecture Model',
    description: 'System(alias, label, desc) Core software system',
    plantumlKeyword: 'System',
    defaultColor: 'slate',
    width: 220,
    height: 120,
    sublabel: '<<System>>',
    shape: 'rectangle',
    defaultData: { c4Type: 'system', description: 'Core e-commerce platform' }
  },
  {
    id: 'c4-container',
    label: 'Container App/Service (C4)',
    nodeType: 'c4-container',
    icon: 'Cpu',
    category: 'c4',
    categoryLabel: 'C4 Architecture Model',
    description: 'Container(alias, label, tech, desc) Web app, API, or DB',
    plantumlKeyword: 'Container',
    defaultColor: 'ochre',
    width: 220,
    height: 120,
    sublabel: '<<Container>>',
    shape: 'rectangle',
    defaultData: { c4Type: 'container', technology: 'Go / GraphQL', description: 'Order processing engine' }
  },

  // ==================== 8. CLOUD INFRASTRUCTURE LIBS ====================
  {
    id: 'cloud-aws-compute',
    label: 'AWS EC2 / Lambda',
    nodeType: 'cloud-aws',
    icon: 'Cloud',
    category: 'cloud',
    categoryLabel: 'Cloud Infrastructure Libs',
    description: 'Amazon Web Services compute workload',
    plantumlKeyword: 'cloud',
    defaultColor: 'sienna',
    width: 190,
    height: 80,
    sublabel: '<<AWS EC2>>',
    shape: 'rectangle',
    defaultData: { cloudProvider: 'aws', cloudService: 'EC2' }
  },
  {
    id: 'cloud-gcp-run',
    label: 'GCP Cloud Run',
    nodeType: 'cloud-gcp',
    icon: 'Cloud',
    category: 'cloud',
    categoryLabel: 'Cloud Infrastructure Libs',
    description: 'Google Cloud managed serverless container',
    plantumlKeyword: 'cloud',
    defaultColor: 'sage',
    width: 190,
    height: 80,
    sublabel: '<<GCP Cloud Run>>',
    shape: 'rectangle',
    defaultData: { cloudProvider: 'gcp', cloudService: 'Cloud Run' }
  },
  {
    id: 'cloud-k8s-pod',
    label: 'Kubernetes Pod',
    nodeType: 'cloud-k8s',
    icon: 'Server',
    category: 'cloud',
    categoryLabel: 'Cloud Infrastructure Libs',
    description: 'K8s core workload pod',
    plantumlKeyword: 'node',
    defaultColor: 'slate',
    width: 180,
    height: 80,
    sublabel: '<<k8s Pod>>',
    shape: 'component',
    defaultData: { cloudProvider: 'k8s', cloudService: 'Pod' }
  },

  // ==================== 9. EMBEDDED SUB-ENGINES ====================
  {
    id: 'embed-salt',
    label: 'Salt GUI Wireframe',
    nodeType: 'embedded-salt',
    icon: 'FileCode',
    category: 'embedded',
    categoryLabel: 'Embedded Sub-Engines',
    description: 'Embedded Salt UI dialog, buttons, and form inputs',
    plantumlKeyword: 'salt',
    defaultColor: 'sand',
    width: 220,
    height: 140,
    shape: 'card',
    defaultData: {
      embeddedType: 'salt',
      embeddedContent: '{\n  <b>Login Screen</b>\n  Username: | "admin"\n  Password: | "****"\n  [Submit] | [Cancel]\n}'
    }
  },
  {
    id: 'embed-ditaa',
    label: 'Ditaa ASCII Art',
    nodeType: 'embedded-ditaa',
    icon: 'Code',
    category: 'embedded',
    categoryLabel: 'Embedded Sub-Engines',
    description: 'Vectorized ASCII block diagram',
    plantumlKeyword: 'ditaa',
    defaultColor: 'slate',
    width: 220,
    height: 120,
    shape: 'card',
    defaultData: {
      embeddedType: 'ditaa',
      embeddedContent: '+--------+  TCP  +--------+\n| Client | ----> | Server |\n+--------+       +--------+'
    }
  },

  // ==================== 10. ANNOTATIONS & NOTES ====================
  {
    id: 'note-sticky',
    label: 'Sticky Note',
    nodeType: 'note',
    icon: 'FileText',
    category: 'annotation',
    categoryLabel: 'Annotations & Notes',
    description: 'PlantUML note with folded dog-ear corner',
    plantumlKeyword: 'note',
    defaultColor: 'gold',
    width: 190,
    height: 85,
    shape: 'file',
    defaultData: {
      description: 'TLS 1.3 encryption enabled with strict mTLS authentication.'
    }
  }
];

export const COLOR_THEMES = [
  { id: 'sienna', name: 'Sienna Terracotta', hex: '#c2652a', border: '#e8a87c', bg: '#fcf6f2' },
  { id: 'terracotta', name: 'Deep Terracotta', hex: '#b34d28', border: '#e4957c', bg: '#faf0eb' },
  { id: 'ochre', name: 'Warm Ochre', hex: '#c48227', border: '#e8be77', bg: '#fbf7ee' },
  { id: 'sage', name: 'Earthy Sage', hex: '#587a5f', border: '#a0c4a8', bg: '#f1f6f2' },
  { id: 'slate', name: 'Steel Slate', hex: '#4f5e6b', border: '#9bb0c1', bg: '#f0f3f6' },
  { id: 'sand', name: 'Desert Sand', hex: '#8a7d6b', border: '#cfc6b8', bg: '#f8f6f2' },
  { id: 'gold', name: 'Amber Gold', hex: '#b8860b', border: '#ebd278', bg: '#fdfbee' },
];

export function getColorConfig(colorKey?: string) {
  let base = { hex: '#c2652a', bgHex: '#fcf6f2', borderHex: '#e8a87c', badgeHex: '#8f3b0e' };
  switch (colorKey) {
    case 'sienna':
      base = { hex: '#c2652a', bgHex: '#fcf6f2', borderHex: '#e8a87c', badgeHex: '#8f3b0e' };
      break;
    case 'terracotta':
      base = { hex: '#b34d28', bgHex: '#faf0eb', borderHex: '#e4957c', badgeHex: '#7a290d' };
      break;
    case 'ochre':
      base = { hex: '#c48227', bgHex: '#fbf7ee', borderHex: '#e8be77', badgeHex: '#8a5209' };
      break;
    case 'sage':
      base = { hex: '#587a5f', bgHex: '#f1f6f2', borderHex: '#a0c4a8', badgeHex: '#304c35' };
      break;
    case 'slate':
      base = { hex: '#4f5e6b', bgHex: '#f0f3f6', borderHex: '#9bb0c1', badgeHex: '#2b3944' };
      break;
    case 'sand':
      base = { hex: '#8a7d6b', bgHex: '#f8f6f2', borderHex: '#cfc6b8', badgeHex: '#524838' };
      break;
    case 'gold':
      base = { hex: '#b8860b', bgHex: '#fdfbee', borderHex: '#ebd278', badgeHex: '#755400' };
      break;
    default:
      base = { hex: '#c2652a', bgHex: '#fcf6f2', borderHex: '#e8a87c', badgeHex: '#8f3b0e' };
  }

  return {
    ...base,
    bg: base.bgHex,
    border: base.borderHex
  };
}

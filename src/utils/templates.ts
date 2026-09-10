import { DiagramData } from '../types';

export const DEFAULT_PLANTUML_SCRIPT = `@startuml
allowmixing
title Architecture & Domain Model
skinparam roundcorner 8
skinparam shadowing false
skinparam ArrowColor #c2652a
skinparam classAttributeIconSize 0

class Customer {
  +id: Long
  +name: String
  +email: String
  --
  +placeOrder(items): Order
}

class Order {
  +id: Long
  +total: Double
  +status: OrderStatus
  --
  +calculateTotal(): Double
}

entity OrderItem {
  *id : Long
  --
  #order_id : Long
  quantity : Integer
  unit_price : Double
}

database "PostgreSQL" as db <<Database>>
cloud "AWS Cloud" as cloud

Customer "1" --> "*" Order : places
Order "1" *-- "*" OrderItem : contains
Order ..> db : persists to
cloud --> db : manages
@enduml
`;

export const DEFAULT_DIAGRAM: DiagramData = {
  title: 'Architecture & Domain Model',
  nodes: [
    {
      id: 'Customer',
      type: 'class',
      category: 'code',
      label: 'Customer',
      x: 60,
      y: 60,
      width: 220,
      height: 140,
      color: 'sienna',
      data: {
        attributes: ['+id: Long', '+name: String', '+email: String'],
        methods: ['+placeOrder(items): Order']
      }
    },
    {
      id: 'Order',
      type: 'class',
      category: 'code',
      label: 'Order',
      x: 420,
      y: 60,
      width: 220,
      height: 140,
      color: 'sienna',
      data: {
        attributes: ['+id: Long', '+total: Double', '+status: OrderStatus'],
        methods: ['+calculateTotal(): Double']
      }
    },
    {
      id: 'OrderItem',
      type: 'entity',
      category: 'data-schema',
      label: 'OrderItem',
      sublabel: '<<entity>>',
      x: 780,
      y: 60,
      width: 220,
      height: 140,
      color: 'ochre',
      data: {
        tableName: 'OrderItem',
        columns: [
          { name: 'id', type: 'Long', isPk: true },
          { name: 'order_id', type: 'Long', isFk: true },
          { name: 'quantity', type: 'Integer' },
          { name: 'unit_price', type: 'Double' }
        ]
      }
    },
    {
      id: 'db',
      type: 'database',
      category: 'component',
      label: 'PostgreSQL',
      sublabel: '<<Database>>',
      x: 420,
      y: 290,
      width: 190,
      height: 75,
      color: 'slate'
    },
    {
      id: 'cloud',
      type: 'cloud',
      category: 'component',
      label: 'AWS Cloud',
      x: 60,
      y: 290,
      width: 190,
      height: 75,
      color: 'sand'
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'Customer',
      target: 'Order',
      label: 'places',
      cardinalitySource: '1',
      cardinalityTarget: '*',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e2',
      source: 'Order',
      target: 'OrderItem',
      label: 'contains',
      cardinalitySource: '1',
      cardinalityTarget: '*',
      style: 'solid',
      arrowType: 'composition'
    },
    {
      id: 'e3',
      source: 'Order',
      target: 'db',
      label: 'persists to',
      style: 'dashed',
      arrowType: 'dependency'
    },
    {
      id: 'e4',
      source: 'cloud',
      target: 'db',
      label: 'manages',
      style: 'solid',
      arrowType: 'arrow'
    }
  ]
};

export const C4_BANKING_DIAGRAM: DiagramData = {
  title: 'Internet Banking - C4 Container Architecture',
  nodes: [
    {
      id: 'customer',
      type: 'c4-person',
      category: 'c4',
      label: 'Personal Banking Customer',
      sublabel: '<<person>>',
      x: 50,
      y: 120,
      width: 200,
      height: 130,
      color: 'sienna',
      data: {
        c4Type: 'person',
        description: 'A customer of the bank, with personal bank accounts.'
      }
    },
    {
      id: 'spa',
      type: 'c4-container',
      category: 'c4',
      label: 'Single-Page Application',
      sublabel: '<<container>>',
      x: 320,
      y: 50,
      width: 220,
      height: 140,
      color: 'sienna',
      data: {
        c4Type: 'container',
        technology: 'JavaScript & React',
        description: 'Provides all of the internet banking functionality to customers via their web browser.'
      }
    },
    {
      id: 'api',
      type: 'c4-container',
      category: 'c4',
      label: 'API Application',
      sublabel: '<<container>>',
      x: 600,
      y: 50,
      width: 220,
      height: 140,
      color: 'sienna',
      data: {
        c4Type: 'container',
        technology: 'Java & Spring Boot',
        description: 'Provides Internet banking functionality via a JSON/HTTPS REST API.'
      }
    },
    {
      id: 'db',
      type: 'c4-container-db',
      category: 'c4',
      label: 'Database',
      sublabel: '<<container_db>>',
      x: 600,
      y: 250,
      width: 220,
      height: 130,
      color: 'sienna',
      data: {
        c4Type: 'container-db',
        technology: 'PostgreSQL Schema',
        description: 'Stores user registration information, hashed credentials, and transactions.'
      }
    },
    {
      id: 'audit_queue',
      type: 'c4-container-queue',
      category: 'c4',
      label: 'Audit Events Queue',
      sublabel: '<<container_queue>>',
      x: 880,
      y: 50,
      width: 220,
      height: 130,
      color: 'terracotta',
      data: {
        c4Type: 'container-queue',
        technology: 'RabbitMQ / Kafka',
        description: 'Buffers financial audit log events for compliance streaming.'
      }
    },
    {
      id: 'mainframe',
      type: 'c4-system',
      category: 'c4',
      label: 'Mainframe Banking System',
      sublabel: '<<external_system>>',
      x: 320,
      y: 250,
      width: 220,
      height: 130,
      color: 'slate',
      data: {
        c4Type: 'system-ext',
        description: 'Stores all core banking info about customers, accounts, and ledger.'
      }
    }
  ],
  edges: [
    {
      id: 'rel_cust_spa',
      source: 'customer',
      target: 'spa',
      label: 'Visits banking portal [HTTPS]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'rel_spa_api',
      source: 'spa',
      target: 'api',
      label: 'API calls [JSON/HTTPS]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'rel_api_db',
      source: 'api',
      target: 'db',
      label: 'Reads & writes [JDBC]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'rel_api_queue',
      source: 'api',
      target: 'audit_queue',
      label: 'Publishes audit log [AMQP]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'rel_api_mainframe',
      source: 'api',
      target: 'mainframe',
      label: 'Syncs transactions [XML/HTTPS]',
      style: 'solid',
      arrowType: 'arrow'
    }
  ]
};

export const STATE_MACHINE_DIAGRAM: DiagramData = {
  title: 'Order Processing State Machine & Activity Workflow',
  nodes: [
    {
      id: 'start_node',
      type: 'activity-start',
      category: 'activity-state',
      label: 'Start',
      x: 50,
      y: 110,
      width: 32,
      height: 32,
      color: 'slate',
      data: { shape: 'start' }
    },
    {
      id: 'init_state',
      type: 'state',
      category: 'activity-state',
      label: 'InitializingOrder',
      sublabel: '<<state>>',
      x: 160,
      y: 75,
      width: 210,
      height: 100,
      color: 'sand',
      data: {
        shape: 'state',
        attributes: [
          'entry / validateCartItems()',
          'do / checkInventoryAvailability()',
          'exit / holdInventoryReservation()'
        ]
      }
    },
    {
      id: 'decision_check',
      type: 'activity-decision',
      category: 'activity-state',
      label: 'In Stock?',
      x: 440,
      y: 95,
      width: 110,
      height: 64,
      color: 'sand',
      data: { shape: 'diamond' }
    },
    {
      id: 'processing_state',
      type: 'state',
      category: 'activity-state',
      label: 'ProcessingPayment',
      sublabel: '<<composite-state>>',
      x: 620,
      y: 50,
      width: 230,
      height: 110,
      color: 'sand',
      data: {
        shape: 'state',
        attributes: [
          'entry / chargeCreditCard()',
          'do / awaitGatewayConfirmation()',
          'exit / generateInvoicePdf()'
        ]
      }
    },
    {
      id: 'state_history',
      type: 'state-history',
      category: 'activity-state',
      label: '[H]',
      sublabel: '<<history>>',
      x: 880,
      y: 90,
      width: 34,
      height: 34,
      color: 'ochre',
      data: { shape: 'history', isDeep: false }
    },
    {
      id: 'flow_final_node',
      type: 'activity-flow-final',
      category: 'activity-state',
      label: 'OutOfStock',
      x: 480,
      y: 230,
      width: 32,
      height: 32,
      color: 'slate',
      data: {}
    },
    {
      id: 'stop_node',
      type: 'activity-stop',
      category: 'activity-state',
      label: 'Fulfilled',
      x: 960,
      y: 90,
      width: 34,
      height: 34,
      color: 'slate',
      data: { shape: 'stop' }
    }
  ],
  edges: [
    {
      id: 'e_start_init',
      source: 'start_node',
      target: 'init_state',
      label: 'submitOrder()',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e_init_dec',
      source: 'init_state',
      target: 'decision_check',
      label: 'verified',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e_dec_proc',
      source: 'decision_check',
      target: 'processing_state',
      label: '[available]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e_dec_cancel',
      source: 'decision_check',
      target: 'flow_final_node',
      label: '[depleted]',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e_proc_hist',
      source: 'processing_state',
      target: 'state_history',
      label: 'checkpoint',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'e_hist_stop',
      source: 'state_history',
      target: 'stop_node',
      label: 'completed',
      style: 'solid',
      arrowType: 'arrow'
    }
  ]
};

export const SALT_WIREFRAME_DIAGRAM: DiagramData = {
  title: 'Salt UI Wireframe & Desktop Mockup',
  nodes: [
    {
      id: 'login_dialog',
      type: 'salt-mockup',
      category: 'embedded',
      label: 'Login Window',
      x: 60,
      y: 60,
      width: 280,
      height: 220,
      color: 'sand',
      data: {
        embeddedType: 'salt',
        saltContent: `{+
  <b>PlantUML Studio Sign In
  --
  Username: | "engineer@cloud.dev"
  Password: | "••••••••••••"
  [X] Remember session
  [Cancel] | [  <b>Sign In  ]
}`
      }
    },
    {
      id: 'admin_dashboard',
      type: 'salt-mockup',
      category: 'embedded',
      label: 'Infrastructure Management Panel',
      x: 400,
      y: 60,
      width: 420,
      height: 260,
      color: 'sand',
      data: {
        embeddedType: 'salt',
        saltContent: `{+
  {* &headers | Servers | Storage | Networks }
  {/ <b>Compute | Database | Monitoring }
  --
  {
    <b>Cluster Node | <b>Status | <b>vCPU | <b>Memory
    [X] prod-worker-01 | (X) Active | 16 | 64 GB
    [X] prod-worker-02 | (X) Active | 16 | 64 GB
    [ ] prod-worker-03 | ( ) Standby | 8 | 32 GB
  }
  --
  [+ Provision Node] | [Restart Fleet]
}`
      }
    }
  ],
  edges: [
    {
      id: 'rel_login_dash',
      source: 'login_dialog',
      target: 'admin_dashboard',
      label: 'onSuccess() redirect',
      style: 'solid',
      arrowType: 'arrow'
    }
  ]
};

export const ARCHIMATE_DIAGRAM: DiagramData = {
  title: 'Enterprise Architecture - ArchiMate Model',
  nodes: [
    {
      id: 'biz_actor',
      type: 'archimate-element',
      category: 'archimate',
      label: 'Corporate Client',
      sublabel: '<<business-actor>>',
      x: 60,
      y: 80,
      width: 200,
      height: 90,
      color: 'ochre',
      data: {
        archimateLayer: 'business',
        archimateElement: 'actor',
        description: 'Commercial enterprise client engaging banking services.'
      }
    },
    {
      id: 'biz_service',
      type: 'archimate-element',
      category: 'archimate',
      label: 'Payment Processing Service',
      sublabel: '<<business-service>>',
      x: 320,
      y: 80,
      width: 220,
      height: 90,
      color: 'ochre',
      data: {
        archimateLayer: 'business',
        archimateElement: 'service',
        description: 'High-volume batch payment settlement.'
      }
    },
    {
      id: 'app_comp',
      type: 'archimate-element',
      category: 'archimate',
      label: 'Settlement Engine',
      sublabel: '<<application-component>>',
      x: 320,
      y: 230,
      width: 220,
      height: 90,
      color: 'sage',
      data: {
        archimateLayer: 'application',
        archimateElement: 'component',
        description: 'Microservice handling automated transaction clearing.'
      }
    },
    {
      id: 'tech_node',
      type: 'archimate-element',
      category: 'archimate',
      label: 'Kubernetes Cluster Node',
      sublabel: '<<technology-node>>',
      x: 320,
      y: 380,
      width: 220,
      height: 90,
      color: 'sage',
      data: {
        archimateLayer: 'technology',
        archimateElement: 'node',
        description: 'Redundant compute nodes hosting containers.'
      }
    }
  ],
  edges: [
    {
      id: 'a_rel1',
      source: 'biz_actor',
      target: 'biz_service',
      label: 'uses',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'a_rel2',
      source: 'app_comp',
      target: 'biz_service',
      label: 'realizes',
      style: 'dashed',
      arrowType: 'realization'
    },
    {
      id: 'a_rel3',
      source: 'tech_node',
      target: 'app_comp',
      label: 'executes',
      style: 'solid',
      arrowType: 'arrow'
    }
  ]
};

export const SEQUENCE_AUTH_DIAGRAM: DiagramData = {
  title: 'User Authentication & Token Exchange Flow',
  type: 'sequence',
  nodes: [],
  edges: [],
  participants: [
    { id: 'user', name: 'User Client', type: 'actor', color: 'sienna' },
    { id: 'gateway', name: 'API Gateway', type: 'participant', color: 'sienna', sublabel: 'Nginx / Kong' },
    { id: 'auth_svc', name: 'Auth Microservice', type: 'participant', color: 'sienna', sublabel: 'Spring Security' },
    { id: 'user_db', name: 'User Database', type: 'database', color: 'sienna', sublabel: 'PostgreSQL' }
  ],
  messages: [
    { id: 'm1', from: 'user', to: 'gateway', label: 'POST /api/v1/auth/login', type: 'sync', order: 1 },
    { id: 'm2', from: 'gateway', to: 'auth_svc', label: 'validateCredentials(user, hash)', type: 'sync', order: 2 },
    { id: 'm3', from: 'auth_svc', to: 'user_db', label: 'SELECT * FROM users WHERE email = ?', type: 'sync', order: 3 },
    { id: 'm4', from: 'user_db', to: 'auth_svc', label: 'User Record & Password Hash', type: 'reply', order: 4 },
    { id: 'm5', from: 'auth_svc', to: 'gateway', label: 'Sign & Issue JWT Token', type: 'reply', order: 5 },
    { id: 'm6', from: 'gateway', to: 'user', label: 'HTTP 200 OK (Bearer token & refresh)', type: 'reply', order: 6 }
  ],
  blocks: [
    { id: 'b1', type: 'alt', label: 'Credentials Valid', condition: 'Success', startOrder: 3, endOrder: 6 }
  ]
};

export const EMBEDDED_SUBENGINES_DIAGRAM: DiagramData = {
  title: 'PlantUML Sub-Engines & Structured Notation',
  nodes: [
    {
      id: 'ditaa_routing',
      type: 'embedded-ditaa',
      category: 'embedded',
      label: 'Edge Packet Gateway',
      x: 50,
      y: 50,
      width: 270,
      height: 160,
      color: 'slate',
      data: {
        embeddedType: 'ditaa',
        embeddedContent: `+---------------+      HTTP/3      +---------------+
| Mobile Client | ---------------> | Edge Ingress  |
+---------------+                  +---------------+
        |                                  |
        v                                  v
+---------------+                  +---------------+
| Local Storage |                  | Service Mesh  |
+---------------+                  +---------------+`
      }
    },
    {
      id: 'math_optimizer',
      type: 'embedded-math',
      category: 'embedded',
      label: 'Regularized Loss Objective',
      x: 370,
      y: 50,
      width: 260,
      height: 110,
      color: 'sand',
      data: {
        embeddedType: 'math',
        mathFormula: 'L(\\theta) = -\\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1-y_i) \\log(1-\\hat{y}_i) \\right] + \\frac{\\lambda}{2} \\|\\theta\\|^2'
      }
    },
    {
      id: 'runtime_config',
      type: 'data-json',
      category: 'data-schema',
      label: 'Mesh Gateway Policy',
      x: 50,
      y: 250,
      width: 270,
      height: 220,
      color: 'sand',
      data: {
        treeFormat: 'json',
        treeContent: JSON.stringify({
          service: "billing-gateway",
          version: "2.4.0",
          concurrency: {
            workers: 16,
            maxQueueSize: 5000,
            keepAliveSec: 60
          },
          endpoints: ["/v1/charge", "/v1/refund", "/v1/webhook"],
          tlsEnabled: true,
          rateLimitRps: 2500
        }, null, 2)
      }
    },
    {
      id: 'wbs_initiative',
      type: 'wbs-node',
      category: 'wbs',
      label: 'Cloud Infrastructure Modernization',
      x: 370,
      y: 210,
      width: 230,
      height: 95,
      color: 'sienna',
      data: {
        wbsLevel: 1,
        wbsCode: '1.0',
        wbsProgress: 55
      }
    },
    {
      id: 'wbs_task1',
      type: 'wbs-node',
      category: 'wbs',
      label: 'Distributed Database Replication',
      x: 370,
      y: 340,
      width: 230,
      height: 95,
      color: 'slate',
      data: {
        wbsLevel: 2,
        wbsCode: '1.1',
        wbsProgress: 85
      }
    }
  ],
  edges: [
    {
      id: 'rel_ditaa_math',
      source: 'ditaa_routing',
      target: 'math_optimizer',
      label: 'calibrates loss weight',
      style: 'dashed',
      arrowType: 'arrow'
    },
    {
      id: 'rel_ditaa_cfg',
      source: 'ditaa_routing',
      target: 'runtime_config',
      label: 'enforces JSON schema',
      style: 'solid',
      arrowType: 'arrow'
    },
    {
      id: 'rel_wbs_tree',
      source: 'wbs_initiative',
      target: 'wbs_task1',
      label: 'work package',
      style: 'solid',
      arrowType: 'composition'
    }
  ]
};

export const BLANK_DIAGRAM: DiagramData = {
  title: 'Untitled Diagram',
  nodes: [],
  edges: []
};

// Compatibility aliases
export const UNIFIED_STARTER_PRESETS = {
  unified_showcase: DEFAULT_DIAGRAM,
  domain_and_er: DEFAULT_DIAGRAM,
  cloud_c4_archimate: C4_BANKING_DIAGRAM,
  archimate_enterprise: ARCHIMATE_DIAGRAM,
  state_machine_workflow: STATE_MACHINE_DIAGRAM,
  salt_wireframe: SALT_WIREFRAME_DIAGRAM,
  embedded_engines: EMBEDDED_SUBENGINES_DIAGRAM,
  sequence_auth: SEQUENCE_AUTH_DIAGRAM,
  blank: BLANK_DIAGRAM
};

export const STARTER_TEMPLATES = UNIFIED_STARTER_PRESETS;

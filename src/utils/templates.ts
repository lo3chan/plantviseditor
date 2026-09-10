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
      y: 50,
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
      x: 340,
      y: 50,
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
      x: 620,
      y: 50,
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
      x: 340,
      y: 270,
      width: 180,
      height: 70,
      color: 'slate'
    },
    {
      id: 'cloud',
      type: 'cloud',
      category: 'component',
      label: 'AWS Cloud',
      x: 60,
      y: 270,
      width: 180,
      height: 70,
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

export const BLANK_DIAGRAM: DiagramData = {
  title: 'Untitled Diagram',
  nodes: [],
  edges: []
};

// Compatibility aliases
export const UNIFIED_STARTER_PRESETS = {
  unified_showcase: DEFAULT_DIAGRAM,
  domain_and_er: DEFAULT_DIAGRAM,
  cloud_c4_archimate: DEFAULT_DIAGRAM,
  blank: BLANK_DIAGRAM
};

export const STARTER_TEMPLATES = UNIFIED_STARTER_PRESETS;

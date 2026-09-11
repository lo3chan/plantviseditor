import { 
  DiagramData, 
  DiagramNode, 
  DiagramEdge, 
  ErColumn, 
  ObjectSlot, 
  MapEntry, 
  GlobalCanvasSettings,
  SequenceParticipant,
  SequenceMessage,
  SequenceBlock,
  PortPosition
} from '../types';
import { resolveOverlaps } from './overlapResolver';

export function sanitizeId(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[0-9]/.test(clean) ? `id_${clean}` : clean || 'node';
}

/**
 * Generates exhaustive, 1-1 valid PlantUML string from DiagramData
 * matching the entire Unified Structural Canvas Catalog
 */
export function generatePlantUML(diagram: DiagramData): string {
  // 0. Handle Sequence Diagrams (if explicit sequence or has sequence messages)
  const hasSequenceContent = (diagram.messages && diagram.messages.length > 0) ||
    (diagram.type === 'sequence' && ((diagram.participants && diagram.participants.length > 0) || (diagram.nodes && diagram.nodes.length > 0)));

  if (hasSequenceContent) {
    const seqLines: string[] = [];
    seqLines.push('@startuml');

    const settings: GlobalCanvasSettings = diagram.settings || {
      direction: 'TB',
      linetype: 'ortho',
      monochrome: false,
      handwritten: false,
      shadowing: false
    };

    // Autonumber Step Counter Formatting
    if (settings.autonumberFormat === 'disabled') {
      // no autonumber
    } else if (settings.autonumberFormat === 'bold-bracket') {
      seqLines.push('autonumber "<b>[00]</b>"');
    } else if (settings.autonumberFormat === 'parentheses') {
      seqLines.push('autonumber "<b>(##)</b>"');
    } else if (settings.autonumberFormat === 'increment5') {
      seqLines.push('autonumber 10 5 "<b>(<u>##</u>)</b>"');
    } else {
      seqLines.push('autonumber');
    }

    if (settings.hideFootbox) {
      seqLines.push('hide footbox');
    }

    if (diagram.title) {
      seqLines.push(`title ${diagram.title}`);
    }

    if (settings.theme && settings.theme !== 'none') {
      seqLines.push(`!theme ${settings.theme}`);
    }

    if (settings.strictuml) {
      seqLines.push('skinparam style strictuml');
    } else {
      if (settings.monochromeReverse) {
        seqLines.push('skinparam monochrome reverse');
      } else if (settings.monochrome) {
        seqLines.push('skinparam monochrome true');
      }
    }

    if (settings.handwritten) {
      seqLines.push('skinparam handwritten true');
    }

    if (settings.shadowing !== undefined) {
      seqLines.push(`skinparam shadowing ${settings.shadowing}`);
    }

    // Corner geometry
    if (settings.diagonalCorner !== undefined && settings.diagonalCorner > 0) {
      seqLines.push(`skinparam diagonalCorner ${settings.diagonalCorner}`);
    } else if (settings.roundcorner !== undefined) {
      seqLines.push(`skinparam roundcorner ${settings.roundcorner}`);
    }

    if (settings.responseMessageBelowArrow) {
      seqLines.push('skinparam responseMessageBelowArrow true');
    }

    if (settings.maxMessageSize) {
      seqLines.push(`skinparam maxMessageSize ${settings.maxMessageSize}`);
    }

    if (settings.wrapWidth) {
      seqLines.push(`skinparam wrapWidth ${settings.wrapWidth}`);
    }

    if (!settings.strictuml) {
      if (settings.arrowColor) {
        seqLines.push(`skinparam ArrowColor ${settings.arrowColor}`);
        seqLines.push(`skinparam sequenceLifeLineBorderColor ${settings.arrowColor}`);
      } else {
        seqLines.push('skinparam ArrowColor #A80036');
        seqLines.push('skinparam sequenceLifeLineBorderColor #A80036');
      }
    }

    if (settings.arrowThickness) {
      seqLines.push(`skinparam ArrowThickness ${settings.arrowThickness}`);
    }

    // Background is transparent to preserve the permanent Sahara brick canvas
    seqLines.push('skinparam backgroundColor transparent');

    if (settings.defaultFontName) {
      seqLines.push(`skinparam defaultFontName ${settings.defaultFontName}`);
    }

    if (settings.defaultFontSize) {
      seqLines.push(`skinparam defaultFontSize ${settings.defaultFontSize}`);
    }

    if (settings.dpi) {
      seqLines.push(`skinparam dpi ${settings.dpi}`);
    }

    if (settings.scale) {
      if (typeof settings.scale === 'number' && settings.scale !== 1) {
        seqLines.push(`scale ${settings.scale}`);
      } else if (typeof settings.scale === 'string' && settings.scale.trim()) {
        seqLines.push(`scale ${settings.scale.trim()}`);
      }
    }

    if (settings.participantPadding) {
      seqLines.push(`skinparam ParticipantPadding ${settings.participantPadding}`);
    }

    if (settings.boxPadding) {
      seqLines.push(`skinparam BoxPadding ${settings.boxPadding}`);
    }

    if (!settings.strictuml && !settings.monochrome && !settings.monochromeReverse) {
      seqLines.push('skinparam sequenceParticipantBackgroundColor #FEFECE');
      seqLines.push('skinparam sequenceParticipantBorderColor #A80036');
    }

    seqLines.push('');

    // Participants: read from diagram.nodes (ordered by X coordinate) if available, or fallback to participants
    const involvedNodeIds = new Set<string>();
    (diagram.messages || []).forEach(m => {
      involvedNodeIds.add(m.from);
      involvedNodeIds.add(m.to);
    });

    const participantNodes = (diagram.nodes && diagram.nodes.length > 0)
      ? [...diagram.nodes]
          .filter(n => n.category === 'sequence' || n.type === 'participant' || n.type === 'seq-participant' || involvedNodeIds.has(n.id))
          .sort((a, b) => a.x - b.x)
      : [];

    const participantsList = participantNodes.length > 0 ? participantNodes : (diagram.participants || []);

    participantsList.forEach(p => {
      const id = sanitizeId(p.id);
      const name = ('label' in p ? p.label : (p as any).name) || id;
      const label = name ? `"${name.replace(/"/g, '\\"')}"` : `"${id}"`;
      let type = 'participant';
      if (['actor', 'database', 'queue', 'boundary', 'control', 'entity', 'collections'].includes(p.type || '')) {
        type = p.type!;
      }
      const rawStereo = ('sublabel' in p ? p.sublabel : (p as any).stereotype) || '';
      const cleanStereo = rawStereo.replace(/^[«<]+|[»>]+$/g, '').trim();
      const stereo = cleanStereo ? ` <<${cleanStereo}>>` : '';
      const colorStr = p.color && p.color.startsWith('#') ? ` ${p.color}` : '';
      seqLines.push(`${type} ${label} as ${id}${stereo}${colorStr}`);
    });
    seqLines.push('');

    // Messages & Blocks
    const blocks = diagram.blocks || [];
    const messages = diagram.messages || [];

    messages.forEach((msg, idx) => {
      // Check if a block starts before this message
      blocks.filter(b => b.startOrder === idx + 1).forEach(b => {
        const cond = b.condition ? ` [${b.condition}]` : '';
        seqLines.push(`${b.type}${cond} ${b.label || ''}`.trim());
      });

      const src = sanitizeId(msg.from);
      const tgt = sanitizeId(msg.to);
      const arrow = msg.type === 'reply' ? '-->' : (msg.type === 'async' ? '->>' : '->');
      seqLines.push(`${src} ${arrow} ${tgt} : ${msg.label}`);

      // Check if message has an attached note
      if (msg.noteText) {
        seqLines.push(`note over ${tgt} : ${msg.noteText}`);
      }

      // Check if a block ends after this message
      blocks.filter(b => b.endOrder === idx + 1).forEach(() => {
        seqLines.push('end');
      });
    });

    seqLines.push('');
    seqLines.push('@enduml');
    return seqLines.join('\n');
  }

  const lines: string[] = [];
  lines.push('@startuml');

  // Check whether to output allowmixing:
  // ONLY if there are classifiers AND other structural elements,
  // AND NEVER if archimate is present (which causes syntax errors with allowmixing)
  const hasArchimate = (diagram.nodes || []).some(n => n.type?.startsWith('archimate') || n.category === 'archimate' || Boolean(n.data?.archimateLayer));
  const hasClassifiers = (diagram.nodes || []).some(n => ['class', 'abstract-class', 'interface', 'enum', 'struct', 'protocol', 'exception', 'entity'].includes(n.type));
  const hasOtherShapes = (diagram.nodes || []).some(n => !['class', 'abstract-class', 'interface', 'enum', 'struct', 'protocol', 'exception', 'entity'].includes(n.type));

  if (!hasArchimate && hasClassifiers && hasOtherShapes) {
    lines.push('allowmixing');
  }

  if (diagram.title) {
    lines.push(`title ${diagram.title}`);
  }

  // 1. Global Canvas Layout & Styling Directives
  const settings: GlobalCanvasSettings = diagram.settings || {
    direction: 'TB',
    linetype: 'ortho',
    monochrome: false,
    handwritten: false,
    shadowing: false
  };

  if (settings.theme && settings.theme !== 'none') {
    lines.push(`!theme ${settings.theme}`);
  }

  if (settings.strictuml) {
    lines.push('skinparam style strictuml');
  } else {
    if (settings.monochromeReverse) {
      lines.push('skinparam monochrome reverse');
    } else if (settings.monochrome) {
      lines.push('skinparam monochrome true');
    }
  }

  if (settings.direction === 'LR') {
    lines.push('left to right direction');
  } else {
    lines.push('top to bottom direction');
  }

  if (settings.linetype === 'ortho') {
    lines.push('skinparam linetype ortho');
  } else if (settings.linetype === 'polyline') {
    lines.push('skinparam linetype polyline');
  }

  if (settings.shadowing !== undefined) {
    lines.push(`skinparam shadowing ${settings.shadowing}`);
  }

  if (settings.handwritten) {
    lines.push('skinparam handwritten true');
  }

  // Corner geometry: diagonal chamfer or rounded corner
  if (settings.diagonalCorner !== undefined && settings.diagonalCorner > 0) {
    lines.push(`skinparam diagonalCorner ${settings.diagonalCorner}`);
  } else if (settings.roundcorner !== undefined) {
    lines.push(`skinparam roundcorner ${settings.roundcorner}`);
  } else {
    lines.push('skinparam roundcorner 8');
  }

  // Spacing, Margins & Padding
  if (settings.nodesep) {
    lines.push(`skinparam nodesep ${settings.nodesep}`);
  }
  if (settings.ranksep) {
    lines.push(`skinparam ranksep ${settings.ranksep}`);
  }
  if (settings.padding) {
    lines.push(`skinparam padding ${settings.padding}`);
  }
  if (settings.margin) {
    lines.push(`skinparam margin ${settings.margin}`);
  }
  if (settings.minClassWidth) {
    lines.push(`skinparam minClassWidth ${settings.minClassWidth}`);
  }
  if (settings.wrapWidth) {
    lines.push(`skinparam wrapWidth ${settings.wrapWidth}`);
  }

  if (settings.arrowColor) {
    lines.push(`skinparam ArrowColor ${settings.arrowColor}`);
  } else {
    lines.push('skinparam ArrowColor #A80036');
  }

  if (settings.arrowThickness) {
    lines.push(`skinparam ArrowThickness ${settings.arrowThickness}`);
  }

  // Background is transparent to preserve the permanent Sahara brick canvas
  lines.push('skinparam backgroundColor transparent');

  if (settings.defaultFontName) {
    lines.push(`skinparam defaultFontName ${settings.defaultFontName}`);
  }

  if (settings.defaultFontSize) {
    lines.push(`skinparam defaultFontSize ${settings.defaultFontSize}`);
  }

  if (settings.dpi) {
    lines.push(`skinparam dpi ${settings.dpi}`);
  }

  if (settings.scale) {
    if (typeof settings.scale === 'number' && settings.scale !== 1) {
      lines.push(`scale ${settings.scale}`);
    } else if (typeof settings.scale === 'string' && settings.scale.trim()) {
      lines.push(`scale ${settings.scale.trim()}`);
    }
  }

  lines.push('skinparam classAttributeIconSize 0');

  const hasC4Component = (diagram.nodes || []).some(n => n.type === 'c4-component' || n.data?.c4Type === 'component' || n.data?.c4Type === 'component-db' || n.data?.c4Type === 'component-queue');
  const hasC4Container = (diagram.nodes || []).some(n => n.type === 'c4-container' || n.data?.c4Type === 'container' || n.data?.c4Type === 'container-db' || n.data?.c4Type === 'container-queue' || n.data?.c4Type === 'container-boundary');
  const hasC4Deployment = (diagram.nodes || []).some(n => n.type === 'c4-deployment-node' || n.data?.c4Type === 'deployment-node');
  const hasC4 = (diagram.nodes || []).some(n => n.type.startsWith('c4-') || n.category === 'c4' || Boolean(n.data?.c4Type));

  const hasDomainStory = (diagram.nodes || []).some(n => n.type?.startsWith('domainstory') || n.category === 'domainstory' || Boolean(n.data?.domainStoryType));
  const hasAdaML = (diagram.nodes || []).some(n => n.type?.startsWith('adaml') || n.category === 'adaml' || Boolean(n.data?.adamlType));
  const hasAws = (diagram.nodes || []).some(n => n.category === 'aws' || n.type?.startsWith('aws-') || Boolean(n.data?.awsCategory) || n.data?.cloudProvider === 'aws');
  const hasAzure = (diagram.nodes || []).some(n => n.type?.startsWith('azure-') || n.type?.startsWith('cloud-azure') || n.data?.cloudProvider === 'azure');
  const hasGcp = (diagram.nodes || []).some(n => n.type?.startsWith('gcp-') || n.type?.startsWith('cloud-gcp') || n.data?.cloudProvider === 'gcp');
  const hasK8s = (diagram.nodes || []).some(n => n.type?.startsWith('k8s-') || n.type?.startsWith('cloud-k8s') || n.data?.cloudProvider === 'k8s');
  const hasCloudogu = (diagram.nodes || []).some(n => n.data?.cloudProvider === 'cloudogu' || n.type?.startsWith('cloud-tool'));

  if (hasC4Deployment) {
    lines.push('!include <C4/C4_Deployment>');
  } else if (hasC4Component) {
    lines.push('!include <C4/C4_Component>');
  } else if (hasC4Container) {
    lines.push('!include <C4/C4_Container>');
  } else if (hasC4) {
    lines.push('!include <C4/C4_Context>');
  }

  if (hasArchimate) {
    lines.push('!include <archimate/Archimate>');
  }

  if (hasDomainStory) {
    lines.push('!include <DomainStory/domainStory>');
  }

  if (hasAdaML) {
    lines.push('!include <AdaML/AdaML>');
  }

  if (hasAws) {
    lines.push('!include <aws/common>');
    lines.push('!include <aws/Compute/AWSLambda/AWSLambda>');
    lines.push('!include <aws/Compute/AmazonEC2/AmazonEC2>');
    lines.push('!include <aws/Database/AmazonDynamoDB/AmazonDynamoDB>');
    lines.push('!include <aws/Database/AmazonRDS/AmazonRDS>');
    lines.push('!include <aws/Storage/AmazonS3/AmazonS3>');
    lines.push('!include <aws/ApplicationServices/AmazonAPIgateway/AmazonAPIgateway>');
    lines.push('!include <aws/Messaging/AmazonSQS/AmazonSQS>');
    lines.push('!include <aws/Messaging/AmazonSNS/AmazonSNS>');
    lines.push('!include <aws/ManagementTools/AmazonCloudWatch/AmazonCloudWatch>');
    lines.push('!include <aws/Analytics/AmazonKinesis/AmazonKinesis>');
    lines.push('!include <aws/NetworkingAndContentDelivery/AmazonVPC/AmazonVPC>');
  }

  if (hasAzure) {
    lines.push('!include <azure/AzureCommon>');
    lines.push('!include <azure/Compute/AzureAppService>');
    lines.push('!include <azure/Compute/AzureFunction>');
    lines.push('!include <azure/Compute/AzureVirtualMachine>');
    lines.push('!include <azure/Databases/AzureSqlDatabase>');
    lines.push('!include <azure/Databases/AzureCosmosDb>');
    lines.push('!include <azure/Storage/AzureBlobStorage>');
    lines.push('!include <azure/Containers/AzureKubernetesService>');
    lines.push('!include <azure/Networking/AzureLoadBalancer>');
    lines.push('!include <azure/Security/AzureKeyVault>');
  }

  if (hasGcp) {
    lines.push('!include <gcp/GCPCommon>');
    lines.push('!include <gcp/ComputeEngine/ComputeEngine>');
    lines.push('!include <gcp/CloudFunctions/CloudFunctions>');
    lines.push('!include <gcp/CloudRun/CloudRun>');
    lines.push('!include <gcp/KubernetesEngine/KubernetesEngine>');
    lines.push('!include <gcp/CloudStorage/CloudStorage>');
    lines.push('!include <gcp/CloudSQL/CloudSQL>');
    lines.push('!include <gcp/BigQuery/BigQuery>');
    lines.push('!include <gcp/CloudPubSub/CloudPubSub>');
  }

  if (hasK8s) {
    lines.push('!include <kubernetes/k8s-sprites-unlabeled-256>');
  }

  if (hasCloudogu) {
    lines.push('!include <cloudogu/common>');
    lines.push('!include <cloudogu/tools/docker>');
    lines.push('!include <cloudogu/tools/k8s>');
  }
  lines.push('');

  // 2. Elements Declarations
  const isContainer = (n: DiagramNode) =>
    n.type === 'package' ||
    n.type === 'namespace' ||
    n.type === 'frame' ||
    n.type === 'folder' ||
    n.type === 'rectangle' ||
    n.category === 'container' ||
    Boolean(n.data?.isContainer) ||
    n.data?.containerType === 'frame' ||
    n.data?.containerType === 'package' ||
    n.data?.containerType === 'folder';

  const containerNodes = diagram.nodes.filter(isContainer);
  const containerChildrenMap = new Map<string, DiagramNode[]>();
  const parentContainerMap = new Map<string, string>();

  // Determine container-child hierarchy (including nested subdiagrams/subpackages)
  diagram.nodes.forEach(node => {
    // Check explicit parentId first
    if (node.data?.parentId && node.data.parentId !== node.id && containerNodes.some(c => c.id === node.data!.parentId)) {
      parentContainerMap.set(node.id, node.data.parentId);
      const list = containerChildrenMap.get(node.data.parentId) || [];
      list.push(node);
      containerChildrenMap.set(node.data.parentId, list);
      return;
    }

    let bestContainer: DiagramNode | null = null;
    let bestArea = Infinity;

    containerNodes.forEach(c => {
      if (c.id === node.id) return;
      // If node is itself a container, prevent circular nesting
      if (isContainer(node) && parentContainerMap.get(c.id) === node.id) return;

      const isEnclosed = 
        node.x >= c.x &&
        node.x + node.width <= c.x + c.width &&
        node.y >= c.y &&
        node.y + node.height <= c.y + c.height;

      if (isEnclosed) {
        const area = c.width * c.height;
        if (area < bestArea) {
          bestArea = area;
          bestContainer = c;
        }
      }
    });

    if (bestContainer) {
      parentContainerMap.set(node.id, (bestContainer as DiagramNode).id);
      const list = containerChildrenMap.get((bestContainer as DiagramNode).id) || [];
      list.push(node);
      containerChildrenMap.set((bestContainer as DiagramNode).id, list);
    }
  });

  const emitNode = (node: DiagramNode, indent = '') => {
    const startIdx = lines.length;
    emitNodeBody(node);
    if (indent) {
      for (let k = startIdx; k < lines.length; k++) {
        lines[k] = indent + lines[k];
      }
    }
  };

  const emitNodeBody = (node: DiagramNode): void => {
    const id = sanitizeId(node.id);
    const label = (node.label || id).replace(/"/g, '\\"');
    const generics = node.data?.generics ? node.data.generics : '';
    const spotStr = node.data?.spot ? ` << (${node.data.spot.character}, ${node.data.spot.colorHex}) >>` : '';
    const stereotype = node.sublabel ? ` <<${node.sublabel.replace(/[<>]/g, '')}>>` : spotStr;

    // C4 Architecture Elements (using official stdlib macros)
    if (node.type.startsWith('c4-') || node.category === 'c4' || Boolean(node.data?.c4Type)) {
      const c4Type = node.data?.c4Type || node.type.replace('c4-', '');
      const desc = node.data?.description ? `"${node.data.description.replace(/"/g, '\\"')}"` : '""';
      const tech = node.data?.technology ? `"${node.data.technology.replace(/"/g, '\\"')}"` : '""';

      if (c4Type === 'person') {
        lines.push(`Person(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'person-ext') {
        lines.push(`Person_Ext(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'system') {
        lines.push(`System(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'system-ext') {
        lines.push(`System_Ext(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'system-db') {
        lines.push(`SystemDb(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'system-queue') {
        lines.push(`SystemQueue(${id}, "${label}", ${desc})`);
      } else if (c4Type === 'container') {
        lines.push(`Container(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'container-ext') {
        lines.push(`Container_Ext(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'container-db') {
        lines.push(`ContainerDb(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'container-queue') {
        lines.push(`ContainerQueue(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'component') {
        lines.push(`Component(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'component-ext') {
        lines.push(`Component_Ext(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'component-db') {
        lines.push(`ComponentDb(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'component-queue') {
        lines.push(`ComponentQueue(${id}, "${label}", ${tech}, ${desc})`);
      } else if (c4Type === 'deployment-node') {
        lines.push(`Deployment_Node(${id}, "${label}", ${tech || '"Host Instance"'})`);
      } else if (c4Type === 'boundary' || c4Type === 'system-boundary') {
        lines.push(`System_Boundary(${id}, "${label}")`);
      } else {
        lines.push(`System(${id}, "${label}", ${desc})`);
      }
      return;
    }

    // ArchiMate Layer Elements (using official stdlib macros or layer syntax)
    if (node.category === 'archimate' || Boolean(node.data?.archimateLayer)) {
      const layer = (node.data?.archimateLayer || 'business').toLowerCase();
      const element = (node.data?.archimateElement || 'actor').toLowerCase();
      const capLayer = layer.charAt(0).toUpperCase() + layer.slice(1);
      const capElement = element.charAt(0).toUpperCase() + element.slice(1);
      lines.push(`${capLayer}_${capElement}(${id}, "${label}")`);
      return;
    }

    // DomainStory Elements (stdlib/DomainStory)
    if (node.category === 'domainstory' || Boolean(node.data?.domainStoryType) || node.type.startsWith('domainstory-')) {
      const dsType = (node.data?.domainStoryType || node.type.replace('domainstory-', '')).toLowerCase();
      const capType = dsType.charAt(0).toUpperCase() + dsType.slice(1);
      lines.push(`${capType}(${id}, "${label}")`);
      return;
    }

    // AdaML Elements (stdlib/adaml)
    if (node.category === 'adaml' || Boolean(node.data?.adamlType) || node.type.startsWith('adaml-')) {
      const adamlType = node.data?.adamlType || node.type.replace('adaml-', '');
      if (adamlType === 'package-spec') {
        lines.push(`begin_package_spec("${label}")`);
      } else if (adamlType === 'subprogram') {
        lines.push(`subprogram("${label}")`);
      } else if (adamlType === 'package-body') {
        lines.push(`package("${label}")`);
      } else if (adamlType === 'agent') {
        lines.push(`agent ${id} as "${label}"`);
      } else if (adamlType === 'actor') {
        lines.push(`actor ${id} as "${label}"`);
      } else {
        lines.push(`subprogram("${label}")`);
      }
      return;
    }

    // AWS Cloud Elements (stdlib/aws)
    if (node.category === 'aws' || node.type.startsWith('aws-') || (node.data?.cloudProvider === 'aws' && node.data?.cloudService)) {
      const svc = (node.data?.cloudService || node.label).toLowerCase();
      if (svc.includes('lambda')) {
        lines.push(`AWSLAMBDA(${id}, "${label}")`);
      } else if (svc.includes('dynamo')) {
        lines.push(`AMAZONDYNAMODB(${id}, "${label}")`);
      } else if (svc.includes('rds')) {
        lines.push(`AMAZONRDS(${id}, "${label}")`);
      } else if (svc.includes('s3')) {
        lines.push(`AMAZONS3(${id}, "${label}")`);
      } else if (svc.includes('ec2')) {
        lines.push(`AMAZONEC2(${id}, "${label}")`);
      } else if (svc.includes('vpc')) {
        lines.push(`AMAZONVPC(${id}, "${label}")`);
      } else if (svc.includes('api') || svc.includes('gateway')) {
        lines.push(`AMAZONAPIGATEWAY(${id}, "${label}")`);
      } else if (svc.includes('sqs')) {
        lines.push(`AMAZONSQS(${id}, "${label}")`);
      } else if (svc.includes('sns')) {
        lines.push(`AMAZONSNS(${id}, "${label}")`);
      } else if (svc.includes('cloudwatch')) {
        lines.push(`AMAZONCLOUDWATCH(${id}, "${label}")`);
      } else if (svc.includes('kinesis')) {
        lines.push(`AMAZONKINESIS(${id}, "${label}")`);
      } else {
        const cat = node.data?.awsCategory || 'Compute';
        lines.push(`rectangle "==${label}\\n<size:10>[AWS ${cat}]</size>" as ${id} <<AWS>>`);
      }
      return;
    }

    // Azure Cloud Elements (stdlib/azure)
    if (node.type.startsWith('azure-') || node.type.startsWith('cloud-azure') || node.data?.cloudProvider === 'azure' || (node.category === 'cloud' && node.label.toLowerCase().startsWith('azure'))) {
      const svc = (node.data?.cloudService || node.label).toLowerCase();
      const tech = node.data?.technology ? `"${node.data.technology.replace(/"/g, '\\"')}"` : '""';
      const desc = node.data?.description ? `"${node.data.description.replace(/"/g, '\\"')}"` : '""';

      if (svc.includes('function')) {
        lines.push(`AzureFunction(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('sql')) {
        lines.push(`AzureSqlDatabase(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('cosmos')) {
        lines.push(`AzureCosmosDb(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('blob') || svc.includes('storage')) {
        lines.push(`AzureBlobStorage(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('aks') || svc.includes('kubernetes')) {
        lines.push(`AzureKubernetesService(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('loadbalancer') || svc.includes('load_balancer')) {
        lines.push(`AzureLoadBalancer(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('keyvault') || svc.includes('vault')) {
        lines.push(`AzureKeyVault(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('vm') || svc.includes('virtualmachine')) {
        lines.push(`AzureVirtualMachine(${id}, "${label}", ${tech}, ${desc})`);
      } else {
        lines.push(`AzureAppService(${id}, "${label}", ${tech}, ${desc})`);
      }
      return;
    }

    // GCP Cloud Elements (stdlib/gcp)
    if (node.type.startsWith('gcp-') || node.type.startsWith('cloud-gcp') || node.data?.cloudProvider === 'gcp' || (node.category === 'cloud' && node.label.toLowerCase().startsWith('gcp'))) {
      const svc = (node.data?.cloudService || node.label).toLowerCase();
      const tech = node.data?.technology ? `"${node.data.technology.replace(/"/g, '\\"')}"` : '""';
      const desc = node.data?.description ? `"${node.data.description.replace(/"/g, '\\"')}"` : '""';

      if (svc.includes('run')) {
        lines.push(`GCP_CloudRun(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('function')) {
        lines.push(`GCP_CloudFunctions(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('gke') || svc.includes('kubernetes')) {
        lines.push(`GCP_GKE(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('storage') || svc.includes('bucket')) {
        lines.push(`GCP_CloudStorage(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('sql')) {
        lines.push(`GCP_CloudSQL(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('bigquery')) {
        lines.push(`GCP_BigQuery(${id}, "${label}", ${tech}, ${desc})`);
      } else if (svc.includes('pubsub') || svc.includes('pub_sub')) {
        lines.push(`GCP_PubSub(${id}, "${label}", ${tech}, ${desc})`);
      } else {
        lines.push(`GCP_ComputeEngine(${id}, "${label}", ${tech}, ${desc})`);
      }
      return;
    }

    // Kubernetes Elements (stdlib/kubernetes)
    if (node.type.startsWith('k8s-') || node.type.startsWith('cloud-k8s') || node.data?.cloudProvider === 'k8s') {
      const kind = (node.data?.cloudService || node.label).toLowerCase();
      const desc = node.data?.description ? `"${node.data.description.replace(/"/g, '\\"')}"` : '""';

      if (kind.includes('svc') || kind.includes('service')) {
        lines.push(`k8s_service(${id}, "${label}", ${desc})`);
      } else if (kind.includes('deploy')) {
        lines.push(`k8s_deploy(${id}, "${label}", ${desc})`);
      } else if (kind.includes('ingress')) {
        lines.push(`k8s_ingress(${id}, "${label}", ${desc})`);
      } else if (kind.includes('cm') || kind.includes('config')) {
        lines.push(`k8s_cm(${id}, "${label}", ${desc})`);
      } else if (kind.includes('secret')) {
        lines.push(`k8s_secret(${id}, "${label}", ${desc})`);
      } else if (kind.includes('pv') || kind.includes('pvc')) {
        lines.push(`k8s_pv(${id}, "${label}", ${desc})`);
      } else {
        lines.push(`k8s_pod(${id}, "${label}", ${desc})`);
      }
      return;
    }

    // Cloudogu Tools (stdlib/cloudogu)
    if (node.data?.cloudProvider === 'cloudogu' || node.type.startsWith('cloud-tool')) {
      const tool = (node.data?.cloudService || node.label).toUpperCase();
      lines.push(`${tool}(${id}, "${label}")`);
      return;
    }

    // Embedded Sub-engines (Salt, Ditaa, Math)
    if (node.type === 'embedded-salt' || node.data?.embeddedType === 'salt') {
      const content = node.data?.saltContent || node.data?.embeddedContent || '{\n  <b>Login Screen</b>\n  Username: | "admin"\n  [Submit] | [Cancel]\n}';
      lines.push(`card "${label}" as ${id} <<salt>>`);
      lines.push(`note bottom of ${id}`);
      lines.push('  {{');
      lines.push('    salt');
      lines.push(content.split('\n').map(l => `    ${l}`).join('\n'));
      lines.push('  }}');
      lines.push('end note');
      return;
    }

    if (node.type === 'embedded-ditaa' || node.data?.embeddedType === 'ditaa') {
      const content = node.data?.embeddedContent || '+---+   +---+\n| A |-->| B |\n+---+   +---+';
      lines.push(`card "${label}" as ${id}`);
      lines.push(`note bottom of ${id}`);
      lines.push('  {{');
      lines.push('    ditaa');
      lines.push(content.split('\n').map(l => `    ${l}`).join('\n'));
      lines.push('  }}');
      lines.push('end note');
      return;
    }

    if (node.type === 'embedded-math' || node.data?.embeddedType === 'math') {
      const formula = node.data?.mathFormula || node.data?.embeddedContent || 'E = mc^2';
      lines.push(`card "${label}\\n<math>${formula}</math>" as ${id} <<math>>`);
      return;
    }

    if (node.type === 'wbs-node' || node.category === 'wbs') {
      const code = node.data?.wbsCode ? `[${node.data.wbsCode}] ` : '';
      const progress = node.data?.wbsProgress ? `\\n<size:10>Progress: ${node.data.wbsProgress}%</size>` : '';
      lines.push(`rectangle "${code}<b>${label}</b>${progress}" as ${id} <<wbs>>`);
      return;
    }

    // Interactive JSON block
    if (node.type === 'data-json' || node.type === 'json') {
      let content = '{}';
      try {
        content = JSON.stringify(JSON.parse(node.data?.treeContent || '{}'), null, 2);
      } catch {
        content = node.data?.treeContent || '{}';
      }
      lines.push(`json ${id} {`);
      lines.push(content.split('\n').map(l => `  ${l}`).join('\n'));
      lines.push('}');
      return;
    }

    // Interactive YAML block (rendered as clean rectangle with YAML badge in standard UML)
    if (node.type === 'data-yaml' || node.type === 'yaml') {
      const rawYml = node.data?.treeContent || 'key: value';
      const escapedYml = rawYml.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      lines.push(`rectangle "<b>${label}</b>\\n----\\n${escapedYml}" as ${id} <<YAML>>`);
      return;
    }

    // Map Dictionary Table (key => value)
    if (node.type === 'map' || node.data?.mapEntries) {
      lines.push(`map "${label}" as ${id}${stereotype} {`);
      const entries = node.data?.mapEntries || [];
      entries.forEach(e => lines.push(`  ${e.key} => ${e.value}`));
      lines.push('}');
      return;
    }

    // Relational Database Table (Entity with Crow's Foot)
    if (node.type === 'entity' || node.type === 'er-table' || node.category === 'data-schema') {
      const tableName = node.data?.tableName || label;
      lines.push(`entity "${tableName}" as ${id}${stereotype} {`);
      const cols = node.data?.columns || [];
      const pkCols = cols.filter(c => c.isPk);
      const nonPkCols = cols.filter(c => !c.isPk);

      pkCols.forEach(c => {
        const uq = c.isUnique ? ' <<UNIQUE>>' : '';
        lines.push(`  * ${c.name} : ${c.type}${uq} <<PK>>`);
      });

      if (pkCols.length > 0 && nonPkCols.length > 0) {
        lines.push('  --');
      }

      nonPkCols.forEach(c => {
        const marker = c.isFk ? '# ' : '  ';
        const uq = c.isUnique ? ' <<UNIQUE>>' : '';
        const fk = c.isFk ? ' <<FK>>' : '';
        lines.push(`  ${marker}${c.name} : ${c.type}${fk}${uq}`);
      });

      lines.push('}');
      return;
    }

    // Object Instance
    if (node.type === 'object') {
      const clsName = node.data?.className ? ` : ${node.data.className}` : '';
      lines.push(`object "${label}${clsName}" as ${id}${stereotype} {`);
      const slots = node.data?.slots || [];
      slots.forEach(s => lines.push(`  ${s.key} = ${s.value}`));
      lines.push('}');
      return;
    }

    // Code & OO Classifiers (class, abstract class, interface, enum, struct, protocol, exception)
    if (
      node.category === 'code' || 
      ['class', 'abstract-class', 'interface', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass'].includes(node.type)
    ) {
      let kw = 'class';
      if (node.type === 'interface') kw = 'interface';
      else if (node.type === 'abstract-class') kw = 'abstract class';
      else if (node.type === 'enum') kw = 'enum';
      else if (node.type === 'struct') kw = 'struct';
      else if (node.type === 'protocol') kw = 'protocol';
      else if (node.type === 'exception') kw = 'exception';
      else if (node.type === 'annotation') kw = 'annotation';
      else if (node.type === 'metaclass') kw = 'metaclass';

      lines.push(`${kw} "${label}${generics}" as ${id}${stereotype} {`);
      if (node.data?.attributes && node.data.attributes.length > 0) {
        node.data.attributes.forEach(attr => lines.push(`  ${attr}`));
      }
      if (node.data?.methods && node.data.methods.length > 0) {
        lines.push('  --');
        node.data.methods.forEach(m => lines.push(`  ${m}`));
      }
      lines.push('}');
      return;
    }

    // Boundary & Grouping Containers (package, namespace, frame, folder, rectangle)
    if (
      node.type === 'package' || 
      node.type === 'namespace' || 
      node.type === 'frame' || 
      node.type === 'folder' || 
      node.type === 'rectangle' || 
      node.category === 'container' || 
      Boolean(node.data?.isContainer) || 
      node.data?.containerType === 'frame' ||
      node.data?.containerType === 'package' ||
      node.data?.shape === 'package' ||
      node.data?.shape === 'frame'
    ) {
      let kw = 'package';
      if (node.type === 'frame' || node.data?.containerType === 'frame' || node.data?.shape === 'frame') {
        kw = 'frame';
      } else if (node.type === 'folder' || node.data?.containerType === 'folder' || node.data?.shape === 'folder') {
        kw = 'folder';
      } else if (node.type === 'namespace' || node.data?.containerType === 'namespace') {
        kw = 'namespace';
      } else if (node.type === 'rectangle' || node.data?.containerType === 'rectangle') {
        kw = 'rectangle';
      } else if (node.type === 'node' || node.data?.containerType === 'node') {
        kw = 'node';
      }

      let frameTitle = label;
      if (node.data?.frameKind) {
        const condStr = node.data.condition ? `[${node.data.condition}]` : '';
        frameTitle = `${node.data.frameKind} ${condStr} ${label}`.replace(/\s+/g, ' ').trim();
      }

      lines.push(`${kw} "${frameTitle}" as ${id}${stereotype} {`);
      const children = containerChildrenMap.get(node.id) || [];
      children.forEach(child => emitNode(child, '  '));
      lines.push('}');
      return;
    }

    // Notes (single-line or multiline)
    if (node.type === 'note' || node.data?.shape === 'note') {
      const noteContent = node.data?.noteText || node.data?.description || label;
      if (noteContent.includes('\n')) {
        lines.push(`note as ${id}`);
        noteContent.split('\n').forEach(l => lines.push(`  ${l}`));
        lines.push('end note');
      } else {
        lines.push(`note "${noteContent.replace(/"/g, '\\"')}" as ${id}`);
      }
      return;
    }

    // Specific Shape Keywords
    switch (node.type) {
      case 'node':
        lines.push(`node "${label}" as ${id}${stereotype}`);
        break;
      case 'database':
        lines.push(`database "${label}" as ${id}${stereotype}`);
        break;
      case 'storage':
        lines.push(`storage "${label}" as ${id}${stereotype}`);
        break;
      case 'cloud':
      case 'cloud-aws':
      case 'cloud-gcp':
      case 'cloud-azure':
      case 'cloud-k8s':
        lines.push(`cloud "${label}" as ${id}${stereotype}`);
        break;
      case 'queue':
        lines.push(`queue "${label}" as ${id}${stereotype}`);
        break;
      case 'stack':
        lines.push(`stack "${label}" as ${id}${stereotype}`);
        break;
      case 'artifact':
        lines.push(`artifact "${label}" as ${id}${stereotype}`);
        break;
      case 'file':
        lines.push(`file "${label}" as ${id}${stereotype}`);
        break;
      case 'card':
        lines.push(`card "${label}" as ${id}${stereotype}`);
        break;
      case 'hexagon':
        lines.push(`hexagon "${label}" as ${id}${stereotype}`);
        break;
      case 'collections':
        lines.push(`collections "${label}" as ${id}${stereotype}`);
        break;
      case 'boundary':
        lines.push(`boundary "${label}" as ${id}${stereotype}`);
        break;
      case 'control':
        lines.push(`control "${label}" as ${id}${stereotype}`);
        break;
      case 'entity-circle':
        lines.push(`entity "${label}" as ${id}${stereotype}`);
        break;
      case 'interface-lollipop':
        lines.push(`() "${label}" as ${id}`);
        break;
      case 'participant':
        lines.push(`participant "${label}" as ${id}${stereotype}`);
        break;
      case 'actor':
        lines.push(`actor "${label}" as ${id}${stereotype}`);
        break;
      case 'agent':
        lines.push(`agent "${label}" as ${id}${stereotype}`);
        break;
      case 'component':
        lines.push(`component "${label}" as ${id}${stereotype}`);
        break;
      case 'usecase':
        lines.push(`usecase "${label}" as ${id}${stereotype}`);
        break;
      case 'state':
        if (node.data?.attributes && node.data.attributes.length > 0) {
          lines.push(`state "${label}" as ${id}${stereotype} {`);
          node.data.attributes.forEach(attr => lines.push(`  ${attr}`));
          lines.push('}');
        } else {
          lines.push(`state "${label}" as ${id}${stereotype}`);
        }
        break;
      case 'state-history':
        const hTag = node.label === '[H*]' || node.data?.isDeep ? '[H*]' : '[H]';
        lines.push(`state "${hTag}" as ${id}`);
        break;
      case 'activity-start':
        lines.push(`circle "${label}" as ${id} <<start>>`);
        break;
      case 'activity-stop':
        lines.push(`circle "${label}" as ${id} <<stop>>`);
        break;
      case 'activity-flow-final':
        lines.push(`circle "${label}" as ${id} <<flowfinal>>`);
        break;
      case 'activity-decision':
        lines.push(`diamond "${label}" as ${id}`);
        break;
      case 'activity-fork':
        lines.push(`state " " as ${id} <<fork>>`);
        break;
      default:
        lines.push(`rectangle "${label}" as ${id}${stereotype}`);
        break;
    }
  };

  diagram.nodes.forEach(node => {
    if (parentContainerMap.has(node.id)) return;
    emitNode(node, '');
  });

  lines.push('');

  // 3. Connectors & Relationships
  diagram.edges.forEach(edge => {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const srcCard = edge.cardinalitySource ? `"${edge.cardinalitySource}" ` : '';
    const tgtCard = edge.cardinalityTarget ? ` "${edge.cardinalityTarget}"` : '';
    const readingDir = edge.readingDirection ? ` ${edge.readingDirection}` : '';
    const label = edge.label ? ` : ${edge.label}${readingDir}` : '';

    // Arrow length dashes
    const dashLen = edge.length || (edge.style === 'dashed' ? 2 : 2);
    const dashChar = edge.style === 'dashed' || edge.style === 'dotted' ? '.' : '-';
    const mainDashes = dashChar.repeat(Math.max(1, dashLen));

    // Direction hint (e.g. -up->, -down->, -left->, -right->)
    let dirTag = '';
    if (edge.directionHint) {
      dirTag = edge.directionHint[0]; // 'u', 'd', 'l', 'r'
    } else if (edge.sourceHandle && edge.targetHandle) {
      if (edge.sourceHandle === 'top' && edge.targetHandle === 'bottom') dirTag = 'u';
      else if (edge.sourceHandle === 'bottom' && edge.targetHandle === 'top') dirTag = 'd';
      else if (edge.sourceHandle === 'left' && edge.targetHandle === 'right') dirTag = 'l';
      else if (edge.sourceHandle === 'right' && edge.targetHandle === 'left') dirTag = 'r';
    }

    // Color tag (e.g. -[#0000FF]-> or -[#c2652a,bold]->)
    let colorTag = '';
    if (edge.color) {
      const boldStyle = edge.style === 'thick' ? ',bold' : '';
      colorTag = `[${edge.color}${boldStyle}]`;
    }

    let arrow = '-->';

    switch (edge.arrowType) {
      // Crow's Foot & ER
      case 'crows-foot-one':
        arrow = '||--||';
        break;
      case 'crows-foot-many':
        arrow = '||--|{';
        break;
      case 'crows-foot-zero-many':
        arrow = '||--o{';
        break;
      case 'crows-foot-zero-one':
        arrow = '||--o|';
        break;
      case 'crows-foot-many-many':
        arrow = '}|--|{';
        break;
      case 'crows-foot-zero-zero':
        arrow = '}o--o{';
        break;
      case 'crows-foot-opt-opt':
        arrow = '|o--o|';
        break;

      // OOP Relationships
      case 'inheritance':
        arrow = dirTag || colorTag ? `-${colorTag}${dirTag}-|>` : '--|>';
        break;
      case 'realization':
        arrow = dirTag || colorTag ? `.${colorTag}${dirTag}.|>` : '..|>';
        break;
      case 'composition':
        arrow = dirTag || colorTag ? `*${colorTag}-${dirTag}-` : '*--';
        break;
      case 'aggregation':
        arrow = dirTag || colorTag ? `o${colorTag}-${dirTag}-` : 'o--';
        break;
      case 'nesting':
        arrow = dirTag ? `+${colorTag}-${dirTag}-` : '+--';
        break;
      case 'cancellation':
        arrow = dirTag ? `x${colorTag}-${dirTag}-` : 'x--';
        break;
      case 'socket-ball':
        arrow = '-0)';
        break;
      case 'lollipop':
        arrow = '()--';
        break;
      case 'dependency':
        arrow = dirTag || colorTag ? `.${colorTag}${dirTag}.>` : '..>';
        break;
      case 'bi-arrow':
        arrow = dirTag || colorTag ? `<-${colorTag}${dirTag}->` : '<-->';
        break;
      case 'none':
        arrow = dirTag || colorTag ? `-${colorTag}${dirTag}-` : '--';
        break;
      default:
        if (dirTag || colorTag) {
          arrow = `-${colorTag}${dirTag}->`;
        } else if (edge.style === 'dashed' || edge.style === 'dotted') {
          arrow = '..>';
        } else if (edge.style === 'thick') {
          arrow = '==>';
        } else {
          arrow = '-->';
        }
        break;
    }

    lines.push(`${src} ${srcCard}${arrow}${tgtCard} ${tgt}${label}`);
  });

  lines.push('');
  lines.push('@enduml');
  return lines.join('\n');
}

/**
 * Helper to parse sequence diagrams from PlantUML text
 */
function parseSequencePlantUML(lines: string[], defaultTitle: string): Partial<DiagramData> {
  const participants: SequenceParticipant[] = [];
  const participantMap = new Map<string, SequenceParticipant>();
  const messages: SequenceMessage[] = [];
  const blocks: SequenceBlock[] = [];
  let currentBlock: { type: string; label: string; condition?: string; startOrder: number } | null = null;
  let title = defaultTitle;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("'") || line.startsWith('@') || line.startsWith('!') || line.toLowerCase() === 'autonumber') {
      continue;
    }

    // Title directive
    const titleMatch = line.match(/^title\s+(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    // Skip skinparam
    if (line.startsWith('skinparam')) continue;

    // Participant declarations: actor "User" as user, participant "API" as api, database "DB" as db, queue "MQ" as mq
    const partMatch = line.match(/^(actor|participant|database|boundary|control|entity|queue|collections)\s+(?:"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)(?:\s+<<([^>]+)>>)?(?:\s+(#[a-fA-F0-9]{3,6}))?/i);
    if (partMatch) {
      const typeStr = partMatch[1].toLowerCase();
      const name = partMatch[2] || partMatch[4];
      const id = sanitizeId(partMatch[3] || partMatch[5] || partMatch[4]);
      const stereotype = partMatch[6]?.trim();
      const color = partMatch[7]?.trim() || 'sand';
      if (!participantMap.has(id)) {
        const p: SequenceParticipant = { 
          id, 
          name, 
          type: typeStr, 
          color,
          stereotype: stereotype ? `«${stereotype}»` : undefined
        };
        participants.push(p);
        participantMap.set(id, p);
      }
      continue;
    }

    // Block start: alt [condition] label OR opt label OR loop label
    const blockMatch = line.match(/^(alt|opt|loop|group|critical|par)(?:\s+\[([^\]]+)\])?(?:\s+(.+))?/i);
    if (blockMatch) {
      const bType = blockMatch[1].toLowerCase();
      const condition = blockMatch[2]?.trim();
      const label = blockMatch[3]?.trim() || '';
      currentBlock = {
        type: bType,
        condition,
        label,
        startOrder: messages.length + 1
      };
      continue;
    }

    // Block end: end
    if (line.toLowerCase() === 'end' && currentBlock) {
      blocks.push({
        id: `block_${blocks.length + 1}`,
        type: currentBlock.type as any,
        condition: currentBlock.condition,
        label: currentBlock.label,
        startOrder: currentBlock.startOrder,
        endOrder: Math.max(currentBlock.startOrder, messages.length)
      });
      currentBlock = null;
      continue;
    }

    // Activation commands
    const actMatch = line.match(/^(activate|deactivate)\s+([a-zA-Z0-9_]+)/i);
    if (actMatch) {
      continue;
    }

    // Notes: note over User, Client : label
    const noteMatch = line.match(/^note\s+(left\s+of|right\s+of|over)\s+([^:]+)(?:\s*:\s*(.+))?/i);
    if (noteMatch) {
      if (messages.length > 0) {
        messages[messages.length - 1].noteText = noteMatch[3]?.trim() || '';
      }
      continue;
    }

    // Messages: Alice -> Bob : message OR Alice --> Bob : reply OR Alice ->> Bob : async OR Bob <- Alice : reply
    // Also supports quoted participants: "Web App" -> "API Gateway" : req
    const msgMatch = line.match(/^("[^"]+"|`[^`]+`|[a-zA-Z0-9_]+)\s*(->>|-->|->|<<-|--<|<-)\s*("[^"]+"|`[^`]+`|[a-zA-Z0-9_]+)(?:\s*:\s*(.+))?/);
    if (msgMatch) {
      let rawFrom = msgMatch[1].replace(/^["`]|["`]$/g, '').trim();
      let rawTo = msgMatch[3].replace(/^["`]|["`]$/g, '').trim();
      const arrow = msgMatch[2];
      const isReverse = arrow.startsWith('<');
      if (isReverse) {
        const temp = rawFrom;
        rawFrom = rawTo;
        rawTo = temp;
      }
      const from = sanitizeId(rawFrom);
      const to = sanitizeId(rawTo);
      const label = msgMatch[4]?.trim() || '';
      const mType = (arrow === '-->' || arrow === '--<') ? 'reply' : ((arrow === '->>' || arrow === '<<-') ? 'async' : 'sync');

      // Ensure participants exist
      if (!participantMap.has(from)) {
        const p: SequenceParticipant = { id: from, name: rawFrom, type: 'participant', color: 'sienna' };
        participants.push(p);
        participantMap.set(from, p);
      }
      if (!participantMap.has(to)) {
        const p: SequenceParticipant = { id: to, name: rawTo, type: 'participant', color: 'sienna' };
        participants.push(p);
        participantMap.set(to, p);
      }

      messages.push({
        id: `msg_${messages.length + 1}`,
        from,
        to,
        label,
        type: mType,
        order: messages.length + 1
      });
      continue;
    }
  }

  // Finalize any unclosed sequence block
  if (currentBlock) {
    blocks.push({
      id: `block_${blocks.length + 1}`,
      type: currentBlock.type as any,
      condition: currentBlock.condition,
      label: currentBlock.label,
      startOrder: currentBlock.startOrder,
      endOrder: Math.max(currentBlock.startOrder, messages.length)
    });
    currentBlock = null;
  }

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  participants.forEach((p, idx) => {
    let resolvedShape: DiagramNode['data']['shape'] = 'rounded';
    if (p.type === 'actor') resolvedShape = 'actor';
    else if (p.type === 'database') resolvedShape = 'cylinder';
    else if (p.type === 'queue') resolvedShape = 'queue';
    else if (p.type === 'boundary') resolvedShape = 'boundary';
    else if (p.type === 'control') resolvedShape = 'control';
    else if (p.type === 'entity') resolvedShape = 'entity-circle';
    else if (p.type === 'collections') resolvedShape = 'collections';

    const node: DiagramNode = {
      id: p.id,
      type: p.type || 'participant',
      category: 'sequence',
      label: p.name,
      sublabel: p.stereotype,
      x: 80 + idx * 220,
      y: 100,
      width: 160,
      height: 70,
      color: p.color || 'sand',
      data: {
        shape: resolvedShape
      }
    };
    nodes.push(node);
  });

  messages.forEach((msg, idx) => {
    const isReply = msg.type === 'reply';
    const isAsync = msg.type === 'async';
    const edge: DiagramEdge = {
      id: msg.id || `edge_seq_${idx + 1}`,
      source: msg.from,
      target: msg.to,
      label: `${msg.order}: ${msg.label}`,
      style: isReply ? 'dashed' : 'solid',
      arrowType: 'arrow',
      color: isAsync ? '#d97706' : isReply ? '#64748b' : '#A80036'
    };
    edges.push(edge);
  });

  blocks.forEach((block, idx) => {
    const involvedMsg = messages.filter(m => m.order >= block.startOrder && m.order <= block.endOrder);
    const involvedPIds = new Set<string>();
    involvedMsg.forEach(m => { involvedPIds.add(m.from); involvedPIds.add(m.to); });
    const involvedNodes = nodes.filter(n => involvedPIds.has(n.id));

    let minX = 60;
    let maxX = Math.max(400, 80 + (participants.length - 1) * 220 + 180);
    if (involvedNodes.length > 0) {
      minX = Math.min(...involvedNodes.map(n => n.x)) - 30;
      maxX = Math.max(...involvedNodes.map(n => n.x + n.width)) + 30;
    }

    const frameNode: DiagramNode = {
      id: block.id || `frame_${block.type}_${idx + 1}`,
      type: 'frame',
      category: 'container',
      label: block.label || `${block.type.toUpperCase()} block`,
      color: 'slate',
      x: minX,
      y: 60,
      width: Math.max(340, maxX - minX),
      height: 220,
      data: {
        isContainer: true,
        containerType: 'frame',
        frameKind: block.type,
        condition: block.condition,
        shape: 'frame'
      }
    };
    nodes.unshift(frameNode);
  });

  return {
    title: title || 'Sequence Diagram',
    type: 'sequence',
    nodes,
    edges,
    participants,
    messages,
    blocks
  };
}

/**
 * 1-1 PlantUML Parser
 * Parses valid PlantUML script into DiagramData with automatic layout calculation
 */
export function parsePlantUML(text: string): Partial<DiagramData> {
  // Pre-process: strip block comments /' ... '/
  const cleanText = text.replace(/\/'[\s\S]*?'\//g, '');
  const lines = cleanText.split('\n');

  // Detect if script is sequence diagram
  // A diagram is structural if it contains class/component/state block definitions, C4 macros, or ERD relationships
  const hasStructuralBlocks = /\b(class|interface|abstract\s+class|enum|struct|component|usecase|package|namespace|state|archimate)\s+[^{\n]*\{/i.test(cleanText) ||
    /\b(Person|System|Container|Component|Rel)\s*\(/i.test(cleanText) ||
    /(\|\|--|\}--|--\|\{|\*--|o--|<\|--|--\|>|\.\.\|\>)/.test(cleanText);

  const hasExplicitSequenceConstructs = 
    cleanText.includes('autonumber') || 
    /\bparticipant\s+/i.test(cleanText) ||
    /\b(activate|deactivate)\b/i.test(cleanText) ||
    /^\s*(alt|opt|loop|par|critical)\b/im.test(cleanText) ||
    /^\s*("[^"]+"|`[^`]+`|[a-zA-Z0-9_]+)\s*(->>|-->|->|<<-|--<|<-)\s*("[^"]+"|`[^`]+`|[a-zA-Z0-9_]+)\s*:/im.test(cleanText);

  const isSequence = !hasStructuralBlocks && hasExplicitSequenceConstructs;

  if (isSequence) {
    return parseSequencePlantUML(lines, 'Sequence Diagram');
  }

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const nodeMap = new Map<string, DiagramNode>();

  let title = 'PlantUML Diagram';
  const settings: GlobalCanvasSettings = {
    direction: 'TB',
    linetype: 'ortho',
    monochrome: false,
    handwritten: false,
    shadowing: false
  };

  interface ParserBlock {
    type: string;
    id: string;
    label: string;
    generics?: string;
    stereotype?: string;
    spot?: { character: string; colorHex: string };
    parentId?: string;
    isContainer: boolean;
    lines: string[];
  }

  const CONTAINER_TYPES = new Set([
    'package', 'namespace', 'frame', 'folder', 'rectangle', 'node', 'cloud', 'group',
    'alt', 'opt', 'loop', 'par', 'critical',
    'system_boundary', 'container_boundary', 'enterprise_boundary', 'boundary',
    'c4-boundary', 'c4-deployment-node'
  ]);

  const blockStack: ParserBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (
      !rawLine || 
      rawLine.startsWith("'") || 
      rawLine.startsWith('!') || 
      rawLine.startsWith('@') || 
      rawLine.toLowerCase() === 'allowmixing'
    ) continue;

    // Check title directive
    const titleMatch = rawLine.match(/^title\s+(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    // Check direction directives
    if (rawLine.includes('left to right direction')) {
      settings.direction = 'LR';
      continue;
    }
    if (rawLine.includes('top to bottom direction')) {
      settings.direction = 'TB';
      continue;
    }

    // Check skinparam directives
    if (rawLine.includes('skinparam linetype ortho')) settings.linetype = 'ortho';
    if (rawLine.includes('skinparam linetype polyline')) settings.linetype = 'polyline';
    if (rawLine.includes('skinparam monochrome true')) settings.monochrome = true;
    if (rawLine.includes('skinparam handwritten true')) settings.handwritten = true;
    if (rawLine.includes('skinparam shadowing true')) settings.shadowing = true;

    const currentBlock = blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;

    // Inside a multi-line LEAF block (e.g. entity, class, map, object, state, json, yaml)
    if (currentBlock && !currentBlock.isContainer) {
      if (rawLine === '}' || rawLine.endsWith('}')) {
        blockStack.pop();
        finishBlock(currentBlock, nodes, nodeMap);
      } else {
        currentBlock.lines.push(rawLine);
      }
      continue;
    }

    // Inside a CONTAINER block, check if this line closes the container
    if (currentBlock && currentBlock.isContainer && (rawLine === '}' || rawLine.endsWith('}'))) {
      blockStack.pop();
      finishBlock(currentBlock, nodes, nodeMap);
      continue;
    }

    // Check for block start:
    // class "Name<T>" as id <<stereotype>> { OR struct Name { OR frame "Name" as id { OR frame "Name" {
    const blockStartMatch = rawLine.match(/^(class|abstract\s+class|interface|enum|annotation|struct|protocol|exception|metaclass|entity|object|map|package|namespace|frame|folder|node|component|database|json|yaml|state|rectangle|cloud|group|alt|opt|loop|par|critical)\s+(?:"([^"]+)"(?:\s+as\s+([a-zA-Z0-9_]+))?|([a-zA-Z0-9_]+)(?:<([^>]+)>)?(?:\s+as\s+([a-zA-Z0-9_]+))?)(?:\s*<<\s*(?:\(([A-Z]),\s*(#[a-fA-F0-9]{3,6})\)\s*)?([^>]*)>>)?\s*\{/i);
    if (blockStartMatch) {
      const type = blockStartMatch[1].toLowerCase().replace(/\s+/, '-');
      const label = blockStartMatch[2] || blockStartMatch[4];
      const generics = blockStartMatch[5] ? `<${blockStartMatch[5]}>` : undefined;
      const id = blockStartMatch[3] || blockStartMatch[6] || blockStartMatch[4] || label;
      const spotChar = blockStartMatch[7];
      const spotColor = blockStartMatch[8];
      const stereotype = blockStartMatch[9]?.trim();
      const isContainer = CONTAINER_TYPES.has(type);

      const newBlock: ParserBlock = {
        type,
        id: sanitizeId(id),
        label,
        generics,
        stereotype,
        spot: spotChar && spotColor ? { character: spotChar, colorHex: spotColor } : undefined,
        parentId: currentBlock ? currentBlock.id : undefined,
        isContainer,
        lines: []
      };
      blockStack.push(newBlock);
      continue;
    }

    // 1. C4 Macro Definitions (stdlib/C4)
    // Person(id, "Label", "Desc"), Container(id, "Label", "Tech", "Desc"), SystemDb, Deployment_Node, etc.
    const c4Match = rawLine.match(/^(Person|Person_Ext|System|System_Ext|SystemDb|SystemDb_Ext|SystemQueue|SystemQueue_Ext|Container|Container_Ext|ContainerDb|ContainerDb_Ext|ContainerQueue|ContainerQueue_Ext|Component|Component_Ext|ComponentDb|ComponentDb_Ext|ComponentQueue|ComponentQueue_Ext|Deployment_Node|Node|System_Boundary|Container_Boundary|Enterprise_Boundary|Boundary)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?\s*\)\s*\{?/i);
    if (c4Match) {
      const macro = c4Match[1].toLowerCase();
      const id = sanitizeId(c4Match[2]);
      const label = c4Match[3];
      const arg1 = c4Match[4]; // for container/component: technology, for person/system: description
      const arg2 = c4Match[5]; // for container/component: description

      let c4Type: any = 'system';
      let type = 'c4-system';
      let technology: string | undefined = undefined;
      let description: string | undefined = arg1;

      if (macro.includes('person')) {
        c4Type = macro.includes('ext') ? 'person-ext' : 'person';
        type = 'c4-person';
      } else if (macro.includes('containerdb')) {
        c4Type = macro.includes('ext') ? 'container-db-ext' : 'container-db';
        type = 'c4-container-db';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('containerqueue')) {
        c4Type = 'container-queue';
        type = 'c4-container-queue';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('container')) {
        c4Type = macro.includes('ext') ? 'container-ext' : 'container';
        type = 'c4-container';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('componentdb')) {
        c4Type = 'component-db';
        type = 'c4-component-db';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('componentqueue')) {
        c4Type = 'component-queue';
        type = 'c4-component-queue';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('component')) {
        c4Type = macro.includes('ext') ? 'component-ext' : 'component';
        type = 'c4-component';
        technology = arg1;
        description = arg2;
      } else if (macro.includes('systemdb')) {
        c4Type = macro.includes('ext') ? 'system-db-ext' : 'system-db';
        type = 'c4-system-db';
      } else if (macro.includes('systemqueue')) {
        c4Type = 'system-queue';
        type = 'c4-system-queue';
      } else if (macro.includes('deployment_node') || macro === 'node') {
        c4Type = 'deployment-node';
        type = 'c4-deployment-node';
        technology = arg1;
      } else if (macro.includes('boundary')) {
        c4Type = 'boundary';
        type = 'c4-boundary';
      } else if (macro.includes('system')) {
        c4Type = macro.includes('ext') ? 'system-ext' : 'system';
        type = 'c4-system';
      }

      if (!nodeMap.has(id)) {
        const isBoundary = c4Type === 'boundary' || c4Type === 'deployment-node';
        const node: DiagramNode = {
          id,
          type,
          category: isBoundary ? 'container' : 'c4',
          label,
          sublabel: `<<${c4Type}>>`,
          x: 0,
          y: 0,
          width: isBoundary ? 320 : 220,
          height: isBoundary ? 200 : 120,
          color: isBoundary ? 'sand' : 'sienna',
          data: {
            c4Type,
            technology,
            description,
            isContainer: isBoundary,
            containerType: isBoundary ? 'boundary' : undefined
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 2. C4 Indexed Relationship Macro: Rel_Index(1, src, tgt, "label", "tech")
    const c4RelIndexMatch = rawLine.match(/^(Rel_Index|RelIndex)\s*\(\s*([0-9]+)\s*,\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*,\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*(?:,\s*"([^"]*)")?(?:,\s*"([^"]*)")?\s*\)/i);
    if (c4RelIndexMatch) {
      const stepIdx = c4RelIndexMatch[2];
      const rawSrc = c4RelIndexMatch[3];
      const rawTgt = c4RelIndexMatch[4];
      const edgeLabel = c4RelIndexMatch[5] || '';
      const tech = c4RelIndexMatch[6] || '';

      const srcId = resolveOrCreateNode(rawSrc, nodes, nodeMap, 'source');
      const tgtId = resolveOrCreateNode(rawTgt, nodes, nodeMap, 'target');

      edges.push({
        id: `c4_rel_idx_${srcId}_${tgtId}_${stepIdx}`,
        source: srcId,
        target: tgtId,
        label: tech ? `[${stepIdx}] ${edgeLabel} [${tech}]` : `[${stepIdx}] ${edgeLabel}`,
        cardinalityTarget: tech || undefined,
        style: 'solid',
        arrowType: 'arrow'
      });
      continue;
    }

    // 2b. C4 Relationship Macros: Rel(src, tgt, "label", "tech"), BiRel, Rel_Down, Rel_Right, etc.
    const c4RelMatch = rawLine.match(/^(Rel|Rel_Back|Rel_Neighbor|Rel_D|Rel_Down|Rel_U|Rel_Up|Rel_L|Rel_Left|Rel_R|Rel_Right|BiRel|BiRel_D|BiRel_Down|BiRel_U|BiRel_Up|BiRel_L|BiRel_Left|BiRel_R|BiRel_Right)\s*\(\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*,\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*(?:,\s*"([^"]*)")?(?:,\s*"([^"]*)")?\s*\)/i);
    if (c4RelMatch) {
      const relType = c4RelMatch[1].toLowerCase();
      const rawSrc = c4RelMatch[2];
      const rawTgt = c4RelMatch[3];
      const edgeLabel = c4RelMatch[4] || '';
      const tech = c4RelMatch[5] || '';

      const srcId = resolveOrCreateNode(rawSrc, nodes, nodeMap, 'source');
      const tgtId = resolveOrCreateNode(rawTgt, nodes, nodeMap, 'target');

      let directionHint: 'up' | 'down' | 'left' | 'right' | undefined = undefined;
      let sourceHandle: PortPosition | undefined = undefined;
      let targetHandle: PortPosition | undefined = undefined;

      if (relType.includes('_d') || relType.includes('_down')) {
        directionHint = 'down';
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (relType.includes('_u') || relType.includes('_up')) {
        directionHint = 'up';
        sourceHandle = 'top';
        targetHandle = 'bottom';
      } else if (relType.includes('_l') || relType.includes('_left')) {
        directionHint = 'left';
        sourceHandle = 'left';
        targetHandle = 'right';
      } else if (relType.includes('_r') || relType.includes('_right')) {
        directionHint = 'right';
        sourceHandle = 'right';
        targetHandle = 'left';
      }

      edges.push({
        id: `edge_${srcId}_${tgtId}_${edges.length}`,
        source: relType === 'rel_back' ? tgtId : srcId,
        target: relType === 'rel_back' ? srcId : tgtId,
        label: tech ? `${edgeLabel} [${tech}]` : edgeLabel,
        cardinalityTarget: tech || undefined,
        style: 'solid',
        arrowType: relType.startsWith('birel') ? 'bi-arrow' : 'arrow',
        directionHint,
        sourceHandle,
        targetHandle
      });
      continue;
    }

    // 3. ArchiMate Macro Procedures: Business_Actor(id, "Label"), Application_Component(id, "Label"), etc.
    const archimateMacroMatch = rawLine.match(/^(Strategy|Business|Application|Technology|Motivation|Implementation|Physical)_([a-zA-Z0-9_]+)\s*\(\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (archimateMacroMatch) {
      const layer = archimateMacroMatch[1].toLowerCase();
      const element = archimateMacroMatch[2].toLowerCase();
      const rawId = archimateMacroMatch[3];
      const id = sanitizeId(rawId);
      const label = archimateMacroMatch[4];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'archimate-element',
          category: 'archimate',
          label,
          sublabel: `<<${layer}-${element}>>`,
          x: 0,
          y: 0,
          width: 210,
          height: 90,
          color: layer === 'business' ? 'ochre' : layer === 'application' ? 'sage' : layer === 'technology' ? 'slate' : 'sand',
          data: {
            archimateLayer: layer as any,
            archimateElement: element
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 4. ArchiMate Relationship Macros: Rel_Composition(src, tgt, "label"), Rel_Serving, Rel_Triggering, etc.
    const archimateRelMatch = rawLine.match(/^(Rel_Composition|Rel_Aggregation|Rel_Assignment|Rel_Specialization|Rel_Serving|Rel_Association|Rel_Flow|Rel_Realization|Rel_Triggering|Rel_Access|Rel_Influence)(?:_([a-zA-Z]+))?\s*\(\s*["']?([a-zA-Z0-9_./$-]+)["']?\s*,\s*["']?([a-zA-Z0-9_./$-]+)["']?(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (archimateRelMatch) {
      const relKind = archimateRelMatch[1].replace('Rel_', '').toLowerCase();
      const dirSuffix = archimateRelMatch[2]?.toLowerCase();
      const rawSrc = archimateRelMatch[3];
      const rawTgt = archimateRelMatch[4];
      const edgeLabel = archimateRelMatch[5] || '';

      const srcId = resolveOrCreateNode(rawSrc, nodes, nodeMap, 'source');
      const tgtId = resolveOrCreateNode(rawTgt, nodes, nodeMap, 'target');

      let directionHint: 'up' | 'down' | 'left' | 'right' | undefined = undefined;
      let sourceHandle: PortPosition | undefined = undefined;
      let targetHandle: PortPosition | undefined = undefined;

      if (dirSuffix === 'down' || dirSuffix === 'd') {
        directionHint = 'down';
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (dirSuffix === 'up' || dirSuffix === 'u') {
        directionHint = 'up';
        sourceHandle = 'top';
        targetHandle = 'bottom';
      } else if (dirSuffix === 'left' || dirSuffix === 'l') {
        directionHint = 'left';
        sourceHandle = 'left';
        targetHandle = 'right';
      } else if (dirSuffix === 'right' || dirSuffix === 'r') {
        directionHint = 'right';
        sourceHandle = 'right';
        targetHandle = 'left';
      }
      edges.push({
        id: `arch_edge_${srcId}_${tgtId}_${edges.length}`,
        source: srcId,
        target: tgtId,
        label: edgeLabel || `<<${relKind}>>`,
        style: relKind === 'flow' || relKind === 'triggering' ? 'dashed' : 'solid',
        arrowType: 'arrow',
        directionHint,
        sourceHandle,
        targetHandle
      });
      continue;
    }

    // 4b. ArchiMate Junctions: Junction_Or(id), Junction_And(id)
    const archimateJunctionMatch = rawLine.match(/^(Junction_Or|Junction_And)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
    if (archimateJunctionMatch) {
      const juncType = archimateJunctionMatch[1].toLowerCase().includes('or') ? 'or' : 'and';
      const id = sanitizeId(archimateJunctionMatch[2]);
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'archimate-element',
          category: 'archimate',
          label: juncType.toUpperCase(),
          sublabel: '<<junction>>',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          color: 'charcoal',
          data: {
            archimateLayer: 'technology',
            archimateElement: `junction-${juncType}`
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 5. DomainStory Macros: Person(id, "Label"), System(id, "Label"), Document(id, "Label"), etc.
    const domainStoryMatch = rawLine.match(/^(Person|Group|System|Document|Folder|Call|Email|Conversation|Info|Boundary)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"\s*\)/i);
    if (domainStoryMatch) {
      const dsType = domainStoryMatch[1].toLowerCase();
      const id = sanitizeId(domainStoryMatch[2]);
      const label = domainStoryMatch[3];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'domainstory-node',
          category: 'domainstory',
          label,
          sublabel: `<<DomainStory ${dsType}>>`,
          x: 0,
          y: 0,
          width: 190,
          height: 90,
          color: dsType === 'boundary' ? 'slate' : ['person', 'group'].includes(dsType) ? 'ochre' : 'sand',
          data: {
            domainStoryType: dsType as any
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // DomainStory activity macro: activity(step, subject, predicate, object, post, target)
    const dsActivityMatch = rawLine.match(/^activity\s*\(\s*([0-9]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"\s*,\s*([a-zA-Z0-9_]+)(?:\s*,\s*"([^"]*)")?(?:\s*,\s*([a-zA-Z0-9_]+))?\s*\)/i);
    if (dsActivityMatch) {
      const step = dsActivityMatch[1];
      const subject = sanitizeId(dsActivityMatch[2]);
      const predicate = dsActivityMatch[3];
      const obj = sanitizeId(dsActivityMatch[4]);
      const target = dsActivityMatch[6] ? sanitizeId(dsActivityMatch[6]) : undefined;

      ensureImplicitNode(subject, dsActivityMatch[2], nodes, nodeMap);
      ensureImplicitNode(obj, dsActivityMatch[4], nodes, nodeMap);

      edges.push({
        id: `ds_act_${subject}_${obj}_${step}`,
        source: subject,
        target: target || obj,
        label: `${step}. ${predicate}`,
        style: 'solid',
        arrowType: 'arrow'
      });
      continue;
    }

    // 6. AdaML Macros (stdlib/adaml)
    const adamlMatch = rawLine.match(/^(begin_package_spec|subprogram|package)\s*\(\s*"([^"]+)"\s*\)/i);
    if (adamlMatch) {
      const adamlMacro = adamlMatch[1].toLowerCase();
      const label = adamlMatch[2];
      const id = sanitizeId(label);
      const adamlType = adamlMacro === 'begin_package_spec' ? 'package-spec' : adamlMacro === 'subprogram' ? 'subprogram' : 'package-body';

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'adaml-node',
          category: 'adaml',
          label,
          sublabel: `<<ada_${adamlType}>>`,
          x: 0,
          y: 0,
          width: 220,
          height: 100,
          color: adamlType === 'subprogram' ? 'ochre' : 'sienna',
          data: {
            adamlType: adamlType as any
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // AdaML depends relationship macro: depends("From", "To", "label")
    const adamlRelMatch = rawLine.match(/^depends\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (adamlRelMatch) {
      const srcId = sanitizeId(adamlRelMatch[1]);
      const tgtId = sanitizeId(adamlRelMatch[2]);
      const edgeLabel = adamlRelMatch[3] || 'depends';

      ensureImplicitNode(srcId, adamlRelMatch[1], nodes, nodeMap);
      ensureImplicitNode(tgtId, adamlRelMatch[2], nodes, nodeMap);

      edges.push({
        id: `adaml_dep_${srcId}_${tgtId}_${edges.length}`,
        source: srcId,
        target: tgtId,
        label: edgeLabel,
        style: 'dashed',
        arrowType: 'arrow'
      });
      continue;
    }

    // 7. AWS Cloud Standard Library Macros (stdlib/aws)
    const awsMatch = rawLine.match(/^(AWSLAMBDA|AMAZONDYNAMODB|AMAZONRDS|AMAZONS3|AMAZONAPIGATEWAY|AMAZONSQS|AMAZONSNS|AMAZONCLOUDWATCH|AMAZONKINESIS|AMAZONATHENA|AMAZONEC2|AMAZONVPC|AMAZONROUTE53|AMAZONCLOUDFRONT|AMAZONECS|AMAZONEKS|AMAZONELASTICACHE|AMAZONIAM|AMAZONCOGNITO|AMAZONEVENTBRIDGE|AMAZONSTEPFUNCTIONS|AWSCLOUD|INTERNET|USER)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"\s*\)/i);
    if (awsMatch) {
      const awsSvc = awsMatch[1];
      const id = sanitizeId(awsMatch[2]);
      const label = awsMatch[3];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'cloud-aws',
          category: 'cloud',
          label,
          sublabel: `<<AWS ${awsSvc}>>`,
          x: 0,
          y: 0,
          width: 200,
          height: 85,
          color: awsSvc.includes('DATABASE') || awsSvc.includes('RDS') ? 'ochre' : awsSvc.includes('S3') ? 'sand' : 'sienna',
          data: {
            cloudProvider: 'aws',
            cloudService: awsSvc
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 7b. Azure Cloud Standard Library Macros (stdlib/azure)
    const azureMatch = rawLine.match(/^(AzureAppService|AzureFunction|AzureVirtualMachine|AzureSqlDatabase|AzureCosmosDb|AzureBlobStorage|AzureKubernetesService|AzureLoadBalancer|AzureApplicationGateway|AzureDevOps|AzureActiveDirectory|AzureEventHub|AzureKeyVault|AzureRedisCache|AzureServiceBus|AzureSynapseAnalytics|AzureDataFactory)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (azureMatch) {
      const azSvc = azureMatch[1];
      const id = sanitizeId(azureMatch[2]);
      const label = azureMatch[3];
      const tech = azureMatch[4];
      const desc = azureMatch[5];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'cloud-azure',
          category: 'cloud',
          label,
          sublabel: `<<Azure ${azSvc.replace('Azure', '')}>>`,
          x: 0,
          y: 0,
          width: 200,
          height: 85,
          color: 'teal',
          data: {
            cloudProvider: 'azure',
            cloudService: azSvc,
            technology: tech,
            description: desc
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 7c. GCP Standard Library Macros (stdlib/gcp)
    const gcpMatch = rawLine.match(/^(GCP_ComputeEngine|GCP_CloudFunctions|GCP_CloudRun|GCP_GKE|GCP_KubernetesEngine|GCP_CloudStorage|GCP_CloudSQL|GCP_BigQuery|GCP_PubSub|GCP_CloudPubSub|GCP_Firestore|GCP_CloudSpanner|GCP_CloudLoadBalancing|GCP_CloudIAM|GCP_CloudVPC|GCP_CloudArmor|GCP_CloudBuild)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (gcpMatch) {
      const gcpSvc = gcpMatch[1];
      const id = sanitizeId(gcpMatch[2]);
      const label = gcpMatch[3];
      const tech = gcpMatch[4];
      const desc = gcpMatch[5];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'cloud-gcp',
          category: 'cloud',
          label,
          sublabel: `<<GCP ${gcpSvc.replace('GCP_', '')}>>`,
          x: 0,
          y: 0,
          width: 200,
          height: 85,
          color: 'slate',
          data: {
            cloudProvider: 'gcp',
            cloudService: gcpSvc,
            technology: tech,
            description: desc
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 7d. Kubernetes Standard Library Macros (stdlib/kubernetes)
    const k8sMatch = rawLine.match(/^(k8s_pod|k8s_service|k8s_deploy|k8s_deployment|k8s_ingress|k8s_cm|k8s_configmap|k8s_secret|k8s_pv|k8s_pvc|k8s_ns|k8s_namespace|k8s_node|k8s_statefulset|k8s_daemonset|k8s_cronjob|k8s_job)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*\)/i);
    if (k8sMatch) {
      const k8sKind = k8sMatch[1];
      const id = sanitizeId(k8sMatch[2]);
      const label = k8sMatch[3];
      const desc = k8sMatch[4];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'cloud-k8s',
          category: 'cloud',
          label,
          sublabel: `<<K8s ${k8sKind.replace('k8s_', '')}>>`,
          x: 0,
          y: 0,
          width: 190,
          height: 85,
          color: 'slate',
          data: {
            cloudProvider: 'k8s',
            cloudService: k8sKind,
            description: desc
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 7e. Cloudogu / Tool Macros (stdlib/cloudogu)
    const cloudoguMatch = rawLine.match(/^(DOCKER|KUBERNETES|GIT|JENKINS|POSTGRESQL|MYSQL|REDIS|NGINX|KAFKA|RABBITMQ|PROMETHEUS|GRAFANA|ELASTICSEARCH)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*"([^"]+)"\s*\)/i);
    if (cloudoguMatch) {
      const tool = cloudoguMatch[1].toUpperCase();
      const id = sanitizeId(cloudoguMatch[2]);
      const label = cloudoguMatch[3];

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'cloud-tool',
          category: 'cloud',
          label,
          sublabel: `<<${tool}>>`,
          x: 0,
          y: 0,
          width: 180,
          height: 80,
          color: 'slate',
          data: {
            cloudProvider: 'cloudogu',
            cloudService: tool
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // 8. ArchiMate Elements: archimate #Business "Label" as id <<actor>>
    const archimateMatch = rawLine.match(/^archimate\s+(?:#([a-zA-Z]+)\s+)?"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)(?:\s*<<([^>]+)>>)?/i);
    if (archimateMatch) {
      const layer = (archimateMatch[1] || 'Business').toLowerCase();
      const label = archimateMatch[2];
      const id = sanitizeId(archimateMatch[3]);
      const element = archimateMatch[4] || 'element';

      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'archimate-element',
          category: 'archimate',
          label,
          sublabel: `<<${element}>>`,
          x: 0,
          y: 0,
          width: 200,
          height: 90,
          color: 'ochre',
          data: {
            archimateLayer: layer as any,
            archimateElement: element
          }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Single-line declaration:
    // keyword "label" / :label: / (label) / [label] as id <<stereotype>> #color
    const declMatch = rawLine.match(/^(participant|actor|agent|component|database|storage|cloud|node|queue|stack|artifact|file|folder|frame|card|hexagon|collections|boundary|control|interface|class|abstract\s+class|enum|entity|object|state|usecase|rectangle|diamond|circle)\s+(?:"([^"]+)"|:([^:]+):|\(([^)]+)\)|\[([^\]]+)\]|([a-zA-Z0-9_]+))(?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?(?:\s*(#[a-fA-F0-9]{3,6}|#[a-zA-Z]+))?(?:\s*<<([^>]+)>>)?/i);
    if (declMatch) {
      const type = declMatch[1].toLowerCase().replace(/\s+class$/, '');
      const label = declMatch[2] || declMatch[3] || declMatch[4] || declMatch[5] || declMatch[6];
      const id = sanitizeId(declMatch[7] || declMatch[6] || label);
      const stereotype = (declMatch[8] || declMatch[10])?.trim();
      const explicitColor = declMatch[9]?.trim();

      if (!nodeMap.has(id)) {
        let resolvedType = type;
        let resolvedCategory = getCategoryForType(type);
        let shape: DiagramNode['data']['shape'] = undefined;
        let width = 190;
        let height = 85;

        if (type === 'participant') {
          resolvedType = 'participant';
          resolvedCategory = 'sequence';
          shape = 'rounded';
          width = 160;
          height = 70;
        } else if (type === 'frame') {
          resolvedType = 'frame';
          resolvedCategory = 'container';
          shape = 'frame';
          width = 340;
          height = 240;
        } else if (type === 'folder') {
          resolvedType = 'folder';
          resolvedCategory = 'container';
          shape = 'folder';
          width = 320;
          height = 220;
        } else if (type === 'state') {
          resolvedCategory = 'activity-state';
          if (label === '[H]' || label === '[H*]') {
            resolvedType = 'state-history';
            shape = 'state';
            width = 34;
            height = 34;
          } else {
            resolvedType = 'state';
            shape = 'state';
          }
        } else if (type === 'circle') {
          resolvedCategory = 'activity-state';
          const stLower = stereotype?.toLowerCase();
          if (stLower === 'start') {
            resolvedType = 'activity-start';
            shape = 'start';
            width = 32;
            height = 32;
          } else if (stLower === 'stop') {
            resolvedType = 'activity-stop';
            shape = 'stop';
            width = 34;
            height = 34;
          } else if (stLower === 'flowfinal') {
            resolvedType = 'activity-flow-final';
            width = 32;
            height = 32;
          } else {
            resolvedType = 'activity-start';
            shape = 'start';
            width = 32;
            height = 32;
          }
        } else if (type === 'diamond') {
          resolvedType = 'activity-decision';
          resolvedCategory = 'activity-state';
          shape = 'diamond';
          width = 110;
          height = 64;
        } else if (type === 'usecase') {
          resolvedType = 'usecase';
          resolvedCategory = 'activity-state';
          shape = 'usecase';
          width = 180;
          height = 80;
        } else if (stereotype?.toLowerCase() === 'math' || label.includes('<math>')) {
          resolvedType = 'embedded-math';
          resolvedCategory = 'embedded';
          width = 240;
          height = 100;
        } else if (stereotype?.toLowerCase() === 'wbs') {
          resolvedType = 'wbs-node';
          resolvedCategory = 'wbs';
          width = 200;
          height = 90;
        } else if (stereotype?.toLowerCase() === 'ditaa') {
          resolvedType = 'embedded-ditaa';
          resolvedCategory = 'embedded';
          width = 240;
          height = 140;
        } else if (stereotype?.toLowerCase() === 'salt') {
          resolvedType = 'embedded-salt';
          resolvedCategory = 'embedded';
          width = 240;
          height = 150;
        }

        let nodeData: DiagramNode['data'] = shape ? { shape } : {};
        if (resolvedType === 'frame') {
          nodeData = { ...nodeData, isContainer: true, containerType: 'frame', shape: 'frame' };
        } else if (resolvedType === 'folder') {
          nodeData = { ...nodeData, isContainer: true, containerType: 'folder', shape: 'folder' };
        } else if (resolvedType === 'embedded-salt') {
          nodeData.embeddedType = 'salt';
        } else if (resolvedType === 'embedded-ditaa') {
          nodeData.embeddedType = 'ditaa';
        }

        // Parse embedded math formula if embedded in label
        if (resolvedType === 'embedded-math') {
          const mathMatch = label.match(/<math>([\s\S]*?)<\/math>/i);
          if (mathMatch) {
            nodeData = {
              ...nodeData,
              embeddedType: 'math',
              mathFormula: mathMatch[1]
            };
          }
        }

        const node: DiagramNode = {
          id,
          type: resolvedType,
          category: resolvedCategory,
          label: label.replace(/\\n<math>[\s\S]*?<\/math>/i, '').replace(/<math>[\s\S]*?<\/math>/i, ''),
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width,
          height,
          color: getColorForType(resolvedType),
          data: nodeData
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Bracket notation: [Component Label] as id OR [Component Label] <<stereotype>> #color
    const bracketMatch = rawLine.match(/^\[([^\]]+)\](?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?(?:\s*(#[a-fA-F0-9]{3,6}|#[a-zA-Z]+))?(?:\s*<<([^>]+)>>)?$/i);
    if (bracketMatch) {
      const label = bracketMatch[1];
      const id = sanitizeId(bracketMatch[2] || label);
      const stereotype = (bracketMatch[3] || bracketMatch[5])?.trim();
      const explicitColor = bracketMatch[4]?.trim();
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'component',
          category: 'component',
          label,
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width: 180,
          height: 80,
          color: explicitColor ? 'sienna' : 'sienna'
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Use case notation: (Usecase Label) as id OR (Usecase Label)
    const usecaseMatch = rawLine.match(/^\(([^)]+)\)(?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?(?:\s*(#[a-fA-F0-9]{3,6}|#[a-zA-Z]+))?(?:\s*<<([^>]+)>>)?$/i);
    if (usecaseMatch) {
      const label = usecaseMatch[1];
      const id = sanitizeId(usecaseMatch[2] || label);
      const stereotype = (usecaseMatch[3] || usecaseMatch[5])?.trim();
      const explicitColor = usecaseMatch[4]?.trim();
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'usecase',
          category: 'activity-state',
          label,
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width: 180,
          height: 80,
          color: explicitColor ? 'sand' : 'sand',
          data: { shape: 'usecase' }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Actor notation: :Actor Label: as id OR :Actor Label:
    const actorMatch = rawLine.match(/^:([^:]+):(?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?(?:\s*(#[a-fA-F0-9]{3,6}|#[a-zA-Z]+))?(?:\s*<<([^>]+)>>)?$/i);
    if (actorMatch) {
      const label = actorMatch[1];
      const id = sanitizeId(actorMatch[2] || label);
      const stereotype = (actorMatch[3] || actorMatch[5])?.trim();
      const explicitColor = actorMatch[4]?.trim();
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'actor',
          category: 'actor-agent',
          label,
          sublabel: stereotype ? `<<${stereotype}>>` : undefined,
          x: 0,
          y: 0,
          width: 130,
          height: 90,
          color: explicitColor ? 'sienna' : 'sienna'
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Note declaration: note "Text" as id
    const noteMatch = rawLine.match(/^note\s+"([^"]+)"\s+as\s+([a-zA-Z0-9_]+)/i);
    if (noteMatch) {
      const label = noteMatch[1];
      const id = sanitizeId(noteMatch[2]);
      if (!nodeMap.has(id)) {
        const node: DiagramNode = {
          id,
          type: 'note',
          category: 'annotation',
          label,
          x: 0,
          y: 0,
          width: 190,
          height: 80,
          color: 'gold',
          data: { description: label }
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      continue;
    }

    // Arrow / Connection match:
    // Strip trailing inline comment (if not inside quotes) and optional trailing semicolon
    let lineForArrow = rawLine.trim();
    const commentIdx = lineForArrow.indexOf("'");
    if (commentIdx > 0 && !lineForArrow.startsWith("'")) {
      const quoteCount = (lineForArrow.slice(0, commentIdx).match(/"/g) || []).length;
      if (quoteCount % 2 === 0) {
        lineForArrow = lineForArrow.slice(0, commentIdx).trim();
      }
    }
    if (lineForArrow.endsWith(';')) {
      lineForArrow = lineForArrow.slice(0, -1).trim();
    }

    // Support: ||--||, ||--|{, ||--o{, ||--0{, ||--o|, ||--0|, }|--|{, }o--o{, |o--o|, <|--, --|>, ..|>, *--, o--, +--, x--, -0), ()--, -->, ..>, <-->
    // As well as single-dash arrows (->, <-), directional (-down->, -r->), dotted (.>, ..>), bracketed styles (-[#red]->, -[dashed]->), bracketed [Comp], usecase (UC), actor :Act:, quoted "Name"
    const arrowRegex = /^\s*("(?:[^"\\]|\\.)*"|\([^)]+\)|\[[^\]]+\]|:[^:]+:|[a-zA-Z0-9_./$@#~-]+(?:::[a-zA-Z0-9_]+)?)\s*(?:"([^"]*)"|\(([^)]*)\)|\[([0-9.*]+)\])?\s*([<*o+#x}(]{0,2}[-.=~|]+(?:\[[^\]]*\])?[-.=~|]*(?:up|down|left|right|[udlr])?[-.=~|]*(?:\[[^\]]*\])?[-.=~|]*[>*o+#x{)]{0,2})\s*(?:"([^"]*)"|\(([^)]*)\)|\[([0-9.*]+)\])?\s*("(?:[^"\\]|\\.)*"|\([^)]+\)|\[[^\]]+\]|:[^:]+:|[a-zA-Z0-9_./$@#~-]+(?:::[a-zA-Z0-9_]+)?)(?:\s*:\s*(.+))?$/;
    const arrowMatch = lineForArrow.match(arrowRegex);
    if (arrowMatch) {
      const rawSrc = arrowMatch[1];
      const srcCard = (arrowMatch[2] || arrowMatch[3] || arrowMatch[4])?.trim();
      const arrowOp = arrowMatch[5];
      const tgtCard = (arrowMatch[6] || arrowMatch[7] || arrowMatch[8])?.trim();
      const rawTgt = arrowMatch[9];
      let edgeLabel = arrowMatch[10]?.trim();

      // Check reading direction < or >
      let readingDirection: '>' | '<' | undefined = undefined;
      if (edgeLabel?.endsWith('>')) {
        readingDirection = '>';
        edgeLabel = edgeLabel.replace(/\s*>$/, '').trim();
      } else if (edgeLabel?.endsWith('<')) {
        readingDirection = '<';
        edgeLabel = edgeLabel.replace(/\s*<$/, '').trim();
      }

      // Direction hints
      let directionHint: 'up' | 'down' | 'left' | 'right' | undefined = undefined;
      const opLower = arrowOp.toLowerCase();
      if (opLower.includes('up') || opLower.includes('-u-') || opLower.includes('-u>') || opLower.includes('<-u-') || opLower.includes('[u]')) {
        directionHint = 'up';
      } else if (opLower.includes('down') || opLower.includes('-d-') || opLower.includes('-d>') || opLower.includes('<-d-') || opLower.includes('[d]')) {
        directionHint = 'down';
      } else if (opLower.includes('left') || opLower.includes('-l-') || opLower.includes('-l>') || opLower.includes('<-l-') || opLower.includes('[l]')) {
        directionHint = 'left';
      } else if (opLower.includes('right') || opLower.includes('-r-') || opLower.includes('-r>') || opLower.includes('<-r-') || opLower.includes('[r]')) {
        directionHint = 'right';
      }

      let sourceHandle: PortPosition | undefined = undefined;
      let targetHandle: PortPosition | undefined = undefined;
      if (directionHint === 'up') {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      } else if (directionHint === 'down') {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (directionHint === 'left') {
        sourceHandle = 'left';
        targetHandle = 'right';
      } else if (directionHint === 'right') {
        sourceHandle = 'right';
        targetHandle = 'left';
      }

      // Check for bracketed options like -[#red]->, -[dashed]->, -[bold]->
      let customColor: string | undefined = undefined;
      let bracketStyle: DiagramEdge['style'] | undefined = undefined;
      const bracketMatch = arrowOp.match(/\[([^\]]+)\]/);
      if (bracketMatch) {
        const bracketContent = bracketMatch[1];
        const colorMatch = bracketContent.match(/#([a-fA-F0-9]{3,8}|[a-zA-Z]+)/);
        if (colorMatch) {
          customColor = colorMatch[0];
        }
        if (bracketContent.includes('dashed')) bracketStyle = 'dashed';
        else if (bracketContent.includes('dotted')) bracketStyle = 'dotted';
        else if (bracketContent.includes('bold') || bracketContent.includes('thick')) bracketStyle = 'thick';
        else if (bracketContent.includes('hidden')) {
          bracketStyle = 'dotted';
          customColor = customColor || '#dfd8ce';
        }
      }

      const isReverseArrow = arrowOp.startsWith('<') && !arrowOp.includes('>') && !arrowOp.includes('-->') && !arrowOp.includes('->');
      if (isReverseArrow && sourceHandle && targetHandle) {
        const temp = sourceHandle;
        sourceHandle = targetHandle;
        targetHandle = temp;
      }

      const srcId = resolveOrCreateNode(rawSrc, nodes, nodeMap, isReverseArrow ? 'target' : 'source');
      const tgtId = resolveOrCreateNode(rawTgt, nodes, nodeMap, isReverseArrow ? 'source' : 'target');

      let arrowType: DiagramEdge['arrowType'] = 'arrow';
      let style: DiagramEdge['style'] = bracketStyle || ((arrowOp.includes('..') || arrowOp.includes('.')) ? 'dashed' : (arrowOp.includes('==') ? 'thick' : 'solid'));

      if (arrowOp.includes('||--||')) arrowType = 'crows-foot-one';
      else if (arrowOp.includes('||--|{') || arrowOp.includes('}|--||')) arrowType = 'crows-foot-many';
      else if (arrowOp.includes('||--o{') || arrowOp.includes('}o--||') || arrowOp.includes('||--0{') || arrowOp.includes('}0--||')) arrowType = 'crows-foot-zero-many';
      else if (arrowOp.includes('||--o|') || arrowOp.includes('|o--||') || arrowOp.includes('||--0|') || arrowOp.includes('|0--||')) arrowType = 'crows-foot-zero-one';
      else if (arrowOp.includes('}|--|{')) arrowType = 'crows-foot-many-many';
      else if (arrowOp.includes('}o--o{') || arrowOp.includes('}0--0{')) arrowType = 'crows-foot-zero-zero';
      else if (arrowOp.includes('|o--o|') || arrowOp.includes('|0--0|')) arrowType = 'crows-foot-opt-opt';
      else if (arrowOp.includes('<|--') || arrowOp.includes('--|>') || arrowOp.includes('-|>') || arrowOp.includes('<|-')) arrowType = 'inheritance';
      else if (arrowOp.includes('..|>') || arrowOp.includes('<|..') || arrowOp.includes('.|>') || arrowOp.includes('<|.')) {
        arrowType = 'realization';
        style = 'dashed';
      } else if (arrowOp.includes('*--') || arrowOp.includes('--*') || arrowOp.includes('*->') || arrowOp.includes('<-*') || arrowOp.includes('*-->') || arrowOp.includes('<--*')) arrowType = 'composition';
      else if (arrowOp.includes('o--') || arrowOp.includes('--o') || arrowOp.includes('o->') || arrowOp.includes('<-o') || arrowOp.includes('o-->') || arrowOp.includes('<--o')) arrowType = 'aggregation';
      else if (arrowOp.includes('+--') || arrowOp.includes('--+')) arrowType = 'nesting';
      else if (arrowOp.includes('x--') || arrowOp.includes('--x')) arrowType = 'cancellation';
      else if (arrowOp.includes('-0)') || arrowOp.includes('-0(') || arrowOp.includes('(0-')) arrowType = 'socket-ball';
      else if (arrowOp.includes('()--') || arrowOp.includes('--()') || arrowOp.includes('()-')) arrowType = 'lollipop';
      else if (arrowOp.includes('..>') || arrowOp.includes('<..') || arrowOp.includes('.>') || arrowOp.includes('<.')) {
        arrowType = 'dependency';
        style = 'dashed';
      } else if (arrowOp.includes('<-->') || arrowOp.includes('<->')) arrowType = 'bi-arrow';
      else if (arrowOp === '--' || arrowOp === '..' || arrowOp === '==') arrowType = 'none';

      edges.push({
        id: `edge_${srcId}_${tgtId}_${edges.length}`,
        source: isReverseArrow ? tgtId : srcId,
        target: isReverseArrow ? srcId : tgtId,
        label: edgeLabel,
        cardinalitySource: isReverseArrow ? tgtCard : srcCard,
        cardinalityTarget: isReverseArrow ? srcCard : tgtCard,
        readingDirection,
        style,
        arrowType,
        color: customColor,
        directionHint,
        sourceHandle,
        targetHandle
      });
    }
  }

  // Finalize any unclosed multi-line block at end of input
  while (blockStack.length > 0) {
    const unclosed = blockStack.pop()!;
    finishBlock(unclosed, nodes, nodeMap);
  }

  // Automatic Layout
  applyAutoLayout(nodes, edges);

  return {
    title,
    settings,
    nodes,
    edges
  };
}

function finishBlock(
  block: { 
    type: string; 
    id: string; 
    label: string; 
    generics?: string; 
    stereotype?: string; 
    spot?: { character: string; colorHex: string }; 
    parentId?: string;
    lines: string[] 
  },
  nodes: DiagramNode[],
  nodeMap: Map<string, DiagramNode>
) {
  const { type, id, label, generics, stereotype, spot, parentId, lines } = block;

  if (['package', 'namespace', 'frame', 'folder', 'rectangle', 'node', 'group', 'alt', 'opt', 'loop', 'par', 'critical'].includes(type)) {
    const isFragment = ['alt', 'opt', 'loop', 'par', 'critical', 'group'].includes(type);
    const isFrame = type === 'frame' || isFragment;
    const isFolder = type === 'folder';
    const isRect = type === 'rectangle';
    const node: DiagramNode = {
      id,
      type: isFragment ? 'frame' : type as any,
      category: 'container',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: isFrame ? 360 : 340,
      height: isFrame ? 260 : 240,
      color: isFrame ? 'slate' : 'sand',
      shape: (isFrame ? 'frame' : isFolder ? 'folder' : (isRect ? 'rectangle' : 'package')) as any,
      data: {
        isContainer: true,
        containerType: 'frame',
        frameKind: isFragment ? type : undefined,
        shape: (isFrame ? 'frame' : isFolder ? 'folder' : (isRect ? 'rectangle' : 'package')) as any,
        parentId
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);

    // Parse enclosed child elements inside this container!
    if (lines.length > 0) {
      lines.forEach(subLine => {
        const cleanSub = subLine.trim();
        if (!cleanSub || cleanSub.startsWith("'") || cleanSub.startsWith('!')) return;

        // Try single-line decl match (supports participants, actors, components, classes, etc.)
        const subDecl = cleanSub.match(/^(participant|actor|agent|component|database|storage|cloud|node|queue|stack|artifact|file|folder|frame|card|hexagon|collections|boundary|control|interface|class|abstract\s+class|enum|entity|object|state|usecase|rectangle)\s+(?:"([^"]+)"|:([^:]+):|\(([^)]+)\)|\[([^\]]+)\]|([a-zA-Z0-9_]+))(?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?(?:\s*(#[a-fA-F0-9]{3,6}|#[a-zA-Z]+))?(?:\s*<<([^>]+)>>)?/i);
        if (subDecl) {
          const subType = subDecl[1].toLowerCase().replace(/\s+class$/, '');
          const subLabel = subDecl[2] || subDecl[3] || subDecl[4] || subDecl[5] || subDecl[6];
          const subId = sanitizeId(subDecl[7] || subDecl[6] || subLabel);
          const subStereo = (subDecl[8] || subDecl[10])?.trim();

          if (!nodeMap.has(subId)) {
            const childNode: DiagramNode = {
              id: subId,
              type: subType,
              category: getCategoryForType(subType),
              label: subLabel,
              sublabel: subStereo ? `<<${subStereo}>>` : undefined,
              x: 0,
              y: 0,
              width: 180,
              height: 85,
              color: getColorForType(subType),
              data: {
                parentId: id,
                shape: subType === 'database' ? 'cylinder' : (subType === 'queue' ? 'queue' : undefined)
              }
            };
            nodes.push(childNode);
            nodeMap.set(subId, childNode);
          }
          return;
        }

        // Try bracket notation [Component]
        const subBracket = cleanSub.match(/^\[([^\]]+)\](?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s*<<([^>]+)>>)?/i);
        if (subBracket) {
          const subLabel = subBracket[1];
          const subId = sanitizeId(subBracket[2] || subLabel);
          const subStereo = subBracket[3]?.trim();
          if (!nodeMap.has(subId)) {
            const childNode: DiagramNode = {
              id: subId,
              type: 'component',
              category: 'component',
              label: subLabel,
              sublabel: subStereo ? `<<${subStereo}>>` : undefined,
              x: 0,
              y: 0,
              width: 180,
              height: 80,
              color: 'sienna',
              data: { parentId: id }
            };
            nodes.push(childNode);
            nodeMap.set(subId, childNode);
          }
          return;
        }
      });
    }
    return;
  }

  if (type === 'entity') {
    const columns: ErColumn[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean || clean === '--') return;
      const isPk = clean.startsWith('*') || clean.includes('<<PK>>');
      const isFk = clean.startsWith('#') || clean.includes('<<FK>>');
      const isUnique = clean.includes('<<UNIQUE>>');
      const content = clean.replace(/^[*#]\s*/, '').replace(/<<[^>]+>>/g, '');
      const parts = content.split(':').map(p => p.trim());
      columns.push({
        name: parts[0] || 'column',
        type: parts[1] || 'varchar',
        isPk,
        isFk,
        isUnique
      });
    });

    const node: DiagramNode = {
      id,
      type: 'entity',
      category: 'data-schema',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : '<<entity>>',
      x: 0,
      y: 0,
      width: 230,
      height: Math.max(90, 60 + columns.length * 24),
      color: 'ochre',
      data: {
        tableName: label,
        columns,
        parentId
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'map') {
    const mapEntries: MapEntry[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean) return;
      const parts = clean.split('=>').map(p => p.trim());
      if (parts.length >= 2) {
        mapEntries.push({ key: parts[0], value: parts[1] });
      }
    });

    const node: DiagramNode = {
      id,
      type: 'map',
      category: 'code',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: 210,
      height: Math.max(80, 50 + mapEntries.length * 22),
      color: 'sand',
      data: { 
        mapEntries,
        parentId 
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'object') {
    const slots: ObjectSlot[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean) return;
      const parts = clean.split('=').map(p => p.trim());
      if (parts.length >= 2) {
        slots.push({ key: parts[0], value: parts[1] });
      }
    });

    const node: DiagramNode = {
      id,
      type: 'object',
      category: 'code',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: 210,
      height: Math.max(80, 50 + slots.length * 22),
      color: 'terracotta',
      data: { 
        slots,
        parentId 
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'json' || type === 'yaml') {
    const node: DiagramNode = {
      id,
      type: `data-${type}`,
      category: 'data-schema',
      label,
      x: 0,
      y: 0,
      width: 240,
      height: 180,
      color: 'sand',
      data: {
        treeFormat: type as 'json' | 'yaml',
        treeContent: lines.join('\n'),
        parentId
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  if (type === 'state') {
    const activities = lines.map(l => l.trim()).filter(Boolean);
    const node: DiagramNode = {
      id,
      type: 'state',
      category: 'activity-state',
      label,
      sublabel: stereotype ? `<<${stereotype}>>` : undefined,
      x: 0,
      y: 0,
      width: 200,
      height: Math.max(90, 50 + activities.length * 20),
      color: 'sand',
      data: {
        shape: 'state',
        attributes: activities,
        parentId
      }
    };
    nodes.push(node);
    nodeMap.set(id, node);
    return;
  }

  // Class, Struct, Interface, Enum, Exception
  const attributes: string[] = [];
  const methods: string[] = [];
  let readingMethods = false;

  lines.forEach(l => {
    const clean = l.trim();
    if (!clean) return;
    if (clean === '--' || clean === '__') {
      readingMethods = true;
      return;
    }
    if (clean.includes('(') || readingMethods) {
      methods.push(clean);
    } else {
      attributes.push(clean);
    }
  });

  const node: DiagramNode = {
    id,
    type,
    category: 'code',
    label,
    sublabel: stereotype ? `<<${stereotype}>>` : undefined,
    x: 0,
    y: 0,
    width: 220,
    height: Math.max(90, 50 + (attributes.length + methods.length) * 20),
    color: getColorForType(type),
    data: {
      spot,
      generics,
      attributes,
      methods,
      parentId
    }
  };
  nodes.push(node);
  nodeMap.set(id, node);
}

function cleanEntityRef(rawToken: string): { id: string; label: string; type?: string; category?: DiagramNode['category'] } {
  let token = rawToken.trim();
  if (token === '[*]' || token === '(*)') {
    return { id: 'activity_start_stop', label: token, type: 'activity-start', category: 'activity-state' };
  }
  if (token.startsWith('[') && token.endsWith(']')) {
    const inner = token.slice(1, -1).trim();
    return { id: sanitizeId(inner), label: inner, type: 'component', category: 'component' };
  }
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1).trim();
    return { id: sanitizeId(inner), label: inner, type: 'usecase', category: 'activity-state' };
  }
  if (token.startsWith(':') && token.endsWith(':')) {
    const inner = token.slice(1, -1).trim();
    return { id: sanitizeId(inner), label: inner, type: 'actor', category: 'actor-agent' };
  }
  if (token.startsWith('"') && token.endsWith('"')) {
    const inner = token.slice(1, -1).trim();
    return { id: sanitizeId(inner), label: inner, type: 'class', category: 'code' };
  }
  return { id: sanitizeId(token), label: token, type: 'class', category: 'code' };
}

function resolveOrCreateNode(
  rawToken: string, 
  nodes: DiagramNode[], 
  nodeMap: Map<string, DiagramNode>,
  isSourceOrTarget?: 'source' | 'target',
  hintType?: string,
  hintCategory?: DiagramNode['category']
): string {
  const trimmed = rawToken.trim();
  const ref = cleanEntityRef(trimmed);

  // 1. Direct match in nodeMap by id
  if (nodeMap.has(ref.id)) {
    return ref.id;
  }

  // 2. Special start/stop node [*] or (*) in state & activity diagrams
  if (trimmed === '[*]' || trimmed === '(*)') {
    const isStart = isSourceOrTarget === 'source';
    const specialId = isStart ? 'start_node' : 'end_node';
    if (nodeMap.has(specialId)) return specialId;

    const node: DiagramNode = {
      id: specialId,
      type: isStart ? 'activity-start' : 'activity-stop',
      category: 'activity-state',
      label: isStart ? 'Start' : 'Stop',
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      color: 'slate',
      data: { shape: isStart ? 'start' : 'stop' }
    };
    nodes.push(node);
    nodeMap.set(specialId, node);
    return specialId;
  }

  // 3. Search existing nodes by label, unquoted label, or alternative sanitized formats
  const rawClean = trimmed.replace(/^["'(\[:]+|["')\]:]+$/g, '').trim();
  const existingNode = nodes.find(n => 
    n.id === ref.id || 
    n.label === ref.label || 
    n.label === rawClean || 
    n.label.toLowerCase() === rawClean.toLowerCase() ||
    sanitizeId(n.label) === ref.id ||
    n.id === sanitizeId(rawClean)
  );

  if (existingNode) {
    nodeMap.set(ref.id, existingNode);
    return existingNode.id;
  }

  // 4. Create implicit node
  const type = hintType || ref.type || 'class';
  const category = hintCategory || ref.category || getCategoryForType(type);
  const label = ref.label || rawClean || trimmed;

  const node: DiagramNode = {
    id: ref.id,
    type,
    category,
    label,
    x: 0,
    y: 0,
    width: type === 'usecase' ? 180 : type === 'actor' ? 130 : 180,
    height: type === 'usecase' ? 80 : type === 'actor' ? 85 : 75,
    color: getColorForType(type),
    data: type === 'usecase' ? { shape: 'usecase' } : undefined
  };
  nodes.push(node);
  nodeMap.set(ref.id, node);
  return ref.id;
}

function ensureImplicitNode(
  id: string, 
  rawLabel: string, 
  nodes: DiagramNode[], 
  nodeMap: Map<string, DiagramNode>,
  hintType?: string,
  hintCategory?: DiagramNode['category']
) {
  resolveOrCreateNode(rawLabel, nodes, nodeMap, undefined, hintType, hintCategory);
}

function getCategoryForType(type: string): DiagramNode['category'] {
  if (['class', 'interface', 'abstract-class', 'enum', 'struct', 'protocol', 'exception', 'annotation', 'metaclass', 'object', 'map'].includes(type)) {
    return 'code';
  }
  if (['component', 'port', 'interface-lollipop', 'collections', 'boundary', 'control'].includes(type)) {
    return 'component';
  }
  if (['node', 'database', 'storage', 'cloud', 'queue', 'stack', 'artifact', 'file', 'card', 'hexagon'].includes(type)) {
    return 'infrastructure';
  }
  if (['entity', 'json', 'yaml'].includes(type)) {
    return 'data-schema';
  }
  if (['package', 'namespace', 'frame', 'folder', 'rectangle'].includes(type)) {
    return 'container';
  }
  if (['actor', 'agent'].includes(type)) {
    return 'actor-agent';
  }
  if (['state', 'state-history', 'usecase', 'activity-start', 'activity-stop', 'activity-decision', 'activity-fork', 'activity-flow-final', 'diamond', 'circle'].includes(type)) {
    return 'activity-state';
  }
  if (['embedded-salt', 'embedded-ditaa', 'embedded-math', 'salt-mockup', 'ditaa', 'math'].includes(type)) {
    return 'embedded';
  }
  if (['wbs-node', 'wbs'].includes(type)) {
    return 'wbs';
  }
  if (['note'].includes(type)) {
    return 'annotation';
  }
  return 'code';
}

function getColorForType(type: string): string {
  switch (type) {
    case 'embedded-ditaa': return 'slate';
    case 'embedded-math': return 'sand';
    case 'wbs-node': return 'slate';
    case 'class': return 'sienna';
    case 'abstract-class': return 'terracotta';
    case 'interface': return 'sage';
    case 'enum': return 'sand';
    case 'entity': return 'ochre';
    case 'object': return 'ochre';
    case 'database': return 'ochre';
    case 'storage': return 'sand';
    case 'cloud': return 'sage';
    case 'queue': return 'terracotta';
    case 'stack': return 'slate';
    case 'node': return 'slate';
    case 'note': return 'gold';
    case 'state': return 'sand';
    case 'usecase': return 'sand';
    case 'activity-start':
    case 'activity-stop':
    case 'activity-fork': return 'slate';
    case 'activity-decision': return 'sand';
    case 'state-history': return 'ochre';
    default: return 'sienna';
  }
}

/**
 * Applies a hierarchical rank layout
 */
export function applyAutoLayout(nodes: DiagramNode[], edges: DiagramEdge[]) {
  if (nodes.length === 0) return;

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    const neighbors = adj.get(e.source) || [];
    neighbors.push(e.target);
    adj.set(e.source, neighbors);
  });

  const levels = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach(n => {
    if ((inDegree.get(n.id) || 0) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  // Breadth-First-Search level assignment with cycle protection
  let iterations = 0;
  const maxIterations = Math.max(200, nodes.length * 6);
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const curr = queue.shift()!;
    const currLevel = levels.get(curr) || 0;
    const neighbors = adj.get(curr) || [];

    neighbors.forEach(nxt => {
      const existing = levels.get(nxt);
      // Guard against infinite cycles by capping level depth to nodes.length
      if ((existing === undefined || existing < currLevel + 1) && currLevel + 1 < nodes.length) {
        levels.set(nxt, currLevel + 1);
        queue.push(nxt);
      }
    });
  }

  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  const rankGroups = new Map<number, DiagramNode[]>();
  nodes.forEach(n => {
    const lvl = levels.get(n.id) || 0;
    const group = rankGroups.get(lvl) || [];
    group.push(n);
    rankGroups.set(lvl, group);
  });

  const START_X = 60;
  const START_Y = 50;
  const GAP_X = 130;
  const GAP_Y = 85;
  const MAX_ROW_WIDTH = 1200;

  let currentY = START_Y;
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  sortedRanks.forEach(rank => {
    const group = rankGroups.get(rank)!;
    let currentX = START_X;
    let rowMaxH = 0;

    group.forEach(node => {
      // If adding this node exceeds max row width and we already placed at least 1 node in this row, wrap
      if (currentX > START_X && currentX + node.width > MAX_ROW_WIDTH) {
        currentX = START_X;
        currentY += rowMaxH + GAP_Y;
        rowMaxH = 0;
      }

      node.x = currentX;
      node.y = currentY;
      currentX += node.width + GAP_X;
      if (node.height > rowMaxH) {
        rowMaxH = node.height;
      }
    });

    currentY += rowMaxH + GAP_Y;
  });

  // Final pass: mathematically resolve and eliminate any remaining bounding-box overlaps
  const deoverlapped = resolveOverlaps(nodes, 40);
  deoverlapped.forEach((cleanNode, idx) => {
    if (nodes[idx]) {
      nodes[idx].x = cleanNode.x;
      nodes[idx].y = cleanNode.y;
      nodes[idx].width = cleanNode.width;
      nodes[idx].height = cleanNode.height;
    }
  });

  // Enclose children inside parent containers
  const containers = nodes.filter(n => 
    n.category === 'container' || 
    Boolean(n.data?.isContainer) || 
    n.type === 'package' || 
    n.type === 'frame' || 
    n.type === 'folder' ||
    n.type === 'rectangle'
  );

  containers.forEach(cont => {
    const children = nodes.filter(n => n.id !== cont.id && n.data?.parentId === cont.id);
    if (children.length > 0) {
      const minX = Math.min(...children.map(c => c.x));
      const minY = Math.min(...children.map(c => c.y));
      const maxX = Math.max(...children.map(c => c.x + c.width));
      const maxY = Math.max(...children.map(c => c.y + c.height));
      const PADDING_X = 35;
      const PADDING_Y = 30;
      const HEADER_H = 25;
      cont.x = minX - PADDING_X;
      cont.y = minY - PADDING_Y - HEADER_H;
      cont.width = Math.max(cont.width, (maxX - minX) + PADDING_X * 2);
      cont.height = Math.max(cont.height, (maxY - minY) + PADDING_Y * 2 + HEADER_H);
    }
  });
}

// @flow strict
/*:: import type { NormalNode, StateID, Commit } from './'; */
import { createGraph } from './';
import { createNode, nodeStringSymbol } from './node';
import { getStateId } from './state';

const entries = /*:: <K: string, V>*/(object/*: { +[K]: V }*/)/*: [K, V][]*/ => (Object.entries((object/*: any*/))/*: any*/);

const namespaces = {
  'xhtml': 'http://www.w3.org/1999/xhtml',
  'svg': 'http://www.w3.org/2000/svg',
}

const htmlGraph = (initialNode/*: NormalNode*/, rootElement/*: HTMLElement*/) => {
  const graph = createGraph(initialNode, (cb) => setTimeout(cb, 0));
  let oldChildren = [];
  const elementFromNode = node => {
    const { type } = node; 
    switch (typeof type) {
      case 'string':
        'svg:circle'
        const [elementType, namespaceType = 'xhtml'] = type.split(':', 2).reverse();
        return document.createElementNS(namespaces[namespaceType] || 'http://www.w3.org/1999/xhtml', elementType);
      case 'function':
        return null;
      case 'symbol':
        switch (type) {
          case nodeStringSymbol:
            return document.createTextNode(
              node.props &&
              typeof node.props === 'object' &&
              typeof node.props.content === 'string'
              ? node.props.content : ''
            );
          default:
            return null;
        }
      default:
        throw new Error();
    }
  };
  const elementsFromCommit = ({ node, childCommits })/*: (Element | Text)[]*/ => {
    const element = elementFromNode(node);
    const childElements = childCommits.map(elementsFromCommit).flat(1);

    if (!element)
      return childElements;

    if (typeof node.props === 'object' && node.props) {
      for (const [key, value] of entries(node.props))
        // $FlowFixMe
        element[key] = value;
      if (node.props.style && typeof node.props.style === 'object')
        for (const [key, value] of entries(node.props.style))
          // $FlowFixMe
          element.style[key] = value;
    }

    for (const child of childElements)
      element.appendChild(child)

    return [element];
  };

  const domNodes/*: Map<StateID, Node>*/ = new Map();
  const fragments/*: Map<StateID, StateID[]>*/ = new Map();

  const createNodeForCommit = (commit) => {
    if (commit.node.type === nodeStringSymbol)
      return document.createTextNode('');

    if (typeof commit.node.type === 'string') {
      const [name, namespaceTag = 'xhtml'] = commit.node.type.split(':', 2).reverse();
      const namespace = namespaces[namespaceTag];
      return document.createElementNS(namespace, name);
    }
    // Null components are Fragments
    return null;
  };
  const resolveFragments = (ids/*: StateID[]*/)/*: StateID[]*/ => {
    return ids
      .map(id => {
        if (domNodes.has(id))
          return [id];
        const fragment = fragments.get(id);
        if (fragment)
          return resolveFragments(fragment);
        return [];
      })
      .flat(1)
  };
  const propBlacklist = []
  const setStylesProp = (style, oldRules, newRules) => {
    const rulesEntries = [
      ...(oldRules && typeof oldRules === 'object' ? Object.keys(oldRules).map(rule => [rule, null]) : []),
      ...(newRules && typeof newRules === 'object' ? entries(newRules) : [])
    ];
    for (const [rule, value] of rulesEntries)
      (style/*: Object*/)[rule] = typeof value === 'string' || typeof value === 'number' ? value : '';
  };
  const setEventListenerProp = (domNode, eventName, oldValue, newValue) => {
    console.log(eventName, oldValue, newValue, oldValue === newValue);
    if (typeof oldValue === 'function')
      domNode.removeEventListener(eventName, ((oldValue/*: any*/)/*: EventListener*/));
    if (typeof newValue === 'function')
      domNode.addEventListener(eventName, ((newValue/*: any*/)/*: EventListener*/));
  };
  const setSVGLengthProp = (length, oldValue, newValue) => {
    if (Array.isArray(newValue)) {
      const [value = 0, unit = 0] = newValue;
      if (typeof value === 'number' && typeof unit === 'number')
        length.newValueSpecifiedUnits(((unit/*: any*/)/*: SVGLengthUnit*/), value); 
    }
    else if (typeof newValue === 'string')
      length.valueAsString = newValue;
    else if (typeof newValue === 'number')
      length.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, newValue);
    else
      length.value = 0;
  };
  const setAttributeProp = (domNode, attribute, oldValue, newValue) => {
    if (!newValue && typeof oldValue === 'string')
      domNode.removeAttribute(attribute);
    else if (typeof newValue === 'string')
      domNode.setAttribute(attribute, newValue);
  };
  
  const setProp = (domNode, prop, oldValue, newValue) => {
    if (domNode instanceof HTMLElement) {
      if (prop.startsWith('on'))
        setEventListenerProp(domNode, prop.slice(2).toLowerCase(), oldValue, newValue);
      else if (prop === 'style')
        setStylesProp(domNode.style, oldValue, newValue);
      else if (prop in domNode && !propBlacklist.includes(prop))
        (domNode/*: Object*/)[prop] = newValue;
      else
        setAttributeProp(domNode, prop, oldValue, newValue);
    } else if (domNode instanceof Text) {
      if (prop === 'content')
        domNode.textContent = typeof newValue === 'string' ? newValue : '';
    } else if (domNode instanceof SVGElement) {
      const currentValue = (domNode/*: Object*/)[prop];
      console.log(prop, currentValue);
      if (prop.startsWith('on'))
        setEventListenerProp(domNode, prop.slice(2).toLowerCase(), oldValue, newValue);
      else if (prop === 'style')
        setStylesProp(domNode.style, oldValue, newValue);
      else if (currentValue instanceof SVGAnimatedLength)
        setSVGLengthProp((currentValue/*: SVGAnimatedLength*/).baseVal, oldValue, newValue);
      else if (currentValue instanceof SVGLength)
        setSVGLengthProp((currentValue/*: SVGLength*/), oldValue, newValue);
      else
        setAttributeProp(domNode, prop, oldValue, newValue);
    }
  };

  const onCreated = (event) => {
    const { commit } = event;
    const { node, childCommits } = commit;
    const { props } = node;

    const root = graph.getRoot();
    const id = getStateId(commit.statePath);

    const domNode = createNodeForCommit(commit);
    const childIds = resolveFragments(childCommits.map(c => getStateId(c.statePath)));
    if (!domNode) {
      if (root.id === commit.id)
        rootElement.append(...childIds.map(c => domNodes.get(c)).filter(Boolean));
      return fragments.set(id, childIds);
    }
    const childNodes = childIds.map(c => domNodes.get(c)).filter(Boolean);

    for (const childDomNode of childNodes)
      domNode.appendChild(childDomNode);
  
    if (props && typeof props === 'object')
      for (const [prop, value] of entries(props))
        setProp(domNode, prop, null, value);

    domNodes.set(id, domNode);
    
    if (root.id === commit.id)
      rootElement.appendChild(domNode);
  };
  const onUpdated = (event) => {
    const { commit, diff: { last } } = event;
    const { node } = commit;
    const { props } = node;

    const id = getStateId(commit.statePath);
    const domNode = domNodes.get(id);
    if (!domNode)
      return;

    const lastObjectProps = last && typeof last.node.props === 'object' ? last.node.props : null;
    const objectProps = typeof props === 'object' ? props : null;

    const propEntries = [
      ...(objectProps ? entries(objectProps).filter(([p, v]) => lastObjectProps ? lastObjectProps[p] !== v : true) : []),
      ...(lastProps && lastProps && typeof lastProps === 'object' ? entries(lastProps).map(([p, v]) => [p, null]) : []),
      ...(props && typeof props === 'object' ? entries(props) : []),
    ];

    for (const [prop, value] of propEntries)
      setProp(domNode, prop, null, value);
  };
  const onRemoved = (event) => {
    const { commit } = event;

    const id = getStateId(commit.statePath);
    const domNode = domNodes.get(id);
    if (!domNode)
      return;
    
    const parentDomNode = domNode.parentNode;
    if (parentDomNode)
      parentDomNode.removeChild(domNode)
  };
  const getNodeName = type => typeof type === 'function' ? type.name : type;
  const onEvent = (event) => {
    //console.log(event.type, getNodeName(event.commit.node.type))
    switch (event.type) {
      case 'created':
        return onCreated(event);
      case 'updated':
        return onUpdated(event);
      case 'removed':
        return onRemoved(event);
    }
  };
  graph.listen(events => {
    try {
      console.log(events);
      for (const event of events)
        onEvent(event);
      console.log('root', getNodeName(graph.getRoot().node.type));
    } catch (error) {
      console.error(error);
    }
  });
};

export {
  createNode,
  createNode as h,
  htmlGraph,
  htmlGraph as render
};
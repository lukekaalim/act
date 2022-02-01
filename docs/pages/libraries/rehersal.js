// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
/*:: import type { CubicBezier } from '@lukekaalim/act-curve'; */
import {
  getBezierVelocityWeights,
} from "../../../libraries/curve/bezier";
import { createId, h, useMemo, useState } from '@lukekaalim/act';
import { getCubicPoint, getBerenstienCubicPoint, getBezierWeights, getBezierVelocity, getBezierAcceleration } from '@lukekaalim/act-curve';
import { Document, TabbedToolbox, Workspace, TextInput, GridBench, NumberInput, BooleanInput, Markdown } from '@lukekaalim/act-rehersal';
import rehersalReadmeText from '@lukekaalim/act-rehersal/README.md?raw';

const primitiveText = `
# Input Components

There are three basic components for quickly building tools to change
primitive values such as strings, numbers, and booleans.

 - TextInput
 - NumberInput
 - BooleanInput

${'```'}ts
import {
  TextInput,
  NumberInput,
  BooleanInput
} from '@lukekaalim/act-rehersal';

const MyComponent = () => {
  const [value, setValue] = useState('initial text');

  return [
    h(TextInput, { value, onChange: setValue })
  ]
};
${'```'}
`;

const textInputText = `
### TextInput

${'```'}ts
type TextInputProps = {
  disabled?: boolean,
  label?: string,
  value?: string,
  onChange?: string => mixed,
  onInput?: string => mixed,
};
${'```'}
`
const numberInputText = `
### NumberInput
${'```'}ts
type NumberInputProps = {
  disabled?: boolean,
  label?: string,
  value?: number,
  hasRange?: boolean,
  min?: number,
  max?: number,
  step?: number,
  onChange?: number => mixed,
  onInput?: number => mixed,
};
${'```'}
`
const booleanInputText = `
### BooleanInput
${'```'}ts
type BooleanInputProps = {
  disabled?: boolean,
  label?: string,
  value?: boolean,
  onChange?: boolean => mixed,
  onInput?: boolean => mixed,
};
${'```'}
`

export const primitivesPage/*: Page*/ = {
  link: { href: '/libraries/rehersal/inputs', name: 'Input Components', children: [] },
  content: h(() => {
    const [disabled, setDisabled] = useState({ text: false, number: false, boolean: false })
    const [label, setLabels] = useState({ text: 'text label', number: 'number label', boolean: 'boolean label' })

    const [range, setRange] = useState({ min: 0, max: 100, step: 1, hasRange: true })

    const [stringValue, setStringValue] = useState('initial string value');
    const [numberValue, setNumberValue] = useState(0);
    const [booleanValue, setBooleanValue] = useState(false);

    return h(Workspace, {
      bench: h(GridBench, {}, [
        h('div', { style: { padding: '12px' }}, [
          h(TextInput, {
            label: label.text,
            value: stringValue,
            onChange: setStringValue,
            disabled: disabled.text
          }),
          h(NumberInput, {
            label: label.number,
            min: range.min,
            max: range.max,
            step: range.step,
            value: numberValue,
            onChange: setNumberValue,
            disabled: disabled.number,
            hasRange: range.hasRange,
          }),
          h(BooleanInput, {
            label: label.boolean,
            value: booleanValue,
            onChange: setBooleanValue,
            disabled: disabled.boolean
          }),
        ])
      ]),
      tools: h(TabbedToolbox, { tabs: {
        'Usage': h(Document, { text: primitiveText }),
        'Text': [
          h(Document, { text: textInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.text, onChange: text => setDisabled({ ...disabled, text }) }),
          h(TextInput, { label: 'Label', value: label.text, onChange: text => setLabels({ ...label, text })  })
        ],
        'Number': [
          h(Document, { text: numberInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.number, onChange: number => setDisabled({ ...disabled, number }) }),
          h(TextInput, { label: 'Label', value: label.number, onChange: number => setLabels({ ...label, number })  }),
          h(NumberInput, { label: 'Min', value: range.min, onChange: min => setRange({ ...range, min }) }),
          h(NumberInput, { label: 'Max', value: range.max, onChange: max => setRange({ ...range, max }) }),
          h(NumberInput, { label: 'Step', value: range.step, onChange: step => setRange({ ...range, step }) }),
          h(BooleanInput, { label: 'HasRange', value: range.hasRange, onChange: hasRange => setRange({ ...range, hasRange }) }),
        ],
        'Boolean': [
          h(Document, { text: booleanInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.boolean, onChange: boolean => setDisabled({ ...disabled, boolean }) }),
          h(TextInput, { label: 'Label', value: label.boolean, onChange: boolean => setLabels({ ...label, boolean })  }),
        ],
      }})
    });
  })
}


export const BezierPolyline/*: Component<{ bezier: CubicBezier, samples?: number }>*/ = ({ bezier, samples = 100 }) => {
  const polylinePositionPoints = useMemo(() => {
    const points = sampleGraphFunction(t => getBerenstienCubicPoint(bezier, t), samples);
    return toPolylinePoints(points.map((p, i) => [p, i]));
  }, [...bezier, samples]);
  const polylineVelocityPoints = useMemo(() => {
    const points = sampleGraphFunction(t => getBezierVelocity(bezier, t), samples);
    return toPolylinePoints(points.map((p, i) => [p, i]));
  }, [...bezier, samples]);
  const polylineControlPoints = useMemo(() => {
    return toPolylinePoints(bezier.map((p, i) => [p, i * 33.33]));
  }, [...bezier]);

  return [
    h('polyline', { points: polylinePositionPoints, fill: 'none', stroke: 'black', ['stroke-width']: '0.3' }),
    h('polyline', { points: polylineVelocityPoints, fill: 'none', stroke: 'blue', ['stroke-width']: '0.2' }),
    h('polyline', { points: polylineControlPoints, fill: 'none', stroke: 'red', ['stroke-width']: '0.2' }),
    bezier.map((control, i) => 
      h('circle', { cx: control, cy: i * 33.33, r: 1, fill: 'white', stroke: 'black', 'stroke-width': 0.1 }))
  ]
}

const sampleGraphFunction = /*:: <T>*/(graphFunction/*: number => T*/, samples/*: number*/)/*: T[]*/ => {
  const points = [];
  for (let i = 0; i < samples; i ++)
    points.push(graphFunction(i/samples));
  return points;
}
const toPolylinePoints = (points/*: [number, number][]*/) => {
  return points
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

const useDragging = (initialOffset = [0, 0], initialScale = 1, [width, height] = []) => {
  const [dragging, setDragging] = useState(false);
  const [[offset, scale], setCamera] = useState/*:: <[[number, number], number]>*/([initialOffset, initialScale]);
  const events = useMemo(() => {
    const onPointerDown = (e) => {
      setDragging(true);
      e.target.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e) => {
      setDragging(false);
      e.target.releasePointerCapture(e.pointerId);
    }
    const onPointerMove = dragging ? (e) => {
      if (dragging)
        setCamera(([[x, y], s]) => [[x - e.movementX, y - e.movementY], s]);
    } : null;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = e.target.getBoundingClientRect();
      
      const mouseX = e.clientX - rect.x;
      const mouseY = e.clientY - rect.y;
      
      setCamera(([[x, y], s]) => {
        const delta = e.deltaY / -1000;
        const nextScale = s * (1 + delta);

        return [[((x + mouseX) / s) * nextScale - mouseX, ((y + mouseY) / s) * nextScale - mouseY], nextScale]
      });
    }
    return { onPointerDown, onPointerUp, onPointerMove, onWheel };
  }, [dragging, width, height]);

  return [offset, scale, events, setCamera];
}

const clamp = (min, max, v) => {
  return Math.min(max, Math.max(min, v));
}
const mod = (n, m) => ((n % m) + m) % m;

const calculateAxisOffset = (size, offset) => {
  return clamp(strokeWidth/2, size - (strokeWidth/2), -offset);
}
const strokeWidth = 4;

const VerticalAxis = ({ size: [width, height], offset: [x, y], color, children, childrenSize = 12 }) => {
  const axisOffset = calculateAxisOffset(width, x)
  const strokeProps = {
    stroke: color,
    ['stroke-width']: strokeWidth,
  };
  const axisChildrenOffset = clamp(strokeWidth, width - (childrenSize / 2), -x);

  return [
    h('line', { y1: 0, y2: '100%', x1: axisOffset, x2: axisOffset, ...strokeProps }),
    h('g', { transform: `translate(${axisChildrenOffset}, ${0})` }, [
      children,
    ]),
  ];
}

const HorizontalAxis = ({ size: [width, height], offset: [x, y], color, children, childrenSize = 12 }) => {
  const axisOffset = calculateAxisOffset(height, y)
  const strokeProps = {
    stroke: color,
    ['stroke-width']: strokeWidth,
  };
  const axisChildrenOffset = clamp(strokeWidth + childrenSize, height - strokeWidth, -y);

  return [
    h('line', { x1: 0, x2: '100%', y1: axisOffset, y2: axisOffset, ...strokeProps }),
    h('g', { transform: `translate(${0}, ${axisChildrenOffset})` }, [
      children,
    ]),
  ];
}

const calculateAxisPips = (offset, gridInterval, scale, size) => {
  const pixelsPerGridInterval = scale * gridInterval;
  // since the "offset" defines the left/top of the screen, getting the closest 
  const gridOffset = -mod(offset, pixelsPerGridInterval);
  const gridCount = Math.ceil(size / pixelsPerGridInterval) + 1;
  const gridStartValue = Math.floor(offset / pixelsPerGridInterval) * gridInterval;
  const pips = Array
    .from({ length: gridCount })
    .map((_, index) => {
      const pipOffset = gridOffset + (index * pixelsPerGridInterval);
      const pipValue = gridStartValue + (index * gridInterval);
      return { pipOffset, pipValue };
    })
  return pips;
}
const HorizontalPips = ({ scale, gridInterval, size: [width, ], offset: [x, ] }) => {
  const pips = calculateAxisPips(x, gridInterval, scale, width);
  
  return pips.map(({ pipOffset, pipValue }) =>
    h('text', { x: pipOffset, y: 0, 'font-size': 12, 'fill': 'rgba(0, 0, 0, 0.3)' }, pipValue));
}
const VerticalPips = ({ scale, gridInterval, size: [, height], offset: [, y] }) => {
  const pips = calculateAxisPips(y, gridInterval, scale, height);
  
  return pips.map(({ pipOffset, pipValue }) =>
    h('text', { y: pipOffset, x: 0, 'font-size': 12, 'fill': 'rgba(0, 0, 0, 0.3)' }, pipValue));
}
const GridSquarePattern = ({ gridPatternId, offset: [x, y], gridScale  }) => {
  return (
    h('pattern', {
      id: gridPatternId,
      x: -x,
      y: -y,
      width: gridScale,
      height: gridScale,
      patternUnits: 'userSpaceOnUse'
    }, [
      h('rect', {
        width: gridScale,
        height: gridScale,
        x: 0, y: 0,
        fill: 'none',
        strokeWidth: 2,
        stroke: 'rgba(0, 0, 0, 0.5)'
      }),
      h('line', {
        x1: gridScale/2, y1: 0,
        x2: gridScale/2, y2: gridScale,
        fill: 'none',
        opacity: (gridScale / 70) - 1,
        strokeWidth: 1,
        stroke: 'rgba(0, 0, 0, 0.3)'
      }),
      h('line', {
        y1: gridScale/2, x1: 0,
        y2: gridScale/2, x2: gridScale,
        fill: 'none',
        opacity: (gridScale / 70) - 1,
        strokeWidth: 1,
        stroke: 'rgba(0, 0, 0, 0.3)'
      })
    ])
  );
};

/*::
export type AxisGrid2DProps = {
  offset: [number, number],
  scale: number,
  size: [number, number],
  
  gridInterval?: number,

  namespaceId: string,
};
*/

const AxisGrid2D/*: Component<AxisGrid2DProps>*/ = ({
  size,
  offset,
  scale,
  children,
  gridInterval = 100,
  namespaceId,
}) => {
  const [width, height] = size;
  const gridPatternId = `${namespaceId}:grid`;
  const gridScale = gridInterval * scale;

  return [
    h('defs', {}, [
      h(GridSquarePattern, { gridScale, offset, gridPatternId })
    ]),
    h(HorizontalAxis, { size, offset, scale, gridInterval, color: 'rgb(128, 179, 238)', childrenSize: 12 },
      h(HorizontalPips, { size, offset, scale, gridInterval })),
    h(VerticalAxis, { size, offset, scale, color: 'rgb(238, 128, 128)', childrenSize: 64 },
      h(VerticalPips, { size, offset, scale, gridInterval })),
    h('rect', { x: '0', y: '0', width, height, fill: `url(#${gridPatternId})` }),
    h('g', { transform: `translate(${-offset[0]}, ${-offset[1]}) scale(${scale})` }, children),
  ];
}

/*::
export type DragAxisGrid2DProps = {
  size?: [number, number],
  initialScale?: number,
  initialOffset?: number,
  gridInterval?: number,

  id?: string,
};
*/

const DraggableGraphGrid2D/*: Component<DragAxisGrid2DProps>*/ = ({
  children,
  size = [720, 300],
  gridInterval = 20,
  initialScale = 3,
  id = createId(),
}) => {
  const [width, height] = size;
  const [offset, scale, events] = useDragging([-0, -0], initialScale, size);
  const [namespaceId] = useState(id);

  return h('svg', { id: namespaceId, width, height, ...events, xmlns: 'http://www.w3.org/2000/svg' }, [
    h(AxisGrid2D, { offset, scale, namespaceId, size, gridInterval }, children)
  ])
};

export const rehersalPage/*: Page*/ = {
  link: { href: '/libraries/rehersal', name: 'Rehersal', children: [
    //{ name: 'exports', children: [primitivesPage.link] }
  ] },
  content: h(Document, {}, [
    h(() => {
      return [
        h(Markdown, { text: rehersalReadmeText }),
        /*
        h('div', { style: { display: 'flex', flexDirection: 'column' }}, [
          h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: t, onInput: onITnput }),
          h('div', { style: { display: 'flex' } }, [
            h('input', { type: 'range', min: 0, max: 200, step: 1, value: dest + 100, onInput: onDestInput }),
            h('button', { onClick: () => {
              setCurves(curves => [...curves, {
                distance: currentCurveDistance + (t * 100),
                controls: [point, p2, dest, dest],
              }])
              setT(0);
            } }, 'Change Target'),
          ]),

          h(DraggableGraphGrid2D, { size: [720, 720], gridInterval: 20, initialScale: 3 }, [
            h('circle', { cx: point, cy: currentCurveDistance + (t * 100), r: 2, fill: 'blue' }),

            [...curves].map(({ controls, distance }) => h('g', { transform: `translate(0, ${distance})` }, [
              h(BezierPolyline, { bezier: controls }),
            ])),
            h('g', { transform: `translate(0, ${currentCurveDistance + (t * 100)})` }, [
              h(BezierPolyline, { bezier: [point, p2, dest, dest], t, velocity }),
            ]),
          ]),
        ]),
        */
      ];
    }),
  ])
}

export const rehersalPages = [rehersalPage, primitivesPage];
import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SingleTrackTimelinePanel } from './components/SingleTrackTimelinePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SingleTrackTimelinePanel).setPanelOptions((builder) => {
  return builder
    .addFieldNamePicker({
      path: 'startTimeField',
      name: 'Start time field',
      description: 'Column used as the segment start time.',
      defaultValue: 'start',
      category: ['Fields'],
    })
    .addFieldNamePicker({
      path: 'endTimeField',
      name: 'End time field',
      description: 'Column used as the segment end time. If omitted, the next segment start is used.',
      defaultValue: 'end',
      category: ['Fields'],
    })
    .addFieldNamePicker({
      path: 'colorByField',
      name: 'Color by field',
      description: 'Column whose value decides the segment color.',
      defaultValue: 'status',
      category: ['Fields'],
    })
    .addFieldNamePicker({
      path: 'labelField',
      name: 'Label field',
      description: 'Column displayed inside each segment when labels are enabled.',
      defaultValue: 'status',
      category: ['Fields'],
    })
    .addStringArray({
      path: 'tooltipFields',
      name: 'Tooltip fields',
      description: 'Columns shown in the hover tooltip.',
      defaultValue: [],
      category: ['Fields'],
      settings: {
        placeholder: 'field name',
      },
    })
    .addTextInput({
      path: 'colorMappings',
      name: 'Color mappings',
      description: 'One mapping per line, for example: running=#73BF69. JSON objects are also supported.',
      defaultValue: '',
      category: ['Colors'],
      settings: {
        useTextarea: true,
        rows: 6,
      },
    })
    .addNumberInput({
      path: 'laneHeight',
      name: 'Lane height',
      description: 'Height of the single status bar in pixels.',
      defaultValue: 28,
      category: ['Display'],
      settings: {
        min: 8,
        max: 120,
        integer: true,
      },
    })
    .addNumberInput({
      path: 'barRadius',
      name: 'Bar radius',
      description: 'Corner radius of each segment.',
      defaultValue: 3,
      category: ['Display'],
      settings: {
        min: 0,
        max: 24,
        integer: true,
      },
    })
    .addBooleanSwitch({
      path: 'showLabels',
      name: 'Show labels',
      defaultValue: true,
      category: ['Display'],
    })
    .addBooleanSwitch({
      path: 'tooltipWrap',
      name: 'Wrap tooltip values',
      defaultValue: true,
      category: ['Display'],
    });
});

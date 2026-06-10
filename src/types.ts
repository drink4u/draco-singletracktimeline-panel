export interface SimpleOptions {
  startTimeField: string;
  endTimeField: string;
  colorByField: string;
  labelField: string;
  tooltipFields: string[];
  colorMappings: string;

  laneHeight: number;
  barRadius: number;
  showLabels: boolean;
  tooltipWrap: boolean;
}

export interface IntervalRecord {
  start: number;
  end: number;
  colorValue: string;
  label: string;
  raw: Record<string, unknown>;
}

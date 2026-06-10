import React, { useMemo, useState } from 'react';
import { DataFrame, Field, GrafanaTheme2, PanelProps } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { IntervalRecord, SimpleOptions } from 'types';

interface Props extends PanelProps<SimpleOptions> {}

interface HoverState {
  record: IntervalRecord;
  x: number;
  y: number;
}

const fallbackPalette = ['green', 'blue', 'orange', 'purple', 'yellow', 'red'];

const defaultOptions: SimpleOptions = {
  startTimeField: 'start',
  endTimeField: 'end',
  colorByField: 'status',
  labelField: 'status',
  tooltipFields: [],
  colorMappings: '',
  laneHeight: 28,
  barRadius: 3,
  showLabels: true,
  tooltipWrap: true,
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      font-family: ${theme.typography.fontFamily};
      position: relative;
      overflow: hidden;
      color: ${theme.colors.text.primary};
    `,
    empty: css`
      align-items: center;
      color: ${theme.colors.text.secondary};
      display: flex;
      height: 100%;
      justify-content: center;
      width: 100%;
    `,
    axisLabel: css`
      fill: ${theme.colors.text.secondary};
      font-size: 11px;
    `,
    segmentLabel: css`
      fill: ${theme.colors.text.maxContrast};
      font-size: 11px;
      font-weight: ${theme.typography.fontWeightMedium};
      pointer-events: none;
    `,
    tooltip: css`
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.colors.border.strong};
      border-radius: ${theme.shape.radius.default};
      box-shadow: ${theme.shadows.z3};
      color: ${theme.colors.text.primary};
      font-size: 12px;
      line-height: 1.35;
      max-width: 360px;
      padding: ${theme.spacing(1)};
      pointer-events: none;
      position: absolute;
      z-index: 1;
    `,
    tooltipRow: css`
      display: grid;
      gap: ${theme.spacing(1)};
      grid-template-columns: max-content minmax(0, 1fr);
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    `,
    tooltipName: css`
      color: ${theme.colors.text.secondary};
    `,
    tooltipValue: css`
      min-width: 0;
      overflow-wrap: anywhere;
    `,
    tooltipValueNoWrap: css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
  };
};

export const SingleTrackTimelinePanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  id,
  timeRange,
}) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const config = useMemo(() => ({ ...defaultOptions, ...options }), [options]);
  const [hover, setHover] = useState<HoverState | null>(null);

  const records = useMemo(() => getIntervalRecords(data.series, config), [data.series, config]);
  const colorMappings = useMemo(() => parseColorMappings(config.colorMappings), [config.colorMappings]);
  const rangeStart = timeRange.from.valueOf();
  const rangeEnd = timeRange.to.valueOf();
  const visibleRecords = useMemo(() => getVisibleRecords(records, rangeStart, rangeEnd), [records, rangeStart, rangeEnd]);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsTimeField />;
  }

  if (records.length === 0) {
    return (
      <div
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      >
        <div className={styles.empty}>No valid segments</div>
      </div>
    );
  }

  if (visibleRecords.length === 0) {
    return (
      <div
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      >
        <div className={styles.empty}>No segments in selected time range</div>
      </div>
    );
  }

  const paddingX = 10;
  const axisHeight = 18;
  const laneHeight = clamp(config.laneHeight, 8, Math.max(8, height - axisHeight - 12));
  const laneY = Math.max(6, Math.floor((height - axisHeight - laneHeight) / 2));
  const axisY = Math.min(height - 2, laneY + laneHeight + 14);
  const minTime = rangeStart;
  const maxTime = rangeEnd;
  const timeSpan = Math.max(1, maxTime - minTime);
  const drawableWidth = Math.max(1, width - paddingX * 2);
  const xForTime = (time: number) => paddingX + ((time - minTime) / timeSpan) * drawableWidth;
  const tooltipFields = getTooltipFields(config, visibleRecords);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
      onMouseLeave={() => setHover(null)}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg" data-testid="single-lane-timeline">
        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={axisY}
          y2={axisY}
          stroke={theme.colors.border.medium}
          strokeWidth={1}
        />
        <text className={styles.axisLabel} x={paddingX} y={height - 3}>
          {formatTime(minTime)}
        </text>
        <text className={styles.axisLabel} x={width - paddingX} y={height - 3} textAnchor="end">
          {formatTime(maxTime)}
        </text>

        {visibleRecords.map((record, index) => {
          const x = xForTime(record.start);
          const nextX = xForTime(record.end);
          const segmentWidth = Math.max(1, nextX - x);
          const color = getRecordColor(record.colorValue, colorMappings, theme, index);

          return (
            <g key={`${record.start}-${record.end}-${index}`}>
              <rect
                data-testid="timeline-segment"
                x={x}
                y={laneY}
                width={segmentWidth}
                height={laneHeight}
                rx={config.barRadius}
                ry={config.barRadius}
                fill={color}
                onMouseEnter={(event) => setHover({ record, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })}
                onMouseMove={(event) => setHover({ record, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })}
              />
              {config.showLabels && record.label && segmentWidth > 34 && (
                <text className={styles.segmentLabel} x={x + 6} y={laneY + laneHeight / 2 + 4}>
                  {truncate(record.label, Math.max(3, Math.floor(segmentWidth / 7)))}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className={styles.tooltip}
          style={{
            left: Math.min(width - 20, hover.x + 12),
            top: Math.max(4, hover.y - 8),
            transform: hover.x > width - 220 ? 'translateX(-100%)' : undefined,
          }}
        >
          {tooltipFields.map((fieldName) => (
            <div className={styles.tooltipRow} key={fieldName}>
              <span className={styles.tooltipName}>{fieldName}</span>
              <span className={cx(styles.tooltipValue, !config.tooltipWrap && styles.tooltipValueNoWrap)}>
                {formatValue(hover.record.raw[fieldName])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getIntervalRecords(frames: DataFrame[], options: SimpleOptions): IntervalRecord[] {
  const records: IntervalRecord[] = [];

  for (const frame of frames) {
    const startField = findField(frame, options.startTimeField) ?? findFirstTimeField(frame);
    const endField = findField(frame, options.endTimeField);
    const colorField = findField(frame, options.colorByField);
    const labelField = findField(frame, options.labelField) ?? colorField;

    if (!startField) {
      continue;
    }

    for (let index = 0; index < frame.length; index += 1) {
      const start = toTimestamp(startField.values[index]);
      const explicitEnd = endField ? toTimestamp(endField.values[index]) : undefined;
      const inferredEnd = toTimestamp(startField.values[index + 1]);
      const end = explicitEnd ?? inferredEnd;

      if (start === undefined || end === undefined || end <= start) {
        continue;
      }

      records.push({
        start,
        end,
        colorValue: stringifyValue(colorField?.values[index] ?? labelField?.values[index] ?? ''),
        label: stringifyValue(labelField?.values[index] ?? colorField?.values[index] ?? ''),
        raw: getRow(frame, index),
      });
    }
  }

  return records.sort((a, b) => a.start - b.start || a.end - b.end);
}

function getVisibleRecords(records: IntervalRecord[], rangeStart: number, rangeEnd: number): IntervalRecord[] {
  return records
    .filter((record) => record.end > rangeStart && record.start < rangeEnd)
    .map((record) => ({
      ...record,
      start: Math.max(record.start, rangeStart),
      end: Math.min(record.end, rangeEnd),
    }));
}

function findField(frame: DataFrame, fieldName?: string): Field | undefined {
  const normalizedName = fieldName?.trim().toLowerCase();

  if (!normalizedName) {
    return undefined;
  }

  return frame.fields.find((field) => field.name.toLowerCase() === normalizedName);
}

function findFirstTimeField(frame: DataFrame): Field | undefined {
  return frame.fields.find((field) => field.type === 'time');
}

function getRow(frame: DataFrame, index: number): Record<string, unknown> {
  return frame.fields.reduce<Record<string, unknown>>((row, field) => {
    row[field.name] = field.values[index];
    return row;
  }, {});
}

function getTooltipFields(options: SimpleOptions, records: IntervalRecord[]): string[] {
  if (options.tooltipFields.length > 0) {
    return options.tooltipFields;
  }

  const firstRecord = records[0];
  return firstRecord ? Object.keys(firstRecord.raw) : [];
}

function parseColorMappings(input?: string): Record<string, string> {
  if (!input?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key.toLowerCase()] = value;
        }
        return acc;
      }, {});
    }
  } catch {
    // Fall through to the line based parser.
  }

  return input.split(/\r?\n|,/).reduce<Record<string, string>>((acc, line) => {
    const [key, color] = line.split(/[=:]/).map((part) => part.trim());
    if (key && color) {
      acc[key.toLowerCase()] = color;
    }
    return acc;
  }, {});
}

function getRecordColor(
  colorValue: string,
  mappings: Record<string, string>,
  theme: GrafanaTheme2,
  fallbackIndex: number
): string {
  const mappedColor = mappings[colorValue.toLowerCase()];
  if (mappedColor) {
    return mappedColor.startsWith('#') || mappedColor.startsWith('rgb') ? mappedColor : theme.visualization.getColorByName(mappedColor);
  }

  const paletteColor = fallbackPalette[hashString(colorValue || String(fallbackIndex)) % fallbackPalette.length];
  return theme.visualization.getColorByName(paletteColor);
}

function toTimestamp(value: unknown): number | undefined {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function formatTime(value: number): string {
  return new Date(value).toLocaleString();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatTime(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 100000000000) {
    return formatTime(value);
  }

  return stringifyValue(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string): number {
  return value.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 0);
}

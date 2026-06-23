import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { css, cx } from '@emotion/css';
import {
  DataFrame,
  dateTimeFormat,
  Field,
  GrafanaTheme2,
  PanelProps,
  systemDateFormats,
} from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import { TimeZone } from '@grafana/schema';
import { measureText, useStyles2, useTheme2 } from '@grafana/ui';

import { IntervalRecord, SimpleOptions } from 'types';

interface Props extends PanelProps<SimpleOptions> {}

interface HoverState {
  record: IntervalRecord;
  x: number;
  y: number;
}
interface SelectionState {
  startX: number;
  currentX: number;
}
interface AxisTick {
  value: number;
  label: string;
}

interface TimeAxis {
  ticks: AxisTick[];
}

const fallbackPalette = ['green', 'blue', 'orange', 'purple', 'yellow', 'red'];
const minSelectionWidth = 5;
const uPlotAxisFontSize = 12;
const uPlotAxisGap = 5;
const uPlotTickSize = 4;
const xTickSpacingNormal = 40;
const xTickValueGap = 18;
const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const month = 30 * day;
const year = 365 * day;
const timeUnitSize = {
  second,
  minute,
  hour,
  day,
  month: 28 * day,
  year,
};
const timeIncrements = [
  ...generateUPlotIncrements(10, 0, 3, [1, 2, 2.5, 5]).filter((increment) => increment % 1 === 0),
  second,
  5 * second,
  10 * second,
  15 * second,
  30 * second,
  minute,
  5 * minute,
  10 * minute,
  15 * minute,
  30 * minute,
  hour,
  2 * hour,
  3 * hour,
  4 * hour,
  6 * hour,
  8 * hour,
  12 * hour,
  day,
  2 * day,
  3 * day,
  4 * day,
  5 * day,
  6 * day,
  7 * day,
  8 * day,
  9 * day,
  10 * day,
  15 * day,
  month,
  2 * month,
  3 * month,
  4 * month,
  6 * month,
  year,
  2 * year,
  5 * year,
  10 * year,
  25 * year,
  50 * year,
  100 * year,
];

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
      font-size: ${uPlotAxisFontSize}px;
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
      position: fixed;
      z-index: 99999;
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
    selection: css`
      pointer-events: none;
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
  timeZone,
  onChangeTimeRange,
}) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const config = useMemo(() => ({ ...defaultOptions, ...options }), [options]);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const records = useMemo(() => getIntervalRecords(data.series, config), [data.series, config]);
  const colorMappings = useMemo(() => parseColorMappings(config.colorMappings), [config.colorMappings]);
  const rangeStart = timeRange.from.valueOf();
  const rangeEnd = timeRange.to.valueOf();
  const visibleRecords = useMemo(
    () => getVisibleRecords(records, rangeStart, rangeEnd),
    [records, rangeStart, rangeEnd]
  );

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
  const axisHeight = uPlotTickSize + uPlotAxisGap + uPlotAxisFontSize;
  const laneHeight = clamp(config.laneHeight, 8, Math.max(8, height - axisHeight - 12));
  const laneY = Math.max(6, Math.floor((height - axisHeight - laneHeight) / 2));
  const axisY = Math.max(0, height - axisHeight);
  const tickY = axisY + uPlotTickSize;
  const labelY = tickY + uPlotAxisGap + uPlotAxisFontSize - 1;
  const minTime = rangeStart;
  const maxTime = rangeEnd;
  const timeSpan = Math.max(1, maxTime - minTime);
  const drawableWidth = Math.max(1, width - paddingX * 2);
  const xForTime = (time: number) => paddingX + ((time - minTime) / timeSpan) * drawableWidth;
  const timeForX = (x: number) => minTime + ((x - paddingX) / drawableWidth) * timeSpan;
  const axis = getTimeAxisTicks(minTime, maxTime, drawableWidth, timeZone);
  const gridColor = theme.isDark ? 'rgba(240, 250, 255, 0.09)' : 'rgba(0, 10, 23, 0.09)';
  const tooltipFields = getTooltipFields(config, visibleRecords);
  const getSvgX = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return clamp(event.clientX - rect.left, paddingX, width - paddingX);
  };
  const updateHover = (record: IntervalRecord, event: React.MouseEvent<SVGRectElement>) => {
    if (selection) {
      return;
    }

    setHover({
      record,
      x: event.clientX,
      y: event.clientY,
    });
  };
  const finishSelection = (selectionState: SelectionState, currentX: number) => {
    const startX = clamp(Math.min(selectionState.startX, currentX), paddingX, width - paddingX);
    const endX = clamp(Math.max(selectionState.startX, currentX), paddingX, width - paddingX);

    if (endX - startX < minSelectionWidth) {
      setSelection(null);
      return;
    }

    onChangeTimeRange({
      from: Math.floor(timeForX(startX)),
      to: Math.ceil(timeForX(endX)),
    });
    setSelection(null);
  };

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
      <svg
        width={width}
        height={height}
        style={{
          cursor: selection ? 'col-resize' : 'zoom-in',
          touchAction: 'none',
          userSelect: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
        data-testid="single-lane-timeline"
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }

          const x = getSvgX(event);
          event.currentTarget.setPointerCapture(event.pointerId);
          setHover(null);
          setSelection({
            startX: x,
            currentX: x,
          });
        }}
        onPointerMove={(event) => {
          const currentX = getSvgX(event);

          setSelection((selectionState) =>
            selectionState
              ? {
                  ...selectionState,
                  currentX,
                }
              : selectionState
          );
        }}
        onPointerUp={(event) => {
          if (!selection) {
            return;
          }

          const currentX = getSvgX(event);

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }

          finishSelection(selection, currentX);
        }}
        onPointerCancel={() => {
          setSelection(null);
        }}
      >
        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={axisY}
          y2={axisY}
          stroke={gridColor}
          strokeWidth={1}
        />
        {axis.ticks.map((tick) => {
          const x = xForTime(tick.value);

          return (
            <g key={tick.value}>
              <line x1={x} x2={x} y1={0} y2={axisY} stroke={gridColor} strokeWidth={1} />
              <line x1={x} x2={x} y1={axisY} y2={tickY} stroke={gridColor} strokeWidth={1} />

              <text
                className={styles.axisLabel}
                x={x}
                y={labelY}
                textAnchor={getTickAnchor(tick.value, minTime, maxTime)}
              >
                {tick.label}
              </text>
            </g>
          );
        })}
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
                onMouseEnter={(event) => updateHover(record, event)}
                onMouseMove={(event) => updateHover(record, event)}
              />
              {config.showLabels && record.label && segmentWidth > 34 && (
                <text className={styles.segmentLabel} x={x + 6} y={laneY + laneHeight / 2 + 4}>
                  {truncate(record.label, Math.max(3, Math.floor(segmentWidth / 7)))}
                </text>
              )}
            </g>
          );
        })}
        {selection &&
          (() => {
            const left = clamp(Math.min(selection.startX, selection.currentX), paddingX, width - paddingX);
            const right = clamp(Math.max(selection.startX, selection.currentX), paddingX, width - paddingX);

            return (
              <g className={styles.selection}>
                <rect x={left} y={0} width={right - left} height={height} fill={theme.colors.primary.transparent} />
                <line x1={left} x2={left} y1={0} y2={height} stroke={theme.colors.primary.main} strokeWidth={1} />
                <line x1={right} x2={right} y1={0} y2={height} stroke={theme.colors.primary.main} strokeWidth={1} />
                <rect x={left} y={0} width={right - left} height={4} fill={theme.colors.primary.main} opacity={0.35} />
              </g>
            );
          })()}
      </svg>

      {hover &&
        createPortal(
          <div
            className={styles.tooltip}
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
            }}
          >
            {tooltipFields.map((fieldName) => (
              <div className={styles.tooltipRow} key={fieldName}>
                <span className={styles.tooltipName}>{fieldName}</span>

                <span className={cx(styles.tooltipValue, !config.tooltipWrap && styles.tooltipValueNoWrap)}>
                  {formatValue(hover.record.raw[fieldName], timeZone)}
                </span>
              </div>
            ))}
          </div>,
          document.body
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
    return mappedColor.startsWith('#') || mappedColor.startsWith('rgb')
      ? mappedColor
      : theme.visualization.getColorByName(mappedColor);
  }

  const paletteColor = fallbackPalette[hashString(colorValue || String(fallbackIndex)) % fallbackPalette.length];
  return theme.visualization.getColorByName(paletteColor);
}

function getTimeAxisTicks(minTime: number, maxTime: number, drawableWidth: number, timeZone: TimeZone): TimeAxis {
  const span = Math.max(1, maxTime - minTime);
  const increment = getTimeIncrement(minTime, maxTime, drawableWidth, timeZone);
  const values = getAlignedTimeTickValues(minTime, maxTime, increment);
  const ticks = values.map((value) => ({
    value,
    label: formatAxisTime(value, span, increment, timeZone),
  }));

  return {
    ticks,
  };
}

function getTimeIncrement(minTime: number, maxTime: number, drawableWidth: number, timeZone: TimeZone): number {
  const span = Math.max(1, maxTime - minTime);
  const maxTicks = drawableWidth / xTickSpacingNormal;
  const roughIncrement = span / Math.max(1, maxTicks);
  const sampleLabel = formatAxisTime(Math.max(Math.abs(minTime), Math.abs(maxTime)), span, roughIncrement, timeZone);
  const minSpace = measureText(sampleLabel, uPlotAxisFontSize).width + xTickValueGap;
  const minIncrement = (minSpace / Math.max(1, drawableWidth)) * span;

  return timeIncrements.find((increment) => increment >= minIncrement) ?? timeIncrements[timeIncrements.length - 1];
}

function getAlignedTimeTickValues(minTime: number, maxTime: number, increment: number): number[] {
  if (increment >= month) {
    return getCalendarAlignedTicks(minTime, maxTime, increment);
  }

  const firstTick = Math.ceil(minTime / increment) * increment;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= maxTime; tick += increment) {
    ticks.push(Math.round(tick));
  }

  return ticks;
}

function getCalendarAlignedTicks(minTime: number, maxTime: number, increment: number): number[] {
  const isYearIncrement = increment >= year;
  const monthStep = isYearIncrement ? 0 : Math.max(1, Math.round(increment / month));
  const yearStep = isYearIncrement ? Math.max(1, Math.round(increment / year)) : 0;
  const firstDate = new Date(minTime);
  let tickDate = new Date(
    firstDate.getFullYear(),
    isYearIncrement ? 0 : firstDate.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  if (tickDate.getTime() < minTime) {
    tickDate = new Date(
      tickDate.getFullYear() + yearStep,
      tickDate.getMonth() + monthStep,
      1,
      0,
      0,
      0,
      0
    );
  }

  const ticks: number[] = [];

  while (tickDate.getTime() <= maxTime) {
    ticks.push(tickDate.getTime());
    tickDate = new Date(
      tickDate.getFullYear() + yearStep,
      tickDate.getMonth() + monthStep,
      1,
      0,
      0,
      0,
      0
    );
  }

  return ticks;
}

function getTickAnchor(tick: number, minTime: number, maxTime: number): 'start' | 'middle' | 'end' {
  if (tick === minTime) {
    return 'start';
  }

  if (tick === maxTime) {
    return 'end';
  }

  return 'middle';
}

function formatAxisTime(value: number, timeSpan: number, foundIncr: number, timeZone: TimeZone): string {
  return dateTimeFormat(value, {
    format: getAxisTimeFormat(timeSpan, foundIncr),
    timeZone,
  });
}

function getAxisTimeFormat(timeSpan: number, foundIncr: number): string {
  const yearRoundedToDay = Math.round(timeUnitSize.year / timeUnitSize.day) * timeUnitSize.day;
  const incrementRoundedToDay = Math.round(foundIncr / timeUnitSize.day) * timeUnitSize.day;

  if (foundIncr < timeUnitSize.second) {
    return systemDateFormats.interval.millisecond;
  }

  if (foundIncr <= timeUnitSize.minute) {
    return systemDateFormats.interval.second;
  }

  if (timeSpan <= timeUnitSize.day) {
    return systemDateFormats.interval.minute;
  }

  if (foundIncr <= timeUnitSize.day) {
    return systemDateFormats.interval.hour;
  }

  if (timeSpan < timeUnitSize.year) {
    return systemDateFormats.interval.day;
  }

  if (incrementRoundedToDay === yearRoundedToDay) {
    return systemDateFormats.interval.year;
  }

  if (foundIncr <= timeUnitSize.year) {
    return systemDateFormats.interval.month;
  }

  return systemDateFormats.interval.year;
}

function generateUPlotIncrements(base: number, minExponent: number, maxExponent: number, multipliers: number[]): number[] {
  const increments: number[] = [];

  for (let exponent = minExponent; exponent < maxExponent; exponent += 1) {
    const exponentAbs = Math.abs(exponent);
    const magnitude = roundDecimal(base ** exponent, exponentAbs);

    for (const multiplier of multipliers) {
      const increment = base === 10 ? Number(`${multiplier}e${exponent}`) : multiplier * magnitude;
      increments.push(roundDecimal(increment, exponentAbs));
    }
  }

  return increments;
}

function roundDecimal(value: number, decimals = 0): number {
  if (Number.isInteger(value)) {
    return value;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor * (1 + Number.EPSILON)) / factor;
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

function formatValue(value: unknown, timeZone: TimeZone): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return dateTimeFormat(value.getTime(), {
      format: systemDateFormats.fullDate,
      timeZone,
    });
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 100000000000) {
    return dateTimeFormat(value, {
      format: systemDateFormats.fullDate,
      timeZone,
    });
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

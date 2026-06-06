'use client';

import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  sub,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/src/components/ui/button-1';
import { Input } from '@/src/components/ui/input-1';
import { Material } from '@/src/components/ui/material-1';
import { useClickOutside } from '@/src/components/ui/use-click-outside';

const ClockIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8.75 4.75V4H7.25V4.75V7.875C7.25 8.18976 7.39819 8.48615 7.65 8.675L9.55 10.1L10.15 10.55L11.05 9.35L10.45 8.9L8.75 7.625V4.75Z"
      className="fill-gray-1000"
    />
  </svg>
);

const ArrowBottomIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx('fill-gray-1000', className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
      className="fill-gray-700"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
      className="fill-gray-700"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 0.5V1.25V2H10.5V1.25V0.5H12V1.25V2H14H15.5V3.5V13.5C15.5 14.8807 14.3807 16 13 16H3C1.61929 16 0.5 14.8807 0.5 13.5V3.5V2H2H4V1.25V0.5H5.5ZM2 3.5H14V6H2V3.5ZM2 7.5V13.5C2 14.0523 2.44772 14.5 3 14.5H13C13.5523 14.5 14 14.0523 14 13.5V7.5H2Z"
    />
  </svg>
);

const ClearIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
    />
  </svg>
);

const parseRelativeDate = (input: string) => {
  const regex = /(\d+)\s*(day|week|month|year|hour)s?/i;
  const match = input.match(regex);

  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = `${match[2].toLowerCase()}s`;
  const now = new Date();
  const start = startOfDay(sub(now, { [unit]: value }));
  const end = endOfDay(now);

  return {
    [input]: { text: input, start, end },
  };
};

const parseExactDate = (input: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dateFormats = ['d MMM yyyy', 'd MMM', 'yyyy-MM-dd', 'MM/dd', 'MM/dd/yyyy'];

  for (const dateFormat of dateFormats) {
    const date = parse(input.trim(), dateFormat, now, { locale: enUS });

    if (isValid(date)) {
      if (dateFormat === 'd MMM' || dateFormat === 'MM/dd') {
        date.setFullYear(currentYear);
      }

      return {
        [input]: {
          text: input,
          start: startOfDay(date),
          end: endOfDay(date),
        },
      };
    }
  }

  return null;
};

const parseFixedRange = (input: string) => {
  const rangePattern = /(.+)\s*[-–]\s*(.+)/;
  const match = input.match(rangePattern);

  if (!match) {
    return parseExactDate(input);
  }

  const [, startStr, endStr] = match;
  if (!startStr || !endStr) {
    return null;
  }

  const possibleFormats = ['d MMM yyyy', 'd MMM', 'yyyy-MM-dd', 'MM/dd', 'MM/dd/yyyy'];

  for (const dateFormat of possibleFormats) {
    const now = new Date();
    const year = now.getFullYear();
    const start = parse(startStr, dateFormat, now, { locale: enUS });
    const end = parse(endStr, dateFormat, now, { locale: enUS });
    const finalStart = isValid(start) ? startOfDay(start) : null;
    const finalEnd = isValid(end) ? endOfDay(end) : null;

    if (finalStart && finalEnd) {
      if (dateFormat === 'd MMM' || dateFormat === 'MM/dd') {
        finalStart.setFullYear(year);
        finalEnd.setFullYear(year);
      }
      return {
        [input]: { text: input, start: finalStart, end: finalEnd },
      };
    }
  }

  return null;
};

const parseDateInput = (input: string) => {
  const relative = parseRelativeDate(input);
  if (relative) return relative;

  const fixedRange = parseFixedRange(input);
  if (fixedRange) return fixedRange;

  const exact = parseExactDate(input);
  if (exact) return exact;

  return null;
};

const filterPresets = (obj: Record<string, PresetValue>, search: string) => {
  if (!search) {
    return obj;
  }

  const searchWords = search.toLowerCase().split('-').filter(Boolean);
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      const keyLower = value.text.toLowerCase();
      return searchWords.every((word) => keyLower.includes(word));
    }),
  );

  if (Object.entries(filtered).length > 0) {
    return filtered;
  }

  const parsed = parseDateInput(search);
  if (parsed) {
    return parsed;
  }

  const numberMatch = search.match(/\d+/);
  if (!numberMatch) {
    return {};
  }

  const n = parseInt(numberMatch[0], 10);
  const now = new Date();

  return {
    [`last-${n}-days`]: {
      text: `Últimos ${n} días`,
      start: startOfDay(subDays(now, n)),
      end: endOfDay(now),
    },
    [`last-${n}-weeks`]: {
      text: `Últimas ${n} semanas`,
      start: startOfDay(subWeeks(now, n)),
      end: endOfDay(now),
    },
    [`last-${n}-months`]: {
      text: `Últimos ${n} meses`,
      start: startOfDay(subMonths(now, n)),
      end: endOfDay(now),
    },
    [`last-${n}-years`]: {
      text: `Últimos ${n} años`,
      start: startOfDay(subYears(now, n)),
      end: endOfDay(now),
    },
  };
};

const formatDateRange = (start: Date, end: Date, timezone: string) => {
  const isStartMidnight = isEqual(start, startOfDay(start));
  const isEndEOD = isEqual(end, endOfDay(end));
  const sameDay = isSameDay(start, end);

  const formatSingle = (date: Date) =>
    formatInTimeZone(date, timezone, isStartMidnight ? 'EEE, MMM d' : 'EEE, MMM d, HH:mm');
  const formatMonth = (date: Date) => formatInTimeZone(date, timezone, 'MMM');
  const formatDay = (date: Date) => formatInTimeZone(date, timezone, 'd');
  const formatYear = (date: Date) => formatInTimeZone(date, timezone, 'yy');
  const formatDateWithTimeIfNeeded = (date: Date, showTime: boolean) =>
    formatInTimeZone(date, timezone, showTime ? 'MMM d, HH:mm' : 'MMM d');

  if (sameDay) {
    return formatSingle(start);
  }

  const sameMonth =
    formatMonth(start) === formatMonth(end) && formatYear(start) === formatYear(end);
  const sameYear = formatYear(start) === formatYear(end);
  const startHasTime = !isStartMidnight;
  const endHasTime = !isEndEOD;

  if (startHasTime || endHasTime) {
    const startFormatted = formatDateWithTimeIfNeeded(start, startHasTime);
    const endFormatted = formatDateWithTimeIfNeeded(end, endHasTime);
    return `${startFormatted} - ${endFormatted}`;
  }

  if (sameMonth) {
    return `${formatMonth(start)} ${formatDay(start)} - ${formatDay(end)}`;
  }

  if (sameYear) {
    return `${formatMonth(start)} ${formatDay(start)} - ${formatMonth(end)} ${formatDay(end)}`;
  }

  return `${formatMonth(start)} ${formatDay(start)} '${formatYear(start)} - ${formatMonth(end)} ${formatDay(end)} '${formatYear(end)}`;
};

const typeRelativeTimes = [
  { text: '45m', start: subMinutes(new Date(), 45), end: new Date() },
  { text: '12 hours', start: subHours(new Date(), 12), end: new Date() },
  { text: '10d', start: startOfDay(subDays(new Date(), 10)), end: endOfDay(new Date()) },
  { text: '2 weeks', start: startOfDay(subWeeks(new Date(), 2)), end: endOfDay(new Date()) },
  { text: 'last month', start: startOfDay(subMonths(new Date(), 1)), end: endOfDay(new Date()) },
  {
    text: 'yesterday',
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(subDays(new Date(), 1)),
  },
  { text: 'today', start: startOfDay(new Date()), end: endOfDay(new Date()) },
];

const typeFixedTimes = [
  {
    text: 'Jan 1',
    start: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
    end: endOfDay(new Date(new Date().getFullYear(), 0, 1)),
  },
  {
    text: 'Jan 1 - Jan 2',
    start: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
    end: endOfDay(new Date(new Date().getFullYear(), 0, 2)),
  },
  {
    text: '1/1',
    start: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
    end: endOfDay(new Date(new Date().getFullYear(), 0, 1)),
  },
  {
    text: '1/1 - 1/2',
    start: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
    end: endOfDay(new Date(new Date().getFullYear(), 0, 2)),
  },
];

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

interface PresetValue {
  text: string;
  start: Date;
  end: Date;
}

interface CalendarComboboxProps {
  stacked: boolean;
  compact: boolean;
  disabled: boolean;
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets: Record<string, PresetValue>;
  presetIndex?: number;
}

const CalendarCombobox = ({
  stacked,
  compact,
  disabled,
  value,
  onChange,
  presets,
  presetIndex,
}: CalendarComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentPreset, setCurrentPreset] = useState<PresetValue | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  const onFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const onClick = (preset: PresetValue) => {
    setInputValue(preset.text);
    setCurrentPreset(preset);
    onChange({ start: preset.start, end: preset.end });
    setIsOpen(false);
  };

  const filteredPresets = filterPresets(presets, inputValue);
  const presetMatchesValue = Boolean(
    currentPreset &&
    sameDateTime(currentPreset.start, value?.start) &&
    sameDateTime(currentPreset.end, value?.end),
  );

  useClickOutside(ref, close);

  useEffect(() => {
    const array = Object.entries(presets);
    if (presetIndex !== undefined && presetIndex >= 0 && presetIndex < array.length) {
      const preset = array[presetIndex][1];
      setInputValue(preset.text);
      setCurrentPreset(preset);
      onChange({ start: preset.start, end: preset.end });
    }
  }, [onChange, presetIndex, presets]);

  useEffect(() => {
    if (currentPreset && !presetMatchesValue) {
      setCurrentPreset(null);
      setInputValue('');
    }
  }, [currentPreset, presetMatchesValue]);

  return (
    <div
      ref={ref}
      className={twMerge(
        clsx(
          'inline-block font-sans text-sm',
          compact ? 'absolute left-[38px] w-[180px]' : 'relative w-[250px]',
          compact && !isOpen && 'pl-[140px]',
          compact && (isOpen || presetMatchesValue) && 'pl-0',
        ),
      )}
    >
      <Input
        prefix={compact ? undefined : <ClockIcon />}
        prefixStyling="pl-2.5"
        suffix={<ArrowBottomIcon className={clsx('duration-200', isOpen && 'rotate-180')} />}
        suffixStyling={clsx(
          'cursor-pointer',
          compact && !isOpen && !presetMatchesValue && 'w-10 !px-0',
        )}
        placeholder="Buscar rango"
        onFocus={onFocus}
        value={inputValue}
        onChange={setInputValue}
        disabled={disabled}
        wrapperClassName={clsx(
          'hover:z-10',
          stacked && !compact && 'rounded-b-none',
          !stacked && !compact && 'rounded-r-none',
          compact && 'rounded-l-none',
          (isOpen || (compact && presetMatchesValue)) && 'z-10',
        )}
        className={clsx(
          'pl-2 placeholder:!text-gray-1000 placeholder:!opacity-100',
          compact && !isOpen && !presetMatchesValue && '!w-0 !px-0',
        )}
      />
      <Material
        type="menu"
        className={clsx(
          'absolute left-0 top-12 z-50',
          compact ? 'w-full' : 'grid w-[200%] grid-cols-2',
          isOpen && 'opacity-100',
          !isOpen && 'pointer-events-none opacity-0 duration-200',
        )}
      >
        <ul className="border-r border-r-gray-200 p-2">
          {Object.entries(filteredPresets).length > 0 ? (
            Object.entries(filteredPresets).map(([key, preset]) => (
              <li
                key={key}
                className="flex h-9 w-full cursor-pointer items-center rounded-md px-2 font-sans text-sm text-gray-1000 hover:bg-gray-alpha-300 active:bg-gray-alpha-300"
                onClick={() => onClick(preset)}
              >
                {preset.text}
              </li>
            ))
          ) : (
            <li className="flex h-9 w-full cursor-pointer items-center rounded-md px-2 font-sans text-sm text-gray-1000 hover:bg-gray-alpha-300 active:bg-gray-alpha-300">
              {inputValue}
            </li>
          )}
        </ul>
        {!compact && (
          <div className="p-4 pr-[30px]">
            <div className="font-sans text-sm text-gray-900">Tiempos relativos</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {typeRelativeTimes.map((preset) => (
                <button
                  key={preset.text}
                  type="button"
                  className="inline-flex h-5 cursor-pointer items-center rounded border-none bg-accents-2 px-1.5 font-mono text-[13px] text-gray-1000"
                  onClick={() => onClick(preset)}
                >
                  {preset.text}
                </button>
              ))}
            </div>
            <div className="mt-4 font-sans text-sm text-gray-900">Fechas fijas</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {typeFixedTimes.map((preset) => (
                <button
                  key={preset.text}
                  type="button"
                  className="inline-flex h-5 cursor-pointer items-center rounded border-none bg-accents-2 px-1.5 font-mono text-[13px] text-gray-1000"
                  onClick={() => onClick(preset)}
                >
                  {preset.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </Material>
    </div>
  );
};

interface CalendarProps {
  id?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  compact?: boolean;
  isDocsPage?: boolean;
  stacked?: boolean;
  horizontalLayout?: boolean;
  showTimeInput?: boolean;
  popoverPlacement?: 'top' | 'bottom';
  popoverAlignment?: 'start' | 'center' | 'end';
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets?: Record<string, PresetValue>;
  presetIndex?: number;
  minValue?: Date;
  maxValue?: Date;
}

export const Calendar = ({
  id,
  label,
  required = false,
  disabled = false,
  allowClear = false,
  compact = false,
  stacked = false,
  horizontalLayout = false,
  showTimeInput = true,
  popoverPlacement = 'bottom',
  popoverAlignment = 'start',
  value,
  onChange,
  presets,
  presetIndex,
  minValue,
  maxValue,
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value?.start || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectedTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [startDate, setStartDate] = useState(
    formatInTimeZone(value?.start || new Date(), selectedTimezone, 'MMM dd, yyyy'),
  );
  const [startTime, setStartTime] = useState(
    formatInTimeZone(startOfDay(value?.start || new Date()), selectedTimezone, 'HH:mm'),
  );
  const [endDate, setEndDate] = useState(
    formatInTimeZone(value?.end || new Date(), selectedTimezone, 'MMM dd, yyyy'),
  );
  const [endTime, setEndTime] = useState(
    formatInTimeZone(endOfDay(value?.end || new Date()), selectedTimezone, 'HH:mm'),
  );
  const [startDateError, setStartDateError] = useState(false);
  const [startTimeError, setStartTimeError] = useState(false);
  const [endDateError, setEndDateError] = useState(false);
  const [endTimeError, setEndTimeError] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(calendarRef, close);

  useEffect(() => {
    const closeCalendar = () => setIsOpen(false);
    window.addEventListener('resize', closeCalendar);
    window.addEventListener('scroll', closeCalendar);

    return () => {
      window.removeEventListener('resize', closeCalendar);
      window.removeEventListener('scroll', closeCalendar);
    };
  }, []);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const daysArray = getCalendarDays(currentDate);

  const handleDateClick = (day: Date) => {
    if (disabled) return;

    if (!value?.start || (value.start && value.end)) {
      onChange({ start: startOfDay(day), end: null });
      setHoverDate(day);
      setIsSelecting(true);
    } else if (isSelecting) {
      if (day > value.start) {
        onChange({ ...value, end: endOfDay(day) });
      } else {
        onChange({ start: startOfDay(day), end: endOfDay(value.start) });
      }
      setIsSelecting(false);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleMouseEnter = (day: Date) => {
    if (value?.start && !value.end) {
      setHoverDate(day);
    }
  };

  const onApply = () => {
    const parsedStartDate = parse(startDate, 'MMM dd, yyyy', new Date(), { locale: enUS });
    const parsedStartTime = parse(startTime || '', 'HH:mm', new Date());
    const parsedEndDate = parse(endDate, 'MMM dd, yyyy', new Date(), { locale: enUS });
    const parsedEndTime = parse(endTime || '', 'HH:mm', new Date());

    if (
      !isValid(parsedStartDate) ||
      !isValid(parsedStartTime) ||
      !isValid(parsedEndDate) ||
      !isValid(parsedEndTime)
    ) {
      setStartDateError(!isValid(parsedStartDate));
      setStartTimeError(!isValid(parsedStartTime));
      setEndDateError(!isValid(parsedEndDate));
      setEndTimeError(!isValid(parsedEndTime));
      return;
    }

    setStartDateError(false);
    setStartTimeError(false);
    setEndDateError(false);
    setEndTimeError(false);
    const parsedStart = parse(`${startDate} ${startTime}`, 'MMM d, yyyy HH:mm', new Date(), {
      locale: enUS,
    });
    const parsedEnd = parse(`${endDate} ${endTime}`, 'MMM d, yyyy HH:mm', new Date(), {
      locale: enUS,
    });
    onChange({
      start: fromZonedTime(parsedStart, selectedTimezone),
      end: fromZonedTime(parsedEnd, selectedTimezone),
    });
    setIsOpen(false);
  };

  useEffect(() => {
    setStartDate(formatInTimeZone(value?.start || new Date(), selectedTimezone, 'MMM dd, yyyy'));
    setStartTime(
      formatInTimeZone(value?.start || startOfDay(new Date()), selectedTimezone, 'HH:mm'),
    );
    setEndDate(formatInTimeZone(value?.end || new Date(), selectedTimezone, 'MMM dd, yyyy'));
    setEndTime(formatInTimeZone(value?.end || endOfDay(new Date()), selectedTimezone, 'HH:mm'));
  }, [isOpen, selectedTimezone, value]);

  const buttonLabel =
    value?.start && value?.end
      ? formatDateRange(value.start, value.end, selectedTimezone)
      : 'Seleccionar rango';

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <div
        className={clsx(
          presets && 'flex',
          presets && stacked && 'flex-col',
          compact && 'w-[220px]',
        )}
      >
        {presets && (
          <div>
            <CalendarCombobox
              stacked={stacked}
              compact={compact}
              disabled={disabled}
              presets={presets}
              value={value}
              onChange={onChange}
              presetIndex={presetIndex}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Button
              id={id}
              className={clsx(
                '!justify-start focus:!border-transparent focus:!shadow-focus-input',
                presets && !stacked && !compact && '-ml-[1px] rounded-l-none',
                presets && stacked && !compact && '-mt-[1px] rounded-t-none',
                presets && compact && '-mr-[1px] rounded-r-none',
                compact ? 'w-[180px] gap-1.5' : 'w-[250px]',
              )}
              prefix={<CalendarIcon />}
              type="secondary"
              disabled={disabled}
              onClick={() => setIsOpen((prevState) => !prevState)}
            >
              <div className="truncate pr-4">{buttonLabel}</div>
            </Button>
            {allowClear && value?.start && value?.end && !disabled && (
              <Button
                aria-label="Limpiar fecha"
                svgOnly
                variant="unstyled"
                className="absolute right-0 top-1/2 -translate-y-1/2 fill-gray-700 hover:fill-gray-1000"
                onClick={() => onChange(null)}
              >
                <ClearIcon />
              </Button>
            )}
          </div>
        </div>
      </div>
      {isOpen && !disabled && (
        <Material
          ref={calendarRef}
          type="menu"
          className={twMerge(
            clsx(
              'absolute z-50 p-3 font-sans',
              popoverPlacement === 'top' && 'bottom-12',
              popoverPlacement === 'bottom' && 'top-12',
              horizontalLayout ? 'w-[462px]' : 'w-[280px]',
              presets && !stacked && !compact && 'left-[250px]',
              presets && stacked && 'top-[88px]',
              popoverAlignment === 'center' && 'left-[125px] -translate-x-1/2',
              popoverAlignment === 'end' && 'left-[250px] -translate-x-full',
            ),
          )}
        >
          <div className={clsx(horizontalLayout && 'flex gap-5')}>
            <div>
              <CalendarGrid
                currentDate={currentDate}
                daysArray={daysArray}
                hoverDate={hoverDate}
                isSelecting={isSelecting}
                maxValue={maxValue}
                minValue={minValue}
                selectedTimezone={selectedTimezone}
                value={value}
                onMouseEnter={handleMouseEnter}
                onSelectDate={handleDateClick}
                onNextMonth={nextMonth}
                onPrevMonth={prevMonth}
              />
            </div>
            {showTimeInput && (
              <div
                className={clsx(
                  'flex flex-col gap-2',
                  horizontalLayout
                    ? 'justify-between'
                    : '-mx-3 mt-3 border-t border-gray-alpha-100 px-3 pt-2.5',
                )}
              >
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="text-[13px] capitalize text-gray-900">Inicio</div>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          size="small"
                          value={startDate}
                          onChange={setStartDate}
                          error={startDateError}
                        />
                      </div>
                      <Input
                        size="small"
                        value={startTime}
                        onChange={setStartTime}
                        error={startTimeError}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] capitalize text-gray-900">Fin</div>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          size="small"
                          value={endDate}
                          onChange={setEndDate}
                          error={endDateError}
                        />
                      </div>
                      <Input
                        size="small"
                        value={endTime}
                        onChange={setEndTime}
                        error={endTimeError}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col font-medium">
                    <Button
                      type="secondary"
                      size="small"
                      suffix={<span className="mt-1 text-xs">↵</span>}
                      onClick={onApply}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Material>
      )}
    </div>
  );
};

interface CalendarGridProps {
  currentDate: Date;
  daysArray: Date[];
  hoverDate: Date | null;
  isSelecting: boolean;
  maxValue?: Date;
  minValue?: Date;
  selectedTimezone: string;
  value: RangeValue | null;
  onMouseEnter: (day: Date) => void;
  onSelectDate: (day: Date) => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
}

const CalendarGrid = ({
  currentDate,
  daysArray,
  hoverDate,
  isSelecting,
  maxValue,
  minValue,
  selectedTimezone,
  value,
  onMouseEnter,
  onSelectDate,
  onNextMonth,
  onPrevMonth,
}: CalendarGridProps) => {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-1000">
          {formatInTimeZone(currentDate, selectedTimezone, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-0.5">
          <Button variant="unstyled" onClick={onPrevMonth}>
            <ArrowLeftIcon />
          </Button>
          <Button variant="unstyled" onClick={onNextMonth}>
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs uppercase text-gray-900">
        <div>L</div>
        <div>M</div>
        <div>M</div>
        <div>J</div>
        <div>V</div>
        <div>S</div>
        <div>D</div>
      </div>
      <div className="grid grid-cols-7 items-center gap-y-2">
        {daysArray.map((day) => {
          const isStart = Boolean(value?.start && isSameDay(day, value.start));
          const isEnd = Boolean(value?.end && isSameDay(day, value.end));
          const currentHover = Boolean(hoverDate && isSelecting && isSameDay(day, hoverDate));
          const intervalStart =
            value?.start && hoverDate && hoverDate < value.start ? hoverDate : value?.start;
          const intervalEnd = value?.end || hoverDate;
          const isInRange = Boolean(
            intervalStart &&
            intervalEnd &&
            isWithinInterval(day, {
              start: startOfDay(intervalStart),
              end: endOfDay(intervalEnd),
            }),
          );
          const isAllowedDate =
            (minValue ? day >= startOfDay(minValue) : true) &&
            (maxValue ? day <= endOfDay(maxValue) : true);

          return (
            <div
              key={day.toString()}
              className={clsx(
                'flex items-center justify-center rounded text-center text-sm transition',
                isSameMonth(day, currentDate) && isAllowedDate
                  ? 'bg-background-100 text-gray-1000'
                  : 'bg-background-100 text-gray-700',
                isInRange && !isStart && !isEnd && !currentHover && 'rounded-none !bg-accents-2',
                isAllowedDate ? 'cursor-pointer' : 'cursor-not-allowed',
              )}
              onMouseEnter={() => isAllowedDate && onMouseEnter(day)}
              onClick={() => isAllowedDate && onSelectDate(day)}
            >
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded',
                  (isStart || isEnd || currentHover) &&
                    isAllowedDate &&
                    ' !bg-gray-1000 !text-background-100',
                  !isStart &&
                    !isEnd &&
                    !currentHover &&
                    !isToday(day) &&
                    isAllowedDate &&
                    'hover:border hover:border-gray-alpha-500 hover:text-gray-1000',
                  currentHover && isAllowedDate && ' !shadow-focus-calendar-date',
                  isToday(day) && ' !bg-blue-900 !text-background-100',
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

interface SingleDateCalendarProps {
  id?: string;
  label?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  minValue?: Date;
  maxValue?: Date;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const SingleDateCalendar = ({
  id,
  label,
  value,
  required = false,
  disabled = false,
  minValue,
  maxValue,
  placeholder = 'Seleccionar fecha',
  onChange,
}: SingleDateCalendarProps) => {
  const selectedDate = parseInputDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const ref = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(ref, close);

  const daysArray = getCalendarDays(currentDate);

  const handleSelectDate = (day: Date) => {
    onChange(formatInputDate(day));
    setCurrentDate(day);
    setIsOpen(false);
  };

  const displayLabel = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder;

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <Button
        id={id}
        className="w-[250px] !justify-start focus:!border-transparent focus:!shadow-focus-input"
        prefix={<CalendarIcon />}
        type="secondary"
        disabled={disabled}
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        <div className="truncate pr-4">{displayLabel}</div>
      </Button>
      {isOpen && !disabled && (
        <Material ref={ref} type="menu" className="absolute top-12 z-50 w-[280px] p-3 font-sans">
          <CalendarGrid
            currentDate={currentDate}
            daysArray={daysArray}
            hoverDate={null}
            isSelecting={false}
            maxValue={maxValue}
            minValue={minValue}
            selectedTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
            value={selectedDate ? { start: selectedDate, end: selectedDate } : null}
            onMouseEnter={() => undefined}
            onSelectDate={handleSelectDate}
            onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
            onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
          />
        </Material>
      )}
    </div>
  );
};

const getCalendarDays = (currentDate: Date) => {
  const daysArray = [];
  let day = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });

  while (day <= endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })) {
    daysArray.push(day);
    day = addDays(day, 1);
  }

  return daysArray;
};

const parseInputDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) ? startOfDay(date) : null;
};

const sameDateTime = (left?: Date | null, right?: Date | null) => {
  if (!left || !right) {
    return false;
  }

  return left.getTime() === right.getTime();
};

export const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LOCAL_DATE_TIME_RE = /^(\d{4,})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

export const parseDateSafely = (value: string | number | Date | null | undefined): Date | null => {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const localMatch = trimmedValue.match(LOCAL_DATE_TIME_RE);
  const hasExplicitTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmedValue);

  if (localMatch && !hasExplicitTimezone) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = localMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatDateSafely = (
  value: string | number | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback = "—",
): string => {
  const parsedDate = parseDateSafely(value);
  if (!parsedDate) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  return new Intl.DateTimeFormat(locale, options).format(parsedDate);
};

export const toDatetimeLocalValue = (value: string | number | Date | null | undefined): string => {
  const parsedDate = parseDateSafely(value);
  if (!parsedDate) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return [
    parsedDate.getFullYear(),
    pad(parsedDate.getMonth() + 1),
    pad(parsedDate.getDate()),
  ].join("-") + `T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
};

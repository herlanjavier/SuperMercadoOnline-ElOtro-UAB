import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { isBusinessOpenNow } from '../utils/businessHours.js';

const DEFAULT_OPENS_AT = '06:00';
const DEFAULT_CLOSES_AT = '22:00';

const mapBusinessHour = (hour) => ({
  id: hour.id,
  dayOfWeek: hour.day_of_week,
  opensAt: hour.opens_at,
  closesAt: hour.closes_at,
  isOpen: hour.is_open,
  createdAt: hour.created_at,
  updatedAt: hour.updated_at,
});

const defaultBusinessHour = (dayOfWeek) => ({
  id: null,
  day_of_week: dayOfWeek,
  opens_at: DEFAULT_OPENS_AT,
  closes_at: DEFAULT_CLOSES_AT,
  is_open: true,
  created_at: null,
  updated_at: null,
});

const getBusinessDateParts = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: env.BUSINESS_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

const dayIndexes = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getCurrentDayOfWeek = () => dayIndexes[getBusinessDateParts().weekday];

const getCurrentTime = () => {
  const parts = getBusinessDateParts();
  return `${parts.hour}:${parts.minute}:${parts.second}`;
};

const getBusinessHourByDay = async (dayOfWeek) => {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data || defaultBusinessHour(dayOfWeek);
};

export const getCurrentBusinessHourStatus = async () => {
  const dayOfWeek = getCurrentDayOfWeek();
  const currentTime = getCurrentTime();
  const hour = await getBusinessHourByDay(dayOfWeek);
  const isOpen = isBusinessOpenNow({
    currentTime,
    opensAt: hour.opens_at,
    closesAt: hour.closes_at,
    isOpen: hour.is_open,
  });

  return {
    isOpen,
    dayOfWeek,
    opensAt: hour.opens_at,
    closesAt: hour.closes_at,
    message: isOpen
      ? 'El supermercado esta abierto para recibir pedidos.'
      : 'El supermercado esta cerrado para recibir pedidos.',
  };
};

export const ensureBusinessIsOpen = async () => {
  const status = await getCurrentBusinessHourStatus();

  if (!status.isOpen) {
    throw new AppError('Fuera de horario de atencion', 400);
  }

  return status;
};

export const listBusinessHours = async () => {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) {
    throw new AppError(error.message, 400);
  }

  if (data.length === 0) {
    return Array.from({ length: 7 }, (_, dayOfWeek) => mapBusinessHour(defaultBusinessHour(dayOfWeek)));
  }

  const byDay = new Map(data.map((hour) => [hour.day_of_week, hour]));

  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    mapBusinessHour(byDay.get(dayOfWeek) || defaultBusinessHour(dayOfWeek)),
  );
};

export const updateBusinessHour = async (dayOfWeek, payload) => {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .upsert(
      {
        day_of_week: dayOfWeek,
        opens_at: payload.opensAt,
        closes_at: payload.closesAt,
        is_open: payload.isOpen,
      },
      { onConflict: 'day_of_week' },
    )
    .select('*')
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return mapBusinessHour(data);
};

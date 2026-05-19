import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

const createSupabaseClient = (key, clientName) => {
  if (!env.SUPABASE_URL || !key) {
    throw new AppError(`${clientName} no esta configurado. Revisa SUPABASE_URL y la clave correspondiente.`, 500);
  }

  return createClient(env.SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const createLazySupabaseClient = (key, clientName) => {
  let client = null;

  const getClient = () => {
    if (!client) {
      client = createSupabaseClient(key, clientName);
    }

    return client;
  };

  return new Proxy(
    {},
    {
      get(_target, property) {
        const value = getClient()[property];
        return typeof value === 'function' ? value.bind(getClient()) : value;
      },
    },
  );
};

export const supabaseAdmin = createLazySupabaseClient(env.SUPABASE_SERVICE_ROLE_KEY, 'supabaseAdmin');

export const supabasePublic = createLazySupabaseClient(env.SUPABASE_PUBLISHABLE_KEY, 'supabasePublic');

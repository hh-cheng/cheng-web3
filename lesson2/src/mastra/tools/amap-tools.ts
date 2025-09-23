import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const AMAP_KEY = process.env.AMAP_KEY!;

// ---------- Geocode (address -> coords)
export const amapGeocodeTool = createTool({
  id: 'amap-geocode',
  description: 'Geocode a place name or address to coordinates using AMap',
  inputSchema: z.object({
    address: z.string().min(1).describe('Place name or address'),
    city: z.string().optional().describe('City name to bias results'),
  }),
  outputSchema: z.object({
    name: z.string(),
    longitude: z.number(),
    latitude: z.number(),
    formattedAddress: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      address: context.address,
    });
    if (context.city) params.set('city', context.city);

    const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();

    const top = json?.geocodes?.[0];
    if (!top?.location) throw new Error('No geocode result');
    const [lngStr, latStr] = String(top.location).split(',');
    return {
      name: top?.district || top?.formatted_address || context.address,
      longitude: Number(lngStr),
      latitude: Number(latStr),
      formattedAddress: top?.formatted_address,
    };
  },
});

// ---------- Reverse Geocode (coords -> address)
export const amapReverseGeocodeTool = createTool({
  id: 'amap-reverse-geocode',
  description: 'Reverse geocode coordinates to an address using AMap',
  inputSchema: z.object({
    longitude: z.number(),
    latitude: z.number(),
  }),
  outputSchema: z.object({
    formattedAddress: z.string(),
    country: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      location: `${context.longitude},${context.latitude}`,
    });
    const url = `https://restapi.amap.com/v3/geocode/regeo?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    const comp = json?.regeocode?.addressComponent;
    return {
      formattedAddress: json?.regeocode?.formatted_address ?? '',
      country: comp?.country,
      province: comp?.province,
      city: typeof comp?.city === 'string' ? comp.city : comp?.province,
      district: comp?.district,
    };
  },
});

// ---------- Place Search (text)
export const amapPlaceSearchTool = createTool({
  id: 'amap-place-search',
  description: 'Search places by keyword using AMap',
  inputSchema: z.object({
    keywords: z.string().min(1),
    city: z.string().optional(),
    pageSize: z.number().min(1).max(20).default(5).optional(),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        name: z.string(),
        address: z.string().optional(),
        longitude: z.number(),
        latitude: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      keywords: context.keywords,
      offset: String(context.pageSize ?? 5),
      page: '1',
    });
    if (context.city) params.set('city', context.city);
    const url = `https://restapi.amap.com/v3/place/text?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    const pois = Array.isArray(json?.pois) ? json.pois : [];
    const results = pois.slice(0, context.pageSize ?? 5).map((p: any) => {
      const [lngStr, latStr] = String(p?.location || '').split(',');
      return {
        name: p?.name || '',
        address: p?.address || p?.adname || undefined,
        longitude: Number(lngStr),
        latitude: Number(latStr),
      };
    }).filter((r: { longitude: number; latitude: number }) => Number.isFinite(r.longitude) && Number.isFinite(r.latitude));
    return { results };
  },
});

// ---------- Directions (origin/destination)
export const amapDirectionsTool = createTool({
  id: 'amap-directions',
  description: 'Get directions between two points using AMap',
  inputSchema: z.object({
    originLng: z.number(),
    originLat: z.number(),
    destLng: z.number(),
    destLat: z.number(),
    mode: z.enum(['driving', 'walking', 'bicycling']).default('driving').optional(),
  }),
  outputSchema: z.object({
    distanceMeters: z.number(),
    durationSeconds: z.number(),
    steps: z.array(z.string()),
    mode: z.string(),
  }),
  execute: async ({ context }) => {
    const mode = context.mode ?? 'driving';
    const base = mode === 'walking'
      ? 'https://restapi.amap.com/v3/direction/walking'
      : mode === 'bicycling'
      ? 'https://restapi.amap.com/v3/direction/bicycling'
      : 'https://restapi.amap.com/v3/direction/driving';

    const params = new URLSearchParams({
      key: AMAP_KEY,
      origin: `${context.originLng},${context.originLat}`,
      destination: `${context.destLng},${context.destLat}`,
    });
    const url = `${base}?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();

    // Normalize across modes
    const route = json?.route || json?.data || json?.paths || json?.bicycles || json?.walks || {};
    const path = Array.isArray(route?.paths) ? route.paths[0] : route?.paths?.[0];
    const distance = Number(path?.distance || path?.distance_value || 0);
    const duration = Number(path?.duration || path?.duration_value || 0);
    const steps = Array.isArray(path?.steps)
      ? path.steps.map((s: any) => (s?.instruction || s?.polyline || '')).filter(Boolean)
      : [];

    return {
      distanceMeters: Number.isFinite(distance) ? distance : 0,
      durationSeconds: Number.isFinite(duration) ? duration : 0,
      steps,
      mode,
    };
  },
});

export const amapTools = {
  amapGeocodeTool,
  amapReverseGeocodeTool,
  amapPlaceSearchTool,
  amapDirectionsTool,
};



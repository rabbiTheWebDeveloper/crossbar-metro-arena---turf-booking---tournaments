'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudFog, Wind, Droplets, RefreshCw, ShieldCheck, CloudOff } from 'lucide-react';

// Uttara Sector 17, Dhaka
const LAT = 23.8762;
const LON = 90.3792;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Asia%2FDhaka&forecast_days=2`;

/** WMO weather code -> label, icon and pitch condition. */
const interpretWeatherCode = (code, isDay) => {
    if (code === 0) return { text: isDay ? 'Clear sky' : 'Clear night', icon: isDay ? Sun : Moon, pitch: 'dry' };
    if (code === 1 || code === 2) return { text: isDay ? 'Mostly sunny' : 'Mostly clear', icon: isDay ? Sun : Moon, pitch: 'dry' };
    if (code === 3) return { text: 'Overcast', icon: Cloud, pitch: 'dry' };
    if (code >= 45 && code <= 48) return { text: 'Fog / haze', icon: CloudFog, pitch: 'dry' };
    if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: CloudRain, pitch: 'wet' };
    if (code >= 61 && code <= 67) return { text: 'Rain', icon: CloudRain, pitch: 'wet' };
    if (code >= 71 && code <= 77) return { text: 'Snow', icon: Cloud, pitch: 'wet' };
    if (code >= 80 && code <= 82) return { text: 'Rain showers', icon: CloudRain, pitch: 'wet' };
    if (code >= 95) return { text: 'Thunderstorm', icon: CloudLightning, pitch: 'storm' };
    return { text: 'Mixed conditions', icon: Cloud, pitch: 'dry' };
};
const windLabel = (kmh) => (kmh < 6 ? 'Calm' : kmh < 20 ? 'Light breeze' : kmh < 39 ? 'Breezy' : 'Strong wind');
const humidityLabel = (h) => (h < 40 ? 'Dry air' : h < 70 ? 'Comfortable' : 'Humid');
const pitchLabel = (pitch, precipitation) => {
    if (pitch === 'storm') return { text: 'Check before kickoff', tone: 'text-rose-300', note: 'Lightning risk' };
    if (pitch === 'wet' || precipitation > 0) return { text: 'Wet but playable', tone: 'text-sky-300', note: 'Turf drains quickly' };
    return { text: 'Dry', tone: 'text-emerald-300', note: 'Good conditions' };
};
const formatHour = (isoTime) => {
    const h = parseInt(isoTime.split('T')[1]?.split(':')[0] || '0', 10);
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};

export const TurfWeatherWidget = ({ onBookSlotClick }) => {
    const [weather, setWeather] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ok | error
    const [refreshing, setRefreshing] = useState(false);

    const fetchWeather = useCallback(async () => {
        try {
            const res = await fetch(API_URL, { cache: 'no-store' });
            if (!res.ok) throw new Error('Weather API request failed');
            const data = await res.json();
            const current = data.current;
            if (!current || typeof current.temperature_2m !== 'number') throw new Error('Weather payload incomplete');
            const isDay = current.is_day === 1;
            const code = current.weather_code ?? 0;
            const cond = interpretWeatherCode(code, isDay);

            // Hourly strip: the next 4 hours after the API's own current time (Dhaka time), not the browser clock
            const times = data.hourly?.time || [];
            const temps = data.hourly?.temperature_2m || [];
            const pops = data.hourly?.precipitation_probability || [];
            const codes = data.hourly?.weather_code || [];
            const nowPrefix = String(current.time || '').slice(0, 13); // YYYY-MM-DDTHH
            let startIdx = times.findIndex(t => String(t).slice(0, 13) === nowPrefix);
            if (startIdx < 0) startIdx = 0;
            const hourly = [];
            for (let i = startIdx + 1; i < Math.min(startIdx + 5, times.length); i++) {
                hourly.push({ time: formatHour(times[i]), temp: Math.round(temps[i]), pop: Math.round(pops[i] ?? 0), cond: interpretWeatherCode(codes[i] ?? 0, true) });
            }
            setWeather({
                temperature: Math.round(current.temperature_2m),
                apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m),
                humidity: Math.round(current.relative_humidity_2m ?? 0),
                windSpeed: Math.round(current.wind_speed_10m ?? 0),
                precipitation: Number(current.precipitation) || 0,
                isDay,
                cond,
                hourly,
                observedAt: current.time ? String(current.time).replace('T', ' ') : ''
            });
            setStatus('ok');
        }
        catch {
            setStatus(prev => (prev === 'ok' ? 'ok' : 'error'));
        }
        finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeather]);

    const handleManualRefresh = () => { setRefreshing(true); fetchWeather(); };

    if (status === 'loading') {
        return (<div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center gap-3 text-slate-400 text-xs" aria-busy="true">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400"/>
        <span>Loading weather for Uttara, Dhaka...</span>
      </div>);
    }

    if (status === 'error' || !weather) {
        return (<div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-300">
          <CloudOff className="w-5 h-5 text-slate-500"/>
          <div>
            <div className="font-bold text-white">Weather unavailable</div>
            <div className="text-slate-400">The forecast service could not be reached. The turf is open as usual; check back in a moment.</div>
          </div>
        </div>
        <button type="button" onClick={handleManualRefresh} disabled={refreshing} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`}/>
          <span>Retry</span>
        </button>
      </div>);
    }

    const w = weather;
    const Icon = w.cond.icon;
    const pitch = pitchLabel(w.cond.pitch, w.precipitation);

    return (<div className="bg-gradient-to-b from-[#0c141d] to-[#080d12] border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Icon className={`w-4 h-4 ${w.cond.pitch === 'dry' ? (w.isDay ? 'text-amber-400' : 'text-emerald-400') : 'text-sky-400'}`}/>
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Uttara, Dhaka weather</span>
            <div className="text-[11px] text-slate-400">{w.observedAt ? `Observed ${w.observedAt} (Dhaka time)` : 'Current conditions'} · Open-Meteo</div>
          </div>
        </div>
        <button type="button" onClick={handleManualRefresh} disabled={refreshing} className="self-start sm:self-auto p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50" title="Refresh weather">
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`}/>
          <span className="text-[12px] font-medium hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative z-10">
        <div className="md:col-span-5 flex items-center gap-4">
          <div className="flex items-start">
            <span className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">{w.temperature}</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">°C</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm sm:text-base font-bold text-white leading-tight">{w.cond.text}</div>
            <div className="text-xs text-slate-400">Feels like <strong className="text-slate-200">{w.apparentTemperature}°C</strong></div>
          </div>
        </div>

        <div className="md:col-span-7 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px] uppercase font-semibold"><Wind className="w-3 h-3 text-sky-400"/><span>Wind</span></div>
            <div className="text-sm font-bold text-white mt-1 font-mono">{w.windSpeed} <span className="text-[11px] text-slate-400 font-normal">km/h</span></div>
            <div className="text-[10px] text-slate-400">{windLabel(w.windSpeed)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px] uppercase font-semibold"><Droplets className="w-3 h-3 text-emerald-400"/><span>Humidity</span></div>
            <div className="text-sm font-bold text-white mt-1 font-mono">{w.humidity}%</div>
            <div className="text-[10px] text-slate-400">{humidityLabel(w.humidity)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px] uppercase font-semibold"><ShieldCheck className="w-3 h-3 text-emerald-400"/><span>Pitch</span></div>
            <div className={`text-sm font-bold mt-1 ${pitch.tone}`}>{pitch.text}</div>
            <div className="text-[10px] text-slate-400">{pitch.note}</div>
          </div>
        </div>
      </div>

      {w.hourly.length > 0 && (<div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">Next hours (Dhaka time)</span>
            {onBookSlotClick && <button type="button" onClick={onBookSlotClick} className="text-[11px] text-emerald-400 font-medium hover:underline cursor-pointer">Book a slot →</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {w.hourly.map((h) => (<div key={h.time} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-[11px] font-mono">{h.time}</div>
                  <div className="font-bold text-white text-xs mt-0.5">{h.temp}°C</div>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-semibold block ${h.pop >= 40 ? 'text-sky-300' : 'text-emerald-400'}`}>{h.pop >= 20 ? `${h.pop}% rain` : h.cond.text}</span>
                </div>
              </div>))}
          </div>
        </div>)}
    </div>);
};

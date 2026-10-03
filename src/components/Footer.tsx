import React from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import { Phone, Mail, Globe, MapPin, Train, Heart, Shield, ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenSquadBuilder: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenSquadBuilder,
  onOpenAdmin
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#05080b] border-t border-white/10 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <CrossbarLogo size="lg" />
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed mt-2">
              Crossbar Metro Arena is Dhaka's premier floodlit outdoor football turf, located right next to the Uttara Metro Center viaduct. Professional shock-pad artificial turf designed for competitive small-sided games and championship tournaments.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Train className="w-3.5 h-3.5" />
                <span>Uttara Metro Center · Sector 17</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Quick Links
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('booking')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Book Court Slot
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tournaments')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Tournaments & Cups
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSquadBuilder}
                  className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-300 font-medium"
                >
                  Tag Your Match Squad 🔥
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('schedule')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Live Fixtures & Challenges
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('location')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Location & Metro Map
                </button>
              </li>
            </ul>
          </div>

          {/* Pitch & Amenities */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Facilities
            </div>
            <ul className="space-y-2 text-slate-400">
              <li>Pitch Alpha (7v7 / 8v8 Main Turf)</li>
              <li>Pitch Bravo (5v5 Fast Speed Cage)</li>
              <li>400 Lux LED Stadium Floodlighting</li>
              <li>Changing Cabins & Fresh Showers</li>
              <li>Clean Prayer Space (Wudu Ready)</li>
              <li>Trackside Barista Refreshments</li>
              <li>Guarded Free Parking</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Connect & Reach
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href={`tel:${VENUE_INFO.phone}`} className="text-slate-200 hover:text-emerald-400 font-mono font-bold">
                  {VENUE_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href={`mailto:${VENUE_INFO.email}`} className="text-slate-300 hover:text-emerald-400 truncate">
                  {VENUE_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-mono">{VENUE_INFO.website}</span>
              </li>
              <li className="pt-2">
                <a
                  href={VENUE_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:border-emerald-500/50 hover:bg-white/10 transition-colors"
                >
                  <span>Facebook Page</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Crossbar Metro Arena. Uttara Metro Center, Sector 17, Dhaka, Bangladesh. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Turf Staff Portal</span>
            </button>
            <span>·</span>
            <button
              onClick={scrollToTop}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Tournament, TournamentRegistration } from '../types';
import { Trophy, Calendar, Users, DollarSign, Award, ChevronRight, CheckCircle2, Shield, Flame, AlertCircle } from 'lucide-react';
import { TournamentModal } from './TournamentModal';

interface TournamentSectionProps {
  tournaments: Tournament[];
  onRegistrationSuccess: (reg: TournamentRegistration) => void;
}

export const TournamentSection: React.FC<TournamentSectionProps> = ({
  tournaments,
  onRegistrationSuccess
}) => {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [justRegisteredTeam, setJustRegisteredTeam] = useState<TournamentRegistration | null>(null);

  return (
    <section id="tournaments" className="py-14 md:py-24 bg-[#070b0e] border-t border-white/5 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Tournaments & Cups</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
            Championship Tournaments & Leagues
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Bring your squad to compete for grand trophies, medals, and huge cash prizes at Crossbar Metro Arena.
          </p>
        </div>

        {/* Success Alert if just registered */}
        {justRegisteredTeam && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white">Squad Registered Successfully! </strong>
                <span>Team <em className="text-emerald-300 font-bold not-italic">{justRegisteredTeam.teamName}</em> has been entered into {justRegisteredTeam.tournamentTitle}. Our match committee will contact captain {justRegisteredTeam.captainName} via WhatsApp.</span>
              </div>
            </div>
            <button
              onClick={() => setJustRegisteredTeam(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => {
            const fillPercentage = Math.round((t.registeredCount / t.maxTeams) * 100);
            const spotsLeft = t.maxTeams - t.registeredCount;

            return (
              <div
                key={t.id}
                className="bg-gradient-to-b from-slate-900/90 to-[#0b1117] border border-white/10 hover:border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 group"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                      {t.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      t.status === 'fast_filling'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {t.status === 'fast_filling' ? 'Filling Fast!' : 'Registration Open'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black text-white font-display mb-1 group-hover:text-amber-300 transition-colors uppercase">
                    {t.title}
                  </h3>
                  <div className="text-xs text-slate-400 mb-4">{t.edition}</div>

                  {/* Prize Pool Display */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 uppercase tracking-wider text-[11px] font-medium">Total Prize Pool</span>
                      <span className="text-lg font-black font-mono text-amber-400">৳{t.prizePool.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-amber-500/20 flex flex-col gap-0.5">
                      <span><strong>1st Place:</strong> {t.firstPrize}</span>
                      <span><strong>Runners Up:</strong> {t.runnerUpPrize}</span>
                    </div>
                  </div>

                  {/* Format & Dates */}
                  <div className="space-y-2 text-xs text-slate-300 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{t.dates}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{t.format}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Entry Fee: <strong className="text-white font-mono">৳{t.entryFee.toLocaleString()}</strong> per team</span>
                    </div>
                  </div>

                  {/* Registered squads progress */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Roster: <strong>{t.registeredCount} / {t.maxTeams} Teams</strong></span>
                      <span className="text-amber-400 font-bold">{spotsLeft} spots remaining</span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${fillPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="pt-3 border-t border-white/10 mb-6">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Tournament Highlights:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {t.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Register CTA */}
                <button
                  onClick={() => setSelectedTournament(t)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:scale-[1.02]"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>Register Team Squad</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Corporate Tournament Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0e1620] border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display uppercase">
                Host Your Custom Corporate Cup or Private Tournament
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Need an exclusive all-day booking, certified referees, professional PA sound system, digital live stream, and player refreshment lounge? We organize tailored football tournaments for banks, tech firms, and universities.
              </p>
            </div>
          </div>
          <a
            href="tel:01796-337133"
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Call Event Manager (01796-337133)</span>
          </a>
        </div>
      </div>

      {/* Modal */}
      {selectedTournament && (
        <TournamentModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onRegisterSuccess={(newReg) => {
            setSelectedTournament(null);
            setJustRegisteredTeam(newReg);
            onRegistrationSuccess(newReg);
          }}
        />
      )}
    </section>
  );
};

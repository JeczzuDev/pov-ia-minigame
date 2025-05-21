'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import supabase from '@/lib/supabaseClient';
import { Leaderboard } from '@/components/Leaderboard';

type LeaderboardEntry = {
  username: string;
  score: number;
};

interface Prompt {
  level: number;
  title: string;
}

type MatchEntry = {
  id: string;
  started_at: string;
  completed_at: string | null;
  score_ai: number;
  time_elapsed: number;
  time_bonus: number;
  prompts: (Prompt & { description?: string }) | null;
};

// Tipo para la respuesta de Supabase
interface SupabaseMatch {
  id: string;
  started_at: string;
  completed_at: string | null;
  score_ai: number;
  time_elapsed: number;
  time_bonus: number;
  prompts: Prompt | Prompt[] | null;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        setLoading(true);

        // 1. Obtener leaderboard global
        const resLeaderboard = await fetch('/api/leaderboard');
        if (!resLeaderboard.ok) throw new Error('Error cargando leaderboard');
        const { leaderboard } = await resLeaderboard.json();
        setLeaderboard(leaderboard);

        // 2. Obtener historial si está logueado
        if (user?.id) {
          const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
              id, 
              started_at, 
              completed_at,
              score_ai, 
              time_elapsed, 
              time_bonus, 
              prompts(level, title, description)
            `)
            .eq('user_id', user.id)
            .order('started_at', { ascending: false });

          if (matchesError) throw matchesError;

          const normMatches: MatchEntry[] = (matches ?? []).map((m: SupabaseMatch) => {
            const prompt = Array.isArray(m.prompts) ? m.prompts[0] : m.prompts;
            return {
              id: m.id,
              started_at: m.started_at,
              completed_at: m.completed_at,
              score_ai: m.score_ai,
              time_elapsed: m.time_elapsed || 0,
              time_bonus: m.time_bonus || 0,
              prompts: prompt || {
                level: 0,
                title: 'Sin título',
                description: 'No hay descripción disponible'
              },
            };
          });

          setHistory(normMatches || []);
        }
      } catch (error) {
        setError((error as Error)?.message || 'Error cargando dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadData();
    }
  }, [user, isLoaded]);

  if (loading) return <p className="p-4">Cargando dashboard…</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 px-2 mb-1">
        <h1 className="text-3xl font-bold">POVIA MINIGAME</h1>
        <div className="relative w-8 h-8">
          <Image 
            src="/pov-ia-ico.svg" 
            alt="POV-IA Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-lg text-gray-400 px-2 mb-2 font-semibold">Bienvenido al Dashboard</p>

      <div className="overflow-auto p-2
      max-h-[calc(100vh-15rem)]
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-gray-600
      [&::-webkit-scrollbar-thumb]:hover:bg-gray-700
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-thumb]:rounded-full">
        <section>
          {leaderboard.length > 0 && (
            <Leaderboard
              data={leaderboard}
              title="Mejores Jugadores"
              className="mb-6"
              currentUserId={user?.id}
              showSignUpButton={!user}
            />
          )}
        </section>

        {user && history.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tu Historial de Partidas</h2>
            <div className="space-y-4">
              {history.map((match) => (
                <div key={match.id} className="bg-gray-800 rounded-lg p-6 shadow-md">
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-col items-start justify-between gap-1 pt-1">
                      <h3 className="font-medium text-white text-lg">{match.prompts?.title || 'Sin título'}</h3>
                      {match.prompts?.description && (
                        <p className="text-md text-gray-300 line-clamp-2">
                          {match.prompts.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-900/30 p-3 rounded-lg">
                      <p className="text-sm text-blue-300">Puntaje Total</p>
                      <p className="text-2xl font-bold text-blue-100">
                        {match.score_ai + match.time_bonus}
                      </p>
                    </div>

                    <div className="bg-blue-900/30 p-3 rounded-lg">
                      <p className="text-sm text-blue-300">Puntaje Base</p>
                      <p className="text-xl font-bold text-blue-100">{match.score_ai}</p>
                    </div>

                    <div className="bg-green-900/30 p-3 rounded-lg">
                      <p className="text-sm text-green-300">Bono por Tiempo</p>
                      <p className="text-xl font-bold text-green-100">+{match.time_bonus}</p>
                    </div>

                    <div className="bg-purple-900/30 p-3 rounded-lg">
                      <p className="text-sm text-purple-300">Tiempo Empleado</p>
                      <p className="text-xl font-bold text-purple-100">
                        {Math.floor(match.time_elapsed / 60)}:{String(match.time_elapsed % 60).padStart(2, '0')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 pt-3 border-t border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-900/30 text-blue-100 text-xs">
                          Nivel {match.prompts?.level || 0}
                        </span>
                        <div className="hidden sm:flex items-center gap-1 text-xs">
                          <span className="text-gray-500">Inicio:</span>
                          <span>
                            {new Date(match.started_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {match.completed_at && (
                          <div className="hidden sm:flex items-center gap-1 text-xs">
                            <span className="text-gray-500">Fin:</span>
                            <span>
                              {new Date(match.completed_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/play/result/${match.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/50 text-blue-100 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>Ver Resultados</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {user && history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-600">Aún no has jugado ninguna partida.</p>
          </div>
        )}
      </div>

      <section className="flex gap-4">
        <button
          onClick={() => router.push('/play')}
          className="flex-1 bg-blue-900 text-white font-semibold rounded p-2 cursor-pointer hover:bg-blue-900/75 transition-colors"
        >
          Empezar a Jugar
        </button>
      </section>
    </main>
  );
}

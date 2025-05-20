'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, SignUpButton } from '@clerk/nextjs';
import supabase from '@/lib/supabaseClient';
import { Leaderboard } from '@/components/Leaderboard';

type RawEvaluation = {
    id: number;
    score: number;
    explanation: string;
    submitted_resources: { url: string }[];
};

type Evaluation = {
    id: number;
    score: number;
    explanation: string;
    url: string;
};

type LeaderboardEntry = {
    username: string;
    score: number;
};

export default function ResultPage() {
    const { matchId } = useParams();
    const router = useRouter();

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [baseScore, setBaseScore] = useState<number>(0);
    const [timeBonus, setTimeBonus] = useState<number>(0);
    const [timeElapsed, setTimeElapsed] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user, isLoaded } = useUser();
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
    const [accessDenied, setAccessDenied] = useState<boolean>(false);
    const prevUserId = useRef<string | null>(null);
    const evalInProgress = useRef(false);

    // verificar si el usuario es anónimo
    useEffect(() => {
        if (!matchId || !isLoaded) return;
        (async () => {
            const { data: matchData } = await supabase
                .from('matches')
                .select('user_id, is_anonymous')
                .eq('id', matchId)
                .single();

            setIsAnonymous(!matchData?.user_id && matchData?.is_anonymous);

            if (matchData?.user_id) {
                if (!user || user.id !== matchData.user_id) {
                    setAccessDenied(true);
                    return;
                }
            }
        })();
    }, [matchId, isLoaded, user]);

    // asociar la partida al usuario
    useEffect(() => {
        if (evalInProgress.current) return;
        if (!isLoaded || !isAnonymous || !user || prevUserId.current === user.id) return;
        prevUserId.current = user.id;
        evalInProgress.current = true;
        fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                associateUserId: user.id,
                matchId,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setIsAnonymous(false);
                    window.location.reload();
                } else if (data.error === 'PROMPT_ALREADY_COMPLETED') {
                    // router.push('/dashboard?error=prompt_already_completed');
                    router.push('/dashboard');
                } else {
                    setError(data.message || 'Error al asociar la partida');
                }
            })
            .catch(err => {
                console.error('Error en associateMatch:', err);
                setError('Error al asociar la partida. Inténtalo de nuevo.');
            })
            .finally(() => {
                evalInProgress.current = false;
            });
    }, [isLoaded, isAnonymous, user, matchId]);

    // obtener resultados
    useEffect(() => {
        if (evalInProgress.current) return;
        if (accessDenied || !matchId) return;

        const fetchResults = async () => {
            setLoading(true);
            evalInProgress.current = true;

            try {
                // Obtener evaluaciones (el endpoint maneja la lógica de evaluación si es necesario)
                const resEval = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matchId })
                });

                if (!resEval.ok) {
                    const payload = await resEval.json().catch(() => ({}));
                    throw new Error(payload?.error || 'Error al obtener resultados');
                }

                const responseData = await resEval.json();
                const { total, evaluations: evals = [], baseScore = 0, timeBonus = 0, timeElapsed = 0 } = responseData;

                // Actualizar el estado con los datos recibidos
                setTotal(total || 0);
                setBaseScore(baseScore);
                setTimeBonus(timeBonus);
                setTimeElapsed(timeElapsed);
                setEvaluations(Array.isArray(evals) ? evals : []);

                // Obtener leaderboard
                const resLeaderboard = await fetch('/api/leaderboard?includeMatchId=' + matchId);
                if (resLeaderboard.ok) {
                    const data = await resLeaderboard.json();
                    setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
                }
            } catch (err) {
                console.error('Error al cargar resultados:', err);
                setError('Error al cargar los resultados');
            } finally {
                setLoading(false);
                evalInProgress.current = false;
            }
        };

        fetchResults();
    }, [matchId, accessDenied]);

    if (accessDenied) return <p className="p-4 text-red-600">No puedes visualizar los resultados de una partida ajena.</p>;
    if (error) return <p className="p-4 text-red-600">Error: {error}</p>;
    if (loading) return <p className="p-4">Evaluando tus recursos y cargando resultados…</p>;

    return (
        <main className="max-w-2xl mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold p-2 mb-2">Resultados de tu partida</h1>

            <div className="overflow-y-auto p-2
             max-h-[calc(100vh-15rem)]
             [&::-webkit-scrollbar]:w-2
             [&::-webkit-scrollbar-track]:bg-transparent
             [&::-webkit-scrollbar-thumb]:bg-gray-600
             [&::-webkit-scrollbar-thumb]:hover:bg-gray-700
             [&::-webkit-scrollbar-track]:rounded-full
             [&::-webkit-scrollbar-thumb]:rounded-full">
                <section className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
                    {/* <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">Resumen de la Partida</h2> */}

                    <div className="mb-6 p-4 pt-0 border-b border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Puntaje Total:</span>
                            <span className="text-3xl font-bold">
                                {total}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-300">Puntaje Base</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">{baseScore}</p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-300">Bono por Tiempo</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-100">+{timeBonus}</p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                            <p className="text-sm text-purple-600 dark:text-purple-300">Tiempo Empleado</p>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
                                {Math.floor(timeElapsed / 60)}:{String(timeElapsed % 60).padStart(2, '0')}
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">Evaluaciones detalladas</h2>
                    <table className="w-full table-auto border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-800">
                                <th className="border border-gray-600 p-3 text-left text-gray-200">Recurso (URL)</th>
                                <th className="border border-gray-600 p-3 text-gray-200">Puntaje</th>
                                <th className="border border-gray-600 p-3 text-gray-200">Justificación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(evaluations) && evaluations.length > 0 ? (
                                evaluations.map((evaluation) => (
                                    <tr
                                        key={`evaluation-${evaluation.id}-${evaluation.url}`}
                                        className="bg-gray-800/50 hover:bg-gray-800/75 transition-colors"
                                    >
                                        <td className="border border-gray-600 p-3 break-all text-gray-200">
                                            <a
                                                href={evaluation.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:underline"
                                            >
                                                {evaluation.url}
                                            </a>
                                        </td>
                                        <td className="border border-gray-600 p-3 text-center">
                                            <span
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${evaluation.score > 0
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                                    }`}
                                            >
                                                {evaluation.score}
                                            </span>
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 p-3 text-gray-700 dark:text-gray-300">
                                            {evaluation.explanation}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                        No hay evaluaciones disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <Leaderboard
                    data={leaderboard}
                    title="Leaderboard Global"
                    className="mt-6"
                    showTopThreeMedals={true}
                    maxItems={10}
                />
            </div>

            <section className="flex gap-4">
                {isLoaded && !user ? (
                    <SignUpButton mode="modal">
                        <button className="flex-1 bg-blue-600 text-white rounded p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                            Registrate para guardar tu progreso
                        </button>
                    </SignUpButton>
                ) : (
                    <button
                        onClick={() => router.push('/play')}
                        className="flex-1 bg-blue-600 text-white rounded p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                        Siguiente Desafío
                    </button>
                )}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 border border-blue-600 text-blue-600 rounded p-2 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                >
                    Ir al Dashboard
                </button>
            </section>
        </main>
    );
}

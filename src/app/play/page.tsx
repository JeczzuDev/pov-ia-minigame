'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';

type Prompt = { id: number; title: string; description: string; level: number };

const GAME_DURATION = 60; // 1 minuto de duración del juego

export default function PlayPage() {
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [urls, setUrls] = useState<string[]>(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGame, setShowGame] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION);
    const [startTime, setStartTime] = useState<number | null>(null);
    const router = useRouter();
    const { isLoaded } = useUser();
    const fetchInProgress = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        async function loadPrompt() {
            const res = await fetch('/api/prompts/next');
            if (res.ok) {
                const { prompt } = await res.json();
                setPrompt(prompt);
            }
        }
        loadPrompt().finally(() => {
            fetchInProgress.current = false;
        });
    }, []);

    const addField = () => {
        if (urls.length < 4) setUrls([...urls, '']);
    };
    const updateField = (i: number, value: string) => {
        const copy = [...urls];
        copy[i] = value;
        setUrls(copy);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt || loading || !startTimeRef.current) return;
        
        // Detener el temporizador y calcular el tiempo transcurrido
        const endTime = Date.now();
        const timeElapsedInSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        setLoading(true);
        setError(null);

        try {
            // Validar URLs y comprobar que no se repitan
            const validUrls = urls.filter((u) => u.trim().length > 0);
            const uniqueUrls = [...new Set(validUrls)];
            if (uniqueUrls.length !== validUrls.length) {
                setError('No se permiten URLs duplicadas');
                return;
            }
            
            const completedAt = new Date().toISOString();
            const res = await fetch('/api/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    promptId: prompt.id, 
                    resources: uniqueUrls,
                    startTime: startTime,
                    timeElapsed: timeElapsedInSeconds,
                    completedAt: completedAt
                }),
            });
            
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error creando partida');
            
            // Redirigir a la pantalla de resultados
            router.push(`/play/result/${json.matchId}`);
        } catch (err: Error | unknown) {
            setError((err as Error)?.message || 'Error creando partida');
            setLoading(false);
        }
    };

    // Iniciar el contador cuando el prompt esté listo
    useEffect(() => {
        if (prompt && countdown === null) {
            startCountdown();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [prompt]);

    const startCountdown = () => {
        let counter = 3;
        setCountdown(counter);
        
        const countdownInterval = setInterval(() => {
            counter--;
            if (counter >= 0) {
                setCountdown(counter);
                if (counter === 0) {
                    // Mostrar "¡Comienza!" por 1 segundo
                    setTimeout(() => {
                        setCountdown(null);
                        setShowGame(true);
                        startGameTimer();
                    }, 1000);
                }
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
    };

    const startGameTimer = () => {
        setTimeLeft(GAME_DURATION);
        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleTimeout = async () => {
        // Solo proceder si no hay un envío en curso y el temporizador está activo
        if (!loading && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            await handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
        }
    };

    if (!isLoaded) return <p className="p-4">Cargando usuario…</p>;
    if (!prompt) return <p className="p-4">Cargando desafío…</p>;
    
    // Mostrar contador inicial o pantalla de carga
    if (countdown !== null || !showGame) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
                <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                        scale: countdown === 0 ? 1.2 : 1, 
                        opacity: 1 
                    }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="text-white text-9xl font-bold text-center"
                >
                    {countdown === 0 ? '¡Comienza!' : countdown || ''}
                </motion.div>
                {countdown === 0 && (
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-2xl mt-8"
                    >
                        Tienes {GAME_DURATION} segundos
                    </motion.p>
                )}
            </div>
        );
    }
    
    return (
        <main className="max-w-xl mx-auto p-4 relative">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-semibold">
                        Tiempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm text-gray-600">
                        {Math.round((timeLeft / GAME_DURATION) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                        style={{ 
                            width: `${(timeLeft / GAME_DURATION) * 100}%`,
                            backgroundColor: timeLeft < 10 ? '#ef4444' : timeLeft < 20 ? '#f59e0b' : '#2563eb'
                        }}
                    />
                </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">
                Nivel {prompt.level}: {prompt.title}
            </h1>
            <p className="mb-4">{prompt.description}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {urls.map((url, i) => (
                    <input
                        key={i}
                        type="url"
                        placeholder={`Recurso ${i + 1} (URL)`}
                        value={url}
                        onChange={(e) => updateField(i, e.target.value)}
                        className="w-full border rounded p-2"
                        required={false}
                    />
                ))}

                {urls.length < 4 && (
                    <button
                        type="button"
                        onClick={addField}
                        className="text-blue-600 underline cursor-pointer hover:text-blue-700 transition-colors"
                    >
                        + Añadir otro recurso
                    </button>
                )}

                {error && <p className="text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors"
                >
                    {loading ? 'Enviando…' : 'Enviar recursos'}
                </button>
            </form>
        </main>
    );
}

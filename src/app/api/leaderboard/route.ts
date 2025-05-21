import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const includeMatchId = url.searchParams.get('includeMatchId');
    const queryMatchId = includeMatchId ?
        `and(user_id.not.is.null,is_anonymous.not.eq.true),id.eq.${includeMatchId}` :
        'and(user_id.not.is.null,is_anonymous.eq.false)';

    // Primero obtenemos los datos sin ordenar
    const { data, error } = await supabase
        .from('matches')
        .select(`
            id,
            time_elapsed,
            time_bonus,
            score_ai,
            user_id,
            is_anonymous,
            users(username)
        `)
        .or(queryMatchId)
        .limit(100);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcular el total_score manualmente y ordenar
    const sortedData = [...data]
        .map(row => ({
            ...row,
            total_score: (row.score_ai || 0) + (row.time_bonus || 0)
        }))
        .sort((a, b) => b.total_score - a.total_score);

    // Definir tipos para los datos
    interface LeaderboardRow {
        id: string;
        time_elapsed: number;
        time_bonus: number;
        score_ai: number;
        user_id: string;
        is_anonymous: boolean;
        users: { username: string }[];
        total_score: number;
    }

    interface LeaderboardEntry {
        username: string;
        score: number;
        user_id: string;
    }

    // Calcular total_score por usuario
    const leaderboard = sortedData.reduce<Record<string, LeaderboardEntry>>((acc, row: LeaderboardRow) => {
        let username = 'Anónimo';

        if (Array.isArray(row.users) && row.users.length > 0) {
            // Si es un array, tomar el primer elemento
            username = row.users[0]?.username as string || 'Anónimo';
        } else if (row.users && typeof row.users === 'object' && 'username' in row.users) {
            // Si es un objeto con propiedad username
            username = row.users.username as string;
        }

        const user_id = row.user_id;
        const score = row.total_score;
        if (!acc[user_id]) {
            acc[user_id] = { username, score, user_id };
        }
        acc[user_id].score += score;
        return acc;
    }, {});

    return NextResponse.json({ leaderboard: Object.values(leaderboard) });
}
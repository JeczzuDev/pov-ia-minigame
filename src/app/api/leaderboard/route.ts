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

    // Calcular total_score por usuario
    const leaderboard = sortedData.reduce((acc: any, row: any) => {
        const user_id = row.user_id;
        const username = row.users?.username ?? 'Anónimo';
        const score = row.total_score;
        if (!acc[user_id]) {
            acc[user_id] = { username, score: 0 };
        }
        acc[user_id].score += score;
        return acc;
    }, {} as Record<string, { username: string; score: number; user_id: string }>);

    return NextResponse.json({ leaderboard: Object.values(leaderboard) });
}
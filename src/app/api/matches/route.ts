import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
    // Obtener userId
    const { userId } = await auth()

    // Leer body
    const body = await request.json();
    const { promptId, resources, matchId, associateUserId } = body;

    // Si viene associateUserId y matchId, es para asociar partida anónima a usuario
    if (associateUserId && matchId) {
        // 1. Verificar si el usuario existe en Supabase (con polling)
        let userData = null;
        let userError = null;
        for (let i = 0; i < 10; i++) {  // 10 intentos, 200ms entre cada uno
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('id', associateUserId)
                .single();
            userData = data;
            userError = error;
            if (userData) break;
            await new Promise(res => setTimeout(res, 200));
        }

        if (userError || !userData) {
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404 });
        }

        // 2. Obtener el prompt_id de la partida anónima
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('prompt_id')
            .eq('id', matchId)
            .single();

        if (matchError || !matchData?.prompt_id) {
            return NextResponse.json(
                { error: 'Partida no encontrada o sin prompt asociado' },
                { status: 404 }
            );
        }

        // 3. Verificar si el usuario ya completó este prompt
        const { data: existingMatches, error: existingError } = await supabase
            .from('matches')
            .select('id')
            .eq('user_id', associateUserId)
            .eq('prompt_id', matchData.prompt_id);

        if (existingError) {
            return NextResponse.json({ error: existingError.message }, { status: 500 });
        }

        // Si ya completó este prompt, rechazar la asociación
        if (existingMatches && existingMatches.length > 0) {
            return NextResponse.json(
                {
                    error: 'PROMPT_ALREADY_COMPLETED',
                    message: 'Ya has completado este desafío con tu cuenta.'
                },
                { status: 400 }
            );
        }

        // 4. Si no lo ha completado, asociar la partida
        const { error: updateError } = await supabase
            .from('matches')
            .update({
                user_id: associateUserId,
                is_anonymous: false
            })
            .eq('id', matchId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    }

    if (!promptId || !resources || resources.length === 0) {
        return NextResponse.json({ error: 'Missing promptId or resources' }, { status: 400 });
    }

    // Crear la partida (match)
    const isAnonymous = !userId;
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
            user_id: userId,
            prompt_id: promptId,
            is_anonymous: isAnonymous,
            // score_ai y score_community se completarán tras la evaluación
        })
        .select('id')
        .single();

    if (matchError || !match) {
        return NextResponse.json({ error: matchError?.message }, { status: 500 });
    }

    const newMatchId = match.id;

    // Guardar cada recurso
    const toInsert = resources.map((url: string) => ({
        match_id: newMatchId,
        url,
    }));
    const { error: resError } = await supabase
        .from('submitted_resources')
        .insert(toInsert);

    if (resError) {
        return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    // Devolver OK + matchId
    return NextResponse.json({ matchId: newMatchId });
}

import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { clerkId, email, username } = await request.json();

    // Verifica si el usuario ya existe en Supabase
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('id', clerkId)
      .single();

    if (existingError) return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });

    if (!existing) {
      // Inserta el usuario si no existe
      const { data: user, error: insertError } = await supabase.from('users').insert({
        id: clerkId,
        username,
        email,
      });

      if (insertError) return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });

      return NextResponse.json(
        { ok: true, user },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: true, existing },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Error syncing user', error: error as Error }, { status: 500 });
  }
}

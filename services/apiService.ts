
import { supabase } from '../lib/supabaseClient';
import { Game, SportEvent, User, Role } from '../types';
import { SLOT_GAMES_API_HOST, BETFAIR_API_HOST } from '../constants';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const RAPID_API_KEY = process.env.VITE_RAPID_API_KEY;

const rapidApiFetch = async (host: string, endpoint: string) => {
    if (!RAPID_API_KEY) {
        throw new Error("RapidAPI key is not configured in environment variables.");
    }
    const response = await fetch(`https://${host}${endpoint}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': host,
        },
    });
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
};

// --- Game & Sport APIs ---

export const getGames = async (category: string): Promise<Game[]> => {
    // This is a hypothetical mapping. You MUST adjust it based on the actual API response structure.
    const data = await rapidApiFetch(SLOT_GAMES_API_HOST, '/');
    const mappedGames: Game[] = data.map((game: any) => ({
        id: game.id,
        name: game.title,
        provider: game.provider,
        imageUrl: game.image,
        category: game.category // Assuming the API provides a category
    }));

    if (category === 'All' || category === 'Casino') {
        return mappedGames;
    }
    return mappedGames.filter(g => g.category === category);
};

export const getSportsEvents = async (): Promise<SportEvent[]> => {
    // This is a hypothetical mapping. You MUST adjust it based on the actual API response structure.
    // The Betfair API is complex; this is a simplified example.
    // We are mocking this one as the real API is very complex to map without documentation.
    console.warn("Sports events are currently mocked. Real API integration is required.");
    return [
        {
            id: 'evt-live-1',
            name: 'Live Football',
            participants: ['Team A', 'Team B'],
            startTime: new Date().toISOString(),
            live: true,
            markets: [
                { name: 'Match Winner', odds: [{ name: 'Team A', value: 2.1 }, { name: 'Draw', value: 3.0 }, { name: 'Team B', value: 2.9 }] },
            ]
        }
    ];
};

export const getLiveTvUrl = async (eventId: string): Promise<string> => {
    const data = await rapidApiFetch(BETFAIR_API_HOST, `/api/v3/livetv?eventid=${eventId}`);
    return data?.Url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; // Fallback URL
};


// --- Supabase Auth & User Management ---

export const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};

export const signOut = async () => {
    await supabase.auth.signOut();
};

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

export const getCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            username,
            role,
            created_at,
            accounts ( balance )
        `)
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    
    return {
        id: data.id,
        username: data.username,
        role: data.role,
        createdAt: data.created_at,
        balance: data.accounts[0]?.balance ?? 0,
    };
};

export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            username,
            role,
            created_at,
            accounts ( balance )
        `)
        .eq('role', 'USER');

    if (error) throw error;

    return data.map(profile => ({
        id: profile.id,
        username: profile.username,
        role: profile.role as Role,
        createdAt: profile.created_at,
        balance: profile.accounts[0]?.balance ?? 0,
    }));
}

export const adminCreateUser = async (username: string, password: string): Promise<void> => {
    // SECURITY NOTE: This flow logs the admin out. This is a client-side limitation.
    // A production app should use a Supabase Edge Function for user creation.
    // Also, disable "Confirm email" in Supabase Auth settings for this to work.

    const email = `${username.toLowerCase()}@gobet.local`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed in Auth.');

    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        role: Role.USER,
    });
    if (profileError) throw profileError;

    // Insert into accounts
    const { error: accountError } = await supabase.from('accounts').insert({
        user_id: authData.user.id,
        balance: 0,
    });
    if (accountError) throw accountError;
    
    // Sign out the new user immediately so the admin is forced to log back in.
    await supabase.auth.signOut();
};

export const updateUserBalance = async (userId: string, amount: number, transactionType: 'deposit' | 'withdraw'): Promise<number> => {
    // For production, this should be an atomic RPC function in Supabase.
    // Doing it in two steps here for simplicity.
    
    const { data: accountData, error: fetchError } = await supabase.from('accounts').select('id, balance').eq('user_id', userId).single();
    if(fetchError) throw fetchError;

    const newBalance = accountData.balance + amount;
    
    const { data: updatedAccount, error: updateError } = await supabase.from('accounts').update({ balance: newBalance }).eq('user_id', userId).select('balance').single();
    if(updateError) throw updateError;
    
    // Log transaction
    const { error: transactionError } = await supabase.from('transactions').insert({
        account_id: accountData.id,
        user_id: userId,
        type: transactionType,
        amount: Math.abs(amount),
        admin_id: (await supabase.auth.getUser()).data.user?.id
    });
    if(transactionError) console.error("Failed to log transaction:", transactionError);

    return updatedAccount.balance;
}

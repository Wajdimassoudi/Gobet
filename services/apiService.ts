// Fix for 'import.meta.env' TypeScript error

import { supabase } from '../lib/supabaseClient';
import { Game, SportEvent, User, Role } from '../types';
import { SLOT_GAMES_API_HOST, BETFAIR_API_HOST } from '../constants';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// NOTE: RapidAPI calls have been disabled and replaced with mock data.
// This allows the application to function without needing a VITE_RAPID_API_KEY.
// const RAPID_API_KEY = (import.meta as any).env.VITE_RAPID_API_KEY;
/*
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
*/

// --- Game & Sport APIs ---

export const getGames = async (category: string): Promise<Game[]> => {
    console.warn("Game data is currently mocked. A valid RapidAPI key is required for live data.");
    const allGames: Game[] = [
        { id: 'slot1', name: 'Book of Ra', provider: 'Novomatic', category: 'Slots', imageUrl: 'https://img.gs-games.com/c/300/300/a/media/export/g/book-of-ra-deluxe-10-win-ways-slot-game-logo.png' },
        { id: 'slot2', name: 'Starburst', provider: 'NetEnt', category: 'Slots', imageUrl: 'https://www.netent.com/uploads/2021/01/Starburst-Extreme-Casino-Game-by-NetEnt.jpg' },
        { id: 'slot3', name: 'Gonzo\'s Quest', provider: 'NetEnt', category: 'Slots', imageUrl: 'https://www.netent.com/uploads/2020/12/ Gonzos-Quest-Casino-Game-by-NetEnt.jpg' },
        { id: 'live1', name: 'Live Blackjack', provider: 'Evolution', category: 'Live Casino', imageUrl: 'https://www.evolution.com/wp-content/uploads/2021/11/live-blackjack.jpg' },
        { id: 'live2', name: 'Lightning Roulette', provider: 'Evolution', category: 'Live Casino', imageUrl: 'https://www.evolution.com/wp-content/uploads/2021/11/lightning-roulette.jpg' },
        { id: 'casino1', name: 'European Roulette', provider: 'Playtech', category: 'Casino', imageUrl: 'https://images.igaming.org/images/Content/casino/how-to-play-roulette-header.jpg' },
        { id: 'casino2', name: 'Classic Baccarat', provider: 'Pragmatic Play', category: 'Casino', imageUrl: 'https://www.pragmaticplay.com/wp-content/uploads/2021/10/Baccarat.png' }
    ];

    if (category === 'All' || !['Slots', 'Live Casino', 'Casino'].includes(category)) {
        return allGames.filter(g => g.category === 'Slots' || g.category === 'Casino' || g.category === 'Live Casino');
    }
    return allGames.filter(g => g.category === category);
};

export const getSportsEvents = async (): Promise<SportEvent[]> => {
    return [
        {
            id: 'evt-live-1',
            name: 'Live Football',
            participants: ['Team A', 'Team B'],
            startTime: new Date().toISOString(),
            live: true,
            markets: [
                { name: 'Match Winner', odds: [{ name: 'Team A', value: 2.1 }, { name: 'Draw', value: 3.0 }, { name: 'Team B', value: 2.9 }] },
                { name: 'Both Teams to Score', odds: [{ name: 'Yes', value: 1.8 }, { name: 'No', value: 1.95 }] },
            ]
        },
        {
            id: 'evt-pre-1',
            name: 'Upcoming Tennis Match',
            participants: ['Player 1', 'Player 2'],
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            live: false,
            markets: [
                { name: 'Match Winner', odds: [{ name: 'Player 1', value: 1.5 }, { name: 'Player 2', value: 2.5 }] },
            ]
        }
    ];
};

export const getLiveTvUrl = async (eventId: string): Promise<string> => {
    console.warn("Live TV URL is using a fallback. A valid RapidAPI key is required for live data.");
    return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; // Return fallback URL directly
};


// --- Supabase Auth & User Management ---

export const signIn = async (email: string, password: string) => {
    // IMPORTANT: This function expects an email.
    // The Login form constructs a "dummy" email like 'username@gobet.local'.
    // For the 'admin' user to log in, you MUST have created a user in your
    // Supabase Authentication settings with the EXACT email: 'admin@gobet.local'
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
    
    // The query returns an array for accounts, even with a single relation.
    const balance = Array.isArray(data.accounts) ? data.accounts[0]?.balance : data.accounts?.balance;

    return {
        id: data.id,
        username: data.username,
        role: data.role,
        createdAt: data.created_at,
        balance: balance ?? 0,
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

    return data.map(profile => {
        const balance = Array.isArray(profile.accounts) ? profile.accounts[0]?.balance : profile.accounts?.balance;
        return {
            id: profile.id,
            username: profile.username,
            role: profile.role as Role,
            createdAt: profile.created_at,
            balance: balance ?? 0,
        };
    });
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

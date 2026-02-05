
import { supabase } from '../lib/supabaseClient';
import { Game, SportEvent, User, Role, Market } from '../types';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { RAPID_API_KEY, RAPID_API_HOST_BETFAIR } from '../config';

const rapidApiFetch = async (host: string, endpoint: string) => {
    if (!RAPID_API_KEY) {
        console.error("RapidAPI key is not configured.");
        throw new Error("API key is missing.");
    }
    const response = await fetch(`https://${host}${endpoint}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': host,
        },
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API call failed for ${host}${endpoint}: ${response.statusText}`, errorBody);
        throw new Error(`Failed to fetch data from the API. Status: ${response.status}`);
    }
    return response.json();
};

// --- Game & Sport APIs ---

export const getGames = async (category: string): Promise<Game[]> => {
    console.warn("Game data is currently mocked.");
    const allGames: Game[] = [
        { id: 'slot1', name: 'Book of Ra', provider: 'Novomatic', category: 'Slots', imageUrl: 'https://img.gs-games.com/c/300/300/a/media/export/g/book-of-ra-deluxe-10-win-ways-slot-game-logo.png' },
        { id: 'slot2', name: 'Starburst', provider: 'NetEnt', category: 'Slots', imageUrl: 'https://www.netent.com/uploads/2021/01/Starburst-Extreme-Casino-Game-by-NetEnt.jpg' },
        { id: 'slot3', name: 'Gonzo\'s Quest', provider: 'NetEnt', category: 'Slots', imageUrl: 'https://www.netent.com/uploads/2020/12/ Gonzos-Quest-Casino-Game-by-NetEnt.jpg' },
        { id: 'live1', name: 'Live Blackjack', provider: 'Evolution', category: 'Live Casino', imageUrl: 'https://www.evolution.com/wp-content/uploads/2021/11/live-blackjack.jpg' },
        { id: 'live2', name: 'Lightning Roulette', provider: 'Evolution', category: 'Live Casino', imageUrl: 'https://www.evolution.com/wp-content/uploads/2021/11/lightning-roulette.jpg' },
        { id: 'casino1', name: 'European Roulette', provider: 'Playtech', category: 'Casino', imageUrl: 'https://images.igaming.org/images/Content/casino/how-to-play-roulette-header.jpg' },
        { id: 'casino2', name: 'Classic Baccarat', provider: 'Pragmatic Play', category: 'Casino', imageUrl: 'https://www.pragmaticplay.com/wp-content/uploads/2021/10/Baccarat.png' }
    ];

    return allGames.filter(g => category === 'All' || g.category === category);
};

export const getSportsEvents = async (): Promise<SportEvent[]> => {
    // NOTE: The user provided an API for a specific event's TV stream. To populate the list,
    // we are assuming a standard endpoint '/api/v3/events' exists on the same host.
    const response = await rapidApiFetch(RAPID_API_HOST_BETFAIR, '/api/v3/events?sport=soccer');

    // This is an assumed mapping based on a typical sports API structure.
    // It may need to be adjusted based on the actual response from the API.
    if (!response || !Array.isArray(response.events)) {
        console.warn("API response for sports events is not in the expected format.", response);
        return []; // Return empty array if data is malformed
    }
    
    return response.events.map((event: any): SportEvent => ({
        id: event.id,
        name: event.name || `${event.participants?.[0]} vs ${event.participants?.[1]}`,
        participants: event.participants || ['Team 1', 'Team 2'],
        startTime: event.startTime,
        live: event.live || event.status === 'live',
        markets: (event.markets || []).map((market: any): Market => ({
            name: market.name,
            odds: (market.odds || []).map((outcome: any) => ({
                name: outcome.name,
                value: outcome.value,
            })),
        })),
    }));
};

export const getLiveTvUrl = async (eventId: string): Promise<string> => {
    const response = await rapidApiFetch(RAPID_API_HOST_BETFAIR, `/api/v3/livetv?eventid=${eventId}`);
    // Assuming the response has a "url" property containing the stream link.
    if (response && response.url) {
        return response.url;
    }
    // Fallback if the API doesn't provide a URL
    console.warn(`No live TV URL found for event ${eventId}. Using fallback.`);
    return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
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

export const getUserProfile = async (user: SupabaseUser): Promise<User> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role, created_at, accounts ( balance )')
        .eq('id', user.id)
        .single();

    if (data) {
        const balance = Array.isArray(data.accounts) ? data.accounts[0]?.balance : data.accounts?.balance;
        return {
            id: data.id,
            username: data.username,
            role: data.role as Role,
            createdAt: data.created_at,
            balance: balance ?? 0,
        };
    }

    // Self-healing: If profile is not found, check if it's the admin user needing setup.
    if (!data && user.email === 'admin@gobet.local') {
        console.warn("Admin profile not found. Attempting to create it automatically...");
        
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({ id: user.id, username: 'admin', role: 'ADMIN' })
            .select()
            .single();

        if (profileError) {
             throw new Error(`Automatic admin setup failed: Could not create profile. Check RLS policies. Error: ${profileError.message}`);
        }

        const { error: accountError } = await supabase
            .from('accounts')
            .insert({ user_id: user.id, balance: 999999 });

        if (accountError) {
            await supabase.from('profiles').delete().eq('id', user.id);
            throw new Error(`Automatic admin setup failed: Could not create account. Check RLS policies. Error: ${accountError.message}`);
        }
        
        console.log("Admin profile and account created successfully.");
        return {
            id: profileData.id,
            username: profileData.username,
            role: profileData.role as Role,
            createdAt: profileData.created_at,
            balance: 999999,
        };
    }
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw new Error(`A database error occurred: ${error.message}`);
    }
    
    throw new Error(`Authentication successful, but user profile not found for ID: ${user.id}.`);
};

export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`id, username, role, created_at, accounts ( balance )`)
        .eq('role', 'USER');

    if (error) throw error;

    return data.map(profile => ({
        id: profile.id,
        username: profile.username,
        role: profile.role as Role,
        createdAt: profile.created_at,
        balance: (Array.isArray(profile.accounts) ? profile.accounts[0]?.balance : profile.accounts?.balance) ?? 0,
    }));
}

export const adminCreateUser = async (username: string, password: string): Promise<void> => {
    const email = `${username.toLowerCase()}@gobet.local`;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed in Auth.');

    const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, username, role: Role.USER });
    if (profileError) throw profileError;

    const { error: accountError } = await supabase.from('accounts').insert({ user_id: authData.user.id, balance: 0 });
    if (accountError) throw accountError;
    
    await supabase.auth.signOut();
};

export const updateUserBalance = async (userId: string, amount: number, transactionType: 'deposit' | 'withdraw'): Promise<number> => {
    const { data: accountData, error: fetchError } = await supabase.from('accounts').select('id, balance').eq('user_id', userId).single();
    if(fetchError) throw fetchError;

    let newBalance = transactionType === 'deposit' ? accountData.balance + amount : accountData.balance - amount;
    
    const { data: updatedAccount, error: updateError } = await supabase.from('accounts').update({ balance: newBalance }).eq('user_id', userId).select('balance').single();
    if(updateError) throw updateError;
    
    const { data: { user } } = await supabase.auth.getUser();
    const { error: transactionError } = await supabase.from('transactions').insert({
        account_id: accountData.id,
        user_id: userId,
        type: transactionType,
        amount: Math.abs(amount),
        admin_id: user?.id
    });
    if(transactionError) console.error("Failed to log transaction:", transactionError);

    return updatedAccount.balance;
}

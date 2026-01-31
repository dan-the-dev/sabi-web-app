import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

export type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string };

export type SignUpResult =
  | { success: true; user: User; needsEmailConfirmation?: boolean }
  | { success: false; error: string };

/**
 * Auth API: encapsulates Supabase auth for the app.
 * Pass the result of createClient() from client.ts (browser) or server.ts (server).
 */
export function createAuth(supabase: SupabaseClient) {
  return {
    async signIn(email: string, password: string): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { success: false, error: error.message };
      if (!data?.user) return { success: false, error: "No user returned" };
      return { success: true, user: data.user };
    },

    async signUp(
      email: string,
      password: string,
      metadata?: Record<string, unknown>
    ): Promise<SignUpResult> {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: metadata ? { data: metadata } : undefined,
      });
      if (error) return { success: false, error: error.message };
      if (!data?.user) return { success: false, error: "No user returned" };
      return {
        success: true,
        user: data.user,
        needsEmailConfirmation: !data.session,
      };
    },

    async signOut(): Promise<{ success: boolean; error?: string }> {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
      return { success: true };
    },

    async getSession(): Promise<Session | null> {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session;
    },

    async getUser(): Promise<User | null> {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data.user;
    },
  };
}

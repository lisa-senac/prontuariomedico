import { supabase } from "../config/supabase-config.js";

export async function cadastrarUsuario(email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha
  });

  if (error) throw error;

  return data;
}

export async function fazerLogin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) throw error;

  return data;
}

export async function fazerLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;

  return true;
}

export async function obterUsuarioLogado() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
}

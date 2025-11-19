import { supabase } from './supabaseClient.js';
import { isAdmin } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Check user role and redirect accordingly
        const admin = await isAdmin(supabase);
        if (admin) {
            window.location.href = './admin.html';
        } else {
            window.location.href = './index.html';
        }
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Clear previous error messages
        errorMessage.classList.add('hidden');
        
        try {
            // Sign in with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            // Check user role and redirect accordingly
            const admin = await isAdmin(supabase);
            if (admin) {
                window.location.href = './admin.html';
            } else {
                window.location.href = './index.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
});
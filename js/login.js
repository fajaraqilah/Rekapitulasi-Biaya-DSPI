import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if user is already logged in
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
        // Redirect to main dashboard
        window.location.href = './index.html';
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
            
            // Store session data
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to main dashboard
            window.location.href = './index.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
});
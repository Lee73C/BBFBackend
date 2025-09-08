// ===========================================
// SISTEMA DE AUTENTICACIÓN - BBFermentos
// ===========================================

// Configuración global
const AUTH_CONFIG = {
    LOGIN_ENDPOINT: '/api/sessions/login',
    REGISTER_ENDPOINT: '/api/users/register',
    CURRENT_ENDPOINT: '/api/sessions/current',
    TOKEN_KEY: 'bbfermentos_auth_token',
    USER_KEY: 'bbfermentos_user_data',
    REDIRECT_KEY: 'bbfermentos_redirect_after_login'
};

// ===========================================
// UTILIDADES GENERALES
// ===========================================

// Mostrar alertas
function showAlert(message, type = 'info', container = 'alertContainer') {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alertTypes = {
        success: { class: 'alert-success', icon: '✅' },
        error: { class: 'alert-danger', icon: '❌' },
        warning: { class: 'alert-warning', icon: '⚠️' },
        info: { class: 'alert-info', icon: 'ℹ️' }
    };

    const alert = alertTypes[type] || alertTypes.info;
    
    const alertHtml = `
        <div class="alert ${alert.class}" style="margin-bottom: 15px;">
            ${alert.icon} ${message}
            <button onclick="this.parentElement.remove()" class="alert-close">&times;</button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHtml;
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        const alertElement = alertContainer.querySelector('.alert');
        if (alertElement) alertElement.remove();
    }, 5000);
}

// Mostrar error en campo específico
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
    }
}

// Limpiar error de campo
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('error');
    }
}

// Limpiar todos los errores
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const fields = document.querySelectorAll('.form-input');
    fields.forEach(field => field.classList.remove('error'));
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggleBtn = field.parentElement.querySelector('.password-toggle');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        field.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar fuerza de contraseña
function getPasswordStrength(password) {
    if (password.length < 6) return { strength: 'weak', message: 'Muy débil - Mínimo 6 caracteres' };
    if (password.length < 8) return { strength: 'fair', message: 'Regular - Mejor si tiene 8+ caracteres' };
    
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score >= 3) return { strength: 'strong', message: 'Fuerte ✅' };
    if (score >= 2) return { strength: 'medium', message: 'Buena - Agrega números o símbolos' };
    return { strength: 'fair', message: 'Regular - Agrega mayúsculas y números' };
}

// ===========================================
// GESTIÓN DE TOKENS
// ===========================================

// Guardar token de autenticación
function saveAuthToken(token, userData = null) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    if (userData) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
    }
    console.log('🔐 Token guardado correctamente');
}

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

// Obtener datos del usuario
function getUserData() {
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

// Limpiar datos de autenticación
function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    console.log('🗑️ Datos de autenticación eliminados');
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return !!getAuthToken();
}

// ===========================================
// FUNCIONES DE LOGIN
// ===========================================

function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // Limpiar errores al escribir
    form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            clearFieldError(input.id);
        });
    });

    // Manejar submit del formulario
    form.addEventListener('submit', handleLogin);

    console.log('🔐 Formulario de login inicializado');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');
    
    // Limpiar errores previos
    clearAllErrors();
    
    // Obtener datos del formulario
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validaciones básicas
    if (!email) {
        showFieldError('email', 'El email es requerido');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFieldError('email', 'Formato de email inválido');
        return;
    }
    
    if (!password) {
        showFieldError('password', 'La contraseña es requerida');
        return;
    }
    
    // UI de carga
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    
    try {
        console.log('🔐 Iniciando login...', { email, rememberMe });
        
        const response = await fetch(AUTH_CONFIG.LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            // Login exitoso
            const { token, user } = data.payload;
            
            // Guardar token y datos del usuario
            saveAuthToken(token, user);
            
            showAlert('¡Login exitoso! Redirigiendo...', 'success');
            
            console.log('✅ Login exitoso:', user);
            
            // Redirigir después de un momento
            setTimeout(() => {
                const redirectUrl = localStorage.getItem(AUTH_CONFIG.REDIRECT_KEY) || '/products';
                localStorage.removeItem(AUTH_CONFIG.REDIRECT_KEY);
                window.location.href = redirectUrl;
            }, 1500);
            
        } else {
            // Error de login
            const errorMessage = data.message || 'Error en las credenciales';
            showAlert(errorMessage, 'error');
            
            if (errorMessage.toLowerCase().includes('email')) {
                showFieldError('email', errorMessage);
            } else if (errorMessage.toLowerCase().includes('password')) {
                showFieldError('password', errorMessage);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        showAlert('Error de conexión. Intenta de nuevo.', 'error');
    } finally {
        // Restaurar UI
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

// ===========================================
// FUNCIONES DE REGISTRO
// ===========================================

function initializeRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Limpiar errores al escribir
    form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            clearFieldError(input.id);
            
            // Validación en tiempo real para contraseña
            if (input.id === 'password') {
                updatePasswordStrength(input.value);
            }
            
            // Validación para confirmación de contraseña
            if (input.id === 'confirmPassword') {
                validatePasswordMatch();
            }
        });
    });

    // Manejar submit del formulario
    form.addEventListener('submit', handleRegister);

    console.log('👤 Formulario de registro inicializado');
}

function updatePasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    if (!strengthElement) return;
    
    if (!password) {
        strengthElement.innerHTML = '';
        return;
    }
    
    const { strength, message } = getPasswordStrength(password);
    const colors = {
        weak: '#dc3545',
        fair: '#ffc107', 
        medium: '#fd7e14',
        strong: '#28a745'
    };
    
    strengthElement.innerHTML = `
        <div class="password-strength-bar">
            <div class="strength-indicator ${strength}" style="background-color: ${colors[strength]}"></div>
        </div>
        <span class="strength-text" style="color: ${colors[strength]}">${message}</span>
    `;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        return false;
    } else if (confirmPassword) {
        clearFieldError('confirmPassword');
        return true;
    }
    return true;
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnSpinner = registerBtn.querySelector('.btn-spinner');
    
    // Limpiar errores previos
    clearAllErrors();
    
    // DEBUG: Verificar datos del formulario
    console.log('🔍 DATOS DEL FORMULARIO:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${key === 'password' ? '***' : value}`);
    }
    
    // Obtener datos del formulario
    const userData = {
        first_name: formData.get('first_name')?.trim(),
        last_name: formData.get('last_name')?.trim(),
        email: formData.get('email')?.trim(),
        age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
        password: formData.get('password')
    };
    
    const confirmPassword = formData.get('confirmPassword');
    
    console.log('🔍 DATOS PROCESADOS:', {
        ...userData,
        password: userData.password ? '***' : 'MISSING',
        confirmPassword: confirmPassword ? '***' : 'MISSING'
    });
    
    // Validaciones
    let hasErrors = false;
    
    if (!userData.first_name) {
        showFieldError('firstName', 'El nombre es requerido');
        hasErrors = true;
    }
    
    if (!userData.last_name) {
        showFieldError('lastName', 'El apellido es requerido');
        hasErrors = true;
    }
    
    if (!userData.email) {
        showFieldError('email', 'El email es requerido');
        hasErrors = true;
    } else if (!isValidEmail(userData.email)) {
        showFieldError('email', 'Formato de email inválido');
        hasErrors = true;
    }
    
    if (userData.age && (userData.age < 18 || userData.age > 120)) {
        showFieldError('age', 'La edad debe estar entre 18 y 120 años');
        hasErrors = true;
    }
    
    if (!userData.password) {
        showFieldError('password', 'La contraseña es requerida');
        hasErrors = true;
    } else if (userData.password.length < 6) {
        showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
        hasErrors = true;
    }
    
    if (userData.password !== confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        hasErrors = true;
    }
    
    if (hasErrors) {
        console.log('❌ Errores de validación, no enviando');
        return;
    }
    
    // Limpiar age si está vacío
    if (!userData.age) {
        delete userData.age;
    }
    
    // UI de carga
    registerBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    
    try {
        console.log('👤 Enviando datos de registro...', userData);
        
        const response = await fetch(AUTH_CONFIG.REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📡 Datos de respuesta:', data);
        
        if (response.ok && data.status === 'success') {
            // Registro exitoso
            showAlert('¡Cuenta creada exitosamente! Iniciando sesión...', 'success');
            
            console.log('✅ Registro exitoso:', data.payload);
            
            // Auto-login después del registro
            setTimeout(async () => {
                try {
                    console.log('🔐 Intentando auto-login...');
                    
                    const loginResponse = await fetch(AUTH_CONFIG.LOGIN_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: userData.email,
                            password: userData.password
                        })
                    });
                    
                    const loginData = await loginResponse.json();
                    console.log('🔐 Respuesta de auto-login:', loginData);
                    
                    if (loginResponse.ok && loginData.status === 'success') {
                        const { token, user } = loginData.payload;
                        saveAuthToken(token, user);
                        
                        showAlert('¡Bienvenido a BBFermentos!', 'success');
                        
                        setTimeout(() => {
                            window.location.href = '/products';
                        }, 1500);
                    } else {
                        showAlert('Cuenta creada. Por favor inicia sesión manualmente.', 'info');
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    }
                } catch (error) {
                    console.error('❌ Error en auto-login:', error);
                    showAlert('Cuenta creada. Redirigiendo al login...', 'info');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            }, 1500);
            
        } else {
            // Error de registro
            const errorMessage = data.message || 'Error al crear la cuenta';
            console.error('❌ Error de registro:', errorMessage);
            showAlert(errorMessage, 'error');
            
            // Mostrar errores específicos de campos
            if (data.errors && Array.isArray(data.errors)) {
                data.errors.forEach(error => {
                    console.log('❌ Error específico:', error);
                    if (error.path) {
                        showFieldError(error.path, error.msg || error.message);
                    }
                });
            } else if (errorMessage.toLowerCase().includes('email')) {
                showFieldError('email', errorMessage);
            }
        }
        
    } catch (error) {
        console.error('❌ Error de conexión en registro:', error);
        showAlert('Error de conexión. Intenta de nuevo.', 'error');
    } finally {
        // Restaurar UI
        registerBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

// ===========================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ===========================================

async function verifyAuthentication() {
    const token = getAuthToken();
    if (!token) return false;
    
    try {
        const response = await fetch(AUTH_CONFIG.CURRENT_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                // Actualizar datos del usuario
                saveAuthToken(token, data.payload);
                return true;
            }
        }
        
        // Token inválido, limpiar datos
        clearAuthData();
        return false;
        
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        return false;
    }
}

// ===========================================
// LOGOUT
// ===========================================

function logout() {
    clearAuthData();
    showAlert('Sesión cerrada correctamente', 'info');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

// ===========================================
// PROTECCIÓN DE RUTAS
// ===========================================

function requireAuth(redirectUrl = '/login') {
    if (!isAuthenticated()) {
        // Guardar URL actual para redirigir después del login
        localStorage.setItem(AUTH_CONFIG.REDIRECT_KEY, window.location.pathname + window.location.search);
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

function requireGuest(redirectUrl = '/products') {
    if (isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// ===========================================
// INTEGRACIÓN CON CARRITO EXISTENTE
// ===========================================

function integrateWithExistingCart() {
    // Verificar si hay un carrito en localStorage
    const existingCartId = localStorage.getItem('bbfermentos_cart_id');
    const userData = getUserData();
    
    if (existingCartId && userData && userData.cart) {
        console.log('🛒 Integrando carrito existente con usuario autenticado');
        
        // Si el usuario tiene un carrito diferente, podemos migrar o fusionar
        if (existingCartId !== userData.cart) {
            console.log('🔄 Detectado carrito diferente, manteniendo el actual');
            // Aquí podrías implementar lógica para fusionar carritos
        }
    }
}

// ===========================================
// INICIALIZACIÓN GLOBAL
// ===========================================

// Función que se ejecuta en todas las páginas
function initializeAuth() {
    // Verificar autenticación en páginas protegidas
    const protectedPaths = ['/admin', '/profile', '/orders'];
    const currentPath = window.location.pathname;
    
    if (protectedPaths.some(path => currentPath.startsWith(path))) {
        requireAuth();
    }
    
    // Verificar guest en páginas de auth
    const guestPaths = ['/login', '/register'];
    if (guestPaths.includes(currentPath)) {
        requireGuest();
    }
    
    // Integrar con carrito existente si está autenticado
    if (isAuthenticated()) {
        integrateWithExistingCart();
    }
    
    // Actualizar UI según estado de autenticación
    updateAuthUI();
}

function updateAuthUI() {
    const userData = getUserData();
    const isAuth = isAuthenticated();
    
    // Actualizar navegación
    const authLinks = document.querySelectorAll('.auth-link');
    authLinks.forEach(link => {
        if (isAuth) {
            if (link.dataset.authRequired === 'false') {
                link.style.display = 'none';
            } else {
                link.style.display = 'inline';
                if (userData && link.textContent.includes('Usuario')) {
                    link.textContent = `👤 ${userData.first_name}`;
                }
            }
        } else {
            if (link.dataset.authRequired === 'true') {
                link.style.display = 'none';
            } else {
                link.style.display = 'inline';
            }
        }
    });
}

// ===========================================
// MANEJO DE ERRORES GLOBALES
// ===========================================

window.addEventListener('unhandledrejection', event => {
    console.error('Promise rechazada sin manejar:', event.reason);
    if (event.reason && event.reason.status === 401) {
        clearAuthData();
        showAlert('Sesión expirada. Por favor inicia sesión de nuevo.', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
});

// ===========================================
// EXPORT DE FUNCIONES GLOBALES
// ===========================================

// Hacer funciones disponibles globalmente
window.BBAuth = {
    login: handleLogin,
    register: handleRegister,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getUserData: getUserData,
    requireAuth: requireAuth,
    requireGuest: requireGuest,
    togglePassword: togglePassword,
    showAlert: showAlert
};

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

console.log('🔐 Sistema de autenticación BBFermentos inicializado');
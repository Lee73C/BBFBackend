// ==========================================
// CONFIGURACIÓN
// ==========================================
const AUTH = {
  ENDPOINTS: {
    LOGIN: '/api/sessions/login',
    REGISTER: '/api/users/register',
    CURRENT: '/api/sessions/current',
    LOGOUT: '/api/sessions/logout',
    FORGOT_PASSWORD: '/api/sessions/forgot-password',
    RESET_PASSWORD: '/api/sessions/reset-password'
  },
  
  STORAGE: {
    TOKEN: 'bbfermentos_auth_token',
    USER: 'bbfermentos_user_data',
    REDIRECT: 'bbfermentos_redirect_after_login'
  }
};

// ==========================================
// GESTIÓN DE TOKENS Y STORAGE
// ==========================================
const Storage = {
  saveAuth(token, userData) {
    localStorage.setItem(AUTH.STORAGE.TOKEN, token);
    if (userData) {
      localStorage.setItem(AUTH.STORAGE.USER, JSON.stringify(userData));
    }
    document.cookie = `bbfermentos_auth_token=${token}; path=/; max-age=86400`;
  },
  
  getToken() {
    return localStorage.getItem(AUTH.STORAGE.TOKEN);
  },
  
  getUser() {
    const userData = localStorage.getItem(AUTH.STORAGE.USER);
    return userData ? JSON.parse(userData) : null;
  },
  
  clear() {
    localStorage.removeItem(AUTH.STORAGE.TOKEN);
    localStorage.removeItem(AUTH.STORAGE.USER);
    document.cookie = 'bbfermentos_auth_token=; path=/; max-age=0';
  },
  
  isAuthenticated() {
    return !!this.getToken();
  }
};

// ==========================================
// VALIDACIONES
// ==========================================
const Validators = {
  email(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  passwordStrength(password) {
    if (password.length < 6) return { level: 'weak', message: 'Muy débil' };
    if (password.length < 8) return { level: 'fair', message: 'Regular' };
    
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score >= 3) return { level: 'strong', message: 'Fuerte ✅' };
    if (score >= 2) return { level: 'medium', message: 'Buena' };
    return { level: 'fair', message: 'Regular' };
  }
};

// ==========================================
// UI HELPERS
// ==========================================
const UI = {
  showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const classes = { success: 'alert-success', error: 'alert-danger', warning: 'alert-warning', info: 'alert-info' };
    
    container.innerHTML = `
      <div class="alert ${classes[type]}" style="margin-bottom: 15px;">
        ${icons[type]} ${message}
        <button onclick="this.parentElement.remove()" class="alert-close">&times;</button>
      </div>
    `;
    
    setTimeout(() => container.querySelector('.alert')?.remove(), 5000);
  },
  
  showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + 'Error');
    const field = document.getElementById(fieldId);
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
    if (field) field.classList.add('error');
  },
  
  clearFieldError(fieldId) {
    const errorEl = document.getElementById(fieldId + 'Error');
    const field = document.getElementById(fieldId);
    
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    if (field) field.classList.remove('error');
  },
  
  clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.form-input').forEach(field => 
      field.classList.remove('error')
    );
  },
  
  setButtonLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    
    btn.disabled = loading;
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (spinner) spinner.style.display = loading ? 'inline' : 'none';
  }
};

// ==========================================
// API CALLS
// ==========================================
const API = {
  async post(endpoint, data) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { response, data: await response.json() };
  },
  
  async get(endpoint, token) {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { response, data: await response.json() };
  }
};

// ==========================================
// AUTENTICACIÓN
// ==========================================
const Auth = {
  async login(email, password) {
    UI.clearAllErrors();
    UI.setButtonLoading('loginBtn', true);
    
    try {
      if (!Validators.email(email)) {
        UI.showFieldError('email', 'Email inválido');
        return;
      }
      
      const { response, data } = await API.post(AUTH.ENDPOINTS.LOGIN, { email, password });
      
      if (response.ok && data.status === 'success') {
        Storage.saveAuth(data.payload.token, data.payload.user);
        
        await this.syncUserCart(data.payload.user);
        
        UI.showAlert('¡Login exitoso!', 'success');
        
        setTimeout(() => {
          const redirect = localStorage.getItem(AUTH.STORAGE.REDIRECT) || '/products';
          localStorage.removeItem(AUTH.STORAGE.REDIRECT);
          window.location.href = redirect;
        }, 1500);
      } else {
        UI.showAlert(data.message || 'Credenciales inválidas', 'error');
      }
    } catch (error) {
      UI.showAlert('Error de conexión', 'error');
    } finally {
      UI.setButtonLoading('loginBtn', false);
    }
  },
  
  async syncUserCart(user) {
    try {
      console.log('🔄 Iniciando sincronización de carrito...');
      
      const localCartId = localStorage.getItem('bbfermentos_cart_id');
      
      let userCartId = null;
      if (user.cart) {
        if (typeof user.cart === 'object' && user.cart._id) {
          userCartId = user.cart._id.toString();
        } else {
          userCartId = user.cart.toString();
        }
      }
      
      console.log('📦 Local Cart:', localCartId);
      console.log('👤 User Cart:', userCartId);
      
      if (!userCartId) {
        console.log('⚠️ Usuario sin carrito');
        localStorage.removeItem('bbfermentos_cart_id');
        return;
      }
      
      if (!localCartId || localCartId === userCartId) {
        console.log('✅ Carrito ya sincronizado');
        localStorage.setItem('bbfermentos_cart_id', userCartId);
        localStorage.setItem('bbfermentos_cart_timestamp', Date.now().toString());
        return;
      }
      
      console.log('🔄 Migrando productos...');
      
      try {
        const localCartResponse = await fetch(`/api/carts/${localCartId}`);
        
        if (localCartResponse.ok) {
          const localCartData = await localCartResponse.json();
          const localProducts = localCartData.cart.products || [];
          
          console.log(`📦 Productos en carrito local: ${localProducts.length}`);
          
          if (localProducts.length > 0) {
            const token = localStorage.getItem('bbfermentos_auth_token');
            
            for (const item of localProducts) {
              const productId = item.product._id || item.product;
              const quantity = item.quantity;
              
              console.log(`➕ Agregando ${quantity}x ${productId}`);
              
              for (let i = 0; i < quantity; i++) {
                await fetch(`/api/carts/${userCartId}/product/${productId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                });
              }
            }
            
            console.log('✅ Productos migrados');
          }
        }
      } catch (migrateError) {
        console.error('❌ Error al migrar productos:', migrateError);
      }
      
      localStorage.setItem('bbfermentos_cart_id', userCartId);
      localStorage.setItem('bbfermentos_cart_timestamp', Date.now().toString());
      
      console.log('✅ Sincronización completada');
      
    } catch (error) {
      console.error('❌ Error en sincronización de carrito:', error);
    }
  },
  
  async register(userData) {
    UI.clearAllErrors();
    UI.setButtonLoading('registerBtn', true);
    
    try {
      if (!Validators.email(userData.email)) {
        UI.showFieldError('email', 'Email inválido');
        return;
      }
      
      if (userData.password.length < 6) {
        UI.showFieldError('password', 'Mínimo 6 caracteres');
        return;
      }
      
      const confirmPassword = document.getElementById('confirmPassword')?.value;
      if (confirmPassword && userData.password !== confirmPassword) {
        UI.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        UI.showAlert('Las contraseñas no coinciden', 'error');
        return;
      }
      
      const { response, data } = await API.post(AUTH.ENDPOINTS.REGISTER, userData);
      
      if (response.ok && data.status === 'success') {
        UI.showAlert('¡Cuenta creada!', 'success');
        setTimeout(() => this.login(userData.email, userData.password), 1500);
      } else {
        UI.showAlert(data.message || 'Error al registrar', 'error');
      }
    } catch (error) {
      UI.showAlert('Error de conexión', 'error');
    } finally {
      UI.setButtonLoading('registerBtn', false);
    }
  },
  
  logout() {
    Storage.clear();
    localStorage.removeItem('bbfermentos_cart_id');
    localStorage.removeItem('bbfermentos_cart_timestamp');
    UI.showAlert('Sesión cerrada', 'info');
    setTimeout(() => window.location.href = '/login', 1000);
  },
  
  updateUI() {
    const user = Storage.getUser();
    const isAuth = Storage.isAuthenticated();
    
    document.querySelectorAll('.auth-link').forEach(link => {
      const authRequired = link.dataset.authRequired === 'true';
      const roleRequired = link.dataset.roleRequired;
      
      if (authRequired) {
        if (isAuth && (!roleRequired || user?.role === roleRequired)) {
          link.style.display = 'inline';
          if (user && link.textContent.includes('Usuario')) {
            link.textContent = `👤 ${user.first_name}`;
          }
        } else {
          link.style.display = 'none';
        }
      } else {
        link.style.display = isAuth ? 'none' : 'inline';
      }
    });
  }
};

// ==========================================
// FUNCIONES DE INICIALIZACIÓN
// ==========================================

function initializeLoginForm() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await Auth.login(formData.get('email'), formData.get('password'));
    });
  }
}

function initializeRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  
  if (registerForm) {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    function validatePasswordMatch() {
      if (confirmPasswordField.value && passwordField.value !== confirmPasswordField.value) {
        UI.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        return false;
      } else {
        UI.clearFieldError('confirmPassword');
        return true;
      }
    }
    
    if (confirmPasswordField) {
      confirmPasswordField.addEventListener('input', validatePasswordMatch);
      passwordField?.addEventListener('input', () => {
        if (confirmPasswordField.value) validatePasswordMatch();
      });
    }
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validatePasswordMatch()) {
        return;
      }
      
      const formData = new FormData(e.target);
      await Auth.register({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
        password: formData.get('password')
      });
    });
  }
}

async function verifyCartOwnership() {
  const token = Storage.getToken();
  const user = Storage.getUser();
  const localCartId = localStorage.getItem('bbfermentos_cart_id');
  
  if (!token || !user || !localCartId) return;
  
  let userCartId = null;
  if (user.cart) {
    if (typeof user.cart === 'object' && user.cart._id) {
      userCartId = user.cart._id.toString();
    } else {
      userCartId = user.cart.toString();
    }
  }
  
  if (userCartId && localCartId !== userCartId) {
    console.log('⚠️ Carrito desincronizado');
    localStorage.setItem('bbfermentos_cart_id', userCartId);
    
    if (window.location.pathname.includes('/carts/')) {
      window.location.href = `/carts/${userCartId}`;
    }
  }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initializeLoginForm();
  initializeRegisterForm();
  Auth.updateUI();
  verifyCartOwnership();
  
  const token = Storage.getToken();
  if (token) {
    document.cookie = `bbfermentos_auth_token=${token}; path=/; max-age=86400`;
  }
});

// ==========================================
// API PÚBLICA
// ==========================================

window.BBAuth = {
  login: Auth.login.bind(Auth),
  register: Auth.register.bind(Auth),
  logout: Auth.logout.bind(Auth),
  isAuthenticated: Storage.isAuthenticated.bind(Storage),
  getUser: Storage.getUser.bind(Storage),
  showAlert: UI.showAlert
};
// Funciones para interactuar con la API PHP
class UTPAPI {
    
    // Método para hacer peticiones HTTP
    static async makeRequest(endpoint, method = 'GET', data = null, requireAuth = false) {
        const url = `${API_BASE_URL}/${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Agregar token si se requiere autenticación
        if (requireAuth) {
            const token = localStorage.getItem('utptoken');
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Agregar datos si es POST o PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error en la petición');
            }
            
            return result;
        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }

    // Registro de usuario
    static async register(userData) {
        return await this.makeRequest('register', 'POST', userData);
    }

    // Login de usuario
    static async login(credentials) {
        const result = await this.makeRequest('login', 'POST', credentials);
        
        // Guardar token en localStorage
        if (result.token) {
            localStorage.setItem('utptoken', result.token);
            localStorage.setItem('usuario_id', result.usuario_id);
        }
        
        return result;
    }

    // Obtener perfil del usuario
    static async getPerfil() {
        return await this.makeRequest('perfil', 'GET', null, true);
    }

    // Guardar compra en el historial
    static async guardarCompra(compraData) {
        return await this.makeRequest('guardar-compra', 'POST', compraData, true);
    }

    // Obtener historial de compras
    static async getHistorial() {
        return await this.makeRequest('historial', 'GET', null, true);
    }

    // Logout
    static logout() {
        localStorage.removeItem('utptoken');
        localStorage.removeItem('usuario_id');
        window.location.href = 'login.html';
    }

    // Verificar si el usuario está logueado
    static isLoggedIn() {
        return localStorage.getItem('utptoken') !== null;
    }

    // Obtener ID del usuario actual
    static getCurrentUserId() {
        return localStorage.getItem('usuario_id');
    }

    // Test de conectividad con la API
    static async testConnection() {
        try {
            const result = await this.makeRequest('test-connection.php');
            console.log('Conexión con API PHP exitosa:', result);
            return true;
        } catch (error) {
            console.error('Error conectando con API PHP:', error);
            return false;
        }
    }
}

// Función para mostrar mensajes de error
function showError(message) {
    alert('Error: ' + message);
}

// Función para mostrar mensajes de éxito
function showSuccess(message) {
    alert('Éxito: ' + message);
}

// Ejemplo de uso para formulario de registro
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        contraseña: formData.get('contraseña'),
        telefono: formData.get('telefono'),
        fecha_nacimiento: formData.get('fecha_nacimiento'),
        genero: formData.get('genero'),
        direccion_principal: formData.get('direccion_principal')|| '',
        pais: formData.get('pais') || ''
    };

    try {
        const result = await UTPAPI.register(userData);
        showSuccess(result.message);
        // Redirigir al login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        showError(error.message);
    }
}

// Ejemplo de uso para formulario de login
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        email: formData.get('email'),
        contraseña: formData.get('contraseña')
    };

    try {
        const result = await UTPAPI.login(credentials);
        showSuccess(result.message);
        // Redirigir al dashboard o página principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showError(error.message);
    }
}

// Verificar conexión al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    UTPAPI.testConnection();
});

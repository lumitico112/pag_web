// Sistema de login con manejo de sesiones y roles
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Verificar si ya hay una sesión activa
    checkActiveSession();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Limpiar mensajes de error previos
        clearErrorMessages();
        
        try {
            const response = await fetch('/pag_web/backend_php/api/users.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();

            // Validar respuesta de login
            if (response.ok && result.token && result.usuario_id) {
                // Guardar datos de sesión en localStorage
                const sessionData = {
                    token: result.token,
                    usuario_id: result.usuario_id,
                    email: result.email || email,
                    role: result.role || 'usuario',
                    nombre: result.nombre || '',
                    dni: result.dni || '',
                    telefono: result.telefono || '',
                    login_time: new Date().getTime()
                };
                localStorage.setItem('utptravel_session', JSON.stringify(sessionData));
                // Actualizar datos en AuthSystem
                if (window.auth && typeof window.auth.setUserData === 'function') {
                    window.auth.setUserData({
                        usuario_id: result.usuario_id,
                        nombre: result.nombre || '',
                        dni: result.dni || '',
                        email: result.email || email,
                        telefono: result.telefono || '',
                        role: result.role || 'usuario'
                    });
                }
                showSuccessMessage('Login exitoso. Redirigiendo...');
                setTimeout(() => {
                    redirectByRole(sessionData.role);
                }, 1500);
            } else {
                // Mostrar error específico si existe, si no, mensaje genérico
                if (result.error) {
                    if (result.error.includes('no encontrado')) {
                        showErrorMessage('emailLoginError', 'Usuario no encontrado');
                    } else if (result.error.toLowerCase().includes('credenciales')) {
                        showErrorMessage('passwordLoginError', 'Contraseña incorrecta');
                    } else if (result.error.toLowerCase().includes('desactivada')) {
                        showErrorMessage('emailLoginError', 'Cuenta desactivada, contacte al administrador');
                    } else {
                        showErrorMessage('emailLoginError', result.error);
                    }
                } else {
                    showErrorMessage('emailLoginError', 'Credenciales incorrectas');
                }
            }
        } catch (error) {
            console.error('Error en login:', error);
            showErrorMessage('emailLoginError', 'Error de conexión con el servidor');
        }
    });
    
    function clearErrorMessages() {
        document.getElementById('emailLoginError').textContent = '';
        document.getElementById('passwordLoginError').textContent = '';
    }
    
    function showErrorMessage(elementId, message) {
        document.getElementById(elementId).textContent = message;
        document.getElementById(elementId).style.color = 'red';
    }
    
    function showSuccessMessage(message) {
        // Crear elemento de mensaje de éxito si no existe
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.className = 'alert alert-success mt-3';
            loginForm.appendChild(successDiv);
        }
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
    
    function redirectByRole(role) {
        switch(role) {
            case 'admin':
                window.location.href = 'dashboard.html';
                break;
            case 'trabajador':
                window.location.href = 'dashboard.html';
                break;
            case 'usuario':
            default:
                window.location.href = 'index.html';
                break;
        }
    }
    
    function checkActiveSession() {
        const session = getActiveSession();
        if (session) {
            // Si ya hay una sesión activa, redirigir
            redirectByRole(session.role);
        }
    }
});

// Función global para obtener sesión activa
function getActiveSession() {
    const sessionData = localStorage.getItem('utptravel_session');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        // Verificar si la sesión no ha expirado (24 horas)
        const currentTime = new Date().getTime();
        const sessionAge = currentTime - session.login_time;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (sessionAge < maxAge) {
            return session;
        } else {
            // Sesión expirada
            localStorage.removeItem('utptravel_session');
        }
    }
    return null;
}

// Función global para cerrar sesión
function logout() {
    localStorage.removeItem('utptravel_session');
    window.location.href = 'login.html';
}

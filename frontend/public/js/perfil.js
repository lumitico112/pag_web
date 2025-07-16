// JavaScript para la página de perfil
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    await cargarPerfil();
});

async function cargarPerfil() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('perfilContent');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        // Mostrar datos básicos de la sesión primero
        const userData = auth.getUserData();
        document.getElementById('emailUsuario').textContent = userData.email;
        document.getElementById('rolUsuario').textContent = userData.role || userData.rol;
        
        // Cargar datos completos del perfil desde el servidor
        const response = await auth.authenticatedFetch(`${API_BASE_URL}/users.php?action=perfil`);
        const data = await response.json();
        console.log('Respuesta de perfil:', data); // <-- Línea de depuración
        
        if (data.success && data.perfil) {
            const perfil = data.perfil;
            // Llenar los campos con los datos del perfil
            document.getElementById('nombreUsuario').textContent = perfil.nombre || 'No especificado';
            document.getElementById('telefonoUsuario').textContent = perfil.telefono || 'No especificado';
            document.getElementById('fechaNacimiento').textContent = perfil.fecha_nacimiento || 'No especificada';
            document.getElementById('generoUsuario').textContent = perfil.genero || 'No especificado';
            document.getElementById('paisUsuario').textContent = perfil.pais || 'No especificado';
            document.getElementById('direccionUsuario').textContent = perfil.direccion_principal || 'No especificada';
        } else {
            throw new Error('Error al cargar el perfil');
        }
        
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Error al cargar los datos del perfil';
        errorMessage.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        content.style.display = 'block';
    }
}

function editarPerfil() {
    // Por ahora, mostrar un alert. Más tarde se puede implementar un modal o página de edición
    alert('Función de editar perfil en desarrollo');
}

// Cuando se implemente la edición de perfil, tras guardar:
// if (window.auth && typeof auth.setUserData === 'function') {
//     auth.setUserData({
//         usuario_id: perfil.id,
//         nombre: perfil.nombre,
//         dni: perfil.dni,
//         email: perfil.email,
//         telefono: perfil.telefono,
//         role: perfil.role || perfil.rol
//     });
// }

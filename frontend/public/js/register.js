// Validación de registro

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.form');
  const mensajeExito = document.getElementById('mensaje-exito');
  const mensajeError = document.getElementById('mensaje-error');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    mensajeExito.classList.add('d-none');
    mensajeError.classList.add('d-none');

    // Validar contraseñas
    const password = document.getElementById('password').value;
    const passwordRepeat = document.getElementById('password-repeat').value;
    if (password !== passwordRepeat) {
      mensajeError.textContent = 'Las contraseñas no coinciden.';
      mensajeError.classList.remove('d-none');
      return;
    }

    // Obtener datos del formulario
    const data = {
      // username eliminado
      nombre: document.getElementById('nombre').value,
      dni: document.getElementById('dni').value,
      email: document.getElementById('email').value,
      password: password, // Usar el nombre estándar
      telefono: document.getElementById('telefono').value,
      fecha_nacimiento: document.getElementById('fecha-nacimiento').value,
      genero: document.querySelector('input[name="genero"]:checked')?.value || '',
      direccion_principal: document.querySelector('input[name="direccion_principal"]').value,
      pais: document.getElementById('pais').value
    };

    // Validar DNI
    if (!/^\d{8}$/.test(data.dni)) {
      mensajeError.textContent = 'El DNI debe tener exactamente 8 dígitos.';
      mensajeError.classList.remove('d-none');
      return;
    }

    // Validar teléfono
    if (!/^\d{9}$/.test(data.telefono)) {
      mensajeError.textContent = 'El teléfono debe tener exactamente 9 dígitos.';
      mensajeError.classList.remove('d-none');
      return;
    }

    // Validar que todos los campos estén llenos
    for (const [key, value] of Object.entries(data)) {
      if (!value || value.trim() === '') {
        mensajeError.textContent = `El campo ${key.replace('_', ' ')} es requerido.`;
        mensajeError.classList.remove('d-none');
        return;
      }
    }

    // Validación adicional para campos numéricos
    console.log('Datos a enviar:', data);

    try {
      const response = await fetch('/pag_web/backend_php/api/users.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (response.ok) {
        // Guardar datos en AuthSystem y localStorage
        if (window.auth && typeof window.auth.setUserData === 'function') {
          window.auth.setUserData({
            usuario_id: result.usuario_id || result.id,
            nombre: data.nombre,
            dni: data.dni,
            email: data.email,
            telefono: data.telefono,
            role: result.role || 'usuario'
          });
        }
        mensajeExito.textContent = 'Registro exitoso. Redirigiendo al login...';
        mensajeExito.classList.remove('d-none');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      } else {
        mensajeError.textContent = result.error || 'Error en el registro.';
        mensajeError.classList.remove('d-none');
      }
    } catch (err) {
      mensajeError.textContent = 'Error de conexión con el servidor.';
      mensajeError.classList.remove('d-none');
    }
  });

  // Validación en tiempo real para campos numéricos
  const dniInput = document.getElementById('dni');
  const telefonoInput = document.getElementById('telefono');

  // Solo permitir números en DNI
  dniInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value.length > 8) {
      e.target.value = e.target.value.slice(0, 8);
    }
  });

  // Solo permitir números en teléfono
  telefonoInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value.length > 9) {
      e.target.value = e.target.value.slice(0, 9);
    }
  });
});

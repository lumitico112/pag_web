// Admin Usuarios - Gestión de usuarios para administradores

class AdminUsuarios {
  constructor() {
    this.usuarios = [];
    this.usuarioEditando = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab change events
    const userTabs = document.querySelectorAll('#userTabs button[data-bs-toggle="tab"]');
    userTabs.forEach(tab => {
      tab.addEventListener('shown.bs.tab', (event) => {
        const targetRole = event.target.id.replace('-tab', '');
        this.filterUsuariosByRole(targetRole);
      });
    });

    // Form submission for editing users
    const formEditarUsuario = document.getElementById('formEditarUsuario');
    if (formEditarUsuario) {
      formEditarUsuario.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarCambiosUsuario();
      });
    }
  }

  async cargarUsuarios() {
    try {
      const response = await fetch(`${API_BASE_URL}/users.php`);
      const data = await response.json();
      console.log('[ADMIN-USUARIOS] Respuesta de API:', data); // LOG
      
      if (data.success) {
        // Normalizar roles: si viene 'role', asignar a 'rol'
        this.usuarios = data.usuarios.map(u => ({ ...u, rol: u.rol || u.role }));
        console.log('[ADMIN-USUARIOS] Usuarios cargados:', this.usuarios); // LOG
        this.actualizarContadores();
        this.renderUsuariosByRole('admin'); // Start with admin tab
      } else {
        this.showAlert('Error al cargar usuarios', 'danger');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.showAlert('Error de conexión al cargar usuarios', 'danger');
    }
  }

  actualizarContadores() {
    const contadores = {
      admin: 0,
      trabajador: 0,
      usuario: 0
    };

    this.usuarios.forEach(usuario => {
      if (contadores.hasOwnProperty(usuario.rol)) {
        contadores[usuario.rol]++;
      }
    });

    // Update badges
    document.getElementById('count-admin').textContent = contadores.admin;
    document.getElementById('count-trabajador').textContent = contadores.trabajador;
    document.getElementById('count-usuario').textContent = contadores.usuario;
  }

  filterUsuariosByRole(role) {
    const usuariosFiltrados = this.usuarios.filter(usuario => usuario.rol === role);
    this.renderUsuarios(usuariosFiltrados, role);
  }

  renderUsuarios(usuarios, role) {
    const tbody = document.getElementById(`tabla-${role}`);
    if (!tbody) return;

    if (usuarios.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <i class="fas fa-users fa-2x text-muted mb-2"></i>
            <p class="text-muted">No hay ${this.getRoleDisplayName(role)} registrados</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = usuarios.map(usuario => `
      <tr>
        <td>${usuario.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <div class="user-avatar me-2">
              <i class="fas fa-user-circle fa-2x text-muted"></i>
            </div>
            <div>
              <strong>${usuario.nombre}</strong>
              ${usuario.apellido ? `<br><small class="text-muted">${usuario.apellido}</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="text-primary">${usuario.email}</span>
          ${usuario.telefono ? `<br><small class="text-muted">${usuario.telefono}</small>` : ''}
        </td>
        <td>
          <span class="text-muted">${this.formatDate(usuario.created_at)}</span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="adminUsuarios.editarUsuario(${usuario.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-info" onclick="adminUsuarios.verDetalleUsuario(${usuario.id})" title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="adminUsuarios.eliminarUsuario(${usuario.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  getRoleDisplayName(role) {
    const roleNames = {
      admin: 'administradores',
      trabajador: 'trabajadores',
      usuario: 'usuarios'
    };
    return roleNames[role] || 'usuarios';
  }

  editarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id == id);
    if (!usuario) {
      this.showAlert('Usuario no encontrado', 'warning');
      return;
    }

    // Cargar datos en el modal
    document.getElementById('edit-user-id').value = usuario.id;
    document.getElementById('edit-user-name').value = usuario.nombre;
    document.getElementById('edit-user-email').value = usuario.email;
    document.getElementById('edit-user-rol').value = usuario.rol;

    this.usuarioEditando = usuario;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();
  }

  async guardarCambiosUsuario() {
    const id = document.getElementById('edit-user-id').value;
    const nombre = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const rol = document.getElementById('edit-user-rol').value;

    // Validaciones
    if (!nombre || !email) {
      this.showAlert('Nombre y email son obligatorios', 'warning');
      return;
    }

    if (!this.validarEmail(email)) {
      this.showAlert('Por favor ingresa un email válido', 'warning');
      return;
    }

    const datosActualizados = {
      id: id,
      nombre: nombre,
      email: email,
      rol: rol
    };

    try {
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados)
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert('Usuario actualizado exitosamente', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario'));
        modal.hide();
        
        // Recargar usuarios
        this.cargarUsuarios();
      } else {
        this.showAlert(result.error || 'Error al actualizar usuario', 'danger');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      this.showAlert('Error de conexión al actualizar usuario', 'danger');
    }
  }

  validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async eliminarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id == id);
    if (!usuario) {
      this.showAlert('Usuario no encontrado', 'warning');
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users.php?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert('Usuario eliminado exitosamente', 'success');
        this.cargarUsuarios();
      } else {
        this.showAlert(result.error || 'Error al eliminar usuario', 'danger');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showAlert('Error de conexión al eliminar usuario', 'danger');
    }
  }

  verDetalleUsuario(id) {
    const usuario = this.usuarios.find(u => u.id == id);
    if (!usuario) {
      this.showAlert('Usuario no encontrado', 'warning');
      return;
    }

    // Create detail modal content
    const detalleHtml = `
      <div class="user-detail">
        <div class="row">
          <div class="col-md-4 text-center">
            <i class="fas fa-user-circle fa-5x text-muted mb-3"></i>
            <h5>${usuario.nombre}</h5>
            <span class="badge bg-${this.getRoleBadgeClass(usuario.rol)} fs-6">
              ${this.getRoleDisplayName(usuario.rol).charAt(0).toUpperCase() + this.getRoleDisplayName(usuario.rol).slice(1)}
            </span>
          </div>
          <div class="col-md-8">
            <table class="table table-borderless">
              <tr>
                <td><strong>ID:</strong></td>
                <td>${usuario.id}</td>
              </tr>
              <tr>
                <td><strong>Nombre:</strong></td>
                <td>${usuario.nombre}</td>
              </tr>
              ${usuario.apellido ? `
              <tr>
                <td><strong>Apellido:</strong></td>
                <td>${usuario.apellido}</td>
              </tr>` : ''}
              <tr>
                <td><strong>Email:</strong></td>
                <td>${usuario.email}</td>
              </tr>
              ${usuario.telefono ? `
              <tr>
                <td><strong>Teléfono:</strong></td>
                <td>${usuario.telefono}</td>
              </tr>` : ''}
              <tr>
                <td><strong>Rol:</strong></td>
                <td><span class="badge bg-${this.getRoleBadgeClass(usuario.role)}">${usuario.role}</span></td>
              </tr>
              <tr>
                <td><strong>Estado:</strong></td>
                <td><span class="badge bg-${usuario.is_active ? 'success' : 'secondary'}">${usuario.is_active ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
              <tr>
                <td><strong>Fecha de Registro:</strong></td>
                <td>${usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : 'No disponible'}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    // Show in a modal or alert
    this.showDetailModal('Detalle del Usuario', detalleHtml);
  }

  getRoleBadgeClass(rol) {
    const roleClasses = {
      admin: 'danger',
      trabajador: 'warning',
      usuario: 'success'
    };
    return roleClasses[rol] || 'secondary';
  }

  showDetailModal(title, content) {
    // Create a temporary modal for user details
    const modalHtml = `
      <div class="modal fade" id="modalDetalleUsuario" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="fas fa-user"></i> ${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              ${content}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('modalDetalleUsuario');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleUsuario'));
    modal.show();

    // Remove modal from DOM when hidden
    modal._element.addEventListener('hidden.bs.modal', () => {
      modal._element.remove();
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showAlert(message, type = 'info') {
    if (window.adminDashboard) {
      window.adminDashboard.showAlert(message, type);
    } else {
      alert(message);
    }
  }

  // Public method to load users by role (called from main dashboard)
  renderUsuariosByRole(role) {
    this.filterUsuariosByRole(role);
  }
}

// Crear instancia global
document.addEventListener('DOMContentLoaded', function() {
  window.AdminUsuarios = new AdminUsuarios();
  window.adminUsuarios = window.AdminUsuarios; // For backward compatibility
  // Forzar carga de usuarios al cargar la página
  window.AdminUsuarios.cargarUsuarios();
});

// Corregir compatibilidad de roles en los datos recibidos
document.addEventListener('DOMContentLoaded', function() {
  const originalCargarUsuarios = window.AdminUsuarios.cargarUsuarios.bind(window.AdminUsuarios);
  window.AdminUsuarios.cargarUsuarios = async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/users.php`);
      const data = await response.json();
      console.log('[ADMIN-USUARIOS] Respuesta de API:', data); // LOG
      if (data.success) {
        // Normalizar roles: si viene 'role', asignar a 'rol'
        this.usuarios = data.usuarios.map(u => ({ ...u, rol: u.rol || u.role }));
        console.log('[ADMIN-USUARIOS] Usuarios cargados:', this.usuarios); // LOG
        this.actualizarContadores();
        this.renderUsuariosByRole('admin'); // Start with admin tab
      } else {
        this.showAlert('Error al cargar usuarios', 'danger');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.showAlert('Error de conexión al cargar usuarios', 'danger');
    }
  };
});

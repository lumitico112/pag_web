-- UTP Travel - Estructura de Base de Datos (versión alineada)
-- Fecha: 2025-07-05

CREATE DATABASE IF NOT EXISTS utp_buzz CHARACTER SET utf8mb4 COLLATE=utf8mb4_unicode_ci;
USE utp_buzz;

-- ============================================
-- TABLA: usuarios_login
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios_login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'usuario', 'trabajador') DEFAULT 'usuario',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_login_id INT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    genero ENUM('hombre', 'mujer', 'otro') DEFAULT 'otro',
    pais VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_login_id) REFERENCES usuarios_login(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: rutas
-- ============================================
CREATE TABLE IF NOT EXISTS rutas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    origen_region VARCHAR(100),
    origen_provincia VARCHAR(100),
    origen_distrito VARCHAR(100),
    destino_region VARCHAR(100),
    destino_provincia VARCHAR(100),
    destino_distrito VARCHAR(100),
    fecha_salida DATE NOT NULL,
    hora_salida TIME,
    fecha_llegada DATE,
    hora_llegada TIME,
    precio DECIMAL(10,2) NOT NULL,
    capacidad_pasajeros INT DEFAULT 40,
    asientos_disponibles INT DEFAULT 40,
    duracion VARCHAR(50),
    distancia_km DECIMAL(8,2),
    descripcion TEXT,
    imagen VARCHAR(255),
    estado ENUM('activo', 'inactivo', 'mantenimiento', 'concluido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: rutas_concluidas
-- ============================================
CREATE TABLE IF NOT EXISTS rutas_concluidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ruta_id_original INT NOT NULL,
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    duracion VARCHAR(50),
    imagen VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'concluida',
    origen_region VARCHAR(100),
    origen_provincia VARCHAR(100),
    origen_distrito VARCHAR(100),
    origen_ciudad VARCHAR(100),
    destino_region VARCHAR(100),
    destino_provincia VARCHAR(100),
    destino_distrito VARCHAR(100),
    destino_ciudad VARCHAR(100),
    distancia_km DECIMAL(10,2),
    capacidad_pasajeros INT DEFAULT 40,
    fecha_salida DATETIME,
    hora_salida TIME,
    fecha_llegada DATETIME,
    hora_llegada TIME,
    total_pasajeros_transportados INT DEFAULT 0,
    ingresos_generados DECIMAL(12,2) DEFAULT 0,
    fecha_conclusion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha_salida (fecha_salida),
    INDEX idx_origen_destino (origen, destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: reservas
-- ============================================
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva VARCHAR(50) UNIQUE NOT NULL,
    ruta_id INT NOT NULL,
    usuario_id INT,
    nombres_pasajero VARCHAR(100) NOT NULL,
    apellidos_pasajero VARCHAR(100) NOT NULL,
    pasajero_nombre VARCHAR(200),
    cantidad_pasajeros INT DEFAULT 1,
    dni_pasajero VARCHAR(20) NOT NULL,
    telefono_pasajero VARCHAR(20),
    email_pasajero VARCHAR(100),
    asientos_reservados INT DEFAULT 1,
    numero_asientos JSON,
    precio_total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'yape', 'plin') DEFAULT 'efectivo',
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    estado_reserva ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_viaje DATE,
    notas TEXT,
    FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: historial
-- ============================================
CREATE TABLE IF NOT EXISTS historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_tabla_afectada (tabla_afectada),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: historialGeneral
-- ============================================
CREATE TABLE IF NOT EXISTS historialGeneral (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo_evento ENUM('login', 'logout', 'registro', 'reserva', 'cancelacion', 'pago', 'error', 'sistema') NOT NULL,
    evento VARCHAR(100) NOT NULL,
    descripcion TEXT,
    modulo VARCHAR(50),
    url_origen VARCHAR(255),
    metodo_http ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'GET',
    codigo_respuesta INT,
    datos_evento JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    nivel_severidad ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo_evento (tipo_evento),
    INDEX idx_nivel_severidad (nivel_severidad),
    INDEX idx_created_at (created_at),
    INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================
CREATE INDEX idx_usuarios_login_email ON usuarios_login(email);
CREATE INDEX idx_usuarios_login_username ON usuarios_login(username);
CREATE INDEX idx_usuarios_login_role ON usuarios_login(role);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);
CREATE INDEX idx_usuarios_login_id ON usuarios(user_login_id);
CREATE INDEX idx_rutas_origen ON rutas(origen);
CREATE INDEX idx_rutas_destino ON rutas(destino);
CREATE INDEX idx_rutas_fecha_salida ON rutas(fecha_salida);
CREATE INDEX idx_rutas_estado ON rutas(estado);
CREATE INDEX idx_rutas_precio ON rutas(precio);
CREATE INDEX idx_reservas_codigo ON reservas(codigo_reserva);
CREATE INDEX idx_reservas_ruta_id ON reservas(ruta_id);
CREATE INDEX idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX idx_reservas_dni ON reservas(dni_pasajero);
CREATE INDEX idx_reservas_estado ON reservas(estado_reserva);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_reserva);

-- ============================================
-- USUARIO ADMINISTRADOR INICIAL
-- ============================================
INSERT INTO usuarios_login (username, email, password, role) VALUES 
('admin', 'admin@utptravel.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO usuarios (user_login_id, nombres, apellidos, dni, telefono, genero) VALUES 
(1, 'Administrador', 'Sistema', '12345678', '999999999', 'otro')
ON DUPLICATE KEY UPDATE nombres = nombres;

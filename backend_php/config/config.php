<?php
// Configuración de errores (solo para desarrollo)
// Para producción, deshabilitar display_errors
error_reporting(E_ALL);
ini_set('display_errors', 0); // Cambiado a 0 para evitar mostrar errores en JSON
ini_set('log_errors', 1); // Habilitar logging de errores

// Configuración de zona horaria
date_default_timezone_set('America/Lima');


// Cargar variables de entorno desde .env
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = array_map('trim', explode('=', $line, 2));
        if (!array_key_exists($name, $_ENV)) {
            $_ENV[$name] = $value;
        }
    }
}


// Ruta absoluta al archivo .env
loadEnv(__DIR__ . '/../../.env');

// Definir constantes de base de datos usando variables de entorno
define('DB_HOST', isset($_ENV['DB_HOST']) ? $_ENV['DB_HOST'] : 'localhost');
define('DB_NAME', isset($_ENV['DB_NAME']) ? $_ENV['DB_NAME'] : '');
define('DB_USER', isset($_ENV['DB_USER']) ? $_ENV['DB_USER'] : '');
define('DB_PASS', isset($_ENV['DB_PASSWORD']) ? $_ENV['DB_PASSWORD'] : '');

// Configuración CORS
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=UTF-8');
}

// Función para manejar errores
function handleError($message, $code = 500) {
    http_response_code($code);
    echo json_encode(array("error" => $message));
    exit();
}

// Función para validar token básico
function validateToken($token) {
    if (empty($token)) {
        return false;
    }
    
    $decoded = base64_decode(str_replace('Bearer ', '', $token));
    $parts = explode(':', $decoded);
    
    if (count($parts) != 2) {
        return false;
    }
    
    $user_id = $parts[0];
    $timestamp = $parts[1];
    
    // Validar que el token no sea muy antiguo (24 horas)
    if ((time() - $timestamp) > 86400) {
        return false;
    }
    
    return $user_id;
}
?>

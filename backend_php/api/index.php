<?php
require_once '../config/config.php';

// Manejar CORS
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Archivo principal de la API
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remover el path base y obtener solo la ruta de la API
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/backend_php/api/', '', $path);

// Enrutamiento principal
switch ($path) {
    case 'register':
    case 'login':
    case 'perfil':
        require_once 'users.php';
        break;
        
    case 'guardar-compra':
    case 'historial':
        require_once 'historial.php';
        break;
        
    case 'test':
        // Endpoint de prueba
        echo json_encode(array(
            "message" => "API PHP funcionando correctamente",
            "timestamp" => date('Y-m-d H:i:s'),
            "method" => $method
        ));
        break;
        
    default:
        http_response_code(404);
        echo json_encode(array("error" => "Endpoint no encontrado: " . $path));
        break;
}
?>

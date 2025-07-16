<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

// Ya no se usan listas ni mapeos de imágenes, todo se resuelve por el destino

switch ($method) {
    case 'GET':
        if (isset($_GET['ruta'])) {
            // Obtener solo la ciudad destino y devolver [destino].jpg normalizado
            $ruta = $_GET['ruta'];
            $partes = explode('-', $ruta);
            $destino = isset($partes[1]) ? $partes[1] : $partes[0];
            $nombreImagen = normalizarNombreCiudad($destino) . '.jpg';
            $rutaImagen = '../img/rutas/' . $nombreImagen;
            // Verificar si existe la imagen, si no, usar default.jpg
            if (!file_exists(__DIR__ . '/../img/rutas/' . $nombreImagen)) {
                $nombreImagen = 'default.jpg';
                $rutaImagen = '../img/rutas/default.jpg';
            }
            echo json_encode([
                'ruta' => $ruta,
                'imagen' => $nombreImagen,
                'url' => $rutaImagen
            ]);
        } elseif (isset($_GET['all'])) {
            // Devolver vacío o advertencia, ya que no hay lista de imágenes disponibles
            echo json_encode([]);
        } else {
            // Devolver vacío o advertencia, ya que no hay mapeo de rutas a imágenes
            echo json_encode([]);
        }
        break;
        
    case 'POST':
        // Sugerir imagen para una nueva ruta
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['origen']) || !isset($data['destino'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Origen y destino requeridos']);
            break;
        }
        $destino = $data['destino'];
        $nombreImagen = normalizarNombreCiudad($destino) . '.jpg';
        $rutaImagen = '../img/rutas/' . $nombreImagen;
        if (!file_exists(__DIR__ . '/../img/rutas/' . $nombreImagen)) {
            $nombreImagen = 'default.jpg';
            $rutaImagen = '../img/rutas/default.jpg';
        }
        echo json_encode([
            'ruta' => $data['origen'] . '-' . $data['destino'],
            'imagen_sugerida' => $nombreImagen,
            'url' => $rutaImagen
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

function obtenerImagenPorRuta($ruta, $imagenesRutas) {
    // Buscar coincidencia exacta
    if (isset($imagenesRutas[$ruta])) {
        return $imagenesRutas[$ruta];
    }
    
    // Buscar coincidencia parcial
    foreach ($imagenesRutas as $rutaKey => $imagen) {
        if (strpos($ruta, explode('-', $rutaKey)[0]) !== false || 
            strpos($ruta, explode('-', $rutaKey)[1]) !== false) {
            return $imagen;
        }
    }
    
    // Imagen por defecto
    return 'Lima-Trujillo.jpg';
}

function normalizarNombreCiudad($ciudad) {
    $ciudad = strtolower(trim($ciudad));
    $reemplazos = [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
        'ñ' => 'n', ' ' => '-'
    ];
    return strtr($ciudad, $reemplazos);
}
?>
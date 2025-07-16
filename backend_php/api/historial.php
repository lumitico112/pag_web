<?php
require_once '../config/database.php';

// Manejo de errores básico
function handleFatalError() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        if (!headers_sent() && ob_get_length() === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Error crítico del servidor']);
        }
    }
}
register_shutdown_function('handleFatalError');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Protección para ejecución desde línea de comandos
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('No se pudo conectar a la base de datos');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

// Función para registrar en historial
function registrarHistorial($conn, $usuario_id, $accion, $tabla_afectada, $registro_id, $detalles = null) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        
        $stmt = $conn->prepare('
            INSERT INTO historial_general 
            (usuario_id, accion, tabla_afectada, registro_id, detalles, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $detalles_json = $detalles ? json_encode($detalles) : null;
        $stmt->execute([$usuario_id, $accion, $tabla_afectada, $registro_id, $detalles_json, $ip, $user_agent]);
        
        return true;
    } catch (Exception $e) {
        error_log("Error registrando historial: " . $e->getMessage());
        return false;
    }
}

switch ($method) {
    case 'GET':
        if (isset($_GET['usuario_id'])) {
            // Historial específico de un usuario
            $usuario_id = $_GET['usuario_id'];
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            
            $stmt = $conn->prepare('
                SELECT h.*, ul.email as usuario_email, u.nombre as usuario_nombre
                FROM historial_general h
                LEFT JOIN usuarios_login ul ON h.usuario_id = ul.id
                LEFT JOIN usuarios u ON h.usuario_id = u.usuario_id
                WHERE h.usuario_id = ?
                ORDER BY h.fecha_accion DESC
                LIMIT ?
            ');
            $stmt->execute([$usuario_id, $limit]);
            $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'historial' => $historial]);
            
        } elseif (isset($_GET['general'])) {
            // Historial general (solo para admins)
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
            
            $stmt = $conn->prepare('
                SELECT h.*, ul.email as usuario_email, u.nombre as usuario_nombre, ul.rol
                FROM historial_general h
                LEFT JOIN usuarios_login ul ON h.usuario_id = ul.id
                LEFT JOIN usuarios u ON h.usuario_id = u.usuario_id
                ORDER BY h.fecha_accion DESC
                LIMIT ?
            ');
            $stmt->execute([$limit]);
            $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'historial' => $historial]);
            
        } else {
            // Estadísticas del historial
            $stmt = $conn->query('
                SELECT 
                    COUNT(*) as total_acciones,
                    COUNT(DISTINCT usuario_id) as usuarios_activos,
                    DATE(fecha_accion) as fecha,
                    COUNT(*) as acciones_por_dia
                FROM historial_general 
                WHERE fecha_accion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(fecha_accion)
                ORDER BY fecha DESC
            ');
            $estadisticas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'estadisticas' => $estadisticas]);
        }
        break;
        
    case 'POST':
        // Registrar nueva acción en historial
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['usuario_id']) || !isset($data['accion'])) {
            http_response_code(400);
            echo json_encode(['error' => 'usuario_id y accion son requeridos']);
            break;
        }
        
        $resultado = registrarHistorial(
            $conn,
            $data['usuario_id'],
            $data['accion'],
            $data['tabla_afectada'] ?? null,
            $data['registro_id'] ?? null,
            $data['detalles'] ?? null
        );
        
        if ($resultado) {
            echo json_encode(['success' => true, 'message' => 'Acción registrada en historial']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error registrando en historial']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

// Exportar función para uso en otros archivos
if (!function_exists('registrar_en_historial')) {
    function registrar_en_historial($usuario_id, $accion, $tabla_afectada = null, $registro_id = null, $detalles = null) {
        try {
            $db = new Database();
            $conn = $db->getConnection();
            return registrarHistorial($conn, $usuario_id, $accion, $tabla_afectada, $registro_id, $detalles);
        } catch (Exception $e) {
            error_log("Error en registrar_en_historial: " . $e->getMessage());
            return false;
        }
    }
}
?>

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

// Obtener datos JSON
$input = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Crear instancia del controlador
$historialController = new HistorialController();

// Función para obtener usuario_id del token
function getUserIdFromToken() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!empty($auth_header)) {
        $token = str_replace('Bearer ', '', $auth_header);
        $decoded = base64_decode($token);
        $parts = explode(':', $decoded);
        return $parts[0];
    }
    return null;
}

// Enrutamiento
switch ($method) {
    case 'POST':
        if (strpos($request_uri, '/guardar-compra') !== false) {
            // Verificar autenticación
            $usuario_id = getUserIdFromToken();
            if ($usuario_id) {
                $input['usuario_id'] = $usuario_id;
                $historialController->guardarCompra($input);
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Token requerido"));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("error" => "Endpoint no encontrado"));
        }
        break;
        
    case 'GET':
        if (strpos($request_uri, '/historial') !== false) {
            // Verificar autenticación
            $usuario_id = getUserIdFromToken();
            if ($usuario_id) {
                $historialController->obtenerHistorial($usuario_id);
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Token requerido"));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("error" => "Endpoint no encontrado"));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("error" => "Método no permitido"));
        break;
}
?>

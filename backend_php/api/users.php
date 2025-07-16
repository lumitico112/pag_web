<?php
require_once '../controllers/UserController.php';
require_once '../config/database.php';

// Solución cross-platform para getallheaders
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// Manejo de errores básico - solo para errores realmente fatales
function handleFatalError() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        // Solo para errores realmente fatales, no warnings o notices
        if (!headers_sent() && ob_get_length() === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Error crítico del servidor']);
        }
    }
}
register_shutdown_function('handleFatalError');

// Manejar solicitudes OPTIONS para CORS
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}
if (!isset($_SERVER['REQUEST_URI'])) {
    $_SERVER['REQUEST_URI'] = '/test';
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Obtener datos JSON
$input = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Crear instancia del controlador
try {
    $userController = new UserController();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al inicializar controlador: ' . $e->getMessage()]);
    exit;
}


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

// Agregar columna activo si no existe
try {
    $conn->exec("ALTER TABLE usuarios_login ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE");
    $conn->exec("ALTER TABLE usuarios_login ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
} catch (Exception $e) {
    // Ignorar si las columnas ya existen
}

// Obtener action de varias fuentes para compatibilidad con JSON
$action = null;
if (isset($_REQUEST['action'])) {
    $action = $_REQUEST['action'];
} elseif (isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif (isset($input['action'])) {
    $action = $input['action'];
}
// LOG para depuración de login
file_put_contents(__DIR__ . '/debug_login.log', date('Y-m-d H:i:s') . " | method: $method | action: $action | input: " . json_encode($input) . "\n", FILE_APPEND);

// Enrutamiento básico
switch ($method) {
    case 'GET':
        if (isset($_GET['verify_status'])) {
            // Verificar estado del usuario
            $headers = getallheaders();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            
            if (!empty($auth_header)) {
                $token = str_replace('Bearer ', '', $auth_header);
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                $usuario_id = $parts[0];
                
                try {
                    $stmt = $conn->prepare("
                        SELECT ul.id, ul.email, 
                               CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo, 
                               ul.role, ul.is_active 
                        FROM usuarios_login ul 
                        LEFT JOIN usuarios u ON u.user_login_id = ul.id 
                        WHERE ul.id = ?
                    ");
                    $stmt->execute([$usuario_id]);
                    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$usuario) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Usuario no encontrado']);
                        return;
                    }
                    
                    if (!$usuario['is_active']) {
                        http_response_code(403);
                        echo json_encode(['error' => 'Cuenta desactivada']);
                        return;
                    }
                    
                    echo json_encode(['status' => 'active', 'usuario' => $usuario]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al verificar estado: ' . $e->getMessage()]);
                }
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Token requerido']);
            }
        } elseif (isset($_GET['action']) && $_GET['action'] === 'perfil') {
            // Obtener perfil del usuario autenticado
            $headers = getallheaders();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            if (!empty($auth_header)) {
                $token = str_replace('Bearer ', '', $auth_header);
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                $usuario_id = $parts[0];
                $userController->obtenerPerfil($usuario_id);
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Token requerido"));
            }
        } elseif (isset($_GET['buscar'])) {
            // Buscar usuario por DNI o email
            $busqueda = $_GET['buscar'];
            try {
                $stmt = $conn->prepare('
                    SELECT ul.id, ul.email, ul.role, ul.is_active, ul.created_at,
                           u.user_login_id, u.nombres, u.apellidos, u.dni, u.telefono, u.fecha_nacimiento,
                           u.direccion
                    FROM usuarios_login ul 
                    LEFT JOIN usuarios u ON u.user_login_id = ul.id 
                    WHERE u.dni = ? OR ul.email = ?
                    LIMIT 1
                ');
                $stmt->execute([$busqueda, $busqueda]);
                $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($usuario) {
                    echo json_encode(['success' => true, 'usuario' => $usuario]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al buscar usuario: ' . $e->getMessage()]);
            }
        } else {
            // Obtener lista de usuarios (para admin)
            try {
                $stmt = $conn->prepare("
                    SELECT ul.id, ul.email, 
                           CONCAT(u.nombres, ' ', u.apellidos) as nombre, 
                           ul.role, COALESCE(ul.is_active, 1) as is_active, 
                           ul.created_at 
                    FROM usuarios_login ul 
                    LEFT JOIN usuarios u ON u.user_login_id = ul.id 
                    ORDER BY ul.id DESC
                ");
                $stmt->execute();
                $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'usuarios' => $usuarios]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al obtener usuarios: ' . $e->getMessage()]);
            }
        }
        break;
        
    case 'POST':
        // Obtener action de varias fuentes para compatibilidad con JSON
        $action = null;
        if (isset($_REQUEST['action'])) {
            $action = $_REQUEST['action'];
        } elseif (isset($_GET['action'])) {
            $action = $_GET['action'];
        } elseif (isset($input['action'])) {
            $action = $input['action'];
        }
        // LOG para depuración
        file_put_contents(__DIR__ . '/debug_post.log', date('Y-m-d H:i:s') . " | method: POST | action: " . var_export($action, true) . " | input: " . json_encode($input) . "\n", FILE_APPEND);
        
        if (strpos($request_uri, '/register') !== false || $action === 'register') {
            // Limpiar y validar solo los campos permitidos
            $data = [
                'nombre' => $input['nombre'] ?? '',
                'dni' => $input['dni'] ?? '',
                'email' => $input['email'] ?? '',
                'password' => $input['password'] ?? '', // CAMBIO: ahora toma el campo correcto
                'telefono' => $input['telefono'] ?? '',
                'fecha_nacimiento' => $input['fecha_nacimiento'] ?? '',
                'genero' => $input['genero'] ?? '',
                'direccion_principal' => $input['direccion_principal'] ?? '',
                'pais' => $input['pais'] ?? ''
            ];
            $userController->guardarRegistro($data);
        } elseif (strpos($request_uri, '/login') !== false || $action === 'login') {
            file_put_contents(__DIR__ . '/debug_post.log', date('Y-m-d H:i:s') . " | entra a login\n", FILE_APPEND);
            $userController->login($input);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(array("error" => "Endpoint no encontrado"));
            exit;
        }
        break;
        
    case 'PUT':
        // Actualizar rol de usuario (para admin)
        if (isset($input['id']) && isset($input['rol'])) {
            try {
                $stmt = $conn->prepare('UPDATE usuarios_login SET role = ? WHERE id = ?');
                $result = $stmt->execute([$input['rol'], $input['id']]);
                
                if ($result) {
                    echo json_encode(['message' => 'Rol actualizado correctamente']);
                } else {
                    throw new Exception('Error al actualizar el role');
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar rol: ' . $e->getMessage()]);
            }
        } elseif (isset($input['id']) && isset($input['activo'])) {
            // Activar/desactivar usuario
            try {
                $stmt = $conn->prepare('UPDATE usuarios_login SET is_active = ? WHERE id = ?');
                $result = $stmt->execute([$input['activo'], $input['id']]);
                
                if ($result) {
                    $action = $input['activo'] ? 'activado' : 'desactivado';
                    echo json_encode(['message' => "Usuario $action correctamente"]);
                } else {
                    throw new Exception('Error al actualizar el estado del usuario');
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar estado: ' . $e->getMessage()]);
            }
        } elseif (strpos($request_uri, '/perfil') !== false) {
            // Obtener usuario_id del token o parámetros
            $headers = getallheaders();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            
            if (!empty($auth_header)) {
                $token = str_replace('Bearer ', '', $auth_header);
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                $usuario_id = $parts[0];
                
                $userController->obtenerPerfil($usuario_id);
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Token requerido"));
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID y role son requeridos']);
        }
        break;
        
    case 'DELETE':
        // Eliminar usuario (para admin)
        if (isset($_GET['id'])) {
            try {
                // Verificar si el usuario tiene reservas
                $stmt = $conn->prepare('SELECT COUNT(*) FROM reservas WHERE usuario_id = ?');
                $stmt->execute([$_GET['id']]);
                $reservas = $stmt->fetchColumn();
                
                if ($reservas > 0) {
                    http_response_code(400);
                    echo json_encode(['error' => 'No se puede eliminar un usuario con reservas activas']);
                    break;
                }
                
                $stmt = $conn->prepare('DELETE FROM usuarios_login WHERE id = ?');
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    echo json_encode(['message' => 'Usuario eliminado correctamente']);
                } else {
                    throw new Exception('Error al eliminar el usuario');
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar usuario: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario requerido']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("error" => "Método no permitido"));
        break;
}
?>

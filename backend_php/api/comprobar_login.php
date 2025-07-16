<?php
// Script de comprobación de login para depuración directa
header('Content-Type: text/plain');
require_once __DIR__ . '/../config/database.php';

// Datos fijos para prueba
$email = 'Admin@admin.com';
$password = '12345678';

$password_trim = trim($password);

$database = new Database();
$conn = $database->getConnection();
$stmt = $conn->prepare('SELECT * FROM usuarios_login WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->rowCount() == 0) {
    echo "Usuario no encontrado para email: $email\n";
    exit;
}
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Email: $email\n";
echo "Password ingresado: '$password' (longitud: " . strlen($password) . ")\n";
echo "Password (trim): '$password_trim' (longitud: " . strlen($password_trim) . ")\n";
echo "Hash en BD: {$row['password']}\n";

if (password_verify($password_trim, $row['password'])) {
    echo "\n¡Login exitoso!\n";
} else {
    echo "\nContraseña incorrecta.\n";
}

echo "\nEstado is_active: " . ($row['is_active'] ? 'Activo' : 'Inactivo') . "\n";
echo "Rol: {$row['role']}\n";
?>

<?php
// Script para actualizar el hash de un usuario específico
date_default_timezone_set('America/Lima');
header('Content-Type: text/plain');
require_once __DIR__ . '/../config/database.php';

$email = 'Admin@admin.com';
$password = '12345678';
$new_hash = password_hash($password, PASSWORD_DEFAULT);

$database = new Database();
$conn = $database->getConnection();
$stmt = $conn->prepare('UPDATE usuarios_login SET password = ? WHERE email = ?');
$result = $stmt->execute([$new_hash, $email]);

if ($result) {
    echo "Password reseteado para $email\n";
    echo "Nuevo hash: $new_hash\n";
    echo "Fecha: ".date('Y-m-d H:i:s')."\n";
} else {
    echo "Error al actualizar la contraseña.\n";
}
?>

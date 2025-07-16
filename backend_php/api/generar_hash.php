<?php
// Script para generar un hash de password y mostrarlo
header('Content-Type: text/plain');
$password = '12345678';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Password: $password\n";
echo "Hash generado: $hash\n";
?>

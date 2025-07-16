<?php
// Script para comprobar rutas y archivos en el servidor (versión mejorada)
header('Content-Type: text/plain');

$base = __DIR__;
$paths = [
    $base . '/backend_php/api/users.php',
    $base . '/backend_php/api/upgrade-database.php',
    $base . '/backend_php/config/database.php',
    $base . '/backend_php/controllers/UserController.php',
    $base . '/frontend/public/js/login.js',
    $base . '/frontend/public/view/login.html',
];

foreach ($paths as $path) {
    if (file_exists($path)) {
        echo "EXISTE: $path\n";
    } else {
        echo "NO EXISTE: $path\n";
    }
}

// Comprobar si el archivo users.php es accesible vía web
$webRoot = str_replace($_SERVER['DOCUMENT_ROOT'], '', $base);
$apiUrl = $webRoot . '/backend_php/api/users.php';
$apiUrl = str_replace('\\', '/', $apiUrl); // Para Windows
$apiUrl = preg_replace('#/+#','/', $apiUrl); // Quitar dobles /
$fullUrl = (isset($_SERVER['HTTPS']) ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . $apiUrl;
echo "\nPrueba accediendo a: $fullUrl\n";

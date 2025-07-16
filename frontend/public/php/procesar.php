<?php

list($tipoBus, $precioUnitario) = explode("|", $_POST['tipo']);
$nombres = $_POST['nombre'];
$dnis = $_POST['dni'];
$correos = $_POST['correo'];
$total = count($nombres) * $precioUnitario;
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Boleta de Compra</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
      rel="stylesheet"
    />
  <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    />
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/boleta.css">
</head>
<body class="bg-white">
  <div class="container mt-5">
    <h2>Boletas Generadas</h2>
    <p><strong>Tipo de Bus:</strong> <?= htmlspecialchars($tipoBus) ?></p>
    <p><strong>Precio por pasajero:</strong> S/ <?= number_format($precioUnitario, 2) ?></p>

    <?php for ($i = 0; $i < count($nombres); $i++): ?>
      <div class="card my-3">
        <div class="card-header">Boleta #<?= $i + 1 ?></div>
        <div class="card-body">
          <p><strong>Pasajero:</strong> <?= htmlspecialchars($nombres[$i]) ?></p>
          <p><strong>DNI:</strong> <?= htmlspecialchars($dnis[$i]) ?></p>
          <p><strong>Correo:</strong> <?= htmlspecialchars($correos[$i]) ?></p>
          <p><strong>Monto:</strong> S/ <?= number_format($precioUnitario, 2) ?></p>
        </div>
      </div>
    <?php endfor; ?>

      <?php

$aplicaDescuento = count($nombres) >= 3;
$descuentoPorcentaje = $aplicaDescuento ? 0.10 : 0;
?>

<h3 class="mt-5">Resumen General</h3>

<?php if ($aplicaDescuento): ?>
  <div class="alert alert-success">
    🎉 <strong>¡Descuento aplicado!</strong> Por comprar 3 o más pasajes, se otorgó un <strong>10% de descuento</strong> por pasajero.
  </div>
<?php endif; ?>

<table class="table table-bordered mt-3">
  <thead class="table-light">
    <tr>
      <th>#</th>
      <th>Pasajero</th>
      <th>Destino</th>
      <th>Precio</th>
      <th>Descuento</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    <?php
    $totalFinal = 0;
    for ($i = 0; $i < count($nombres); $i++):
      $descuento = $precioUnitario * $descuentoPorcentaje;
      $precioFinal = $precioUnitario - $descuento;
      $totalFinal += $precioFinal;
    ?>
    <tr>
      <td><?= $i + 1 ?></td>
      <td><?= htmlspecialchars($nombres[$i]) ?></td>
      <td>Lima → Barranca</td>
      <td>S/ <?= number_format($precioUnitario, 2) ?></td>
      <td><?= $aplicaDescuento ? 'S/ ' . number_format($descuento, 2) : '—' ?></td>
      <td><strong>S/ <?= number_format($precioFinal, 2) ?></strong></td>
    </tr>
    <?php endfor; ?>
  </tbody>
  <tfoot class="table-info">
    <tr>
      <td colspan="5" class="text-end"><strong>Total a pagar:</strong></td>
      <td><strong>S/ <?= number_format($totalFinal, 2) ?></strong></td>
    </tr>
  </tfoot>
</table>


    <div class="alert alert-info">
      <strong>Total a pagar:</strong> S/ <?= number_format($totalFinal, 2) ?>
    </div>
  </div>
      <footer>
      <section class="info-contacto">
        <div>
          <h3>Contacto</h3>
          <p><i class="fas fa-phone"></i> +51 919 543 387</p>
          <p><i class="fas fa-envelope"></i> viajesseguro@utptravel.com</p>
          <p>
            <i class="fas fa-map-marker-alt"></i> Av. Central 123, Lima, Perú
          </p>
        </div>
      </section>
      <section class="redes">
        <div>
          <h3>Síguenos</h3>
          <div>
            <a href="#"><i class="fab fa-facebook-f"></i> Facebook</a>
          </div>
          <div>
            <a href="#"><i class="fab fa-instagram"></i> Instagram</a>
          </div>
          <div>
            <a href="#"><i class="fab fa-x-twitter"></i> Twitter</a>
          </div>
          <div>
            <a href="#"><i class="fab fa-whatsapp"></i> WhatsApp</a>
          </div>
        </div>
      </section>
    </footer>

</body>
</html>

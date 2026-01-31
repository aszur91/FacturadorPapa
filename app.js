let facturaActual = null;

function generarFactura() {
  const cantidad = Number(cantidadInput.value);
  const precio = Number(precioInput.value);
  const iva = Number(ivaSelect.value);

  const base = cantidad * precio;
  const total = base + base * iva;

  facturaActual = {
    concepto: concepto.value,
    base,
    iva,
    total,
    pago: pago.value,
    pagoExtra: pagoExtra.value
  };

  alert(`Total: ${total.toFixed(2)} €`);
}

function exportarPDF() {
  alert("Aquí se integra jsPDF");
}

function enviarWhatsApp() {
  if (!facturaActual) return;
  const texto = encodeURIComponent(
    `Factura:\n${facturaActual.concepto}\nTotal: ${facturaActual.total} €`
  );
  window.open(`https://wa.me/?text=${texto}`);
}
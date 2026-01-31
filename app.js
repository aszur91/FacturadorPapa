document.addEventListener("DOMContentLoaded", () => {

  function get(id) {
    return document.getElementById(id);
  }

  const campos = {
    concepto: get("concepto"),
    cantidad: get("cantidad"),
    precio: get("precio"),
    iva: get("iva"),
    pago: get("pago"),
    pagoExtra: get("pagoExtra")
  };

  let facturaActual = null;

  window.generarFactura = function () {
    const concepto = campos.concepto.value.trim();
    const cantidad = Number(campos.cantidad.value);
    const precio = Number(campos.precio.value);
    const iva = Number(campos.iva.value);

    if (!concepto || cantidad <= 0 || precio <= 0) {
      alert("Revisa concepto, cantidad y precio");
      return;
    }

    const base = cantidad * precio;
    const ivaImporte = base * iva;
    const total = base + ivaImporte;

    facturaActual = {
      concepto,
      cantidad,
      precio,
      base,
      iva,
      ivaImporte,
      total,
      formaPago: campos.pago.value,
      datoPago: campos.pagoExtra.value.trim(),
      fecha: new Date().toLocaleDateString()
    };

    alert(
      `Factura generada\n\n` +
      `Base: ${base.toFixed(2)} €\n` +

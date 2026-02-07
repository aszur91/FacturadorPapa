// ==========================================
// 1. ESTADO Y VARIABLES
// ==========================================
let empresas = JSON.parse(localStorage.getItem('empresas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
let facturas = JSON.parse(localStorage.getItem('facturas')) || [];
let ajustes = JSON.parse(localStorage.getItem('ajustes')) || { colorPrincipal: '#007BFF', ivaDefault: 21 };

let conceptosTemporales = [];
let presupuestoEditIndex = -1;
let indexPresupuestoAFacturar = -1;

// ==========================================
// 2. UTILIDADES DE SANEAMIENTO Y VALIDACIÓN
// ==========================================
const sano = (val) => (val === undefined || val === null ? "" : val);

function validarNumerico(id) {
    const val = document.getElementById(id).value;
    if (val && isNaN(val)) {
        alert(`El campo ${document.getElementById(id).placeholder} debe ser un número.`);
        return false;
    }
    return true;
}

const toBase64 = file => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = e => rej(e);
});

// ==========================================
// 3. GESTIÓN DE VISTAS
// ==========================================
function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function alternarVista(tipo, mostrarForm) {
    document.getElementById(`contenedorForm${tipo}`).style.display = mostrarForm ? 'block' : 'none';
    document.getElementById(`contenedorLista${tipo}s`).style.display = mostrarForm ? 'none' : 'block';
}

// Eventos Navegación
['Empresas', 'Clientes', 'Presupuestos', 'Facturas', 'Ajustes'].forEach(id => {
    document.getElementById(`btn${id}`).onclick = () => {
        mostrarPantalla(`pantalla${id}`);
        if(id === 'Presupuestos') alternarVista('Presupuesto', false);
    };
});

// ==========================================
// 4. GESTIÓN DE PRESUPUESTOS (NUEVO FORMULARIO)
// ==========================================
document.getElementById('btnAbrirFormPresupuesto').onclick = () => {
    presupuestoEditIndex = -1;
    conceptosTemporales = [];
    document.getElementById('preNombre').value = "";
    renderConceptosTemporales();
    actualizarSelectsPresupuesto();
    alternarVista('Presupuesto', true);
};

document.getElementById('btnCerrarPresupuesto').onclick = () => alternarVista('Presupuesto', false);

function actualizarSelectsPresupuesto() {
    const sEmp = document.getElementById('preEmpresaSeleccionada');
    const sCli = document.getElementById('preClienteSeleccionado');
    sEmp.innerHTML = empresas.map((e, i) => `<option value="${i}">${e.nombre}</option>`).join('');
    sCli.innerHTML = clientes.map((c, i) => `<option value="${i}">${c.nombre} ${sano(c.apellidos)}</option>`).join('');
}

document.getElementById('btnAgregarConcepto').onclick = () => {
    const desc = document.getElementById('conDescripcion').value;
    const cant = parseFloat(document.getElementById('conCantidad').value);
    const precio = parseFloat(document.getElementById('conPrecio').value);
    const iva = parseInt(document.getElementById('conIVA').value) || ajustes.ivaDefault;

    if (!desc || isNaN(cant) || isNaN(precio)) return alert("Rellena todos los campos del concepto.");

    conceptosTemporales.push({ concepto: desc, cantidad: cant, precio: precio, iva: iva });
    document.getElementById('conDescripcion').value = "";
    document.getElementById('conCantidad').value = "";
    document.getElementById('conPrecio').value = "";
    renderConceptosTemporales();
};

function renderConceptosTemporales() {
    const tbody = document.getElementById('bodyConceptosTemporal');
    tbody.innerHTML = conceptosTemporales.map((c, i) => `
        <tr>
            <td>${c.concepto}</td>
            <td>${(c.cantidad * c.precio).toFixed(2)}€</td>
            <td>
                <button onclick="eliminarConceptoTemp(${i})" class="btn-cancelar">X</button>
            </td>
        </tr>
    `).join('');
}

function eliminarConceptoTemp(i) {
    if (confirm("¿Eliminar este concepto?")) {
        conceptosTemporales.splice(i, 1);
        renderConceptosTemporales();
    }
}

document.getElementById('btnGuardarPresupuestoFinal').onclick = () => {
    const nombre = document.getElementById('preNombre').value;
    const empIdx = document.getElementById('preEmpresaSeleccionada').value;
    const cliIdx = document.getElementById('preClienteSeleccionado').value;

    if (!nombre || conceptosTemporales.length === 0) return alert("Ponle un nombre y añade conceptos.");

    const base = conceptosTemporales.reduce((s, l) => s + (l.cantidad * l.precio), 0);
    const ivaT = conceptosTemporales.reduce((s, l) => s + (l.cantidad * l.precio * l.iva / 100), 0);

    const data = {
        nombre: nombre,
        empresa: empIdx,
        cliente: cliIdx,
        fecha: new Date().toLocaleDateString(),
        numero: presupuestos.length + 1,
        lineas: [...conceptosTemporales],
        total: base + ivaT
    };

    if (presupuestoEditIndex === -1) {
        presupuestos.push(data);
    } else {
        presupuestos[presupuestoEditIndex] = data;
    }

    guardarLocalStorage();
    actualizarListaPresupuestos();
    alternarVista('Presupuesto', false);
};

function actualizarListaPresupuestos() {
    const lista = document.getElementById('listaPresupuestos');
    lista.innerHTML = presupuestos.map((p, i) => `
        <li>
            <div><strong>#${p.numero} ${p.nombre}</strong><br><small>${p.total.toFixed(2)}€</small></div>
            <div>
                <button onclick="editarPresupuesto(${i})" class="btn-main-short">Editar</button>
                <button onclick="intentarEmitirFactura(${i})" style="background:green; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Emitir Factura</button>
                <button onclick="borrarPresupuesto(${i})" class="btn-cancelar">X</button>
            </div>
        </li>
    `).join('');
}

function editarPresupuesto(i) {
    const p = presupuestos[i];
    presupuestoEditIndex = i;
    document.getElementById('preNombre').value = p.nombre;
    conceptosTemporales = [...p.lineas];
    actualizarSelectsPresupuesto();
    renderConceptosTemporales();
    alternarVista('Presupuesto', true);
}

function borrarPresupuesto(i) {
    if(confirm("¿Eliminar presupuesto?")) {
        presupuestos.splice(i, 1);
        guardarLocalStorage();
        actualizarListaPresupuestos();
    }
}

// ==========================================
// 5. GESTIÓN DE FACTURAS Y ESTADOS
// ==========================================
function intentarEmitirFactura(idx) {
    const existe = facturas.find(f => f.presupuestoId === idx);
    if (existe) return alert("Este presupuesto ya tiene una factura asociada.");
    
    indexPresupuestoAFacturar = idx;
    document.getElementById('modalOpcionesFactura').style.display = 'block';
}

document.getElementById('btnCancelarEmision').onclick = () => {
    document.getElementById('modalOpcionesFactura').style.display = 'none';
};

document.getElementById('btnConfirmarEmision').onclick = () => {
    const p = presupuestos[indexPresupuestoAFacturar];
    const metodo = document.getElementById('facMetodoPago').value;
    const plazo = document.getElementById('facPlazo').value;

    const f = {
        ...p,
        numero: facturas.length + 1,
        presupuestoId: indexPresupuestoAFacturar,
        metodoPago: metodo,
        plazoPago: sano(plazo),
        estado: 'Pendiente' // Pendiente o Cobrada
    };

    facturas.push(f);
    guardarLocalStorage();
    actualizarListaFacturas();
    document.getElementById('modalOpcionesFactura').style.display = 'none';
    mostrarPantalla('pantallaFacturas');
};

function actualizarListaFacturas() {
    const lista = document.getElementById('listaFacturas');
    lista.innerHTML = facturas.map((f, i) => `
        <li class="${f.estado === 'Cobrada' ? 'factura-cobrada' : 'factura-pendiente'}">
            <div>
                <strong>Factura #${f.numero}</strong> - ${f.estado}<br>
                <small>${f.nombre}</small>
            </div>
            <div>
                <button onclick="verPDF(${i})" class="btn-main-short">PDF</button>
                ${f.estado === 'Pendiente' ? `<button onclick="cambiarEstadoCobro(${i})" style="background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">¿Cobrada?</button>` : ''}
                <button onclick="enviarPorEmail(${i})" style="background:#007bff; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Enviar</button>
                <button onclick="borrarFactura(${i})" class="btn-cancelar">X</button>
            </div>
        </li>
    `).join('');
}

function cambiarEstadoCobro(i) {
    if (confirm("¿Confirmar que esta factura ha sido cobrada?")) {
        facturas[i].estado = 'Cobrada';
        guardarLocalStorage();
        actualizarListaFacturas();
    }
}

function borrarFactura(i) {
    if(confirm("¿Eliminar factura? Esto permitirá volver a emitirla desde el presupuesto.")) {
        facturas.splice(i, 1);
        guardarLocalStorage();
        actualizarListaFacturas();
    }
}

function enviarPorEmail(i) {
    const f = facturas[i];
    const cliente = clientes[f.cliente];
    const asunto = encodeURIComponent(`Factura ${f.numero} - ${f.nombre}`);
    const cuerpo = encodeURIComponent(`Hola ${cliente.nombre},\nAdjunto envío la factura pendiente. Un saludo.`);
    window.location.href = `mailto:${cliente.email}?subject=${asunto}&body=${cuerpo}`;
    alert("Recuerda adjuntar el PDF descargado en el correo que se abrirá.");
}

// ==========================================
// 6. MOTOR DE PDF PROFESIONAL
// ==========================================
function verPDF(idx) {
    facturaParaExportar = facturas[idx];
    const f = facturaParaExportar;
    const emp = empresas[f.empresa];
    const cli = clientes[f.cliente];

    let subtotal = 0;
    let totalIVA = 0;
    const lineasHTML = f.lineas.map(l => {
        const totalL = l.cantidad * l.precio;
        subtotal += totalL;
        totalIVA += totalL * (l.iva / 100);
        return `<tr><td>${l.concepto}</td><td>${l.cantidad}</td><td>${l.precio.toFixed(2)}€</td><td>${totalL.toFixed(2)}€</td></tr>`;
    }).join('');

    document.getElementById('previewContenido').innerHTML = `
        <div style="font-family:Arial; padding:10px; border:1px solid #eee;">
            <h3>${emp.nombre}</h3>
            <p><strong>Factura a:</strong> ${cli.nombre} ${sano(cli.apellidos)}</p>
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr style="background:#f4f4f4"><th>Concepto</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead>
                <tbody>${lineasHTML}</tbody>
            </table>
            <div style="text-align:right; margin-top:10px;">
                <p>Base Imponible: ${subtotal.toFixed(2)}€</p>
                <p>IVA: ${totalIVA.toFixed(2)}€</p>
                <h4>TOTAL: ${(subtotal + totalIVA).toFixed(2)}€</h4>
            </div>
            <p style="font-size:0.8rem; color:blue;">Método Pago: ${f.metodoPago.toUpperCase()} - ${f.plazoPago}</p>
        </div>
    `;
    document.getElementById('modalPreview').style.display = 'block';
}

document.getElementById('btnConfirmarPDF').onclick = () => {
    const f = facturaParaExportar;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const emp = empresas[f.empresa];
    const cli = clientes[f.cliente];

    doc.setFontSize(20); doc.setTextColor(ajustes.colorPrincipal);
    doc.text(emp.nombre.toUpperCase(), 14, 22);
    
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text([`CIF: ${sano(emp.cif)}`, `${sano(emp.calle)} ${sano(emp.numero)}`, `${sano(emp.localidad)}`], 14, 30);

    doc.setFillColor(245); doc.rect(120, 15, 75, 30, 'F');
    doc.text(`CLIENTE:`, 125, 22);
    doc.text(`${cli.nombre} ${sano(cli.apellidos)}`, 125, 28);
    doc.text(`CIF/NIF: ${sano(cli.cif)}`, 125, 34);

    doc.setDrawColor(ajustes.colorPrincipal); doc.line(14, 50, 196, 50);
    doc.text(`FACTURA Nº: ${f.numero} | FECHA: ${f.fecha}`, 14, 58);

    let y = 70;
    doc.setFillColor(ajustes.colorPrincipal); doc.setTextColor(255);
    doc.rect(14, y, 182, 8, 'F');
    doc.text("CONCEPTO", 16, y + 6); doc.text("TOTAL", 170, y + 6);

    y += 15; doc.setTextColor(0);
    let sub = 0, ivaT = 0;
    f.lineas.forEach(l => {
        const t = l.cantidad * l.precio;
        sub += t; ivaT += t * (l.iva / 100);
        doc.text(`${l.concepto} (x${l.cantidad})`, 16, y);
        doc.text(`${t.toFixed(2)}€`, 170, y);
        y += 8;
    });

    y += 10; doc.line(130, y, 196, y);
    y += 7; doc.text(`BASE IMPONIBLE:`, 130, y); doc.text(`${sub.toFixed(2)}€`, 175, y);
    y += 7; doc.text(`IVA (${ajustes.ivaDefault}%):`, 130, y); doc.text(`${ivaT.toFixed(2)}€`, 175, y);
    y += 10; doc.setFontSize(12); doc.text(`TOTAL FACTURA:`, 130, y); doc.text(`${(sub + ivaT).toFixed(2)}€`, 175, y);

    y = 260; doc.setFontSize(10);
    doc.text(`MÉTODO DE PAGO: ${f.metodoPago.toUpperCase()}`, 14, y);
    if(f.metodoPago === 'transferencia') doc.text(`IBAN: ${emp.iban}`, 14, y + 6);
    if(f.metodoPago === 'bizum') doc.text(`TELÉFONO BIZUM: ${emp.telefono}`, 14, y + 6);
    doc.text(`VENCIMIENTO: ${f.plazoPago}`, 14, y + 12);

    doc.save(`Factura_${f.numero}_${f.nombre}.pdf`);
};

// ==========================================
// 8. EMPRESAS Y CLIENTES (LOGICA FORM)
// ==========================================
document.getElementById('btnNuevaEmpresa').onclick = () => {
    document.getElementById('empEditIndex').value = "-1";
    document.getElementById('formempresa').reset();
    alternarVista('Empresa', true);
};

document.getElementById('btnGuardarEmpresa').onclick = async () => {
    if(!validarNumerico('empTelefono')) return;
    const logoIn = document.getElementById('empLogo');
    let logo64 = "";
    if (logoIn.files[0]) logo64 = await toBase64(logoIn.files[0]);

    const data = {
        nombre: document.getElementById('empNombre').value,
        cif: document.getElementById('empCIF').value,
        calle: document.getElementById('empCalle').value,
        numero: document.getElementById('empNumero').value,
        puerta: document.getElementById('empPuerta').value,
        cp: document.getElementById('empCP').value,
        localidad: document.getElementById('empLocalidad').value,
        provincia: document.getElementById('empProvincia').value,
        telefono: document.getElementById('empTelefono').value,
        email: document.getElementById('empEmail').value,
        iban: document.getElementById('empIBAN').value,
        logo: logo64
    };

    const idx = parseInt(document.getElementById('empEditIndex').value);
    if(idx === -1) empresas.push(data); else empresas[idx] = data;
    
    guardarLocalStorage(); actualizarListaEmpresas(); alternarVista('Empresa', false);
};

// ... (Repetir lógica para Guardar Cliente y Actualizar listas) ...

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    aplicarAjustes();
    actualizarListaEmpresas();
    actualizarListaClientes();
    actualizarListaPresupuestos();
    actualizarListaFacturas();
});

document.querySelector('.close-modal').onclick = () => document.getElementById('modalPreview').style.display = 'none';

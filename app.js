// ESTADO INICIAL
let empresas = JSON.parse(localStorage.getItem('empresas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
let facturas = JSON.parse(localStorage.getItem('facturas')) || [];
let ajustes = JSON.parse(localStorage.getItem('ajustes')) || { colorPrincipal: '#007BFF', ivaDefault: 21 };

let conceptosTemporales = [];
let presupuestoEditIndex = -1;
let idPresupuestoFacturar = -1;
let facturaParaExportar = null;

// Saneamiento para evitar "undefined"
const sano = (v) => (v === undefined || v === null ? "" : v);

function guardar() {
    localStorage.setItem('empresas', JSON.stringify(empresas));
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
    localStorage.setItem('facturas', JSON.stringify(facturas));
}

function aplicarAjustes() {
    document.documentElement.style.setProperty('--primary-color', ajustes.colorPrincipal);
}

// VALIDACIONES NUMÉRICAS
function validarNumerico(id) {
    const v = document.getElementById(id).value.replace(/\s/g, "");
    if(v && isNaN(v)) {
        alert("El campo debe ser numérico"); return false;
    }
    return true;
}

// NAVEGACIÓN
function alternarVista(tipo, mostrar) {
    document.getElementById(`contenedorForm${tipo}`).style.display = mostrar ? 'block' : 'none';
    const listaContenedor = document.getElementById(`contenedorLista${tipo}s`);
    if(listaContenedor) listaContenedor.style.display = mostrar ? 'none' : 'block';
}

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// EVENTOS MENÚ
document.getElementById('btnEmpresas').onclick = () => mostrarPantalla('pantallaEmpresas');
document.getElementById('btnClientes').onclick = () => mostrarPantalla('pantallaClientes');
document.getElementById('btnPresupuestos').onclick = () => { mostrarPantalla('pantallaPresupuestos'); alternarVista('Presupuesto', false); };
document.getElementById('btnFacturas').onclick = () => { mostrarPantalla('pantallaFacturas'); actualizarListaFacturas(); };
document.getElementById('btnAjustes').onclick = () => mostrarPantalla('pantallaAjustes');

// GESTIÓN PRESUPUESTOS
document.getElementById('btnAbrirFormPresupuesto').onclick = () => {
    presupuestoEditIndex = -1; conceptosTemporales = [];
    document.getElementById('preNombre').value = "";
    document.getElementById('preEmpresaSeleccionada').innerHTML = empresas.map((e,i)=>`<option value="${i}">${e.nombre}</option>`).join('');
    document.getElementById('preClienteSeleccionado').innerHTML = clientes.map((c,i)=>`<option value="${i}">${c.nombre}</option>`).join('');
    renderConceptos();
    alternarVista('Presupuesto', true);
};

document.getElementById('btnCerrarPresupuesto').onclick = () => alternarVista('Presupuesto', false);

document.getElementById('btnAgregarConcepto').onclick = () => {
    const desc = document.getElementById('conDescripcion').value;
    const cant = parseFloat(document.getElementById('conCantidad').value);
    const pre = parseFloat(document.getElementById('conPrecio').value);
    if(!desc || isNaN(cant) || isNaN(pre)) return alert("Rellena los campos del concepto.");
    conceptosTemporales.push({ 
        concepto: desc, 
        cantidad: cant, 
        precio: pre, 
        iva: parseInt(document.getElementById('conIVA').value) || ajustes.ivaDefault 
    });
    document.getElementById('conDescripcion').value = ""; document.getElementById('conCantidad').value = ""; document.getElementById('conPrecio').value = "";
    renderConceptos();
};

function renderConceptos() {
    document.getElementById('bodyConceptosTemporal').innerHTML = conceptosTemporales.map((c,i) => `
        <tr style="border-bottom:1px solid #eee">
            <td>${c.concepto}</td>
            <td>${(c.cantidad * c.precio).toFixed(2)}€</td>
            <td><button onclick="conceptosTemporales.splice(${i},1);renderConceptos();" class="btn-cancelar">Eliminar</button></td>
        </tr>
    `).join('');
}

document.getElementById('btnGuardarPresupuestoFinal').onclick = () => {
    const p = {
        nombre: document.getElementById('preNombre').value,
        empresa: document.getElementById('preEmpresaSeleccionada').value,
        cliente: document.getElementById('preClienteSeleccionado').value,
        lineas: [...conceptosTemporales],
        fecha: new Date().toLocaleDateString(),
        numero: presupuestos.length + 1,
        total: conceptosTemporales.reduce((acc, c) => acc + (c.cantidad * c.precio * (1 + c.iva/100)), 0)
    };
    if(presupuestoEditIndex === -1) presupuestos.push(p); else presupuestos[presupuestoEditIndex] = p;
    guardar(); alternarVista('Presupuesto', false); actualizarListaPresupuestos();
};

function actualizarListaPresupuestos() {
    const lista = document.getElementById('listaPresupuestos');
    lista.innerHTML = presupuestos.map((p, i) => `
        <li>
            <div><strong>#${p.numero} - ${p.nombre}</strong><br><small>${p.total.toFixed(2)}€</small></div>
            <div>
                <button onclick="intentarFacturar(${i})" class="btn-main-short" style="background:green">Emitir Factura</button>
                <button onclick="presupuestos.splice(${i},1);guardar();actualizarListaPresupuestos();" class="btn-cancelar">X</button>
            </div>
        </li>
    `).join('');
}

// FACTURACIÓN
function intentarFacturar(idx) {
    if(facturas.find(f => f.presupuestoId === idx)) return alert("Este presupuesto ya tiene una factura asociada.");
    idPresupuestoFacturar = idx;
    document.getElementById('modalOpcionesFactura').style.display = 'block';
}

document.getElementById('btnConfirmarEmision').onclick = () => {
    const p = presupuestos[idPresupuestoFacturar];
    facturas.push({
        ...p, presupuestoId: idPresupuestoFacturar,
        metodoPago: document.getElementById('facMetodoPago').value,
        plazoPago: sano(document.getElementById('facPlazo').value),
        estado: 'Pendiente', numero: facturas.length + 1
    });
    guardar(); document.getElementById('modalOpcionesFactura').style.display = 'none';
    mostrarPantalla('pantallaFacturas'); actualizarListaFacturas();
};

function actualizarListaFacturas() {
    document.getElementById('listaFacturas').innerHTML = facturas.map((f,i) => `
        <li class="${f.estado === 'Cobrada' ? 'factura-cobrada' : 'factura-pendiente'}">
            <span>Factura #${f.numero} - ${f.nombre} (${f.estado})</span>
            <div>
                <button onclick="verPDF(${i})" class="btn-main-short">PDF</button>
                ${f.estado === 'Pendiente' ? `<button onclick="facturas[${i}].estado='Cobrada';guardar();actualizarListaFacturas();" class="btn-main-short" style="background:#28a745">¿Cobrada?</button>` : ''}
                <button onclick="facturas.splice(${i},1);guardar();actualizarListaFacturas();" class="btn-cancelar">X</button>
            </div>
        </li>
    `).join('');
}

// MOTOR PDF
function verPDF(idx) {
    facturaParaExportar = facturas[idx];
    const f = facturaParaExportar;
    const emp = empresas[f.empresa];
    const cli = clientes[f.cliente];
    
    let base = 0, ivaTotal = 0;
    const html = f.lineas.map(l => {
        const t = l.cantidad * l.precio;
        base += t; ivaTotal += t * (l.iva/100);
        return `<tr><td>${l.concepto}</td><td>${l.cantidad}</td><td>${l.precio.toFixed(2)}€</td><td>${t.toFixed(2)}€</td></tr>`;
    }).join('');

    document.getElementById('previewContenido').innerHTML = `
        <div style="font-size:0.8rem">
            <p><strong>${emp.nombre}</strong> para <strong>${cli.nombre}</strong></p>
            <table style="width:100%; border-bottom:1px solid #ccc">
                <thead><tr><th>Ítem</th><th>Cant</th><th>P.U.</th><th>Total</th></tr></thead>
                <tbody>${html}</tbody>
            </table>
            <div style="text-align:right">
                <p>Base Imponible: ${base.toFixed(2)}€</p>
                <p>IVA: ${ivaTotal.toFixed(2)}€</p>
                <h4>TOTAL: ${(base + ivaTotal).toFixed(2)}€</h4>
            </div>
        </div>`;
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
    doc.text(`CLIENTE: ${cli.nombre} ${sano(cli.apellidos)}`, 125, 22);
    doc.text(`CIF/NIF: ${sano(cli.cif)}`, 125, 34);

    doc.line(14, 50, 196, 50);
    doc.text(`FACTURA Nº: ${f.numero} | FECHA: ${f.fecha}`, 14, 58);

    let y = 80, sub = 0, ivaT = 0;
    f.lineas.forEach(l => {
        const t = l.cantidad * l.precio;
        sub += t; ivaT += t * (l.iva/100);
        doc.text(`${l.concepto} x${l.cantidad}`, 14, y);
        doc.text(`${t.toFixed(2)}€`, 175, y);
        y += 8;
    });

    y += 10; doc.line(130, y, 196, y);
    y += 7; doc.text(`BASE IMPONIBLE: ${sub.toFixed(2)}€`, 130, y);
    y += 7; doc.text(`IVA TOTAL: ${ivaT.toFixed(2)}€`, 130, y+7);
    y += 15; doc.setFontSize(12); doc.text(`TOTAL FACTURA: ${(sub + ivaT).toFixed(2)}€`, 130, y+14);

    y = 260; doc.setFontSize(10);
    doc.text(`MÉTODO DE PAGO: ${f.metodoPago.toUpperCase()}`, 14, y);
    if(f.metodoPago === 'transferencia') doc.text(`IBAN: ${emp.iban}`, 14, y+6);
    if(f.metodoPago === 'bizum') doc.text(`TEL: ${emp.telefono}`, 14, y+6);
    doc.save(`Factura_${f.numero}.pdf`);
};

// GESTIÓN EMPRESAS / CLIENTES
document.getElementById('btnNuevaEmpresa').onclick = () => {
    document.getElementById('empEditIndex').value = "-1"; document.getElementById('formempresa').reset();
    alternarVista('Empresa', true);
};

document.getElementById('btnGuardarEmpresa').onclick = async () => {
    if(!validarNumerico('empTelefono')) return;
    const data = {
        nombre: document.getElementById('empNombre').value,
        cif: document.getElementById('empCIF').value,
        calle: document.getElementById('empCalle').value,
        numero: document.getElementById('empNumero').value,
        cp: document.getElementById('empCP').value,
        localidad: document.getElementById('empLocalidad').value,
        provincia: document.getElementById('empProvincia').value,
        telefono: document.getElementById('empTelefono').value,
        email: document.getElementById('empEmail').value,
        iban: document.getElementById('empIBAN').value
    };
    const idx = parseInt(document.getElementById('empEditIndex').value);
    if(idx === -1) empresas.push(data); else empresas[idx] = data;
    guardar(); actualizarListaEmpresas(); alternarVista('Empresa', false);
};

function actualizarListaEmpresas() {
    document.getElementById('listaEmpresas').innerHTML = empresas.map((e,i)=>`
        <li><span>${e.nombre}</span><button onclick="cargarEmpresa(${i})" class="btn-main-short">Editar</button></li>
    `).join('');
}

function cargarEmpresa(i) {
    const e = empresas[i];
    document.getElementById('empNombre').value = e.nombre; document.getElementById('empEditIndex').value = i;
    alternarVista('Empresa', true);
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    aplicarAjustes();
    actualizarListaEmpresas();
    actualizarListaPresupuestos();
});

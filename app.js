// ==========================================
// 1. ESTADO GLOBAL Y CARGA DE DATOS
// ==========================================
let empresas = JSON.parse(localStorage.getItem('empresas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
let facturas = JSON.parse(localStorage.getItem('facturas')) || [];
let ajustes = JSON.parse(localStorage.getItem('ajustes')) || { 
    colorPrincipal: '#007BFF', 
    ivaDefault: 21 
};

// Variables de control de flujo
let conceptosTemporales = [];
let presupuestoEditIndex = -1;
let idPresupuestoFacturar = -1;
let facturaParaExportar = null;

const pantallas = document.querySelectorAll('.pantalla');
const modalPreview = document.getElementById('modalPreview');
const modalOpciones = document.getElementById('modalOpcionesFactura');

// ==========================================
// 2. UTILIDADES, VALIDACIÓN Y SANEAMIENTO
// ==========================================

// Saneamiento para evitar "undefined" en la interfaz y PDF
const sano = (val) => (val === undefined || val === null ? "" : val);

function guardar() {
    localStorage.setItem('empresas', JSON.stringify(empresas));
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
    localStorage.setItem('facturas', JSON.stringify(facturas));
}

function aplicarAjustes() {
    document.documentElement.style.setProperty('--primary-color', ajustes.colorPrincipal);
    if(document.getElementById('ajusteColor')) document.getElementById('ajusteColor').value = ajustes.colorPrincipal;
    if(document.getElementById('ajusteIVA')) document.getElementById('ajusteIVA').value = ajustes.ivaDefault;
}

function validarNumerico(id) {
    const input = document.getElementById(id);
    const valor = input.value.replace(/\s/g, "");
    if (valor && isNaN(valor)) {
        alert(`El campo ${input.placeholder || id} debe contener solo números.`);
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
// 3. NAVEGACIÓN Y CONTROL DE VISTAS
// ==========================================

function mostrarPantalla(id) {
    pantallas.forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function alternarVista(tipo, mostrarFormulario) {
    const contenedorForm = document.getElementById(`contenedorForm${tipo}`);
    const contenedorLista = document.getElementById(`contenedorLista${tipo}s`);
    const cabecera = document.getElementById(`cabecera${tipo}s`);
    const form = document.getElementById(`form${tipo.toLowerCase()}`);

    if (mostrarFormulario) {
        contenedorForm.style.display = 'block';
        contenedorLista.style.display = 'none';
        if(cabecera) cabecera.style.display = 'none';
    } else {
        contenedorForm.style.display = 'none';
        contenedorLista.style.display = 'block';
        if(cabecera) cabecera.style.display = 'flex';
        if(form) form.reset();
        const editInput = document.getElementById(`${tipo === 'Empresa' ? 'emp' : 'cli'}EditIndex`);
        if(editInput) editInput.value = "-1";
    }
}

// Listeners Menú Principal
document.getElementById('btnEmpresas').onclick = () => mostrarPantalla('pantallaEmpresas');
document.getElementById('btnClientes').onclick = () => mostrarPantalla('pantallaClientes');
document.getElementById('btnPresupuestos').onclick = () => {
    mostrarPantalla('pantallaPresupuestos');
    alternarVista('Presupuesto', false);
};
document.getElementById('btnFacturas').onclick = () => {
    mostrarPantalla('pantallaFacturas');
    actualizarListaFacturas();
};
document.getElementById('btnAjustes').onclick = () => mostrarPantalla('pantallaAjustes');

// ==========================================
// 4. GESTIÓN DE EMPRESAS Y CLIENTES
// ==========================================

// Empresas
document.getElementById('btnNuevaEmpresa').onclick = () => alternarVista('Empresa', true);

document.getElementById('btnGuardarEmpresa').onclick = async () => {
    if(!validarNumerico('empTelefono') || !validarNumerico('empNumero')) return;
    
    const logoInput = document.getElementById('empLogo');
    let logoBase64 = "";
    if (logoInput.files[0]) logoBase64 = await toBase64(logoInput.files[0]);

    const idx = parseInt(document.getElementById('empEditIndex').value);
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
        iban: document.getElementById('empIBAN').value,
        logo: logoBase64 || (idx !== -1 ? empresas[idx].logo : "")
    };

    if(idx === -1) empresas.push(data); else empresas[idx] = data;
    guardar(); actualizarListaEmpresas(); alternarVista('Empresa', false);
};

function actualizarListaEmpresas() {
    const lista = document.getElementById('listaEmpresas');
    lista.innerHTML = empresas.map((e, i) => `
        <li>
            <span>${sano(e.nombre)}</span>
            <button onclick="cargarEmpresa(${i})" class="btn-main-short">Editar</button>
        </li>
    `).join('');
}

function cargarEmpresa(i) {
    const e = empresas[i];
    document.getElementById('empNombre').value = sano(e.nombre);
    document.getElementById('empCIF').value = sano(e.cif);
    document.getElementById('empEditIndex').value = i;
    alternarVista('Empresa', true);
}

// Clientes
document.getElementById('btnNuevoCliente').onclick = () => alternarVista('Cliente', true);

document.getElementById('btnGuardarCliente').onclick = () => {
    if(!validarNumerico('cliTelefono') || !validarNumerico('cliNumero')) return;

    const idx = parseInt(document.getElementById('cliEditIndex').value);
    const data = {
        nombre: document.getElementById('cliNombre').value,
        apellidos: document.getElementById('cliApellidos').value,
        cif: document.getElementById('cliCIF').value,
        calle: document.getElementById('cliCalle').value,
        numero: document.getElementById('cliNumero').value,
        cp: document.getElementById('cliCP').value,
        localidad: document.getElementById('cliLocalidad').value,
        provincia: document.getElementById('cliProvincia').value,
        telefono: document.getElementById('cliTelefono').value,
        email: document.getElementById('cliEmail').value
    };

    if(idx === -1) clientes.push(data); else clientes[idx] = data;
    guardar(); actualizarListaClientes(); alternarVista('Cliente', false);
};

function actualizarListaClientes() {
    const lista = document.getElementById('listaClientes');
    lista.innerHTML = clientes.map((c, i) => `
        <li>
            <span>${sano(c.nombre)} ${sano(c.apellidos)}</span>
            <button onclick="cargarCliente(${i})" class="btn-main-short">Editar</button>
        </li>
    `).join('');
}

function cargarCliente(i) {
    const c = clientes[i];
    document.getElementById('cliNombre').value = sano(c.nombre);
    document.getElementById('cliEditIndex').value = i;
    alternarVista('Cliente', true);
}

// ==========================================
// 5. GESTOR DE PRESUPUESTOS (DINÁMICO)
// ==========================================

document.getElementById('btnAbrirFormPresupuesto').onclick = () => {
    presupuestoEditIndex = -1;
    conceptosTemporales = [];
    document.getElementById('preNombre').value = "";
    actualizarSelectsPresupuesto();
    renderConceptosTemporales();
    alternarVista('Presupuesto', true);
};

document.getElementById('btnCerrarPresupuesto').onclick = () => alternarVista('Presupuesto', false);

function actualizarSelectsPresupuesto() {
    const sEmp = document.getElementById('preEmpresaSeleccionada');
    const sCli = document.getElementById('preClienteSeleccionado');
    sEmp.innerHTML = empresas.map((e, i) => `<option value="${i}">${sano(e.nombre)}</option>`).join('');
    sCli.innerHTML = clientes.map((c, i) => `<option value="${i}">${sano(c.nombre)} ${sano(c.apellidos)}</option>`).join('');
}

document.getElementById('btnAgregarConcepto').onclick = () => {
    const desc = document.getElementById('conDescripcion').value;
    const cant = parseFloat(document.getElementById('conCantidad').value);
    const prec = parseFloat(document.getElementById('conPrecio').value);
    const iva = parseInt(document.getElementById('conIVA').value) || ajustes.ivaDefault;

    if(!desc || isNaN(cant) || isNaN(prec)) return alert("Rellena los datos del concepto correctamente.");

    conceptosTemporales.push({ concepto: desc, cantidad: cant, precio: prec, iva: iva });
    document.getElementById('conDescripcion').value = "";
    document.getElementById('conCantidad').value = "";
    document.getElementById('conPrecio').value = "";
    renderConceptosTemporales();
};

function renderConceptosTemporales() {
    const tbody = document.getElementById('bodyConceptosTemporal');
    tbody.innerHTML = conceptosTemporales.map((c, i) => `
        <tr style="border-bottom: 1px solid #eee">
            <td>${sano(c.concepto)}</td>
            <td>${(c.cantidad * c.precio).toFixed(2)}€</td>
            <td>
                <button onclick="editarConceptoTemp(${i})" style="color:blue; border:none; background:none; cursor:pointer;">Edit</button>
                <button onclick="eliminarConceptoTemp(${i})" style="color:red; border:none; background:none; cursor:pointer;">Elim</button>
            </td>
        </tr>
    `).join('');
}

function eliminarConceptoTemp(i) {
    if(confirm("¿Eliminar este concepto?")) { conceptosTemporales.splice(i, 1); renderConceptosTemporales(); }
}

function editarConceptoTemp(i) {
    const c = conceptosTemporales[i];
    document.getElementById('conDescripcion').value = sano(c.concepto);
    document.getElementById('conCantidad').value = c.cantidad;
    document.getElementById('conPrecio').value = c.precio;
    document.getElementById('conIVA').value = c.iva;
    conceptosTemporales.splice(i, 1);
    renderConceptosTemporales();
}

document.getElementById('btnGuardarPresupuestoFinal').onclick = () => {
    const nombre = document.getElementById('preNombre').value;
    const empIdx = document.getElementById('preEmpresaSeleccionada').value;
    const cliIdx = document.getElementById('preClienteSeleccionado').value;

    if(!nombre || conceptosTemporales.length === 0) return alert("Nombre de presupuesto y conceptos son obligatorios.");

    const base = conceptosTemporales.reduce((acc, c) => acc + (c.cantidad * c.precio), 0);
    const total = base + conceptosTemporales.reduce((acc, c) => acc + (c.cantidad * c.precio * c.iva / 100), 0);

    const data = {
        nombre: nombre,
        empresa: empIdx,
        cliente: cliIdx,
        lineas: [...conceptosTemporales],
        fecha: new Date().toLocaleDateString(),
        numero: presupuestos.length + 1,
        total: total
    };

    if(presupuestoEditIndex === -1) presupuestos.push(data); else presupuestos[presupuestoEditIndex] = data;
    guardar(); actualizarListaPresupuestos(); alternarVista('Presupuesto', false);
};

function actualizarListaPresupuestos() {
    const lista = document.getElementById('listaPresupuestos');
    lista.innerHTML = presupuestos.map((p, i) => `
        <li>
            <div><strong>#${p.numero} - ${sano(p.nombre)}</strong><br><small>${p.total.toFixed(2)}€</small></div>
            <div>
                <button onclick="intentarFacturar(${i})" class="btn-main-short" style="background:green">Emitir Factura</button>
                <button onclick="editarPresupuestoGlobal(${i})" class="btn-main-short">Editar</button>
                <button onclick="borrarPresupuesto(${i})" class="btn-danger">X</button>
            </div>
        </li>
    `).join('');
}

function editarPresupuestoGlobal(i) {
    const p = presupuestos[i];
    presupuestoEditIndex = i;
    document.getElementById('preNombre').value = sano(p.nombre);
    conceptosTemporales = [...p.lineas];
    actualizarSelectsPresupuesto();
    renderConceptosTemporales();
    alternarVista('Presupuesto', true);
}

function borrarPresupuesto(i) {
    if(confirm("¿Eliminar presupuesto?")) { presupuestos.splice(i, 1); guardar(); actualizarListaPresupuestos(); }
}

// ==========================================
// 6. FACTURACIÓN Y ESTADOS (PRO)
// ==========================================

function intentarFacturar(idx) {
    const existe = facturas.find(f => f.presupuestoId === idx);
    if (existe) return alert("Ya existe una factura asociada a este presupuesto.");
    
    idPresupuestoFacturar = idx;
    document.getElementById('modalOpcionesFactura').style.display = 'block';
}

document.getElementById('btnConfirmarEmision').onclick = () => {
    const p = presupuestos[idPresupuestoFacturar];
    const metodo = document.getElementById('facMetodoPago').value;
    const plazo = document.getElementById('facPlazo').value;

    const data = {
        ...p,
        presupuestoId: idPresupuestoFacturar,
        metodoPago: metodo,
        plazoPago: sano(plazo),
        estado: 'Pendiente',
        numero: facturas.length + 1
    };

    facturas.push(data);
    guardar(); actualizarListaFacturas();
    document.getElementById('modalOpcionesFactura').style.display = 'none';
    mostrarPantalla('pantallaFacturas');
};

function actualizarListaFacturas() {
    const lista = document.getElementById('listaFacturas');
    lista.innerHTML = facturas.map((f, i) => `
        <li class="${f.estado === 'Cobrada' ? 'factura-cobrada' : 'factura-pendiente'}">
            <span><strong>#${f.numero}</strong> - ${sano(f.nombre)} (${f.estado})</span>
            <div>
                <button onclick="verPDF(${i})" class="btn-main-short">PDF</button>
                ${f.estado === 'Pendiente' ? `<button onclick="marcarCobrada(${i})" style="background:green; color:white; border:none; padding:5px; border-radius:4px;">Cobrada</button>` : ''}
                <button onclick="borrarFactura(${i})" class="btn-danger">X</button>
            </div>
        </li>
    `).join('');
}

function marcarCobrada(i) {
    if(confirm("¿Marcar como COBRADA?")) { facturas[i].estado = 'Cobrada'; guardar(); actualizarListaFacturas(); }
}

function borrarFactura(i) {
    if(confirm("¿Eliminar factura? Esto permitirá volver a emitirla desde el presupuesto.")) { facturas.splice(i, 1); guardar(); actualizarListaFacturas(); }
}

// ==========================================
// 7. MOTOR PDF PROFESIONAL
// ==========================================

function verPDF(idx) {
    facturaParaExportar = facturas[idx];
    const f = facturaParaExportar;
    const emp = empresas[f.empresa];
    const cli = clientes[f.cliente];
    
    let base = 0, ivaT = 0;
    const htmlLines = f.lineas.map(l => {
        const t = l.cantidad * l.precio;
        base += t; ivaT += t * (l.iva / 100);
        return `<tr><td>${sano(l.concepto)}</td><td>${l.cantidad}</td><td>${l.precio.toFixed(2)}€</td><td>${t.toFixed(2)}€</td></tr>`;
    }).join('');

    document.getElementById('previewContenido').innerHTML = `
        <div style="font-size:0.85rem">
            <p><strong>${sano(emp.nombre)}</strong> para <strong>${sano(cli.nombre)}</strong></p>
            <table style="width:100%; border-bottom:1px solid #ccc; text-align:left;">
                <thead><tr><th>Ítem</th><th>Cant</th><th>P.U.</th><th>Total</th></tr></thead>
                <tbody>${htmlLines}</tbody>
            </table>
            <div style="text-align:right; margin-top:10px;">
                <p>Base Imponible: ${base.toFixed(2)}€</p>
                <p>IVA: ${ivaT.toFixed(2)}€</p>
                <h4>TOTAL: ${(base + ivaT).toFixed(2)}€</h4>
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

    // Estética Encabezado
    doc.setFontSize(20); doc.setTextColor(ajustes.colorPrincipal);
    doc.text(sano(emp.nombre).toUpperCase(), 14, 22);
    
    doc.setFontSize(10); doc.setTextColor(80);
    doc.text([`CIF: ${sano(emp.cif)}`, `${sano(emp.calle)} ${sano(emp.numero)}`, `${sano(emp.cp)} ${sano(emp.localidad)}`], 14, 30);

    doc.setFillColor(245); doc.rect(120, 15, 75, 30, 'F');
    doc.setTextColor(0); doc.setFont(undefined, 'bold'); doc.text("CLIENTE:", 125, 22);
    doc.setFont(undefined, 'normal');
    doc.text([`${sano(cli.nombre)} ${sano(cli.apellidos)}`, `CIF/NIF: ${sano(cli.cif)}`, `${sano(cli.calle)}, ${sano(cli.numero)}`, `${sano(cli.cp)} ${sano(cli.localidad)}`], 125, 28);

    doc.setDrawColor(ajustes.colorPrincipal); doc.line(14, 50, 196, 50);
    doc.text(`FACTURA Nº: ${f.numero} | FECHA: ${f.fecha}`, 14, 58);

    // Tabla
    let y = 80, b = 0, iT = 0;
    doc.setFillColor(ajustes.colorPrincipal); doc.setTextColor(255);
    doc.rect(14, y-6, 182, 8, 'F');
    doc.text("CONCEPTO", 16, y); doc.text("TOTAL", 175, y);

    y += 10; doc.setTextColor(0);
    f.lineas.forEach(l => {
        const t = l.cantidad * l.precio;
        b += t; iT += t * (l.iva / 100);
        doc.text(`${sano(l.concepto)} (x${l.cantidad})`, 16, y);
        doc.text(`${t.toFixed(2)}€`, 175, y);
        y += 8;
    });

    // Totales
    y += 10; doc.line(130, y, 196, y);
    y += 7; doc.text(`BASE IMPONIBLE:`, 130, y); doc.text(`${b.toFixed(2)}€`, 175, y);
    y += 7; doc.text(`IVA (${ajustes.ivaDefault}%):`, 130, y); doc.text(`${iT.toFixed(2)}€`, 175, y);
    y += 10; doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text(`TOTAL FACTURA:`, 130, y); doc.text(`${(b + iT).toFixed(2)}€`, 175, y);

    // Pago
    y = 260; doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`MÉTODO DE PAGO: ${sano(f.metodoPago).toUpperCase()}`, 14, y);
    if(f.metodoPago === 'transferencia') doc.text(`IBAN: ${sano(emp.iban)}`, 14, y+6);
    if(f.metodoPago === 'bizum') doc.text(`TELÉFONO BIZUM: ${sano(emp.telefono)}`, 14, y+6);
    doc.text(`VENCIMIENTO: ${sano(f.plazoPago)}`, 14, y+12);

    doc.save(`Factura_${f.numero}_${sano(f.nombre)}.pdf`);
};

// ==========================================
// 8. AJUSTES E INICIALIZACIÓN
// ==========================================

document.getElementById('btnGuardarAjustes').onclick = () => {
    ajustes.colorPrincipal = document.getElementById('ajusteColor').value;
    ajustes.ivaDefault = parseInt(document.getElementById('ajusteIVA').value);
    guardar(); aplicarAjustes(); alert('Ajustes guardados correctamente.');
};

document.addEventListener('DOMContentLoaded', () => {
    aplicarAjustes();
    actualizarListaEmpresas();
    actualizarListaClientes();
    actualizarListaPresupuestos();
    actualizarListaFacturas();
});

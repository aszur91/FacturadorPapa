// ==========================================
// 1. VARIABLES GLOBALES Y ALMACENAMIENTO
// ==========================================
let empresas = JSON.parse(localStorage.getItem('empresas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
let facturas = JSON.parse(localStorage.getItem('facturas')) || [];
let ajustes = JSON.parse(localStorage.getItem('ajustes')) || {
  colorPrincipal: '#007BFF',
  tamanoLetra: 16,
  tipoLetra: 'Arial',
  ivaDefault: 21
};

const pantallas = document.querySelectorAll('.pantalla');
const modal = document.getElementById('modalPreview');
const closeBtn = document.querySelector('.close-modal');
let facturaParaExportar = null;

// ==========================================
// 2. FUNCIONES DE PERSISTENCIA Y AJUSTES
// ==========================================
function guardarLocalStorage() {
  localStorage.setItem('empresas', JSON.stringify(empresas));
  localStorage.setItem('clientes', JSON.stringify(clientes));
  localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
  localStorage.setItem('facturas', JSON.stringify(facturas));
  localStorage.setItem('ajustes', JSON.stringify(ajustes));
}

function aplicarAjustes() {
  document.documentElement.style.setProperty('--primary-color', ajustes.colorPrincipal);
  document.body.style.fontFamily = ajustes.tipoLetra;
  document.body.style.fontSize = `${ajustes.tamanoLetra}px`;
  
  if (document.getElementById('ajusteColor')) {
    document.getElementById('ajusteColor').value = ajustes.colorPrincipal;
    document.getElementById('ajusteTipoLetra').value = ajustes.tipoLetra;
    document.getElementById('ajusteTamano').value = ajustes.tamanoLetra;
    document.getElementById('ajusteIVA').value = ajustes.ivaDefault;
  }
}

// --- UTILIDAD: Validación de campos ---
function validarCampos(config) {
  let faltan = [];
  config.campos.forEach(id => {
    const input = document.getElementById(id);
    if (!input || !input.value.trim()) {
      faltan.push(input ? (input.placeholder || id) : id);
    }
  });
  if (faltan.length > 0) {
    alert("Los siguientes campos son obligatorios:\n- " + faltan.join("\n- "));
    return false;
  }
  return true;
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// ==========================================
// 3. NAVEGACIÓN
// ==========================================
function mostrarPantalla(id) {
  pantallas.forEach(p => p.classList.remove('active'));
  const pantalla = document.getElementById(id);
  if (pantalla) pantalla.classList.add('active');
  window.scrollTo(0, 0);
}

document.getElementById('btnEmpresas').addEventListener('click', () => mostrarPantalla('pantallaEmpresas'));
document.getElementById('btnClientes').addEventListener('click', () => mostrarPantalla('pantallaClientes'));
document.getElementById('btnPresupuestos').addEventListener('click', () => mostrarPantalla('pantallaPresupuestos'));
document.getElementById('btnFacturas').addEventListener('click', () => mostrarPantalla('pantallaFacturas'));
document.getElementById('btnAjustes').addEventListener('click', () => mostrarPantalla('pantallaAjustes'));

// ==========================================
// 4. GESTIÓN DE EMPRESAS (FORMULARIOS)
// ==========================================
document.getElementById('btnGuardarEmpresa').addEventListener('click', async () => {
  const ids = ['empNombre', 'empCIF', 'empCalle', 'empNumero', 'empPuerta', 'empCP', 'empLocalidad', 'empProvincia', 'empTelefono', 'empEmail', 'empIBAN'];
  if (!validarCampos({ campos: ids })) return;

  const logoInput = document.getElementById('empLogo');
  let logoBase64 = "";
  if (logoInput.files[0]) {
    logoBase64 = await toBase64(logoInput.files[0]);
  }

  const editIndex = parseInt(document.getElementById('empEditIndex').value);
  
  const empresaData = {
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
    logo: logoBase64 || (editIndex !== -1 ? empresas[editIndex].logo : "")
  };

  if (editIndex === -1) {
    empresas.push(empresaData);
  } else {
    empresas[editIndex] = empresaData;
    document.getElementById('empEditIndex').value = "-1";
  }

  document.getElementById('formEmpresa').reset();
  guardarLocalStorage();
  actualizarListaEmpresas();
  alert("Empresa guardada con éxito");
});

function actualizarListaEmpresas() {
  const lista = document.getElementById('listaEmpresas');
  lista.innerHTML = '';
  empresas.forEach((e, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        ${e.logo ? `<img src="${e.logo}" style="height:30px; margin-right:10px; vertical-align:middle;">` : ''}
        <strong>${e.nombre}</strong> <small>(${e.cif})</small>
      </div>`;
    
    const div = document.createElement('div');
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'btn-update';
    btnEdit.onclick = () => cargarEmpresaEnForm(i);
    
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Eliminar';
    btnDel.className = 'btn-danger';
    btnDel.onclick = () => { if(confirm('¿Eliminar empresa?')) { empresas.splice(i,1); guardarLocalStorage(); actualizarListaEmpresas(); } };
    
    div.append(btnEdit, btnDel);
    li.appendChild(div);
    lista.appendChild(li);
  });
  actualizarSelectEmpresas();
}

function cargarEmpresaEnForm(i) {
  const e = empresas[i];
  document.getElementById('empNombre').value = e.nombre;
  document.getElementById('empCIF').value = e.cif;
  document.getElementById('empCalle').value = e.calle;
  document.getElementById('empNumero').value = e.numero;
  document.getElementById('empPuerta').value = e.puerta;
  document.getElementById('empCP').value = e.cp;
  document.getElementById('empLocalidad').value = e.localidad;
  document.getElementById('empProvincia').value = e.provincia;
  document.getElementById('empTelefono').value = e.telefono;
  document.getElementById('empEmail').value = e.email;
  document.getElementById('empIBAN').value = e.iban;
  document.getElementById('empEditIndex').value = i;
  window.scrollTo(0,0);
}

function actualizarSelectEmpresas() {
  const select = document.getElementById('empresaActiva');
  if (!select) return;
  select.innerHTML = '';
  empresas.forEach((e, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = e.nombre;
    select.appendChild(option);
  });
}

// ==========================================
// 5. GESTIÓN DE CLIENTES (FORMULARIOS)
// ==========================================
document.getElementById('btnGuardarCliente').addEventListener('click', () => {
  const ids = ['cliNombre', 'cliApellidos', 'cliCIF', 'cliCalle', 'cliNumero', 'cliPuerta', 'cliCP', 'cliLocalidad', 'cliProvincia', 'cliTelefono', 'cliEmail'];
  if (!validarCampos({ campos: ids })) return;

  const editIndex = parseInt(document.getElementById('cliEditIndex').value);
  const clienteData = {
    nombre: document.getElementById('cliNombre').value,
    apellidos: document.getElementById('cliApellidos').value,
    cif: document.getElementById('cliCIF').value,
    calle: document.getElementById('cliCalle').value,
    numero: document.getElementById('cliNumero').value,
    puerta: document.getElementById('cliPuerta').value,
    cp: document.getElementById('cliCP').value,
    localidad: document.getElementById('cliLocalidad').value,
    provincia: document.getElementById('cliProvincia').value,
    telefono: document.getElementById('cliTelefono').value,
    email: document.getElementById('cliEmail').value
  };

  if (editIndex === -1) {
    clientes.push(clienteData);
  } else {
    clientes[editIndex] = clienteData;
    document.getElementById('cliEditIndex').value = "-1";
  }

  document.getElementById('formCliente').reset();
  guardarLocalStorage();
  actualizarListaClientes();
  alert("Cliente guardado correctamente");
});

function actualizarListaClientes() {
  const lista = document.getElementById('listaClientes');
  lista.innerHTML = '';
  clientes.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${c.nombre} ${c.apellidos}</strong></span>`;
    const div = document.createElement('div');
    
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'btn-update';
    btnEdit.onclick = () => cargarClienteEnForm(i);

    const btnDel = document.createElement('button');
    btnDel.textContent = 'Eliminar';
    btnDel.className = 'btn-danger';
    btnDel.onclick = () => { if(confirm('¿Eliminar cliente?')) { clientes.splice(i,1); guardarLocalStorage(); actualizarListaClientes(); } };
    
    div.append(btnEdit, btnDel);
    li.appendChild(div);
    lista.appendChild(li);
  });
}

function cargarClienteEnForm(i) {
  const c = clientes[i];
  document.getElementById('cliNombre').value = c.nombre;
  document.getElementById('cliApellidos').value = c.apellidos;
  document.getElementById('cliCIF').value = c.cif;
  document.getElementById('cliCalle').value = c.calle;
  document.getElementById('cliNumero').value = c.numero;
  document.getElementById('cliPuerta').value = c.puerta;
  document.getElementById('cliCP').value = c.cp;
  document.getElementById('cliLocalidad').value = c.localidad;
  document.getElementById('cliProvincia').value = c.provincia;
  document.getElementById('cliTelefono').value = c.telefono;
  document.getElementById('cliEmail').value = c.email;
  document.getElementById('cliEditIndex').value = i;
  window.scrollTo(0,0);
}

// ==========================================
// 6. LÓGICA DE PRESUPUESTOS Y FACTURAS
// ==========================================
function actualizarListaPresupuestos() {
  const lista = document.getElementById('listaPresupuestos');
  lista.innerHTML = '';
  presupuestos.forEach((p, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>#${p.numero}</strong> - ${clientes[p.cliente]?.nombre || 'S/C'} - ${p.total.toFixed(2)}€</div>`;
    const divBtns = document.createElement('div');
    divBtns.style.display = 'flex'; divBtns.style.gap = '5px';

    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver/PDF';
    btnVer.style.backgroundColor = 'var(--primary-color)'; btnVer.style.color = 'white';
    btnVer.onclick = () => previsualizarFactura(p);

    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.style.backgroundColor = '#ff9500'; btnEdit.style.color = 'white';
    btnEdit.onclick = () => abrirEdicionPresupuesto(index);

    const btnFact = document.createElement('button');
    btnFact.textContent = 'Facturar';
    btnFact.onclick = () => convertirAFactura(index);

    const btnDel = document.createElement('button');
    btnDel.textContent = 'X'; btnDel.className = 'btn-danger';
    btnDel.onclick = () => { if (confirm('¿Eliminar?')) { presupuestos.splice(index, 1); guardarLocalStorage(); actualizarListaPresupuestos(); } };

    divBtns.append(btnVer, btnEdit, btnFact, btnDel);
    li.appendChild(divBtns);
    lista.appendChild(li);
  });
}

function abrirEdicionPresupuesto(index) {
    const p = presupuestos[index];
    let edicionCancelada = false;
    for (let i = 0; i < p.lineas.length; i++) {
        let l = p.lineas[i];
        const deseaEditar = confirm(`¿Deseas editar: "${l.concepto}"?`);
        if (deseaEditar) {
            const nuevoC = prompt(`Editar concepto [${i + 1}]:`, l.concepto);
            if (nuevoC === null) { edicionCancelada = true; break; }
            const nuevaCant = parseFloat(prompt(`Cantidad:`, l.cantidad));
            const nuevoP = parseFloat(prompt(`Precio:`, l.precio));
            if (!isNaN(nuevaCant) && !isNaN(nuevoP)) {
                l.concepto = nuevoC; l.cantidad = nuevaCant; l.precio = nuevoP;
            }
        }
        if (i < p.lineas.length - 1 && !confirm("¿Continuar editando líneas?")) break;
    }
    const base = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio), 0);
    p.total = base + (base * (ajustes.ivaDefault / 100));
    guardarLocalStorage(); actualizarListaPresupuestos();
    if (modal.style.display === "block") previsualizarFactura(p);
}

document.getElementById('btnAddPresupuesto').addEventListener('click', () => {
  const eIdx = document.getElementById('empresaActiva').value;
  if (eIdx === '' || clientes.length === 0) return alert('Configura empresa y clientes primero');
  const cIdx = prompt(clientes.map((c, i) => `${i}: ${c.nombre}`).join('\n'));
  if (!clientes[cIdx]) return;
  const lineas = [];
  let seguir = true;
  while (seguir) {
    const concepto = prompt('Concepto:');
    const cantidad = parseFloat(prompt('Cantidad:', '1'));
    const precio = parseFloat(prompt('Precio:'));
    if (concepto && !isNaN(precio)) lineas.push({ concepto, cantidad, precio, iva: ajustes.ivaDefault });
    seguir = confirm('¿Otra línea?');
  }
  const base = lineas.reduce((sum, l) => sum + l.cantidad * l.precio, 0);
  const total = base + (base * (ajustes.ivaDefault / 100));
  presupuestos.push({ empresa: eIdx, cliente: cIdx, numero: presupuestos.length + 1, fecha: new Date().toISOString().split('T')[0], lineas, total });
  guardarLocalStorage(); actualizarListaPresupuestos();
});

// ==========================================
// 7. FACTURAS Y PDF
// ==========================================
function actualizarListaFacturas() {
  const lista = document.getElementById('listaFacturas');
  lista.innerHTML = '';
  facturas.forEach((f, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>#${f.numero} - ${f.total.toFixed(2)}€</span>`;
    const btnPDF = document.createElement('button');
    btnPDF.textContent = 'Ver/PDF';
    btnPDF.onclick = () => previsualizarFactura(f);
    li.appendChild(btnPDF);
    lista.appendChild(li);
  });
}

function convertirAFactura(idx) {
  const p = presupuestos[idx];
  const tipo = prompt('Pago: Transferencia, Bizum, Efectivo', 'Transferencia');
  const info = prompt('IBAN / Ref:');
  facturas.push({ ...p, numero: facturas.length + 1, formaPago: { tipo, infoAdicional: info } });
  guardarLocalStorage(); actualizarListaFacturas(); mostrarPantalla('pantallaFacturas');
}

function previsualizarFactura(f) {
  facturaParaExportar = f;
  const contenido = document.getElementById('previewContenido');
  let subtotal = 0, totalIVA = 0;
  const tabla = f.lineas.map(l => {
    const t = l.cantidad * l.precio;
    subtotal += t; totalIVA += t * (l.iva / 100);
    return `<tr><td>${l.concepto}</td><td>${l.cantidad}</td><td>${l.precio.toFixed(2)}€</td><td>${t.toFixed(2)}€</td></tr>`;
  }).join('');
  contenido.innerHTML = `
    <div style="border-bottom: 2px solid var(--primary-color); margin-bottom:10px;">
      <h3>${empresas[f.empresa].nombre}</h3>
      <p>Para: ${clientes[f.cliente].nombre}</p>
    </div>
    <table style="width:100%; font-size:0.8rem;">
      <thead><tr style="background:#eee"><th>Ítem</th><th>Cant.</th><th>P.U.</th><th>Total</th></tr></thead>
      <tbody>${tabla}</tbody>
    </table>
    <div style="text-align:right; margin-top:10px;">
      <p>IVA: ${totalIVA.toFixed(2)}€</p>
      <h4>TOTAL: ${(subtotal + totalIVA).toFixed(2)}€</h4>
    </div>`;
  modal.style.display = "block";
}

function exportarPDF(f) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const emp = empresas[f.empresa];
  const cli = clientes[f.cliente];

  // 1. LOGOTIPO Y DATOS EMPRESA (Izquierda)
  if (emp.logo) {
    doc.addImage(emp.logo, 'PNG', 14, 10, 30, 30); // Logo en la esquina superior
  }
  
  doc.setFontSize(16);
  doc.setTextColor(ajustes.colorPrincipal);
  doc.setFont(undefined, 'bold');
  doc.text(emp.nombre.toUpperCase(), 14, 45);
  
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont(undefined, 'normal');
  doc.text([
    `CIF: ${emp.cif}`,
    `${emp.calle}, ${emp.numero}, ${emp.puerta}`,
    `${emp.cp} - ${emp.localidad} (${emp.provincia})`,
    `Tlf: ${emp.telefono} | Email: ${emp.email}`
  ], 14, 52);

  // 2. DATOS DEL CLIENTE (Derecha)
  doc.setFillColor(245, 245, 245);
  doc.rect(110, 40, 86, 35, 'F'); // Recuadro para el cliente
  doc.setTextColor(0);
  doc.setFont(undefined, 'bold');
  doc.text("CLIENTE:", 115, 48);
  doc.setFont(undefined, 'normal');
  doc.text([
    `${cli.nombre} ${cli.apellidos}`,
    `CIF/NIF: ${cli.cif}`,
    `${cli.calle}, ${cli.numero}, ${cli.puerta}`,
    `${cli.cp} - ${cli.localidad}`,
    `${cli.provincia}`
  ], 115, 54);

  // 3. TÍTULO Y FECHA
  doc.setDrawColor(ajustes.colorPrincipal);
  doc.setLineWidth(1);
  doc.line(14, 85, 196, 85);
  doc.setFontSize(12);
  doc.text(`FACTURA Nº: ${f.numero}`, 14, 92);
  doc.text(`FECHA: ${f.fecha}`, 150, 92);

  // 4. TABLA DE CONCEPTOS
  let y = 100;
  doc.setFillColor(ajustes.colorPrincipal);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255);
  doc.text("CONCEPTO", 16, y + 6);
  doc.text("CANT.", 110, y + 6);
  doc.text("P. UNIT", 140, y + 6);
  doc.text("TOTAL", 170, y + 6);

  y += 15;
  doc.setTextColor(0);
  let subtotal = 0;
  let totalIVA = 0;

  f.lineas.forEach(l => {
    const totalLinea = l.cantidad * l.precio;
    const ivaLinea = totalLinea * (l.iva / 100);
    subtotal += totalLinea;
    totalIVA += ivaLinea;

    doc.text(l.concepto, 16, y);
    doc.text(l.cantidad.toString(), 115, y, { align: 'right' });
    doc.text(`${l.precio.toFixed(2)}€`, 150, y, { align: 'right' });
    doc.text(`${totalLinea.toFixed(2)}€`, 190, y, { align: 'right' });
    y += 8;
  });

  // 5. TOTALES
  y += 10;
  doc.line(130, y, 196, y);
  y += 8;
  doc.text("Subtotal (sin IVA):", 130, y);
  doc.text(`${subtotal.toFixed(2)}€`, 190, y, { align: 'right' });
  y += 6;
  doc.text(`IVA (${ajustes.ivaDefault}%):`, 130, y);
  doc.text(`${totalIVA.toFixed(2)}€`, 190, y, { align: 'right' });
  y += 10;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("TOTAL FACTURA:", 130, y);
  doc.text(`${(subtotal + totalIVA).toFixed(2)}€`, 190, y, { align: 'right' });

  // 6. PIE DE PÁGINA (PAGO)
  y = 260; // Posición al final de la página
  doc.setFontSize(10);
  doc.setDrawColor(200);
  doc.line(14, y - 5, 196, y - 5);
  doc.setFont(undefined, 'bold');
  doc.text("INFORMACIÓN DE PAGO:", 14, y);
  doc.setFont(undefined, 'normal');
  doc.text(`Por favor, realice la transferencia al siguiente IBAN:`, 14, y + 6);
  doc.setFontSize(12);
  doc.setTextColor(ajustes.colorPrincipal);
  doc.text(emp.iban, 14, y + 14);

  doc.save(`Factura_${f.numero}_${emp.nombre}.pdf`);
}

// ==========================================
// 8. INICIALIZACIÓN
// ==========================================
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
document.getElementById('btnConfirmarPDF').onclick = () => {
  if (facturaParaExportar) exportarPDF(facturaParaExportar);
  modal.style.display = "none";
};
document.getElementById('btnEditarPresupuesto').addEventListener('click', () => {
  if (facturaParaExportar) {
    const idx = presupuestos.findIndex(p => p.numero === facturaParaExportar.numero);
    if (idx !== -1) { modal.style.display = "none"; abrirEdicionPresupuesto(idx); }
  }
});

document.getElementById('btnGuardarAjustes').addEventListener('click', () => {
  ajustes.colorPrincipal = document.getElementById('ajusteColor').value;
  ajustes.tipoLetra = document.getElementById('ajusteTipoLetra').value;
  ajustes.tamanoLetra = document.getElementById('ajusteTamano').value;
  ajustes.ivaDefault = document.getElementById('ajusteIVA').value;
  guardarLocalStorage(); aplicarAjustes(); alert('Ajustes guardados');
});

document.addEventListener('DOMContentLoaded', () => {
  aplicarAjustes();
  actualizarListaEmpresas();
  actualizarListaClientes();
  actualizarListaPresupuestos();
  actualizarListaFacturas();
});

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

// Elementos del DOM persistentes
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

// ==========================================
// 3. NAVEGACIÓN
// ==========================================
function mostrarPantalla(id) {
  pantallas.forEach(p => p.classList.remove('active'));
  const pantalla = document.getElementById(id);
  if (pantalla) pantalla.classList.add('active');
  window.scrollTo(0, 0);
}

// Listeners de los botones del menú
document.getElementById('btnEmpresas').addEventListener('click', () => mostrarPantalla('pantallaEmpresas'));
document.getElementById('btnClientes').addEventListener('click', () => mostrarPantalla('pantallaClientes'));
document.getElementById('btnPresupuestos').addEventListener('click', () => mostrarPantalla('pantallaPresupuestos'));
document.getElementById('btnFacturas').addEventListener('click', () => mostrarPantalla('pantallaFacturas'));
document.getElementById('btnAjustes').addEventListener('click', () => mostrarPantalla('pantallaAjustes'));

// ==========================================
// 4. GESTIÓN DE EMPRESAS Y CLIENTES
// ==========================================
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

function actualizarListaEmpresas() {
  const lista = document.getElementById('listaEmpresas');
  lista.innerHTML = '';
  empresas.forEach((e, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${e.nombre}</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'Eliminar';
    btn.className = 'btn-danger';
    btn.onclick = () => {
      if (confirm('¿Eliminar empresa?')) {
        empresas.splice(index, 1);
        guardarLocalStorage();
        actualizarListaEmpresas();
      }
    };
    li.appendChild(btn);
    lista.appendChild(li);
  });
  actualizarSelectEmpresas();
}

function actualizarListaClientes() {
  const lista = document.getElementById('listaClientes');
  lista.innerHTML = '';
  clientes.forEach((c, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${c.nombre}</strong> (${c.email})</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'Eliminar';
    btn.className = 'btn-danger';
    btn.onclick = () => {
      if (confirm('¿Eliminar cliente?')) {
        clientes.splice(index, 1);
        guardarLocalStorage();
        actualizarListaClientes();
      }
    };
    li.appendChild(btn);
    lista.appendChild(li);
  });
}

document.getElementById('btnAddEmpresa').addEventListener('click', () => {
  const nombre = prompt('Nombre de la empresa:');
  if (nombre) { empresas.push({ nombre }); guardarLocalStorage(); actualizarListaEmpresas(); }
});

document.getElementById('btnAddCliente').addEventListener('click', () => {
  const nombre = prompt('Nombre del cliente:');
  const email = prompt('Email del cliente:');
  if (nombre) { clientes.push({ nombre, email }); guardarLocalStorage(); actualizarListaClientes(); }
});

// ==========================================
// 5. LÓGICA DE PRESUPUESTOS Y EDICIÓN
// ==========================================
function actualizarListaPresupuestos() {
  const lista = document.getElementById('listaPresupuestos');
  lista.innerHTML = '';
  presupuestos.forEach((p, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>#${p.numero}</strong> - ${clientes[p.cliente]?.nombre || 'S/C'} - ${p.total.toFixed(2)}€</div>`;
    
    const divBtns = document.createElement('div');
    divBtns.style.display = 'flex';
    divBtns.style.gap = '5px';

    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver/PDF';
    btnVer.style.backgroundColor = 'var(--primary-color)';
    btnVer.style.color = 'white';
    btnVer.onclick = () => previsualizarFactura(p);

    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.style.backgroundColor = '#ff9500';
    btnEdit.style.color = 'white';
    btnEdit.onclick = () => abrirEdicionPresupuesto(index);

    const btnFact = document.createElement('button');
    btnFact.textContent = 'Facturar';
    btnFact.onclick = () => convertirAFactura(index);

    const btnDel = document.createElement('button');
    btnDel.textContent = 'X';
    btnDel.className = 'btn-danger';
    btnDel.onclick = () => { if (confirm('¿Eliminar?')) { presupuestos.splice(index, 1); guardarLocalStorage(); actualizarListaPresupuestos(); } };

    divBtns.append(btnVer, btnEdit, btnFact, btnDel);
    li.appendChild(divBtns);
    lista.appendChild(li);
  });
}

function abrirEdicionPresupuesto(index) {
  const p = presupuestos[index];
  const concepto = prompt("Concepto:", p.lineas[0].concepto);
  const cant = parseFloat(prompt("Cantidad:", p.lineas[0].cantidad));
  const precio = parseFloat(prompt("Precio:", p.lineas[0].precio));

  if (concepto && !isNaN(cant) && !isNaN(precio)) {
    p.lineas[0].concepto = concepto;
    p.lineas[0].cantidad = cant;
    p.lineas[0].precio = precio;
    const base = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio), 0);
    const iva = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio * l.iva / 100), 0);
    p.total = base + iva;
    guardarLocalStorage();
    actualizarListaPresupuestos();
    alert("Actualizado");
  }
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
  const total = base + (base * ajustes.ivaDefault / 100);
  presupuestos.push({ empresa: eIdx, cliente: cIdx, numero: presupuestos.length + 1, fecha: new Date().toISOString().split('T')[0], lineas, total });
  guardarLocalStorage();
  actualizarListaPresupuestos();
});

// ==========================================
// 6. FACTURAS Y MODAL DE PREVISUALIZACIÓN
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
  guardarLocalStorage();
  actualizarListaFacturas();
  mostrarPantalla('pantallaFacturas');
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
      <h3 style="color:var(--primary-color)">${empresas[f.empresa].nombre}</h3>
      <p>Para: ${clientes[f.cliente].nombre}</p>
    </div>
    <table style="width:100%; font-size:0.8rem;">
      <thead><tr style="background:#eee"><th>Ítem</th><th>Cant.</th><th>P.U.</th><th>Total</th></tr></thead>
      <tbody>${tabla}</tbody>
    </table>
    <div style="text-align:right; border-top:1px solid #ddd; margin-top:10px;">
      <p>Subtotal: ${subtotal.toFixed(2)}€ | IVA: ${totalIVA.toFixed(2)}€</p>
      <h4 style="color:var(--primary-color)">TOTAL: ${(subtotal + totalIVA).toFixed(2)}€</h4>
    </div>`;
  modal.style.display = "block";
}

// Listeners del Modal
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

document.getElementById('btnConfirmarPDF').onclick = () => {
  if (facturaParaExportar) exportarPDF(facturaParaExportar);
  modal.style.display = "none";
};

document.getElementById('btnEditarPresupuesto').addEventListener('click', () => {
  if (facturaParaExportar) {
    const idx = presupuestos.findIndex(p => p.numero === facturaParaExportar.numero);
    if (idx !== -1) {
      modal.style.display = "none";
      abrirEdicionPresupuesto(idx);
    }
  }
});

// ==========================================
// 7. EXPORTACIÓN PDF (jspdf)
// ==========================================
function exportarPDF(f) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const emp = empresas[f.empresa];
  const cli = clientes[f.cliente];

  doc.setFontSize(18); doc.setTextColor(ajustes.colorPrincipal);
  doc.text(emp.nombre.toUpperCase(), 14, 20);
  doc.setFontSize(10); doc.setTextColor(0);
  doc.text(`CLIENTE: ${cli.nombre} (${cli.email})`, 120, 20);
  doc.line(14, 45, 196, 45);
  doc.text(`Factura nº: ${f.numero} | Fecha: ${f.fecha}`, 14, 52);

  let y = 65, subtotal = 0, totalIVA = 0;
  doc.setFillColor(240); doc.rect(14, y, 182, 8, 'F');
  doc.text("Concepto", 16, y + 6); doc.text("Total", 170, y + 6);

  f.lineas.forEach(l => {
    y += 10;
    const t = l.cantidad * l.precio;
    subtotal += t; totalIVA += t * (l.iva / 100);
    doc.text(l.concepto, 16, y); doc.text(`${t.toFixed(2)}€`, 170, y);
  });

  y += 15; doc.text(`SUBTOTAL: ${subtotal.toFixed(2)}€`, 130, y);
  y += 7; doc.text(`IVA: ${totalIVA.toFixed(2)}€`, 130, y);
  y += 10; doc.setFontSize(12); doc.text(`TOTAL: ${(subtotal + totalIVA).toFixed(2)}€`, 130, y);

  if (f.formaPago) {
    y += 20; doc.setFontSize(9);
    doc.text(`Pago: ${f.formaPago.tipo} - ${f.formaPago.infoAdicional}`, 14, y);
  }
  doc.save(`Factura_${f.numero}.pdf`);
}

// ==========================================
// 8. AJUSTES E INICIALIZACIÓN
// ==========================================
document.getElementById('btnGuardarAjustes').addEventListener('click', () => {
  ajustes.colorPrincipal = document.getElementById('ajusteColor').value;
  ajustes.tipoLetra = document.getElementById('ajusteTipoLetra').value;
  ajustes.tamanoLetra = document.getElementById('ajusteTamano').value;
  ajustes.ivaDefault = document.getElementById('ajusteIVA').value;
  guardarLocalStorage();
  aplicarAjustes();
  alert('Ajustes guardados');
});

document.addEventListener('DOMContentLoaded', () => {
  aplicarAjustes();
  actualizarListaEmpresas();
  actualizarListaClientes();
  actualizarListaPresupuestos();
  actualizarListaFacturas();
});
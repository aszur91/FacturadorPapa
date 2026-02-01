// ================================
// Variables globales y almacenamiento
// ================================
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

// ================================
// Navegación y Ajustes Visuales
// ================================
function mostrarPantalla(id){
  pantallas.forEach(p => p.classList.remove('active'));
  const pantalla = document.getElementById(id);
  if(pantalla) pantalla.classList.add('active');
  window.scrollTo(0,0); // Sube al inicio al cambiar de sección
}

function aplicarAjustes() {
  document.documentElement.style.setProperty('--primary-color', ajustes.colorPrincipal);
  document.body.style.fontFamily = ajustes.tipoLetra;
  document.body.style.fontSize = `${ajustes.tamanoLetra}px`;
  
  // Rellenar inputs si estamos en la pantalla de ajustes
  if(document.getElementById('ajusteColor')){
    document.getElementById('ajusteColor').value = ajustes.colorPrincipal;
    document.getElementById('ajusteTipoLetra').value = ajustes.tipoLetra;
    document.getElementById('ajusteTamano').value = ajustes.tamanoLetra;
    document.getElementById('ajusteIVA').value = ajustes.ivaDefault;
  }
}

// Listeners de Navegación
document.getElementById('btnEmpresas').addEventListener('click',()=>mostrarPantalla('pantallaEmpresas'));
document.getElementById('btnClientes').addEventListener('click',()=>mostrarPantalla('pantallaClientes'));
document.getElementById('btnPresupuestos').addEventListener('click',()=>mostrarPantalla('pantallaPresupuestos'));
document.getElementById('btnFacturas').addEventListener('click',()=>mostrarPantalla('pantallaFacturas'));
document.getElementById('btnAjustes').addEventListener('click',()=>mostrarPantalla('pantallaAjustes'));

// ================================
// Guardado LocalStorage
// ================================
function guardarLocalStorage(){
  localStorage.setItem('empresas',JSON.stringify(empresas));
  localStorage.setItem('clientes',JSON.stringify(clientes));
  localStorage.setItem('presupuestos',JSON.stringify(presupuestos));
  localStorage.setItem('facturas',JSON.stringify(facturas));
  localStorage.setItem('ajustes',JSON.stringify(ajustes));
}

// ================================
// Gestión Empresas y Clientes
// ================================
const listaEmpresas = document.getElementById('listaEmpresas');
const listaClientes = document.getElementById('listaClientes');

function actualizarListaEmpresas(){
  listaEmpresas.innerHTML='';
  empresas.forEach((e,index)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${e.nombre}</span>`;
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent='Eliminar';
    btnEliminar.className = 'btn-danger';
    btnEliminar.onclick = ()=>{
      if(confirm('¿Eliminar empresa?')){
        empresas.splice(index,1);
        guardarLocalStorage();
        actualizarListaEmpresas();
        actualizarSelectEmpresas();
      }
    };
    li.appendChild(btnEliminar);
    listaEmpresas.appendChild(li);
  });
  actualizarSelectEmpresas();
}

function actualizarListaClientes(){
  listaClientes.innerHTML='';
  clientes.forEach((c,index)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${c.nombre}</strong> (${c.email})</span>`;
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent='Eliminar';
    btnEliminar.className = 'btn-danger';
    btnEliminar.onclick = ()=>{
      if(confirm('¿Eliminar cliente?')){
        clientes.splice(index,1);
        guardarLocalStorage();
        actualizarListaClientes();
      }
    };
    li.appendChild(btnEliminar);
    listaClientes.appendChild(li);
  });
}

function actualizarSelectEmpresas(){
  const select = document.getElementById('empresaActiva');
  if(!select) return;
  select.innerHTML='';
  empresas.forEach((e,i)=>{
    const option = document.createElement('option');
    option.value=i;
    option.textContent=e.nombre;
    select.appendChild(option);
  });
}

// Botones añadir
document.getElementById('btnAddEmpresa').addEventListener('click',()=>{
  const nombre=prompt('Nombre de la empresa:');
  if(nombre) {
    empresas.push({nombre});
    guardarLocalStorage();
    actualizarListaEmpresas();
  }
});

document.getElementById('btnAddCliente').addEventListener('click',()=>{
  const nombre=prompt('Nombre del cliente:');
  const email=prompt('Email del cliente:');
  if(nombre) {
    clientes.push({nombre, email});
    guardarLocalStorage();
    actualizarListaClientes();
  }
});

// ================================
// Presupuestos
// ================================
const listaPresupuestos = document.getElementById('listaPresupuestos');

function actualizarListaPresupuestos(){
  listaPresupuestos.innerHTML='';
  presupuestos.forEach((p,index)=>{
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>#${p.numero}</strong> - ${clientes[p.cliente]?.nombre || 'S/C'} - ${p.total.toFixed(2)}€</div>`;
    
    const divBtns = document.createElement('div');

    // Botón Editar (Desde la lista)
    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.style.backgroundColor = '#ff9500';
    btnEditar.style.color = 'white';
    btnEditar.style.marginRight = '5px';
    btnEditar.onclick = () => abrirEdicionPresupuesto(index);

    // Botón Facturar
    const btnConvertir = document.createElement('button');
    btnConvertir.textContent = 'Facturar';
    btnConvertir.onclick = () => convertirAFactura(index);

    // Botón Eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'X';
    btnEliminar.className = 'btn-danger';
    btnEliminar.onclick = () => {
        if(confirm('¿Eliminar presupuesto?')){
            presupuestos.splice(index,1);
            guardarLocalStorage();
            actualizarListaPresupuestos();
        }
    };

    divBtns.appendChild(btnEditar);
    divBtns.appendChild(btnConvertir);
    divBtns.appendChild(btnEliminar);
    li.appendChild(divBtns); // ¡ESTO FALTABA!
    listaPresupuestos.appendChild(li); // ¡ESTO TAMBIÉN!
  });
}

// Función para editar presupuesto (Mejorada)
function abrirEdicionPresupuesto(index) {
    const p = presupuestos[index];
    const nuevoConcepto = prompt("Editar concepto:", p.lineas[0].concepto);
    const nuevaCant = parseFloat(prompt("Cantidad:", p.lineas[0].cantidad));
    const nuevoPrecio = parseFloat(prompt("Precio unitario:", p.lineas[0].precio));

    if (nuevoConcepto !== null && !isNaN(nuevaCant) && !isNaN(nuevoPrecio)) {
        p.lineas[0].concepto = nuevoConcepto;
        p.lineas[0].cantidad = nuevaCant;
        p.lineas[0].precio = nuevoPrecio;

        // Recalcular total
        const base = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio), 0);
        const ivaTotal = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio * l.iva / 100), 0);
        p.total = base + ivaTotal;

        guardarLocalStorage();
        actualizarListaPresupuestos();
        alert("Actualizado correctamente");
    }
}

document.getElementById('btnAddPresupuesto').addEventListener('click',()=>{
  const empresaIndex=document.getElementById('empresaActiva').value;
  if(empresaIndex===''){alert('Selecciona una empresa');return;}
  
  if(clientes.length === 0) { alert('Crea un cliente primero'); return; }
  const listaNombres = clientes.map((c, i) => `${i}: ${c.nombre}`).join('\n');
  const clienteIndex=prompt(`Índice del cliente:\n${listaNombres}`);
  
  if(!clientes[clienteIndex]){alert('Cliente no válido'); return;}
  
  const numero=presupuestos.length+1;
  const fecha=new Date().toISOString().split('T')[0];
  const lineas=[];
  let seguir=true;
  while(seguir){
    const concepto=prompt('Concepto:');
    const cantidad=parseFloat(prompt('Cantidad:', '1'));
    const precio=parseFloat(prompt('Precio unitario:'));
    const iva=parseInt(prompt('IVA %:', ajustes.ivaDefault));
    if(concepto && !isNaN(precio)) lineas.push({concepto,cantidad,precio,iva});
    seguir=confirm('¿Agregar otra línea?');
  }
  
  const base=lineas.reduce((sum,l)=>sum+l.cantidad*l.precio,0);
  const ivaTotal=lineas.reduce((sum,l)=>sum+l.cantidad*l.precio*l.iva/100,0);
  const total=base+ivaTotal;
  
  presupuestos.push({empresa:empresaIndex,cliente:clienteIndex,numero,fecha,lineas,total});
  guardarLocalStorage();
  actualizarListaPresupuestos();
});

// ================================
// Facturas y Exportación
// ================================
const listaFacturas = document.getElementById('listaFacturas');

function actualizarListaFacturas(){
  listaFacturas.innerHTML='';
  facturas.forEach((f,index)=>{
    const li=document.createElement('li');
    li.innerHTML = `<span>#${f.numero} - ${f.total.toFixed(2)}€</span>`;
    
    const btnExport=document.createElement('button');
    btnExport.textContent='PDF';
    btnExport.onclick = () => previsualizarFactura(f);
    
    const btnEliminar=document.createElement('button');
    btnEliminar.textContent='X';
    btnEliminar.className = 'btn-danger';
    btnEliminar.onclick = ()=>{
      if(confirm('¿Eliminar factura?')){
        facturas.splice(index,1);
        guardarLocalStorage();
        actualizarListaFacturas();
      }
    };
    
    li.appendChild(btnExport);
    li.appendChild(btnEliminar);
    listaFacturas.appendChild(li);
  });
}

function convertirAFactura(indexPresupuesto){
  const p=presupuestos[indexPresupuesto];
  let tipo=prompt('Pago: Transferencia, Bizum, Efectivo','Transferencia');
  let infoAdicional = (tipo?.toLowerCase() === 'transferencia') ? prompt('IBAN:') : prompt('Teléfono/Ref:');
  
  const f={...p, numero: facturas.length+1, formaPago: {tipo, infoAdicional}};
  facturas.push(f);
  guardarLocalStorage();
  actualizarListaFacturas();
  mostrarPantalla('pantallaFacturas');
}

function exportarPDF(f) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const empresa = empresas[f.empresa];
  const cliente = clientes[f.cliente];

  // --- Encabezado: Datos de la Empresa ---
  doc.setFontSize(18);
  doc.setTextColor(ajustes.colorPrincipal);
  doc.text(empresa.nombre.toUpperCase(), 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Datos de la Empresa", 14, 28);
  // Aquí podrías añadir más datos si los tuvieras (CIF, Dirección)

  // --- Datos del Cliente (A la derecha) ---
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text("CLIENTE:", 120, 20);
  doc.text(cliente.nombre, 120, 26);
  doc.text(cliente.email, 120, 32);

  // --- Info de Factura ---
  doc.setDrawColor(ajustes.colorPrincipal);
  doc.line(14, 45, 196, 45); // Línea divisoria
  doc.text(`Factura nº: ${f.numero}`, 14, 52);
  doc.text(`Fecha: ${f.fecha}`, 120, 52);

  // --- Tabla de Conceptos ---
  let y = 65;
  // Cabecera de tabla
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.text("Concepto", 16, y + 6);
  doc.text("Cant.", 100, y + 6);
  doc.text("P. Unit", 130, y + 6);
  doc.text("Total", 170, y + 6);
  doc.setFont(undefined, 'normal');

  y += 12;
  let subtotal = 0;
  let totalIVA = 0;

  f.lineas.forEach(l => {
    const lineaTotal = l.cantidad * l.precio;
    const ivaLinea = lineaTotal * (l.iva / 100);
    subtotal += lineaTotal;
    totalIVA += ivaLinea;

    doc.text(l.concepto, 16, y);
    doc.text(l.cantidad.toString(), 100, y);
    doc.text(`${l.precio.toFixed(2)}€`, 130, y);
    doc.text(`${lineaTotal.toFixed(2)}€`, 170, y);
    y += 8;
  });

  // --- Desglose Final ---
  y += 10;
  doc.line(130, y, 196, y);
  y += 10;
  doc.text("Subtotal (sin IVA):", 130, y);
  doc.text(`${subtotal.toFixed(2)}€`, 175, y);
  
  y += 8;
  doc.text("IVA Total:", 130, y);
  doc.text(`${totalIVA.toFixed(2)}€`, 175, y);
  
  y += 10;
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text("TOTAL FACTURA:", 130, y);
  doc.text(`${(subtotal + totalIVA).toFixed(2)}€`, 175, y);

  // --- Forma de Pago ---
  if(f.formaPago) {
    y += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text(`Forma de pago: ${f.formaPago.tipo} - ${f.formaPago.infoAdicional}`, 14, y);
  }

  doc.save(`Factura_${f.numero}_${cliente.nombre}.pdf`);
}

//Guardar ajustes
document.getElementById('btnGuardarAjustes').addEventListener('click', () => {
  ajustes.colorPrincipal = document.getElementById('ajusteColor').value;
  ajustes.tipoLetra = document.getElementById('ajusteTipoLetra').value;
  ajustes.tamanoLetra = document.getElementById('ajusteTamano').value;
  ajustes.ivaDefault = document.getElementById('ajusteIVA').value;
  guardarLocalStorage();
  aplicarAjustes();
  alert('Ajustes aplicados correctamente');
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  aplicarAjustes();
  actualizarListaEmpresas();
  actualizarListaClientes();
  actualizarListaPresupuestos();
  actualizarListaFacturas();
  mostrarPantalla('pantallaEmpresas');
});

// Variables para el modal
const modal = document.getElementById('modalPreview');
const closeBtn = document.querySelector('.close-modal');
let facturaParaExportar = null;

// Función para abrir la previsualización
function previsualizarFactura(f) {
  facturaParaExportar = f;
  const contenido = document.getElementById('previewContenido');
  
  // Calcular totales para la vista previa
  let subtotal = 0;
  let totalIVA = 0;
  const lineasHTML = f.lineas.map(l => {
    const totalLinea = l.cantidad * l.precio;
    subtotal += totalLinea;
    totalIVA += totalLinea * (l.iva / 100);
    return `<tr>
              <td>${l.concepto}</td>
              <td>${l.cantidad}</td>
              <td>${l.precio.toFixed(2)}€</td>
              <td>${totalLinea.toFixed(2)}€</td>
            </tr>`;
  }).join('');

  contenido.innerHTML = `
    <div style="border-bottom: 2px solid var(--primary-color); padding-bottom:10px; margin-bottom:10px;">
      <h3 style="color:var(--primary-color)">${empresas[f.empresa].nombre}</h3>
      <p><strong>Cliente:</strong> ${clientes[f.cliente].nombre}</p>
    </div>
    <table style="width:100%; text-align:left; font-size:0.9rem;">
      <thead>
        <tr style="background:#f4f4f4"><th>Concepto</th><th>Cant.</th><th>P.U.</th><th>Total</th></tr>
      </thead>
      <tbody>${lineasHTML}</tbody>
    </table>
    <div style="text-align:right; margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
      <p>Subtotal: ${subtotal.toFixed(2)}€</p>
      <p>IVA: ${totalIVA.toFixed(2)}€</p>
      <h4 style="color:var(--primary-color)">TOTAL: ${(subtotal + totalIVA).toFixed(2)}€</h4>
    </div>
  `;
  
  modal.style.display = "block";
}

// Cerrar modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Botón de confirmar dentro del modal
document.getElementById('btnConfirmarPDF').onclick = () => {
  if(facturaParaExportar) exportarPDF(facturaParaExportar);
  modal.style.display = "none";
};

// Variable para saber qué presupuesto estamos editando
let indiceEdicionActual = null;

// Configurar el botón de Editar dentro del Modal
document.getElementById('btnEditarPresupuesto').addEventListener('click', () => {
    const p = facturaParaExportar; // Usamos la referencia de la previsualización
    
    // 1. Preguntar por cambios básicos
    const nuevoNombre = prompt("Editar nombre del concepto principal o referencia:", p.lineas[0].concepto);
    if (nuevoNombre === null) return; // Cancelar si el usuario cierra el prompt

    // 2. Editar líneas (Simplificado para esta versión)
    // Podrías iterar sobre p.lineas si quieres editar todas, aquí editamos la primera como ejemplo
    const nuevaCant = parseFloat(prompt("Nueva cantidad:", p.lineas[0].cantidad));
    const nuevoPrecio = parseFloat(prompt("Nuevo precio unitario:", p.lineas[0].precio));

    if (!isNaN(nuevaCant) && !isNaN(nuevoPrecio)) {
        p.lineas[0].concepto = nuevoNombre;
        p.lineas[0].cantidad = nuevaCant;
        p.lineas[0].precio = nuevoPrecio;

        // 3. Recalcular Totales
        const base = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio), 0);
        const ivaTotal = p.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio * l.iva / 100), 0);
        p.total = base + ivaTotal;

        // 4. Guardar y Refrescar
        guardarLocalStorage();
        actualizarListaPresupuestos();
        actualizarListaFacturas();
        
        // 5. Actualizar la vista previa con los nuevos datos
        previsualizarFactura(p);
        alert("Presupuesto actualizado. Revisa la previsualización.");
    }
});

// ACTUALIZA TU FUNCIÓN actualizarListaFacturas para que el botón "PDF" llame a la previsualización
// Cambia la línea del botón PDF por:
// btnExport.onclick = () => previsualizarFactura(f);
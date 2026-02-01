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
    const li=document.createElement('li');
    li.innerHTML = `<div><strong>${p.numero}</strong> - ${clientes[p.cliente]?.nombre || 'S/C'} - ${p.total.toFixed(2)}€</div>`;
    
    const divBtns = document.createElement('div');
    const btnConvertir=document.createElement('button');
    btnConvertir.textContent='Facturar';
    btnConvertir.onclick = ()=>convertirAFactura(index);
    
    const btnEliminar=document.createElement('button');
    btnEliminar.textContent='X';
    btnEliminar.className = 'btn-danger';
    btnEliminar.onclick = ()=>{
      if(confirm('¿Eliminar presupuesto?')){
        presupuestos.splice(index,1);
        guardarLocalStorage();
        actualizarListaPresupuestos();
      }
    };
    
    divBtns.appendChild(btnConvertir);
    divBtns.appendChild(btnEliminar);
    li.appendChild(divBtns);
    listaPresupuestos.appendChild(li);
  });
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
    btnExport.onclick = ()=>exportarPDF(f);
    
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

function exportarPDF(f){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Factura nº ${f.numero}`, 10, 10);
  doc.text(`Empresa: ${empresas[f.empresa].nombre}`, 10, 20);
  doc.text(`Cliente: ${clientes[f.cliente].nombre}`, 10, 30);
  doc.text(`Total: ${f.total.toFixed(2)} €`, 10, 40);
  doc.save(`Factura_${f.numero}.pdf`);
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
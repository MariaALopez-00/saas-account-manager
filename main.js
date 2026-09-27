// =========================================================
// ServiciosMAX — Lógica del frontend
// Todo el código está comentado en español.
// Se usa fetch + async/await para comunicarse con la API.
// =========================================================

// URL base de la API (sin barra final)
const URL_BASE = "https://localhost:7259"; // cambiar aquí si la API corre en otro host/puerto

// Guardamos en memoria la última lista de contratos consultada,
// para poder mostrar el nombre del tipo de contrato en las tablas
// sin tener que volver a llamar a la API cada vez.
let contratosDisponibles = []; // se llena en cargarListaContratos()

// -------------------------------------------------------------------
// Referencias a elementos del DOM (se obtienen una sola vez al cargar)
// -------------------------------------------------------------------

// Sección 1: Registrar empresa
const formRegistrarEmpresa = document.getElementById("form-registrar-empresa");
const inputNombreEmpresa = document.getElementById("input-nombre-empresa");
const inputNitEmpresa = document.getElementById("input-nit-empresa");
const botonGuardarEmpresa = document.getElementById("boton-guardar-empresa");
const mensajeRegistrarEmpresa = document.getElementById("mensaje-registrar-empresa");

// Sección 2: Listar empresas
const botonActualizarLista = document.getElementById("boton-actualizar-lista");
const mensajeListarEmpresas = document.getElementById("mensaje-listar-empresas");
const cuerpoTablaEmpresas = document.getElementById("cuerpo-tabla-empresas"); // <tbody> donde se dibujan las filas

// Sección 3: Asignar contrato
const formAsignarContrato = document.getElementById("form-asignar-contrato");
const selectEmpresa = document.getElementById("select-empresa"); // <select> de empresas
const selectContrato = document.getElementById("select-contrato"); // <select> de contratos
const inputFechaInicio = document.getElementById("input-fecha-inicio");
const botonAsignarContrato = document.getElementById("boton-asignar-contrato");
const mensajeAsignarContrato = document.getElementById("mensaje-asignar-contrato");

// Sección 4: Calcular pagos del mes
const botonCalcularPagos = document.getElementById("boton-calcular-pagos");
const mensajeCalcularPagos = document.getElementById("mensaje-calcular-pagos");
const totalPagosContenedor = document.getElementById("total-pagos-contenedor"); // caja que envuelve el total
const totalPagosMonto = document.getElementById("total-pagos-monto"); // texto grande con el total
const cuerpoTablaDesglose = document.getElementById("cuerpo-tabla-desglose"); // <tbody> del desglose

// =========================================================
// Función auxiliar: mostrar mensajes en el DOM
// (nunca usamos alert() ni prompt())
// =========================================================
function mostrarMensaje(elementoDestino, texto, tipo) {
  // tipo puede ser "exito", "error" o vacío (mensaje neutro)
  elementoDestino.textContent = texto;
  elementoDestino.className = "area-mensaje"; // reinicia clases previas (exito/error)
  if (tipo) {
    elementoDestino.classList.add(tipo); // agrega "exito" o "error" para el color del CSS
  }
}

// Formatea un número como moneda con dos decimales (ej: Q1,250.00)
function formatearMonto(numero) {
  const valor = Number(numero) || 0; // si numero no es válido, usamos 0
  return "Q" + valor.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// =========================================================
// API 1 — Registrar empresa
// POST /api/empresas/registrar
// =========================================================
async function registrarEmpresa(nombre, nit) {
  const respuesta = await fetch(URL_BASE + "/api/empresas/registrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // le indica al backend que el body es JSON
    body: JSON.stringify({ nombre: nombre, nit: nit }) // convierte el objeto a texto JSON
  });

  if (!respuesta.ok) { // respuesta.ok es false si el estado HTTP es 4xx o 5xx
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json(); // convierte el body de la respuesta a objeto JS
}

// =========================================================
// API 2 — Listar empresas
// GET /api/empresas/listar
// =========================================================
async function listarEmpresas() {
  const respuesta = await fetch(URL_BASE + "/api/empresas/listar", {
    method: "GET"
  });

  if (!respuesta.ok) {
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json(); // arreglo de empresas
}

// =========================================================
// API 3 — Listar contratos
// GET /api/contratos/listar
// =========================================================
async function listarContratos() {
  const respuesta = await fetch(URL_BASE + "/api/contratos/listar", {
    method: "GET"
  });

  if (!respuesta.ok) {
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json(); // arreglo de los 5 contratos fijos
}

// =========================================================
// API 4 — Asignar contrato
// POST /api/empresas/asignar-contrato
// =========================================================
async function asignarContratoApi(empresaId, contratoId, fechaInicio) {
  const respuesta = await fetch(URL_BASE + "/api/empresas/asignar-contrato", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      empresaId: empresaId, // id numérico de la empresa
      contratoId: contratoId, // id numérico del contrato (1 a 5)
      fechaInicio: fechaInicio // string en formato YYYY-MM-DD
    })
  });

  if (!respuesta.ok) {
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json();
}

// =========================================================
// API 5 — Calcular pago de una empresa
// GET /api/pagos/calcular/{empresaId}
// =========================================================
async function calcularPagoEmpresa(empresaId) {
  const respuesta = await fetch(URL_BASE + "/api/pagos/calcular/" + empresaId, { // el id va en la URL, no en el body
    method: "GET"
  });

  if (!respuesta.ok) {
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json();
}

// =========================================================
// API 6 — Marcar pago único como cobrado
// POST /api/pagos/marcar-cobrado/{empresaId}
// =========================================================
async function marcarPagoCobrado(empresaId) {
  const respuesta = await fetch(URL_BASE + "/api/pagos/marcar-cobrado/" + empresaId, {
    method: "POST" // no lleva body, el id ya va en la URL
  });

  if (!respuesta.ok) {
    throw new Error("La API respondió con estado " + respuesta.status);
  }

  return await respuesta.json();
}

// =========================================================
// SECCIÓN 1: Manejo del formulario "Registrar empresa"
// =========================================================
formRegistrarEmpresa.addEventListener("submit", async function (evento) {
  // Evitamos que el formulario recargue la página
  evento.preventDefault();

  const nombre = inputNombreEmpresa.value.trim(); // quitamos espacios sobrantes
  const nit = inputNitEmpresa.value.trim();

  if (!nombre || !nit) { // validación mínima antes de llamar a la API
    mostrarMensaje(mensajeRegistrarEmpresa, "Debe ingresar nombre y NIT.", "error");
    return;
  }

  // Deshabilitamos el botón mientras esperamos la respuesta, para evitar doble clic
  botonGuardarEmpresa.disabled = true;
  mostrarMensaje(mensajeRegistrarEmpresa, "Guardando empresa...", "");

  try {
    const resultado = await registrarEmpresa(nombre, nit);

    if (resultado.exito) {
      mostrarMensaje(mensajeRegistrarEmpresa, resultado.mensaje || "Empresa guardada correctamente.", "exito");
      formRegistrarEmpresa.reset(); // limpia los campos del formulario

      // Refrescamos la lista de empresas y los desplegables para que la nueva empresa aparezca
      await cargarListaEmpresas();
    } else {
      mostrarMensaje(mensajeRegistrarEmpresa, resultado.mensaje || "No se pudo guardar la empresa.", "error");
    }
  } catch (error) {
    // Error de red o de conexión con la API
    mostrarMensaje(mensajeRegistrarEmpresa, "Error de conexión con el servidor: " + error.message, "error");
  } finally {
    // Volvemos a habilitar el botón sin importar el resultado
    botonGuardarEmpresa.disabled = false;
  }
});

// =========================================================
// SECCIÓN 2: Cargar y mostrar la lista de empresas en la tabla
// =========================================================
async function cargarListaEmpresas() {
  botonActualizarLista.disabled = true; // evita clics repetidos mientras carga
  mostrarMensaje(mensajeListarEmpresas, "Cargando empresas...", "");

  try {
    const empresas = await listarEmpresas();

    // Limpiamos la tabla antes de volver a dibujarla
    cuerpoTablaEmpresas.innerHTML = "";

    if (!empresas || empresas.length === 0) {
      // Caso: no hay empresas registradas todavía
      const fila = document.createElement("tr");
      fila.innerHTML = '<td colspan="5">No hay empresas registradas.</td>';
      cuerpoTablaEmpresas.appendChild(fila);
    } else {
      empresas.forEach(function (empresa) {
        const fila = document.createElement("tr");

        // Si la empresa no tiene contrato asignado, tipoContrato llega como null
        const textoTipoContrato = empresa.tipoContrato ? empresa.tipoContrato : "Sin contrato asignado";
        const textoPagoUnico = empresa.pagoUnicoCobrado ? "Sí" : "No";

        fila.innerHTML =
          "<td>" + empresa.id + "</td>" +
          "<td>" + empresa.nombre + "</td>" +
          "<td>" + empresa.nit + "</td>" +
          "<td>" + textoTipoContrato + "</td>" +
          "<td>" + textoPagoUnico + "</td>";

        cuerpoTablaEmpresas.appendChild(fila);
      });
    }

    mostrarMensaje(mensajeListarEmpresas, "", "");

    // También refrescamos el desplegable de empresas de la sección 3
    llenarSelectEmpresas(empresas);
  } catch (error) {
    mostrarMensaje(mensajeListarEmpresas, "Error al cargar la lista de empresas: " + error.message, "error");
  } finally {
    botonActualizarLista.disabled = false;
  }
}

botonActualizarLista.addEventListener("click", cargarListaEmpresas);

// =========================================================
// SECCIÓN 3: Cargar contratos y empresas en los desplegables
// =========================================================

// Llena el <select> de empresas con la lista recibida de la API 2
function llenarSelectEmpresas(empresas) {
  selectEmpresa.innerHTML = '<option value="">-- Seleccione una empresa --</option>'; // reinicia el select

  if (!empresas || empresas.length === 0) {
    return; // no hay nada más que agregar
  }

  empresas.forEach(function (empresa) {
    const opcion = document.createElement("option");
    opcion.value = empresa.id; // value = id de la empresa
    opcion.textContent = empresa.nombre + " (" + empresa.nit + ")"; // texto visible al usuario
    selectEmpresa.appendChild(opcion);
  });
}

// Llena el <select> de contratos con la lista recibida de la API 3
function llenarSelectContratos(contratos) {
  selectContrato.innerHTML = '<option value="">-- Seleccione un contrato --</option>';

  contratos.forEach(function (contrato) {
    const opcion = document.createElement("option");
    // El value siempre es el id del contrato, tal como pide el requerimiento
    opcion.value = contrato.id;
    opcion.textContent = contrato.nombre;
    selectContrato.appendChild(opcion);
  });
}

async function cargarListaContratos() {
  try {
    contratosDisponibles = await listarContratos(); // guardado en memoria por si se necesita luego
    llenarSelectContratos(contratosDisponibles);
  } catch (error) {
    mostrarMensaje(mensajeAsignarContrato, "Error al cargar los contratos: " + error.message, "error");
  }
}

// Manejo del formulario "Asignar contrato"
formAsignarContrato.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const empresaId = selectEmpresa.value;
  const contratoId = selectContrato.value;
  const fechaInicio = inputFechaInicio.value; // ya viene en formato YYYY-MM-DD por el input type="date"

  if (!empresaId || !contratoId || !fechaInicio) {
    mostrarMensaje(mensajeAsignarContrato, "Debe seleccionar empresa, contrato y fecha de inicio.", "error");
    return;
  }

  botonAsignarContrato.disabled = true;
  mostrarMensaje(mensajeAsignarContrato, "Asignando contrato...", "");

  try {
    const resultado = await asignarContratoApi(Number(empresaId), Number(contratoId), fechaInicio); // convertimos los ids de texto a número

    if (resultado.exito) {
      mostrarMensaje(mensajeAsignarContrato, resultado.mensaje || "Contrato asignado correctamente.", "exito");
      formAsignarContrato.reset();

      // Refrescamos la tabla de empresas para que se vea el nuevo tipo de contrato
      await cargarListaEmpresas();
    } else {
      mostrarMensaje(mensajeAsignarContrato, resultado.mensaje || "No se pudo asignar el contrato.", "error");
    }
  } catch (error) {
    mostrarMensaje(mensajeAsignarContrato, "Error de conexión con el servidor: " + error.message, "error");
  } finally {
    botonAsignarContrato.disabled = false;
  }
});

// =========================================================
// SECCIÓN 4: Calcular pagos del mes
// =========================================================

// Dibuja (o vuelve a dibujar) una sola fila del desglose de pagos.
// Recibe el resultado de la API 5 para una empresa específica.
function crearFilaDesglose(datosPago) {
  const fila = document.createElement("tr");
  // Guardamos el id de la empresa en la fila para poder ubicarla después
  fila.dataset.empresaId = datosPago.empresaId; // queda como atributo data-empresa-id en el <tr>

  const celdaEmpresa = document.createElement("td");
  celdaEmpresa.textContent = datosPago.nombreEmpresa;

  const celdaTipoContrato = document.createElement("td");
  celdaTipoContrato.textContent = datosPago.tipoContrato || "Sin contrato asignado";

  const celdaMonto = document.createElement("td");
  celdaMonto.textContent = formatearMonto(datosPago.montoPago);
  celdaMonto.className = "celda-monto";

  const celdaAccion = document.createElement("td");

  // El botón "Marcar como cobrado" solo aparece si es pago único y aún no se ha cobrado
  if (datosPago.esPagoUnico === true && datosPago.yaCobrado === false) {
    const botonMarcarCobrado = document.createElement("button");
    botonMarcarCobrado.type = "button"; // evita que actúe como submit si estuviera dentro de un form
    botonMarcarCobrado.textContent = "Marcar como cobrado";
    botonMarcarCobrado.className = "boton-secundario";
    botonMarcarCobrado.addEventListener("click", function () {
      manejarMarcarComoCobrado(datosPago.empresaId, botonMarcarCobrado); // le pasamos el botón para poder deshabilitarlo
    });
    celdaAccion.appendChild(botonMarcarCobrado);
  }
  // Si no cumple la condición, la celda de acción queda vacía

  fila.appendChild(celdaEmpresa);
  fila.appendChild(celdaTipoContrato);
  fila.appendChild(celdaMonto);
  fila.appendChild(celdaAccion);

  return fila;
}

// Botón principal: recorre todas las empresas, calcula el pago de cada una
// y acumula el total. Esta suma se hace en el frontend, no en el backend.
botonCalcularPagos.addEventListener("click", async function () {
  botonCalcularPagos.disabled = true;
  mostrarMensaje(mensajeCalcularPagos, "Calculando pagos del mes...", "");
  totalPagosContenedor.classList.add("oculto"); // ocultamos el total mientras se recalcula
  cuerpoTablaDesglose.innerHTML = ""; // limpiamos el desglose anterior

  try {
    // Paso 1: pedir la lista de empresas (API 2)
    const empresas = await listarEmpresas();

    if (!empresas || empresas.length === 0) {
      mostrarMensaje(mensajeCalcularPagos, "No hay empresas registradas para calcular pagos.", "");
      return;
    }

    let totalAcumulado = 0; // aquí se suma el monto de todas las empresas
    const desglose = []; // aquí se guarda el resultado de cada empresa

    // Paso 2: recorrer el arreglo de empresas con un bucle
    for (let indice = 0; indice < empresas.length; indice++) {
      const empresa = empresas[indice];

      // Si la empresa no tiene contrato asignado, no tiene sentido pedir su pago
      if (!empresa.tipoContrato) {
        continue; // pasa a la siguiente empresa del bucle
      }

      // Paso 3: llamar a la API 5 con el empresaId de cada empresa
      const datosPago = await calcularPagoEmpresa(empresa.id);

      // Paso 4: acumular el monto en la variable total
      totalAcumulado += Number(datosPago.montoPago) || 0;

      // Paso 5: guardar el resultado en el arreglo de desglose
      desglose.push(datosPago);
    }

    // Paso 6: mostrar el total acumulado
    totalPagosMonto.textContent = formatearMonto(totalAcumulado);
    totalPagosContenedor.classList.remove("oculto"); // ahora sí se muestra el total

    // Paso 7: dibujar la tabla de desglose
    if (desglose.length === 0) {
      const fila = document.createElement("tr");
      fila.innerHTML = '<td colspan="4">Ninguna empresa tiene contrato asignado todavía.</td>';
      cuerpoTablaDesglose.appendChild(fila);
    } else {
      desglose.forEach(function (datosPago) {
        cuerpoTablaDesglose.appendChild(crearFilaDesglose(datosPago));
      });
    }

    mostrarMensaje(mensajeCalcularPagos, "", "");
  } catch (error) {
    mostrarMensaje(mensajeCalcularPagos, "Error al calcular los pagos del mes: " + error.message, "error");
  } finally {
    botonCalcularPagos.disabled = false;
  }
});

// Maneja el clic en "Marcar como cobrado" para una fila específica del desglose
async function manejarMarcarComoCobrado(empresaId, boton) {
  boton.disabled = true; // evita doble clic mientras se procesa

  try {
    // Paso 1: llamar a la API 6 para marcar el pago como cobrado
    const resultado = await marcarPagoCobrado(empresaId);

    if (!resultado.exito) {
      mostrarMensaje(mensajeCalcularPagos, resultado.mensaje || "No se pudo marcar el pago como cobrado.", "error");
      boton.disabled = false; // lo volvemos a habilitar porque no se completó la acción
      return;
    }

    // Paso 2: volver a llamar a la API 5 para esa empresa y obtener el monto actualizado
    const datosPagoActualizado = await calcularPagoEmpresa(empresaId);

    // Paso 3: ubicar la fila correspondiente en la tabla y reemplazarla
    const filaExistente = cuerpoTablaDesglose.querySelector('tr[data-empresa-id="' + empresaId + '"]');
    if (filaExistente) {
      const filaNueva = crearFilaDesglose(datosPagoActualizado); // ya sin botón, porque yaCobrado ahora es true
      filaExistente.replaceWith(filaNueva);
    }

    mostrarMensaje(mensajeCalcularPagos, "Pago marcado como cobrado correctamente.", "exito");
  } catch (error) {
    mostrarMensaje(mensajeCalcularPagos, "Error al marcar el pago como cobrado: " + error.message, "error");
    boton.disabled = false;
  }
}

// =========================================================
// Carga inicial: al abrir la página se llenan las tablas y los
// desplegables automáticamente.
// =========================================================
document.addEventListener("DOMContentLoaded", function () {
  cargarListaEmpresas(); // llena la tabla de la sección 2 y el select de empresas
  cargarListaContratos(); // llena el select de contratos
});

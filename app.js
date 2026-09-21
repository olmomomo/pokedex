/* ============================================
   POKÉDEX — LÓGICA DE LA APLICACIÓN (JavaScript Vanilla)
   
   Este archivo contiene toda la lógica para:
   1. Capturar el evento de búsqueda del formulario
   2. Hacer la petición HTTP a la PokéAPI
   3. Manejar errores de forma amigable
   4. Extraer los datos del JSON de respuesta
   5. Pintar dinámicamente la tarjeta del Pokémon en el DOM
   ============================================ */

// ============================================
// PASO 1: SELECCIONAR ELEMENTOS DEL DOM
// Usamos document.getElementById() para obtener
// referencias a los elementos HTML que vamos a manipular.
// ============================================

const searchForm    = document.getElementById('search-form');     // El formulario de búsqueda
const pokemonInput  = document.getElementById('pokemon-input');   // El campo de texto (input)
const pokemonCard   = document.getElementById('pokemon-card');    // El contenedor de la tarjeta
const errorMessage  = document.getElementById('error-message');   // El contenedor de errores

// URL base de la PokéAPI para buscar Pokémon
const API_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';

// ============================================
// PASO 2: ESCUCHAR EL EVENTO DE ENVÍO DEL FORMULARIO
// Cuando el usuario hace clic en "Buscar" o presiona Enter,
// se ejecuta esta función.
// ============================================

searchForm.addEventListener('submit', async function (event) {
  // Prevenir que el formulario recargue la página (comportamiento por defecto)
  event.preventDefault();

  // Leer el valor del input, quitar espacios en blanco y convertir a minúsculas
  // Esto evita errores porque la API espera nombres en minúsculas
  const query = pokemonInput.value.trim().toLowerCase();

  // Validar que el campo no esté vacío
  if (!query) {
    showError('Por favor, ingresa el nombre o ID de un Pokémon.');
    return; // Detenemos la ejecución aquí
  }

  // Limpiar mensajes anteriores antes de hacer una nueva búsqueda
  clearMessages();

  // Mostrar el spinner de carga mientras esperamos la respuesta
  showLoading();

  // Llamar a la función que hace la petición a la API
  await fetchPokemon(query);
});

// ============================================
// PASO 3: FUNCIÓN PARA BUSCAR UN POKÉMON EN LA API
// Usa fetch() para hacer una petición HTTP GET asíncrona.
// ============================================

async function fetchPokemon(query) {
  try {
    // Construir la URL completa: base + nombre o ID del Pokémon
    // Ejemplo: https://pokeapi.co/api/v2/pokemon/pikachu
    const response = await fetch(API_BASE_URL + query);

    // Verificar si la respuesta fue exitosa (código 200-299)
    // Si el Pokémon no existe, la API devuelve un código 404
    if (!response.ok) {
      // Mostrar un mensaje amigable dependiendo del código de error
      if (response.status === 404) {
        showError(`No se encontró ningún Pokémon con "${query}". Verifica el nombre o ID.`);
      } else {
        showError(`Error del servidor (código ${response.status}). Intenta de nuevo.`);
      }
      return; // Detenemos la ejecución
    }

    // Convertir la respuesta a un objeto JavaScript (parsear el JSON)
    const data = await response.json();

    // Llamar a la función que pinta la tarjeta con los datos obtenidos
    renderPokemon(data);

  } catch (error) {
    // Este bloque se ejecuta si hay un error de RED (sin internet, timeout, etc.)
    // No confundir con un error 404 — aquí la petición ni siquiera se completó
    console.error('Error de red:', error);
    showError('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
  }
}

// ============================================
// PASO 4: FUNCIÓN PARA PINTAR LA TARJETA DEL POKÉMON
// Recibe el objeto JSON de la API y extrae los datos
// necesarios para construir el HTML de la tarjeta.
// ============================================

function renderPokemon(data) {
  // --- Extraer datos del objeto JSON ---

  // Nombre del Pokémon (ej: "pikachu")
  const name = data.name;

  // ID del Pokémon (ej: 25)
  // Lo formateamos con ceros a la izquierda: 25 → "#025"
  const id = data.id;
  const formattedId = '#' + String(id).padStart(3, '0');

  // Peso del Pokémon (la API lo devuelve en hectogramos, lo convertimos a kg)
  const weight = data.weight; // Ej: 60 (hectogramos)
  const weightKg = (weight / 10).toFixed(1); // 60 → 6.0 kg

  // Imagen (sprite) frontal del Pokémon
  // Se encuentra en: data.sprites.front_default
  const spriteUrl = data.sprites.front_default;

  // Tipos del Pokémon (puede tener 1 o 2 tipos)
  // Se encuentra en: data.types (es un array de objetos)
  const types = data.types;

  // --- Construir el HTML de los badges de tipo ---
  // Recorremos el array de tipos y creamos un badge por cada uno
  const typeBadgesHtml = types.map(function (typeObj) {
    // Cada elemento del array tiene la estructura: { slot: 1, type: { name: "electric", url: "..." } }
    const typeName = typeObj.type.name;
    return `<span class="type-badge type-${typeName}">${typeName}</span>`;
  }).join(''); // Unimos todos los badges en un solo string

  // --- Construir el HTML completo de la tarjeta ---
  // Usamos template literals (backticks) para insertar variables fácilmente
  const cardHtml = `
    <div class="card-inner">
      <!-- Imagen del Pokémon -->
      <div class="sprite-container">
        <img
          src="${spriteUrl}"
          alt="Sprite de ${name}"
          loading="lazy"
        >
      </div>

      <!-- ID formateado -->
      <span class="pokemon-id">${formattedId}</span>

      <!-- Nombre del Pokémon (capitalize se aplica con CSS) -->
      <h2 class="pokemon-name">${name}</h2>

      <!-- Línea decorativa separadora -->
      <div class="divider"></div>

      <!-- Badges de tipo -->
      <div class="pokemon-types">
        ${typeBadgesHtml}
      </div>

      <!-- Detalles: peso -->
      <div class="pokemon-details">
        <div class="detail-chip">
          Peso: <span class="label">${weightKg} kg</span>
        </div>
      </div>
    </div>
  `;

  // --- Insertar el HTML en el contenedor de la tarjeta ---
  // innerHTML reemplaza todo el contenido anterior del div
  pokemonCard.innerHTML = cardHtml;
}

// ============================================
// PASO 5: FUNCIONES AUXILIARES
// Funciones de ayuda para mostrar/ocultar mensajes.
// ============================================

/**
 * Muestra un mensaje de error en pantalla.
 * @param {string} message - El texto del mensaje a mostrar.
 */
function showError(message) {
  // Limpiar la tarjeta del Pokémon si había una
  pokemonCard.innerHTML = '';

  // Insertar el texto del error en el contenedor
  errorMessage.textContent = message;

  // Agregar la clase "visible" para que se muestre con animación
  errorMessage.classList.add('visible');
}

/**
 * Muestra un spinner de carga mientras se espera la respuesta de la API.
 */
function showLoading() {
  // Limpiar la tarjeta anterior y mostrar un spinner
  pokemonCard.innerHTML = '<div class="loading-spinner"></div>';
}

/**
 * Limpia todos los mensajes (error y tarjeta).
 * Se llama antes de cada nueva búsqueda.
 */
function clearMessages() {
  // Ocultar el mensaje de error quitando la clase "visible"
  errorMessage.classList.remove('visible');
  errorMessage.textContent = '';
}

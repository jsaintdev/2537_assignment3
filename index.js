const page_size = 10
const numPageBtn = 5;
let currentPage = 1;
let pokemons = [];
let types = [];
let selectedTypes = [];

const pokeTypes = async() => {
  const res = await axios.get('https://pokeapi.co/api/v2/type');
  types = res.data.results;

  types.forEach((type) => {
    $('#pokeTypes').append(`
      <div class="form-check">
        <input class="form-check-input typeCheckbox" type="checkbox" value="${type.name}" id="type-${type.name}">
        <label class="form-check-label" for="type-${type.name}">
        ${type.name}
        </label>
      </div>
    `);
  });
}

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty()

  var startPage = Math.max(1, currentPage-Math.floor(numPageBtn/2));
  var endPage = Math.min(numPages, currentPage+Math.floor(numPageBtn/2));

  if (currentPage > 1) {
    $('#pagination').append(`
        <button class="btn btn-primary page ml-1 numberedButtons" id="pagefirst" value="1">First</button>
    `);
    $('#pagination').append(`
        <button class="btn btn-primary page ml-1 numberedButtons" id="pageprev" value="${currentPage-1}">Prev</button>
    `);
  }

  if (currentPage < 3) {
    startPage = 1;
    endPage = 5;
  } else if (currentPage >= (numPages - 1)) {
    startPage = numPages - 4;
    endPage = numPages;
  }

  for (let i = startPage; i <= endPage; i++) {
    var active = "";
    if (i == currentPage) {
      active = "active";
    }
    $('#pagination').append(`
    <button class="btn btn-primary page ${active} ml-1 numberedButtons" value="${i}">${i}</button>
    `)
  }

  if (currentPage < numPages) {
    $('#pagination').append(`
        <button class="btn btn-primary page ml-1 numberedButtons" id="pagenext" value="${currentPage+1}">Next</button>
    `);
    $('#pagination').append(`
        <button class="btn btn-primary page ml-1 numberedButtons" id="pagelast" value="${numPages}">Last</button>
    `);
  }
}

const paginate = async (currentPage, page_size, pokemons) => {
  const filteredPokemons = await Promise.all(pokemons.map(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    const pokemonTypes = res.data.types.map((type) => type.type.name);
    return selectedTypes.every((type) => pokemonTypes.includes(type)) ? pokemon : null;
  }));

  const typedPokemons = filteredPokemons.filter(pokemon => pokemon !== null);
  selected_pokemons = typedPokemons.slice((currentPage - 1) * page_size, currentPage * page_size)

  $('#pokeCardsHeader').empty()
  $('#pokeCardsHeader').append(`
      <h3>Showing ${selected_pokemons.length} of ${typedPokemons.length} Pokémon</h3>
  `);

  $('#pokeCards').empty()
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url)
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}  >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
        </div>  
        `);
  });

  const numPages = Math.ceil(typedPokemons.length / page_size);
  updatePaginationDiv(currentPage, numPages);
}

const setup = async () => {
  // test out poke api using axios here


  $('#pokeCards').empty()
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  paginate(currentPage, page_size, pokemons)
  const numPages = Math.ceil(pokemons.length / page_size)
  updatePaginationDiv(currentPage, numPages)

  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name)
    // console.log("types: ", types);
    $('.modal-body').html(`
          <div style="width:200px">
          <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
          <div>
          <h3>Abilities</h3>
          <ul>
          ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
          </div>
  
          <div>
          <h3>Stats</h3>
          <ul>
          ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
  
          </div>
  
          </div>
            <h3>Types</h3>
            <ul>
            ${types.map((type) => `<li>${type}</li>`).join('')}
            </ul>
        
          `)
    $('.modal-title').html(`
          <h2>${res.data.name.toUpperCase()}</h2>
          <h5>Pokedex Number: ${res.data.id}</h5>
          `)
  })

  // add event listener to pagination buttons
  $('body').on('click', ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, page_size, pokemons)
    updatePaginationDiv(currentPage, numPages)
  })

  // add event listener to type checkboxes
  $('body').on('change', '.typeCheckbox', function () {
    const type = $(this).val();

    if ($(this).is(':checked')) {
      selectedTypes.push(type);
    } else {
      selectedTypes = selectedTypes.filter((t) => t !== type);
    }

    paginate(currentPage, page_size, pokemons);
  });


}

$(document).ready(async () => {
  await setup();
  pokeTypes();
});
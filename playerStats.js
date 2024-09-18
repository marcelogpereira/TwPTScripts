const nameElement = document.querySelector('h2') || document.querySelector('.mobileKeyValue h3');
let namePlayer = nameElement.innerText.trim().includes('Edit') ? game_data.player.name : nameElement.outerText.trim();
const result = nameElement.tagName == 'H2' ? nameElement : document.querySelector('.menu');

const translateScript = {
  pt_BR: {
    'kill_att': 'Como atacante',
    'kill_def': 'Como defensor',
    'kill_sup': 'Como apoiante',
    'loot_res': 'Recursos saqueados',
    'loot_vil': 'Aldeias saqueadas',
    'scavenge': 'Recursos coletados',
    'conquer': 'Aldeias conquistadas'
  },
  en_DK: {
    'kill_att': 'Attacker',
    'kill_def': 'Defender',
    'kill_sup': 'Supporting',
    'loot_res': 'Farmed resources',
    'loot_vil': 'Farmed villages',
    'scavenge': 'Collected resources',
    'conquer': 'Conquered villages'
  },
};

const linkBase = `/guest.php?screen=ranking&mode=in_a_day&type=`;
const types = ['kill_att', 'kill_def', 'kill_sup', 'loot_res', 'loot_vil', 'scavenge', 'conquer'];

async function fetchRanking(type) {
  const url = `${linkBase}${type}&name=${namePlayer}`;
  const response = await fetch(url);
  const data = await response.text();
  return new DOMParser().parseFromString(data, "text/html");
}

async function runAll() {
  const [attack, deff, support, farming, villages, scavenge, conquer] = await Promise.all(types.map((type, index) => {
    return new Promise(resolve => setTimeout(() => resolve(fetchRanking(type)), index * 200));
  }));
  return [attack.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          deff.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          support.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          farming.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          villages.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          scavenge.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML,
          conquer.querySelector("#in_a_day_ranking_table > tbody > tr:nth-child(2)").innerHTML];
}

async function createInterface() {
  const dailyValues = await runAll();
  const rankingTable = `
    <div class="rankingSmart">
      <table>
        ${types.map((type, index) => `
          <tr>
            <th class="typeRanking">${translate(type)}</th>
            <td>${dailyValues[index]}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  result.innerHTML += rankingTable;
  document.querySelector('.menu').style.display = ''
}

createInterface();

function translate(string){
    const gameLocation = game_data.locale
    console.log(string);
    if (translateScript[gameLocation] !== undefined) {
        return translateScript[gameLocation][string];
    } else {
        return translateScript['pt_BR'][string];
    }
}

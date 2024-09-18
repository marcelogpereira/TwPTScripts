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
    <div class="vis" style="margin-top: 20px; width: 100%;">
      <table class="vis" style="width: 100%; text-align: left; border-spacing: 2px;">
        <thead>
          <tr>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('kill_att')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('kill_def')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('kill_sup')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('loot_res')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('loot_vil')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('scavenge')}</th>
            <th style="background-color: #dfcca6; padding: 5px;">${translate('conquer')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            ${dailyValues.map(value => `<td style="background-color: #f4e4bc; padding: 5px;">${value}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
  result.innerHTML += rankingTable;
  document.querySelector('.menu').style.display = ''
}

createInterface();

function translate(string){
    const gameLocation = game_data.locale
    if (translateScript[gameLocation] !== undefined) {
        return translateScript[gameLocation][string];
    } else {
        return translateScript['pt_BR'][string];
    }
}

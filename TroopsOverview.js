 if (typeof villagesTroopsCounter !== 'undefined') {
    villagesTroopsCounter.init();
 } else {
 class VillagesTroopsCounter {
    static VillagesTroopsCounterTranslations() {
        return {
            en_US: {
                title: 'Home and Scavenging Troops Counter',
                home: 'Home',
                support: 'Support',
				scavenging: 'Scavenging',
				total: 'Total',
                errorMessages: {
                    premiumRequired: 'Error. A premium account is required to run this script!',
                    errorFetching: 'An error occured while trying to fetch the following URL:',
                    missingSavengeMassScreenElement: 'An error occurred trying to located the ScavengeMassScreen element inside the mass scavenge page.'
                },
                successMessage: 'Loaded successfully!',
                loadingMessage: 'Loading...',
                credits: 'Troops overview by AlbertoPipi (based on NunoF- script)'
            },
            pt_PT: {
                title: 'Contador de tropas em casa e em buscas',
                home: 'Em casa',
                support: 'Apoio',
				scavenging: 'Em busca',
				total: 'Total',
                errorMessages: {
                    premiumRequired: 'Erro. É necessário possuir conta premium para correr este script!',
                    errorFetching: 'Ocorreu um erro ao tentar carregar o seguinte URL:',
                    missingSavengeMassScreenElement: 'Ocorreu um erro ao tentar localizar o elemento ScavengeMassScreen dentro da página de buscas em massa.'
                },
                successMessage: 'Carregado com sucesso!',
                loadingMessage: 'A carregar...',
                credits: 'Visão geral de tropas por AlbertoPipi (baseado no script de NunoF-)'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in VillagesTroopsCounter.VillagesTroopsCounterTranslations() ? this.UserTranslation = VillagesTroopsCounter.VillagesTroopsCounterTranslations()[game_data.locale] : VillagesTroopsCounter.VillagesTroopsCounterTranslations().en_US;
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits = Object.getPrototypeOf(this.availableSupportUnits);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
    }

    init() {
        if (!game_data.features.Premium.active) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.premiumRequired);
            return;
        }
        this.#createUI();
    }

    #generateUrl(screen, mode = null, extraParams = {}) {
        var url = `/game.php?village=${game_data.village.id}&screen=${screen}`;
        if (mode !== null) url += `&mode=${mode}`;

        $.each(extraParams, function (key, value) {
            url += `&${key}=${value}`;
        });
        if(game_data.player.sitter !== "0") url += "&t=" + game_data.player.id;
        return url;
    }

    #initTroops() {
        var troops = {};
        this.availableSupportUnits.forEach(function(unit) {
			troops[unit] = 0;
        });
        return troops;
    }

	#fetchHtmlPage(url) {
		var temp_data = null;
		$.ajax({
			async: false,
			url: url,
			type: 'GET',
			success: function(data) {
				temp_data = data;
			},
			error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
				UI.ErrorMessage(`${this.UserTranslation.errorMessages.errorFetching} ${url}`); 
			}
		});
		return temp_data;
	}

    async #getTroopsObj() {
        var troopsObj = {
            'villagesTroops': this.#initTroops(),
            'scavengingTroops': this.#initTroops(),
            'supportTroops': this.#initTroops()
        };
		
        var currentPage = 0;
        var lastRunTime = null;

        do {
            var scavengingObject = await getScavengeMassScreenJson(this, currentPage, lastRunTime);
            var supportObject = await getSupportScreenJson(this, currentPage, lastRunTime);
            if (!scavengingObject) return;
            if (scavengingObject.length === 0) break;
            lastRunTime = Date.now();

            $.each(scavengingObject, function(id, villageData) {
                $.each(villageData.unit_counts_home, function(key, value) {
                    if (key !== 'militia') troopsObj.villagesTroops[key] += value;
                });
                $.each(villageData.options, function(id, option) {
                    if (option.scavenging_squad !== null) {
                        $.each(option.scavenging_squad.unit_counts, function(key, value) {
                            if (key !== 'militia') troopsObj.scavengingTroops[key] += value;
                        });
                    }
                });
            });
            currentPage++;
        } while(true)

        $.each(supportObject, function(key, value) {
            if (key !== 'militia') troopsObj.supportTroops[key] += value;
        });
        return troopsObj;

        async function getScavengeMassScreenJson(currentObj, currentPage = 0, lastRunTime = 0) {
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            var html = currentObj.#fetchHtmlPage(currentObj.#generateUrl('place', 'scavenge_mass', {'page': currentPage}));
            var matches = html.match(/ScavengeMassScreen[\s\S]*?(,\n *\[.*?\}{0,3}\],\n)/);
            if (matches.length <= 1) {
                UI.ErrorMessage(this.UserTranslation.errorMessages.missingSavengeMassScreenElement);
                return false;
            }
            matches = matches[1];
            matches = matches.substring(matches.indexOf('['))
            matches = matches.substring(0, matches.length - 2)
            return JSON.parse(matches);
        }

        async function getSupportScreenJson(currentObj, currentPage = 0, lastRunTime = 0) {
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0)));
            const url = currentObj.#generateUrl('overview_villages', 'units', {
                'type': 'away_detail',
                'filter_villages': '1'
            });
            const data = currentObj.#fetchHtmlPage(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const table = doc.querySelector('#units_table');
            const tableRows = table.querySelectorAll('tbody tr');
            let availableSupportUnits = Object.create(game_data.units);
            availableSupportUnits = Object.getPrototypeOf(availableSupportUnits);
            let supportTroops = {}
            for (let i = 0; i < availableSupportUnits.length; i++) {
                supportTroops[availableSupportUnits[i]] = 0;
            }
            tableRows.forEach((row) => {
                if (row.classList.contains('units_away')) {
                    return;
                }
                const rowData = row.querySelectorAll('td');
                let index = 0;
                rowData.forEach((data) => {
                    // IF THIS TD HAS THE CLASS unit-item THEN IT THIS IS THE TD QITH THE QTY, AND THE NAME IS THE availableSupportUnits[index]
                    if (data.classList.contains('unit-item')) {
                        const unit = availableSupportUnits[index];
                        const amount = parseInt(data.innerText);

                        supportTroops[unit] += amount;
                        index++;
                    }
                });
            });
            return supportTroops

        }

    }

	#getGroupsObj() {
		var html = $.parseHTML(this.#fetchHtmlPage(this.#generateUrl('overview_villages', 'groups', {'type': 'static'})));
		var groups = $(html).find('.vis_item').find('a,strong');
        var groupsArr = {};
        if ($(groups).length > 0) {
		    $.each(groups, function(id, group) {
			    var val = $(group).text().trim();
			    groupsArr[group.getAttribute('data-group-id')] = val.substring(1, val.length - 1);
		    });
        } else { // User has more than 5 groups
            groups = $(html).find('.vis_item select option');
            $.each(groups, function(id, group) {
			    groupsArr[(new URLSearchParams($(group).val())).get('group')] = $(group).text().trim();
		    });
        }
		
		return groupsArr;
	}

    async #createUI() {
        UI.InfoMessage(this.UserTranslation.loadingMessage);
        var troopsObj = await this.#getTroopsObj();
		var html = `
<div>
<br>
   <h3 style="position:relative;">${this.UserTranslation.title}</h3>
        ${getGroupsHtml(this)}
        <br>
        <br>
        <table id="support_sum" class="vis overview_table" width="100%">
            <thead>
                ${getTroopsHeader(this.availableSupportUnits)}
            </thead>
            <tbody>
                ${getTroopsLine(this.UserTranslation.home, troopsObj.villagesTroops)}
                ${getTroopsLine(this.UserTranslation.scavenging, troopsObj.scavengingTroops)}
                ${getTroopsLine(this.UserTranslation.support, troopsObj.supportTroops)}
                ${getTroopsLine(this.UserTranslation.total, troopsObj, 1)} 
            </tbody>
        </table>
</div>
<br>
<span style="text-decoration: bold;font-weight: bold;font-size: 10px;">${this.UserTranslation.credits}</span>
`;
        Dialog.show('import', html, Dialog.close());
        $('#popup_box_import').css('width', 'unset');
        UI.SuccessMessage(this.UserTranslation.successMessage, 500); 

		function getGroupsHtml(objInstance) {
			var groups = objInstance.#getGroupsObj();
			var html = '';
			$.each(groups, function(groupId, group) {
				var selected = game_data.group_id === groupId ? 'selected' : '';
				html += `<option value="${groupId}" ${selected}>${group}</option>`;
			});
			return '<select onchange="villagesTroopsCounter.changeGroup(this)">' + html + '</select>';
		}

		function getTroopsLine(translation, troopsObj, type = null) {
			var troops = type === null ? (() => { return troopsObj; }) : (() => {
				var troops = {};
				$.each(troopsObj.villagesTroops, function(key, value) {
					troops[key] = value + troopsObj.scavengingTroops[key] + troopsObj.supportTroops[key];
				});
				return troops;
			});

			var html = `<tr><td class="center">${translation}</td>`;
			$.each(troops(), function(key, value) {
				html += `<td class="center" data-unit="${key}">${value}</td>`;
			});
         	html += `</tr>`;
			return html;
		}

		function getTroopsHeader(availableSupportUnits) {
			var html = `<tr><th class="center"></th>`;
			$.each(availableSupportUnits, function(key, value) {
				html += `<th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="${value}"><img src="https://dspt.innogamescdn.com/asset/2a2f957f/graphic/unit/unit_${value}.png" class=""></a></th>`;
			});
         	html += `</tr>`;
			return html;
		}
    }

	changeGroup(obj) {
		this.#fetchHtmlPage(this.#generateUrl('overview_villages', null, { 'group': obj.value }));
		game_data.group_id = obj.value;
		this.#createUI();
	}
}

var villagesTroopsCounter = new VillagesTroopsCounter();
villagesTroopsCounter.init();
}

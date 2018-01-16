// Require node-dependencies to be bundled info dependencies.js here
const marked = require('marked'),
      moment = require('moment'),
      List = require('list.js');

const url = 'https://api.github.com/repos/Cxbx-Reloaded/game-compatibility/issues?per_page=100&page=',
    // @see http://listjs.com/api/ Options section
    listOptions = {
        valueNames: ['title', 'status', 'navigate', 'udata', 'region', 'date', 'tooltip'],
        item: '<tr>' + '<td class="title"></td>' + '<td class="status"></td>' + '<td class="navigate"></td>' + '<td class="udata"></td>' + '<td class="region"></td>' + '<td class="date"></td>' + '<td class="tooltip"></td>' + '</tr>'
    };

function log(m) {
    document.querySelector('#states tbody').innerHTML += `<tr><td>${m}</td></tr>`
}

/**
 * A promise-wrap around XMLHttpRequest
 * got it here: http://ccoenraets.github.io/es6-tutorial-data/promisify/
 */
let request = obj => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(obj.method || "GET", obj.url);
        if (obj.headers) {
            Object.keys(obj.headers).forEach(key => {
                xhr.setRequestHeader(key, obj.headers[key]);
            });
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () =>
            reject(xhr.statusText);
        xhr.send(obj.body);
    });
};

/**
 * Builds game/status tables and appends them to DOM
 **/
function print(data) {
    const allStates = populateList(data);
    // status counters
    let statesHtml = '<tr>';
    for (state in allStates) {
        statesHtml += `<td style="background:#${allStates[state].color}">${state}</td><td>${allStates[state].count}</td>`
    }
    statesHtml += '</tr>';
    document.querySelector('#states tbody').innerHTML = statesHtml;
    // total
    document.querySelector('#total').innerHTML = data.length;
}

/**
 * returns - an row model object
 * @param i - github json api issue item
 */
function renderRow(i) {
    // this is a wrong place to put state collection logic, will move it somewhere else later
    let state = i.labels.find(l => l.name.indexOf('state') != -1);
    state = state || {
        name: 'unknown',
        color: '737373'
    };
    if (!this[state.name]) {
        state.count = 0;
        this[state.name] = state;
    } else {
        this[state.name].count++;
    }
    // let tags = i.labels.map(label=>`<span class="tag" style="background: #${label.color}">${label.name}</span>`).join();
    const title = i.title.substring(0, i.title.lastIndexOf('[')) || i.title;
    const udata = i.title.substring(i.title.lastIndexOf('[') + 1, i.title.lastIndexOf(']'));
    let regions = i.labels.filter(l => l.name.indexOf('region') != -1);
    const region = regions ? regions.map(region => region.name.substring(region.name.indexOf('-') + 1)).join(',') : 'n/a';
    const udataHtml = udata ? `<a href="http://www.xbox-games.org/?srch=${udata}">${udata}</a>` : 'None';
    const date = new Date(i.updated_at);
    return {
        title: title,
        status: `<span style="background:#${state.color}">${state.name.substring('state-'.length)}</span>`,
        navigate: `<a target="_blank" href="${i.url.replace('api.', '').replace('repos/', '')}">Navigate</a>`,
        udata: udataHtml,
        region: region,
        date: `${moment(date).format('DD MMM YYYY')}`,
        tooltip: `<div class="tooltip">Hover here!<div class="tooltiptext">${marked(i.body)}</div></div>`
    }
}

/**
 * Loads github api data in batches, 100 items per request.
 * prints some strings into DOM while loading to show progress
 **/
function loadData(pageIdx) {
        log(`Loading ${url + pageIdx} ...`);
        request({
            url: url + pageIdx
        }).then(data => {
            try {
                data = JSON.parse(data);
            } catch (e) {
                data = undefined;
            }
            log(`Loading ${url + pageIdx} ${data ? data.length : 0} items fetched!`);
            if (data && data.length) {
                allItems.push(...data);
                loadData(pageIdx + 1);
            } else {
                print(allItems);
            }
        });
    }
    /**
     * Populates list.js-based games list
     **/
function populateList(data) {
    let allStates = {};
    const values = data.map(renderRow.bind(allStates))
    let gamesList = new List('games-table', listOptions, values);
    const sortBtn = document.querySelector('.date-sort');
    sortBtn.addEventListener('click', function(){
        sortBtn.direction = sortBtn.direction || "asc";
        gamesList.sort('date', {
            sortFunction: function(a,b){
                const dateA = moment(a.values().date);
                const dateB = moment(b.values().date);
                const direction = "asc" ===sortBtn.direction ? 1 : -1;
                return dateA.diff(dateB, 'seconds') * direction;
            }
        });
        sortBtn.direction = "asc" === sortBtn.direction ? "desc" : "asc";   
    });
    return allStates;
}


let page = 0,
    allItems = [];
// and here it all starts
loadData(0);
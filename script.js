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
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send(obj.body);
   });
};

/**
 * Builds game/status tables and appends them to DOM
 **/
function print (data) {

   // render game rows
   let gameRowHtml = '', allStates = {};
   data.sort((a,b)=>a.title.localeCompare(b.title));
   data.forEach((i) => {
      const state = i.labels.find(l => l.name.indexOf('state') != -1)
      gameRowHtml += renderRow(i, state);
      if (state){
         if (!allStates.hasOwnProperty(state.name)){
            allStates[state.name] = 0;
         }
         allStates[state.name]++;
      }
   });
   gameRowHtml+='</ul>'
   document.querySelector('#games tbody').innerHTML = gameRowHtml;
   // status counters
   let statesHtml = '<tr>';
   for (state in allStates){
      statesHtml+=`<td>${state}</td><td>${allStates[state]}</td>`
   }
   statesHtml+='</tr>';
   document.querySelector('#states tbody').innerHTML = statesHtml;
   // total
   document.querySelector('#total').innerHTML = data.length;
}

/**
 * returns - string containing an html table row
 * @param i - github json api issue item
 */
function renderRow (i, state) {
   state = state || {name: 'unknown', color: '#333'};
   // let tags = i.labels.map(label=>`<span class="tag" style="background: #${label.color}">${label.name}</span>`).join();
   const title = i.title.substring(0, i.title.lastIndexOf('[')) || i.title;
   const udata = i.title.substring(i.title.lastIndexOf('[')+1, i.title.lastIndexOf(']'));
   const udataHtml = udata
      ? `<a href="http://www.xbox-games.org/?srch=${udata}">${udata}</a>`
      : 'None';
   const date = new Date(i.updated_at);
   return `<tr>
            <td>${title}</td>
            <td class="status" style="background:#${state.color}">${state.name.substring('state-'.length)}</td>
            <td><a href="${i.url}">Navigate</a></td>
            <td>${udataHtml}</td>
            <td>${date.getDay()}/${date.getMonth()}/${date.getFullYear()}</td>
            <td><div class="tooltip">Hover here!<div class="tooltiptext">${marked(i.body)}</div></div></td>
            </tr>`;
}

/**
 * Github api allows MAX of 100 items per request.
 * Loading pages till the result is empty here
 */
let hasData = true, page = 0, allItems = [];
const url = 'https://api.github.com/repos/Cxbx-Reloaded/game-compatibility/issues?per_page=100&page='

function loadData(pageIdx) {
   console.log(`Loading ${url + pageIdx} ...`);
   request({
      url: url + pageIdx
   }).then(data => {
      try {
         data = JSON.parse(data);
      } catch (e){
         data = undefined;
      }
      console.log(`Loading ${url + pageIdx} ${data ? data.length : 0} items fetched!`);
      if (data && data.length) {
         allItems.push(...data);
         loadData(pageIdx+1);
      } else {
         print(allItems);
      }
   });
}
// and here it all starts
loadData(0);

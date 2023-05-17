
import {admlvl5, mapStyle} from './admlvl5.js';
import { table_sort } from './tablesort.js';
var buttons = document.querySelectorAll('.admbtn');
var marker = null;
var school_links = document.querySelectorAll('.link');
var cur_btn = '';

let mapOptions = {
    center: [55.5939303, 37.510795],
    attributionControl: false,
    scrollWheelZoom:false,
    zoomControl: false,
    zoom: 9,
    minZoom:9,
    maxBounds:[[55.00, 36.50],[56.20, 38.50]]
}

let map = new L.map('map', mapOptions);
let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

var all_layers = {};


// Добавление основго слоя карты
map.addLayer(layer);


// Добавление кнопок зума на карту
L.control.zoom({
    position:'bottomright',
    
}).addTo(map);

// Разъбиение geoJSON файла округов на части. Добавление на карту по слоям.
admlvl5.features.forEach(element => {
    let feature = {
        type: 'FeatureCollection',
        features: [
          element,
        ],
      };
    all_layers[`${element.id}`] = L.geoJSON(feature, {style: mapStyle}).addTo(map);
    
});

//Создание прослушки эвентов для округов на карте
for (let key in all_layers) {
  if (all_layers.hasOwnProperty(key)) {
    all_layers[key].on({
        mouseover: function(event) {
            highlightFeature(event, key);
        },
        mouseout: function(event) {
            resetHighlight(event, key);
        },
        click: function(event) {
            on_map_click(event, key);
        },
    });
}};


// При наведении на карту подсвечиватся соответствующий регион среди кнопок
function highlightFeature(e, id) {
    id = parseInt(id)
    var layer = e.target;
    cur_btn = document.getElementById(`${id}`)
    cur_btn.addEventListener('mouseenter', function(e) {
        e.target.style.backgroundColor = 'rgb(197, 156, 235)'
    })
    cur_btn.style.backgroundColor = 'rgb(197, 156, 235)'
    layer.setStyle({
        weight: 3,
        color: '#FF1F1F',
        fillOpacity: 0.2
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
};


// Отменет предыдущего
function resetHighlight(e, id) {
    id = parseInt(id)
    var layer = e.target;
    cur_btn = document.getElementById(`${id}`)
    cur_btn.addEventListener('mouseleave', function(e) {
        e.target.style.backgroundColor = 'rgb(255, 255, 255)'
    })
    cur_btn.style.backgroundColor = 'rgb(255, 255, 255)'
    layer.setStyle({
        weight: 2,
        color: '#505050',
        fillOpacity: 0.2
    });
    
};


// При наведении на кнопку округа выбирается также округ на карте
buttons.forEach(function(button) {
    button.addEventListener('mouseenter', function() {
      var regionId = this.id;
      for (var key in all_layers) {
        if (all_layers.hasOwnProperty(key)) {
          all_layers[key].setStyle({weight:0.5})
        }}
      all_layers[`${regionId}`].setStyle({ color: '#FF1F1F', weight:3, fillOpacity: 0.3 })
        
      });
    
    button.addEventListener('mouseleave', function() {
      var regionId = this.id;
      for (var key in all_layers) {
        if (all_layers.hasOwnProperty(key)) {
          all_layers[key].setStyle({weight:0.5})
        }}
      all_layers[`${regionId}`].setStyle({ color: '#505050', weight:2, fillOpacity: 0.2 })
    });
});


// Взаимодействие с элементами. Перенаправление
function on_map_click(event, id) {
    id = parseInt(id)
    var check_box = document.getElementById('myCheckbox')
    var radius_field = document.getElementById('myInput')
    var radius = radius_field.value
    if(window.markers !== undefined){
    map.removeLayer(window.markers) 
    }
    window.markers = L.markerClusterGroup({
      maxClusterRadius: 50, // радиус кластера в пикселях
      spiderfyOnMaxZoom: true, // разброс маркеров при максимальном увеличении
      showCoverageOnHover: false, // отображение области покрытия при наведении на кластер
      disableClusteringAtZoom: 18, // отключение кластеризации при определенном увеличении
      // и т.д.
      });
    if (check_box.checked) {
      if(marker !== null){
        map.removeLayer(marker);
        
      }
      let latlng = event.latlng
      marker = L.marker(latlng).addTo(map);
      
      axios.get(`/schools-in-radius/?lat=${latlng.lng}&lng=${latlng.lat}&radius=${parseInt(radius)}`)
      .then(function (response) { 
          let promises = response.data.map(function(e) {
            return axios.get('/schoolcoords/?school_id=' + e)
          })
          Promise.all(promises)
          .then(function(responses) {
            let all_markers = responses.map(function(response) {
              let lat = response.data[0];
              let lng = response.data[1];
              let name = JSON.parse(response.data[2].body)['name']
              let address = JSON.parse(response.data[2].body)['address']
              return L.marker([lng, lat]).bindPopup(`${name}<br>${address}`);;
            });
            markers.addLayers(all_markers)
            map.addLayer(markers)   
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    let adm_btn = document.getElementById(`${id}`)
    var that_adm = adm_btn.parentElement.dataset.adm
    buttons.forEach(e => {
      e.style.outline = ''
    });
    adm_btn.style.outline = 'solid violet 3px'
    axios.get('/schools_adm/?area=' + that_adm)
    .then(function (response) {
      var place = document.querySelectorAll('.allinfo')[0]
      var table = document.getElementById('sortable')
      var table_wrapper = document.getElementById('sortable_wrapper')
      var data = response.data;
      
      let center = all_layers[`${id}`].getBounds();
        map.setView([(center._northEast.lat + center._southWest.lat)/2,(center._northEast.lng + center._southWest.lng)/2] , 11)
      // if(marker !== null){
      //   map.removeLayer(marker);
      // }
      // L.marker([lng, lat]).addTo(map);
      // map.setView([lng, lat], 13);
      let new_tbody = '<thead><tr><th>Название учреждения</th><th>Тип</th><th>Расположение</th><th>Юридический адрес</th><th>Официальный сайт</th></tr></thead><tbody>'
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          new_tbody += `<tr>  
                            <td class="namebtn"><a class='link' href='#' data-id="${data[key][0]}"> ${data[key][1]} </a> </td>
                            <td>${data[key][2]}</td>
                            <td>${data[key][3]} <br> ${data[key][4]} </td>
                            <td>${data[key][5]}</td>
                            <td><a href="https://${data[key][6]}"> ${data[key][6]}</a></td>
                        </tr>`;
        }
      }
      table.innerHTML = new_tbody + "</tbody>"
      place.style.display = 'none'
      table.style.display = ''
      table_wrapper.style.display = ''
      var school_links = document.querySelectorAll('.link')
      school_links.forEach(link => {
      link.addEventListener('click', on_link_click)
      table_sort()
      })
      })
      .catch(function (error) {
      console.log(error);
      });
      
};
  

function on_link_click(event) {
  event.preventDefault();
  buttons.forEach(e => {
    e.style.outline = ''
  });  
  var that_id = this.dataset.id;
  axios.get('/schoolcoords/?school_id=' + that_id)
  .then(function (response) {
    
    var place = document.querySelectorAll('.allinfo')[0]
    var table = document.getElementById('sortable')
    var table_wrapper = document.getElementById('sortable_wrapper')
    var lat = response.data[0];
    var lng = response.data[1];
    var parsedData = JSON.parse(response.data[2].body);

    if(marker !== null){
      map.removeLayer(marker);
      map.removeLayer(window.markers)
    }
    marker = L.marker([lng, lat]).addTo(map);
    
    map.setView([lng, lat], 13);
    var popup = marker.bindPopup(`<b>${parsedData['fullname']}</b>${parsedData['address']}<br>`);
    popup.openPopup();
    place.innerHTML =
      `<ul> 
          <li>${parsedData['fullname']} </li> 
          <div class="placing">
              <li> Расположение </li>
              <li> ${parsedData['admarea']} </li> 
              <li> ${parsedData['district']}</li> 
              <li> ${parsedData['address']} </li> 
          </div>
          <div class="offsite">
              <li> Официальный сайт </li>
              <li> <a href="https://${parsedData['site']} ">${parsedData['site']}</a></li> 
              <li> ${parsedData['chiefpos']}: ${parsedData['chief']} </li> 
          </div>
          <div class="phone">
              <li> Номер телефона </li>
              <li> +7 ${parsedData['phone']} </li>
          </div>
      </ul>`
    place.style.display = ''
    table.style.display = 'none'
    table_wrapper.style.display = 'none'
    
  })
  .catch(function (error) {
    console.log(error);
  });
  
};


function on_adm_click(event) {
  event.preventDefault();
  buttons.forEach(e => {
    e.style.outline = ''
  });
  this.firstChild.style.outline = 'solid violet 3px'
  var that_adm = this.dataset.adm
  axios.get('/schools_adm/?area=' + that_adm)
  .then(function (response) {
    var place = document.querySelectorAll('.allinfo')[0]
    var table = document.getElementById('sortable')
    var table_wrapper = document.getElementById('sortable_wrapper')
    var data = response.data;
    let new_tbody = '<thead><tr><th>Название учреждения</th><th>Тип</th><th>Расположение</th><th>Юридический адрес</th><th>Официальный сайт</th></tr></thead><tbody>'
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        // Маркеры всех школ региона ставятся при нажатии на регион
  //       axios.get('/schoolcoords/?school_id=' + data[key][0])
  // .then(function (response) {
  //   var lat = response.data[0];
  //   var lng = response.data[1];
  //   L.marker([lng, lat]).addTo(map);
  //   // map.setView([lng, lat], 13);
  // })
        new_tbody += `<tr>  <td class="namebtn"><a class='link' href='#' data-id="${data[key][0]}"> ${data[key][1]} </a> </td><td>${data[key][2]}</td><td>${data[key][3]} <br> ${data[key][4]} </td><td>${data[key][5]}</td><td><a href="https://${data[key][6]}"> ${data[key][6]}</a></td></tr>`;

      }
    }
    table.innerHTML = new_tbody + "</tbody>"
    place.style.display = 'none'
    table.style.display = ''
    table_wrapper.style.display = ''
    
    
    var school_links = document.querySelectorAll('.link')
    school_links.forEach(link => {
    link.addEventListener('click', on_link_click)
    table_sort()
    })
    
    })
    .catch(function (error) {
    console.log(error);
    });
    
    var regionId = this.firstChild.id;
      
      let center = all_layers[`${regionId}`].getBounds();
      map.setView([(center._northEast.lat + center._southWest.lat)/2,(center._northEast.lng + center._southWest.lng)/2] , 11)
        
      
      
};

// Добавление прослушки эвента клик на все школы из текущей таблицы
school_links.forEach(link => {
  link.addEventListener('click', on_link_click)
})

// Добавление прослушки эвента клик на все кнопки округов
buttons.forEach(btn => {
  var out = btn.parentElement
  out.addEventListener('click', on_adm_click)
})

// Поиск на карте
L.Control.geocoder().addTo(map);

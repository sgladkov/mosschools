
import {admlvl5, mapStyle} from './admlvl5.js';
import { table_sort } from './tablesort.js';
var buttons = document.querySelectorAll('.AdmAreas')[0];
var marker = null;
var school_links = document.querySelectorAll('.link');

let mapOptions = {
    center: [55.594000, 37.410095],
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
    
    layer.setStyle({
        weight: 3,
        color: '#FF1F1F',
        fillOpacity: 0.2
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
};


// Отменет обводку предудещего региона
function resetHighlight(e, id) {
    id = parseInt(id)
    var layer = e.target;
    
    if ($( ".AdmAreas option:selected" ).attr('id') != id) {
    layer.setStyle({
        weight: 0.5,
        color: '#505050',
        fillOpacity: 0.2
    });
  }
};


// При выборе округа обводится соответсвенный округ на карте

    buttons.addEventListener("change", function() {
      var regionId = $( ".AdmAreas option:selected" ).attr('id')
      
      
      for (var key in all_layers) {
        if (all_layers.hasOwnProperty(key)) {
          all_layers[key].setStyle({color: '#505050', weight:0.5})
          console.log('here')
        }}
      all_layers[`${regionId}`].setStyle({ color: '#FF1F1F', weight:3, fillOpacity: 0.3 })
        
      });
    
// При нажатии на округ на карте
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
      });
    if (check_box.checked) {
      if(marker !== null){
        map.removeLayer(marker);
        
      }
      let latlng = event.latlng
      marker = L.marker(latlng).addTo(map);
      var all_markers = []
      //Запрос на поиск школ в радиусе если нажата галочка и выбран радиус
      axios.get(`/schools-in-radius/?lat=${latlng.lng}&lng=${latlng.lat}&radius=${parseInt(radius)}`)
        .then(function (response) { 
            let data = response.data
            return data
        })
        .then(function(data) {
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
                
                all_markers.push(L.marker([data[key]['coords']['lg'],data[key]['coords']['lt']]).bindPopup(`<a href='https://${data[key]['site']}'>${data[key]['name']}</a><br>${data[key]['address']}`))
              }
            } 
            
            window.markers.addLayers(all_markers)
            map.addLayer(window.markers)
            
        })
        .catch(function (error) {
        console.log(error);
        });
    }
    //Убираем подстветку предудещего округа при клике на другой на карте
    if ($( ".AdmAreas option:selected" ).attr('id') != id && $( ".AdmAreas option:selected" ).attr('id') != 0) {
      all_layers[$( ".AdmAreas option:selected" ).attr('id')].setStyle({
        weight: 0.5,
        color: '#505050',
        fillOpacity: 0.2
    });
    }
    
    let adm_btn = document.getElementById(`${id}`)
    var that_adm = adm_btn.value
    $(".AdmAreas").val(`${that_adm}`)
    adm_btn.style.outline = 'solid violet 3px'
  
    
    
    
    var place = document.querySelectorAll('.allinfo')[0]
    var table = document.getElementById('sortable')
    var table_wrapper = document.getElementById('sortable_wrapper')
    
    
    let center = all_layers[`${id}`].getBounds();
      map.setView([(center._northEast.lat + center._southWest.lat)/2,(center._northEast.lng + center._southWest.lng)/2] , 11)
    
    place.style.display = 'none'
    table.style.display = ''
    table_wrapper.style.display = ''
    var str = that_adm
    str = str.replace(/%20/g, ' ');
    var table = $('#sortable').DataTable();
    table.search(str).draw();
      
      
};
  
//При нажатии на конкретную школу в таблице
function on_link_click(event) {
  event.preventDefault();
  var that_id = this.dataset.id;
  //Запрос данных школы и координат
  axios.get('/schoolcoords/?school_id=' + that_id)
  .then(function (response) {
    let data = response.data
    var place = document.querySelectorAll('.allinfo')[0]
    var table = document.getElementById('sortable')
    var table_wrapper = document.getElementById('sortable_wrapper')
    var lat = data['coords']['lt'];
    var lng = data['coords']['lg'];
    //Удаляем все прошлые маркеры
    if(marker !== null){
      map.removeLayer(marker);
      map.removeLayer(window.markers)
    }
    //Добавляем маркер школы на карте
    marker = L.marker([lng, lat]).addTo(map);
    //Приближаем на школу на карте
    map.setView([lng, lat], 13);
    //Генерируем popup школы и открываем
    var popup = marker.bindPopup(`<b>${data['fullname']}</b>${data['address']}<br>`);
    popup.openPopup();
    console.log(data['description'])
    //Генерируем всю инфу по выбранной школе
    place.innerHTML =
      `<div class="WholeInfo"> 
        <div id="MainInfo">
          <h1>${data['fullname']} </h1> 
          <ul>
            <li> <span>Адрес:</span> ${data['address']} </li>
            <li> <span>Официальный сайт:</span> <a href="https://${data['site']} "> ${data['site']}</a> </li>
            <li> <span>Номер телефона:</span> +7 ${data['phone']}</li>
            <li> <a target="_blank" href='https://yandex.ru/maps/?text=${data['address']}'>Посмотреть на Yandex maps</a></li>
          </ul>
        </div>
        <div class="MoreInfo">
          <ul>
            <li><span>${data['chiefpos']}:</span> ${data['chief']}</li>
            <li><span>Тип:</span> ${data['orgtype']}</li>
            <li><span>Описание:</span> ${data['description']}</li>
            <li><span>Образовательные программы:</span> ${data['eduprogs']}</li>
            <li><span>Средний рейтинг Школы:</span> ${data['avgrating']}</li>
            <li><span>Рейтинг школы по годам:</span> <br> ${data['sprrating']}</li>
            <li><span></span></li>
          </ul>
        </div>
        
      </div>`
    table.style.display = 'none'
    table_wrapper.style.display = 'none'
    place.style.display = ''
    //Убираем таблицу
    
    
  })
  .catch(function (error) {
    console.log(error);
  });
  
};

//При выборе округа из списка
function on_adm_click(regionId, that_adm) {
  
  if(window.markers !== undefined){
    map.removeLayer(window.markers) 
    }
  window.markers = L.markerClusterGroup({
    maxClusterRadius: 50, // радиус кластера в пикселях
    spiderfyOnMaxZoom: true, // разброс маркеров при максимальном увеличении
    showCoverageOnHover: false, // отображение области покрытия при наведении на кластер
    disableClusteringAtZoom: 18, // отключение кластеризации при определенном увеличении
  })
  var all_markers = []
  if(marker !== null){
    map.removeLayer(marker);
    
  }
  
  //Запрос на школы округа при выборе округа из списка
  axios.get('/schools_adm/?area=' + that_adm)
  .then(function (response) {
    var place = document.querySelectorAll('.allinfo')[0]
    var table = document.getElementById('sortable')
    var table_wrapper = document.getElementById('sortable_wrapper')
    var data = response.data;
    
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        all_markers.push(L.marker([data[key]['coords']['lg'],data[key]['coords']['lt']]).bindPopup(`<a href='https://${data[key]['site']}'>${data[key]['name']}</a><br>${data[key]['address']}`))
      }
    }
    //Добавляем кластеры маркеров на карту всех школ выбранного округа
    window.markers.addLayers(all_markers)
    map.addLayer(window.markers)
    table.style.display = ''
    table_wrapper.style.display = ''
    place.style.display = 'none'
    var str = that_adm
    str = str.replace(/%20/g, ' ');
    var table = $('#sortable').DataTable();
    table.search(str).draw();
    
    //Переопределяем ссылки на школы в таблице
    
    
    })
    .catch(function (error) {
    console.log(error);
    });
    
    
      //Находим центр округа и перемещаем карту туда
      let center = all_layers[`${regionId}`].getBounds();
      map.setView([(center._northEast.lat + center._southWest.lat)/2,(center._northEast.lng + center._southWest.lng)/2] , 11)
        
      
      
};

// Добавление прослушки эвента клик на все школы из текущей таблицы
school_links.forEach(link => {
  link.addEventListener('click', on_link_click)
})

// Добавление прослушки эвента клик на все кнопки округов
buttons.addEventListener("change", function() {
  let btn = $( ".AdmAreas option:selected" )
  
  on_adm_click(btn.attr('id'), btn.val())
})

// Поисковик на карте
L.Control.geocoder().addTo(map);

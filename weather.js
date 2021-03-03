'use strict'

let nextDays = document.querySelectorAll(".forecast-day");
let readings = document.querySelectorAll(".forecast-reading");
let icons = document.querySelectorAll(".forecast-icon");
let temps = document.querySelectorAll(".forecast-temperature");
function currentTime() {
  
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
  var date = new Date(); /* creating object of Date class */
  var month = monthNames[date.getMonth()];
  const dayToday = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const output = month + " " + day  + ', ' + year;
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  hour = updateTime(hour);
  min = updateTime(min);
  sec = updateTime(sec);
  let i = 1;
  for(let eachday of nextDays){
  	eachday.innerText = (date.getDay() + i > 11) ? days[date.getDay() + i - 12] : days[date.getDay() + i];
  	i++;
  }
  document.querySelector(".date").innerText = dayToday + ", " + output;
  document.getElementById("time").innerText = hour + " : " + min + " : " + sec; /* adding time to the div */
  var t = setTimeout(function(){ currentTime() }, 1000); /* setting timer */
}

function updateTime(k) {
  if (k < 10) {
    return "0" + k;
  }
  else {
    return k;
  }
}

function showError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
      alert("Please enable location permissions. For IOS Users, go to Settings > Privacy > Location Services.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
  }
}

function animateLoad(){
	const loader = document.querySelector('h2');
	function addDot(){
		loader.innerText += ".";
		if (loader.innerText.includes("....")){
		loader.innerText = "Loading";
	}

	}
	addDot();
	var x = setTimeout(function(){ animateLoad() }, 250);
}

animateLoad();
currentTime(); /* calling currentTime() function to initiate the process */

fetch("https://api.data.gov.sg/v1/environment/2-hour-weather-forecast")
.then((response) => response.json())
.then(function(data){
	navigator.geolocation.getCurrentPosition((position) => {

		let load = document.querySelector(".load");
		let main = document.querySelector("main");
		load.style.display = "none";
		main.style.overflow-y = "auto";
		let lat1 = position.coords.latitude;
		let lon1 = position.coords.longitude;
		let areas = {};
		let forecastData = data.area_metadata;
		let forecasts = data.items[0].forecasts;
		for(let metadata of forecastData){
			let name = metadata.name;
			let lat2 = metadata.label_location.latitude;
			let lon2 = metadata.label_location.longitude;
			areas[name] = distance(lat1, lon1, lat2, lon2);
		}

		let desc = document.getElementById("description");
		let min = findMin(areas);
		for(let forecast of forecasts){
			if(forecast.area == min){
				desc.innerText = forecast.forecast;
				break;
			}
		}
		let dateNow = new Date();
		let hourNow = dateNow.getHours();
		const background = document.querySelector("#bgvid");
		let els = document.querySelector("*");
		console.log(desc);
		if (desc.innerText.includes("Thunder")){
			background.src = "./backgrounds/lightning.mp4"
			els.style.color = "white";
		}
		else if (desc.innerText.includes("Rain") || desc.innerText.includes("Shower")){
			background.src = "./backgrounds/rain.mp4"
		}
		else if (desc.innerText.includes("Fair") || desc.innerText.includes("Cloudy")){
			if (hourNow >= 18 && hourNow <= 19){
				background.src = "./backgrounds/cloudy-evening.mp4"
			}
			else if (desc.innerText.includes("Night")){
				background.src = "./backgrounds/cloudy-night.mp4"
				els.style.color = "white";
			}
			else{
				background.setAttribute("src", "./backgrounds/cloudy.mp4");
			}
		}
		document.getElementById("location").innerText = min;
		

	}, showError);
	
})
.catch(function(error){
	console.log(error);
});

fetch("https://api.data.gov.sg/v1/environment/air-temperature")
.then((response) => response.json())
.then(function(data){
	let temperatureReadings = data.items[0].readings;
	let total = 0;
	for (let i = 0; i < temperatureReadings.length; i++){
		total += parseInt(temperatureReadings[i].value);
	}
	total = Math.round(total/temperatureReadings.length);
	document.querySelector(".temperature").innerText = `${total}°C`;
})
.catch(function(error){
	console.log(error);
});

fetch("https://api.data.gov.sg/v1/environment/4-day-weather-forecast")
.then((response) => response.json())
.then(function(data){
	let json = data.items[0].forecasts;
	document.querySelector(".valid").innerText = `Last updated at: ${new Date()}`;
	for (let i = 0; i < 4; i++){
		readings[i].innerText = json[i].forecast;
		if (json[i].forecast.includes("Fair")){
			if (json[i].forecast.includes("warm")){
				icons[i].src = "./animated/cloudy-day.svg";
			}
			else{
				icons[i].src = "./animated/cloudy.svg";
			}
		}
		else if (json[i].forecast.includes("thunder")){
			icons[i].src = "./animated/thunder.svg";
		}
		else{
			icons[i].src = "./animated/rainy.svg";
		}
		temps[i].innerText = `High: ${json[i].temperature.high}°C Low: ${json[i].temperature.low}°C`;
	}
})
.catch(function(error){
	console.log(error);
});

function distance(lat1, lon1, lat2, lon2){

	function radians(deg){
		const pi = Math.PI;
		return deg * (pi/180);
	}
	const R = 6373.0;
	let dlon = radians(lon2) - radians(lon1);
	let dlat = radians(lat2) - radians(lat1);

	let a = Math.pow(Math.sin(dlat/2), 2) + (Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.pow(Math.sin(dlon /2),2));
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	let distance = R * c;
	return distance;
}

function findMin(areas){
	let min = Math.min(...Object.values(areas).map(Math.abs));
	for(let area of Object.entries(areas)){
		let name = area[0];
		let distance = area[1];
		if(min == distance){
			return name;
		}
	}
}

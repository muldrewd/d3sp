Tone.Transport.bpm.value = 80;

var earthquakes;

//create a synth and connect it to the master output (your speakers)
var synth = new Tone.Synth().toMaster();


let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson";

d3.json(url, function (json) {
  if (json) {
    earthquakes = json.features.map(feature => ({
      location: feature.properties.place,
      country: feature.properties.place.split(',').pop().trim(),
      time: feature.properties.time,
      magnitude: feature.properties.mag }));

    //console.log(earthquakes);

    let countries = earthquakes.map(earthquake => earthquake.country);

    let locationFrequency = countries.reduce(function (countries, loc) {
      if (typeof countries[loc] == 'undefined') {
        countries[loc] = 1;
      } else {
        countries[loc] += 1;
      }

      return countries;
    }, {});

    console.log(locationFrequency);

    var countryArray = Object.entries(locationFrequency);

    //console.log(countryArray);

    var topCountries = countryArray.sort((a, b) => a[1] < b[1] ? 1 : -1).slice(0, 6);

    //console.log(topCountries);

    var earthquakeData = topCountries.map((c, i) => ({
      id: i,
      name: c[0],
      quantity: c[1] }));

    console.log(earthquakeData);

    createDonutChart(earthquakeData);

    donutCountries = earthquakeData.map(e => e.name);

    console.log(donutCountries);

    filteredEarthquakes = earthquakes.filter(e => donutCountries.includes(e.country));

    console.log(filteredEarthquakes);
  }
});


//https://github.com/eventbrite/britecharts/blob/master/demos/demo-donut.js
function createDonutChart(earthquakeData) {
  let donutChart = britecharts.donut();

  var containerWidth = 400;

  donutChart.
  isAnimated(true).
  highlightSliceById(2).
  width(containerWidth).
  height(containerWidth).
  externalRadius(containerWidth / 2.5).
  internalRadius(containerWidth / 5).
  on('customMouseOver', function (data) {
    var dataNote = Tone.Frequency("C3").transpose(3 * data.data.id).toNote();
    synth.triggerAttackRelease(dataNote, "4n");
  }).
  on('customMouseOut', function () {
  });

  d3.select('.js-donut-chart-container').datum(earthquakeData).call(donutChart);
}

var PushArc = function(currentCountry){
  return (time => {
    console.log(currentCountry);
    d3.selectAll("path").filter(d => d.data.name == currentCountry).dispatch('mouseover');
  })
};

var ReleaseArc = function(currentCountry){
  return (time => d3.selectAll("path").filter(d => d.data.name == currentCountry).dispatch('mouseout'))
};

function* arcSequencer(filteredEarthquakes) {

  var eArr = filteredEarthquakes[Symbol.iterator]();

  previousCountry = eArr.next().value.country;
  currentCountry = eArr.next().value.country;

  callback = PushArc(previousCountry);

  while (true) {
    var nextOp = yield callback;
    previousCountry = currentCountry;
    currentCountry = eArr.next().value.country;
    
    if (nextOp == "push") {
      callback = PushArc(currentCountry);
    }
    else if (nextOp == "release"){
      callback = ReleaseArc(previousCountry);
    }
  }
}

length = 50

function playData(length) {

  console.log("++++++++++++++")
  var arcs = arcSequencer(filteredEarthquakes);
  
  for (var i = 0; i <= length; i++){
    Tone.Transport.schedule(arcs.next("release").value, `${Math.floor(i/4)}:${i % 4}`);
    Tone.Transport.schedule(arcs.next("push").value, `${Math.floor((i+1)/4)}:${(i+1) % 4}`);
  }

  //Tone.Transport.loopEnd = `${Math.floor(length/4)}:${length % 4}`;
  //Tone.Transport.loop = true;

  
  Tone.Transport.toggle();
};
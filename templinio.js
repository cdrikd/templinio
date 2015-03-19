// Templinio : Timeline using d3js
// It's only a proof of concept
// Size of the timeline
var w = 800;
var h = 300;

var paddingData = 5; // Padding entre les différentes dates et la hauteur
var sizeLine = 20; // Taille en pixel des rond et rectancles ainsi que du texte
// Nombre de lignes de dates possibles . Hauteur - axe - (padding haut et bas)
var nbLine = Math.floor((h - 30 - (2 * paddingData)) / (sizeLine + paddingData));
// Rayon des cercles pours les dates
var circleRadius = 5;

var dataset;

// Gestion de la langue française.
var myFormatters = d3.locale({
    "decimal": ",",
    "thousands": ",",
    "grouping": [3],
    "currency": ["€", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d-%m-%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    "shortDays": ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    "months": ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    "shortMonths": ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"]
});

// Objet pour afficher la date sous différent format selon l'échelle
var customTimeFormat = myFormatters.timeFormat.multi([
    [".%L", function(d) { return d.getMilliseconds(); }],
    [":%S", function(d) { return d.getSeconds(); }],
    ["%I:%M", function(d) { return d.getMinutes(); }],
    ["%H:%M", function(d) { return d.getHours(); }],
    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
    ["%d %b", function(d) { return d.getDate() != 1; }],
    ["%B", function(d) { return d.getMonth(); }],
    ["%Y", function() { return true; }]
]);

// Url for 30 random data http://beta.json-generator.com/Mu0JFF9
// http://beta.json-generator.com/api/json/get/OOOGEOD   LQlLJHS AaTWszy
d3.json("http://beta.json-generator.com/api/json/get/OOOGEOD", function(json) {
    dataset = json;
    // On trie les dates
    dataset.sort(function(a,b){
      return new Date(a.startDate) - new Date(b.startDate);
    });
    generateTimeline();
});

function generateTimeline() {
    var tScale = d3.time.scale()
        //.domain([new Date("2015-01-01"), new Date("2015-12-31")])
        .domain([
            new Date(d3.min(dataset, function(d) { return d.startDate; })),
            new Date(d3.max(dataset, function(d) { return d.startDate; }))
            ])
        .range([0,w]);

    var xAxis = d3.svg.axis()
      .scale(tScale)
      .orient("bottom")
      .tickFormat(customTimeFormat)
      .ticks(6);

    var svg = d3.select("#templinio-example1")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var zoom = d3.behavior.zoom()
        .x(tScale)
        .scaleExtent([0, 150])
        .on("zoom", zoomed);

    var newsvg = svg.append("g").call(zoom);

    // Create a rectangle for all timeline to use mousse zoom
    newsvg.append("rect")
        .attr("width", w)
        .attr("height", h);

    newsvg.append("g")
        .attr("class", "x axis")
        .attr("transform","translate(0," + (h - 30) + ")")
        .call(xAxis);

    // On ajoute des balise g pour les futures évènements en leur positionnant
    // une classe tdate ou tperiod
    var events = newsvg.selectAll("g.tevent").data(dataset).enter().append("g")
        .attr("class",function(d) {
            if(d.hasOwnProperty("endDate") && (0 !== d.endDate.length)) {
                // C'est une période si il a une date de fin non vide
                return "tperiod tevent";
            } else {
                return "tdate tevent";
            }
        });
    var dates_events = newsvg.selectAll(".tdate").append("circle")
            .attr("transform", "translate(" + circleRadius + "," + (sizeLine / 2) + ")")
            .attr("fill","#2196F3")
            .attr("r",circleRadius);

    // Affichage des textes des dates
    var txt_dates_events = newsvg.selectAll(".tdate").append("text")
        .text(function(d) {return d.title;})
        .attr("transform", "translate(" + (circleRadius * 3) + "," + (sizeLine / 2) + ")")
        .attr("class", "values")
        .attr("text-anchor", "left")
        .attr("alignment-baseline","middle")
        .attr("fill", "#1565C0");

    var periods_events = newsvg.selectAll(".tperiod").append("rect")
        .attr("class","objperiod")
        .attr("rx",5)
        .attr("ry",5)
        .attr("height",sizeLine)
        .attr("width", function(d) {
            return (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)));
        });

    // Affichage des textes des périodes
    var txt_periods_events = newsvg.selectAll(".tperiod").append("text")
        .text(function(d) {return d.title;})
        .attr("transform", function(d) {
            return "translate(" + (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)) + (circleRadius)) + "," + (sizeLine / 2) + ")";
        })
        .attr("class", "values")
        .attr("text-anchor", "left")
        .attr("alignment-baseline","middle")
        .attr("fill", "#6A1B9A");

    zoomed();

    // Vérifie si les coordonnées de l'event rentre en collication avec un event déjà dessiné
    function checkOverlap(positionnedEvent, coordEvent) {
        var overlapFound = false;
        positionnedEvent.forEach(function(elt, index, array) {
                    // Test Overlap
          if ((Math.max(coordEvent.minX,elt.minX) < Math.min(coordEvent.maxX,elt.maxX)) && (Math.max(coordEvent.minY,elt.minY) < Math.min(coordEvent.maxY,elt.maxY))) {
              overlapFound = true;
          }
        });
        return overlapFound
    }

    function zoomed(d) {
        console.log(zoom.translate());
        svg.select(".x.axis").call(xAxis);
        //Pour les cercle on eleve le rayon afin que le centre du cercle soit pile sur la date
        newsvg.selectAll("g.tevent.tdate").attr("transform", function(d) {
          var tr = d3.transform(d3.select(this).attr("transform")).translate;
          return "translate(" + (tScale(new Date(d.startDate)) - circleRadius) + "," + tr[1] + ")";
        });
        newsvg.selectAll("g.tevent.tperiod").attr("transform", function(d) {
          var tr = d3.transform(d3.select(this).attr("transform")).translate;
          return "translate(" + tScale(new Date(d.startDate)) + "," + tr[1] + ")";
        });
        // On élargie / réduit les périodes en fonction du zoom
        periods_events.attr("width", function(d) {
            return (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)));
        });
        txt_periods_events.attr("transform", function(d) {
            return "translate(" + (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)) + (circleRadius)) + "," + (sizeLine / 2) + ")";
        });

        //Tableau des coordonnées des évenements déjà correctement positionnés
        var parsed = [];

        // Positionnement sur l'axe Y pour gérer les chevauchements
        // Cela suppose que les données ait été triées et donc que les balises g soient dans
        // l'ordre chronologique
        events.each(function(d,i) {

            // On calule le rectangle occupé par l'élément
            var tr = d3.transform(d3.select(this).attr("transform")).translate;
            var rectHeight = this.getBBox().height;
            var coordEvent = {
              minX : tr[0],
              maxX : this.getBBox().width + tr[0],
              minY : tr[1],
              maxY : rectHeight + tr[1]
            };
            // Si il y a une collision on essai de le repositionner au plus haut
            if (checkOverlap(parsed,coordEvent)) {
                coordEvent.minY = 0;
                coordEvent.maxY = rectHeight;
                var collisionCorrected = false;
                while(coordEvent.maxY <= h-30) {
                    if (! checkOverlap(parsed,coordEvent)) {
                        // Plus de collision, on sort
                        collisionCorrected = true;
                        break;
                    } else {
                        coordEvent.minY = coordEvent.minY + 10;
                        coordEvent.maxY = coordEvent.minY + rectHeight;
                    }
                }
                // Si la collision n'a pu être corrigé, on positionne tout en haut
                if (! collisionCorrected) {
                    coordEvent.minY = 50;
                    coordEvent.maxY = coordEvent.minY + rectHeight;
                }
            }

            parsed.push(coordEvent);
            // On positionne correctement l'évènement
            d3.select(this).attr("transform", function () {
                 var transform = d3.transform(d3.select(this)
                      .attr("transform"));
                 return "translate("+transform.translate[0]+", " + coordEvent.minY + ")";
            });
        });
    }
}



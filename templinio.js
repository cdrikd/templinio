// Templinio : Timeline using d3js
// It's only a proof of concept
// Size of the timeline
var w = 800;
var h = 300;

var paddingData = 5; // Padding entre les différentes dates et la hauteur
var sizeLine = 20; // Taille en pixel des rond et rectancles ainsi que du texte
// Nombre de lignes de dates possibles . Hauteur - axe - (padding haut et bas)
var nbLine = Math.floor((h - 30 - (2 * paddingData)) / (sizeLine + paddingData));
console.log(nbLine);

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

d3.json("example.json", function(json) {
    dataset = json;
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

    function transform(d) {
        // Test var calCY = Math.floor((Math.random() * nbLine) * (paddingData + sizeLine) + paddingData);
        return "translate("+tScale(new Date(d.startDate)) + ")";
    }

    function transformDatesText(d) {
        return "translate(" + (tScale(new Date(d.startDate))+8) + ")";
    }

    function transformPeriodsText(d) {
        return "translate(" + (tScale(new Date(d.endDate))+8) + ")";
    }

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
            .attr("transform", transform)
            .attr("fill","#2196F3")
            .attr("r",sizeLine / 4);

    // Affichage des textes des dates
    var txt_dates_events = newsvg.selectAll(".tdate").append("text")
        .text(function(d) {return d.title;})
        .attr("transform", transformDatesText)
        .attr("class", "values")
        .attr("text-anchor", "left")
        .attr("alignment-baseline","middle")
        .attr("fill", "#1565C0");

    var periods_events = newsvg.selectAll(".tperiod").append("rect")
        .attr("class","objperiod")
        .attr("x", function(d) {
            return tScale(new Date(d.startDate));
        })
        .attr("height",sizeLine)
        .attr("width", function(d) {
            return (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)));
        });

    // Affichage des textes des périodes
    var txt_periods_events = newsvg.selectAll(".tperiod").append("text")
        .text(function(d) {return d.title;})
        .attr("transform", transformPeriodsText)
        .attr("class", "values")
        .attr("text-anchor", "left")
        .attr("alignment-baseline","middle")
        .attr("fill", "#6A1B9A");

    zoomed();

    function zoomed(d) {
        svg.select(".x.axis").call(xAxis);
        dates_events.attr("transform", transform);
        txt_dates_events.attr("transform", transformDatesText);

        periods_events.attr("x", function(d) {
            return tScale(new Date(d.startDate));
        })
        .attr("width", function(d) {
            return (tScale(new Date(d.endDate)) - tScale(new Date(d.startDate)));
        });
        // Repositionne les legendes des periodes
        txt_periods_events.attr("transform", transformPeriodsText);

        var currentLine = 0;
        events.each(function(d,i) {
            if (currentLine === nbLine) {
                currentLine = 0;
            }
            var newY = paddingData + ((sizeLine + paddingData) * currentLine);
            console.log(newY);

            d3.select(this).select("text").attr("transform", function () {
                 var transform = d3.transform(d3.select(this).attr("transform"));
                 return "translate("+transform.translate[0]+", " + (newY + (sizeLine / 2)) + ")";
            });

            d3.select(this).select("circle").attr("transform", function () {
                 var transform = d3.transform(d3.select(this).attr("transform"));
                 return "translate("+transform.translate[0]+", " + (newY + (sizeLine / 2)) + ")";
            });

            d3.select(this).select("rect").attr("transform", function () {
                 var transform = d3.transform(d3.select(this).attr("transform"));
                 return "translate("+transform.translate[0]+", " + newY + ")";
            });

//            d3.select(this).select("circle").attr("transform", "translate(0," + newY + ")");
  //          d3.select(this).select("rect").attr("transform", "translate(0," + newY + ")");
            currentLine++;
        });
    }
}



const SPORTS_COUNT_CSV = 'deportes_jjoo.csv';
const ATLETAS_TODOS_EVENTO_CON_PAIS_CSV = 'atletas_todos_evento_con_pais.csv';
const ATLETAS_TODOS_EVENTO_SIN_PAIS_CSV = 'atletas_todos_evento_sin_pais.csv';

var margin = {top: 10, right: 10, bottom: 10, left: 10},
TREEMAP_WIDTH = 1200 - margin.left - margin.right,
  TREEMAP_HEIGHT = 725 - margin.top - margin.bottom;

const treemapContainer = d3.select('#treemap-container');
const lineaChartContainer = d3.select('#linea-chart-container')

const svg_histogram = lineaChartContainer
  .append('svg')
    .attr("width", TREEMAP_WIDTH + margin.left + margin.right)
    .attr("height", TREEMAP_HEIGHT + margin.top + margin.bottom)

const g = svg_histogram.append("g")
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xAxis = svg_histogram.append("g")
  .attr('transform', `translate(${margin.left * 4}, ${TREEMAP_HEIGHT})`);

const yAxis = svg_histogram.append("g")
  .attr('transform', `translate(${margin.left * 4}, ${margin.top})`);


d3.csv(SPORTS_COUNT_CSV, parseSportCount).then((sports) => {
  d3.csv(ATLETAS_TODOS_EVENTO_SIN_PAIS_CSV, parseAtletasTodosEventoSinPais).then((atletasSinPais) => {
    d3.csv(ATLETAS_TODOS_EVENTO_CON_PAIS_CSV, parseAtletasTodosEventoConPais). then((atletasConPais) => {
      atletasTodosEventoSinPais = JSON.parse(JSON.stringify(atletasSinPais));
      atletasTodosEventoConPais = JSON.parse(JSON.stringify(atletasConPais));
      createTreeMap(sports);
    })
  })
})
.catch((err) => {
  console.log(`Error!!!: ${err}`)
});

function parseSportCount (d) {
  const data = {
    Parent: d.Parent,
    Sport: d.Sport,
    Count: d.Count
  }
  return data;
}

function parseAtletasTodosEventoConPais (d) {
  const data = {
    Year: +d.Year,
    Sport: d.Sport,
    Team: d.Team,
    edad_promedio: +d.edad_promedio,
    altura_promedio: +d.altura_promedio,
    numero_deportistas: +d.numero_deportistas
  }
  return data;
}

function parseAtletasTodosEventoSinPais (d) {
  const data = {
    Year: +d.Year,
    Sport: d.Sport,
    edad_promedio: +d.edad_promedio,
    altura_promedio: +d.altura_promedio,
    numero_deportistas: +d.numero_deportistas
  }
  return data;
}

function createTreeMap(data) {

  const sportColor = d3
    .scaleOrdinal()
    .domain(data.map(d => d.Sport))
    .range(d3.schemeSet2)

  const stratify = d3
    .stratify()
    .id((d) => d.Sport)
    .parentId((d) => d.Parent)

  const root = stratify(data)
    .sum((d) => d.Count)

  const treemap = d3.treemap()
    .size([TREEMAP_WIDTH, TREEMAP_HEIGHT])
    .padding(0)
    .round(true)
    (root)

  const svg_treemap = treemapContainer
    .append("svg")
      .attr("width", TREEMAP_WIDTH + margin.left + margin.right)
      .attr("height", TREEMAP_HEIGHT + margin.top + margin.bottom)

  svg_treemap
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', TREEMAP_WIDTH)
    .attr('height', TREEMAP_HEIGHT);

  const deportes = svg_treemap
  .selectAll("g")
  .data(root.leaves())
  .join(enter => {

    const data_enter = enter.append("g");

    rectangulos = data_enter.append("rect")
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => (d.x1 - d.x0))
      .attr('height', d => (d.y1 - d.y0))
      .style("stroke", "black")
      .style("fill", d => sportColor(d.id));

    nombre_deporte = data_enter.append("text")
      .attr('x', d => d.x0 + (d.x1 - d.x0)/2)
      .attr('y', d => d.y0 + (d.y1 - d.y0)/5)
      .text(d => d.id)
      .attr("font-size", d => (d.x1 - d.x0)/10)      
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .style('font-weight','bold');

    numero_deporte = data_enter.append("text")
      .attr('x', d => d.x0 + (d.x1 - d.x0)/2)
      .attr('y', d => d.y0 + (d.y1 - d.y0)/2.5)
      .text(d => d.data.Count)
      .attr("font-size", d => (d.x1 - d.x0)/10)      
      .attr("fill", "black")
      .style("text-anchor", "middle")

    data_enter.on('mouseover', (e, d) => mouseOver(e, d))

    data_enter.on('click', (e, d) => {
      data_enter.attr('opacity', (data) => data.id === d.id ? 1 : 0.7)
      createHistogramSport(d.id)
    })

  });

  const manejadorZoom = (evento) => {
    const tranformacion = evento.transform;
    svg_treemap.attr("transform", tranformacion);
  };

  const zoom = d3.zoom()
    .extent([[0, 0], [ TREEMAP_WIDTH, TREEMAP_HEIGHT]])
    .translateExtent([[0, -200], [ TREEMAP_WIDTH, TREEMAP_HEIGHT]])
    .scaleExtent([1, 4])
    .on("zoom", manejadorZoom)

  svg_treemap.call(zoom)

  function mouseOver(event, d) {
    console.log('Estoy pasando el mouse por arriba')
  }

  function createHistogramSport(sportData) {
    const filteredAthletesForSport = atletasTodosEventoSinPais.filter(a => sportData === a.Sport);
    atletasDataJoin(filteredAthletesForSport);
  };

};

function atletasDataJoin(data) {

  const escalaY = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.numero_deportistas)])
    .range([TREEMAP_HEIGHT - margin.top, 0])

  yAxis.transition().duration(2000)
    .call(d3.axisLeft(escalaY))
    .attr("transform", 
          "translate(" + margin.left*4 + "," + margin.top + ")")

  const escalaX = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)])
    .range([0, TREEMAP_WIDTH - margin.right*8])


  xAxis.transition().duration(2000)
    .call(d3.axisBottom(escalaX).tickFormat(d3.format("d")))
    .attr("transform", "translate(" + margin.left * 4 + "," + (TREEMAP_HEIGHT) + ")")

  g
    .selectAll("path")
    .data(data)
    .join(
      (enter) => {

        line = enter.append("path")
          .datum(data)
          .attr("d", d3.line()
            .x(d => escalaX(d.Year))
            .y(d => escalaY(d.numero_deportistas))
          )
          .transition()
          .duration(2000)
          .attr('fill', 'none')
          .attr("stroke", "black")
          .attr("stroke-width", 2)
          .attr("transform", 
            "translate(" + margin.left * 4 + "," + margin.top + ")")
        
        },
        (update) => {
          update
            .datum(data)
            .transition()
            .duration(2000)
            .attr("d", d3.line()
              .x(d => escalaX(d.Year))
              .y(d => escalaY(d.numero_deportistas))
            )
            .attr('fill', 'none')
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("transform", 
              "translate(" + margin.left * 4 + "," + margin.top + ")")
        },
    )

  

    // circle = enter.append('circle')
          //   .attr('cx', d => xAxis(d.Year))
          //   .attr('cy', d => yAxis(d.numero_deportistas))
          //   .transition()
          //   .duration(2000)
          //   .attr('r', rad)
          //   .style("fill", "#69b3a2")
          //   .attr("transform", 
          //     "translate(" + margin.left*4 + "," + margin.top + ")")
            
    
          // circle.on('mouseover', (e, d) => mouseOverCircle(e, d))


  function mouseOverCircle(event, d) {
    console.log(`Este circulo representa el evento: ${event}`)
    console.log(`Este circulo representa el d: ${d.Year}`)
    console.log(`Promedio de altura: ${d.altura_promedio}cm`)


  }
};
// Grouped bar chart computed directly from BRFSS_2024_full.csv
console.log("script.js loaded");

const margin = { top: 40, right: 20, bottom: 70, left: 70 };
const width = 980 - margin.left - margin.right;
const height = 520 - margin.top - margin.bottom;

// Color palette
const colorScale = d3.scaleOrdinal()
  .domain([
    "No Risk Factors",
    "Smoker Only",
    "Diabetes Only",
    "One Other Factor",
    "Two Risk Factors",
    "3+ Risk Factors"
  ])
  .range([
    "#059669",
    "#2563eb",
    "#f97316",
    "#f59e0b",
    "#ea580c",
    "#b91c1c"
  ]);

// SVG and tooltip
const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Scales
const x0 = d3.scaleBand().paddingInner(0.15).paddingOuter(0.05);
const x1 = d3.scaleBand().padding(0.1);
const y = d3.scaleLinear();

// Axes groups
const xAxisGroup = svg.append("g")
  .attr("class", "axis axis--x")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = svg.append("g")
  .attr("class", "axis axis--y");

// Axis titles
const yAxisTitle = svg.append("text")
  .attr("class", "axis-title")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .attr("text-anchor", "middle")
  .text("Stroke prevalence (%)");

svg.append("text")
  .attr("class", "axis-title")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .text("Age group (years)");

// Legend
const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(0,-30)");

const riskOrder = [
  "No Risk Factors",
  "Smoker Only",
  "Diabetes Only",
  "One Other Factor",
  "Two Risk Factors",
  "3+ Risk Factors"
];

riskOrder.forEach((rp, i) => {
  const g = legend.append("g")
    .attr("transform", `translate(${i * 150},0)`);

  g.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", colorScale(rp))
    .attr("stroke", "#111827")
    .attr("stroke-width", 0.7);

  g.append("text")
    .attr("x", 18)
    .attr("y", 0)
    .attr("dominant-baseline", "central")
    .text(rp);
});

// Helper: map _AGE_G to labels (same mapping as codebook).[web:60][web:63][web:69]
function mapAgeGroup(code) {
  const c = +code;
  if (c === 1) return "18-34";
  if (c === 2) return "35-44";
  if (c === 3) return "45-54";
  if (c === 4) return "55-64";
  if (c === 5) return "65-74";
  if (c === 6) return "75+";
  return null;
}

// Helper: assign risk_profile from risk_factor_count
function assignRiskProfile(row) {
  const count = row.risk_factor_count;
  if (count === 0) return "No Risk Factors";
  if (count === 1) {
    if (row.is_smoker) return "Smoker Only";
    if (row.has_diabetes) return "Diabetes Only";
    return "One Other Factor";
  }
  if (count === 2) return "Two Risk Factors";
  return "3+ Risk Factors";
}
console.log("Data Loading Started");
// Load full BRFSS dataset and aggregate client-side
// Load full BRFSS dataset and aggregate client-side
//d3.csv("data/BRFSS_small_25000_data.csv").then(raw => {
d3.csv("https://raw.githubusercontent.com/ShahriyarHridoy/D3-js_Interactive-Visualization-with-BRFSS_2024_Dataset/main/data/BRFSS_small_25000_data.csv").then(raw => {
  console.log("Raw rows loaded:", raw.length);

  const records = raw.map(d => {
    const age_group = mapAgeGroup(d["_AGE_G"]);
    if (!age_group) return null;

    const had_stroke = +d["CVDSTRK3"] === 1 ? 1 : 0;
    const has_heart_disease = +d["CVDCRHD4"] === 1 ? 1 : 0;
    const has_diabetes = +d["DIABETE4"] === 1 ? 1 : 0;
    const has_prediabetes = +d["PREDIAB2"] === 1 ? 1 : 0;
    const is_smoker = +d["_RFSMOK3"] === 1 ? 1 : 0;
    const is_obese = +d["_RFBMI5"] === 1 ? 1 : 0;

    const risk_factor_count = 
      is_smoker + has_diabetes + has_prediabetes + is_obese + has_heart_disease;

    const row = {
      age_group,
      had_stroke,
      has_diabetes,
      has_prediabetes,
      is_smoker,
      is_obese,
      has_heart_disease,
      risk_factor_count
    };
    row.risk_profile = assignRiskProfile(row);
    return row;
  }).filter(d => d !== null);

  console.log("Usable respondents:", records.length);

  // Aggregate EXACTLY like Python groupby
  const aggregated = d3.rollups(
    records,
    v => {
      const stroke_cases = d3.sum(v, d => d.had_stroke);
      const total = v.length;
      const stroke_rate = total > 0 ? stroke_cases / total : 0;
      return {
        stroke_cases,
        total,
        stroke_rate_pct: stroke_rate * 100
      };
    },
    d => d.age_group,
    d => d.risk_profile
  );

  const flatData = [];
  aggregated.forEach(([age_group, rpArray]) => {
    rpArray.forEach(([risk_profile, stats]) => {
      flatData.push({
        age_group,
        risk_profile,
        stroke_cases: stats.stroke_cases,
        total: stats.total,
        stroke_rate_pct: stats.stroke_rate_pct
      });
    });
  });

  console.log("Aggregated groups:", flatData.length);
  console.log("Sample data:", flatData.slice(0, 3));

  // Rest of chart code stays exactly the same...


  // Now build chart from flatData
  const ageGroups = Array.from(new Set(flatData.map(d => d.age_group)))
    .sort((a, b) => {
      const order = ["18-34", "35-44", "45-54", "55-64", "65-74", "75+"];
      return order.indexOf(a) - order.indexOf(b);
    });

  const riskProfiles = riskOrder.filter(rp =>
    flatData.some(d => d.risk_profile === rp)
  );

  x0.domain(ageGroups).range([0, width]);
  x1.domain(riskProfiles).range([0, x0.bandwidth()]);

  let currentMetric = "stroke_rate_pct";

  const select = document.getElementById("metric-select");
  select.addEventListener("change", e => {
    currentMetric = e.target.value;
    updateChart(flatData, currentMetric, true);
  });

  updateChart(flatData, currentMetric, false);
}).catch(err => {
  console.error("Error loading BRFSS_2024_full.csv:", err);
});

function updateChart(data, metric, animate) {
  const maxVal = d3.max(data, d => d[metric]);
  y.domain([0, maxVal * 1.1]).range([height, 0]);

  yAxisTitle.text(
    metric === "stroke_rate_pct" ? "Stroke prevalence (%)" : "Stroke cases (count)"
  );

  const yAxis = d3.axisLeft(y).ticks(7).tickFormat(d => {
    if (metric === "stroke_rate_pct") return d.toFixed(1) + "%";
    return d3.format(",")(d);
  });
  const xAxis = d3.axisBottom(x0);

  if (animate) {
    yAxisGroup.transition().duration(700).call(yAxis);
  } else {
    yAxisGroup.call(yAxis);
  }

  xAxisGroup.call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle");

  const groups = svg.selectAll(".age-group")
    .data(d3.group(data, d => d.age_group), d => d[0]);

  const groupsEnter = groups.enter()
    .append("g")
    .attr("class", "age-group")
    .attr("transform", d => `translate(${x0(d[0])},0)`);

  const groupsMerge = groupsEnter.merge(groups)
    .attr("transform", d => `translate(${x0(d[0])},0)`);

  const bars = groupsMerge.selectAll("rect.bar")
    .data(d => d[1], d => d.risk_profile);

  const barsEnter = bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x1(d.risk_profile))
    .attr("width", x1.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", d => colorScale(d.risk_profile))
    .attr("opacity", 0.92)
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).attr("opacity", 1);

      tooltip.transition().duration(150).style("opacity", 1);

      const valueStr = metric === "stroke_rate_pct"
        ? d[metric].toFixed(2) + " %"
        : d3.format(",")(d[metric]) + " cases";

      tooltip
        .html(
          `<strong>Age:</strong> ${d.age_group}<br>` +
          `<strong>Risk profile:</strong> ${d.risk_profile}<br>` +
          `<strong>${metric === "stroke_rate_pct" ? "Prevalence" : "Stroke cases"}:</strong> ${valueStr}<br>` +
          `<strong>Sample size:</strong> ${d3.format(",")(d.total)}`
        )
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", event => {
      d3.select(event.currentTarget).attr("opacity", 0.92);
      tooltip.transition().duration(200).style("opacity", 0);
    });

  const barsMerge = barsEnter.merge(bars);

  const trans = animate ? barsMerge.transition().duration(700) : barsMerge;
  trans
    .attr("x", d => x1(d.risk_profile))
    .attr("width", x1.bandwidth())
    .attr("y", d => y(d[metric]))
    .attr("height", d => height - y(d[metric]));

  bars.exit().transition().duration(400)
  
    .attr("y", y(0))
    .attr("height", 0)
    .remove();

  groups.exit().remove();
}

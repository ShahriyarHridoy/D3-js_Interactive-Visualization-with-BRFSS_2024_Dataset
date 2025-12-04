// BRFSS 2024 Stroke Analysis - Interactive Visualization
// Developed by: S M Shahriyar (12533559)

console.log("Loading visualization script...");

// Chart dimensions
const margin = { top: 60, right: 20, bottom: 70, left: 70 };
const width = 980 - margin.left - margin.right;
const height = 520 - margin.top - margin.bottom;

// Define available color schemes
const colorPalettes = {
  default: {
    name: "Default",
    colors: [
      "#059669",
      "#2563eb",
      "#f97316",
      "#a855f7",
      "#b91c1c",
      "#ec4899",
      "#06b6d4",
      "#ea580c",
      "#7c3aed",
      "#db2777",
      "#0891b2",
      "#c026d3",
      "#0284c7",
      "#9333ea",
      "#be123c",
      "#4338ca",
      "#94a3b8",
    ],
  },
  categorical: {
    name: "Categorical",
    colors: [
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#66c2a5",
      "#fc8d62",
      "#8da0cb",
      "#e78ac3",
      "#a6d854",
      "#ffd92f",
      "#e5c494",
      "#b3b3b3",
      "#8dd3c7",
    ],
  },
  warm: {
    name: "Warm",
    colors: [
      "#8c2d04",
      "#cc4c02",
      "#ec7014",
      "#fe9929",
      "#fec44f",
      "#fee391",
      "#d94801",
      "#f16913",
      "#fd8d3c",
      "#fdae6b",
      "#fdd0a2",
      "#feedde",
      "#a63603",
      "#e6550d",
      "#fd8d3c",
      "#fdae6b",
      "#fdd0a2",
    ],
  },
  cool: {
    name: "Cool",
    colors: [
      "#08519c",
      "#3182bd",
      "#6baed6",
      "#9ecae1",
      "#c6dbef",
      "#eff3ff",
      "#08306b",
      "#2171b5",
      "#4292c6",
      "#6baed6",
      "#9ecae1",
      "#c6dbef",
      "#084594",
      "#2171b5",
      "#4292c6",
      "#6baed6",
      "#9ecae1",
    ],
  },
  vibrant: {
    name: "Vibrant",
    colors: [
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
      "#ffeb3b",
      "#ffc107",
      "#ff9800",
      "#ff5722",
      "#795548",
      "#9e9e9e",
    ],
  },
  pastel: {
    name: "Pastel",
    colors: [
      "#ffcdd2",
      "#f8bbd0",
      "#e1bee7",
      "#d1c4e9",
      "#c5cae9",
      "#bbdefb",
      "#b3e5fc",
      "#b2ebf2",
      "#b2dfdb",
      "#c8e6c9",
      "#dcedc8",
      "#f0f4c3",
      "#fff9c4",
      "#ffecb3",
      "#ffe0b2",
      "#ffccbc",
      "#d7ccc8",
    ],
  },
};

let currentPalette = "default";

// Setup color scale for risk profiles
const colorScale = d3
  .scaleOrdinal()
  .domain([
    "No Risk Factors",
    "Smoker Only",
    "Diabetes Only",
    "Prediabetes Only",
    "Obesity Only",
    "Heart Disease Only",
    "Two Risk Factors",
    "3+ Risk Factors",
    "Smoker + Diabetes",
    "Smoker + Obesity",
    "Diabetes + Obesity",
    "Diabetes + Heart Disease",
    "Obesity + Heart Disease",
    "Smoker + Diabetes + Obesity",
    "Diabetes + Obesity + Heart Disease",
    "Smoker + Diabetes + Heart Disease",
    "Other Combinations",
  ])
  .range(colorPalettes[currentPalette].colors);

// Create main SVG container
const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip for bar hover
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Create toast notification element
const toast = d3
  .select("body")
  .append("div")
  .attr("class", "toast")
  .style("position", "fixed")
  .style("top", "20px")
  .style("right", "20px")
  .style("background", "#ef4444")
  .style("color", "white")
  .style("padding", "16px 24px")
  .style("border-radius", "8px")
  .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
  .style("font-size", "14px")
  .style("font-weight", "600")
  .style("opacity", "0")
  .style("transform", "translateY(-20px)")
  .style("transition", "all 0.3s ease")
  .style("z-index", "10000")
  .style("pointer-events", "none");

// Show notification message
function showToast(message, type = "error") {
  const colors = {
    error: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
  };

  const icons = {
    error: "⚠️",
    success: "✓",
    warning: "⚠️",
    info: "ℹ️",
  };

  toast
    .style("background", colors[type])
    .html(`<span style="margin-right: 8px;">${icons[type]}</span>${message}`)
    .style("opacity", "1")
    .style("transform", "translateY(0)");

  setTimeout(() => {
    toast.style("opacity", "0").style("transform", "translateY(-20px)");
  }, 3000);
}

// Initialize scales
const x0 = d3.scaleBand().paddingInner(0.15).paddingOuter(0.05);
const x1 = d3.scaleBand().padding(0.1);
const y = d3.scaleLinear();

// Setup axis groups
const xAxisGroup = svg
  .append("g")
  .attr("class", "axis axis--x")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = svg.append("g").attr("class", "axis axis--y");

// Add axis labels
const yAxisTitle = svg
  .append("text")
  .attr("class", "axis-title")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .attr("text-anchor", "middle")
  .text("Stroke prevalence (%)");

svg
  .append("text")
  .attr("class", "axis-title")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .text("Age group (years)");

// Legend container
const legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("transform", "translate(0,-45)");

// Convert BRFSS age codes to readable labels
function mapAgeGroup(code) {
  const ageMap = {
    1: "18-34",
    2: "35-44",
    3: "45-54",
    4: "55-64",
    5: "65-74",
    6: "75+",
  };
  return ageMap[+code] || null;
}

// Count risk factors from label text
function countRiskFactorsInLabel(label) {
  if (label === "No Risk Factors") return 0;
  if (label === "Two Risk Factors") return 2;
  if (label === "3+ Risk Factors") return 3;

  const plusCount = (label.match(/\+/g) || []).length;
  return plusCount + 1;
}

// Get sorting priority based on risk count
function getRiskSortPriority(label) {
  const count = countRiskFactorsInLabel(label);
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

// Sort risk profiles in logical order
function sortRiskProfilesSequentially(riskProfiles) {
  return riskProfiles.sort((a, b) => {
    const priorityA = getRiskSortPriority(a);
    const priorityB = getRiskSortPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.localeCompare(b);
  });
}

// Assign default risk profile based on factor count
function assignRiskProfile(row) {
  const count = row.risk_factor_count;

  if (count === 0) return "No Risk Factors";

  if (count === 1) {
    if (row.is_smoker) return "Smoker Only";
    if (row.has_diabetes) return "Diabetes Only";
  }

  if (count === 2) return "Two Risk Factors";

  return "3+ Risk Factors";
}

// Assign custom risk profile based on user selection
function assignCustomRiskProfile(row, selectedCombinations) {
  if (selectedCombinations.length === 0) {
    return assignRiskProfile(row);
  }

  // Check for no risk factors option
  if (selectedCombinations.includes("no_risk_factors")) {
    if (row.risk_factor_count === 0) {
      return "No Risk Factors";
    }
  }

  // Check each selected combination
  for (let combo of selectedCombinations) {
    if (combo === "no_risk_factors") continue;

    const factors = combo.split(",");
    const hasAllFactors = factors.every((factor) => row[factor] === 1);

    // Count active risk factors
    const activeFactors = [];
    if (row.is_smoker === 1) activeFactors.push("is_smoker");
    if (row.has_diabetes === 1) activeFactors.push("has_diabetes");
    if (row.has_prediabetes === 1) activeFactors.push("has_prediabetes");
    if (row.is_obese === 1) activeFactors.push("is_obese");
    if (row.has_heart_disease === 1) activeFactors.push("has_heart_disease");

    // Match must be exact - same factors, no extras
    const hasExactMatch =
      hasAllFactors && activeFactors.length === factors.length;

    if (hasExactMatch) {
      const labels = {
        is_smoker: "Smoker",
        has_diabetes: "Diabetes",
        has_prediabetes: "Prediabetes",
        is_obese: "Obesity",
        has_heart_disease: "Heart Disease",
      };
      return factors.map((f) => labels[f]).join(" + ");
    }
  }

  return null;
}

// Global state variables
let allRecords = [];
let currentMetric = "stroke_rate_pct";
let customMode = false;
let selectedRiskCombinations = [];

console.log("Starting data load...");

// Load dataset from GitHub
d3.csv(
  "https://raw.githubusercontent.com/ShahriyarHridoy/D3-js_Interactive-Visualization-with-BRFSS_2024_Dataset/main/data/BRFSS_small_100000_data.csv?v1"
)
  .then((raw) => {
    console.log(`Loaded ${raw.length} records`);

    // Process each row
    allRecords = raw
      .map((d) => {
        const age_group = mapAgeGroup(d["_AGE_G"]);
        if (!age_group) return null;

        // Extract health indicators
        const had_stroke = +d["CVDSTRK3"] === 1 ? 1 : 0;
        const has_heart_disease = +d["CVDCRHD4"] === 1 ? 1 : 0;
        const has_diabetes = +d["DIABETE4"] === 1 ? 1 : 0;
        const has_prediabetes = +d["PREDIAB2"] === 1 ? 1 : 0;
        const is_smoker = +d["_RFSMOK3"] === 1 ? 1 : 0;
        const is_obese = +d["_RFBMI5"] === 1 ? 1 : 0;

        const risk_factor_count =
          is_smoker +
          has_diabetes +
          has_prediabetes +
          is_obese +
          has_heart_disease;

        return {
          age_group,
          had_stroke,
          has_diabetes,
          has_prediabetes,
          is_smoker,
          is_obese,
          has_heart_disease,
          risk_factor_count,
        };
      })
      .filter((d) => d !== null);

    console.log(`Processed ${allRecords.length} valid records`);

    // Initial render
    renderChart(allRecords, false, []);
    setupUIInteractions();
  })
  .catch((err) => {
    console.error("Failed to load data:", err);
  });

// Main chart rendering function
function renderChart(records, isCustomMode, selectedCombos) {
  // Assign risk profiles to each record
  const processedRecords = records
    .map((row) => ({
      ...row,
      risk_profile: isCustomMode
        ? assignCustomRiskProfile(row, selectedCombos)
        : assignRiskProfile(row),
    }))
    .filter((row) => row.risk_profile !== null);

  // Aggregate by age group and risk profile
  const aggregated = d3.rollups(
    processedRecords,
    (v) => {
      const stroke_cases = d3.sum(v, (d) => d.had_stroke);
      const total = v.length;
      const stroke_rate = total > 0 ? stroke_cases / total : 0;
      return {
        stroke_cases,
        total,
        stroke_rate_pct: stroke_rate * 100,
      };
    },
    (d) => d.age_group,
    (d) => d.risk_profile
  );

  // Flatten nested structure
  const flatData = [];
  aggregated.forEach(([age_group, rpArray]) => {
    rpArray.forEach(([risk_profile, stats]) => {
      flatData.push({
        age_group,
        risk_profile,
        stroke_cases: stats.stroke_cases,
        total: stats.total,
        stroke_rate_pct: stats.stroke_rate_pct,
      });
    });
  });

  // Get unique profiles and sort them
  let riskProfiles = Array.from(new Set(flatData.map((d) => d.risk_profile)));
  riskProfiles = sortRiskProfilesSequentially(riskProfiles);

  console.log("Risk profiles:", riskProfiles);

  // Update color assignments
  const fullColors = colorPalettes[currentPalette].colors;
  const range = riskProfiles.map((label, i) => {
    if (label === "No Risk Factors") return fullColors[0];
    return fullColors[i];
  });
  colorScale.domain(riskProfiles).range(range);

  updateLegend(riskProfiles);

  // Setup scales
  const ageGroups = ["18-34", "35-44", "45-54", "55-64", "65-74", "75+"];
  x0.domain(ageGroups).range([0, width]);
  x1.domain(riskProfiles).range([0, x0.bandwidth()]);

  updateChart(flatData, currentMetric, true);
}

// Update legend display
function updateLegend(riskProfiles) {
  legend.selectAll("*").remove();

  const itemsPerRow = 3;
  const itemWidth = 230;
  const itemHeight = 28;

  riskProfiles.forEach((rp, i) => {
    const row = Math.floor(i / itemsPerRow);
    const col = i % itemsPerRow;

    const g = legend
      .append("g")
      .attr("transform", `translate(${col * itemWidth},${row * itemHeight})`);

    g.append("rect")
      .attr("x", 0)
      .attr("y", -10)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", colorScale(rp))
      .attr("stroke", "#111827")
      .attr("stroke-width", 0.8)
      .attr("rx", 2);

    const text = g
      .append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("dominant-baseline", "central")
      .style("font-size", "0.75rem")
      .style("font-weight", "500");

    // Truncate long labels
    const maxLength = 28;
    if (rp.length > maxLength) {
      text
        .text(rp.substring(0, maxLength) + "...")
        .append("title")
        .text(rp);
    } else {
      text.text(rp);
    }
  });
}

// Update chart with new data or settings
function updateChart(data, metric, animate) {
  // Re-sort profiles for consistency
  let riskProfiles = Array.from(new Set(data.map((d) => d.risk_profile)));
  riskProfiles = sortRiskProfilesSequentially(riskProfiles);

  // Update colors
  const fullColors = colorPalettes[currentPalette].colors;
  const range = riskProfiles.map((label, i) => {
    if (label === "No Risk Factors") return fullColors[0];
    return fullColors[i];
  });
  colorScale.domain(riskProfiles).range(range);

  const maxVal = d3.max(data, (d) => d[metric]);
  y.domain([0, maxVal * 1.1]).range([height, 0]);

  yAxisTitle.text(
    metric === "stroke_rate_pct"
      ? "Stroke prevalence (%)"
      : "Stroke cases (count)"
  );

  const yAxis = d3
    .axisLeft(y)
    .ticks(7)
    .tickFormat((d) =>
      metric === "stroke_rate_pct" ? d.toFixed(1) + "%" : d3.format(",")(d)
    );

  const xAxis = d3.axisBottom(x0);

  if (animate) {
    yAxisGroup.transition().duration(700).call(yAxis);
  } else {
    yAxisGroup.call(yAxis);
  }

  xAxisGroup
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .style("font-weight", "500");

  // Update age groups
  const groups = svg.selectAll(".age-group").data(
    d3.group(data, (d) => d.age_group),
    (d) => d[0]
  );

  const groupsEnter = groups
    .enter()
    .append("g")
    .attr("class", "age-group")
    .attr("transform", (d) => `translate(${x0(d[0])},0)`);

  const groupsMerge = groupsEnter
    .merge(groups)
    .attr("transform", (d) => `translate(${x0(d[0])},0)`);

  // Update bars
  const bars = groupsMerge.selectAll("rect.bar").data(
    (d) => d[1],
    (d) => d.risk_profile
  );

  const barsEnter = bars
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x1(d.risk_profile))
    .attr("width", x1.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", (d) => colorScale(d.risk_profile))
    .attr("opacity", 0.92)
    .attr("stroke", "#1f2937")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .attr("opacity", 1)
        .attr("stroke-width", 1.5);

      tooltip.transition().duration(150).style("opacity", 1);

      const valueStr =
        metric === "stroke_rate_pct"
          ? d[metric].toFixed(2) + " %"
          : d3.format(",")(d[metric]) + " cases";

      tooltip
        .html(
          `<strong>Age:</strong> ${d.age_group}<br>` +
            `<strong>Risk profile:</strong> ${d.risk_profile}<br>` +
            `<strong>${
              metric === "stroke_rate_pct" ? "Prevalence" : "Stroke cases"
            }:</strong> ${valueStr}<br>` +
            `<strong>Sample size:</strong> ${d3.format(",")(d.total)}`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget)
        .attr("opacity", 0.92)
        .attr("stroke-width", 0.5);
      tooltip.transition().duration(200).style("opacity", 0);
    });

  const barsMerge = barsEnter.merge(bars);
  const trans = animate ? barsMerge.transition().duration(700) : barsMerge;

  trans
    .attr("x", (d) => x1(d.risk_profile))
    .attr("width", x1.bandwidth())
    .attr("y", (d) => y(d[metric]))
    .attr("height", (d) => height - y(d[metric]))
    .attr("fill", (d) => colorScale(d.risk_profile));

  bars
    .exit()
    .transition()
    .duration(400)
    .attr("y", y(0))
    .attr("height", 0)
    .remove();

  groups.exit().remove();
}

// Setup UI event handlers
function setupUIInteractions() {
  const MAX_SELECTIONS = 5;

  // Metric selector
  const metricSelect = document.getElementById("metric-select");
  if (metricSelect) {
    metricSelect.addEventListener("change", (e) => {
      currentMetric = e.target.value;
      renderChart(allRecords, customMode, selectedRiskCombinations);
    });
  }

  // Color palette selector
  const paletteSelect = document.getElementById("palette-select");
  if (paletteSelect) {
    paletteSelect.addEventListener("change", (e) => {
      currentPalette = e.target.value;
      renderChart(allRecords, customMode, selectedRiskCombinations);
      showToast(
        `Switched to ${colorPalettes[currentPalette].name} palette`,
        "info"
      );
    });
  }

  // Panel controls
  const customizeBtn = document.getElementById("customize-risks-btn");
  const panel = document.getElementById("risk-customization-panel");
  const closeBtn = document.getElementById("close-panel-btn");

  if (customizeBtn && panel) {
    customizeBtn.addEventListener("click", () => {
      const isHidden = panel.style.display === "none";
      panel.style.display = isHidden ? "block" : "none";

      if (isHidden) {
        console.log("Opening customization panel");
        setTimeout(() => setupCheckboxListeners(), 50);
      }
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.style.display = "none";
    });
  }

  // Checkbox event handlers
  function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".risk-checkbox");
    console.log(`Found ${checkboxes.length} checkboxes`);

    if (checkboxes.length === 0) {
      console.error("No checkboxes detected!");
      return;
    }

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("click", function (event) {
        setTimeout(() => {
          const checkedBoxes = document.querySelectorAll(
            ".risk-checkbox:checked"
          );
          const checkedCount = checkedBoxes.length;

          if (checkedCount > MAX_SELECTIONS) {
            event.target.checked = false;
            showToast(
              `You can only select up to ${MAX_SELECTIONS} combinations`,
              "warning"
            );
          }

          updateCheckboxStates();
        }, 10);
      });
    });
  }

  // Update checkbox enabled/disabled state
  function updateCheckboxStates() {
    const checkboxes = document.querySelectorAll(".risk-checkbox");
    const checkedCount = document.querySelectorAll(
      ".risk-checkbox:checked"
    ).length;

    if (checkedCount >= MAX_SELECTIONS) {
      checkboxes.forEach((cb) => {
        if (!cb.checked) {
          cb.disabled = true;
          cb.parentElement.style.opacity = "0.5";
        }
      });
    } else {
      checkboxes.forEach((cb) => {
        cb.disabled = false;
        cb.parentElement.style.opacity = "1";
      });
    }
  }

  setupCheckboxListeners();

  // Apply button
  const applyBtn = document.getElementById("apply-risks-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const selectedCheckboxes = document.querySelectorAll(
        ".risk-checkbox:checked"
      );
      selectedRiskCombinations = Array.from(selectedCheckboxes).map(
        (cb) => cb.value
      );

      if (selectedRiskCombinations.length === 0) {
        showToast("Please select at least one combination", "warning");
        return;
      }

      if (selectedRiskCombinations.length > MAX_SELECTIONS) {
        showToast(`Maximum ${MAX_SELECTIONS} combinations allowed`, "error");
        return;
      }

      customMode = true;
      const viewText = `${selectedRiskCombinations.length} combination(s) selected`;
      const viewTextElement = document.getElementById("current-view-text");
      if (viewTextElement) {
        viewTextElement.textContent = viewText;
      }

      renderChart(allRecords, true, selectedRiskCombinations);
      showToast(
        `Applied ${selectedRiskCombinations.length} combination(s)`,
        "success"
      );

      if (panel) panel.style.display = "none";
    });
  }

  // Reset button
  const resetBtn = document.getElementById("reset-risks-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      customMode = false;
      selectedRiskCombinations = [];

      const checkboxes = document.querySelectorAll(".risk-checkbox");
      checkboxes.forEach((cb) => {
        cb.checked = false;
        cb.disabled = false;
        cb.parentElement.style.opacity = "1";
      });

      const viewTextElement = document.getElementById("current-view-text");
      if (viewTextElement) {
        viewTextElement.textContent = "Default aggregated risk profiles";
      }

      renderChart(allRecords, false, []);
      showToast("View reset to defaults", "info");

      if (panel) panel.style.display = "none";
    });
  }
}

console.log("Script initialization complete");

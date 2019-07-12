// var xhr = new XMLHttpRequest();
// var MKdata = "";
// var a = "123";
// xhr.open('get','http://localhost:3001/futures',true);
// xhr.send();
// xhr.onload = function(){
//     if(this.status == 200){
//       //console.log(xhr.responseText);
//      var MKdata = JSON.parse(xhr.responseText);
//       console.log(MKdata)
//       //for(let i = 0; i < MKdata.length; i++){
//         //console.log(MKdata[i]);
//           //}
//        // a = JSON.stringify(MKdata[0].symbolroot); 
//         //console.log(a); 
//       var MKdataByName = d3.nest()
//       .key(function(d) { return d.name; })
//       .entries(MKdata);

//       console.log(MKdataByName);

//     }else{
//       console.log("資料錯誤");
//     }
//   }

  // --- 轉換巢狀結構的key ---

  
  function reSortRoot(roodata,value_key) {
    for (var key in roodata) {
      if (key == "key") {
        roodata.name = roodata.key;
        delete roodata.key;
      }
      if (key == "values") {
        roodata.children = [];
        for (item in roodata.values) {
          roodata.children.push(reSortRoot(roodata.values[item],value_key));
        }
        delete roodata.values;
      }
      if (key == value_key) {
        roodata.value = parseFloat(roodata[value_key]);
        delete roodata[value_key];
      }
    }
    return roodata;
  }
// --- 轉換巢狀結構的key ---

  d3.text("http://localhost:3001/futures").then(function(text) {
  var MKdata = JSON.parse(text);

  var databytype =  d3.nest()
//.key(function(d) {  return d.futures;})
.key(function(d) {  return d.type;})
.entries(MKdata);
console.log(databytype);

var roodata = {};

roodata.key = "Index";
roodata.values = databytype;

// 修改資料的的key, children名稱，並且依指定規則套用。
roodata = reSortRoot(roodata,"KpData"); //layout用巢狀架構
console.log(roodata)


var data = roodata;

let chartDiv = document.getElementById("chart");
let svg = d3.select(chartDiv).append("svg");

let format = d3.format(",d");

let colors = [
  "#AA2121", //0大漲紅 >5%
  "#C84040", //1中漲紅 >3%
  "#ED7171", //2小漲紅 >0%
  "#7EC17E", //3小跌綠 <0%
  "#518651", //4中跌綠 <3%
  "#215E2C"  //5大跌綠 <5%
];

function getColor(val) {
  let color = "red";
  switch (true) {
    case (val >= 5):
      color = colors[0];
      break;
    case (val < 5 && val >= 3):
        color = colors[1];
        break;
    case (val < 3 && val >= 0):
        color = colors[2];
        break;
    case (val < 0 && val > -3):
        color = colors[3];
        break;
    case (val <= -3 && val > -5):
        color = colors[3];
        break;
    case (val <= -5 ):
        color = colors[3];
        break;
    default:
      color = colors[3]
  }
  return color
}

var tooltip = d3.select("#chart").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function redraw() {
  var width = chartDiv.clientWidth;
  var height = chartDiv.clientHeight;

  d3.select("svg").html("");

  let chart = () => {
    const root = treemap(filteredData);

    const svg = d3.select("svg");

    svg
      .attr("width", width)
      .attr("height", height)
      .classed("svg-content-responsive", true);

    const leaf = svg
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .on("mousemove", function (d) {
        // console.log(d)
        tooltip.transition()
          .duration(300)
          .style("opacity", .98);
        tooltip.html(`<div class="tooltip-body" data-id=${d.data.name} >
          <ul>
            <li>商品: ${d.data.name}</li>
            <li>價格: ${d.data.price}</li>
            <li>成交量: ${d.data.volume}</li>
            <li>漲跌幅: ${d.data.pc}</li>
          </ul>
          
      </div>`)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY + 10) + "px");
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });


    leaf
      .append("rect")
      .attr("id", d => (d.leafUid = "#leaf").id)
      .attr("fill", (d) => getColor(d.data.pc))
      .attr("fill-opacity", 1.0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("class", (d) => "node level-" + d.depth);

    let txt = leaf
      .append("text")
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .attr("class", "shadow")
      .attr("y", function () {
        const parentData = d3.select(this.parentNode).datum();
        return (parentData.y1 - parentData.y0) / 2;
      })
      .attr("font-size", d => Math.min(d.x1 - d.x0, d.y1 - d.y0) / 6);


    txt.append("tspan")
      .text(d => d.data.name)
      .attr("class", "title")
      .attr("dy", "-1.5em")
      .attr("x", function () {
        const parentData = d3.select(this.parentNode).datum();
        return (parentData.x1 - parentData.x0) / 2;
      });

    // Add a <tspan class="author"> for every data element.
    txt.append("tspan")
      .text(d => `$${format(d.data.price )}`)
      .attr("class", "price")
      .attr("dy", "1.4em")
      .attr("x", function () {
        const parentData = d3.select(this.parentNode).datum();
        return (parentData.x1 - parentData.x0) / 2;
      });

    // Add a <tspan class="author"> for every data element.
    txt.append("tspan")
      .text(d => (d.data.pc > 0) ? `+${d.data.pc}` : `${d.data.pc}`)
      .attr("class", "percent")
      .attr("dy", "1.4em")
      .attr("x", function () {
        const parentData = d3.select(this.parentNode).datum();
        return (parentData.x1 - parentData.x0) / 2;
      });

    svg
      .selectAll("titles")
      .data(
        root.descendants().filter(function (d) {
          return d.depth == 1;
        })
      )
      .enter()
      .append('g')
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("dx", (d) => d.x0 + d.x1)
      .attr("dy", (d) => d.y0 + d.y1)
      .append("text")
      .attr("x", (d) => d.x0 + 3)
      .attr("y", (d) => d.y0 + 18)
      .text((d) => d.data.name)
      // .attr("font-size", d => Math.max(d.x1 - d.x0, d.y1 - d.y0) / 22)
      .attr("font-size", "16px")
      .attr("font-weight", "400")
      .attr("fill", "#fff");

    return svg.node();
  };

  let filteredData = d3
    .hierarchy(data)
    .sum(d => d.volume)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  let reg = d3.selectAll("input[name='dtype']").on("change", function () {
    let dtype = this.value;
  });

  let treemap = d3
    .treemap()
    .size([width, height])
    .padding(1)
    .paddingRight(3)
    .paddingTop(25)
    .round(true);

  // let charsts = d3.select("#chart");

  let format = d3.format(",d");

  chart();
}

// Draw for the first time to initialize.
redraw();

// Redraw based on the new size whenever the browser window is resized.
window.addEventListener("resize", redraw);

// ZOOM Function
var instance = panzoom(document.getElementById("chart"), {
  zoomSpeed: 0.06,
  maxZoom: 20,
  minZoom: 1
});

instance.on("panstart", function (e) {
  console.log("Fired when pan is just started ", e);
  // Note: e === instance.
});

instance.on("pan", function (e) {
  console.log("Fired when the scene is being panned", e);
});

instance.on("panend", function (e) {
  console.log("Fired when pan ended", e);
});

instance.on("zoom", function (e) {
  console.log("Fired when scene is zoomed", e);
});

instance.on("transform", function (e) {
  // This event will be called along with events above.
  console.log("Fired when any transformation has happened", e);
});

});
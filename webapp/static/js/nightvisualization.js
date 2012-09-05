// COLORS
var FreshColors = {
	LIGHTBLUE : "#ADD8E6",
	DARKBLUE : "#1e6070",
	BLUE : "#37abc8",
	ORANGE : "#ffad43",
	RED : "#ff0066",
	GREEN : "#9cd35a",
	GRAY : '#404040',
	SEMILIGHTGRAY : '#a0a0a0',
	LIGHTGRAY : '#b0b0b0'
}

// Some translations here as globals, because Django gettext system does not find them othervise.

var minutes_unit = gettext(" minutes");


function DayPlot() {
	
	this.unmap_x = function(x) {
		// Map x coordinate back to time
		x -= this.margin_left;
		t = x / this.x_scale;
		t += this.start_time;
		return t;
	}
	
	this.map_x = function(t) {
		// Map a value to x-coordinate
		t = t - this.start_time;
		x = t * this.x_scale;
		return this.margin_left + x;
    }

    this.map_x_width = function(w) {
    	// Map a width to width in x-coordinate
		x = w * this.x_scale;
		return x;
	}
    
	this.map_y = function(v) {
		// Map a value to y-coordinate 
		if (this.min_y_value == undefined)
			return;
		
		var mapped_y = this.y_height - (v - this.y_grid_start) * this.y_scale;
		
		return this.margin_top + mapped_y;
	}
	
	this.map_y_height = function(h) {
		return h * this.y_scale;
	}
	
	this.draw_box = function() {
		// Draw a box around the drawing area (grid)
		
		var w = this.width - this.margin_left - this.margin_right;
		var h = this.height - this.margin_top - this.margin_bottom;
		this.grid_box = this.paper.rect(this.margin_left+0.5, this.margin_top+0.5, w, h);
		this.grid_box.attr(this.grid_attributes);
		this.grid_box.attr({"fill" : "#000", "fill-opacity" : 0});
	}
	
	this.draw_hour_grid = function() {
	    var length_hours = this.length_time / (3600*1000);
	    var pixels_per_hour = this.x_width / length_hours;
	    
	    if (pixels_per_hour > 50) {
	    	var x_grid_interval = 3600*1000;
	    } else if (pixels_per_hour > 25) {
	    	var x_grid_interval = 2*3600*1000;	
	    } else {
	    	var x_grid_interval = 3*3600*1000;
	    }
	    
	    var x_grid_start = this.start_time - this.start_time % x_grid_interval + x_grid_interval;
	    
	    for (var t = x_grid_start; t < this.end_time; t += x_grid_interval) {
			var x = this.map_x(t);
			var dt = new Date(t)
			var path = "M" + x + "," + this.margin_top + "L" + x + "," + (this.height-this.margin_bottom);
			var minutes = dt.getMinutes();
			
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			
			this.paper.text(x, this.margin_top/2, dt.getHours() + ":" + minutes).attr(this.grid_text_attributes);
			this.paper.path(path).attr(this.grid_attributes);
	    }
	    
	    //console.log("hour grid path: " + path);
	}
	
	this.draw_y_grid = function() {
		if (this.y_grid_start == undefined)
			return;
		
		for (var y = this.y_grid_start; y <= this.y_grid_end; y += this.y_grid_interval) {
			var yy = this.map_y(y);
			
			if (y > this.y_grid_start && y < this.y_grid_end) {
				var path = "M" + this.margin_left + "," + yy + "L" + (this.width-this.margin_right) + "," + yy;
				this.paper.path(path).attr(this.grid_attributes);
			}
			
			var text = this.paper.text(this.margin_left-3, yy, "" + y).attr(this.grid_text_attributes);
			text.attr({"text-anchor" : "end"});
		}
		
		//console.log("y grid path:" + path);
	}

	this.setup = function setup(container_id, sleep_data) {
		// Common setup for all plots (like a constructor)
		
		this.sleep_data = sleep_data;
		this.paper_container = $("#" + container_id);

		this.paper = Raphael(container_id, this.width, this.height);
		
		this.grid_font_size = 14;
		this.grid_attributes = {"stroke" : FreshColors.LIGHTGRAY, "stroke-width": 1};
		this.grid_text_attributes = {"fill" : FreshColors.LIGHTGRAY, "font-size" : this.grid_font_size, "font-family" : "Arial"};
		
		this.margin_top = 20;
		this.margin_bottom = 10;
		this.margin_left = 80;
		this.margin_right = 10;
		
		this.start_time = DateTimeUtils.parse_datetime(sleep_data["local_start_time"]);
		this.end_time = DateTimeUtils.parse_datetime(sleep_data["local_end_time"]);
		this.length_time = this.end_time - this.start_time;
	}
	
	this.resize_y_scale = function() {
		this.y_height = this.height - this.margin_top - this.margin_bottom;
		this.y_scale = this.y_height / (this.y_grid_end - this.y_grid_start);
	}
	
	this.update_minmax = function(value) {
		if (this.min_y_value == undefined || this.min_y_value > value)
			this.min_y_value = value;
		if (this.max_y_value == undefined ||  this.max_y_value < value)
			this.max_y_value = value;
	}

	this.setup_locator = function() {
		var w = this.map_x_width(60*1000);
		
		this.locator = this.paper.rect(0, this.margin_top, w, this.y_height);
	    
		this.locator.attr({
			"fill" : FreshColors.RED,
    		"fill-opacity" : 0,
    		"stroke-width" : 0.001,
    		"stroke-opacity" : 0
		});
		
		//console.log("locator set up w="+w+", h="+h);
	}
	
	this.setup_y_scale_from_min_max = function(y_min, y_max) {
		this.min_y_value = y_min;
		this.max_y_value = y_max;

		if (this.max_y_value - this.min_y_value < 8) {
			this.y_grid_interval = 2;
		} else if (this.max_y_value - this.min_y_value < 25) {
			this.y_grid_interval = 5;
		} else if (this.max_y_value - this.min_y_value > 200) {
			this.y_grid_interval = 50;
		} else {
			this.y_grid_interval = 10;
		}
		
		this.y_grid_start = this.min_y_value - this.min_y_value % this.y_grid_interval;
		this.y_grid_end = this.max_y_value - this.max_y_value % this.y_grid_interval + this.y_grid_interval;
	
		this.resize_y_scale();
	}
	
	this.setup_y_scale = function(times_values) {
		// Set up proper parameters for scaling y values from a list.
		// The list can be
		// - An array of two-item arrays [time, value]
		// - An array of arrays of two-item arrays
		
		this.min_y_value;
		this.max_y_value;
		
		if (times_values == null) {
			this.paper.text(10, 10, gettext("No data available"));
			return;
		}
			
		for (var i = 0; i < times_values.length; i++) {
			if (times_values[i][0] instanceof Array) {
				//console.log(times_values[i][0] + " is an array, going through that");
				for (var j = 0; j < times_values[i].length; j++) {
					this.update_minmax(times_values[i][j][1]);
				}
			} else {
				//console.log(times_values[i][0] + " not an array, using value=" + times_values[i][1]);
				this.update_minmax(times_values[i][1]);
			}
		}
		
		if (this.min_y_value != undefined) {
			this.setup_y_scale_from_min_max(this.min_y_value, this.max_y_value);
		}		
	}
	
	this.redraw_grid = function() {
		// Common (re-) draw operations for all plots
		
		this.width = this.paper_container.width();
		this.height = this.paper_container.height();
		if ($(window).width() < 768) {
			this.margin_left = 20;
		} else {
			this.margin_left = 80;
		}
		
		this.x_width = this.width - this.margin_left - this.margin_right;
		this.x_scale = this.x_width / this.length_time;
		
		//console.log("x_width=" + this.x_width + ", length_time=" + this.length_time + ", x_scale=" + this.x_scale);

		this.paper.setSize(this.width, this.height);
		this.paper.clear();
		this.resize_y_scale();
		
		this.draw_hour_grid();
		this.draw_y_grid();
		this.draw_box();
		this.paper.renderfix();
		
		this.setup_locator();
	}
	
	this.show_no_data = function() {
		var center_x = (this.width - this.margin_left - this.margin_right) / 2 + this.margin_left;
		var center_y = (this.height - this.margin_top - this.margin_bottom) / 2 + this.margin_top;
		this.paper.text(center_x, center_y, gettext("No data available")).attr({"fill" : FreshColors.LIGHTGRAY, "font-size" : 2*this.grid_font_size, "font-family" : "Arial"})
	}
	
	this.show_locator = function() {
		this.locator.attr({"fill-opacity" : 0.9});
	}
	
	this.hide_locator = function() {
		this.locator.attr({"fill-opacity" : 0});
	}
	
	this.set_locator = function(t) {
		if (t < this.start_time || t > this.end_time) {
			this.hide_locator();
		} else {
			var x = this.map_x(t);
			//console.log("locator x="+x);
			this.locator.attr({"x" : x});
			this.show_locator();
		}
	}

}


function Locator() {
	
	this.plots = new Array();
	
	this.add_plot = function(plot) {
		this.plots.push(plot);
		
		plot.setup_locator();
		
		var locator_this = this;

		plot.paper_container.mouseenter(
			function() {
				//console.log("Show");
				locator_this.show_locators();
			}
		);
		
		plot.paper_container.mousemove(
			function(event) {
				var pos_x = event.pageX - $(document).scrollLeft() - plot.paper_container.offset().left;
				var t = plot.unmap_x(pos_x);
				locator_this.set_locators(t);
			}
		);
		
		plot.paper_container.mouseleave(
			function() {
				//console.log("Hide");
				locator_this.hide_locators();
			}
		);
	}
	
	this.show_locators = function() {
		for (var i = 0; i < this.plots.length; i++)
			this.plots[i].show_locator();
	}
	
	this.hide_locators = function() {
		for (var i = 0; i < this.plots.length; i++)
			this.plots[i].hide_locator();
	}
	
	this.set_locators = function(t) {
		for (var i = 0; i < this.plots.length; i++)
			this.plots[i].set_locator(t);
	}
	
}


function SleepStagesPlot(container_id, sleep_data, show_rem_stage) {
	
	this.setup(container_id, sleep_data);

	this.setup_y_scale_from_min_max(0, 1);
	
	this.show_rem_stage_label = false; // Set to true in drawing code, if there are REM stages
	
	this.draw = function() {
		this.redraw_grid();
		
		var sleep_stages_set = this.paper.set();
	    
	    // Draw additional sleeping stages
	    for (var i = 0; i < this.sleep_data["sleep_stages"].length-1; i++) {
	    	var stage = this.sleep_data["sleep_stages"][i];
	    	var next_stage = this.sleep_data["sleep_stages"][i+1]; 
	    	
	    	var stage_start = DateTimeUtils.parse_datetime(stage[0]);
	    	var stage_end = DateTimeUtils.parse_datetime(next_stage[0]);
	    	
	    	if (stage_start == null || stage_end == null) {
	    		//console.log("time was null, skipping");
	    		continue;
	    	}
	    	
	    	var stage_name;
		    
		    var stage_length = stage_end - stage_start;
		    //console.log("stage: " + stage[1] + " start: " + stage_start + ", end: " + stage_end + ", length: " + stage_length);
		    var left_x = this.map_x(stage_start);
		    var width_x = this.map_x_width(stage_length);
		    
		    var attrs = {
		    		"fill-opacity" : 1,
		    		"stroke-width" : 0.001,
		    		"stroke-opacity" : 0
		    };
		    var height;
		    var move_down = 0;
		    
		    if (stage[1] == "D") {
		    	attrs["fill"] = FreshColors.BLUE;
		    	stage_name = gettext("Deep sleep");
		    	height = 30;
		    	move_down = 60;
		    } else if (stage[1] == "R") {
		    	attrs["fill"] = FreshColors.RED;
		    	stage_name = gettext("REM sleep");
		    	height = 20;
		    	move_down = 60;
		    	
		    	this.show_rem_stage_label = true;
		    } else if (stage[1] == "W") {
		    	attrs["fill"] = FreshColors.LIGHTGRAY;
		    	stage_name = gettext("Wake");
		    	height = 30;
		    } else if (stage[1] == "A") {
		    	attrs["fill"] = "#FFFFFF";
		    	attrs["fill-opacity"] = 0;
		    	stage_name = gettext("Away from bed");
		    	height = 90;
		    } else if (stage[1] == "M") {
		    	attrs["fill"] = FreshColors.RED;
		    	stage_name = gettext("Data missing");
		    	height = 3;
		    } else {
		    	// Unsupported sleep stage
		    	continue;
		    }
	
		    var length_seconds = Math.round(stage_length / 1000.0);
		    var elem = this.paper.rect(left_x, this.margin_top+1+move_down, width_x, height)
		    attrs["title"] = stage_name + " " + format_seconds(length_seconds);
		    elem.attr(attrs);
		    sleep_stages_set.push(elem);
	    }
	    
	    var combined_sleep_stages = [];
	    var last_sleeping_stage_start = null;
	    
	    function is_sleep_stage(stage) { return ( $.inArray(stage, ["L", "D", "R"]) >= 0); }
	    
	    for (var i = 0; i < this.sleep_data["sleep_stages"].length; i++) {
	    	if (last_sleeping_stage_start == null && is_sleep_stage(this.sleep_data["sleep_stages"][i][1])) {
	    		last_sleeping_stage_start = this.sleep_data["sleep_stages"][i][0];
	    	} else if (last_sleeping_stage_start != null && !is_sleep_stage(this.sleep_data["sleep_stages"][i][1])) {
	    		combined_sleep_stages.push([last_sleeping_stage_start, this.sleep_data["sleep_stages"][i][0]]);
	    		last_sleeping_stage_start = null;
	    	}
	    }
	    if (last_sleeping_stage_start != null) {
	    	combined_sleep_stages.push([last_sleeping_stage_start, this.sleep_data["local_end_time"]]);
	    }
	    
	    // Draw sleeping stages
	    for (var i = 0; i < combined_sleep_stages.length; i++) {
	    	var sleep_start = DateTimeUtils.parse_datetime(combined_sleep_stages[i][0]);
	    	var sleep_end = DateTimeUtils.parse_datetime(combined_sleep_stages[i][1]);
	    	var stage_length = sleep_end - sleep_start;
		    
	    	var left_x = this.map_x(sleep_start);
		    var width_x = this.map_x_width(stage_length);
		    
		    var attrs = {
		    		"fill-opacity" : 1,
		    		"stroke-width" : 0.001,
		    		"stroke-opacity" : 0,
					"fill" : FreshColors.LIGHTBLUE,
		    };
		    
		    var length_minutes = Math.round(stage_length / (1000*60.0));
		    var elem = this.paper.rect(left_x, this.margin_top+1, width_x, 60)
		    attrs["title"] = gettext("Sleep") + " " + format_seconds(Math.round(stage_length/1000.0));
		    elem.attr(attrs);
		    sleep_stages_set.push(elem);
	    }
	    
	    // Draw labels for sleep stages
	    var sleep_stages_label_set = this.paper.set();
		
		if ($(window).width() >= 768) {
			sleep_stages_label_set.push(this.paper.text(this.margin_left-3, this.margin_top+15, gettext("Wake")).attr({"fill" : FreshColors.LIGHTGRAY}));
			sleep_stages_label_set.push(this.paper.text(this.margin_left-3, this.margin_top+45, gettext("Sleep")).attr({"fill" : FreshColors.LIGHTBLUE}));
			if (this.show_rem_stage_label)
				sleep_stages_label_set.push(this.paper.text(this.margin_left-3, this.margin_top+70, gettext("REM sleep")).attr({"fill" : FreshColors.RED}));
			sleep_stages_label_set.push(this.paper.text(this.margin_left-3, this.margin_top+85, gettext("Deep sleep")).attr({"fill" : FreshColors.BLUE}));
		}
		
		sleep_stages_label_set.attr({
			"font-size" : this.grid_font_size,
			"font-family" : "Arial",
			"text-anchor" : "end"
		});
		

	}
	
	this.draw();
	
}

SleepStagesPlot.prototype = new DayPlot();


function SleepRhythmPlot(container_id, history_data) {
	
	this.is_empty = true;
	
	for (var i = 0; i < history_data["days"].length; i++) {
		if (history_data["days"][i]["local_start_time"]) {
			//console.log("Setting local_start_time according to date " + history_data["days"][i]["date"] + " to " + history_data["days"][i]["local_start_time"]);
			this.setup(container_id, history_data["days"][i]);
			this.is_empty = false;
			this.start_day_i = i;
			break;
		}
	}
	
	this.history_data = history_data;
	
	this.draw = function() {
		if (this.is_empty)
			return;
		
		this.redraw_grid();
		
		var sleep_stages_label_set = this.paper.set();
		
		sleep_stages_label_set.attr({
			"font-size" : this.grid_font_size,
			"font-family" : "Arial",
			"text-anchor" : "end"
		});
		
		var sleep_stages_set = this.paper.set();
	    
		for (var day = 0; day < this.history_data["days"].length; day++) {
			var day_data = this.history_data["days"][day];
			var base_y = this.margin_top + day * 25;

			this.paper.text(1, base_y+10, DateTimeUtils.week_day_name(day_data["date"])).attr({"fill" : FreshColors.LIGHTGRAY, "font-size" : this.grid_font_size, "font-family" : "Arial", "text-anchor" : "start"});
			
			//console.log("Drawing sleep stages for " + day_data["date"]);
			
			if (!day_data["sleep_stages"])
				continue;
			
			//console.log("There was sleep stages data");
			
		    for (var i = 0; i < day_data["sleep_stages"].length-1; i++) {
		
		    	var stage = day_data["sleep_stages"][i];
		    	var next_stage = day_data["sleep_stages"][i+1]; 
		    	
		    	var stage_start = DateTimeUtils.parse_datetime(stage[0]);
		    	var stage_end = DateTimeUtils.parse_datetime(next_stage[0]);
		    	
		    	if (stage_start == null || stage_end == null) {
		    		console.log("stage_start or stage_end was null, skipping");
		    		continue;
		    	}
		    	
		    	var stage_name;
			    
			    var stage_length = stage_end - stage_start;
			    //console.log("stage: " + stage[1] + " start: " + stage_start + ", end: " + stage_end + ", length: " + stage_length);
			    var left_x = this.map_x(stage_start - (day-this.start_day_i)*24*3600*1000);
			    var width_x = this.map_x_width(stage_length);
			    
			    //console.log("stage base y: " + base_y + ", left x: " + left_x + ", x width: " + width_x);
			    
			    var attrs = {
			    		"fill-opacity" : 1,
			    		"stroke-width" : 0.001,
			    		"stroke-opacity" : 0
			    };
			    var height;
			    
			    if (stage[1] == "L" || stage[1] == "D" || stage[1] == "R") {
					attrs["fill"] = FreshColors.BLUE;
					stage_name = gettext("Sleep");
			    	height = 20;
			    } else if (stage[1] == "W") {
			    	attrs["fill"] = FreshColors.LIGHTGRAY;
			    	stage_name = gettext("Wake");
			    	height = 5;
			    } else if (stage[1] == "M") {
			    	attrs["fill"] = FreshColors.RED;
			    	stage_name = gettext("Data missing");
			    	height = 2;
			    } else {
			    	// Unsupported sleep stage
			    	continue;
			    }
		
			    var length_minutes = Math.round(stage_length / (1000*60.0));
			    var elem = this.paper.rect(left_x, base_y, width_x, height);
			    attrs["title"] = stage_name + " " + length_minutes + minutes_unit;
			    elem.attr(attrs);
		
			    sleep_stages_set.push(elem);
		    }
		}
	}
	
	this.draw();
	
}

SleepRhythmPlot.prototype = new DayPlot();


function HeartRatePlot(container_id, sleep_data) {
	
	this.setup(container_id, sleep_data);
	
	this.setup_y_scale(sleep_data["averaged_heart_rate_curve"]);
	
	this.draw_y_grid();
	
	this.draw = function() {
		this.redraw_grid();
		
		if (this.sleep_data["averaged_heart_rate_curve"] == null) {
			this.show_no_data();
			return;
		}
		
	    var t;
	    var v;
	    var mapped_t;
	    var mapped_v;
	    
	    for (var i = 0; i < this.sleep_data["averaged_heart_rate_curve"].length; i++) {
	    	var path;
		    
	    	if (this.sleep_data["averaged_heart_rate_curve"][i].length < 3) {
	    	
	    		for (var j = 0; j < this.sleep_data["averaged_heart_rate_curve"][i].length; j++) {
	    			t = DateTimeUtils.parse_datetime(this.sleep_data["averaged_heart_rate_curve"][i][j][0]);
			    	v = this.sleep_data["averaged_heart_rate_curve"][i][j][1];
			    	
			    	mapped_t = this.map_x(t);
			    	mapped_v = this.map_y(v);
			    	
	    			this.paper.circle(mapped_t, mapped_v, 2.3).attr({"fill" : FreshColors.RED,
	    													       "stroke-width": 0.001,
	    													       "stroke-opacity" : 0});
	    		}
	    		
	    	} else {

	    		for (var j = 0; j < this.sleep_data["averaged_heart_rate_curve"][i].length; j++) {
		    		t = DateTimeUtils.parse_datetime(this.sleep_data["averaged_heart_rate_curve"][i][j][0]);
			    	v = this.sleep_data["averaged_heart_rate_curve"][i][j][1];
			    	
			    	//console.log("heart rate curve " + i + ": t=" + t + ", v=" + v);
			    	
			    	mapped_t = this.map_x(t);
			    	mapped_v = this.map_y(v);
			    	
			    	//console.log("mapped heart rate t=" + mapped_t + ", v=" + mapped_v);
			    	
			    	if (j == 0) {
			    		path = "M";
			    	} else if (j == 1) {
			    		path += "R";
			    	}
			    	
			    	path += mapped_t + "," + mapped_v + " ";
		    	}
	
		    	//console.log("hr path:" + path);
		    	this.paper.path(path).attr({"stroke" : FreshColors.RED, "stroke-width" : 3, "stroke-linejoin" : "round", "stroke-linecap" : "round"});
	    	
	    	}
	    }
	    
	}
	
	this.draw();
}

HeartRatePlot.prototype = new DayPlot();


function ActigramPlot(container_id, sleep_data, actigram_period_minutes) {
	
	this.setup(container_id, sleep_data);
	
	if (arguments.length == 2) {
		actigram_period_minutes = 5;
	}
	
	// Preprocess actigram data
	this.preprocessed_actigram = [];
	this.preprocessed_actigram_period_minutes = actigram_period_minutes;
	this.preprocessed_actigram_period = this.preprocessed_actigram_period_minutes*60*1000;
	
	var actigram_sum = 0;
	
	if (this.sleep_data["minutely_actigram"] != null) {
		for (var i = 0; i < this.sleep_data["minutely_actigram"].length; i++) {
			
			actigram_sum += this.sleep_data["minutely_actigram"][i];
			
			if (i % actigram_period_minutes == 0) {
				var t = this.start_time + i*60*1000;
				var actigram_item = [t, actigram_sum];
		
				//console.log("5-min actigram item: " + actigram_item);
				
				this.preprocessed_actigram.push(actigram_item);
				
				actigram_sum = 0;
				continue;
			}
			
		}
	}
	
	this.setup_y_scale(this.preprocessed_actigram);
	this.draw_y_grid();

	this.draw = function() {
		this.redraw_grid();
		
		if (this.sleep_data["minutely_actigram"] == null) {
			this.show_no_data();
			return;
		}
		
	    var actigram_set = this.paper.set();
	    var w = this.map_x_width(this.preprocessed_actigram_period);
	    
	    for (var i = 0; i < this.preprocessed_actigram.length; i++) {
	    	
	    	var x = this.map_x(this.preprocessed_actigram[i][0]);
	    	var y = this.map_y(this.preprocessed_actigram[i][1]);
	    	
	    	var elem = this.paper.rect(x, y, w, this.y_height-y+this.margin_top);
	    	
	    	dt = new Date(this.preprocessed_actigram[i][0]);
	    	
	    	var title = this.preprocessed_actigram[i][1] + gettext(" movements at ") + dt.getHours() + ":" + dt.getMinutes();
	    	
	    	elem.attr({"fill" : FreshColors.GREEN,
	    			   "stroke-width": 0.001,
				       "stroke-opacity" : 0,
	    			   "title" : title});
	    	
	    }
	};
	
	this.draw();
	
}

ActigramPlot.prototype = new DayPlot();


function HeartRateHistogramPlot(container_id, sleep_data) {
	
	this.setup(container_id, sleep_data);

	this.y_edges = sleep_data["minutely_heart_rate_histogram_y_edges"];
	this.histogram_data = sleep_data["minutely_heart_rate_histogram"];
	this.use_colors = true;  

	var y_min = this.y_edges[0];
	var y_max = this.y_edges[this.y_edges.length-1];

	this.setup_y_scale_from_min_max(y_min, y_max);
	this.draw_y_grid();
	
	this.toggle_colors = function() {
		this.use_colors = !this.use_colors;
		this.draw();
	}
	
	this.map_opacity = function(value) {
		var opacity = 1;
		
		if (this.use_colors) {
			var opacity = value / 20.0;
			if (opacity > 1)
				opacity = 1;
		}
		
		return opacity;
	}

	this.draw = function() {
		if (!this.paper_container.is(":visible"))
			return;
		
		this.redraw_grid();

		var histogram_set = this.paper.set();
		var item_height = this.map_y_height(this.y_edges[1]-this.y_edges[0]);
		var item_width = this.map_x_width(60*1000);
		
		var elem_count = 0;

		for (var i = 0; i < this.histogram_data.length; i++) {
			var t = this.start_time + i*60*1000;

			for (var j = 0; j < this.histogram_data[i].length; j++) {

				if (this.histogram_data[i][j] > 0) {
					var x = this.map_x(t);
					var y = this.map_y(this.y_edges[j]);

					var elem = this.paper.rect(x, y, item_width, item_height);
					elem.attr({
						"fill" : FreshColors.RED,
						"fill-opacity" : this.map_opacity(this.histogram_data[i][j]),
						"stroke-width" : 0.0001,
						"stroke-opacity" : 0
					});

					elem_count++;
				}

			}

		}

		//console.log("number of elements: " + elem_count);
	};

	this.draw();

}

HeartRateHistogramPlot.prototype = new DayPlot();


function NoisePlot(container_id, sleep_data) {
	
	this.noise_measurements = sleep_data["noise_measurements"];
	
	this.setup(container_id, sleep_data);

	this.setup_y_scale(this.noise_measurements);
	this.draw_y_grid();

	this.draw = function() {
		this.redraw_grid();
		
		if (this.noise_measurements == null) {
			this.show_no_data();
			return;
		}
		
	    var noise_bar_set = this.paper.set();
	    var high_noise_bar_set = this.paper.set();
	    var noise_hat_set = this.paper.set();
	    var w = this.map_x_width(5*60*1000);
	    
	    var noise_curve;
	    for (var curve_i = 0; curve_i < this.noise_measurements.length; curve_i++) {
	    	noise_curve = this.noise_measurements[curve_i];
	    	
		    for (var i = 0; i < noise_curve.length; i++) {
		    	var x = this.map_x(DateTimeUtils.parse_datetime(noise_curve[i][0]));
		    	var y = this.map_y(noise_curve[i][1]);
		    	var h = this.y_height-y+this.margin_top
		    	
		    	var bar_elem = this.paper.rect(x, y, w, h);
		    	var hat_elem = this.paper.path("M" + x + "," + y + "L" + (x+w) + "," + y);
		    	
		    	noise_bar_set.push(bar_elem);	
		    	noise_hat_set.push(hat_elem);
		    }
	    }
	    noise_bar_set.attr({
    		"fill" : FreshColors.SEMILIGHTGRAY,
			"opacity" : 0.5,
			"stroke-width": 0.001,
			"stroke-opacity" : 0
		});
	    noise_hat_set.attr({
    		"stroke-width": 2.0,
			"stroke" : FreshColors.GRAY
	    });
	    
	};
	
	this.draw();
	
}

NoisePlot.prototype = new DayPlot();


function AreaPlot(container_id, sleep_data, field_name, color_a, color_b, color_line, color_threshold, area_b_title) {
	
	this.field_name = field_name;
	this.color_a = color_a;
	this.color_b = color_b;
	this.color_threshold = color_threshold;
	this.area_b_title = area_b_title;
	this.color_line = color_line;
	
	this.setup(container_id, sleep_data);
	this.setup_y_scale(this.sleep_data[this.field_name]);
	
	if (field_name == "luminosity_measurements") {
		this.y_grid_start = 0;
		this.y_grid_end = 40;
		this.y_grid_interval = 10;
	} else if (field_name == "noise_measurements") {
		this.y_grid_start = 30;
		this.y_grid_end = 90;
		this.y_grid_interval = 10;
	} else if (field_name == "temperature_measurements") {
		if (this.y_grid_start > 18)
			this.y_grid_start = 18;
		if (this.y_grid_end - this.y_grid_start < 4)
			this.y_grid_end = this.y_grid_start + 4;
	}
	
	this.draw_y_grid();
	
	this.draw = function() {
		this.redraw_grid();
		
		if (this.sleep_data[this.field_name] == null) {
			this.show_no_data();
			return;
		}
		
		var item, path, fill_path, stroke_path, t, v, x, y, segment_start_x, segment_start_y;
		
		var clip_rect_loud = "0,0," + this.width + "," + this.map_y(this.color_threshold);
		//console.log("clip rect:" + clip_rect_loud);
		
		//console.log("Drawing area plot for field " + this.field_name);
		
		for (var i = 0; i < this.sleep_data[this.field_name].length; i++) {
			
			//console.log("making path of " + this.sleep_data[this.field_name][i].length + " points");
			
			for (var j = 0; j < this.sleep_data[this.field_name][i].length; j++) {
				item = this.sleep_data[this.field_name][i][j];
				t = DateTimeUtils.parse_datetime(item[0]);
				v = item[1];
				
				x = this.map_x(t);
				y = this.map_y(v);
				
				if (j == 0) {
					path = "";
					segment_start_x = x;
					segment_start_y = y;
				} else {
					path += "L";
				}
				
				path += x + "," + y + " ";
				
			}
			
			line_path = "M" + path;
			fill_path = "M" + segment_start_x + "," + this.map_y(this.y_grid_start) + " L" + segment_start_x + "," + this.map_y(this.y_grid_start) + " " + path;
			fill_path += "L" + x + "," + this.map_y(this.y_grid_start) + " L" + segment_start_x + "," + this.map_y(this.y_grid_start);
			
			//console.log("path:" + path);
			if (this.color_a != null) {
				this.paper.path(fill_path).attr({"fill" : this.color_a,
												 "opacity" : 0.5,
												 "stroke-width" : 0.001});
			}
			
			if (this.color_b != null) {
				this.paper.path(fill_path).attr(
					{"fill" : this.color_b,
					 "opacity" : 0.5,
					 "stroke-width" : 0.001,
					 "clip-rect" : clip_rect_loud,
					 "title" : this.area_b_title
					});
			}
			
			if (this.color_line != null) {
				this.paper.path(line_path).attr({"stroke-width" : 2,
												 "stroke" : this.color_line
												 });
			}
		}
		
	};
	
	this.draw();

}

AreaPlot.prototype = new DayPlot();


function PieMeter(container_id, percent_full, fill) {
	
	this.make_path = function(cx, cy, r, startAngle, endAngle, params) {
		var rad = Math.PI / 180;
        var x1 = cx + r * Math.cos(-startAngle * rad),
        x2 = cx + r * Math.cos(-endAngle * rad),
        y1 = cy + r * Math.sin(-startAngle * rad),
        y2 = cy + r * Math.sin(-endAngle * rad);
        
        return this.paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
	}

	if (percent_full == 100)
		this.percent_full = 99.99;
	else
		this.percent_full = percent_full;
	
	this.angle = (this.percent_full/100) * 360;
	this.fill = fill;
	
	this.paper_container = $("#" + container_id);
	this.paper = Raphael(container_id, this.width, this.width);
	
	this.draw = function() {
		this.width = this.paper_container.width();
		this.height = this.paper_container.height();
		this.paper.setSize(this.width, this.height);
		this.paper.clear();
		this.cy = this.width / 2;
		this.cx = this.cy;
		this.radius = this.cy - 2;
	
		this.start = 0;
		this.end = this.angle;
		
		this.paper.circle(this.cx, this.cy, this.radius).attr({"fill" : "#eeeeee", "stroke-width" : 2, "stroke" : "#dddddd", "fill-opacity" : 0});
		
		this.make_path(this.width/2, this.width/2, this.width/2-1, this.start, this.end,
				{"stroke" : this.stroke, "fill" : this.fill, "stroke-width" : 0.001, "stroke-opacity" : 0});
	
	}
	
	this.draw();
		
}

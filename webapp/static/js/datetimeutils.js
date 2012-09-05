
function gettext(s) {
	return s;
}


function DateTimeUtilsImpl() {
	
	this.week_day_names = {
		0 : gettext("Sunday"),
		1 : gettext("Monday"),
		2 : gettext("Tuesday"),
		3 : gettext("Wednesday"),
		4 : gettext("Thursday"),
		5 : gettext("Friday"),
		6 : gettext("Saturday")
	};
	
	this.week_day_abbrs = {
			0 : gettext("Sun"),
			1 : gettext("Mon"),
			2 : gettext("Tue"),
			3 : gettext("Wed"),
			4 : gettext("Thu"),
			5 : gettext("Fri"),
			6 : gettext("Sat")
	};
	
	this.month_abbrs = {
			0 : gettext("Jan"),
			1 : gettext("Feb"),
			2 : gettext("Mar"),
			3 : gettext("Apr"),
			4 : gettext("May"),
			5 : gettext("Jun"),
			6 : gettext("Jul"),
			7 : gettext("Aug"),
			8 : gettext("Sep"),
			9 : gettext("Oct"),
			10 : gettext("Nov"),
			11 : gettext("Dec")
	};
	
	this.parse_date = function(date_string) {
		var ymd = date_string.split("-");
		var dat = new Date(ymd[0], ymd[1]-1, ymd[2]);
		return dat;
	};
	
	this.parse_datetime = function(datetime_string) {
		var date_time = datetime_string.split("T");
		
		var d = date_time[0];
		var t = date_time[1];
		
		var ymd = d.split("-");
		var hms = t.split(":");
		
		try {
			var dat = new Date(ymd[0], ymd[1]-1, ymd[2], hms[0], hms[1], hms[2]);
		} catch (e) {
			//console.log("Could not parse datetime: " + s + ", error message: " + e.message);
			return null;
		}
		
		return dat.getTime();
	};
	
	this.date_to_seconds = function(date_string) {
		return this.parse_date(date_string).getTime() / 1000;
	};
	
	this.week_day_name = function(date_string) {
		return this.week_day_names[this.parse_date(date_string).getDay()];
	};
	
	this.week_day_name_abbr = function(date_string) {
		return this.week_day_abbrs[this.parse_date(date_string).getDay()];
	};
	
	this.full_date = function(date_str) {
		var date = this.parse_date(date_str);
		return this.week_day_abbrs[date.getDay()] + " " + date.getDate() + " " + this.month_abbrs[date.getMonth()];
	}
	
	this.month_day = function(date_string) {
		var ymd = date_string.split("-");
		return parseInt(ymd[2], 10);
	};
	
	this.is_weekend = function(date_string) {
		weekday = this.parse_date(date_string).getDay();
		return (weekday == 0 || weekday == 6);
	};
	
}

DateTimeUtils = new DateTimeUtilsImpl();


function format_seconds(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var result = "";
    
    if (hours > 0) {
    	result += hours + gettext("HOUR_ABBR") + " ";
    }
    result += minutes + gettext("MINUTES_ABBR");
    
    return result;
}

    
// main.js
// get coords, query, parse data and append

$(document).ready(function() {

    // global var
    var page = chrome.extension.getBackgroundPage();

    // helper log function
    // avoid having to type page.console.log() everytime
    function log(message) {
        page.console.log(message);
    }


    // jquery animations
    $(".agree-geo-button").on('click', function() {
        log("Has geolocation permission");
        get_location();
    });

    $(".cancel-geo-button").on('click', function() {
        log('Cancel geolocation');
        window.close();  // close popup
    });



    // get geo coordinates
    // calls fetch
    function get_location() {

        if (!navigator.geolocation){
            (".status").text("Geolocation is not supported by your browser");
            return;
        }

        function success(position) {
            var latitude  = position.coords.latitude;
            var longitude = position.coords.longitude;

            log('Latitude is ' + latitude + '° | Longitude is ' + longitude + '°');
            $(".status").text("Found you! Fetching events...");
            fetch(latitude, longitude);
        }

        function error(error_object) {
            $(".status").text("Unable to retrieve your location" + error_object.message);
        }

        $(".button-box").hide();
        $(".status").text("Finding your location...");
        navigator.geolocation.getCurrentPosition(success, error);
    }


    // queries eventbrite
    // waits for fetch_callback
    function fetch(latitude, longitude) {

        weekend = next_weekend();
        var start_date = encodeURIComponent(weekend[0]);
        var end_date = encodeURIComponent(weekend[1]);
        
        var xmlHttp = new XMLHttpRequest();
        var url = "https://www.eventbriteapi.com/v3/events/search?popular=on&location.within=500mi&location.latitude=" + latitude + "&location.longitude=" + longitude + "&start_date.range_start=" + start_date + "&start_date.range_end=" + end_date + "&sort_by=date&token=ACKNCDTYY36HYJUQMLK5";
        log(url); // there doesn't seem to be many popular events near st. louis! hence the 500 mile radius.
        
        xmlHttp.open("GET", url, true);
        xmlHttp.addEventListener("load", fetch_callback, false);
        xmlHttp.send();
    }


    // gets start and end dates of next weekend
    function next_weekend() {
        var start = new Date(),
        end = new Date(),
        day_of_month = start.getUTCDate(),  // num for day of month
        day_of_week = start.getUTCDay(),  // num for day of week
        diff = 12 - day_of_week;  // days from now till friday of next weekend

        start.setUTCDate(day_of_month + diff);
        end.setUTCDate(day_of_month + diff + 2);

        start = start.toISOString();
        end = end.toISOString();

        start = start.substring(0, 19) + start.substring(23, 24); // trim for right query format
        end = end.substring(0, 19) + end.substring(23, 24);

        return [start, end];
    }


    // parse json object from eventbrite
    function fetch_callback(event) {
        $('.status').text("Happening next weekend near you");

        var data = JSON.parse(event.target.responseText);
        var name, description, url, address;
        var description_index;
        var count = 0;

        $(document.body).on('click', '.event', function() { // load more event description on click
            log('event clicked');
            var has_description = $(this).children(".description")[0];

            if (!has_description) {  // load description from json object
                description_index = $(this).attr("data-index");

                var description = data.events[description_index].description;
                if (description) {
                    description = description.text || "No description available.";
                    $(this).append('<div class = "description">' + description + '</div');
                }
                else { // description is null
                    $(this).append('<div class = "description">No description available.</div>');
                }
                
            }
        });

        $(window).scroll(function() {   // load more when scrolling up at bottom
            if($(window).scrollTop() == $(document).height() - $(window).height()) {  // at bottom
                count = count + 5;
                load_events(count, data, name, address, url);
            }
        });

        load_events(count, data, name, address, url);

    }


    var event_num, count_end;

    // parse out name, address, and url of 5+
    // calls append_events
    function load_events(count, data, name, address, url) {
        event_num = data.events.length;
        if (event_num === 0) {
            $('.status').text("There doesn't seem to be a lot going on.");
        }
        else {
            count_end = count + 5;
            if (event_num < count_end) {
                count_end = event_num;
            }
            for (var i=count; i<count_end; i++) {
                var this_event = data.events[i];
                if (this_event) {
                    name = this_event.name.text || "Mystery event";  // if null
                    address = this_event.venue.address.address_1 || "Mystery address";
                    url = this_event.url;
                    append_events(name, address, url, i);
                }
            }
        }

    }


    // append event to results div
    function append_events(name, address, url, index) {
        $(".results").append('<div class = "event" data-index="' + index + '">'
                             + '<div class = "name"><a href="' + url +'" class = "event_link" target = "_blank">' + name + '</a></div>'
                             + '<div class = "address">' + address + '</div>'
                             + '</div><br>');
    }

});
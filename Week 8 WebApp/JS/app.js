//The URIs of the REST endpoint
RAEURI = "https://prod-20.uksouth.logic.azure.com/workflows/d3e3abbbb71f4e41a20046ff165342dc/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=vU0y6_JSoc0_otYkC8oX1NJpjiBKgajtySp6uQ7FSSs";
CIEURI = "https://prod-20.uksouth.logic.azure.com/workflows/a14bdd1adb754ebbad08096fc68821e4/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=bD1c_q9tT_PwTONySMHvxFd6hWiXr6u2MBYxnZ-F-bA";


//Handlers for button clicks
$(document).ready(function() {

 
  $("#retEvents").click(function(){

      //Run the get event list function
      getEventList();

  }); 

   //Handler for the new event submission button
  $("#subNewForm").click(function(){

    //Execute the submit new event function
    submitNewEvent();
    
  }); 
});

//A function to submit a new event to the REST endpoint
function submitNewEvent(){
  
  //Construct JSON Object for new item
  var subObj = {
    EventName: $('#EventName').val(),
    EventType: $('#EventType').val(),
    DateOfEvent: $('#DateOfEvent').val(),
    Location: $('#Location').val(),
    UploadedBy: $('#UploadedBy').val()
  }


  //Convert to a JSON String
  subObj = JSON.stringify(subObj);


  //Post the JSON string to the endpoint, note the need to set the content type header
  $.post({
    url: CIEURI,
    data: subObj,
    contentType: 'application/json; charset=utf-8'
  }).done(function (response) {
    getEventList();
  });

}

//A function to get a list of all the events and write them to the Div with the EventList Div
function getEventList(){

  //Replace the current HTML in that div with a loading message
  $('#EventList').html('<div class="spinner-border" role="status"><span class="sr-only"> &nbsp;</span>');

  //Get the JSON from the RAA API 
  $.getJSON(RAEURI, function( data ) {

    //Create an array to hold all the retrieved events
    var items = [];
      
    //Iterate through the returned records and build HTML, incorporating the key values of the record in the data
    $.each( data,function( key, val ) {
      items.push("Event Name: " + val["eventName"] + "<br/>")
      items.push("Event Type: " + val["eventType"] + "<br/>")
      items.push("Date of Event: " + val["dateOfEvent"] + "<br/>")
      items.push("Location: " + val["location"] + "<br/>")
      items.push("Uploaded By: " + val["uploadedBy"] + "<br/>")
      items.push('<button type="button" id="subNewForm" class="btn btn-danger" onclick="deleteEvent('+val["eventID"] +')">Delete</button> <br/><br/>');
    });

    //Clear the eventlist div
    $('#EventList').empty();

    //Append the contents of the items array to the EventList Div
      $( "<ul/>", {
        "class": "my-new-list",
        html: items.join( "" )
      }).appendTo( "#EventList" );
    });
}

//A function to delete an event with a specific ID.
//The id paramater is provided to the function as defined in the relevant onclick handler
function deleteEvent(id){
  $.ajax({
    type: "DELETE",
    url: `https://prod-28.uksouth.logic.azure.com/workflows/b2fdc108ceb7490a916aeeaf3ad3a4ef/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events/${id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=4Vyh_iLk4e_gZ4BB5IaY_ChgEDQKok4z_X84AuDTekg`
  }).done(function( msg ) {
    getEventList();
  })

}

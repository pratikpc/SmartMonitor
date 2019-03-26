
$('.start, .end').timepicker({
      showInputs: false,
	  minuteStep: 1,
  });
$( "#end, #start" ).change(function() {

var time = $("#start").val();
var hours = Number(time.match(/^(\d+)/)[1]);
var minutes = Number(time.match(/:(\d+)/)[1]);
var AMPM = time.match(/\s(.*)$/)[1];
if(AMPM == "PM" && hours<12) hours = hours+12;
if(AMPM == "AM" && hours==12) hours = hours-12;
var sHours = hours.toString();
var sMinutes = minutes.toString();
if(hours<10) sHours = "0" + sHours;
if(minutes<10) sMinutes = "0" + sMinutes;
var time2 = $("#end").val();
if(time2=="")
{
	var time2 = "00:00 AM";
}
var hours2 = Number(time2.match(/^(\d+)/)[1]);
var minutes2 = Number(time2.match(/:(\d+)/)[1]);
var AMPM2 = time2.match(/\s(.*)$/)[1];
if(AMPM2 == "PM" && hours2<12) hours2 = hours2+12;
if(AMPM2 == "AM" && hours2==12) hours2 = hours2-12;
var sHours2 = hours2.toString();
var sMinutes2 = minutes2.toString();
if(hours2<10) sHours2 = "0" + sHours2;
if(minutes2<10) sMinutes2 = "0" + sMinutes2;
//alert(sHours + ":" + sMinutes);
var comparehour = sHours2-sHours;
var comparemin = sMinutes2-sMinutes;
if(comparehour<0)
{
	$("#end").val(time);
}
else if((comparehour==0) && (comparemin<0))
{
	$("#end").val(time);
}
 });


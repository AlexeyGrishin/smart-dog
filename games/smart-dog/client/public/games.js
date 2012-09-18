$(function() {
  function doLoad() {
    $("#games").load("/games");
    $("#players").load("/players");
  }
  if ($("#games").length > 0) {
    setInterval(doLoad, 1000);
    doLoad();
  }
  $("#games").ajaxError(function() {
    $("#games").html("Cannot connect to server");
    $("#players").html("");
  });
});
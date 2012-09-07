$(function() {
  function loadGamesTable() {
    $("#games").load("/games");
  }
  if ($("#games").length > 0) {
    setInterval(loadGamesTable, 1000);
    loadGamesTable();
  }
  $("#games").ajaxError(function() {
    $("#games").html("Cannot connect to server");
  });
});
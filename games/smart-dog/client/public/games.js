$(function() {
  function doLoad() {
    $(".games").each(function() {
      var hub = $(this).attr('data-hub');
      $(this).load('/games?hub=' + encodeURIComponent(hub));
    });
    $("#players").load("/players");
  }
  if ($(".games").length > 0) {
    setInterval(doLoad, 1000);
    doLoad();
  }
  $(".games").ajaxError(function() {
    $(".games").html("Cannot connect to server");
    $("#players").html("");
  });
});
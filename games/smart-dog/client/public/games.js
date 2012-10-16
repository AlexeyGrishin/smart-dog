$(function() {
  function doLoad() {
    $(".games").each(function() {
      var hub = $(this).attr('data-hub');
      var page = $(this).attr('data-page');
      $(this).load('/gamesAjax?hub=' + encodeURIComponent(hub) + '&page=' + encodeURIComponent(page));
      $("#players").load('/players?hub=' + encodeURIComponent(hub));
    });
  }
  if ($(".games").length > 0) {
    setInterval(doLoad, 10000);
    doLoad();
  }
  $(".games").ajaxError(function() {
    $(".games").html("Cannot connect to server");
    $("#players").html("");
  });
});
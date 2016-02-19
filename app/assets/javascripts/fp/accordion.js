/*
Javascript for accordion menu on /compose
*/

$(document).on('page:change', function(){
    function toggle()
    {
        $(".tab-content").addClass("activated").toggleClass("active");
    }

    $(function()
      {
        $(".tab-content").on("transitionend", function() {
            $(this).removeClass("activated");
        });
      }
    )();

    $(function(){
        $('#atlas_provider').selectize({
            create: true,
            sortField: 'text'
        });
    });
});
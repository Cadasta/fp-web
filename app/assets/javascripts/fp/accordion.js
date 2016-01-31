/*
Javascript for accordion menu on /compose
*/

$(document).on('page:change', function(){
    $('.accordion-header').click(function(e){
        var $selected = $(this).closest('.accordion-group')
        e.preventDefault();
        if ($selected.hasClass('selected')){
            $selected.removeClass('selected');
        } else {
            $('.selected').removeClass('selected');
            $selected.addClass('selected');
        }
        var $box = ($(this).children('.box'))
        
        if ( $box.children().hasClass('up-arrow') ) {
            $box.children().removeClass('up-arrow').addClass('down-arrow');
        } else {
            $('.up-arrow').removeClass('up-arrow').addClass('down-arrow');
            $box.children().removeClass('down-arrow').addClass('up-arrow');
        }
    });
});
/*
Javascript for accordion menu on /compose
*/

$(document).on('page:change', function(){
    $('.accordion-header').click(function(e){
        var $selected = $(this).closest('.accordion-group');
        e.preventDefault();
        if ($selected.hasClass('selected-group')){
            $selected.removeClass('selected-group');
        } else {
            $('.selected-group').removeClass('selected-group');
            $selected.addClass('selected-group');
        }
        var $box = ($(this).children('.box'));
        
        if ( $box.children().hasClass('up-arrow') ) {
            $box.children().removeClass('up-arrow').addClass('down-arrow');
        } else {
            $('.up-arrow').removeClass('up-arrow').addClass('down-arrow');
            $box.children().removeClass('down-arrow').addClass('up-arrow');
        }
    });

    $(function(){
        $('#atlas_provider').selectize({
            create: true,
            sortField: 'text'
        });
    });
});
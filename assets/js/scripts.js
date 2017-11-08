// dl-menu options
$(function() {
  $( '#dl-menu' ).dlmenu({
    animationClasses : { classin : 'dl-animate-in', classout : 'dl-animate-out' }
  });
});
// Need this to show animation when go back in browser
window.onunload = function() {};

// Add lightbox class to all image links
//$("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

// FitVids options
$(function() {
  $(".content").fitVids();
});

// All others
$(document).ready(function() {
    // zoom in/zoom out animations
    if ($(".container").hasClass('fadeOut')) {
        $(".container").removeClass("fadeOut").addClass("fadeIn");
    }
    if ($(".wrapper").hasClass('fadeOut')) {
        $(".wrapper").removeClass("fadeOut").addClass("fadeIn");
    }
    $(".zoombtn").click(function() {
        $(".container").removeClass("fadeIn").addClass("fadeOut");
        $(".wrapper").removeClass("fadeIn").addClass("fadeOut");
    });
    // go up button
    $.goup({
        trigger: 500,
        bottomOffset: 25,
        locationOffset: 20,
        containerRadius: 0,
        containerColor: '#fff',
        arrowColor: '#000',
        goupSpeed: 'normal'
    });
    // 图片处理
    $("[class='header']").each(function(i){
        $(this).find('img').each(function(){
          if ($(this).parent().hasClass('fancybox')) return;
          var alt = this.alt;
          if (alt) $(this).after('<span class="pic-title">' + alt + '</span>');
          $(this).wrap('<a href="' + this.src + '" title="' + alt + '" class="fancybox"></a>');
        });
        // $(this).find('.fancybox').each(function(){
        //   $(this).attr('rel', 'article' + i);
        // });
    });
    if($.fancybox){
        $('.fancybox').fancybox({helpers: {overlay: {locked: false}} });
    };

    //Search sidebar active
    if($('.search-form').hasClass('active')){
      switch(e.key) {
        case "Escape":
          $('.icon-remove-sign').trigger('click');
          break;
      }
    };
    $(document).keyup(function(e){
      if($('.search-form').hasClass('active')){
        $(".search-form").find('input').focus();
      }else{
        $(".search-form").find('input').blur();
      }
    });

    // Search
    var bs = {
      close: $(".icon-remove-sign"),
      searchform: $(".search-form"),
      canvas: $("body"),
      dothis: $('.dosearch')
    };

    bs.dothis.on('click', function() {
      $('.search-wrapper').toggleClass('active');
      bs.searchform.toggleClass('active');
      bs.searchform.find('input').focus();
      bs.canvas.toggleClass('search-overlay');
      $('.search-field').simpleJekyllSearch();
    });

    bs.close.on('click', function() {
      $('.search-wrapper').toggleClass('active');
      bs.searchform.toggleClass('active');
      bs.canvas.removeClass('search-overlay');
    });
});

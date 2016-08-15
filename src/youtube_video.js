LightSaber.YoutubeVideo = function (game, spec, parent) {
    console.log("LightSaber.YoutubeVideo");
    var x=0,y=0,w=200,h=150; // provisorio
    var autoplay = "autoplay=" + (spec.autoplay ? "1" : "0"); 
    var fullscreen = "allowfullscreen='" + (spec.allowfullscreen ? "true" : "false") + "'";    
    var part_1 ="<iframe frameborder='0' "+fullscreen+" style='height:100%; width:100%'src='https://www.youtube.com/embed/",
        part_2 = "?feature=oembed&amp;"+autoplay+"&amp;wmode=opaque&amp;rel=0&amp;showinfo=0&amp;modestbranding=0&amp;fs=1'></iframe>";    
    var html = part_1 + spec.videoid + part_2;            
    spec.html = html;
    LightSaber.DOM_Wrapper.call(this, game, spec, parent);
};

LightSaber.YoutubeVideo.prototype = LightSaber.utils.extend(Object.create(LightSaber.DOM_Wrapper.prototype), {
    
});
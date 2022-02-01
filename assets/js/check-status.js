var url = "https://api.minetools.eu/ping/haohansmp.ga/25565";
 
$.getJSON(url, function(r) {
 if(r.error){
    $('#rest').html('Server Offline');
   return false;
 } 
var pl = '';
 if(r.players.sample.length > 0 ){ pl = '<br><b>OP:</b> '+r.players.sample[0].name;  } 
   $('#rest').html(r.description.replace(/§(.+?)/gi, '')+'<br><b>Số người đang chơi:</b> '+r.players.online+pl);
   $('#favicon').attr('src', r.favicon);
});

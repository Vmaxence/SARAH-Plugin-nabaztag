exports.action = function(data, callback, config, SARAH){
    // On récupère la config
    var config = config.modules.Nabaztag;

    if (!config.token_api && config.token_api != 'empty'){
        console.log("La variable token_api n'est pas configuree");
        return callback({'tts' : "La variable, token_api, n'est pas configurai. "});
    }
    if (!config.adresse_mac && config.adresse_mac != 'empty'){
        console.log("La variable adresse_mac n'est pas configuree");
        return callback({'tts' : "La variable, adresse_mac, n'est pas configurai."});
    }
    
    var serveur = 'http://openjabnab.fr/ojn/FR/';
    var uriAPI  = 'api.jsp?';
    var key     = 'sn='+config.adresse_mac+'&token='+config.token_api;
    
    var url_action = serveur + uriAPI + key;
    var action     = 'empty';
    var retourXML  = 'non';

    if (data.commande) {
        switch(data.commande) {
            case "test" :        action = "&action=19"; break;
            case "dormir" :      action = "&action=14"; break;
            case "reveil" :      action = "&action=13"; break;
            case "smallReboot" : action = "&action=18"; break;
            case "Reboot" :      action = "&action=17"; break;
            case "name" :        action = '&action=10'; retourXML = 'oui'; break;
            case 'horloge' :     action = '&plugin=clock&function=get'; break;
            case 'ephemeride' :  action = '&plugin=ephemeride&function=get'; break;
            case 'meteo' :       action = '&plugin=weather&function=get'; break;
            case 'parle' :       
                if( !data.msg || data.msg=='') { action = '&tts=bonjour+petit+lapin'; }
                else { action = '&tts=' + data.msg; }
            break;

           case "oreilles" :
                if( !data.param || data.param=='') {
                    action = '&chor=0,0,motor,1,0,0,0,0,motor,0,0,0,0';
                } 
                else if( data.param == "colere" ) {
                    action = '&chor=1000, 0,led,1,255,0,0, 0,led,2,255,0,0, 0,led,3,255,0,0, 0,led,4,255,0,0, 0,led,0,255,0,0, 0,motor,1,260,0,0, 0,motor,0,260,0,0, 10,motor,0,260,0,0';
                }
                else if( data.param == "happy" ) {
                    action = '&chor=1000, 0,led,1,255,240,0, 0,led,2,255,240,0, 0,led,3,255,240,0, 0,led,4,255,240,0, 0,led,0,255,240,0, 0,motor,1,130,0,0, 0,motor,0,130,0,0, 10,motor,0,130,0,0';
                }
                else if( data.param == "question" ) {
                    action = '&chor=1000, 0,led,1,80,180,255, 0,led,2,255,240,0, 0,led,3,255,0,0, 0,led,4,80,255,100, 0,led,0,230,80,255, 0,motor,1,130,0,0, 0,motor,0,260,0,0, 10,motor,0,130,0,0';
                }
                else if( data.param == "vase" ) {
                    action = '&chor=1000, 0,led,1,80,180,255, 0,led,2,80,180,255, 0,led,3,80,180,255, 0,led,4,80,180,255, 0,led,0,80,180,255, 0,motor,1,180,0,0, 0,motor,0,180,0,0, 10,motor,0,130,0,0';
                }
            break;
        }
    }

    if( action != 'empty') {
        var urlSend = url_action + action;
        
        sendURL(urlSend, callback, function(body){
            if(retourXML=='oui') {
                var xml2js = require('xml2js');
                var parser = new xml2js.Parser({trim: true});
                
                parser.parseString(body, function (err, xml) {
                    recup = xml.rsp.rabbitName[0];
                    console.log(recup);
                    sendURL(url_action + "&tts=je m'appelle " + recup, callback, function(body){

                    });
                    return callback({'tts' : ''});
                });
            } else {
                return callback({'tts' : ''});
            } 
        });
    } else {
        return callback({'tts' : ' Erreur d\'action'});
    }
}

var sendURL = function (url, callback, cb) {
    var request = require('request');
    request( { 'uri' : url}, function (err, response, body) {
        if( err || response.statusCode != 200){
            callback({'tts' : "L'action à échoué"});
            return;
        }
        cb(body);
    });
}

/**
            ** Explications
            **/

            /**
                Le tempo est exprimé en Hz. '10' représente donc un tempo d'une seconde.

                Commander les oreilles 
                    Pour commander les oreilles, on utilise une série de valeurs séparées par des virgules.
                    Les commandes sont les suivantes :
                        Première valeur : "l'heure" de l'action, '0' si c'est la première commande
                        Deuxième valeur : 'motor', pour bouger une oreille
                        Troisième valeur : commande des oreilles :
                        '1' pour commander l'oreille gauche
                        '0' pour commander l'oreille droite
                        Quatrième valeur : angle de l'oreille, compris entre 0 et 180
                        Cinquième valeur : inutilisée, mettre à '0'
                        Sixième valeur : sens de rotation des oreilles
                        '1' : sens horaire : haut->arrière->bas->face->haut...
                        '0' : sens antihoraire : haut->face->bas->arrière->haut...
                        Exemple d'une commande qui tourne l'oreille gauche dans le sens antihoraire avec un angle de 20°, à "l'heure" 0 :
                            0,motor,1,20,0,0

                Commander les DEL
                    Pour commander les DEL, on utilise une série de valeurs séparées par des virgules.
                    Les commandes sont les suivantes :
                        Première valeur : "l'heure" de l'action, '0' si c'est la première commande
                        Deuxième valeur : 'led', pour changer la couleur d'une DEL
                        Troisième valeur : utilisée pour définir quelle DEL vous voulez illuminer :
                            '0' : DEL du dessous
                            '1' : DEL de gauche
                            '2' : DEL du milieu
                            '3' : DEL de droite
                            '4' : DEL du nez du lapin
                        Quatrième, cinquième et sixième valeurs : la couleur en RVB, les valeurs sont comprises entre 0 et 255.
                        Exemple d'une commande qui met la DEL du milieu en vert, puis qui met celle de gauche en rouge, et pour finir qui éteint celle de droite :
                            0,led,2,0,238,0,2,led,1,250,0,0,3,led,2,0,0,0
            **/
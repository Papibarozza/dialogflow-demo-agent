"require strict";
//./ngrok.exe http --region eu --log stdout 5000
require("dotenv").config();
const {fb_carousel, fb_carousel_card,fb_suggestions} = require("./lib/facebook_include.js");
const express = require("express");
const bodyParser = require("body-parser");
const { WebhookClient, Suggestion, Card,Text, Payload } = require("dialogflow-fulfillment");
const morgan = require("morgan");
const app = express();
const request = require("request");

const generateOptions = function (product_type,agent){
    const txt = `Bra val! Jag gillar också ${product_type}. `;

    switch(product_type){
    case "lakrits":
        agent.add(fb_suggestions(agent,["Chili","Jordgubb","Viol","Hallon"],txt+ "Vilken smak föredrar du?"));
        break;
    case "choklad":
        agent.add(fb_suggestions(agent,["Mörk","Ljus","Praliner"],txt+"Vilken sort vill du titta närmare på?"));
        break;
    case "karamell":
        agent.add(fb_suggestions(agent,["Salta karameller","Klubbor"],txt+`Vilken typ av ${product_type} föredrar du?`));
        break;
    default:
        console.log("ERROR: Unknown product type: "+product_type);
        agent.add("Det är något som inte stämmer. Prova att fråga igen.");

    }
};
const sendOnTyping = function(recipientID){
    
    request.post(
        "https://graph.facebook.com/v2.6/me/messages?access_token="+process.env.FB_ACCESS_TOKEN,
        { json: {
            "recipient":{
                //"id":process.env.USER_ID
                "id":recipientID
            },
            "sender_action":"typing_on"
        }},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Sucessfully posted to url");
            }
        });
};
const sendSeen = function(recipientID){
    request.post(
        "https://graph.facebook.com/v2.6/me/messages?access_token="+process.env.FB_ACCESS_TOKEN,
        { json: {
            "recipient":{
                //"id":process.env.USER_ID
                "id":recipientID
            },
            "sender_action":"mark_seen"
        }},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Sucessfully posted to url");
            }
        });
};

app.use(bodyParser.json());
app.use(morgan("combined"));
app.get("/", (req,res) => {
    res.status(200).send({text:"Server is running!"});
});
//recipientId 113813393312221
//senderID 2423083211117803
//SENTIMENT: req.body.originalDetectIntentRequest.payload.data.message.nlp.entities.sentiment
app.post("/webhook", (req,res) => {
    //console.log(req.body.originalDetectIntentRequest.payload.data);
    //Create an instance of agent
    console.log(req.body.queryResult.outputContexts);
    //console.log(req.body.originalDetectIntentRequest.payload.data.message.nlp.entities.sentiment);
    let recipientID = process.env.USER_ID;
    //console.log(req.body.originalDetectIntentRequest.payload.data);
    if(!(req.body.originalDetectIntentRequest.payload.data == undefined)){
        recipientID = req.body.originalDetectIntentRequest.payload.data.sender.id;
    }
    console.log(recipientID);
    const agent = new WebhookClient( {request: req,
        response: res});
    agent.requestSource = agent.FACEBOOK;
    let intentMap = new Map();
        
    intentMap.set("debug.reset-ctx",(agent) => {
        agent.contexts.forEach((ctx) => {
            agent.context.set({"name":ctx.name,"lifespan":0});
        });
        //REMOVE THIS LATER
        agent.add("DEVELOPER: Removed context");
    });

    intentMap.set("bot.recommendations",(agent) =>{
        const fb_payload = fb_carousel(
            [fb_carousel_card("Salta hallon",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/1/7/17-900x900.jpg",
                "Salta, mjuka lakritsbitar med god hallonfyllning",
                "https://lakritsroten.se/salta-hallon.html",
            ),
            fb_carousel_card("Peacemärke Jordgubb Salt",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/l/r/lr-20-242-575x575.png",
                "Klassiska, sega peacemärken med den fantastiska kombinationen av saltlakrits och syrlig jordgubb!",
                "https://lakritsroten.se/peace-m-rke-jordgubb-salt.html",
            ),
            fb_carousel_card("Chilikugler Vindstyrke 6",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                "Chilibollar med chili (såklart), lakrits och chokladöverdrag",
                "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
            )
            ]);
        agent.add(new Payload(agent.FACEBOOK,[new Text("Ja men absolut!"),
            new Text("Jag sammanställde denna lista åt dig baserat på vad andra verkar tycka är bra."),fb_payload]));
    
        //agent.setFollowupEvent("recommendation-carousel-request-event");
    });

    
    intentMap.set("bot.taste-categories-query",(agent) => {
        let product_type = "";
        if(agent.context.get("product_preference_ctx") != undefined){
            product_type = agent.context.get("product_preference_ctx").parameters.product_type;
        }else{
            agent.add("Okej!");//Unneccesary because this is never run, but it is needed.
            agent.setFollowupEvent("product_type_choice_event");
        }
       
        //If it has not been set, no one has chosen a product type so we need to ask for it
        if(product_type === "" || product_type === undefined){
            agent.add("Okej!"); //Unneccesary because this is never run, but it is needed.
            agent.setFollowupEvent("product_type_choice_event");
        }else{
            switch(product_type){
            case "lakrits":
                agent.add(fb_suggestions(agent,["Chili","Jordgubb","Viol","Hallon"],"Detta är vad vi har att erbjuda i vårat lakritssortiment"));
                break;
            case "choklad":
                agent.add(fb_suggestions(agent,["Mörk","Ljus","Praliner"],"Detta är vad vi har att erbjuda i vårat chokladsortiment"));
                break;
            case "karamell":
                agent.add(fb_suggestions(agent,["Salta karameller","Klubbor"],"Detta är vad vi har att erbjuda i vårat karamellsortiment"));
                break;
            default:
                console.log("ERROR: Unknown product type: "+product_type);
                agent.add("Det är något som inte stämmer. Prova att fråga igen.");

            }
        }
    });
    

    intentMap.set("bot.pick_product_type", (agent) =>{
        //console.log(agent.contexts)
        //console.log(agent.contexts[0].parameters.product_type)
        const params= agent.context.get("product_preference_ctx").parameters;
        const product_type = params.product_type;
        const product_type_original = params["product_type.original"];
        if(product_type === undefined){
            console.error("UNDEFINED PRODUCT TYPE OR NOT FOUND");  
        }else{
            agent.add(`Härligt! Jag gillar också ${product_type_original}. Vilken smak föredrar du?`);
            generateOptions(product_type,agent);
            agent.context.set({
                "name":`${product_type}-flavor-pick`,
                "lifespan": 5,
                "parameters":{
                    "product_type":product_type
                }
            });

        }
    });
    intentMap.set("bot.choose_flavor_caramel", (agent) => { 
        const fb_payload = fb_carousel(
            [fb_carousel_card("Karamell Blandpåse",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/l/r/lr-20-524-575x575.png",
                "Blandade sorter av salta hårdingar i en och samma påse. Hårda favoriter med eller utan fyllning som räcker länge",
                "https://lakritsroten.se/karamell-blandp-se.html",
            ),
            fb_carousel_card("Blåbärssalta Kameleonter",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/b/l/bluebnr-kameloenter-575x575.png",
                "Pulverfyllda salta kameleonter med smak utav blåbär.",
                "https://lakritsroten.se/bl-b-rssalta-kameleonter.html",
            ),
            fb_carousel_card("Tomteklubba Saltlakrits",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/l/r/lr-20-545-575x575.png",
                "Klassisk lakritsklubba med tydlig saltlakritssmak",
                "https://lakritsroten.se/tomteklubba-saltlakrits.html",
            )
            ]);

        const payload = new Payload(agent.FACEBOOK,[
            new Text("Bra smak! Jag ska se vad vi kan hitta..."),
            new Text("Detta kanske kunde vara något för dig 🍭"),
            fb_payload
        ]);

        agent.add(payload);
    });
    intentMap.set("bot.choose_flavor_chocolate", (agent) => { 
        const fb_payload = fb_carousel(
            [fb_carousel_card("Malmöbar Ekologisk Mörk Choklad",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/d/u/dubbellakrits-575x575.png",
                "Chokladbar gjord på 70% mörk choklad med en mild underton av lakrits. En chokladkak perfekt för dig som älskar mörk kvalitetschoklad! Tillverkad av Malmö Chokladfabrik i en fabrik som är garanterat fri från nötter, soja, ägg och gluten.",
                "https://lakritsroten.se/malm-bar-ekologisk-m-rk-choklad.html",
            ),
            fb_carousel_card("Ljust Salmiakbräck",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/5/1/51-575x575.jpg",
                "Mycket hantverk ligger bakom denna favorit. Choklad och lakrits – den perfekta kombinationen.",
                "https://lakritsroten.se/ljust-salmiakbr-ck.html",
            ),
            fb_carousel_card("Goodio Licorice Sea Buckthorn",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/b/e/beriksson-575x575.png",
                "Underbar handgjord & ekologisk chokladkaka smaksatt med lakrits & havtorn. Vegansk!",
                "https://lakritsroten.se/goodio-licorice-sea-buckthorn.html",
            )
            ]);

        const payload = new Payload(agent.FACEBOOK,[
            new Text("Bra smak! Jag ska se vad vi kan hitta..."),
            new Text("Detta kanske kunde vara något för dig 🍫"),
            fb_payload
        ]);

        agent.add(payload);
    });
    intentMap.set("bot.choose_flavor_licorice", (agent) => {
        //Required line, don't know why it is not populated when agent is created (WebhookClient)
     
        const fb_payload = fb_carousel(
            [fb_carousel_card("Salta hallon",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/1/7/17-900x900.jpg",
                "Salta, mjuka lakritsbitar med god hallonfyllning",
                "https://lakritsroten.se/salta-hallon.html",
            ),
            fb_carousel_card("Peacemärke Jordgubb Salt",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/l/r/lr-20-242-575x575.png",
                "Klassiska, sega peacemärken med den fantastiska kombinationen av saltlakrits och syrlig jordgubb!",
                "https://lakritsroten.se/peace-m-rke-jordgubb-salt.html",
            ),
            fb_carousel_card("Chilikugler Vindstyrke 6",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                "Chilibollar med chili (såklart), lakrits och chokladöverdrag",
                "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
            )
            ]);
        const payload = new Payload(agent.FACEBOOK,[
            new Text("Bra smak! Jag ska se vad vi kan hitta..."),
            new Text("Detta kanske kunde vara något för dig (y)"),
            fb_payload
        ]);

        agent.add(payload);
    });
    if(process.env.DEBUG === "FALSE"){
        sendSeen(recipientID);
        setTimeout(function(){
            sendOnTyping(recipientID);
        },1000);
    
        setTimeout(function(){
            agent.handleRequest(intentMap);
        },1500);
    }else{
        agent.handleRequest(intentMap);
    }
    //agent.handleRequest(intentMap);
    //agent.handleRequest(intentMap);
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
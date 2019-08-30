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
    console.log(req.body.originalDetectIntentRequest.payload.data.message.nlp.entities.sentiment);
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
            fb_carousel_card("Chilikugler Vindstyrke 6",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                "Chilibollar med chili (såklart), lakrits och chokladöverdrag",
                "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
            ),
            fb_carousel_card("Chilikugler Vindstyrke 6",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                "Chilibollar med chili (såklart), lakrits och chokladöverdrag",
                "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
            )
            ]);
        request.post(
            "https://graph.facebook.com/v2.6/me/messages?access_token="+process.env.FB_ACCESS_TOKEN,
            { json: {
                "recipient":{
                    "id":process.env.USER_ID
                },
                "sender_action":"typing_on"
            }},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("Sucessfully posted to url");
                }
            });
        agent.add(new Payload(agent.FACEBOOK,[new Text("Ja men absolut!"),
            new Text("Jag sammanställde denna lista åt dig baserat på vad andra verkar tycka är bra."),
            fb_payload]));
    });

    
    intentMap.set("bot.taste-categories-query",(agent) => {
        let product_type = "";
        const text = "Detta är vad vi kan erbjuda";
        if(agent.context.get("product_preference_ctx").parameters != undefined){
            product_type = agent.context.get("product_preference_ctx").parameters.product_type;
        }else{
            let options = ["Saltlakrits","Kola","Choklad"];
            agent.add(fb_suggestions(agent,options,text));
            return;
        }
       
        //If it has not been set, no one has chosen a product type so we need to ask for it
        if(product_type === "" || product_type === undefined){
            let options = ["Saltlakrits","Kola"];
            agent.add(fb_suggestions(agent,options,text));
        }else{
            switch(product_type){
            case "saltlakrits":
                agent.add(fb_suggestions(agent,["Chili","Jordgubb","Viol","Hallon"],"Detta är vad vi har att erbjuda i vårat saltlakritssortiment"));
                break;
            case "choklad":
                agent.add(fb_suggestions(agent,["Mörk","Ljus","Praliner"],"Detta är vad vi har att erbjuda i vårat chokladsortiment"));
                break;
            case "karamell":
                agent.add(fb_suggestions(agent,["Salta","Klubbor"],"Detta är vad vi har att erbjuda i vårat karamellsortiment"));
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
            agent.context.set({
                "name":`${product_type}-flavor-pick`,
                "lifespan": 5,
                "parameters":{
                    "product_type":product_type
                }
            });

        }
    });
    intentMap.set("bot.choose_flavor_licorice", (agent) => {
        //Required line, don't know why it is not populated when agent is created (WebhookClient)
     
        const fb_payload = fb_carousel(
            [fb_carousel_card("Salta hallon",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/1/7/17-900x900.jpg",
                "Salta, mjuka lakritsbitar med god hallonfyllning",
                "https://lakritsroten.se/salta-hallon.html",
            ),
            fb_carousel_card("Chilikugler Vindstyrke 6",
                "https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                "Chilibollar med chili (såklart), lakrits och chokladöverdrag",
                "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
            ),
            ]);

        const payload = new Payload(agent.FACEBOOK,[
            new Text("Bra smak! Jag ska se vad vi kan hitta..."),
            new Text("Detta kanske kunde vara något för dig"),
            fb_payload
        ]);

        agent.add(payload);
    });

    agent.handleRequest(intentMap);
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
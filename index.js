"require strict";
//./ngrok.exe http --region eu --log stdout 5000
const {fb_carousel, fb_carousel_card} = require("./lib/facebook_include.js");
const express = require("express");
const bodyParser = require("body-parser");
const { WebhookClient, Suggestion, Card,Text, Payload } = require("dialogflow-fulfillment");
const morgan = require("morgan");
const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));
app.get("/", (req,res) => {
    res.status(200).send({text:"Hej ninni cutie"});
});

app.post("/webhook", (req,res) => {
    //console.log(req.body.originalDetectIntentRequest.payload.data);
    //Create an instance of agent
    //console.log(req);
    const agent = new WebhookClient( {request: req,
        response: res});
    let intentMap = new Map();
    intentMap.set("bot.pick_product_type", (agent) =>{
        //console.log(agent.contexts)
        //console.log(agent.contexts[0].parameters.product_type)
        const params = agent.contexts[0].parameters;
        const product_type = params.product_type;
        const product_type_original = params["product_type.original"];
        if(product_type === undefined){
            console.error("UNDEFINED PRODUCT TYPE OR NOT FOUND");  
        }else{
            agent.add(`Härligt! Jag gillar också ${product_type_original}. Vilken smak föredrar du?`);
            agent.context.set({
                "name":`${product_type}-flavor-pick`,
                "lifespan": 5,
            });
        }
    });
    intentMap.set("bot.choose_flavor_licorice", (agent) => {
        //Required line, don't know why it is not populated when agent is created (WebhookClient)
        agent.requestSource = agent.FACEBOOK;
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
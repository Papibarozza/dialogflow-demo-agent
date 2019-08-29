'require strict'
//./ngrok.exe http --region eu --log stdout 5000
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient, Suggestion, Card,Text, Payload } = require('dialogflow-fulfillment');
const morgan = require('morgan');
const app = express();
app.use(bodyParser.json());
app.use(morgan('combined'));
app.get('/', (req,res) => {
 res.status(200).send({text:'Hej ninni cutie'});
});

app.post('/webhook', (req,res) => {
    //console.log(req.body.originalDetectIntentRequest.payload.data);
    //Create an instance of agent
    //console.log(req);
    const agent = new WebhookClient( {request: req,
        response: res});
    let intentMap = new Map();
    intentMap.set('bot.pick_product_type', (agent) =>{
        //console.log(agent.contexts)
        //console.log(agent.contexts[0].parameters.product_type)
        const params = agent.contexts[0].parameters;
        const product_type = params.product_type;
        const product_type_original = params['product_type.original'];
        if(product_type === undefined){
            console.error("UNDEFINED PRODUCT TYPE OR NOT FOUND");  
        }else{
            agent.add(`Härligt! Jag gillar också ${product_type_original}. Vilken smak föredrar du?`);
            agent.context.set({
                'name':`${product_type}-flavor-pick`,
                'lifespan': 5,
              });
        }
    })
    intentMap.set('bot.choose_flavor_licorice', (agent) => {
    //agent.add('Okej, då ska vi se..');
    //agent.add('Dessa är populära och borde falla dig i smaken.');
  
    const fb_payload = {
            "attachment": {
            "type":"template",
            "payload":{
                "template_type": "generic",
            "elements":[
                  {
               "title":"SALTA HALLON",
               "image_url":"https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/1/7/17-900x900.jpg",
               "subtitle":"Salta, mjuka lakritsbitar med god hallonfyllning!",
               "default_action": {
                 "type": "web_url",
                 "url": "https://lakritsroten.se/salta-hallon.html",
                 "webview_height_ratio": "full"
               }
               },
                    {
               "title":"Chilikugler Vindstyrke 6",                           	"image_url":"https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
               "subtitle":"Chilibollar med chili (såklart), lakrits och chokladöverdrag.",
               "default_action": {
                 "type": "web_url",
                 "url": "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
                 "webview_height_ratio": "full"
               }
               }
         ]
        }
       }
    }
    agent.requestSource = agent.FACEBOOK;
    console.log(agent.FACEBOOK);
    //const payload = new Payload(agent.FACEBOOK,fb_payload);
    const payload = new Payload(agent.FACEBOOK,[new Text('Bra smak! Jag ska se vad vi kan hitta...'),
    new Text('Detta kanske kunde vara något för dig'),fb_payload]);
    //agent.add(new Text('Detta är gott'));
    agent.add(payload);

    /*
    agent.add(
        {
            "facebook": {
              "attachment": {
                "type": "template",
                "payload": {
                   "template_type":"generic",
                   "elements":[
                         {
                      "title":"Salta hallon",                           	"image_url":"https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/1/7/17-900x900.jpg",
                      "subtitle":"Salta, mjuka lakritsbitar med god hallonfyllning!",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://lakritsroten.se/salta-hallon.html",
                        "webview_height_ratio": "full"
                      }
                      },
                           {
                      "title":"Chilikugler Vindstyrke 6",                           	"image_url":"https://lakritsroten.se/pub/media/catalog/product/cache/image/700x700/e9c3970ab036de70892d86c6d221abfe/c/h/chili-kugler-rod-1-575x575.png",
                      "subtitle":"Chilibollar med chili (såklart), lakrits och chokladöverdrag.",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://lakritsroten.se/chilikugler-vindstyrke-6.html",
                        "webview_height_ratio": "full"
                      }
                      }
                     
                  
                ]
              }
            }
          }
            }
        
    );
    */
    });

agent.handleRequest(intentMap);
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});
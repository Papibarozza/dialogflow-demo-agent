"require strict";
const {Payload,Suggestion} = require("dialogflow-fulfillment");

function fb_carousel_card(title,image_url,subtitle,url,webview_height_ratio="full"){
    return {
        "title":title,
        "image_url":image_url,
        "subtitle":subtitle,
        "default_action": {
            "type": "web_url",
            "url": url,
            "webview_height_ratio": webview_height_ratio
        }
    };
}

function fb_carousel(cards){
    const fb_payload = {"attachment": {
        "type":"template",
        "payload":{
            "template_type": "generic",
            "elements":[
            ]
        }
    }
    };
    cards.forEach((element,i) => {
        fb_payload.attachment.payload.elements[i] = element;
    });
    return fb_payload;
}
function fb_suggestions(agent,options,text){
    options.map(option => agent.add(new Suggestion(option)));
    let payload = new Payload(agent.FACEBOOK, {
        text: text,
        quick_replies: options
            .slice(0, 5)
            .map(option => {
                return {
                    content_type:"text",
                    title: option,
                    payload: option
                };
            })
    });
    return payload;
}

module.exports = {fb_carousel,fb_carousel_card,fb_suggestions};
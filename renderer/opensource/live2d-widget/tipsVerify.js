const { exception } = require('console');

if(!fs){
    var fs=require('fs');
}
// VERIFY function 检测Tips台本是否兼容 @Akazure
function isTipsCompatible(waifuTips){
    // sub helper functions @Akazure
    function verifyMessage(text){
        return true;
    }

    function verifyAudio(text){
        if (text.audio!=null){

        }
        return true;
    }

    function isTipsCompatibleWelcome(){
        let text,au;
        for(now=0;now<24;++now){
            for(let i of welcomeTips){
                if((i.hasRange && now >= i.start && now<=i.end)|| !i.hasRange){
                    text=randomSelection(i.text);
                    if (verifyMessage(text) && verifyAudio(text)) break;
                    else throw(exception(`Welcom Messages of current Tips is not compatible with the system: ${text}`));
                }
            }
        }
    }

    try {
        
        return true;
    } catch (error) {
        return false;
    }
}
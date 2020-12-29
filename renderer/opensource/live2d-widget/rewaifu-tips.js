if(!fs){
    var fs=require('fs');
}
var l2d={
    modelList:null,
    currentModelId:null,
    currentModelName:null,
    currentModelTextureId:null,
    currentWaifuTips:null,
    AUDIO_VOLUME:0.3,
    messageTimer:null,
    programPath:null,
    interactEvent:null
};
var AUDIO_VOLUME=0.3;
var messageTimer;

// MAIN function @Akazure
function initWidget(programPath) {
    const toggle=docCreateSpan();
	if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
		toggle.setAttribute("first-time", true);
		setTimeout(() => {
			toggle.classList.add("waifu-toggle-active");
		}, 0);
	} else {
		loadWidget(programPath);
	}
}

// MAIN helper function 加载model和message @Akazure
function loadWidget(programPath){
    let cdnPath=programPath,useCDN=false;
    if (typeof cdnPath === "string") {
        useCDN=true;
        if (!cdnPath.endsWith("/")) cdnPath += "/";
    } else {
        console.log(`loadWidget has received the wrong argument (programPath)=${programPath}`);
        return;
    }
    l2d.programPath=cdnPath;
    localStorage.removeItem("waifu-display");
    sessionStorage.removeItem("waifu-text");
    localStorage.removeItem("waifu-display");
	sessionStorage.removeItem("waifu-text");
	docCreateCanvas();
	//PC版bottom设置有待核实，考虑任务栏宽度 @Akazure
    initModel();
}

// MAIN helper function 获取model list @Akazure
async function loadModelList(cdnPath) {
    console.log(`model list path: ${cdnPath}assets/model/model_list.json`)
    const response = await fetch(`${cdnPath}assets/model/model_list.json`);
    modelList = await response.json();
    l2d.modelList=modelList;
}

// MODEL main function @Akazure
async function initModel() {
    let modelId = l2d.currentModelId,
        modelTexturesId = l2d.currentModelTextureId,
        cdnPath=l2d.programPath;
    // 首次访问加载 指定模型 的 指定材质
    if (modelId === null) {
        modelId = 0; // 模型 ID
        modelTexturesId = 0; // 材质 ID
    }
    await loadModel(modelId,modelTexturesId,cdnPath)
    var modelNmae=l2d.currentModelName;
    console.log('model name: ',modelName);
    await loadTips(cdnPath,modelName);
    var waifuTips=l2d.currentWaifuTips;
    welcomeMessage(modelName,cdnPath,waifuTips.welcomeMessage);
    //加载tips
    l2dAddEvents(modelName,waifuTips,cdnPath);
    windowAddEvents(waifuTips);
}

// MODEL 更换model @Akazure
async function loadOtherModel(){
    l2d.currentModelId=(l2d.currentModelId+1)%l2d.modelList.models.length;
    l2d.currentModelTextureId=0;
    initModel();
}

// MODEL helper function 根据modelId和modelTexturesId加载指定模型 @Akazure
async function loadModel(modelId, modelTexturesId,cdnPath) {
    if(l2d.modelList==null) await loadModelList(cdnPath);
    l2d.currentModelId=modelId; l2d.currentModelTextureId=modelTexturesId;
    //选择模型
    modelName=l2d.modelList.models[modelId];
    l2d.currentModelName=modelName;
    const target = randomSelection(modelList.models[modelId]);
    const modelPath=`${cdnPath}assets/model/${target}/`;
    //加载live2d模型
    if(fs.existsSync(modelPath+'index.json')) loadlive2d("live2d", modelPath+'index.json');
    else if(fs.existsSync(modelPath+'model.json')) loadlive2d("live2d", modelPath+'model.json');
    else {
        console.log(`${modelPath}目录下未找到index.json或model.json`)
        return;
    }
    console.log(`Live2D 模型 ${modelName} (id=${modelId}-texturesId=${modelTexturesId}) 加载完成`);
}


// MESSAGE helper function 根据modelId加载指定台本 @Akazure
async function loadTips(cdnPath,modelName){
    const tipsPath=getTipsPath(cdnPath,modelName);
    const waifuTips=await fetch(tipsPath).then(response => response.json());
    l2d.currentWaifuTips=waifuTips;
}

// MESSAGE helper function 添加闲置重新激活事件 @Akazure
function windowAddEvents(waifuTips){
    // 检测用户活动状态，并在空闲时显示消息
	let userAction = false,
        userActionTimer,
        messageArray = waifuTips.wakeup.text;
    window.addEventListener("mousemove", () => userAction = true);
    window.addEventListener("keydown", () => userAction = true);
    //mousemove和keydown时，更新message @Akazure
    setInterval(() => {
        if (userAction) {
            userAction = false;
            clearInterval(userActionTimer);
            userActionTimer = null;
        } else if (!userActionTimer) {
            userActionTimer = setInterval(() => {
                let chosed=randomSelection(messageArray);
                console.log(chosed);
                showMessage(chosed.message, 6000, 9);
            }, 20000);
        }
    }, 1000);
}

// MESSAGE helper function 给live2d添加互动事件 @Akazure
function l2dAddEvents(modelName,waifuTips,cdnPath){
    //除去之前的监听器
    window.removeEventListener("mouseover",l2d.interactEvent);
    window.removeEventListener("click",l2d.interactEvent);
    l2d.interactEvent=(event) => {
            if (sessionStorage.getItem('waifu-audio')) return;
            for (let { selector, text } of (event.type=="mouseover"?waifuTips.mouseover:waifuTips.click)) {
                if (!event.target.matches(selector)) continue; // 这里会判断tips和发生事件的对象是否匹配
                selected = randomSelection(text);
                console.log("selected",selected);
                text=selected.message,
                    au=selected.audio?`${cdnPath}assets/model/${modelName}/audio/${selected.audio}`:null;
                text = text.replace("{text}", event.target.innerText);
                showMessage(text, 4000, 8,au);
                return;
            }
        };
    // 在tips文件中应该设定每个互动台词对应的"selector"。
    window.addEventListener("mouseover",l2d.interactEvent);
    window.addEventListener("click",l2d.interactEvent);
}

// MESSAGE helper function 决定[使用自定义tips]或[默认tips] @Akazure
function getTipsPath(cdnPath,modelName){
    const tipsPath=`${cdnPath}/assets/model/${modelName}/tips.json`;
    return fs.existsSync(tipsPath) ? tipsPath : `${cdnPath}/assets/model/waifu-tips.json`; 
}

// MESSAGE helper function 气泡窗 @Akazure
function showMessage(text, timeout, priority,au=null) {
    // 如果已经有message了，就直接返回
    if (!isReadyForNewMessage(text,priority)) return;
    //如果有音频，播放音频 @Akazure
    console.log("showmessage",text);
    if(au && !sessionStorage.getItem("waifu-audio")){
        let createdAudio=createAudio(au);
        // 当音频元数据（特指duration长度）加载好后，与默认timeout比较，将timeout设置成更大的那个 @Akazure
        createdAudio.addEventListener('loadedmetadata',(event)=>{
            timeout=(timeout>au.duration*1000)? timeout:createdAudio.duration*1000;
            setTips(text,timeout,priority);
        })
        createdAudio.play()
    }
    else{
        setTips(text,timeout,priority);
    }
}

// MESSAGE helper function 前序处理，判断是否继续创建气泡窗 @Akazure
function isReadyForNewMessage(text,priority){
    if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return false;
    if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
    }
    return true;
}

// MESSAGE helper fucntion 根据时限和文本创建气泡窗对象 @Akazure
function setTips(text,timeout,priority){
    text = randomSelection(text);
    sessionStorage.setItem("waifu-text", priority);
    const tips = document.getElementById("waifu-tips");
    tips.style.animation="shake 50s ease-in-out "+(timeout/1000)+"s infinite"
    tips.classList.add("waifu-tips-active");
    tips.innerHTML = text;
    messageTimer = setTimeout(
        () => {
            sessionStorage.removeItem("waifu-text");
            tips.classList.remove("waifu-tips-active");
        },
        timeout);
}

// MESSAGE helper function 播放文本对应音频 @Akazure
function createAudio(auPath){
    console.log(auPath);
    au=new Audio(auPath);
    au.volume=AUDIO_VOLUME;
    sessionStorage.setItem("waifu-audio",au);
    // 只有当前播放的音频结束后才能 @Akazure
    au.addEventListener('ended',(event)=>{
        sessionStorage.removeItem("waifu-audio",au)
    })
    return au;
}

//MESSAGE helper function 显示欢迎词 @Akazure
function welcomeMessage(modelName,cdnPath,welcomeTips) {
    console.log(welcomeTips);
    let text,au;
    const now = new Date().getHours();
    for(let i of welcomeTips){
        if((i.hasRange && now >= i.start && now<=i.end)|| !i.hasRange){
            text=randomSelection(i.text);
            showMessage(text.message,7000,8,`${cdnPath}assets/model/${modelName}/audio/${text.audio}`)
            return;
        }
    }
};

// DOC helper function 添加 waifu-toggle @Akazure
// 回传toggle元素，如果有内存考量，可以不回传，只需要重新查找这个toggle元素就行了
function docCreateSpan(){
    document.querySelector("#app").insertAdjacentHTML("beforeend", 
        `<div id="waifu-toggle">
            <span>看板娘</span>
        </div>`);
    const toggle = document.getElementById("waifu-toggle");
    toggle.addEventListener("click", () => {
        toggle.classList.remove("waifu-toggle-active");
        if (toggle.getAttribute("first-time")) {
            loadWidget(config);
            toggle.removeAttribute("first-time");
        } else {
            localStorage.removeItem("waifu-display");
            document.getElementById("waifu").style.display = "";
            setTimeout(() => {
                document.getElementById("waifu").style.bottom = 0;
            }, 0);
        }
    });
    return toggle;
}

//DOC helper function 添加live2d <canvas> @Akazure
function docCreateCanvas(){
	// live2d整体 @Akazure
	document.querySelector('#app').insertAdjacentHTML("beforeend", 
		`<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="500" height="500"></canvas>
		</div>`);
	// https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
	setTimeout(() => {
		document.getElementById("waifu").style.bottom = 0;
	}, 0);
}


// GENERAL helper function 简化随机抽取 @Akazure
function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
}



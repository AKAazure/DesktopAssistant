/*
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */

function loadWidget(config) {
	let {apiPath, cdnPath} = config;
	let useCDN = false, modelList;
	var modelName='';
	if (typeof cdnPath === "string") {
		useCDN = true;
		if (!cdnPath.endsWith("/")) cdnPath += "/";
	} else if (typeof apiPath === "string") {
		if (!apiPath.endsWith("/")) apiPath += "/";
	} else {
		console.error("Invalid initWidget argument!");
		return;
	}

	
	localStorage.removeItem("waifu-display");
	sessionStorage.removeItem("waifu-text");
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
	//PC版bottom设置有待核实，考虑任务栏宽度 @Akazure

	//用于随机的helper function @Akazure
	function randomSelection(obj) {
		return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
	}
	// 检测用户活动状态，并在空闲时显示消息
	let userAction = false,
		userActionTimer,
		messageTimer,
		messageArray = [ "对一下口令，指挥官？", "关于我的小队，想了解什么？", "欢迎回来，指挥官。"];
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
				showMessage(randomSelection(messageArray), 6000, 9);
			}, 20000);
		}
	}, 1000);


	function welcomeMessage() {
		let text,au;
		const now = new Date().getHours();
		if (now > 5 && now <= 13) text = "早上好，如果没有别的事，我先回去工作了。",au=modelName+"/2.mp3";
		else text = "我回来了，指挥官，这是给你带的伴手礼。",au=modelName+"/17.mp3";
		showMessage(text, 7000, 8,au);
	};

	//气泡窗 @Akazure
	function showMessage(text, timeout, priority,au=null) {
		if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
		if (messageTimer) {
			clearTimeout(messageTimer);
			messageTimer = null;
		}
		const set_tips=(timeout)=>{
			text = randomSelection(text);
			sessionStorage.setItem("waifu-text", priority);
			const tips = document.getElementById("waifu-tips");
			tips.style.animation="shake 50s ease-in-out "+(timeout/1000)+"s infinite"
			tips.innerHTML = text;
			tips.classList.add("waifu-tips-active");
			messageTimer = setTimeout(() => {
				sessionStorage.removeItem("waifu-text");
				tips.classList.remove("waifu-tips-active");
			}, timeout);}
		//如果有音频，播放音频 @Akazure
		if(au && !sessionStorage.getItem("waifu-audio")){
			console.log("./renderer/live2d-widget/audio/"+au);
			au=new Audio("./assets/model/m4a1-mod3/audio/"+au);
			au.volume=0.3;
			sessionStorage.setItem("waifu-audio",au);
			// 只有当前播放的音频结束后才能 @Akazure
			au.addEventListener('ended',(event)=>{
				sessionStorage.removeItem("waifu-audio",au)
			})
			// 当音频元数据（特指duration长度）加载好后，与默认timeout比较，将timeout设置成更大的那个 @Akazure
			au.addEventListener('loadedmetadata',(event)=>{
				console.log(au.duration);
				timeout=(timeout>au.duration*1000)? timeout:au.duration*1000;
				set_tips(timeout);
			})
			au.play()
		}
		else{
			set_tips(timeout);
		}
	}

	(async function initModel() {
		let modelId = localStorage.getItem("modelId"),
			modelTexturesId = localStorage.getItem("modelTexturesId");
		// 首次访问加载 指定模型 的 指定材质
		if (modelId === null) {
			modelId = 0; // 模型 ID
			modelTexturesId = 0; // 材质 ID
		}
		await loadModelList();
		modelName=modelList[modelId]
		loadModel(modelId,modelTexturesId)
		var selected=null,au=null;
		console.log('model name: ',modelName);
		fetch(`${cdnPath}/assets/model/${modelName}/tips.json`)
			.then(response => response.json())
			.then(result => {
				window.addEventListener("mouseover", event => {
					if (sessionStorage.getItem('waifu-audio')) return;
					for (let { selector, text } of result.mouseover) {
						if (!event.target.matches(selector)) continue;
						selected = randomSelection(text);
						text=selected.message,au=modelName+'/'+selected.audio;
						text = text.replace("{text}", event.target.innerText);
						showMessage(text, 4000, 8,au);
						return;
					}
				});
				window.addEventListener("click", event => {
					if (sessionStorage.getItem('waifu-audio')) return;
					for (let { selector, text } of result.click) {
						if (!event.target.matches(selector)) continue;
						selected = randomSelection(text);
						text=selected.message,au=modelName+'/'+selected.audio;
						text = text.replace("{text}", event.target.innerText);
						showMessage(text, 4000, 8,au);
						return;
					}
				});
			});
	})();

	async function loadModelList() {
		const response = await fetch(`${cdnPath}assets/model/model_list.json`);
		modelList = await response.json();
	}

	async function loadModel(modelId, modelTexturesId, message=null) {
		localStorage.setItem("modelId", modelId);
		localStorage.setItem("modelTexturesId", modelTexturesId);
		if (useCDN) {
			if (!modelList) await loadModelList();
			//选择模型
			modelName=modelList.models[modelId];
			const target = randomSelection(modelList.models[modelId]);
			const modelPath=`${cdnPath}assets/model/${target}/`;
			//加载live2d模型
			loadlive2d("live2d", modelPath+'index.json');
			console.log(target,modelId,modelList.models)
			//加载tips
			fetch(modelPath+'tips.json')
		} else {
			loadlive2d("live2d", `${apiPath}get/?id=${modelId}-${modelTexturesId}`);
			console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);
		}
		message ? showMessage(message, 4000, 10):welcomeMessage();
	}

	// async function loadRandModel() {
	// 	const modelId = localStorage.getItem("modelId"),
	// 		modelTexturesId = localStorage.getItem("modelTexturesId");
	// 	if (useCDN) {
	// 		if (!modelList) await loadModelList();
	// 		const target = randomSelection(modelList.models[modelId]);
	// 		loadlive2d("live2d", `${cdnPath}model/${target}/index.json`);
	// 		showMessage("我的新衣服好看嘛？", 4000, 10);
	// 	} else {
	// 		// 可选 "rand"(随机), "switch"(顺序)
	// 		fetch(`${apiPath}rand_textures/?id=${modelId}-${modelTexturesId}`)
	// 			.then(response => response.json())
	// 			.then(result => {
	// 				if (result.textures.id === 1 && (modelTexturesId === 1 || modelTexturesId === 0)) showMessage("我还没有其他衣服呢！", 4000, 10);
	// 				else loadModel(modelId, result.textures.id, "我的新衣服好看嘛？");
	// 			});
	// 	}
	// }

	// async function loadOtherModel() {
	// 	let modelId = localStorage.getItem("modelId");
	// 	if (useCDN) {
	// 		if (!modelList) await loadModelList();
	// 		const index = (++modelId >= modelList.models.length) ? 0 : modelId;
	// 		loadModel(index, 0, modelList.messages[index]);
	// 	} else {
	// 		fetch(`${apiPath}switch/?id=${modelId}`)
	// 			.then(response => response.json())
	// 			.then(result => {
	// 				loadModel(result.model.id, 0, result.model.message);
	// 			});
	// 	}
	// }
}

function initWidget(config, apiPath) {
	if (typeof config === "string") {
		config = {
			waifuPath: config,
			apiPath
		};
	}
	document.querySelector("#app").insertAdjacentHTML("beforeend", `<div id="waifu-toggle">
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
	if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
		toggle.setAttribute("first-time", true);
		setTimeout(() => {
			toggle.classList.add("waifu-toggle-active");
		}, 0);
	} else {
		loadWidget(config);
	}
}
